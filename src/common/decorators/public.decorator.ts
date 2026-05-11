import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as public (JwtAuthGuard will not require a Bearer token). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
