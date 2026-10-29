import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BatchFiberTestingService } from './batch-fiber-testing.service';
import { UpdateBatchFiberTestingDto } from './dto/update-batch-fiber-testing.dto';
import { FiberTestingSavedTableDto } from './dto/fiber-testing-saved-table.dto';
import { BatchFiberTesting } from './entities/batch-fiber-testing.entity';
import { isSupportedImageMime, MAX_FIBER_TEST_IMAGE_BYTES, UploadedImage } from './fiber-test-image.storage';

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
            'Returns `headers`, `rows`, `batch_cable_profile` (including `wavelength_testing`, `physical_params`, nested `cable_profile` with `wavelength_configs` / `cable_type`, plus plant, batch, OTDR, operator, customer), and `colorProfile` (the cable profile structure, or its built-in template; null if neither). If there are no `rows` yet, `headers` still includes wavelength columns from the linked cable profile configs.',
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
    @UseInterceptors(
        FileInterceptor('image', {
            limits: { fileSize: MAX_FIBER_TEST_IMAGE_BYTES, files: 1 },
            fileFilter: (_req, file, callback) =>
                isSupportedImageMime(file.mimetype)
                    ? callback(null, true)
                    : callback(new BadRequestException('image must be a JPEG, PNG, WebP, BMP or TIFF file'), false),
        }),
    )
    @ApiConsumes('application/json', 'multipart/form-data')
    @ApiOperation({
        summary: 'Update fiber testing row (wavelengths + AI response + photo)',
        description:
            'Updates `fiber_wavelengths` for the batch fiber testing row, increments `testing_counter` by 1, and appends `ai_response` to `fiber_testing_ai_response`. Each call is also logged to `fiber_test_events` (tester, result vs. attenuation limits) for reporting. Send as multipart/form-data with an optional `image` file (the fiber photo the AI judged, max 25 MB) to keep it with this test; `fiber_wavelengths` is then a JSON-encoded string.',
    })
    @ApiParam({ name: 'id', type: Number, description: 'batch_fiber_testing.id' })
    @ApiResponse({ status: 200, description: 'Updated row.', type: BatchFiberTesting })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Batch fiber testing row not found.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBatchFiberTestingDto,
        @CurrentUser() user: User | null,
        @UploadedFile() image?: UploadedImage,
    ): Promise<BatchFiberTesting> {
        return this.batchFiberTestingService.updateBatchFiberTesting(id, dto, user, image);
    }
}
