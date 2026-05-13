import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchCableProfile } from './entities/batch-cable-profile.entity';
import { AuditModule } from '../audit/audit.module';
import { Batch } from './entities/batch.entity';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';
import { BatchCableProfilesController } from './batch-cable-profiles.controller';
import { BatchCableProfilesService } from './batch-cable-profiles.service';
import { CableProfile } from '../cable-profiles/entities/cable-profile.entity';
import { BatchFiberTestingController } from './batch-fiber-testing.controller';
import { BatchFiberTestingService } from './batch-fiber-testing.service';
import { BatchFiberTesting } from './entities/batch-fiber-testing.entity';
import { SfgStage } from './entities/sfg-stage.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([BatchCableProfile, Batch, CableProfile, BatchFiberTesting, SfgStage]),
        AuditModule,
    ],
    controllers: [BatchesController, BatchCableProfilesController, BatchFiberTestingController],
    providers: [BatchesService, BatchCableProfilesService, BatchFiberTestingService],
    exports: [BatchesService, BatchCableProfilesService, BatchFiberTestingService],
})
export class BatchesModule { }