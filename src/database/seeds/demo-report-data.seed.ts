/**
 * Dummy data for the admin dashboard reports.
 *
 *   npm run seed:demo          wipe previous demo data, then seed ~1 year of testing history
 *   npm run seed:demo:clean    remove all demo data
 *   npm run seed:demo:live     keep submitting tests through the API (default 30 min) so the
 *                              Live Testing Status page moves; needs the API running
 *
 * Everything created here is tagged so it can be removed safely:
 *   users      email ends with @demo.hfcl.local (password: Demo@1234)
 *   batches    batch_name starts with DEMO-
 *   sessions   batch_cable_profiles.batch_name starts with DEMO- (+ their fiber rows and test events)
 * Plants, customers, OTDR devices, SFG stages and cable profiles are reused, never modified.
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { BatchCableProfile } from '../../batches/entities/batch-cable-profile.entity';
import { BatchFiberTesting } from '../../batches/entities/batch-fiber-testing.entity';
import { BatchFiberTestingService } from '../../batches/batch-fiber-testing.service';
import { CableProfileWavelengthConfig } from '../../cable-profiles/entities/cable-profile-wavelength-config.entity';
import { buildWavelengthLimits, WavelengthLimit } from '../../batches/wavelength-range.util';
import { toLocalSqlDateTime } from '../../reports/report-range.util';
import { UserRoleIdentifier } from '../../users/user-role.constants';

dotenv.config();

const DEMO_DOMAIN = 'demo.hfcl.local';
const DEMO_PREFIX = 'DEMO-';
const DEMO_PASSWORD = 'Demo@1234';
/** Every demo test measures all three of these. */
const WAVELENGTHS = [1310, 1550, 1625];
/** Small/medium profiles (96–288 fibers) that define limits for all three wavelengths. */
const PROFILE_IDS = [6, 15, 18, 16, 7, 13, 19];
const DAY_MS = 86_400_000;

type SqlValue = string | number | null;

interface Tester {
    first: string;
    last: string;
    /** Mean seconds per fiber test. */
    cycle: number;
    /** Probability that a fiber has one wavelength out of range. */
    failRate: number;
    id?: number;
}

const TESTERS: Tester[] = [
    { first: 'Rahul', last: 'Verma', cycle: 26, failRate: 0.03 },
    { first: 'Priya', last: 'Nair', cycle: 21, failRate: 0.02 },
    { first: 'Amit', last: 'Kumar', cycle: 34, failRate: 0.06 },
    { first: 'Sneha', last: 'Reddy', cycle: 24, failRate: 0.04 },
    { first: 'Vikram', last: 'Singh', cycle: 41, failRate: 0.08 },
    { first: 'Anjali', last: 'Rao', cycle: 29, failRate: 0.03 },
];

// ---------------------------------------------------------------- deterministic randomness

let rngState = 20261001;
function rand(): number {
    // mulberry32
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)];
const chance = (p: number) => rand() < p;

// ---------------------------------------------------------------- db helpers

function createDataSource(): DataSource {
    return new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hfcl_db',
        entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
    });
}

