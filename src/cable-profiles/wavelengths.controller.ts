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
import { WavelengthsService } from './wavelengths.service';
import { CreateWavelengthWithConfigsDto } from './dto/create-wavelength-with-configs.dto';
import { UpdateWavelengthWithConfigsDto } from './dto/update-wavelength-with-configs.dto';
import { CableWavelength } from './entities/cable-wavelength.entity';

@ApiTags('Wavelengths')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('wavelengths')
export class WavelengthsController {
    constructor(private readonly wavelengthsService: WavelengthsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a wavelength (GRI and attenuation on the wavelength row)' })
    @ApiResponse({ status: 201, description: 'Wavelength created.', type: CableWavelength })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 409, description: 'Wavelength value already exists.' })
    async create(
        @Body() dto: CreateWavelengthWithConfigsDto,
        @CurrentUser() user: User | null,
    ): Promise<CableWavelength> {
        try {
            return await this.wavelengthsService.create(dto, user?.id);
        } catch (error) {
            console.error('[WavelengthsController] create error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a wavelength (GRI and attenuation fields)' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the wavelength' })
    @ApiResponse({ status: 200, description: 'Wavelength updated.', type: CableWavelength })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Wavelength not found.' })
    @ApiResponse({ status: 409, description: 'Wavelength value already exists.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateWavelengthWithConfigsDto,
        @CurrentUser() user: User | null,
    ): Promise<CableWavelength> {
        try {
            return await this.wavelengthsService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[WavelengthsController] update error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all wavelengths' })
    @ApiResponse({ status: 200, description: 'List of wavelengths.', type: [CableWavelength] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<CableWavelength[]> {
        try {
            return await this.wavelengthsService.findAll();
        } catch (error) {
            console.error('[WavelengthsController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a wavelength by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the wavelength' })
    @ApiResponse({ status: 200, description: 'Wavelength found.', type: CableWavelength })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Wavelength not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CableWavelength> {
        try {
            return await this.wavelengthsService.findOne(id);
        } catch (error) {
            console.error('[WavelengthsController] findOne error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a wavelength' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the wavelength to delete' })
    @ApiResponse({ status: 204, description: 'Wavelength deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Wavelength not found.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        try {
            return await this.wavelengthsService.remove(id);
        } catch (error) {
            console.error('[WavelengthsController] remove error:', error);
            throw error;
        }
    }
}
