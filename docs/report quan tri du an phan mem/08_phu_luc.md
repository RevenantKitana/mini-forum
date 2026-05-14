# PHỤ LỤC

---

## Phụ lục A — Bảng công nghệ và phiên bản sử dụng

### A.1 Stack công nghệ đầy đủ

**Bảng A.1 — Toàn bộ công nghệ sử dụng trong dự án MINI-FORUM**

| Công nghệ | Phiên bản | Vai trò | Service | Ghi chú quan trọng |
|-----------|:--------:|---------|:-------:|-------------------|
| **Node.js** | ≥ 18.x LTS | JavaScript runtime | backend, vibe-content | Sử dụng ES Modules + TypeScript; native fetch API |
| **TypeScript** | ~5.x | Type safety toàn codebase | Tất cả | `"strict": true` bật cho tất cả services |
| **Express.js** | 4.x | HTTP web framework | backend | Middleware-based architecture; không dùng Express 5 (stable) |
| **Prisma ORM** | 5.x | Database access layer | backend | Migration versioned, type-safe client generate |
| **PostgreSQL** | ≥ 14 | Relational database | backend | Full-text search với `tsvector`, GIN index; managed trên Render |
| **React** | 18.x | UI framework | frontend, admin-client | Concurrent mode; Suspense; không dùng class components |
| **Vite** | 5.x | Build tool + dev server | frontend, admin-client | HMR < 100ms; TypeScript out-of-the-box; ESBuild |
| **TailwindCSS** | 3.x | Utility-first CSS | frontend | JIT mode; dark mode với `class` strategy |
| **Radix UI** | Latest | Accessible component primitives | admin-client | Headless, WAI-ARIA compliant |
| **shadcn/ui** | Latest | Component library | admin-client | Built on Radix UI + TailwindCSS; copy-paste architecture |
| **TanStack Query (React Query)** | v5 | Async state management | frontend, admin-client | Caching, background refetch, optimistic updates, infinite queries |
| **Zod** | 3.x | Schema validation | backend | Input validation tại API boundary; Zod infer cho TypeScript types |
| **Vitest** | Latest | Unit test framework | backend, frontend | Jest-compatible API; Vite-powered; watch mode |
| **React Testing Library** | Latest | Component testing | frontend | DOM behavior testing; không test implementation details |
| **bcrypt** | Latest | Password hashing | backend | Salt rounds: 12; không dùng bcryptjs (native bindings nhanh hơn) |
| **jsonwebtoken** | Latest | JWT sign + verify | backend | Access token 15 phút; refresh token 7 ngày |
| **Helmet.js** | Latest | HTTP security headers | backend | XSS protection, HSTS, CSP, X-Frame-Options |
| **cors** | Latest | CORS middleware | backend | Whitelist origins cụ thể; không dùng `*` ở production |
| **express-rate-limit** | Latest | Rate limiting | backend | 100 req/15min mặc định; stricter trên auth endpoints |
| **multer** | Latest | File upload middleware | backend | Memory storage → ImageKit upload; file size limit |
| **node-cron** | Latest | Cron job scheduler | vibe-content | Schedule `*/60 * * * *` (mỗi giờ) |
| **Docker** | Latest | Containerization | backend, vibe-content | Multi-stage builds; Alpine base image |
| **ImageKit** | SDK v4 | Media CDN | backend | Upload, transform (resize, quality), signed URLs |
| **Brevo (Sendinblue)** | SMTP API v3 | Transactional email | backend | OTP email; 300 emails/day free tier |
| **Google Gemini** | API v1beta | LLM provider (primary) | vibe-content | `gemini-1.5-flash` model; JSON mode output |
| **Groq** | API | LLM provider (fallback 1) | vibe-content | `llama3-8b-8192`; nhanh nhất, low latency |
| **Cerebras** | API | LLM provider (fallback 2) | vibe-content | `llama3.1-8b`; alternative inference |
| **Nvidia NIM** | API | LLM provider (fallback 3) | vibe-content | `meta/llama-3.1-8b-instruct` |
| **axios** | Latest | HTTP client | frontend, admin-client, vibe-content | Interceptors cho token refresh; base URL config |

### A.2 Công cụ phát triển và hạ tầng

**Bảng A.2 — Công cụ phát triển và hạ tầng triển khai**

