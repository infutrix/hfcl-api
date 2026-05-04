import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateCustomerDto, actorId?: number): Promise<Customer> {
        if (dto.email) {
            const existing = await this.customerRepository.findOne({
                where: { email: dto.email, deleted: false },
            });
            if (existing) throw new ConflictException(`Customer with email "${dto.email}" already exists`);
        }

        const customer = this.customerRepository.create({
            ...dto,
            created_by: actorId ? { id: actorId } as User : undefined,
            modified_by: actorId ? { id: actorId } as User : undefined,
        });
        const saved = await this.customerRepository.save(customer);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'customers',
            entity_id: saved.id,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async findAll(): Promise<Customer[]> {
        return this.customerRepository.find({
            where: { deleted: false },
            order: { id: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Customer> {
        const customer = await this.customerRepository.findOne({ where: { id, deleted: false } });
        if (!customer) throw new NotFoundException(`Customer #${id} not found`);
        return customer;
    }

    async update(id: number, dto: UpdateCustomerDto, actorId?: number): Promise<Customer> {
        const customer = await this.findOne(id);

        if (dto.email && dto.email !== customer.email) {
            const existing = await this.customerRepository.findOne({
                where: { email: dto.email, deleted: false },
            });
            if (existing) throw new ConflictException(`Customer with email "${dto.email}" already exists`);
        }

        const oldValues = { ...customer };
        Object.assign(customer, dto, {
            modified_by: actorId ? { id: actorId } as User : customer.modified_by,
        });
        const saved = await this.customerRepository.save(customer);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'customers',
            entity_id: id,
            old_values: oldValues as Record<string, any>,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const customer = await this.findOne(id);
        customer.deleted = true;
        customer.modified_by = actorId ? { id: actorId } as User : customer.modified_by;
        await this.customerRepository.save(customer);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'customers',
            entity_id: id,
        });
    }
}
