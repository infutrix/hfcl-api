import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Get, Req } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'User login',
        description: 'Authenticates the user with email and password. Returns a JWT Bearer token to be used in the `Authorization` header for all protected endpoints.',
    })
    @ApiResponse({ status: 200, description: 'Login successful. Returns JWT token and user profile.', type: LoginResponseDto })
    @ApiResponse({ status: 400, description: 'Validation failed – check request body.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials or account not active.' })
    login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
        const ip = req.ip ?? req.socket?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.authService.login(dto, ip, userAgent);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Forgot password',
        description: 'Sends a password reset token to the provided email if it is registered. Always returns the same response to prevent user enumeration.',
    })
    @ApiResponse({ status: 200, description: 'Reset email dispatched (or silently skipped if email not found).' })
    @ApiResponse({ status: 400, description: 'Validation failed – check request body.' })
    forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reset password',
        description: 'Resets the account password using the token received via forgot-password. Token is valid for 1 hour and can only be used once.',
    })
    @ApiResponse({ status: 200, description: 'Password reset successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired reset token.' })
    resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
        return this.authService.resetPassword(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Returns the profile of the currently authenticated user. Requires a valid JWT Bearer token.',
    })
    @ApiResponse({ status: 200, description: 'Current user profile returned.' })
    @ApiResponse({ status: 401, description: 'Unauthorized – missing or invalid token.' })
    getProfile(@Req() req: any) {
        const { password: _pw, deleted: _del, ...profile } = req.user;
        return profile;
    }
}
