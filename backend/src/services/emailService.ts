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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Chào mừng đến với ${config.sendGrid.fromName}! 🎉</h1>
          </div>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #f0f4ff; border: 2px dashed #4f7df9; border-radius: 12px; padding: 20px 40px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #4f7df9; font-family: 'Courier New', monospace;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            ⏱️ Mã này sẽ hết hạn sau <strong>${expiresInMinutes} phút</strong>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.<br>
            Không chia sẻ mã OTP này với bất kỳ ai.
          </p>
        </div>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Yêu cầu đặt lại mật khẩu 🔒</h1>
          </div>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #fff5f5; border: 2px dashed #e53e3e; border-radius: 12px; padding: 20px 40px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #e53e3e; font-family: 'Courier New', monospace;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            ⏱️ Mã này sẽ hết hạn sau <strong>${expiresInMinutes} phút</strong>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, tài khoản của bạn vẫn an toàn.<br>
            Vui lòng bỏ qua email này. Không chia sẻ mã OTP này với bất kỳ ai.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
