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
import { BatchCableProfilesService } from './batch-cable-profiles.service';
import { CreateBatchCableProfileDto } from './dto/create-batch-cable-profile.dto';
import { UpdateBatchCableProfileDto } from './dto/update-batch-cable-profile.dto';
import { BatchCableProfile } from './entities/batch-cable-profile.entity';

@ApiTags('Batch cable profiles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('batch-cable-profiles')
export class BatchCableProfilesController {
    constructor(private readonly batchCableProfilesService: BatchCableProfilesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a batch cable profile' })
    @ApiResponse({ status: 201, description: 'Created.', type: BatchCableProfile })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(
        @Body() dto: CreateBatchCableProfileDto,
        @CurrentUser() user: User | null,
    ): Promise<BatchCableProfile> {
        return this.batchCableProfilesService.create(dto, user?.id);
    }

    @Get()
    @ApiOperation({ summary: 'List batch cable profiles (not soft-deleted)' })
    @ApiResponse({ status: 200, description: 'List returned.', type: [BatchCableProfile] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<BatchCableProfile[]> {
        return this.batchCableProfilesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a batch cable profile by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID' })
    @ApiResponse({ status: 200, description: 'Found.', type: BatchCableProfile })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<BatchCableProfile> {
        return this.batchCableProfilesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a batch cable profile' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID' })
    @ApiResponse({ status: 200, description: 'Updated.', type: BatchCableProfile })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Not found.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBatchCableProfileDto,
        @CurrentUser() user: User | null,
    ): Promise<BatchCableProfile> {
        return this.batchCableProfilesService.update(id, dto, user?.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft-delete a batch cable profile' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID' })
    @ApiResponse({ status: 204, description: 'Soft-deleted.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Not found.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        return this.batchCableProfilesService.remove(id, user?.id);
    }
}
