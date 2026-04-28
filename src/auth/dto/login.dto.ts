import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'Registered email address of the user',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'StrongPass@123',
        description: 'Account password',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}
