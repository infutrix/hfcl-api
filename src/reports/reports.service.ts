import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRoleIdentifier } from '../users/user-role.constants';
import { BatchCableProfile } from '../batches/entities/batch-cable-profile.entity';
import { BatchFiberTesting, FiberWavelengthReading } from '../batches/entities/batch-fiber-testing.entity';
import { CableProfileWavelengthConfig } from '../cable-profiles/entities/cable-profile-wavelength-config.entity';
import { batchCableProfileDetailRelations } from '../batches/batch-cable-profile.relations';
import {
    buildWavelengthLimits,
    evaluateFiber,
    WavelengthLimit,
} from '../batches/wavelength-range.util';
import { BatchReportQueryDto, LiveReportQueryDto, ReportRangeQueryDto } from './dto/report-query.dto';
import {
    bucketKeys,
    bucketSql,
    previousRange,
    resolveRange,
    ResolvedRange,
    toLocalSqlDateTime,
} from './report-range.util';

type SqlParam = string | number;
type RawRow = Record<string, unknown>;

interface EventFilter {
    range: Pick<ResolvedRange, 'from' | 'toExclusive'>;
    plantId: number | null;
    operatorId?: number | null;
    cableProfileId?: number | null;
}

export interface SessionStats {
    total_fibers: number;
    tested_fibers: number;
    pending_fibers: number;
    pass_fibers: number;
    fail_fibers: number;
    no_limit_fibers: number;
    retested_fibers: number;
    out_of_range_readings: number;
    progress_pct: number;
    pass_rate: number | null;
    failing_wavelengths: { wavelength_nm: number; fibers: number }[];
}

const EVENT_FROM = `FROM fiber_test_events e
    LEFT JOIN batch_cable_profiles bcp ON bcp.id = e.batch_cable_profile_id`;

const RESULT_COUNTS = `COUNT(*) AS tests,
    COALESCE(SUM(e.result = 'PASS'), 0) AS pass,
    COALESCE(SUM(e.result = 'FAIL'), 0) AS fail,
    COALESCE(SUM(e.result = 'NO_LIMIT'), 0) AS no_limit,
    COALESCE(SUM(e.result = 'NO_READING'), 0) AS no_reading,
    COALESCE(SUM(e.attempt > 1), 0) AS retests`;

const SESSION_SELECT = `bcp.id, bcp.batch_name, bcp.drum_number, bcp.fiber_type, bcp.status,
    bcp.created_at, bcp.modified_at, bcp.cable_profile_id, bcp.otdr_length_km,
    b.batch_name AS batch, cp.name AS cable_profile_name, ct.name AS cable_type_name,
    c.name AS customer_name, p.plant_name, s.name AS sfg_stage_name,
    op.first_name AS operator_first_name, op.last_name AS operator_last_name,
    od.device_name AS otdr_device_name`;

const SESSION_JOINS = `LEFT JOIN batches b ON b.id = bcp.batch_id
    LEFT JOIN cable_profiles cp ON cp.id = bcp.cable_profile_id
    LEFT JOIN cable_types ct ON ct.id = bcp.cable_type_id
    LEFT JOIN customers c ON c.id = bcp.customer_id
    LEFT JOIN plants p ON p.id = bcp.plant_id
    LEFT JOIN sfg_stages s ON s.id = bcp.sfg_stage_id
    LEFT JOIN users op ON op.id = bcp.operator_id
    LEFT JOIN otdr_devices od ON od.id = bcp.otdr_device_id`;

/** Weights of the efficiency score (sum = 1). */
const EFFICIENCY_WEIGHTS = { throughput: 0.5, quality: 0.3, retest: 0.2 } as const;
const LIVE_WINDOW_MS = 10 * 60_000;
const TREND_TOP_EMPLOYEES = 4;

function num(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}

function numOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/** Percentage with one decimal, or null when there is nothing to divide by. */
function pct(part: number, whole: number): number | null {
    return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

function round(value: number, digits = 2): number {
    const f = 10 ** digits;
    return Math.round(value * f) / f;
}

function personName(first: unknown, last: unknown): string {
    const name = [first, last].filter((v) => typeof v === 'string' && v.trim()).join(' ').trim();
    return name || 'Unassigned';
}

function parseReadings(value: unknown): FiberWavelengthReading[] {
    if (Array.isArray(value)) return value as FiberWavelengthReading[];
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed: unknown = JSON.parse(value);
            return Array.isArray(parsed) ? (parsed as FiberWavelengthReading[]) : [];
        } catch {
            return [];
        }
    }
    return [];
}

function minutesAgo(now: Date, minutes: number): Date {
    return new Date(now.getTime() - minutes * 60_000);
}

