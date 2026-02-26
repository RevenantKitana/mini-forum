# System Architecture — Mini Forum

> **Version**: v1.16.0  
> **Last Updated**: 2026-02-25

## Mục đích

Tài liệu kiến trúc tổng thể hệ thống Mini Forum — mô tả các thành phần, giao tiếp, và tech stack.

## Table of Contents

- [1. Tổng Quan](#1-tổng-quan)
- [2. Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
- [3. Tech Stack](#3-tech-stack)
- [4. Data Flow](#4-data-flow)
- [5. Giao Tiếp Giữa Các Thành Phần](#5-giao-tiếp-giữa-các-thành-phần)
- [6. Cấu Trúc Dự Án](#6-cấu-trúc-dự-án)
- [7. Đối Tượng Người Dùng](#7-đối-tượng-người-dùng)

---

## 1. Tổng Quan

Mini Forum là nền tảng thảo luận trực tuyến Full Stack, hoàn thành 4 Phase phát triển với trạng thái **MVP hoàn chỉnh**.

| Phase | Tên | Trạng thái |
|-------|-----|------------|
| Phase 1 | Foundation (Nền tảng) | ✅ Hoàn thành |
| Phase 2 | Core Features (Tính năng cốt lõi) | ✅ Hoàn thành |
| Phase 3 | Advanced Features (Tính năng nâng cao) | ✅ Hoàn thành |
| Phase 4 | Admin & Polish | ✅ Hoàn thành |

**Tổng cộng: 55/55 tasks hoàn thành (100%)**

---

## 2. Kiến Trúc Hệ Thống

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├───────────────────────────┬─────────────────────────────────────┤
│    Frontend (User)        │        Admin Client                  │
│    Port: 5173             │        Port: 5174                    │
│    React 18 + Vite 6      │        React 18 + Vite 5             │
│    TailwindCSS v4         │        TailwindCSS v3                │
│    React Router v7        │        React Router v6               │
└───────────────────────────┴─────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS (REST API)
                            │ JWT Bearer Token Authentication
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                             │
│                        Port: 5000                                │
├─────────────────────────────────────────────────────────────────┤
│  Node.js 20.x + Express.js 4.x + TypeScript 5.x (strict)      │
│  ├── Routes          → Định tuyến API                           │
│  ├── Middlewares      → Auth, Validation, Security, Error       │
│  ├── Controllers      → Xử lý request (12 controllers)         │
│  ├── Services         → Business logic (13 services)            │
│  ├── Validations      → Zod schemas (10 files)                  │
│  └── Utils            → JWT, Error classes, Response format     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM (type-safe queries)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                             │
│                       PostgreSQL                                 │
├─────────────────────────────────────────────────────────────────┤
│   13 Models: User, Post, Comment, Category, Tag, PostTag,       │
│   Vote, Bookmark, Notification, UserBlock, Report,              │
│   RefreshToken, AuditLog                                         │
│   11 Enums: Role, PostStatus, CommentStatus, ...                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Layered Architecture (Backend)

Backend sử dụng kiến trúc phân tầng (Layered Architecture):

```
Request
    ↓
┌─────────────────┐
│ Security Layer   │  Helmet, CORS, Rate Limiting, Input Sanitization
└────────┬────────┘
         ↓
┌─────────────────┐
│ Routing Layer    │  Route matching → /api/v1/*
└────────┬────────┘
         ↓
┌─────────────────┐
│ Middleware Layer  │  Auth (JWT) → Role Check → Zod Validation
└────────┬────────┘
         ↓
┌─────────────────┐
│ Controller Layer │  Handle request, delegate to service
└────────┬────────┘
         ↓
┌─────────────────┐
│ Service Layer    │  Business logic, data transformation
└────────┬────────┘
         ↓
┌─────────────────┐
│ Data Layer       │  Prisma ORM → PostgreSQL
└─────────────────┘
         ↓
    Response (JSON)
```

---

## 3. Tech Stack

### 3.1 Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | Express.js | 4.21.1 |
| Language | TypeScript | 5.x (strict mode) |
| ORM | Prisma | 5.22.0 |
| Database | PostgreSQL | 15+ |
| Auth | jsonwebtoken | 9.0.2 |
| Password | bcrypt + bcryptjs | 5.1.1 / 3.0.3 |
| Validation | Zod | 3.24.1 |
| Security | Helmet + express-rate-limit | 8.0.0 / 7.4.1 |
| Logging | Morgan | 1.10.0 |

### 3.2 Frontend (User Client)

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18.3.1 |
| Build Tool | Vite | 6.3.5 |
| Language | TypeScript | 5.x |
| Styling | TailwindCSS + Shadcn/UI + MUI | 4.1.12 |
| State | TanStack Query | 5.90.20 |
| Forms | React Hook Form + Zod | 7.55.0 / 4.3.6 |
| Router | React Router DOM | 7.13.0 |
| HTTP | Axios | 1.13.4 |
| Animation | motion (Framer Motion) | 12.23.24 |
| Charts | Recharts | 2.15.2 |
| Icons | Lucide React + MUI Icons | 0.487.0 / 7.3.5 |
| Toast | Sonner | 2.0.3 |

### 3.3 Admin Client

| Component | Technology | Version | Ghi chú |
|-----------|-----------|--------|--------|
| Framework | React | 18.2.0 | |
| Build Tool | Vite | 5.x | |
| Styling | TailwindCSS + Shadcn/UI + Radix UI | 3.4.1 | |
| Router | React Router DOM | 6.21.2 | |
| HTTP | Axios | 1.6.5 | |
| Toast | Sonner | 1.3.1 | |
| Icons | Lucide React | 0.312.0 | |

> **Lưu ý**: Admin Client sử dụng pattern `useState` + `useEffect` + Axios cho data fetching (không dùng TanStack Query hooks). Một số dependencies được khai báo trong `package.json` nhưng chưa sử dụng trong code: `@tanstack/react-query`, `@tanstack/react-table`, `recharts`, `react-hook-form`, `zod`, `date-fns`.

---

## 4. Data Flow

### 4.1 Authentication Flow

```
User                    Frontend                  Backend                 Database
 │                        │                         │                       │
 ├── Login ──────────────►│                         │                       │
 │                        ├── POST /auth/login ────►│                       │
 │                        │                         ├── Verify password ───►│
 │                        │                         │◄── User record ───────┤
 │                        │                         ├── Generate JWT pair   │
 │                        │                         ├── Store refresh ─────►│
 │                        │◄── { accessToken,       │                       │
 │                        │     refreshToken } ─────┤                       │
 │◄── Login success ──────┤                         │                       │
 │                        │                         │                       │
 ├── API Request ────────►│                         │                       │
 │                        ├── Authorization:        │                       │
 │                        │   Bearer <token> ──────►│                       │
 │                        │                         ├── Verify JWT          │
 │                        │                         ├── Query data ────────►│
 │                        │◄── Response data ───────┤◄─────────────────────┤
 │◄── Display data ───────┤                         │                       │
 │                        │                         │                       │
 │                        │  (Token expired)        │                       │
 │                        ├── POST /auth/refresh ──►│                       │
 │                        │                         ├── Verify refresh ────►│
 │                        │◄── New token pair ──────┤                       │
```

### 4.2 Post Creation Flow

```
User → CreatePostDialog → postService.createPost() → POST /posts
    → Auth Middleware → Validate Middleware (Zod)
    → PostController.create → PostService.create
    → Prisma.posts.create → PostgreSQL
    → Response → Invalidate TanStack Query cache → Update UI
```

### 4.3 Vote Flow

```
User → Click VoteButton → useVotes.mutate()
    → Optimistic Update (UI) → POST /posts/:id/vote
    → VoteController → VoteService (toggle logic, self-vote check)
    → Update vote counts + reputation → Response
    → Confirm or rollback optimistic update
```

---

## 5. Giao Tiếp Giữa Các Thành Phần

### 5.1 Frontend ↔ Backend

| Aspect | Detail |
|--------|--------|
| Protocol | REST API over HTTP |
| Base Path | `/api/v1` |
| Auth | JWT Access Token via `Authorization: Bearer <token>` |
| Token Refresh | Automatic via interceptor khi access token hết hạn |
| Token Storage | `localStorage` (prefix: `forum_`) |
| State Sync | TanStack Query (caching, refetching, optimistic updates) |

### 5.2 Admin Client ↔ Backend

| Aspect | Detail |
|--------|--------|
| Protocol | Same REST API |
| Auth | Same JWT mechanism, **role check required** (MODERATOR/ADMIN) |
| Token Storage | `localStorage` (prefix: `admin_`) — tách biệt hoàn toàn |
| Proxy | Vite proxy `/api` → `http://localhost:5000` trong dev |

### 5.3 Backend ↔ Database

| Aspect | Detail |
|--------|--------|
| ORM | Prisma Client (singleton instance) |
| Queries | Type-safe, parameterized (chống SQL injection) |
| Migrations | `prisma migrate dev` / `prisma migrate deploy` |
| Connection | Connection pool tự quản lý bởi Prisma |

---

## 6. Cấu Trúc Dự Án

```
DA-mini-forum/
├── backend/              # API Server (Node.js + Express + TypeScript)
│   ├── prisma/           #   Database schema, migrations, seed
│   ├── src/              #   Source code (controllers, services, routes, ...)
│   └── README.md         #   Backend development guide
│
├── frontend/             # User Client (React + TypeScript + Vite)
│   ├── src/              #   Source code (pages, components, hooks, ...)
│   └── README.md         #   Frontend development guide
│
├── admin-client/         # Admin Dashboard (React + TypeScript + Vite)
│   ├── src/              #   Source code (pages, components, ...)
│   └── README.md         #   Admin development guide
│
├── docs/                 # Documentation
│   ├── 01-ARCHITECTURE.md    # ← Bạn đang đây
│   ├── 02-DATABASE.md        # Database schema
│   ├── 03-API/               # API Reference (split by domain)
│   ├── 04-FEATURES.md        # Feature matrix
│   ├── 05-CHANGELOG.md       # Version history
│   ├── 06-ROADMAP.md         # Status & roadmap
│   ├── 07-DEPLOYMENT.md      # Production deployment
│   ├── 08-TESTING.md         # Testing strategy
│   └── 09-SECURITY.md        # Security checklist
│
├── docker-compose.yml    # PostgreSQL container
└── README.md             # Project landing page
```

---

## 7. Đối Tượng Người Dùng

| Actor | Mô tả | Quyền hạn |
|-------|-------|-----------|
| **Guest** | Khách vãng lai chưa đăng ký | Xem bài viết công khai, tìm kiếm, đăng ký tài khoản |
| **Member** | Thành viên đã đăng ký | Đăng bài, bình luận, vote, bookmark, quản lý profile |
| **Moderator** | Người kiểm duyệt | Quản lý nội dung, ẩn/xóa bài viết vi phạm, ghim bài |
| **Admin** | Quản trị viên | Toàn quyền hệ thống, quản lý user, category, tag, settings |

### Permission Matrix

| Action | Guest | Member | Moderator | Admin |
|--------|-------|--------|-----------|-------|
| View public posts | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ |
| Register/Login | ✅ | — | — | — |
| Create post/comment | ❌ | ✅ | ✅ | ✅ |
| Vote | ❌ | ✅ | ✅ | ✅ |
| Bookmark | ❌ | ✅ | ✅ | ✅ |
| Block/Report | ❌ | ✅ | ✅ | ✅ |
| Pin/Lock posts | ❌ | ❌ | ✅ | ✅ |
| Hide content | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ⚠️ View + Ban | ✅ |
| Manage categories | ❌ | ❌ | ❌ | ✅ |
| Manage tags | ❌ | ❌ | ✅ | ✅ |
| Change roles | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ |

---

**Xem thêm**:
- [Database Schema](./02-DATABASE.md)
- [API Reference](./03-API/)
- [Feature Matrix](./04-FEATURES.md)
