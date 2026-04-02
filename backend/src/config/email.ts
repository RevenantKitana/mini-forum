import nodemailer from 'nodemailer';
import config from './index.js';

/**
 * Initialize Brevo SMTP transporter via nodemailer
 */
const transporter = nodemailer.createTransport({
  host: config.brevo.smtpHost,
  port: config.brevo.smtpPort,
  secure: false,
  auth: {
    user: config.brevo.smtpUser,
    pass: config.brevo.smtpKey,
  },
});

/**
 * Verify Brevo SMTP configuration on startup (non-blocking)
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    if (!config.brevo.smtpUser || !config.brevo.smtpKey) {
      console.warn('⚠️  Brevo SMTP credentials not configured. OTP emails will fail.');
      console.warn('   Please set BREVO_SMTP_USER and BREVO_SMTP_KEY in backend/.env');
      return false;
    }
    await transporter.verify();
    console.log('✅ Brevo SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Brevo SMTP verification failed:', error);
    return false;
  }
}

export default transporter;
