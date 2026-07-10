import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
    BatchCableProfile,
    BatchCableProfileStatus,
} from '../batches/entities/batch-cable-profile.entity';
import { batchCableProfileListRelations } from '../batches/batch-cable-profile.relations';
import { OperatorDashboardStatsDto } from './dto/operator-dashboard-stats.dto';

@Injectable()
export class OperatorDashboardService {
    constructor(
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
    ) { }

    async getStats(actor: User | null): Promise<OperatorDashboardStatsDto> {
        const operatorId = this.requireOperatorId(actor);

        const baseWhere = {
            deleted: false,
            operator: { id: operatorId },
        };

        const [pending_count, in_progress_count, completed_count] = await Promise.all([
            this.batchCableProfileRepository.count({
                where: { ...baseWhere, status: BatchCableProfileStatus.PENDING },
            }),
            this.batchCableProfileRepository.count({
                where: { ...baseWhere, status: BatchCableProfileStatus.IN_PROGRESS },
            }),
            this.batchCableProfileRepository.count({
                where: { ...baseWhere, status: BatchCableProfileStatus.COMPLETED },
            }),
        ]);

        return {
            pending_count,
            in_progress_count,
            completed_count,
        };
    }

    async getBatches(actor: User | null): Promise<BatchCableProfile[]> {
        const operatorId = this.requireOperatorId(actor);

        return this.batchCableProfileRepository.find({
            where: { deleted: false, operator: { id: operatorId } },
            relations: { ...batchCableProfileListRelations },
            order: { modified_at: 'DESC', id: 'DESC' },
        });
    }

    private requireOperatorId(actor: User | null): number {
        if (!actor?.id) {
            throw new BadRequestException('Authenticated user is required');
        }
        return actor.id;
    }
}