@Injectable()
export class ReportsService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
        @InjectRepository(BatchFiberTesting)
        private readonly fiberTestingRepository: Repository<BatchFiberTesting>,
        @InjectRepository(CableProfileWavelengthConfig)
        private readonly wavelengthConfigRepository: Repository<CableProfileWavelengthConfig>,
    ) { }

    /** Admins (and plant-less users) may pick any plant; everyone else is pinned to their own. */
    resolvePlantScope(actor: User | null, requestedPlantId?: number | null): number | null {
        const isAdmin = actor?.userRole?.identifier === UserRoleIdentifier.IT_ADMIN;
        if (!isAdmin && actor?.plant?.id) return actor.plant.id;
        return requestedPlantId ?? null;
    }

    private query(sql: string, params: SqlParam[]): Promise<RawRow[]> {
        return this.dataSource.query(sql, params);
    }

    private eventWhere(filter: EventFilter): { sql: string; params: SqlParam[] } {
        const conditions = ['e.tested_at >= ?', 'e.tested_at < ?'];
        const params: SqlParam[] = [filter.range.from, filter.range.toExclusive];
        if (filter.plantId) {
            conditions.push('bcp.plant_id = ?');
            params.push(filter.plantId);
        }
        if (filter.operatorId) {
            conditions.push('e.tested_by_id = ?');
            params.push(filter.operatorId);
        }
        if (filter.cableProfileId) {
            conditions.push('bcp.cable_profile_id = ?');
            params.push(filter.cableProfileId);
        }
        return { sql: `WHERE ${conditions.join(' AND ')}`, params };
    }

    // ---------------------------------------------------------------- filters

    async getFilters(actor: User | null) {
        const plantId = this.resolvePlantScope(actor);
        const [plants, employees, cableProfiles] = await Promise.all([
            this.query(
                `SELECT id, plant_name FROM plants ${plantId ? 'WHERE id = ?' : ''} ORDER BY plant_name`,
                plantId ? [plantId] : [],
            ),
            this.query(
                `SELECT u.id, u.first_name, u.last_name, u.plant_id, p.plant_name
                FROM users u
                LEFT JOIN plants p ON p.id = u.plant_id
                WHERE u.deleted = 0
                    AND (EXISTS (SELECT 1 FROM fiber_test_events e WHERE e.tested_by_id = u.id)
                        OR EXISTS (SELECT 1 FROM batch_cable_profiles x WHERE x.operator_id = u.id AND x.deleted = 0))
                    ${plantId ? 'AND u.plant_id = ?' : ''}
                ORDER BY u.first_name, u.last_name`,
                plantId ? [plantId] : [],
            ),
            this.query(`SELECT id, name FROM cable_profiles WHERE deleted = 0 ORDER BY name`, []),
        ]);

        return {
            plant_locked: plantId !== null,
            plants: plants.map((r) => ({ id: num(r.id), plant_name: String(r.plant_name ?? '') })),
            employees: employees.map((r) => ({
                id: num(r.id),
                name: personName(r.first_name, r.last_name),
                plant_id: numOrNull(r.plant_id),
                plant_name: (r.plant_name as string | null) ?? null,
            })),
            cable_profiles: cableProfiles.map((r) => ({ id: num(r.id), name: String(r.name ?? '') })),
        };
    }

    // ---------------------------------------------------------------- testing (period) report

    async getTestingReport(q: ReportRangeQueryDto, actor: User | null) {
        const range = resolveRange(q.from, q.to, q.granularity);
        const filter: EventFilter = {
            range,
            plantId: this.resolvePlantScope(actor, q.plant_id),
            operatorId: q.operator_id ?? null,
            cableProfileId: q.cable_profile_id ?? null,
        };
        const where = this.eventWhere(filter);
        const bucket = bucketSql(range.granularity, 'e.tested_at');

        const [summary, previous, completed, trendRows, wavelengthRows, plantRows, profileRows, hourRows] =
            await Promise.all([
                this.summarize(filter),
                this.summarize({ ...filter, range: previousRange(range) }),
                this.countCompletedSessions(filter),
                this.query(
                    `SELECT ${bucket} AS bucket, ${RESULT_COUNTS},
                        COUNT(DISTINCT e.batch_fiber_testing_id) AS fibers
                    ${EVENT_FROM} ${where.sql}
                    GROUP BY bucket ORDER BY bucket`,
                    where.params,
                ),
                this.query(
                    `SELECT r.wavelength_nm, COUNT(*) AS readings,
                        COALESCE(SUM(r.in_range = 1), 0) AS in_range,
                        COALESCE(SUM(r.in_range = 0), 0) AS out_of_range,
                        COALESCE(SUM(r.in_range IS NULL), 0) AS no_limit,
                        AVG(r.measured_value) AS avg_value,
                        MIN(r.measured_value) AS min_value,
                        MAX(r.measured_value) AS max_value,
                        MIN(r.min_limit) AS min_limit,
                        MAX(r.max_limit) AS max_limit
                    FROM fiber_test_event_readings r
                    INNER JOIN fiber_test_events e ON e.id = r.event_id
                    LEFT JOIN batch_cable_profiles bcp ON bcp.id = e.batch_cable_profile_id
                    ${where.sql}
                    GROUP BY r.wavelength_nm ORDER BY r.wavelength_nm`,
                    where.params,
                ),
                this.query(
                    `SELECT bcp.plant_id, MAX(p.plant_name) AS plant_name, ${RESULT_COUNTS},
                        COUNT(DISTINCT e.tested_by_id) AS employees,
                        COUNT(DISTINCT e.batch_cable_profile_id) AS sessions
                    ${EVENT_FROM} LEFT JOIN plants p ON p.id = bcp.plant_id
                    ${where.sql}
                    GROUP BY bcp.plant_id ORDER BY tests DESC`,
                    where.params,
                ),
                this.query(
                    `SELECT bcp.cable_profile_id, MAX(cp.name) AS cable_profile_name, ${RESULT_COUNTS},
                        COUNT(DISTINCT e.batch_cable_profile_id) AS sessions
                    ${EVENT_FROM} LEFT JOIN cable_profiles cp ON cp.id = bcp.cable_profile_id
                    ${where.sql}
                    GROUP BY bcp.cable_profile_id ORDER BY tests DESC LIMIT 15`,
                    where.params,
                ),
                this.query(
                    `SELECT HOUR(e.tested_at) AS hour, COUNT(*) AS tests,
                        COALESCE(SUM(e.result = 'FAIL'), 0) AS fail
                    ${EVENT_FROM} ${where.sql}
                    GROUP BY hour ORDER BY hour`,
                    where.params,
                ),
            ]);

        const trendByBucket = new Map(trendRows.map((r) => [String(r.bucket), r]));
        const hoursByHour = new Map(hourRows.map((r) => [num(r.hour), r]));

        return {
            range: { from: range.fromDate, to: range.toDate, granularity: range.granularity, days: range.days },
            summary: { ...summary, sessions_completed: completed },
            previous,
            trend: bucketKeys(range).map((key) => {
                const r = trendByBucket.get(key);
                const pass = num(r?.pass);
                const fail = num(r?.fail);
                return {
                    bucket: key,
                    tests: num(r?.tests),
                    fibers: num(r?.fibers),
                    pass,
                    fail,
                    no_limit: num(r?.no_limit),
                    no_reading: num(r?.no_reading),
                    retests: num(r?.retests),
                    pass_rate: pct(pass, pass + fail),
                };
            }),
            by_wavelength: wavelengthRows.map((r) => {
                const inRange = num(r.in_range);
                const outOfRange = num(r.out_of_range);
                return {
                    wavelength_nm: num(r.wavelength_nm),
                    readings: num(r.readings),
                    in_range: inRange,
                    out_of_range: outOfRange,
                    no_limit: num(r.no_limit),
                    pass_rate: pct(inRange, inRange + outOfRange),
                    avg_value: r.avg_value === null ? null : round(num(r.avg_value), 4),
                    min_value: numOrNull(r.min_value),
                    max_value: numOrNull(r.max_value),
                    min_limit: numOrNull(r.min_limit),
                    max_limit: numOrNull(r.max_limit),
                };
            }),
            by_plant: plantRows.map((r) => ({
                plant_id: numOrNull(r.plant_id),
                plant_name: (r.plant_name as string | null) ?? 'Unassigned',
                ...this.resultCounts(r),
                employees: num(r.employees),
                sessions: num(r.sessions),
            })),
            by_cable_profile: profileRows.map((r) => ({
                cable_profile_id: numOrNull(r.cable_profile_id),
                cable_profile_name: (r.cable_profile_name as string | null) ?? 'Unknown profile',
                ...this.resultCounts(r),
                sessions: num(r.sessions),
            })),
            by_hour_of_day: Array.from({ length: 24 }, (_, hour) => ({
                hour,
                tests: num(hoursByHour.get(hour)?.tests),
                fail: num(hoursByHour.get(hour)?.fail),
            })),
        };
    }

    private resultCounts(r: RawRow) {
        const pass = num(r.pass);
        const fail = num(r.fail);
        return {
            tests: num(r.tests),
            pass,
            fail,
            no_limit: num(r.no_limit),
            no_reading: num(r.no_reading),
            retests: num(r.retests),
            pass_rate: pct(pass, pass + fail),
        };
    }

    private async summarize(filter: EventFilter) {
        const where = this.eventWhere(filter);
        const [r] = await this.query(
            `SELECT ${RESULT_COUNTS},
                COUNT(DISTINCT e.batch_fiber_testing_id) AS fibers,
                COALESCE(SUM(e.attempt <= 1), 0) AS first_attempts,
                COALESCE(SUM(e.attempt <= 1 AND e.result = 'PASS'), 0) AS first_pass,
                COUNT(DISTINCT e.batch_cable_profile_id) AS sessions,
                COUNT(DISTINCT e.tested_by_id) AS employees,
                COUNT(DISTINCT DATE_FORMAT(e.tested_at, '%Y-%m-%d %H')) AS active_hours,
                MIN(e.tested_at) AS first_test_at,
                MAX(e.tested_at) AS last_test_at
            ${EVENT_FROM} ${where.sql}`,
            where.params,
        );
        const counts = this.resultCounts(r ?? {});
        const activeHours = num(r?.active_hours);
        return {
            ...counts,
            fibers: num(r?.fibers),
            sessions: num(r?.sessions),
            employees: num(r?.employees),
            active_hours: activeHours,
            tests_per_hour: activeHours > 0 ? round(counts.tests / activeHours, 1) : null,
            first_pass_yield: pct(num(r?.first_pass), num(r?.first_attempts)),
            retest_rate: pct(counts.retests, counts.tests),
            first_test_at: (r?.first_test_at as Date | null) ?? null,
            last_test_at: (r?.last_test_at as Date | null) ?? null,
        };
    }

    private async countCompletedSessions(filter: EventFilter): Promise<number> {
        const conditions = ['bcp.deleted = 0', 'bcp.status = 2', 'bcp.modified_at >= ?', 'bcp.modified_at < ?'];
        const params: SqlParam[] = [filter.range.from, filter.range.toExclusive];
        if (filter.plantId) {
            conditions.push('bcp.plant_id = ?');
            params.push(filter.plantId);
        }
        if (filter.operatorId) {
            conditions.push('bcp.operator_id = ?');
            params.push(filter.operatorId);
        }
        if (filter.cableProfileId) {
            conditions.push('bcp.cable_profile_id = ?');
            params.push(filter.cableProfileId);
        }
        const [r] = await this.query(
            `SELECT COUNT(*) AS total FROM batch_cable_profiles bcp WHERE ${conditions.join(' AND ')}`,
            params,
        );
        return num(r?.total);
    }

    // ---------------------------------------------------------------- employee report & efficiency

    async getEmployeeReport(q: ReportRangeQueryDto, actor: User | null) {
        const range = resolveRange(q.from, q.to, q.granularity);
        const filter: EventFilter = {
            range,
            plantId: this.resolvePlantScope(actor, q.plant_id),
            operatorId: q.operator_id ?? null,
            cableProfileId: q.cable_profile_id ?? null,
        };
        const where = this.eventWhere(filter);
        const bucket = bucketSql(range.granularity, 'e.tested_at');

        const [rows, dayRows, trendRows] = await Promise.all([
            this.query(
                `SELECT e.tested_by_id AS user_id,
                    MAX(u.first_name) AS first_name, MAX(u.last_name) AS last_name,
                    MAX(u.email) AS email, MAX(up.plant_name) AS plant_name,
                    ${RESULT_COUNTS},
                    COUNT(DISTINCT e.batch_fiber_testing_id) AS fibers,
                    COALESCE(SUM(e.attempt <= 1), 0) AS first_attempts,
                    COALESCE(SUM(e.attempt <= 1 AND e.result = 'PASS'), 0) AS first_pass,
                    COUNT(DISTINCT e.batch_cable_profile_id) AS sessions,
                    COUNT(DISTINCT DATE(e.tested_at)) AS active_days,
                    COUNT(DISTINCT DATE_FORMAT(e.tested_at, '%Y-%m-%d %H')) AS active_hours,
                    MIN(e.tested_at) AS first_test_at,
                    MAX(e.tested_at) AS last_test_at
                ${EVENT_FROM}
                LEFT JOIN users u ON u.id = e.tested_by_id
                LEFT JOIN plants up ON up.id = u.plant_id
                ${where.sql}
                GROUP BY e.tested_by_id ORDER BY tests DESC`,
                where.params,
            ),
            // Per employee-day working span: first to last test of that day.
            this.query(
                `SELECT e.tested_by_id AS user_id, DATE_FORMAT(e.tested_at, '%Y-%m-%d') AS day,
                    COUNT(*) AS tests,
                    TIMESTAMPDIFF(SECOND, MIN(e.tested_at), MAX(e.tested_at)) AS span_seconds
                ${EVENT_FROM} ${where.sql}
                GROUP BY e.tested_by_id, day`,
                where.params,
            ),
            this.query(
                `SELECT ${bucket} AS bucket, e.tested_by_id AS user_id, COUNT(*) AS tests
                ${EVENT_FROM} ${where.sql}
                GROUP BY bucket, e.tested_by_id`,
                where.params,
            ),
        ]);

        const spanByUser = new Map<string, { seconds: number; gaps: number }>();
        for (const d of dayRows) {
            const key = String(d.user_id ?? 'none');
            const acc = spanByUser.get(key) ?? { seconds: 0, gaps: 0 };
            acc.seconds += num(d.span_seconds);
            acc.gaps += Math.max(num(d.tests) - 1, 0);
            spanByUser.set(key, acc);
        }

        const base = rows.map((r) => {
            const counts = this.resultCounts(r);
            const activeHours = num(r.active_hours);
            const span = spanByUser.get(String(r.user_id ?? 'none')) ?? { seconds: 0, gaps: 0 };
            const passRate = counts.pass_rate;
            const firstPassYield = pct(num(r.first_pass), num(r.first_attempts));
            return {
                user_id: numOrNull(r.user_id),
                name: personName(r.first_name, r.last_name),
                email: (r.email as string | null) ?? null,
                plant_name: (r.plant_name as string | null) ?? null,
                ...counts,
                fibers: num(r.fibers),
                sessions: num(r.sessions),
                active_days: num(r.active_days),
                active_hours: activeHours,
                working_minutes: Math.round(span.seconds / 60),
                tests_per_hour: activeHours > 0 ? round(counts.tests / activeHours, 1) : 0,
                avg_cycle_seconds: span.gaps > 0 ? Math.round(span.seconds / span.gaps) : null,
                first_pass_yield: firstPassYield,
                retest_rate: pct(counts.retests, counts.tests) ?? 0,
                first_test_at: (r.first_test_at as Date | null) ?? null,
                last_test_at: (r.last_test_at as Date | null) ?? null,
                quality: firstPassYield ?? passRate,
            };
        });

        // Score: throughput relative to the period's fastest tester + quality + low retests.
        const bestTph = Math.max(0, ...base.map((e) => e.tests_per_hour));
        const employees = base
            .map(({ quality, ...e }) => {
                const throughput = bestTph > 0 ? e.tests_per_hour / bestTph : 0;
                const score =
                    100 *
                    (EFFICIENCY_WEIGHTS.throughput * throughput +
                        EFFICIENCY_WEIGHTS.quality * ((quality ?? 0) / 100) +
                        EFFICIENCY_WEIGHTS.retest * (1 - e.retest_rate / 100));
                return { ...e, efficiency_score: Math.round(score) };
            })
            .sort((a, b) => b.efficiency_score - a.efficiency_score || b.tests - a.tests)
            .map((e, i) => ({ ...e, efficiency_rank: i + 1 }))
            .sort((a, b) => b.tests - a.tests);

        const totals = employees.reduce(
            (acc, e) => {
                acc.tests += e.tests;
                acc.pass += e.pass;
                acc.fail += e.fail;
                acc.retests += e.retests;
                acc.active_hours += e.active_hours;
                return acc;
            },
            { tests: 0, pass: 0, fail: 0, retests: 0, active_hours: 0 },
        );
        const cycles = employees.filter((e) => e.avg_cycle_seconds !== null);

        // Trend: top employees by volume as their own series, the rest folded into "Other".
        const top = employees.slice(0, TREND_TOP_EMPLOYEES);
        const topIds = new Set(top.map((e) => String(e.user_id)));
        const trendByBucket = new Map<string, Record<string, number>>();
        for (const r of trendRows) {
            const key = String(r.bucket);
            const point = trendByBucket.get(key) ?? {};
            const series = topIds.has(String(r.user_id)) ? `u${String(r.user_id)}` : 'other';
            point[series] = (point[series] ?? 0) + num(r.tests);
            trendByBucket.set(key, point);
        }
        const hasOther = employees.length > TREND_TOP_EMPLOYEES;
        const seriesKeys = [...top.map((e) => `u${String(e.user_id)}`), ...(hasOther ? ['other'] : [])];

        return {
            range: { from: range.fromDate, to: range.toDate, granularity: range.granularity, days: range.days },
            team: {
                employees: employees.length,
                tests: totals.tests,
                pass: totals.pass,
                fail: totals.fail,
                retests: totals.retests,
                pass_rate: pct(totals.pass, totals.pass + totals.fail),
                retest_rate: pct(totals.retests, totals.tests),
                avg_tests_per_hour: totals.active_hours > 0 ? round(totals.tests / totals.active_hours, 1) : null,
                best_tests_per_hour: bestTph || null,
                avg_cycle_seconds: cycles.length
                    ? Math.round(cycles.reduce((s, e) => s + (e.avg_cycle_seconds ?? 0), 0) / cycles.length)
                    : null,
                avg_efficiency_score: employees.length
                    ? Math.round(employees.reduce((s, e) => s + e.efficiency_score, 0) / employees.length)
                    : null,
            },
            employees,
            trend_series: [
                ...top.map((e) => ({ key: `u${String(e.user_id)}`, user_id: e.user_id, name: e.name })),
                ...(hasOther ? [{ key: 'other', user_id: null, name: 'Other' }] : []),
            ],
            trend: bucketKeys(range).map((key) => {
                const point = trendByBucket.get(key) ?? {};
                return {
                    bucket: key,
                    ...Object.fromEntries(seriesKeys.map((s) => [s, point[s] ?? 0])),
                };
            }),
        };
    }

    // ---------------------------------------------------------------- batch-wise report

    async getBatchReport(q: BatchReportQueryDto, actor: User | null) {
        const plantId = this.resolvePlantScope(actor, q.plant_id);
        const page = q.page ?? 1;
        const pageSize = q.page_size ?? 20;

        const conditions = ['bcp.deleted = 0'];
        const params: SqlParam[] = [];
        if (plantId) {
            conditions.push('bcp.plant_id = ?');
            params.push(plantId);
        }
        if (q.status !== undefined) {
            conditions.push('bcp.status = ?');
            params.push(q.status);
        }
        const search = q.search?.trim();
        if (search) {
            const like = `%${search.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
            conditions.push(
                '(bcp.batch_name LIKE ? OR bcp.drum_number LIKE ? OR b.batch_name LIKE ? OR cp.name LIKE ? OR c.name LIKE ?)',
            );
            params.push(like, like, like, like, like);
        }
        if (q.from || q.to) {
            const range = resolveRange(q.from ?? q.to!, q.to ?? q.from!);
            conditions.push(
                `((bcp.created_at >= ? AND bcp.created_at < ?)
                    OR EXISTS (SELECT 1 FROM fiber_test_events x
                        WHERE x.batch_cable_profile_id = bcp.id AND x.tested_at >= ? AND x.tested_at < ?))`,
            );
            params.push(range.from, range.toExclusive, range.from, range.toExclusive);
        }
        const whereSql = `WHERE ${conditions.join(' AND ')}`;

        const [countRows, sessionRows] = await Promise.all([
            this.query(
                `SELECT COUNT(*) AS total,
                    COALESCE(SUM(bcp.status = 0), 0) AS pending,
                    COALESCE(SUM(bcp.status = 1), 0) AS in_progress,
                    COALESCE(SUM(bcp.status = 2), 0) AS completed
                FROM batch_cable_profiles bcp ${SESSION_JOINS} ${whereSql}`,
                params,
            ),
            this.query(
                `SELECT ${SESSION_SELECT}
                FROM batch_cable_profiles bcp ${SESSION_JOINS} ${whereSql}
                ORDER BY bcp.modified_at DESC, bcp.id DESC
                LIMIT ? OFFSET ?`,
                [...params, pageSize, (page - 1) * pageSize],
            ),
        ]);

        const sessions = sessionRows.map((r) => this.mapSession(r));
        const ids = sessions.map((s) => s.id);
        const [stats, activity] = await Promise.all([
            this.computeSessionStats(sessions),
            ids.length
                ? this.query(
                    `SELECT batch_cable_profile_id, COUNT(*) AS tests, MAX(tested_at) AS last_test_at
                    FROM fiber_test_events WHERE batch_cable_profile_id IN (?)
                    GROUP BY batch_cable_profile_id`,
                    [ids as unknown as SqlParam],
                )
                : Promise.resolve([] as RawRow[]),
        ]);
        const activityById = new Map(activity.map((r) => [num(r.batch_cable_profile_id), r]));

        const counts = countRows[0] ?? {};
        return {
            page,
            page_size: pageSize,
            total: num(counts.total),
            status_counts: {
                pending: num(counts.pending),
                in_progress: num(counts.in_progress),
                completed: num(counts.completed),
            },
            items: sessions.map((s) => ({
                ...s,
                stats: stats.get(s.id) ?? this.emptyStats(),
                tests: num(activityById.get(s.id)?.tests),
                last_test_at: (activityById.get(s.id)?.last_test_at as Date | null) ?? null,
            })),
        };
    }

    async getBatchSessionReport(id: number, actor: User | null) {
        const plantId = this.resolvePlantScope(actor);
        const bcp = await this.batchCableProfileRepository.findOne({
            where: { id, deleted: false },
            relations: { ...batchCableProfileDetailRelations },
        });
        if (!bcp || (plantId && bcp.plant?.id !== plantId)) {
            throw new NotFoundException(`Batch session #${id} not found`);
        }

        const limits = buildWavelengthLimits(bcp.cable_profile?.wavelength_configs ?? []);
        const [rows, testerRows] = await Promise.all([
            this.fiberTestingRepository.find({
                where: { batch_cable_profile: { id } },
                order: { fiber_number: 'ASC' },
            }),
            this.query(
                `SELECT e.tested_by_id AS user_id, MAX(u.first_name) AS first_name, MAX(u.last_name) AS last_name,
                    ${RESULT_COUNTS}, MIN(e.tested_at) AS first_test_at, MAX(e.tested_at) AS last_test_at
                FROM fiber_test_events e LEFT JOIN users u ON u.id = e.tested_by_id
                WHERE e.batch_cable_profile_id = ?
                GROUP BY e.tested_by_id ORDER BY tests DESC`,
                [id],
            ),
        ]);

        const wavelengths = new Set<number>(limits.keys());
        const evaluatedRows = rows.map((row) => {
            const evaluation = evaluateFiber(row.fiber_wavelengths, limits);
            evaluation.readings.forEach((r) => wavelengths.add(r.wavelength_nm));
            return { row, evaluation };
        });
        const wavelengthList = [...wavelengths].sort((a, b) => a - b);

        const byWavelength = new Map(
            wavelengthList.map((nm) => [
                nm,
                { tested: 0, in_range: 0, out_of_range: 0, no_limit: 0, sum: 0, min: Infinity, max: -Infinity },
            ]),
        );
        for (const { evaluation } of evaluatedRows) {
            for (const r of evaluation.readings) {
                if (r.value === null) continue;
                const acc = byWavelength.get(r.wavelength_nm)!;
                acc.tested++;
                acc.sum += r.value;
                acc.min = Math.min(acc.min, r.value);
                acc.max = Math.max(acc.max, r.value);
                if (r.status === 'in_range') acc.in_range++;
                else if (r.status === 'out_of_range') acc.out_of_range++;
                else acc.no_limit++;
            }
        }

        const first = rows[0];
        const attributeLabels = first
            ? [first.attribute1_name, first.attribute2_name, first.attribute3_name]
                .map((name) => name?.trim() ?? '')
                .filter(Boolean)
            : [];

        return {
            session: {
                id: bcp.id,
                batch_name: bcp.batch_name,
                batch: bcp.batch?.batch ?? null,
                drum_number: bcp.drum_number,
                fiber_type: bcp.fiber_type,
                status: bcp.status,
                created_at: bcp.created_at,
                modified_at: bcp.modified_at,
                otdr_length_km: bcp.otdr_length_km,
                plant_name: bcp.plant?.plant_name ?? null,
                customer_name: bcp.customer?.name ?? null,
                cable_profile_name: bcp.cable_profile?.cable_profile_name ?? null,
                cable_type_name: bcp.cable_type?.name ?? null,
                sfg_stage_name: bcp.sfg_stage?.name ?? null,
                operator_name: bcp.operator ? personName(bcp.operator.first_name, bcp.operator.last_name) : null,
                otdr_device_name: bcp.otdr_device?.device_name ?? null,
            },
            limits: wavelengthList.map((nm) => {
                const limit = limits.get(nm);
                return {
                    wavelength_nm: nm,
                    min: limit?.min ?? null,
                    max: limit?.max ?? null,
                    unit: limit?.unit ?? 'dB/km',
                };
            }),
            attribute_labels: attributeLabels,
            summary: this.statsFromEvaluations(evaluatedRows),
            by_wavelength: wavelengthList.map((nm) => {
                const acc = byWavelength.get(nm)!;
                return {
                    wavelength_nm: nm,
                    tested: acc.tested,
                    in_range: acc.in_range,
                    out_of_range: acc.out_of_range,
                    no_limit: acc.no_limit,
                    pass_rate: pct(acc.in_range, acc.in_range + acc.out_of_range),
                    avg_value: acc.tested ? round(acc.sum / acc.tested, 4) : null,
                    min_value: acc.tested ? acc.min : null,
                    max_value: acc.tested ? acc.max : null,
                };
            }),
            testers: testerRows.map((r) => ({
                user_id: numOrNull(r.user_id),
                name: personName(r.first_name, r.last_name),
                ...this.resultCounts(r),
                first_test_at: (r.first_test_at as Date | null) ?? null,
                last_test_at: (r.last_test_at as Date | null) ?? null,
            })),
            rows: evaluatedRows.map(({ row, evaluation }) => {
                const readings = new Map(evaluation.readings.map((r) => [r.wavelength_nm, r]));
                return {
                    id: row.id,
                    fiber_number: row.fiber_number,
                    attributes: [row.attribute1_value, row.attribute2_value, row.attribute3_value]
                        .slice(0, attributeLabels.length)
                        .map((v) => v ?? ''),
                    testing_counter: row.testing_counter ?? 0,
                    last_tested_at: (row.testing_counter ?? 0) > 0 ? row.modified_at : null,
                    result: evaluation.result,
                    readings: wavelengthList.map((nm) => {
                        const r = readings.get(nm);
                        return {
                            wavelength_nm: nm,
                            value: r?.value ?? null,
                            status: r?.status ?? 'not_tested',
                        };
                    }),
                };
            }),
        };
    }

    private mapSession(r: RawRow) {
        return {
            id: num(r.id),
            batch_name: String(r.batch_name ?? ''),
            batch: (r.batch as string | null) ?? null,
            drum_number: (r.drum_number as string | null) ?? null,
            fiber_type: (r.fiber_type as string | null) ?? null,
            status: num(r.status),
            created_at: (r.created_at as Date | null) ?? null,
            modified_at: (r.modified_at as Date | null) ?? null,
            cable_profile_id: numOrNull(r.cable_profile_id),
            cable_profile_name: (r.cable_profile_name as string | null) ?? null,
            cable_type_name: (r.cable_type_name as string | null) ?? null,
            customer_name: (r.customer_name as string | null) ?? null,
            plant_name: (r.plant_name as string | null) ?? null,
            sfg_stage_name: (r.sfg_stage_name as string | null) ?? null,
            operator_name:
                r.operator_first_name || r.operator_last_name
                    ? personName(r.operator_first_name, r.operator_last_name)
                    : null,
            otdr_device_name: (r.otdr_device_name as string | null) ?? null,
        };
    }

    private emptyStats(): SessionStats {
        return {
            total_fibers: 0,
            tested_fibers: 0,
            pending_fibers: 0,
            pass_fibers: 0,
            fail_fibers: 0,
            no_limit_fibers: 0,
            retested_fibers: 0,
            out_of_range_readings: 0,
            progress_pct: 0,
            pass_rate: null,
            failing_wavelengths: [],
        };
    }

    private statsFromEvaluations(
        items: { row: Pick<BatchFiberTesting, 'testing_counter'>; evaluation: ReturnType<typeof evaluateFiber> }[],
    ): SessionStats {
        const stats = this.emptyStats();
        const failing = new Map<number, number>();
        for (const { row, evaluation } of items) {
            stats.total_fibers++;
            if ((row.testing_counter ?? 0) > 1) stats.retested_fibers++;
            if (evaluation.tested === 0) continue;
            stats.tested_fibers++;
            stats.out_of_range_readings += evaluation.out_of_range;
            if (evaluation.result === 'PASS') stats.pass_fibers++;
            else if (evaluation.result === 'FAIL') stats.fail_fibers++;
            else stats.no_limit_fibers++;
            for (const r of evaluation.readings) {
                if (r.status === 'out_of_range') failing.set(r.wavelength_nm, (failing.get(r.wavelength_nm) ?? 0) + 1);
            }
        }
        stats.pending_fibers = stats.total_fibers - stats.tested_fibers;
        stats.progress_pct = pct(stats.tested_fibers, stats.total_fibers) ?? 0;
        stats.pass_rate = pct(stats.pass_fibers, stats.pass_fibers + stats.fail_fibers);
        stats.failing_wavelengths = [...failing.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([wavelength_nm, fibers]) => ({ wavelength_nm, fibers }));
        return stats;
    }

    /** Current (latest-reading) fiber stats for each session, judged against its profile limits. */
    private async computeSessionStats(
        sessions: { id: number; cable_profile_id: number | null }[],
    ): Promise<Map<number, SessionStats>> {
        const result = new Map<number, SessionStats>();
        if (sessions.length === 0) return result;

        const profileIds = [...new Set(sessions.map((s) => s.cable_profile_id).filter((v): v is number => !!v))];
        const [fiberRows, configs] = await Promise.all([
            this.query(
                `SELECT batch_cable_profile_id, testing_counter, fiber_wavelengths
                FROM batch_fiber_testing WHERE batch_cable_profile_id IN (?)`,
                [sessions.map((s) => s.id) as unknown as SqlParam],
            ),
            profileIds.length
                ? this.wavelengthConfigRepository.find({
                    where: { cable_profile: { id: In(profileIds) } },
                    relations: { cable_wavelength: true, cable_profile: true },
                })
                : Promise.resolve([] as CableProfileWavelengthConfig[]),
        ]);

        const limitsByProfile = new Map<number, Map<number, WavelengthLimit>>();
        for (const profileId of profileIds) {
            limitsByProfile.set(
                profileId,
                buildWavelengthLimits(configs.filter((c) => c.cable_profile?.id === profileId)),
            );
        }

        const rowsBySession = new Map<number, RawRow[]>();
        for (const r of fiberRows) {
            const sid = num(r.batch_cable_profile_id);
            const list = rowsBySession.get(sid) ?? [];
            list.push(r);
            rowsBySession.set(sid, list);
        }

        for (const s of sessions) {
            const limits = (s.cable_profile_id && limitsByProfile.get(s.cable_profile_id)) || new Map();
            const items = (rowsBySession.get(s.id) ?? []).map((r) => ({
                row: { testing_counter: num(r.testing_counter) },
                evaluation: evaluateFiber(parseReadings(r.fiber_wavelengths), limits),
            }));
            result.set(s.id, this.statsFromEvaluations(items));
        }
        return result;
    }

    // ---------------------------------------------------------------- live status

    async getLiveStatus(q: LiveReportQueryDto, actor: User | null) {
        const plantId = this.resolvePlantScope(actor, q.plant_id);
        const now = new Date();
        const todayStart = toLocalSqlDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        const hourAgo = toLocalSqlDateTime(minutesAgo(now, 60));
        const quarterAgo = toLocalSqlDateTime(minutesAgo(now, 15));
        const weekAgo = toLocalSqlDateTime(minutesAgo(now, 7 * 24 * 60));
        const windowStart = todayStart < hourAgo ? todayStart : hourAgo;
        const firstMinute = new Date(minutesAgo(now, 59).setSeconds(0, 0));

        const plantSql = plantId ? 'AND bcp.plant_id = ?' : '';
        const plantParams: SqlParam[] = plantId ? [plantId] : [];

        const [kpiRows, minuteRows, sessionRows, recentRows, testerRows] = await Promise.all([
            this.query(
                `SELECT COALESCE(SUM(e.tested_at >= ?), 0) AS tests_today,
                    COALESCE(SUM(e.tested_at >= ? AND e.result = 'PASS'), 0) AS pass_today,
                    COALESCE(SUM(e.tested_at >= ? AND e.result = 'FAIL'), 0) AS fail_today,
                    COALESCE(SUM(e.tested_at >= ?), 0) AS tests_last_hour,
                    COALESCE(SUM(e.tested_at >= ?), 0) AS tests_last_15m,
                    COUNT(DISTINCT CASE WHEN e.tested_at >= ? THEN e.tested_by_id END) AS active_testers,
                    COUNT(DISTINCT CASE WHEN e.tested_at >= ? THEN e.tested_by_id END) AS testers_today
                ${EVENT_FROM}
                WHERE e.tested_at >= ? ${plantSql}`,
                [todayStart, todayStart, todayStart, hourAgo, quarterAgo, quarterAgo, todayStart, windowStart, ...plantParams],
            ),
            this.query(
                `SELECT DATE_FORMAT(e.tested_at, '%Y-%m-%d %H:%i') AS minute, COUNT(*) AS tests,
                    COALESCE(SUM(e.result = 'FAIL'), 0) AS fail
                ${EVENT_FROM}
                WHERE e.tested_at >= ? ${plantSql}
                GROUP BY minute`,
                [toLocalSqlDateTime(firstMinute), ...plantParams],
            ),
            this.query(
                `SELECT ${SESSION_SELECT}, ev.tests_last_hour, ev.tests_today,
                    COALESCE(ev.last_test_at, (SELECT MAX(x.tested_at) FROM fiber_test_events x
                        WHERE x.batch_cable_profile_id = bcp.id)) AS last_test_at
                FROM batch_cable_profiles bcp
                ${SESSION_JOINS}
                LEFT JOIN (
                    SELECT batch_cable_profile_id, MAX(tested_at) AS last_test_at,
                        SUM(tested_at >= ?) AS tests_last_hour, SUM(tested_at >= ?) AS tests_today
                    FROM fiber_test_events WHERE tested_at >= ?
                    GROUP BY batch_cable_profile_id
                ) ev ON ev.batch_cable_profile_id = bcp.id
                WHERE bcp.deleted = 0 AND (bcp.status = 1 OR ev.last_test_at IS NOT NULL) ${plantSql}
                ORDER BY ev.last_test_at IS NULL, ev.last_test_at DESC, bcp.modified_at DESC
                LIMIT 60`,
                [hourAgo, todayStart, windowStart, ...plantParams],
            ),
            this.query(
                `SELECT e.id, e.fiber_number, e.result, e.attempt, e.wavelengths_out_of_range, e.tested_at,
                    e.batch_cable_profile_id, bcp.batch_name, bcp.drum_number,
                    u.first_name, u.last_name
                ${EVENT_FROM}
                LEFT JOIN users u ON u.id = e.tested_by_id
                WHERE e.tested_at >= ? ${plantSql}
                ORDER BY e.tested_at DESC, e.id DESC
                LIMIT 25`,
                [weekAgo, ...plantParams],
            ),
            this.query(
                `SELECT e.tested_by_id AS user_id, MAX(u.first_name) AS first_name, MAX(u.last_name) AS last_name,
                    COUNT(*) AS tests, COALESCE(SUM(e.result = 'FAIL'), 0) AS fail,
                    COUNT(DISTINCT e.batch_cable_profile_id) AS sessions, MAX(e.tested_at) AS last_test_at
                ${EVENT_FROM}
                LEFT JOIN users u ON u.id = e.tested_by_id
                WHERE e.tested_at >= ? ${plantSql}
                GROUP BY e.tested_by_id ORDER BY last_test_at DESC`,
                [hourAgo, ...plantParams],
            ),
        ]);

        const sessions = sessionRows.map((r) => ({
            ...this.mapSession(r),
            last_test_at: (r.last_test_at as Date | null) ?? null,
            tests_last_hour: num(r.tests_last_hour),
            tests_today: num(r.tests_today),
        }));
        const stats = await this.computeSessionStats(sessions);

        const minuteByKey = new Map(minuteRows.map((r) => [String(r.minute), r]));
        const kpi = kpiRows[0] ?? {};
        const passToday = num(kpi.pass_today);
        const failToday = num(kpi.fail_today);

        return {
            generated_at: now,
            kpis: {
                tests_today: num(kpi.tests_today),
                pass_today: passToday,
                fail_today: failToday,
                pass_rate_today: pct(passToday, passToday + failToday),
                tests_last_hour: num(kpi.tests_last_hour),
                tests_last_15m: num(kpi.tests_last_15m),
                active_testers: num(kpi.active_testers),
                testers_today: num(kpi.testers_today),
                live_sessions: sessions.filter(
                    (s) => s.last_test_at && now.getTime() - new Date(s.last_test_at).getTime() <= LIVE_WINDOW_MS,
                ).length,
                sessions_in_progress: sessions.filter((s) => s.status === 1).length,
            },
            per_minute: Array.from({ length: 60 }, (_, i) => {
                const minute = toLocalSqlDateTime(new Date(firstMinute.getTime() + i * 60_000)).slice(0, 16);
                const r = minuteByKey.get(minute);
                return { minute, tests: num(r?.tests), fail: num(r?.fail) };
            }),
            sessions: sessions.map((s) => {
                const lastMs = s.last_test_at ? new Date(s.last_test_at).getTime() : null;
                const state =
                    lastMs !== null && now.getTime() - lastMs <= LIVE_WINDOW_MS
                        ? 'live'
                        : s.tests_today > 0
                            ? 'idle'
                            : 'stalled';
                return { ...s, state, stats: stats.get(s.id) ?? this.emptyStats() };
            }),
            testers: testerRows.map((r) => ({
                user_id: numOrNull(r.user_id),
                name: personName(r.first_name, r.last_name),
                tests: num(r.tests),
                fail: num(r.fail),
                sessions: num(r.sessions),
                last_test_at: (r.last_test_at as Date | null) ?? null,
            })),
            recent: recentRows.map((r) => ({
                id: num(r.id),
                fiber_number: num(r.fiber_number),
                result: String(r.result),
                attempt: num(r.attempt),
                wavelengths_out_of_range: num(r.wavelengths_out_of_range),
                tested_at: r.tested_at as Date,
                batch_cable_profile_id: numOrNull(r.batch_cable_profile_id),
                batch_name: (r.batch_name as string | null) ?? null,
                drum_number: (r.drum_number as string | null) ?? null,
                tested_by: personName(r.first_name, r.last_name),
            })),
        };
    }
}
