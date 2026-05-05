# CHƯƠNG 6: QUẢN LÝ NGUỒN LỰC

---

## Giới thiệu chương

Quản lý nguồn lực là lĩnh vực cốt lõi trong quản trị dự án phần mềm, bao gồm hai khía cạnh chủ yếu: **nguồn lực con người** (nhân lực, phân công vai trò, trách nhiệm) và **nguồn lực phi con người** (thời gian, công cụ, môi trường phát triển). Chương này phân tích chi tiết cách thức dự án MINI-FORUM tổ chức, phân bổ và tối ưu hóa nguồn lực trong bối cảnh đặc thù của một nhóm nhỏ (1–3 người) với thời gian thực tập 13 tuần có deadline cứng.

Theo chuẩn PMBOK 6th Edition, quản lý nguồn lực bao gồm sáu quy trình: lập kế hoạch quản lý nguồn lực, ước tính nguồn lực hoạt động, thu nhận nguồn lực, phát triển nhóm, quản lý nhóm và kiểm soát nguồn lực. Trong bối cảnh nhóm nhỏ với Scrum Agile, các quy trình này được đơn giản hóa và tích hợp trực tiếp vào Sprint Planning, Sprint Review và Retrospective.

Chương trình bày bốn nội dung chính:
1. **Cấu trúc nhóm và phân công vai trò** — Sơ đồ tổ chức, RACI matrix, luồng giao tiếp và quy trình ra quyết định
2. **Phân bổ thời gian theo module** — Effort allocation chi tiết, phân tích nguyên nhân, lịch làm việc thực tế
3. **Quản lý nợ kỹ thuật** — Nhận diện, phân loại, đo lường và chiến lược xử lý Technical Debt trong Scrum
4. **Quản lý công cụ và môi trường phát triển** — Stack công cụ, cấu hình môi trường, bảo mật secrets

---

## 6.1 Cấu trúc nhóm và phân công vai trò

### 6.1.1 Tổng quan nhóm dự án

Dự án MINI-FORUM được thực hiện trong bối cảnh thực tập chuyên đề với quy mô nhóm **1–3 thành viên**, trong đó thành viên chính (Lead Developer) đảm nhận đồng thời nhiều vai trò từ Backend, DevOps, AI Integration đến Scrum Master. Đây là mô hình phổ biến trong phát triển startup giai đoạn đầu và dự án nội bộ có ngân sách hạn chế.

Thách thức đặc thù của mô hình nhóm nhỏ so với nhóm lớn truyền thống:

**Bảng 6.1 — So sánh mô hình nhóm lớn và nhóm nhỏ trong Scrum**

| Tiêu chí | Nhóm Scrum chuẩn (5–9 người) | Nhóm nhỏ MINI-FORUM (1–3 người) | Cách thích ứng |
|---------|------------------------------|----------------------------------|---------------|
| Phân công vai trò | Mỗi người một chuyên môn | Kiêm nhiệm nhiều vai trò | Ưu tiên rõ ràng theo sprint; không làm đồng thời |
| Daily Standup | Meeting thực sự (15 phút) | Solo/duo — dễ bỏ qua | Thay bằng Daily Log file markdown |
| Conflict resolution | Có quy trình rõ | Không có conflict nội bộ | Conflict chính là technical: ghi nhận ADR |
| Knowledge silo | Rủi ro mỗi người biết riêng một phần | Một người biết toàn bộ | Rủi ro khi thành viên duy nhất bị blocked |
| Sprint capacity | Dự báo theo từng thành viên | Toàn bộ capacity từ 1–2 người | Buffer 10–15% cho unexpected events |
| Handoff overhead | Có — cần communication | Gần như không có | Tiết kiệm thời gian giao tiếp |

### 6.1.2 Sơ đồ tổ chức nhóm dự án

**Hình 6.1 — Sơ đồ tổ chức nhóm dự án MINI-FORUM**

> *Mô tả hình:* Sơ đồ phân cấp tổ chức dạng cây. Cấp trên cùng là Product Owner (giảng viên hướng dẫn). Cấp thứ hai là Lead Developer kiêm Scrum Master. Cấp thứ ba là Frontend Developer (có thể là cùng người hoặc thành viên thứ hai). Các mũi tên thể hiện luồng thông tin: Product Owner → Lead (Sprint Review, feedback); Lead ↔ Frontend (API contract, integration). Các box bên trong mỗi vai trò liệt kê các trách nhiệm kỹ thuật cụ thể.

