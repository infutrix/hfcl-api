import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class CreateWavelengthConfigDto {
    @ApiProperty({ example: 1, description: 'ID of the cable wavelength' })
    @IsInt()
    @IsPositive()
    cable_wavelength_id: number;

    @ApiProperty({ example: 0.3500, description: 'GRI value (precision 6, scale 4)' })
    @IsNumber()
    @Min(0)
    gri: number;

    @ApiPropertyOptional({ example: 0.200, description: 'Minimum attenuation in dB/km (precision 5, scale 3)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    min_attenuation?: number;

    @ApiPropertyOptional({ example: 0.400, description: 'Maximum attenuation in dB/km (precision 5, scale 3)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    max_attenuation?: number;

    @ApiPropertyOptional({ example: 'dB/km', description: 'Unit of attenuation (default: dB/km)' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    unit?: string;

    @ApiPropertyOptional({ example: 1, description: 'Version number (default: 1)' })
    @IsOptional()
    @IsInt()
    @IsPositive()
    version?: number;

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
