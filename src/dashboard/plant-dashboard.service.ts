import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
    BatchCableProfile,
    BatchCableProfileStatus,
} from '../batches/entities/batch-cable-profile.entity';
import { PlantDashboardStatsDto } from './dto/plant-dashboard-stats.dto';

@Injectable()
export class PlantDashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
    ) { }

    getOverview() {
        return {
            message: 'Plant dashboard is ready',
        };
    }

    async getStats(actor: User | null): Promise<PlantDashboardStatsDto> {
        if (!actor?.id) {
            throw new BadRequestException('Authenticated user is required');
        }

        const user = await this.userRepository.findOne({
            where: { id: actor.id, deleted: false },
            relations: { plant: true },
        });
        if (!user?.plant?.id) {
            return {
                total_operators: 0,
                total_batch_sessions: 0,
                total_active_batch_sessions: 0,
            };
        }

        const plantId = user.plant.id;

        const [total_operators, total_batch_sessions, total_active_batch_sessions] =
            await Promise.all([
                this.userRepository.count({
                    where: {
                        deleted: false,
                        plant: { id: plantId },
                        userRole: { identifier: 'ROLE_PLANT_OPERATOR' },
                    },
                }),
                this.batchCableProfileRepository.count({
                    where: { deleted: false, plant: { id: plantId } },
                }),
                this.batchCableProfileRepository.count({
                    where: {
                        deleted: false,
                        plant: { id: plantId },
                        status: BatchCableProfileStatus.IN_PROGRESS,
                    },
                }),
            ]);

        return {
            total_operators,
            total_batch_sessions,
            total_active_batch_sessions,
        };
    }
}
