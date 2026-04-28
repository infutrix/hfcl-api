import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum LoginStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
}

@Entity('login_history')
export class LoginHistory {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 1, nullable: true, description: 'User ID (null on failed login with unknown email)' })
    @Column({ name: 'user_id', type: 'int', nullable: true })
    user_id: number;

    @ApiProperty({ example: 'john.doe@example.com', description: 'Email used during login attempt' })
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @ApiProperty({ enum: LoginStatus, example: LoginStatus.SUCCESS })
    @Column({ type: 'enum', enum: LoginStatus })
    status: LoginStatus;

    @ApiProperty({ example: '192.168.1.1', nullable: true })
    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    ip_address: string;

    @ApiProperty({ example: 'Mozilla/5.0 ...', nullable: true })
    @Column({ name: 'user_agent', type: 'text', nullable: true })
    user_agent: string;

    @ApiProperty({ example: 'Invalid password', nullable: true, description: 'Reason for failure (only on failed logins)' })
    @Column({ name: 'failure_reason', type: 'varchar', length: 255, nullable: true })
    failure_reason: string;

    @ApiProperty({ example: '2026-04-28T10:00:00.000Z' })
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
