import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PlantStatus } from '../entities/plant.entity';

export class CreatePlantDto {
    @ApiProperty({ example: 'Plant A', description: 'Name of the plant' })
    @IsString()
    @IsNotEmpty()
    plant_name: string;

    @ApiProperty({ example: 'Mumbai', description: 'Location of the plant' })
    @IsString()
    @IsNotEmpty()
    location: string;

    @ApiPropertyOptional({ enum: PlantStatus, default: PlantStatus.ACTIVE, description: 'Status of the plant' })
    @IsOptional()
    @IsEnum(PlantStatus)
    status?: PlantStatus;
}
