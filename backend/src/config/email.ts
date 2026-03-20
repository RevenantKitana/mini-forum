import sgMail from '@sendgrid/mail';
import config from './index.js';

/**
 * Initialize SendGrid Mail Client
 * Supports sending emails via SendGrid Web API
 */

// Initialize SendGrid with API key
if (config.sendGrid.apiKey) {
  sgMail.setApiKey(config.sendGrid.apiKey);
}

/**
 * Verify SendGrid configuration on startup (non-blocking)
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    if (!config.sendGrid.apiKey) {
      console.warn('⚠️  SendGrid API key not configured. OTP emails will fail.');
      console.warn('   Please set SENDGRID_API_KEY in backend/.env');
      console.warn('   Get your API key from: https://app.sendgrid.com/settings/api_keys');
      return false;
    }
    console.log('✅ SendGrid configuration loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ SendGrid initialization failed:', error);
    return false;
  }
}

export default sgMail;
