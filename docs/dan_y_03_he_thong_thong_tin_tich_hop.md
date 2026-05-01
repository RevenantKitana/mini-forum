# DÀN Ý BÁO CÁO
## MÔN: HỆ THỐNG THÔNG TIN TÍCH HỢP (HTTTTÍCH HỢP)
### Dự án: MINI-FORUM — Ứng dụng Diễn đàn Trực tuyến Full-stack

---

> **Thời gian thực tập giả định:** 27/01/2026 – 27/04/2026
> **Nguồn tham chiếu:** Codebase monorepo `mini-forum`, `docs/03_bao_cao_he_thong_thong_tin_tich_hop.md`

---

## CHƯƠNG 1 — TỔNG QUAN KIẾN TRÚC HỆ THỐNG

### 1.1 Lý do chọn kiến trúc Monorepo Multi-service
- **Nội dung cốt lõi:** So sánh 3 kiến trúc trên 5 tiêu chí:

| Tiêu chí | Monolith | **Monorepo Multi-service** | Microservices thuần |
|---|---|---|---|
| Độ phức tạp deploy | Thấp | **Trung bình** | Cao |
| Code sharing | Dễ | **Có (shared types)** | Khó (cần package riêng) |
| Scale độc lập | Không | **Có (Docker/container)** | Có |
| Phù hợp team nhỏ | Có | **Có** | Không |
| DB isolation | Không | **Không hoàn toàn** | Có |

- **Lý do chọn:** Team nhỏ, 3 tháng, cần flexibility thêm `vibe-content` sau khi forum core hoạt động mà không refactor toàn bộ.

### 1.2 Kiến trúc tổng thể (4-tier)
- **Nội dung cốt lõi:** Sơ đồ kiến trúc với 4 lớp:
  - **Tier 1 — Browser Clients:** `frontend/` (:5173), `admin-client/` (:5174).
  - **Tier 2 — Backend API:** `backend/` Express/TypeScript/Prisma (:5000) — 14 Controllers, 21 Services, 9 Middlewares.
  - **Tier 3 — Database:** PostgreSQL (:5432) — 19 models, shared schema giữa backend và vibe-content.
  - **Tier 4 — AI Service:** `vibe-content/` Node.js/Prisma/Multi-LLM (:4000) — kết nối DB trực tiếp (read context) + HTTP REST đến backend (write action).

### 1.3 Nguyên tắc kiến trúc (4 nguyên tắc cốt lõi)
- **Nội dung cốt lõi:**
  1. **Single Database, Multiple Consumers:** Backend + Vibe-content dùng chung PostgreSQL — consistency cao, coupling ở tầng DB.
  2. **API-first Integration:** Vibe-content ưu tiên gọi Forum API (không bypass) → kích hoạt business logic đầy đủ (notification, vote count, audit log).
  3. **Stateless Backend:** Mọi state trong DB; HTTP request độc lập nhau.
  4. **Layered Architecture:** Controller → Service → Prisma Client → DB (không skip layer).

---

## CHƯƠNG 2 — PHÂN TÍCH VÀ THIẾT KẾ MODULE

### 2.1 Sơ đồ Module — Backend (5 module)
- **Nội dung cốt lõi:** Backend tổ chức thành 5 module chức năng:
  - **[Auth & Security]:** authController, authService, otpService, emailService, brevoApiService, authMiddleware, roleMiddleware, securityMiddleware.
  - **[Forum Core]:** postController/Service, postMediaController/Service, commentController/Service, categoryController/Service, tagController/Service.
  - **[Interaction]:** voteController/Service, bookmarkController/Service, searchController/Service.
  - **[Notification]:** notificationController/Service, sseService.
  - **[Moderation & Admin]:** adminController, blockReportController, blockService, blockValidationService, reportService, auditLogService, configController, metricsService.
  - **[User Management]:** userController/Service, imagekitService.
  - **[Cross-cutting]:** validateMiddleware, errorMiddleware, httpLoggerMiddleware, metricsMiddleware, requestIdMiddleware.

