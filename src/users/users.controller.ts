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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new user',
        description: 'Registers a new user. The password is automatically hashed before storage. Email must be unique.',
    })
    @ApiResponse({ status: 201, description: 'User created successfully.', type: User })
    @ApiResponse({ status: 400, description: 'Validation failed – check request body.' })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    @ApiResponse({ status: 409, description: 'A user with this email already exists.' })
    async create(@Body() dto: CreateUserDto, @CurrentUser() user: User | null): Promise<User> {
        try {
            return await this.usersService.create(dto, user?.id);
        } catch (error) {
            console.error('[UsersController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({
        summary: 'Get all users',
        description: 'Returns all non-deleted users, including their assigned role.',
    })
    @ApiResponse({ status: 200, description: 'List of users returned successfully.', type: [User] })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    async findAll(): Promise<User[]> {
        try {
            return await this.usersService.findAll();
        } catch (error) {
            console.error('[UsersController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get a user by ID',
        description: 'Returns a single non-deleted user by their numeric ID, including their assigned role.',
    })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the user' })
    @ApiResponse({ status: 200, description: 'User found and returned.', type: User })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
        try {
            return await this.usersService.findOne(id);
        } catch (error) {
            console.error('[UsersController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update a user',
        description: 'Partially updates a user record. All fields are optional. If the password is provided it will be re-hashed.',
    })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the user to update' })
    @ApiResponse({ status: 200, description: 'User updated successfully.', type: User })
    @ApiResponse({ status: 400, description: 'Validation failed – check request body.' })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    @ApiResponse({ status: 409, description: 'Another user already uses the provided email.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto,
        @CurrentUser() user: User | null,
    ): Promise<User> {
        try {
            return await this.usersService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[UsersController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Soft-delete a user',
        description: 'Marks the user as deleted (sets deleted = true). The record is retained in the database.',
    })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the user to delete' })
    @ApiResponse({ status: 204, description: 'User soft-deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        try {
            return await this.usersService.softDelete(id, user?.id);
        } catch (error) {
            console.error('[UsersController] remove error:', error);
            throw error;
        }
    }
}
