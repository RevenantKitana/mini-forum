import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { Role, ROLES } from '../constants/roles.js';

/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.role as Role;

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user is admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  return authorize(ROLES.ADMIN)(req, res, next);
}

/**
 * Middleware to check if user is moderator or admin
 */
export function isModerator(req: Request, res: Response, next: NextFunction): void {
  return authorize(ROLES.MODERATOR, ROLES.ADMIN)(req, res, next);
}

/**
 * Middleware to check if user is the owner of the resource or admin/moderator
 * @param getResourceOwnerId - Function to get the owner ID from the request
 */
export function isOwnerOrModerator(getResourceOwnerId: (req: Request) => Promise<number | null>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.role as Role;

      // Moderators and admins can access
      if (userRole === ROLES.MODERATOR || userRole === ROLES.ADMIN) {
        next();
        return;
      }

      // Check if user is the owner
      const ownerId = await getResourceOwnerId(req);
      if (ownerId && ownerId === req.user.userId) {
        next();
        return;
      }

      throw new ForbiddenError('You do not have permission to access this resource');
    } catch (error) {
      next(error);
    }
  };
}

// Aliases for authorize
export const requireRole = authorize;
export const requireRoles = authorize;






