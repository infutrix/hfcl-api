import { PartialType } from '@nestjs/swagger';
import { CreateCableTypeDto } from './create-cable-type.dto';

export class UpdateCableTypeDto extends PartialType(CreateCableTypeDto) { }
