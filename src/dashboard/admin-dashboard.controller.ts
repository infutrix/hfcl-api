import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardStatsDto } from './dto/admin-dashboard-stats.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('admin-dashboard')
export class AdminDashboardController {
    constructor(private readonly adminDashboardService: AdminDashboardService) { }

    @Get()
    @ApiOperation({ summary: 'Admin dashboard overview' })
    @ApiResponse({ status: 200, description: 'Admin dashboard data returned.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getOverview() {
        return this.adminDashboardService.getOverview();
    }

    @Get('stats')
    @ApiOperation({ summary: 'Admin dashboard stats' })
    @ApiResponse({ status: 200, description: 'Aggregate counts.', type: AdminDashboardStatsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getStats(): Promise<AdminDashboardStatsDto> {
        return this.adminDashboardService.getStats();
    }
}
