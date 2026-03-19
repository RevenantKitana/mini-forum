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
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 sm:gap-2">
            <TagIcon className="h-4 w-4" />
            {hasActiveFilter ? (
              <span className="text-xs">{appliedTags.length} tag</span>
            ) : (
              <span className="hidden sm:inline">Tags</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Lọc theo tags</h4>
              {selectedTags.length > 0 && (
                <span className="text-xs text-muted-foreground">{selectedTags.length} đã chọn</span>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {searchQuery && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Tag list */}
            <div className="max-h-48 overflow-y-auto flex flex-wrap gap-1.5">
              {filteredTags.map(tag => {
                const isSelected = selectedTags.includes(tag.slug);
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:scale-105',
                      isSelected && 'pr-1.5'
                    )}
                    onClick={() => toggleTag(tag.slug)}
                  >
                    <Hash className="h-3 w-3 mr-0.5" />
                    {tag.name}
                    <span className="ml-1 opacity-70 text-xs">({tag.usageCount})</span>
                    {isSelected && <Check className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
              {filteredTags.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Không tìm thấy tag nào</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1 border-t">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleApply}
                disabled={!hasChanges}
              >
                Áp dụng
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                disabled={selectedTags.length === 0 && appliedTags.length === 0}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Show active tag badges */}
      {hasActiveFilter && (
        <Badge variant="secondary" className="gap-1 animate-pop-in">
          <TagIcon className="h-3 w-3" />
          {appliedTags.length} tag đang lọc
          <X
            className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors duration-200"
            onClick={onClear}
          />
        </Badge>
      )}
    </>
  );
}
