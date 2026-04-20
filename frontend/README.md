# Frontend — Mini Forum

Giao diện người dùng của Mini Forum, xây dựng bằng React 18 + TypeScript + Vite.

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **React Router DOM 7** | Client-side routing |
| **TanStack React Query** | Server state management & caching |
| **Axios** | HTTP client |
| **Material-UI + Radix UI** | Component library |
| **Tailwind CSS** | Utility-first CSS |
| **React Hook Form + Zod** | Form management & validation |
| **Recharts** | Biểu đồ thống kê |
| **Motion** | Animation |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |
| **Next Themes** | Dark/Light mode |

## Cấu trúc thư mục

```
src/
├── api/              # Axios instance, endpoints, services
│   ├── axios.ts      # Axios config với interceptors
│   ├── endpoints.ts  # Định nghĩa API endpoints
│   └── services/     # Service layer (auth, post, comment, vote, ...)
├── app/              # App component, routing setup
├── components/       # Components tái sử dụng
├── constants/        # Hằng số ứng dụng
├── contexts/         # React Context providers
│   ├── AuthContext   # Xác thực người dùng
│   ├── SidebarContext
│   ├── FontSizeContext
│   └── RealtimeNotificationsProvider
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Page components
├── routes/           # Route definitions, PrivateRoute
├── styles/           # Global CSS, Tailwind config
├── types/            # TypeScript type definitions
└── utils/            # Helper utilities
```

## Các trang chính

| Trang | Route | Mô tả |
|---|---|---|
| Trang chủ | `/` | Danh sách bài viết, lọc theo danh mục/tag |
| Chi tiết bài viết | `/posts/:id` | Xem bài viết, bình luận, vote |
| Tạo/Sửa bài viết | `/posts/new`, `/posts/:id/edit` | Soạn bài viết (yêu cầu đăng nhập) |
| Tìm kiếm | `/search` | Tìm kiếm toàn văn |
| Hồ sơ cá nhân | `/users/:id` | Xem profile người dùng |
| Chỉnh sửa hồ sơ | `/settings` | Cập nhật thông tin cá nhân |
| Bookmark | `/bookmarks` | Bài viết đã đánh dấu |
| Người dùng bị chặn | `/blocked-users` | Quản lý danh sách chặn |
| Danh mục | `/categories` | Duyệt danh mục |
| Tags | `/tags` | Duyệt tag |
| Thông báo | `/notifications` | Thông báo real-time |
| Đăng nhập | `/login` | Đăng nhập tài khoản |
| Đăng ký | `/register` | Đăng ký qua OTP email |
| Quên mật khẩu | `/forgot-password` | Khôi phục mật khẩu |

## Tính năng

- **Xác thực:** Đăng nhập/đăng ký với OTP email, JWT token
- **Bài viết:** Tạo, sửa, xoá bài viết với danh mục và tag
- **Bình luận:** Bình luận lồng nhau, trích dẫn, chỉnh sửa
- **Vote:** Upvote/downvote bài viết và bình luận
- **Bookmark:** Đánh dấu bài viết yêu thích
- **Tìm kiếm:** Full-text search
- **Thông báo:** Real-time qua SSE (bình luận, trả lời, mention, upvote)
- **Dark mode:** Chuyển đổi giao diện sáng/tối
- **Responsive:** Hỗ trợ mobile và desktop
- **Font size:** Tuỳ chỉnh cỡ chữ

## Cài đặt & Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server (port 5173)
npm run dev

# Build production
npm run build

# Preview bản build
npm run preview

# Kiểm tra type
npm run lint
```

## Cấu hình

### Vite

- Path alias: `@` → `./src`
- Build optimization với manual chunks (vendor-react, vendor-mui, vendor-radix, vendor-charts, ...)

### Biến môi trường

Tạo file `.env` tại thư mục `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Triển khai

Hỗ trợ triển khai trên **Vercel** với cấu hình có sẵn trong `vercel.json`.
