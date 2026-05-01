# PHỤ LỤC

---

## Phụ lục A — Bảng công nghệ và phiên bản sử dụng

**Bảng A.1 — Stack công nghệ đầy đủ của dự án MINI-FORUM**

| Công nghệ | Phiên bản | Vai trò | Ghi chú |
|-----------|----------|---------|---------|
| **Node.js** | >= 18.x LTS | Runtime cho backend và vibe-content | Sử dụng ES Modules + TypeScript |
| **TypeScript** | ~5.x | Type safety toàn bộ codebase | Strict mode bật cho tất cả services |
| **Express.js** | 4.x | HTTP framework backend | Middleware-based architecture |
| **Prisma ORM** | 5.x | Database access layer | Migration versioned, type-safe client |
| **PostgreSQL** | >= 14 | Relational database | Full-text search với `tsvector`, GIN index |
| **React** | 18.x | UI framework (frontend + admin) | Concurrent mode, Suspense |
| **Vite** | 5.x | Build tool + dev server | HMR, TypeScript out-of-the-box |
| **TailwindCSS** | 3.x | Utility-first CSS | JIT mode |
| **Radix UI** | Latest | Accessible component primitives (admin) | Headless UI components |
| **shadcn/ui** | Latest | Component library (admin) | Built on Radix UI |
| **React Query** | v5 (TanStack) | Async state management | Caching, invalidation, optimistic updates |
| **Zod** | 3.x | Schema validation | Input validation tại API boundary |
| **Vitest** | Latest | Unit testing framework | Jest-compatible API, Vite-powered |
| **React Testing Library** | Latest | Component testing | DOM behavior testing |
| **bcrypt** | Latest | Password hashing | Salt rounds: 12 |
| **jsonwebtoken** | Latest | JWT signing/verification | Access token 15min, refresh 7d |
| **Helmet.js** | Latest | HTTP security headers | XSS, HSTS, CSP |
| **Docker** | Latest | Containerization | Multi-stage builds |
| **ImageKit** | SDK v4 | Media CDN (upload, transform) | Free tier, signed URLs |
| **Brevo (SendinBlue)** | SMTP API v3 | Transactional email (OTP) | 300 emails/day free |
| **Google Gemini** | API v1 | LLM provider (primary) | gemini-1.5-flash |
| **Groq** | API | LLM provider (fallback 1) | llama3-8b-8192 |
| **Cerebras** | API | LLM provider (fallback 2) | llama3.1-8b |
| **Nvidia NIM** | API | LLM provider (fallback 3) | meta/llama-3.1-8b |
| **node-cron** | Latest | Cron job scheduler (vibe-content) | Mỗi giờ |

---

## Phụ lục B — Cấu trúc thư mục dự án

### B.1 Backend (`backend/src/`)

