import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CableWavelengthConfig } from './entities/cable-wavelength-config.entity';
import { User } from '../users/entities/user.entity';
import { CreateWavelengthConfigDto } from './dto/create-wavelength-config.dto';
import { UpdateWavelengthConfigDto } from './dto/update-wavelength-config.dto';

@Injectable()
export class WavelengthConfigsService {
    constructor(
        @InjectRepository(CableWavelengthConfig)
        private readonly configRepository: Repository<CableWavelengthConfig>,
    ) { }

    async create(dto: CreateWavelengthConfigDto, actorId?: number): Promise<CableWavelengthConfig> {
        const config = this.configRepository.create({
            ...dto,
            created_by: actorId ? { id: actorId } as User : undefined,
            modified_by: actorId ? { id: actorId } as User : undefined,
        });
        return this.configRepository.save(config);
    }

    async findAll(): Promise<CableWavelengthConfig[]> {
        return this.configRepository.find({
            relations: ['cable_wavelength'],
            order: { id: 'ASC' },
        });
    }

    async findByWavelength(wavelengthId: number): Promise<CableWavelengthConfig[]> {
        return this.configRepository.find({
            where: { cable_wavelength_id: wavelengthId },
            relations: ['cable_wavelength'],
            order: { version: 'DESC' },
        });
    }

    async findOne(id: number): Promise<CableWavelengthConfig> {
        const config = await this.configRepository.findOne({
            where: { id },
            relations: ['cable_wavelength'],
        });
        if (!config) throw new NotFoundException(`Wavelength Config #${id} not found`);
        return config;
    }

    async update(id: number, dto: UpdateWavelengthConfigDto, actorId?: number): Promise<CableWavelengthConfig> {
        const config = await this.findOne(id);
        Object.assign(config, dto, {
            modified_by: actorId ? { id: actorId } as User : config.modified_by,
        });
        return this.configRepository.save(config);
    }

    async remove(id: number): Promise<void> {
        const config = await this.findOne(id);
        await this.configRepository.remove(config);
    }
}
