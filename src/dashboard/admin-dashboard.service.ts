import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Plant } from '../plants/entities/plant.entity';
import {
    BatchCableProfile,
    BatchCableProfileStatus,
} from '../batches/entities/batch-cable-profile.entity';
import { AdminDashboardStatsDto } from './dto/admin-dashboard-stats.dto';

@Injectable()
export class AdminDashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Plant)
        private readonly plantRepository: Repository<Plant>,
        @InjectRepository(BatchCableProfile)
        private readonly batchCableProfileRepository: Repository<BatchCableProfile>,
    ) { }

    async getStats(): Promise<AdminDashboardStatsDto> {
        const [
            total_users,
            total_plants,
            total_batch_sessions,
            total_active_batch_sessions,
        ] = await Promise.all([
            this.userRepository.count({ where: { deleted: false } }),
            this.plantRepository.count(),
            this.batchCableProfileRepository.count({ where: { deleted: false } }),
            this.batchCableProfileRepository.count({
                where: {
                    deleted: false,
                    status: BatchCableProfileStatus.IN_PROGRESS,
                },
            }),
        ]);

        return {
            total_users,
            total_plants,
            total_batch_sessions,
            total_active_batch_sessions,
        };
    }
}
