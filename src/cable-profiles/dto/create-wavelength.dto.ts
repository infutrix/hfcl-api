import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateWavelengthDto {
    @ApiProperty({ example: 1310, description: 'Wavelength value (e.g. 1310, 1550, 1625)' })
    @IsInt()
    @IsPositive()
    value: number;

    @ApiPropertyOptional({ example: 'nm', description: 'Unit of the wavelength (default: nm)' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    unit?: string;

    @ApiPropertyOptional({ example: true, description: 'Is active: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
