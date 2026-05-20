import { ApiProperty } from '@nestjs/swagger';

export class PlantDashboardStatsDto {
    @ApiProperty({ example: 12, description: 'Plant operators at the logged-in user\'s plant' })
    total_operators: number;

    @ApiProperty({ example: 45, description: 'Non-deleted batch cable profiles at the user\'s plant' })
    total_batch_sessions: number;

    @ApiProperty({
        example: 8,
        description: 'Non-deleted in-progress batch cable profiles at the user\'s plant',
    })
    total_active_batch_sessions: number;
}
