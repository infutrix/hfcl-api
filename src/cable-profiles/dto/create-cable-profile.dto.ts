import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';


export class CableProfileWavelengthConfigDto {
    @ApiProperty({ example: 1, description: 'ID of the cable_wavelengths record' })
    @IsInt()
    @IsPositive()
    wavelength_id: number;

    @ApiPropertyOptional({
        example: 1310,
        description: 'Optional; on save the server sets `wavelength` from `cable_wavelengths.value` using `wavelength_id`.',
    })
    @IsOptional()
    @IsInt()
    @IsPositive()
    wavelength?: number;

    @ApiProperty({ example: 1.466, description: 'GRI value (precision 6, scale 4)' })
    @IsNumber()
    @Min(0)
    gri: number;

    @ApiPropertyOptional({ example: 0.3, description: 'Minimum attenuation in dB/km' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minAttenuation?: number;

    @ApiPropertyOptional({ example: 0.4, description: 'Maximum attenuation in dB/km' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxAttenuation?: number;

    @ApiPropertyOptional({ example: 'dB/km' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    unit?: string;
}

export class CreateCableProfileDto {
    @ApiProperty({ example: 'IBR-48F', description: 'Unique name of the cable profile' })
    @IsString()
    @IsNotEmpty()
    cable_profile_name: string;

    @ApiProperty({ example: 1, description: 'ID of the cable type' })
    @IsInt()
    @IsPositive()
    cable_type_id: number;

    @ApiProperty({ example: 'IBR-48F', description: 'Cable profile key value' })
    @IsString()
    @IsNotEmpty()
    profile_key_value: string;
    
    @ApiPropertyOptional({ type: [CableProfileWavelengthConfigDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CableProfileWavelengthConfigDto)
    wavelength_configs?: CableProfileWavelengthConfigDto[];

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
