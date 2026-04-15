# Backend Service

## Tổng quan

API server trung tâm của hệ thống Mini Forum. Xử lý toàn bộ logic nghiệp vụ, xác thực, phân quyền, quản lý dữ liệu và là điểm giao tiếp duy nhất giữa client và database.

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express 4.21 |
| ORM | Prisma 5.22 |
| Language | TypeScript 5.6 |
| Auth | JWT (access + refresh token), Bcrypt |
| Validation | Zod 3.24 |
| Email | Brevo API v3 |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |
| Testing | Jest 30, Supertest 7 |

## Cấu trúc thư mục

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   ├── seed.ts                # Seed data
│   └── migrations/            # Migration history
├── src/
│   ├── app.ts                 # Express config (middleware, routes, security)
│   ├── index.ts               # Entry point (server start, graceful shutdown)
│   ├── config/
│   │   ├── index.ts           # Biến môi trường, JWT config, CORS, OTP settings
│   │   └── database.ts        # Prisma singleton
│   ├── constants/
│   │   └── roles.ts           # Role hierarchy (MEMBER=1, MODERATOR=2, ADMIN=3, BOT=1)
│   ├── controllers/           # Request handlers (13 files)
│   ├── services/              # Business logic (16 files)
│   ├── middlewares/            # Auth, validation, error handling
│   ├── routes/                # Route definitions (14 files)
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   └── validations/           # Zod schemas
├── scripts/
│   ├── backupDb.ts            # Database backup
│   ├── clearData.ts           # Clear data (giữ structure)
│   └── wipeAllDb.ts           # Xóa toàn bộ database
├── Dockerfile                 # Multi-stage production build
└── docker-entrypoint.sh       # Migration + start script
```

## API Routes

Tất cả endpoint đặt dưới prefix `/api/v1`.

| Route file | Prefix | Mô tả |
|---|---|---|
| `authRoutes` | `/auth` | Đăng ký, đăng nhập, refresh token, OTP, reset password |
| `postRoutes` | `/posts` | CRUD bài viết, featured, latest |
| `commentRoutes` | `/comments` | CRUD bình luận, nested threads |
| `categoryRoutes` | `/categories` | CRUD danh mục |
| `tagRoutes` | `/tags` | CRUD thẻ |
| `userRoutes` | `/users` | Hồ sơ, reputation, vote history |
| `voteRoutes` | `/votes` | Upvote/downvote bài viết và bình luận |
| `bookmarkRoutes` | `/bookmarks` | Bookmark bài viết |
| `searchRoutes` | `/search` | Full-text search |
| `notificationRoutes` | `/notifications` | Quản lý thông báo |
| `blockReportRoutes` | `/blocks`, `/reports` | Chặn user, báo cáo vi phạm |
| `adminRoutes` | `/admin` | Thao tác quản trị (bulk operations) |
| `configRoutes` | `/config` | Lấy cấu hình công khai (categories, tags) |

**Health check:** `GET /ping`, `GET /health`

## Database Schema

Schema PostgreSQL gồm 15 model chính:

- **users** — Thông tin người dùng, role (MEMBER/MODERATOR/ADMIN/BOT), reputation, verification status
- **posts** — Bài viết với status (PUBLISHED/DRAFT/HIDDEN/DELETED), hỗ trợ pin (GLOBAL/CATEGORY)
- **comments** — Bình luận nested, hỗ trợ quoted reply, giới hạn thời gian sửa
- **categories** — Danh mục với permission level và sort order
- **tags** — Thẻ với permission level và usage count
- **post_tags** — Quan hệ many-to-many giữa post và tag
- **votes** — Vote trên post hoặc comment (upvote/downvote)
- **bookmarks** — Bookmark bài viết
- **notifications** — Thông báo (COMMENT, REPLY, MENTION, UPVOTE, SYSTEM)
- **audit_logs** — Ghi lại mọi hành động (CREATE, UPDATE, DELETE, LOGIN, PIN, LOCK, BAN, etc.)
- **reports** — Báo cáo vi phạm với status workflow (PENDING → REVIEWING → RESOLVED/DISMISSED)
- **user_blocks** — Chặn giữa người dùng
- **refresh_tokens** — Lưu refresh token
- **otp_tokens** — Mã OTP cho đăng ký và reset password
- **user_content_context** — Dữ liệu personality của bot user (dùng bởi Vibe-Content)

## Xác thực & Phân quyền

### JWT Flow

1. Đăng nhập → Backend trả về `accessToken` (15 phút) + `refreshToken` (7 ngày)
2. Client gửi `Authorization: Bearer <accessToken>` trong mỗi request
3. Khi access token hết hạn → Client gọi `/auth/refresh` với refresh token
4. Refresh token lưu trong database (`refresh_tokens` table), hỗ trợ revoke

### Role Hierarchy

```
MEMBER (1) < MODERATOR (2) < ADMIN (3)
BOT (1) — ngang hàng MEMBER, không có quyền quản trị
```

Hàm `hasPermission(userRole, requiredRole)` so sánh numeric level.

## Security

- **Helmet**: Content Security Policy, HSTS, và các HTTP security headers
- **CORS**: Whitelist cụ thể từ `FRONTEND_URL` (nhiều origin, phân cách bằng dấu phẩy)
- **Rate limiting**: Giới hạn request/IP
- **Body parser**: Giới hạn payload 10MB
- **Response transform**: Tự động `snake_case` → `camelCase` trong response JSON
- **Password**: Bcrypt hashing
- **Input validation**: Zod schema ở mọi endpoint nhận dữ liệu

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | Có | PostgreSQL connection string |
| `DIRECT_URL` | Có | Direct database URL (cho Prisma migrate) |
| `JWT_ACCESS_SECRET` | Có | Secret key cho access token |
| `JWT_REFRESH_SECRET` | Có | Secret key cho refresh token |
| `JWT_ACCESS_EXPIRES_IN` | Không | Thời hạn access token (mặc định: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Không | Thời hạn refresh token (mặc định: 7d) |
| `FRONTEND_URL` | Có | URL frontend, phân cách bằng dấu phẩy (CORS) |
| `BREVO_API_KEY` | Có | API key dịch vụ email Brevo |
| `BREVO_FROM_EMAIL` | Có | Email gửi OTP |
| `BREVO_FROM_NAME` | Có | Tên hiển thị email |
| `PORT` | Không | Port server (mặc định: 5000) |
| `COMMENT_EDIT_TIME_LIMIT` | Không | Giới hạn thời gian sửa bình luận (mặc định: 30 phút) |
| `OTP_LENGTH` | Không | Độ dài mã OTP (mặc định: 6) |
| `OTP_EXPIRATION_MINUTES` | Không | Thời hạn OTP (mặc định: 10 phút) |
| `OTP_MAX_ATTEMPTS` | Không | Số lần thử OTP tối đa (mặc định: 5) |
| `OTP_RESEND_DELAY_SECONDS` | Không | Delay giữa các lần gửi OTP (mặc định: 60s) |

## Scripts

```bash
# Phát triển
npm run dev              # Chạy với nodemon (hot reload)

