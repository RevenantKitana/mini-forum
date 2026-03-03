import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validateMiddleware.js';
import { otpSendLimiter, otpVerifyLimiter } from '../middlewares/securityMiddleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOtpRegisterSchema,
  verifyOtpRegisterSchema,
  sendOtpResetSchema,
  verifyOtpResetSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const router = Router();

/**
 * @route   GET /api/v1/auth/check-email
 * @desc    Check if email is available
 * @access  Public
 */
router.get('/check-email', authController.checkEmail);

/**
 * @route   GET /api/v1/auth/check-username
 * @desc    Check if username is available
 * @access  Public
 */
router.get('/check-username', authController.checkUsername);

// ==================== OTP Registration Flow ====================

/**
 * @route   POST /api/v1/auth/send-otp-register
 * @desc    Send OTP to email for registration
 * @access  Public
 * @rateLimit 3 requests per 5 minutes
 */
router.post(
  '/send-otp-register',
  otpSendLimiter,
  validateBody(sendOtpRegisterSchema),
  authController.sendOtpRegister
);

/**
 * @route   POST /api/v1/auth/verify-otp-register
 * @desc    Verify OTP for registration
 * @access  Public
 * @rateLimit 10 requests per 10 minutes
 */
router.post(
  '/verify-otp-register',
  otpVerifyLimiter,
  validateBody(verifyOtpRegisterSchema),
  authController.verifyOtpRegister
);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (optionally with OTP verification token)
 * @access  Public
 */
router.post('/register', validateBody(registerSchema), authController.register);

// ==================== OTP Password Reset Flow ====================

/**
 * @route   POST /api/v1/auth/send-otp-reset
 * @desc    Send OTP to email for password reset
 * @access  Public
 * @rateLimit 3 requests per 5 minutes
 */
router.post(
  '/send-otp-reset',
  otpSendLimiter,
  validateBody(sendOtpResetSchema),
  authController.sendOtpReset
);

/**
 * @route   POST /api/v1/auth/verify-otp-reset
 * @desc    Verify OTP for password reset
 * @access  Public
 * @rateLimit 10 requests per 10 minutes
 */
router.post(
  '/verify-otp-reset',
  otpVerifyLimiter,
  validateBody(verifyOtpResetSchema),
  authController.verifyOtpReset
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password after OTP verification
 * @access  Public
 */
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// ==================== Standard Auth ====================

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateBody(loginSchema), authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

export default router;






