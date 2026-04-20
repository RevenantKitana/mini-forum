# Admin Client — Mini Forum

Trang quản trị dành cho Moderator và Admin, xây dựng bằng React 18 + TypeScript + Vite.

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **React Router DOM 6** | Client-side routing |
| **TanStack React Query** | Server state management & caching |
| **Axios** | HTTP client |
| **Radix UI** | Headless component library |
| **Tailwind CSS** | Utility-first CSS |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |
| **Class Variance Authority** | Component variant styling |

## Cấu trúc thư mục

```
admin-client/
└── src/
    ├── App.tsx              # Routing chính, protected routes
    ├── main.tsx             # Entry point
    ├── api/
    │   ├── axios.ts         # Axios instance với token management
    │   ├── endpoints.ts     # Admin API endpoints
    │   └── services/
    │       ├── adminService  # Dashboard, quản lý nội dung
    │       └── authService   # Đăng nhập, token refresh
    ├── components/
    │   ├── auth/            # Login form, ProtectedRoute
    │   ├── layout/          # AdminLayout, sidebar, header
    │   └── ui/              # Radix UI components
    ├── contexts/
    │   └── AuthContext.tsx   # Xác thực admin/moderator
    ├── pages/               # 12 trang quản trị
    ├── lib/                 # Utility functions
    ├── styles/              # Global CSS
    └── utils/               # Helper utilities
```

## Các trang quản trị

| Trang | Route | Quyền truy cập | Mô tả |
|---|---|---|---|
| Dashboard | `/` | Mod + Admin | Thống kê tổng quan |
| Quản lý người dùng | `/users` | Mod + Admin | Danh sách, ban/unban, đổi role |
| Quản lý bài viết | `/posts` | Mod + Admin | Duyệt, ẩn, ghim, khoá bài viết |
| Quản lý bình luận | `/comments` | Mod + Admin | Duyệt, ẩn, mask bình luận |
| Báo cáo vi phạm | `/reports` | Mod + Admin | Xử lý report (pending → resolved/dismissed) |
| Danh mục | `/categories` | Mod + Admin | CRUD danh mục |
| Tags | `/tags` | Mod + Admin | CRUD tag |
| Audit Logs | `/audit-logs` | Admin only | Nhật ký hành động quản trị |
| Operational Dashboard | `/operational` | Admin only | Metrics hệ thống, hiệu suất |
| Cài đặt | `/settings` | Admin only | Cấu hình hệ thống |
| Đăng nhập | `/login` | Public | Đăng nhập quản trị |

## Tính năng

### Dashboard
- Thống kê tổng quan: số người dùng, bài viết, bình luận, báo cáo
- Biểu đồ hoạt động

### Quản lý người dùng
- Danh sách người dùng với bộ lọc
- Ban/Unban tài khoản
- Thay đổi vai trò (Member ↔ Moderator ↔ Admin)

### Quản lý nội dung
- Duyệt và kiểm duyệt bài viết, bình luận
- Ghim bài viết (toàn cục hoặc theo danh mục)
- Khoá bài viết (không cho bình luận thêm)
- Ẩn/hiện nội dung
- Mask nội dung nhạy cảm

### Báo cáo vi phạm
- Hàng đợi báo cáo chờ xử lý
- Workflow: Pending → Reviewing → Resolved / Dismissed

### Audit Log
- Theo dõi mọi hành động quản trị
- Lọc theo loại hành động, người thực hiện, thời gian

### Xác thực
- JWT-based authentication
- Chỉ cho phép vai trò Admin và Moderator
- Tự động refresh token
- Fallback sang stored user nếu API lỗi

## Cài đặt & Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server (port 5174)
npm run dev

# Build production
npm run build

# Preview bản build
npm run preview

# Kiểm tra lint
npm run lint
```

## Cấu hình

### Vite

- Path alias: `@` → `./src`
- Dev port: **5174** (strict)
- Proxy: `/api` → Backend server

### Biến môi trường

Tạo file `.env` tại thư mục `admin-client/`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Phân quyền

| Tính năng | Moderator | Admin |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Quản lý người dùng | ✅ | ✅ |
| Quản lý bài viết | ✅ | ✅ |
| Quản lý bình luận | ✅ | ✅ |
| Xử lý báo cáo | ✅ | ✅ |
| Quản lý danh mục/tag | ✅ | ✅ |
| Audit Logs | ❌ | ✅ |
| Operational Dashboard | ❌ | ✅ |
| Cài đặt hệ thống | ❌ | ✅ |

## Triển khai

Hỗ trợ triển khai trên **Vercel** với cấu hình có sẵn trong `vercel.json`.
