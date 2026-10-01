import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FiberTestEvent } from './fiber-test-event.entity';

/** One wavelength measurement of a fiber test event, with the limits it was judged against. */
@Entity('fiber_test_event_readings')
export class FiberTestEventReading {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => FiberTestEvent, (event) => event.readings, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event: FiberTestEvent;

    @Index()
    @Column({ type: 'int' })
    wavelength_nm: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, default: null })
    measured_value: number | null;

    @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true, default: null })
    min_limit: number | null;

    @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true, default: null })
    max_limit: number | null;

    /** null = no limit configured for this wavelength. */
    @Column({ type: 'boolean', nullable: true, default: null })
    in_range: boolean | null;
}
