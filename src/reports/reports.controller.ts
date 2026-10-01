import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BatchReportQueryDto, LiveReportQueryDto, ReportRangeQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

/**
 * Testing reports built from the `fiber_test_events` log. A reading is "in range" when
 * min_attenuation <= value <= max_attenuation of the session's cable profile wavelength config.
 * Non-admin users with a plant only ever see their own plant.
 */
@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('filters')
    @ApiOperation({ summary: 'Plants, employees and cable profiles available as report filters' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getFilters(@CurrentUser() user: User | null) {
        return this.reportsService.getFilters(user);
    }

    @Get('testing')
    @ApiOperation({
        summary: 'Testing report for a date range (daily / weekly / monthly / yearly / custom)',
        description:
            'Summary with previous-period comparison, trend buckets, and breakdowns by wavelength, plant, cable profile and hour of day.',
    })
    @ApiResponse({ status: 400, description: 'Invalid date range.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getTestingReport(@Query() query: ReportRangeQueryDto, @CurrentUser() user: User | null) {
        return this.reportsService.getTestingReport(query, user);
    }

    @Get('employees')
    @ApiOperation({
        summary: 'Employee-wise testing and efficiency for a date range',
        description:
            'Per tester: volume, pass/fail, first-pass yield, retest rate, tests per active hour, average cycle time and an efficiency score (50% throughput vs. fastest tester, 30% first-pass yield, 20% low retests).',
    })
    @ApiResponse({ status: 400, description: 'Invalid date range.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getEmployeeReport(@Query() query: ReportRangeQueryDto, @CurrentUser() user: User | null) {
        return this.reportsService.getEmployeeReport(query, user);
    }

    @Get('batches')
    @ApiOperation({ summary: 'Batch session list with current in-range / out-of-range fiber counts' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getBatchReport(@Query() query: BatchReportQueryDto, @CurrentUser() user: User | null) {
        return this.reportsService.getBatchReport(query, user);
    }

    @Get('batches/:id')
    @ApiOperation({ summary: 'Fiber-by-wavelength grid of one batch session, each reading judged against its limits' })
    @ApiParam({ name: 'id', type: Number, description: 'batch_cable_profiles.id' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Batch session not found.' })
    getBatchSessionReport(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null) {
        return this.reportsService.getBatchSessionReport(id, user);
    }

    @Get('live')
    @ApiOperation({ summary: 'Live testing status: today KPIs, per-minute activity, active sessions and testers' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getLiveStatus(@Query() query: LiveReportQueryDto, @CurrentUser() user: User | null) {
        return this.reportsService.getLiveStatus(query, user);
    }
}
