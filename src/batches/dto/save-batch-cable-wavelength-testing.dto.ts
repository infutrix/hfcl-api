import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class WavelengthTestingItemDto {
    @ApiPropertyOptional({ example: '1.4660', description: 'IOR value in nm' })
    @IsOptional()
    @IsString()
    ior_value_in_nm?: string;

    @ApiPropertyOptional({ example: '0.350', description: 'Fiber value' })
    @IsOptional()
    @IsString()
    fiber_value?: string;
}

export class SaveBatchCableWavelengthTestingDto {
    @ApiProperty({ example: 1, description: 'Batch cable profile session ID' })
    @IsInt()
    batch_cable_profile_id: number;

    @ApiPropertyOptional({ example: 100, description: 'OTDR length (km)' })
    @IsOptional()
    @IsNumber()
    otdr_length_km?: number;

    @ApiProperty({ type: [WavelengthTestingItemDto], description: 'Wavelength testing rows (replaces existing)' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WavelengthTestingItemDto)
    wavelength_testing: WavelengthTestingItemDto[];
}
