import { ApiProperty } from '@nestjs/swagger';
import { FiberWavelengthReading } from '../entities/batch-fiber-testing.entity';

export class FiberWavelengthReadingApiDto {
    @ApiProperty({ example: '1310' })
    wavelength_nm: string;

    @ApiProperty({ example: '' })
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
