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
    create(@Body() dto: CreateOtdrDeviceDto, @Req() req: Request): Promise<OtdrDevice> {
        return this.otdrDevicesService.create(dto, (req.user as any)?.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all OTDR devices' })
    @ApiResponse({ status: 200, description: 'List of OTDR devices.', type: [OtdrDevice] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    findAll(): Promise<OtdrDevice[]> {
        return this.otdrDevicesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an OTDR device by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the device' })
    @ApiResponse({ status: 200, description: 'Device found.', type: OtdrDevice })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Device not found.' })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<OtdrDevice> {
        return this.otdrDevicesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an OTDR device' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the device to update' })
    @ApiResponse({ status: 200, description: 'Device updated successfully.', type: OtdrDevice })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Device not found.' })
    @ApiResponse({ status: 409, description: 'Device ID already exists.' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateOtdrDeviceDto,
        @Req() req: Request,
    ): Promise<OtdrDevice> {
        return this.otdrDevicesService.update(id, dto, (req.user as any)?.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an OTDR device' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the device to delete' })
    @ApiResponse({ status: 204, description: 'Device deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Device not found.' })
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
        return this.otdrDevicesService.remove(id, (req.user as any)?.id);
    }
}