```
╔══════════════════════════════════════════════════════════════════╗
║                        CẤU TRÚC NHÓM DỰ ÁN                     ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │                     PRODUCT OWNER                         │  ║
║  │              Giảng viên hướng dẫn / Stakeholder            │  ║
║  │                                                            │  ║
║  │  Quyền hạn: Phê duyệt Product Backlog, ưu tiên MoSCoW     │  ║
║  │  Tham gia:  Sprint Review (cuối mỗi sprint, 30 phút)      │  ║
║  │  Phản hồi:  Acceptance/rejection của User Stories         │  ║
║  └───────────────────────────┬────────────────────────────────┘  ║
║                              │                                   ║
║                    Sprint Review + Feedback                      ║
║                    Phê duyệt Product Backlog                     ║
║                              │                                   ║
║                              ▼                                   ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │           LEAD DEVELOPER  /  SCRUM MASTER (kiêm nhiệm)     │  ║
║  │                                                            │  ║
║  │  BACKEND (40% tổng effort):                                │  ║
║  │    • Express.js REST API (14 controllers, 21 services)     │  ║
║  │    • Prisma ORM + PostgreSQL (19 models, 8 migrations)     │  ║
║  │    • JWT/OTP Authentication, RBAC middleware               │  ║
║  │    • Zod validation schemas (boundary protection)         │  ║
║  │    • SSE real-time notifications                           │  ║
║  │    • Full-text search (tsvector + GIN index)               │  ║
║  │                                                            │  ║
║  │  DEVOPS (bao gồm trong effort):                            │  ║
║  │    • Docker multi-stage builds                             │  ║
║  │    • Deployment config: Render.com, Vercel                 │  ║
║  │    • DB migration management, environment setup            │  ║
║  │    • Maintenance scripts (backup, cleanup, migrate)        │  ║
║  │                                                            │  ║
║  │  AI INTEGRATION (vibe-content — 15% effort):               │  ║
║  │    • Multi-LLM orchestration (Gemini→Groq→Cerebras→Nvidia) │  ║
║  │    • Personality system, prompt engineering                │  ║
║  │    • Cron scheduler (mỗi giờ), rate limiting               │  ║
║  │                                                            │  ║
║  │  SCRUM MASTER (kiêm nhiệm):                                │  ║
║  │    • Sprint planning & Sprint Review facilitation          │  ║
║  │    • Velocity tracking, Burndown chart cập nhật            │  ║
║  │    • Risk register review mỗi sprint                       │  ║
║  │    • Remove impediments, escalate khi cần                  │  ║
║  └───────────────────────────┬────────────────────────────────┘  ║
║                              │                                   ║
║                   Phối hợp API contract                          ║
║                   Code review, integration                       ║
║                              │                                   ║
║                              ▼                                   ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │                   FRONTEND DEVELOPER                       │  ║
║  │                                                            │  ║
║  │  USER FRONTEND (frontend/ — 20% effort):                   │  ║
║  │    • React 18, Vite 5, TailwindCSS 3                       │  ║
║  │    • TanStack React Query v5 (async state management)      │  ║
║  │    • 14 trang: Home, PostDetail, Categories, Search, ...   │  ║
║  │    • SSE client (real-time notifications)                  │  ║
║  │    • Dark mode, responsive design                          │  ║
║  │    • Block layout editor (TEXT/IMAGE/CODE/QUOTE)           │  ║
║  │                                                            │  ║
║  │  ADMIN PANEL (admin-client/ — 15% effort):                 │  ║
║  │    • Radix UI + shadcn/ui component library                │  ║
║  │    • 12 trang quản trị: Dashboard, Users, Posts, ...       │  ║
║  │    • Data tables với sorting, filtering, pagination        │  ║
║  │    • KPI charts, Operational dashboard                     │  ║
║  └────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════╝
```

### 6.1.3 Ma trận trách nhiệm RACI đầy đủ

Ma trận RACI xác định rõ ràng ai làm gì và ai chịu trách nhiệm cho từng hoạt động trong dự án. Đây là công cụ quan trọng để tránh sự mơ hồ trong phân công, đặc biệt khi có nhiều vai trò kiêm nhiệm.

**Quy ước RACI:**
- **R** = Responsible — Người trực tiếp thực hiện công việc
- **A** = Accountable — Người chịu trách nhiệm cuối cùng về kết quả (chỉ 1 người/task)
- **C** = Consulted — Người được hỏi ý kiến trước khi quyết định
- **I** = Informed — Người được thông báo về kết quả

**Bảng 6.2 — Ma trận RACI đầy đủ**

| Hoạt động / Deliverable | Lead Dev | Frontend Dev | Product Owner | Ghi chú |
|------------------------|:--------:|:------------:|:------------:|---------|
| **QUẢN LÝ DỰ ÁN** | | | | |
| Xây dựng Product Backlog ban đầu | R, A | C | **A**, C | PO phê duyệt cuối cùng |
| Sprint Planning (ưu tiên, estimate) | R, A | R | **A** | PO chốt priority |
| Sprint Review demo | R | R | **A** | PO accept/reject stories |
| Retrospective | R, A | R | I | Nội bộ nhóm |
| Velocity & Burndown tracking | R, A | I | I | Lead cập nhật hàng ngày |
| Risk management | R, A | C | I | Review cuối mỗi sprint |
| **THIẾT KẾ HỆ THỐNG** | | | | |
| Kiến trúc tổng thể (monorepo) | **R, A** | C | I | Lead quyết định |
| ERD và Database schema | **R, A** | C | I | Frontend cần biết để UI |
| API contract (endpoint, schema) | **R, A** | C | I | Thống nhất trước khi code |
| Security model (RBAC, JWT) | **R, A** | I | I | Backend responsibility |
| **BACKEND DEVELOPMENT** | | | | |
| Auth & OTP flow | **R, A** | I | I | |
| Post / Comment / Category / Tag APIs | **R, A** | I | I | |
| Vote + Search + SSE | **R, A** | C | I | SSE client do Frontend |
| Admin APIs | **R, A** | I | I | |
| Media upload (ImageKit) | **R, A** | C | I | Frontend gọi API |
| Zod validation schemas | **R, A** | I | I | |
| **FRONTEND DEVELOPMENT** | | | | |
| User-facing React app (14 trang) | C | **R, A** | I | |
| Admin panel (12 trang) | C | **R, A** | I | |
| SSE client (notifications) | C | **R, A** | I | |
| Block layout editor UI | C | **R, A** | I | |
| **AI & DEVOPS** | | | | |
| vibe-content service toàn bộ | **R, A** | I | I | |
| Multi-LLM fallback chain | **R, A** | I | I | |
| Docker multi-stage build | **R, A** | C | I | |
| Render.com + Vercel deployment | **R, A** | C | I | Frontend cần Vercel config |
| DB migration management | **R, A** | I | I | |
| **TESTING & DOCUMENTATION** | | | | |
| Unit tests Vitest (backend) | R, A | R | I | Mỗi người test phần mình |
| API testing (REST Client) | **R, A** | C | I | |
| README × 4, DEPLOYMENT.md | R, A | C | I | |
| DB_SETUP.md, DEPLOY_CHECKLIST.md | **R, A** | I | I | |

