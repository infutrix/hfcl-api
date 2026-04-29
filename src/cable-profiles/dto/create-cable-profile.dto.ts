import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';
import { CableProfileStatus } from '../entities/cable-profile.entity';

export class CreateCableProfileDto {
    @ApiProperty({ example: 'Single Mode', description: 'Type of the cable' })
    @IsString()
    @IsNotEmpty()
    cable_type: string;

    @ApiProperty({ example: 96, description: 'Total number of fibers in the cable' })
    @IsInt()
    @IsPositive()
    fiber_count: number;

    @ApiProperty({ example: 8, description: 'Total number of tubes in the cable' })
    @IsInt()
    @IsPositive()
    tube_count: number;

    @ApiProperty({ example: 12, description: 'Number of fibers per tube' })
    @IsInt()
    @IsPositive()
    fibers_per_tube: number;

    @ApiProperty({
        example: 'Red,Green,Blue,Yellow,White,Gray,Brown,Pink',
        description: 'Comma-separated color coding sequence for all tubes',
    })
    @IsString()
    @IsNotEmpty()
    tube_color_coding: string;

    @ApiProperty({
        example: 'Blue,Orange,Green,Brown,Slate,White,Red,Black,Yellow,Violet,Rose,Aqua',
        description: 'Comma-separated color coding sequence for all fibers per tube',
    })
    @IsString()
    @IsNotEmpty()
    fiber_color_coding: string;

    @ApiPropertyOptional({
        example: 'R1,R2,R3,R4',
        description: 'Ribbon coding sequence (mandatory for ribbon cables; omit or leave blank for others)',
    })
    @IsOptional()
    @IsString()
    ribbon_coding?: string;

    @ApiProperty({ example: 'DWG-2026-001', description: 'Drawing number for this cable profile' })
    @IsString()
    @IsNotEmpty()
    drawing_number: string;

    @ApiProperty({ example: 0.35, description: 'Group Refractive Index at 850 nm' })
    @IsNumber()
    @Min(0)
    gri_850nm: number;

    @ApiProperty({ example: 0.35, description: 'Group Refractive Index at 1300 nm' })
    @IsNumber()
    @Min(0)
    gri_1300nm: number;

    @ApiProperty({ example: 0.35, description: 'Group Refractive Index at 1550 nm' })
    @IsNumber()
    @Min(0)
    gri_1550nm: number;

    @ApiPropertyOptional({ enum: CableProfileStatus, default: CableProfileStatus.ACTIVE, description: 'Status of the profile' })
    @IsOptional()
    @IsEnum(CableProfileStatus)
    status?: CableProfileStatus;
}
