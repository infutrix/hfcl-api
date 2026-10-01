import { CableProfileWavelengthConfig } from '../cable-profiles/entities/cable-profile-wavelength-config.entity';
import { buildWavelengthLimits, evaluateFiber, evaluateReading } from './wavelength-range.util';

function config(nm: number, min: number | null, max: number | null, fallback?: [number, number]) {
    return {
        wavelength: nm,
        min_attenuation: min,
        max_attenuation: max,
        unit: 'dB/km',
        cable_wavelength: {
            value: nm,
            min_attenuation: fallback?.[0] ?? null,
            max_attenuation: fallback?.[1] ?? null,
        },
    } as unknown as CableProfileWavelengthConfig;
}

describe('wavelength-range.util', () => {
    const limits = buildWavelengthLimits([
        config(1310, 0.3, 0.36),
        config(1550, null, null, [0.17, 0.22]),
        config(1625, null, null),
    ]);

    it('falls back to the global wavelength limits when the profile leaves them empty', () => {
        expect(limits.get(1550)).toMatchObject({ min: 0.17, max: 0.22 });
    });

    it('treats both limits as inclusive', () => {
        expect(evaluateReading(0.3, limits.get(1310))).toBe('in_range');
        expect(evaluateReading(0.36, limits.get(1310))).toBe('in_range');
        expect(evaluateReading(0.361, limits.get(1310))).toBe('out_of_range');
        expect(evaluateReading(0.29, limits.get(1310))).toBe('out_of_range');
    });

    it('distinguishes missing limits and missing readings', () => {
        expect(evaluateReading(0.25, limits.get(1625))).toBe('no_limit');
        expect(evaluateReading(0.25, undefined)).toBe('no_limit');
        expect(evaluateReading(null, limits.get(1310))).toBe('not_tested');
    });

    it('fails a fiber when any wavelength is out of range', () => {
        const fiber = evaluateFiber(
            [
                { wavelength_nm: '1310', measured_value: '0.33' },
                { wavelength_nm: '1550', measured_value: '0.25' },
                { wavelength_nm: '1625', measured_value: '' },
            ],
            limits,
        );
        expect(fiber).toMatchObject({ tested: 2, out_of_range: 1, result: 'FAIL' });
    });

    it('passes when all limited wavelengths are in range and reports untested fibers as null', () => {
        expect(evaluateFiber([{ wavelength_nm: '1310', measured_value: '0.31' }], limits).result).toBe('PASS');
        expect(evaluateFiber([{ wavelength_nm: '1625', measured_value: '0.31' }], limits).result).toBe('NO_LIMIT');
        expect(evaluateFiber([{ wavelength_nm: '1310', measured_value: ' ' }], limits).result).toBeNull();
        expect(evaluateFiber(null, limits).result).toBeNull();
    });
});