### 6.1.4 Luồng giao tiếp và quy trình ra quyết định

Trong nhóm nhỏ, giao tiếp diễn ra chủ yếu không đồng bộ để tối ưu thời gian làm việc thực sự. Quy trình ra quyết định được phân tầng theo mức độ tác động:

**Bảng 6.3 — Phân tầng quyết định theo mức độ tác động**

| Loại quyết định | Ai quyết định | Thời gian | Ghi chép |
|----------------|:-------------|:--------:|---------|
| Kỹ thuật cấp thấp (tên biến, cấu trúc hàm) | Lead tự quyết | Ngay lập tức | Không bắt buộc |
| Kỹ thuật cấp trung (chọn thư viện, pattern) | Lead + Frontend thảo luận | < 2 giờ | Comment trong code hoặc PR |
| Kiến trúc quan trọng (SSE vs WebSocket) | Toàn nhóm + ADR | < 1 ngày | Architecture Decision Record |
| Scope change (thêm/bớt User Story) | Lead + Product Owner | Sprint Review | Sprint backlog update |
| Scope change khẩn cấp (blocker) | Lead quyết định, PO confirm | < 4 giờ | Message ghi lại |

---

## 6.2 Phân bổ thời gian theo module

### 6.2.1 Tổng quan phân bổ effort

Toàn bộ dự án MINI-FORUM thực hiện trong **13 tuần** (27/01 – 27/04/2026), tương đương **~60 person-days** với 1 developer fulltime (20 ngày/tháng × 3 tháng).

**Bảng 6.4 — Phân bổ effort theo module chính**

| Module | % Effort | Person-days | Sprint chủ yếu | Lý do effort cao/thấp |
|--------|:--------:|:-----------:|:--------------:|----------------------|
| **Backend API** | **40%** | ~24 ngày | S1–S4 | Complexity cao nhất: 14 controllers, 21 services, 9 middlewares; nghiệp vụ phức tạp (vote + reputation, SSE streaming, full-text search GIN index) |
| **Frontend React** | **20%** | ~12 ngày | S2–S4 | React Query + TailwindCSS giảm boilerplate đáng kể; 14 trang nhưng nhiều trang tái sử dụng component (PostCard, UserAvatar, CommentItem) |
| **Admin Panel** | **15%** | ~9 ngày | S4 | Reuse toàn bộ pattern từ frontend; complexity chính ở data tables (sort/filter/paginate) và form validation phức tạp |
| **vibe-content AI** | **15%** | ~9 ngày | S5 | Multi-LLM integration có nhiều unknown; debug prompt engineering và test fallback chain mất nhiều thời gian |
| **Testing + Deploy** | **10%** | ~6 ngày | S1, S5, Buffer | Docker multi-stage được optimize từ sớm; test suite tập trung vào critical paths |
| **Tổng** | **100%** | **~60 ngày** | S0–Buffer | |

### 6.2.2 Biểu đồ phân bổ effort

**Hình 6.2 — Biểu đồ phân bổ effort theo module**

> *Mô tả hình:* Biểu đồ cột nằm ngang (horizontal bar chart). Trục dọc là các module theo thứ tự effort giảm dần. Trục ngang là phần trăm effort (0–50%). Mỗi cột hiển thị số ngày tuyệt đối và phần trăm. Màu sắc: Backend = xanh đậm, Frontend = xanh nhạt, Admin = cam, vibe-content = vàng, Test/Deploy = xám.

```
        PHÂN BỔ EFFORT THEO MODULE (Person-days)
        ═══════════════════════════════════════════════════════

        Backend API    ████████████████████████████████████████  40% | 24 ngày
        Frontend       ████████████████████                     20% | 12 ngày
        Admin Client   ███████████████                          15% |  9 ngày
        vibe-content   ███████████████                          15% |  9 ngày
        Test + Deploy  ██████████                               10% |  6 ngày
                       ────────────────────────────────────────────────────────
                       0%    10%   20%   30%   40%   50%   Tổng: 60 ngày
```

### 6.2.3 Phân tích chi tiết effort Backend (40% = ~24 ngày)

**Bảng 6.5 — Phân bổ effort chi tiết trong Backend**

| Nhóm chức năng | Controllers | Services (số lượng) | Person-days | % trong Backend |
|---------------|:----------:|:-------------------:|:-----------:|:---------------:|
| **Auth & Security** | authController | authService, otpService, emailService, brevoApiService (4) | ~3.5 ngày | 15% |
| **Forum Core** | postController, commentController, categoryController, tagController (4) | postService, commentService, categoryService, tagService, blockService, blockValidationService (6) | ~6 ngày | 25% |
| **Tương tác** | voteController, bookmarkController, searchController, notificationController (4) | voteService, bookmarkService, searchService, notificationService, sseService (5) | ~6 ngày | 25% |
| **Admin & Reports** | adminController, blockReportController, configController (3) | reportService, auditLogService, metricsService (3) | ~4.8 ngày | 20% |
| **Media** | postMediaController (1) | imagekitService, postMediaService, userService-avatar (3) | ~3.7 ngày | 15% |
| **Middleware cross-cutting** | — | authMiddleware, roleMiddleware, securityMiddleware, … (9) | ~included | — |
| **Tổng Backend** | **14 controllers** | **21 services** | **~24 ngày** | **100%** |

