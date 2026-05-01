# DÀN Ý BÁO CÁO
## MÔN: QUẢN TRỊ DỰ ÁN PHẦN MỀM (QTDAPM)
### Dự án: MINI-FORUM — Ứng dụng Diễn đàn Trực tuyến Full-stack

---

> **Thời gian thực tập giả định:** 27/01/2026 – 27/04/2026
> **Mô hình phát triển:** Scrum Agile (6 Sprint × 2 tuần + 1 tuần Buffer)
> **Tài liệu gốc:** `docs/01_bao_cao_quan_tri_du_an_phan_mem.md`

---

## CHƯƠNG 1 — TỔNG QUAN DỰ ÁN

### 1.1 Mô tả dự án
- **Nội dung cốt lõi:** MINI-FORUM là ứng dụng diễn đàn full-stack xây dựng từ đầu trong 3 tháng.
- Bốn thành phần chính: `backend/` (Express/TypeScript/Prisma), `frontend/` (React 18/Vite), `admin-client/` (React/Radix UI), `vibe-content/` (AI bot đa LLM).
- Database: PostgreSQL với 19 models (Prisma ORM).

### 1.2 Phạm vi và mục tiêu
- **Mục tiêu kinh doanh:** Nền tảng diễn đàn độc lập, hỗ trợ moderation, tích hợp AI sinh nội dung seed.
- **Phạm vi kỹ thuật:** 4 service trong monorepo; ngoài phạm vi: mobile app, WebSocket, thanh toán.
- **Bảng tech stack:** Node.js/React/Vite/TailwindCSS/Prisma/PostgreSQL/Docker.

### 1.3 Các bên liên quan (Stakeholders)
- **Nội dung cốt lõi:** Bảng 4 stakeholder — Development Team (Cao), Product Owner (Trung bình), End User/Member (Thấp), Admin User (Trung bình).

---

## CHƯƠNG 2 — MÔ HÌNH PHÁT TRIỂN VÀ LÝ DO LỰA CHỌN

### 2.1 So sánh các mô hình phát triển
- **Nội dung cốt lõi:** Bảng so sánh Waterfall vs Kanban vs **Scrum** trên 5 tiêu chí: thay đổi yêu cầu, team nhỏ, deliverable định kỳ, risk management, tích hợp phức tạp.
- **Kết luận chọn Scrum:** Yêu cầu diễn đàn evolve theo feedback; block layout (`post_blocks`) được thêm sau sprint 1; AI chỉ tích hợp được sau khi có dữ liệu thật.

### 2.2 Cấu trúc Scrum áp dụng
- **Nội dung cốt lõi:** Vòng lặp Sprint Planning → Execution (2 tuần) → Review → Retrospective.
- Sprint duration: 2 tuần / 10 ngày làm việc; Daily standup 15 phút.
- 6 Sprint + 1 Buffer = 13 tuần tổng.

### 2.3 Definition of Done (DoD)
- **Nội dung cốt lõi:** 6 tiêu chí — code implement xong, unit test pass (Vitest), API test (Postman), code review, merge main, không lint error.

---

## CHƯƠNG 3 — LẬP KẾ HOẠCH DỰ ÁN

### 3.1 Work Breakdown Structure (WBS)
- **Nội dung cốt lõi:** Cây WBS 7 nhánh chính:
  1. Quản lý dự án (khởi tạo, sprint planning, kiểm soát)
  2. Nền tảng hệ thống (kiến trúc, monorepo, Prisma schema)
  3. Backend API (Auth, Users, Forum Core, Interaction, Admin, Media)
  4. Frontend (Layout, trang chính, trang user, tính năng nâng cao)
  5. Admin Panel (Dashboard, quản lý nội dung, moderation tools)
  6. Vibe-Content AI Bot (Personality, Content generation, Scheduler)
  7. Triển khai (Docker, deployment config, monitoring scripts)

### 3.2 Product Backlog (ưu tiên MoSCoW)
- **Nội dung cốt lõi:** 11 User Story với priority, story points, sprint target:
  - **Must Have (S1–S2):** US-01 Đăng ký OTP (8SP), US-02 Đăng nhập (5SP), US-03 Đăng bài (13SP), US-04 Bình luận (8SP).
  - **Should Have (S3–S4):** US-05 Vote (5SP), US-06 Search (8SP), US-07 SSE Notification (13SP), US-08 Admin Dashboard (8SP), US-09 Report handling (8SP), US-10 Audit log (5SP).
  - **Nice to Have (S5):** US-11 AI bot sinh nội dung (21SP).

