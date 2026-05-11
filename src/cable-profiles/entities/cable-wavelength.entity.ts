import { User } from 'src/users/entities/user.entity';
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

@Entity('cable_wavelengths')
export class CableWavelength {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', unique: true, nullable: false, comment: 'Wavelength value in nm (e.g. 1310, 1550, 1625)' })
    value: number;

    @Column({ type: 'varchar', length: 10, default: 'nm' })
    wavelength_unit: string;

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

    @Column({ type: 'boolean', default: true })
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
