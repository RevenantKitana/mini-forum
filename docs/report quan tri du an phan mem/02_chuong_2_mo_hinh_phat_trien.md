# CHƯƠNG 2: MÔ HÌNH PHÁT TRIỂN VÀ LÝ DO LỰA CHỌN

---

## 2.1 Lựa chọn phương pháp phát triển

Ba phương pháp được đánh giá trên 8 tiêu chí: **Waterfall** (thiếu linh hoạt, không thể demo giữa kỳ), **Kanban** (không có Sprint Goal rõ ràng cho báo cáo tiến độ), **Scrum** (phù hợp nhất). Scrum cung cấp: (1) sprint 2 tuần có deliverable demo, (2) phản ứng linh hoạt với yêu cầu thay đổi, (3) velocity tracking để báo cáo tiến độ cụ thể, (4) phát hiện rủi ro sớm qua Sprint Review.

Thực tế: Block Layout thêm Sprint 2 không cần refactor; AI Service dời Sprint 5 khi forum core hoàn chỉnh; SSE scalability issue phát hiện Sprint 3 qua demo. Scrum đã chứng minh hiệu quả thực tế cho bối cảnh này.

---

## 2.2 Cấu trúc Scrum áp dụng trong dự án

### 2.2.1 Tổng quan cấu hình Sprint

Scrum framework được áp dụng có điều chỉnh (tailored) cho phù hợp với đặc thù thực hiện cá nhân, bối cảnh thực tập và ràng buộc thời gian 13 tuần. Các thông số cơ bản được xác định ngay trong Sprint 0 (tuần đầu tiên):

**Bảng 2.2 — Cấu hình Scrum áp dụng trong MINI-FORUM**

| Thông số Scrum | Cấu hình áp dụng | Lý do lựa chọn |
|----------------|-----------------|----------------|
| **Sprint Duration** | 2 tuần (10 ngày làm việc) | Đủ thời gian deliver 1 module hoàn chỉnh; không quá dài để mất feedback |
| **Tổng số Sprint** | 6 Sprint production + 1 tuần Buffer | 6×2 tuần = 12 tuần + 1 tuần dự phòng = 13 tuần tổng |
| **Thời gian dự án** | 27/01/2026 – 27/04/2026 (13 tuần) | Khung thực tập cố định |
| **Daily Standup** | 15 phút/ngày (sáng đầu giờ) | Phát hiện blocker sớm; duy trì kỷ luật theo sprint |
| **Sprint Planning** | Nửa ngày (4 giờ) đầu mỗi Sprint | Chọn stories, estimate, tạo Sprint Backlog |
| **Sprint Review** | Nửa ngày (4 giờ) cuối mỗi Sprint | Demo Working Software; thu thập feedback PO |
| **Sprint Retrospective** | 1 giờ sau Sprint Review | Cải tiến quy trình; action items cụ thể |
| **Backlog Refinement** | Giữa Sprint (Tuần thứ 2) | Chuẩn bị stories cho Sprint kế tiếp |
| **Story Point Scale** | Fibonacci: 1, 2, 3, 5, 8, 13 | Planning Poker — tránh phân tích quá chi tiết |
| **Velocity đo lường** | Story Points hoàn thành / Sprint | Cơ sở để dự báo capacity Sprint tiếp theo |

### 2.2.2 Lịch trình 6 Sprint

**Bảng 2.2b — Kế hoạch tổng thể 6 Sprint + Buffer**

| Sprint | Thời gian | Sprint Goal | Module chính |
|--------|-----------|-------------|-------------|
| **Sprint 0** | 27/01 – 07/02 | Thiết lập hạ tầng & database schema | Monorepo setup, Prisma schema 19 models, Docker, CI pipeline |
| **Sprint 1** | 10/02 – 21/02 | Auth & User Management hoàn chỉnh | Register+OTP, Login/Logout, JWT, RBAC, Profile |
| **Sprint 2** | 24/02 – 07/03 | Forum Core — Post & Comment | Post CRUD + Block Layout, Nested Comments, Category/Tag |
| **Sprint 3** | 10/03 – 21/03 | Tính năng tương tác & Real-time | Vote, Search, SSE Notifications, Bookmark |
| **Sprint 4** | 24/03 – 04/04 | Admin Panel & Media | Admin Dashboard, Moderation, Audit Log, ImageKit Upload |
| **Sprint 5** | 07/04 – 18/04 | AI Bot + Testing + Production Deploy | vibe-content, Test coverage ≥60%, Render/Vercel deploy |
| **Buffer** | 21/04 – 27/04 | Bug fix, tài liệu, báo cáo | Documentation, final testing, report |

