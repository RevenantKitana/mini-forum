import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import config from '../config/index.js';
import { sendOtpEmail } from './emailService.js';
import { OtpError, BadRequestError } from '../utils/errors.js';
import { OtpPurpose } from '@prisma/client';

const SALT_ROUNDS = 10;

/**
 * OTP Service - Handles OTP generation, storage, verification, and cleanup
 */

/**
 * Generate a cryptographically secure OTP code
 */
export function generateOtpCode(length: number = config.otp.length): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const randomNumber = crypto.randomInt(min, max + 1);
  return randomNumber.toString();
}

/**
 * Generate a unique verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

interface SendOtpResult {
  verificationToken: string;
  expiresIn: number; // seconds
}

/**
 * Send OTP for registration
 * - Validates email is not already registered
 * - Invalidates any existing OTP for same email+purpose
 * - Creates new OTP record
 * - Sends email
 */
export async function sendOtpForRegister(email: string): Promise<SendOtpResult> {
  // Check if email is already registered
  const existingUser = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new BadRequestError('Email này đã được đăng ký. Vui lòng đăng nhập hoặc đặt lại mật khẩu.');
  }

  // Check resend delay
  await checkResendDelay(email, OtpPurpose.REGISTER);

  return await createAndSendOtp(email, OtpPurpose.REGISTER);
}

/**
 * Send OTP for password reset
 * - Always returns success for security (don't reveal if email exists)
 * - Only actually sends if email exists
 */
export async function sendOtpForReset(email: string): Promise<SendOtpResult> {
  const existingUser = await prisma.users.findUnique({
    where: { email },
    select: { id: true, is_active: true },
  });

  // Always return a token for security, but only send email if user exists
  if (!existingUser || !existingUser.is_active) {
    // Return a dummy token so the response looks the same
    return {
      verificationToken: generateVerificationToken(),
      expiresIn: config.otp.expirationMinutes * 60,
    };
  }

  // Check resend delay
  await checkResendDelay(email, OtpPurpose.RESET_PASSWORD);

  return await createAndSendOtp(email, OtpPurpose.RESET_PASSWORD);
}

/**
 * Verify OTP for registration
 * Returns a registrationToken on success
 */
export async function verifyOtpForRegister(
  email: string,
  verificationToken: string,
  otpCode: string
): Promise<{ registrationToken: string }> {
  const otpRecord = await validateAndVerifyOtp(email, verificationToken, otpCode, OtpPurpose.REGISTER);

  // Generate a registration token for completing registration
  const registrationToken = generateVerificationToken();

  // Update the record with verification
  await prisma.otp_tokens.update({
    where: { id: otpRecord.id },
    data: {
      is_verified: true,
      verified_at: new Date(),
      verification_token: registrationToken, // Reuse as registration token
    },
  });

  return { registrationToken };
}

/**
 * Verify OTP for password reset
 * Returns a resetToken on success
 */
export async function verifyOtpForReset(
  email: string,
  verificationToken: string,
  otpCode: string
): Promise<{ resetToken: string }> {
  const otpRecord = await validateAndVerifyOtp(email, verificationToken, otpCode, OtpPurpose.RESET_PASSWORD);

  // Generate a reset token
  const resetToken = generateVerificationToken();

  // Update the record with verification
  await prisma.otp_tokens.update({
    where: { id: otpRecord.id },
    data: {
      is_verified: true,
      verified_at: new Date(),
      verification_token: resetToken, // Reuse as reset token
    },
  });

  return { resetToken };
}

/**
 * Validate a registration token (used during POST /auth/register)
 * Returns the email associated with the verified OTP
 */
export async function validateRegistrationToken(email: string, registrationToken: string): Promise<boolean> {
  const record = await prisma.otp_tokens.findFirst({
    where: {
      email,
      verification_token: registrationToken,
      purpose: OtpPurpose.REGISTER,
      is_verified: true,
      expires_at: { gt: new Date() },
    },
  });

  if (!record) {
    return false;
  }

  return true;
}

/**
 * Validate a reset token (used during POST /auth/reset-password)
 */
export async function validateResetToken(email: string, resetToken: string): Promise<boolean> {
  const record = await prisma.otp_tokens.findFirst({
    where: {
      email,
      verification_token: resetToken,
      purpose: OtpPurpose.RESET_PASSWORD,
      is_verified: true,
      expires_at: { gt: new Date() },
    },
  });

  if (!record) {
    return false;
  }

  return true;
}

/**
 * Consume (delete) a used OTP token after successful operation
 */
export async function consumeOtpToken(email: string, token: string): Promise<void> {
  await prisma.otp_tokens.deleteMany({
    where: {
      email,
      verification_token: token,
    },
  });
}