**Phân tích nguyên nhân effort cao của từng nhóm:**

- **Auth & Security (15%):** OTP email với retry logic (tối đa 3 lần, TTL 10 phút), JWT rotation (access token 15 phút + refresh token 7 ngày với revocation), RBAC middleware với 3 role levels — mỗi component cần test kỹ về security edge cases và attack scenarios.
- **Forum Core (25%):** Block layout system (`post_blocks`) là tính năng phức tạp nhất — schema đa dạng với 4 block types (TEXT/IMAGE/CODE/QUOTE), `sort_order` management (đảm bảo thứ tự khi reorder), nested comments với `parent_id` self-referential.
- **Tương tác (25%):** `searchService` với full-text search GIN index cần tune query và test hiệu năng (latency P95 < 150ms); `sseService` memory management với concurrent connections; vote reputation calculation cần atomic update để tránh race condition.
- **Admin (20%):** `auditLogService` ghi nhận mọi admin action với old/new values đòi hỏi middleware tự động; `metricsService` thu thập response time theo endpoint; report management với workflow state machine.
- **Media (15%):** ImageKit upload pipeline, URL transformation (preview vs standard resolution), cleanup script cho orphaned files.

### 6.2.4 Phân bổ effort theo sprint

**Bảng 6.6 — Phân bổ effort theo sprint và module (%)**

| Sprint | Tuần | Backend | Frontend | Admin | AI Bot | Deploy/Test | Tổng SP |
|--------|:----:|:-------:|:--------:|:-----:|:------:|:-----------:|:-------:|
| **S0** | W1–W2 | 60% | 20% | 10% | 10% | — | Setup |
| **S1** | W3–W4 | 80% | 15% | — | — | 5% | 28 SP |
| **S2** | W5–W6 | 60% | 35% | — | — | 5% | 33 SP |
| **S3** | W7–W8 | 55% | 40% | — | — | 5% | 35 SP |
| **S4** | W9–W10 | 30% | 20% | 40% | — | 10% | 32 SP |
| **S5** | W11–W12 | 10% | 5% | 5% | 60% | 20% | 30 SP |
| **Buffer** | W13 | 10% | 10% | 10% | 10% | 60% | — |

### 6.2.5 Lịch làm việc thực tế theo tuần

**Hình 6.3 — Gantt chart lịch làm việc và deliverable theo tuần**

> *Mô tả hình:* Biểu đồ Gantt với trục ngang là 13 tuần (W1–W13) và trục dọc là các module/deliverable. Các thanh đặc thể hiện khoảng thời gian làm việc. Các dấu `●` trên trục ngang là các milestone. Màu sắc: xanh đậm = backend, xanh nhạt = frontend, cam = admin, vàng = AI, xám = test/deploy/docs.

```
MODULE / DELIVERABLE     W1  W2  W3  W4  W5  W6  W7  W8  W9  W10 W11 W12 W13
                         ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
Kiến trúc & Setup        ████████
Database Schema (ERD)    ████████████
Auth + OTP + JWT                  ████████
User Management                   ████████
Post + Block Layout                        ████████
Comment (nested/quote)                     ████████
Category + Tag                             ████████
Vote + Reputation                                   ████████
Full-text Search                                    ████████
SSE Notifications                                   ████████
Admin APIs                                                   ████████
Media (ImageKit)                                             ████████
Audit Log                                                    ████████
vibe-content AI Bot                                                   ████████
Test Suite (Vitest)      ████               ████             ████    ████
Docker Build                                                          ████████
Documentation            ████                                         ████████████
                         ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───
MILESTONE:
  M0 (07/02) ────────────●─── Monorepo running + ERD v1 + Seed script
  M1 (21/02) ────────────────────● Auth end-to-end (register→OTP→login→refresh)
  M2 (07/03) ──────────────────────────────● Forum core (post+comment+category)
  M3 (21/03) ──────────────────────────────────────● Interactive (vote+search+SSE)
  M4 (04/04) ───────────────────────────────────────────────● Admin panel complete
  M5 (18/04) ───────────────────────────────────────────────────────● Production-ready
```

---

## 6.3 Quản lý nợ kỹ thuật (Technical Debt)

### 6.3.1 Khái niệm và vai trò trong dự án

**Technical Debt** (nợ kỹ thuật) là khái niệm do Ward Cunningham đặt ra năm 1992, dùng để mô tả cái giá phải trả về sau khi chọn giải pháp nhanh thay vì giải pháp đúng đắn hơn. Tương tự như nợ tài chính, technical debt tích lũy "lãi suất" theo thời gian:

- Thời gian sửa bug tăng (phải hiểu code phức tạp hơn do workaround)
- Khó thêm tính năng mới (side effects không lường trước từ quick fix)
- Onboarding developer mới mất nhiều thời gian hơn

**Bảng 6.7 — Phân loại Technical Debt trong dự án MINI-FORUM**

