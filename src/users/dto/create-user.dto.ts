import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class CreateUserDto {
    @ApiProperty({ example: 'John', description: "User's first name" })
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @ApiProperty({ example: 'Doe', description: "User's last name" })
    @IsString()
    @IsNotEmpty()
    last_name: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'Unique email address used for authentication' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'StrongPass@123', minLength: 6, description: 'Plain-text password (min 6 characters); stored hashed' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({ example: 1, description: 'ID of the role to assign (references user_roles.id)' })
    @IsOptional()
    @IsInt()
    role_id?: number;

    @ApiPropertyOptional({ example: 1, description: 'ID of the assigned plant (references plants.id)' })
    @IsOptional()
    @IsInt()
    plant_id?: number;

    @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE, description: 'Initial account status' })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;
}
