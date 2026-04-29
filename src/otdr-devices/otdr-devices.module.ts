import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtdrDevicesController } from './otdr-devices.controller';
import { OtdrDevicesService } from './otdr-devices.service';
import { OtdrDevice } from './entities/otdr-device.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [TypeOrmModule.forFeature([OtdrDevice]), AuditModule],
    controllers: [OtdrDevicesController],
    providers: [OtdrDevicesService],
    exports: [OtdrDevicesService],
})
export class OtdrDevicesModule { }