| Công cụ / Hạ tầng | Loại | Mục đích | Ghi chú |
|-------------------|:----:|---------|---------|
| **VS Code** | IDE | Development environment chính | Extensions: Prisma, ESLint, REST Client, TypeScript |
| **Git + GitHub** | Version Control | Source code management | Private repository; branching: main + feature branches |
| **REST Client (VS Code)** | API Testing | Test API endpoints với `.http` files | Files commit vào git — documentation sống |
| **Prisma Studio** | DB GUI | Xem và edit data trực quan | `npx prisma studio` — không cần SQL client riêng |
| **Docker Desktop** | Containerization | Build + run containers locally | Test staging environment trước production deploy |
| **Render.com** | Cloud Platform | Deploy backend + vibe-content | Free tier hỗ trợ Node.js, PostgreSQL, auto-deploy from GitHub |
| **Vercel** | Cloud Platform | Deploy frontend + admin-client | CDN tự động, preview deployments cho mỗi PR |
| **npm** | Package Manager | Quản lý dependencies | npm workspaces cho monorepo |
| **ESLint** | Linter | Enforce code style + catch bugs | Config extends `@typescript-eslint/recommended` |
| **Prettier** | Formatter | Auto-format code | Tích hợp với ESLint; format on save |

---

## Phụ lục B — Cấu trúc thư mục dự án

### B.1 Cấu trúc monorepo gốc

```
mini-forum/                    ← Root monorepo
├── package.json               ← Workspace root (scripts tổng)
├── README.md                  ← Hướng dẫn quick start
├── DEPLOYMENT.md              ← Hướng dẫn triển khai chi tiết
├── DB_SETUP.md                ← Thiết lập database
├── DEPLOY_CHECKLIST.md        ← Checklist trước production deploy
├── vercel.json                ← Vercel config (root)
│
├── backend/                   ← Backend REST API service
├── frontend/                  ← User-facing React app
├── admin-client/              ← Admin management panel
└── vibe-content/              ← AI content generation service
```

### B.2 Backend (`backend/`)

```
backend/
├── package.json, tsconfig.json, Dockerfile, docker-entrypoint.sh, vitest.config.ts
├── prisma/
│   ├── schema.prisma       ← 19 models + 12 enums
│   ├── seed.ts
│   └── migrations/         ← 8 versioned migration files
├── scripts/                ← 10 maintenance scripts (backup, cleanup, migrate)
└── src/
    ├── app.ts, index.ts
    ├── controllers/        ← 14 files
    ├── services/           ← 21 files
    ├── routes/             ← 14 files
    ├── middlewares/        ← 9 files (auth, role, security, upload, audit, ...)
    ├── validations/        ← Zod schemas (1 file per entity)
    ├── types/, config/, constants/, utils/
    └── __tests__/          ← 9 Vitest test files
```

### B.3 Frontend (`frontend/`)

```
frontend/
├── index.html, package.json, tsconfig.json, vite.config.ts, vitest.config.ts
└── src/
    ├── main.tsx, App.tsx
    ├── pages/              ← 14 trang React
    ├── components/         ← Shared UI components (PostCard, BlockRenderer, BlockEditor, ...)
    ├── api/                ← React Query hooks
    ├── contexts/           ← AuthContext
    ├── hooks/              ← useSSE, useInfiniteScroll, ...
    ├── routes/, types/, utils/
    └── __tests__/          ← Vitest + RTL test files
```

### B.4 Admin Panel (`admin-client/`)

```
admin-client/
├── index.html, package.json, tsconfig.json, vite.config.ts, components.json
└── src/
    ├── main.tsx, App.tsx
    ├── pages/              ← 12 trang quản trị (Dashboard, Users, Posts, Reports, AuditLogs, ...)
    ├── components/         ← DataTable, Charts, shared admin UI
    └── api/                ← API hooks cho admin endpoints
```

### B.5 AI Bot (`vibe-content/`)

```
vibe-content/
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-entrypoint.sh
│
├── prisma/                    ← Read-only access to forum DB
│   └── schema.prisma          ← Subset schema (users, posts, comments, categories)
│
├── prompts/                   ← LLM prompt templates
│   ├── generate-post.txt
│   ├── generate-comment.txt
│   └── vote-decision.txt
│
├── seed/                      ← Bot personality definitions
│   └── personalities.json
│
└── src/
    ├── index.ts               ← Entry: bootstrap scheduler + services
    │
    ├── services/              ← 9 core services
    │   ├── PersonalityService.ts      ← Load + manage bot personalities
    │   ├── ContentGeneratorService.ts ← Orchestrate LLM calls
    │   ├── PromptBuilderService.ts    ← Build context-aware prompts
    │   ├── ActionSelectorService.ts   ← Choose appropriate action (post/comment/vote)
    │   ├── ContextGathererService.ts  ← Fetch forum context (trending, recent)
    │   ├── APIExecutorService.ts      ← Call backend REST API
    │   ├── StatusService.ts           ← Track bot run status
    │   ├── ValidationService.ts       ← Validate generated content quality
    │   └── llm/                       ← 4 LLM adapters
    │       ├── geminiAdapter.ts       ← Google Gemini (primary)
    │       ├── groqAdapter.ts         ← Groq (fallback 1)
    │       ├── cerebrasAdapter.ts     ← Cerebras (fallback 2)
    │       └── nvidiaAdapter.ts       ← Nvidia NIM (fallback 3)
    │
    ├── scheduler/             ← Cron job definitions
    │   └── botScheduler.ts    ← node-cron: mỗi giờ trigger bot run
    │
    ├── tracking/              ← Action tracking + metrics
    ├── config/                ← Bot config, constants
    └── types/                 ← TypeScript types
```