```
backend/src/
├── app.ts                    # Express app: middleware chain, routing, error handler
├── index.ts                  # Entry point: DB connect, server listen
│
├── controllers/              # Request handlers — 14 files
│   ├── adminController.ts    # Admin: stats, user/post/comment management
│   ├── authController.ts     # Register, login, logout, OTP, refresh token
│   ├── blockReportController.ts  # User blocks + content reports
│   ├── bookmarkController.ts # Bookmark CRUD
│   ├── categoryController.ts # Category management
│   ├── commentController.ts  # Nested comments, quote
│   ├── configController.ts   # Forum configuration
│   ├── notificationController.ts # Notifications, SSE stream
│   ├── postController.ts     # Post CRUD, block layout
│   ├── postMediaController.ts # Post image upload/manage
│   ├── searchController.ts   # Full-text search
│   ├── tagController.ts      # Tag management
│   ├── userController.ts     # User profile, avatar
│   └── voteController.ts     # Vote up/down
│
├── services/                 # Business logic — 21 files
│   ├── auditLogService.ts    # Ghi nhận admin actions
│   ├── authService.ts        # Auth business logic
│   ├── blockService.ts       # Block layout operations
│   ├── blockValidationService.ts  # Block content validation
│   ├── bookmarkService.ts    # Bookmark logic
│   ├── brevoApiService.ts    # Brevo SMTP API client
│   ├── categoryService.ts    # Category business logic
│   ├── commentService.ts     # Comment logic
│   ├── emailService.ts       # Email orchestration
│   ├── imagekitService.ts    # ImageKit upload/delete
│   ├── metricsService.ts     # API metrics collection
│   ├── notificationService.ts # Notification logic
│   ├── otpService.ts         # OTP generate/verify
│   ├── postMediaService.ts   # Post media management
│   ├── postService.ts        # Post business logic
│   ├── reportService.ts      # Report handling
│   ├── searchService.ts      # Full-text search
│   ├── sseService.ts         # SSE connection management
│   ├── tagService.ts         # Tag business logic
│   ├── userService.ts        # User management
│   └── voteService.ts        # Vote + reputation
│
├── routes/                   # API routing — 14 files (1:1 với controllers)
│
├── middlewares/              # Express middlewares — 9 files
│   ├── authMiddleware.ts     # JWT verification
│   ├── roleMiddleware.ts     # RBAC role check
│   ├── securityMiddleware.ts # Helmet, CORS, rate limiting
│   ├── metricsMiddleware.ts  # Request metrics capture
│   ├── uploadMiddleware.ts   # Multer file upload
│   ├── errorMiddleware.ts    # Centralized error handler
│   ├── requestLogger.ts      # Request logging
│   ├── auditMiddleware.ts    # Auto audit log on admin actions
│   └── validateMiddleware.ts # Zod schema validation
│
├── validations/              # Zod schemas — 1 file per entity
├── types/                    # TypeScript custom types
├── config/                   # DB, ImageKit, constants config
├── constants/                # Enum-like constants
├── utils/                    # Helper functions
└── __tests__/                # Vitest test suite
    ├── setup.ts
    ├── imagekitService.test.ts
    └── uploadMiddleware.test.ts
```

### B.2 Frontend (`frontend/src/`)

```
frontend/src/
├── main.tsx                  # React entry point
├── app/
│   └── App.tsx               # Router, AuthProvider, QueryClientProvider
│
├── pages/                    # 14 trang
│   ├── HomePage.tsx          # Trang chủ — danh sách bài viết
│   ├── PostDetailPage.tsx    # Chi tiết bài + bình luận
│   ├── CategoriesPage.tsx    # Danh sách danh mục
│   ├── TagsPage.tsx          # Danh sách nhãn
│   ├── SearchPage.tsx        # Tìm kiếm full-text
│   ├── ProfilePage.tsx       # Hồ sơ công khai
│   ├── EditProfilePage.tsx   # Sửa hồ sơ cá nhân
│   ├── BookmarksPage.tsx     # Danh sách bookmark
│   ├── NotificationsPage.tsx # Thông báo (SSE)
│   ├── BlockedUsersPage.tsx  # Danh sách đã chặn
│   ├── EditPostPage.tsx      # Soạn thảo bài (block editor)
│   ├── RegisterPage.tsx      # Đăng ký + OTP
│   ├── LoginPage.tsx         # Đăng nhập
│   └── ForgotPasswordPage.tsx # Đặt lại mật khẩu
│
├── components/               # Shared components
├── api/                      # API calls (axios + React Query hooks)
├── contexts/                 # React contexts (AuthContext)
├── hooks/                    # Custom React hooks
├── routes/                   # Route definitions, guards
├── types/                    # TypeScript types
└── utils/                    # Helper functions
```

### B.3 Admin Panel (`admin-client/src/`)

```
admin-client/src/
└── pages/                    # 12 trang
    ├── DashboardPage.tsx         # KPI dashboard
    ├── OperationalDashboardPage.tsx  # Metrics real-time
    ├── UsersPage.tsx             # Quản lý người dùng
    ├── PostsPage.tsx             # Quản lý bài viết
    ├── CommentsPage.tsx          # Quản lý bình luận
    ├── CategoriesPage.tsx        # Quản lý danh mục
    ├── TagsPage.tsx              # Quản lý nhãn
    ├── ReportsPage.tsx           # Xử lý báo cáo
    ├── AuditLogsPage.tsx         # Lịch sử audit
    ├── SettingsPage.tsx          # Cấu hình forum
    └── LoginPage.tsx             # Đăng nhập admin
```

