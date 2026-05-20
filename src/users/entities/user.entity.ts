import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { UserRole } from './user-role.entity';
import { Plant } from 'src/plants/entities/plant.entity';

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

@Entity('users')
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'first_name', type: 'varchar', length: 100 })
    first_name: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100 })
    last_name: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Exclude()
    @Column({ type: 'varchar', length: 255 })
    password: string;

    // FK to user_roles — assign via userRole relation in create/update.
    @ManyToOne(() => UserRole, { nullable: true, eager: false })
    @JoinColumn({ name: 'role_id' })
    userRole: UserRole | null;

    @RelationId((user: User) => user.userRole)
    role_id: number | null;

    @Index()
    @ManyToOne(() => Plant, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'plant_id' })
    plant: Plant | null;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus;

    @Column({ type: 'tinyint', default: 0, width: 1 })
    deleted: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;

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
