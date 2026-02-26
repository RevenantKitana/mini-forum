import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../validations/authValidation.js';

/**
 * Check if email is available
 * GET /api/v1/auth/check-email
 */
export async function checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = req.query.email as string;
    if (!email) {
      sendSuccess(res, { available: false }, 'Email is required');
      return;
    }
    const available = await authService.checkEmailAvailability(email);
    sendSuccess(res, { available }, available ? 'Email is available' : 'Email is already taken');
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
    const data = req.body as RegisterInput;
    const result = await authService.register(data);

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

    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshTokenInput;
    const tokens = await authService.refreshAccessToken(refreshToken);

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
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

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







