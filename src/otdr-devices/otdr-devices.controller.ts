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
import { OtdrDevicesService } from './otdr-devices.service';
import { CreateOtdrDeviceDto } from './dto/create-otdr-device.dto';
import { UpdateOtdrDeviceDto } from './dto/update-otdr-device.dto';
import { OtdrDevice } from './entities/otdr-device.entity';

@ApiTags('OTDR Devices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('otdr-devices')
export class OtdrDevicesController {
    constructor(private readonly otdrDevicesService: OtdrDevicesService) { }

    @Post()
    @ApiOperation({ summary: 'Register a new OTDR device' })
    @ApiResponse({ status: 201, description: 'Device registered successfully.', type: OtdrDevice })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 409, description: 'Device ID already exists.' })
    async create(@Body() dto: CreateOtdrDeviceDto, @CurrentUser() user: User | null): Promise<OtdrDevice> {
        try {
            return await this.otdrDevicesService.create(dto, user?.id);
        } catch (error) {
            console.error('[OtdrDevicesController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all OTDR devices' })
    @ApiResponse({ status: 200, description: 'List of OTDR devices.', type: [OtdrDevice] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<OtdrDevice[]> {
        try {
            return await this.otdrDevicesService.findAll();
        } catch (error) {
            console.error('[OtdrDevicesController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an OTDR device by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the device' })
    @ApiResponse({ status: 200, description: 'Device found.', type: OtdrDevice })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Device not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<OtdrDevice> {
        try {
            return await this.otdrDevicesService.findOne(id);
        } catch (error) {
            console.error('[OtdrDevicesController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an OTDR device' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the device to update' })
    @ApiResponse({ status: 200, description: 'Device updated successfully.', type: OtdrDevice })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Device not found.' })
    @ApiResponse({ status: 409, description: 'Device ID already exists.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateOtdrDeviceDto,
        @CurrentUser() user: User | null,
    ): Promise<OtdrDevice> {
        try {
            return await this.otdrDevicesService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[OtdrDevicesController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an OTDR device' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the device to delete' })
    @ApiResponse({ status: 204, description: 'Device deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Device not found.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        try {
            return await this.otdrDevicesService.remove(id, user?.id);
        } catch (error) {
            console.error('[OtdrDevicesController] remove error:', error);
            throw error;
        }
    }
}
