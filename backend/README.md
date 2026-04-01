# Backend — Mini Forum API

REST API server cho hệ thống Mini Forum, xây dựng trên Node.js + Express + TypeScript với PostgreSQL qua Prisma ORM.

## Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Node.js | >= 18 | Runtime |
| Express.js | 4.21.1 | Web framework |
| TypeScript | 5.6.3 | Type safety |
| Prisma | 5.22.0 | ORM + migrations |
| PostgreSQL | >= 14 | Database |
| Zod | 3.24.1 | Input validation |
| JWT | 9.0.2 | Authentication |
| bcrypt | 5.1.1 | Password hashing |
| SendGrid | 8.1.3 | Email (OTP) |
| Jest | - | Testing |
| Helmet | - | Security headers |

## Cài đặt

```bash
cd backend
npm install
cp .env.example .env  # Tạo và cấu hình file .env
```

## Biến môi trường

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mini_forum?schema=public

# JWT (tối thiểu 32 ký tự)
JWT_ACCESS_SECRET=your-access-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173,http://localhost:5174

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Mini Forum

# OTP
OTP_LENGTH=6
OTP_EXPIRATION_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_DELAY_SECONDS=60

# Comments
COMMENT_EDIT_TIME_LIMIT=30
```

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server với nodemon (auto-reload) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Chạy production server (`dist/index.js`) |
| `npm test` | Chạy tất cả tests |
| `npm run test:watch` | Chạy tests ở chế độ watch |
| `npm run test:coverage` | Chạy tests với coverage report |
| `npm run test:unit` | Chạy unit tests |
| `npm run test:integration` | Chạy integration tests |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Chạy migrations (dev) |
| `npm run db:push` | Push schema trực tiếp (không tạo migration) |
| `npm run db:studio` | Mở Prisma Studio GUI |
| `npm run db:seed` | Seed dữ liệu ban đầu |
| `npm run db:clear` | Xóa toàn bộ dữ liệu |
| `npm run db:reset` | Clear + seed lại dữ liệu |

## Cấu trúc thư mục

```
backend/
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   ├── seed.ts               # Seed data script
│   └── migrations/           # Migration history
├── scripts/
│   └── clearData.ts          # Script xóa dữ liệu
├── src/
│   ├── app.ts                # Express app setup (middleware, routes, error handling)
│   ├── index.ts              # Server entry point
│   ├── config/
│   │   ├── index.ts          # Tập trung env config
│   │   ├── database.ts       # Prisma client singleton
│   │   └── email.ts          # SMTP/Nodemailer config
│   ├── constants/
│   │   └── roles.ts          # Role hierarchy definitions
│   ├── controllers/          # Request handlers (13 controllers)
│   │   ├── authController.ts
│   │   ├── postController.ts
│   │   ├── commentController.ts
│   │   ├── userController.ts
│   │   ├── categoryController.ts
│   │   ├── tagController.ts
│   │   ├── voteController.ts
│   │   ├── bookmarkController.ts
│   │   ├── searchController.ts
│   │   ├── notificationController.ts
│   │   ├── blockReportController.ts
│   │   ├── adminController.ts
│   │   └── configController.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts     # JWT authentication
│   │   ├── roleMiddleware.ts     # RBAC authorization
│   │   ├── validateMiddleware.ts # Zod schema validation
│   │   ├── errorMiddleware.ts    # Global error handler
│   │   └── securityMiddleware.ts # Helmet, CORS, rate limiting
│   ├── routes/               # API route definitions (14 files)
│   ├── services/             # Business logic layer (15 services)
│   ├── utils/
│   │   ├── jwt.ts            # Token generation/verification
│   │   ├── errors.ts         # Custom error classes
│   │   ├── response.ts       # Standardized API responses
│   │   ├── slug.ts           # URL slug generation
│   │   └── snakeToCamel.ts   # Case conversion utility
│   ├── validations/          # Zod schemas cho tất cả inputs
│   └── __tests__/            # Unit + integration tests
├── Dockerfile                # Production Docker image
├── docker-entrypoint.sh      # Container startup script
├── jest.config.js            # Jest configuration
├── nodemon.json              # Dev server config
├── tsconfig.json             # TypeScript config
└── package.json
```

## Kiến trúc

### Luồng xử lý Request

```
Client Request
    │
    ▼
