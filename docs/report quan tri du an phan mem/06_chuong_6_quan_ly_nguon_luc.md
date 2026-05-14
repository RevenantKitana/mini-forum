# CHƯƠNG 6: QUẢN LÝ NGUỒN LỰC

---

## 6.1 Cấu trúc vai trò và phân công trách nhiệm

### 6.1.1 Mô hình triển khai cá nhân

Dự án MINI-FORUM được thực hiện theo mô hình **1 người**, tác giả kiêm nhiệm đồng thời nhiều vai trò:

| Vai trò | Effort | Phạm vi |
|---------|:---:|---|
| Lead Developer (Backend) | 40% | 14 controllers, 21 services, 9 middlewares |
| Frontend Developer | 20% | React app 14 trang |
| Admin Panel Developer | 15% | Admin client 12 trang |
| AI/DevOps Engineer | 15% | vibe-content, Docker, deploy |
| QA + Scrum Master | 10% | Testing, planning, docs |

Product Owner = giảng viên hướng dẫn, tham gia Sprint Review cuối mỗi sprint.

**So sánh Scrum chuẩn vs. mô hình cá nhân:**

| Tiêu chí | Scrum chuẩn | MINI-FORUM (1 người) | Cách thích ứng |
|---------|:---:|:---:|---|
| Daily Standup | Meeting 15 phút | Không khả thi | Daily Log markdown 3 dòng |
| Conflict resolution | Quy trình rõ | Không có nội bộ | ADR cho quyết định kỹ thuật |
| Sprint capacity | Theo từng thành viên | Từ 1 người | Buffer 10–15% cho sự cố |
| Handoff overhead | Có | Hầu như không | Tiết kiệm thời gian giao tiếp |

### 6.1.2 Ma trận RACI

**Bảng 6.1 — RACI đầy đủ** *(R=Responsible, A=Accountable, C=Consulted, I=Informed)*

| Hoạt động | Lead Dev | Frontend Dev | Product Owner |
|-----------|:---:|:---:|:---:|
| **QUẢN LÝ DỰ ÁN** | | | |
| Product Backlog, Sprint Planning | R,A | C | **A** |
| Sprint Review demo | R | R | **A** (accept/reject) |
| Velocity & Risk tracking | R,A | I | I |
| **THIẾT KẾ HỆ THỐNG** | | | |
| Kiến trúc, ERD, API contract | **R,A** | C | I |
| Security model (RBAC, JWT) | **R,A** | I | I |
| **BACKEND** | | | |
| Auth, Forum Core, Vote, Search, SSE, Admin, Media | **R,A** | I/C | I |
| Zod validation schemas | **R,A** | I | I |
| **FRONTEND & ADMIN** | | | |
| React app (14 trang), Admin panel (12 trang) | C | **R,A** | I |
| SSE client, Block editor UI | C | **R,A** | I |
| **AI & DEVOPS** | | | |
| vibe-content, Multi-LLM, Docker, Deployment | **R,A** | C | I |
| DB migration management | **R,A** | I | I |
| **TESTING & DOCS** | | | |
| Unit tests, API testing, README × 4, DEPLOYMENT.md | R,A | C | I |

### 6.1.3 Phân tầng quyết định

| Loại quyết định | Ai quyết định | Thời gian | Ghi chép |
|----------------|---|:---:|---|
| Kỹ thuật cấp thấp (naming, cấu trúc hàm) | Lead tự quyết | Ngay | Không bắt buộc |
| Chọn thư viện, pattern | Lead + Frontend | < 2h | Comment trong code |
| Kiến trúc quan trọng (SSE vs WebSocket) | Tác giả + ADR | < 1 ngày | Architecture Decision Record |
| Scope change | Lead + Product Owner | Sprint Review | Sprint backlog update |
| Scope change khẩn | Lead quyết, PO confirm | < 4h | Message ghi lại |

---

## 6.2 Phân bổ thời gian theo module

