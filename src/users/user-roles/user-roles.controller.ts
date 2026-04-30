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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRolesService } from './user-roles.service';
import { CreateUserRoleDto } from '../dto/create-user-role.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UserRole } from '../entities/user-role.entity';

@ApiTags('User Roles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('user-roles')
export class UserRolesController {
    constructor(private readonly userRolesService: UserRolesService) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new user role',
        description: 'Creates a new role that can be assigned to users. Role names must be unique.',
    })
    @ApiResponse({ status: 201, description: 'Role created successfully.', type: UserRole })
    @ApiResponse({ status: 400, description: 'Validation failed – check request body.' })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    @ApiResponse({ status: 409, description: 'A role with this name already exists.' })
    async create(@Body() dto: CreateUserRoleDto, @CurrentUser() user: User | null): Promise<UserRole> {
        try {
            return await this.userRolesService.create(dto, user?.id);
        } catch (error) {
            console.error('[UserRolesController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({
        summary: 'Get all user roles',
        description: 'Returns all available roles ordered by ID ascending.',
    })
    @ApiResponse({ status: 200, description: 'List of roles returned successfully.', type: [UserRole] })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    async findAll(): Promise<UserRole[]> {
        try {
            return await this.userRolesService.findAll();
        } catch (error) {
            console.error('[UserRolesController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a user role by ID',
        description: 'Returns a single role by its numeric ID.',
    })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the role' })
    @ApiResponse({ status: 200, description: 'Role found and returned.', type: UserRole })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserRole> {
        try {
            return await this.userRolesService.findOne(id);
        } catch (error) {
            console.error('[UserRolesController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update a user role',
        description: 'Partially updates a role. The role name must remain unique.',
    })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the role to update' })
    @ApiResponse({ status: 200, description: 'Role updated successfully.', type: UserRole })
    @ApiResponse({ status: 400, description: 'Validation failed – check request body.' })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    @ApiResponse({ status: 409, description: 'Another role already uses this name.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserRoleDto,
        @CurrentUser() user: User | null,
    ): Promise<UserRole> {
        try {
            return await this.userRolesService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[UserRolesController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete a user role',
        description: 'Permanently deletes a role. Ensure no users are assigned to it before deleting.',
    })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the role to delete' })
    @ApiResponse({ status: 204, description: 'Role deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    @ApiResponse({ status: 404, description: 'Role not found.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        try {
            return await this.userRolesService.remove(id, user?.id);
        } catch (error) {
            console.error('[UserRolesController] remove error:', error);
            throw error;
        }
    }
}
