import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
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
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { Batch } from './entities/batch.entity';

@ApiTags('Batches')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('batches')
export class BatchesController {
    constructor(private readonly batchesService: BatchesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new batch' })
    @ApiResponse({ status: 201, description: 'Batch created successfully.', type: Batch })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 409, description: 'Batch name or code already exists for this plant.' })
    async create(@Body() dto: CreateBatchDto, @CurrentUser() user: User | null): Promise<Batch> {
        try {
            return await this.batchesService.create(dto, user?.id);
        } catch (error) {
            console.error('[BatchesController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all batches' })
    @ApiResponse({ status: 200, description: 'List of batches returned successfully.', type: [Batch] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<Batch[]> {
        try {
            return await this.batchesService.findAll();
        } catch (error) {
            console.error('[BatchesController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a batch by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the batch' })
    @ApiResponse({ status: 200, description: 'Batch found.', type: Batch })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Batch not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Batch> {
        try {
            return await this.batchesService.findOne(id);
        } catch (error) {
            console.error('[BatchesController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a batch' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the batch to update' })
    @ApiResponse({ status: 200, description: 'Batch updated successfully.', type: Batch })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Batch not found.' })
    @ApiResponse({ status: 409, description: 'Batch name or code already exists for this plant.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBatchDto,
        @CurrentUser() user: User | null,
    ): Promise<Batch> {
        try {
            return await this.batchesService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[BatchesController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a batch' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the batch to delete' })
    @ApiResponse({ status: 204, description: 'Batch deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Batch not found.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        try {
            return await this.batchesService.remove(id, user?.id);
        } catch (error) {
            console.error('[BatchesController] remove error:', error);
            throw error;
        }
    }
}