Toàn dự án: **13 tuần** (27/01–27/04/2026), tương đương **~60 person-days**.

**Bảng 6.2 — Phân bổ effort theo module**

| Module | % Effort | Person-days | Sprint chủ yếu | Lý do effort |
|--------|:--------:|:-----------:|:--------------:|---|
| **Backend API** | **40%** | ~24 ngày | S1–S4 | 14 controllers, 21 services, 9 middlewares; SSE, GIN search, vote atomic |
| **Frontend React** | **20%** | ~12 ngày | S2–S4 | React Query + TailwindCSS giảm boilerplate; tái sử dụng component |
| **Admin Panel** | **15%** | ~9 ngày | S4 | Reuse pattern từ frontend; data tables sort/filter/paginate |
| **vibe-content AI** | **15%** | ~9 ngày | S5 | Multi-LLM unknown; debug prompt engineering + fallback chain |
| **Testing + Deploy** | **10%** | ~6 ngày | S1, S5, Buffer | Docker optimize sớm; test tập trung critical paths |

**Bảng 6.3 — Phân bổ effort Backend chi tiết (~24 ngày)**

| Nhóm | Controllers | Services | Days | % Backend |
|------|:-----------:|:--------:|:----:|:---------:|
| Auth & Security | 1 | 4 (auth, otp, email, brevo) | ~3.5 | 15% |
| Forum Core | 4 (post, comment, cat, tag) | 6 (post, comment, cat, tag, block, blockValidation) | ~6 | 25% |
| Tương tác | 4 (vote, bookmark, search, notif) | 5 (vote, bookmark, search, notif, sse) | ~6 | 25% |
| Admin & Reports | 3 (admin, blockReport, config) | 3 (report, auditLog, metrics) | ~4.8 | 20% |
| Media | 1 (postMedia) | 3 (imagekit, postMedia, userAvatar) | ~3.7 | 15% |

**Bảng 6.4 — Phân bổ effort theo sprint và module (%)**

| Sprint | Backend | Frontend | Admin | AI Bot | Deploy/Test | Total SP |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| S0 | 60% | 20% | 10% | 10% | — | Setup |
| S1 | 80% | 15% | — | — | 5% | 28 SP |
| S2 | 60% | 35% | — | — | 5% | 33 SP |
| S3 | 55% | 40% | — | — | 5% | 35 SP |
| S4 | 30% | 20% | 40% | — | 10% | 32 SP |
| S5 | 10% | 5% | 5% | 60% | 20% | 30 SP |
| Buffer | 10% | 10% | 10% | 10% | 60% | — |

**Milestones chính:**

| Milestone | Ngày | Deliverable |
|-----------|:---:|---|
| M0 | 07/02 | Monorepo running + ERD v1 + Seed script |
| M1 | 21/02 | Auth end-to-end (register→OTP→login→refresh) |
| M2 | 07/03 | Forum core (post + comment + category) |
| M3 | 21/03 | Interactive (vote + search + SSE) |
| M4 | 04/04 | Admin panel complete |
| M5 | 18/04 | Production-ready deploy |

---

## 6.3 Quản lý Nợ Kỹ Thuật

**Technical Debt** (Ward Cunningham, 1992) — cái giá phải trả khi chọn giải pháp nhanh thay vì đúng đắn, tích lũy "lãi suất" qua thời gian (bug fix lâu hơn, khó thêm tính năng, onboarding chậm hơn).

**Bảng 6.5 — Phân loại Technical Debt**

| Loại | Định nghĩa | Ví dụ trong MINI-FORUM |
|------|-----------|---|
| **Intentional** | Cố ý chọn giải pháp tạm, biết rõ giới hạn | SSE in-memory (TD-02), deprecated `avatar_url` |
| **Inadvertent** | Không biết đang tạo debt khi viết; phát hiện sau | Thiếu CI/CD (TD-04), thiếu E2E tests (TD-05) |
| **Bit rot** | Code đúng lúc viết nhưng lỗi thời | Metrics in-memory (TD-03) khi scale |

