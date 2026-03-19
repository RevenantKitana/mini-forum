# Mini Forum — Admin Client

> **Version**: v1.25.1  
> **Last Updated**: 2026-03-19

Admin Dashboard — React 18 + TypeScript + Vite 6 + TailwindCSS v4 + shadcn/ui.

> **Lưu ý**: Đây là app tách biệt hoàn toàn với Frontend, chỉ dành cho ADMIN và MODERATOR.

---

## Tech Stack

| Package | Version | Mục đích | Sử dụng |
|---------|:-------:|----------|:-------:|
| react | 18.2.0 | UI framework | ✅ |
| react-router-dom | 6.21.2 | Routing (v6) | ✅ |
| axios | 1.6.5 | HTTP client | ✅ |
| tailwindcss | 4.1.12 | CSS framework (v4) | ✅ |
| @tailwindcss/vite | 4.1.12 | TW v4 Vite plugin | ✅ |
| tw-animate-css | 1.3.8 | Animation classes | ✅ |
| @radix-ui/* | various | Headless UI (Shadcn base) | ✅ |
| lucide-react | 0.312.0 | Icons | ✅ |
| sonner | 1.3.1 | Toast notifications | ✅ |
| @tanstack/react-query | 5.90.21 | Server state management | ⚠️ **Provider wired, pages chưa dùng hooks** |

> **⚠️ Tech Debt**: `@tanstack/react-query` — `QueryClientProvider` đã wired trong `main.tsx` nhưng các page vẫn sử dụng `useState` + `useEffect` + `axios` trực tiếp thay vì TanStack Query hooks. Các dep không sử dụng khác (`react-hook-form`, `zod`, `recharts`, `date-fns`, `@tanstack/react-table`) đã được gỡ khỏi `package.json`.

---

## So sánh với Frontend

| Aspect | Frontend | Admin Client |
|--------|----------|:------------:|
| Port | 5173 | **5174** |
| Token prefix | `forum_` | **`admin_`** |
| Target users | All users | Admin, Moderator |
| Router | React Router v7 | React Router **v6** |
| Tailwind | v4 | **v4** |
| Table library | — | Custom tables (shadcn/ui) |
| Shared code | — | Không share |

---

## Cấu trúc thư mục

```
admin-client/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component, route definitions
├── api/
│   ├── axios.ts               # Axios instance, admin token interceptor
│   ├── endpoints.ts           # API endpoint constants
│   └── services/
│       ├── authService.ts     # Admin login/logout
│       └── adminService.ts    # 31+ admin API functions
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx # Route guard (role check)
│   ├── layout/
│   │   └── AdminLayout.tsx    # Sidebar + content layout
│   └── ui/                    # Shadcn UI components
├── contexts/
│   └── AuthContext.tsx         # Admin auth state
├── lib/
│   └── utils.ts               # Utility functions (cn, etc.)
├── pages/                     # 10 page components
└── styles/
    └── globals.css            # Global styles + Tailwind
```

---

## Pages (10)

| Path | Component | Mô tả | Role |
|------|-----------|-------|:----:|
| `/login` | LoginPage | Đăng nhập admin | Public |
| `/` | DashboardPage | Thống kê tổng quan | MOD+ |
| `/users` | UsersPage | Quản lý users (ban, role) | ADMIN |
| `/posts` | PostsPage | Quản lý bài viết (ẩn, ghim, khóa) | MOD+ |
| `/comments` | CommentsPage | Quản lý comments (ẩn, mask) | MOD+ |
| `/reports` | ReportsPage | Xử lý reports | MOD+ |
| `/categories` | CategoriesPage | CRUD categories | ADMIN |
| `/tags` | TagsPage | CRUD tags | MOD+ |
| `/audit-logs` | AuditLogsPage | Xem audit logs | ADMIN |
| `/settings` | SettingsPage | Cấu hình hệ thống | ADMIN |

---

## Permission Matrix

| Chức năng | ADMIN | MODERATOR |
|-----------|:-----:|:---------:|
| Dashboard (xem stats) | ✅ | ✅ |
| Quản lý Users — ban (status) | ✅ | ✅ (chỉ đổi status) |
| Quản lý Users — role / delete | ✅ | ❌ |
| Quản lý Posts (ẩn, ghim, khóa) | ✅ | ✅ |
| Quản lý Comments (ẩn, mask) | ✅ | ✅ |
| Xử lý Reports | ✅ | ✅ |
| CRUD Categories | ✅ | ❌ |
| CRUD Tags | ✅ | ✅ |
| Xem Audit Logs | ✅ | ❌ |
| Settings | ✅ | ✅ (read-only) |

> **Ghi chú**: Admin Client không phân quyền ở cấp routing (tất cả trang đều accessible cho MOD+). Quyền hạn thực tế được enforce ở **backend API** — MOD gọi API admin-only sẽ nhận lỗi 403.

---

## API Services

### authService.ts (4 functions)

| Function | Mô tả |
|----------|-------|
| `login()` | Đăng nhập + kiểm tra role ADMIN/MOD |
| `logout()` | Đăng xuất, clear admin tokens |
| `getCurrentUser()` | Lấy user info từ API |
| `getStoredUser()` | Lấy user từ localStorage |

### adminService.ts (31+ functions)

| Nhóm | Functions | Mô tả |
|------|----------|-------|
| **Dashboard** | getStats | Thống kê tổng quan (users, posts, comments) |
| **Users** | getUsers, updateUser, changeUserRole, changeUserStatus, deleteUser | Quản lý users |
| **Posts** | getPosts, updatePostStatus, togglePostPin, pinPost, togglePostLock, deletePost, getPinnedPosts, updatePinOrder, reorderPinnedPosts | Quản lý bài viết |
| **Comments** | getComments, updateCommentStatus, deleteComment, toggleCommentMask, viewMaskedCommentContent | Quản lý comments |
| **Reports** | getReports, reviewReport | Xử lý reports |
| **Categories** | getCategories, createCategory, updateCategory, deleteCategory | CRUD categories |
| **Tags** | getTags, createTag, updateTag, deleteTag | CRUD tags |
| **Audit** | getAuditLogs | Xem audit logs |

---

## Authentication

### Token Storage (tách biệt Frontend)

| Key | Storage | Mô tả |
|-----|---------|-------|
| `admin_access_token` | localStorage | JWT access token (15m) |
| `admin_refresh_token` | localStorage | JWT refresh token (7d) |
| `admin_user` | localStorage | User info (cached) |

### Login Flow

```
LoginPage → authService.login()
  → API /auth/login
  → Check role === ADMIN | MODERATOR (reject nếu MEMBER)
  → Store tokens (admin_ prefix)
  → Redirect → DashboardPage
```

> Có thể login đồng thời cả Frontend và Admin Client nhờ token prefix khác nhau.

---

## Components

### AdminLayout

Layout chính với sidebar navigation:
- Dashboard, Users, Posts, Comments, Reports, Categories, Tags, Audit Logs, Settings
- Responsive: collapsible sidebar
- User info + Logout button

### ProtectedRoute

HOC kiểm tra authentication, redirect về `/login` nếu chưa đăng nhập hoặc không đủ role.

### UI Components (Shadcn/UI)

Generated từ shadcn/ui, config tại `components.json`:
- Button, Input, Dialog, DropdownMenu, Table, Select, Badge, Tabs, Card, Tooltip, etc.

---

## AuthContext

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;        // role === ADMIN
  isModerator: boolean;    // role === MODERATOR
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

---

## Data Tables

Các trang quản lý sử dụng custom HTML tables kết hợp shadcn/ui components (Table, Badge, Button, Select).
Dữ liệu được fetch thủ công qua `useState` + `useEffect` + `axios` (KHÔNG sử dụng TanStack Query hooks).

- **Filtering**: Text search + status filters (state local)
- **Pagination**: Server-side pagination via API params
- **Actions**: Inline action buttons per row

> **Lưu ý**: `@tanstack/react-table` có trong `package.json` nhưng chưa được import. Tables hiện tại là custom implementation.

---

## Dashboard Stats

Dashboard hiển thị **6 stat cards** tổng quan, **3 range stats** theo khoảng ngày, **quản lý bài viết ghim**, và **audit logs gần đây** (không có charts).

| Component | Dữ liệu |
|-----------|--------|
| Overview Stats (6 cards) | Total users, posts, comments, pending reports, active users, pinned posts |
| Date Range Filter | Lọc theo startDate/endDate (mặc định: hôm nay) |
| Range Stats (3 cards) | New users, new posts, new comments trong khoảng ngày |
| Pinned Posts Management | Danh sách bài ghim — bỏ ghim, thay đổi thứ tự (drag handle) |
| Recent Audit Logs | 10 audit logs gần nhất |

---

## Cách chạy

### Yêu cầu

- Node.js >= 20.x
- Backend đang chạy tại port 5000
- Account ADMIN hoặc MODERATOR

### Cài đặt

```bash
npm install
```

### Environment Variables

```dotenv
VITE_API_URL=http://localhost:5000/api/v1     # Mặc định
```

### Scripts

| Script | Lệnh | Mô tả |
|--------|------|-------|
| `dev` | `vite --port 5174` | Development server |
| `build` | `tsc && vite build` | Build production |
| `lint` | `eslint .` | Run ESLint |
| `preview` | `vite preview` | Preview production build |

### Development

```bash
npm run dev
# → http://localhost:5174
# → Login: admin@forum.com / Admin@123
# → Moderator: cần tạo qua admin hoặc seed thủ công
```

### Vite Config

```typescript
{
  plugins: [react()],
  resolve: { alias: { '@': './src' } },
  server: {
    port: 5174,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
  }
}
```

---

## Ghi chú kỹ thuật

1. **Tách biệt hoàn toàn**: Không share code với Frontend — riêng package.json, routing, token storage
2. **Role-based Login**: Reject login nếu user role là MEMBER
3. **Tailwind v4**: Giống Frontend — dùng `@tailwindcss/vite` plugin + CSS imports (đã upgrade từ v3 trong v1.19.0)
4. **React Router v6**: Khác với Frontend (v7) — API `useNavigate`, `useParams`
5. **Proxy Config**: Vite proxy `/api` → backend trong development mode
6. **TypeScript Strict**: `strict: true` trong tsconfig.json

---

## Liên kết

- [Kiến trúc hệ thống](../docs/01-ARCHITECTURE.md)
- [API Reference — Admin](../docs/03-API/12-admin.md)
- [Features Matrix](../docs/04-FEATURES.md)
- [Security — RBAC](../docs/09-SECURITY.md)
