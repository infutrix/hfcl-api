import { ApiProperty } from '@nestjs/swagger';
import { BatchCableProfile } from '../entities/batch-cable-profile.entity';
import { BatchFiberTesting } from '../entities/batch-fiber-testing.entity';

/** One UI column: `key` matches row fields (`fiber_number`, `attribute1_value`, …, `wavelength:1310`). */
export class FiberTestingTableHeaderDto {
    @ApiProperty({ example: 'fiber_number', description: 'Stable key for binding cells' })
    key: string;

    @ApiProperty({ example: 'FIBER NO', description: 'Column title for the grid header' })
    label: string;
}

export class FiberTestingSavedTableDto {
    @ApiProperty({ type: [FiberTestingTableHeaderDto], description: 'Header row for the fiber testing table' })
    headers: FiberTestingTableHeaderDto[];

    @ApiProperty({ type: [BatchFiberTesting], description: 'Saved rows ordered by fiber_number' })
    rows: BatchFiberTesting[];

    @ApiProperty({
        nullable: true,
        description:
            'Matched entry from cable-profile-colors.data.json for `cable_profile.profile_key_value` (null if no match).',
        example: {
            cable_type: 'MULTI_TUBE',
            profile_key_value: '24T_12F_MULTI_TUBE_PROFILE1',
            profile_display_name: '24*12 Multi Tube',
        },
    })
    colorProfile: Record<string, unknown> | null;
}
