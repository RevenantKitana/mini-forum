import transporter from '../config/email.js';
import config from '../config/index.js';

/**
 * Email Service - Handles sending OTP emails via Brevo SMTP
 */

interface SendOtpEmailOptions {
  to: string;
  otp: string;
  purpose: 'register' | 'reset';
  expiresInMinutes: number;
}

/**
 * Send OTP email for registration or password reset
 */
export async function sendOtpEmail(options: SendOtpEmailOptions): Promise<void> {
  const { to, otp, purpose, expiresInMinutes } = options;

  if (!config.brevo.smtpUser || !config.brevo.smtpKey) {
    throw new Error(
      'Brevo SMTP credentials not configured. Please set BREVO_SMTP_USER and BREVO_SMTP_KEY environment variables.'
    );
  }

  const subject = purpose === 'register'
    ? `${config.brevo.fromName} - Mã xác thực đăng ký`
    : `${config.brevo.fromName} - Mã xác thực đặt lại mật khẩu`;

  const html = purpose === 'register'
    ? createRegisterOtpTemplate(otp, expiresInMinutes)
    : createResetOtpTemplate(otp, expiresInMinutes);

  try {
    await transporter.sendMail({
      to,
      from: {
        address: config.brevo.fromEmail,
        name: config.brevo.fromName,
      },
      subject,
      html,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to send email via Brevo SMTP: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Registration OTP email template
 */
function createRegisterOtpTemplate(otp: string, expiresInMinutes: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>Xác thực đăng ký tài khoản</h2>
        
        <p>Mã OTP của bạn:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${otp}
        </div>
        
        <p>Mã này hết hạn sau ${expiresInMinutes} phút.</p>
        
        <p style="color: #666; font-size: 12px;">
          Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Password Reset OTP email template
 */
function createResetOtpTemplate(otp: string, expiresInMinutes: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>Yêu cầu đặt lại mật khẩu</h2>
        
        <p>Mã OTP của bạn:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${otp}
        </div>
        
        <p>Mã này hết hạn sau ${expiresInMinutes} phút.</p>
        
        <p style="color: #666; font-size: 12px;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        </p>
      </div>
    </body>
    </html>
  `;
}
