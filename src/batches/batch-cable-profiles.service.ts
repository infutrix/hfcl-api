import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchCableProfile } from './entities/batch-cable-profile.entity';
import { User } from '../users/entities/user.entity';
import { CableProfile } from '../cable-profiles/entities/cable-profile.entity';
import { CableType } from '../cable-profiles/entities/cable-type.entity';
import { Customer } from '../customers/entities/customer.entity';
import { OtdrDevice } from '../otdr-devices/entities/otdr-device.entity';
import { Batch } from './entities/batch.entity';
import { SfgStage } from './entities/sfg-stage.entity';
import { CreateBatchCableProfileDto } from './dto/create-batch-cable-profile.dto';
import { UpdateBatchCableProfileDto } from './dto/update-batch-cable-profile.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

import { BatchFiberTestingService } from './batch-fiber-testing.service';

const batchCableProfileRelations = {
    plant: true,
    batch: true,
    cable_type: true,
    otdr_device: true,
    cable_profile: true,
    operator: true,
    customer: true,
    sfg_stage: true,
} as const;

@Injectable()
export class BatchCableProfilesService {
    constructor(
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
        @InjectRepository(Batch)
        private readonly batchRepository: Repository<Batch>,
        @InjectRepository(CableProfile)
        private readonly cableProfileRepository: Repository<CableProfile>,
        @InjectRepository(SfgStage)
        private readonly sfgStageRepository: Repository<SfgStage>,
        private readonly auditService: AuditService,
        private readonly batchFiberTestingService: BatchFiberTestingService,
    ) { }

    async create(dto: CreateBatchCableProfileDto, actorId?: number): Promise<BatchCableProfile> {
        let cable_type: CableType | null | undefined;
        if (dto.cable_profile_id != null) {
            const profile = await this.cableProfileRepository.findOne({
                where: { id: dto.cable_profile_id },
                relations: { cable_type: true },
            });
            if (!profile) {
                throw new NotFoundException(`Cable Profile #${dto.cable_profile_id} not found`);
            }
            cable_type = profile.cable_type ? ({ id: profile.cable_type.id } as CableType) : null;
        }

        let batch_name = '';
        let batchRef: Batch | undefined;
        if (dto.batch_id != null) {
            const batchEntity = await this.batchRepository.findOne({ where: { id: dto.batch_id } });
            if (!batchEntity) {
                throw new NotFoundException(`Batch #${dto.batch_id} not found`);
            }
            batch_name = batchEntity.batch;
            batchRef = { id: dto.batch_id } as Batch;
        }

        if (dto.stage_id != null) {
            const stage = await this.sfgStageRepository.findOne({
                where: { id: dto.stage_id, deleted: false },
            });
            if (!stage) {
                throw new NotFoundException(`SFG stage #${dto.stage_id} not found`);
            }
        }

        const row = this.batchCableProfileRepository.create({
            drum_number: dto.drum_number,
            fiber_type: dto.fiber_type,
            batch: batchRef,
            batch_name,
            otdr_device: dto.otdr_device_id != null ? ({ id: dto.otdr_device_id } as OtdrDevice) : undefined,
            cable_profile: dto.cable_profile_id != null ? ({ id: dto.cable_profile_id } as CableProfile) : undefined,
            ...(dto.cable_profile_id != null ? { cable_type } : {}),
            operator: actorId ? ({ id: actorId } as User) : undefined,
            customer: dto.customer_id != null ? ({ id: dto.customer_id } as Customer) : undefined,
            sfg_stage: dto.stage_id != null ? ({ id: dto.stage_id } as SfgStage) : undefined,
            created_by: actorId ? ({ id: actorId } as User) : undefined,
            modified_by: actorId ? ({ id: actorId } as User) : undefined,
        });

        const saved = await this.batchCableProfileRepository.save(row);

        try {
            await this.batchFiberTestingService.saveFiberTestingMatrix(saved.id);
        } catch (error) {
            await this.batchCableProfileRepository.remove(saved);
            throw error;
        }
    
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'batch_cable_profiles',
            entity_id: saved.id,
            new_values: dto as unknown as Record<string, unknown>,
        });
        return this.findOne(saved.id);
    }

    async findAll(): Promise<BatchCableProfile[]> {
        return this.batchCableProfileRepository.find({
            where: { deleted: false },
            relations: { ...batchCableProfileRelations },
            order: { id: 'ASC' },
        });
    }

    async findOne(id: number): Promise<BatchCableProfile> {
        const row = await this.batchCableProfileRepository.findOne({
            where: { id, deleted: false },
            relations: { ...batchCableProfileRelations },
        });
        if (!row) throw new NotFoundException(`Batch cable profile #${id} not found`);
        return row;
    }

    async update(id: number, dto: UpdateBatchCableProfileDto, actorId?: number): Promise<BatchCableProfile> {
        const row = await this.findOne(id);
        const oldValues = { ...row };

        if (dto.drum_number !== undefined) row.drum_number = dto.drum_number;
        if (dto.fiber_type !== undefined) row.fiber_type = dto.fiber_type;

        if (dto.batch_id !== undefined) {
            if (dto.batch_id != null) {
                const batchEntity = await this.batchRepository.findOne({ where: { id: dto.batch_id } });
                if (!batchEntity) {
                    throw new NotFoundException(`Batch #${dto.batch_id} not found`);
                }
                row.batch = { id: dto.batch_id } as Batch;
                row.batch_name = batchEntity.batch;
            } else {
                row.batch = null;
                row.batch_name = '';
            }
        }
        if (dto.otdr_device_id !== undefined) {
            row.otdr_device = dto.otdr_device_id != null ? ({ id: dto.otdr_device_id } as OtdrDevice) : null;
        }
        if (dto.cable_profile_id !== undefined) {
            if (dto.cable_profile_id != null) {
                const profile = await this.cableProfileRepository.findOne({
                    where: { id: dto.cable_profile_id },
                    relations: { cable_type: true },
                });
                if (!profile) {
                    throw new NotFoundException(`Cable Profile #${dto.cable_profile_id} not found`);
                }
                row.cable_profile = { id: dto.cable_profile_id } as CableProfile;
                row.cable_type = profile.cable_type ? ({ id: profile.cable_type.id } as CableType) : null;
            } else {
                row.cable_profile = null;
                row.cable_type = null;
            }
        }
    
        row.operator = actorId ? ({ id: actorId } as User) : null;
        
        if (dto.customer_id !== undefined) {
            row.customer = dto.customer_id != null ? ({ id: dto.customer_id } as Customer) : null;
        }

        if (dto.stage_id !== undefined) {
            if (dto.stage_id != null) {
                const stage = await this.sfgStageRepository.findOne({
                    where: { id: dto.stage_id, deleted: false },
                });
                if (!stage) {
                    throw new NotFoundException(`SFG stage #${dto.stage_id} not found`);
                }
                row.sfg_stage = { id: dto.stage_id } as SfgStage;
            } else {
                row.sfg_stage = null;
            }
        }

        row.modified_by = actorId ? ({ id: actorId } as User) : row.modified_by;
        await this.batchCableProfileRepository.save(row);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'batch_cable_profiles',
            entity_id: id,
            old_values: oldValues as unknown as Record<string, unknown>,
            new_values: dto as unknown as Record<string, unknown>,
        });
        return this.findOne(id);
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const row = await this.findOne(id);
        row.deleted = true;
        row.modified_by = actorId ? ({ id: actorId } as User) : row.modified_by;
        await this.batchCableProfileRepository.save(row);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'batch_cable_profiles',
            entity_id: id,
        });
    }
}
