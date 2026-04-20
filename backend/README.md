# Backend — Mini Forum

REST API server cho Mini Forum, xây dựng bằng Express + TypeScript + Prisma + PostgreSQL.

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| **Express 4** | Web framework |
| **TypeScript 5** | Type safety |
| **Prisma 5** | ORM & database migration |
| **PostgreSQL** | Cơ sở dữ liệu chính |
| **JWT + bcrypt** | Xác thực & mã hoá mật khẩu |
| **Zod** | Validation schema |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Rate limiting |
| **Morgan** | HTTP request logging |
| **Brevo (Sendinblue)** | Gửi email OTP |
| **cookie-parser** | Quản lý cookie (refresh token) |

## Cấu trúc thư mục

```
backend/
├── prisma/
│   ├── schema.prisma        # Database schema (20+ models)
│   ├── seed.ts              # Database seeding
│   └── migrations/          # Migration files
├── scripts/
│   ├── backupDb.ts          # Backup database
│   ├── clearData.ts         # Xoá dữ liệu
│   └── wipeAllDb.ts         # Xoá toàn bộ database
├── src/
│   ├── app.ts               # Express app setup, middleware stack
│   ├── index.ts             # Server startup, database connection
│   ├── config/
│   │   ├── index.ts         # Cấu hình ứng dụng
│   │   └── database.ts      # Prisma client singleton
│   ├── constants/
│   │   └── roles.ts         # Định nghĩa vai trò
│   ├── controllers/         # 13 controllers
│   ├── middlewares/          # 8 middleware modules
│   ├── routes/              # 14 route files
│   ├── services/            # 19 service files
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper utilities
│   └── validations/         # 10 Zod validation schemas
├── Dockerfile               # Docker container config
└── docker-entrypoint.sh     # Container entrypoint script
```

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Xác thực (`/auth`)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký (gửi OTP email) |
| POST | `/auth/verify-otp` | Xác nhận OTP |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/refresh-token` | Làm mới access token |
| POST | `/auth/logout` | Đăng xuất |
| POST | `/auth/forgot-password` | Yêu cầu reset mật khẩu |
| POST | `/auth/reset-password` | Đặt mật khẩu mới |

### Bài viết (`/posts`)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/posts` | Danh sách bài viết |
| GET | `/posts/:id` | Chi tiết bài viết |
| POST | `/posts` | Tạo bài viết mới |
| PUT | `/posts/:id` | Cập nhật bài viết |
| DELETE | `/posts/:id` | Xoá bài viết |
| PATCH | `/posts/:id/status` | Thay đổi trạng thái |
| POST | `/posts/:id/vote` | Vote bài viết |
| POST | `/posts/:id/bookmark` | Bookmark bài viết |

### Bình luận (`/comments`)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/posts/:id/comments` | Danh sách bình luận |
| POST | `/comments` | Tạo bình luận |
| PUT | `/comments/:id` | Cập nhật bình luận |
| DELETE | `/comments/:id` | Xoá bình luận |
| POST | `/comments/:id/vote` | Vote bình luận |

### Người dùng (`/users`)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/users/:id` | Thông tin người dùng |
| PUT | `/users/:id` | Cập nhật hồ sơ |
| GET | `/users/:id/bookmarks` | Bookmarks của người dùng |

### Khác
| Module | Endpoint | Mô tả |
|---|---|---|
| Danh mục | `/categories` | CRUD danh mục |
| Tags | `/tags` | CRUD tag |
| Tìm kiếm | `/search` | Full-text search |
| Thông báo | `/notifications` | Quản lý thông báo |
| Báo cáo | `/reports` | Báo cáo vi phạm |
| Chặn | `/blocks` | Chặn người dùng |
| Admin | `/admin` | Dashboard, quản lý hệ thống |

## Database Schema

### Models chính (20+ bảng)

