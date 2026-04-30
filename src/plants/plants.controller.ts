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
import { PlantsService } from './plants.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { Plant } from './entities/plant.entity';

@ApiTags('Plants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('plants')
export class PlantsController {
    constructor(private readonly plantsService: PlantsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new plant' })
    @ApiResponse({ status: 201, description: 'Plant created successfully.', type: Plant })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(@Body() dto: CreatePlantDto, @CurrentUser() user: User | null): Promise<Plant> {
        try {
            return await this.plantsService.create(dto, user?.id);
        } catch (error) {
            console.error('[PlantsController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all plants' })
    @ApiResponse({ status: 200, description: 'List of plants returned successfully.', type: [Plant] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<Plant[]> {
        try {
            return await this.plantsService.findAll();
        } catch (error) {
            console.error('[PlantsController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a plant by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the plant' })
    @ApiResponse({ status: 200, description: 'Plant found.', type: Plant })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Plant not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Plant> {
        try {
            return await this.plantsService.findOne(id);
        } catch (error) {
            console.error('[PlantsController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a plant' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the plant to update' })
    @ApiResponse({ status: 200, description: 'Plant updated successfully.', type: Plant })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Plant not found.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdatePlantDto,
        @CurrentUser() user: User | null,
    ): Promise<Plant> {
        try {
            return await this.plantsService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[PlantsController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a plant' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the plant to delete' })
    @ApiResponse({ status: 204, description: 'Plant deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Plant not found.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        try {
            return await this.plantsService.remove(id, user?.id);
        } catch (error) {
            console.error('[PlantsController] remove error:', error);
            throw error;
        }
    }
}
