import { Link } from 'react-router-dom';
import { useTags } from '@/hooks/useTags';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Tag as TagIcon, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequiredDialog } from '@/components/common/LoginRequiredDialog';
import { useState } from 'react';

export function TagsPage() {
  const { data: tags, isLoading } = useTags();
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <LoginRequiredDialog
          open={true}
          onOpenChange={setLoginDialogOpen}
          title="Truy cập thẻ"
          description="Bạn cần đăng nhập để xem các thẻ thảo luận."
          requiredPermission="MEMBER"
        />
      </div>
    );
  }

  // Group tags by usage count ranges
  const groupTagsByPopularity = (tagsList: typeof tags) => {
    if (!tagsList) return { hot: [], popular: [], regular: [] };
    
    const sorted = [...tagsList].sort((a, b) => b.usageCount - a.usageCount);
    const maxUsage = sorted[0]?.usageCount || 1;
    
    return {
      hot: sorted.filter(t => t.usageCount > maxUsage * 0.5),
      popular: sorted.filter(t => t.usageCount <= maxUsage * 0.5 && t.usageCount > maxUsage * 0.2),
      regular: sorted.filter(t => t.usageCount <= maxUsage * 0.2),
    };
  };

  const groupedTags = groupTagsByPopularity(tags);

  const TagBadge = ({ tag, size = 'default' }: { tag: typeof tags extends (infer T)[] | undefined ? T : never; size?: 'sm' | 'default' | 'lg' }) => {
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      default: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-1.5',
    };

    return (
      <Link key={tag.id} to={`/?tag=${tag.slug}`}>
        <Badge
          variant="outline"
          className={`hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer hover:scale-105 ${sizeClasses[size]}`}
        >
          <Hash className="h-3 w-3 mr-1" />
          {tag.name}
          <span className="ml-2 text-muted-foreground">({tag.usageCount})</span>
        </Badge>
      </Link>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <TagIcon className="h-8 w-8 text-primary animate-float" />
          <h1 className="text-3xl font-bold">Tags</h1>
        </div>
        <p className="text-muted-foreground">
          Khám phá các chủ đề thông qua hệ thống tag
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : tags && tags.length > 0 ? (
        <>
          {/* Hot Tags */}
          {groupedTags.hot.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🔥 Tag phổ biến nhất
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
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                ⭐ Tag được sử dụng nhiều
              </h2>
              <div className="flex flex-wrap gap-2">
                {groupedTags.popular.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} size="default" />
                ))}
              </div>
            </div>
          )}

          {/* Regular Tags */}
          {groupedTags.regular.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📌 Tất cả các tag khác
              </h2>
              <div className="flex flex-wrap gap-2">
                {groupedTags.regular.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* All Tags Alphabetically */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Danh sách tag theo bảng chữ cái</h3>
              <div className="flex flex-wrap gap-2">
                {[...tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag) => (
                  <Link key={tag.id} to={`/?tag=${tag.slug}`}>
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      {tag.name}
                      <span className="ml-1 text-xs opacity-70">({tag.usageCount})</span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Thống kê</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Tổng số tag: </span>
                <span className="font-medium">{tags.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Tổng lượt sử dụng: </span>
                <span className="font-medium">
                  {tags.reduce((sum, tag) => sum + tag.usageCount, 0)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Tag phổ biến nhất: </span>
                <span className="font-medium">
                  {tags[0]?.name || 'N/A'} ({tags[0]?.usageCount || 0})
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <TagIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Chưa có tag nào</h3>
            <p className="text-muted-foreground">
              Tags sẽ được tạo khi bạn đăng bài viết
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
