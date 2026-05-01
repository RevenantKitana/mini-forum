# BÁO CÁO CHUYÊN ĐỀ
## THỰC TẬP QUẢN TRỊ DỰ ÁN PHẦN MỀM
### Dự án: MINI-FORUM — Ứng dụng Diễn đàn Trực tuyến Full-stack

---

> **Thời gian thực tập giả định:** 27/01/2026 – 27/04/2026
> **Mô hình phát triển:** Scrum Agile (6 Sprint × 2 tuần)
> **Nguồn tham chiếu:** Codebase tại monorepo `mini-forum`

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Mô hình phát triển và lý do lựa chọn](#2-mô-hình-phát-triển-và-lý-do-lựa-chọn)
3. [Lập kế hoạch dự án](#3-lập-kế-hoạch-dự-án)
4. [Quản lý rủi ro](#4-quản-lý-rủi-ro)
5. [Kiểm soát tiến độ và chất lượng](#5-kiểm-soát-tiến-độ-và-chất-lượng)
6. [Quản lý nguồn lực](#6-quản-lý-nguồn-lực)
7. [Kết quả và bài học kinh nghiệm](#7-kết-quả-và-bài-học-kinh-nghiệm)

---

## 1. Tổng quan dự án

### 1.1 Mô tả dự án

MINI-FORUM là ứng dụng diễn đàn trực tuyến full-stack được xây dựng từ đầu trong vòng 3 tháng. Hệ thống cung cấp nền tảng thảo luận cộng đồng với đầy đủ tính năng: đăng bài, bình luận lồng nhau, bỏ phiếu, phân quyền vai trò, quản trị nội dung và tích hợp AI sinh nội dung tự động.

### 1.2 Phạm vi và mục tiêu

**Mục tiêu kinh doanh:**
- Cung cấp nền tảng diễn đàn có thể triển khai độc lập
- Hỗ trợ cộng đồng người dùng với moderation tool đầy đủ
- Tích hợp AI để tạo nội dung seed ban đầu

**Phạm vi kỹ thuật (dẫn xuất từ codebase):**

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| `backend/` | Node.js, Express, TypeScript, Prisma | REST API, business logic, database |
| `frontend/` | React 18, Vite, TailwindCSS, React Query | Giao diện người dùng |
| `admin-client/` | React 18, Vite, Radix UI | Bảng quản trị |
| `vibe-content/` | Node.js, multi-LLM (Gemini/Groq/Cerebras) | Bot sinh nội dung AI |
| PostgreSQL | Database | Persistence layer |

**Ngoài phạm vi:** Mobile app, WebSocket (dùng SSE thay thế), thanh toán.

### 1.3 Các bên liên quan (Stakeholders)

| Stakeholder | Vai trò | Mức độ tham gia |
|---|---|---|
| Development Team | Phát triển, kiểm thử | Cao |
| Product Owner | Xác nhận yêu cầu, sprint review | Trung bình |
| End User (Member) | Sử dụng forum, phản hồi UX | Thấp (testing) |
| Admin User | Quản trị nội dung, kiểm thử admin panel | Trung bình |

---

## 2. Mô hình phát triển và lý do lựa chọn

### 2.1 So sánh các mô hình

| Tiêu chí | Waterfall | Kanban | **Scrum** |
|---|---|---|---|
| Yêu cầu thay đổi | Không phù hợp | Linh hoạt cao | **Linh hoạt có kiểm soát** |
| Team nhỏ (1–3 người) | Overhead cao | Thiếu cấu trúc | **Phù hợp** |
| Deliverable định kỳ | Chỉ cuối dự án | Liên tục | **Mỗi 2 tuần** |
| Risk management | Phát hiện muộn | Không có cơ chế | **Sprint review giúp phát hiện sớm** |
| Tích hợp phức tạp (AI) | Thiết kế từ đầu | Không rõ priority | **Dời tích hợp AI sang Sprint 5 khi đã có data thật** |

**Quyết định: Scrum** — lý do chính: yêu cầu diễn đàn evolve theo feedback (ví dụ: block layout trong `post_blocks` được thêm vào sau khi có nhu cầu editor phong phú), và tích hợp AI chỉ có thể thực hiện sau khi forum cơ bản có dữ liệu.

### 2.2 Cấu trúc Scrum áp dụng

```
Product Backlog
      │
      ▼
Sprint Planning (đầu mỗi sprint)
      │
      ▼
Sprint Execution (2 tuần)
      │
      ▼
Sprint Review → Demo cho stakeholders
      │
      ▼
Sprint Retrospective → Cải thiện process
      │
      ▼ (vòng lặp)
```

**Sprint duration:** 2 tuần (10 ngày làm việc)
**Daily Standup:** 15 phút/ngày (ba câu hỏi: hôm qua làm gì, hôm nay làm gì, blocker gì)

### 2.3 Definition of Done (DoD)

Một User Story được coi là DONE khi:
1. Code implement đầy đủ theo acceptance criteria
2. Unit test viết và pass (Vitest)
3. API được test bằng Postman/rest client
4. Code review passed (self-review với team nhỏ)
5. Merge vào main branch thành công
6. Không có lint error

---

## 3. Lập kế hoạch dự án

### 3.1 Work Breakdown Structure (WBS)

```
MINI-FORUM
├── 1. Quản lý dự án
│   ├── 1.1 Khởi tạo dự án
│   ├── 1.2 Lập kế hoạch sprint
│   └── 1.3 Kiểm soát & báo cáo
│
├── 2. Nền tảng hệ thống
│   ├── 2.1 Thiết kế kiến trúc
│   ├── 2.2 Cấu hình monorepo
│   └── 2.3 Database schema (Prisma)
│
├── 3. Backend API
│   ├── 3.1 Xác thực & phân quyền (Auth, JWT, OTP)
│   ├── 3.2 Quản lý người dùng (User, Avatar)
│   ├── 3.3 Forum core (Post, Comment, Category, Tag)
│   ├── 3.4 Tính năng tương tác (Vote, Bookmark, Search, Notification)
│   ├── 3.5 Quản trị (Admin API, Report, Audit Log)
│   └── 3.6 Media (ImageKit upload)
│
├── 4. Frontend
│   ├── 4.1 Layout & Navigation
│   ├── 4.2 Trang chính (Home, Post Detail)
│   ├── 4.3 Trang người dùng (Profile, Edit)
│   └── 4.4 Tính năng nâng cao (Search, Bookmark, Notification)
│
├── 5. Admin Panel
│   ├── 5.1 Dashboard & thống kê
│   ├── 5.2 Quản lý nội dung (User, Post, Comment)
│   └── 5.3 Công cụ moderation (Report, Audit Log)
│
├── 6. Vibe-Content (AI Bot)
│   ├── 6.1 Personality system
│   ├── 6.2 Content generation (multi-LLM)
│   └── 6.3 Scheduler & automation
│
└── 7. Triển khai
    ├── 7.1 Docker containerization
    ├── 7.2 Deployment configuration
    └── 7.3 Monitoring & maintenance scripts
```

### 3.2 Product Backlog (ưu tiên)

| ID | User Story | Priority | Story Points | Sprint |
|----|-----------|----------|--------------|--------|
| US-01 | Là member, tôi muốn đăng ký tài khoản qua OTP email | Must Have | 8 | S1 |
| US-02 | Là member, tôi muốn đăng nhập và duy trì session | Must Have | 5 | S1 |
| US-03 | Là member, tôi muốn đăng bài viết với text và hình ảnh | Must Have | 13 | S2 |
| US-04 | Là member, tôi muốn bình luận và reply comment | Must Have | 8 | S2 |
| US-05 | Là member, tôi muốn vote upvote/downvote | Should Have | 5 | S3 |
| US-06 | Là member, tôi muốn tìm kiếm bài viết | Should Have | 8 | S3 |
| US-07 | Là member, tôi muốn nhận thông báo real-time | Should Have | 13 | S3 |
| US-08 | Là admin, tôi muốn xem dashboard thống kê | Must Have | 8 | S4 |
| US-09 | Là moderator, tôi muốn xử lý báo cáo vi phạm | Must Have | 8 | S4 |
| US-10 | Là admin, tôi muốn xem audit log mọi hành động | Must Have | 5 | S4 |
| US-11 | Là system, tôi muốn bot AI tự sinh nội dung | Nice to Have | 21 | S5 |

### 3.3 Gantt Chart (tóm tắt)

```
Tuần:   1  2  3  4  5  6  7  8  9  10  11  12  13
        ├──┤  ├──┤  ├──┤  ├──┤  ├──┤  ├───┤  ├──┤
Sprint: [S0   ][S1   ][S2   ][S3   ][S4    ][S5   ][BUF]

Auth:         [====]
Post/Cmt:           [======]
Vote/SSE:                  [======]
Admin:                           [======]
AI Bot:                                 [======]
Deploy:                                        [==]
```

### 3.4 Sprint Planning chi tiết

#### Sprint 0 (Jan 27 – Feb 7) — Khởi tạo

| Task | Assignee | Ước tính | Thực tế |
|------|----------|---------|---------|
| Phân tích yêu cầu nghiệp vụ | Lead | 2 ngày | 2 ngày |
| Thiết kế kiến trúc hệ thống | Lead | 1 ngày | 1 ngày |
| Thiết kế ERD v1 (5 entity cốt lõi) | Lead | 2 ngày | 2 ngày |
| Khởi tạo monorepo, cấu hình TypeScript | Dev | 1 ngày | 1 ngày |
| Setup PostgreSQL + Prisma migrate | Dev | 1 ngày | 1 ngày |
| Cấu hình Express app.ts + routing skeleton | Dev | 1 ngày | 1 ngày |
| Sprint review/planning S1 | All | 0.5 ngày | 0.5 ngày |

**Sprint Goal:** "Có nền tảng kỹ thuật để bắt đầu develop feature"

#### Sprint 1 (Feb 8 – Feb 21) — Auth & Users

| Task | Estimt | Actual |
|------|--------|--------|
| authController: register, login, logout | 2 ngày | 2 ngày |
| otpService + emailService (Brevo) | 1.5 ngày | 2 ngày |
| JWT access + refresh token | 1 ngày | 1 ngày |
| authMiddleware + roleMiddleware | 1 ngày | 1 ngày |
| securityMiddleware (Helmet, CORS, rate limit) | 0.5 ngày | 0.5 ngày |
| userController: profile CRUD, avatar | 2 ngày | 2 ngày |
| Vitest auth tests | 1 ngày | 1 ngày |

> **Blocker phát hiện:** Brevo API sandbox có rate limit → giải pháp: mock email trong test environment

#### Sprint 2 (Feb 22 – Mar 7) — Forum Core

| Task | Estimt | Actual |
|------|--------|--------|
| postController + postService | 2 ngày | 2.5 ngày |
| Block layout system (post_blocks) | 1.5 ngày | 2 ngày |
| commentController (nested comment, quote) | 2 ngày | 2 ngày |
| categoryController + tagController | 1 ngày | 1 ngày |
| Frontend: HomePage, PostDetailPage | 2 ngày | 2 ngày |

> **Phát sinh scope:** Block layout được thêm vào giữa sprint → thêm 1 ngày buffer, adjust sprint 3

#### Sprint 3 (Mar 8 – Mar 21) — Tính năng Nâng cao

| Task | Estimt | Actual |
|------|--------|--------|
| voteService: upvote/downvote + reputation | 1.5 ngày | 1.5 ngày |
| bookmarkService | 0.5 ngày | 0.5 ngày |
| searchService: PostgreSQL full-text search | 1.5 ngày | 2 ngày |
| notificationService + sseService (SSE) | 2 ngày | 2.5 ngày |
| blockReportController (blocks, reports) | 1 ngày | 1 ngày |
| Frontend: Search, Notification, Bookmark pages | 2 ngày | 2 ngày |

#### Sprint 4 (Mar 22 – Apr 4) — Admin & Media

| Task | Estimt | Actual |
|------|--------|--------|
| adminController: stats, user/post/comment mgmt | 2 ngày | 2 ngày |
| auditLogService | 1 ngày | 1 ngày |
| imagekitService + postMediaController | 2 ngày | 2 ngày |
| metricsService + metricsMiddleware | 1 ngày | 1 ngày |
| Admin-client: Dashboard, Users, Posts, Reports | 2 ngày | 2 ngày |
| AuditLogsPage, OperationalDashboardPage | 1 ngày | 1 ngày |

#### Sprint 5 (Apr 5 – Apr 18) — AI Bot + Testing + Deploy

| Task | Estimt | Actual |
|------|--------|--------|
| vibe-content: PersonalityService | 1.5 ngày | 1.5 ngày |
| ContentGeneratorService (multi-LLM) | 2 ngày | 2 ngày |
| ActionSelectorService + ContextGatherer | 1.5 ngày | 1.5 ngày |
| Scheduler (cron jobs) | 0.5 ngày | 0.5 ngày |
| Vitest test suite (backend + frontend) | 2 ngày | 2 ngày |
| Docker build + deployment config | 1.5 ngày | 1.5 ngày |

---

## 4. Quản lý rủi ro

### 4.1 Risk Register

| ID | Rủi ro | Xác suất | Tác động | Mức độ | Chiến lược xử lý |
|----|--------|----------|----------|--------|------------------|
| R01 | Schema DB thay đổi ảnh hưởng nhiều service | Cao | Cao | **Nghiêm trọng** | Sử dụng Prisma migration có version; không xóa column ngay (soft deprecation như `avatar_url`) |
| R02 | LLM API không ổn định (rate limit, quota) | Cao | Trung bình | **Cao** | Multi-LLM fallback chain: Gemini → Groq → Cerebras → Nvidia |
| R03 | SSE real-time không scale với nhiều concurrent users | Trung bình | Cao | **Cao** | Giới hạn scope: SSE đủ cho prototype; ghi chú upgrade path sang WebSocket |
| R04 | Email delivery (Brevo) chậm hoặc fail | Trung bình | Cao | **Cao** | OTP có TTL + retry mechanism; mock trong test |
| R05 | ImageKit storage quota | Thấp | Thấp | **Thấp** | Sử dụng tier free; cleanup script `cleanupImagekit.ts` |
| R06 | Tech debt do block layout thêm giữa sprint | Cao | Trung bình | **Trung bình** | Adjust sprint 3 scope; kỹ thuật viên đủ mạnh để handle |
| R07 | Deployment environment khác development | Trung bình | Cao | **Cao** | Docker container đảm bảo môi trường nhất quán; `docker-entrypoint.sh` với suexec |

### 4.2 Risk Response — Ví dụ thực tế từ codebase

**R01 — Schema migration:** File `backend/prisma/migrations/` chứa toàn bộ lịch sử migration. Field `avatar_url` bị deprecated nhưng không xóa ngay (có comment `@deprecated — legacy fallback (UC-08)`) — đây là ví dụ backward-compatible migration.

**R02 — Multi-LLM fallback:** `vibe-content/src/services/llm/` implement fallback chain. Nếu một provider fail, system tự động chuyển sang provider tiếp theo.

**R03 — SSE scalability:** `backend/src/services/sseService.ts` quản lý connections in-memory. Ghi nhận giới hạn này trong tài liệu (`DEPLOYMENT.md`).

---

## 5. Kiểm soát tiến độ và chất lượng

### 5.1 Velocity Tracking (ước tính)

| Sprint | Story Points Planned | Story Points Completed | Velocity | Ghi chú |
|--------|---------------------|----------------------|---------|---------|
| S0 | 10 | 10 | 10 | Setup tasks, không đo bằng SP |
| S1 | 30 | 28 | 28 | Brevo integration delay 2SP |
| S2 | 35 | 33 | 33 | Block layout scope creep +3SP |
| S3 | 35 | 35 | 35 | On track |
| S4 | 32 | 32 | 32 | On track |
| S5 | 30 | 30 | 30 | AI integration phức tạp nhưng đủ buffer |

**Average velocity:** ~31.6 SP/sprint

### 5.2 Burndown Chart (mô phỏng Sprint 3)

```
Story Points
40 |*
35 |  *
30 |    *
25 |      *     (ideal line)
20 |        *
15 |          *  *
10 |              *
 5 |                *
 0 +──────────────────
   Day 1  5   7   10
```

### 5.3 Quality Gates

**Definition of Done** (đã đề cập mục 2.3) áp dụng cho mọi User Story.

**Automated Quality Checks:**

```json
// backend/package.json (scripts)
{
  "test": "vitest",           // Unit tests
  "lint": "eslint src/",      // Code quality
  "build": "tsc -p tsconfig.json"  // Type safety
}
```

**Test coverage theo module:**

| Module | Tests | Framework | Coverage mục tiêu |
|--------|-------|-----------|-------------------|
| Auth (JWT, OTP) | `__tests__/auth.test.ts` | Vitest | > 80% |
| Post service | `__tests__/post.test.ts` | Vitest | > 70% |
| Vote service | `__tests__/vote.test.ts` | Vitest | > 70% |
| Frontend components | `frontend/src/__tests__/` | Vitest + React Testing Library | > 60% |

### 5.4 Code Review Process

Với team nhỏ (1–3 người), áp dụng:
1. **Self-review** checklist trước khi merge
2. **Type safety**: TypeScript strict mode (tsconfig.json có `"strict": true`)
3. **Input validation**: Zod schemas trong `backend/src/validations/` — validation tại API boundary
4. **Security review**: Helmet, rate limiting trong `securityMiddleware.ts`

---

## 6. Quản lý nguồn lực

### 6.1 Team Structure

```
Product Owner
      │
      ▼
Lead Developer (Fullstack)
├── Backend: Express, Prisma, PostgreSQL
├── DevOps: Docker, deployment
└── AI Integration: vibe-content
      │
      ▼
Frontend Developer
├── React, Vite, TailwindCSS
├── React Query (API state management)
└── Radix UI (admin-client)
```

### 6.2 Phân bổ thời gian theo module

| Module | % Effort | Lý do |
|--------|----------|-------|
| Backend API | 40% | 14 controllers, 21 services, 9 middleware = complexity cao nhất |
| Frontend | 20% | React + React Query giảm boilerplate |
| Admin Client | 15% | Reuse component từ frontend |
| Vibe-Content | 15% | LLM integration có nhiều unknown |
| Testing + Deploy | 10% | Docker image nhỏ (multi-stage build) |

### 6.3 Technical Debt Management

Các khoản nợ kỹ thuật được ghi nhận rõ ràng:

| Debt | Vị trí trong codebase | Priority |
|------|----------------------|---------|
| `avatar_url` deprecated field | `schema.prisma` comment UC-08 | Low (migration script có sẵn) |
| SSE in-memory (không scale horizontal) | `sseService.ts` | Medium (ghi chú upgrade path) |
| Metrics thu thập trong memory | `metricsService.ts` | Medium (cần Prometheus/Grafana cho production) |

---

## 7. Kết quả và bài học kinh nghiệm

### 7.1 Deliverables hoàn thành

| Deliverable | Status | Ghi chú |
|-------------|--------|---------|
| Backend REST API (14 controllers) | ✅ Hoàn thành | 100% endpoints covered |
| Frontend React App (14 pages) | ✅ Hoàn thành | Responsive, dark mode |
| Admin Panel (10 pages) | ✅ Hoàn thành | RBAC enforced |
| AI Bot Service (vibe-content) | ✅ Hoàn thành | Multi-LLM, personality system |
| Docker deployment | ✅ Hoàn thành | multi-stage builds |
| Database (19 models) | ✅ Hoàn thành | Với full migration history |
| Test Suite | ✅ Hoàn thành | Vitest backend + frontend |
| Documentation | ✅ Hoàn thành | README, DEPLOYMENT, DB_SETUP |

### 7.2 Bài học kinh nghiệm (Lessons Learned)

**Về lập kế hoạch:**
- Block layout (`post_blocks`) không có trong backlog ban đầu → cần spike story để khám phá technical complexity trước khi estimate
- Nên có "design sprint" riêng cho quyết định kiến trúc phức tạp (SSE vs WebSocket)

**Về quy trình:**
- Scrum phù hợp với team nhỏ nhưng cần kỷ luật trong sprint boundaries
- DoD rõ ràng giúp tránh "done" mà thực ra chưa tested

**Về kỹ thuật:**
- Multi-LLM fallback là quyết định đúng đắn (reliability > simplicity)
- Prisma migration versioned giúp manage schema evolution an toàn

### 7.3 Đề xuất cải tiến

1. **Continuous Integration:** Thiếu CI pipeline tự động (GitHub Actions) — nên thêm cho dự án tiếp theo
2. **E2E Testing:** Chỉ có unit test; cần thêm Playwright/Cypress cho critical flows
3. **Monitoring:** `metricsMiddleware.ts` thu thập data nhưng chưa có dashboard; nên tích hợp Grafana
4. **Documentation:** API docs nên generate tự động từ Zod schemas (Swagger/OpenAPI)

---

## PHỤ LỤC

### A. Công nghệ & Phiên bản

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| Node.js | >= 18 | Runtime |
| TypeScript | ~5.x | Type safety |
| Express | 4.x | HTTP framework |
| Prisma | 5.x | ORM |
| PostgreSQL | >= 14 | Database |
| React | 18 | UI framework |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.x | Styling |
| Vitest | Latest | Testing |
| Docker | Latest | Containerization |

### B. Cấu trúc thư mục backend

```
backend/src/
├── app.ts              # Express app config
├── index.ts            # Entry point
├── controllers/        # Request handlers (14 files)
├── services/           # Business logic (21 files)
├── routes/             # API routing (14 files)
├── middlewares/        # Express middlewares (9 files)
├── validations/        # Zod schemas
├── types/              # TypeScript types
├── config/             # Configuration
├── constants/          # Constants
├── utils/              # Utilities
└── __tests__/          # Test files
```
