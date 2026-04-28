import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';
import { CreateUserRoleDto } from '../dto/create-user-role.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@Injectable()
export class UserRolesService {
    constructor(
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateUserRoleDto, actorId?: number): Promise<UserRole> {
        const existing = await this.userRoleRepository.findOne({
            where: { role: dto.role },
        });
        if (existing) {
            throw new ConflictException(`Role "${dto.role}" already exists`);
        }
        const role = this.userRoleRepository.create(dto);
        const saved = await this.userRoleRepository.save(role);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'user_roles',
            entity_id: saved.id,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async findAll(): Promise<UserRole[]> {
        return this.userRoleRepository.find({ order: { id: 'ASC' } });
    }

    async findOne(id: number): Promise<UserRole> {
        const role = await this.userRoleRepository.findOne({ where: { id } });
        if (!role) throw new NotFoundException(`Role #${id} not found`);
        return role;
    }

    async update(id: number, dto: UpdateUserRoleDto, actorId?: number): Promise<UserRole> {
        const role = await this.findOne(id);
        const oldValues = { ...role };
        Object.assign(role, dto);
        const saved = await this.userRoleRepository.save(role);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'user_roles',
            entity_id: id,
            old_values: oldValues,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const role = await this.findOne(id);
        await this.userRoleRepository.remove(role);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'user_roles',
            entity_id: id,
            old_values: role as unknown as Record<string, any>,
        });
    }
}
