/**
 * Example Usage of OTP via Brevo API
 * 
 * Đây là các ví dụ về cách sử dụng tính năng gửi OTP qua Brevo API
 */

// ============================================================================
// 1. Backend Usage (Node.js/TypeScript)
// ============================================================================

import * as otpService from '../services/otpService.js';
import { Request, Response } from 'express';

/**
 * Ví dụ 1: Gửi OTP cho Đăng Ký
 */
export async function exampleSendOtpRegister(req: Request, res: Response) {
  try {
    const email = req.body.email;

    // Gửi OTP
    const result = await otpService.sendOtpForRegister(email);

    res.json({
      success: true,
      verificationToken: result.verificationToken,
      expiresIn: result.expiresIn,
      message: 'OTP sent successfully via Brevo API',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
}

/**
 * Ví dụ 2: Xác Nhận OTP Đăng Ký
 */
export async function exampleVerifyOtpRegister(req: Request, res: Response) {
  try {
    const { email, verificationToken, otp } = req.body;

    // Xác nhận OTP
    const result = await otpService.verifyOtpForRegister(
      email,
      verificationToken,
      otp
    );

    res.json({
      success: true,
      registrationToken: result.registrationToken,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
}

/**
 * Ví dụ 3: Gửi OTP cho Reset Mật Khẩu
 */
export async function exampleSendOtpReset(req: Request, res: Response) {
  try {
    const email = req.body.email;

    // Gửi OTP
    const result = await otpService.sendOtpForReset(email);

    res.json({
      success: true,
      verificationToken: result.verificationToken,
      expiresIn: result.expiresIn,
      message: 'OTP sent successfully via Brevo API (if email exists)',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
}

/**
 * Ví dụ 4: Xác Nhận OTP Reset
 */
export async function exampleVerifyOtpReset(req: Request, res: Response) {
  try {
    const { email, verificationToken, otp } = req.body;

    // Xác nhận OTP
    const result = await otpService.verifyOtpForReset(
      email,
      verificationToken,
      otp
    );

    res.json({
      success: true,
      resetToken: result.resetToken,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
}

// ============================================================================
// 2. Frontend Usage (React/TypeScript)
// ============================================================================

/**
 * Ví dụ React Hook cho Đăng Ký với OTP
 */
export function useOtpRegistration() {
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [verificationToken, setVerificationToken] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState<'email' | 'otp'>('email');

  // Bước 1: Gửi OTP
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/send-otp-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setVerificationToken(data.verificationToken);
        setStep('otp');
        console.log(
          `✅ OTP sent to ${email}. It will expire in ${data.expiresIn} seconds.`
        );
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác Nhận OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/verify-otp-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verificationToken,
          otp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ OTP verified successfully!');
        // Tiến hành đăng ký tài khoản
        return data.registrationToken;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ OTP verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    otp,
    setOtp,
    step,
    loading,
    handleSendOtp,
    handleVerifyOtp,
  };
}

/**
 * Ví dụ React Hook cho Reset Mật Khẩu
 */
export function useOtpPasswordReset() {
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [verificationToken, setVerificationToken] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState<'email' | 'otp' | 'password'>(
    'email'
  );

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/send-otp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setVerificationToken(data.verificationToken);
        setStep('otp');
        // Note: System không tiết lộ email có tồn tại hay không (security measure)
        console.log('If email exists, OTP will be sent via Brevo API');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/verify-otp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verificationToken,
          otp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ OTP verified! Now you can reset password.');
        setStep('password');
        return data.resetToken;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    otp,
    setOtp,
    step,
    loading,
    handleSendOtp,
    handleVerifyOtp,
  };
}

// ============================================================================
// 3. CURL Examples (Testing)
// ============================================================================

/**
 * CURL Examples:
 * 
 * 1. Gửi OTP Đăng Ký:
 * curl -X POST http://localhost:5000/api/v1/auth/send-otp-register
 *   -H "Content-Type: application/json"
 *   -d '{"email":"user@example.com"}'
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "verificationToken": "abc123xyz...",
 *     "expiresIn": 600
 *   },
 *   "message": "OTP sent successfully"
 * }
 * 
 * ---
 * 
 * 2. Xác Nhận OTP Đăng Ký:
 * curl -X POST http://localhost:5000/api/v1/auth/verify-otp-register
 *   -H "Content-Type: application/json"
 *   -d '{
 *     "email": "user@example.com",
 *     "verificationToken": "abc123xyz...",
 *     "otp": "123456"
 *   }'
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "registrationToken": "def456uvw..."
 *   },
 *   "message": "OTP verified successfully"
 * }
 * 
 * ---
 * 
 * 3. Gửi OTP Reset Mật Khẩu:
 * curl -X POST http://localhost:5000/api/v1/auth/send-otp-reset
 *   -H "Content-Type: application/json"
 *   -d '{"email":"user@example.com"}'
 * 
 * ---
 * 
 * 4. Xác Nhận OTP Reset:
 * curl -X POST http://localhost:5000/api/v1/auth/verify-otp-reset
 *   -H "Content-Type: application/json"
 *   -d '{
 *     "email": "user@example.com",
 *     "verificationToken": "abc123xyz...",
 *     "otp": "123456"
 *   }'
 */

// ============================================================================
// 4. Error Handling Examples
// ============================================================================

export async function handleOtpErrors() {
  try {
    // Nếu BREVO_API_KEY không được cấu hình
    // System sẽ tự động fallback to SMTP
    // Nếu cả API và SMTP đều không sẵn, sẽ throw error

    const response = await fetch('/api/v1/auth/send-otp-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    if (!response.ok) {
      const error = await response.json();
      switch (error.error) {
        case 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc đặt lại mật khẩu.':
          console.log('Email already registered');
          break;
        case 'Resend delay not met':
          console.log('Please wait before requesting a new OTP');
          break;
        default:
          console.error('Unknown error:', error.error);
      }
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// ============================================================================
// 5. Integration with Registration Flow
// ============================================================================

/**
 * Complete Registration Flow
 */
export async function completeRegistrationFlow(userData: {
  email: string;
  password: string;
  username: string;
  otp: string;
  registrationToken: string;
}) {
  try {
    // Step 1: OTP verification (already done)
    // Step 2: Create account
    const response = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        username: userData.username,
        registrationToken: userData.registrationToken,
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log('✅ Account created successfully!');
      // Redirect to login hoặc auto-login
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
}
