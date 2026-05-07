import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SfgStage } from '../batches/entities/sfg-stage.entity';
import { User } from '../users/entities/user.entity';
import { CreateSfgStageDto, UpdateSfgStageDto } from '../cable-profiles/dto/sfg-stage.dto';

@Injectable()
export class SfgStagesService {
    constructor(
        @InjectRepository(SfgStage)
        private readonly sfgStageRepository: Repository<SfgStage>,
    ) { }

    async create(dto: CreateSfgStageDto, actorId?: number): Promise<SfgStage> {
        const existing = await this.sfgStageRepository.findOne({ where: { name: dto.name, deleted: false } });
        if (existing) throw new ConflictException(`SFG stage with name "${dto.name}" already exists`);

        const stage: SfgStage = this.sfgStageRepository.create({
            ...dto,
            created_by: actorId ? { id: actorId } as User : undefined,
            modified_by: actorId ? { id: actorId } as User : undefined,
        });
        return this.sfgStageRepository.save(stage);
    }

    async findAll(): Promise<SfgStage[]> {
        return this.sfgStageRepository.find({
            where: { deleted: false },
            order: { sequence: 'ASC' },
        });
    }

    async findOne(id: number): Promise<SfgStage> {
        const stage = await this.sfgStageRepository.findOne({ where: { id, deleted: false } });
        if (!stage) throw new NotFoundException(`SFG Stage #${id} not found`);
        return stage;
    }

    async update(id: number, dto: UpdateSfgStageDto, actorId?: number): Promise<SfgStage> {
        const stage = await this.findOne(id);

        if (dto.name && dto.name !== stage.name) {
            const existing = await this.sfgStageRepository.findOne({ where: { name: dto.name, deleted: false } });
            if (existing) throw new ConflictException(`SFG stage with name "${dto.name}" already exists`);
        }

        Object.assign(stage, dto, {
            modified_by: actorId ? { id: actorId } as User : stage.modified_by,
        });
        return this.sfgStageRepository.save(stage);
    }

    async remove(id: number, actorId?: number): Promise<void> {
        const stage = await this.findOne(id);
        stage.deleted = true;
        stage.modified_by = actorId ? { id: actorId } as User : stage.modified_by;
        await this.sfgStageRepository.save(stage);
    }
}
