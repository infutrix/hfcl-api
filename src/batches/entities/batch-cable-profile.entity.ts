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
import { Plant } from 'src/plants/entities/plant.entity';
import { CableType } from 'src/cable-profiles/entities/cable-type.entity';
import { CableProfile } from 'src/cable-profiles/entities/cable-profile.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { OtdrDevice } from '../../otdr-devices/entities/otdr-device.entity';
import { Batch } from './batch.entity';

@Entity('batch_cable_profiles')
export class BatchCableProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Plant, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'plant_id' })
    plant: Plant | null;

    @Index()
    @ManyToOne(() => Batch, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'batch_id' })
    batch: Batch | null;

    @Column({ type: 'varchar', length: 150 })
    batch_name: string;

    @Index()
    @ManyToOne(() => CableType, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cable_type_id' })
    cable_type: CableType | null;

    @Index()
    @ManyToOne(() => CableProfile, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cable_profile_id' })
    cable_profile: CableProfile | null;

    @Index()
    @ManyToOne(() => OtdrDevice, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'otdr_device_id' })
    otdr_device: OtdrDevice | null;

    @Index()
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'operator_id' })
    operator: User | null;

    @Index()
    @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer | null;


    @Column({ type: 'varchar' })
    drum_number: string;

    @Column({ type: 'varchar' })
    fiber_type: string;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @Column({ type: 'boolean', default: false })
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
}
