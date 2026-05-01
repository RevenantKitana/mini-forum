# CHƯƠNG 3: LẬP KẾ HOẠCH DỰ ÁN

---

## 3.1 Work Breakdown Structure (WBS)

### 3.1.1 Nguyên tắc xây dựng WBS

Work Breakdown Structure (WBS) của dự án MINI-FORUM được xây dựng theo nguyên tắc phân rã từ trên xuống (top-down decomposition) với ba cấp độ: **Thành phần hệ thống → Module → Task cụ thể**. Mục tiêu là đảm bảo mọi công việc đều có thể giao cho một người cụ thể, ước tính thời gian và kiểm tra hoàn thành.

### 3.1.2 Cấu trúc WBS đầy đủ

**Hình 3.1 — Work Breakdown Structure (WBS) của dự án MINI-FORUM**

```
MINI-FORUM (Tổng: ~13 tuần)
│
├── 1. QUẢN LÝ DỰ ÁN
│   ├── 1.1 Khởi tạo dự án
│   │   ├── 1.1.1 Phân tích yêu cầu nghiệp vụ
│   │   ├── 1.1.2 Xác định stakeholders
│   │   └── 1.1.3 Thiết lập môi trường làm việc
│   ├── 1.2 Sprint Planning & Backlog
│   │   ├── 1.2.1 Xây dựng Product Backlog ban đầu
│   │   ├── 1.2.2 Ưu tiên MoSCoW
│   │   └── 1.2.3 Estimate Story Points (Planning Poker)
│   └── 1.3 Kiểm soát & Báo cáo
│       ├── 1.3.1 Velocity tracking hàng sprint
│       ├── 1.3.2 Burndown chart
│       └── 1.3.3 Sprint Review & Retrospective
│
├── 2. NỀN TẢNG HỆ THỐNG
│   ├── 2.1 Thiết kế kiến trúc
│   │   ├── 2.1.1 Kiến trúc monorepo (4 service)
│   │   └── 2.1.2 Quyết định công nghệ (Node/React/Prisma)
│   ├── 2.2 Cấu hình Monorepo
│   │   ├── 2.2.1 Khởi tạo package.json từng service
│   │   ├── 2.2.2 Cấu hình TypeScript strict mode
│   │   └── 2.2.3 ESLint, Vitest, Vite config
│   └── 2.3 Database Schema (Prisma)
│       ├── 2.3.1 Thiết kế ERD v1 (5 entity cốt lõi)
│       ├── 2.3.2 Prisma migrate initial
│       ├── 2.3.3 Mở rộng schema (block layout, media)
│       └── 2.3.4 Seed data script
│
├── 3. BACKEND API
│   ├── 3.1 Xác thực & Phân quyền
│   │   ├── 3.1.1 authController (register/login/logout/refresh)
│   │   ├── 3.1.2 otpService + emailService (Brevo)
│   │   ├── 3.1.3 JWT access token + refresh token
│   │   └── 3.1.4 authMiddleware + roleMiddleware + securityMiddleware
│   ├── 3.2 Quản lý Người dùng
│   │   ├── 3.2.1 userController (profile CRUD)
│   │   ├── 3.2.2 Avatar upload (ImageKit)
│   │   └── 3.2.3 User block system
│   ├── 3.3 Forum Core
│   │   ├── 3.3.1 postController + postService
│   │   ├── 3.3.2 Block layout system (post_blocks)
│   │   ├── 3.3.3 commentController (nested + quote)
│   │   ├── 3.3.4 categoryController + tagController
│   │   └── 3.3.5 configController (forum settings)
│   ├── 3.4 Tính năng Tương tác
│   │   ├── 3.4.1 voteService (upvote/downvote + reputation)
│   │   ├── 3.4.2 bookmarkService
│   │   ├── 3.4.3 searchService (PostgreSQL full-text)
│   │   ├── 3.4.4 notificationService + sseService (SSE)
│   │   └── 3.4.5 blockReportController
│   ├── 3.5 Admin & Moderation
│   │   ├── 3.5.1 adminController (stats, user/post/comment management)
│   │   ├── 3.5.2 reportService (xử lý báo cáo vi phạm)
│   │   └── 3.5.3 auditLogService
│   └── 3.6 Media Management
│       ├── 3.6.1 imagekitService (upload/delete)
│       ├── 3.6.2 postMediaController (post images)
│       └── 3.6.3 metricsService + metricsMiddleware
│
├── 4. FRONTEND
│   ├── 4.1 Layout & Cơ sở
│   │   ├── 4.1.1 App Router, Auth context
│   │   ├── 4.1.2 Layout components (Navbar, Sidebar, Footer)
│   │   └── 4.1.3 API client (axios + React Query setup)
│   ├── 4.2 Trang Chính
│   │   ├── 4.2.1 HomePage (danh sách bài viết)
│   │   ├── 4.2.2 PostDetailPage (bài viết + bình luận)
│   │   ├── 4.2.3 CategoriesPage, TagsPage
│   │   └── 4.2.4 CreatePost / EditPostPage (block editor)
│   ├── 4.3 Trang Người dùng
│   │   ├── 4.3.1 ProfilePage, EditProfilePage
│   │   ├── 4.3.2 RegisterPage, LoginPage, ForgotPasswordPage
│   │   └── 4.3.3 BlockedUsersPage
│   └── 4.4 Tính năng Nâng cao
│       ├── 4.4.1 SearchPage (full-text search UI)
│       ├── 4.4.2 BookmarksPage
│       └── 4.4.3 NotificationsPage (SSE real-time)
│
├── 5. ADMIN PANEL (admin-client)
│   ├── 5.1 Dashboard & Thống kê
│   │   ├── 5.1.1 DashboardPage (KPI cards)
│   │   └── 5.1.2 OperationalDashboardPage (metrics real-time)
│   ├── 5.2 Quản lý Nội dung
│   │   ├── 5.2.1 UsersPage (CRUD, ban/unban)
│   │   ├── 5.2.2 PostsPage (duyệt, ẩn, ghim)
│   │   ├── 5.2.3 CommentsPage (kiểm duyệt bình luận)
│   │   ├── 5.2.4 CategoriesPage, TagsPage (quản lý)
│   │   └── 5.2.5 SettingsPage (cấu hình forum)
│   └── 5.3 Moderation Tools
│       ├── 5.3.1 ReportsPage (xem và xử lý báo cáo)
│       └── 5.3.2 AuditLogsPage (lịch sử hành động)
│
├── 6. VIBE-CONTENT (AI Bot)
│   ├── 6.1 Personality System
│   │   ├── 6.1.1 PersonalityService (tạo bot profiles)
│   │   └── 6.1.2 user_content_context model (lưu trạng thái)
│   ├── 6.2 Content Generation
│   │   ├── 6.2.1 ContentGeneratorService (multi-LLM)
│   │   ├── 6.2.2 LLM adapters: Gemini, Groq, Cerebras, Nvidia
│   │   ├── 6.2.3 PromptBuilderService (context-aware prompts)
│   │   ├── 6.2.4 ValidationService (kiểm tra chất lượng nội dung)
│   │   └── 6.2.5 ActionSelectorService (chọn hành động phù hợp)
│   └── 6.3 Scheduler & Automation
│       ├── 6.3.1 Scheduler (cron jobs mỗi giờ)
│       ├── 6.3.2 ContextGathererService (thu thập context diễn đàn)
│       └── 6.3.3 APIExecutorService (gọi backend API)
│
└── 7. TRIỂN KHAI
    ├── 7.1 Docker
    │   ├── 7.1.1 Dockerfile multi-stage (backend, vibe-content)
    │   └── 7.1.2 docker-entrypoint.sh (migrate + seed + start)
    ├── 7.2 Deployment Configuration
    │   ├── 7.2.1 render.json (backend, vibe-content → Render.com)
    │   └── 7.2.2 vercel.json (frontend, admin-client → Vercel)
    └── 7.3 Maintenance Scripts
        ├── 7.3.1 backupDb.ts, wipeAllDb.ts, clearData.ts
        ├── 7.3.2 cleanupImagekit.ts (dọn media orphan)
        └── 7.3.3 migrateAvatarUrls.ts, migratePostsToBlocks.ts
```

