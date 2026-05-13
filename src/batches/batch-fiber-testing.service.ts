import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CableProfileWavelengthConfig } from '../cable-profiles/entities/cable-profile-wavelength-config.entity';
import { CableProfile } from '../cable-profiles/entities/cable-profile.entity';
import { BatchCableProfile } from './entities/batch-cable-profile.entity';
import { BatchFiberTesting, FiberWavelengthReading } from './entities/batch-fiber-testing.entity';
import { FiberTestingMatrixRowDto } from './dto/fiber-testing-matrix.dto';
import {
    FiberTestingSavedTableDto,
    FiberTestingTableHeaderDto,
} from './dto/fiber-testing-saved-table.dto';

import cableProfileColors = require('../cable-profiles/cable-profile-colors.data.json');

/** UI column titles for known `attribute*_name` values (matches fiber testing grid). */
const ATTRIBUTE_HEADER_LABELS: Record<string, string> = {
    tube: 'TUBE COLOR',
    strand: 'STRAND',
    ribbon: 'RIBBON NO',
    fiber: 'FIBER COLOR',
    'tube#': 'TUBE #',
};

function headerLabelForAttribute(name: string | null): string {
    if (!name?.trim()) return '';
    const k = name.trim().toLowerCase();
    return ATTRIBUTE_HEADER_LABELS[k] ?? name.trim().toUpperCase();
}

type TubeColors = { innerLayer: string[]; outerLayer: string[] };

type ColorProfileJson = {
    cable_type: string;
    profile_key_value: string;
    strandCount?: number;
    ribbonCount?: number;
    fiberCount?: number;
    tubeCount?: number;
    strandColors?: string[];
    fiberColors: string[];
    tubeColors?: TubeColors;
};

function findColorProfile(profileKeyValue: string): ColorProfileJson | undefined {
    const list = (cableProfileColors as { profiles: ColorProfileJson[] }).profiles;
    return list.find((p) => p.profile_key_value === profileKeyValue);
}

function tubeColorAtIndex(tubeIndex1Based: number, tubes: TubeColors): string {
    const { innerLayer, outerLayer } = tubes;
    if (tubeIndex1Based <= innerLayer.length) {
        return innerLayer[tubeIndex1Based - 1];
    }
    const outerIdx = tubeIndex1Based - innerLayer.length - 1;
    if (outerIdx < 0 || outerIdx >= outerLayer.length) {
        throw new BadRequestException(
            `Tube index ${tubeIndex1Based} is out of range for configured inner/outer tube color layers`,
        );
    }
    return outerLayer[outerIdx];
}

const SAVE_CHUNK_SIZE = 400;

@Injectable()
export class BatchFiberTestingService {
    constructor(
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
        @InjectRepository(BatchFiberTesting)
        private readonly batchFiberTestingRepository: Repository<BatchFiberTesting>,
        private readonly dataSource: DataSource,
    ) { }

    /** Saved rows, table headers, and batch cable profile (including nested cable profile). */
    async findSavedByBatchCableProfileId(batchCableProfileId: number): Promise<FiberTestingSavedTableDto> {
        const bcp = await this.batchCableProfileRepository.findOne({
            where: { id: batchCableProfileId, deleted: false },
            relations: {
                cable_profile: {
                    wavelength_configs: { cable_wavelength: true },
                    cable_type: true,
                },
            },
        });
        if (!bcp) {
            throw new NotFoundException(`Batch cable profile #${batchCableProfileId} not found`);
        }

        const cableProfile = bcp.cable_profile;
        if (!cableProfile) {
            throw new BadRequestException('Batch cable profile has no cable_profile linked');
        }

        const profileKey = cableProfile.profile_key_value;
        const colorProfile = findColorProfile(profileKey) ?? null;

        const rows = await this.batchFiberTestingRepository.find({
            where: { batch_cable_profile: { id: batchCableProfileId } },
            order: { fiber_number: 'ASC' },
        });

        const headers = rows[0]
            ? this.buildTableHeaders(rows[0])
            : this.buildTableHeadersFromCableProfile(bcp.cable_profile);

        return {
            headers,
            rows,
            colorProfile: colorProfile as Record<string, unknown> | null,
        };
    }

    /** Wavelength columns only when no saved fiber rows yet (same nm order as configs). */
    private buildTableHeadersFromCableProfile(profile: CableProfile | null): FiberTestingTableHeaderDto[] {
        const headers: FiberTestingTableHeaderDto[] = [{ key: 'fiber_number', label: 'FIBER NO' }];
        if (!profile?.wavelength_configs?.length) {
            return headers;
        }
        const configs = profile.wavelength_configs.filter((c) => c.cable_wavelength);
        const sorted = [...configs].sort(
            (a, b) => a.cable_wavelength.value - b.cable_wavelength.value,
        );
        for (const c of sorted) {
            const nm = String(c.cable_wavelength.value);
            headers.push({ key: `wavelength:${nm}`, label: `${nm}(nm)` });
        }
        return headers;
    }

