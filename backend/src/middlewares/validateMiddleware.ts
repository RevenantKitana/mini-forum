import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors.js';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, or params)
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((issue: { path: (string | number)[]; message: string }) => {
          const path = issue.path.join('.') || 'root';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        });

        throw new ValidationError('Invalid input: ' + result.error.issues.map(i => i.message).join(', '), errors);
      }

      // Replace the request data with the parsed data
      req[target] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Validate route parameters
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}






