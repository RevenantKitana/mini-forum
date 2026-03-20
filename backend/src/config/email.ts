import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import config from './index.js';

/**
 * Create Nodemailer transporter
 * Supports SMTP (Gmail, SendGrid, Mailgun, etc.)
 */
const smtpConfig: SMTPTransport.Options = {
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  connectionTimeout: 10000,  // 10 seconds
  socketTimeout: 10000,      // 10 seconds
};

const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Verify SMTP connection on startup (non-blocking)
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    if (!config.smtp.user || !config.smtp.pass) {
      console.warn('⚠️  Missing SMTP credentials. OTP emails will fail.');
      console.warn('   Please set SMTP_USER and SMTP_PASS in backend/.env');
      console.warn('   Example:');
      console.warn('     SMTP_HOST=smtp.gmail.com');
      console.warn('     SMTP_PORT=587');
      console.warn('     SMTP_SECURE=false');
      console.warn('     SMTP_USER=your-email@gmail.com');
      console.warn('     SMTP_PASS=your-app-password');
      return false;
    }
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    console.error('   Please verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in backend/.env');
    return false;
  }
}

export default transporter;
