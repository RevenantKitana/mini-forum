import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { X, Search, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Tag {
  id: number;
  name: string;
  slug: string;
  usage_count?: number;
  use_permission?: string;
  is_active?: boolean;
}

interface TagSearchInputProps {
  tags: Tag[];
  activeTags: string[];
  onTagToggle: (slug: string) => void;
  placeholder?: string;
  maxDisplay?: number;
  showCount?: boolean;
  compact?: boolean;
}

export function TagSearchInput({
  tags,
  activeTags,
  onTagToggle,
  placeholder = 'Tìm tag...',
  maxDisplay = 20,
  showCount = true,
  compact = false,
}: TagSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredTags = useMemo(
    () =>
      tags
        .filter((t) => t.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
        .slice(0, maxDisplay),
    [tags, debouncedQuery, maxDisplay]
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className={cn('absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn('pl-7', compact ? 'h-7 text-xs' : 'h-8 text-sm')}
        />
        {searchQuery && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {debouncedQuery && (
        <p className="text-xs text-muted-foreground">
          {filteredTags.length} kết quả
        </p>
      )}

      <div className={cn('flex flex-wrap', compact ? 'gap-1' : 'gap-1.5')}>
        {filteredTags.map((tag) => {
          const isActive = activeTags.includes(tag.slug);
          const isRestricted = tag.use_permission && tag.use_permission !== 'ALL';
          const isInactive = tag.is_active === false;

          const tagBadge = (
            <Badge
              key={tag.id}
              variant={isActive ? 'default' : 'outline'}
              size={compact ? 'sm' : 'default'}
              className={cn(
                'hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer btn-press',
                isInactive && 'opacity-60',
                isActive && 'animate-pop-in'
              )}
              onClick={() => onTagToggle(tag.slug)}
            >
              {isRestricted && (
                <Lock className="h-2.5 w-2.5 mr-1 text-amber-600 dark:text-amber-400" />
              )}
              {tag.name}
              {showCount && tag.usage_count !== undefined && (
                <span className="ml-1 opacity-70">({tag.usage_count})</span>
              )}
              {isActive && <X className="ml-1 h-3 w-3" />}
            </Badge>
          );

          if (isRestricted || isInactive) {
            return (
              <Tooltip key={tag.id}>
                <TooltipTrigger asChild>
                  <div>{tagBadge}</div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {isInactive
                    ? 'Tag này đã bị vô hiệu hóa'
                    : `Yêu cầu quyền ${tag.use_permission} để sử dụng`}
                </TooltipContent>
              </Tooltip>
            );
          }

          return tagBadge;
        })}
      </div>
    </div>
  );
}
