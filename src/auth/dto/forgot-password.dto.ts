import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'Email address associated with the account',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
