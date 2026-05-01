# BÁO CÁO CHUYÊN ĐỀ
## THỰC TẬP HỆ THỐNG THÔNG TIN TÍCH HỢP
### Dự án: MINI-FORUM — Ứng dụng Diễn đàn Trực tuyến Full-stack

---

> **Thời gian thực tập giả định:** 27/01/2026 – 27/04/2026
> **Nguồn tham chiếu:** Codebase tại monorepo `mini-forum`

---

## MỤC LỤC

1. [Tổng quan kiến trúc hệ thống](#1-tổng-quan-kiến-trúc-hệ-thống)
2. [Phân tích và thiết kế module](#2-phân-tích-và-thiết-kế-module)
3. [Thiết kế API và giao tiếp liên service](#3-thiết-kế-api-và-giao-tiếp-liên-service)
4. [Tích hợp AI — Vibe-Content Service](#4-tích-hợp-ai--vibe-content-service)
5. [Bảo mật và kiểm soát truy cập](#5-bảo-mật-và-kiểm-soát-truy-cập)
6. [Triển khai và vận hành](#6-triển-khai-và-vận-hành)
7. [Đánh giá và kết luận](#7-đánh-giá-và-kết-luận)

---

## 1. Tổng quan kiến trúc hệ thống

### 1.1 Lý do chọn kiến trúc Monorepo Multi-service

MINI-FORUM được tổ chức theo mô hình **Monorepo với các service độc lập** — đây là quyết định kiến trúc trung gian giữa monolith và microservices thuần túy.

**So sánh kiến trúc:**

| Tiêu chí | Monolith | **Monorepo Multi-service** | Microservices thuần |
|---|---|---|---|
| Độ phức tạp deploy | Thấp | **Trung bình** | Cao |
| Code sharing | Dễ (cùng codebase) | **Có thể (shared types)** | Khó (cần package riêng) |
| Scale độc lập | Không | **Có (Docker/container)** | Có |
| Phù hợp team nhỏ | Có | **Có** | Không |
| DB isolation | Không | **Không hoàn toàn** (PostgreSQL shared) | Có |

**Lý do chọn:** Team nhỏ, thời gian 3 tháng, cần flexibility để thêm `vibe-content` sau khi forum core hoạt động mà không refactor toàn bộ codebase.

### 1.2 Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MINI-FORUM — Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌───────────────┐                              │
│  │   frontend/  │    │ admin-client/ │   (Browser Clients)          │
│  │ React + Vite │    │ React + Vite  │                              │
│  │   :5173      │    │   :5174       │                              │
│  └──────┬───────┘    └───────┬───────┘                              │
│         │  HTTPS/REST        │  HTTPS/REST                          │
│         │  (VITE_API_URL)    │  (VITE_API_URL)                      │
│         ▼                    ▼                                       │
│  ┌─────────────────────────────────┐                                │
│  │          backend/               │                                │
│  │  Express + TypeScript + Prisma  │                                │
│  │            :5000                │                                │
│  │  ┌──────────────────────────┐  │                                │
│  │  │  14 Controllers          │  │◄──── HTTP/REST ─────────────┐  │
│  │  │  21 Services             │  │   (FORUM_API_URL)           │  │
│  │  │   9 Middlewares          │  │                             │  │
│  │  └──────────────────────────┘  │                             │  │
│  └──────────────┬──────────────────┘                            │  │
│                 │ Prisma ORM                                     │  │
│                 ▼                                                │  │
│  ┌──────────────────────────────┐                               │  │
│  │     PostgreSQL Database      │                               │  │
│  │  (19 models, shared schema)  │◄── Prisma direct ────────────┼──┤
│  └──────────────────────────────┘                               │  │
│                                                                  │  │
│  ┌──────────────────────────────────────────────────────────┐  │  │
│  │                   vibe-content/                          │──┘  │
│  │  Node.js + Prisma + Multi-LLM                            │     │
│  │              :4000                                       │     │
│  │  ┌─────────────────────────────────────────────────┐    │     │
│  │  │ ContentGenerator → LLM Providers (Gemini/Groq/  │    │     │
│  │  │  Cerebras/Nvidia) → APIExecutor → Backend API   │    │     │
│  │  └─────────────────────────────────────────────────┘    │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Nguyên tắc kiến trúc

1. **Single Database, Multiple Consumers:** Backend và vibe-content đều kết nối cùng PostgreSQL — đảm bảo data consistency nhưng tạo coupling ở tầng DB
2. **API-first Integration:** Vibe-content ưu tiên dùng Forum API (không bypass) để kích hoạt business logic (notification, vote count, audit log)
3. **Stateless Backend:** Mọi state lưu trong DB hoặc Redis (future); HTTP request độc lập
4. **Layered Architecture trong Backend:** Controller → Service → Prisma Client → DB

---

## 2. Phân tích và thiết kế module

### 2.1 Sơ đồ Module — Backend

```
backend/src/
│
├── [Module: Auth & Security]
│   ├── authController.ts       ← Request handling
│   ├── authService.ts          ← JWT, bcrypt logic
│   ├── otpService.ts           ← OTP generation/validation
│   ├── emailService.ts         ← Email abstraction
│   ├── brevoApiService.ts      ← Brevo API adapter
│   ├── authMiddleware.ts       ← JWT verification
│   ├── roleMiddleware.ts       ← RBAC enforcement
│   └── securityMiddleware.ts   ← Helmet, CORS, rate-limit
│
├── [Module: Forum Core]
│   ├── postController.ts       ─┐
│   ├── postService.ts           │ Post CRUD, block layout
│   ├── postMediaController.ts   │
│   ├── postMediaService.ts     ─┘
│   ├── commentController.ts    ─┐
│   ├── commentService.ts       ─┘ Comment nested, quote
│   ├── categoryController.ts   ─┐
│   ├── categoryService.ts      ─┘ Category + permissions
│   ├── tagController.ts        ─┐
│   └── tagService.ts           ─┘ Tag management
│
├── [Module: Interaction]
│   ├── voteController.ts       ─┐
│   ├── voteService.ts          ─┘ Vote + reputation
│   ├── bookmarkController.ts   ─┐
│   ├── bookmarkService.ts      ─┘ Bookmark management
│   ├── searchController.ts     ─┐
│   └── searchService.ts        ─┘ Full-text search
│
├── [Module: Notification]
│   ├── notificationController.ts ─┐
│   ├── notificationService.ts    ─┘ Create/read notifications
│   └── sseService.ts              ← SSE connection management
│
├── [Module: Moderation & Admin]
│   ├── adminController.ts      ← Admin dashboard API
│   ├── blockReportController.ts─┐
│   ├── blockService.ts          │ User blocking
│   ├── blockValidationService.ts│
│   ├── reportService.ts        ─┘ Report management
│   ├── auditLogService.ts       ← Audit trail
│   ├── configController.ts      ← Dynamic config
│   └── metricsService.ts        ← HTTP metrics
│
├── [Module: User Management]
│   ├── userController.ts       ─┐
│   ├── userService.ts          ─┘ Profile, avatar
│   └── imagekitService.ts       ← ImageKit CDN adapter
│
└── [Cross-cutting concerns]
    ├── validateMiddleware.ts    ← Zod validation wrapper
    ├── errorMiddleware.ts       ← Centralized error handling
    ├── httpLoggerMiddleware.ts  ← HTTP access log
    ├── metricsMiddleware.ts     ← Metrics collection
    └── requestIdMiddleware.ts   ← Request tracing
```

### 2.2 Dependency Graph — Module Relations

```
securityMiddleware
       ↓ (applied globally)
authMiddleware → [JWT verify] → authService → [DB: users, refresh_tokens]
       ↓ (if authenticated)
roleMiddleware → [RBAC check]
       ↓ (if authorized)
validateMiddleware → [Zod parse]
       ↓ (if valid)
[Controller] → [Service] → [Prisma Client] → [PostgreSQL]
       ↓ (side effects)
       ├── auditLogService (admin actions)
       ├── notificationService → sseService (user events)
       └── metricsMiddleware (request metrics)
```

**Nguyên tắc:** Mỗi module độc lập; giao tiếp qua service interfaces. Controller không gọi trực tiếp Prisma — luôn qua service layer.

### 2.3 Module Architecture — Vibe-Content

```
vibe-content/src/
│
├── [Core Pipeline]
│   ├── scheduler/          ← Cron job trigger (định kỳ)
│   │     └── jobs.ts
│   │
│   ├── services/
│   │   ├── ContextGathererService.ts  ← Thu thập context từ DB
│   │   ├── ActionSelectorService.ts   ← Chọn hành động (post/comment/vote)
│   │   ├── PersonalityService.ts      ← Load bot personality
│   │   ├── PromptBuilderService.ts    ← Xây dựng prompt cho LLM
│   │   ├── ContentGeneratorService.ts ← Gọi LLM API
│   │   ├── ValidationService.ts       ← Validate output LLM
│   │   ├── APIExecutorService.ts      ← Gửi content về Forum API
│   │   └── StatusService.ts           ← Track bot status
│   │
│   ├── services/llm/       ← LLM Provider adapters
│   │   ├── geminiProvider.ts
│   │   ├── groqProvider.ts
│   │   ├── cerebrasProvider.ts
│   │   └── nvidiaProvider.ts
│   │
│   └── tracking/           ← Theo dõi metrics bot
│
└── [Config & Types]
    ├── config/
    └── types/
```

**Pipeline bot thực thi:**

```
[Cron trigger]
     │
     ▼
ContextGatherer: Query DB → trending posts, active users, recent topics
     │
     ▼
ActionSelector: Quyết định bot sẽ làm gì? (new post / comment / vote)
     │
     ▼
PersonalityService: Load personality profile của bot user
     │
     ▼
PromptBuilder: Tạo prompt từ context + personality + action type
     │
     ▼
ContentGenerator: Gọi LLM → nhận raw content
  (fallback chain: Gemini → Groq → Cerebras → Nvidia)
     │
     ▼
ValidationService: Kiểm tra content hợp lệ (độ dài, format, ngôn ngữ)
     │
     ▼
APIExecutor: POST/PATCH/DELETE đến Forum Backend API
  (authenticated với bot user credentials)
     │
     ▼
StatusService: Ghi nhận kết quả, cập nhật user_content_context
```

### 2.4 Frontend Module Structure

```
frontend/src/
│
├── [Routing & Layout]
│   ├── app/                ← App shell, router setup
│   ├── routes/             ← Route definitions
│   └── components/layout/  ← Shared layout (Navbar, Sidebar)
│
├── [Feature Modules]
│   ├── pages/              ← 14 trang (1 page = 1 route)
│   │   ├── HomePage.tsx            ← Feed bài viết
│   │   ├── PostDetailPage.tsx      ← Chi tiết bài viết + comments
│   │   ├── CategoriesPage.tsx      ← Danh mục
│   │   ├── TagsPage.tsx            ← Tags
│   │   ├── SearchPage.tsx          ← Tìm kiếm
│   │   ├── ProfilePage.tsx         ← Hồ sơ người dùng
│   │   ├── EditProfilePage.tsx     ← Chỉnh sửa profile
│   │   ├── BookmarksPage.tsx       ← Bookmark cá nhân
│   │   ├── NotificationsPage.tsx   ← Danh sách notification
│   │   ├── BlockedUsersPage.tsx    ← Danh sách blocked
│   │   ├── LoginPage.tsx           ← Đăng nhập
│   │   ├── RegisterPage.tsx        ← Đăng ký
│   │   ├── ForgotPasswordPage.tsx  ← Quên mật khẩu
│   │   └── EditPostPage.tsx        ← Chỉnh sửa bài viết
│   │
│   ├── components/         ← Shared/reusable components
│   ├── hooks/              ← Custom React hooks
│   └── api/                ← API client (axios + React Query)
│
├── [State Management]
│   ├── contexts/           ← React Context (AuthContext)
│   └── app/store.ts        ← Global state (nếu có)
│
└── [Utilities]
    ├── utils/
    ├── types/
    └── constants/
```

---

## 3. Thiết kế API và giao tiếp liên service

### 3.1 REST API Design Principles

MINI-FORUM API tuân theo các nguyên tắc REST:

| Nguyên tắc | Áp dụng |
|-----------|---------|
| **Resource-based URL** | `/posts`, `/users/:id/posts`, `/comments/:id` |
| **HTTP Verbs đúng** | GET (read), POST (create), PATCH (partial update), DELETE |
| **Stateless** | Mọi request mang token trong header |
| **Consistent error format** | `{ error: string, details?: object }` |
| **Pagination** | `?page=1&limit=20` cho danh sách |

### 3.2 API Routes — Mapping chi tiết

```
backend/src/routes/index.ts
├── /auth          → authRoutes.ts
├── /users         → userRoutes.ts
├── /posts         → postRoutes.ts
├── /comments      → commentRoutes.ts
├── /categories    → categoryRoutes.ts
├── /tags          → tagRoutes.ts
├── /votes         → voteRoutes.ts
├── /bookmarks     → bookmarkRoutes.ts
├── /search        → searchRoutes.ts
├── /notifications → notificationRoutes.ts
├── /reports       → blockReportRoutes.ts
├── /blocks        → blockReportRoutes.ts
├── /admin         → adminRoutes.ts
├── /config        → configRoutes.ts
└── /media         → postRoutes.ts (nested media endpoints)
```

### 3.3 Authentication Flow — Token Exchange

```
Client                                    Backend
  │                                          │
  │──── POST /auth/login ───────────────────►│
  │     { email, password }                  │ authService.login()
  │                                          │ bcrypt.compare()
  │◄─── { accessToken, user } ──────────────│ JWT sign (15min)
  │     Set-Cookie: refreshToken (httpOnly)  │ Store in refresh_tokens table
  │                                          │
  │  [15 minutes later]                      │
  │                                          │
  │──── POST /auth/refresh ─────────────────►│
  │     Cookie: refreshToken                 │ Verify token in DB
  │◄─── { accessToken } ────────────────────│ Issue new access token
  │                                          │
  │  [Subsequent requests]                   │
  │──── GET /posts ─────────────────────────►│
  │     Authorization: Bearer {accessToken}  │ authMiddleware.verify()
  │◄─── { posts: [...] } ───────────────────│
```

### 3.4 Inter-service Communication Matrix

| Source | Target | Protocol | Authentication | Data Direction |
|--------|--------|---------|----------------|----------------|
| frontend | backend | HTTPS/REST | JWT Bearer token | Request/Response |
| admin-client | backend | HTTPS/REST | JWT Bearer token | Request/Response |
| vibe-content | backend | HTTP/REST | JWT Bearer token (bot user) | Request only |
| vibe-content | PostgreSQL | Prisma/TCP | DATABASE_URL | Read (context gathering) |
| backend | PostgreSQL | Prisma/TCP | DATABASE_URL | Read/Write |
| backend | Brevo | HTTPS/REST | API Key (env) | Request (send email) |
| backend | ImageKit | HTTPS/REST | API Key (env) | Upload/Delete |
| frontend | backend (SSE) | HTTP/SSE | JWT in header | Server push |

### 3.5 API Security Middleware Stack

Mọi request qua Backend đều xử lý theo thứ tự:

```
Incoming Request
       │
       ▼
[1] requestIdMiddleware    → Gán unique ID cho request (tracing)
       │
       ▼
[2] httpLoggerMiddleware   → Log request/response
       │
       ▼
[3] metricsMiddleware      → Thu thập HTTP metrics
       │
       ▼
[4] securityMiddleware
    ├── helmet()           → Security headers (CSP, HSTS, X-Frame-Options)
    ├── cors()             → CORS policy (chỉ cho phép FRONTEND_URL)
    └── rateLimit()        → Giới hạn request/phút theo IP
       │
       ▼
[5] authMiddleware (optional, per-route)
    └── JWT verify → attach req.user
       │
       ▼
[6] roleMiddleware (optional, per-route)
    └── Check req.user.role >= required role
       │
       ▼
[7] validateMiddleware (per-route)
    └── Zod schema parse → throw 400 if invalid
       │
       ▼
[8] Controller Handler
       │
       ▼
[9] errorMiddleware (global error handler)
    └── Format error response
```

### 3.6 Frontend API Integration — React Query Pattern

Frontend sử dụng **React Query** để quản lý server state:

```typescript
// Ví dụ: frontend/src/api/services/postService.ts
const usePostsQuery = (categoryId?: number) =>
  useQuery({
    queryKey: ['posts', categoryId],
    queryFn: () => api.get('/posts', { params: { categoryId } }),
    staleTime: 1000 * 60, // Cache 1 phút
  });

// Mutation với optimistic update
const useCreatePostMutation = () =>
  useMutation({
    mutationFn: (data) => api.post('/posts', data),
    onSuccess: () => queryClient.invalidateQueries(['posts']),
  });
```

**Lợi ích:**
- Automatic caching và refetch
- Loading/error states quản lý tập trung
- Optimistic updates cho trải nghiệm mượt

---

## 4. Tích hợp AI — Vibe-Content Service

### 4.1 Kiến trúc tích hợp AI

Vibe-Content được thiết kế như một **autonomous agent** hoạt động định kỳ:

```
┌─────────────────────────────────────────────────────────────┐
│                     VIBE-CONTENT SERVICE                    │
│                                                             │
│  ┌─────────────┐    ┌──────────────────────────────────┐   │
│  │  Scheduler  │───►│         Bot Pipeline              │   │
│  │ (Cron Jobs) │    │                                  │   │
│  └─────────────┘    │  Context → Action → Prompt →     │   │
│                     │  LLM → Validate → Execute         │   │
│                     └─────────────┬────────────────────┘   │
│                                   │                         │
│  ┌────────────────────────────────▼──────────────────────┐ │
│  │               LLM Provider Abstraction                 │ │
│  │                                                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐ │ │
│  │  │  Gemini  │  │   Groq   │  │ Cerebras │  │ Nvidia│ │ │
│  │  │(Primary) │→ │(Fallback)│→ │(Fallback)│→ │(Last) │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │ Direct Prisma (READ only)          │ HTTP REST API
         ▼                                    ▼
   [PostgreSQL]                        [Backend :5000]
   (Context gathering)                 (Action execution)
```

### 4.2 Multi-LLM Fallback Chain

**Lý do thiết kế:** Các LLM provider có tính khả dụng khác nhau (rate limit, quota, downtime).

```typescript
// vibe-content/src/services/ContentGeneratorService.ts (logic)
async function generateContent(prompt: string): Promise<string> {
  const providers = [geminiProvider, groqProvider, cerebrasProvider, nvidiaProvider];
  
  for (const provider of providers) {
    try {
      const result = await provider.generate(prompt);
      if (result) return result;
    } catch (error) {
      // Log failure, try next provider
      continue;
    }
  }
  throw new Error('All LLM providers failed');
}
```

**LLM Providers và đặc điểm:**

| Provider | Model | Điểm mạnh | Điểm yếu |
|---------|-------|-----------|---------|
| Google Gemini | gemini-pro | Chất lượng cao, multi-language | Rate limit nghiêm |
| Groq | llama/mixtral | Rất nhanh (inference speed) | Chất lượng thấp hơn |
| Cerebras | llama | Nhanh, ít rate limit | Mới, ít tài liệu |
| Nvidia | llama/mistral | Stable, enterprise-grade | Cần API key |

### 4.3 Personality System

Mỗi bot user có "tính cách" riêng được lưu trong prompt templates:

```
vibe-content/prompts/
├── post.template.txt      ← Template sinh bài viết
├── comment.template.txt   ← Template sinh bình luận
└── vote.template.txt      ← Template quyết định vote

vibe-content/seed/
├── botUsers.ts            ← Danh sách bot với personality description
└── tags.ts                ← Tag seeds
```

**Personality ảnh hưởng đến:**
- Văn phong (formal/informal)
- Chủ đề ưu thích
- Tần suất và loại tương tác
- Reaction với trending topics

### 4.4 Context-Aware Action Selection

```
ContextGatherer thu thập:
├── Trending posts (nhiều view, comment gần đây)
├── Posts ít comment (cần kích hoạt thảo luận)
├── Các topic phổ biến theo category
└── user_content_context: lịch sử bot đã làm gì

ActionSelector quyết định:
├── CREATE_POST: Khi thiếu nội dung mới trong category
├── CREATE_COMMENT: Khi post có nhiều view nhưng ít comment
└── VOTE: Khi cần tăng engagement tự nhiên
```

> **Spec tham chiếu:** `vibe-content/docs/context-aware-actions-spec.md`

### 4.5 Tích hợp qua Forum API — Không bypass

**Nguyên tắc quan trọng:** Vibe-content không ghi trực tiếp vào DB cho các action (post/comment/vote). Phải gọi qua Forum API để:
- Business logic được kích hoạt (notification, vote count, audit log)
- Validation được áp dụng
- Content đúng với schema expectations

```
❌ Sai: vibe-content → Prisma.post.create() [bypass business logic]
✅ Đúng: vibe-content → POST /posts [kích hoạt full pipeline]
```

**Ngoại lệ:** `ContextGathererService` đọc trực tiếp từ DB (SELECT only) để thu thập context hiệu quả — không có side effect.

---

## 5. Bảo mật và kiểm soát truy cập

### 5.1 Security Architecture Overview

```
Layer 1: Network / Transport
├── HTTPS (SSL/TLS) cho production
└── CORS whitelist: chỉ FRONTEND_URL được phép

Layer 2: Application Security (securityMiddleware.ts)
├── Helmet: 12+ security headers
│   ├── Content-Security-Policy (CSP)
│   ├── X-Frame-Options: DENY
│   ├── X-Content-Type-Options: nosniff
│   └── Strict-Transport-Security (HSTS)
├── Rate Limiting: express-rate-limit
│   ├── Global: 100 req/15min per IP
│   └── Auth routes: 10 req/15min (stricter)
└── Request size limit: express bodyParser

Layer 3: Authentication (authMiddleware.ts)
├── JWT Access Token: RS256/HS256, exp=15min
├── Refresh Token: stored in DB, revocable
└── httpOnly cookie cho refresh token (XSS protection)

Layer 4: Authorization (roleMiddleware.ts)
├── RBAC: MEMBER < MODERATOR < ADMIN
└── Resource ownership: chỉ author hoặc admin mới sửa/xóa

Layer 5: Input Validation (validateMiddleware.ts)
├── Zod schema cho mọi request body
└── SQL injection: Prisma ORM parameterized queries
```

### 5.2 RBAC Matrix

| Resource | Guest | Member | Moderator | Admin |
|----------|-------|--------|-----------|-------|
| Xem post (ALL category) | ✅ | ✅ | ✅ | ✅ |
| Xem post (MEMBER category) | ❌ | ✅ | ✅ | ✅ |
| Tạo post | ❌ | ✅ | ✅ | ✅ |
| Sửa post của mình | ❌ | ✅ | ✅ | ✅ |
| Sửa/xóa post người khác | ❌ | ❌ | ✅ | ✅ |
| Ghim bài viết | ❌ | ❌ | ❌ | ✅ |
| Quản lý user | ❌ | ❌ | ❌ | ✅ |
| Xử lý báo cáo | ❌ | ❌ | ✅ | ✅ |
| Xem audit log | ❌ | ❌ | ❌ | ✅ |
| API admin dashboard | ❌ | ❌ | ❌ | ✅ |

### 5.3 Data Protection

**Password:** bcrypt hash với salt rounds=10 — không store plaintext.

**Sensitive tokens:** Refresh tokens stored in DB với `expires_at` → server-side revocation khi logout.

**ImageKit:** API key chỉ trong env variables (`IMAGEKIT_PRIVATE_KEY`), không expose ra client. Upload qua server-side signed URL.

**Audit Trail:** Mọi action admin ghi vào `audit_logs` với `ip_address` và `user_agent` → non-repudiation.

### 5.4 OWASP Top 10 Compliance

| OWASP | Nguy cơ | Biện pháp trong codebase |
|-------|---------|--------------------------|
| A01 Broken Access Control | Truy cập resource không có quyền | roleMiddleware + resource ownership check |
| A02 Crypto Failures | Lưu password plaintext | bcrypt hash (authService.ts) |
| A03 Injection | SQL injection | Prisma ORM (parameterized), không raw query |
| A04 Insecure Design | Logic bypass | Service layer isolation, API-only for bot |
| A05 Security Misconfiguration | Default config | Helmet headers, CORS whitelist |
| A07 Auth Failures | Token theft | Short-lived JWT, httpOnly refresh cookie |
| A09 Logging Failures | Không có audit | auditLogService + httpLoggerMiddleware |

---

## 6. Triển khai và vận hành

### 6.1 Containerization — Docker Multi-stage

**Backend Dockerfile (multi-stage):**

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build     # tsc compile

# Stage 2: Runtime
FROM node:18-alpine AS runner
# suexec: privilege drop từ root → node user
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# docker-entrypoint.sh: chạy prisma migrate deploy trước khi start
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
```

**Lợi ích multi-stage:**
- Image size nhỏ (không có dev dependencies, source TypeScript)
- Security: chỉ runtime artifacts trong final image

### 6.2 Service Deployment Config

| Service | Platform | Config file | Port |
|---------|----------|------------|------|
| backend | Render.com | `backend/render.json` | 5000 |
| vibe-content | Render.com | `vibe-content/render.json` | 4000 |
| frontend | Vercel | `frontend/vercel.json` | - |
| admin-client | Vercel | `admin-client/vercel.json` | - |
| PostgreSQL | Supabase/Render | `DB_SETUP.md` | 5432 |

### 6.3 Environment Configuration

**Backend env variables:**

```env
# Database
DATABASE_URL=postgresql://...    # Với connection pooling (pgbouncer)
DIRECT_URL=postgresql://...      # Direct connection cho migrations

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Brevo)
BREVO_API_KEY=...
BREVO_FROM_EMAIL=...

# ImageKit
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...

# CORS
FRONTEND_URL=https://...
ADMIN_CLIENT_URL=https://...

# Feature flags
COMMENT_EDIT_TIME_LIMIT=30      # Giây
```

### 6.4 Database Migration Strategy

```
Local Development:
$ npx prisma migrate dev --name "feature_name"
  → Tạo migration file trong prisma/migrations/
  → Apply migration
  → Generate Prisma Client

Production Deploy (docker-entrypoint.sh):
$ npx prisma migrate deploy
  → Apply tất cả pending migrations
  → Không tạo migration mới
```

**Rollback strategy:** Prisma không có native rollback — cần viết migration mới để revert. Backup database trước khi deploy (`backups/` + `backupDb.ts`).

### 6.5 Monitoring & Observability

**HTTP Metrics** (metricsMiddleware.ts + metricsService.ts):
- Request count theo endpoint và method
- Response time phân phối
- Error rate theo status code

**Operational Dashboard** (admin-client/OperationalDashboardPage.tsx):
- Real-time metrics từ `/admin/metrics` endpoint
- Hiển thị top endpoints by volume và by error rate

**Log Management:**
- `httpLoggerMiddleware.ts`: structured HTTP access logs
- `vibe-content/logs/`: bot activity logs
- Có thể export sang log aggregation service (ELK/Loki)

### 6.6 Maintenance Scripts

```
backend/scripts/
├── backupDb.ts           ← Backup PostgreSQL → local file
├── cleanupImagekit.ts    ← Xóa orphaned images trên ImageKit CDN
├── cleanupLegacyAvatars.ts ← Cleanup deprecated avatar_url
├── clearData.ts          ← Xóa test data
├── migrateAvatarUrls.ts  ← Migration legacy avatar fields
├── migratePostsToBlocks.ts ← Migration posts sang block layout
├── resetAllMedia.ts      ← Reset tất cả media
├── resetAvatarMedia.ts   ← Reset avatar media
├── resetPostMedia.ts     ← Reset post media
└── wipeAllDb.ts          ← Xóa toàn bộ DB (dev only)
```

---

## 7. Đánh giá và kết luận

### 7.1 Tổng kết kiến trúc

| Khía cạnh | Quyết định | Lý do | Trade-off |
|-----------|-----------|-------|-----------|
| Monorepo | ✅ 4 packages cùng repo | Code sharing, tooling thống nhất | Khó scale team lớn |
| Shared PostgreSQL | ✅ Backend + Vibe-content | Simplicity, data consistency | Coupling ở DB level |
| REST API (không GraphQL) | ✅ REST | Đơn giản, team nhỏ, tooling tốt | Over-fetching trên một số endpoint |
| SSE (không WebSocket) | ✅ SSE | Đủ cho notification one-way | Không hỗ trợ bidirectional |
| Multi-LLM fallback | ✅ 4 providers | Resilience, zero downtime | Phức tạp testing |
| Prisma ORM | ✅ Prisma | Type-safe, migration management | Abstraction cost, một số query kém efficient |
| JWT + Refresh Token | ✅ Stateless auth | Scalable, no session storage | Cần revocation mechanism (refresh tokens in DB) |

### 7.2 Điểm mạnh tích hợp

1. **Layered security:** 5 lớp bảo mật độc lập, dễ audit và test
2. **API contract rõ ràng:** Vibe-content không bypass business logic
3. **Type-safe end-to-end:** TypeScript từ DB schema (Prisma) → Service → Controller → Frontend
4. **Migration versioning:** Toàn bộ schema evolution có lịch sử và reproducible

### 7.3 Giới hạn và đề xuất phát triển

| Giới hạn hiện tại | Đề xuất nâng cấp |
|------------------|-----------------|
| SSE in-memory → không horizontal scale | Chuyển sang Redis Pub/Sub cho notification |
| Metrics in-memory → mất khi restart | Tích hợp Prometheus + Grafana |
| Single PostgreSQL → SPOF | Read replica cho vibe-content context queries |
| CI/CD chưa có pipeline tự động | GitHub Actions: lint + test + build + deploy |
| E2E test thiếu | Playwright cho critical user flows |

### 7.4 Kết luận

MINI-FORUM thể hiện một mô hình tích hợp hệ thống thực tế: 4 service với trách nhiệm rõ ràng, giao tiếp qua API contracts được định nghĩa tốt, bảo mật nhiều lớp theo OWASP, và tích hợp AI phi tập trung qua multi-LLM fallback. Kiến trúc monorepo multi-service phù hợp với giai đoạn đầu của dự án — dễ phát triển với team nhỏ, đủ linh hoạt để scale từng service độc lập khi cần.

---

## PHỤ LỤC

### A. Sơ đồ luồng dữ liệu End-to-End

```
User Browser
     │
     │ HTTPS
     ▼
Vercel CDN (frontend static)
     │
     │ API calls (HTTPS)
     ▼
Render.com (backend container)
     │              │
     │ Prisma        │ HTTPS
     ▼              ▼
Supabase/Render  Brevo API    ImageKit CDN
(PostgreSQL)     (Email)      (Media storage)
     ▲
     │ Prisma (read)
     │ HTTP (write via API)
Render.com (vibe-content container)
     │
     │ HTTPS
     ▼
LLM APIs (Gemini/Groq/Cerebras/Nvidia)
```

### B. Technology Dependency Map

```
backend
├── express ^4          ← HTTP framework
├── @prisma/client      ← ORM
├── jsonwebtoken        ← JWT
├── bcrypt              ← Password hashing
├── zod                 ← Validation
├── helmet              ← Security headers
├── express-rate-limit  ← Rate limiting
├── cors                ← CORS
├── @sentry/node        ← Error tracking (optional)
└── vitest              ← Testing

frontend / admin-client
├── react 18            ← UI
├── react-router-dom 6  ← Routing
├── @tanstack/react-query ← Server state
├── axios               ← HTTP client
├── tailwindcss         ← Styling
├── @radix-ui/*         ← Accessible components (admin)
├── react-hook-form     ← Form management
└── vitest              ← Testing

vibe-content
├── @google/generative-ai ← Gemini
├── groq-sdk              ← Groq
├── node-cron             ← Scheduler
└── @prisma/client        ← DB access
```
