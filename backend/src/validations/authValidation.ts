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

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;