### 2.2 Dependency Graph — Module Relations
- **Nội dung cốt lõi:** Luồng xử lý request từ trên xuống:
  `securityMiddleware` (global) → `authMiddleware` (JWT verify) → `roleMiddleware` (RBAC check) → `validateMiddleware` (Zod parse) → `[Controller]` → `[Service]` → `[Prisma Client]` → `[PostgreSQL]`
  + Side effects: `auditLogService` (admin actions), `notificationService → sseService` (user events), `metricsMiddleware` (request metrics).
- **Nguyên tắc:** Controller không gọi Prisma trực tiếp — luôn qua service layer.

### 2.3 Module Architecture — Vibe-Content (Pipeline 8 bước)
- **Nội dung cốt lõi:** Cấu trúc service và pipeline thực thi:
  ```
  [Cron trigger] → ContextGathererService (Query DB: trending posts, recent topics)
  → ActionSelectorService (CREATE_POST / CREATE_COMMENT / VOTE)
  → PersonalityService (Load bot personality)
  → PromptBuilderService (context + personality + action type)
  → ContentGeneratorService (gọi LLM với fallback chain)
  → ValidationService (kiểm tra độ dài, format, ngôn ngữ)
  → APIExecutorService (POST/PATCH/DELETE đến Forum API)
  → StatusService (ghi nhận kết quả, cập nhật user_content_context)
  ```

### 2.4 Frontend Module Structure
- **Nội dung cốt lõi:** 4 nhóm trong `frontend/src/`:
  - **Routing & Layout:** `app/`, `routes/`, `components/layout/` (Navbar, Sidebar).
  - **Feature Modules:** `pages/` — 14 trang (HomePage, PostDetailPage, SearchPage, ProfilePage, NotificationsPage, BookmarksPage, BlockedUsersPage, LoginPage, RegisterPage, ForgotPasswordPage, EditPostPage, CategoriesPage, TagsPage, EditProfilePage).
  - **State Management:** `contexts/` (AuthContext), React Query cho server state.
  - **Utilities:** `utils/`, `types/`, `constants/`, `hooks/`.

---

## CHƯƠNG 3 — THIẾT KẾ API VÀ GIAO TIẾP LIÊN SERVICE

### 3.1 REST API Design Principles
- **Nội dung cốt lõi:** 5 nguyên tắc REST áp dụng:
  1. Resource-based URL: `/posts`, `/users/:id/posts`, `/comments/:id`.
  2. HTTP Verbs đúng: GET (read), POST (create), PATCH (partial update), DELETE.
  3. Stateless: mọi request mang JWT trong header.
  4. Consistent error format: `{ error: string, details?: object }`.
  5. Pagination: `?page=1&limit=20` cho danh sách.

### 3.2 API Routes — 15 nhóm route
- **Nội dung cốt lõi:** Mapping `backend/src/routes/index.ts` → 15 route file: `/auth`, `/users`, `/posts`, `/comments`, `/categories`, `/tags`, `/votes`, `/bookmarks`, `/search`, `/notifications`, `/reports`, `/blocks`, `/admin`, `/config`, `/media`.

### 3.3 Authentication Flow — Token Exchange
- **Nội dung cốt lõi:** Sequence diagram 3 giai đoạn:
  1. Login: `POST /auth/login` → bcrypt.compare() → JWT sign (15min) → lưu refresh_token trong DB → `Set-Cookie: refreshToken (httpOnly)`.
  2. Refresh: `POST /auth/refresh` (gửi cookie) → verify token trong DB → issue new access token.
  3. Authenticated request: `Authorization: Bearer {accessToken}` → `authMiddleware.verify()` → proceed.

### 3.4 Inter-service Communication Matrix (8 kết nối)
- **Nội dung cốt lõi:** Bảng đầy đủ:

| Source | Target | Protocol | Auth | Chiều |
|--------|--------|---------|------|-------|
| frontend | backend | HTTPS/REST | JWT Bearer | Request/Response |
| admin-client | backend | HTTPS/REST | JWT Bearer | Request/Response |
| vibe-content | backend | HTTP/REST | JWT Bearer (bot user) | Request only |
| vibe-content | PostgreSQL | Prisma/TCP | DATABASE_URL | Read only |
| backend | PostgreSQL | Prisma/TCP | DATABASE_URL | Read/Write |
| backend | Brevo | HTTPS/REST | API Key (env) | Request (gửi email) |
| backend | ImageKit | HTTPS/REST | API Key (env) | Upload/Delete |
| frontend | backend (SSE) | HTTP/SSE | JWT in header | Server push |

### 3.5 API Security Middleware Stack (9 lớp)
- **Nội dung cốt lõi:** Thứ tự xử lý request:
  1. `requestIdMiddleware` — gán unique ID cho request (tracing).
  2. `httpLoggerMiddleware` — log request/response.
  3. `metricsMiddleware` — thu thập HTTP metrics.
  4. `securityMiddleware` → Helmet (12+ security headers: CSP, HSTS, X-Frame-Options), CORS whitelist (FRONTEND_URL only), Rate Limiting (100 req/15min global, 10 req/15min cho `/auth/*`).
  5. `authMiddleware` (per-route) — JWT verify, attach `req.user`.
  6. `roleMiddleware` (per-route) — RBAC check `req.user.role`.
  7. `validateMiddleware` (per-route) — Zod schema parse, throw 400 nếu invalid.
  8. Controller Handler — business logic.
  9. `errorMiddleware` (global) — format error response.

### 3.6 Frontend API Integration — React Query Pattern
- **Nội dung cốt lõi:** React Query quản lý server state với 3 lợi ích chính — automatic caching + refetch, loading/error states tập trung, optimistic updates.
- Pattern query với `queryKey`, `staleTime`; pattern mutation với `onSuccess: invalidateQueries`.

---

## CHƯƠNG 4 — TÍCH HỢP AI — VIBE-CONTENT SERVICE

### 4.1 Kiến trúc tích hợp AI (Autonomous Agent)
- **Nội dung cốt lõi:** Vibe-content là autonomous agent định kỳ; 2 kết nối:
  - PostgreSQL (read-only via Prisma) → thu thập context.
  - Backend REST API (write via HTTP) → thực thi action.
- **Sơ đồ:** Scheduler → Bot Pipeline (Context→Action→Prompt→LLM→Validate→Execute) → LLM Provider Abstraction (4 providers).

### 4.2 Multi-LLM Fallback Chain
- **Nội dung cốt lõi:** Lý do — các LLM provider có uptime/rate limit khác nhau; fallback loop qua 4 provider:

| Provider | Model | Điểm mạnh | Điểm yếu |
|---------|-------|-----------|---------|
| Google Gemini (Primary) | gemini-pro | Chất lượng cao, multi-language | Rate limit nghiêm |
| Groq (Fallback 1) | llama/mixtral | Rất nhanh | Chất lượng thấp hơn |
| Cerebras (Fallback 2) | llama | Nhanh, ít rate limit | Mới, ít tài liệu |
| Nvidia (Fallback 3) | llama/mistral | Stable, enterprise-grade | Cần API key |

- **Code pattern:** Loop qua `providers` array; `try/catch` mỗi provider; `throw` khi tất cả fail.

### 4.3 Personality System
- **Nội dung cốt lõi:** Mỗi bot user có tính cách riêng:
  - `vibe-content/prompts/`: post.template.txt, comment.template.txt, vote.template.txt.
  - `vibe-content/seed/botUsers.ts` — danh sách bot với personality description.
  - Personality ảnh hưởng: văn phong (formal/informal), chủ đề ưu thích, tần suất tương tác, phản ứng với trending topics.

