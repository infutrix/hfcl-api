import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CableProfileStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('cable_profiles')
export class CableProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'cable_type', type: 'varchar', length: 150 })
    cable_type: string;

    @Column({ name: 'fiber_count', type: 'int' })
    fiber_count: number;

    @Column({ name: 'tube_count', type: 'int' })
    tube_count: number;

    @Column({ name: 'fibers_per_tube', type: 'int' })
    fibers_per_tube: number;

    @Column({ name: 'tube_color_coding', type: 'text' })
    tube_color_coding: string;

    @Column({ name: 'fiber_color_coding', type: 'text' })
    fiber_color_coding: string;

    @Column({ name: 'ribbon_coding', type: 'text', nullable: true })
    ribbon_coding: string;

    @Column({ name: 'drawing_number', type: 'varchar', length: 150 })
    drawing_number: string;

    @Column({ name: 'gri_850nm', type: 'decimal', precision: 10, scale: 6 })
    gri_850nm: number;

    @Column({ name: 'gri_1300nm', type: 'decimal', precision: 10, scale: 6 })
    gri_1300nm: number;

    @Column({ name: 'gri_1550nm', type: 'decimal', precision: 10, scale: 6 })
    gri_1550nm: number;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'modified_by_id' })
    modified_by: User;
}