---

## Phụ lục C — 19 Models trong Prisma Schema

### C.1 Tổng quan quan hệ giữa các models

**Hình C.1 — Entity-Relationship Diagram (ERD) — MINI-FORUM**

> *Mô tả hình:* ERD thể hiện 19 models và quan hệ giữa chúng. `users` là entity trung tâm quan hệ với hầu hết các bảng khác. `posts` quan hệ một-nhiều với `post_blocks`, `post_media`, `comments`, `votes`, `bookmarks`, `reports`, `post_tags`. `comments` có self-referential qua `parent_id` (nested) và `quote_comment_id`. `votes` polymorphic cho cả posts và comments.

```
                        ┌─────────────────┐
                        │     users       │
                        │─────────────────│
                        │ id (PK)         │
                        │ username        │
                        │ email           │
                        │ password_hash   │
                        │ role: Role      │
                        │ reputation      │
                        │ avatar_*_url    │
                        │ is_banned       │
                        └────────┬────────┘
                                 │ 1
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          │ N                    │ N                    │ N
   ┌──────┴──────┐        ┌──────┴──────┐       ┌──────┴──────┐
   │   posts     │        │  comments   │        │   votes     │
   │─────────────│        │─────────────│        │─────────────│
   │ id (PK)     │        │ id (PK)     │        │ id (PK)     │
   │ author_id   │        │ author_id   │        │ user_id     │
   │ category_id │        │ post_id     │        │ target_type │ ←VoteTarget
   │ title       │        │ parent_id ──┼─┐      │ target_id   │
   │ status      │        │ quote_id  ──┼─┐      │ value +1/-1 │
   │ is_pinned   │        │ content     │         └─────────────┘
   │ is_locked   │        │ status      │
   └──────┬──────┘        └─────────────┘
          │ 1
   ┌──────┴──────────────────────────────────┐
   │               │              │          │
   │ N             │ N            │ N        │ N
┌──┴──────┐  ┌────┴─────┐  ┌─────┴──┐  ┌───┴──────┐
│post_    │  │post_     │  │book-   │  │post_     │
│blocks   │  │media     │  │marks   │  │tags      │
│─────────│  │──────────│  │────────│  │──────────│
│id       │  │id        │  │id      │  │post_id   │
│post_id  │  │post_id   │  │user_id │  │tag_id    │
│type:    │  │block_id  │  │post_id │  └──────────┘
│BlockType│  │url       │  └────────┘       │ N
│content  │  └──────────┘               ┌───┴──┐
│sort_ord.│                             │ tags │
└─────────┘                             │──────│
                                        │ id   │
                                        │ name │
                                        └──────┘

Các bảng khác:
  ├── notifications    ← belongs to users (1:N)
  ├── refresh_tokens   ← belongs to users (1:N)
  ├── reports          ← belongs to users; polymorphic (post/comment)
  ├── audit_logs       ← belongs to users (admin actions)
  ├── user_blocks      ← self-referential users (blocker/blocked)
  ├── user_content_ctx ← belongs to users (1:1, AI bot context)
  └── categories       ← belongs to posts (1:N)
```

### C.2 Bảng mô tả chi tiết 19 models

**Bảng C.1 — Mô tả 19 models trong Prisma Schema**