### 3.3 Gantt Chart
- **Nội dung cốt lõi:** Timeline trực quan 13 tuần — Sprint S0→S5→Buffer, với các track song song: Auth, Post/Comment, Vote/SSE, Admin, AI Bot, Deploy.

### 3.4 Sprint Planning chi tiết — 6 Sprint

#### Sprint 0 (Jan 27 – Feb 7): Khởi tạo
- **Nội dung cốt lõi:** 7 task — phân tích yêu cầu (2 ngày), thiết kế kiến trúc (1 ngày), ERD v1 (2 ngày), setup monorepo (1 ngày), Prisma migrate (1 ngày), Express skeleton (1 ngày).
- **Sprint Goal:** "Có nền tảng kỹ thuật để bắt đầu develop feature."
- **Milestone M0:** Monorepo chạy được, schema v1 migrate thành công.

#### Sprint 1 (Feb 8 – Feb 21): Auth & Users
- **Nội dung cốt lõi:** 7 task — authController (register/login/logout), otpService + Brevo email, JWT access+refresh token, middleware auth+role+security, userController (profile/avatar).
- **Blocker phát hiện:** Brevo API sandbox rate limit → giải pháp mock email trong test.
- **Milestone M1:** Auth flow end-to-end pass (Register→OTP→Login→Refresh).

#### Sprint 2 (Feb 22 – Mar 7): Forum Core
- **Nội dung cốt lõi:** postController/Service, block layout system (post_blocks TEXT/IMAGE/CODE/QUOTE), commentController (nested + quote), categoryController + tagController, Frontend HomePage/PostDetailPage.
- **Phát sinh scope:** Block layout thêm giữa sprint → +1 ngày buffer → adjust Sprint 3.
- **Milestone M2:** Demo forum cơ bản end-to-end.

#### Sprint 3 (Mar 8 – Mar 21): Tính năng Nâng cao
- **Nội dung cốt lõi:** voteService (upvote/downvote + reputation), bookmarkService, searchService (PostgreSQL full-text), notificationService + sseService (SSE), blockReportController.
- **Milestone M3:** SSE notification demo, search latency < 200ms.

#### Sprint 4 (Mar 22 – Apr 4): Admin & Media
- **Nội dung cốt lõi:** adminController (stats, user/post/comment mgmt), auditLogService, imagekitService + postMediaController, metricsService + middleware, Admin-client hoàn thiện (10 trang).
- **Milestone M4:** Admin RBAC test pass, audit log ghi đúng mọi action.

#### Sprint 5 (Apr 5 – Apr 18): AI Bot + Testing + Deploy
- **Nội dung cốt lõi:** vibe-content (PersonalityService, ContentGeneratorService multi-LLM, ActionSelectorService, Scheduler), Vitest test suite, Docker multi-stage build, deployment config.
- **Milestone M5:** Bot sinh bài tự động mỗi giờ, test coverage > 60%.

---

## CHƯƠNG 4 — QUẢN LÝ RỦI RO

### 4.1 Risk Register (7 rủi ro chính)
- **Nội dung cốt lõi:** Bảng rủi ro với Xác suất × Tác động:

| ID | Rủi ro | Mức độ | Chiến lược |
|----|--------|--------|-----------|
| R01 | Schema DB thay đổi ảnh hưởng nhiều service | **Nghiêm trọng** | Prisma migration versioned; soft deprecation (giữ `avatar_url`) |
| R02 | LLM API không ổn định (rate limit, quota) | **Cao** | Multi-LLM fallback chain: Gemini→Groq→Cerebras→Nvidia |
| R03 | SSE không scale với nhiều concurrent users | **Cao** | Giới hạn scope prototype; ghi chú upgrade path WebSocket |
| R04 | Email delivery (Brevo) chậm/fail | **Cao** | OTP TTL + retry; mock trong test |
| R05 | ImageKit storage quota | **Thấp** | Tier free; cleanup script `cleanupImagekit.ts` |
| R06 | Tech debt do block layout thêm giữa sprint | **Trung bình** | Adjust sprint 3 scope |
| R07 | Deployment environment khác development | **Cao** | Docker container; `docker-entrypoint.sh` |

