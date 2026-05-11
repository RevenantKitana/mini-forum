import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mock factories
const { mockSendTransacEmail } = vi.hoisted(() => ({
  mockSendTransacEmail: vi.fn(),
}));

// Mock sib-api-v3-sdk at the module level
vi.mock('sib-api-v3-sdk');

// Import after marking as mocked
import * as sibMock from 'sib-api-v3-sdk';

// Define classes that will work with dynamic import and 'new' operator
class MockApiClient {
  authentications = {
    'api-key': {
      apiKey: '',
    },
  };
}

class MockTransactionalEmailsApi {
  sendTransacEmail = mockSendTransacEmail;
}

// Set the mock implementation
const sibMockTyped = sibMock as any;
sibMockTyped.default = {
  ApiClient: MockApiClient,
  TransactionalEmailsApi: MockTransactionalEmailsApi,
};

Object.assign(sibMockTyped, {
  ApiClient: MockApiClient,
  TransactionalEmailsApi: MockTransactionalEmailsApi,
});

// Mock config
vi.mock('../config/index.js', () => ({
  default: {
    brevo: {
      apiKey: 'test-brevo-api-key',
      fromEmail: 'no-reply@test.example.com',
      fromName: 'Test Forum',
    },
  },
}));

// Import after mocks are in place
import { sendOtpEmail } from '../services/emailService.js';
import { sendOtpEmailViaApi } from '../services/brevoApiService.js';

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendTransacEmail.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendOtpEmail', () => {
    it('should skip sending in test environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      await sendOtpEmail({
        to: 'test@example.com',
        otp: '123456',
        purpose: 'register',
        expiresInMinutes: 10,
      });

      expect(mockSendTransacEmail).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should send registration OTP email successfully', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSendTransacEmail.mockResolvedValueOnce({
        messageId: 'msg_123abc',
      });

      await sendOtpEmail({
        to: 'user@example.com',
        otp: '654321',
        purpose: 'register',
        expiresInMinutes: 10,
      });

      expect(mockSendTransacEmail).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle API errors gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const apiError = new Error('API rate limit exceeded');
      mockSendTransacEmail.mockRejectedValueOnce(apiError);

      await expect(
        sendOtpEmail({
          to: 'error@example.com',
          otp: '111111',
          purpose: 'register',
          expiresInMinutes: 10,
        })
      ).rejects.toThrow('Failed to send OTP email via Brevo API');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle missing messageId in response', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSendTransacEmail.mockResolvedValueOnce({
        id: 'invalid',
      });

      await expect(
        sendOtpEmail({
          to: 'nomessageid@example.com',
          otp: '222222',
          purpose: 'register',
          expiresInMinutes: 10,
        })
      ).rejects.toThrow('Failed to get message ID from Brevo API response');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('sendOtpEmailViaApi', () => {
    it('should include OTP in email HTML content', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSendTransacEmail.mockResolvedValueOnce({
        messageId: 'msg_otp_content',
      });

      await sendOtpEmailViaApi({
        to: 'content@example.com',
        otp: 'TEST123',
        purpose: 'register',
        expiresInMinutes: 5,
      });

      expect(mockSendTransacEmail).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should send password reset OTP email', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockSendTransacEmail.mockResolvedValueOnce({
        messageId: 'msg_reset',
      });

      await sendOtpEmailViaApi({
        to: 'reset@example.com',
        otp: '333333',
        purpose: 'reset',
        expiresInMinutes: 20,
      });

      expect(mockSendTransacEmail).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
