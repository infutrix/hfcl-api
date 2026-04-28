import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('user_roles')
export class UserRole {
    @ApiProperty({ example: 1, description: 'Auto-incremented primary key' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'admin', description: 'Unique role name (e.g. admin, editor, viewer)' })
    @Column({ type: 'varchar', length: 100, unique: true })
    role: string;

    @ApiProperty({ example: '2026-04-28T10:00:00.000Z', description: 'Timestamp when the role was created' })
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ApiProperty({ example: '2026-04-28T10:00:00.000Z', description: 'Timestamp when the role was last updated' })
    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;
}
