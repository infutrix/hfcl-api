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
import { Plant } from '../../plants/entities/plant.entity';
import { User } from '../../users/entities/user.entity';


@Entity('otdr_devices')
export class OtdrDevice {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'device_name', type: 'varchar', length: 150 })
    device_name: string;

    @Column({ name: 'device_id', type: 'varchar', length: 100, unique: true })
    device_id: string;

    @Column({ name: 'ip_address', type: 'varchar', length: 45 })
    ip_address: string;

    @Column({ type: 'int' })
    port: number;

    @Column({ type: 'varchar', length: 150 })
    manufacturer: string;

    @Column({ type: 'varchar', length: 150 })
    model: string;

    @Column({ name: 'serial_number', type: 'varchar', length: 150 })
    serial_number: string;

    @Column({ name: 'plant_id', type: 'int' })
    plant_id: number;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;

    @ManyToOne(() => Plant, { nullable: false, eager: false })
    @JoinColumn({ name: 'plant_id' })
    plant: Plant;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'modified_by_id' })
    modified_by: User;
}
