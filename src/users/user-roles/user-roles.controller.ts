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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
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
    create(@Body() dto: CreateUserRoleDto, @Req() req: Request): Promise<UserRole> {
        return this.userRolesService.create(dto, (req.user as any)?.id);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all user roles',
        description: 'Returns all available roles ordered by ID ascending.',
    })
    @ApiResponse({ status: 200, description: 'List of roles returned successfully.', type: [UserRole] })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    findAll(): Promise<UserRole[]> {
        return this.userRolesService.findAll();
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
    findOne(@Param('id', ParseIntPipe) id: number): Promise<UserRole> {
        return this.userRolesService.findOne(id);
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
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserRoleDto,
        @Req() req: Request,
    ): Promise<UserRole> {
        return this.userRolesService.update(id, dto, (req.user as any)?.id);
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
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request): Promise<void> {
        return this.userRolesService.remove(id, (req.user as any)?.id);
    }
}
