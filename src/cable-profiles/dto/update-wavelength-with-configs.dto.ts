import { PartialType } from '@nestjs/swagger';
import { CreateWavelengthWithConfigsDto } from './create-wavelength-with-configs.dto';

export class UpdateWavelengthWithConfigsDto extends PartialType(CreateWavelengthWithConfigsDto) { }
