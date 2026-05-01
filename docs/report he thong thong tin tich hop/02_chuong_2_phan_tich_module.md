# CHƯƠNG 2 — PHÂN TÍCH VÀ THIẾT KẾ MODULE

---

## 2.1 Sơ đồ Module Backend — 6 nhóm chức năng

Backend MINI-FORUM được tổ chức theo **domain-driven module structure**: mỗi domain nghiệp vụ có controller và service riêng, giao tiếp với nhau qua service interfaces. Toàn bộ nằm trong `backend/src/`.

**Hình 2.1 — Sơ đồ module Backend**

```
backend/src/
│
├── ══════════════════════════════════════════════
│   MODULE 1: Auth & Security
│   ══════════════════════════════════════════════
│   controllers/
│   └── authController.ts      ← Xử lý request đăng nhập/đăng ký/refresh
│   services/
│   ├── authService.ts         ← JWT sign/verify, bcrypt hash, refresh token
│   ├── otpService.ts          ← Sinh và xác thực OTP 6 chữ số
│   ├── emailService.ts        ← Abstraction layer gửi email
│   └── brevoApiService.ts     ← Adapter gọi Brevo Transactional Email API
│   middlewares/
│   ├── authMiddleware.ts      ← Verify JWT, attach req.user
│   ├── roleMiddleware.ts      ← RBAC: kiểm tra role >= required
│   └── securityMiddleware.ts  ← Helmet, CORS, Rate Limiting
│
├── ══════════════════════════════════════════════
│   MODULE 2: Forum Core
│   ══════════════════════════════════════════════
│   controllers/
│   ├── postController.ts         ← CRUD bài viết, pin, lock
│   ├── postMediaController.ts    ← Upload/delete ảnh bài viết
│   ├── commentController.ts      ← CRUD bình luận, thread, quote
│   ├── categoryController.ts     ← CRUD danh mục, permission
│   └── tagController.ts          ← CRUD nhãn, gán nhãn cho bài viết
│   services/
│   ├── postService.ts            ← Business logic bài viết, view count
│   ├── postMediaService.ts       ← ImageKit upload/delete cho bài viết
│   ├── commentService.ts         ← Logic nested comment, edit timeout
│   ├── categoryService.ts        ← Category permission enforcement
│   └── tagService.ts             ← Tag management, usage count
│
├── ══════════════════════════════════════════════
│   MODULE 3: Interaction
│   ══════════════════════════════════════════════
│   controllers/
│   ├── voteController.ts         ← Upvote/downvote post và comment
│   ├── bookmarkController.ts     ← Lưu/bỏ bookmark
│   └── searchController.ts       ← Full-text search
│   services/
│   ├── voteService.ts            ← Logic vote, cập nhật reputation
│   ├── bookmarkService.ts        ← Toggle bookmark
│   └── searchService.ts          ← PostgreSQL full-text search query
│
├── ══════════════════════════════════════════════
│   MODULE 4: Notification
│   ══════════════════════════════════════════════
│   controllers/
│   └── notificationController.ts ← Đọc, đánh dấu đã xem, xóa
│   services/
│   ├── notificationService.ts    ← Tạo notification theo sự kiện
│   └── sseService.ts             ← Quản lý SSE connection pool
│
├── ══════════════════════════════════════════════
│   MODULE 5: Moderation & Admin
│   ══════════════════════════════════════════════
│   controllers/
│   ├── adminController.ts        ← Dashboard, user management, metrics
│   ├── blockReportController.ts  ← Block/unblock, report user/post
│   └── configController.ts       ← Đọc/ghi cấu hình động
│   services/
│   ├── blockService.ts           ← Tạo/xóa block
│   ├── blockValidationService.ts ← Kiểm tra block trước khi thực hiện action
│   ├── reportService.ts          ← Xử lý report (resolve/dismiss)
│   ├── auditLogService.ts        ← Ghi audit trail cho admin actions
│   └── metricsService.ts         ← Thu thập và truy vấn HTTP metrics
│
└── ══════════════════════════════════════════════
    MODULE 6: User Management
    ══════════════════════════════════════════════
    controllers/
    └── userController.ts         ← Profile, cập nhật thông tin, avatar
    services/
    ├── userService.ts            ← Business logic user, tìm kiếm user
    └── imagekitService.ts        ← ImageKit CDN: upload, delete, signed URL

    ══════════════════════════════════════════════
    CROSS-CUTTING CONCERNS (Middlewares)
    ══════════════════════════════════════════════
    middlewares/
    ├── validateMiddleware.ts     ← Wrapper Zod schema validation
    ├── errorMiddleware.ts        ← Global error handler, format response
    ├── httpLoggerMiddleware.ts   ← Structured HTTP access log
    ├── metricsMiddleware.ts      ← Đếm request, đo response time
    ├── requestIdMiddleware.ts    ← Gán unique ID cho request (tracing)
    └── uploadMiddleware.ts       ← Multer config cho file upload
```

