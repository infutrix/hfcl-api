import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plant } from './entities/plant.entity';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class PlantsService {
    constructor(
        @InjectRepository(Plant)
        private readonly plantRepository: Repository<Plant>,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreatePlantDto, actorId?: number): Promise<Plant> {
        const plant = this.plantRepository.create({
            ...dto,
            created_by: actorId,
            modified_by: actorId,
        });
        const saved = await this.plantRepository.save(plant);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'plants',
            entity_id: saved.id,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async findAll(): Promise<Plant[]> {
        return this.plantRepository.find({ order: { id: 'ASC' } });
    }

    async findOne(id: number): Promise<Plant> {
        const plant = await this.plantRepository.findOne({ where: { id } });
        if (!plant) throw new NotFoundException(`Plant #${id} not found`);
        return plant;
    }

    async update(id: number, dto: UpdatePlantDto, actorId?: number): Promise<Plant> {
        const plant = await this.findOne(id);
        const oldValues = { ...plant };
        Object.assign(plant, dto, { modified_by: actorId });
        const saved = await this.plantRepository.save(plant);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'plants',
            entity_id: id,
            old_values: oldValues,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const plant = await this.findOne(id);
        await this.plantRepository.remove(plant);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'plants',
            entity_id: id,
        });
    }
}
