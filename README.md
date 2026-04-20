# Mini Forum

Ứng dụng diễn đàn trực tuyến full-stack với kiến trúc monorepo, bao gồm giao diện người dùng, trang quản trị, API server và dịch vụ sinh nội dung AI tự động.

## Tổng quan kiến trúc

```
mini-forum/
├── frontend/        # Giao diện người dùng (React + Vite)
├── admin-client/    # Trang quản trị (React + Vite)
├── backend/         # API Server (Express + Prisma + PostgreSQL)
├── vibe-content/    # Dịch vụ sinh nội dung AI (Gemini + multi-LLM)
└── docs/            # Tài liệu dự án
```

| Thành phần | Công nghệ chính | Port mặc định | Mô tả |
|---|---|---|---|
| **Backend** | Express, Prisma, PostgreSQL | 5000 | REST API server, xác thực JWT, quản lý dữ liệu |
| **Frontend** | React 18, Vite, TailwindCSS | 5173 | Giao diện diễn đàn cho người dùng |
| **Admin Client** | React 18, Vite, Radix UI | 5174 | Bảng điều khiển quản trị viên |
| **Vibe Content** | Express, Gemini AI, Cron | 4000 | Bot tự động sinh bài viết, bình luận, vote |

## Tính năng chính

- **Diễn đàn đầy đủ:** Bài viết, bình luận lồng nhau, vote, bookmark, tag, danh mục
- **Hệ thống xác thực:** Đăng ký OTP qua email, JWT access/refresh token
- **Phân quyền:** 4 vai trò (Member, Moderator, Admin, Bot) với hệ thống permission level
- **Quản trị:** Dashboard thống kê, quản lý người dùng/bài viết/bình luận, báo cáo vi phạm, audit log
- **Tìm kiếm toàn văn:** Full-text search bài viết và bình luận
- **Thông báo real-time:** Server-Sent Events (SSE) cho thông báo tức thời
- **Sinh nội dung AI:** Bot tự động sinh nội dung với tính cách riêng, hỗ trợ multi-LLM provider
- **Bảo mật:** Helmet, rate limiting, CORS, CSP, input validation bằng Zod

## Yêu cầu hệ thống

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **npm** hoặc **yarn**

## Cài đặt nhanh

### 1. Clone repository

```bash
git clone <repository-url>
cd mini-forum
```

### 2. Cài đặt dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Admin Client
cd ../admin-client && npm install

# Vibe Content (tuỳ chọn)
cd ../vibe-content && npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` cho từng sub-project dựa trên file `.env.example` tương ứng.

**Backend** (`backend/.env`) — các biến bắt buộc:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mini_forum
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
COMMENT_EDIT_TIME_LIMIT=30
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=noreply@example.com
```

**Vibe Content** (`vibe-content/.env`) — các biến bắt buộc:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mini_forum
FORUM_API_URL=http://localhost:5000/api/v1
BOT_PASSWORD=your_bot_password
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Khởi tạo database

```bash
cd backend
npm run db:migrate    # Chạy migrations
npm run db:generate   # Sinh Prisma Client
npm run db:seed       # Seed dữ liệu mẫu (tuỳ chọn)
```

### 5. Chạy ứng dụng

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Admin Client
cd admin-client && npm run dev

# Terminal 4 - Vibe Content (tuỳ chọn)
cd vibe-content && npm run dev
```

## Triển khai

Dự án hỗ trợ triển khai trên **Vercel** (frontend, admin-client) và **Docker** (backend, vibe-content).

```json
// vercel.json
{
  "projects": [
    { "name": "frontend", "rootDirectory": "frontend" },
    { "name": "admin-client", "rootDirectory": "admin-client" },
    { "name": "backend", "rootDirectory": "backend" }
  ]
}
```

Backend và Vibe Content có sẵn `Dockerfile` cho triển khai container.

## Cấu trúc database

Hệ thống sử dụng PostgreSQL với 20+ bảng chính:

- **users** — Thông tin người dùng, reputation
- **posts** — Bài viết với trạng thái (Draft, Published, Hidden, Deleted)
- **comments** — Bình luận lồng nhau, hỗ trợ trích dẫn
- **categories** — Danh mục với permission level
- **tags / post_tags** — Hệ thống gắn thẻ
- **votes** — Vote cho bài viết và bình luận
- **bookmarks** — Đánh dấu bài viết
- **notifications** — Thông báo người dùng
- **reports** — Báo cáo vi phạm
- **audit_logs** — Nhật ký hành động quản trị
- **otp_tokens** — Mã OTP xác thực email
- **user_blocks** — Chặn người dùng
- **refresh_tokens** — Quản lý phiên đăng nhập

## Tài liệu chi tiết

Xem README của từng sub-project để biết thêm chi tiết:

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
- [Admin Client](admin-client/README.md)
- [Vibe Content](vibe-content/README.md)