    private buildTableHeaders(first: BatchFiberTesting | undefined): FiberTestingTableHeaderDto[] {
        const headers: FiberTestingTableHeaderDto[] = [{ key: 'fiber_number', label: 'FIBER NO' }];
        if (!first) {
            return headers;
        }

        const pushAttr = (name: string | null, key: 'attribute1_value' | 'attribute2_value' | 'attribute3_value') => {
            const label = headerLabelForAttribute(name);
            if (label) {
                headers.push({ key, label });
            }
        };
        pushAttr(first.attribute1_name, 'attribute1_value');
        pushAttr(first.attribute2_name, 'attribute2_value');
        pushAttr(first.attribute3_name, 'attribute3_value');

        const waves = [...(first.fiber_wavelengths ?? [])].sort(
            (a, b) => Number(a.wavelength_nm) - Number(b.wavelength_nm),
        );
        for (const w of waves) {
            headers.push({
                key: `wavelength:${w.wavelength_nm}`,
                label: `${w.wavelength_nm}(nm)`,
            });
        }
        return headers;
    }

    /**
     * Builds the fiber matrix and replaces all existing `batch_fiber_testing` rows for this batch cable profile.
     */
    async saveFiberTestingMatrix(batchCableProfileId: number): Promise<boolean> {
        const matrix = await this.buildFiberTestingMatrix(batchCableProfileId);

        const entities: BatchFiberTesting[] = matrix.map((row) => {
            const e = new BatchFiberTesting();
            e.batch_cable_profile = { id: batchCableProfileId } as BatchCableProfile;
            e.fiber_number = row.fiber_number;
            e.attribute1_name = row.attribute1_name || null;
            e.attribute1_value = row.attribute1_value || null;
            e.attribute2_name = row.attribute2_name || null;
            e.attribute2_value = row.attribute2_value || null;
            e.attribute3_name = row.attribute3_name || null;
            e.attribute3_value = row.attribute3_value || null;
            e.fiber_wavelengths = row.waveLengths.map((w) => ({ ...w }));
            e.status = true;
            return e;
        });

        await this.dataSource.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .delete()
                .from(BatchFiberTesting)
                .where('batch_cable_profile_id = :id', { id: batchCableProfileId })
                .execute();

            for (let i = 0; i < entities.length; i += SAVE_CHUNK_SIZE) {
                const chunk = entities.slice(i, i + SAVE_CHUNK_SIZE);
                await manager.save(BatchFiberTesting, chunk);
            }
        });

        return true;
    }

    /**
     * Builds the full strand × ribbon × fiber (or tube layouts) matrix with empty measurements,
     * using cable-profile-colors.data.json for coloring rules and wavelength_configs for λ list.
     */
    async buildFiberTestingMatrix(batchCableProfileId: number): Promise<FiberTestingMatrixRowDto[]> {
        const bcp = await this.batchCableProfileRepository.findOne({
            where: { id: batchCableProfileId },
            relations: {
                cable_profile: {
                    wavelength_configs: { cable_wavelength: true },
                },
            },
        });
        if (!bcp) {
            throw new NotFoundException(`Batch cable profile #${batchCableProfileId} not found`);
        }
        const cableProfile = bcp.cable_profile;
        if (!cableProfile) {
            throw new BadRequestException('Batch cable profile has no cable_profile linked');
        }

        const profileKey = cableProfile.profile_key_value;
        const colorProfile = findColorProfile(profileKey);
        if (!colorProfile) {
            throw new BadRequestException(
                `No color definition in cable-profile-colors.data.json for profile_key_value "${profileKey}"`,
            );
        }

        const waveLengths = this.buildWaveLengthsFromConfigs(cableProfile.wavelength_configs ?? []);

        const cableType = colorProfile.cable_type;
        if (cableType === 'IBR') {
            if (
                colorProfile.strandCount == null ||
                colorProfile.ribbonCount == null ||
                colorProfile.fiberCount == null ||
                !colorProfile.strandColors?.length ||
                !colorProfile.fiberColors?.length
            ) {
                throw new BadRequestException(
                    'IBR color profile must define strandCount, ribbonCount, fiberCount, strandColors, and fiberColors',
                );
            }
            return this.generateIbrRows(
                colorProfile as ColorProfileJson & {
                    strandCount: number;
                    ribbonCount: number;
                    fiberCount: number;
                    strandColors: string[];
                    fiberColors: string[];
                },
                waveLengths,
            );
        }
        if (cableType === 'FLAT_RIBBON') {
            return this.generateFlatRibbonRows(colorProfile, waveLengths);
        }
        if (cableType === 'MULTI_TUBE') {
            return this.generateMultiTubeRows(colorProfile, waveLengths);
        }

        throw new BadRequestException(`Unsupported cable_type "${cableType}" in color profile`);
    }

    private buildWaveLengthsFromConfigs(configs: CableProfileWavelengthConfig[]): FiberWavelengthReading[] {
        const withW = configs.filter((c) => c.cable_wavelength);
        const sorted = [...withW].sort(
            (a, b) => a.cable_wavelength.value - b.cable_wavelength.value,
        );
        return sorted.map((c) => ({
            wavelength_nm: String(c.cable_wavelength.value),
            measured_value: '',
        }));
    }

    private generateIbrRows(
        p: ColorProfileJson & {
            strandCount: number;
            ribbonCount: number;
            fiberCount: number;
            strandColors: string[];
            fiberColors: string[];
        },
        waveLengths: FiberWavelengthReading[],
    ): FiberTestingMatrixRowDto[] {
        const { strandCount, ribbonCount, fiberCount, strandColors, fiberColors } = p;
        const rows: FiberTestingMatrixRowDto[] = [];
        let fiber_number = 1;
        for (let strand = 1; strand <= strandCount; strand++) {
            const strandColor = strandColors[(strand - 1) % strandColors.length];
            for (let ribbon = 1; ribbon <= ribbonCount; ribbon++) {
                for (let fiber = 1; fiber <= fiberCount; fiber++) {
                    const fiberColor = fiberColors[(fiber - 1) % fiberColors.length];
                    rows.push({
                        fiber_number: fiber_number++,
                        attribute1_name: 'Strand',
                        attribute1_value: strandColor,
                        attribute2_name: 'Ribbon',
                        attribute2_value: `Ribbon${ribbon}`,
                        attribute3_name: 'Fiber',
                        attribute3_value: fiberColor,
                        waveLengths: waveLengths.map((w) => ({ ...w })),
                    });
                }
            }
        }
        return rows;
    }

    private generateFlatRibbonRows(
        p: ColorProfileJson,
        waveLengths: FiberWavelengthReading[],
    ): FiberTestingMatrixRowDto[] {
        const ribbonCount = p.ribbonCount;
        const fiberCount = p.fiberCount;
        const fiberColors = p.fiberColors;
        if (ribbonCount == null || fiberCount == null) {
            throw new BadRequestException('FLAT_RIBBON profile must define ribbonCount and fiberCount');
        }
        const rows: FiberTestingMatrixRowDto[] = [];
        let fiber_number = 1;
        for (let ribbon = 1; ribbon <= ribbonCount; ribbon++) {
            for (let fiber = 1; fiber <= fiberCount; fiber++) {
                const fiberColor = fiberColors[(fiber - 1) % fiberColors.length];
                rows.push({
                    fiber_number: fiber_number++,
                    attribute1_name: 'Ribbon',
                    attribute1_value: `Ribbon${ribbon}`,
                    attribute2_name: 'Fiber',
                    attribute2_value: fiberColor,
                    attribute3_name: '',
                    attribute3_value: '',
                    waveLengths: waveLengths.map((w) => ({ ...w })),
                });
            }
        }
        return rows;
    }

    private generateMultiTubeRows(
        p: ColorProfileJson,
        waveLengths: FiberWavelengthReading[],
    ): FiberTestingMatrixRowDto[] {
        const tubeCount = p.tubeCount;
        const fiberCount = p.fiberCount;
        const fiberColors = p.fiberColors;
        const tubes = p.tubeColors;
        if (tubeCount == null || fiberCount == null || !tubes) {
            throw new BadRequestException(
                'MULTI_TUBE profile must define tubeCount, fiberCount, and tubeColors',
            );
        }
        const rows: FiberTestingMatrixRowDto[] = [];
        let fiber_number = 1;
        for (let tube = 1; tube <= tubeCount; tube++) {
            const tubeColor = tubeColorAtIndex(tube, tubes);
            for (let fiber = 1; fiber <= fiberCount; fiber++) {
                const fiberColor = fiberColors[(fiber - 1) % fiberColors.length];
                rows.push({
                    fiber_number: fiber_number++,
                    attribute1_name: 'Tube',
                    attribute1_value: tubeColor,
                    attribute2_name: 'Fiber',
                    attribute2_value: fiberColor,
                    attribute3_name: '',
                    attribute3_value: '',
                    //attribute3_name: 'Tube#',
                    //attribute3_value: String(tube),
                    waveLengths: waveLengths.map((w) => ({ ...w })),
                });
            }
        }
        return rows;
    }
}
