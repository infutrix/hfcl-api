import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { CableProfileWavelengthConfig } from '../cable-profiles/entities/cable-profile-wavelength-config.entity';
import { CableProfile } from '../cable-profiles/entities/cable-profile.entity';
import { BatchCableProfile, BatchCableProfileStatus } from './entities/batch-cable-profile.entity';
import { BatchFiberTesting, FiberWavelengthReading } from './entities/batch-fiber-testing.entity';
import { FiberTestingAiResponse } from './entities/fiber-testing-ai-response.entity';
import { FiberTestEvent } from './entities/fiber-test-event.entity';
import { User } from '../users/entities/user.entity';
import { buildWavelengthLimits } from './wavelength-range.util';
import { createFiberTestEvent } from './fiber-test-event.factory';
import { FiberTestingMatrixRowDto } from './dto/fiber-testing-matrix.dto';
import { UpdateBatchFiberTestingDto } from './dto/update-batch-fiber-testing.dto';
import {
    FiberTestingSavedTableDto,
    FiberTestingTableHeaderDto,
} from './dto/fiber-testing-saved-table.dto';
import { batchCableProfileDetailRelations } from './batch-cable-profile.relations';
import { FiberTestImageStorage, UploadedImage } from './fiber-test-image.storage';
import { ColorProfile as ColorProfileJson, resolveColorProfile, TubeColors } from '../cable-profiles/cable-profile-structure';

/** UI column titles for known `attribute*_name` values (matches fiber testing grid). */
const ATTRIBUTE_HEADER_LABELS: Record<string, string> = {
    tube: 'TUBE COLOR',
    strand: 'STRAND',
    ribbon: 'RIBBON',
    fiber: 'FIBER',
    'tube#': 'TUBE #',
    type: 'TYPE',
};

