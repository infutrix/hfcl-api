import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchCableProfile } from '../batches/entities/batch-cable-profile.entity';
import { BatchFiberTesting } from '../batches/entities/batch-fiber-testing.entity';
import { CableProfileWavelengthConfig } from '../cable-profiles/entities/cable-profile-wavelength-config.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
    imports: [TypeOrmModule.forFeature([BatchCableProfile, BatchFiberTesting, CableProfileWavelengthConfig])],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }
