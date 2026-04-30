import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubTypeDto {
    @ApiProperty({ example: 'IBR-24F', description: 'Name of the sub-type' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}

export class CreateCableTypeDto {
    @ApiProperty({ example: 'IBR', description: 'Name of the cable type' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: ['fiber', 'ribbon', 'strand'],
        description: 'List of attribute labels for the cable type',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attributes?: string[];

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @ApiPropertyOptional({ example: 1, description: 'Parent cable type ID (null for root types)' })
    @IsOptional()
    @IsInt()
    @IsPositive()
    parent_type_id?: number | null;

    @ApiPropertyOptional({
        description: 'Sub-types to create along with this cable type',
        type: [SubTypeDto],
        example: [{ name: 'IBR-24F' }, { name: 'IBR-48F' }],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SubTypeDto)
    sub_type?: SubTypeDto[];
}
