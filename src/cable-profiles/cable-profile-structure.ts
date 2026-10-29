import cableProfileColors = require('./cable-profile-colors.data.json');

/** Fiber layouts the matrix generator and the AI color models understand. */
export const CABLE_LAYOUTS = ['IBR', 'FLAT_RIBBON', 'MULTI_TUBE'] as const;
export type CableLayout = (typeof CABLE_LAYOUTS)[number];

/** Keys of each `physical_dimensions` row; row 0 holds the minimums, row 1 the maximums. */
export const PHYSICAL_DIMENSION_KEYS = ['ID', 'OD', 'FRP', 'Inner', 'Outer', 'Cable dia'] as const;

export interface PhysicalDimensionField {
    key: string;
    value: number;
}

export interface TubeColors {
    innerLayer: string[];
    outerLayer: string[];
}

/** What an admin configures for a custom profile (stored in `cable_profiles.structure`). */
export interface CableProfileStructure {
    cable_type: CableLayout;
    strandCount?: number;
    ribbonCount?: number;
    tubeCount?: number;
    fiberCount: number;
    strandColors?: string[];
    fiberColors: string[];
    tubeColors?: TubeColors;
    physical_dimensions: PhysicalDimensionField[][];
}

/**
 * Resolved color profile handed to clients as `colorProfile`: same shape as an entry of
 * cable-profile-colors.data.json, whether it came from that file or from the DB.
 */
export interface ColorProfile extends CableProfileStructure {
    profile_display_name: string;
    profile_key_value: string;
    totalFibers: number;
}

const MAX_COUNT = 144;
const MAX_TOTAL_FIBERS = 20_000;
const MAX_COLOR_LENGTH = 50;

const templates = (cableProfileColors as { profiles: ColorProfile[] }).profiles;

/** Built-in templates from cable-profile-colors.data.json. */
export function listColorTemplates(): ColorProfile[] {
    return templates;
}

export function findColorTemplate(profileKeyValue: string): ColorProfile | undefined {
    return templates.find((p) => p.profile_key_value === profileKeyValue);
}

export function totalFibersOf(s: Pick<CableProfileStructure, 'cable_type' | 'strandCount' | 'ribbonCount' | 'tubeCount' | 'fiberCount'>): number {
    switch (s.cable_type) {
        case 'IBR':
            return (s.strandCount ?? 0) * (s.ribbonCount ?? 0) * s.fiberCount;
        case 'FLAT_RIBBON':
            return (s.ribbonCount ?? 0) * s.fiberCount;
        case 'MULTI_TUBE':
            return (s.tubeCount ?? 0) * s.fiberCount;
    }
}

/**
 * The profile's own structure when it has one, otherwise the built-in template with the same
 * `profile_key_value` (profiles created before custom structures existed), otherwise null.
 */
export function resolveColorProfile(profile: {
    cable_profile_name: string;
    profile_key_value: string;
    structure?: CableProfileStructure | null;
}): ColorProfile | null {
    if (profile.structure) {
        return {
            ...profile.structure,
            profile_display_name: profile.cable_profile_name,
            profile_key_value: profile.profile_key_value,
            totalFibers: totalFibersOf(profile.structure),
        };
    }
    return findColorTemplate(profile.profile_key_value) ?? null;
}

function checkCount(errors: string[], label: string, value: number | undefined): value is number {
    if (value === undefined || value === null) {
        errors.push(`${label} is required`);
        return false;
    }
    if (!Number.isInteger(value) || value < 1 || value > MAX_COUNT) {
        errors.push(`${label} must be a whole number between 1 and ${MAX_COUNT}`);
        return false;
    }
    return true;
}

function checkColors(errors: string[], label: string, colors: string[] | undefined, expected: number | null): void {
    if (!Array.isArray(colors)) {
        errors.push(`${label} are required`);
        return;
    }
    if (colors.some((c) => typeof c !== 'string' || !c.trim() || c.trim().length > MAX_COLOR_LENGTH)) {
        errors.push(`${label} must be non-empty names of at most ${MAX_COLOR_LENGTH} characters`);
        return;
    }
    if (expected !== null && colors.length !== expected) {
        errors.push(`${label}: expected ${expected} colors but got ${colors.length}`);
    }
    // Fibers are matched to rows by color, so a repeated color would make two rows indistinguishable.
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const c of colors) {
        const k = c.trim().toLowerCase();
        if (seen.has(k)) dupes.add(c.trim());
        seen.add(k);
    }
    if (dupes.size) {
        errors.push(`${label} must be unique (repeated: ${[...dupes].join(', ')})`);
    }
}

