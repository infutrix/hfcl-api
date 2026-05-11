import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBatchDto {
    @ApiProperty({ example: 1, description: 'Plant ID' })
    @IsInt()
    @IsNotEmpty()
    plant_id: number;

    @ApiPropertyOptional({ example: 1, description: 'Cable Type ID' })
    @IsOptional()
    @IsInt()
    cable_type_id?: number;

    @ApiPropertyOptional({ example: 1, description: 'Cable Profile ID' })
    @IsOptional()
    @IsInt()
    cable_profile_id?: number;

    @ApiPropertyOptional({ example: 1, description: 'Customer ID' })
    @IsOptional()
    @IsInt()
    customer_id?: number;

    @ApiProperty({ example: 'Batch A', description: 'Name of the batch (unique per plant)' })
    @IsString()
    @IsNotEmpty()
    batch_name: string;

    @ApiProperty({ example: 'D-001', description: 'Drum number' })
    @IsString()
    @IsNotEmpty()
    drum_number: string;

    @ApiProperty({ example: 'Single Mode', description: 'Fiber type' })
    @IsString()
    @IsNotEmpty()
    fiber_type: string;

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