### B.4 AI Bot (`vibe-content/src/`)

```
vibe-content/src/
├── index.ts                  # Entry point + scheduler bootstrap
│
├── services/                 # 9 services chính
│   ├── PersonalityService.ts     # Quản lý bot personalities
│   ├── ContentGeneratorService.ts # Orchestrate LLM calls
│   ├── PromptBuilderService.ts   # Build context-aware prompts
│   ├── ActionSelectorService.ts  # Chọn hành động phù hợp
│   ├── ContextGathererService.ts # Thu thập forum context
│   ├── APIExecutorService.ts     # Gọi backend API
│   ├── StatusService.ts          # Track bot status
│   ├── ValidationService.ts      # Validate generated content
│   └── llm/                      # 4 LLM adapter files
│       ├── geminiAdapter.ts
│       ├── groqAdapter.ts
│       ├── cerebrasAdapter.ts
│       └── nvidiaAdapter.ts
│
├── scheduler/                # Cron job definitions
├── tracking/                 # Action tracking, metrics
├── config/                   # Config, constants
└── types/                    # TypeScript types
```

---

## Phụ lục C — 19 Models trong Prisma Schema

**Bảng C.1 — Danh sách 19 models và vai trò**

| # | Model | Vai trò | Quan hệ chính |
|---|-------|---------|-------------|
| 1 | `users` | Tài khoản người dùng, thông tin cá nhân | Trung tâm — quan hệ với hầu hết models |
| 2 | `posts` | Bài viết diễn đàn | belongs to users, categories |
| 3 | `post_blocks` | Các block nội dung của bài viết (TEXT/IMAGE/CODE/QUOTE) | belongs to posts |
| 4 | `post_media` | Media files đính kèm bài viết | belongs to posts, optionally post_blocks |
| 5 | `comments` | Bình luận bài viết, hỗ trợ lồng nhau và trích dẫn | belongs to users, posts; self-referential (parent_id, quoted_comment_id) |
| 6 | `categories` | Danh mục phân loại bài viết | has many posts |
| 7 | `tags` | Nhãn gắn cho bài viết | many-to-many với posts qua post_tags |
| 8 | `post_tags` | Bảng trung gian post ↔ tag | belongs to posts, tags |
| 9 | `votes` | Vote upvote/downvote cho post và comment | belongs to users; polymorphic: VoteTarget |
| 10 | `bookmarks` | Bookmark bài viết của user | belongs to users, posts |
| 11 | `notifications` | Thông báo in-app cho người dùng | belongs to users |
| 12 | `refresh_tokens` | JWT refresh tokens | belongs to users |
| 13 | `reports` | Báo cáo vi phạm nội dung | belongs to users (reporter, reviewer); polymorphic: ReportTarget |
| 14 | `audit_logs` | Lịch sử hành động admin | belongs to users |
| 15 | `user_blocks` | Quan hệ chặn người dùng | belongs to users (blocker, blocked) |
| 16 | `user_content_context` | Context AI bot của vibe-content | belongs to users (1:1) |

**Enums:**

| Enum | Giá trị |
|------|---------|
| `Role` | MEMBER, MODERATOR, ADMIN |
| `PostStatus` | PUBLISHED, HIDDEN, DELETED |
| `CommentStatus` | VISIBLE, HIDDEN, DELETED |
| `BlockType` | TEXT, IMAGE, CODE, QUOTE |
| `PinType` | GLOBAL, CATEGORY |
| `VoteTarget` | POST, COMMENT |
| `ReportTarget` | POST, COMMENT, USER |
| `ReportStatus` | PENDING, REVIEWED, RESOLVED, DISMISSED |
| `AuditAction` | CREATE, UPDATE, DELETE, BAN, UNBAN, SUSPEND_USER, CHANGE_ROLE, HIDE_POST, PIN_POST, LOCK_POST, RESOLVE_REPORT, ... |
| `AuditTarget` | USER, POST, COMMENT, REPORT, CATEGORY, TAG, SETTING |
| `NotificationType` | COMMENT_REPLY, POST_VOTE, COMMENT_VOTE, MENTION, SYSTEM |
| `PermissionLevel` | ALL, MEMBER, MODERATOR, ADMIN |

