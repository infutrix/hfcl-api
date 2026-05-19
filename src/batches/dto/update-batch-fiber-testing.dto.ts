import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Allow, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { FiberWavelengthReadingApiDto } from './fiber-testing-matrix.dto';

export class UpdateBatchFiberTestingDto {
    @ApiProperty({
        type: [FiberWavelengthReadingApiDto],
        example: [
            { wavelength_nm: '1310', measured_value: '0.35' },
            { wavelength_nm: '1550', measured_value: '0.22' },
            { wavelength_nm: '1625', measured_value: '0.28' },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FiberWavelengthReadingApiDto)
    fiber_wavelengths: FiberWavelengthReadingApiDto[];

    @ApiPropertyOptional({
        oneOf: [{ type: 'string' }, { type: 'object' }],
        example: '{"status":"success","fiber":{"color":"Blue","confidence":0.97}}',
        description: 'JSON string or object; stored as JSON in fiber_testing_ai_response.',
    })
    @Allow()
    @IsOptional()
    ai_response?: string | Record<string, unknown>;
}
