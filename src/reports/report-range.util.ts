import { BadRequestException } from '@nestjs/common';
import { ReportGranularity } from './dto/report-query.dto';

/**
 * All report boundaries are 'YYYY-MM-DD HH:mm:ss' strings in the API server's local time —
 * the same wall-clock form TypeORM (timezone: 'local') writes DATETIME columns in — so
 * comparisons and DATE_FORMAT buckets line up regardless of the DB session time zone.
 */
export interface ResolvedRange {
    fromDate: string;
    toDate: string;
    /** Inclusive lower bound. */
    from: string;
    /** Exclusive upper bound (day after `toDate`, midnight). */
    toExclusive: string;
    days: number;
    granularity: ReportGranularity;
}

const MAX_RANGE_DAYS = 3 * 366;
const DAY_MS = 86_400_000;

function parseDay(value: string, field: string): Date {
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
        throw new BadRequestException(`${field} is not a valid calendar date`);
    }
    return date;
}

function formatDay(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

/** Node-local wall-clock timestamp, matching how DATETIME values are stored. */
export function toLocalSqlDateTime(date: Date): string {
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

function autoGranularity(days: number): ReportGranularity {
    if (days <= 2) return 'hour';
    if (days <= 62) return 'day';
    if (days <= 200) return 'week';
    return 'month';
}

export function resolveRange(from: string, to: string, requested?: ReportGranularity): ResolvedRange {
    const start = parseDay(from, 'from');
    const end = parseDay(to, 'to');
    if (end < start) {
        throw new BadRequestException('to must be on or after from');
    }
    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
    if (days > MAX_RANGE_DAYS) {
        throw new BadRequestException('Date range is too long (maximum 3 years)');
    }

    // Keep bucket counts chart-friendly even when a fine granularity is requested.
    let granularity = requested ?? autoGranularity(days);
    if (granularity === 'hour' && days > 7) granularity = 'day';
    if (granularity === 'day' && days > 400) granularity = 'month';

    return {
        fromDate: from,
        toDate: to,
        from: `${from} 00:00:00`,
        toExclusive: `${formatDay(new Date(end.getTime() + DAY_MS))} 00:00:00`,
        days,
        granularity,
    };
}

/** The range of equal length immediately before `range` (for period-over-period deltas). */
export function previousRange(range: ResolvedRange): ResolvedRange {
    const start = parseDay(range.fromDate, 'from');
    const prevEnd = new Date(start.getTime() - DAY_MS);
    const prevStart = new Date(start.getTime() - range.days * DAY_MS);
    return resolveRange(formatDay(prevStart), formatDay(prevEnd), range.granularity);
}

/** SQL expression producing the bucket key for `column`; keys match `bucketKeys`. */
export function bucketSql(granularity: ReportGranularity, column: string): string {
    switch (granularity) {
        case 'hour':
            return `DATE_FORMAT(${column}, '%Y-%m-%d %H:00')`;
        case 'day':
            return `DATE_FORMAT(${column}, '%Y-%m-%d')`;
        case 'week':
            // Monday of the ISO week.
            return `DATE_FORMAT(DATE_SUB(DATE(${column}), INTERVAL WEEKDAY(${column}) DAY), '%Y-%m-%d')`;
        case 'month':
            return `DATE_FORMAT(${column}, '%Y-%m')`;
    }
}

/** Every bucket key in the range, so trends have explicit zeros instead of gaps. */
export function bucketKeys(range: ResolvedRange): string[] {
    const start = parseDay(range.fromDate, 'from');
    const end = parseDay(range.toDate, 'to');
    const keys: string[] = [];

    if (range.granularity === 'hour') {
        for (let d = start; d <= end; d = new Date(d.getTime() + DAY_MS)) {
            for (let h = 0; h < 24; h++) keys.push(`${formatDay(d)} ${pad(h)}:00`);
        }
    } else if (range.granularity === 'day') {
        for (let d = start; d <= end; d = new Date(d.getTime() + DAY_MS)) keys.push(formatDay(d));
    } else if (range.granularity === 'week') {
        const mondayOffset = (start.getUTCDay() + 6) % 7;
        for (let d = new Date(start.getTime() - mondayOffset * DAY_MS); d <= end; d = new Date(d.getTime() + 7 * DAY_MS)) {
            keys.push(formatDay(d));
        }
    } else {
        for (
            let d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
            d <= end;
            d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
        ) {
            keys.push(formatDay(d).slice(0, 7));
        }
    }
    return keys;
}
