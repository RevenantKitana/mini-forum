/**
 * Brevo API Service - Handles sending emails via Brevo API (not SMTP)
 * Uses sib-api-v3-sdk for API communication
 */

import config from '../config/index.js';
import { createRequire } from 'module';

// Type definitions for sib-api-v3-sdk
interface TransactionalEmailPayload {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  sender: { email: string; name?: string };
  replyTo?: { email: string; name?: string };
}

interface SendOtpEmailOptions {
  to: string;
  otp: string;
  purpose: 'register' | 'reset';
  expiresInMinutes: number;
}

// Lazy-loaded require for better Jest compatibility
let sibApiV3Sdk: any;

function getSibApiV3Sdk(): any {
  if (!sibApiV3Sdk) {
    // Create require function only when needed
    try {
      // Use dynamic import for better ESM/Jest compatibility
      // Fall back to createRequire if needed
      const requireFunc = createRequire(process.cwd());
      sibApiV3Sdk = requireFunc('sib-api-v3-sdk');
    } catch {
      // In case of Jest environment issues, try a direct approach
      throw new Error('Failed to load sib-api-v3-sdk. Make sure it is installed.');
    }
  }
  return sibApiV3Sdk;
}

/**
 * Initialize and send email via Brevo API
 */
export async function sendOtpEmailViaApi(options: SendOtpEmailOptions): Promise<void> {
  const { to, otp, purpose, expiresInMinutes } = options;

  if (!config.brevo.apiKey) {
    throw new Error(
      'Brevo API key not configured. Please set BREVO_API_KEY environment variable.'
    );
  }

  // Use CommonJS require for better compatibility with sib-api-v3-sdk
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SibApiV3Sdk: any = getSibApiV3Sdk();

    // Set up the API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = config.brevo.apiKey;

    // Create transactional email API instance
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    // Prepare email content
    const subject = purpose === 'register'
      ? `${config.brevo.fromName} - Mã xác thực đăng ký`
      : `${config.brevo.fromName} - Mã xác thực đặt lại mật khẩu`;

    const htmlContent = purpose === 'register'
      ? createRegisterOtpTemplate(otp, expiresInMinutes)
      : createResetOtpTemplate(otp, expiresInMinutes);

    // Build email payload
    const emailPayload = {
      to: [{ email: to }],
      subject,
      htmlContent,
      sender: {
        email: config.brevo.fromEmail,
        name: config.brevo.fromName,
      },
    };

    // Send the email via API
    const response = await apiInstance.sendTransacEmail(emailPayload);
    
    if (!response || !response.messageId) {
      throw new Error('Failed to get message ID from Brevo API response');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to send email via Brevo API: ${error.message}`);
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

