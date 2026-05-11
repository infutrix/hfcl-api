import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchCableProfile } from './entities/batch-cable-profile.entity';
import { AuditModule } from '../audit/audit.module';
import { Batch } from './entities/batch.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BatchCableProfile, Batch]), AuditModule],
})
export class BatchesModule { }