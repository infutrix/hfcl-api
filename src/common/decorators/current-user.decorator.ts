import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): User | null => {
        try {
            const request = ctx.switchToHttp().getRequest();
            const user = request.user as User;
            if (!user) {
                console.error('[CurrentUser] No user found on request. Ensure JwtAuthGuard is applied.');
                return null;
            }
            return user;
        } catch (error) {
            console.error('[CurrentUser] Failed to extract user from request:', error);
            return null;
        }
    },
);
