import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import * as authService from '../services/authService.js';
import * as otpService from '../services/otpService.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  SendOtpRegisterInput,
  VerifyOtpRegisterInput,
  SendOtpResetInput,
  VerifyOtpResetInput,
  ResetPasswordInput,
} from '../validations/authValidation.js';
import { logger } from '../utils/logger.js';

/** Cookie options for the HttpOnly refresh-token cookie */
const REFRESH_COOKIE_NAME = 'refresh_token';
const refreshCookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/v1/auth',
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
}

/** Read refresh token from HttpOnly cookie OR request body (backward compatible). */
function readRefreshToken(req: Request): string | undefined {
  return (req.cookies as Record<string, string>)?.[REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;
}

/**
 * Check if email is available
 * GET /api/v1/auth/check-email
 */
export async function checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = req.query.email as string;
    if (!email) {
      sendSuccess(res, { available: false, exists: false }, 'Email is required');
      return;
    }
    const available = await authService.checkEmailAvailability(email);
    sendSuccess(res, { available, exists: !available }, available ? 'Email is available' : 'Email is already taken');
  } catch (error) {
    next(error);
  }
}

/**
 * Check if username is available
 * GET /api/v1/auth/check-username
 */
export async function checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const username = req.query.username as string;
    if (!username) {
      sendSuccess(res, { available: false }, 'Username is required');
      return;
    }
    const available = await authService.checkUsernameAvailability(username);
    sendSuccess(res, { available }, available ? 'Username is available' : 'Username is already taken');
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as RegisterInput & { registrationToken?: string };
    const result = await authService.register(data);
    logger.info('auth.register', { event: 'register', email: data.email, requestId: req.requestId });
    setRefreshCookie(res, (result as any).tokens.refreshToken);
    sendCreated(res, result, 'Registration successful');
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as LoginInput;
    const result = await authService.login(data);
    logger.info('auth.login', { event: 'login', identifier: data.identifier, userId: (result as any).user?.id, requestId: req.requestId });
    setRefreshCookie(res, (result as any).tokens.refreshToken);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    logger.warn('auth.login_failed', { event: 'login_failed', identifier: (req.body as LoginInput)?.identifier, requestId: req.requestId });
    next(error);
  }
}

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }
    const tokens = await authService.refreshAccessToken(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = readRefreshToken(req);
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearRefreshCookie(res);
    logger.info('auth.logout', { event: 'logout', userId: (req as any).user?.userId, requestId: req.requestId });
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * Logout from all devices
 * POST /api/v1/auth/logout-all
 */
export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    await authService.logoutAll(userId);
    clearRefreshCookie(res);
    logger.info('auth.logout_all', { event: 'logout_all', userId, requestId: req.requestId });
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await authService.getCurrentUser(userId);

    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
}

// ==================== OTP Endpoints ====================

/**
 * Send OTP for registration
 * POST /api/v1/auth/send-otp-register
 */
export async function sendOtpRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as SendOtpRegisterInput;
    const result = await otpService.sendOtpForRegister(email);

    sendSuccess(res, {
      verificationToken: result.verificationToken,
      expiresIn: result.expiresIn,
    }, 'Mã OTP đã được gửi đến email của bạn.');
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP for registration
 * POST /api/v1/auth/verify-otp-register
 */
export async function verifyOtpRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, verificationToken, otp } = req.body as VerifyOtpRegisterInput;
    const result = await otpService.verifyOtpForRegister(email, verificationToken, otp);

    sendSuccess(res, {
      registrationToken: result.registrationToken,
      email,
      otpVerified: true,
      nextStep: 'complete_registration',
    }, 'Xác thực OTP thành công.');
  } catch (error) {
    next(error);
  }
}

/**
 * Send OTP for password reset
 * POST /api/v1/auth/send-otp-reset
 */
export async function sendOtpReset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as SendOtpResetInput;
    const result = await otpService.sendOtpForReset(email);

    sendSuccess(res, {
      verificationToken: result.verificationToken,
      expiresIn: result.expiresIn,
    }, 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP.');
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP for password reset
 * POST /api/v1/auth/verify-otp-reset
 */
export async function verifyOtpReset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, verificationToken, otp } = req.body as VerifyOtpResetInput;
    const result = await otpService.verifyOtpForReset(email, verificationToken, otp);

    sendSuccess(res, {
      resetToken: result.resetToken,
      email,
      otpVerified: true,
      nextStep: 'reset_password',
    }, 'Xác thực OTP thành công. Bạn có thể đặt lại mật khẩu.');
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password after OTP verification
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, resetToken, newPassword } = req.body as ResetPasswordInput;
    await authService.resetPassword(email, resetToken, newPassword);

    sendSuccess(res, {
      email,
      passwordReset: true,
      redirectTo: '/login',
    }, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.');
  } catch (error) {
    next(error);
  }
}







