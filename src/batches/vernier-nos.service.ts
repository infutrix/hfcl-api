import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VernierNo } from './entities/vernier-no.entity';
import { CreateVernierNoDto } from './dto/create-vernier-no.dto';
import { UpdateVernierNoDto } from './dto/update-vernier-no.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class VernierNosService {
    constructor(
        @InjectRepository(VernierNo)
        private readonly vernierNoRepository: Repository<VernierNo>,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateVernierNoDto, actorId?: number): Promise<VernierNo> {
        const existing = await this.vernierNoRepository.findOne({
            where: { vernier_no: dto.vernier_no },
        });
        if (existing) {
            throw new ConflictException(`Vernier number "${dto.vernier_no}" already exists`);
        }

        const row = this.vernierNoRepository.create({
            vernier_no: dto.vernier_no,
            status: dto.status ?? true,
        });
        const saved = await this.vernierNoRepository.save(row);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'vernier_nos',
            entity_id: saved.id,
            new_values: dto as unknown as Record<string, unknown>,
        });
        return saved;
    }

    async findAll(activeOnly = true): Promise<VernierNo[]> {
        return this.vernierNoRepository.find({
            where: activeOnly ? { status: true } : {},
            order: { vernier_no: 'ASC' },
        });
    }

    async findOne(id: number): Promise<VernierNo> {
        const row = await this.vernierNoRepository.findOne({ where: { id } });
        if (!row) {
            throw new NotFoundException(`Vernier #${id} not found`);
        }
        return row;
    }

    async findActiveById(id: number): Promise<VernierNo> {
        const row = await this.vernierNoRepository.findOne({
            where: { id, status: true },
        });
        if (!row) {
            throw new NotFoundException(`Active vernier #${id} not found`);
        }
        return row;
    }

    async update(id: number, dto: UpdateVernierNoDto, actorId?: number): Promise<VernierNo> {
        const row = await this.findOne(id);
        if (dto.vernier_no != null && dto.vernier_no !== row.vernier_no) {
            const existing = await this.vernierNoRepository.findOne({
                where: { vernier_no: dto.vernier_no },
            });
            if (existing) {
                throw new ConflictException(`Vernier number "${dto.vernier_no}" already exists`);
            }
        }

        const oldValues = { ...row };
        Object.assign(row, dto);
        const saved = await this.vernierNoRepository.save(row);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'vernier_nos',
            entity_id: id,
            old_values: oldValues as unknown as Record<string, unknown>,
            new_values: dto as unknown as Record<string, unknown>,
        });
        return saved;
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const row = await this.findOne(id);
        await this.vernierNoRepository.remove(row);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'vernier_nos',
            entity_id: id,
        });
    }
}
