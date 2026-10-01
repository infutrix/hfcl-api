import { BadRequestException } from '@nestjs/common';
import { bucketKeys, previousRange, resolveRange } from './report-range.util';

describe('report-range.util', () => {
    it('uses an exclusive next-day upper bound', () => {
        expect(resolveRange('2026-02-28', '2026-02-28')).toMatchObject({
            from: '2026-02-28 00:00:00',
            toExclusive: '2026-03-01 00:00:00',
            days: 1,
            granularity: 'hour',
        });
    });

    it('picks granularity from the range length and downgrades too-fine requests', () => {
        expect(resolveRange('2026-10-01', '2026-10-07').granularity).toBe('day');
        expect(resolveRange('2026-01-01', '2026-12-31').granularity).toBe('month');
        expect(resolveRange('2026-10-01', '2026-10-31', 'hour').granularity).toBe('day');
    });

    it('rejects reversed, invalid and overlong ranges', () => {
        expect(() => resolveRange('2026-10-07', '2026-10-01')).toThrow(BadRequestException);
        expect(() => resolveRange('2026-02-30', '2026-03-01')).toThrow(BadRequestException);
        expect(() => resolveRange('2020-01-01', '2026-01-01')).toThrow(BadRequestException);
    });

    it('generates one key per bucket in the SQL key format', () => {
        expect(bucketKeys(resolveRange('2026-10-01', '2026-10-01'))).toHaveLength(24);
        expect(bucketKeys(resolveRange('2026-10-01', '2026-10-01'))[13]).toBe('2026-10-01 13:00');
        expect(bucketKeys(resolveRange('2026-01-01', '2026-12-31'))).toEqual(
            Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, '0')}`),
        );
        // 2026-10-01 is a Thursday; weekly keys start on the Monday of that week.
        expect(bucketKeys(resolveRange('2026-10-01', '2026-10-20', 'week'))).toEqual([
            '2026-09-28',
            '2026-10-05',
            '2026-10-12',
            '2026-10-19',
        ]);
    });

    it('computes the equal-length previous period', () => {
        expect(previousRange(resolveRange('2026-10-08', '2026-10-14'))).toMatchObject({
            fromDate: '2026-10-01',
            toDate: '2026-10-07',
        });
    });
});
