# CHƯƠNG 6: QUẢN LÝ NGUỒN LỰC

---

## 6.1 Cấu trúc nhóm và phân công vai trò

### 6.1.1 Tổng quan nhóm dự án

Dự án MINI-FORUM được thực hiện trong bối cảnh thực tập với quy mô nhóm 1–3 người. Đây là môi trường phổ biến trong phát triển startup và dự án nội bộ, nơi các thành viên phải kiêm nhiệm nhiều vai trò khác nhau. Mô hình này đòi hỏi kỷ luật cao về quản lý thời gian, ưu tiên công việc và tự động hóa các tác vụ lặp lại.

### 6.1.2 Sơ đồ tổ chức nhóm

**Hình 6.1 — Sơ đồ tổ chức nhóm dự án MINI-FORUM**

```
┌──────────────────────────────────────────┐
│              Product Owner               │
│   (Giảng viên hướng dẫn / Stakeholder)  │
└──────────────────┬───────────────────────┘
                   │
                   │ Sprint Review, Feedback
                   │
┌──────────────────▼───────────────────────┐
│         Lead Developer (Fullstack)        │
│                                          │
│  Backend:                                │
│  • Express.js API, Prisma ORM            │
│  • JWT/OTP Auth, RBAC middleware         │
│  • Business logic (21 services)          │
│  • Zod validation schemas                │
│                                          │
│  DevOps:                                 │
│  • Docker multi-stage builds             │
│  • Deployment config (Render, Vercel)    │
│  • DB migration management              │
│  • Maintenance scripts                   │
│                                          │
│  AI Integration:                         │
│  • vibe-content architecture             │
│  • Multi-LLM orchestration              │
│  • Scheduler, cron jobs                  │
│                                          │
│  Scrum Master (kiêm nhiệm):              │
│  • Sprint planning & review              │
│  • Velocity tracking                     │
│  • Risk management                       │
└──────────────────┬───────────────────────┘
                   │ Phối hợp API contract
                   │
┌──────────────────▼───────────────────────┐
│           Frontend Developer              │
│                                          │
│  User-facing Frontend (frontend/):       │
│  • React 18, Vite, TailwindCSS           │
│  • React Query (API state management)    │
│  • 14 pages: Home, Post, Profile, ...    │
│  • SSE client integration                │
│                                          │
│  Admin Panel (admin-client/):            │
│  • Radix UI, shadcn/ui components        │
│  • 12 pages: Dashboard, Users, ...      │
│  • Data tables, charts, forms            │
└──────────────────────────────────────────┘
```

### 6.1.3 Ma trận trách nhiệm (RACI)

**R** = Responsible (thực hiện) | **A** = Accountable (chịu trách nhiệm) | **C** = Consulted (tư vấn) | **I** = Informed (được thông báo)

| Hoạt động | Lead Developer | Frontend Developer | Product Owner |
|-----------|---------------|-------------------|--------------|
| Thiết kế kiến trúc hệ thống | **R, A** | C | I |
| Backend API development | **R, A** | I | I |
| Database schema & migrations | **R, A** | C | I |
| Frontend development | C | **R, A** | I |
| Admin panel development | C | **R, A** | I |
| AI bot (vibe-content) | **R, A** | I | I |
| Docker & deployment | **R, A** | C | I |
| Sprint Planning | **R, A** | R | **A** |
| Sprint Review demo | **R** | **R** | **A** |
| Risk management | **R, A** | C | I |
| Test suite | **R** | **R** | I |

---

## 6.2 Phân bổ thời gian theo module

### 6.2.1 Tổng quan phân bổ effort

**Bảng 6.1 — Phân bổ thời gian (effort) theo module**

