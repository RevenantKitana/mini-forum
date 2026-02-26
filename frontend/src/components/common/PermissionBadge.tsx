import { Shield, Lock, Eye, PenLine, MessageSquare } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { cn } from '@/lib/utils';

type PermissionLevel = 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
type PermissionType = 'view' | 'post' | 'comment' | 'use';

interface PermissionBadgeProps {
  permission: PermissionLevel | string | null | undefined;
  type?: PermissionType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const permissionLabels: Record<string, string> = {
  ALL: 'Tất cả',
  MEMBER: 'Thành viên',
  MODERATOR: 'Điều hành viên',
  ADMIN: 'Quản trị viên',
};

const typeLabels: Record<PermissionType, string> = {
  view: 'xem',
  post: 'đăng bài',
  comment: 'bình luận',
  use: 'sử dụng',
};

const typeIcons: Record<PermissionType, React.ReactNode> = {
  view: <Eye className="h-3 w-3" />,
  post: <PenLine className="h-3 w-3" />,
  comment: <MessageSquare className="h-3 w-3" />,
  use: <Shield className="h-3 w-3" />,
};

export function PermissionBadge({
  permission,
  type = 'view',
  showLabel = false,
  size = 'sm',
  className,
}: PermissionBadgeProps) {
  // Don't show badge for ALL or empty permissions
  if (!permission || permission === 'ALL') {
    return null;
  }

  const permissionLabel = permissionLabels[permission] || permission;
  const typeLabel = typeLabels[type];
  const tooltipText = `Yêu cầu quyền ${permissionLabel} để ${typeLabel}`;

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
        className
      )}
    >
      {typeIcons[type]}
      {showLabel && <span>{permissionLabel}</span>}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{badgeContent}</div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="flex items-center gap-1">
          <Lock className="h-3 w-3" />
          <span>{tooltipText}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Multi-permission indicator for categories
interface CategoryPermissionsProps {
  viewPermission?: PermissionLevel | string | null;
  postPermission?: PermissionLevel | string | null;
  commentPermission?: PermissionLevel | string | null;
  showLabel?: boolean;
  className?: string;
}

export function CategoryPermissions({
  viewPermission,
  postPermission,
  commentPermission,
  showLabel = false,
  className,
}: CategoryPermissionsProps) {
  const hasRestrictions = 
    (viewPermission && viewPermission !== 'ALL') ||
    (postPermission && postPermission !== 'ALL') ||
    (commentPermission && commentPermission !== 'ALL');

  if (!hasRestrictions) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      <PermissionBadge permission={viewPermission} type="view" showLabel={showLabel} />
      <PermissionBadge permission={postPermission} type="post" showLabel={showLabel} />
      <PermissionBadge permission={commentPermission} type="comment" showLabel={showLabel} />
    </div>
  );
}

// Compact permission indicator (just an icon)
interface PermissionIndicatorProps {
  hasRestriction: boolean;
  tooltipText?: string;
  className?: string;
}

export function PermissionIndicator({
  hasRestriction,
  tooltipText = 'Nội dung bị hạn chế quyền truy cập',
  className,
}: PermissionIndicatorProps) {
  if (!hasRestriction) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex-shrink-0', className)}>
          <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
