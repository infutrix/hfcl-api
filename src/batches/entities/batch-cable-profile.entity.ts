import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Plant } from 'src/plants/entities/plant.entity';
import { CableType } from 'src/cable-profiles/entities/cable-type.entity';
import { CableProfile } from 'src/cable-profiles/entities/cable-profile.entity';
import { Customer } from 'src/customers/entities/customer.entity';

@Entity('batch_cable_profiles')
export class BatchCableProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Plant, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'plant_id' })
    plant: Plant;

    @Index()
    @ManyToOne(() => CableType, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cable_type_id' })
    cable_type: CableType;

    @Index()
    @ManyToOne(() => CableProfile, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cable_profile_id' })
    cable_profile: CableProfile;

    @Index()
    @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @Column({ name: 'batch_name', type: 'varchar', length: 150 })
    batch_name: string;

    @Column({ name: 'drum_number', type: 'varchar' })
    drum_number: string;

    @Column({ name: 'fiber_type', type: 'varchar' })
    fiber_type: string;

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
