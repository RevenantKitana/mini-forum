# Mini Forum — Frontend

> **Version**: v1.25.1  
> **Last Updated**: 2026-03-19

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
| next-themes | 0.4.6 | Dark/light theme |
| date-fns | 3.6.0 | Date utilities |

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
├── contexts/                  # 4 React contexts
├── hooks/                     # 40+ custom hooks
├── lib/                       # Utility functions
├── pages/                     # 14 page components
├── routes/                    # Route definitions
├── styles/                    # Global styles (~34 animation tokens)
└── types/                     # TypeScript type definitions
```

---

## Pages (14)

### Public (9)

| Path | Component | Mô tả |
|------|-----------|-------|
| `/` | HomePage | Trang chủ, feed bài viết, filter, sort |
| `/posts/:id` | PostDetailPage | Chi tiết bài viết + comments |
| `/users/:username` | ProfilePage | Trang profile user |
| `/search` | SearchPage | Tìm kiếm bài viết, users |
| `/categories` | CategoriesPage | Danh sách categories |
| `/tags` | TagsPage | Danh sách tags |
| `/login` | LoginPage | Đăng nhập |
| `/register` | RegisterPage | Đăng ký (multi-step OTP) |
| `/forgot-password` | ForgotPasswordPage | Đặt lại mật khẩu (OTP) |

### Protected — Yêu cầu đăng nhập (5)

| Path | Component | Mô tả |
|------|-----------|-------|
| `/posts/:id/edit` | EditPostPage | Chỉnh sửa bài viết |
| `/bookmarks` | BookmarksPage | Bài viết đã bookmark |
| `/settings/profile` | EditProfilePage | Chỉnh sửa profile |
| `/settings/blocked` | BlockedUsersPage | Quản lý users đã block |
| `/notifications` | NotificationsPage | Danh sách thông báo |

---

## Components

### Layout (6)

| Component | Mô tả |
|-----------|-------|
| MainLayout | Layout chính (Header + Sidebar + Content + RightSidebar) |
| Header | Navigation header (logo, search, user menu, theme, font size) |
| Sidebar | Left sidebar (categories, tags, navigation) |
| RightSidebar | Right sidebar (featured/pinned posts) |
| MobileNav | Mobile hamburger drawer |
| MobileCategoryBar | Horizontal scrollable category pills (mobile) |

### Common (20+)

| Component | Mô tả |
|-----------|-------|
| PostCard | Card hiển thị bài viết (author badge, vote score, tags) |
| VoteButtons | Nút vote up/down với animation |
| BookmarkButton | Toggle bookmark |
| PostFormDialog | Dialog tạo/sửa bài viết (Markdown, draft auto-save) |
| ReportModal | Modal report nội dung |
| MarkdownRenderer | Render Markdown content (hỗ trợ avatar detection) |
| MarkdownGuide | Hướng dẫn cú pháp Markdown với copy-to-clipboard |
| LoginRequiredDialog | Dialog yêu cầu đăng nhập |
| NotificationBell | Icon thông báo + badge (dropdown) |
| PinnedPostsModal | Modal bài viết đã ghim (auto-popup, 10m cooldown) |
| ThemeToggle | Toggle dark/light theme |
| FontSizeSelector | Chọn cỡ chữ (5 mức: xs/sm/md/lg/xl) |
| TagFilterBar | Multi-tag filter với Popover + Apply |
| TagSearchInput | Debounced tag search input |
| EmojiPicker | Chọn emoji cho posts/comments |
| OtpVerification | OTP input 6 số với auto-focus |
| ErrorBoundary | Error boundary component |
| RestrictedContent | Permission-based content hiding |
| PermissionBadge | Role/permission badges |
| AnimatedIcon | Icon với animation wrapper |

### Skeleton (8)

PostCardSkeleton, CommentSkeleton, ProfileSkeleton, SearchSkeleton, NotificationSkeleton, CategorySkeleton, TagSkeleton, DashboardSkeleton.

---

## Custom Hooks (40+)

Các custom hooks được tổ chức theo domain:

| Hook group | Mục đích |
|------------|----------|
| usePosts, usePost, usePostBySlug, usePostsByAuthor, useFeaturedPosts, useLatestPosts, useInfinitePosts | Fetch, create, update, delete posts |
| useComments, useCreateComment, useUpdateComment, useDeleteComment | Fetch và quản lý comments |
| useCategories, useCategoriesWithTags, useCategory, useCategoryBySlug | Categories data |
| useTags, usePopularTags, usePopularTagsForCategory, useSearchTags | Tags data |
| useVotePost, useVoteComment, useRemovePostVote, useRemoveCommentVote, useMyVoteHistory | Voting |
| useBookmarks, useBookmarkStatus, useAddBookmark, useRemoveBookmark, useToggleBookmark | Bookmarks |
| useSearch, useSearchUsers, useSearchSuggestions | Search |
| useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification | Notifications |
| useUsers, useUserByUsername, useUserPosts, useUserComments | User profiles |
| useUpdateProfile, useChangeUsername, useChangePassword, useUpdateAvatar | Profile mutations |
| useResponsive | Media query breakpoint detection |
| useScrollLock | Lock body scroll (modals) |

---

## Contexts (4)

| Context | State | Methods |
|---------|-------|--------|
| AuthContext | user, isAuthenticated, isLoading | login(), logout(), register(), refreshUser() |
| SidebarContext | isLeftSidebarCollapsed, isRightSidebarCollapsed | toggle, collapse/expand (localStorage) |
| FontSizeContext | scale (xs/sm/md/lg/xl) | setScale() (localStorage) |
| GlobalLoadingContext | isLoading, loadingMessage | showLoading(), hideLoading() |

---

## API Services (10)

| File | Endpoints |
|------|----------|
| authService.ts | Login, register, refresh, logout, OTP, reset password |
| userService.ts | Profile CRUD, user posts/comments |
| postService.ts | Posts CRUD, featured, latest |
| commentService.ts | Comments CRUD, replies |
| categoryService.ts | Categories, popular tags per category |
| tagService.ts | Tags, popular, search |
| voteService.ts | Vote/unvote posts & comments, vote history |
| bookmarkService.ts | Bookmark toggle, list, status |
| searchService.ts | Search posts, users, suggestions |
| notificationService.ts | Notifications CRUD, mark read |

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
