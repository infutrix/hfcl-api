import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CableProfile } from './entities/cable-profile.entity';
import { User } from '../users/entities/user.entity';
import { CreateCableProfileDto } from './dto/create-cable-profile.dto';
import { UpdateCableProfileDto } from './dto/update-cable-profile.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class CableProfilesService {
    constructor(
        @InjectRepository(CableProfile)
        private readonly cableProfileRepository: Repository<CableProfile>,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateCableProfileDto, actorId?: number): Promise<CableProfile> {
        const profile = this.cableProfileRepository.create({
            ...dto,
            created_by: actorId ? { id: actorId } as User : undefined,
            modified_by: actorId ? { id: actorId } as User : undefined,
        });
        const saved = await this.cableProfileRepository.save(profile);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'cable_profiles',
            entity_id: saved.id,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async findAll(): Promise<CableProfile[]> {
        return this.cableProfileRepository.find({ order: { id: 'ASC' } });
    }

    async findOne(id: number): Promise<CableProfile> {
        const profile = await this.cableProfileRepository.findOne({ where: { id } });
        if (!profile) throw new NotFoundException(`Cable Profile #${id} not found`);
        return profile;
    }

    async update(id: number, dto: UpdateCableProfileDto, actorId?: number): Promise<CableProfile> {
        const profile = await this.findOne(id);
        const oldValues = { ...profile };
        Object.assign(profile, dto, { modified_by: actorId ? { id: actorId } as User : undefined });
        const saved = await this.cableProfileRepository.save(profile);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'cable_profiles',
            entity_id: id,
            old_values: oldValues,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const profile = await this.findOne(id);
        await this.cableProfileRepository.remove(profile);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'cable_profiles',
            entity_id: id,
        });
    }
}
