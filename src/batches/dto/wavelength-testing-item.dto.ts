import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class WavelengthTestingItemDto {
    @ApiPropertyOptional({ example: '1.4660', description: 'IOR value in nm' })
    @IsOptional()
    @IsString()
    ior_value_in_nm?: string;

    @ApiPropertyOptional({ example: '0.350', description: 'Fiber value' })
    @IsOptional()
    @IsString()
    fiber_value?: string;
}