### Thống kê module

| Module | Controllers | Services | Mô tả chính |
|--------|:-----------:|:--------:|-------------|
| Auth & Security | 1 | 4 | JWT, OTP, Email, Brevo API |
| Forum Core | 5 | 5 | Post, Comment, Category, Tag, Media |
| Interaction | 3 | 3 | Vote, Bookmark, Search |
| Notification | 1 | 2 | SSE real-time + Notification CRUD |
| Moderation & Admin | 3 | 5 | Report, Block, Audit, Config, Metrics |
| User Management | 1 | 2 | Profile + ImageKit CDN |
| **Tổng cộng** | **14** | **21** | |

---

## 2.2 Dependency Graph — Luồng xử lý request

### 2.2.1 Pipeline middleware tổng quát

Mỗi HTTP request đến backend đi qua pipeline có thứ tự cố định:

**Hình 2.2 — Dependency Graph luồng xử lý request**

```
                    ┌─────────────────────────────┐
                    │    Incoming HTTP Request     │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   requestIdMiddleware        │
                    │   Gán X-Request-ID header    │
                    │   req.id = uuid()            │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   metricsMiddleware          │
                    │   Ghi nhận start_time        │
                    │   Đếm request theo endpoint  │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   httpLoggerMiddleware       │
                    │   Log: method, url, ip       │
                    │   Log: status, duration      │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   securityMiddleware         │
                    │   ├── helmet() headers       │
                    │   ├── cors() whitelist       │
                    │   └── rateLimit() per IP     │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │ [Nếu route yêu cầu authentication]    │
              ▼                                       │
┌─────────────────────────┐                          │
│   authMiddleware         │                         │
│   verify JWT token       │                         │
│   → attach req.user      │                         │
└─────────────┬───────────┘                         │
              │                                       │
              ▼                                       │
┌─────────────────────────┐                          │
│   roleMiddleware         │                         │
│   check req.user.role    │                         │
│   >= required role       │                         │
│   → 403 nếu không đủ    │                          │
└─────────────┬───────────┘                          │
              │                                       │
              └───────────────────┬──────────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   validateMiddleware         │
                    │   Zod.parse(req.body)        │
                    │   → 400 nếu invalid          │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   [Controller Handler]       │
                    │   Parse validated input      │
                    │   Gọi service method         │
                    │   Trả JSON response          │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                    │
              ▼                   ▼                    ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │  [Service Layer] │  │ auditLogService  │  │notificationService│
  │  Business Logic  │  │ (admin actions)  │  │  + sseService     │
  └────────┬─────────┘  └──────────────────┘  └──────────────────┘
           │
           ▼
  ┌──────────────────┐
  │   Prisma Client  │
  │   (ORM queries)  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │   PostgreSQL DB  │
  └──────────────────┘
```

### 2.2.2 Quy tắc dependency

Để đảm bảo tính nhất quán và testability, các quy tắc sau được áp dụng nghiêm ngặt:

| Quy tắc | Mô tả |
|---------|-------|
| Controller không gọi Prisma | Mọi DB access phải qua service |
| Service không đọc `req`/`res` | Service thuần JavaScript — không phụ thuộc Express |
| Cross-module service call | Service A có thể gọi Service B (ví dụ: `postService` gọi `notificationService`) |
| Side effects tách biệt | Notification, audit log là side effect riêng — không chặn main flow |