### 2.2.3 Vòng lặp Sprint — Quy trình chi tiết

**Hình 2.1 — Vòng lặp Sprint trong Scrum áp dụng cho MINI-FORUM**

```
╔════════════════════════════════════════════════════════════════════╗
║               VÒNG LẶP SPRINT SCRUM (2 tuần = 10 ngày)            ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌─────────────────────────────────────────────────────────────┐  ║
║  │             PRODUCT BACKLOG (tổng hợp)                     │  ║
║  │  11 User Stories — ưu tiên theo MoSCoW                     │  ║
║  │  Được cập nhật sau mỗi Sprint Review                       │  ║
║  └──────────────────────────┬──────────────────────────────────┘  ║
║                             │                                     ║
║                    SPRINT PLANNING (Ngày 1, 4 giờ)                ║
║                    ┌────────▼────────┐                            ║
║                    │  Sprint Backlog │                            ║
║                    │  (tasks đã chọn │                            ║
║                    │  và estimate)   │                            ║
║                    └────────┬────────┘                            ║
║                             │                                     ║
║  ┌──────────────────────────▼──────────────────────────────────┐  ║
║  │                  SPRINT EXECUTION (Ngày 2–9)               │  ║
║  │                                                             │  ║
║  │  Ngày 1  │ Ngày 2  │ Ngày 3  │ ... │ Ngày 9  │ Ngày 10    │  ║
║  │  Planning│ Dev     │ Dev     │     │ Dev     │ Review+Ret. │  ║
║  │          │         │         │     │         │             │  ║
║  │  ◆ DAILY STANDUP 15 phút mỗi ngày (Ngày 2–9):            │  ║
║  │    • "Hôm qua tôi đã hoàn thành..."                       │  ║
║  │    • "Hôm nay tôi sẽ làm..."                              │  ║
║  │    • "Blocker/impediment cần hỗ trợ..."                   │  ║
║  │                                                             │  ║
║  │  ◆ BACKLOG REFINEMENT (Ngày 7, 1 giờ):                   │  ║
║  │    Chuẩn bị stories cho Sprint kế tiếp                    │  ║
║  └──────────────────────────┬──────────────────────────────────┘  ║
║                             │                                     ║
║              ┌──────────────┴──────────────┐                     ║
║              ▼                             ▼                     ║
║   SPRINT REVIEW (Ngày 10, 4 giờ)    SPRINT RETROSPECTIVE         ║
║   ┌────────────────────────┐         (Ngày 10, 1 giờ sau Review) ║
║   │ Demo Working Software  │         ┌──────────────────────────┐ ║
║   │ cho Product Owner      │         │ ✅ What went well?       │ ║
║   │                        │         │ ❌ What to improve?      │ ║
║   │ • Chạy trực tiếp app   │         │ 🔧 Action items (1–3 VP) │ ║
║   │ • Không dùng slide     │         │    cụ thể cho Sprint sau │ ║
║   │ • PO chấp nhận/từ chối │         └──────────────────────────┘ ║
║   │   từng User Story      │                                     ║
║   │ • Cập nhật Backlog     │                                     ║
║   └────────────────────────┘                                     ║
║                                                                    ║
║              ▼ Lặp lại cho Sprint tiếp theo                      ║
╚════════════════════════════════════════════════════════════════════╝
```

*Nguồn: Tác giả tự xây dựng, tham chiếu Scrum Guide (Schwaber & Sutherland, 2020)*

### 2.2.4 Cấu hình vai trò Scrum theo mô hình kiêm nhiệm

