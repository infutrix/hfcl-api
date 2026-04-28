import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { LoginHistory, LoginStatus } from './entities/login-history.entity';

export interface LogLoginOptions {
    user_id?: number;
    email: string;
    status: LoginStatus;
    ip_address?: string;
    user_agent?: string;
    failure_reason?: string;
}

export interface LogAuditOptions {
    user_id?: number;
    action: AuditAction;
    entity_name: string;
    entity_id?: number;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    ip_address?: string;
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
        @InjectRepository(LoginHistory)
        private readonly loginHistoryRepository: Repository<LoginHistory>,
    ) { }

    async logLogin(opts: LogLoginOptions): Promise<void> {
        const entry = this.loginHistoryRepository.create(opts);
        await this.loginHistoryRepository.save(entry);
    }

    async logAudit(opts: LogAuditOptions): Promise<void> {
        const entry = this.auditLogRepository.create(opts);
        await this.auditLogRepository.save(entry);
    }

    async getLoginHistory(userId?: number): Promise<LoginHistory[]> {
        const where = userId ? { user_id: userId } : {};
        return this.loginHistoryRepository.find({
            where,
            order: { created_at: 'DESC' },
            take: 200,
        });
    }

    async getAuditLogs(entityName?: string): Promise<AuditLog[]> {
        const where = entityName ? { entity_name: entityName } : {};
        return this.auditLogRepository.find({
            where,
            order: { created_at: 'DESC' },
            take: 200,
        });
    }
}