| Loại | Định nghĩa | Ví dụ trong MINI-FORUM | Nguyên nhân phát sinh |
|------|-----------|----------------------|----------------------|
| **Intentional** | Cố ý chọn giải pháp tạm thời, biết rõ giới hạn, chấp nhận có kiểm soát | SSE in-memory (TD-02), deprecated `avatar_url` (TD-01) | Trade-off: deadline vs. giải pháp lý tưởng; nghiệp vụ không đòi hỏi ngay |
| **Inadvertent** | Không biết đang tạo debt khi viết code; phát hiện sau | Thiếu CI/CD (TD-04), thiếu E2E tests (TD-05) | Thiếu kinh nghiệm hoặc không có thời gian suy nghĩ dài hạn lúc viết |
| **Bit rot** | Code đúng lúc viết nhưng lỗi thời khi môi trường thay đổi | Metrics in-memory (TD-03) khi codebase scale | Môi trường thay đổi sau khi viết (tăng tải, nhiều instance) |

### 6.3.2 Quy trình nhận diện và ghi nhận Technical Debt

**Hình 6.4 — Quy trình xử lý Technical Debt trong vòng đời Sprint**

> *Mô tả hình:* Flowchart 4 bước. Bắt đầu từ "Phát hiện debt" (qua code review, testing, retrospective) → "Ghi nhận vào Debt Register" với đầy đủ thông tin → "Đánh giá Priority" (Cao/TB/Thấp) → phân nhánh sang sprint tiếp theo / backlog / theo dõi → cuối cùng đều về "Monitor & Review cuối sprint".

```
              Phát hiện Technical Debt
              (Code Review / Testing / Sprint Retro / Daily Work)
                             │
                             ▼
              Tạo "Debt Story" trong Product Backlog
              Template:
              ┌──────────────────────────────────────┐
              │ WHAT: Mô tả rõ vấn đề                │
              │ WHERE: Vị trí cụ thể trong codebase  │
              │ IMPACT: Tác động kinh doanh + kỹ thuật│
              │ TYPE: Intentional / Inadvertent / Rot │
              │ PRIORITY: P1 / P2 / P3               │
              └──────────────────────────────────────┘
                             │
                             ▼
              Đánh giá Priority
              ┌─────────────────────────────────────────┐
              │  P1 Cao: block feature/deploy/security  │
              │  P2 TB:  ảnh hưởng performance/scale   │
              │  P3 Thấp: chỉ ảnh hưởng DX/maintainability│
              └─────────────────────────────────────────┘
                    │              │              │
                   P1             P2             P3
                    │              │              │
               Sprint          Product        Backlog
               tiếp theo       Backlog        (theo dõi)
               (10% budget)    (priority)
                    │              │              │
                    └──────────────┴──────────────┘
                                   │
                                   ▼
              Review & Monitor cuối Sprint
              (Retrospective: debt nào cần escalate?)
```

### 6.3.3 Debt Register — Bảng theo dõi nợ kỹ thuật đầy đủ

**Bảng 6.8 — Debt Register đầy đủ của dự án**

| ID | Mô tả | Loại | Vị trí | Tác động KD | Tác động KT | Ưu tiên | Sprint phát sinh | Kế hoạch | Trạng thái |
|:--:|-------|:----:|--------|:-----------:|:-----------:|:-------:|:----------------:|----------|:----------:|
| **TD-01** | Field `avatar_url` deprecated nhưng vẫn giữ trong schema để backward-compatible với clients cũ chưa migrate | Intentional | `backend/prisma/schema.prisma` | Thấp — dư thừa data | Thấp — không ảnh hưởng query | P3 | S2 | Chạy `migrateAvatarUrls.ts` sau khi all clients dùng `avatar_standard_url` | **Open** |
| **TD-02** | SSE connections lưu trong process memory (Map) — không scale khi có nhiều instance | Intentional | `backend/src/services/sseService.ts` | Trung bình — giới hạn ~500 concurrent | Cao — block horizontal scaling | P2 | S3 | Upgrade: Redis pub/sub adapter + socket.io; documented trong `DEPLOYMENT.md` | **Open** |
| **TD-03** | API metrics (response time, count) thu thập trong memory — mất khi restart | Intentional | `backend/src/services/metricsService.ts` | Thấp — chỉ mất khi restart | Trung bình — không có historical data | P2 | S4 | Tích hợp Prometheus exporter `/metrics` endpoint + Grafana dashboard | **Open** |
| **TD-04** | Không có CI/CD pipeline — deploy thủ công qua dashboard | Inadvertent | Toàn bộ project (không có `.github/workflows/`) | Trung bình — risk human error | Trung bình — không có automated quality gate trước deploy | P1 | S5 | GitHub Actions: lint → typecheck → test → build → deploy on merge to main | **Documented** |
| **TD-05** | Thiếu End-to-End tests cho critical user flows | Inadvertent | `frontend/`, `admin-client/` | Cao — regression risk khi thêm tính năng | Cao — bugs phát hiện trễ ở production | P1 | S2 | Playwright: auth flow, create post, vote flow, admin actions | **Documented** |
| **TD-06** | API documentation viết tay trong Markdown — không tự đồng bộ với code | Inadvertent | `docs/` | Thấp — developer experience | Thấp — risk outdated docs | P3 | S1 | `zod-to-openapi` auto-generate từ Zod schemas; Swagger UI tại `/api/docs` | **Partial** |

### 6.3.4 Ma trận Technical Debt — Impact vs. Effort to Fix

**Hình 6.5 — Ma trận phân tích Technical Debt**