# Build & Production
npm run build            # Compile TypeScript → JavaScript
npm start                # Chạy bản build production

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Chạy migration
npm run db:push          # Push schema trực tiếp (dev only)
npm run db:seed          # Seed data
npm run db:reset         # Reset database
npm run db:backup        # Backup database

# Testing
npm test                 # Chạy test
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

## Docker

Multi-stage build (3 stages):
1. **deps**: Cài production dependencies + compile native modules (bcrypt, OpenSSL)
2. **builder**: Compile TypeScript, generate Prisma client
3. **production**: Runtime tối giản, chạy dưới user `appuser` (unprivileged)

`docker-entrypoint.sh` tự động chạy `prisma migrate deploy` trước khi khởi động server.

## Tương tác với các Service khác

| Service | Hướng | Chi tiết |
|---|---|---|
| Frontend | ← nhận request | REST API `/api/v1/*`, JWT auth |
| Admin-Client | ← nhận request | REST API `/api/v1/*` + admin routes, yêu cầu role ADMIN/MODERATOR |
| Vibe-Content | ← nhận request | REST API — bot đăng nhập và tạo nội dung qua API |
| PostgreSQL | → ghi/đọc | Chủ sở hữu schema, toàn quyền |
| Brevo API | → gửi request | Gửi email OTP |