---

## 3.2 Product Backlog và ưu tiên MoSCoW

### 3.2.1 Phương pháp ưu tiên

Toàn bộ User Stories được ưu tiên theo phương pháp **MoSCoW** (Must have / Should have / Could have / Won't have), kết hợp với **Story Points** ước tính bằng kỹ thuật Planning Poker theo dãy Fibonacci: 1, 2, 3, 5, 8, 13, 21.

### 3.2.2 Product Backlog đầy đủ

**Bảng 3.1 — Product Backlog dự án MINI-FORUM (11 User Stories)**

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria tóm tắt) | Priority | SP | Sprint |
|----|-----------|--------------------------------------------------|----------|----|--------|
| **US-01** | Là thành viên, tôi muốn đăng ký tài khoản mới với xác thực OTP qua email để đảm bảo tài khoản hợp lệ | Nhập email/username/password → nhận OTP → xác thực → tài khoản kích hoạt; OTP hết hạn sau 10 phút | **Must Have** | 8 | S1 |
| **US-02** | Là thành viên, tôi muốn đăng nhập và duy trì phiên làm việc để không cần đăng nhập lại mỗi lần | Đăng nhập với email+password → nhận JWT access token (15 phút) + refresh token (7 ngày); Refresh token endpoint hoạt động | **Must Have** | 5 | S1 |
| **US-03** | Là thành viên, tôi muốn tạo bài viết với nội dung đa dạng (văn bản, ảnh, code, trích dẫn) | Block layout: thêm/sắp xếp/xóa block TEXT/IMAGE/CODE/QUOTE; Upload ảnh qua ImageKit; Preview trước khi đăng | **Must Have** | 13 | S2 |
| **US-04** | Là thành viên, tôi muốn bình luận bài viết và reply bình luận của người khác | Bình luận cấp 1; Reply lồng nhau; Trích dẫn bình luận; Edit và xóa comment của mình | **Must Have** | 8 | S2 |
| **US-05** | Là thành viên, tôi muốn vote upvote/downvote để đánh giá chất lượng nội dung | Vote post và comment; Thay đổi vote; Cập nhật reputation người tác giả; Hiển thị điểm net vote | **Should Have** | 5 | S3 |
| **US-06** | Là thành viên, tôi muốn tìm kiếm bài viết theo từ khóa để tìm nội dung liên quan | Full-text search tiêu đề + nội dung; Kết quả sắp xếp theo relevance; Latency < 200ms | **Should Have** | 8 | S3 |
| **US-07** | Là thành viên, tôi muốn nhận thông báo real-time khi có người reply hoặc vote bài của tôi | SSE connection; Thông báo tức thì khi có reply/vote/mention; Đánh dấu đã đọc; Xóa thông báo | **Should Have** | 13 | S3 |
| **US-08** | Là admin, tôi muốn xem dashboard thống kê để theo dõi hoạt động forum | KPI cards: tổng users/posts/comments; Biểu đồ hoạt động; Top posts; Users mới nhất | **Must Have** | 8 | S4 |
| **US-09** | Là moderator, tôi muốn xem và xử lý báo cáo vi phạm hiệu quả | Danh sách báo cáo theo status (PENDING/RESOLVED/DISMISSED); Xem nội dung bị báo cáo; Hành động: ẩn/xóa/cảnh báo | **Must Have** | 8 | S4 |
| **US-10** | Là admin, tôi muốn xem audit log để biết ai đã làm gì trong hệ thống | Ghi nhận: user, action, target, timestamp, IP; Lọc theo user/action/date; Export | **Must Have** | 5 | S4 |
| **US-11** | Là hệ thống, tôi muốn bot AI tự động sinh nội dung diễn đàn để tạo seed data | Bot đăng bài/bình luận/vote theo lịch; Nhiều personality; Multi-LLM fallback; Không lặp nội dung | **Nice to Have** | 21 | S5 |