### 2.2.3 Ví dụ luồng cụ thể: Tạo bài viết mới

```
POST /api/v1/posts
    ↓
[authMiddleware]    → Verify JWT → req.user = { id: 5, role: 'MEMBER' }
    ↓
[validateMiddleware] → Zod parse body → { title, content, categoryId, tags }
    ↓
[postController.createPost()]
    │ → Kiểm tra categoryId tồn tại
    │ → Gọi postService.create()
    │     │ → prisma.posts.create()
    │     │ → prisma.post_tags.createMany()
    │     └── Trả về post object
    │
    ├── [notificationService] → Tạo thông báo cho subscribers category
    │       └── [sseService]  → Push notification realtime qua SSE
    │
    └── Trả về 201 { post: {...} }
```

---

## 2.3 Module Architecture — Vibe-Content Service (Pipeline 8 bước)

### 2.3.1 Tổng quan service

`vibe-content` là dịch vụ **autonomous content generator** — hoạt động theo lịch định kỳ, không phục vụ request từ browser. Nhiệm vụ: mô phỏng hoạt động của người dùng thực (bot) trong diễn đàn thông qua AI.

**Cấu trúc thư mục:**

```
vibe-content/src/
├── index.ts                    ← Entry point, khởi tạo scheduler
├── scheduler/
│   └── jobs.ts                 ← Định nghĩa cron jobs
├── services/
│   ├── ContextGathererService.ts  ← Bước 1: Thu thập context từ DB
│   ├── ActionSelectorService.ts   ← Bước 2: Quyết định action
│   ├── PersonalityService.ts      ← Bước 3: Load bot personality
│   ├── PromptBuilderService.ts    ← Bước 4: Xây dựng prompt
│   ├── ContentGeneratorService.ts ← Bước 5: Gọi LLM
│   ├── ValidationService.ts       ← Bước 6: Validate output
│   ├── APIExecutorService.ts      ← Bước 7: Gửi qua Forum API
│   ├── StatusService.ts           ← Bước 8: Cập nhật trạng thái
│   └── llm/                       ← LLM Provider adapters
│       ├── geminiProvider.ts
│       ├── groqProvider.ts
│       ├── cerebrasProvider.ts
│       └── nvidiaProvider.ts
├── tracking/                   ← Bot metrics và monitoring
├── config/                     ← Biến môi trường vibe-content
└── types/                      ← TypeScript types
```

### 2.3.2 Pipeline 8 bước chi tiết

**Hình 2.3 — Pipeline thực thi của Vibe-Content**

```
┌─────────────────────────────────────────────────────────────────┐
│                   VIBE-CONTENT PIPELINE                         │
└─────────────────────────────────────────────────────────────────┘

[BƯỚC 0] Cron Scheduler
   └── Trigger mỗi N phút (configurable)
   └── Chọn bot user để thực thi
         │
         ▼
[BƯỚC 1] ContextGathererService
   ├── SELECT trending posts (nhiều view trong 24h)
   ├── SELECT posts ít comment (cần thảo luận)
   ├── SELECT active categories và tag phổ biến
   └── SELECT user_content_context (lịch sử bot)
   └── Nguồn: Prisma → PostgreSQL (READ ONLY)
         │
         ▼
[BƯỚC 2] ActionSelectorService
   ├── Phân tích context → Quyết định action type:
   │   ├── CREATE_POST:    Khi thiếu nội dung mới trong category
   │   ├── CREATE_COMMENT: Khi post nhiều view, ít comment
   │   └── VOTE:           Khi cần tăng engagement
   └── Trả về ActionPlan { type, targetPostId?, categoryId? }
         │
         ▼
[BƯỚC 3] PersonalityService
   ├── Load bot personality từ seed/botUsers.ts
   ├── Mỗi bot có: tone, topic_interests, interaction_style
   └── Trả về PersonalityProfile
         │
         ▼
[BƯỚC 4] PromptBuilderService
   ├── Đọc template từ prompts/post.template.txt
   │                    prompts/comment.template.txt
   │                    prompts/vote.template.txt
   ├── Inject: context + personality + action type
   └── Trả về chuỗi prompt hoàn chỉnh
         │
         ▼
[BƯỚC 5] ContentGeneratorService
   ├── Gọi LLM với prompt đã xây dựng
   ├── Fallback chain: Gemini → Groq → Cerebras → Nvidia
   ├── Nếu tất cả fail → throw Error, log failure
   └── Trả về raw content từ LLM
         │
         ▼
[BƯỚC 6] ValidationService
   ├── Kiểm tra độ dài (min/max characters)
   ├── Kiểm tra định dạng (không có code block lạ)
   ├── Kiểm tra ngôn ngữ (đúng ngôn ngữ yêu cầu)
   └── Nếu invalid → reject, log → end pipeline
         │
         ▼
[BƯỚC 7] APIExecutorService
   ├── Authenticate: đăng nhập với bot user credentials
   ├── Gọi Forum API:
   │   ├── POST /api/v1/posts         (CREATE_POST)
   │   ├── POST /api/v1/comments      (CREATE_COMMENT)
   │   └── POST /api/v1/votes         (VOTE)
   └── Nhận response { id, success }
         │
         ▼
[BƯỚC 8] StatusService
   ├── Ghi nhận kết quả vào user_content_context
   ├── Cập nhật last_action, action_count, next_scheduled
   └── Log bot activity vào logs/
```