### 4.4 Context-Aware Action Selection
- **Nội dung cốt lõi:** `ContextGathererService` thu thập từ DB: trending posts, posts ít comment, topics phổ biến theo category, `user_content_context` (lịch sử bot).
- `ActionSelectorService` quyết định: CREATE_POST (thiếu nội dung mới), CREATE_COMMENT (nhiều view/ít comment), VOTE (tăng engagement).
- Spec tham chiếu: `vibe-content/docs/context-aware-actions-spec.md`.

### 4.5 Nguyên tắc "API-first, No DB Bypass"
- **Nội dung cốt lõi:** Vibe-content không ghi trực tiếp vào DB cho actions → phải POST /posts qua Forum API để kích hoạt đầy đủ business logic (notification, vote count, audit log, validation).
- **Ngoại lệ hợp lý:** ContextGathererService đọc trực tiếp DB (SELECT only, no side effect) → hiệu quả hơn so với gọi API.
- **Sơ đồ đối chiếu:** ❌ `vibe-content → Prisma.post.create()` vs ✅ `vibe-content → POST /posts`.

---

## CHƯƠNG 5 — BẢO MẬT VÀ KIỂM SOÁT TRUY CẬP

### 5.1 Security Architecture Overview (5 lớp)
- **Nội dung cốt lõi:**
  - **Layer 1 — Network/Transport:** HTTPS (SSL/TLS) production; CORS whitelist.
  - **Layer 2 — Application Security:** Helmet (12+ headers: CSP, X-Frame-Options, HSTS, nosniff); Rate Limiting (100 req/15min global, 10 req/15min auth); Request size limit.
  - **Layer 3 — Authentication:** JWT Access Token HS256 (15 min); Refresh Token lưu DB (revocable); httpOnly cookie chống XSS.
  - **Layer 4 — Authorization:** RBAC MEMBER < MODERATOR < ADMIN; Resource ownership check (chỉ author hoặc admin sửa/xóa).
  - **Layer 5 — Input Validation:** Zod schema mọi request body; Prisma ORM parameterized queries chống SQL injection.

### 5.2 RBAC Matrix (10 resources × 4 roles)
- **Nội dung cốt lõi:** Bảng permission matrix đầy đủ:

| Resource / Action | Guest | Member | Moderator | Admin |
|---|---|---|---|---|
| Xem post (ALL category) | ✅ | ✅ | ✅ | ✅ |
| Xem post (MEMBER category) | ❌ | ✅ | ✅ | ✅ |
| Tạo post | ❌ | ✅ | ✅ | ✅ |
| Sửa/xóa post của mình | ❌ | ✅ | ✅ | ✅ |
| Sửa/xóa post người khác | ❌ | ❌ | ✅ | ✅ |
| Ghim bài viết | ❌ | ❌ | ❌ | ✅ |
| Quản lý user | ❌ | ❌ | ❌ | ✅ |
| Xử lý báo cáo | ❌ | ❌ | ✅ | ✅ |
| Xem audit log | ❌ | ❌ | ❌ | ✅ |
| API admin dashboard | ❌ | ❌ | ❌ | ✅ |

### 5.3 Data Protection
- **Nội dung cốt lõi:** bcrypt hash salt=10 cho password; ImageKit API key chỉ trong env, upload qua server-side signed URL; Audit trail với `ip_address` + `user_agent` → non-repudiation.

### 5.4 OWASP Top 10 Compliance
- **Nội dung cốt lõi:** Mapping 7 OWASP risk → biện pháp trong codebase:

| OWASP | Nguy cơ | Biện pháp |
|-------|---------|-----------|
| A01 Broken Access Control | Truy cập không có quyền | roleMiddleware + resource ownership check |
| A02 Crypto Failures | Password plaintext | bcrypt hash (authService.ts) |
| A03 Injection | SQL injection | Prisma ORM parameterized queries |
| A04 Insecure Design | Logic bypass | Service layer isolation; API-only cho bot |
| A05 Security Misconfiguration | Default config | Helmet headers; CORS whitelist |
| A07 Auth Failures | Token theft | Short-lived JWT; httpOnly refresh cookie |
| A09 Logging Failures | Không có audit | auditLogService + httpLoggerMiddleware |

