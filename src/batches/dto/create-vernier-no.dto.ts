import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVernierNoDto {
    @ApiProperty({ example: 'ABC-123S', description: 'Unique vernier number' })
    @IsString()
    @IsNotEmpty()
    vernier_no: string;

    @ApiPropertyOptional({ example: true, description: 'Active flag for dropdown filtering', default: true })
    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @ApiPropertyOptional({ example: '2027-03-19', description: 'Next calibration due date (YYYY-MM-DD); null clears it' })
    @IsOptional()
    @IsDateString({ strict: true })
    calibration_due_date?: string | null;
}
