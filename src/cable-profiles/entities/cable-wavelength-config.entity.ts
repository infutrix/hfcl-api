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
import { CableWavelength } from './cable-wavelength.entity';

@Entity('cable_wavelength_configs')
export class CableWavelengthConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => CableWavelength, (wl) => wl.configs, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'cable_wavelength_id' })
    cable_wavelength: CableWavelength;

    @Column({ name: 'cable_wavelength_id' })
    cable_wavelength_id: number;

    @Column({ name: 'gri', type: 'decimal', precision: 6, scale: 4, nullable: false })
    gri: number;

    @Column({ name: 'min_attenuation', type: 'decimal', precision: 5, scale: 3, nullable: true })
    min_attenuation: number;

    @Column({ name: 'max_attenuation', type: 'decimal', precision: 5, scale: 3, nullable: true })
    max_attenuation: number;

    @Column({ name: 'unit', type: 'varchar', length: 10, default: 'dB/km' })
    unit: string;

    @Column({ name: 'version', type: 'int', default: 1 })
    version: number;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'modified_by_id' })
    modified_by: User;
}
