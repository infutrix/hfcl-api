import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';
import { User } from '../users/entities/user.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

const BATCH_RELATIONS = ['plant', 'cable_type', 'cable_profile', 'customer', 'created_by', 'modified_by'];

@Injectable()
export class BatchesService {
    constructor(
        @InjectRepository(Batch)
        private readonly batchRepository: Repository<Batch>,
        private readonly auditService: AuditService,
    ) { }

    private async checkUnique(batch_name: string, batch_code: string, plant_id: number, excludeId?: number): Promise<void> {
        const nameConflict = await this.batchRepository
            .createQueryBuilder('b')
            .where('b.batch_name = :batch_name AND b.plant_id = :plant_id', { batch_name, plant_id })
            .andWhere(excludeId ? 'b.id != :excludeId' : '1=1', { excludeId })
            .getOne();
        if (nameConflict) throw new ConflictException(`Batch name '${batch_name}' already exists for this plant`);

        const codeConflict = await this.batchRepository
            .createQueryBuilder('b')
            .where('b.batch_code = :batch_code AND b.plant_id = :plant_id', { batch_code, plant_id })
            .andWhere(excludeId ? 'b.id != :excludeId' : '1=1', { excludeId })
            .getOne();
        if (codeConflict) throw new ConflictException(`Batch code '${batch_code}' already exists for this plant`);
    }

    async create(dto: CreateBatchDto, actorId?: number): Promise<Batch> {
        const { plant_id, cable_type_id, cable_profile_id, customer_id, ...rest } = dto;
        await this.checkUnique(rest.batch_name, rest.batch_code, plant_id);
        const batch = this.batchRepository.create({
            ...rest,
            plant: { id: plant_id },
            cable_type: cable_type_id ? { id: cable_type_id } : undefined,
            cable_profile: cable_profile_id ? { id: cable_profile_id } : undefined,
            customer: customer_id ? { id: customer_id } : undefined,
            created_by: actorId ? { id: actorId } as User : undefined,
            modified_by: actorId ? { id: actorId } as User : undefined,
        });
        const saved = await this.batchRepository.save(batch);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'batches',
            entity_id: saved.id,
            new_values: dto as Record<string, any>,
        });
        return this.findOne(saved.id);
    }

    async findAll(): Promise<Batch[]> {
        return this.batchRepository.find({
            relations: BATCH_RELATIONS,
            order: { id: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Batch> {
        const batch = await this.batchRepository.findOne({ where: { id }, relations: BATCH_RELATIONS });
        if (!batch) throw new NotFoundException(`Batch #${id} not found`);
        return batch;
    }

    async update(id: number, dto: UpdateBatchDto, actorId?: number): Promise<Batch> {
        const batch = await this.findOne(id);
        const oldValues = { ...batch };
        const { plant_id, cable_type_id, cable_profile_id, customer_id, ...rest } = dto;
        const resolvedPlantId = plant_id ?? batch.plant?.id;
        const resolvedBatchName = rest.batch_name ?? batch.batch_name;
        const resolvedBatchCode = rest.batch_code ?? batch.batch_code;
        if (resolvedPlantId) {
            await this.checkUnique(resolvedBatchName, resolvedBatchCode, resolvedPlantId, id);
        }
        Object.assign(batch, rest, {
            plant: plant_id ? { id: plant_id } : batch.plant,
            cable_type: cable_type_id !== undefined ? (cable_type_id ? { id: cable_type_id } : null) : batch.cable_type,
            cable_profile: cable_profile_id !== undefined ? (cable_profile_id ? { id: cable_profile_id } : null) : batch.cable_profile,
            customer: customer_id !== undefined ? (customer_id ? { id: customer_id } : null) : batch.customer,
            modified_by: actorId ? { id: actorId } as User : undefined,
        });
        const saved = await this.batchRepository.save(batch);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'batches',
            entity_id: id,
            old_values: oldValues,
            new_values: dto as Record<string, any>,
        });
        return this.findOne(saved.id);
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const batch = await this.findOne(id);
        await this.batchRepository.remove(batch);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'batches',
            entity_id: id,
        });
    }
}
