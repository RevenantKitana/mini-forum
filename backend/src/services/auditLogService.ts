import prisma from '../config/database.js';
import { AuditAction, AuditTarget } from '@prisma/client';

/**
 * AuditLog select fields for responses
 */
const auditLogSelect = {
  id: true,
  user_id: true,
  action: true,
  target_type: true,
  target_id: true,
  target_name: true,
  old_value: true,
  new_value: true,
  ip_address: true,
  created_at: true,
  users: {
    select: {
      id: true,
      username: true,
      display_name: true,
      avatar_url: true,
    },
  },
};

/**
 * Transform raw Prisma audit log to clean API response shape.
 * Renames relation: users → user
 */
function transformAuditLog(log: any): any {
  if (!log) return log;
  const { users, ...rest } = log;
  return {
    ...rest,
    user: users || undefined,
  };
}

export interface CreateAuditLogInput {
  userId: number;
  action: AuditAction;
  targetType: AuditTarget;
  targetId?: number;
  targetName?: string;
  oldValue?: string | object;
  newValue?: string | object;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(data: CreateAuditLogInput) {
  return prisma.audit_logs.create({
    data: {
      user_id: data.userId,
      action: data.action,
      target_type: data.targetType,
      target_id: data.targetId,
      target_name: data.targetName,
      old_value: data.oldValue ? (typeof data.oldValue === 'string' ? data.oldValue : JSON.stringify(data.oldValue)) : null,
      new_value: data.newValue ? (typeof data.newValue === 'string' ? data.newValue : JSON.stringify(data.newValue)) : null,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    },
  });
}

/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  userId?: number;
  action?: AuditAction;
  targetType?: AuditTarget;
  targetId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.userId) {
    where.user_id = params.userId;
  }

  if (params.action) {
    where.action = params.action;
  }

  if (params.targetType) {
    where.target_type = params.targetType;
  }

  if (params.targetId) {
    where.target_id = params.targetId;
  }

  if (params.startDate || params.endDate) {
    where.created_at = {};
    if (params.startDate) {
      where.created_at.gte = params.startDate;
    }
    if (params.endDate) {
      where.created_at.lte = params.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      select: auditLogSelect,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.audit_logs.count({ where }),
  ]);

  return {
    logs: logs.map(transformAuditLog),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Helper to get IP address from request
 */
export function getClientIp(req: any): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0])?.split(',')[0]?.trim();
  }
  return req.ip || req.connection?.remoteAddress;
}







