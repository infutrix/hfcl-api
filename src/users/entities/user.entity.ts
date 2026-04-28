import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { UserRole } from './user-role.entity';

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

@Entity('users')
export class User {

    @ApiProperty({ example: 1, description: 'Auto-incremented primary key' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'John', description: "User's first name" })
    @Column({ name: 'first_name', type: 'varchar', length: 100 })
    first_name: string;

    @ApiProperty({ example: 'Doe', description: "User's last name" })
    @Column({ name: 'last_name', type: 'varchar', length: 100 })
    last_name: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'Unique email address used for login' })
    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @ApiHideProperty()
    @Column({ type: 'varchar', length: 255 })
    password: string;

    @ApiProperty({ example: 1, description: 'Foreign key referencing user_roles.id', nullable: true })
    @Column({ name: 'role_id', type: 'int', nullable: true })
    role_id: number;

    @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE, description: 'Account status: active | inactive | suspended' })
    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus;

    @ApiProperty({ example: false, description: 'Soft-delete flag; true means the record is deleted' })
    @Column({ type: 'tinyint', default: 0, width: 1 })
    deleted: boolean;

    @ApiProperty({ example: '2026-04-28T10:00:00.000Z', description: 'Timestamp when the user was created' })
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ApiProperty({ example: '2026-04-28T10:00:00.000Z', description: 'Timestamp when the user was last updated' })
    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;

    @ManyToOne(() => UserRole, { nullable: true, eager: false })
    @JoinColumn({ name: 'role_id' })
    userRole: UserRole;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password && !this.password.startsWith('$2b$')) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'modified_by_id' })
    modified_by: User;

}
