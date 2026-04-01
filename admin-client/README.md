# Admin Client — Mini Forum Dashboard

Bảng điều khiển quản trị cho hệ thống Mini Forum, dành cho Moderator và Admin.

## Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 18.2.0 | UI framework |
| Vite | 6.3.5 | Build tool |
| TypeScript | - | Type safety |
| Tailwind CSS | - | Styling |
| React Router | 6.21.2 | Client-side routing |
| TanStack React Query | - | Server state management |
| Axios | - | HTTP client |
| React Hook Form + Zod | - | Form management & validation |
| Radix UI | - | Accessible UI primitives |
| React DnD | - | Drag & drop (pin reordering) |
| Sonner | - | Toast notifications |

## Cài đặt

```bash
cd admin-client
npm install
```

## Biến môi trường

Tạo file `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Dev server tại `http://localhost:5174` |
| `npm run build` | Build production (tsc + vite build) |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview bản build |
| `npm test` | Chạy tests (Vitest) |

## Cấu trúc thư mục

```
admin-client/src/
├── App.tsx                   # Router setup + Auth guard
├── main.tsx                  # Entry point
├── pages/
│   ├── DashboardPage.tsx     # Thống kê tổng quan
│   ├── UsersPage.tsx         # Quản lý người dùng
│   ├── PostsPage.tsx         # Quản lý bài viết
│   ├── CommentsPage.tsx      # Quản lý bình luận
│   ├── ReportsPage.tsx       # Xử lý báo cáo vi phạm
│   ├── CategoriesPage.tsx    # Quản lý danh mục
│   ├── TagsPage.tsx          # Quản lý tags
│   ├── AuditLogsPage.tsx     # Nhật ký hành động (Admin only)
│   ├── SettingsPage.tsx      # Cài đặt hệ thống
│   └── LoginPage.tsx         # Đăng nhập admin
├── components/
│   ├── auth/                 # Auth-related components
│   ├── layout/               # Admin layout (sidebar, header)
│   └── ui/                   # Reusable UI components
├── api/
│   ├── axios.ts              # Axios instance + interceptors
│   ├── endpoints.ts          # API endpoint constants
│   └── services/             # API service functions
├── contexts/
│   └── AuthContext.tsx        # Admin authentication state
├── lib/
│   └── utils.ts              # Utility functions
├── styles/
│   └── globals.css           # Global styles
└── test/
    └── setup.ts              # Test setup
```

## Routing

Tất cả routes (trừ `/login`) yêu cầu đăng nhập với role MODERATOR hoặc ADMIN.

| Route | Component | Quyền | Mô tả |
|---|---|---|---|
| `/login` | LoginPage | Public | Đăng nhập admin |
| `/` | DashboardPage | MOD/ADMIN | Thống kê tổng quan |
| `/users` | UsersPage | MOD/ADMIN | Quản lý người dùng |
| `/posts` | PostsPage | MOD/ADMIN | Quản lý bài viết |
| `/comments` | CommentsPage | MOD/ADMIN | Quản lý bình luận |
| `/reports` | ReportsPage | MOD/ADMIN | Xử lý báo cáo |
| `/categories` | CategoriesPage | ADMIN | Quản lý danh mục |
| `/tags` | TagsPage | MOD/ADMIN | Quản lý tags |
| `/audit-logs` | AuditLogsPage | ADMIN | Nhật ký hành động |
| `/settings` | SettingsPage | ADMIN | Cài đặt hệ thống |

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

## Deploy

Đã cấu hình `vercel.json` — SPA rewrites tất cả routes về `index.html`.
