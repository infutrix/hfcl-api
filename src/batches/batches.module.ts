import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';
import { Batch } from './entities/batch.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [TypeOrmModule.forFeature([Batch]), AuditModule],
    controllers: [BatchesController],
    providers: [BatchesService],
    exports: [BatchesService],
})
export class BatchesModule { }
