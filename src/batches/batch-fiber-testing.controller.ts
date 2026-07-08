import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Put,
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
import { BatchFiberTestingService } from './batch-fiber-testing.service';
import { UpdateBatchFiberTestingDto } from './dto/update-batch-fiber-testing.dto';
import { FiberTestingSavedTableDto } from './dto/fiber-testing-saved-table.dto';
import { BatchFiberTesting } from './entities/batch-fiber-testing.entity';

@ApiTags('Batch fiber testing')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('batch-fiber-testing')
export class BatchFiberTestingController {
    constructor(private readonly batchFiberTestingService: BatchFiberTestingService) { }

    @Get('saved/:batchCableProfileId')
    @ApiOperation({
        summary: 'Saved fiber testing grid (headers + rows)',
        description:
            'Returns `headers`, `rows`, `batch_cable_profile` (including `wavelength_testing`, `physical_params`, nested `cable_profile` with `wavelength_configs` / `cable_type`, plus plant, batch, OTDR, operator, customer), and `colorProfile` (match from cable-profile-colors.data.json, or null). If there are no `rows` yet, `headers` still includes wavelength columns from the linked cable profile configs.',
    })
    @ApiParam({ name: 'batchCableProfileId', type: Number })
    @ApiResponse({ status: 200, description: 'Headers + rows for the fiber testing grid.', type: FiberTestingSavedTableDto })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Batch cable profile not found.' })
    async listSaved(
        @Param('batchCableProfileId', ParseIntPipe) batchCableProfileId: number,
    ): Promise<FiberTestingSavedTableDto> {
        return this.batchFiberTestingService.findSavedByBatchCableProfileId(batchCableProfileId);
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Update fiber testing row (wavelengths + AI response)',
        description:
            'Updates `fiber_wavelengths` for the batch fiber testing row, increments `testing_counter` by 1, and appends `ai_response` to `fiber_testing_ai_response`.',
    })
    @ApiParam({ name: 'id', type: Number, description: 'batch_fiber_testing.id' })
    @ApiResponse({ status: 200, description: 'Updated row.', type: BatchFiberTesting })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Batch fiber testing row not found.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBatchFiberTestingDto,
    ): Promise<BatchFiberTesting> {
        return this.batchFiberTestingService.updateBatchFiberTesting(id, dto);
    }
}
