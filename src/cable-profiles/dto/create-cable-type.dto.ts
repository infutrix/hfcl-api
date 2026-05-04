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

export class AttributeDto {
    @ApiProperty({ example: 'Tube', description: 'Name of the attribute' })
    @IsString()
    @IsNotEmpty()
    attribute_name: string;

    @ApiProperty({ example: 12, description: 'Number of colors for the attribute' })
    @IsInt()
    attribute_color_count: number;

    @ApiProperty({ example: true, description: 'Whether the attribute has markings' })
    @IsBoolean()
    attribute_markings: boolean;
}

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
        description: 'List of attributes for the cable type',
        type: [AttributeDto],
        example: [
            { attribute_name: 'Tube', attribute_color_count: 0, attribute_markings: false },
            { attribute_name: 'Fiber', attribute_color_count: 12, attribute_markings: true },
        ],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttributeDto)
    attributes?: AttributeDto[];

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
