import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface JwtPayload {
    sub: number;
    email: string;
    role_id: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
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
            relations: ['userRole'],
        });
        if (!user) {
            throw new UnauthorizedException('Token is invalid or user no longer exists');
        }
        return user;
    }
}
