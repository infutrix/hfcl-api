import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Plant } from '../../plants/entities/plant.entity';
import { User } from '../../users/entities/user.entity';

export enum OtdrDeviceStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('otdr_devices')
export class OtdrDevice {
    @ApiProperty({ example: 1, description: 'Auto-incremented primary key' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'OTDR-P1-01', description: 'Name of the OTDR device' })
    @Column({ name: 'device_name', type: 'varchar', length: 150 })
    device_name: string;

    @ApiProperty({ example: 'DEV-001', description: 'Unique identifier of the device in the system' })
    @Column({ name: 'device_id', type: 'varchar', length: 100, unique: true })
    device_id: string;

    @ApiProperty({ example: '192.168.1.100', description: 'IP address used for TCP/IP connection' })
    @Column({ name: 'ip_address', type: 'varchar', length: 45 })
    ip_address: string;

    @ApiProperty({ example: 8080, description: 'TCP port for device communication' })
    @Column({ type: 'int' })
    port: number;

    @ApiProperty({ example: 'EXFO', description: 'Manufacturer of the device (e.g., EXFO, VIAVI, Yokogawa)' })
    @Column({ type: 'varchar', length: 150 })
    manufacturer: string;

    @ApiProperty({ example: 'FTB-1', description: 'Model of the device' })
    @Column({ type: 'varchar', length: 150 })
    model: string;

    @ApiProperty({ example: 'SN-123456', description: 'Physical device serial number' })
    @Column({ name: 'serial_number', type: 'varchar', length: 150 })
    serial_number: string;

    @ApiProperty({ example: 1, description: 'FK referencing the assigned plant (plants.id)' })
    @Column({ name: 'plant_id', type: 'int' })
    plant_id: number;

    @ApiProperty({ enum: OtdrDeviceStatus, example: OtdrDeviceStatus.ACTIVE, description: 'Status: active | inactive' })
    @Column({
        type: 'enum',
        enum: OtdrDeviceStatus,
        default: OtdrDeviceStatus.ACTIVE,
    })
    status: OtdrDeviceStatus;

    @ApiProperty({ example: '2026-04-29T10:00:00.000Z', description: 'Timestamp when the record was created' })
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ApiPropertyOptional({ example: 1, description: 'User ID who created this record' })
    @Column({ name: 'created_by', type: 'int', nullable: true })
    created_by: number;

    @ApiProperty({ example: '2026-04-29T10:00:00.000Z', description: 'Timestamp when the record was last updated' })
    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;

    @ApiPropertyOptional({ example: 1, description: 'User ID who last modified this record' })
    @Column({ name: 'modified_by', type: 'int', nullable: true })
    modified_by: number;

    @ManyToOne(() => Plant, { nullable: false, eager: false })
    @JoinColumn({ name: 'plant_id' })
    plant: Plant;

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'modified_by' })
    modifiedByUser: User;
}
