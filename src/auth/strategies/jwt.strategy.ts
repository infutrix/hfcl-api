import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user-role.entity';

export interface JwtPayload {
    sub: number;
    email: string;
    role_id: number | null;
    plant_id: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: payload.sub, deleted: false },
            relations: ['userRole', 'plant'],
        });
        if (!user) {
            throw new UnauthorizedException('Token is invalid or user no longer exists');
        }

        if (!user.userRole) {
            const roleId = user.role_id ?? payload.role_id;
            if (roleId != null) {
                user.userRole = await this.userRoleRepository.findOne({
                    where: { id: roleId },
                });
            }
        }

        return user;
    }
}