function headerLabelForAttribute(name: string | null): string {
    if (!name?.trim()) return '';
    const k = name.trim().toLowerCase();
    return ATTRIBUTE_HEADER_LABELS[k] ?? name.trim().toUpperCase();
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

function tubeTypeAtIndex(tubeIndex1Based: number, tubes: TubeColors): 'Inner' | 'Outer' {
    return tubeIndex1Based <= tubes.innerLayer.length ? 'Inner' : 'Outer';
}

const SAVE_CHUNK_SIZE = 400;
/** Attempts at writing a session's fiber grid before a deadlock is reported. */
const MATRIX_SAVE_ATTEMPTS = 3;

function isDeadlock(error: unknown): boolean {
    const code = (error as QueryFailedError & { driverError?: { code?: string } })?.driverError?.code;
    return error instanceof QueryFailedError && (code === 'ER_LOCK_DEADLOCK' || code === 'ER_LOCK_WAIT_TIMEOUT');
}

@Injectable()
export class BatchFiberTestingService {
    private readonly logger = new Logger(BatchFiberTestingService.name);

    constructor(
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
        @InjectRepository(BatchFiberTesting)
        private readonly batchFiberTestingRepository: Repository<BatchFiberTesting>,
        private readonly dataSource: DataSource,
        private readonly imageStorage: FiberTestImageStorage,
    ) { }

    /** Saved rows, table headers, and batch cable profile (including nested cable profile). */
    async findSavedByBatchCableProfileId(batchCableProfileId: number): Promise<FiberTestingSavedTableDto> {
        const bcp = await this.batchCableProfileRepository.findOne({
            where: { id: batchCableProfileId, deleted: false },
            relations: { ...batchCableProfileDetailRelations },
        });
        if (!bcp) {
            throw new NotFoundException(`Batch cable profile #${batchCableProfileId} not found`);
        }

        const cableProfile = bcp.cable_profile;
        if (!cableProfile) {
            throw new BadRequestException('Batch cable profile has no cable_profile linked');
        }

        const colorProfile = resolveColorProfile(cableProfile);

        const rows = await this.batchFiberTestingRepository.find({
            where: { batch_cable_profile: { id: batchCableProfileId } },
            order: { fiber_number: 'ASC' },
        });

        const headers = rows[0]
            ? this.buildTableHeaders(rows[0], cableProfile.wavelength_configs ?? [])
            : this.buildTableHeadersFromCableProfile(bcp.cable_profile);

        return {
            headers,
            rows,
            batch_cable_profile: bcp,
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
        headers.push({ key: 'testing_counter', label: 'Test Count' });
        return headers;
    }

    /**
     * Wavelength columns come from the cable profile's configured wavelengths, not from a
     * saved row's `fiber_wavelengths` — a row's list can be shorter than the full config
     * (e.g. only some wavelengths were tested for that fiber), which previously made the
     * header silently drop the untested wavelength columns for every fiber.
     */
    private buildTableHeaders(
        first: BatchFiberTesting | undefined,
        wavelengthConfigs: CableProfileWavelengthConfig[],
    ): FiberTestingTableHeaderDto[] {
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

        const waves = this.buildWaveLengthsFromConfigs(wavelengthConfigs);
        for (const w of waves) {
            headers.push({
                key: `wavelength:${w.wavelength_nm}`,
                label: `${w.wavelength_nm}(nm)`,
            });
        }
        headers.push({ key: 'testing_counter', label: 'Test Count' });
        return headers;
    }

    /**
     * Builds the fiber matrix and replaces all existing `batch_fiber_testing` rows for this batch cable profile.
     */
    async saveFiberTestingMatrix(batchCableProfileId: number): Promise<boolean> {
        const matrix = await this.buildFiberTestingMatrix(batchCableProfileId);

        // InnoDB may still pick this transaction as a deadlock victim when sessions are created at
        // the same moment; the work is idempotent, so retrying is safe.
        for (let attempt = 1; ; attempt++) {
            try {
                await this.replaceFiberRows(batchCableProfileId, matrix);
                return true;
            } catch (error) {
                if (!isDeadlock(error) || attempt >= MATRIX_SAVE_ATTEMPTS) throw error;
                this.logger.warn(`Deadlock writing fiber grid of session #${batchCableProfileId}; retry ${attempt}`);
                await new Promise((resolve) => setTimeout(resolve, 100 * attempt + Math.random() * 100));
            }
        }
    }

    private async replaceFiberRows(batchCableProfileId: number, matrix: FiberTestingMatrixRowDto[]): Promise<void> {
        const rows = matrix.map((row) => ({
            batch_cable_profile: { id: batchCableProfileId } as BatchCableProfile,
            fiber_number: row.fiber_number,
            attribute1_name: row.attribute1_name || null,
            attribute1_value: row.attribute1_value || null,
            attribute2_name: row.attribute2_name || null,
            attribute2_value: row.attribute2_value || null,
            attribute3_name: row.attribute3_name || null,
            attribute3_value: row.attribute3_value || null,
            fiber_wavelengths: row.waveLengths.map((w) => ({ ...w })),
            testing_counter: 0,
            status: true,
        }));

        await this.dataSource.transaction(async (manager) => {
            // Delete by primary key, and only when rows exist. `DELETE ... WHERE batch_cable_profile_id = ?`
            // on a new session matches nothing but gap-locks the end of that index, so sessions created
            // together each blocked the others' inserts and deadlocked.
            const existing = await manager.find(BatchFiberTesting, {
                select: { id: true },
                where: { batch_cable_profile: { id: batchCableProfileId } },
            });
            for (let i = 0; i < existing.length; i += SAVE_CHUNK_SIZE) {
                await manager.delete(BatchFiberTesting, { id: In(existing.slice(i, i + SAVE_CHUNK_SIZE).map((r) => r.id)) });
            }

            for (let i = 0; i < rows.length; i += SAVE_CHUNK_SIZE) {
                await manager.insert(BatchFiberTesting, rows.slice(i, i + SAVE_CHUNK_SIZE));
            }
        });
    }

    /**
     * Builds the full strand × ribbon × fiber (or tube layouts) matrix with empty measurements,
     * using the cable profile's structure (or its built-in template) for coloring rules and
     * wavelength_configs for λ list.
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

        const colorProfile = resolveColorProfile(cableProfile);
        if (!colorProfile) {
            throw new BadRequestException(
                `Cable profile "${cableProfile.cable_profile_name}" has no fiber structure defined; edit it in Cable Profile Management`,
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
                        attribute2_value: `R${ribbon}`,
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
                    attribute1_value: `R${ribbon}`,
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
            const tubeType = tubeTypeAtIndex(tube, tubes);
            for (let fiber = 1; fiber <= fiberCount; fiber++) {
                const fiberColor = fiberColors[(fiber - 1) % fiberColors.length];
                rows.push({
                    fiber_number: fiber_number++,
                    attribute1_name: 'Type',
                    attribute1_value: tubeType,
                    attribute2_name: 'Tube',
                    attribute2_value: tubeColor,
                    attribute3_name: 'Fiber',
                    attribute3_value: fiberColor,
                    waveLengths: waveLengths.map((w) => ({ ...w })),
                });
            }
        }
        return rows;
    }

    /** Update wavelength readings, bump testing_counter, and store the AI response and fiber photo. */
    async updateBatchFiberTesting(
        id: number,
        dto: UpdateBatchFiberTestingDto,
        actor?: User | null,
        image?: UploadedImage,
    ): Promise<BatchFiberTesting> {
        const row = await this.batchFiberTestingRepository.findOne({
            where: { id },
            relations: { batch_cable_profile: true },
        });
        if (!row) {
            throw new NotFoundException(`Batch fiber testing #${id} not found`);
        }

        // Merge rather than replace: a test run may only cover some of the row's
        // configured wavelengths (e.g. a wavelength wasn't tested this time), and
        // overwriting the whole array would silently drop the others' saved readings.
        const incoming = new Map(dto.fiber_wavelengths.map((w) => [String(w.wavelength_nm), w.measured_value ?? '']));
        const merged = (row.fiber_wavelengths ?? []).map((w) =>
            incoming.has(w.wavelength_nm) ? { ...w, measured_value: incoming.get(w.wavelength_nm)! } : w,
        );
        for (const [wavelength_nm, measured_value] of incoming) {
            if (!merged.some((w) => w.wavelength_nm === wavelength_nm)) {
                merged.push({ wavelength_nm, measured_value });
            }
        }
        row.fiber_wavelengths = merged;
        row.testing_counter = (row.testing_counter ?? 0) + 1;

        const parsedAiResponse = this.normalizeAiResponse(dto.ai_response);
        const testEvent = row.batch_cable_profile
            ? await this.buildTestEvent(row, dto, actor ?? null)
            : null;

        // The photo belongs to the test event; rows without a session have no event to keep it on.
        if (testEvent && image) {
            testEvent.image_path = await this.imageStorage.save(image, row.batch_cable_profile!.id);
            testEvent.image_mime_type = image.mimetype;
        }

        try {
            await this.persistTest(row, testEvent, parsedAiResponse);
        } catch (error) {
            if (testEvent?.image_path) {
                await this.imageStorage.remove(testEvent.image_path);
            }
            throw error;
        }

        return this.batchFiberTestingRepository.findOneOrFail({ where: { id } });
    }

    private async persistTest(
        row: BatchFiberTesting,
        testEvent: FiberTestEvent | null,
        parsedAiResponse: Record<string, unknown> | unknown[] | null,
    ): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            await manager.save(BatchFiberTesting, row);

            if (testEvent) {
                await manager.save(FiberTestEvent, testEvent);
            }

            if (
                row.batch_cable_profile &&
                row.batch_cable_profile.status === BatchCableProfileStatus.PENDING
            ) {
                await manager.update(BatchCableProfile, row.batch_cable_profile.id, {
                    status: BatchCableProfileStatus.IN_PROGRESS,
                });
            }

            if (parsedAiResponse !== null) {
                const aiRow = manager.create(FiberTestingAiResponse, {
                    batch_cable_profile: row.batch_cable_profile
                        ? ({ id: row.batch_cable_profile.id } as BatchCableProfile)
                        : null,
                    batch_fiber_testing: { id: row.id } as BatchFiberTesting,
                    fiber_test_event: testEvent ? ({ id: testEvent.id } as FiberTestEvent) : null,
                    ai_response: parsedAiResponse,
                });
                await manager.save(FiberTestingAiResponse, aiRow);
            }
        });
    }

    /**
     * Snapshot of this submission for the reporting log: only the wavelengths sent in this
     * request, judged against the session's cable profile limits as they are right now.
     */
    private async buildTestEvent(
        row: BatchFiberTesting,
        dto: UpdateBatchFiberTestingDto,
        actor: User | null,
    ): Promise<FiberTestEvent> {
        const bcpId = row.batch_cable_profile!.id;
        const configs = await this.dataSource
            .getRepository(CableProfileWavelengthConfig)
            .createQueryBuilder('cfg')
            .leftJoinAndSelect('cfg.cable_wavelength', 'cw')
            .innerJoin(BatchCableProfile, 'bcp', 'bcp.cable_profile_id = cfg.cable_profile_id')
            .where('bcp.id = :bcpId', { bcpId })
            .getMany();

        return createFiberTestEvent({
            fiberTestingId: row.id,
            batchCableProfileId: bcpId,
            testedById: actor?.id ?? null,
            fiberNumber: row.fiber_number ?? 0,
            attempt: row.testing_counter,
            readings: dto.fiber_wavelengths,
            limits: buildWavelengthLimits(configs),
            testedAt: new Date(),
        });
    }

    private normalizeAiResponse(
        raw: string | Record<string, unknown> | undefined,
    ): Record<string, unknown> | unknown[] | null {
        if (raw === undefined || raw === null || raw === '') {
            return null;
        }
        if (typeof raw === 'string') {
            return this.parseAiResponseJson(raw);
        }
        if (typeof raw === 'object') {
            return raw as Record<string, unknown>;
        }
        throw new BadRequestException('ai_response must be a JSON string or object');
    }

    private parseAiResponseJson(raw: string): Record<string, unknown> | unknown[] {
        try {
            const parsed: unknown = JSON.parse(raw);
            if (parsed === null || typeof parsed !== 'object') {
                throw new BadRequestException('ai_response must be a valid JSON object or array');
            }
            return parsed as Record<string, unknown> | unknown[];
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('ai_response must be valid JSON');
        }
    }
}
