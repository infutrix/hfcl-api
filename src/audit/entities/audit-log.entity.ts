import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int', nullable: true })
    user_id: number;

    @Column({ type: 'enum', enum: AuditAction })
    action: AuditAction;

    @Column({ name: 'entity_name', type: 'varchar', length: 100 })
    entity_name: string;

    @Column({ name: 'entity_id', type: 'int', nullable: true })
    entity_id: number;

    @Column({ name: 'old_values', type: 'json', nullable: true })
    old_values: Record<string, any>;

    @Column({ name: 'new_values', type: 'json', nullable: true })
    new_values: Record<string, any>;

    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    ip_address: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
