import { z } from 'zod';

/**
 * Password validation regex
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Username validation regex
 * - 3-50 characters
 * - Only alphanumeric and underscore
 */
const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;

/**
 * Register request schema
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(usernameRegex, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  display_name: z
    .string()
    .max(100, 'Display name must be at most 100 characters')
    .optional(),
});

/**
 * Login request schema - supports email or username
 */
export const loginSchema = z.preprocess((arg) => {
  // Accept client payloads that use `email` or `username` keys and
  // normalize them to `identifier` for downstream processing.
  if (arg && typeof arg === 'object') {
    const obj = { ...(arg as Record<string, unknown>) } as Record<string, any>;
    if (!obj.identifier) {
      if (typeof obj.email === 'string' && obj.email.trim() !== '') {
        obj.identifier = obj.email;
      } else if (typeof obj.username === 'string' && obj.username.trim() !== '') {
        obj.identifier = obj.username;
      }
    }
    return obj;
  }
  return arg;
}, z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
}));

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Send OTP for registration schema
 */
export const sendOtpRegisterSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ').max(255),
});

/**
 * Verify OTP for registration schema
 */
export const verifyOtpRegisterSchema = z.object({
  email: z.string().email(),
  verificationToken: z.string().min(1, 'Verification token is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP phải là 6 chữ số'),
});

/**
 * Send OTP for password reset schema
 */
export const sendOtpResetSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
});

/**
 * Verify OTP for password reset schema
 */
export const verifyOtpResetSchema = z.object({
  email: z.string().email(),
  verificationToken: z.string().min(1, 'Verification token is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP phải là 6 chữ số'),
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  email: z.string().email(),
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(
      passwordRegex,
      'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số'
    ),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type SendOtpRegisterInput = z.infer<typeof sendOtpRegisterSchema>;
export type VerifyOtpRegisterInput = z.infer<typeof verifyOtpRegisterSchema>;
export type SendOtpResetInput = z.infer<typeof sendOtpResetSchema>;
export type VerifyOtpResetInput = z.infer<typeof verifyOtpResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;






