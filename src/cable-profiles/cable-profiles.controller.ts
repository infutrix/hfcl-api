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
import { Public } from '../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { CableProfilesService, CableProfileColorsResponse } from './cable-profiles.service';
import { CreateCableProfileDto } from './dto/create-cable-profile.dto';
import { UpdateCableProfileDto } from './dto/update-cable-profile.dto';
import { CableProfile } from './entities/cable-profile.entity';

@ApiTags('Cable Profiles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('cable-profiles')
export class CableProfilesController {
    constructor(private readonly cableProfilesService: CableProfilesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new cable profile' })
    @ApiResponse({ status: 201, description: 'Cable profile created successfully.', type: CableProfile })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(@Body() dto: CreateCableProfileDto, @CurrentUser() user: User | null): Promise<CableProfile> {
        try {
            return await this.cableProfilesService.create(dto, user?.id);
        } catch (error) {
            console.error('[CableProfilesController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all cable profiles' })
    @ApiResponse({ status: 200, description: 'List of cable profiles.', type: [CableProfile] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<CableProfile[]> {
        try {
            return await this.cableProfilesService.findAll();
        } catch (error) {
            console.error('[CableProfilesController] findAll error:', error);
            throw error;
        }
    }

    @Public()
    @Get('profile-colors')
    @ApiOperation({
        summary: 'Cable profile color schemes (static reference)',
        description: 'Public reference data; no authentication required.',
    })
    @ApiResponse({ status: 200, description: 'Profiles with strand, ribbon, tube, and fiber color definitions.' })
    getProfileColors(): CableProfileColorsResponse {
        return this.cableProfilesService.getCableProfileColors();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a cable profile by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable profile' })
    @ApiResponse({ status: 200, description: 'Cable profile found.', type: CableProfile })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable profile not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CableProfile> {
        try {
            return await this.cableProfilesService.findOne(id);
        } catch (error) {
            console.error('[CableProfilesController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a cable profile' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable profile to update' })
    @ApiResponse({ status: 200, description: 'Cable profile updated successfully.', type: CableProfile })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable profile not found.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCableProfileDto,
        @CurrentUser() user: User | null,
    ): Promise<CableProfile> {
        try {
            return await this.cableProfilesService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[CableProfilesController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a cable profile' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable profile to delete' })
    @ApiResponse({ status: 204, description: 'Cable profile deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable profile not found.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        try {
            return await this.cableProfilesService.remove(id, user?.id);
        } catch (error) {
            console.error('[CableProfilesController] remove error:', error);
            throw error;
        }
    }
}
