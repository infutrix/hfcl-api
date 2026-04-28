import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        example: 'abc123token',
        description: 'Password reset token received via email',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        example: 'NewStrongPass@123',
        description: 'New password (minimum 6 characters)',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    new_password: string;
}
