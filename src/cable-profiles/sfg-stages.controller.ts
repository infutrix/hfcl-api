import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
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
import { SfgStagesService } from './sfg-stages.service';
import { CreateSfgStageDto, UpdateSfgStageDto } from './dto/sfg-stage.dto';
import { SfgStage } from './entities/sfg-stage.entity';

@ApiTags('SFG Stages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('sfg-stages')
export class SfgStagesController {
    constructor(private readonly sfgStagesService: SfgStagesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new SFG stage' })
    @ApiResponse({ status: 201, description: 'SFG stage created successfully.', type: SfgStage })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 409, description: 'Stage name already exists.' })
    async create(@Body() dto: CreateSfgStageDto, @CurrentUser() user: User | null): Promise<SfgStage> {
        return this.sfgStagesService.create(dto, user?.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all SFG stages ordered by sequence' })
    @ApiResponse({ status: 200, description: 'List of SFG stages.', type: [SfgStage] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<SfgStage[]> {
        return this.sfgStagesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a SFG stage by UUID' })
    @ApiParam({ name: 'id', type: Number, description: 'UUID of the SFG stage' })
    @ApiResponse({ status: 200, description: 'SFG stage found.', type: SfgStage })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'SFG stage not found.' })
    async findOne(@Param('id', ParseUUIDPipe) id: number): Promise<SfgStage> {
        return this.sfgStagesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a SFG stage' })
    @ApiParam({ name: 'id', type: Number, description: 'UUID of the SFG stage to update' })
    @ApiResponse({ status: 200, description: 'SFG stage updated successfully.', type: SfgStage })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'SFG stage not found.' })
    @ApiResponse({ status: 409, description: 'Stage name already exists.' })
    async update(
        @Param('id', ParseUUIDPipe) id: number,
        @Body() dto: UpdateSfgStageDto,
        @CurrentUser() user: User | null,
    ): Promise<SfgStage> {
        return this.sfgStagesService.update(id, dto, user?.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft-delete a SFG stage' })
    @ApiParam({ name: 'id', type: Number, description: 'UUID of the SFG stage to delete' })
    @ApiResponse({ status: 204, description: 'SFG stage deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'SFG stage not found.' })
    async remove(@Param('id', ParseUUIDPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        return this.sfgStagesService.remove(id, user?.id);
    }
}
