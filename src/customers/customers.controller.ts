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
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { Customer } from './entities/customer.entity';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new customer' })
    @ApiResponse({ status: 201, description: 'Customer created successfully.', type: Customer })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 409, description: 'Email already exists.' })
    async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: User | null): Promise<Customer> {
        try {
            return await this.customersService.create(dto, user?.id);
        } catch (error) {
            console.error('[CustomersController] create error:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all customers' })
    @ApiResponse({ status: 200, description: 'List of customers.', type: [Customer] })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async findAll(): Promise<Customer[]> {
        try {
            return await this.customersService.findAll();
        } catch (error) {
            console.error('[CustomersController] findAll error:', error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a customer by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the customer' })
    @ApiResponse({ status: 200, description: 'Customer found.', type: Customer })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Customer not found.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Customer> {
        try {
            return await this.customersService.findOne(id);
        } catch (error) {
            console.error('[CustomersController] findOne error:', error);
            throw error;
        }
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a customer' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the customer to update' })
    @ApiResponse({ status: 200, description: 'Customer updated successfully.', type: Customer })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Customer not found.' })
    @ApiResponse({ status: 409, description: 'Email already exists.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerDto,
        @CurrentUser() user: User | null,
    ): Promise<Customer> {
        try {
            return await this.customersService.update(id, dto, user?.id);
        } catch (error) {
            console.error('[CustomersController] update error:', error);
            throw error;
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft-delete a customer' })
    @ApiParam({ name: 'id', type: Number, description: 'Numeric ID of the customer to delete' })
    @ApiResponse({ status: 204, description: 'Customer deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Customer not found.' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User | null): Promise<void> {
        try {
            return await this.customersService.remove(id, user?.id);
        } catch (error) {
            console.error('[CustomersController] remove error:', error);
            throw error;
        }
    }
}
