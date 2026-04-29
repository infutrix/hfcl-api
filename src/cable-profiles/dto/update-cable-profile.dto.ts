import { PartialType } from '@nestjs/swagger';
import { CreateCableProfileDto } from './create-cable-profile.dto';

export class UpdateCableProfileDto extends PartialType(CreateCableProfileDto) { }