> *Mô tả hình:* Ma trận 2×2. Trục X là Effort to Fix (Thấp bên trái, Cao bên phải). Trục Y là Impact nếu không giải quyết (Thấp bên dưới, Cao bên trên). Bốn góc: Quick Win (trên-trái), Strategic (trên-phải), Low Priority (dưới-trái), Questionable (dưới-phải). Các TD được đặt trong ma trận.

```
        Impact (Tác động nếu KHÔNG giải quyết)
        CAO  │
             │  ┌─────────────────┐ │ ┌─────────────────────────────┐
             │  │  QUICK WIN ✓    │ │ │      STRATEGIC ★            │
             │  │                 │ │ │                             │
             │  │  TD-05 E2E Tests│ │ │  TD-02 SSE Scaling          │
             │  │  (Impact: Cao,  │ │ │  (Impact: Cao,              │
             │  │   Effort: TB)   │ │ │   Effort: Cao 5–7 ngày)     │
             │  │                 │ │ │                             │
             │  └─────────────────┘ │ └─────────────────────────────┘
             │                      │
             │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
             │                      │
             │  ┌─────────────────┐ │ ┌─────────────────────────────┐
             │  │  LOW PRIORITY ○ │ │ │      BACKLOG △              │
             │  │                 │ │ │                             │
             │  │  TD-01 avatar   │ │ │  TD-03 Prometheus           │
             │  │  TD-06 API Docs │ │ │  TD-04 CI/CD Pipeline       │
             │  │                 │ │ │  (Impact: TB,               │
             │  │                 │ │ │   Effort: TB 2–3 ngày)      │
             │  └─────────────────┘ │ └─────────────────────────────┘
        THẤP │                      │
             └──────────────────────┴──────────────────────────────
                       THẤP                       CAO
                            Effort to Fix

        ✓ Quick Win: Giải quyết sớm nhất (high impact, manageable effort)
        ★ Strategic: Lập kế hoạch dài hạn (chỉ fix khi có resource)
        ○ Low Priority: Xử lý khi có thời gian rảnh
        △ Backlog: Cân nhắc kỹ, đưa vào sprint khi capacity cho phép
```

### 6.3.5 Chiến lược quản lý Technical Debt trong Scrum

Dự án áp dụng **"10% Rule"** — một tỷ lệ cố định của sprint capacity dành riêng cho debt stories:

```
Sprint Capacity × 10% = Technical Debt Budget

Ví dụ Sprint 4 (32 SP total):
  ├── Feature stories:  32 × 90% ≈ 29 SP
  └── Debt budget:      32 × 10% ≈  3 SP → Chọn 1 debt story giá trị nhất
```

**4 quy tắc cứng:**

1. **Ghi nhận ngay khi phát sinh** — Khi phát hiện potential debt (code review, daily work, testing), tạo ngay Debt Story trong backlog với đầy đủ thông tin theo template chuẩn.
2. **Không address debt trong sprint đang chạy** — Mọi debt được ghi nhận nhưng không được xử lý ngay trong sprint hiện tại, trừ khi debt block hoàn toàn một business feature.
3. **Debt không được phép block milestone delivery** — Nếu một debt có nguy cơ ảnh hưởng đến milestone, escalate ngay lên Product Owner để quyết định: fix ngay hoặc chấp nhận rủi ro có kiểm soát.
4. **DoD ngăn chặn debt mới** — DoD 6 tiêu chí (compile, lint, test, API test, self-review, doc) là bức tường đầu tiên chống lại việc merge code tạo ra debt không được biết đến.

### 6.3.6 Tương quan Technical Debt và Sprint Velocity

**Bảng 6.9 — Theo dõi Technical Debt theo sprint**

| Sprint | Velocity (SP) | Debt Hoàn Thành | Debt Mới | Tổng Debt Lũy Kế | Nhận xét |
|--------|:-------------:|:---------------:|:--------:|:----------------:|---------|
| S1 | 28 | 0 | TD-01 | 1 | Brevo delay giảm velocity; TD-01 từ migration strategy quyết định trong S0 |
| S2 | 33 | 0 | TD-06 | 2 | Block layout scope creep; TD-06 từ quyết định "viết docs sau deadline" |
| S3 | 35 | 0 | TD-02 | 3 | Sprint tốt nhất; TD-02 từ quyết định SSE in-memory (đổi lấy tốc độ implement) |
| S4 | 32 | 1 (TD-06 partial) | TD-03 | 3 | TD-06 partial: inline comments; TD-03 từ metricsService simple design |
| S5 | 30 | 1 (docs hoàn chỉnh) | TD-04, TD-05 | 5 | TD-04/05 nhận ra khi chuẩn bị production deploy |
| Buffer | — | 2 (docs + scripts) | 0 | 3 | TD-04/05 documented với upgrade path; TD-02 Open nhưng acceptable |

**Hình 6.6 — Biểu đồ tích lũy Technical Debt theo sprint**

> *Mô tả hình:* Biểu đồ đường với trục X là sprint (S0–Buffer) và trục Y là số lượng debt items. Đường cam đặc = Debt Cumulative thực tế (tăng từ 0 đến 5 rồi giảm nhẹ về 3 sau Buffer). Đường ngang xanh đứt = Ideal (0 debt). Các mũi tên ghi chú chỉ ra sprint nào phát sinh debt mới.

