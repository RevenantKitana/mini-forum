import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { PostCard } from '@/components/PostCard';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

export function BookmarksPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useBookmarks(user?.id || 0, page, 10, isAuthenticated && !!user?.id);
  
  const bookmarks = data?.data || [];
  const pagination = data?.pagination;

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <BookmarkIcon className="h-8 w-8 text-primary animate-float" />
        <div>
          <h1 className="text-3xl font-bold">Bài viết đã lưu</h1>
          <p className="text-muted-foreground">Những bài viết bạn đã đánh dấu để đọc sau</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : bookmarks && bookmarks.length > 0 ? (
        <>
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <PostCard key={bookmark.id} post={bookmark as any} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Trước
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Trang {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Chưa có bài viết nào được lưu</h3>
            <p className="text-muted-foreground mb-4">
              Lưu những bài viết bạn muốn đọc sau bằng cách nhấn vào biểu tượng bookmark
            </p>
            <Link to="/">
              <Button>Khám phá bài viết</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
