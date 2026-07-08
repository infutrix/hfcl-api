import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BatchPhysicalParamsService } from './batch-physical-params.service';
import { SaveBatchPhysicalParamsDto } from './dto/save-batch-physical-params.dto';
import { BatchPhysicalParams } from './entities/batch-physical-params.entity';

@ApiTags('Batch physical params')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('batch-physical-params')
export class BatchPhysicalParamsController {
    constructor(private readonly batchPhysicalParamsService: BatchPhysicalParamsService) { }

    @Post()
    @ApiOperation({
        summary: 'Save physical parameters for a batch cable profile session',
        description: 'Creates a new record or updates the existing one for the given batch_cable_profile_id.',
    })
    @ApiResponse({ status: 201, description: 'Saved.', type: BatchPhysicalParams })
    async save(
        @Body() dto: SaveBatchPhysicalParamsDto,
        @CurrentUser() user: User | null,
    ): Promise<BatchPhysicalParams> {
        return this.batchPhysicalParamsService.save(dto, user?.id);
    }

    @Get(':batchCableProfileId')
    @ApiOperation({ summary: 'Get saved physical parameters for a batch cable profile session' })
    @ApiParam({ name: 'batchCableProfileId', type: Number })
    @ApiResponse({ status: 200, description: 'Found.', type: BatchPhysicalParams })
    @ApiResponse({ status: 404, description: 'Not found.' })
    async findByBatchCableProfileId(
        @Param('batchCableProfileId', ParseIntPipe) batchCableProfileId: number,
    ): Promise<BatchPhysicalParams> {
        return this.batchPhysicalParamsService.findByBatchCableProfileId(batchCableProfileId);
    }
}
