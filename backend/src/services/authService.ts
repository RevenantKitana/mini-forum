import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import prisma from '../config/database.js';
import { generateTokenPair, verifyRefreshToken, TokenPair, TokenPayload } from '../utils/jwt.js';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../validations/authValidation.js';
import * as otpService from './otpService.js';

/**
 * Hash a refresh token with SHA-256 before storing in DB.
 * Protects plaintext tokens in case of database compromise.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const SALT_ROUNDS = 12;

export interface AuthUserDTO {
  id: number;
  username: string;
  display_name: string | null;
  avatar_preview_url: string | null;
  avatar_standard_url: string | null;
  role: string;
}

export type AuthUser = AuthUserDTO;

export interface AuthResponse {
  user: AuthUserDTO;
  tokens: TokenPair;
}

/**
 * Register a new user
 * If registrationToken is provided, validates OTP verification first
 */
export async function register(data: RegisterInput & { registrationToken?: string }): Promise<AuthResponse> {
  // If registrationToken is provided, validate OTP verification
  if (data.registrationToken) {
    const isValid = await otpService.validateRegistrationToken(data.email, data.registrationToken);
    if (!isValid) {
      throw new BadRequestError('Token đăng ký không hợp lệ hoặc đã hết hạn. Vui lòng xác thực OTP lại.');
    }
  }

  // Check if email already exists
  const existingEmail = await prisma.users.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    throw new ConflictError('Email already registered');
  }

  // Check if username already exists
  const existingUsername = await prisma.users.findUnique({
    where: { username: data.username },
  });

  if (existingUsername) {
    throw new ConflictError('Username already taken');
  }

  // Hash password
  const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create user with verified status if OTP was used
  const user = await prisma.users.create({
    data: {
      email: data.email,
      username: data.username,
      password_hash: password_hash,
      display_name: data.display_name || null,
      is_verified: !!data.registrationToken, // Mark as verified if OTP was used
    },
    select: {
      id: true,
      username: true,
      display_name: true,
      avatar_preview_url: true,
      avatar_standard_url: true,
      role: true,
    },
  });

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: data.email,
    role: user.role,
  };
  const tokens = generateTokenPair(tokenPayload);

  // Store hashed refresh token (SHA-256) to protect against DB compromise
  await prisma.refresh_tokens.create({
    data: {
      token: hashToken(tokens.refreshToken),
      user_id: user.id,
      family_id: crypto.randomUUID(),
      is_revoked: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Consume the OTP token if it was used
  if (data.registrationToken) {
    await otpService.consumeOtpToken(data.email, data.registrationToken);
  }

  return { user, tokens };
}

/**
 * Check if email is available
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  const existingEmail = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  return !existingEmail;
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const existingUsername = await prisma.users.findUnique({
    where: { username },
    select: { id: true },
  });
  return !existingUsername;
}

/**
 * Login user - supports login with email or username
 */
export async function login(data: LoginInput): Promise<AuthResponse> {
  // Determine if identifier is email or username
  const isEmail = data.identifier.includes('@');
  
  // Find user by email or username
  const user = await prisma.users.findFirst({
    where: isEmail 
      ? { email: data.identifier }
      : { username: data.identifier },
  });

  if (!user) {
    throw new UnauthorizedError('Tên đăng nhập hoặc mật khẩu không đúng');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Tên đăng nhập hoặc mật khẩu không đúng');
  }

  // Update last active
  await prisma.users.update({
    where: { id: user.id },
    data: { last_active_at: new Date() },
  });

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const tokens = generateTokenPair(tokenPayload);

  // Clean up any expired refresh tokens for this user
  await prisma.refresh_tokens.deleteMany({
    where: {
      user_id: user.id,
      expires_at: { lt: new Date() },
    },
  });

  // Store hashed refresh token (SHA-256) with a new token family for this login session
  await prisma.refresh_tokens.create({
    data: {
      token: hashToken(tokens.refreshToken),
      user_id: user.id,
      family_id: crypto.randomUUID(),
      is_revoked: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const authUser: AuthUserDTO = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_preview_url: user.avatar_preview_url,
    avatar_standard_url: user.avatar_standard_url,
    role: user.role,
  };

  return { user: authUser, tokens };
}

/**
 * Refresh access token with Refresh Token Rotation (RTR) & Reuse Detection
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  // Verify the refresh token JWT signature & expiration
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const tokenHash = hashToken(refreshToken);

  // Check if token exists in database
  const storedToken = await prisma.refresh_tokens.findUnique({
    where: {
      token: tokenHash,
    },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Refresh token not found or expired');
  }

  // REUSE DETECTION: If token is already marked as revoked, a replay attack is detected!
  if (storedToken.is_revoked) {
    // Revoke/delete ALL refresh tokens belonging to this user immediately
    await prisma.refresh_tokens.deleteMany({
      where: { user_id: storedToken.user_id },
    });
    throw new UnauthorizedError('Cảnh báo bảo mật: Phát hiện sử dụng lại Refresh Token đã bị thu hồi. Toàn bộ phiên đăng nhập đã bị vô hiệu hóa.');
  }

  // Check if token has expired
  if (storedToken.expires_at < new Date()) {
    await prisma.refresh_tokens.delete({
      where: { id: storedToken.id },
    });
    throw new UnauthorizedError('Refresh token expired');
  }

  // Get user
  const user = await prisma.users.findUnique({
    where: { id: storedToken.user_id },
  });

  if (!user || !user.is_active) {
    await prisma.refresh_tokens.deleteMany({
      where: { user_id: storedToken.user_id },
    });
    throw new UnauthorizedError('User not found or deactivated');
  }

  // Generate new tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const tokens = generateTokenPair(tokenPayload);

  // Atomic Token Rotation:
  // 1. Mark current token as revoked
  // 2. Create new refresh token with the SAME family_id
  await prisma.$transaction([
    prisma.refresh_tokens.update({
      where: { id: storedToken.id },
      data: { is_revoked: true },
    }),
    prisma.refresh_tokens.create({
      data: {
        token: hashToken(tokens.refreshToken),
        user_id: user.id,
        family_id: storedToken.family_id,
        is_revoked: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    }),
  ]);

  return tokens;
}

/**
 * Logout user (invalidate refresh token / session family)
 */
export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refresh_tokens.findUnique({
    where: { token: tokenHash },
  });

  if (storedToken) {
    // Invalidate the entire token family for this session
    await prisma.refresh_tokens.deleteMany({
      where: { family_id: storedToken.family_id },
    });
  } else {
    // Fallback: delete token directly if found
    await prisma.refresh_tokens.deleteMany({
      where: { token: tokenHash },
    });
  }
}

/**
 * Logout from all devices
 */
export async function logoutAll(userId: number): Promise<void> {
  await prisma.refresh_tokens.deleteMany({
    where: { user_id: userId },
  });
}

/**
 * Get current user by ID
 */
export async function getCurrentUser(userId: number): Promise<AuthUserDTO> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      display_name: true,
      avatar_preview_url: true,
      avatar_standard_url: true,
      role: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

/**
 * Reset user password after OTP verification
 */
export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<void> {
  // Validate reset token
  const isValid = await otpService.validateResetToken(email, resetToken);
  if (!isValid) {
    throw new BadRequestError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
  }

  // Find user
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, is_active: true },
  });

  if (!user) {
    throw new NotFoundError('Không tìm thấy người dùng.');
  }

  if (!user.is_active) {
    throw new BadRequestError('Tài khoản đã bị vô hiệu hóa.');
  }

  // Hash new password
  const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and invalidate all sessions
  await prisma.$transaction([
    prisma.users.update({
      where: { id: user.id },
      data: { password_hash },
    }),
    // Invalidate all refresh tokens for the user (force re-login)
    prisma.refresh_tokens.deleteMany({
      where: { user_id: user.id },
    }),
  ]);

  // Consume the reset token
  await otpService.consumeOtpToken(email, resetToken);
}







