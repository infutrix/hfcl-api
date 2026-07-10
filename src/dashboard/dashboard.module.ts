import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { PlantDashboardController } from './plant-dashboard.controller';
import { PlantDashboardService } from './plant-dashboard.service';
import { OperatorDashboardController } from './operator-dashboard.controller';
import { OperatorDashboardService } from './operator-dashboard.service';
import { User } from '../users/entities/user.entity';
import { Plant } from '../plants/entities/plant.entity';
import { BatchCableProfile } from '../batches/entities/batch-cable-profile.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Plant, BatchCableProfile])],
    controllers: [AdminDashboardController, PlantDashboardController, OperatorDashboardController],
    providers: [AdminDashboardService, PlantDashboardService, OperatorDashboardService],
    exports: [AdminDashboardService, PlantDashboardService, OperatorDashboardService],
})
export class DashboardModule { }
