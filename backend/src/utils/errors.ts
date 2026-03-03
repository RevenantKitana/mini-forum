/**
 * Custom Error classes for API responses
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  public errors: Record<string, string[]>;

  constructor(message: string = 'Validation Error', errors: Record<string, string[]> = {}) {
    super(message, 422);
    this.errors = errors;
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}

export class OtpError extends AppError {
  public code: 'OTP_EXPIRED' | 'OTP_INVALID' | 'OTP_LIMIT' | 'OTP_USED' | 'OTP_NOT_FOUND' | 'OTP_RESEND_DELAY';
  public attemptsRemaining?: number;

  constructor(
    message: string,
    code: 'OTP_EXPIRED' | 'OTP_INVALID' | 'OTP_LIMIT' | 'OTP_USED' | 'OTP_NOT_FOUND' | 'OTP_RESEND_DELAY',
    statusCode: number = 400,
    attemptsRemaining?: number
  ) {
    super(message, statusCode);
    this.name = 'OtpError';
    this.code = code;
    this.attemptsRemaining = attemptsRemaining;
  }
}

export class RateLimitError extends AppError {
  public retryAfter: number;

  constructor(message: string = 'Too many requests', retryAfter: number = 60) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}






