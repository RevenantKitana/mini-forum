/**
 * Vitest setup — provide all required environment variables so that
 * `src/config/index.ts` does not call `process.exit(1)` during tests.
 */

// Database
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/forum_test';

// JWT
process.env.JWT_ACCESS_SECRET = 'test-access-secret-minimum-32-characters-long!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-characters-long!';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// CORS
process.env.FRONTEND_URL = 'http://localhost:5173';

// Comment
process.env.COMMENT_EDIT_TIME_LIMIT = '5';

// Brevo (email)
process.env.BREVO_API_KEY = 'test-brevo-api-key';
process.env.BREVO_FROM_EMAIL = 'no-reply@test.example.com';
process.env.BREVO_FROM_NAME = 'Test Forum';

// OTP
process.env.OTP_LENGTH = '6';
process.env.OTP_EXPIRATION_MINUTES = '10';
process.env.OTP_MAX_ATTEMPTS = '3';
process.env.OTP_RESEND_DELAY_SECONDS = '60';

// ImageKit
process.env.IMAGEKIT_PUBLIC_KEY = 'test_public_key';
process.env.IMAGEKIT_PRIVATE_KEY = 'test_private_key';
process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/testaccount';