**Tổng Story Points:** 102 SP | **Average per Sprint:** ~17 SP (production) + overhead tasks

### 3.2.3 Phân bổ User Story theo Sprint

```
Sprint 0 (Setup)   : [Cơ sở hạ tầng — không đo bằng SP]
Sprint 1 (Auth)    : US-01 (8SP) + US-02 (5SP) = 13 SP core + overhead
Sprint 2 (Core)    : US-03 (13SP) + US-04 (8SP) = 21 SP core
Sprint 3 (Advanced): US-05 (5SP) + US-06 (8SP) + US-07 (13SP) = 26 SP core
Sprint 4 (Admin)   : US-08 (8SP) + US-09 (8SP) + US-10 (5SP) = 21 SP core
Sprint 5 (AI+Test) : US-11 (21SP) = 21 SP core
```

---

## 3.3 Gantt Chart — Lịch trình dự án

### 3.3.1 Tổng quan timeline 13 tuần

**Hình 3.2 — Gantt Chart: Lịch trình 13 tuần dự án MINI-FORUM**

```
Tuần:  W1   W2   W3   W4   W5   W6   W7   W8   W9   W10  W11  W12  W13
Ngày: 27/1  3/2  10/2 17/2 24/2 3/3  10/3 17/3 24/3 31/3 7/4  14/4 21/4
       ├────┤    ├────┤    ├────┤    ├────┤    ├────┤    ├────┤    ├────┤
       │         │         │         │         │         │         │
Sprint:├──S0────┤├──────S1──────────┤├──────S2──────────┤
                 │                   │
       W3   W4   W5   W6   W7   W8   W9   W10  W11  W12  W13
                              ├──────S3──────────┤├─────S4──────────┤
                                                          ├──────S5──────┤
                                                                    ├BUF┤

=== TRACK THEO MODULE ===

Platform Setup  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
(W1-W2)

Auth & Users    ░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
(W3-W4)

Forum Core      ░░░░░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
(W5-W6)

Vote/Search/SSE ░░░░░░░░░░░░░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░
(W7-W8)

Admin Panel     ░░░░░░░░░░░░░░░░░░░░░░░░████████████░░░░░░░░░░░░░░░░
(W9-W10)

AI Bot          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████░░░░
(W11-W12)

Testing         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████
(W11-W13)

Deployment      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████
(W12-W13)

Milestones:     M0   M1              M2        M3        M4        M5
                ▲    ▲               ▲         ▲         ▲         ▲
```

