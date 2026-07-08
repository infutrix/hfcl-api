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
import { BatchCableProfile } from './batch-cable-profile.entity';

@Entity('batch_cable_wavelength_testing')
@Index(['batch_cable_profile', 'ior_value_in_nm'], { unique: true })
export class BatchCableWavelengthTesting {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => BatchCableProfile, (profile) => profile.wavelength_testing, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'batch_cable_profile_id' })
    batch_cable_profile: BatchCableProfile;

    @Column({ name: 'ior_value_in_nm', type: 'decimal', precision: 10, scale: 4, nullable: true, default: null })
    ior_value_in_nm: string | null;

    @Column({ name: 'fiber_value', type: 'decimal', precision: 10, scale: 4, nullable: true, default: null })
    fiber_value: string | null;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;
}