```
Số debt items
 6 │
   │
 5 │                                          ●
   │                                  TD-04↗/ │TD-05 phát sinh
 4 │                                  ●       │
   │                          TD-02↗/         │
 3 │                          ●               ●── Buffer (fix 2, còn 3)
   │               TD-06↗/                    ▲
 2 │               ●                     TD-06 partial fix
   │    TD-01↗/
 1 │    ●
   │
 0 └────────────────────────────────────────────────────────
       S0    S1    S2    S3    S4    S5   Buffer

   ──── Cumulative Debt (thực tế)   ─ ─ ─ Ideal (0 debt)
```

> **Phân tích:** Debt tăng nhanh từ S3 phản ánh trade-off điển hình: sprint đầu ít debt vì codebase đơn giản; sprint sau áp lực deadline tăng → chấp nhận thêm debt. Quan trọng là: **không có debt item nào block delivery** — 100% User Stories hoàn thành đúng hạn. Đây là outcome lý tưởng khi áp dụng "10% Rule" và DoD nghiêm túc.

---

## 6.4 Quản lý công cụ và môi trường phát triển

### 6.4.1 Cấu trúc môi trường 4 tầng

**Bảng 6.10 — Cấu hình 4 môi trường phát triển**

| Môi trường | Nền tảng | Cấu hình đặc trưng | Mục đích | Người sử dụng |
|-----------|:--------:|-------------------|---------|:-------------:|
| **Development** | Local machine | `.env` local, PostgreSQL local port 5432, `NODE_ENV=development`, hot reload | Develop tính năng mới, debug tương tác, thử nghiệm nhanh | Developer |
| **Test** | Local machine (isolated) | `NODE_ENV=test`, PostgreSQL test DB port 5433, mock services (email, LLM, ImageKit) | Vitest unit tests isolated, không gọi external APIs | CI / Developer |
| **Staging** | Docker local | `docker-compose.yml`, `.env.staging`, PostgreSQL trong container, không mock | Integration test end-to-end trước khi deploy production | Developer trước deploy |
| **Production** | Render.com (backend), Vercel (frontend/admin) | Environment variables qua dashboard, PostgreSQL Managed (Render), CDN Vercel | Live traffic, end users | End users |

**Hình 6.7 — Luồng triển khai qua 4 môi trường**

> *Mô tả hình:* Flowchart tuyến tính từ trái sang phải: Development → Test → Staging → Production. Mỗi bước có điều kiện PASS/FAIL. Fail ở bước nào thì quay về bước đó. Cuối cùng là Production với monitor loop.

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│ DEVELOPMENT │    │     TEST     │    │   STAGING    │    │ PRODUCTION  │
│             │    │              │    │              │    │             │
│ Code + Debug│───▶│ vitest run   │───▶│ docker-      │───▶│ Render.com  │
│ Local DB    │    │ ESLint       │    │ compose up   │    │ Vercel      │
│ Hot reload  │    │ tsc --noEmit │    │ Manual API   │    │             │
│             │    │              │    │ test         │    │ Health check│
└─────────────┘    └──────┬───────┘    └──────┬───────┘    └──────┬──────┘
                          │                   │                   │
                         FAIL                FAIL             Monitor
                          │                   │             (logs, alerts)
                          ▼                   ▼
                     Fix & Retry        Fix & Retry
```

### 6.4.2 Quản lý secrets và bảo mật cấu hình

Bảo mật secrets là yêu cầu bắt buộc theo OWASP Top 10 (A02: Cryptographic Failures, A05: Security Misconfiguration). Dự án áp dụng nghiêm ngặt nguyên tắc "zero secrets in code":

**Bảng 6.11 — Danh sách và phân loại biến môi trường**

| Biến môi trường | Dịch vụ | Mức độ nhạy cảm | Nơi lưu trữ |
|----------------|---------|:--------------:|------------|
| `DATABASE_URL` | PostgreSQL | 🔴 Tối mật | Render dashboard + `.env` local (gitignored) |
| `JWT_SECRET` | JWT Access Token | 🔴 Tối mật | Render dashboard (min 32 ký tự random) |
| `JWT_REFRESH_SECRET` | JWT Refresh Token | 🔴 Tối mật | Render dashboard (khác hoàn toàn JWT_SECRET) |
| `BREVO_API_KEY` | Email OTP | 🟠 Nhạy cảm | Render dashboard + Brevo portal |
| `IMAGEKIT_PRIVATE_KEY` | CDN upload signed | 🟠 Nhạy cảm | Render dashboard + ImageKit portal |
| `IMAGEKIT_PUBLIC_KEY` | CDN public | 🟡 Ít nhạy | Có thể expose ở client (by design) |
| `IMAGEKIT_URL_ENDPOINT` | CDN base URL | 🟢 Công khai | Có thể hardcode |
| `GEMINI_API_KEY` | LLM primary | 🟠 Nhạy cảm | vibe-content `.env` + Render dashboard |
| `GROQ_API_KEY` | LLM fallback 1 | 🟠 Nhạy cảm | vibe-content `.env` + Render dashboard |
| `CEREBRAS_API_KEY` | LLM fallback 2 | 🟠 Nhạy cảm | vibe-content `.env` + Render dashboard |
| `NVIDIA_API_KEY` | LLM fallback 3 | 🟠 Nhạy cảm | vibe-content `.env` + Render dashboard |
| `VITE_API_URL` | Frontend → Backend | 🟢 Công khai | Vercel env (visible in browser bundle) |

**Quy trình bảo mật secrets được áp dụng:**

```
Nguyên tắc 1 — Zero secrets in git:
  .gitignore:  .env  .env.*  .env.local  .env.staging  .env.production

Nguyên tắc 2 — Template an toàn:
  .env.example chứa: KEY=<mô tả giá trị cần điền> (không có giá trị thật)