| # | Model | Bảng DB | Vai trò chính | Quan hệ nổi bật | Indexes đặc biệt |
|:-:|-------|:-------:|--------------|----------------|:---------------:|
| 1 | `User` | `users` | Tài khoản người dùng, thông tin cá nhân, quyền hạn | Trung tâm — 1 user has many posts, comments, votes, notifications | `email (unique)`, `username (unique)` |
| 2 | `Post` | `posts` | Bài viết diễn đàn với metadata | belongs to `User`, `Category`; has many `PostBlock`, `Comment`, `Vote` | `search_vector (GIN)`, `(category_id, created_at)` |
| 3 | `PostBlock` | `post_blocks` | Các block nội dung của bài viết | belongs to `Post`; sort_order xác định thứ tự | `(post_id, sort_order)` |
| 4 | `PostMedia` | `post_media` | File ảnh đính kèm bài viết | belongs to `Post`; optionally `PostBlock` | `post_id` |
| 5 | `Comment` | `comments` | Bình luận, hỗ trợ lồng nhau và trích dẫn | belongs to `User`, `Post`; self-ref `parent_id`; self-ref `quoted_comment_id` | `(post_id, created_at)`, `parent_id` |
| 6 | `Category` | `categories` | Danh mục phân loại bài viết | has many `Post` | `slug (unique)` |
| 7 | `Tag` | `tags` | Nhãn gắn cho bài viết | many-to-many với `Post` qua `PostTag` | `name (unique)` |
| 8 | `PostTag` | `post_tags` | Junction table Post ↔ Tag | belongs to `Post`, `Tag` | composite `(post_id, tag_id) unique` |
| 9 | `Vote` | `votes` | Vote upvote (+1) / downvote (-1) | belongs to `User`; polymorphic: `VoteTarget` (POST hoặc COMMENT) | composite `(user_id, target_type, target_id) unique` |
| 10 | `Bookmark` | `bookmarks` | Bookmark bài viết | belongs to `User`, `Post` | composite `(user_id, post_id) unique` |
| 11 | `Notification` | `notifications` | Thông báo in-app | belongs to `User`; `type: NotificationType`; `is_read: boolean` | `(user_id, is_read)` |
| 12 | `RefreshToken` | `refresh_tokens` | JWT refresh tokens | belongs to `User`; `revoked: boolean`; `expires_at` | `token (unique)`, `(user_id, revoked)` |
| 13 | `Report` | `reports` | Báo cáo vi phạm | belongs to `User` (reporter); belongs to `User` (reviewer); polymorphic: `ReportTarget` | `(reporter_id, target_type, target_id) unique` |
| 14 | `AuditLog` | `audit_logs` | Lịch sử hành động admin | belongs to `User` (admin); `action: AuditAction`; `target: AuditTarget`; `old_value`, `new_value` JSON | `(admin_id, created_at)`, `target_type` |
| 15 | `UserBlock` | `user_blocks` | Quan hệ chặn người dùng | self-referential `User`: blocker, blocked | composite `(blocker_id, blocked_id) unique` |
| 16 | `UserContentContext` | `user_content_ctx` | Context AI bot cho từng user | belongs to `User` (1:1); tracking bot history | `user_id (unique)` |
| 17 | `ForumConfig` | `forum_config` | Cấu hình diễn đàn | singleton table (1 row); key-value store | `key (unique)` |
| 18 | `OtpRecord` | `otp_records` | OTP records cho verify + reset | belongs to `User`; `expires_at`, `used: boolean` | `(user_id, type)`, `expires_at` |
| 19 | `ApiMetric` | `api_metrics` | Snapshot metrics API | no foreign key; `endpoint`, `method`, `p50`, `p95`, `p99` | `(endpoint, method, recorded_at)` |

### C.3 Enum Types đầy đủ

**Bảng C.2 — 12 Enum Types trong Prisma Schema**

| Enum | Các giá trị | Sử dụng trong |
|------|------------|:-------------:|
| `Role` | `MEMBER`, `MODERATOR`, `ADMIN` | `User.role` |
| `PostStatus` | `PUBLISHED`, `HIDDEN`, `DELETED` | `Post.status` |
| `CommentStatus` | `VISIBLE`, `HIDDEN`, `DELETED` | `Comment.status` |
| `BlockType` | `TEXT`, `IMAGE`, `CODE`, `QUOTE` | `PostBlock.type` |
| `PinType` | `GLOBAL`, `CATEGORY` | `Post.pin_type` |
| `VoteTarget` | `POST`, `COMMENT` | `Vote.target_type` |
| `ReportTarget` | `POST`, `COMMENT`, `USER` | `Report.target_type` |
| `ReportStatus` | `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED` | `Report.status` |
| `AuditAction` | `CREATE`, `UPDATE`, `DELETE`, `BAN`, `UNBAN`, `SUSPEND_USER`, `CHANGE_ROLE`, `HIDE_POST`, `PIN_POST`, `LOCK_POST`, `RESOLVE_REPORT`, `DISMISS_REPORT`, `UPDATE_CONFIG` | `AuditLog.action` |
| `AuditTarget` | `USER`, `POST`, `COMMENT`, `REPORT`, `CATEGORY`, `TAG`, `SETTING` | `AuditLog.target_type` |
| `NotificationType` | `COMMENT_REPLY`, `POST_VOTE`, `COMMENT_VOTE`, `MENTION`, `SYSTEM` | `Notification.type` |
| `PermissionLevel` | `ALL`, `MEMBER`, `MODERATOR`, `ADMIN` | `ForumConfig.permission` |

