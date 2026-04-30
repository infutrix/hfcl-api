import { PartialType } from '@nestjs/swagger';
import { CreateWavelengthConfigDto } from './create-wavelength-config.dto';

export class UpdateWavelengthConfigDto extends PartialType(CreateWavelengthConfigDto) { }