### 2.3.3 Giao tiếp với hệ thống backend

Vibe-content có **hai kênh giao tiếp** với phần còn lại của hệ thống:

**Kênh 1 — Đọc context trực tiếp từ Database (Prisma):**

```typescript
// ContextGathererService.ts — chỉ SELECT, không modify
const trendingPosts = await prisma.posts.findMany({
  where: { created_at: { gte: yesterday } },
  orderBy: { view_count: 'desc' },
  take: 10,
  include: { categories: true, post_tags: { include: { tags: true } } }
});
```

*Lý do dùng direct DB:* Hiệu quả hơn cho context aggregation; không cần xác thực API; không có side effect vì chỉ đọc.

**Kênh 2 — Thực thi hành động qua Forum REST API (HTTP):**

```typescript
// APIExecutorService.ts — luôn qua API, không dùng prisma.create()
const response = await axios.post(
  `${FORUM_API_URL}/api/v1/posts`,
  { title, content, categoryId },
  { headers: { Authorization: `Bearer ${botAccessToken}` } }
);
```

*Lý do dùng API:* Kích hoạt đầy đủ business logic (notification, vote count, audit log, Zod validation).

---

## 2.4 Frontend Module Structure

### 2.4.1 Cấu trúc thư mục frontend

```
frontend/src/
├── main.tsx                   ← Entry point React
│
├── app/                       ← App shell, React Router setup
│   ├── App.tsx                ← Root component, route definitions
│   └── QueryProvider.tsx      ← React Query client config
│
├── routes/                    ← Protected/public route wrappers
│   ├── ProtectedRoute.tsx     ← Redirect về /login nếu chưa auth
│   └── GuestRoute.tsx         ← Redirect về / nếu đã auth
│
├── components/                ← Shared reusable components
│   ├── layout/
│   │   ├── Navbar.tsx         ← Thanh điều hướng + auth state
│   │   ├── Sidebar.tsx        ← Sidebar categories/tags
│   │   └── Footer.tsx
│   ├── ui/                    ← Atomic UI (Button, Input, Modal...)
│   ├── post/                  ← PostCard, PostEditor, BlockRenderer
│   ├── comment/               ← CommentTree, CommentForm, QuoteBlock
│   └── common/                ← Spinner, ErrorBoundary, Avatar
│
├── pages/                     ← 14 trang (1:1 với route)
│   ├── HomePage.tsx           ← Feed bài viết, filter, sort
│   ├── PostDetailPage.tsx     ← Nội dung bài viết + comment thread
│   ├── CategoriesPage.tsx     ← Danh sách danh mục
│   ├── TagsPage.tsx           ← Danh sách nhãn, bài viết theo tag
│   ├── SearchPage.tsx         ← Full-text search với highlight
│   ├── ProfilePage.tsx        ← Hồ sơ người dùng, bài viết của user
│   ├── EditProfilePage.tsx    ← Chỉnh sửa thông tin cá nhân
│   ├── BookmarksPage.tsx      ← Bài viết đã lưu
│   ├── NotificationsPage.tsx  ← Danh sách thông báo
│   ├── BlockedUsersPage.tsx   ← Danh sách người dùng đã chặn
│   ├── LoginPage.tsx          ← Form đăng nhập
│   ├── RegisterPage.tsx       ← Form đăng ký
│   ├── ForgotPasswordPage.tsx ← Yêu cầu OTP đặt lại mật khẩu
│   └── EditPostPage.tsx       ← Chỉnh sửa bài viết (block editor)
│
├── api/                       ← API client layer
│   ├── axiosInstance.ts       ← Axios config + interceptors
│   └── services/
│       ├── postService.ts     ← React Query hooks cho post
│       ├── commentService.ts  ← React Query hooks cho comment
│       ├── userService.ts     ← React Query hooks cho user
│       └── ...                ← Mỗi domain có file riêng
│
├── contexts/
│   └── AuthContext.tsx        ← Global auth state (user, token, logout)
│
├── hooks/                     ← Custom React hooks
│   ├── useDebounce.ts
│   ├── useInfiniteScroll.ts
│   └── useSSE.ts              ← Kết nối SSE cho notifications
│
├── types/                     ← TypeScript interfaces
├── utils/                     ← Helper functions
└── constants/                 ← App-wide constants
```

