import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('vernier_nos')
export class VernierNo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'vernier_no', type: 'varchar', length: 100, unique: true })
    vernier_no: string;

    /** Next calibration due date (YYYY-MM-DD); shown in the admin panel only, not on test reports. */
    @Column({ name: 'calibration_due_date', type: 'date', nullable: true, default: null })
    calibration_due_date: string | null;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    /** Soft delete: kept so past physical-parameter records still show the vernier number. */
    @Column({ type: 'boolean', default: false })
    deleted: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;
}
