import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateSfgStageDto {
    @ApiProperty({ example: 'Tubing', description: 'Unique name of the SFG stage' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @ApiPropertyOptional({ example: 'TBG', description: 'Short code for the stage' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    code?: string;

    @ApiProperty({ example: 1, description: 'Order/sequence of the stage in the process' })
    @IsInt()
    @IsPositive()
    sequence: number;

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}

export class UpdateSfgStageDto {
    @ApiPropertyOptional({ example: 'Tubing', description: 'Unique name of the SFG stage' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name?: string;

    @ApiPropertyOptional({ example: 'TBG', description: 'Short code for the stage' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    code?: string;

    @ApiPropertyOptional({ example: 1, description: 'Order/sequence of the stage in the process' })
    @IsOptional()
    @IsInt()
    @IsPositive()
    sequence?: number;

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
