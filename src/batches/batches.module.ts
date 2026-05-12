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

@Module({
    imports: [TypeOrmModule.forFeature([BatchCableProfile, Batch, CableProfile]), AuditModule],
    controllers: [BatchesController, BatchCableProfilesController],
    providers: [BatchesService, BatchCableProfilesService],
    exports: [BatchesService, BatchCableProfilesService],
})
export class BatchesModule { }