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
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { WavelengthConfigsService } from './wavelength-configs.service';
import { CreateWavelengthConfigDto } from './dto/create-wavelength-config.dto';
import { UpdateWavelengthConfigDto } from './dto/update-wavelength-config.dto';
import { CableWavelengthConfig } from './entities/cable-wavelength-config.entity';

@ApiTags('Wavelength Configs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('wavelength-configs')
export class WavelengthConfigsController {
    constructor(private readonly wavelengthConfigsService: WavelengthConfigsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new wavelength config' })
    @ApiResponse({ status: 201, description: 'Wavelength config created successfully.', type: CableWavelengthConfig })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(@Body() dto: CreateWavelengthConfigDto, @CurrentUser() user: User | null): Promise<CableWavelengthConfig> {
        try {
            return await this.wavelengthConfigsService.create(dto, user?.id);
        } catch (error) {
            console.error('[WavelengthConfigsController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all wavelength configs' })
    @ApiQuery({ name: 'wavelengthId', required: false, type: Number, description: 'Filter by cable wavelength ID' })
    @ApiResponse({ status: 200, description: 'List of wavelength configs.', type: [CableWavelengthConfig] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(@Query('wavelengthId', new ParseIntPipe({ optional: true })) wavelengthId?: number): Promise<CableWavelengthConfig[]> {
        try {
            if (wavelengthId) {
                return await this.wavelengthConfigsService.findByWavelength(wavelengthId);
            }
            return await this.wavelengthConfigsService.findAll();
        } catch (error) {
            console.error('[WavelengthConfigsController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a wavelength config by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the wavelength config' })
    @ApiResponse({ status: 200, description: 'Wavelength config found.', type: CableWavelengthConfig })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Wavelength config not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CableWavelengthConfig> {
        try {
            return await this.wavelengthConfigsService.findOne(id);
        } catch (error) {
            console.error('[WavelengthConfigsController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a wavelength config' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the wavelength config to update' })
    @ApiResponse({ status: 200, description: 'Wavelength config updated successfully.', type: CableWavelengthConfig })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Wavelength config not found.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateWavelengthConfigDto,
        @CurrentUser() user: User | null,
    ): Promise<CableWavelengthConfig> {
        try {
            return await this.wavelengthConfigsService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[WavelengthConfigsController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a wavelength config' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the wavelength config to delete' })
    @ApiResponse({ status: 204, description: 'Wavelength config deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Wavelength config not found.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        try {
            return await this.wavelengthConfigsService.remove(id);
        } catch (error) {
            console.error('[WavelengthConfigsController] remove error:', error);
            throw error;
        }
    }
}
