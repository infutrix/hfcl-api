import { ApiProperty } from '@nestjs/swagger';

export class OperatorDashboardStatsDto {
    @ApiProperty({ example: 3, description: 'Pending batch sessions assigned to the logged-in operator' })
    pending_count: number;

    @ApiProperty({ example: 2, description: 'In-progress batch sessions assigned to the logged-in operator' })
    in_progress_count: number;

    @ApiProperty({ example: 5, description: 'Completed batch sessions assigned to the logged-in operator' })
    completed_count: number;
}