| Module | % Effort | Số ngày người (person-days) | Lý do |
|--------|----------|---------------------------|-------|
| **Backend API** | **40%** | ~24 ngày | Complexity cao nhất: 14 controllers, 21 services, 9 middlewares; business logic phức tạp (vote reputation, SSE, search indexing) |
| **Frontend** | **20%** | ~12 ngày | React Query + TailwindCSS giảm boilerplate; 14 trang nhưng nhiều trang tái sử dụng component |
| **Admin Client** | **15%** | ~9 ngày | Reuse pattern từ frontend; complexity chủ yếu ở data tables và form validation |
| **Vibe-Content** | **15%** | ~9 ngày | Multi-LLM integration có nhiều unknown; debug prompt engineering mất thời gian |
| **Testing + Deployment** | **10%** | ~6 ngày | Docker multi-stage được optimize; test suite tập trung vào critical paths |
| **Tổng** | **100%** | ~60 ngày | Tương ứng 3 tháng với 1 developer fulltime (20 ngày/tháng) |

### 6.2.2 Biểu đồ phân bổ effort

**Hình 6.2 — Biểu đồ phân bổ effort theo module**

```
Backend API    ████████████████████████████████████████  40%
               (24 ngày)

Frontend       ████████████████████  20%
               (12 ngày)

Admin Client   ███████████████  15%
               (9 ngày)

Vibe-Content   ███████████████  15%
               (9 ngày)

Test + Deploy  ██████████  10%
               (6 ngày)

               0%    10%   20%   30%   40%   50%
```

### 6.2.3 Phân tích chi tiết effort Backend

Backend API chiếm 40% effort vì đây là nơi tập trung toàn bộ business logic phức tạp:

| Nhóm chức năng | Controllers | Services | % effort trong Backend |
|---------------|------------|---------|----------------------|
| Auth & Security | authController | authService, otpService, emailService, brevoApiService | 15% |
| Forum Core | postController, commentController, categoryController, tagController | postService, commentService, categoryService, tagService, blockService, blockValidationService | 25% |
| Tương tác | voteController, bookmarkController, searchController, notificationController | voteService, bookmarkService, searchService, notificationService, sseService | 25% |
| Admin & Reports | adminController, blockReportController, configController | reportService, auditLogService, metricsService | 20% |
| Media | postMediaController | imagekitService, postMediaService, userService (avatar) | 15% |

### 6.2.4 Lịch làm việc theo tuần

```
Week  Focus Area                          Deliverable
W1-2  [S0] Architecture + Setup          Monorepo running, ERD v1
W3-4  [S1] Auth + Security + Users       Auth flow end-to-end
W5-6  [S2] Post + Comment + Category     Basic forum working
W7-8  [S3] Vote + Search + SSE + Block   Interactive forum
W9-10 [S4] Admin + Media + Audit         Admin panel complete
W11-12[S5] AI + Testing + Docker         Production-ready system
W13   [BUF] Buffer + Documentation       All docs complete
```

---

## 6.3 Quản lý nợ kỹ thuật (Technical Debt)

### 6.3.1 Định nghĩa và phân loại

**Technical Debt** trong dự án được phân thành ba loại:
1. **Intentional (cố ý):** Biết là giải pháp tạm thời nhưng chấp nhận để đạt milestone, ghi nhận để fix sau.
2. **Inadvertent (vô ý):** Phát sinh do estimate sai, scope creep, hoặc chưa có đủ kinh nghiệm.
3. **Bit rot:** Code cũ không được cập nhật khi context thay đổi.

### 6.3.2 Bảng theo dõi nợ kỹ thuật

**Bảng 6.2 — Danh sách nợ kỹ thuật được ghi nhận**

