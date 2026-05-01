import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CableWavelength } from './entities/cable-wavelength.entity';
import { CableWavelengthConfig } from './entities/cable-wavelength-config.entity';
import { User } from '../users/entities/user.entity';
import { CreateWavelengthWithConfigsDto, UpdateWavelengthWithConfigsDto } from './dto/create-wavelength-with-configs.dto';

@Injectable()
export class WavelengthsService {
    constructor(
        @InjectRepository(CableWavelength)
        private readonly wavelengthRepository: Repository<CableWavelength>,
        @InjectRepository(CableWavelengthConfig)
        private readonly cableWavelengthConfigRepository: Repository<CableWavelengthConfig>,
        private readonly dataSource: DataSource,

    ) { }

    async createWithConfigs(
        dto: CreateWavelengthWithConfigsDto,
        actorId?: number,
    ): Promise<{ wavelength: CableWavelength; configs: CableWavelengthConfig[] }> {
        const existing = await this.wavelengthRepository.findOne({ where: { value: dto.wavelength } });
        if (existing) throw new ConflictException(`Wavelength value ${dto.wavelength} already exists`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const wavelength = queryRunner.manager.create(CableWavelength, {
                value: dto.wavelength,
                unit: dto.wavelength_unit,
                created_by: actorId ? { id: actorId } as User : undefined,
                modified_by: actorId ? { id: actorId } as User : undefined,
            });
            const savedWavelength = await queryRunner.manager.save(wavelength);

            const configEntities = dto.configs.map(item =>
                queryRunner.manager.create(CableWavelengthConfig, {
                    cable_wavelength_id: savedWavelength.id,
                    gri: item.gri,
                    min_attenuation: item.minAttenuation,
                    max_attenuation: item.maxAttenuation,
                    unit: item.unit,
                    created_by: actorId ? { id: actorId } as User : undefined,
                    modified_by: actorId ? { id: actorId } as User : undefined,
                }),
            );
            const savedConfigs = await queryRunner.manager.save(configEntities);

            await queryRunner.commitTransaction();
            return { wavelength: savedWavelength, configs: savedConfigs };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(): Promise<CableWavelength[]> {
        return this.wavelengthRepository.find({ order: { value: 'ASC' } });
    }

    async wavelengthConfigs(): Promise<CableWavelengthConfig[]> {
        return await this.cableWavelengthConfigRepository.find({
            relations: ['cable_wavelength'],
            order: { cable_wavelength: { value: 'ASC' }, gri: 'ASC' },
        });
    }

    async updateWithConfigs(
        id: number,
        dto: UpdateWavelengthWithConfigsDto,
        actorId?: number,
    ): Promise<{ wavelength: CableWavelength; configs: CableWavelengthConfig[] }> {
        const wavelength = await this.findOne(id);

        if (dto.wavelength && dto.wavelength !== wavelength.value) {
            const conflict = await this.wavelengthRepository.findOne({ where: { value: dto.wavelength } });
            if (conflict) throw new ConflictException(`Wavelength value ${dto.wavelength} already exists`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update wavelength fields
            if (dto.wavelength !== undefined) wavelength.value = dto.wavelength;
            if (dto.wavelength_unit !== undefined) wavelength.unit = dto.wavelength_unit;
            if (actorId) wavelength.modified_by = { id: actorId } as User;
            const savedWavelength = await queryRunner.manager.save(wavelength);

            // Upsert configs
            let savedConfigs: CableWavelengthConfig[] = [];
            if (dto.configs && dto.configs.length > 0) {
                const configEntities = dto.configs.map(item => {
                    const entity = queryRunner.manager.create(CableWavelengthConfig, {
                        ...(item.id ? { id: item.id } : {}),
                        cable_wavelength_id: savedWavelength.id,
                        gri: item.gri,
                        min_attenuation: item.minAttenuation,
                        max_attenuation: item.maxAttenuation,
                        unit: item.unit,
                        modified_by: actorId ? { id: actorId } as User : undefined,
                        ...(!item.id ? { created_by: actorId ? { id: actorId } as User : undefined } : {}),
                    });
                    return entity;
                });
                savedConfigs = await queryRunner.manager.save(configEntities);
            }

            await queryRunner.commitTransaction();
            return { wavelength: savedWavelength, configs: savedConfigs };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findOne(id: number): Promise<CableWavelength> {
        const wavelength = await this.wavelengthRepository.findOne({
            where: { id },
            relations: ['configs'],
            order: { configs: { gri: 'ASC' } },
        });
        if (!wavelength) throw new NotFoundException(`Wavelength #${id} not found`);
        return wavelength;
    }

    async remove(id: number): Promise<void> {
        const wavelength = await this.findOne(id);
        await this.wavelengthRepository.remove(wavelength);
    }
}
