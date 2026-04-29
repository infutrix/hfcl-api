import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CableProfilesController } from './cable-profiles.controller';
import { CableProfilesService } from './cable-profiles.service';
import { CableProfile } from './entities/cable-profile.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [TypeOrmModule.forFeature([CableProfile]), AuditModule],
    controllers: [CableProfilesController],
    providers: [CableProfilesService],
    exports: [CableProfilesService],
})
export class CableProfilesModule { }
