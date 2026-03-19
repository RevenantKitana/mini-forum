import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { generateTokenPair, verifyRefreshToken, TokenPair, TokenPayload } from '../utils/jwt.js';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../validations/authValidation.js';
import * as otpService from './otpService.js';

const SALT_ROUNDS = 12;

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: Date | null;
  gender: string | null;
  role: string;
  reputation: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface AuthResponse {
  user: AuthUser;
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
      email: true,
      username: true,
      display_name: true,
      avatar_url: true,
      bio: true,
      date_of_birth: true,
      gender: true,
      role: true,
      reputation: true,
      is_verified: true,
      is_active: true,
      created_at: true,
    },
  });

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const tokens = generateTokenPair(tokenPayload);

  // Store refresh token
  await prisma.refresh_tokens.create({
    data: {
      token: tokens.refreshToken,
      user_id: user.id,
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

  // Store refresh token
  await prisma.refresh_tokens.create({
    data: {
      token: tokens.refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    date_of_birth: user.date_of_birth,
    gender: user.gender,
    role: user.role,
    reputation: user.reputation,
    is_verified: user.is_verified,
    is_active: user.is_active,
    created_at: user.created_at,
  };

  return { user: authUser, tokens };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  // Verify the refresh token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Check if refresh token exists in database
  const storedToken = await prisma.refresh_tokens.findFirst({
    where: {
      token: refreshToken,
      user_id: payload.userId,
      expires_at: { gt: new Date() },
    },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Refresh token not found or expired');
  }

  // Get user
  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.is_active) {
    throw new UnauthorizedError('User not found or deactivated');
  }

  // Delete old refresh token
  await prisma.refresh_tokens.delete({
    where: { id: storedToken.id },
  });

  // Generate new tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const tokens = generateTokenPair(tokenPayload);

  // Store new refresh token
  await prisma.refresh_tokens.create({
    data: {
      token: tokens.refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return tokens;
}

/**
 * Logout user (invalidate refresh token)
 */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.refresh_tokens.deleteMany({
    where: { token: refreshToken },
  });
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
export async function getCurrentUser(userId: number): Promise<AuthUser> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      display_name: true,
      avatar_url: true,
      bio: true,
      date_of_birth: true,
      gender: true,
      role: true,
      reputation: true,
      is_verified: true,
      is_active: true,
      created_at: true,
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







