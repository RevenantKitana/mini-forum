import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this file (__dirname equivalent in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the backend root directory
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string | string[];
  };
  comment: {
    editTimeLimit: number; // Time limit in minutes for editing comments
  };
  brevo: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  otp: {
    length: number;
    expirationMinutes: number;
    maxAttempts: number;
    resendDelaySeconds: number;
  };
}

// Validate required environment variables at startup
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'FRONTEND_URL',
  'COMMENT_EDIT_TIME_LIMIT',
  'BREVO_API_KEY',
  'BREVO_FROM_EMAIL',
  'BREVO_FROM_NAME',
  'OTP_LENGTH',
  'OTP_EXPIRATION_MINUTES',
  'OTP_MAX_ATTEMPTS',
  'OTP_RESEND_DELAY_SECONDS',
];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('   Copy backend/.env.example to backend/.env and fill in the values.');
  process.exit(1);
}

const corsOrigins = process.env.FRONTEND_URL!.split(',').map((o) => o.trim());

// Reject wildcard CORS in production to prevent accidental open-origin policy
if (process.env.NODE_ENV === 'production' && corsOrigins.includes('*')) {
  console.error('❌ FRONTEND_URL must not contain wildcard (*) in production.');
  process.exit(1);
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,
  },
  cors: {
    origin: corsOrigins,
  },
  comment: {
    editTimeLimit: parseInt(process.env.COMMENT_EDIT_TIME_LIMIT!, 10),
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY!,
    fromEmail: process.env.BREVO_FROM_EMAIL!,
    fromName: process.env.BREVO_FROM_NAME!,
  },
  otp: {
    length: parseInt(process.env.OTP_LENGTH!, 10),
    expirationMinutes: parseInt(process.env.OTP_EXPIRATION_MINUTES!, 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS!, 10),
    resendDelaySeconds: parseInt(process.env.OTP_RESEND_DELAY_SECONDS!, 10),
  },
};

export default config;