| Milestone | Thời điểm | Nội dung |
|-----------|----------|---------|
| **M0** | Tuần 2 (07/02) | Monorepo chạy được, Prisma schema v1 migrate thành công |
| **M1** | Tuần 4 (21/02) | Auth flow end-to-end: Register → OTP → Login → Refresh token |
| **M2** | Tuần 6 (07/03) | Forum cơ bản: đăng bài (block layout) + bình luận lồng nhau |
| **M3** | Tuần 8 (21/03) | Vote, Search, SSE notification hoạt động; latency < 200ms |
| **M4** | Tuần 10 (04/04) | Admin panel RBAC pass; Audit log ghi đúng mọi action |
| **M5** | Tuần 12 (18/04) | AI bot sinh bài tự động; test coverage > 60%; Docker build sạch |

---

## 3.4 Sprint Planning chi tiết (6 Sprint)

### Sprint 0 (27/01 – 07/02/2026) — Khởi tạo và Nền tảng

**Sprint Goal:** *"Có nền tảng kỹ thuật vững chắc để bắt đầu develop feature từ Sprint 1."*

**Bảng 3.2 — Sprint 0: Task Breakdown**

| Task | Mô tả | Assignee | Ước tính | Thực tế |
|------|-------|----------|---------|---------|
| T0-01 | Phân tích yêu cầu nghiệp vụ — viết user stories, xác định stakeholders | Lead | 2 ngày | 2 ngày |
| T0-02 | Thiết kế kiến trúc hệ thống — quyết định 4 service monorepo | Lead | 1 ngày | 1 ngày |
| T0-03 | Thiết kế ERD v1 — 5 entity cốt lõi: users, posts, comments, categories, tags | Lead | 2 ngày | 2 ngày |
| T0-04 | Khởi tạo monorepo — package.json, TypeScript, ESLint, Vitest config cho 4 service | Dev | 1 ngày | 1 ngày |
| T0-05 | Setup PostgreSQL + Prisma — cài đặt, kết nối, `prisma migrate dev --name init` | Dev | 1 ngày | 1 ngày |
| T0-06 | Cấu hình Express `app.ts` — middleware chain, error handler, routing skeleton | Dev | 1 ngày | 1 ngày |
| T0-07 | Sprint Review S0 + Planning S1 | All | 0.5 ngày | 0.5 ngày |

