import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
                },
            }),
        }),
        TypeOrmModule.forFeature([User]),
        UsersModule,
        AuditModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [JwtModule, PassportModule],
})
export class AuthModule { }
