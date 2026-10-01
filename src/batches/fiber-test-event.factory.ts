import { User } from '../users/entities/user.entity';
import { BatchCableProfile } from './entities/batch-cable-profile.entity';
import { BatchFiberTesting, FiberWavelengthReading } from './entities/batch-fiber-testing.entity';
import { FiberTestEvent, FiberTestResult } from './entities/fiber-test-event.entity';
import { FiberTestEventReading } from './entities/fiber-test-event-reading.entity';
import { evaluateFiber, WavelengthLimit } from './wavelength-range.util';

export interface FiberTestEventInput {
    fiberTestingId: number;
    batchCableProfileId: number;
    testedById: number | null;
    fiberNumber: number;
    attempt: number;
    readings: FiberWavelengthReading[] | null | undefined;
    limits: Map<number, WavelengthLimit>;
    testedAt: Date;
    isBackfilled?: boolean;
}

/** Builds an unsaved event (with readings) judged against the given attenuation limits. */
export function createFiberTestEvent(input: FiberTestEventInput): FiberTestEvent {
    const evaluation = evaluateFiber(input.readings, input.limits);

    const event = new FiberTestEvent();
    event.batch_fiber_testing = { id: input.fiberTestingId } as BatchFiberTesting;
    event.batch_cable_profile = { id: input.batchCableProfileId } as BatchCableProfile;
    event.tested_by = input.testedById ? ({ id: input.testedById } as User) : null;
    event.fiber_number = input.fiberNumber;
    event.attempt = input.attempt;
    event.result = (evaluation.result ?? FiberTestResult.NO_READING) as FiberTestResult;
    event.wavelengths_tested = evaluation.tested;
    event.wavelengths_out_of_range = evaluation.out_of_range;
    event.is_backfilled = input.isBackfilled ?? false;
    event.tested_at = input.testedAt;
    event.readings = evaluation.readings
        .filter((r) => r.value !== null)
        .map((r) => {
            const reading = new FiberTestEventReading();
            reading.wavelength_nm = r.wavelength_nm;
            reading.measured_value = r.value;
            reading.min_limit = r.min;
            reading.max_limit = r.max;
            reading.in_range = r.status === 'no_limit' ? null : r.status === 'in_range';
            return reading;
        });
    return event;
}
