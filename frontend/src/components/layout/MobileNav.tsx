import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Menu, X, Home, FileText, User, LogIn, LogOut, Settings,
  Search, Bookmark, Tag, Folder, TrendingUp, UserX, Globe, Lock
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { usePopularTags } from '@/hooks/useTags';
import { PostFormDialog } from '@/components/common/PostFormDialog';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sidebar data
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: popularTags, isLoading: tagsLoading } = usePopularTags(15);

  const currentCategory = searchParams.get('category');
  const currentTags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const legacyTag = searchParams.get('tag');
  const activeTags = legacyTag ? [legacyTag] : currentTags;
  const totalPosts = categories?.reduce((sum, cat) => sum + cat.postCount, 0) || 0;

  const filteredPopularTags = useMemo(
    () => popularTags?.filter((t) => t.name.toLowerCase().includes(tagFilter.toLowerCase())) ?? [],
    [popularTags, tagFilter]
  );

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setOpen(false);
      setSearchQuery('');
    }
  };

  const handleCategoryClick = (categorySlug: string | null) => {
    const newParams = new URLSearchParams();
    if (categorySlug) {
      newParams.set('category', categorySlug);
    }
    if (activeTags.length > 0) {
      newParams.set('tags', activeTags.join(','));
    }
    navigate(`/?${newParams.toString()}`);
    setOpen(false);
  };

  const handleTagClick = (tagSlug: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    let newTags: string[];
    if (activeTags.includes(tagSlug)) {
      newTags = activeTags.filter(t => t !== tagSlug);
    } else {
      newTags = [...activeTags, tagSlug];
    }
    if (newTags.length > 0) {
      newParams.set('tags', newTags.join(','));
    } else {
      newParams.delete('tags');
    }
    setSearchParams(newParams);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('md:hidden min-h-[44px] min-w-[44px]', className)}
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(90vw,400px)] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-left text-lg sm:text-xl">Forum</SheetTitle>
        </SheetHeader>

        {/* Mobile Search */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm bài viết..."
                className="pl-9 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 px-4 pb-4">
            {/* Main Navigation */}
            <div className="space-y-0.5">
              <Button
                variant={location.pathname === '/' ? 'secondary' : 'ghost'}
                className="w-full justify-start min-h-[44px]"
                onClick={() => handleNavigate('/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Button>
              <Button
                variant={location.pathname === '/categories' ? 'secondary' : 'ghost'}
                className="w-full justify-start min-h-[44px]"
                onClick={() => handleNavigate('/categories')}
              >
                <Folder className="mr-2 h-4 w-4" />
                Danh mục
              </Button>
              <Button
                variant={location.pathname === '/tags' ? 'secondary' : 'ghost'}
                className="w-full justify-start min-h-[44px]"
                onClick={() => handleNavigate('/tags')}
              >
                <Tag className="mr-2 h-4 w-4" />
                Tags
              </Button>
            </div>

            <Separator className="my-2" />

            {/* Categories Section - Mobile sidebar content */}
            {location.pathname === '/' && (
              <>
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground px-2 mb-1 flex items-center gap-2">
                  <Folder className="h-3.5 w-3.5" />
                  Categories
                </h3>
                {categoriesLoading ? (
                  <div className="space-y-1 mb-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0.5 mb-2">
                    <button
                      onClick={() => handleCategoryClick(null)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px] flex items-center",
                        !currentCategory && location.pathname === '/'
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      <span className="flex-1">Tất cả bài viết</span>
                      <Badge variant="secondary" className="ml-2">{totalPosts}</Badge>
                    </button>
                    {categories?.map((category) => {
                      const isRestricted = category.viewPermission && category.viewPermission !== 'ALL';
                      return (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.slug)}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px] flex items-center gap-2",
                            currentCategory === category.slug
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          )}
                        >
                          {category.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <span className="truncate flex-1">{category.name}</span>
                          {!isRestricted && (
                            <Globe className="h-3 w-3 text-green-500 flex-shrink-0" />
                          )}
                          <Badge variant="secondary" className="flex-shrink-0">{category.postCount}</Badge>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tags Section */}
                <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground px-2 mb-1 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  Popular Tags
                  {activeTags.length > 0 && (
                    <button
                      className="ml-auto text-[10px] text-primary hover:underline"
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('tags');
                        newParams.delete('tag');
                        setSearchParams(newParams);
                      }}
                    >
                      Xóa hết
                    </button>
                  )}
                </h3>
                {/* Inline tag filter */}
                <div className="relative px-2 mb-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Lọc tag..."
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="h-8 text-xs pl-7"
                  />
                </div>
                {/* Active tags indicator */}
                {activeTags.length > 0 && (
                  <div className="px-2 mb-1 text-xs text-muted-foreground">
                    Đang lọc: <strong>{activeTags.length}</strong> tag
                  </div>
                )}
                {tagsLoading ? (
                  <div className="flex flex-wrap gap-2 px-2 mb-2">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-7 w-16 rounded-full" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 px-2 mb-2">
                    {filteredPopularTags.map((tag) => {
                      const isActive = activeTags.includes(tag.slug);
                      const isRestricted = tag.usePermission && tag.usePermission !== 'ALL';
                      return (
                        <Badge
                          key={tag.id}
                          variant={isActive ? 'default' : 'outline'}
                          className={cn(
                            "cursor-pointer transition-colors min-h-[32px] px-3",
                            isActive && 'animate-pop-in'
                          )}
                          onClick={() => handleTagClick(tag.slug)}
                        >
                          {isRestricted && <Lock className="h-2.5 w-2.5 mr-1" />}
                          {tag.name}
                          {isActive && <X className="ml-1 h-3 w-3" />}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <Separator className="my-2" />
              </>
            )}

            {/* User Section */}
            {isAuthenticated ? (
              <div className="space-y-0.5">
                <p className="px-2 text-xs font-medium text-muted-foreground mb-1">
                  Xin chào, {user?.displayName || user?.username}
                </p>
                <PostFormDialog
                  mode="create"
                  trigger={
                    <Button variant="ghost" className="w-full justify-start min-h-[44px]">
                      <FileText className="mr-2 h-4 w-4" />
                      Tạo bài viết
                    </Button>
                  }
                />
                <Button
                  variant={location.pathname.startsWith('/users/') ? 'secondary' : 'ghost'}
                  className="w-full justify-start min-h-[44px]"
                  onClick={() => handleNavigate(`/users/${user?.username}`)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Trang cá nhân
                </Button>
                <Button
                  variant={location.pathname === '/bookmarks' ? 'secondary' : 'ghost'}
                  className="w-full justify-start min-h-[44px]"
                  onClick={() => handleNavigate('/bookmarks')}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Đã lưu
                </Button>
                <Button
                  variant={location.pathname.startsWith('/settings') ? 'secondary' : 'ghost'}
                  className="w-full justify-start min-h-[44px]"
                  onClick={() => handleNavigate('/settings/profile')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Cài đặt
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start min-h-[44px]"
                  onClick={() => handleNavigate('/settings/blocked')}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Đã chặn
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5">
                <Button
                  variant="ghost"
                  className="w-full justify-start min-h-[44px]"
                  onClick={() => handleNavigate('/login')}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Đăng nhập
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start min-h-[44px]"
                  onClick={() => handleNavigate('/register')}
                >
                  <User className="mr-2 h-4 w-4" />
                  Đăng ký
                </Button>
              </div>
            )}



            {/* Logout */}
            {isAuthenticated && (
              <>
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px]"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </Button>
              </>
            )}

            {/* Stats */}
            <div className="mt-3 rounded-lg border p-3 bg-muted/50">
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Stats
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                <div>
                  <p className="font-bold text-foreground">{categories?.length || 0}</p>
                  <p>Categories</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">{totalPosts}</p>
                  <p>Posts</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">{popularTags?.length || 0}+</p>
                  <p>Tags</p>
                </div>
              </div>
            </div>
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
