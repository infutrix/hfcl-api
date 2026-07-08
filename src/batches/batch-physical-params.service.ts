import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchPhysicalParams } from './entities/batch-physical-params.entity';
import { BatchCableProfile } from './entities/batch-cable-profile.entity';
import { VernierNo } from './entities/vernier-no.entity';
import { User } from '../users/entities/user.entity';
import { SaveBatchPhysicalParamsDto } from './dto/save-batch-physical-params.dto';
import { BatchPhysicalParamsStatus } from './enums/batch-physical-params-status.enum';
import { VernierNosService } from './vernier-nos.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

const batchPhysicalParamsRelations = {
    vernier: true,
    batch_cable_profile: true,
} as const;

@Injectable()
export class BatchPhysicalParamsService {
    constructor(
        @InjectRepository(BatchPhysicalParams)
        private readonly batchPhysicalParamsRepository: Repository<BatchPhysicalParams>,
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
        private readonly vernierNosService: VernierNosService,
        private readonly auditService: AuditService,
    ) { }

    async save(dto: SaveBatchPhysicalParamsDto, actorId?: number): Promise<BatchPhysicalParams> {
        await this.ensureBatchCableProfileExists(dto.batch_cable_profile_id);
        if (dto.vernier_id != null) {
            await this.vernierNosService.findActiveById(dto.vernier_id);
        }

        const existing = await this.batchPhysicalParamsRepository.findOne({
            where: { batch_cable_profile: { id: dto.batch_cable_profile_id } },
        });

        let saved: BatchPhysicalParams;
        if (existing) {
            this.applyDtoToEntity(existing, dto, actorId);
            saved = await this.batchPhysicalParamsRepository.save(existing);
            await this.auditService.logAudit({
                user_id: actorId,
                action: AuditAction.UPDATE,
                entity_name: 'batch_physical_params',
                entity_id: saved.id,
                new_values: dto as unknown as Record<string, unknown>,
            });
        } else {
            const row = this.batchPhysicalParamsRepository.create(
                this.mapDtoToEntity(dto, dto.batch_cable_profile_id, actorId),
            );
            saved = await this.batchPhysicalParamsRepository.save(row);
            await this.auditService.logAudit({
                user_id: actorId,
                action: AuditAction.CREATE,
                entity_name: 'batch_physical_params',
                entity_id: saved.id,
                new_values: dto as unknown as Record<string, unknown>,
            });
        }

        const savedRecord = await this.batchPhysicalParamsRepository.findOne({
            where: { id: saved.id },
            relations: { ...batchPhysicalParamsRelations },
        });
        if (!savedRecord) {
            throw new NotFoundException(`Batch physical params #${saved.id} not found`);
        }
        return savedRecord;
    }

    async findByBatchCableProfileId(batchCableProfileId: number): Promise<BatchPhysicalParams> {
        await this.ensureBatchCableProfileExists(batchCableProfileId);
        const row = await this.batchPhysicalParamsRepository.findOne({
            where: { batch_cable_profile: { id: batchCableProfileId } },
            relations: { ...batchPhysicalParamsRelations },
        });
        if (!row) {
            throw new NotFoundException(
                `Physical parameters for batch cable profile #${batchCableProfileId} not found`,
            );
        }
        return row;
    }

    private async ensureBatchCableProfileExists(batchCableProfileId: number): Promise<void> {
        const bcp = await this.batchCableProfileRepository.findOne({
            where: { id: batchCableProfileId, deleted: false },
        });
        if (!bcp) {
            throw new NotFoundException(`Batch cable profile #${batchCableProfileId} not found`);
        }
    }

    private mapDtoToEntity(
        dto: SaveBatchPhysicalParamsDto,
        batchCableProfileId: number,
        actorId?: number,
    ): Partial<BatchPhysicalParams> {
        return {
            batch_cable_profile: { id: batchCableProfileId } as BatchCableProfile,
            vernier: dto.vernier_id != null ? ({ id: dto.vernier_id } as VernierNo) : null,
            iem: dto.iem ?? null,
            oem_length_of_sfg_m: dto.oem_length_of_sfg_m ?? null,
            inner_sheath_mm: dto.inner_sheath_mm ?? null,
            outer_sheath_mm: dto.outer_sheath_mm ?? null,
            cable_dia_mm: dto.cable_dia_mm ?? null,
            tube_id_od_nm: dto.tube_id_od_nm ?? null,
            frp_dia_nm: dto.frp_dia_nm ?? null,
            stripability_rib_separation: dto.stripability_rib_separation ?? null,
            visual_inspection: dto.visual_inspection ?? null,
            wpt: dto.wpt ?? null,
            wpt_drip: dto.wpt_drip ?? null,
            sheath_removal_r_lc: dto.sheath_removal_r_lc ?? null,
            fiber_seg_of_ribbon: dto.fiber_seg_of_ribbon ?? null,
            ribbon_print_qty: dto.ribbon_print_qty ?? null,
            color_of_fiber: dto.color_of_fiber ?? null,
            ribbon_rub_test: dto.ribbon_rub_test ?? null,
            ribbon_stiffness: dto.ribbon_stiffness ?? null,
            ribbon_separation: dto.ribbon_separation ?? null,
            remark: dto.remark ?? null,
            status: dto.status ?? BatchPhysicalParamsStatus.PENDING,
            created_by: actorId ? ({ id: actorId } as User) : null,
            modified_by: actorId ? ({ id: actorId } as User) : null,
        };
    }

    private applyDtoToEntity(
        row: BatchPhysicalParams,
        dto: SaveBatchPhysicalParamsDto,
        actorId?: number,
    ): void {
        row.vernier = dto.vernier_id != null ? ({ id: dto.vernier_id } as VernierNo) : null;
        row.iem = dto.iem ?? null;
        row.oem_length_of_sfg_m = dto.oem_length_of_sfg_m ?? null;
        row.inner_sheath_mm = dto.inner_sheath_mm ?? null;
        row.outer_sheath_mm = dto.outer_sheath_mm ?? null;
        row.cable_dia_mm = dto.cable_dia_mm ?? null;
        row.tube_id_od_nm = dto.tube_id_od_nm ?? null;
        row.frp_dia_nm = dto.frp_dia_nm ?? null;
        row.stripability_rib_separation = dto.stripability_rib_separation ?? null;
        row.visual_inspection = dto.visual_inspection ?? null;
        row.wpt = dto.wpt ?? null;
        row.wpt_drip = dto.wpt_drip ?? null;
        row.sheath_removal_r_lc = dto.sheath_removal_r_lc ?? null;
        row.fiber_seg_of_ribbon = dto.fiber_seg_of_ribbon ?? null;
        row.ribbon_print_qty = dto.ribbon_print_qty ?? null;
        row.color_of_fiber = dto.color_of_fiber ?? null;
        row.ribbon_rub_test = dto.ribbon_rub_test ?? null;
        row.ribbon_stiffness = dto.ribbon_stiffness ?? null;
        row.ribbon_separation = dto.ribbon_separation ?? null;
        row.remark = dto.remark ?? null;
        row.status = dto.status ?? row.status;
        if (actorId) {
            row.modified_by = { id: actorId } as User;
        }
    }
}
