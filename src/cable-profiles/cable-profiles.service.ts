import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CableProfile } from './entities/cable-profile.entity';
import { CableProfileWavelengthConfig } from './entities/cable-profile-wavelength-config.entity';
import { CableType } from './entities/cable-type.entity';
import { CableWavelength } from './entities/cable-wavelength.entity';
import { User } from '../users/entities/user.entity';
import { CreateCableProfileDto } from './dto/create-cable-profile.dto';
import { UpdateCableProfileDto } from './dto/update-cable-profile.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import cableProfileColors = require('./cable-profile-colors.data.json');

export type CableProfileColorsResponse = typeof cableProfileColors;

@Injectable()
export class CableProfilesService {
    constructor(
        @InjectRepository(CableProfile)
        private readonly cableProfileRepository: Repository<CableProfile>,
        @InjectRepository(CableProfileWavelengthConfig)
        private readonly profileWavelengthConfigRepository: Repository<CableProfileWavelengthConfig>,
        private readonly dataSource: DataSource,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateCableProfileDto, actorId?: number): Promise<CableProfile> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const profile = queryRunner.manager.create(CableProfile, {
                cable_profile_name: dto.cable_profile_name,
                cable_type: dto.cable_type_id ? { id: dto.cable_type_id } as CableType : undefined,
                profile_key_value: dto.profile_key_value,
                status: dto.status,
                created_by: actorId ? { id: actorId } as User : undefined,
                modified_by: actorId ? { id: actorId } as User : undefined,
            });
            const saved = await queryRunner.manager.save(profile);

            if (dto.wavelength_configs?.length) {
                const wavelengthIds = [...new Set(dto.wavelength_configs.map((w) => w.wavelength_id))];
                const cableWavelengths = await queryRunner.manager.find(CableWavelength, {
                    where: { id: In(wavelengthIds) },
                });
                if (cableWavelengths.length !== wavelengthIds.length) {
                    throw new BadRequestException('One or more wavelength_id values are not valid cable_wavelengths ids');
                }
                const nmById = new Map(cableWavelengths.map((w) => [w.id, w.value]));
                const configEntities = dto.wavelength_configs.map((wc) =>
                    queryRunner.manager.create(CableProfileWavelengthConfig, {
                        cable_profile: { id: saved.id } as CableProfile,
                        cable_wavelength: { id: wc.wavelength_id } as CableWavelength,
                        wavelength: nmById.get(wc.wavelength_id)!,
                        gri: wc.gri,
                        min_attenuation: wc.minAttenuation,
                        max_attenuation: wc.maxAttenuation,
                        unit: wc.unit,
                    }),
                );
                await queryRunner.manager.save(configEntities);
            }

            await queryRunner.commitTransaction();
            await this.auditService.logAudit({
                user_id: actorId,
                action: AuditAction.CREATE,
                entity_name: 'cable_profiles',
                entity_id: saved.id,
                new_values: dto as Record<string, any>,
            });
            return this.findOne(saved.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(): Promise<CableProfile[]> {
        const profiles = await this.cableProfileRepository.find({
            order: { id: 'ASC' },
            relations: ['wavelength_configs'],
        });
        return profiles.map((p) => this.withColorProfile(p));
    }

    async findOne(id: number): Promise<CableProfile> {
        const profile = await this.cableProfileRepository.findOne({
            where: { id },
            relations: ['wavelength_configs','wavelength_configs.cable_wavelength'],
        });
        if (!profile) throw new NotFoundException(`Cable Profile #${id} not found`);
        return this.withColorProfile(profile);
    }

    async update(id: number, dto: UpdateCableProfileDto, actorId?: number): Promise<CableProfile> {
        const profile = await this.findOne(id);
        const oldValues = { ...profile };

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (dto.cable_profile_name !== undefined) profile.cable_profile_name = dto.cable_profile_name;
            if (dto.cable_type_id !== undefined) profile.cable_type = { id: dto.cable_type_id } as CableType;
            if (dto.profile_key_value !== undefined) profile.profile_key_value = dto.profile_key_value as any;
            if (dto.status !== undefined) profile.status = dto.status;
            if (actorId) profile.modified_by = { id: actorId } as User;
            const saved = await queryRunner.manager.save(profile);

            if (dto.wavelength_configs !== undefined) {
                await queryRunner.manager.delete(CableProfileWavelengthConfig, {
                    cable_profile: { id },
                });
                if (dto.wavelength_configs.length) {
                    const wavelengthIds = [...new Set(dto.wavelength_configs.map((w) => w.wavelength_id))];
                    const cableWavelengths = await queryRunner.manager.find(CableWavelength, {
                        where: { id: In(wavelengthIds) },
                    });
                    if (cableWavelengths.length !== wavelengthIds.length) {
                        throw new BadRequestException('One or more wavelength_id values are not valid cable_wavelengths ids');
                    }
                    const nmById = new Map(cableWavelengths.map((w) => [w.id, w.value]));
                    const configEntities = dto.wavelength_configs.map((wc) =>
                        queryRunner.manager.create(CableProfileWavelengthConfig, {
                            cable_profile: { id: saved.id } as CableProfile,
                            cable_wavelength: { id: wc.wavelength_id } as CableWavelength,
                            wavelength: nmById.get(wc.wavelength_id)!,
                            gri: wc.gri,
                            min_attenuation: wc.minAttenuation,
                            max_attenuation: wc.maxAttenuation,
                            unit: wc.unit,
                        }),
                    );
                    await queryRunner.manager.save(configEntities);
                }
            }

            await queryRunner.commitTransaction();
            await this.auditService.logAudit({
                user_id: actorId,
                action: AuditAction.UPDATE,
                entity_name: 'cable_profiles',
                entity_id: id,
                old_values: oldValues,
                new_values: dto as Record<string, any>,
            });
            return this.findOne(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
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

    /** Static color definitions (see cable-profile-colors.data.json). */
    getCableProfileColors(): CableProfileColorsResponse {
        return cableProfileColors;
    }

    private withColorProfile<T extends CableProfile>(profile: T): T {
        const match = cableProfileColors.profiles.find((e) => e.profile_key_value === profile.profile_key_value);
        profile.colorProfile = match ?? null;
        return profile;
    }
}
