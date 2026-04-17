/**
 * Jest Setup File - Sets up environment variables for tests
 * This runs before all tests to ensure required env vars are available
 */

// Set required environment variables for testing
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '5000';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/forum_test';
process.env.DIRECT_URL = process.env.DIRECT_URL || 'postgresql://user:password@localhost:5432/forum_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_key_min_32_chars_long!!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key_min_32_chars_long!!';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174';
process.env.COMMENT_EDIT_TIME_LIMIT = process.env.COMMENT_EDIT_TIME_LIMIT || '30';
process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || 'test_brevo_api_key_here';
process.env.BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@test.example.com';
process.env.BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || 'Test Forum';
process.env.OTP_LENGTH = process.env.OTP_LENGTH || '6';
process.env.OTP_EXPIRATION_MINUTES = process.env.OTP_EXPIRATION_MINUTES || '10';
process.env.OTP_MAX_ATTEMPTS = process.env.OTP_MAX_ATTEMPTS || '5';
process.env.OTP_RESEND_DELAY_SECONDS = process.env.OTP_RESEND_DELAY_SECONDS || '60';
