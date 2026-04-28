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

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

@Entity('audit_logs')
export class AuditLog {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 1, nullable: true, description: 'ID of the user who performed the action' })
    @Column({ name: 'user_id', type: 'int', nullable: true })
    user_id: number;

    @ApiProperty({ enum: AuditAction, example: AuditAction.CREATE })
    @Column({ type: 'enum', enum: AuditAction })
    action: AuditAction;

    @ApiProperty({ example: 'users', description: 'Name of the affected table / entity' })
    @Column({ name: 'entity_name', type: 'varchar', length: 100 })
    entity_name: string;

    @ApiProperty({ example: 5, description: 'Primary key of the affected record' })
    @Column({ name: 'entity_id', type: 'int', nullable: true })
    entity_id: number;

    @ApiProperty({ example: { status: 'inactive' }, nullable: true, description: 'Values before the change (null on CREATE)' })
    @Column({ name: 'old_values', type: 'json', nullable: true })
    old_values: Record<string, any>;

    @ApiProperty({ example: { status: 'active' }, nullable: true, description: 'Values after the change (null on DELETE)' })
    @Column({ name: 'new_values', type: 'json', nullable: true })
    new_values: Record<string, any>;

    @ApiProperty({ example: '192.168.1.1', nullable: true })
    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    ip_address: string;

    @ApiProperty({ example: '2026-04-28T10:00:00.000Z' })
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