---

## CHƯƠNG 6 — TRIỂN KHAI VÀ VẬN HÀNH

### 6.1 Containerization — Docker Multi-stage
- **Nội dung cốt lõi:** 2-stage Dockerfile cho backend và vibe-content:
  - **Stage 1 (Builder):** `node:18-alpine`, `npm ci --only=production`, `tsc compile`.
  - **Stage 2 (Runner):** Copy `dist/` + `node_modules/`, không có dev deps/source TypeScript → image nhỏ hơn.
  - `docker-entrypoint.sh`: chạy `prisma migrate deploy` trước khi start service.
  - Lợi ích: image size nhỏ, security (chỉ runtime artifacts).

### 6.2 Service Deployment Config
- **Nội dung cốt lõi:** 5 service trên 2 platform:

| Service | Platform | Config file | Port |
|---------|----------|------------|------|
| backend | Render.com | `backend/render.json` | 5000 |
| vibe-content | Render.com | `vibe-content/render.json` | 4000 |
| frontend | Vercel | `frontend/vercel.json` | - |
| admin-client | Vercel | `admin-client/vercel.json` | - |
| PostgreSQL | Supabase/Render | `DB_SETUP.md` | 5432 |

### 6.3 Environment Configuration
- **Nội dung cốt lõi:** Các nhóm env variable của backend:
  - Database: `DATABASE_URL` (với connection pooling/pgbouncer), `DIRECT_URL` (cho migrations).
  - JWT: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, TTL 15m/7d.
  - Email: `BREVO_API_KEY`, `BREVO_FROM_EMAIL`.
  - CDN: `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`.
  - CORS: `FRONTEND_URL`, `ADMIN_CLIENT_URL`.
  - Feature flag: `COMMENT_EDIT_TIME_LIMIT` (giây, config động).

### 6.4 Database Migration Strategy
- **Nội dung cốt lõi:**
  - **Development:** `prisma migrate dev --name "feature_name"` → tạo migration file trong `prisma/migrations/` → apply → generate Prisma Client.
  - **Production (docker-entrypoint.sh):** `prisma migrate deploy` → chỉ apply pending migrations, không tạo mới.
  - **Rollback:** Prisma không có native rollback → viết migration mới để revert + backup trước deploy (`backupDb.ts`).

### 6.5 Monitoring & Observability
- **Nội dung cốt lõi:** 3 lớp observability:
  - **HTTP Metrics** (`metricsMiddleware.ts` + `metricsService.ts`): request count, response time, error rate theo endpoint.
  - **Operational Dashboard** (`OperationalDashboardPage.tsx`): real-time metrics từ `/admin/metrics`, top endpoints by volume/error rate.
  - **Log Management** (`httpLoggerMiddleware.ts`, `vibe-content/logs/`): structured HTTP access logs, bot activity logs.

### 6.6 Maintenance Scripts (10 scripts)
- **Nội dung cốt lõi:** `backend/scripts/`:
  - `backupDb.ts` — backup PostgreSQL → local file.
  - `cleanupImagekit.ts` — xóa orphaned images CDN.
  - `cleanupLegacyAvatars.ts` — cleanup deprecated avatar_url.
  - `migrateAvatarUrls.ts` — migration legacy avatar fields.
  - `migratePostsToBlocks.ts` — migration sang block layout.
  - `clearData.ts`, `wipeAllDb.ts` — quản lý test data (dev only).
  - `resetAllMedia.ts`, `resetAvatarMedia.ts`, `resetPostMedia.ts` — reset media.

---

## CHƯƠNG 7 — ĐÁNH GIÁ VÀ KẾT LUẬN

