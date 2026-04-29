import { PartialType } from '@nestjs/swagger';
import { CreateOtdrDeviceDto } from './create-otdr-device.dto';

export class UpdateOtdrDeviceDto extends PartialType(CreateOtdrDeviceDto) { }
