import { PartialType } from '@nestjs/swagger';
import { CreateVernierNoDto } from './create-vernier-no.dto';

export class UpdateVernierNoDto extends PartialType(CreateVernierNoDto) { }
