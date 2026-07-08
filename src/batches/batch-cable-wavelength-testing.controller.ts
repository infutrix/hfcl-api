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
import { BatchCableWavelengthTestingService } from './batch-cable-wavelength-testing.service';
import { SaveBatchCableWavelengthTestingDto } from './dto/save-batch-cable-wavelength-testing.dto';
import { BatchCableWavelengthTestingResponseDto } from './dto/batch-cable-wavelength-testing-response.dto';

@ApiTags('Batch cable wavelength testing')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('batch-cable-wavelength-testing')
export class BatchCableWavelengthTestingController {
    constructor(
        private readonly batchCableWavelengthTestingService: BatchCableWavelengthTestingService,
    ) { }

    @Post()
    @ApiOperation({
        summary: 'Save OTDR length and wavelength testing data',
        description:
            'Updates `otdr_length_km` on the batch cable profile, deletes existing wavelength testing rows for the session, then inserts the posted `wavelength_testing` array.',
    })
    @ApiResponse({ status: 201, description: 'Saved.', type: BatchCableWavelengthTestingResponseDto })
    async save(
        @Body() dto: SaveBatchCableWavelengthTestingDto,
        @CurrentUser() user: User | null,
    ): Promise<BatchCableWavelengthTestingResponseDto> {
        return this.batchCableWavelengthTestingService.save(dto, user?.id);
    }

    @Get(':batchCableProfileId')
    @ApiOperation({ summary: 'Get OTDR length and wavelength testing records for a batch cable profile session' })
    @ApiParam({ name: 'batchCableProfileId', type: Number })
    @ApiResponse({ status: 200, description: 'Found.', type: BatchCableWavelengthTestingResponseDto })
    async findByBatchCableProfileId(
        @Param('batchCableProfileId', ParseIntPipe) batchCableProfileId: number,
    ): Promise<BatchCableWavelengthTestingResponseDto> {
        return this.batchCableWavelengthTestingService.findByBatchCableProfileId(batchCableProfileId);
    }
}
