import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserRoleDto {
    @ApiProperty({ example: 'admin', description: 'Unique role name (e.g. admin, editor, viewer)' })
    @IsString()
    @IsNotEmpty()
    role: string;
}
