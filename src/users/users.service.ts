import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            where: { deleted: false },
            relations: ['userRole'],
            order: { id: 'ASC' },
        });
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id, deleted: false },
            relations: ['userRole'],
        });
        if (!user) throw new NotFoundException(`User #${id} not found`);
        return user;
    }

    async update(id: number, dto: UpdateUserDto, actorId?: number): Promise<User> {
        const user = await this.findOne(id);
        const { password: _pw, ...oldValues } = user as any;
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
        const user = await this.findOne(id);
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
            relations: ['userRole'],
        });
    }

    async updatePassword(id: number, hashedPassword: string): Promise<void> {
        await this.userRepository.update(id, { password: hashedPassword });
    }
}
