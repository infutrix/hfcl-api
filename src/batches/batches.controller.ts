import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BatchesService } from './batches.service';
import { Batch } from './entities/batch.entity';

@ApiTags('Batches')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('batches')
export class BatchesController {
    constructor(private readonly batchesService: BatchesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all batches' })
    @ApiResponse({ status: 200, description: 'List of batches.', type: [Batch] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<Batch[]> {
        return this.batchesService.findAll();
    }
}
