import { Link } from 'react-router-dom';
import { useCategoriesWithTags } from '@/hooks/useCategories';
import { Category, PopularTag } from '@/api/services/categoryService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Folder, FileText, ArrowRight, Hash, TrendingUp, Eye, MessageSquare, SendHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequiredDialog } from '@/components/common/LoginRequiredDialog';
import { useState } from 'react';

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategoriesWithTags(false, 5);
  const { isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <LoginRequiredDialog
          open={true}
          onOpenChange={setLoginDialogOpen}
          title="Truy cập danh mục"
          description="Bạn cần đăng nhập để xem các danh mục thảo luận."
          requiredPermission="MEMBER"
        />
      </div>
    );
  }

  return (
    <div className="ml-2 mt-2 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="ml-2 mt-2 flex items-center gap-3 mb-2">
          <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-float" />
          <h1 className="text-2xl sm:text-3xl font-bold">Danh mục</h1>
        </div>
        <p className="text-muted-foreground">
          Khám phá các danh mục thảo luận trong diễn đàn
        </p>
      </div>

      {/* Categories List - Horizontal Layout */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((category: Category, index: number) => (
            <div
              key={category.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <Card className="hover:shadow-md hover:border-primary/50 transition-all group">
                <div className="flex flex-col sm:flex-row">
                  {/* Main Content - Left side */}
                  <Link 
                    to={`/?category=${category.slug}`}
                    className="flex-1 flex items-start gap-4 p-6 cursor-pointer"
                  >
                    {/* Color indicator badge */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {category.color ? (
                        <SendHorizontal
                          className="h-6 w-6"
                          style={{ color: category.color }}
                        />
                      ) : (
                        <Folder className="h-6 w-6 text-primary" />
                      )}
                    </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Description with expand on hover */}
                    <div className="mb-2 overflow-hidden">
                      <p className="text-sm text-muted-foreground transition-all duration-300 ease-in-out line-clamp-1 group-hover:line-clamp-none">
                        {category.description || `Các bài viết về ${category.name}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{category.postCount} bài viết</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">{category.viewCount?.toLocaleString() || 0} lượt xem</span>
                        <span className="sm:hidden">{category.viewCount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">{category.commentCount?.toLocaleString() || 0} bình luận</span>
                        <span className="sm:hidden">{category.commentCount?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Popular Tags - Right side */}
                {category.popularTags && category.popularTags.length > 0 && (
                  <div className="flex-shrink-0 px-6 py-4 sm:py-6 border-t sm:border-t-0 sm:border-l bg-muted/30 sm:w-80">
                    <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>Tags phổ biến</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.popularTags.map((tag: PopularTag) => (
                        <Link
                          key={tag.id}
                          to={`/?tag=${tag.slug}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge
                            variant="secondary"
                            size="sm"
                            className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Chưa có danh mục nào</h3>
            <p className="text-muted-foreground">
              Các danh mục sẽ được hiển thị ở đây
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {categories && categories.length > 0 && (
        <div className="rounded-lg border p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">Tổng quan</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Tổng số danh mục: </span>
              <span className="font-medium">{categories.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Tổng số bài viết: </span>
              <span className="font-medium">
                {categories.reduce((sum: number, cat: Category) => sum + cat.postCount, 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