**Milestone M0 đạt được:** Monorepo chạy, `backend/` serve `/api/health` thành công, Prisma migrate 5 bảng đầu.

---

### Sprint 1 (08/02 – 21/02/2026) — Auth & Users

**Sprint Goal:** *"Người dùng có thể đăng ký xác thực OTP, đăng nhập và quản lý hồ sơ cá nhân."*

**Bảng 3.3 — Sprint 1: Task Breakdown**

| Task | Mô tả | Ước tính | Thực tế | Ghi chú |
|------|-------|---------|---------|---------|
| T1-01 | `authController.ts` — register, login, logout, refreshToken | 2 ngày | 2 ngày | |
| T1-02 | `otpService.ts` — tạo OTP 6 chữ số, TTL 10 phút, lưu DB | 1 ngày | 1 ngày | |
| T1-03 | `emailService.ts` + `brevoApiService.ts` — gửi email OTP qua Brevo SMTP API | 0.5 ngày | 1 ngày | **Blocker R04** |
| T1-04 | JWT token strategy — access token 15 phút, refresh token 7 ngày, rotation | 1 ngày | 1 ngày | |
| T1-05 | `authMiddleware.ts`, `roleMiddleware.ts` — bảo vệ routes, RBAC | 1 ngày | 1 ngày | |
| T1-06 | `securityMiddleware.ts` — Helmet, CORS, rate limiting (100 req/15 phút) | 0.5 ngày | 0.5 ngày | |
| T1-07 | `userController.ts` + `userService.ts` — GET/PUT profile, avatar upload | 2 ngày | 2 ngày | |
| T1-08 | Vitest — auth unit tests, mock emailService | 1 ngày | 1 ngày | |
| T1-09 | Frontend: RegisterPage, LoginPage, AuthContext | 1.5 ngày | 1.5 ngày | |

> **Blocker R04 — Brevo API rate limit:** Brevo sandbox environment giới hạn 100 email/ngày, không đủ cho development + testing đồng thời. **Giải pháp:** Tạo mock `emailService` trong test environment (`NODE_ENV=test` → console.log OTP thay vì gửi email thật), production vẫn dùng Brevo SMTP. Delay: +0.5 ngày.

**Milestone M1 đạt được:** Postman test auth flow: Register (201) → Verify OTP (200) → Login (200, JWT) → Refresh (200, new token) → Logout (200) — tất cả pass.

---

### Sprint 2 (22/02 – 07/03/2026) — Forum Core

**Sprint Goal:** *"Người dùng có thể đăng bài viết với block layout phong phú và bình luận lồng nhau."*

**Bảng 3.4 — Sprint 2: Task Breakdown**

| Task | Mô tả | Ước tính | Thực tế | Ghi chú |
|------|-------|---------|---------|---------|
| T2-01 | `postController.ts` + `postService.ts` — CRUD post, slug, pagination, soft delete | 2 ngày | 2.5 ngày | |
| T2-02 | Prisma migration — thêm `post_blocks`, `post_media` tables | 0.5 ngày | 0.5 ngày | **Phát sinh scope** |
| T2-03 | Block layout system — `blockService.ts`, `blockValidationService.ts` — xử lý TEXT/IMAGE/CODE/QUOTE blocks với sort_order | 1.5 ngày | 2 ngày | Thêm vào giữa sprint |
| T2-04 | `commentController.ts` + `commentService.ts` — nested comment (parent_id), quote (quoted_comment_id) | 2 ngày | 2 ngày | |
| T2-05 | `categoryController.ts` + `tagController.ts` — CRUD với permission level | 1 ngày | 1 ngày | |
| T2-06 | Frontend: HomePage (post list + pagination), PostDetailPage (blocks + comments) | 2 ngày | 2 ngày | |
| T2-07 | Frontend: CreatePostPage với block editor | 1.5 ngày | 2 ngày | Block editor phức tạp hơn dự kiến |

