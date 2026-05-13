import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { BatchCableProfile } from './batch-cable-profile.entity';

/** One wavelength slot and its measurement (JSON stored in `fiber_wavelengths`). */
export interface FiberWavelengthReading {
    /** Wavelength identifier, typically nm (e.g. `"1310"`, `"1550"`). */
    wavelength_nm: string;
    /** Recorded result for that wavelength (e.g. refractive index `"1.4660"`). */
    measured_value: string;
}

@Entity('batch_fiber_testing')
export class BatchFiberTesting {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => BatchCableProfile, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'batch_cable_profile_id' })
    batch_cable_profile: BatchCableProfile | null;

    @Column({ type: 'int', nullable: true, default: 0 })
    fiber_number: number;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    attribute1_name: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    attribute1_value: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    attribute2_name: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    attribute2_value: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    attribute3_name: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    attribute3_value: string | null;

    @Column({ type: 'json', nullable: true, default: null })
    fiber_wavelengths: FiberWavelengthReading[] | null;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;
}

