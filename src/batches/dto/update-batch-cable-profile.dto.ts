import { PartialType } from '@nestjs/swagger';
import { CreateBatchCableProfileDto } from './create-batch-cable-profile.dto';

export class UpdateBatchCableProfileDto extends PartialType(CreateBatchCableProfileDto) { }
