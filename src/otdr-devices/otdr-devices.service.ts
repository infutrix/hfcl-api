import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtdrDevice } from './entities/otdr-device.entity';
import { User } from '../users/entities/user.entity';
import { CreateOtdrDeviceDto } from './dto/create-otdr-device.dto';
import { UpdateOtdrDeviceDto } from './dto/update-otdr-device.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class OtdrDevicesService {
    constructor(
        @InjectRepository(OtdrDevice)
        private readonly otdrDeviceRepository: Repository<OtdrDevice>,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateOtdrDeviceDto, actorId?: number): Promise<OtdrDevice> {
        const existing = await this.otdrDeviceRepository.findOne({ where: { device_id: dto.device_id } });
        if (existing) {
            throw new ConflictException(`Device ID "${dto.device_id}" already exists`);
        }
        const device = this.otdrDeviceRepository.create({
            ...dto,
            created_by: actorId ? { id: actorId } as User : undefined,
            modified_by: actorId ? { id: actorId } as User : undefined,
        });
        const saved = await this.otdrDeviceRepository.save(device);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.CREATE,
            entity_name: 'otdr_devices',
            entity_id: saved.id,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async findAll(): Promise<OtdrDevice[]> {
        return this.otdrDeviceRepository.find({
            relations: ['plant'],
            order: { id: 'ASC' },
        });
    }

    async findOne(id: number): Promise<OtdrDevice> {
        const device = await this.otdrDeviceRepository.findOne({
            where: { id },
            relations: ['plant'],
        });
        if (!device) throw new NotFoundException(`OTDR Device #${id} not found`);
        return device;
    }

    async update(id: number, dto: UpdateOtdrDeviceDto, actorId?: number): Promise<OtdrDevice> {
        const device = await this.findOne(id);
        if (dto.device_id && dto.device_id !== device.device_id) {
            const conflict = await this.otdrDeviceRepository.findOne({ where: { device_id: dto.device_id } });
            if (conflict) throw new ConflictException(`Device ID "${dto.device_id}" already exists`);
        }
        const oldValues = { ...device };
        Object.assign(device, dto, { modified_by: actorId ? { id: actorId } as User : undefined });
        const saved = await this.otdrDeviceRepository.save(device);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.UPDATE,
            entity_name: 'otdr_devices',
            entity_id: id,
            old_values: oldValues,
            new_values: dto as Record<string, any>,
        });
        return saved;
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const device = await this.findOne(id);
        await this.otdrDeviceRepository.remove(device);
        await this.auditService.logAudit({
            user_id: actorId,
            action: AuditAction.DELETE,
            entity_name: 'otdr_devices',
            entity_id: id,
        });
    }
}
