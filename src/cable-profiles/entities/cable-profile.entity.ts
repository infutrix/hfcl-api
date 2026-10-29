import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CableType } from './cable-type.entity';
import { CableProfileWavelengthConfig } from './cable-profile-wavelength-config.entity';
import { CableProfileStructure, ColorProfile } from '../cable-profile-structure';

export enum CableProfileStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('cable_profiles')
export class CableProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 255, unique: true })
    cable_profile_name: string;

    @Index()
    @ManyToOne(() => CableType, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cable_type_id' })
    cable_type: CableType;

    @Column({ type: 'varchar', length: 255, unique: true })
    profile_key_value: string;

    /**
     * Admin-defined fiber layout and colors. Null for profiles that still use the built-in
     * template with the same `profile_key_value` (cable-profile-colors.data.json).
     */
    @Column({ name: 'structure', type: 'json', nullable: true, default: null })
    structure: CableProfileStructure | null;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @Column({ name: 'deleted', type: 'boolean', default: false })
    deleted: boolean;

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

    @OneToMany(() => CableProfileWavelengthConfig, (config) => config.cable_profile)
    wavelength_configs: CableProfileWavelengthConfig[];

    /** Resolved `structure` (or matching built-in template); set by CableProfilesService.findAll / findOne only. */
    colorProfile?: ColorProfile | null;
}
