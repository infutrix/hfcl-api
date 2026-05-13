import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBatchCableProfileDto {
    @ApiPropertyOptional({ example: 1, description: 'Batch ID — links to batches.id (optional)' })
    @IsOptional()
    @IsInt()
    batch_id?: number;

    @ApiPropertyOptional({ example: 1, description: 'OTDR device ID (optional)' })
    @IsOptional()
    @IsInt()
    otdr_device_id?: number;

    @ApiPropertyOptional({ example: 1, description: 'Cable profile ID (optional)' })
    @IsOptional()
    @IsInt()
    cable_profile_id?: number;

    @ApiPropertyOptional({ example: 1, description: 'Customer ID (optional)' })
    @IsOptional()
    @IsInt()
    customer_id?: number;

    @ApiPropertyOptional({
        example: 1,
        description: 'SFG stage ID — links to sfg_stages.id (maps to batch_cable_profiles.sfg_stage_id)',
    })
    @IsOptional()
    @IsInt()
    stage_id?: number;

    @ApiProperty({ example: 'D-001', description: 'Drum number' })
    @IsString()
    @IsNotEmpty()
    drum_number: string;

    @ApiProperty({ example: 'Single Mode', description: 'Fiber type' })
    @IsString()
    @IsNotEmpty()
    fiber_type: string;

}