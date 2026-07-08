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
import { BatchCableProfile } from './batch-cable-profile.entity';
import { VernierNo } from './vernier-no.entity';
import { PhysicalInspectionResult } from '../enums/physical-inspection-result.enum';
import { BatchPhysicalParamsStatus } from '../enums/batch-physical-params-status.enum';

@Entity('batch_physical_params')
export class BatchPhysicalParams {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @ManyToOne(() => BatchCableProfile, (profile) => profile.physical_params, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'batch_cable_profile_id' })
    batch_cable_profile: BatchCableProfile;

    @Index()
    @ManyToOne(() => VernierNo, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'vernier_id' })
    vernier: VernierNo | null;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    iem: string | null;

    @Column({ name: 'oem_length_of_sfg_m', type: 'decimal', precision: 10, scale: 3, nullable: true, default: null })
    oem_length_of_sfg_m: string | null;

    @Column({ name: 'inner_sheath_mm', type: 'decimal', precision: 10, scale: 3, nullable: true, default: null })
    inner_sheath_mm: string | null;

    @Column({ name: 'outer_sheath_mm', type: 'decimal', precision: 10, scale: 3, nullable: true, default: null })
    outer_sheath_mm: string | null;

    @Column({ name: 'cable_dia_mm', type: 'decimal', precision: 10, scale: 3, nullable: true, default: null })
    cable_dia_mm: string | null;

    @Column({ name: 'tube_id_od_nm', type: 'decimal', precision: 10, scale: 3, nullable: true, default: null })
    tube_id_od_nm: string | null;

    @Column({ name: 'frp_dia_nm', type: 'decimal', precision: 10, scale: 3, nullable: true, default: null })
    frp_dia_nm: string | null;

    @Column({
        name: 'stripability_rib_separation',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    stripability_rib_separation: PhysicalInspectionResult | null;

    @Column({
        name: 'visual_inspection',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    visual_inspection: PhysicalInspectionResult | null;

    @Column({
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    wpt: PhysicalInspectionResult | null;

    @Column({
        name: 'wpt_drip',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    wpt_drip: PhysicalInspectionResult | null;

    @Column({
        name: 'sheath_removal_r_lc',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    sheath_removal_r_lc: PhysicalInspectionResult | null;

    @Column({
        name: 'fiber_seg_of_ribbon',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    fiber_seg_of_ribbon: PhysicalInspectionResult | null;

    @Column({
        name: 'ribbon_print_qty',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    ribbon_print_qty: PhysicalInspectionResult | null;

    @Column({
        name: 'color_of_fiber',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    color_of_fiber: PhysicalInspectionResult | null;

    @Column({
        name: 'ribbon_rub_test',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    ribbon_rub_test: PhysicalInspectionResult | null;

    @Column({
        name: 'ribbon_stiffness',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    ribbon_stiffness: PhysicalInspectionResult | null;

    @Column({
        name: 'ribbon_separation',
        type: 'enum',
        enum: PhysicalInspectionResult,
        nullable: true,
        default: null,
    })
    ribbon_separation: PhysicalInspectionResult | null;

    @Column({ type: 'text', nullable: true, default: null })
    remark: string | null;

    @Column({
        type: 'enum',
        enum: BatchPhysicalParamsStatus,
        default: BatchPhysicalParamsStatus.PENDING,
    })
    status: BatchPhysicalParamsStatus;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User | null;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'modified_by_id' })
    modified_by: User | null;
}
