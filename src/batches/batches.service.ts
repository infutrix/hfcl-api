import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Batch } from './entities/batch.entity';

@Injectable()
export class BatchesService {
    constructor(
        @InjectRepository(Batch)
        private readonly batchRepository: Repository<Batch>,
    ) { }

    async findAll(): Promise<Batch[]> {
        return this.batchRepository.find({
            relations: { plant: true, customer: true },
            order: { id: 'ASC' },
        });
    }
}
