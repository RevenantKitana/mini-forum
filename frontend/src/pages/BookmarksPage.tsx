import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useBookmarks } from '@/hooks/useBookmarks';
import { PostCard } from '@/components/PostCard';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { PostListSkeleton } from '@/components/common/LoadingStates';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

export function BookmarksPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBookmarks(user?.id || 0, page, 10, isAuthenticated && !!user?.id);
  
  const bookmarks = data?.data || [];
  const pagination = data?.pagination;

  if (!isAuthenticated) {
    navigate('/login', { state: { from: location } });
    return null;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl xl:max-w-6xl mx-auto w-full space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <BookmarkIcon className="h-7 w-7 sm:h-9 sm:w-9 text-primary animate-float" />
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Bài viết đã lưu</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Những bài viết bạn đã đánh dấu để đọc sau</p>
        </div>
      </div>

      {isLoading ? (
        <PostListSkeleton count={3} />
      ) : bookmarks && bookmarks.length > 0 ? (
        <>
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <PostCard key={bookmark.id} post={bookmark as any} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 sm:mt-8 flex-wrap items-center">
              <Button
                variant="outline"
                size="sm"
                className="btn-press h-10 px-4 text-sm font-semibold rounded-xl"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Trước
              </Button>
              <span className="flex items-center px-4 text-sm sm:text-base text-muted-foreground font-medium">
                Trang {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="btn-press h-10 px-4 text-sm font-semibold rounded-xl"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
              >
                Sau →
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="rounded-2xl border-0 bg-card shadow-sm">
          <CardContent className="py-16 text-center">
            <BookmarkIcon className="h-14 w-14 mx-auto mb-4 text-muted-foreground/60" />
            <h3 className="text-xl font-bold mb-2">Chưa có bài viết nào được lưu</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Lưu những bài viết bạn muốn đọc sau bằng cách nhấn vào biểu tượng bookmark
            </p>
            <Link to="/">
              <Button className="btn-interactive h-10 px-5 text-sm sm:text-base font-semibold rounded-xl">Khám phá bài viết</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
