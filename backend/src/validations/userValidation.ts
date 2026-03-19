import { z } from 'zod';

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  display_name: z.string().min(1, 'Tên hiển thị phải có ít nhất 1 ký tự').max(50, 'Tên hiển thị tối đa 50 ký tự').optional(),
  bio: z.string().max(500, 'Giới thiệu tối đa 500 ký tự').optional(),
  date_of_birth: z.string().datetime({ message: 'Ngày sinh phải đúng định dạng ISO 8601' })
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      const dob = new Date(val);
      return dob < new Date();
    }, { message: 'Ngày sinh phải là ngày trong quá khứ' })
    .refine((val) => {
      if (!val) return true;
      const dob = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age >= 13;
    }, { message: 'Bạn phải từ 13 tuổi trở lên' }),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema for changing username
 */
export const changeUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;

/**
 * Schema for changing password
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Query params for user posts/comments
 */
export const userContentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type UserContentQuery = z.infer<typeof userContentQuerySchema>;