**Bảng 6.6 — Debt Register đầy đủ**

| ID | Mô tả | Loại | Tác động | Ưu tiên | Sprint | Kế hoạch | Trạng thái |
|:--:|-------|:----:|:--------:|:-------:|:------:|----------|:----------:|
| TD-01 | `avatar_url` deprecated, giữ backward-compat | Intentional | Thấp | P3 | S2 | Chạy `migrateAvatarUrls.ts` sau migrate all clients | Open |
| TD-02 | SSE in-memory, không scale multi-instance | Intentional | Cao (KT) | P2 | S3 | Redis pub/sub + socket.io | Open |
| TD-03 | API metrics in-memory, mất khi restart | Intentional | Trung bình | P2 | S4 | Prometheus exporter + Grafana | Open |
| TD-04 | Không có CI/CD pipeline — deploy thủ công | Inadvertent | Trung bình | P1 | S5 | GitHub Actions: lint→test→build→deploy | Documented |
| TD-05 | Thiếu E2E tests cho critical user flows | Inadvertent | Cao (KD) | P1 | S2 | Playwright: auth, post, vote, admin flows | Documented |
| TD-06 | API docs viết tay — không đồng bộ với code | Inadvertent | Thấp | P3 | S1 | `zod-to-openapi` + Swagger UI `/api/docs` | Partial |

**Chiến lược "10% Rule":** Mỗi sprint dành 10% capacity cho debt stories:

- Sprint 4 (32 SP): 29 SP features + 3 SP debt budget → xử lý 1 debt item
- Mọi debt item được ghi nhận ngay khi phát hiện, không xử lý trong sprint đang chạy
- Debt không được phép block milestone delivery

**Bảng 6.7 — Theo dõi Technical Debt theo sprint**

| Sprint | Velocity | Debt mới | Debt xử lý | Tổng lũy kế | Nhận xét |
|--------|:---:|:---:|:---:|:---:|---|
| S1 | 28 | TD-01 | 0 | 1 | Brevo delay; TD-01 từ migration strategy S0 |
| S2 | 33 | TD-06 | 0 | 2 | Scope creep; TD-06 từ "viết docs sau" |
| S3 | 35 | TD-02 | 0 | 3 | Sprint tốt nhất; TD-02 từ SSE in-memory |
| S4 | 32 | TD-03 | 1 (TD-06 partial) | 3 | Inline comments; TD-03 từ metrics design |
| S5 | 30 | TD-04, TD-05 | 1 (docs) | 5 | Phát hiện khi chuẩn bị production deploy |
| Buffer | — | 0 | 2 (docs + scripts) | 3 | TD-04/05 documented; TD-02 Open nhưng acceptable |

> **Kết quả:** Không có debt item nào block delivery. 100% User Stories hoàn thành đúng hạn — outcome lý tưởng khi áp dụng "10% Rule" và DoD nghiêm túc.

---

## 6.4 Môi trường phát triển

**Bảng 6.8 — Cấu hình 4 môi trường**

| Môi trường | Nền tảng | Đặc trưng | Mục đích |
|-----------|:---:|---|---|
| **Development** | Local machine | `.env` local, PostgreSQL port 5432, hot reload | Develop, debug tương tác |
| **Test** | Local (isolated) | `NODE_ENV=test`, PostgreSQL port 5433, mock services | Vitest isolated, không gọi external APIs |
| **Staging** | Docker local | `docker-compose.yml`, PostgreSQL trong container | Integration test E2E trước deploy |
| **Production** | Render.com + Vercel | Env vars qua dashboard, PostgreSQL Managed, CDN | Live traffic |

**Luồng triển khai:** Development → Test (vitest + eslint + tsc) → Staging (docker-compose + manual API test) → Production (Render/Vercel). Fail bước nào → fix và retry từ bước đó.

---

*[Tiếp theo: Chương 7 — Kết quả và Bài học kinh nghiệm]*
