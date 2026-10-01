import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BatchCableProfile } from './batch-cable-profile.entity';
import { BatchFiberTesting } from './batch-fiber-testing.entity';
import { FiberTestEventReading } from './fiber-test-event-reading.entity';

export enum FiberTestResult {
    PASS = 'PASS',
    FAIL = 'FAIL',
    /** Measured, but the cable profile has no attenuation limits for the tested wavelengths. */
    NO_LIMIT = 'NO_LIMIT',
    /** Submitted without any measured value (e.g. a colour check only). */
    NO_READING = 'NO_READING',
}

/**
 * Append-only log: one row per fiber test submission (PUT /batch-fiber-testing/:id).
 * `batch_fiber_testing` keeps only the latest readings; this keeps the history used by reports.
 */
@Entity('fiber_test_events')
@Index(['tested_at'])
@Index(['tested_by', 'tested_at'])
@Index(['batch_cable_profile', 'tested_at'])
export class FiberTestEvent {
    @PrimaryGeneratedColumn()
    id: number;

    /** SET NULL: fiber rows are regenerated when a session's matrix is rebuilt; history must survive. */
    @Index()
    @ManyToOne(() => BatchFiberTesting, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'batch_fiber_testing_id' })
    batch_fiber_testing: BatchFiberTesting | null;

    @ManyToOne(() => BatchCableProfile, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'batch_cable_profile_id' })
    batch_cable_profile: BatchCableProfile | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'tested_by_id' })
    tested_by: User | null;

    @Column({ type: 'int', default: 0 })
    fiber_number: number;

    /** The fiber's testing_counter after this test: 1 = first attempt, >1 = retest. */
    @Column({ type: 'int', default: 1 })
    attempt: number;

    @Column({ type: 'enum', enum: FiberTestResult })
    result: FiberTestResult;

    @Column({ type: 'int', default: 0 })
    wavelengths_tested: number;

    @Column({ type: 'int', default: 0 })
    wavelengths_out_of_range: number;

    /** True for rows reconstructed from batch_fiber_testing when the log was introduced. */
    @Column({ type: 'boolean', default: false })
    is_backfilled: boolean;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    tested_at: Date;

    @OneToMany(() => FiberTestEventReading, (reading) => reading.event, { cascade: ['insert'] })
    readings: FiberTestEventReading[];
}
