import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CableProfilesController } from './cable-profiles.controller';
import { CableProfilesService } from './cable-profiles.service';
import { CableProfile } from './entities/cable-profile.entity';
import { CableType } from './entities/cable-type.entity';
import { CableWavelength } from './entities/cable-wavelength.entity';
import { CableWavelengthConfig } from './entities/cable-wavelength-config.entity';
import { CableProfileWavelengthConfig } from './entities/cable-profile-wavelength-config.entity';
import { CableTypesController } from './cable-types.controller';
import { CableTypesService } from './cable-types.service';
import { WavelengthsController } from './wavelengths.controller';
import { WavelengthsService } from './wavelengths.service';
import { SfgStage } from '../batches/entities/sfg-stage.entity';
import { SfgStagesController } from '../batches/sfg-stages.controller';
import { SfgStagesService } from '../batches/sfg-stages.service';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [TypeOrmModule.forFeature([CableProfile, CableType, CableWavelength, CableWavelengthConfig, CableProfileWavelengthConfig, SfgStage]), AuditModule],
    controllers: [CableProfilesController, CableTypesController, WavelengthsController, SfgStagesController],
    providers: [CableProfilesService, CableTypesService, WavelengthsService, SfgStagesService],
    exports: [CableProfilesService, CableTypesService, WavelengthsService, SfgStagesService],
})
export class CableProfilesModule { }