### 4.2 Risk Response — Ví dụ thực tế từ codebase
- **R01:** `backend/prisma/migrations/` — full history; `avatar_url` deprecated nhưng không xóa (backward-compatible).
- **R02:** `vibe-content/src/services/llm/` — 4 provider adapters với fallback loop.
- **R03:** `sseService.ts` quản lý connections in-memory; ghi nhận giới hạn trong `DEPLOYMENT.md`.

---

## CHƯƠNG 5 — KIỂM SOÁT TIẾN ĐỘ VÀ CHẤT LƯỢNG

### 5.1 Velocity Tracking
- **Nội dung cốt lõi:** Bảng 6 sprint — SP Planned vs Completed:
  - S1: 30→28 (Brevo delay), S2: 35→33 (scope creep), S3-S5: on track.
  - Average velocity: ~31.6 SP/sprint.

### 5.2 Burndown Chart
- **Nội dung cốt lõi:** Ví dụ Sprint 3 — đường burndown actual vs ideal (10 ngày, 35 SP).

### 5.3 Quality Gates
- **Nội dung cốt lõi:** DoD tự động hóa qua `package.json` scripts: `test` (Vitest), `lint` (ESLint), `build` (tsc).
- Test coverage theo module: Auth > 80%, Post > 70%, Vote > 70%, Frontend > 60%.

### 5.4 Code Review Process
- **Nội dung cốt lõi:** 4 lớp kiểm soát với team nhỏ — Self-review checklist, TypeScript strict mode (`tsconfig.json`), Zod validation tại API boundary (`validations/`), Security review (Helmet, rate limiting).

---

## CHƯƠNG 6 — QUẢN LÝ NGUỒN LỰC

### 6.1 Team Structure
- **Nội dung cốt lõi:** 3 vai trò — Lead Developer Fullstack (Backend/DevOps/AI), Frontend Developer (React/React Query/Radix UI). Với team 1–3 người, các vai trò kiêm nhiệm.

### 6.2 Phân bổ thời gian theo module
- **Nội dung cốt lõi:** Backend API 40% (complexity cao nhất: 14 controllers, 21 services), Frontend 20%, Admin Client 15%, Vibe-Content 15%, Testing+Deploy 10%.

### 6.3 Technical Debt Management
- **Nội dung cốt lõi:** Bảng 3 khoản nợ kỹ thuật ghi nhận rõ ràng:
  - `avatar_url` deprecated → Low priority (migration script có sẵn).
  - SSE in-memory → Medium (ghi upgrade path).
  - Metrics trong memory → Medium (cần Prometheus/Grafana cho production).

---

## CHƯƠNG 7 — KẾT QUẢ VÀ BÀI HỌC KINH NGHIỆM

### 7.1 Deliverables hoàn thành
- **Nội dung cốt lõi:** 8 deliverable — Backend (14 controllers), Frontend (14 pages), Admin Panel (10 pages), AI Bot, Docker, Database (19 models), Test Suite (Vitest), Documentation (README/DEPLOYMENT/DB_SETUP).

### 7.2 Bài học kinh nghiệm (Lessons Learned)
- **Về lập kế hoạch:** Cần spike story cho block layout; design sprint riêng cho quyết định SSE vs WebSocket.
- **Về quy trình:** Scrum phù hợp team nhỏ nhưng cần kỷ luật sprint boundaries; DoD rõ ràng tránh "done" mà chưa tested.
- **Về kỹ thuật:** Multi-LLM fallback đúng (reliability > simplicity); Prisma migration versioned quản lý schema evolution an toàn.

### 7.3 Đề xuất cải tiến
- **Nội dung cốt lõi:** 4 điểm cải thiện — CI pipeline (GitHub Actions), E2E testing (Playwright/Cypress), Monitoring dashboard (Grafana), API docs tự động (Swagger/OpenAPI từ Zod schemas).

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
| Vitest | Latest | Testing |
| Docker | Latest | Containerization |

### B. Tham chiếu codebase quan trọng
- `backend/src/` — 14 controllers, 21 services, 9 middlewares
- `backend/prisma/schema.prisma` — 19 models, migration history
- `backend/src/__tests__/` — Vitest test suite
- `vibe-content/src/services/llm/` — 4 LLM provider adapters
- `backend/docker-entrypoint.sh`, `backend/Dockerfile` — deployment artifacts
