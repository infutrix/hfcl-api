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
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CableTypesService } from './cable-types.service';
import { CreateCableTypeDto } from './dto/create-cable-type.dto';
import { UpdateCableTypeDto } from './dto/update-cable-type.dto';
import { CableType } from './entities/cable-type.entity';

@ApiTags('Cable Types')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('cable-types')
export class CableTypesController {
    constructor(private readonly cableTypesService: CableTypesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new cable type' })
    @ApiBody({
        type: CreateCableTypeDto,
        examples: {
            with_sub_types: {
                summary: 'Root type with sub-types',
                value: {
                    name: 'IBR',
                    attributes: ['fiber', 'ribbon', 'strand'],
                    status: true,
                    sub_type: [
                        { name: 'IBR-24F' },
                        { name: 'IBR-48F' },
                    ],
                },
            },
            simple: {
                summary: 'Simple type without sub-types',
                value: {
                    name: 'IBR',
                    attributes: ['fiber', 'ribbon', 'strand'],
                    status: true,
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Cable type created successfully.', type: CableType })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async create(@Body() dto: CreateCableTypeDto, @CurrentUser() user: User | null): Promise<CableType> {
        try {
            return await this.cableTypesService.create(dto, user?.id);
        } catch (error) {
            console.error('[CableTypesController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all cable types (with parent and children)' })
    @ApiResponse({ status: 200, description: 'List of cable types.', type: [CableType] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<CableType[]> {
        try {
            return await this.cableTypesService.findAll();
        } catch (error) {
            console.error('[CableTypesController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a cable type by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable type' })
    @ApiResponse({ status: 200, description: 'Cable type found.', type: CableType })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable type not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CableType> {
        try {
            return await this.cableTypesService.findOne(id);
        } catch (error) {
            console.error('[CableTypesController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a cable type' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable type to update' })
    @ApiResponse({ status: 200, description: 'Cable type updated successfully.', type: CableType })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable type not found.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCableTypeDto,
        @CurrentUser() user: User | null,
    ): Promise<CableType> {
        try {
            return await this.cableTypesService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[CableTypesController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a cable type' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the cable type to delete' })
    @ApiResponse({ status: 204, description: 'Cable type deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Cable type not found.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        try {
            return await this.cableTypesService.remove(id);
        } catch (error) {
            console.error('[CableTypesController] remove error:', error);
            throw error;
        }
    }
}
