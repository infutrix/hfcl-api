import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';

export class WavelengthConfigItemDto {
    @ApiPropertyOptional({ example: 1, description: 'Config ID — provide to update an existing record, omit to create a new one' })
    @IsOptional()
    @IsInt()
    @IsPositive()
    id?: number;
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

    @ApiProperty({ type: [WavelengthConfigItemDto], description: 'List of GRI-attenuation configurations' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WavelengthConfigItemDto)
    configs: WavelengthConfigItemDto[];
}

export class UpdateWavelengthWithConfigsDto {
    @ApiPropertyOptional({ example: 1310, description: 'Wavelength value (e.g. 1310, 1550, 1625)' })
    @IsOptional()
    @IsInt()
    @IsPositive()
    wavelength?: number;

    @ApiPropertyOptional({ example: 'nm', description: 'Unit of the wavelength (default: nm)' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    wavelength_unit?: string;

    @ApiPropertyOptional({ type: [WavelengthConfigItemDto], description: 'Configs to upsert — include id to update, omit to create' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WavelengthConfigItemDto)
    configs?: WavelengthConfigItemDto[];
}
