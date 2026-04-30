import { PartialType } from '@nestjs/swagger';
import { CreateWavelengthDto } from './create-wavelength.dto';

export class UpdateWavelengthDto extends PartialType(CreateWavelengthDto) { }
