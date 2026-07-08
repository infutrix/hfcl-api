import { ApiProperty } from '@nestjs/swagger';
import { BatchCableWavelengthTesting } from '../entities/batch-cable-wavelength-testing.entity';

export class BatchCableWavelengthTestingResponseDto {
    @ApiProperty({ example: 1 })
    batch_cable_profile_id: number;

    @ApiProperty({ example: 100, nullable: true })
    otdr_length_km: number | null;

    @ApiProperty({ type: [BatchCableWavelengthTesting] })
    wavelength_testing: BatchCableWavelengthTesting[];
}
