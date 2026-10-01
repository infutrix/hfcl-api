import { CableProfileWavelengthConfig } from '../cable-profiles/entities/cable-profile-wavelength-config.entity';
import { FiberWavelengthReading } from './entities/batch-fiber-testing.entity';

/** Attenuation limits for one wavelength of a cable profile. */
export interface WavelengthLimit {
    wavelength_nm: number;
    min: number | null;
    max: number | null;
    unit: string;
}

/** `no_limit` = measured but the profile defines no min/max for that wavelength. */
export type ReadingStatus = 'in_range' | 'out_of_range' | 'no_limit' | 'not_tested';

/** `null` = nothing measured yet. */
export type FiberResult = 'PASS' | 'FAIL' | 'NO_LIMIT' | null;

export interface EvaluatedReading {
    wavelength_nm: number;
    value: number | null;
    min: number | null;
    max: number | null;
    status: ReadingStatus;
}

export interface EvaluatedFiber {
    readings: EvaluatedReading[];
    tested: number;
    out_of_range: number;
    result: FiberResult;
}

function toNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    if (!text) return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
}

export function parseMeasuredValue(value: string | null | undefined): number | null {
    return toNumber(value);
}

/**
 * Per-profile limits keyed by nm. Profile config limits win; the global wavelength's
 * limits are the fallback when the profile leaves them empty.
 */
export function buildWavelengthLimits(configs: CableProfileWavelengthConfig[]): Map<number, WavelengthLimit> {
    const limits = new Map<number, WavelengthLimit>();
    for (const c of configs) {
        const nm = toNumber(c.cable_wavelength?.value ?? c.wavelength);
        if (nm === null) continue;
        limits.set(nm, {
            wavelength_nm: nm,
            min: toNumber(c.min_attenuation) ?? toNumber(c.cable_wavelength?.min_attenuation),
            max: toNumber(c.max_attenuation) ?? toNumber(c.cable_wavelength?.max_attenuation),
            unit: c.unit || c.cable_wavelength?.unit || 'dB/km',
        });
    }
    return limits;
}

export function evaluateReading(value: number | null, limit: WavelengthLimit | undefined): ReadingStatus {
    if (value === null) return 'not_tested';
    if (!limit || (limit.min === null && limit.max === null)) return 'no_limit';
    const aboveMin = limit.min === null || value >= limit.min;
    const belowMax = limit.max === null || value <= limit.max;
    return aboveMin && belowMax ? 'in_range' : 'out_of_range';
}

/** Evaluates every reading of one fiber; a fiber fails if any wavelength is out of range. */
export function evaluateFiber(
    readings: FiberWavelengthReading[] | null | undefined,
    limits: Map<number, WavelengthLimit>,
): EvaluatedFiber {
    const evaluated: EvaluatedReading[] = [];
    let tested = 0;
    let outOfRange = 0;
    let inRange = 0;

    for (const r of readings ?? []) {
        const nm = toNumber(r.wavelength_nm);
        if (nm === null) continue;
        const value = parseMeasuredValue(r.measured_value);
        const limit = limits.get(nm);
        const status = evaluateReading(value, limit);
        if (status !== 'not_tested') tested++;
        if (status === 'out_of_range') outOfRange++;
        if (status === 'in_range') inRange++;
        evaluated.push({
            wavelength_nm: nm,
            value,
            min: limit?.min ?? null,
            max: limit?.max ?? null,
            status,
        });
    }

    let result: FiberResult = null;
    if (outOfRange > 0) result = 'FAIL';
    else if (inRange > 0) result = 'PASS';
    else if (tested > 0) result = 'NO_LIMIT';

    return { readings: evaluated, tested, out_of_range: outOfRange, result };
}
