import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../users/entities/user.entity';

export class UserProfileDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'John' })
    first_name: string;

    @ApiProperty({ example: 'Doe' })
    last_name: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    email: string;

    @ApiProperty({ example: 1, nullable: true })
    role_id: number;

    @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
    status: UserStatus;

    @ApiProperty({ example: '2026-04-28T10:00:00.000Z' })
    created_at: Date;

    @ApiProperty({ example: '2026-04-28T10:00:00.000Z' })
    modified_at: Date;
}

export class LoginResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT Bearer token – include as Authorization: Bearer <token>' })
    access_token: string;

    @ApiProperty({ example: '7d', description: 'Token expiry duration' })
    expires_in: string;

    @ApiProperty({ type: UserProfileDto })
    user: UserProfileDto;
}