---

## Phụ lục D — API Endpoints Reference

### D.1 Tổng quan endpoints

**Bảng D.1 — Danh sách API endpoints theo nhóm**

| Nhóm | Method | Endpoint | Auth | Role | Mô tả |
|------|:------:|---------|:----:|:----:|-------|
| **AUTH** | POST | `/api/auth/register` | ❌ | — | Đăng ký tài khoản mới |
| | POST | `/api/auth/verify-otp` | ❌ | — | Xác minh OTP đăng ký |
| | POST | `/api/auth/login` | ❌ | — | Đăng nhập, nhận JWT |
| | POST | `/api/auth/logout` | ✅ | Any | Logout, revoke refresh token |
| | POST | `/api/auth/refresh` | ❌ | — | Lấy access token mới từ refresh token |
| | POST | `/api/auth/forgot-password` | ❌ | — | Gửi OTP reset mật khẩu |
| | POST | `/api/auth/reset-password` | ❌ | — | Đặt lại mật khẩu với OTP |
| | POST | `/api/auth/change-password` | ✅ | Any | Đổi mật khẩu (cần mật khẩu cũ) |
| **USERS** | GET | `/api/users/me` | ✅ | Any | Thông tin user hiện tại |
| | PATCH | `/api/users/me` | ✅ | Any | Cập nhật hồ sơ |
| | POST | `/api/users/me/avatar` | ✅ | Any | Upload avatar |
| | GET | `/api/users/:username` | ❌ | — | Xem profile công khai |
| | POST | `/api/users/:id/block` | ✅ | Any | Chặn người dùng |
| | DELETE | `/api/users/:id/block` | ✅ | Any | Bỏ chặn |
| | GET | `/api/users/me/blocked` | ✅ | Any | Danh sách đã chặn |
| **POSTS** | GET | `/api/posts` | ❌ | — | Danh sách bài viết (paginate, filter) |
| | POST | `/api/posts` | ✅ | MEMBER+ | Tạo bài viết mới |
| | GET | `/api/posts/:id` | ❌ | — | Chi tiết bài viết + blocks |
| | PATCH | `/api/posts/:id` | ✅ | Author | Sửa bài viết |
| | DELETE | `/api/posts/:id` | ✅ | Author/Admin | Xóa bài viết |
| | POST | `/api/posts/:id/media` | ✅ | Author | Upload ảnh cho bài viết |
| | DELETE | `/api/posts/:id/media/:mediaId` | ✅ | Author | Xóa ảnh |
| **COMMENTS** | GET | `/api/posts/:id/comments` | ❌ | — | Danh sách bình luận |
| | POST | `/api/posts/:id/comments` | ✅ | MEMBER+ | Tạo bình luận |
| | PATCH | `/api/comments/:id` | ✅ | Author | Sửa bình luận |
| | DELETE | `/api/comments/:id` | ✅ | Author/Admin | Xóa bình luận |
| **VOTES** | POST | `/api/votes` | ✅ | MEMBER+ | Vote post hoặc comment |
| | DELETE | `/api/votes/:id` | ✅ | Author | Bỏ vote |
| **SEARCH** | GET | `/api/search?q=...` | ❌ | — | Full-text search posts |
| **NOTIFICATIONS** | GET | `/api/notifications` | ✅ | Any | Danh sách thông báo |
| | GET | `/api/notifications/stream` | ✅ | Any | SSE stream |
| | PATCH | `/api/notifications/:id/read` | ✅ | Any | Đánh dấu đã đọc |
| | DELETE | `/api/notifications/:id` | ✅ | Any | Xóa thông báo |
| **BOOKMARKS** | GET | `/api/bookmarks` | ✅ | Any | Danh sách bookmark |
| | POST | `/api/bookmarks` | ✅ | MEMBER+ | Thêm bookmark |
| | DELETE | `/api/bookmarks/:id` | ✅ | Author | Xóa bookmark |
| **ADMIN** | GET | `/api/admin/stats` | ✅ | ADMIN | KPI statistics |
| | GET | `/api/admin/metrics` | ✅ | ADMIN | API performance metrics |
| | GET/PATCH | `/api/admin/users` | ✅ | ADMIN | Quản lý người dùng |
| | GET/PATCH | `/api/admin/posts` | ✅ | MOD+ | Quản lý bài viết |
| | GET/PATCH | `/api/admin/comments` | ✅ | MOD+ | Quản lý bình luận |
| | GET/PATCH | `/api/admin/reports` | ✅ | MOD+ | Xử lý báo cáo |
| | GET | `/api/admin/audit-logs` | ✅ | ADMIN | Audit log |
| | GET/POST | `/api/config` | ✅ | ADMIN | Cấu hình forum |

