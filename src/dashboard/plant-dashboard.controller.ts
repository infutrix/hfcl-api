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
import { PlantDashboardService } from './plant-dashboard.service';
import { PlantDashboardStatsDto } from './dto/plant-dashboard-stats.dto';

@ApiTags('Plant Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('plant-dashboard')
export class PlantDashboardController {
    constructor(private readonly plantDashboardService: PlantDashboardService) { }

    @Get()
    @ApiOperation({ summary: 'Plant dashboard overview' })
    @ApiResponse({ status: 200, description: 'Plant dashboard data returned.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getOverview() {
        return this.plantDashboardService.getOverview();
    }

    @Get('stats')
    @ApiOperation({ summary: 'Plant dashboard stats' })
    @ApiResponse({ status: 200, description: 'Plant-scoped aggregate counts (zeros if user has no plant).', type: PlantDashboardStatsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getStats(@CurrentUser() user: User | null): Promise<PlantDashboardStatsDto> {
        return this.plantDashboardService.getStats(user);
    }
}
