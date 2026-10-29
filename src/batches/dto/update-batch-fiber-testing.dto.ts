import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { Allow, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { FiberWavelengthReadingApiDto } from './fiber-testing-matrix.dto';

/** Multipart bodies carry the readings as a JSON string; JSON bodies as an array (already typed by @Type). */
function toReadingDtos(value: unknown): unknown {
    let parsed = value;
    if (typeof value === 'string') {
        try {
            parsed = JSON.parse(value);
        } catch {
            return value; // left as a string so @IsArray reports it
        }
    }
    return Array.isArray(parsed) ? plainToInstance(FiberWavelengthReadingApiDto, parsed as object[]) : parsed;
}

export class UpdateBatchFiberTestingDto {
    @ApiProperty({
        type: [FiberWavelengthReadingApiDto],
        description: 'Array (JSON body) or JSON-encoded array string (multipart body).',
        example: [
            { wavelength_nm: '1310', measured_value: '0.35' },
            { wavelength_nm: '1550', measured_value: '0.22' },
            { wavelength_nm: '1625', measured_value: '0.28' },
        ],
    })
    @Type(() => FiberWavelengthReadingApiDto)
    @Transform(({ value }) => toReadingDtos(value))
    @IsArray()
    @ValidateNested({ each: true })
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
