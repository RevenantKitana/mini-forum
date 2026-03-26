import sgMail from '@sendgrid/mail';
import config from '../config/index.js';

/**
 * Email Service - Handles sending OTP emails
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

  // Validate SendGrid API key before attempting to send
  if (!config.sendGrid.apiKey) {
    throw new Error(
      'SendGrid API key not configured. Please set SENDGRID_API_KEY environment variable. ' +
      'Get your API key from: https://app.sendgrid.com/settings/api_keys'
    );
  }

  const subject = purpose === 'register'
    ? `${config.sendGrid.fromName} - Mã xác thực đăng ký`
    : `${config.sendGrid.fromName} - Mã xác thực đặt lại mật khẩu`;

  const html = purpose === 'register'
    ? createRegisterOtpTemplate(otp, expiresInMinutes)
    : createResetOtpTemplate(otp, expiresInMinutes);

  try {
    await sgMail.send({
      to,
      from: {
        email: config.sendGrid.fromEmail,
        name: config.sendGrid.fromName,
      },
      subject,
      html,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to send email via SendGrid: ${error.message}`);
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
