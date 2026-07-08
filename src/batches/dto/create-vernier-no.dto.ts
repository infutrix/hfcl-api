import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVernierNoDto {
    @ApiProperty({ example: 'ABC-123S', description: 'Unique vernier number' })
    @IsString()
    @IsNotEmpty()
    vernier_no: string;

    @ApiPropertyOptional({ example: true, description: 'Active flag for dropdown filtering', default: true })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