Trong môi trường thực tập cá nhân, các vai trò Scrum không thể tách biệt hoàn toàn như đội ngũ đầy đủ. Việc kiêm nhiệm được áp dụng có chủ đích, với ranh giới trách nhiệm rõ ràng:

**Bảng 2.3 — Cấu hình vai trò Scrum trong MINI-FORUM (solo)**

| Vai trò Scrum | Người đảm nhận | Trách nhiệm cụ thể trong dự án | Thời gian dành cho vai trò |
|--------------|---------------|-------------------------------|--------------------------|
| **Product Owner** | Giảng viên hướng dẫn (chính) + Tác giả (hỗ trợ làm rõ yêu cầu) | Xác định và ưu tiên Product Backlog; viết Acceptance Criteria; xác nhận/từ chối User Story trong Sprint Review | ~20% thời gian PO (giảng viên); theo phiên review |
| **Scrum Master** | Tác giả (kiêm nhiệm) | Điều phối Sprint Planning và Retrospective; phát hiện và loại bỏ blocker; bảo vệ Sprint Goal khỏi scope creep; theo dõi velocity | ~20% tổng effort |
| **Development Team (1 người)** | Tác giả (Fullstack + DevOps + AI Integration) | Implement, write tests, self-review, deploy; tự tổ chức công việc trong sprint | ~80% tổng effort |

> **Ghi chú về kiêm nhiệm:** Trong Scrum Guide (2020), Scrum Master không nên kiêm Development Team để tránh conflict of interest. Tuy nhiên với mô hình 1 người, đây là điều kiện bắt buộc. Biện pháp kiểm soát: Sprint Goal được viết thành văn bản và không thay đổi trong sprint; mọi scope change phải chờ Sprint kế tiếp.

### 2.2.5 Công cụ hỗ trợ quy trình Scrum

**Bảng 2.4 — Bộ công cụ Scrum của dự án MINI-FORUM**

| Công cụ | Loại | Mục đích trong dự án | Tích hợp với |
|---------|------|---------------------|-------------|
| **Trello** | Kanban Board | Quản lý Sprint Backlog: cột Backlog → In Progress → In Review → Done | — |
| **Git (GitHub)** | Version Control | Feature branch per story (`feature/auth-otp`, `feature/block-layout`); merge vào `main` sau review | Trello (card link) |
| **Markdown + `docs/`** | Tài liệu | Sprint Planning notes; ADR (Architecture Decision Records); API documentation | Git repository |
| **Vitest** | Test Framework | Unit test backend; `vitest run` là automated quality gate; coverage report | `package.json` scripts |
| **ESLint + TypeScript** | Static Analysis | Lint error = build fail; strict type checking = compile-time safety | Pre-commit hook |
| **Postman / REST Client** | API Testing | Test endpoint trước khi viết frontend; `.http` files lưu trong repo | — |
| **Docker Compose** | Environment | Đồng nhất môi trường dev/staging; `docker-compose up` cho full stack | Render.com staging |

### 2.2.6 Git Branching Strategy

Nhánh `main` chỉ được merge qua PR cuối Sprint Review. Công việc phát triển trên `feature/[sprint]-[mô-tả]` (một branch/User Story) → merge vào `develop` sau khi tests xanh và review pass → merge `develop` vào `main` tại Sprint Review. Hotfix branch chỉ tạo khi có bug critical trên production.

---

## 2.3 Definition of Done (DoD)

### 2.3.1 Definition of Done — Tổng quan

**DoD** là bộ tiêu chí kỹ thuật chung áp dụng cho **tất cả stories** — khác với Acceptance Criteria riêng của từng story. Story không đạt DoD không được tính vào velocity và không được demo. *Bài học thực tế Sprint 2:* Block Layout được mark Done không có unit test → Sprint 3 mất 1.5 ngày fix bug regression về `sort_order` (~15% capacity).

### 2.3.2 DoD cấp User Story — 6 tiêu chí bắt buộc

Mỗi User Story trong MINI-FORUM phải đáp ứng đầy đủ 6 tiêu chí sau đây trước khi được chuyển sang trạng thái "Done":

**Bảng 2.5 — Definition of Done — 6 tiêu chí bắt buộc cấp User Story**

