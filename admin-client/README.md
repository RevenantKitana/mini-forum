# Admin-Client Service

## Tổng quan

Bảng điều khiển quản trị (admin dashboard) dành riêng cho ADMIN và MODERATOR. Cung cấp giao diện quản lý người dùng, nội dung, báo cáo vi phạm và cấu hình hệ thống.

**Giả định:** Admin-Client là ứng dụng tách biệt với Frontend — không chia sẻ code, component hay state, dù tech stack tương tự.

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | React 18.2 |
| Build tool | Vite 6.3 |
| Language | TypeScript |
| Styling | Tailwind 4.1 |
| UI Components | Radix UI (không dùng MUI) |
| Routing | React Router 6.21 |
| State Management | TanStack Query 5.90, React Context |
| Testing | Vitest, React Testing Library |

## Cấu trúc thư mục

```
admin-client/src/
├── App.tsx                    # Root component (routing + auth guard)
├── main.tsx                   # Entry point
├── api/
│   ├── axios.ts               # Axios instance
│   ├── endpoints.ts           # API endpoint constants
│   └── services/
│       ├── authService.ts     # Login, logout, getCurrentUser
│       └── adminService.ts    # Admin operations
├── pages/                     # 11 page components
├── components/
│   ├── auth/                  # Auth-related components
│   ├── layout/                # Admin layout (sidebar, header)
│   └── ui/                    # Shared UI components
├── contexts/
│   └── AuthContext.tsx         # Auth state + role verification
├── utils/                     # Utility functions
├── lib/
│   └── utils.ts               # Helper functions
├── styles/
│   └── globals.css            # Global styles
└── test/
    └── setup.ts               # Test configuration
```

## Pages

| Page | Route | Mô tả |
|---|---|---|
| `LoginPage` | `/login` | Đăng nhập quản trị (public) |
| `DashboardPage` | `/` | Tổng quan: thống kê, biểu đồ |
| `UsersPage` | `/users` | Quản lý người dùng (xem, ban, đổi role) |
| `PostsPage` | `/posts` | Quản lý bài viết (ẩn, xóa, pin) |
| `CommentsPage` | `/comments` | Quản lý bình luận |
| `ReportsPage` | `/reports` | Xử lý báo cáo vi phạm |
| `CategoriesPage` | `/categories` | CRUD danh mục |
| `TagsPage` | `/tags` | CRUD thẻ |
| `AuditLogsPage` | `/audit-logs` | Xem nhật ký hành động |
| `OperationalDashboardPage` | `/ops` | Dashboard vận hành hệ thống |
| `SettingsPage` | `/settings` | Cấu hình hệ thống |

## Tính năng chi tiết

### Dashboard
- Thống kê tổng quan: số users, posts, comments, reports
- Biểu đồ hoạt động
- Danh sách reports mới nhất

### Quản lý người dùng (UsersPage)
- Danh sách người dùng với phân trang, tìm kiếm
- Thay đổi role (Member ↔ Moderator ↔ Admin)
- Ban/unban tài khoản
- Xem chi tiết hoạt động

### Quản lý bài viết (PostsPage)
- Danh sách bài viết với bộ lọc (status, category)
- Pin/unpin bài viết (Global hoặc Category)
- Kéo thả sắp xếp thứ tự pin (React DnD)
- Lock/unlock bình luận
- Thay đổi trạng thái (Published, Hidden, Deleted)

### Quản lý bình luận (CommentsPage)
- Danh sách bình luận
- Ẩn/hiện bình luận (mask content)
- Xem nội dung đã ẩn (Admin only)
- Xóa bình luận

### Xử lý báo cáo (ReportsPage)
- Workflow trạng thái: Pending → Reviewing → Resolved/Dismissed
- Xem nội dung vi phạm (user/post/comment)
- Ghi chú xử lý
- Bộ lọc theo trạng thái

### Quản lý danh mục (CategoriesPage) — Admin only
- CRUD danh mục
- Cấu hình phân quyền view/post/comment per category
- Sắp xếp thứ tự hiển thị
- Chọn màu sắc

### Quản lý tags (TagsPage)
- CRUD tags
- Cấu hình quyền sử dụng (ALL, MEMBER, MODERATOR, ADMIN)
- Theo dõi số lượng sử dụng (usage_count)

### Nhật ký hành động (AuditLogsPage) — Admin only
- Xem tất cả hành động admin (tạo, sửa, xóa, ban, pin, lock...)
- Bộ lọc theo action, target type, user
- Chi tiết old/new values cho mỗi thao tác
- Thông tin IP, user agent

## Xác thực & Phân quyền

### AuthContext

- `useAuth()` hook cung cấp: `user`, `isAuthenticated`, `isLoading`, `isAdmin`, `isModerator`
- Phương thức: `login(email, password)`, `logout()`, `refreshUser()`
- **Kiểm tra role bắt buộc**: Chỉ cho phép ADMIN hoặc MODERATOR truy cập — user thường bị từ chối
- **localStorage key**: `admin_user` (tách biệt với Frontend dùng `forum_access_token`)

### Route Protection

- Tất cả route ngoại trừ `/login` được bọc trong `ProtectedRoute`
- Nếu user chưa đăng nhập hoặc không đủ quyền → redirect về `/login`

## API Integration

| Service | Chức năng |
|---|---|
| `authService` | Đăng nhập, đăng xuất, lấy user hiện tại |
| `adminService` | Thao tác quản trị: quản lý users, posts, comments, reports, categories, tags, audit logs |

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `VITE_API_URL` | Có | URL Backend API |

## Vite Configuration

- **Dev server port**: 5174 (strict — tách biệt với Frontend port 5173)
- **API Proxy**: `/api` → `VITE_API_URL`
- **Path alias**: `@` → `src/`

## Scripts

```bash
npm run dev              # Dev server tại localhost:5174
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Chạy Vitest
npm run test:watch       # Watch mode
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
```

## Khác biệt so với Frontend

| Tiêu chí | Frontend | Admin-Client |
|---|---|---|
| Đối tượng | Người dùng cuối | ADMIN, MODERATOR |
| Port | 5173 | 5174 |
| Router | React Router 7 | React Router 6 |
| UI Library | Radix UI + MUI | Radix UI (không MUI) |
| localStorage key | `forum_access_token` | `admin_user` |
| Chức năng | Đọc/viết nội dung cá nhân | Quản lý toàn bộ hệ thống |
| Shared code | Không | Không |

## Tương tác với các Service khác

| Service | Hướng | Chi tiết |
|---|---|---|
| Backend | → gửi request | REST API qua Vite proxy, JWT auth, admin endpoints |

**Không tương tác trực tiếp** với Frontend, Vibe-Content, hoặc PostgreSQL.

## Deployment

- **Vercel**: Cấu hình sẵn (`vercel.json`)
- **Build output**: Static files
- **Yêu cầu**: Set `VITE_API_URL` trỏ đến Backend production URL