### D.2 Chuẩn response format

```typescript
// Success Response
{
  "success": true,
  "data": { /* payload */ },
  "meta": {           // có khi paginate
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",    // or "UNAUTHORIZED", "NOT_FOUND", etc.
    "message": "Human-readable message",
    "errors": [                    // Zod validation errors (nếu có)
      { "path": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## Phụ lục E — Danh mục tài liệu tham khảo

### E.1 Tài liệu quản lý và kiến trúc

[1] Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide: The Definitive Guide to Scrum: The Rules of the Game*. Scrum.org.

[2] Cohn, M. (2005). *Agile Estimating and Planning*. Prentice Hall.

[3] Fowler, M. (2019). *Refactoring: Improving the Design of Existing Code* (2nd ed.). Addison-Wesley Professional.

[4] DeMarco, T., & Lister, T. (2013). *Peopleware: Productive Projects and Teams* (3rd ed.). Addison-Wesley Professional.

[5] Project Management Institute (PMI). (2017). *A Guide to the Project Management Body of Knowledge (PMBOK® Guide)* (6th ed.). PMI.

[6] Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.

[7] Kim, G., Humble, J., Debois, P., & Willis, J. (2016). *The DevOps Handbook: How to Create World-Class Agility, Reliability, and Security in Technology Organizations*. IT Revolution Press.

### E.2 Microservices & Architecture

[8] Richardson, C. (2018). *Microservices Patterns: With examples in Java*. Manning Publications.

[9] Newman, S. (2015). *Building Microservices: Designing Fine-Grained Systems*. O'Reilly Media.

[10] Fowler, M., & Lewis, J. (2014). "Microservices". *Martinfowler.com*.  
    URL: https://martinfowler.com/articles/microservices.html

[11] Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* [Doctoral dissertation]. University of California, Irvine.

[12] Richardson, L., & Ruby, S. (2007). *RESTful Web Services*. O'Reilly Media.

### E.3 Tài liệu kỹ thuật chính thức

[13] Express.js Documentation. (2024). *Express: Fast, unopinionated, minimalist web framework for Node.js*.  
    URL: https://expressjs.com/

[14] Prisma Team. (2024). *Prisma: Next-generation Node.js and TypeScript ORM*.  
    URL: https://www.prisma.io/docs

[15] React Core Team. (2024). *React: The library for web and native user interfaces*.  
    URL: https://react.dev

[16] TanStack. (2024). *TanStack Query v5 Documentation: Powerful asynchronous state management for TS/JS, React, Solid, Svelte and Vue*.  
    URL: https://tanstack.com/query/v5/docs

[17] Zod Contributors. (2024). *Zod: TypeScript-first schema validation with static type inference*.  
    URL: https://zod.dev

[18] Vitest Contributors. (2024). *Vitest: A blazing fast unit test framework powered by Vite*.  
    URL: https://vitest.dev

[19] Tailwind Labs. (2024). *TailwindCSS: A utility-first CSS framework*.  
    URL: https://tailwindcss.com/docs

[20] shadcn/ui Contributors. (2024). *shadcn/ui: Beautifully designed components built with Radix UI and Tailwind CSS*.  
    URL: https://ui.shadcn.com

[21] Docker Inc. (2024). *Docker Best Practices*.  
    URL: https://docs.docker.com/develop/develop-images/dockerfile_best-practices

[22] Microsoft. (2024). *TypeScript Handbook*.  
    URL: https://www.typescriptlang.org/docs

[23] ImageKit Contributors. (2024). *ImageKit Documentation: Real-time image optimization, transformation, and delivery*.  
    URL: https://docs.imagekit.io

[24] Brevo. (2024). *Brevo (Sendinblue) API Documentation: Email Marketing & CRM*.  
    URL: https://developers.brevo.com

### E.4 Tiêu chuẩn và Best Practices

[25] OWASP. (2021). *OWASP Top Ten 2021: The Top 10 Web Application Security Risks*.  
    URL: https://owasp.org/Top10

[26] OWASP. (2024). *OWASP REST Security Cheat Sheet*.  
    URL: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html

[27] Goldbergyoni. (2024). *Node.js Best Practices: Comprehensive guide to Node.js best practices*.  
    URL: https://github.com/goldbergyoni/nodebestpractices

[28] The PostgreSQL Global Development Group. (2024). *PostgreSQL Full-Text Search*.  
    URL: https://www.postgresql.org/docs/current/textsearch.html

[29] IETF. (2020). *JWT Best Current Practices (RFC 8725)*.  
    URL: https://datatracker.ietf.org/doc/html/rfc8725

[30] Heroku. (2024). *The Twelve-Factor App Methodology*.  
    URL: https://12factor.net

### E.5 Tài liệu nội bộ dự án MINI-FORUM

[31] Mini-Forum Team. (2026). *README.md — Hướng dẫn cài đặt và chạy dự án (monorepo root)*.

[32] Mini-Forum Team. (2026). *DEPLOYMENT.md — Hướng dẫn triển khai chi tiết, known limitations, scaling notes*.

[33] Mini-Forum Team. (2026). *DB_SETUP.md — Hướng dẫn thiết lập database, migration, seed data*.

[34] Mini-Forum Team. (2026). *DEPLOY_CHECKLIST.md — Checklist kiểm tra trước khi deploy production*.

[35] Mini-Forum Team. (2026). *backend/scripts/README_MEDIA_SCRIPTS.md — Hướng dẫn maintenance scripts cho media*.

[36] Mini-Forum Team. (2026). *backend/README.md — Backend-specific documentation*.

[37] Mini-Forum Team. (2026). *frontend/README.md — Frontend setup và development guide*.

[38] Mini-Forum Team. (2026). *vibe-content/README.md — AI bot service documentation*.

---

## Phụ lục F — Thống kê cuối dự án

### F.1 Thống kê codebase

**Bảng F.1 — Thống kê định lượng codebase MINI-FORUM**

| Metric | Giá trị | Ghi chú |
|--------|:-------:|---------|
| **Tổng dòng code** | ~12,000 dòng | TypeScript + TSX (không tính node_modules, migration SQL) |
| Backend (controllers + services + middleware) | ~4,500 dòng | Phức tạp nhất |
| Frontend (pages + components + hooks) | ~4,000 dòng | React + Vite |
| Admin client | ~2,000 dòng | Reuse nhiều pattern frontend |
| vibe-content | ~1,500 dòng | 9 services + 4 LLM adapters |
| **Số files TypeScript/TSX** | ~120 files | |
| **Số migration files** | 8 migrations | Full history từ ngày 1 |
| **Số Prisma models** | 19 models | |
| **Số Enum types** | 12 enums | |
| **Số API endpoints** | ~60 endpoints | 14 controllers × trung bình 4–5 endpoints |
| **Số test files** | 15+ files | |
| **Số test cases** | ~120 test cases | |
| **Test coverage (backend)** | ~68% | Vượt target 60% |

### F.2 Thống kê Sprint

**Bảng F.2 — Thống kê sprint đầy đủ**

| Metric | Giá trị |
|--------|:-------:|
| Tổng số sprint sản xuất (không tính S0) | 6 (S1–S5 + Buffer) |
| Tổng Story Points hoàn thành | 158 SP |
| Average velocity | 31.6 SP/sprint |
| Sprint hoàn thành đúng hạn (0 SP remaining) | 6/6 (100%) |
| Sprint đạt đúng SP Planned | 4/6 (S3, S4, S5, Buffer) |
| Sprint có scope adjustment | 2/6 (S1 –2SP, S2 scope creep) |
| User Stories completed | 11/11 (100%) |
| Must Have stories | 7/7 (100%) |
| Should Have stories | 3/3 (100%) |
| Nice to Have stories | 1/1 (100%) |
| Rủi ro được identify và mitigate | 7 risks |
| Technical debt items recorded | 6 items (3 open, 2 documented, 1 partial) |

### F.3 Timeline tóm tắt

**Hình F.1 — Timeline dự án MINI-FORUM**

> *Mô tả hình:* Biểu đồ timeline ngang. Trục X là thời gian từ 27/01/2026 đến 27/04/2026. Các milestone được đánh dấu bằng các hình thoi trên trục thời gian. Màu gradient từ xanh nhạt (đầu dự án) đến xanh đậm (cuối dự án). Phía dưới trục thời gian là sprint labels.

```
TIMELINE DỰ ÁN MINI-FORUM (13 Tuần)
═══════════════════════════════════════════════════════════════

