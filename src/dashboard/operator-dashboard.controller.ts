import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BatchCableProfile } from '../batches/entities/batch-cable-profile.entity';
import { OperatorDashboardService } from './operator-dashboard.service';
import { OperatorDashboardStatsDto } from './dto/operator-dashboard-stats.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('operator-dashboard')
export class OperatorDashboardController {
    constructor(private readonly operatorDashboardService: OperatorDashboardService) { }

    @Get()
    @ApiOperation({ summary: 'Operator dashboard batch status counts' })
    @ApiResponse({
        status: 200,
        description: 'Pending, in-progress, and completed counts for the logged-in operator.',
        type: OperatorDashboardStatsDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getStats(@CurrentUser() user: User | null): Promise<OperatorDashboardStatsDto> {
        return this.operatorDashboardService.getStats(user);
    }

    @Get('batches')
    @ApiOperation({ summary: 'List batch sessions assigned to the logged-in operator' })
    @ApiResponse({ status: 200, description: 'Operator batch sessions.', type: [BatchCableProfile] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getBatches(@CurrentUser() user: User | null): Promise<BatchCableProfile[]> {
        return this.operatorDashboardService.getBatches(user);
    }
}
