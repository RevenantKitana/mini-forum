import { Link } from 'react-router-dom';
import { useTags } from '@/hooks/useTags';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Input } from '@/app/components/ui/input';
import { Tag as TagIcon, Hash, Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequiredDialog } from '@/components/common/LoginRequiredDialog';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function TagsPage() {
  const { data: tags, isLoading } = useTags();
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredTags = useMemo(
    () => tags?.filter((t) => t.name.toLowerCase().includes(debouncedQuery.toLowerCase())) ?? [],
    [tags, debouncedQuery]
  );

  // Group tags by usage count ranges
  const groupTagsByPopularity = (tagsList: typeof tags) => {
    if (!tagsList) return { hot: [], popular: [], regular: [] };
    
    const sorted = [...tagsList].sort((a, b) => b.usage_count - a.usage_count);
    const maxUsage = sorted[0]?.usage_count || 1;
    
    return {
      hot: sorted.filter(t => t.usage_count > maxUsage * 0.5),
      popular: sorted.filter(t => t.usage_count <= maxUsage * 0.5 && t.usage_count > maxUsage * 0.2),
      regular: sorted.filter(t => t.usage_count <= maxUsage * 0.2),
    };
  };

  const groupedTags = groupTagsByPopularity(tags);

  const TagBadge = ({ tag, size = 'default' }: { tag: typeof tags extends (infer T)[] | undefined ? T : never; size?: 'sm' | 'default' | 'lg' }) => {
    const badgeSizeMap = {
      sm: 'sm' as const,
      default: 'default' as const,
      lg: 'lg' as const,
    };

    return (
      <Link key={tag.id} to={`/?tag=${tag.slug}`}>
        <Badge
          variant="secondary"
          size={badgeSizeMap[size]}
          className={cn(
            "transition-all duration-200 cursor-pointer hover:scale-105 rounded-xl font-medium",
            size === 'lg' ? "px-4 py-2.5 text-sm sm:text-base bg-muted/80 hover:bg-primary hover:text-primary-foreground font-semibold shadow-xs" :
            size === 'default' ? "px-3.5 py-2 text-xs sm:text-sm bg-muted/70 hover:bg-primary hover:text-primary-foreground" :
            "px-3 py-1.5 text-xs bg-muted/60 hover:bg-primary hover:text-primary-foreground"
          )}
        >
          <Hash className="h-3.5 w-3.5 mr-1 opacity-70" />
          {tag.name}
          <span className="ml-1.5 opacity-70 font-mono text-xs">({tag.usage_count})</span>
        </Badge>
      </Link>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl xl:max-w-6xl mx-auto w-full space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <TagIcon className="h-7 w-7 sm:h-9 sm:w-9 text-primary animate-float" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Tags</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          Khám phá các chủ đề thông qua hệ thống tag
        </p>
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Tìm tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-sm sm:text-base rounded-2xl bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-ring/30"
          />
          {searchQuery && (
            <button
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      ) : tags && tags.length > 0 ? (
        <>
          {/* Search results (flat list) */}
          {debouncedQuery.trim() ? (
            <div className="space-y-3">
              <h2 className="text-sm sm:text-base font-semibold text-muted-foreground">
                {filteredTags.length} kết quả cho "{debouncedQuery}"
              </h2>
              {filteredTags.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {filteredTags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} size="default" />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm sm:text-base">Không tìm thấy tag nào phù hợp.</p>
              )}
            </div>
          ) : (
          <>
          {/* Hot Tags */}
          {groupedTags.hot.length > 0 && (
            <div className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>🔥</span>
                <span>Tag phổ biến nhất</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {groupedTags.hot.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} size="lg" />
                ))}
              </div>
            </div>
          )}

          {/* Popular Tags */}
          {groupedTags.popular.length > 0 && (
            <div className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>⭐</span>
                <span>Tag được sử dụng nhiều</span>
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {groupedTags.popular.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} size="default" />
                ))}
              </div>
            </div>
          )}

          {/* Regular Tags */}
          {groupedTags.regular.length > 0 && (
            <div className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>📌</span>
                <span>Tất cả các tag khác</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {groupedTags.regular.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* All Tags Alphabetically */}
          <Card className="rounded-2xl border-0 bg-card shadow-sm p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold">Danh sách tag theo bảng chữ cái</h3>
            <div className="flex flex-wrap gap-2.5">
              {[...tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag) => (
                <Link key={tag.id} to={`/?tag=${tag.slug}`}>
                  <Badge
                    variant="secondary"
                    className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer text-xs sm:text-sm px-3.5 py-1.5 rounded-xl"
                  >
                    #{tag.name}
                    <span className="ml-1 opacity-70 font-mono text-xs">({tag.usage_count})</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>

          {/* Summary */}
          <div className="rounded-2xl bg-muted/30 p-5 sm:p-6 space-y-3">
            <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-foreground">Thống kê</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-1">
              <div className="text-sm sm:text-base">
                <span className="text-muted-foreground">Tổng số tag: </span>
                <span className="font-bold font-mono text-base sm:text-lg text-foreground">{tags.length}</span>
              </div>
              <div className="text-sm sm:text-base">
                <span className="text-muted-foreground">Tổng lượt sử dụng: </span>
                <span className="font-bold font-mono text-base sm:text-lg text-foreground">
                  {tags.reduce((sum, tag) => sum + tag.usage_count, 0)}
                </span>
              </div>
              <div className="text-sm sm:text-base">
                <span className="text-muted-foreground">Tag phổ biến nhất: </span>
                <span className="font-bold text-base sm:text-lg text-foreground">
                  #{tags[0]?.name || 'N/A'} <span className="font-mono text-sm opacity-80">({tags[0]?.usage_count || 0})</span>
                </span>
              </div>
            </div>
          </div>
        </>
          )}
        </>
      ) : (
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="py-16 text-center">
            <TagIcon className="h-14 w-14 mx-auto mb-4 text-muted-foreground/60" />
            <h3 className="text-xl font-bold mb-2">Chưa có tag nào</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Tags sẽ được tạo khi bạn đăng bài viết
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
