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
import { Customer } from 'src/customers/entities/customer.entity';

@Entity('batches')
export class Batch {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Plant, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'plant_id' })
    plant: Plant;

    @Index()
    @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @Column({ name: 'batch_name', type: 'varchar', length: 150 })
    batch: string;

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
}