### 2.4.2 Phân tầng quản lý state

Frontend sử dụng **hai cơ chế quản lý state** phân tách rõ ràng:

**Server State (React Query):**
- Dữ liệu từ API: posts, comments, users, notifications
- Tự động cache, refetch, background update
- Invalidation sau mutation để đảm bảo dữ liệu tươi

**Client State (React Context):**
- `AuthContext`: thông tin user đăng nhập, access token, hàm logout
- Local state trong component: form input, UI toggle, pagination

```
Frontend State Architecture:
┌─────────────────────────────────────────────────────┐
│                  React Application                  │
│                                                     │
│  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │   SERVER STATE       │  │   CLIENT STATE      │  │
│  │   (React Query)      │  │   (React Context /  │  │
│  │                      │  │    useState)         │  │
│  │  Posts, Comments     │  │                     │  │
│  │  Users, Categories   │  │  AuthContext        │  │
│  │  Notifications       │  │  (user, token)      │  │
│  │  Search Results      │  │                     │  │
│  │                      │  │  Form state         │  │
│  │  Auto-cache 60s      │  │  UI toggles         │  │
│  │  Auto-refetch        │  │  Pagination         │  │
│  └──────────┬───────────┘  └─────────────────────┘  │
│             │ axios                                   │
└─────────────┼───────────────────────────────────────┘
              │ HTTPS
              ▼
         [Backend API]
```

### 2.4.3 Routing và phân quyền phía Frontend

```typescript
// app/App.tsx — Route structure
<Routes>
  {/* Public routes */}
  <Route path="/" element={<HomePage />} />
  <Route path="/posts/:slug" element={<PostDetailPage />} />
  <Route path="/categories" element={<CategoriesPage />} />
  <Route path="/search" element={<SearchPage />} />

  {/* Guest only (redirect nếu đã đăng nhập) */}
  <Route element={<GuestRoute />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* Protected (redirect về /login nếu chưa auth) */}
  <Route element={<ProtectedRoute />}>
    <Route path="/bookmarks" element={<BookmarksPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/profile/:username" element={<ProfilePage />} />
    <Route path="/posts/:slug/edit" element={<EditPostPage />} />
    ...
  </Route>
</Routes>
```

**Cơ chế phân quyền:**
1. `ProtectedRoute` kiểm tra `AuthContext.user` — nếu null thì redirect `/login`
2. Server-side middleware kiểm tra JWT và role — client không thể bypass
3. UI ẩn/hiện các control dựa trên `user.role` (nút Edit/Delete chỉ hiện cho tác giả hoặc moderator)

---

*[Tiếp theo: Chương 3 — Thiết kế API và giao tiếp liên service]*
