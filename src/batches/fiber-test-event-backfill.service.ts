import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { CableProfileWavelengthConfig } from '../cable-profiles/entities/cable-profile-wavelength-config.entity';
import { BatchFiberTesting } from './entities/batch-fiber-testing.entity';
import { FiberTestEvent } from './entities/fiber-test-event.entity';
import { createFiberTestEvent } from './fiber-test-event.factory';
import { buildWavelengthLimits, WavelengthLimit } from './wavelength-range.util';

const BACKFILL_PAGE_SIZE = 500;

/**
 * The test log (`fiber_test_events`) was introduced after testing had already started.
 * When the log is empty, seed it with one event per already-tested fiber so reports cover
 * historical data: timestamp = the fiber row's last update, tester = the session operator.
 */
@Injectable()
export class FiberTestEventBackfillService implements OnApplicationBootstrap {
    private readonly logger = new Logger(FiberTestEventBackfillService.name);

    constructor(
        @InjectRepository(FiberTestEvent)
        private readonly eventRepository: Repository<FiberTestEvent>,
        @InjectRepository(BatchFiberTesting)
        private readonly fiberTestingRepository: Repository<BatchFiberTesting>,
        @InjectRepository(CableProfileWavelengthConfig)
        private readonly wavelengthConfigRepository: Repository<CableProfileWavelengthConfig>,
    ) { }

    onApplicationBootstrap(): void {
        // Run in the background so a large history never delays startup.
        void this.backfill().catch((error: unknown) => {
            this.logger.error('Fiber test event backfill failed', error instanceof Error ? error.stack : error);
        });
    }

    async backfill(): Promise<number> {
        if ((await this.eventRepository.count()) > 0) return 0;

        const pending = await this.fiberTestingRepository.count({ where: { testing_counter: MoreThan(0) } });
        if (pending === 0) return 0;
        this.logger.log(`Backfilling fiber test events from ${pending} tested fiber rows...`);

        const limitsByProfile = new Map<number, Map<number, WavelengthLimit>>();
        let lastId = 0;
        let created = 0;

        for (;;) {
            const rows = await this.fiberTestingRepository
                .createQueryBuilder('f')
                .innerJoin('f.batch_cable_profile', 'bcp')
                .addSelect('bcp.id')
                .leftJoin('bcp.operator', 'op')
                .addSelect('op.id')
                .leftJoin('bcp.cable_profile', 'cp')
                .addSelect('cp.id')
                .where('f.testing_counter > 0')
                .andWhere('f.id > :lastId', { lastId })
                .orderBy('f.id', 'ASC')
                .limit(BACKFILL_PAGE_SIZE)
                .getMany();
            if (rows.length === 0) break;
            lastId = rows[rows.length - 1].id;

            const events: FiberTestEvent[] = [];
            for (const row of rows) {
                const bcp = row.batch_cable_profile!;
                const profileId = bcp.cable_profile?.id ?? null;
                events.push(
                    createFiberTestEvent({
                        fiberTestingId: row.id,
                        batchCableProfileId: bcp.id,
                        testedById: bcp.operator?.id ?? null,
                        fiberNumber: row.fiber_number ?? 0,
                        attempt: row.testing_counter,
                        readings: row.fiber_wavelengths,
                        limits: profileId ? await this.limitsFor(profileId, limitsByProfile) : new Map(),
                        testedAt: row.modified_at,
                        isBackfilled: true,
                    }),
                );
            }
            await this.eventRepository.save(events, { chunk: 100 });
            created += events.length;
        }

        this.logger.log(`Backfilled ${created} fiber test events`);
        return created;
    }

    private async limitsFor(
        cableProfileId: number,
        cache: Map<number, Map<number, WavelengthLimit>>,
    ): Promise<Map<number, WavelengthLimit>> {
        let limits = cache.get(cableProfileId);
        if (!limits) {
            const configs = await this.wavelengthConfigRepository.find({
                where: { cable_profile: { id: cableProfileId } },
                relations: { cable_wavelength: true },
            });
            limits = buildWavelengthLimits(configs);
            cache.set(cableProfileId, limits);
        }
        return limits;
    }
}
