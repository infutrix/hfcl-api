import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CableType } from './entities/cable-type.entity';
import { User } from '../users/entities/user.entity';
import { CreateCableTypeDto } from './dto/create-cable-type.dto';
import { UpdateCableTypeDto } from './dto/update-cable-type.dto';

@Injectable()
export class CableTypesService {
    constructor(
        @InjectRepository(CableType)
        private readonly cableTypeRepository: Repository<CableType>,
    ) { }

    async create(dto: CreateCableTypeDto, actorId?: number): Promise<CableType> {
        const { sub_type, ...parentData } = dto;
        const existing = await this.cableTypeRepository.findOne({ where: { name: parentData.name } });
        if (existing) throw new ConflictException(`Cable type with name '${parentData.name}' already exists`);
        const cableType = this.cableTypeRepository.create({
            ...parentData,
            created_by: actorId ? { id: actorId } as User : undefined,
            modified_by: actorId ? { id: actorId } as User : undefined,
        });
        const saved = await this.cableTypeRepository.save(cableType);

        if (sub_type && sub_type.length > 0) {
            const children = sub_type.map((s) =>
                this.cableTypeRepository.create({
                    ...s,
                    parent_type_id: saved.id,
                    created_by: actorId ? { id: actorId } as User : undefined,
                    modified_by: actorId ? { id: actorId } as User : undefined,
                }),
            );
            await this.cableTypeRepository.save(children);
        }
        return this.findOne(saved.id);
    }

    async findAll(): Promise<CableType[]> {
        return this.cableTypeRepository.find({
            select: ['id', 'name', 'attributes', 'status'],
            where: { parent_type_id: IsNull() },
            order: { id: 'ASC' },
        });
    }

    async findOne(id: number): Promise<CableType> {
        const cableType = await this.cableTypeRepository.findOne({
            where: { id },
            relations: ['parent', 'children'],
        });
        if (!cableType) throw new NotFoundException(`Cable Type #${id} not found`);
        return cableType;
    }

    async update(id: number, dto: UpdateCableTypeDto, actorId?: number): Promise<CableType> {
        const { sub_type, ...parentData } = dto;
        if (parentData.name) {
            const existing = await this.cableTypeRepository.findOne({ where: { name: parentData.name } });
            if (existing && existing.id !== id) throw new ConflictException(`Cable type with name '${parentData.name}' already exists`);
        }
        const cableType = await this.findOne(id);
        Object.assign(cableType, parentData, {
            modified_by: actorId ? { id: actorId } as User : cableType.modified_by,
        });
        await this.cableTypeRepository.save(cableType);

        if (sub_type !== undefined) {
            await this.cableTypeRepository.delete({ parent_type_id: id } as any);
            if (sub_type.length > 0) {
                const children = sub_type.map((s) =>
                    this.cableTypeRepository.create({
                        ...s,
                        parent_type_id: id,
                        created_by: actorId ? { id: actorId } as User : undefined,
                        modified_by: actorId ? { id: actorId } as User : undefined,
                    }),
                );
                await this.cableTypeRepository.save(children);
            }
        }
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const cableType = await this.findOne(id);
        cableType.deleted = true;
        await this.cableTypeRepository.save(cableType);
    }
}