---

## Phụ lục D — Danh mục tài liệu tham khảo

### D.1 Sách và giáo trình

1. Sutherland, J., & Schwaber, K. (2020). *The Scrum Guide*. Scrum.org.
2. Cohn, M. (2005). *Agile Estimating and Planning*. Prentice Hall.
3. Fowler, M. (2019). *Refactoring: Improving the Design of Existing Code* (2nd ed.). Addison-Wesley.
4. DeMarco, T., & Lister, T. (1999). *Peopleware: Productive Projects and Teams*. Dorset House.

### D.2 Tài liệu kỹ thuật chính thức

5. Prisma Team. (2024). *Prisma Documentation*. https://www.prisma.io/docs
6. React Team. (2024). *React Documentation*. https://react.dev
7. Express.js Team. (2024). *Express.js Guide*. https://expressjs.com/en/guide
8. Colby, N. et al. (2024). *TanStack Query v5 Documentation*. https://tanstack.com/query

### D.3 Tiêu chuẩn và best practices

9. OWASP Foundation. (2021). *OWASP Top Ten*. https://owasp.org/Top10
10. OpenJS Foundation. (2024). *Node.js Best Practices*. https://github.com/goldbergyoni/nodebestpractices
11. TypeScript Team. (2024). *TypeScript Handbook*. https://www.typescriptlang.org/docs

### D.4 Tài liệu nội bộ dự án

12. `README.md` — Hướng dẫn cài đặt và chạy dự án
13. `DEPLOYMENT.md` — Hướng dẫn triển khai chi tiết, known limitations
14. `DB_SETUP.md` — Hướng dẫn thiết lập database, migration
15. `DEPLOY_CHECKLIST.md` — Checklist triển khai production
16. `backend/scripts/README_MEDIA_SCRIPTS.md` — Hướng dẫn maintenance scripts

---

## Phụ lục E — Thống kê cuối dự án

### E.1 Thống kê codebase

| Metric | Giá trị |
|--------|---------|
| Tổng dòng code (ước tính) | ~12,000 dòng TypeScript/TSX |
| Backend (controllers + services) | ~4,500 dòng |
| Frontend (pages + components) | ~4,000 dòng |
| Admin client | ~2,000 dòng |
| vibe-content | ~1,500 dòng |
| Số files TypeScript/TSX | ~120 files |
| Số migration files | 8 migrations |
| Số Prisma models | 19 |
| Số API endpoints | ~60 endpoints |
| Số test cases | ~120 test cases |
| Test coverage (overall) | ~68% |

### E.2 Thống kê Sprint

| Metric | Giá trị |
|--------|---------|
| Tổng số Sprint (production) | 6 |
| Tổng Story Points completed | 158 SP |
| Average velocity | 31.6 SP/sprint |
| Sprint đúng hạn (0 overdue) | 4/6 (S3, S4, S5, Buffer) |
| Sprint có scope adjustment | 2/6 (S1, S2) |
| User Stories completed | 11/11 (100%) |
| Must Have stories | 7/7 (100%) |
| Should Have stories | 3/3 (100%) |
| Nice to Have stories | 1/1 (100%) |

### E.3 Timeline tóm tắt

```
27/01/2026  ████ Khởi động dự án (S0 begins)
07/02/2026  ● M0: Monorepo + Schema v1
21/02/2026  ● M1: Auth flow end-to-end
07/03/2026  ● M2: Forum core (post + comment)
21/03/2026  ● M3: Vote + Search + SSE
04/04/2026  ● M4: Admin panel + Audit log
18/04/2026  ● M5: AI bot + Tests + Docker
27/04/2026  ████ Bàn giao và báo cáo
```

---

*— Kết thúc báo cáo —*

*Được viết trong khoảng thời gian 27/01/2026 – 27/04/2026*
*Dự án MINI-FORUM | Môn học: Quản Trị Dự Án Phần Mềm*