Nguyên tắc 3 — Principle of Least Privilege:
  • DB user: chỉ SELECT/INSERT/UPDATE/DELETE, không có DROP/CREATE
  • ImageKit API key: giới hạn upload folder cụ thể
  • Brevo API key: chỉ quyền gửi email transactional

Nguyên tắc 4 — Rotation khi có sự cố:
  Render dashboard → Environment Variables → Update → Save → Trigger Redeploy
```

### 6.4.3 Stack công cụ và năng suất phát triển

**Bảng 6.12 — Stack công cụ phát triển và lý do lựa chọn**

| Loại | Công cụ | Phiên bản | Lý do lựa chọn | Đóng góp vào năng suất |
|------|--------|:--------:|----------------|------------------------|
| **IDE** | VS Code | Latest | Extensions phong phú (Prisma, TypeScript, REST Client), debugging tốt | Nền tảng chính |
| **Version Control** | Git + GitHub | — | Industry standard, free private repos, GitHub Actions (khi có CI/CD) | Không thể thiếu |
| **API Testing** | REST Client (VS Code ext.) | — | File `.http` commit được, inline trong editor, không cần switch app | Tiết kiệm ~20% thời gian |
| **DB GUI** | Prisma Studio | Built-in | `npx prisma studio` — xem/edit data trực quan không cần SQL | Tiết kiệm ~30% debug time |
| **Container** | Docker Desktop | Latest | Đảm bảo "works on my machine" → staging environment nhất quán | Giảm production surprises |
| **TypeScript** | tsc | 5.x | Strict mode bắt lỗi compile time, IDE intellisense | Giảm ~40% runtime bugs |
| **Test Runner** | Vitest | Latest | Nhanh hơn Jest (Vite-native), watch mode hot reload | Feedback loop dưới 2 giây |
| **Linting** | ESLint | Latest | Bắt common mistakes, enforce style trước commit | Giảm nitpicks trong review |
| **Formatter** | Prettier | Latest | Auto-format, không tranh cãi về style | Đồng nhất codebase |
| **Package Manager** | npm | 9+ | Workspace support cho monorepo | Tiêu chuẩn |

### 6.4.4 Ước tính ROI của công cụ và thực hành

**Bảng 6.13 — Ước tính lợi ích của các công cụ trong 60 ngày dự án**

| Công cụ / Thực hành | Thời gian tiết kiệm (est.) | Thời gian setup | ROI |
|--------------------|:-------------------------:|:--------------:|:---:|
| TypeScript strict mode | ~8 ngày (giảm debug runtime) | 0.5 ngày | **16:1** |
| Prisma Studio + type-safe client | ~3 ngày (không cần raw SQL debug) | 0 (built-in) | **∞** |
| Vitest watch mode | ~2 ngày (fast feedback loop) | 0.5 ngày | **4:1** |
| REST Client `.http` files | ~2 ngày (thay Postman GUI) | 0.5 ngày | **4:1** |
| Docker staging environment | ~1.5 ngày (ít surprise ở production) | 1 ngày | **1.5:1** |
| ESLint + Prettier | ~1 ngày (giảm code review nits) | 0.5 ngày | **2:1** |
| Prisma migrations versioned | ~1 ngày (rollback nhanh nếu cần) | 0 (part of workflow) | **∞** |

---

## 6.5 Tổng kết chương

Chương 6 đã phân tích toàn diện bốn khía cạnh quản lý nguồn lực trong dự án MINI-FORUM:

**[Về nguồn lực con người]**
Mô hình nhóm nhỏ (1–3 người) đòi hỏi kiêm nhiệm nhiều vai trò và kỷ luật cao về ưu tiên công việc. RACI matrix giúp tránh mơ hồ ngay cả khi team nhỏ — mỗi deliverable phải có đúng một người Accountable. Phân tầng quyết định rõ ràng giảm thiểu thời gian "phân vân" và tăng tốc độ thực thi.

**[Về phân bổ thời gian]**
Backend API chiếm 40% effort — hợp lý vì đây là nơi tập trung toàn bộ business logic phức tạp, bảo mật và tích hợp dịch vụ bên ngoài. Phân bổ 15% cho vibe-content (AI) phản ánh overhead cao của tích hợp LLM. Lịch làm việc theo sprint đảm bảo mỗi component được build và test độc lập trước khi integrate.

**[Về nợ kỹ thuật]**
6 debt items được ghi nhận nhưng **không có item nào block delivery** — outcome lý tưởng khi áp dụng "10% Rule" và DoD nghiêm túc. Chiến lược "Ghi nhận ngay, giải quyết có kế hoạch" tốt hơn nhiều so với "fix ngay" (làm gián đoạn sprint) hoặc "để sau" (quên mất).

**[Về công cụ và môi trường]**
Đầu tư vào công cụ đúng chỗ (TypeScript strict, Prisma Studio, Vitest watch) mang lại ROI cao — tiết kiệm ước tính ~18 ngày developer time trong 60 ngày dự án, tức ~30% năng suất tăng thêm.

> **Bài học chính:** Quản lý nguồn lực hiệu quả trong nhóm nhỏ không có nghĩa là làm nhiều việc cùng lúc, mà là **làm đúng việc đúng thời điểm** — ưu tiên rõ ràng, ghi nhận debt minh bạch, và bảo vệ sprint backlog khỏi scope creep không có kiểm soát.

---

*[Tiếp theo: Chương 7 — Kết quả và bài học kinh nghiệm]*
