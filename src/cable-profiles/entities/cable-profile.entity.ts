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
import { User } from '../../users/entities/user.entity';

export enum CableProfileStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('cable_profiles')
export class CableProfile {
    @ApiProperty({ example: 1, description: 'Auto-incremented primary key' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'Single Mode', description: 'Type of the cable' })
    @Column({ name: 'cable_type', type: 'varchar', length: 150 })
    cable_type: string;

    @ApiProperty({ example: 96, description: 'Total number of fibers in the cable' })
    @Column({ name: 'fiber_count', type: 'int' })
    fiber_count: number;

    @ApiProperty({ example: 8, description: 'Total number of tubes in the cable' })
    @Column({ name: 'tube_count', type: 'int' })
    tube_count: number;

    @ApiProperty({ example: 12, description: 'Number of fibers per tube' })
    @Column({ name: 'fibers_per_tube', type: 'int' })
    fibers_per_tube: number;

    @ApiProperty({
        example: 'Red,Green,Blue,Yellow,White,Gray,Brown,Pink',
        description: 'Comma-separated color coding sequence for all tubes',
    })
    @Column({ name: 'tube_color_coding', type: 'text' })
    tube_color_coding: string;

    @ApiProperty({
        example: 'Blue,Orange,Green,Brown,Slate,White,Red,Black,Yellow,Violet,Rose,Aqua',
        description: 'Comma-separated color coding sequence for all fibers per tube',
    })
    @Column({ name: 'fiber_color_coding', type: 'text' })
    fiber_color_coding: string;

    @ApiPropertyOptional({
        example: 'R1,R2,R3,R4',
        description: 'Ribbon coding sequence (mandatory for ribbon cables; leave blank for others)',
    })
    @Column({ name: 'ribbon_coding', type: 'text', nullable: true })
    ribbon_coding: string;

    @ApiProperty({ example: 'DWG-2026-001', description: 'Drawing number associated with this cable profile' })
    @Column({ name: 'drawing_number', type: 'varchar', length: 150 })
    drawing_number: string;

    @ApiProperty({ example: 0.35, description: 'Group Refractive Index (GRI) at 850 nm' })
    @Column({ name: 'gri_850nm', type: 'decimal', precision: 10, scale: 6 })
    gri_850nm: number;

    @ApiProperty({ example: 0.35, description: 'Group Refractive Index (GRI) at 1300 nm' })
    @Column({ name: 'gri_1300nm', type: 'decimal', precision: 10, scale: 6 })
    gri_1300nm: number;

    @ApiProperty({ example: 0.35, description: 'Group Refractive Index (GRI) at 1550 nm' })
    @Column({ name: 'gri_1550nm', type: 'decimal', precision: 10, scale: 6 })
    gri_1550nm: number;

    @ApiProperty({ enum: CableProfileStatus, example: CableProfileStatus.ACTIVE, description: 'Status: active | inactive' })
    @Column({
        type: 'enum',
        enum: CableProfileStatus,
        default: CableProfileStatus.ACTIVE,
    })
    status: CableProfileStatus;

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

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'modified_by' })
    modifiedByUser: User;
}