### 7.1 Tổng kết kiến trúc — Trade-off analysis
- **Nội dung cốt lõi:** Bảng quyết định kiến trúc với trade-off:

| Quyết định | Lý do chọn | Trade-off |
|-----------|-----------|-----------|
| Monorepo | Code sharing, tooling thống nhất | Khó scale team lớn |
| Shared PostgreSQL | Simplicity, data consistency | Coupling ở DB level |
| REST (không GraphQL) | Đơn giản, team nhỏ, tooling tốt | Over-fetching một số endpoint |
| SSE (không WebSocket) | One-way đủ cho notification | Không dùng được cho bidirectional |
| Multi-LLM fallback | Reliability > simplicity | Complexity implementation |
| Docker multi-stage | Image size nhỏ, security | Build time lâu hơn single-stage |

### 7.2 Các hạn chế và hướng mở rộng
- **Nội dung cốt lõi:**
  - **SSE không scale horizontal** (in-memory) → upgrade path: WebSocket + Redis pub/sub.
  - **Metrics thu thập trong memory** → cần Prometheus + Grafana cho production monitoring.
  - **Thiếu CI/CD pipeline** → cần GitHub Actions cho tự động hóa test + deploy.
  - **DB coupling** giữa backend và vibe-content → long-term: API-only access pattern cho vibe-content.

### 7.3 Kết luận
- **Nội dung cốt lõi:** MINI-FORUM là ví dụ thực tế của hệ thống tích hợp cân bằng giữa simplicity và functionality:
  - Kiến trúc monorepo đủ linh hoạt cho team nhỏ trong 3 tháng.
  - API-first integration đảm bảo business logic nhất quán dù có nhiều consumer (frontend, admin-client, vibe-content).
  - Security được thiết kế theo chiều sâu (defense-in-depth) với 5 lớp độc lập.
  - Observability đủ cho prototype, có clear upgrade path cho production scale.

---

## PHỤ LỤC

### A. Cấu trúc thư mục backend (nguồn tham chiếu)
```
backend/src/
├── app.ts              ← Express app config
├── index.ts            ← Entry point
├── controllers/        ← 14 request handlers
├── services/           ← 21 business logic files
├── routes/             ← 14 route definitions
├── middlewares/        ← 9 Express middlewares
├── validations/        ← Zod schemas
├── types/              ← TypeScript types
├── config/             ← Configuration
├── constants/          ← Constants
├── utils/              ← Utilities
└── __tests__/          ← Vitest test files
```

### B. Cấu trúc vibe-content (nguồn tham chiếu)
```
vibe-content/src/
├── scheduler/          ← Cron job trigger
├── services/
│   ├── ContextGathererService.ts
│   ├── ActionSelectorService.ts
│   ├── PersonalityService.ts
│   ├── PromptBuilderService.ts
│   ├── ContentGeneratorService.ts
│   ├── ValidationService.ts
│   ├── APIExecutorService.ts
│   └── StatusService.ts
├── services/llm/       ← 4 LLM provider adapters
│   ├── geminiProvider.ts
│   ├── groqProvider.ts
│   ├── cerebrasProvider.ts
│   └── nvidiaProvider.ts
└── tracking/           ← Bot metrics
```

### C. Mapping Sprint → Tích hợp được xây dựng
| Sprint | Tích hợp hoàn thành |
|--------|-------------------|
| Sprint 0 | Kiến trúc monorepo, Prisma + PostgreSQL |
| Sprint 1 | JWT + Brevo email (backend ↔ external service) |
| Sprint 2 | CRUD API ↔ React Query (backend ↔ frontend) |
| Sprint 3 | SSE real-time, PostgreSQL full-text search |
| Sprint 4 | ImageKit CDN, Admin RBAC, Audit trail |
| Sprint 5 | Multi-LLM fallback, vibe-content ↔ Forum API, Docker deploy |
