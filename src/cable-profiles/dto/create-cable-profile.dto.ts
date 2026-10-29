import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { CABLE_LAYOUTS, CableLayout, PhysicalDimensionField } from '../cable-profile-structure';


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

export class TubeColorsDto {
    @ApiProperty({ type: [String], example: ['Blue', 'Orange', 'Green'] })
    @IsArray()
    @IsString({ each: true })
    innerLayer: string[];

    @ApiProperty({ type: [String], example: ['Blue-Strip', 'Orange-Strip'] })
    @IsArray()
    @IsString({ each: true })
    outerLayer: string[];
}

/** Layout-specific rules (counts vs. color lists, dimension rows) are checked by `validateStructure`. */
export class CableProfileStructureDto {
    @ApiProperty({ enum: CABLE_LAYOUTS, example: 'IBR', description: 'Fiber layout used to generate the testing matrix' })
    @IsIn(CABLE_LAYOUTS)
    cable_type: CableLayout;

    @ApiPropertyOptional({ example: 6, description: 'IBR only' })
    @IsOptional()
    @IsInt()
    strandCount?: number;

    @ApiPropertyOptional({ example: 24, description: 'IBR and FLAT_RIBBON' })
    @IsOptional()
    @IsInt()
    ribbonCount?: number;

    @ApiPropertyOptional({ example: 24, description: 'MULTI_TUBE only' })
    @IsOptional()
    @IsInt()
    tubeCount?: number;

    @ApiProperty({ example: 12, description: 'Fibers per ribbon / tube' })
    @IsInt()
    fiberCount: number;

    @ApiPropertyOptional({ type: [String], description: 'IBR only; one color per strand' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    strandColors?: string[];

    @ApiProperty({ type: [String], description: 'One color per fiber position' })
    @IsArray()
    @IsString({ each: true })
    fiberColors: string[];

    @ApiPropertyOptional({ type: TubeColorsDto, description: 'MULTI_TUBE only; inner + outer must equal tubeCount' })
    @IsOptional()
    @ValidateNested()
    @Type(() => TubeColorsDto)
    tubeColors?: TubeColorsDto;

    @ApiProperty({
        description: 'Two rows (minimums, maximums) of { key, value } for ID, OD, FRP, Inner, Outer, Cable dia',
        example: [
            [{ key: 'ID', value: 1.25 }, { key: 'OD', value: 1.7 }, { key: 'FRP', value: 2.9 }, { key: 'Inner', value: 0 }, { key: 'Outer', value: 1.8 }, { key: 'Cable dia', value: 11.5 }],
            [{ key: 'ID', value: 1.35 }, { key: 'OD', value: 1.9 }, { key: 'FRP', value: 3.1 }, { key: 'Inner', value: 0 }, { key: 'Outer', value: 2.4 }, { key: 'Cable dia', value: 12.5 }],
        ],
    })
    // Implicit conversion would turn the nested rows into empty arrays, so keep the raw value;
    // validateStructure checks each key/value and normalizeStructure keeps only the known keys.
    @Transform(({ obj }) => (obj as { physical_dimensions?: unknown }).physical_dimensions)
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    physical_dimensions: PhysicalDimensionField[][];
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
    
    @ApiPropertyOptional({
        type: CableProfileStructureDto,
        description:
            'Custom fiber layout and colors. Required unless `profile_key_value` matches a built-in template (GET /cable-profiles/profile-colors).',
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CableProfileStructureDto)
    structure?: CableProfileStructureDto;

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
