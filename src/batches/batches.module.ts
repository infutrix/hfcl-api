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
import { FiberTestingAiResponse } from './entities/fiber-testing-ai-response.entity';
import { VernierNo } from './entities/vernier-no.entity';
import { BatchPhysicalParams } from './entities/batch-physical-params.entity';
import { VernierNosController } from './vernier-nos.controller';
import { VernierNosService } from './vernier-nos.service';
import { BatchPhysicalParamsController } from './batch-physical-params.controller';
import { BatchPhysicalParamsService } from './batch-physical-params.service';
import { BatchCableWavelengthTesting } from './entities/batch-cable-wavelength-testing.entity';
import { BatchCableWavelengthTestingController } from './batch-cable-wavelength-testing.controller';
import { BatchCableWavelengthTestingService } from './batch-cable-wavelength-testing.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BatchCableProfile,
            Batch,
            CableProfile,
            BatchFiberTesting,
            SfgStage,
            FiberTestingAiResponse,
            VernierNo,
            BatchPhysicalParams,
            BatchCableWavelengthTesting,
        ]),
        AuditModule,
    ],
    controllers: [
        BatchesController,
        BatchCableProfilesController,
        BatchFiberTestingController,
        VernierNosController,
        BatchPhysicalParamsController,
        BatchCableWavelengthTestingController,
    ],
    providers: [
        BatchesService,
        BatchCableProfilesService,
        BatchFiberTestingService,
        VernierNosService,
        BatchPhysicalParamsService,
        BatchCableWavelengthTestingService,
    ],
    exports: [
        BatchesService,
        BatchCableProfilesService,
        BatchFiberTestingService,
        VernierNosService,
        BatchPhysicalParamsService,
        BatchCableWavelengthTestingService,
    ],
})
export class BatchesModule { }