function checkPhysicalDimensions(errors: string[], rows: unknown): void {
    if (!Array.isArray(rows) || rows.length !== 2 || !rows.every(Array.isArray)) {
        errors.push('physical_dimensions must have two rows: minimums and maximums');
        return;
    }
    const [minRow, maxRow] = (rows as PhysicalDimensionField[][]).map(
        (row) => new Map(row.map((f) => [f?.key, f?.value])),
    );
    for (const key of PHYSICAL_DIMENSION_KEYS) {
        const min = minRow.get(key);
        const max = maxRow.get(key);
        if (typeof min !== 'number' || typeof max !== 'number' || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) {
            errors.push(`Physical dimension "${key}" needs a min and max of 0 or more`);
        } else if (min > max) {
            errors.push(`Physical dimension "${key}": min (${min}) is greater than max (${max})`);
        }
    }
}

/** Every reason the structure can't be used to generate a fiber matrix; empty when valid. */
export function validateStructure(s: CableProfileStructure): string[] {
    const errors: string[] = [];
    if (!CABLE_LAYOUTS.includes(s.cable_type)) {
        errors.push(`cable_type must be one of ${CABLE_LAYOUTS.join(', ')}`);
        return errors;
    }

    const fiberCountOk = checkCount(errors, 'fiberCount', s.fiberCount);
    checkColors(errors, 'Fiber colors', s.fiberColors, fiberCountOk ? s.fiberCount : null);

    if (s.cable_type === 'IBR') {
        const strandOk = checkCount(errors, 'strandCount', s.strandCount);
        checkCount(errors, 'ribbonCount', s.ribbonCount);
        checkColors(errors, 'Strand colors', s.strandColors, strandOk ? s.strandCount! : null);
    } else if (s.cable_type === 'FLAT_RIBBON') {
        checkCount(errors, 'ribbonCount', s.ribbonCount);
    } else {
        const tubeOk = checkCount(errors, 'tubeCount', s.tubeCount);
        const inner = s.tubeColors?.innerLayer;
        const outer = s.tubeColors?.outerLayer ?? [];
        if (!inner?.length) {
            errors.push('Tube colors need at least one inner-layer color');
        } else {
            checkColors(errors, 'Inner-layer tube colors', inner, null);
            checkColors(errors, 'Outer-layer tube colors', outer, null);
            if (tubeOk && inner.length + outer.length !== s.tubeCount) {
                errors.push(
                    `Tube colors: inner (${inner.length}) + outer (${outer.length}) layers must equal tubeCount (${s.tubeCount})`,
                );
            }
        }
    }

    checkPhysicalDimensions(errors, s.physical_dimensions);

    if (!errors.length && totalFibersOf(s) > MAX_TOTAL_FIBERS) {
        errors.push(`A profile can have at most ${MAX_TOTAL_FIBERS} fibers (this one has ${totalFibersOf(s)})`);
    }
    return errors;
}

/** Keeps only the fields that belong to the layout, trimmed, so stale counts never leak into the matrix. */
export function normalizeStructure(s: CableProfileStructure): CableProfileStructure {
    const trim = (list: string[] | undefined) => (list ?? []).map((c) => c.trim());
    const physical_dimensions = s.physical_dimensions.map((row) =>
        PHYSICAL_DIMENSION_KEYS.map((key) => ({ key, value: row.find((f) => f.key === key)!.value })),
    );
    const base = { cable_type: s.cable_type, fiberCount: s.fiberCount, fiberColors: trim(s.fiberColors), physical_dimensions };
    switch (s.cable_type) {
        case 'IBR':
            return { ...base, strandCount: s.strandCount, ribbonCount: s.ribbonCount, strandColors: trim(s.strandColors) };
        case 'FLAT_RIBBON':
            return { ...base, ribbonCount: s.ribbonCount };
        case 'MULTI_TUBE':
            return {
                ...base,
                tubeCount: s.tubeCount,
                tubeColors: { innerLayer: trim(s.tubeColors?.innerLayer), outerLayer: trim(s.tubeColors?.outerLayer) },
            };
    }
}
