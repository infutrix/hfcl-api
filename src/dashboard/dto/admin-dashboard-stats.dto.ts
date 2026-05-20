import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardStatsDto {
    @ApiProperty({ example: 42, description: 'Non-deleted users' })
    total_users: number;

    @ApiProperty({ example: 5, description: 'Total plants' })
    total_plants: number;

    @ApiProperty({ example: 120, description: 'Non-deleted batch cable profiles (batch sessions)' })
    total_batch_sessions: number;

    @ApiProperty({
        example: 18,
        description: 'Non-deleted batch cable profiles with status in-progress (1)',
    })
    total_active_batch_sessions: number;
}
