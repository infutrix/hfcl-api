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

export enum PlantStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('plants')
export class Plant {
    @ApiProperty({ example: 1, description: 'Auto-incremented primary key' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'Plant A', description: 'Name of the plant' })
    @Column({ name: 'plant_name', type: 'varchar', length: 150 })
    plant_name: string;

    @ApiProperty({ example: 'Mumbai', description: 'Location of the plant' })
    @Column({ type: 'varchar', length: 255 })
    location: string;

    @ApiProperty({ enum: PlantStatus, example: PlantStatus.ACTIVE, description: 'Status of the plant: active | inactive' })
    @Column({
        type: 'enum',
        enum: PlantStatus,
        default: PlantStatus.ACTIVE,
    })
    status: PlantStatus;

    @ApiProperty({ example: '2026-04-29T10:00:00.000Z', description: 'Timestamp when the plant was created' })
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ApiPropertyOptional({ example: 1, description: 'User ID who created this record' })
    @Column({ name: 'created_by', type: 'int', nullable: true })
    created_by: number;

    @ApiProperty({ example: '2026-04-29T10:00:00.000Z', description: 'Timestamp when the plant was last updated' })
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