> **Phát sinh scope (Scope Creep):** Sau demo Sprint 1, Product Owner yêu cầu editor bài viết hỗ trợ nhiều loại block thay vì textarea đơn giản. Story block layout được thêm vào Sprint 2 với estimate 1.5 ngày nhưng thực tế cần 2 ngày do phải thiết kế lại Prisma schema. **Biện pháp:** Dời task T3-01 (search) từ Sprint 3 xuống cuối Sprint 3, adjust velocity target Sprint 3.

**Milestone M2 đạt được:** Demo forum: tạo post với CODE block → render syntax highlighted; bình luận lồng 2 cấp; category filtering hoạt động.

---

### Sprint 3 (08/03 – 21/03/2026) — Tính năng Nâng cao

**Sprint Goal:** *"Forum có hệ thống vote, tìm kiếm full-text và thông báo real-time qua SSE."*

**Bảng 3.5 — Sprint 3: Task Breakdown**

| Task | Mô tả | Ước tính | Thực tế | Ghi chú |
|------|-------|---------|---------|---------|
| T3-01 | `voteService.ts` — upvote/downvote post và comment; cập nhật `reputation` user | 1.5 ngày | 1.5 ngày | |
| T3-02 | `bookmarkService.ts` — thêm/xóa bookmark, danh sách bookmark của user | 0.5 ngày | 0.5 ngày | |
| T3-03 | `searchService.ts` — PostgreSQL `to_tsvector` + `plainsearch`, GIN index | 1.5 ngày | 2 ngày | |
| T3-04 | `sseService.ts` — quản lý SSE connections in-memory (EventEmitter) | 1 ngày | 1.5 ngày | R03 discovered |
| T3-05 | `notificationService.ts` — tạo, đọc, xóa notification; trigger sau vote/reply | 1.5 ngày | 1.5 ngày | |
| T3-06 | `blockReportController.ts` + `reportService.ts` — CRUD report, status workflow | 1 ngày | 1 ngày | |
| T3-07 | Frontend: SearchPage (debounced input), BookmarksPage, NotificationsPage (SSE listener) | 2 ngày | 2 ngày | |
| T3-08 | `blockService.ts` — user block/unblock, BlockedUsersPage | 0.5 ngày | 0.5 ngày | |

> **Risk R03 discovered:** Khi test SSE với 20+ connections đồng thời, memory usage tăng tuyến tính. `sseService.ts` dùng Map in-memory nên không scale horizontal. **Quyết định:** Giữ nguyên cho prototype, ghi nhận trong `DEPLOYMENT.md` với upgrade path sang WebSocket + Redis pub/sub cho production.

**Milestone M3 đạt được:** Search latency P95 < 150ms (đo bằng Postman); SSE notification delivered trong vòng < 1 giây; Vote + reputation update atomic.

---

### Sprint 4 (22/03 – 04/04/2026) — Admin Panel & Media

**Sprint Goal:** *"Admin panel đầy đủ chức năng quản trị RBAC, audit log ghi nhận mọi hành động."*

**Bảng 3.6 — Sprint 4: Task Breakdown**

