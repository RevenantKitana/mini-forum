# CHƯƠNG 1: TỔNG QUAN DỰ ÁN

---

## 1.1 Dự án MINI-FORUM — Nên tảng diễn đàn Full-stack

MINI-FORUM là ứng dụng diễn đàn full-stack production-ready xây dựng trong khuôn khổ thực tập 3 tháng (27/01/2026 – 27/04/2026). Kiến trúc monorepo 4 service: **backend** (Express/Node.js, 14 modules, 21 services), **frontend** (React, 14 pages), **admin-client** (React, dashboard quản trị), **vibe-content** (AI bot, multi-LLM fallback). Cơ sở dữ liệu PostgreSQL với 19 models, hơn 50 API endpoints.

Định hướng: Xây dựng MIS hoàn chỉnh cho cộng đồng trực tuyến—nền tảng không chỉ là nơi chia sẻ nội dung mà là hệ thống quản lý thông tin toàn diện với RBAC 4 cấp, moderation workflow, audit trail, SSE notifications, và AI content seeding.

**Hình 1.1 — Kiến trúc tổng thể hệ thống MINI-FORUM**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                     MINI-FORUM — Kiến trúc Monorepo                  ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║   TẦNG GIAO DIỆN (Presentation Layer)                                 ║
║  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    ║
║  │   frontend/      │  │  admin-client/   │  │  vibe-content/   │    ║
║  │                  │  │                  │  │                  │    ║
║  │  React 18        │  │  React 18        │  │  Node.js Bot     │    ║
║  │  Vite 5.x        │  │  Vite 5.x        │  │  TypeScript      │    ║
║  │  TailwindCSS 3   │  │  Radix UI        │  │  Cron Scheduler  │    ║
║  │  React Query 5   │  │  shadcn/ui       │  │                  │    ║
║  │  Dark Mode ✓     │  │  Data Tables     │  │  LLM Providers:  │    ║
║  │                  │  │                  │  │  • Gemini (1st)  │    ║
║  │  14 trang React  │  │  12 trang quản   │  │  • Groq (2nd)    │    ║
║  │                  │  │  trị viên        │  │  • Cerebras (3rd)│    ║
║  │  Port: 5173      │  │  Port: 5174      │  │  • Nvidia (4th)  │    ║
║  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘    ║
║           │                     │                     │              ║
║           └─────────────────────┴─────────────────────┘              ║
║                                 │ HTTP / REST API                    ║
║                                 │ (JSON over HTTPS)                  ║
║                                 ▼                                    ║
║   TẦNG XỬ LÝ NGHIỆP VỤ (Business Logic Layer)                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │                        backend/                              │    ║
║  │                                                              │    ║
║  │  Node.js 18 + Express 4.x + TypeScript (strict mode)        │    ║
║  │  Prisma 5.x ORM    │    9 Middlewares                        │    ║
║  │  14 Controllers    │    21 Services                          │    ║
║  │                                                              │    ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    ║
║  │  │ Auth Module  │  │ Forum Core   │  │  Admin Module    │   │    ║
║  │  │ JWT + OTP    │  │ Post/Comment │  │  Moderation      │   │    ║
║  │  │ RBAC (3 vai  │  │ Vote/Search  │  │  Audit Log       │   │    ║
║  │  │ trò)         │  │ SSE Notif.   │  │  Dashboard       │   │    ║
║  │  └──────────────┘  └──────────────┘  └──────────────────┘   │    ║
║  │                                                              │    ║
║  │  Port: 5000                                                  │    ║
║  └──────────────────────────────┬───────────────────────────────┘    ║
║                                 │ Prisma ORM (SQL)                   ║
║                                 ▼                                    ║
║   TẦNG DỮ LIỆU (Data Layer)                                          ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │                  PostgreSQL Database                         │    ║
║  │                  19 Models / Tables                          │    ║
║  │                                                              │    ║
║  │  Users, Posts, PostBlocks, Comments, Categories, Tags        │    ║
║  │  Votes, Notifications, Bookmarks, Reports, AuditLogs, ...   │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                       ║
║   DỊCH VỤ BÊN NGOÀI (External Services)                              ║
║  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ║
║  │  Brevo API  │  │  ImageKit    │  │  Render.com  │  │  Vercel  │  ║
║  │  (Email OTP)│  │  (CDN Media) │  │  (Backend)   │  │  (Front) │  ║
║  └─────────────┘  └──────────────┘  └──────────────┘  └──────────┘  ║
╚═══════════════════════════════════════════════════════════════════════╝
```

*Nguồn: Tác giả tự xây dựng*

**Bảng 1.1 — Kiến trúc bốn thành phần hệ thống MINI-FORUM**

| Thành phần | Công nghệ chính | Vai trò | Cổng mặc định | Triển khai |
|------------|----------------|---------|--------------|-----------|
| `backend/` | Node.js 18, Express 4.x, TypeScript 5, Prisma 5.x | REST API server, business logic, quản lý database, SSE notifications | 5000 | Render.com (Docker) |
| `frontend/` | React 18, Vite 5.x, TailwindCSS 3.x, React Query 5, React Router 6 | Giao diện người dùng cuối — diễn đàn, hồ sơ cá nhân, tìm kiếm, thông báo | 5173 | Vercel |
| `admin-client/` | React 18, Vite 5.x, Radix UI, shadcn/ui, Recharts | Bảng điều khiển quản trị viên — kiểm duyệt, thống kê, audit log | 5174 | Vercel |
| `vibe-content/` | Node.js 18, TypeScript, node-cron, Prisma, Axios | AI Bot sinh nội dung tự động, hỗ trợ 4 LLM provider với fallback | 3001 | Render.com (Docker) |

### 1.1.4 Quy mô kỹ thuật dự án

Sau 13 tuần phát triển theo mô hình Scrum (6 Sprint × 2 tuần + 1 tuần Buffer), hệ thống đạt được quy mô kỹ thuật như sau:

**Bảng 1.1b — Thống kê quy mô kỹ thuật hệ thống**

| Module | Số lượng | Chi tiết |
|--------|---------|---------|
| **Backend Controllers** | 14 | auth, users, posts, comments, categories, tags, votes, notifications, bookmarks, reports, search, admin, upload, sse |
| **Backend Services** | 21 | Mỗi domain có service riêng; emailService, imageKitService, sseService độc lập |
| **Backend Middlewares** | 9 | authenticate, authorize, rateLimiter, validation, upload, errorHandler, ... |
| **Database Models (Prisma)** | 19 | User, Post, PostBlock, Comment, Category, Tag, Vote, Notification, Bookmark, Report, AuditLog, ... |
| **Frontend Pages** | 14 | HomePage, PostDetailPage, ProfilePage, SearchPage, NotificationsPage, BookmarksPage, ... |
| **Admin Pages** | 12 | Dashboard, Users, Posts, Comments, Reports, AuditLogs, Categories, Tags, Analytics, ... |
| **AI Bot Services** | 8 | contentGenerator, postScheduler, commentScheduler, voteScheduler, llmFallback, personalityEngine, ... |
| **LLM Providers** | 4 | Google Gemini (primary), Groq, Cerebras, Nvidia NIM (fallback chain) |
| **API Endpoints** | ~65 | Phủ đầy đủ CRUD + actions đặc thù (ban, report, resolve, bookmark, vote, ...) |
| **Test Files** | 12+ | Vitest unit tests cho auth, posts, comments, upload, notifications |

---

## 1.2 Phạm vi và mục tiêu

### 1.2.1 Mục tiêu dự án

**Mục tiêu kinh doanh:** (1) Cung cấp nền tảng diễn đàn độc lập, self-host được bằng Docker Compose. (2) Trang bị hệ thống moderation hoàn chỉnh (báo cáo vi phạm, ban user, audit log). (3) Giải quyết cold-start bằng AI bot sinh nội dung seed ban đầu.

**Mục tiêu kỹ thuật:** REST API với JWT (15 phút) + OTP email + RBAC 3 cấp; SSE notifications thời gian thực; full-text search PostgreSQL (`tsvector`); Docker multi-stage build; test coverage ≥ 60% (Vitest).

### 1.2.2 Phạm vi kỹ thuật

**Bảng 1.2 — Phạm vi kỹ thuật hệ thống MINI-FORUM**

| Hạng mục | Trong phạm vi (Implemented) | Ngoài phạm vi (Excluded) | Lý do loại trừ |
|----------|----------------------------|--------------------------|----------------|
| **Giao diện người dùng** | Web app responsive (React), Admin panel web | Mobile app (iOS/Android), Desktop app (Electron) | Tăng scope quá nhiều, không phù hợp thời gian thực tập |
| **Giao tiếp thời gian thực** | Server-Sent Events (SSE) — push thông báo 1 chiều | WebSocket, chat thời gian thực, video call | SSE đủ cho use case thông báo; WebSocket là upgrade path tương lai |
| **Xác thực & Bảo mật** | Email OTP (Brevo), JWT access+refresh token, bcrypt | OAuth2 (Google/Facebook/GitHub), SSO (SAML), Passkey | Phức tạp; có thể bổ sung sau khi hệ thống core ổn định |
| **Quản lý media** | Upload ảnh lên ImageKit CDN, resize tự động | Video streaming, audio upload, file đính kèm (PDF, ZIP) | Chi phí lưu trữ và bandwidth video không phù hợp MVP |
| **Thanh toán** | Không áp dụng | Gói premium, subscription, donate | Ngoài phạm vi sản phẩm cộng đồng mở |
| **Tìm kiếm** | Full-text search PostgreSQL (`tsvector`) | Elasticsearch, Algolia, Meilisearch | PostgreSQL đủ cho quy mô dưới 100k bài viết |
| **Triển khai** | Docker, Docker Compose, Render.com, Vercel | Kubernetes, Terraform, multi-region deployment | Overkill cho MVP; Kubernetes là upgrade path rõ ràng |
| **Tính năng AI** | AI sinh bài viết/bình luận/vote theo lịch | AI moderation (auto-detect toxic), image recognition, voice-to-text | Cần dataset training riêng, không feasible trong 3 tháng |

### 1.2.3 Yêu cầu chức năng — Phân loại MoSCoW

Backlog được ưu tiên theo MoSCoW từ Sprint 0:

| Mức | Yêu cầu chính | Sprint |
|-----|--------------|--------|
| **Must Have** | Đăng ký+OTP, Login+JWT, RBAC 3 cấp, CRUD bài viết Block Layout, bình luận lồng nhau, category/tag, admin dashboard, báo cáo vi phạm | S0–S2, S4 |
| **Should Have** | Vote+reputation, full-text search, SSE notification, audit log, bookmark, avatar upload | S3–S4 |
| **Could Have** | AI bot, upload ảnh bài viết, block list, hồ sơ mở rộng | S5 |
| **Won't Have** | Mobile app, WebSocket chat, OAuth2, video streaming, thanh toán | — |

### 1.2.4 Yêu cầu phi chức năng

Yêu cầu phi chức năng (Non-Functional Requirements — NFR) xác định chất lượng hệ thống, không phải tính năng cụ thể. Đây là các ràng buộc kỹ thuật chi phối toàn bộ quyết định thiết kế kiến trúc.

**Bảng 1.3 — Yêu cầu phi chức năng và giải pháp kỹ thuật**

| Thuộc tính | Chỉ tiêu cụ thể | Giải pháp kỹ thuật áp dụng | Trạng thái |
|------------|----------------|---------------------------|-----------|
| **Hiệu năng** | API latency < 200ms (P95) cho các endpoint đọc; < 500ms cho write | PostgreSQL composite index; React Query caching (staleTime 5 phút); Pagination cursor-based | ✅ Đạt |
| **Bảo mật** | Không có lỗ hổng trong OWASP Top 10 | Helmet.js headers; express-rate-limit (100 req/15min); Zod schema validation; bcrypt (saltRounds=12); HttpOnly cookies cho refresh token | ✅ Đạt |
| **Khả năng mở rộng** | Horizontal scaling ready (stateless) | Stateless JWT (không lưu session server-side); Docker container; Database connection pool (Prisma) | ✅ Đạt |
| **Bảo trì** | TypeScript strict, zero lint error | TypeScript `"strict": true`; ESLint + Prettier; Prisma schema-first; Zod type inference | ✅ Đạt |
| **Khả dụng** | Deployment ready, health check | Docker multi-stage build; `/api/health` endpoint; Graceful shutdown xử lý SIGTERM | ✅ Đạt |
| **Khả năng kiểm thử** | Test coverage ≥ 60% (backend) | Vitest + Supertest; Test isolation với database mock; CI-ready `vitest run` command | ✅ Đạt |

---

## 1.3 Các bên liên quan (Stakeholders)

### 1.3.1 Nhận diện và phân tích stakeholder

Dự án có bốn nhóm stakeholder chính:

**Bảng 1.4 — Phân tích chi tiết các bên liên quan**

| Stakeholder | Mô tả | Quyền lợi chính | Mối lo ngại | Mức độ tham gia | Mức độ ảnh hưởng |
|-------------|-------|----------------|------------|----------------|-----------------|
| **Người thực hiện dự án** | Tác giả kiêm nhiệm Lead Developer, Frontend Developer, DevOps và Scrum Master | Sản phẩm hoạt động đúng spec; code quality cao; học được công nghệ mới; deadline đúng hạn | Scope creep, nợ kỹ thuật tích lũy, thiếu feedback | **Cao** — tham gia 100% thời gian dự án | **Cao** — ra mọi quyết định kỹ thuật |
| **Product Owner** (Chủ sản phẩm) | Giảng viên hướng dẫn / đại diện yêu cầu nghiệp vụ | Hệ thống đáp ứng đầy đủ use case; UX trực quan; tài liệu đầy đủ | Dự án không hoàn thành đúng hạn; feature không hoạt động khi demo | **Trung bình** — Sprint Planning (đầu sprint) và Sprint Review (cuối sprint) | **Cao** — xác nhận/từ chối acceptance criteria |
| **End User — Member** (Người dùng thành viên) | Người dùng cuối: đọc bài, đăng bài, bình luận, vote, nhận thông báo | Giao diện thân thiện; tốc độ tải nhanh; thông báo kịp thời; nội dung phong phú | Trải nghiệm kém (lag, UI phức tạp); mất dữ liệu; spam nội dung | **Thấp** — phản hồi qua user testing nội bộ Sprint 4–5 | **Trung bình** — phản hồi định hướng UX |
| **Admin User** (Quản trị viên) | Người vận hành nền tảng: kiểm duyệt nội dung, quản lý user, xử lý báo cáo | Dashboard đầy đủ; công cụ moderation nhanh; audit log tin cậy; ít thao tác thủ công | Thiếu công cụ xử lý vi phạm; audit log không đầy đủ; không rõ hành động nào được phép | **Trung bình** — kiểm thử admin panel Sprint 4 | **Trung bình** — yêu cầu tính năng admin module |

### 1.3.2 Ma trận Power-Interest

| Vùng | Stakeholder | Chiến lược |
|------|-------------|------------|
| **Manage Closely** (Power cao, Interest cao) | Người thực hiện, Product Owner | Giao tiếp thường xuyên, cập nhật hàng ngày |
| **Keep Informed** (Power thấp, Interest cao) | Admin User, End User | Cập nhật qua Sprint Review, thu thập feedback định kỳ |

### 1.3.3 Quản lý kỳ vọng stakeholder

Biện pháp phòng ngừa kỳ vọng lệch nhau: Sprint Goal viết thành văn bản được PO xác nhận đầu mỗi sprint; Acceptance Criteria cụ thể cho từng User Story; demo live (không dùng slide) tại Sprint Review; Backlog Refinement giữa sprint để phát hiện sớm rủi ro trễ deadline.

---

*[Tiếp theo: Chương 2 — Mô hình phát triển và lý do lựa chọn]*
