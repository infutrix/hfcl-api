import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { FiberWavelengthReading } from '../entities/batch-fiber-testing.entity';

export class FiberWavelengthReadingApiDto {
    @ApiProperty({ example: '1310' })
    @Transform(({ value }) => (value == null ? value : String(value)))
    @IsString()
    wavelength_nm: string;

    @ApiProperty({ example: '' })
    @Transform(({ value }) => (value == null ? value : String(value)))
    @IsString()
    measured_value: string;
}

export class FiberTestingMatrixRowDto {
    @ApiProperty()
    fiber_number: number;

    @ApiProperty()
    attribute1_name: string;

    @ApiProperty()
    attribute1_value: string;

    @ApiProperty()
    attribute2_name: string;

    @ApiProperty()
    attribute2_value: string;

    @ApiProperty()
    attribute3_name: string;

    @ApiProperty()
    attribute3_value: string;

    @ApiProperty({ type: [FiberWavelengthReadingApiDto] })
    waveLengths: FiberWavelengthReading[];
}
