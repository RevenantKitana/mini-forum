# Frontend Service

## Tổng quan

Giao diện người dùng cuối (end-user) của diễn đàn Mini Forum. Single-page application cho phép người dùng đọc, tạo nội dung, tương tác và quản lý tài khoản cá nhân.

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | React 18.3 |
| Build tool | Vite 6.4 |
| Language | TypeScript 5 |
| Styling | Tailwind 4.1, Emotion (cho MUI) |
| UI Components | Radix UI, Material-UI, Lucide Icons |
| Routing | React Router 7.13 |
| State Management | TanStack Query 5.90 (server state), React Context (client state) |
| Forms | React Hook Form 7.55, Zod 4.3 |
| Drag & Drop | React-DND |
| Notifications | Sonner 2.0 |
| Charts | Recharts 2.15 |
| Testing | Vitest 4.0, React Testing Library |

## Cấu trúc thư mục

```
frontend/src/
├── main.tsx                   # Entry point
├── app/
│   └── App.tsx                # Root component (providers + routing)
├── api/
│   ├── axios.ts               # Axios instance (interceptors, token refresh)
│   ├── endpoints.ts           # API endpoint constants
│   └── services/              # 10 API service files
├── pages/                     # 14 page components
├── components/                # Shared UI components
├── contexts/                  # 5 React Context providers
├── hooks/                     # 11 custom hooks
├── routes/                    # Route config + PrivateRoute guard
├── constants/                 # App constants
├── types/                     # TypeScript types
├── utils/                     # Utility functions
├── lib/                       # Third-party integrations
└── styles/                    # Global CSS
```

## Pages

| Page | Route | Mô tả |
|---|---|---|
| `HomePage` | `/` | Danh sách bài viết, bộ lọc danh mục/thẻ |
| `PostDetailPage` | `/posts/:id` | Chi tiết bài viết + bình luận |
| `EditPostPage` | `/posts/:id/edit` | Tạo/sửa bài viết |
| `CategoriesPage` | `/categories` | Danh sách danh mục |
| `TagsPage` | `/tags` | Danh sách thẻ |
| `SearchPage` | `/search` | Tìm kiếm nội dung |
| `LoginPage` | `/login` | Đăng nhập |
| `RegisterPage` | `/register` | Đăng ký (kèm OTP) |
| `ForgotPasswordPage` | `/forgot-password` | Quên mật khẩu |
| `ProfilePage` | `/users/:username` | Hồ sơ người dùng |
| `EditProfilePage` | `/settings/profile` | Sửa hồ sơ |
| `NotificationsPage` | `/notifications` | Thông báo |
| `BookmarksPage` | `/bookmarks` | Bài viết đã bookmark |
| `BlockedUsersPage` | `/settings/blocked` | Danh sách đã chặn |

## API Integration

### Axios Configuration (`api/axios.ts`)

- **Base URL**: Từ biến `VITE_API_URL`
- **Auto-attach token**: Gắn `Authorization: Bearer <token>` từ `localStorage` key `forum_access_token`
- **401 Interceptor**: Tự động refresh token khi access token hết hạn, queue các request đang chờ
- **429 Interceptor**: Exponential backoff retry khi bị rate limit
- **Token storage**: `forum_access_token`, `forum_refresh_token` trong `localStorage`

### API Services (10 files)

| Service | Chức năng |
|---|---|
| `authService` | Đăng ký, đăng nhập, logout, refresh, OTP, reset password |
| `postService` | CRUD bài viết, featured, latest |
| `commentService` | CRUD bình luận |
| `userService` | Hồ sơ, reputation |
| `voteService` | Upvote/downvote |
| `bookmarkService` | Bookmark bài viết |
| `categoryService` | Lấy danh sách danh mục |
| `tagService` | Lấy danh sách thẻ |
| `notificationService` | Quản lý thông báo |
| `searchService` | Tìm kiếm |

## State Management

### React Context (Client State)

| Context | Trách nhiệm |
|---|---|
| `AuthContext` | User hiện tại, isAuthenticated, login/logout |
| `ThemeContext` | Dark/light mode toggle |
| `SidebarContext` | Đóng/mở sidebar |
| `FontSizeContext` | Điều chỉnh cỡ chữ (accessibility) |
| `GlobalLoadingContext` | Global loading indicator |

### TanStack Query (Server State)

Tất cả dữ liệu từ API được quản lý qua React Query — caching, refetch, invalidation, optimistic updates.

## Custom Hooks (13 hooks)

| Hook | Chức năng |
|---|---|
| `useAuth` | Truy cập AuthContext |
| `usePosts` | Query/mutation bài viết |
| `useComments` | Query/mutation bình luận |
| `useVotes` | Mutation vote |
| `useBookmarks` | Query/mutation bookmark |
| `useCategories` | Query danh mục |
| `useTags` | Query thẻ |
| `useUsers` | Query hồ sơ user |
| `useNotifications` | Query thông báo |
| `useSearch` | Query tìm kiếm |
| `useConfig` | Query cấu hình công khai |
| `usePageTracking` | Theo dõi trang hiện tại |
| `useRealtimeNotifications` | Nhận thông báo real-time qua SSE |
| `useResponsive` | Breakpoint detection |

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `VITE_API_URL` | Có | URL Backend API (ví dụ: `http://localhost:5000/api/v1`) |

**Lưu ý:** Vite config sẽ throw error nếu `VITE_API_URL` không được set.

## Vite Configuration

- **Dev server port**: 5173 (strict)
- **API Proxy**: `/api` → `VITE_API_URL` (tránh CORS trong development)
- **Path alias**: `@` → `src/`
- **Build optimization**: Manual chunking cho vendor libraries (react, mui, radix, charts, query, motion, forms)

## Scripts

```bash
npm run dev              # Dev server tại localhost:5173
npm run build            # Production build
npm test                 # Chạy Vitest
npm run test:watch       # Watch mode
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
```

## Tương tác với các Service khác

| Service | Hướng | Chi tiết |
|---|---|---|
| Backend | → gửi request | REST API qua Vite proxy (`/api` → Backend), JWT auth |

**Không tương tác trực tiếp** với Admin-Client, Vibe-Content, hoặc PostgreSQL.

## Deployment

- **Vercel**: Cấu hình sẵn (`vercel.json`)
- **Build output**: Static files — deploy trên bất kỳ CDN/static hosting nào
- **Yêu cầu**: Set `VITE_API_URL` trỏ đến Backend production URL
