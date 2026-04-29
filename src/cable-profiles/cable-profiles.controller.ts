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
import { CableProfilesService } from './cable-profiles.service';
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
    create(@Body() dto: CreateCableProfileDto, @Req() req: Request): Promise<CableProfile> {
        return this.cableProfilesService.create(dto, (req.user as any)?.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all cable profiles' })
    @ApiResponse({ status: 200, description: 'List of cable profiles.', type: [CableProfile] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    findAll(): Promise<CableProfile[]> {
        return this.cableProfilesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a cable profile by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable profile' })
    @ApiResponse({ status: 200, description: 'Cable profile found.', type: CableProfile })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable profile not found.' })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<CableProfile> {
        return this.cableProfilesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a cable profile' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable profile to update' })
    @ApiResponse({ status: 200, description: 'Cable profile updated successfully.', type: CableProfile })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable profile not found.' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCableProfileDto,
        @Req() req: Request,
    ): Promise<CableProfile> {
        return this.cableProfilesService.update(id, dto, (req.user as any)?.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a cable profile' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable profile to delete' })
    @ApiResponse({ status: 204, description: 'Cable profile deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable profile not found.' })
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
        return this.cableProfilesService.remove(id, (req.user as any)?.id);
    }
}
