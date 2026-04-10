import { useSearchParams, Link } from 'react-router-dom';
import { useSearch, useSearchUsers } from '@/hooks/useSearch';
import { PostCard } from '@/components/PostCard';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Search as SearchIcon, Filter, SortAsc } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useState, useEffect } from 'react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') as 'latest' | 'popular' | 'trending' | 'oldest' | 'relevance' || 'relevance';
  const categoryParam = searchParams.get('category') || undefined;
  const pageParam = parseInt(searchParams.get('page') || '1');
  const tabParam = searchParams.get('tab') || 'posts';

  const [searchQuery, setSearchQuery] = useState(queryParam);

  // Posts search
  const { data: postsData, isLoading: postsLoading } = useSearch({
    q: queryParam,
    sort: sortParam,
    category: categoryParam,
    page: pageParam,
    limit: 10,
  }, !!queryParam);

  // Users search
  const { data: usersData, isLoading: usersLoading } = useSearchUsers(
    queryParam,
    1,
    10,
    !!queryParam && tabParam === 'users'
  );

  const posts = postsData?.data || [];
  const users = usersData?.data || [];
  const postsPagination = postsData?.pagination;

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      if (sortParam !== 'relevance') params.set('sort', sortParam);
      setSearchParams(params);
    }
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    setSearchParams(params);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Tìm kiếm</h1>
        
        <form onSubmit={handleSearch}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm bài viết, chủ đề..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {queryParam ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <p className="text-sm sm:text-base text-muted-foreground">
              Kết quả tìm kiếm cho "{queryParam}"
            </p>
            
            <Select value={sortParam} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Liên quan</SelectItem>
                <SelectItem value="latest">Mới nhất</SelectItem>
                <SelectItem value="popular">Phổ biến</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={tabParam} onValueChange={handleTabChange}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="posts" className="flex-1 sm:flex-none">
                Bài viết ({postsPagination?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 sm:flex-none">
                Người dùng ({usersData?.pagination?.total || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              {postsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {posts.map((post, index) => (
                      <div
                        key={post.id}
                        className="animate-stagger"
                        style={{ '--stagger-index': index } as React.CSSProperties}
                      >
                        <PostCard post={post as any} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {postsPagination && postsPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pageParam - 1)}
                        disabled={pageParam <= 1}
                      >
                        Trước
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Trang {pageParam} / {postsPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pageParam + 1)}
                        disabled={pageParam >= postsPagination.totalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Không tìm thấy bài viết nào cho "{queryParam}"
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-4">
                        <Link
                          to={`/users/${user.username}`}
                          className="flex items-center gap-4 hover:opacity-80"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback>
                              {user.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {user.displayName || user.username}
                              </span>
                              <Badge variant="outline" size="xs">
                                {user.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              @{user.username} · Điểm: {user.reputation}
                            </p>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào cho "{queryParam}"
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nhập từ khóa để tìm kiếm bài viết và người dùng
          </CardContent>
        </Card>
      )}
    </div>
  );
}
