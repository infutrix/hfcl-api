import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginStatus } from '../audit/entities/login-history.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserStatus } from '../users/entities/user.entity';

/** In-memory store for reset tokens.
 *  Replace with a DB table / Redis in production. */
const resetTokenStore = new Map<string, { userId: number; expiresAt: Date }>();

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly auditService: AuditService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<LoginResponseDto> {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            await this.auditService.logLogin({
                email: dto.email,
                status: LoginStatus.FAILED,
                ip_address: ip,
                user_agent: userAgent,
                failure_reason: 'User not found',
            });
            throw new UnauthorizedException('Invalid email or password');
        }

        if (user.status !== UserStatus.ACTIVE) {
            await this.auditService.logLogin({
                user_id: user.id,
                email: dto.email,
                status: LoginStatus.FAILED,
                ip_address: ip,
                user_agent: userAgent,
                failure_reason: 'Account not active',
            });
            throw new UnauthorizedException('Account is not active');
        }

        const passwordValid = await bcrypt.compare(dto.password, user.password);
        if (!passwordValid) {
            await this.auditService.logLogin({
                user_id: user.id,
                email: dto.email,
                status: LoginStatus.FAILED,
                ip_address: ip,
                user_agent: userAgent,
                failure_reason: 'Invalid password',
            });
            throw new UnauthorizedException('Invalid email or password');
        }

        await this.auditService.logLogin({
            user_id: user.id,
            email: user.email,
            status: LoginStatus.SUCCESS,
            ip_address: ip,
            user_agent: userAgent,
        });

        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
        const payload = { sub: user.id, email: user.email, role_id: user.role_id ?? null };
        const access_token = this.jwtService.sign(payload);
        const { password: _pw, deleted: _del, ...userProfile } = user as any;

        return { access_token, expires_in: expiresIn, user: userProfile };
    }

    async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(dto.email);

        // Always return the same message to prevent user enumeration
        if (!user) {
            return { message: 'If this email is registered, a reset link has been sent.' };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        resetTokenStore.set(token, { userId: user.id, expiresAt });

        // TODO: Send email with reset link containing the token
        // e.g. https://yourapp.com/reset-password?token=<token>
        console.log(`[DEV] Password reset token for ${user.email}: ${token}`);

        return { message: 'If this email is registered, a reset link has been sent.' };
    }

    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        const entry = resetTokenStore.get(dto.token);

        if (!entry) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        if (new Date() > entry.expiresAt) {
            resetTokenStore.delete(dto.token);
            throw new BadRequestException('Reset token has expired. Please request a new one.');
        }

        const hashedPassword = await bcrypt.hash(dto.new_password, 10);
        await this.usersService.updatePassword(entry.userId, hashedPassword);

        resetTokenStore.delete(dto.token);

        return { message: 'Password has been reset successfully.' };
    }
}
