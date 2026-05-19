import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { BatchCableProfile } from './batch-cable-profile.entity';
import { BatchFiberTesting } from './batch-fiber-testing.entity';

@Entity('fiber_testing_ai_response')
export class FiberTestingAiResponse {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => BatchCableProfile, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'batch_cable_profile_id' })
    batch_cable_profile: BatchCableProfile | null;

    @Index()
    @ManyToOne(() => BatchFiberTesting, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'batch_fiber_testing_id' })
    batch_fiber_testing: BatchFiberTesting | null;

    @Column({ type: 'json', nullable: true, default: null })
    ai_response: Record<string, unknown> | unknown[] | null;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;
}

