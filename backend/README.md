# Mini Forum — Backend

> **Version**: v1.16.0  
> **Last Updated**: 2026-02-25

REST API Server — Node.js + Express + TypeScript + Prisma ORM.

---

## Tech Stack

| Package | Version | Mục đích |
|---------|:-------:|----------|
| express | 4.21.1 | Web framework |
| @prisma/client | 5.22.0 | Database ORM |
| jsonwebtoken | 9.0.2 | JWT authentication |
| bcrypt | 5.1.1 | Password hashing |
| zod | 3.24.1 | Request validation |
| helmet | 8.0.0 | Security headers |
| express-rate-limit | 7.4.1 | Rate limiting |
| cors | 2.8.5 | Cross-origin support |
| morgan | 1.10.0 | HTTP logging |

---

## Cấu trúc thư mục

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (13 models, 11 enums)
│   ├── seed.ts                # Seed data
│   └── migrations/            # Migration files
├── src/
│   ├── index.ts               # Entry point — server startup
│   ├── app.ts                 # Express app configuration
│   ├── config/
│   │   ├── index.ts           # Centralized config (env validation)
│   │   └── database.ts        # Prisma client singleton
│   ├── constants/
│   │   └── roles.ts           # Role definitions & hierarchy
│   ├── controllers/           # 12 request handlers
│   ├── services/              # 13 business logic files
│   ├── middlewares/            # 5 middleware files
│   ├── routes/                # 13 route definitions
│   ├── validations/           # 10 Zod schemas
│   └── utils/                 # 4 helper files
├── scripts/
│   └── clearData.ts           # Clear database script
├── package.json
├── tsconfig.json              # TypeScript strict mode
└── nodemon.json               # Dev server config
```

---

## Architecture

### Layered Architecture (Request Flow)

```
Request
  → Helmet → CORS → Body Parser → Input Sanitization → Rate Limiting
  → Route matching
  → [Auth Middleware — JWT verification]
  → [Validation Middleware — Zod schema]
  → Controller (handle request)
  → Service (business logic)
  → Prisma ORM (database queries)
  → Response (JSON)
