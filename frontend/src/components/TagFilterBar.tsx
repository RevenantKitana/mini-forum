import { useState, useEffect, useMemo } from 'react';
import { usePopularTags } from '@/hooks/useTags';
import { Tag } from '@/api/services/tagService';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Input } from '@/app/components/ui/input';
import { Tag as TagIcon, Hash, Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagFilterBarProps {
  /** Currently applied tag slugs from URL */
  appliedTags: string[];
  /** Called when user clicks "Apply" */
  onApply: (tags: string[]) => void;
  /** Called when user clicks "Clear" */
  onClear: () => void;
}

export function TagFilterBar({ appliedTags, onApply, onClear }: TagFilterBarProps) {
  const { data: tags } = usePopularTags(30);
  const [selectedTags, setSelectedTags] = useState<string[]>(appliedTags);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Sync selected tags when applied tags change from outside
  useEffect(() => {
    setSelectedTags(appliedTags);
  }, [appliedTags]);

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!searchQuery.trim()) return tags;
    return tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tags, searchQuery]);

  const toggleTag = (slug: string) => {
    setSelectedTags(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleApply = () => {
    onApply(selectedTags);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedTags([]);
    onClear();
    setIsOpen(false);
  };

  const hasChanges = JSON.stringify([...selectedTags].sort()) !== JSON.stringify([...appliedTags].sort());
  const hasActiveFilter = appliedTags.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1 sm:gap-1.5 h-7.5 sm:h-8.5 px-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-lg bg-muted/60 hover:bg-muted text-foreground transition-colors shrink-0",
            hasActiveFilter && "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15"
          )}
        >
          <TagIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">
            {hasActiveFilter ? `${appliedTags.length} tag` : 'Tags'}
          </span>
          {hasActiveFilter && (
            <span className="sm:hidden text-xs font-semibold">
              {appliedTags.length}
            </span>
          )}
          {hasActiveFilter && (
            <span
              role="button"
              tabIndex={0}
              className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 cursor-pointer inline-flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              title="Xóa lọc tags"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(360px,calc(100vw-2rem))] p-4 rounded-2xl border border-border/40 shadow-xl" align="end">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm sm:text-base">Lọc theo tags</h4>
            {selectedTags.length > 0 && (
              <span className="text-xs sm:text-sm text-muted-foreground">{selectedTags.length} đã chọn</span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm sm:text-base rounded-xl bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-ring/30"
            />
            {searchQuery && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tag list */}
          <div className="max-h-56 overflow-y-auto flex flex-wrap gap-2">
            {filteredTags.map(tag => {
              const isSelected = selectedTags.includes(tag.slug);
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:scale-105 px-3 py-1.5 text-xs sm:text-sm rounded-xl',
                    isSelected && 'pr-2 shadow-xs font-semibold'
                  )}
                  onClick={() => toggleTag(tag.slug)}
                >
                  <Hash className="h-3.5 w-3.5 mr-0.5" />
                  {tag.name}
                  <span className="ml-1 opacity-70 text-xs">({tag.usage_count})</span>
                  {isSelected && <Check className="ml-1.5 h-3.5 w-3.5" />}
                </Badge>
              );
            })}
            {filteredTags.length === 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground py-2">Không tìm thấy tag nào</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <Button
              size="sm"
              className="flex-1 h-10 text-sm sm:text-base font-semibold rounded-xl"
              onClick={handleApply}
              disabled={!hasChanges}
            >
              Áp dụng
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-10 text-sm sm:text-base font-semibold rounded-xl"
              onClick={handleClear}
              disabled={selectedTags.length === 0 && appliedTags.length === 0}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
