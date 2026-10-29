import { ValidationPipe } from '@nestjs/common';
import { CreateCableProfileDto } from './dto/create-cable-profile.dto';
import {
    CableProfileStructure,
    listColorTemplates,
    normalizeStructure,
    resolveColorProfile,
    totalFibersOf,
    validateStructure,
} from './cable-profile-structure';

function dims(min: number, max: number) {
    const row = (v: number) => ['ID', 'OD', 'FRP', 'Inner', 'Outer', 'Cable dia'].map((key) => ({ key, value: v }));
    return [row(min), row(max)];
}

const ibr: CableProfileStructure = {
    cable_type: 'IBR',
    strandCount: 2,
    ribbonCount: 3,
    fiberCount: 4,
    strandColors: ['Blue', 'Orange'],
    fiberColors: ['Blue', 'Orange', 'Green', 'Brown'],
    physical_dimensions: dims(1, 2),
};

describe('cable-profile-structure', () => {
    it('accepts every built-in template, so prefilling from one always saves', () => {
        for (const template of listColorTemplates()) {
            expect({ key: template.profile_key_value, errors: validateStructure(template) }).toEqual({
                key: template.profile_key_value,
                errors: [],
            });
            expect(totalFibersOf(template)).toBe(template.totalFibers);
        }
    });

    it('accepts a valid custom IBR structure', () => {
        expect(validateStructure(ibr)).toEqual([]);
        expect(totalFibersOf(ibr)).toBe(24);
    });

    it('requires one unique color per fiber and per strand', () => {
        expect(validateStructure({ ...ibr, fiberColors: ['Blue', 'Orange', 'Green'] })).toContain(
            'Fiber colors: expected 4 colors but got 3',
        );
        expect(validateStructure({ ...ibr, strandColors: ['Blue', 'blue'] }).join()).toMatch(/must be unique/);
    });

    it('requires inner + outer tube layers to cover every tube', () => {
        const tubes: CableProfileStructure = {
            cable_type: 'MULTI_TUBE',
            tubeCount: 3,
            fiberCount: 1,
            fiberColors: ['Blue'],
            tubeColors: { innerLayer: ['Blue'], outerLayer: ['Orange'] },
            physical_dimensions: dims(1, 2),
        };
        expect(validateStructure(tubes).join()).toMatch(/must equal tubeCount \(3\)/);
        expect(validateStructure({ ...tubes, tubeColors: { innerLayer: ['Blue', 'Green'], outerLayer: ['Orange'] } })).toEqual([]);
    });

    it('rejects min dimensions above max and missing dimension rows', () => {
        expect(validateStructure({ ...ibr, physical_dimensions: dims(3, 2) }).join()).toMatch(/min \(3\) is greater than max \(2\)/);
        expect(validateStructure({ ...ibr, physical_dimensions: [] }).join()).toMatch(/two rows/);
    });

    it('drops fields that do not belong to the layout', () => {
        const flat = normalizeStructure({ ...ibr, cable_type: 'FLAT_RIBBON', tubeCount: 9 });
        expect(flat).not.toHaveProperty('strandCount');
        expect(flat).not.toHaveProperty('strandColors');
        expect(flat).not.toHaveProperty('tubeCount');
        expect(flat.ribbonCount).toBe(3);
    });

    it('prefers the stored structure over the built-in template', () => {
        const fromDb = resolveColorProfile({ cable_profile_name: 'Custom', profile_key_value: '6S_24R_12F', structure: ibr });
        expect(fromDb).toMatchObject({ profile_display_name: 'Custom', strandCount: 2, totalFibers: 24 });

        const fromTemplate = resolveColorProfile({ cable_profile_name: 'Old', profile_key_value: '6S_24R_12F', structure: null });
        expect(fromTemplate?.totalFibers).toBe(1728);

        expect(resolveColorProfile({ cable_profile_name: 'X', profile_key_value: 'UNKNOWN', structure: null })).toBeNull();
    });

    it('keeps the structure intact through the global validation pipe', async () => {
        // Same options as the global pipe in main.ts.
        const pipe = new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        });
        const tubes = listColorTemplates().find((t) => t.cable_type === 'MULTI_TUBE')!;
        const structure = {
            cable_type: tubes.cable_type,
            tubeCount: tubes.tubeCount,
            fiberCount: tubes.fiberCount,
            fiberColors: tubes.fiberColors,
            tubeColors: tubes.tubeColors,
            physical_dimensions: tubes.physical_dimensions,
        };
        const dto = (await pipe.transform(
            { cable_profile_name: 'Custom', cable_type_id: 1, profile_key_value: 'CUSTOM_1', structure },
            { type: 'body', metatype: CreateCableProfileDto },
        )) as CreateCableProfileDto;
        expect(JSON.parse(JSON.stringify(dto.structure))).toEqual(structure);
        expect(validateStructure(dto.structure!)).toEqual([]);
    });
});
