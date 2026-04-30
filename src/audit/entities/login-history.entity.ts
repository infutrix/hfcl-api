import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LoginStatus {
    SUCCESS = 'success',
    FAILED = 'failed',
}

@Entity('login_history')
export class LoginHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int', nullable: true })
    user_id: number;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'enum', enum: LoginStatus })
    status: LoginStatus;

    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    ip_address: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    user_agent: string;

    @Column({ name: 'failure_reason', type: 'varchar', length: 255, nullable: true })
    failure_reason: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
