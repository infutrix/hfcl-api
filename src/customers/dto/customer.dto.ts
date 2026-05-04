import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
    @ApiProperty({ example: 'Acme Corp', description: 'Full name of the customer' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @ApiPropertyOptional({ example: '+91-9876543210', description: 'Phone number' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    phone?: string;

    @ApiPropertyOptional({ example: 'acme@example.com', description: 'Email address' })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({ example: 'Acme Corporation Ltd.', description: 'Company name' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    company_name?: string;

    @ApiPropertyOptional({ example: '123 Main Street, Mumbai, MH 400001', description: 'Address' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    address?: string;

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}

export class UpdateCustomerDto {
    @ApiPropertyOptional({ example: 'Acme Corp', description: 'Full name of the customer' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name?: string;

    @ApiPropertyOptional({ example: '+91-9876543210', description: 'Phone number' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    phone?: string;

    @ApiPropertyOptional({ example: 'acme@example.com', description: 'Email address' })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({ example: 'Acme Corporation Ltd.', description: 'Company name' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    company_name?: string;

    @ApiPropertyOptional({ example: '123 Main Street, Mumbai, MH 400001', description: 'Address' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    address?: string;

    @ApiPropertyOptional({ example: true, description: 'Status: true = active, false = inactive' })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
