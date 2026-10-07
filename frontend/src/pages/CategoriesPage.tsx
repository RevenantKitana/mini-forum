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

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl xl:max-w-6xl mx-auto w-full space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Folder className="h-7 w-7 sm:h-9 sm:w-9 text-primary animate-float" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Danh mục</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Khám phá các danh mục thảo luận trong diễn đàn
        </p>
      </div>

      {/* Categories List - Horizontal Layout */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((category: Category, index: number) => (
            <div
              key={category.id}
              className="animate-stagger"
              style={{ '--stagger-index': index } as React.CSSProperties}
            >
              <Card className="rounded-2xl bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-all duration-200 border-0 group overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Main Content - Left side */}
                  <Link 
                    to={`/?category=${category.slug}`}
                    className="flex-1 flex items-start gap-4 p-5 sm:p-7 cursor-pointer"
                  >
                    {/* Color indicator badge */}
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {category.color ? (
                        <SendHorizontal
                          className="h-6 w-6 sm:h-7 sm:w-7"
                          style={{ color: category.color }}
                        />
                      ) : (
                        <Folder className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      )}
                    </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors tracking-tight">
                        {category.name}
                      </h3>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Description with expand on hover */}
                    <div className="mb-3 overflow-hidden">
                      <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed transition-all duration-300 ease-in-out line-clamp-2 group-hover:line-clamp-none">
                        {category.description || `Các bài viết về ${category.name}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4" />
                        <span>{category.post_count} bài viết</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span>{category.view_count?.toLocaleString() || 0} lượt xem</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" />
                        <span>{category.comment_count?.toLocaleString() || 0} bình luận</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Popular Tags - Right side */}
                {category.popularTags && category.popularTags.length > 0 && (
                  <div className="flex-shrink-0 px-6 py-5 sm:py-7 border-t sm:border-t-0 sm:border-l border-border/40 bg-muted/25 sm:w-80 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs sm:text-sm uppercase tracking-wider font-bold text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" />
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
                            className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer text-xs sm:text-sm px-3 py-1 rounded-xl"
                          >
                            <Hash className="h-3.5 w-3.5 mr-0.5" />
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
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="py-16 text-center">
            <Folder className="h-14 w-14 mx-auto mb-4 text-muted-foreground/60" />
            <h3 className="text-xl font-bold mb-2">Chưa có danh mục nào</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Các danh mục sẽ được hiển thị ở đây
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {categories && categories.length > 0 && (
        <div className="rounded-2xl bg-muted/30 p-5 sm:p-6 space-y-3">
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-foreground">Tổng quan</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 pt-1">
            <div className="text-sm sm:text-base">
              <span className="text-muted-foreground">Tổng số danh mục: </span>
              <span className="font-bold font-mono text-base sm:text-lg text-foreground">{categories.length}</span>
            </div>
            <div className="text-sm sm:text-base">
              <span className="text-muted-foreground">Tổng số bài viết: </span>
              <span className="font-bold font-mono text-base sm:text-lg text-foreground">
                {categories.reduce((sum: number, cat: Category) => sum + cat.post_count, 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