/**
 * Cleanup expired OTP tokens
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.otp_tokens.deleteMany({
    where: {
      expires_at: { lt: new Date() },
    },
  });
  return result.count;
}

// ==================== Internal helpers ====================

/**
 * Check if the user needs to wait before resending OTP
 */
async function checkResendDelay(email: string, purpose: OtpPurpose): Promise<void> {
  const recentOtp = await prisma.otp_tokens.findFirst({
    where: {
      email,
      purpose,
      created_at: {
        gt: new Date(Date.now() - config.otp.resendDelaySeconds * 1000),
      },
    },
    orderBy: { created_at: 'desc' },
  });

  if (recentOtp) {
    const waitSeconds = Math.ceil(
      (recentOtp.created_at.getTime() + config.otp.resendDelaySeconds * 1000 - Date.now()) / 1000
    );
    throw new OtpError(
      `Vui lòng đợi ${waitSeconds} giây trước khi gửi lại mã OTP.`,
      'OTP_RESEND_DELAY',
      429
    );
  }
}

/**
 * Create OTP record and send email
 */
async function createAndSendOtp(email: string, purpose: OtpPurpose): Promise<SendOtpResult> {
  // Invalidate all previous unverified OTPs for this email+purpose
  await prisma.otp_tokens.deleteMany({
    where: {
      email,
      purpose,
      is_verified: false,
    },
  });

  // Generate OTP code and verification token
  const otpCode = generateOtpCode();
  const verificationToken = generateVerificationToken();
  const hashedCode = await bcrypt.hash(otpCode, SALT_ROUNDS);

  const expiresAt = new Date(Date.now() + config.otp.expirationMinutes * 60 * 1000);

  // Store OTP in database
  const otpRecord = await prisma.otp_tokens.create({
    data: {
      email,
      purpose,
      code: hashedCode,
      verification_token: verificationToken,
      max_attempts: config.otp.maxAttempts,
      expires_at: expiresAt,
    },
  });

  // Send email
  const purposeLabel = purpose === OtpPurpose.REGISTER ? 'register' : 'reset';
  try {
    await sendOtpEmail({
      to: email,
      otp: otpCode,
      purpose: purposeLabel,
      expiresInMinutes: config.otp.expirationMinutes,
    });
  } catch (error) {
    // Delete the OTP record if email fails to send
    await prisma.otp_tokens.delete({
      where: { id: otpRecord.id },
    });

    // Log the error for debugging
    console.error(`❌ Failed to send OTP email to ${email}:`, error);

    // Provide user-friendly error message
    if (error instanceof Error && error.message.includes('SMTP credentials')) {
      throw new Error(
        'Server email configuration error. Please contact administrator. ' +
        'SMTP credentials are not configured.'
      );
    }

    throw new Error(
      'Failed to send OTP email. Please try again or contact support if the problem persists.'
    );
  }

  return {
    verificationToken,
    expiresIn: config.otp.expirationMinutes * 60,
  };
}

/**
 * Common OTP validation and verification logic
 */
async function validateAndVerifyOtp(
  email: string,
  verificationToken: string,
  otpCode: string,
  purpose: OtpPurpose
) {
  // Find the OTP record
  const otpRecord = await prisma.otp_tokens.findFirst({
    where: {
      email,
      verification_token: verificationToken,
      purpose,
      is_verified: false,
    },
  });

  if (!otpRecord) {
    throw new OtpError('Mã OTP không tồn tại hoặc đã được sử dụng.', 'OTP_NOT_FOUND');
  }

  // Check expiration
  if (otpRecord.expires_at < new Date()) {
    // Clean up expired record
    await prisma.otp_tokens.delete({ where: { id: otpRecord.id } });
    throw new OtpError('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.', 'OTP_EXPIRED');
  }

  // Check attempt limit
  if (otpRecord.attempts_made >= otpRecord.max_attempts) {
    // Clean up exhausted record
    await prisma.otp_tokens.delete({ where: { id: otpRecord.id } });
    throw new OtpError(
      'Đã vượt quá số lần thử cho phép. Vui lòng yêu cầu mã OTP mới.',
      'OTP_LIMIT'
    );
  }

  // Verify OTP code
  const isValid = await bcrypt.compare(otpCode, otpRecord.code);

  if (!isValid) {
    // Increment attempt count
    const updated = await prisma.otp_tokens.update({
      where: { id: otpRecord.id },
      data: { attempts_made: { increment: 1 } },
    });

    const remaining = otpRecord.max_attempts - updated.attempts_made;
    throw new OtpError(
      `Mã OTP không đúng. Còn ${remaining} lần thử.`,
      'OTP_INVALID',
      400,
      remaining
    );
  }

  return otpRecord;
}
