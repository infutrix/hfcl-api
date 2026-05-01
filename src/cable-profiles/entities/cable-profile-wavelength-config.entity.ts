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
import { CableProfile } from './cable-profile.entity';
import { CableWavelength } from './cable-wavelength.entity';

@Entity('cable_profile_wavelength_configs')
export class CableProfileWavelengthConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => CableProfile, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cable_profile_id' })
    cable_profile: CableProfile;

    @Column({ name: 'cable_profile_id', nullable: true })
    cable_profile_id: number;

    @Index()
    @ManyToOne(() => CableWavelength, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cable_wavelength_id' })
    cable_wavelength: CableWavelength;

    @Column({ name: 'cable_wavelength_id', nullable: true })
    cable_wavelength_id: number;

    @Column({ name: 'gri', type: 'decimal', precision: 6, scale: 4, nullable: false })
    gri: number;

    @Column({ name: 'min_attenuation', type: 'decimal', precision: 5, scale: 3, nullable: true })
    min_attenuation: number;

    @Column({ name: 'max_attenuation', type: 'decimal', precision: 5, scale: 3, nullable: true })
    max_attenuation: number;

    @Column({ name: 'unit', type: 'varchar', length: 10, default: 'dB/km' })
    unit: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