┌─────────────────────┐
│  Security Middleware │  Helmet, CORS, Rate Limiting
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Route Matching      │  Express Router
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Auth Middleware      │  JWT verify → req.user
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Role Middleware      │  RBAC check (optional)
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Validate Middleware  │  Zod schema validation
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Controller          │  Extract params, call service
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Service             │  Business logic + Prisma queries
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Response Utility     │  Standardized JSON response
└─────────────────────┘
```

### Hệ thống phân quyền (RBAC)

| Role | Cấp độ | Quyền |
|---|---|---|
| `MEMBER` | 1 | Tạo/sửa nội dung mình, vote, bookmark, báo cáo |
| `MODERATOR` | 2 | + Pin/lock bài, ẩn/hiện nội dung, quản lý reports, tags |
| `ADMIN` | 3 | + Quản lý categories, users, roles, xem audit logs |
| `BOT` | 1 | Tạo nội dung tự động (tương đương MEMBER) |

### Xác thực (Authentication)

- **Access Token**: JWT, hết hạn sau 15 phút (mặc định)
- **Refresh Token**: JWT, hết hạn sau 7 ngày, lưu trong DB
- **OTP**: 6 chữ số, hết hạn sau 10 phút, giới hạn 5 lần thử
- **Password**: bcrypt với 12-round salt

### Rate Limiting

| Endpoint | Giới hạn | Thời gian |
|---|---|---|
| API chung | 300 requests | 15 phút |
| Auth (login) | 10 requests | 15 phút |
| Tạo nội dung | 5 requests | 1 phút |
| Vote | 30 requests | 1 phút |
| Gửi OTP | 3 requests | 5 phút |
| Xác thực OTP | 10 requests | 10 phút |
| Tìm kiếm | 30 requests | 1 phút |

## API Endpoints

Xem chi tiết tại [docs/API_REFERENCE.md](../docs/API_REFERENCE.md).

### Tóm tắt nhóm API

| Nhóm | Base Path | Mô tả |
|---|---|---|
| Auth | `/api/v1/auth` | Đăng ký, đăng nhập, OTP, refresh token |
| Posts | `/api/v1/posts` | CRUD bài viết, pin, lock, status |
| Comments | `/api/v1/comments` | CRUD bình luận, reply chains |
| Users | `/api/v1/users` | Profile, settings, avatar |
| Categories | `/api/v1/categories` | Quản lý danh mục |
| Tags | `/api/v1/tags` | Quản lý tags |
| Votes | `/api/v1/posts/:id/vote` | Vote bài viết & bình luận |
| Bookmarks | `/api/v1/posts/:id/bookmark` | Lưu bài viết |
| Search | `/api/v1/search` | Tìm kiếm bài viết & users |
| Notifications | `/api/v1/notifications` | Thông báo người dùng |
| Reports | `/api/v1/reports` | Báo cáo vi phạm |
| Admin | `/api/v1/admin` | Quản trị hệ thống |
| Config | `/api/v1/config` | Cấu hình công khai |

## Database

Xem schema chi tiết tại [docs/DATABASE.md](../docs/DATABASE.md).

### Models chính

- `users` — Tài khoản người dùng với roles & reputation
- `posts` — Bài viết với categories, tags, voting, pinning
- `comments` — Bình luận lồng nhau, quote, voting
- `categories` — Danh mục với permissions
- `tags` — Tags phân loại nội dung
- `votes` — Upvote/downvote tracking
- `bookmarks` — Bài viết đã lưu
- `notifications` — Thông báo
- `reports` — Báo cáo vi phạm
- `user_blocks` — Block người dùng
- `audit_logs` — Nhật ký hành động admin

## Testing

```bash
# Chạy tất cả tests
npm test

# Unit tests
npm run test:unit

# Integration tests (cần database)
npm run test:integration

# Coverage
npm run test:coverage
```

### Test files hiện có

- `auth.integration.test.ts` — Luồng xác thực
- `utils.errors.test.ts` — Error handling
- `utils.jwt.test.ts` — JWT token utils

## Docker

```bash
# Build image
docker build -t mini-forum-backend .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_ACCESS_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  mini-forum-backend
```

Container tự động chạy `prisma migrate deploy` và `prisma db seed` khi khởi động.
