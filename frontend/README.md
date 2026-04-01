# Frontend — Mini Forum User Portal

Giao diện người dùng (SPA) cho hệ thống Mini Forum, xây dựng trên React 18 + Vite + Tailwind CSS.

## Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 6.3.5 | Build tool & dev server |
| TypeScript | - | Type safety |
| Tailwind CSS | 4.1.12 | Styling |
| React Router | 7.13.0 | Client-side routing |
| TanStack React Query | 5.90.20 | Server state management |
| Axios | 1.13.4 | HTTP client |
| React Hook Form | 7.55.0 | Form management |
| Zod | - | Form validation |
| Radix UI | - | Accessible UI primitives (30+ components) |
| Motion | 12.23.24 | Animations |
| Sonner | - | Toast notifications |
| Lucide React | - | Icons |
| Recharts | - | Charts |
| Vitest | - | Testing |

## Cài đặt

```bash
cd frontend
npm install
```

## Biến môi trường

Tạo file `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_USE_MOCK_API=false
```

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Dev server tại `http://localhost:5173` |
| `npm run build` | Build production → `dist/` |
| `npm run preview` | Preview bản build production |
| `npm test` | Chạy tests (Vitest) |
| `npm run test:watch` | Tests ở chế độ watch |
| `npm run test:ui` | UI test runner |
| `npm run test:coverage` | Coverage report |

## Cấu trúc thư mục

```
frontend/src/
├── main.tsx                  # Entry point
├── app/
│   └── App.tsx               # Router setup, providers
├── pages/                    # Route page components
│   ├── HomePage.tsx          # Trang chủ — feed bài viết
│   ├── PostDetailPage.tsx    # Chi tiết bài viết + bình luận
│   ├── EditPostPage.tsx      # Chỉnh sửa bài viết (protected)
│   ├── ProfilePage.tsx       # Hồ sơ người dùng
│   ├── SearchPage.tsx        # Tìm kiếm bài viết & users
│   ├── CategoriesPage.tsx    # Duyệt danh mục
│   ├── TagsPage.tsx          # Duyệt tags
│   ├── BookmarksPage.tsx     # Bài viết đã lưu (protected)
│   ├── EditProfilePage.tsx   # Cài đặt hồ sơ (protected)
│   ├── BlockedUsersPage.tsx  # Quản lý chặn (protected)
│   ├── NotificationsPage.tsx # Thông báo (protected)
│   └── NotFoundPage.tsx      # Trang 404
├── routes/
│   └── PrivateRoute.tsx      # Route guard — redirect nếu chưa đăng nhập
├── components/               # UI components
│   ├── ui/                   # Radix UI primitives tùy chỉnh
│   ├── layout/               # Header, Sidebar, Footer, MainLayout
│   └── ...                   # Feature components
├── api/
│   ├── axios.ts              # Axios instance + interceptors
│   ├── endpoints.ts          # API endpoint constants
│   └── services/             # API service functions
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   ├── SidebarContext.tsx     # Sidebar collapse/expand
│   ├── FontSizeContext.tsx    # Accessibility — font scale
│   └── GlobalLoadingContext.tsx # Loading overlay
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript interfaces
├── lib/                      # Utility functions
├── styles/                   # Global CSS + Tailwind
└── test/                     # Test setup
```

## Routing

### Trang công khai

| Route | Component | Mô tả |
|---|---|---|
| `/` | HomePage | Feed bài viết chính, bộ lọc |
| `/posts/:id` | PostDetailPage | Xem bài viết + bình luận |
| `/users/:username` | ProfilePage | Hồ sơ & hoạt động người dùng |
| `/search` | SearchPage | Tìm kiếm bài viết & users |
| `/categories` | CategoriesPage | Duyệt danh mục |
| `/tags` | TagsPage | Duyệt tags |
| `/login` | LoginPage | Đăng nhập |
| `/register` | RegisterPage | Đăng ký (OTP) |
| `/forgot-password` | ForgotPasswordPage | Quên mật khẩu (OTP) |

### Trang yêu cầu đăng nhập

| Route | Component | Mô tả |
|---|---|---|
| `/posts/:id/edit` | EditPostPage | Chỉnh sửa bài viết |
| `/bookmarks` | BookmarksPage | Bài viết đã lưu |
| `/settings/profile` | EditProfilePage | Hồ sơ & đổi mật khẩu |
| `/settings/blocked` | BlockedUsersPage | Quản lý chặn người dùng |
| `/notifications` | NotificationsPage | Thông báo |

## Contexts

### AuthContext
Quản lý trạng thái đăng nhập toàn cục.

| Method | Mô tả |
|---|---|
| `login(credentials)` | Đăng nhập, lưu token |
| `register(data)` | Đăng ký tài khoản |
| `logout()` | Đăng xuất, xóa token |
| `updateProfile(data)` | Cập nhật hồ sơ |
| `refreshUser()` | Refresh thông tin user |

### SidebarContext
Điều khiển hiển thị sidebar trái/phải.

### FontSizeContext
Hỗ trợ accessibility — 5 mức scale font: `xs` (0.7x), `sm` (0.85x), `md` (1x), `lg` (1.15x), `xl` (1.3x).

### GlobalLoadingContext
Loading overlay toàn trang.

## Custom Hooks

### Data Fetching

| Hook | Mô tả |
|---|---|
| `usePosts(params)` | Lấy danh sách bài viết (phân trang, lọc) |
| `useComments(postId, params)` | Lấy bình luận của bài viết |
| `useCategories()` | Lấy danh mục |
| `useCategoriesWithTags()` | Danh mục kèm tags phổ biến |
| `useTags(limit)` | Lấy danh sách tags |
| `useBookmarks(userId)` | Bài viết đã lưu |
| `useNotifications(page, limit)` | Thông báo (auto-refresh 60s) |
| `useSearch(params)` | Tìm kiếm bài viết |
| `useSearchUsers(q)` | Tìm kiếm người dùng |
| `useUsers(userId)` | Lấy thông tin user |
| `useUserByUsername(username)` | User theo username |
| `useConfig()` | Cấu hình hệ thống |

### Mutations

| Hook | Mô tả |
|---|---|
| `useCreateComment()` | Tạo bình luận |
| `useUpdateComment()` | Sửa bình luận |
| `useDeleteComment()` | Xóa bình luận |
| `useVotePost()` | Vote bài viết |
| `useVoteComment()` | Vote bình luận |
| `useCreateBookmark()` | Lưu bài viết |
| `useRemoveBookmark()` | Bỏ lưu bài viết |
| `useUpdateProfile()` | Cập nhật hồ sơ |
| `useChangePassword()` | Đổi mật khẩu |
| `useUpdateAvatar()` | Đổi avatar |

### UI Utilities

| Hook | Mô tả |
|---|---|
| `useBreakpoint()` | Detect Tailwind breakpoint hiện tại |
| `useScrollLock(isLocked)` | Lock scroll cho modal/dialog |
| `useDebounce(value, delay)` | Debounce giá trị |
| `useResponsive()` | Responsive utilities |

## Cấu hình React Query

- **Stale time**: 5 phút
- **Retry**: 1 lần
- **Refetch on window focus**: Tắt
- **Notifications**: Stale time 30s, refetch interval 60s

## Deploy

Đã cấu hình `vercel.json` cho Vercel deployment — SPA rewrites tất cả routes về `index.html`.