| ID | Mô tả nợ | Loại | Vị trí trong codebase | Tác động | Ưu tiên giải quyết | Kế hoạch |
|----|----------|------|----------------------|---------|-------------------|---------|
| **TD-01** | `avatar_url` field deprecated nhưng vẫn còn trong schema để backward-compatible | Intentional | `backend/prisma/schema.prisma` comment `@deprecated UC-08` | Thấp — không ảnh hưởng chức năng | **Thấp** | Migration script `migrateAvatarUrls.ts` đã sẵn sàng; chạy sau khi xác nhận tất cả clients đã dùng `avatar_standard_url` |
| **TD-02** | SSE connection management in-memory không scale horizontal | Intentional | `backend/src/services/sseService.ts` | Trung bình — block horizontal scaling | **Trung bình** | Upgrade path: Redis pub/sub + WebSocket; documented trong `DEPLOYMENT.md` |
| **TD-03** | Metrics thu thập trong process memory (metricsService) | Intentional | `backend/src/services/metricsService.ts` | Trung bình — mất data khi restart | **Trung bình** | Tích hợp Prometheus/Grafana cho production monitoring |
| **TD-04** | Không có CI/CD pipeline tự động | Inadvertent | Toàn bộ project | Trung bình — deploy thủ công | **Cao** | Setup GitHub Actions workflow: lint → test → build → deploy |
| **TD-05** | Thiếu E2E tests cho critical user flows | Inadvertent | `frontend/`, `admin-client/` | Trung bình — regression risk tăng | **Cao** | Playwright hoặc Cypress cho Register → Post → Comment flow |
| **TD-06** | API documentation thủ công (không auto-generate) | Inadvertent | `docs/` | Thấp — dev experience | **Thấp** | Swagger/OpenAPI tự động từ Zod schemas + Zod-to-OpenAPI |

### 6.3.3 Chiến lược quản lý Technical Debt trong Scrum

**Quy tắc áp dụng trong dự án:**
1. **Ghi nhận ngay khi phát sinh** — tạo một "Debt Story" trong Product Backlog với priority rõ ràng.
2. **Không thêm debt vào sprint đang chạy** — nếu phát hiện debt trong sprint, ghi nhận và address ở sprint sau.
3. **Buffer time trong mỗi sprint cho debt** — ~10% capacity dành cho tech debt stories.
4. **Debt không được phép block business features** — nếu debt ảnh hưởng tới milestone, escalate ngay lên Product Owner.

### 6.3.4 Tech Debt vs. Sprint velocity

```
Sprint  Velocity  Debt Stories Completed  Debt Carried Forward
S1      28 SP     0                       TD-01 mới phát sinh
S2      33 SP     0                       TD-01, TD-06
S3      35 SP     0 (focus features)      TD-01, TD-02 (mới), TD-06
S4      32 SP     1 (TD-06 partial)       TD-01, TD-02, TD-03 (mới)
S5      30 SP     2 (documentation fix)   TD-01, TD-02, TD-03, TD-04, TD-05
Buffer  —         Docs + deploy scripts   TD-04, TD-05 documented
```

**Nhận xét:** Tổng 102 SP từ Product Backlog được hoàn thành đúng hạn. Tech debt không ngăn cản delivery nhưng tích lũy đáng kể từ S3 trở đi — phản ánh trade-off điển hình giữa "ship fast" và "ship clean" trong môi trường thực tập có deadline cứng.

---

## 6.4 Quản lý công cụ và môi trường phát triển

### 6.4.1 Môi trường phát triển

| Môi trường | Cấu hình | Mục đích |
|-----------|---------|---------|
| **Development** | Local machine, `.env` file, PostgreSQL local | Develop và test tính năng |
| **Test** | `NODE_ENV=test`, mock services (email, LLM) | Vitest unit tests, isolated |
| **Staging** | Docker container local, `.env.staging` | Integration test trước deploy |
| **Production** | Render.com (backend), Vercel (frontend) | End users |

### 6.4.2 Quản lý secrets và cấu hình

```
Biến môi trường quan trọng (không commit vào git):
├── DATABASE_URL — PostgreSQL connection string
├── JWT_SECRET — Signing key cho JWT tokens
├── BREVO_API_KEY — Email service API key
├── IMAGEKIT_PRIVATE_KEY — Media upload
├── GEMINI_API_KEY, GROQ_API_KEY — LLM providers
└── IMAGEKIT_URL_ENDPOINT — CDN base URL

Quản lý:
├── .env.example — Template không có giá trị thật
├── .gitignore — Exclude tất cả .env files
└── Render.com / Vercel — Environment variables qua dashboard
```

---

*[Tiếp theo: Chương 7 — Kết quả và bài học kinh nghiệm]*