27/01  07/02  21/02  07/03  21/03  04/04  18/04  27/04
  │      │      │      │      │      │      │      │
  ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
 [S0]  [M0]  [M1]  [M2]  [M3]  [M4]  [M5]  FINAL
Start  ERD+  Auth  Forum  Inter  Admin  AI+   Report
       Mono  E2E   Core  active  Panel Deploy

├──S0──┤├────S1────┤├────S2────┤├────S3────┤├────S4────┤├────S5────┤B┤
W1–W2   W3–W4      W5–W6      W7–W8      W9–W10     W11–W12    W13

M0: Monorepo running, ERD v1, seed script               (07/02/2026)
M1: Auth end-to-end (register → OTP → login → refresh)  (21/02/2026)
M2: Forum core (post + comment + category + tag)         (07/03/2026)
M3: Interactive (vote + search + SSE + block layout)     (21/03/2026)
M4: Admin panel + Audit log + Media management           (04/04/2026)
M5: AI bot + Tests + Docker + Production deploy          (18/04/2026)
FINAL: Documentation + Buffer + Báo cáo hoàn chỉnh      (27/04/2026)
```

### F.4 Phân phối Story Points theo nhóm tính năng

**Bảng F.3 — Phân phối Story Points theo nhóm tính năng**

| Nhóm tính năng | Story Points | % Tổng | Sprint |
|---------------|:-----------:|:------:|:------:|
| Auth & Security | 20 SP | 12.7% | S1 |
| User Management | 8 SP | 5.1% | S1–S2 |
| Forum Core (Post + Comment + Category + Tag) | 35 SP | 22.1% | S2 |
| Tương tác (Vote + Search + SSE + Block) | 35 SP | 22.1% | S3 |
| Admin Panel + Audit + Reports | 32 SP | 20.3% | S4 |
| Media Management (ImageKit) | 10 SP | 6.3% | S4 |
| AI Bot (vibe-content) | 18 SP | 11.4% | S5 |
| **Tổng** | **158 SP** | **100%** | — |

---

## Phụ lục G — Glossary (Bảng thuật ngữ và viết tắt)

**Bảng G.1 — Thuật ngữ kỹ thuật và viết tắt**

| Viết tắt / Thuật ngữ | Nghĩa đầy đủ | Ghi chú |
|---------------------|-------------|---------|
| **ADR** | Architecture Decision Record | Tài liệu ghi lại quyết định kiến trúc quan trọng |
| **API** | Application Programming Interface | Giao diện lập trình ứng dụng |
| **CDN** | Content Delivery Network | Mạng phân phối nội dung (ImageKit) |
| **CI/CD** | Continuous Integration / Continuous Deployment | Tích hợp và triển khai liên tục |
| **DoD** | Definition of Done | Định nghĩa "Hoàn thành" trong Scrum |
| **ERD** | Entity-Relationship Diagram | Sơ đồ quan hệ thực thể |
| **GIN** | Generalized Inverted Index | Loại index PostgreSQL cho full-text search |
| **JWT** | JSON Web Token | Cơ chế xác thực stateless |
| **LLM** | Large Language Model | Mô hình ngôn ngữ lớn (Gemini, GPT, Llama...) |
| **MVP** | Minimum Viable Product | Sản phẩm khả dụng tối thiểu |
| **ORM** | Object-Relational Mapping | Ánh xạ đối tượng-quan hệ (Prisma) |
| **OTP** | One-Time Password | Mật khẩu dùng một lần |
| **PMBOK** | Project Management Body of Knowledge | Chuẩn quản lý dự án của PMI |
| **RACI** | Responsible, Accountable, Consulted, Informed | Ma trận phân công trách nhiệm |
| **RBAC** | Role-Based Access Control | Kiểm soát truy cập dựa trên vai trò |
| **ROI** | Return on Investment | Tỷ suất lợi tức đầu tư |
| **SP** | Story Points | Đơn vị đo lường effort trong Scrum |
| **SQL** | Structured Query Language | Ngôn ngữ truy vấn cơ sở dữ liệu |
| **SSE** | Server-Sent Events | Công nghệ push dữ liệu một chiều từ server |
| **TD** | Technical Debt | Nợ kỹ thuật |
| **WBS** | Work Breakdown Structure | Cấu trúc phân rã công việc |
| **Block Layout** | — | Hệ thống tổ chức nội dung bài viết theo từng "block" riêng biệt |
| **Monorepo** | — | Kho lưu trữ đơn chứa nhiều projects/services |
| **Spike Story** | — | Task ngắn để khám phá và đánh giá technical uncertainty |
| **Velocity** | — | Tốc độ phát triển đo bằng SP/sprint |
| **Burndown Chart** | — | Biểu đồ tiêu hao SP theo thời gian trong sprint |

---

*— Kết thúc báo cáo —*

*Dự án MINI-FORUM | Môn học: Quản Trị Dự Án Phần Mềm*  
*Thời gian thực hiện: 27/01/2026 – 27/04/2026*  
*Ngày hoàn thành báo cáo: 27/04/2026*
