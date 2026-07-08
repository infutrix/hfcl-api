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
import { VernierNosService } from './vernier-nos.service';
import { CreateVernierNoDto } from './dto/create-vernier-no.dto';
import { UpdateVernierNoDto } from './dto/update-vernier-no.dto';
import { VernierNo } from './entities/vernier-no.entity';

@ApiTags('Vernier Nos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('vernier-nos')
export class VernierNosController {
    constructor(private readonly vernierNosService: VernierNosService) { }

    @Post()
    @ApiOperation({ summary: 'Create a vernier number' })
    @ApiResponse({ status: 201, description: 'Created.', type: VernierNo })
    @ApiResponse({ status: 409, description: 'Vernier number already exists.' })
    async create(
        @Body() dto: CreateVernierNoDto,
        @CurrentUser() user: User | null,
    ): Promise<VernierNo> {
        return this.vernierNosService.create(dto, user?.id);
    }

    @Get()
    @ApiOperation({ summary: 'List vernier numbers' })
    @ApiQuery({ name: 'all', required: false, type: Boolean, description: 'Include inactive rows when true' })
    @ApiResponse({ status: 200, description: 'List returned.', type: [VernierNo] })
    async findAll(@Query('all') all?: string): Promise<VernierNo[]> {
        return this.vernierNosService.findAll(all !== 'true');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a vernier number by ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Found.', type: VernierNo })
    @ApiResponse({ status: 404, description: 'Not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<VernierNo> {
        return this.vernierNosService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a vernier number' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Updated.', type: VernierNo })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateVernierNoDto,
        @CurrentUser() user: User | null,
    ): Promise<VernierNo> {
        return this.vernierNosService.update(id, dto, user?.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a vernier number' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204, description: 'Deleted.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        return this.vernierNosService.remove(id, user?.id);
    }
}
