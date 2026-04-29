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
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
    create(@Body() dto: CreatePlantDto, @Req() req: Request): Promise<Plant> {
        return this.plantsService.create(dto, (req.user as any)?.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all plants' })
    @ApiResponse({ status: 200, description: 'List of plants returned successfully.', type: [Plant] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    findAll(): Promise<Plant[]> {
        return this.plantsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a plant by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the plant' })
    @ApiResponse({ status: 200, description: 'Plant found.', type: Plant })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Plant not found.' })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Plant> {
        return this.plantsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a plant' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the plant to update' })
    @ApiResponse({ status: 200, description: 'Plant updated successfully.', type: Plant })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Plant not found.' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdatePlantDto,
        @Req() req: Request,
    ): Promise<Plant> {
        return this.plantsService.update(id, dto, (req.user as any)?.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a plant' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the plant to delete' })
    @ApiResponse({ status: 204, description: 'Plant deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Plant not found.' })
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
        return this.plantsService.remove(id, (req.user as any)?.id);
    }
}
