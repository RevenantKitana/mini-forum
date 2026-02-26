# Mini Forum — Frontend

> **Version**: v1.16.0  
> **Last Updated**: 2026-02-25

User-facing SPA — React 18 + TypeScript + Vite + TailwindCSS v4.

---

## Tech Stack

| Package | Version | Mục đích |
|---------|:-------:|----------|
| react | 18.3.1 | UI framework |
| react-router-dom | 7.13.0 | Routing (v7) |
| @tanstack/react-query | 5.90.20 | Server state management |
| axios | 1.13.4 | HTTP client |
| react-hook-form | 7.55.0 | Form handling |
| zod | 4.3.6 | Schema validation |
| tailwindcss | 4.1.12 | CSS framework (v4 + @tailwindcss/vite) |
| @radix-ui/* | various | Headless UI (Shadcn base) |
| @mui/material | 7.3.5 | Material UI components |
| motion | 12.23.24 | Animations (Framer Motion) |
| recharts | 2.15.2 | Charts |
| lucide-react | 0.487.0 | Icons |
| sonner | 2.0.3 | Toast notifications |
| date-fns | 3.6.0 | Date utilities |
| react-responsive-masonry | latest | Masonry layout |
| react-dnd | latest | Drag and drop |

---

## Cấu trúc thư mục

```
frontend/src/
├── main.tsx                    # Entry point
├── api/
│   ├── axios.ts               # Axios instance, token interceptor
│   ├── endpoints.ts           # API endpoint constants
│   └── services/              # 11 API service files
├── app/
│   ├── App.tsx                # Root component, route config
│   └── components/            # Shared UI components
├── components/
│   ├── layout/                # 7 layout components
│   ├── common/                # 21+ reusable components
│   ├── ui/                    # Base UI (shadcn-generated)
│   └── PostCard.tsx           # Post card component
├── contexts/                  # 3 React contexts
├── hooks/                     # 14 custom hooks
├── lib/                       # Utility functions
├── pages/                     # 19 page components
├── routes/                    # Route definitions
├── styles/                    # Global styles (~30+ keyframes)
└── types/                     # TypeScript type definitions
```

---

## Pages (19)

### Public (8)

| Path | Component | Mô tả |
|------|-----------|-------|
| `/` | HomePage | Trang chủ, feed bài viết |
| `/posts/:id` | PostDetailPage | Chi tiết bài viết + comments |
| `/users/:username` | ProfilePage | Trang profile user |
| `/search` | SearchPage | Tìm kiếm bài viết, users |
| `/categories` | CategoriesPage | Danh sách categories |
| `/tags` | TagsPage | Danh sách tags |
| `/login` | LoginPage | Đăng nhập |
| `/register` | RegisterPage | Đăng ký |

### Protected — Yêu cầu đăng nhập (6)

| Path | Component | Mô tả |
|------|-----------|-------|
| `/posts/:id/edit` | EditPostPage | Chỉnh sửa bài viết |
| `/bookmarks` | BookmarksPage | Bài viết đã bookmark |
| `/settings/profile` | EditProfilePage | Chỉnh sửa profile |
| `/settings/blocked` | BlockedUsersPage | Quản lý users đã block |
| `/notifications` | NotificationsPage | Danh sách thông báo |
| `/create-post` | CreatePostPage | Tạo bài viết mới |

### Admin — Yêu cầu MODERATOR+ (5)

| Path | Component | Mô tả |
|------|-----------|-------|
| `/admin` | AdminDashboardPage | Dashboard thống kê |
| `/admin/users` | AdminUsersPage | Quản lý users |
| `/admin/posts` | AdminPostsPage | Quản lý bài viết |
| `/admin/comments` | AdminCommentsPage | Quản lý comments |
| `/admin/reports` | AdminReportsPage | Xử lý reports |

---

## Components

### Layout (7)

| Component | Mô tả |
|-----------|-------|
| MainLayout | Layout chính (Header + Sidebar + Content + RightSidebar) |
| AdminLayout | Layout cho admin pages |
| Header | Navigation header (logo, search, user menu) |
| Sidebar | Left sidebar (categories, tags, navigation) |
| RightSidebar | Right sidebar (info, trending) |
| MobileNav | Mobile bottom navigation |
| Footer | Footer component |

### Common (21+)

| Component | Mô tả |
|-----------|-------|
| PostCard | Card hiển thị bài viết |
| VoteButtons | Nút vote up/down với animation |
| BookmarkButton | Toggle bookmark |
| CreatePostDialog | Dialog tạo bài viết (Markdown) |
| EditPostDialog | Dialog sửa bài viết |
| ReportModal | Modal report nội dung |
| MarkdownRenderer | Render Markdown content |
| LoginRequiredDialog | Dialog yêu cầu đăng nhập |
| NotificationBell | Icon thông báo + badge |
| PinnedPostsModal | Modal bài viết đã ghim |
| ThemeToggle | Toggle dark/light theme |
| ErrorBoundary | Error boundary component |
| InfiniteScroll | Infinite scroll wrapper |
| ShareButton | Share bài viết |
| TagBadge | Tag chip |
| UserAvatar | Avatar với fallback |
| CommentEditor | Rich comment editor |
| QuoteReply | Quote reply component |
| SortSelector | Sort options dropdown |
| FilterPanel | Filter panel |
| EmptyState | Empty state illustrations |

### Skeleton (8)

PostCardSkeleton, CommentSkeleton, ProfileSkeleton, SearchSkeleton, NotificationSkeleton, CategorySkeleton, TagSkeleton, DashboardSkeleton.

---

## Custom Hooks (14)

| Hook | Mục đích |
|------|----------|
| usePosts | Fetch, create, update, delete posts |
| useComments | Fetch, create, edit, delete comments |
| useCategories | Fetch danh sách categories |
| useTags | Fetch danh sách tags |
| useVotes | Handle voting (optimistic update) |
| useBookmarks | Handle bookmarks (toggle) |
| useSearch | Search queries (debounced) |
| useNotifications | Fetch + mark read notifications |
| useUsers | User profile operations |
| useAdmin | Admin API operations |
| useResponsive | Responsive breakpoint detection |
| useScrollLock | Lock body scroll (modals) |
| usePerformance | Performance monitoring |
| useAuthInvalidation | Invalidate auth-related queries |

---

## Contexts (3)

| Context | State | Methods |
|---------|-------|---------|
| AuthContext | user, isAuthenticated, isLoading | login(), logout(), register() |
| SidebarContext | isOpen, isMobile | toggle(), close() |
| GlobalLoadingContext | isLoading | setLoading() |

---

## API Services (11)

| File | Endpoints |
|------|-----------|
| authService.ts | Login, register, refresh, logout, change password |
| userService.ts | Profile CRUD, user posts/comments |
| postService.ts | Posts CRUD, pin, lock, featured |
| commentService.ts | Comments CRUD, quote reply |
| categoryService.ts | Categories (read) |
| tagService.ts | Tags (read) |
| voteService.ts | Vote/unvote posts & comments |
| bookmarkService.ts | Bookmark toggle, list |
| searchService.ts | Search posts, users |
| notificationService.ts | Notifications CRUD, mark read |
| adminService.ts | Dashboard stats, user/post/comment management |

---

## State Management

### Server State — TanStack Query

- Cache: staleTime 5 phút
- Retry: 1 lần
- Optimistic updates cho vote, bookmark
- Query invalidation khi mutate

### Client State — React Context

- AuthContext: authentication state
- SidebarContext: sidebar open/close
- GlobalLoadingContext: global loading overlay

### Token Storage

| Key | Storage | Mô tả |
|-----|---------|-------|
| `forum_access_token` | localStorage | JWT access token (15m) |
| `forum_refresh_token` | localStorage | JWT refresh token (7d) |

Auto-refresh: Axios interceptor tự động refresh khi 401 + request queue cho concurrent requests.

---

## Animations & UX

- ~30+ CSS animation keyframes trong global styles
- Framer Motion (motion) cho page transitions, modal animations
- Optimistic UI updates cho vote/bookmark
- Skeleton loading states (8 variants)
- Toast notifications (Sonner)
- Infinite scroll
- Responsive masonry layout

---

## Cách chạy

### Yêu cầu

- Node.js >= 20.x
- Backend đang chạy tại port 5000

### Cài đặt

```bash
npm install
cp .env.example .env     # Cấu hình VITE_API_URL
```

### Environment Variables

```dotenv
VITE_API_URL=http://localhost:5000/api/v1
VITE_USE_MOCK_API=false
```

### Scripts

| Script | Lệnh | Mô tả |
|--------|------|-------|
| `dev` | `vite` | Development server (port 5173) |
| `build` | `vite build` | Build production |
| `preview` | `vite preview` | Preview production build |

### Development

```bash
npm run dev
# → http://localhost:5173
# → Yêu cầu backend đang chạy tại :5000
```

---

## Responsive Design

| Breakpoint | Layout |
|:----------:|--------|
| < 640px | Mobile — single column, bottom nav |
| 640–1024px | Tablet — collapsed sidebar |
| > 1024px | Desktop — full 3-column layout |

Hook `useResponsive` cung cấp breakpoint detection cho components.

---

## Ghi chú kỹ thuật

1. **TailwindCSS v4**: Plugin mới `@tailwindcss/vite` (không dùng PostCSS plugin)
2. **Shadcn/UI**: Components trong `src/app/components/ui` và `src/components/ui`
3. **Path Alias**: `@` → `./src` (Vite + TSConfig)
4. **React Router v7**: Future flags enabled cho migration path
5. **Markdown**: Posts + comments hỗ trợ Markdown qua `MarkdownRenderer`
6. **Dark Mode**: Theme toggle + CSS variables
7. **Vite Config**: historyApiFallback enabled cho SPA routing

---

## Liên kết

- [Kiến trúc hệ thống](../docs/01-ARCHITECTURE.md)
- [API Reference](../docs/03-API/README.md)
- [Features Matrix](../docs/04-FEATURES.md)
- [Deployment Guide](../docs/07-DEPLOYMENT.md)