```

### Controllers (12 files)

| File | Module | Endpoints |
|------|--------|:---------:|
| authController.ts | Register, Login, Refresh, Logout | 8 |
| userController.ts | Profile, Update, Posts, Comments | 10 |
| postController.ts | CRUD, Pin, Lock, Featured | 13 |
| commentController.ts | CRUD, Replies, Hide | 5 |
| voteController.ts | Post/Comment vote | 7 |
| bookmarkController.ts | Bookmark CRUD | 5 |
| searchController.ts | Search posts, users | 3 |
| notificationController.ts | Notifications CRUD | 7 |
| blockReportController.ts | Block, Report | 11 |
| categoryController.ts | Categories CRUD | 7 |
| tagController.ts | Tags CRUD | 8 |
| adminController.ts | Dashboard, Management | 31 |

### Services (13 files)

| File | Business logic |
|------|---------------|
| authService.ts | JWT token management, register, login |
| userService.ts | User CRUD, profile |
| postService.ts | Post CRUD, permissions, filtering |
| commentService.ts | Nested comments, quote reply, edit time |
| voteService.ts | Polymorphic vote (POST/COMMENT) |
| bookmarkService.ts | Bookmark toggle |
| searchService.ts | Full-text search + filters |
| notificationService.ts | Create/read/soft-delete notifications |
| blockService.ts | User blocking logic |
| reportService.ts | Report handling |
| categoryService.ts | Category management |
| tagService.ts | Tag operations |
| auditLogService.ts | Admin action logging |

### Middlewares (5 files)

| File | Chức năng |
|------|----------|
| authMiddleware.ts | JWT verification, attach user to request |
| roleMiddleware.ts | RBAC — check role >= required |
| validateMiddleware.ts | Zod schema validation (body, query, params) |
| securityMiddleware.ts | Rate limiting, input sanitization |
| errorMiddleware.ts | Global error handler |

---

## Cách chạy

### Yêu cầu

- Node.js >= 20.x
- PostgreSQL 15+ (hoặc Docker)

### Cài đặt

```bash
npm install
cp .env.example .env           # Cấu hình DATABASE_URL + JWT secrets
npm run db:generate            # Generate Prisma Client
npm run db:migrate             # Chạy migrations
npm run db:seed                # Seed dữ liệu mẫu (tùy chọn)
npx prisma migrate reset --force  #clear
```

### Scripts

| Script | Lệnh | Mô tả |
|--------|------|-------|
| `dev` | `nodemon` | Development với hot reload |
| `build` | `tsc` | Build TypeScript |
| `start` | `node dist/index.js` | Production |
| `db:generate` | `prisma generate` | Generate Prisma Client |
| `db:migrate` | `prisma migrate dev` | Tạo + chạy migration |
| `db:push` | `prisma db push` | Push schema (no migration) |
| `db:studio` | `prisma studio` | GUI tại http://localhost:5555 |
| `db:seed` | `tsx prisma/seed.ts` | Seed dữ liệu mẫu |

### Development

```bash
npm run dev
# → ✅ Database connected successfully
# → 🚀 Server is running on http://localhost:5000
# → Health: GET http://localhost:5000/api/v1/health
```

---

## Environment Variables

```dotenv
PORT=5000                        # HTTP server port
NODE_ENV=development             # development | production
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_forum?schema=public"
JWT_ACCESS_SECRET=<min 32 chars> # Access token secret
JWT_REFRESH_SECRET=<min 32 chars># Refresh token secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173,http://localhost:5174
COMMENT_EDIT_TIME_LIMIT=30       # Phút giới hạn edit comment
```

---

## API Overview

**Base URL**: `http://localhost:5000/api/v1` — **116 endpoints**

| Prefix | Module | Endpoints |
|--------|--------|:---------:|
| /auth | Authentication | 8 |
| /users | User Management | 10 |
| /posts | Posts | 13 |
| /comments | Comments | 5 |
| /categories | Categories | 7 |
| /tags | Tags | 8 |
| /search | Search | 3 |
| /notifications | Notifications | 7 |
| /admin | Administration | 31 |
| (root-mounted) | Vote, Bookmark, Block, Report | 24 |

> Chi tiết: [docs/03-API/](../docs/03-API/README.md)

---

## Security

- **JWT**: Access (15m) + Refresh (7d), HS256
- **RBAC**: MEMBER, MODERATOR, ADMIN
- **Rate Limiting**: API 300/15m, Auth 10/15m, Content 5/1m, Vote/Search 30/1m
- **Input Validation**: Zod schemas cho tất cả inputs
- **Sanitization**: XSS prevention, NoSQL injection protection
- **Headers**: Helmet (CSP, X-Frame-Options, HSTS, etc.)
- **Password**: bcrypt (salt rounds: 10)
- **Audit**: AuditLog model (15 action types)

> Chi tiết: [docs/09-SECURITY.md](../docs/09-SECURITY.md)

---

## Ghi chú kỹ thuật

1. **ESM Modules**: `"type": "module"` — imports cần đuôi `.js`
2. **TypeScript Strict**: `strict: true`, `noImplicitAny: true`
3. **Polymorphic Vote**: Table `votes` với `targetType` (POST/COMMENT), counters denormalized
4. **Comment Edit Time**: Configurable qua env (default 30 phút)
5. **Soft Delete**: Posts/Comments dùng status, Notifications dùng deletedAt
6. **Graceful Shutdown**: SIGINT/SIGTERM handlers trong index.ts

---

## Liên kết

- [Kiến trúc hệ thống](../docs/01-ARCHITECTURE.md)
- [Database Schema](../docs/02-DATABASE.md)
- [API Reference](../docs/03-API/README.md)
- [Deployment Guide](../docs/07-DEPLOYMENT.md)
