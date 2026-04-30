import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlantDto {
    @ApiProperty({ example: 'Plant A', description: 'Name of the plant' })
    @IsString()
    @IsNotEmpty()
    plant_name: string;

    @ApiProperty({ example: 'Mumbai', description: 'Location of the plant' })
    @IsString()
    @IsNotEmpty()
    location: string;

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
