import { User } from 'src/users/entities/user.entity';
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
import { CableWavelengthConfig } from './cable-wavelength-config.entity';

@Entity('cable_wavelengths')
export class CableWavelength {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', unique: true, nullable: false, comment: 'Wavelength value in nm (e.g. 1310, 1550, 1625)' })
    value: number;

    @Column({ type: 'varchar', length: 10, default: 'nm' })
    unit: string;

    @Column({ type: 'boolean', default: true })
    status: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;

    @OneToMany(() => CableWavelengthConfig, (config) => config.cable_wavelength)
    configs: CableWavelengthConfig[];

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'modified_by_id' })
    modified_by: User;
}