async function bulkInsert(ds: DataSource, table: string, columns: string[], rows: SqlValue[][], chunk = 500) {
    for (let i = 0; i < rows.length; i += chunk) {
        const part = rows.slice(i, i + chunk);
        const placeholders = part.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
        await ds.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`, part.flat());
    }
}

const sqlTime = (d: Date) => toLocalSqlDateTime(d);

// ---------------------------------------------------------------- clean

async function clean(ds: DataSource) {
    const sessions: { id: number }[] = await ds.query(
        `SELECT id FROM batch_cable_profiles WHERE batch_name LIKE ?`,
        [`${DEMO_PREFIX}%`],
    );
    const ids = sessions.map((s) => s.id);
    if (ids.length) {
        // fiber_test_event_readings rows go with their events (ON DELETE CASCADE).
        for (const table of [
            'fiber_test_events',
            'fiber_testing_ai_response',
            'batch_fiber_testing',
            'batch_physical_params',
            'batch_cable_wavelength_testing',
        ]) {
            await ds.query(`DELETE FROM ${table} WHERE batch_cable_profile_id IN (?)`, [ids]);
        }
        await ds.query(`DELETE FROM batch_cable_profiles WHERE id IN (?)`, [ids]);
    }
    await ds.query(`DELETE FROM batches WHERE batch_name LIKE ?`, [`${DEMO_PREFIX}%`]);
    // Demo testers could also have tested real sessions via the testing app; keep those events, unlinked.
    await ds.query(
        `UPDATE fiber_test_events SET tested_by_id = NULL
        WHERE tested_by_id IN (SELECT id FROM (SELECT id FROM users WHERE email LIKE ?) u)`,
        [`%@${DEMO_DOMAIN}`],
    );
    const users = await ds.query(`DELETE FROM users WHERE email LIKE ?`, [`%@${DEMO_DOMAIN}`]);
    console.log(`Removed ${ids.length} demo sessions and ${users.affectedRows ?? 0} demo users.`);
}

// ---------------------------------------------------------------- seed

interface Refs {
    plantId: number;
    roleId: number;
    customerIds: number[];
    otdrIds: number[];
    stageId: number | null;
    profiles: { id: number; name: string; cable_type_id: number | null; limits: Map<number, WavelengthLimit> }[];
}

async function loadRefs(ds: DataSource): Promise<Refs> {
    const [plant] = await ds.query(`SELECT id FROM plants ORDER BY id LIMIT 1`);
    const [role] = await ds.query(`SELECT id FROM user_roles WHERE identifier = ?`, [UserRoleIdentifier.PLANT_OPERATOR]);
    if (!plant || !role) throw new Error('Need at least one plant and the Plant_Operator role.');
    const customers = await ds.query(`SELECT id FROM customers WHERE deleted = 0 ORDER BY id`);
    const otdrs = await ds.query(`SELECT id FROM otdr_devices WHERE plant_id = ? ORDER BY id`, [plant.id]);
    const [stage] = await ds.query(`SELECT id FROM sfg_stages WHERE deleted = 0 ORDER BY sequence DESC LIMIT 1`);

    const configRepo = ds.getRepository(CableProfileWavelengthConfig);
    const profileRows: { id: number; name: string; cable_type_id: number | null }[] = await ds.query(
        `SELECT id, name, cable_type_id FROM cable_profiles WHERE deleted = 0 AND id IN (?)`,
        [PROFILE_IDS],
    );
    const profiles: Refs['profiles'] = [];
    for (const p of profileRows) {
        const limits = buildWavelengthLimits(
            await configRepo.find({ where: { cable_profile: { id: p.id } }, relations: { cable_wavelength: true } }),
        );
        const complete = WAVELENGTHS.every((nm) => limits.get(nm)?.min != null && limits.get(nm)?.max != null);
        if (complete) profiles.push({ ...p, limits });
    }
    if (!profiles.length) throw new Error('No cable profile has min/max limits for 1310, 1550 and 1625 nm.');

    return {
        plantId: plant.id,
        roleId: role.id,
        customerIds: customers.map((c: { id: number }) => c.id),
        otdrIds: otdrs.map((o: { id: number }) => o.id),
        stageId: stage?.id ?? null,
        profiles,
    };
}

async function createTesters(ds: DataSource, refs: Refs) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const created = sqlTime(new Date(Date.now() - 400 * DAY_MS));
    for (const t of TESTERS) {
        const email = `${t.first}.${t.last}@${DEMO_DOMAIN}`.toLowerCase();
        const res = await ds.query(
            `INSERT INTO users (first_name, last_name, email, password, role_id, plant_id, status, deleted, created_at, modified_at)
            VALUES (?, ?, ?, ?, ?, ?, 'active', 0, ?, ?)`,
            [t.first, t.last, email, hash, refs.roleId, refs.plantId, created, created],
        );
        t.id = res.insertId;
    }
}

/** A reading for one wavelength: usually inside the limits, occasionally just outside. */
function reading(limit: WavelengthLimit, forceOut: boolean): number {
    const min = limit.min!;
    const max = limit.max!;
    const span = max - min;
    let value: number;
    if (forceOut) {
        value = chance(0.8) ? max + between(0.005, 0.06) : Math.max(0.05, min - between(0.005, 0.04));
    } else {
        // Clustered around 35–65% of the band, like real fibre attenuation.
        value = min + span * Math.min(0.97, Math.max(0.03, 0.5 + (rand() + rand() + rand() - 1.5) * 0.35));
    }
    return Math.round(value * 1000) / 1000;
}

/** Which wavelength fails when a fiber fails (1625 nm is the most bend-sensitive). */
function failingWavelength(): number {
    const r = rand();
    return r < 0.5 ? 1625 : r < 0.8 ? 1310 : 1550;
}

interface PlannedSession {
    start: Date;
    tester: Tester;
    profile: Refs['profiles'][number];
    /** Stop testing at this time (cuts the session short → in progress). */
    stopAt: Date;
    /** Keep a steady pace up to stopAt, ignoring shift hours (for "live" sessions). */
    live?: boolean;
    pending?: boolean;
}

function planSessions(refs: Refs, now: Date): PlannedSession[] {
    const plans: PlannedSession[] = [];
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let offset = 365; offset >= 1; offset--) {
        const day = new Date(todayStart.getTime() - offset * DAY_MS);
        if (day.getDay() === 0) continue; // Sundays off
        const p = offset > 120 ? 0.1 : offset > 30 ? 0.22 : 0.45;
        if (!chance(p)) continue;
        const start = new Date(day);
        start.setHours(8, Math.floor(between(20, 90)), 0, 0);
        plans.push({ start, tester: pick(TESTERS), profile: pick(refs.profiles), stopAt: now });
    }

    // Today: two sessions being tested right now, one that paused mid-morning, one not started.
    const liveStart = new Date(now.getTime() - between(70, 110) * 60_000);
    plans.push({ start: liveStart, tester: TESTERS[1], profile: refs.profiles[0], stopAt: new Date(now.getTime() - 40_000), live: true });
    plans.push({
        start: new Date(now.getTime() - between(40, 60) * 60_000),
        tester: TESTERS[3],
        profile: refs.profiles[1 % refs.profiles.length],
        stopAt: new Date(now.getTime() - 150_000),
        live: true,
    });
    plans.push({
        start: new Date(now.getTime() - 5 * 3600_000),
        tester: TESTERS[2],
        profile: refs.profiles[2 % refs.profiles.length],
        stopAt: new Date(now.getTime() - 3.2 * 3600_000),
        live: true,
    });
    plans.push({ start: new Date(now.getTime() - 20 * 60_000), tester: TESTERS[5], profile: pick(refs.profiles), stopAt: now, pending: true });
    return plans;
}

/** Advances the clock by one test cycle, respecting shifts (08:30–18:00, Mon–Sat) unless live. */
function nextTime(t: Date, tester: Tester, live: boolean): Date {
    let ms = t.getTime() + tester.cycle * between(0.55, 1.7) * 1000;
    if (chance(0.012)) ms += between(5, 25) * 60_000; // short break
    const next = new Date(ms);
    if (live) return next;
    if (next.getHours() >= 18) {
        const d = new Date(next.getFullYear(), next.getMonth(), next.getDate() + 1, 8, Math.floor(between(30, 60)));
        if (d.getDay() === 0) d.setDate(d.getDate() + 1);
        return d;
    }
    if (next.getHours() === 13 && next.getMinutes() < 2 && chance(0.6)) {
        return new Date(next.getTime() + between(30, 45) * 60_000); // lunch
    }
    return next;
}

async function seedSession(ds: DataSource, svc: BatchFiberTestingService, refs: Refs, plan: PlannedSession, index: number) {
    const code = String(index + 1).padStart(4, '0');
    const batchName = `${DEMO_PREFIX}26-B${code}`;
    const drum = `${DEMO_PREFIX}DRM-${code}`;
    const customerId = refs.customerIds.length ? pick(refs.customerIds) : null;
    const created = sqlTime(new Date(plan.start.getTime() - between(5, 30) * 60_000));

    const batch = await ds.query(
        `INSERT INTO batches (plant_id, customer_id, batch_name, drum_number, fiber_type, status, created_at, modified_at)
        VALUES (?, ?, ?, ?, 'SM', 1, ?, ?)`,
        [refs.plantId, customerId, batchName, drum, created, created],
    );
    const session = await ds.query(
        `INSERT INTO batch_cable_profiles (plant_id, batch_id, batch_name, cable_type_id, cable_profile_id, otdr_device_id,
            otdr_length_km, operator_id, customer_id, sfg_stage_id, drum_number, fiber_type, status, deleted, created_at, modified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Single Mode', 0, 0, ?, ?)`,
        [
            refs.plantId,
            batch.insertId,
            batchName,
            plan.profile.cable_type_id,
            plan.profile.id,
            refs.otdrIds.length ? pick(refs.otdrIds) : null,
            Math.round(between(2, 12) * 10) / 10,
            plan.tester.id!,
            customerId,
            refs.stageId,
            drum,
            created,
            created,
        ],
    );
    const sessionId: number = session.insertId;

    // Same fiber matrix (colours / ribbons / tubes) the app builds for a real session.
    const matrix = await svc.buildFiberTestingMatrix(sessionId);

    type FiberState = { attempts: number; last: Map<number, number>; lastAt: Date | null };
    const fibers: FiberState[] = matrix.map(() => ({ attempts: 0, last: new Map(), lastAt: null }));
    type Ev = { fiber: number; attempt: number; at: Date; testerId: number; values: Map<number, number> };
    const events: Ev[] = [];

    if (!plan.pending) {
        let t = new Date(plan.start);
        let tester = plan.tester;
        let lastDay = t.getDate();
        for (let f = 0; f < matrix.length && t < plan.stopAt; f++) {
            const failNm = chance(tester.failRate) ? failingWavelength() : null;
            let attemptFails = failNm !== null;
            for (let attempt = 1; attempt <= 3 && t < plan.stopAt; attempt++) {
                const values = new Map<number, number>();
                for (const nm of WAVELENGTHS) {
                    values.set(nm, reading(plan.profile.limits.get(nm)!, attemptFails && nm === failNm));
                }
                events.push({ fiber: f, attempt, at: t, testerId: tester.id!, values });
                fibers[f] = { attempts: attempt, last: values, lastAt: t };
                t = nextTime(t, tester, !!plan.live);
                // A fiber out of range is usually re-cleaned and retested straight away.
                if (!attemptFails || !chance(0.8)) break;
                attemptFails = chance(0.2);
            }
            // Multi-day sessions are sometimes picked up by another tester on the next shift.
            if (t.getDate() !== lastDay) {
                lastDay = t.getDate();
                if (chance(0.3)) tester = pick(TESTERS);
            }
        }
    }

    const fiberRows: SqlValue[][] = matrix.map((m, i) => {
        const state = fibers[i];
        const readings = WAVELENGTHS.map((nm) => ({
            wavelength_nm: String(nm),
            measured_value: state.last.has(nm) ? state.last.get(nm)!.toFixed(3) : '',
        }));
        const at = sqlTime(state.lastAt ?? new Date(plan.start.getTime() - 60_000));
        return [
            sessionId,
            m.fiber_number,
            state.attempts,
            m.attribute1_name || null,
            m.attribute1_value || null,
            m.attribute2_name || null,
            m.attribute2_value || null,
            m.attribute3_name || null,
            m.attribute3_value || null,
            JSON.stringify(readings),
            1,
            created,
            at,
        ];
    });
    await bulkInsert(
        ds,
        'batch_fiber_testing',
        [
            'batch_cable_profile_id',
            'fiber_number',
            'testing_counter',
            'attribute1_name',
            'attribute1_value',
            'attribute2_name',
            'attribute2_value',
            'attribute3_name',
            'attribute3_value',
            'fiber_wavelengths',
            'status',
            'created_at',
            'modified_at',
        ],
        fiberRows,
    );
    const fiberIds: { id: number }[] = await ds.query(
        `SELECT id FROM batch_fiber_testing WHERE batch_cable_profile_id = ? ORDER BY fiber_number, id`,
        [sessionId],
    );

    await bulkInsert(
        ds,
        'fiber_test_events',
        [
            'batch_fiber_testing_id',
            'batch_cable_profile_id',
            'tested_by_id',
            'fiber_number',
            'attempt',
            'result',
            'wavelengths_tested',
            'wavelengths_out_of_range',
            'is_backfilled',
            'tested_at',
        ],
        events.map((e) => {
            const out = WAVELENGTHS.filter((nm) => {
                const l = plan.profile.limits.get(nm)!;
                const v = e.values.get(nm)!;
                return v < l.min! || v > l.max!;
            }).length;
            return [
                fiberIds[e.fiber].id,
                sessionId,
                e.testerId,
                matrix[e.fiber].fiber_number,
                e.attempt,
                out > 0 ? 'FAIL' : 'PASS',
                WAVELENGTHS.length,
                out,
                0,
                sqlTime(e.at),
            ];
        }),
    );

    // Events were inserted in order, so ids ascend in the same order.
    const eventIds: { id: number }[] = await ds.query(
        `SELECT id FROM fiber_test_events WHERE batch_cable_profile_id = ? ORDER BY id`,
        [sessionId],
    );
    await bulkInsert(
        ds,
        'fiber_test_event_readings',
        ['event_id', 'wavelength_nm', 'measured_value', 'min_limit', 'max_limit', 'in_range'],
        events.flatMap((e, i) =>
            WAVELENGTHS.map((nm) => {
                const l = plan.profile.limits.get(nm)!;
                const v = e.values.get(nm)!;
                return [eventIds[i].id, nm, v, l.min, l.max, v >= l.min! && v <= l.max! ? 1 : 0];
            }),
        ),
        1000,
    );

    const tested = fibers.filter((f) => f.attempts > 0).length;
    const status = tested === 0 ? 0 : tested === matrix.length ? 2 : 1;
    const lastAt = events.length ? sqlTime(events[events.length - 1].at) : created;
    await ds.query(`UPDATE batch_cable_profiles SET status = ?, modified_at = ? WHERE id = ?`, [status, lastAt, sessionId]);
    await ds.query(`UPDATE batches SET modified_at = ? WHERE id = ?`, [lastAt, batch.insertId]);

    return { events: events.length, fibers: matrix.length, tested, status };
}

async function seed(ds: DataSource) {
    await clean(ds);
    const refs = await loadRefs(ds);
    await createTesters(ds, refs);
    console.log(`Created ${TESTERS.length} demo testers (password ${DEMO_PASSWORD}).`);

    const svc = new BatchFiberTestingService(
        ds.getRepository(BatchCableProfile),
        ds.getRepository(BatchFiberTesting),
        ds,
    );
    const plans = planSessions(refs, new Date());
    let totalEvents = 0;
    for (let i = 0; i < plans.length; i++) {
        const r = await seedSession(ds, svc, refs, plans[i], i);
        totalEvents += r.events;
        const label = ['pending', 'in progress', 'completed'][r.status];
        console.log(
            `  [${i + 1}/${plans.length}] ${plans[i].start.toDateString()} ${plans[i].profile.name}: ` +
            `${r.tested}/${r.fibers} fibers, ${r.events} tests (${label})`,
        );
    }
    console.log(`Seeded ${plans.length} demo sessions with ${totalEvents} fiber tests.`);
}

// ---------------------------------------------------------------- live simulation (through the real API)

async function live(ds: DataSource, minutes: number) {
    const sessions: { id: number; operator_id: number; cable_profile_id: number }[] = await ds.query(
        `SELECT id, operator_id, cable_profile_id FROM batch_cable_profiles
        WHERE batch_name LIKE ? AND deleted = 0 AND status IN (0, 1) ORDER BY modified_at DESC LIMIT 3`,
        [`${DEMO_PREFIX}%`],
    );
    if (!sessions.length) throw new Error('No open demo sessions — run `npm run seed:demo` first.');

    const users: { id: number; email: string; role_id: number; plant_id: number }[] = await ds.query(
        `SELECT id, email, role_id, plant_id FROM users WHERE email LIKE ?`,
        [`%@${DEMO_DOMAIN}`],
    );
    const jwt = new JwtService({ secret: process.env.JWT_SECRET });
    const tokenFor = (userId: number) => {
        const u = users.find((x) => x.id === userId) ?? users[0];
        return jwt.sign({ sub: u.id, email: u.email, role_id: u.role_id, plant_id: u.plant_id }, { expiresIn: '2h' });
    };
    const limitsBySession = new Map<number, Map<number, WavelengthLimit>>();
    for (const s of sessions) {
        limitsBySession.set(
            s.id,
            buildWavelengthLimits(
                await ds.getRepository(CableProfileWavelengthConfig).find({
                    where: { cable_profile: { id: s.cable_profile_id } },
                    relations: { cable_wavelength: true },
                }),
            ),
        );
    }

    const api = `http://localhost:${process.env.APP_PORT ?? 3000}`;
    try {
        await fetch(api, { signal: AbortSignal.timeout(5000) });
    } catch {
        throw new Error(`The API is not reachable at ${api}. Start it first (npm run start:dev), then re-run this command.`);
    }
    const endAt = Date.now() + minutes * 60_000;
    console.log(`Submitting demo tests to ${api} for ${minutes} min on sessions ${sessions.map((s) => s.id).join(', ')} (Ctrl+C to stop)...`);

    let sent = 0;
    while (Date.now() < endAt) {
        const s = pick(sessions);
        const [fiber] = await ds.query(
            `SELECT id, fiber_number FROM batch_fiber_testing
            WHERE batch_cable_profile_id = ? AND testing_counter = 0 ORDER BY fiber_number LIMIT 1`,
            [s.id],
        );
        if (!fiber) {
            sessions.splice(sessions.indexOf(s), 1);
            if (!sessions.length) break;
            continue;
        }
        const limits = limitsBySession.get(s.id)!;
        const failNm = chance(0.05) ? failingWavelength() : null;
        const body = {
            fiber_wavelengths: WAVELENGTHS.map((nm) => ({
                wavelength_nm: String(nm),
                measured_value: reading(limits.get(nm)!, nm === failNm).toFixed(3),
            })),
        };
        const res = await fetch(`${api}/batch-fiber-testing/${fiber.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenFor(s.operator_id)}` },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`API returned ${res.status}: ${await res.text()}`);
        sent++;
        console.log(`  session ${s.id} fiber ${fiber.fiber_number}${failNm ? ` (out of range at ${failNm} nm)` : ''}`);
        await new Promise((r) => setTimeout(r, between(6, 14) * 1000));
    }
    console.log(`Sent ${sent} live tests.`);
}

// ---------------------------------------------------------------- entry

async function main() {
    const args = process.argv.slice(2);
    const ds = createDataSource();
    await ds.initialize();
    try {
        if (args.includes('--clean')) await clean(ds);
        else if (args.includes('--live')) {
            const minutes = Number(args[args.indexOf('--live') + 1]) || 30;
            await live(ds, minutes);
        } else await seed(ds);
    } finally {
        await ds.destroy();
    }
}

main().catch((error) => {
    console.error(error instanceof Error && error.message.startsWith('The API is not reachable') ? error.message : error);
    process.exit(1);
});
