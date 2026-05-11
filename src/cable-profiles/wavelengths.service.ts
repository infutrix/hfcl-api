import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CableWavelength } from './entities/cable-wavelength.entity';
import { CreateWavelengthWithConfigsDto } from './dto/create-wavelength-with-configs.dto';
import { UpdateWavelengthWithConfigsDto } from './dto/update-wavelength-with-configs.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WavelengthsService {
    constructor(
        @InjectRepository(CableWavelength)
        private readonly wavelengthRepository: Repository<CableWavelength>,
    ) { }

    async create(dto: CreateWavelengthWithConfigsDto, actorId?: number): Promise<CableWavelength> {
        const exists = await this.wavelengthRepository.existsBy({ value: dto.wavelength });
        if (exists) {
            throw new ConflictException(`Wavelength value ${dto.wavelength} already exists`);
        }

        return this.wavelengthRepository.save({
            value: dto.wavelength,
            wavelength_unit: dto.wavelength_unit ?? 'nm',
            gri: dto.gri,
            min_attenuation: dto.minAttenuation,
            max_attenuation: dto.maxAttenuation,
            unit: dto.unit ?? 'dB/km',
            created_by: actorId ? ({ id: actorId } as User) : undefined,
            modified_by: actorId ? ({ id: actorId } as User) : undefined,
        });
    }

    async update(id: number, dto: UpdateWavelengthWithConfigsDto, actorId?: number): Promise<CableWavelength> {
        const existing = await this.wavelengthRepository.findOne({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Wavelength #${id} not found`);
        }

        if (dto.wavelength !== undefined && dto.wavelength !== existing.value) {
            const other = await this.wavelengthRepository.findOne({ where: { value: dto.wavelength } });
            if (other && other.id !== id) {
                throw new ConflictException(`Wavelength value ${dto.wavelength} already exists`);
            }
        }

        if (dto.wavelength !== undefined) existing.value = dto.wavelength;
        if (dto.wavelength_unit !== undefined) existing.wavelength_unit = dto.wavelength_unit;
        if (dto.gri !== undefined) existing.gri = dto.gri;
        if (dto.minAttenuation !== undefined) existing.min_attenuation = dto.minAttenuation;
        if (dto.maxAttenuation !== undefined) existing.max_attenuation = dto.maxAttenuation;
        if (dto.unit !== undefined) existing.unit = dto.unit;
        if (actorId) existing.modified_by = { id: actorId } as User;

        return this.wavelengthRepository.save(existing);
    }

    async findAll(): Promise<CableWavelength[]> {
        return this.wavelengthRepository.find({ order: { value: 'ASC' } });
    }

    async findOne(id: number): Promise<CableWavelength> {
        const wavelength = await this.wavelengthRepository.findOne({
            where: { id },
        });
        if (!wavelength) throw new NotFoundException(`Wavelength #${id} not found`);
        return wavelength;
    }

    async remove(id: number): Promise<void> {
        const wavelength = await this.findOne(id);
        await this.wavelengthRepository.remove(wavelength);
    }
}
