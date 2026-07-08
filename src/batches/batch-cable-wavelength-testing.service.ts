import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BatchCableWavelengthTesting } from './entities/batch-cable-wavelength-testing.entity';
import { BatchCableProfile } from './entities/batch-cable-profile.entity';
import { SaveBatchCableWavelengthTestingDto } from './dto/save-batch-cable-wavelength-testing.dto';
import { BatchCableWavelengthTestingResponseDto } from './dto/batch-cable-wavelength-testing-response.dto';
import { User } from '../users/entities/user.entity';

const batchCableWavelengthTestingRelations = {
    batch_cable_profile: true,
} as const;

@Injectable()
export class BatchCableWavelengthTestingService {
    constructor(
        @InjectRepository(BatchCableWavelengthTesting)
        private readonly batchCableWavelengthTestingRepository: Repository<BatchCableWavelengthTesting>,
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
        private readonly dataSource: DataSource,
    ) { }

    async save(
        dto: SaveBatchCableWavelengthTestingDto,
        actorId?: number,
    ): Promise<BatchCableWavelengthTestingResponseDto> {
        const profile = await this.batchCableProfileRepository.findOne({
            where: { id: dto.batch_cable_profile_id, deleted: false },
        });
        if (!profile) {
            throw new NotFoundException(`Batch cable profile #${dto.batch_cable_profile_id} not found`);
        }

        await this.dataSource.transaction(async (manager) => {
            if (dto.otdr_length_km !== undefined) {
                profile.otdr_length_km = dto.otdr_length_km ?? null;
                profile.modified_by = actorId ? ({ id: actorId } as User) : profile.modified_by;
                await manager.save(BatchCableProfile, profile);
            }

            await manager
                .createQueryBuilder()
                .delete()
                .from(BatchCableWavelengthTesting)
                .where('batch_cable_profile_id = :id', { id: dto.batch_cable_profile_id })
                .execute();

            const rows = this.buildWavelengthRows(dto.batch_cable_profile_id, dto.wavelength_testing);
            if (rows.length > 0) {
                await manager.save(BatchCableWavelengthTesting, rows);
            }
        });

        return this.buildResponse(dto.batch_cable_profile_id);
    }

    async findByBatchCableProfileId(
        batchCableProfileId: number,
    ): Promise<BatchCableWavelengthTestingResponseDto> {
        await this.ensureBatchCableProfileExists(batchCableProfileId);
        return this.buildResponse(batchCableProfileId);
    }

    private async buildResponse(batchCableProfileId: number): Promise<BatchCableWavelengthTestingResponseDto> {
        const profile = await this.batchCableProfileRepository.findOne({
            where: { id: batchCableProfileId, deleted: false },
        });
        if (!profile) {
            throw new NotFoundException(`Batch cable profile #${batchCableProfileId} not found`);
        }

        const wavelength_testing = await this.batchCableWavelengthTestingRepository.find({
            where: { batch_cable_profile: { id: batchCableProfileId } },
            relations: { ...batchCableWavelengthTestingRelations },
            order: { id: 'ASC' },
        });

        return {
            batch_cable_profile_id: batchCableProfileId,
            otdr_length_km: profile.otdr_length_km,
            wavelength_testing,
        };
    }

    private buildWavelengthRows(
        batchCableProfileId: number,
        items: SaveBatchCableWavelengthTestingDto['wavelength_testing'],
    ): BatchCableWavelengthTesting[] {
        const deduped = new Map<string, SaveBatchCableWavelengthTestingDto['wavelength_testing'][number]>();
        for (const item of items) {
            const key = item.ior_value_in_nm ?? '';
            deduped.set(key, item);
        }

        return [...deduped.values()].map((item) =>
            this.batchCableWavelengthTestingRepository.create({
                batch_cable_profile: { id: batchCableProfileId } as BatchCableProfile,
                ior_value_in_nm: item.ior_value_in_nm ?? null,
                fiber_value: item.fiber_value ?? null,
            }),
        );
    }

    private async ensureBatchCableProfileExists(batchCableProfileId: number): Promise<void> {
        const profile = await this.batchCableProfileRepository.findOne({
            where: { id: batchCableProfileId, deleted: false },
        });
        if (!profile) {
            throw new NotFoundException(`Batch cable profile #${batchCableProfileId} not found`);
        }
    }
}
