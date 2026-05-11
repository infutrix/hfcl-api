import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';

export class CreateWavelengthWithConfigsDto {
    @ApiProperty({ example: 1310, description: 'Wavelength value (e.g. 1310, 1550, 1625)' })
    @IsInt()
    @IsPositive()
    wavelength: number;

    @ApiPropertyOptional({ example: 'nm', description: 'Unit of the wavelength (default: nm)' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    wavelength_unit?: string;

    @ApiProperty({ example: 1.4660, description: 'GRI value (precision 6, scale 4)' })
    @IsNumber()
    @Min(0)
    gri: number;

    @ApiPropertyOptional({ example: 0.30, description: 'Minimum attenuation in dB/km' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minAttenuation?: number;

    @ApiPropertyOptional({ example: 0.40, description: 'Maximum attenuation in dB/km' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxAttenuation?: number;

    @ApiPropertyOptional({ example: 'dB/km', description: 'Unit of attenuation (default: dB/km)' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    unit?: string;
}