- **users** — Người dùng (username, email, password, role, reputation, avatar, bio, ...)
- **posts** — Bài viết (title, content, status, view_count, vote_score, pinned, locked, ...)
- **comments** — Bình luận lồng nhau (content, parent_id, quoted_comment_id, is_masked, ...)
- **categories** — Danh mục (name, slug, permission_level, sort_order, ...)
- **tags / post_tags** — Hệ thống gắn thẻ
- **votes** — Vote bài viết/bình luận (target: POST | COMMENT, value: 1 | -1)
- **bookmarks** — Đánh dấu bài viết
- **notifications** — Thông báo (type: COMMENT, REPLY, MENTION, UPVOTE, SYSTEM)
- **reports** — Báo cáo vi phạm (status: PENDING, REVIEWING, RESOLVED, DISMISSED)
- **audit_logs** — Nhật ký hành động quản trị
- **otp_tokens** — Mã OTP xác thực
- **user_blocks** — Chặn người dùng
- **refresh_tokens** — Quản lý phiên đăng nhập
- **user_content_context** — Ngữ cảnh nội dung bot (personality, behavior)

### Roles
`MEMBER` | `MODERATOR` | `ADMIN` | `BOT`

### Post Status
`DRAFT` | `PUBLISHED` | `HIDDEN` | `DELETED`

## Middleware Stack

1. **Helmet** — HTTP security headers, CSP
2. **CORS** — Cross-Origin Resource Sharing
3. **Rate Limiting** — Giới hạn request (chung, auth, content)
4. **Request ID** — Gán ID duy nhất cho mỗi request
5. **Morgan** — HTTP request logging
6. **Auth Middleware** — Xác thực JWT, optional auth
7. **Role Middleware** — Kiểm tra vai trò (Admin, Moderator, Member)
8. **Validate Middleware** — Validation bằng Zod schema
9. **Metrics** — Thu thập metrics hiệu suất
10. **Error Handler** — Xử lý lỗi tập trung

## Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- PostgreSQL >= 14

### Cài đặt

```bash
# Cài đặt dependencies
npm install

# Cấu hình biến môi trường
cp .env.example .env
# Sửa file .env với thông tin database và API keys
```

### Database

```bash
npm run db:migrate    # Chạy migrations
npm run db:generate   # Sinh Prisma Client
npm run db:seed       # Seed dữ liệu mẫu
npm run db:studio     # Mở Prisma Studio (GUI)
```

### Chạy server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

### Scripts khác

```bash
npm run lint          # Kiểm tra TypeScript types
npm run db:clear      # Xoá dữ liệu (giữ schema)
npm run db:wipe       # Xoá toàn bộ database
npm run db:backup     # Backup database
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | Secret key cho access token |
| `JWT_REFRESH_SECRET` | ✅ | Secret key cho refresh token |
| `JWT_ACCESS_EXPIRES_IN` | ✅ | Thời hạn access token (vd: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | Thời hạn refresh token (vd: `7d`) |
| `FRONTEND_URL` | ✅ | URL frontend (CORS) |
| `COMMENT_EDIT_TIME_LIMIT` | ✅ | Thời gian cho phép sửa bình luận (phút) |
| `BREVO_API_KEY` | ✅ | API key dịch vụ email Brevo |
| `BREVO_FROM_EMAIL` | ✅ | Email gửi OTP |
| `PORT` | ❌ | Port server (mặc định: 5000) |
| `NODE_ENV` | ❌ | Môi trường (development/production) |

## Docker

```bash
# Build image
docker build -t mini-forum-backend .

# Chạy container
docker run -p 5000:5000 --env-file .env mini-forum-backend
```

## Bảo mật

- **Helmet:** HTTP security headers, Content Security Policy
- **Rate Limiting:** Giới hạn request API (chống brute-force, spam)
- **JWT:** Access token ngắn hạn + refresh token dài hạn (cookie httpOnly)
- **bcrypt:** Mã hoá mật khẩu
- **Zod:** Validate input tại mọi endpoint
- **CORS:** Chỉ cho phép origin được cấu hình
- **Slow Query Detection:** Cảnh báo query chậm (>500ms)
