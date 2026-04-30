import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CableProfilesController } from './cable-profiles.controller';
import { CableProfilesService } from './cable-profiles.service';
import { CableProfile } from './entities/cable-profile.entity';
import { CableType } from './entities/cable-type.entity';
import { CableWavelength } from './entities/cable-wavelength.entity';
import { CableWavelengthConfig } from './entities/cable-wavelength-config.entity';
import { CableTypesController } from './cable-types.controller';
import { CableTypesService } from './cable-types.service';
import { WavelengthsController } from './wavelengths.controller';
import { WavelengthsService } from './wavelengths.service';
import { WavelengthConfigsController } from './wavelength-configs.controller';
import { WavelengthConfigsService } from './wavelength-configs.service';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [TypeOrmModule.forFeature([CableProfile, CableType, CableWavelength, CableWavelengthConfig]), AuditModule],
    controllers: [CableProfilesController, CableTypesController, WavelengthsController, WavelengthConfigsController],
    providers: [CableProfilesService, CableTypesService, WavelengthsService, WavelengthConfigsService],
    exports: [CableProfilesService, CableTypesService, WavelengthsService, WavelengthConfigsService],
})
export class CableProfilesModule { }
