import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
} from '../utils/errors.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with message and status code', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Test error', 400);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('BadRequestError', () => {
    it('should create a 400 error', () => {
      const error = new BadRequestError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should use default message if not provided', () => {
      const error = new BadRequestError();
      expect(error.message).toBe('Bad Request');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError('Invalid token');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error', () => {
      const error = new ForbiddenError('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Email already exists');
    });
  });

  describe('ValidationError', () => {
    it('should create a 422 error with field errors', () => {
      const errors = {
        email: ['Invalid email format'],
        password: ['Password too short'],
      };
      const error = new ValidationError('Validation failed', errors);
      
      expect(error.statusCode).toBe(422);
      expect(error.errors).toEqual(errors);
      expect(error.message).toBe('Validation failed');
    });
  });

  describe('InternalServerError', () => {
    it('should create a 500 error', () => {
      const error = new InternalServerError('Database connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Database connection failed');
    });
  });
});
