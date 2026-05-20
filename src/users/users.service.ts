import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly auditService: AuditService,
    ) { }

    // ─── User Methods ────────────────────────────────────────────────────────────

    async create(dto: CreateUserDto, actorId?: number): Promise<User> {
        const existing = await this.userRepository.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException(`Email "${dto.email}" is already registered`);
        }
        const user = this.userRepository.create(dto);
        const saved = await this.userRepository.save(user);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'users',
            entity_id: saved.id,
            new_values: dto as Record<string, any>,
        });
        return this.findOne(saved.id);
    }

    async findAll(actor: User | null): Promise<User[]> {
        if (!actor?.userRole) {
            throw new ForbiddenException('You do not have permission to list users');
        }

        const roleIdentifier = actor.userRole.identifier;

        if (roleIdentifier === 'ROLE_IT_ADMIN') {
            return this.userRepository.find({
                where: { deleted: false, id: Not(actor.id) },
                relations: ['userRole', 'plant'],
                order: { id: 'ASC' },
            });
        }

        if (roleIdentifier === 'ROLE_PLANT_SUPERVISOR') {
            return this.userRepository.find({
                where: {
                    deleted: false,
                    id: Not(actor.id),
                    userRole: { identifier: 'ROLE_PLANT_OPERATOR' },
                },
                relations: ['userRole', 'plant'],
                order: { id: 'ASC' },
            });
        }

        throw new ForbiddenException('You do not have permission to list users');
    }

    async findOne(id: number): Promise<User> {
        return this.findOneEntity(id);
    }

    /** Full user row for internal updates — never send directly in API responses. */
    private async findOneEntity(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id, deleted: false },
            relations: ['userRole'],
        });
        if (!user) throw new NotFoundException(`User #${id} not found`);
        return user;
    }

    async update(id: number, dto: UpdateUserDto, actorId?: number): Promise<User> {
        const user = await this.findOneEntity(id);
        const { password: _pw, ...oldValues } = user;
        Object.assign(user, dto);
        await this.userRepository.save(user);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'users',
            entity_id: id,
            old_values: oldValues,
            new_values: dto as Record<string, any>,
        });
        return this.findOne(id);
    }

    async softDelete(id: number, actorId?: number): Promise<void> {
        const user = await this.findOneEntity(id);
        user.deleted = true;
        await this.userRepository.save(user);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'users',
            entity_id: id,
        });
    }

    /** Returns the raw user row including password hash – for auth use only */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email, deleted: false },
            relations: ['userRole', 'plant'],
        });
    }

    async updatePassword(id: number, hashedPassword: string): Promise<void> {
        await this.userRepository.update(id, { password: hashedPassword });
    }
}