| Task | Mô tả | Ước tính | Thực tế | Ghi chú |
|------|-------|---------|---------|---------|
| T4-01 | `adminController.ts` — stats endpoint, user management (ban/unban/role change), post management (hide/pin/lock), comment management | 2 ngày | 2 ngày | |
| T4-02 | `auditLogService.ts` — middleware tự động ghi log sau mỗi admin action; enum AuditAction, AuditTarget | 1 ngày | 1 ngày | |
| T4-03 | `imagekitService.ts` — upload/delete/cleanup với ImageKit SDK; signed URL | 1.5 ngày | 1.5 ngày | |
| T4-04 | `postMediaController.ts` + `postMediaService.ts` — upload/reorder/delete media cho post | 1 ngày | 1 ngày | |
| T4-05 | `metricsService.ts` + `metricsMiddleware.ts` — thu thập response time, request count theo endpoint | 1 ngày | 1 ngày | |
| T4-06 | Admin-client: DashboardPage (KPI) + OperationalDashboardPage (real-time metrics) | 1 ngày | 1 ngày | |
| T4-07 | Admin-client: UsersPage, PostsPage, CommentsPage (full CRUD + filters) | 2 ngày | 2 ngày | |
| T4-08 | Admin-client: ReportsPage (workflow PENDING→RESOLVED) + AuditLogsPage (filter + pagination) | 1 ngày | 1 ngày | |
| T4-09 | Admin-client: CategoriesPage, TagsPage, SettingsPage | 0.5 ngày | 0.5 ngày | |

**Milestone M4 đạt được:** Admin ban user → audit log ghi `SUSPEND_USER` với IP address + old/new value; Report workflow PENDING → RESOLVED → UI cập nhật tức thì.

---

### Sprint 5 (05/04 – 18/04/2026) — AI Bot + Testing + Deploy

**Sprint Goal:** *"Bot AI sinh nội dung tự động mỗi giờ; test coverage > 60%; Docker image production-ready."*

**Bảng 3.7 — Sprint 5: Task Breakdown**

| Task | Mô tả | Ước tính | Thực tế | Ghi chú |
|------|-------|---------|---------|---------|
| T5-01 | `PersonalityService.ts` — tạo và quản lý bot profiles với JSON personality | 1.5 ngày | 1.5 ngày | |
| T5-02 | LLM adapters — Gemini, Groq, Cerebras, Nvidia API clients với retry logic | 1 ngày | 1 ngày | R02 mitigation |
| T5-03 | `ContentGeneratorService.ts` — orchestrate multi-LLM với fallback chain | 1.5 ngày | 1.5 ngày | |
| T5-04 | `PromptBuilderService.ts` — xây dựng context-aware prompt từ forum data | 1 ngày | 1 ngày | |
| T5-05 | `ActionSelectorService.ts` — chọn hành động (post/comment/vote) theo context | 0.5 ngày | 0.5 ngày | |
| T5-06 | `ContextGathererService.ts` + `APIExecutorService.ts` — thu thập data, gọi API | 1 ngày | 1 ngày | |
| T5-07 | Scheduler — cron jobs mỗi giờ, rate limiting để không spam | 0.5 ngày | 0.5 ngày | |
| T5-08 | Vitest test suite — backend: auth, upload middleware; frontend: components | 2 ngày | 2 ngày | |
| T5-09 | Docker multi-stage Dockerfile — build stage + production stage; `docker-entrypoint.sh` | 1.5 ngày | 1.5 ngày | |
| T5-10 | Deployment config — `render.json` (backend/vibe-content), `vercel.json` (frontend/admin) | 0.5 ngày | 0.5 ngày | |
| T5-11 | Documentation hoàn thiện — README, DEPLOYMENT.md, DB_SETUP.md | 0.5 ngày | 0.5 ngày | |

> **Multi-LLM fallback (R02 mitigation):** `ContentGeneratorService` implement vòng lặp providers: Gemini → Groq → Cerebras → Nvidia. Nếu provider đầu tiên trả lỗi (rate limit, network timeout), tự động thử provider tiếp theo. Log provider được dùng vào `llmMetrics.ts` để theo dõi hiệu suất từng provider.

**Milestone M5 đạt được:** Bot tạo 3 bài viết và 5 bình luận trong test run; Vitest 15 tests pass; `docker build` hoàn thành dưới 5 phút với multi-stage (final image ~200MB).

---

*[Tiếp theo: Chương 4 — Quản lý rủi ro]*
