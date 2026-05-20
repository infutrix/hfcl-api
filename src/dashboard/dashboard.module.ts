import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { PlantDashboardController } from './plant-dashboard.controller';
import { PlantDashboardService } from './plant-dashboard.service';
import { User } from '../users/entities/user.entity';
import { Plant } from '../plants/entities/plant.entity';
import { BatchCableProfile } from '../batches/entities/batch-cable-profile.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Plant, BatchCableProfile])],
    controllers: [AdminDashboardController, PlantDashboardController],
    providers: [AdminDashboardService, PlantDashboardService],
    exports: [AdminDashboardService, PlantDashboardService],
})
export class DashboardModule { }