| # | Tiêu chí | Mô tả chi tiết | Công cụ kiểm tra | Ví dụ áp dụng trong dự án |
|---|---------|---------------|-----------------|--------------------------|
| **1** | **Code implement đầy đủ** theo Acceptance Criteria | Tất cả acceptance criteria được viết trong Sprint Planning đều phải được implement; không bỏ sót edge case đã được define | Peer review checklist; self-review | `POST /api/auth/register`: xử lý email trùng (409), email thiếu (400), OTP gửi thành công (201) |
| **2** | **Unit test viết và pass** | Không được bỏ qua test với lý do "sẽ viết sau"; test phải cover happy path và ít nhất 2 error case; `vitest run` không có test fail | `npm run test` (vitest run) xanh | `backend/src/__tests__/auth.test.ts`: register, login, logout, refresh token, invalid OTP |
| **3** | **API test bằng Postman / REST Client** | Tất cả endpoint của story phải trả về đúng HTTP status code và response body theo spec; file `.http` lưu trong repository | Postman collection / `.http` file | Auth endpoints test: `200 OK` (login thành công), `401 Unauthorized` (token hết hạn), `429 Too Many Requests` (rate limit) |
| **4** | **Code review passed** | Self-review hoặc peer review theo checklist; không có: magic string, console.log còn sót, type `any` dư thừa, SQL injection vulnerability, missing authorization check | Code review checklist (4 mục) | `backend/src/validations/auth.validation.ts`: Zod schema validate tất cả input; không có raw SQL |
| **5** | **Merge vào branch chính thành công** | Feature branch được merge vào `develop` (và cuối sprint vào `main`) mà không có conflict; CI checks pass | `git log --oneline`; không có merge conflict | Mỗi feature branch sau code review được merge qua Pull Request; không force-push vào main |
| **6** | **Không có lint error và type error** | `eslint src/` và `tsc --noEmit` chạy sạch không có warning/error; TypeScript strict mode bắt toàn bộ type unsafety | `npm run lint`; `npm run typecheck` | `tsconfig.json`: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` |

### 2.3.3 DoD cấp Sprint — 4 tiêu chí bổ sung

Ngoài DoD cấp User Story, mỗi Sprint còn phải đạt 4 tiêu chí bổ sung ở cấp Sprint trước khi được kết thúc:

**Bảng 2.6 — Definition of Done — 4 tiêu chí cấp Sprint**

| # | Tiêu chí Sprint | Mô tả | Kiểm tra như thế nào |
|---|----------------|-------|---------------------|
| **S1** | **Sprint Goal đạt được** | Mục tiêu kỹ thuật của sprint (ví dụ: "Auth module hoàn chỉnh với JWT + OTP") phải được hoàn thành; không chấp nhận "80% xong" | Product Owner xác nhận trong Sprint Review |
| **S2** | **Demo hoạt động end-to-end** | Tất cả tính năng của sprint phải chạy được trực tiếp (live demo), không phải slide hay screenshot | Demo trực tiếp ứng dụng trong Sprint Review; không dùng mock data |
| **S3** | **Không có regression** | Các tính năng của sprint trước vẫn hoạt động đúng; không có bug mới trên feature đã done | Regression test nhanh (smoke test) trước Sprint Review |
| **S4** | **Tài liệu cập nhật** | `README.md`, migration files (nếu schema thay đổi), hoặc API documentation được cập nhật tương ứng | Review `git diff` trên documentation files |

### 2.3.4 DoD Checklist (self-review trước khi mark "Done" trên Trello)

Kiểm tra theo thứ tự: (1) Tất cả Acceptance Criteria được implement; (2) `vitest run` 0 failures; (3) API endpoints test xong, `.http` file cập nhật; (4) Code review pass — không có type `any` dư, `console.log` còn sót, thiếu authorization, input không qua Zod; (5) Branch merge vào develop không conflict; (6) `npm run lint` + `npm run typecheck` ra 0 errors. Tất cả 6 tiêu chí ✅ mới chuyển sang "Done".



---

*[Tiếp theo: Chương 3 — Lập kế hoạch dự án]*
