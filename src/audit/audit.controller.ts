import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { LoginHistory } from './entities/login-history.entity';

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get('login-history')
    @ApiOperation({
        summary: 'Get login history',
        description: 'Returns the most recent 200 login attempts across all users.',
    })
    @ApiResponse({ status: 200, description: 'Login history returned.', type: [LoginHistory] })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    getLoginHistory(): Promise<LoginHistory[]> {
        return this.auditService.getLoginHistory();
    }

    @Get('login-history/user/:userId')
    @ApiOperation({
        summary: 'Get login history for a specific user',
        description: 'Returns the most recent 200 login attempts for the given user ID.',
    })
    @ApiParam({ name: 'userId', type: Number, description: 'Numeric ID of the user' })
    @ApiResponse({ status: 200, description: 'Login history returned.', type: [LoginHistory] })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    getLoginHistoryByUser(@Param('userId', ParseIntPipe) userId: number): Promise<LoginHistory[]> {
        return this.auditService.getLoginHistory(userId);
    }

    @Get('logs')
    @ApiOperation({
        summary: 'Get audit logs',
        description: 'Returns the most recent 200 audit log entries. Optionally filter by entity name.',
    })
    @ApiQuery({ name: 'entity', required: false, description: 'Filter by entity name (e.g. users, user_roles)' })
    @ApiResponse({ status: 200, description: 'Audit logs returned.', type: [AuditLog] })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    getAuditLogs(@Query('entity') entity?: string): Promise<AuditLog[]> {
        return this.auditService.getAuditLogs(entity);
    }
}
