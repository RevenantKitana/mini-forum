# CHƯƠNG 3: LẬP KẾ HOẠCH DỰ ÁN

---

## Giới thiệu chương

Lập kế hoạch là giai đoạn then chốt quyết định sự thành bại của dự án phần mềm. Chương này trình bày toàn bộ quy trình lập kế hoạch dự án MINI-FORUM theo ba trụ cột chính: **phân rã công việc (WBS)**, **quản lý Product Backlog với ưu tiên MoSCoW**, và **lịch trình triển khai theo Sprint**. Mỗi phần được trình bày kèm bảng biểu và sơ đồ minh họa nhằm đảm bảo tính minh bạch và khả năng theo dõi của dự án.

---

## 3.1 Work Breakdown Structure (WBS)

### 3.1.1 Nguyên tắc xây dựng WBS

Work Breakdown Structure (WBS) của dự án MINI-FORUM được xây dựng theo nguyên tắc **phân rã từ trên xuống (top-down decomposition)** với ba cấp độ: *Thành phần hệ thống → Module → Task cụ thể*. Mục tiêu là đảm bảo mọi công việc đều có thể giao cho một người cụ thể, ước tính thời gian và kiểm tra hoàn thành.

Các nguyên tắc chỉ đạo khi xây dựng WBS bao gồm:
- **Nguyên tắc 100%:** Tổng công việc các node con phải bao phủ toàn bộ công việc của node cha, không thừa, không thiếu.
- **Nguyên tắc phân rã đến mức có thể hành động:** Mỗi work package ở cấp cuối cùng phải đủ nhỏ để ước tính thời gian với độ sai lệch ≤ 20%.
- **Nguyên tắc đặt tên bằng danh từ:** Các node trong WBS là sản phẩm/kết quả (deliverable), không phải hành động.
- **Nguyên tắc độc lập:** Các work package không có sự phụ thuộc lẫn nhau trong cùng một level để tránh ảnh hưởng domino.

### 3.1.2 Cấu trúc WBS đầy đủ

**Hình 3.1 — Work Breakdown Structure (WBS) của dự án MINI-FORUM**

> *Mô tả hình:* Sơ đồ cây phân cấp công việc được tổ chức thành 7 nhánh chính. Cấp 1 (màu xanh đậm) là các thành phần hệ thống lớn. Cấp 2 (màu xanh nhạt) là các module chức năng. Cấp 3 (màu trắng) là các task cụ thể có thể ước tính và giao cho cá nhân. Đường nét đứt chỉ thị các task bổ sung phát sinh trong quá trình thực hiện.

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

### 3.1.3 WBS Dictionary — Từ điển công việc

WBS Dictionary là tài liệu bổ sung cho sơ đồ WBS, cung cấp mô tả chi tiết về phạm vi, tiêu chí hoàn thành và ước tính công sức cho từng work package cấp cao nhất. Đây là tài liệu kiểm soát phạm vi quan trọng nhất trong dự án, giúp ngăn ngừa hiểu lầm và scope creep.

**Bảng 3.1b — WBS Dictionary: 7 thành phần chính**

| WBS ID | Tên thành phần | Mô tả phạm vi | Deliverable chính | Ước tính (ngày) | % Effort |
|--------|---------------|--------------|------------------|-----------------|---------|
| **1.0** | Quản lý dự án | Toàn bộ hoạt động lập kế hoạch, theo dõi, kiểm soát và báo cáo tiến độ trong 13 tuần | WBS, Product Backlog, Sprint Plans, Velocity Reports, Retrospective Notes | 8 ngày | 6% |
| **2.0** | Nền tảng hệ thống | Thiết kế kiến trúc, cấu hình môi trường phát triển, thiết kế và triển khai database schema với Prisma ORM | ERD v1, Prisma schema, migration files, monorepo config | 8 ngày | 6% |
| **3.0** | Backend API | Toàn bộ REST API Express.js: authentication, user management, forum core, interactive features, admin tools, media management | 30+ API endpoints, middleware stack, service layer, validation schemas | 42 ngày | 31% |
| **4.0** | Frontend | Ứng dụng React SPA cho end-users: routing, layout, all pages, API integration với React Query | 15+ trang React, AuthContext, API client, responsive UI | 22 ngày | 16% |
| **5.0** | Admin Panel | Ứng dụng React riêng biệt cho admin/moderator: dashboard, CRUD management, reports, audit logs | 10+ trang admin, RBAC integration, real-time metrics | 12 ngày | 9% |
| **6.0** | Vibe-Content (AI Bot) | Service Node.js độc lập tự động sinh nội dung diễn đàn dùng multi-LLM với nhiều bot personality | PersonalityService, ContentGenerator, multi-LLM adapters, Scheduler | 18 ngày | 13% |
| **7.0** | Triển khai | Docker containerization, CI/CD configuration cho Render.com và Vercel, maintenance scripts | Dockerfiles, render.json, vercel.json, deployment docs | 8 ngày | 6% |
| — | Testing (cross-cutting) | Unit tests, integration tests cho toàn bộ hệ thống — phân bổ trong các sprint | 15 test files, ~120 test cases, coverage report | 18 ngày | 13% |

**Ghi chú tổng hợp:** Tổng ước tính = **136 ngày-người** (1 developer full-time × 13 tuần × 5 ngày/tuần = 65 ngày thực tế, với parallel tasks và overhead). Các task Backend API chiếm tỷ trọng lớn nhất (31%) phản ánh độ phức tạp của business logic.

### 3.1.4 Phân tích phụ thuộc công việc

Việc xác định phụ thuộc giữa các thành phần WBS rất quan trọng để lập lịch trình hợp lý, tránh blocking và giảm thiểu thời gian chờ đợi.

**Bảng 3.1c — Ma trận phụ thuộc (Dependency Matrix)**

| Thành phần | Phụ thuộc vào | Loại phụ thuộc | Mô tả |
|-----------|--------------|---------------|-------|
| Backend API (3.0) | Nền tảng (2.0) | Finish-to-Start (FS) | Phải có schema và DB connection trước khi implement API |
| Frontend (4.0) | Backend API (3.0) | Start-to-Start (SS) + Lag 1 sprint | Frontend có thể bắt đầu từ Sprint 2 khi Auth API đã sẵn sàng |
| Admin Panel (5.0) | Backend API (3.0) | Finish-to-Start (FS) + Lag 2 sprint | Cần admin endpoints từ Sprint 4 |
| Vibe-Content (6.0) | Backend API (3.0) | Finish-to-Start (FS) + Lag 4 sprint | Cần toàn bộ public API trước khi bot có thể hoạt động |
| Triển khai (7.0) | Tất cả (3.0, 4.0, 5.0, 6.0) | Finish-to-Start (FS) | Docker image chỉ build sau khi code hoàn chỉnh |
| Testing (cross) | Từng module | Start-to-Start (SS) | Tests viết song song với implementation trong mỗi sprint |

## 3.2 Product Backlog và ưu tiên MoSCoW

### 3.2.1 Phương pháp ưu tiên

Toàn bộ User Stories được ưu tiên theo phương pháp **MoSCoW** (Must have / Should have / Could have / Won't have), kết hợp với **Story Points** ước tính bằng kỹ thuật Planning Poker theo dãy Fibonacci: 1, 2, 3, 5, 8, 13, 21.

**Phương pháp MoSCoW** phân loại yêu cầu thành bốn nhóm theo mức độ thiết yếu:
- **Must Have:** Tính năng bắt buộc — thiếu thì sản phẩm không đáp ứng mục tiêu cốt lõi. Chiếm khoảng 60% tổng scope.
- **Should Have:** Tính năng quan trọng — nên có nhưng có giải pháp tạm thay thế. Thêm vào nếu còn time/budget.
- **Could Have:** Tính năng mong muốn — chỉ implement khi tất cả Must/Should đã xong.
- **Won't Have (this time):** Nằm ngoài phạm vi kỳ thực tập, ghi nhận cho phiên bản tương lai.

**Story Points** theo dãy Fibonacci phản ánh tính phi tuyến tính của độ phức tạp phần mềm.

**Bảng 3.2a — Quy ước Story Points áp dụng trong dự án**

| Story Points | Độ phức tạp | Thời gian tương đương | Ví dụ điển hình |
|:---:|---|:---:|---|
| 1 | Trivial | < 2 giờ | Thêm field vào response, sửa validation message |
| 2 | Simple | ~nửa ngày | CRUD endpoint đơn giản, UI component tĩnh |
| 3 | Moderate | ~1 ngày | Service mới 2–3 phương thức, page với API integration |
| 5 | Complex | ~2 ngày | Auth flow cơ bản, trang có state management phức tạp |
| 8 | Large | 3–4 ngày | Module hoàn chỉnh với nhiều business rules |
| 13 | Epic | 5–7 ngày | Block editor, SSE notification system |
| 21 | Very Large | > 1 tuần | AI bot toàn bộ — nên chia thành sub-stories |

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

### 3.2.3 Phân tích MoSCoW và phân bổ theo Sprint

**Bảng 3.2b — Phân tích MoSCoW: Phân bổ Story Points theo ưu tiên**

| Nhóm MoSCoW | Số User Stories | Story Points | % Tổng SP | Sprint thực hiện |
|-------------|:---:|:---:|:---:|---|
| **Must Have** | 7 | 55 SP | 53.9% | S1, S2, S4 |
| **Should Have** | 3 | 26 SP | 25.5% | S3 |
| **Could Have** | 0 | 0 SP | 0% | — |
| **Nice to Have** | 1 | 21 SP | 20.6% | S5 |
| **Tổng cộng** | **11** | **102 SP** | **100%** | S1–S5 |

> **Nhận xét:** 53.9% Story Points thuộc nhóm Must Have đảm bảo MVP (Minimum Viable Product) hoàn chỉnh với đầy đủ tính năng cốt lõi. Nhóm Should Have (25.5%) cung cấp trải nghiệm người dùng phong phú hơn. Nice to Have (AI bot, 20.6%) là điểm khác biệt nâng cao giá trị thực tập.

**Bảng 3.2c — Phân bổ User Story theo Sprint**

| Sprint | ID | User Stories | SP Core | SP Overhead | Tổng SP |
|--------|:---:|---|:---:|:---:|:---:|
| **S0** | — | Setup, kiến trúc, ERD, monorepo | — | 15 | 15 |
| **S1** | US-01, US-02 | Auth (Register+OTP, Login+JWT) | 13 | 17 | 30 |
| **S2** | US-03, US-04 | Forum Core (Block Post, Comments) | 21 | 14 | 35 |
| **S3** | US-05, US-06, US-07 | Vote/Search/SSE Notification | 26 | 9 | 35 |
| **S4** | US-08, US-09, US-10 | Admin Panel + Media | 21 | 11 | 32 |
| **S5** | US-11 | AI Bot + Testing + Deploy | 21 | 9 | 30 |
| **Buffer** | — | Bug fixes, documentation | — | 10 | 10 |
| **Tổng** | **11 US** | — | **102** | **85** | **187** |

> **Ghi chú overhead:** Bao gồm Sprint Planning, Daily Standup tổng hợp, Sprint Review, Retrospective, viết tests, code review và documentation. Overhead trung bình = **45.5%** tổng effort — phù hợp với Scrum one-person team kết hợp vai trò Dev + Scrum Master + Product Owner.

---

## 3.3 Gantt Chart — Lịch trình dự án

### 3.3.1 Tổng quan timeline 13 tuần

**Hình 3.2 — Gantt Chart: Lịch trình 13 tuần dự án MINI-FORUM**

> *Mô tả hình:* Biểu đồ Gantt hiển thị theo trục ngang là 13 tuần (W1–W13), trục dọc là các track công việc chính. Mỗi track được tô màu khác nhau: Sprint 0 (xám), Sprint 1 Auth (xanh lam), Sprint 2 Forum Core (xanh lá), Sprint 3 Advanced (vàng), Sprint 4 Admin (cam), Sprint 5 AI+Test (đỏ), Deploy (tím). Các mũi tên milestone đánh dấu thời điểm hoàn thành từng mốc quan trọng.

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

| Milestone | Thời điểm | Nội dung | Tiêu chí xác nhận |
|-----------|----------|---------|------------------|
| **M0** | Tuần 2 (07/02) | Monorepo chạy được, Prisma schema v1 migrate thành công | `GET /api/health` → 200; `prisma migrate status` → All migrations applied |
| **M1** | Tuần 4 (21/02) | Auth flow end-to-end: Register → OTP → Login → Refresh token | Postman collection 5 requests, tất cả 2xx; JWT decode hợp lệ |
| **M2** | Tuần 6 (07/03) | Forum cơ bản: đăng bài (block layout) + bình luận lồng nhau | Demo: tạo post CODE block → syntax highlight; comment lồng 2 cấp |
| **M3** | Tuần 8 (21/03) | Vote, Search, SSE notification hoạt động; latency < 200ms | Search P95 < 150ms; SSE delivery < 1 giây; Vote atomic |
| **M4** | Tuần 10 (04/04) | Admin panel RBAC pass; Audit log ghi đúng mọi action | Ban user → audit log ghi `SUSPEND_USER` kèm IP; Report workflow pass |
| **M5** | Tuần 12 (18/04) | AI bot sinh bài tự động; test coverage > 60%; Docker build sạch | Bot tạo 3 bài + 5 comment trong test run; Vitest 15 tests pass; Docker image < 300MB |

### 3.3.2 Phân tích lịch trình và điểm quan trọng

**Các yếu tố lịch trình đáng chú ý:**

1. **Sprint S0 và S1 chạy song song với nhau một phần:** Kiến trúc hệ thống (S0) được thiết kế trong khi một phần database schema đã được thiết lập. Điều này tạo fast feedback loop — thay đổi kiến trúc ngay khi thiết kế DB phát hiện vấn đề.

2. **Testing bắt đầu từ W11 nhưng test *từng module* được viết trong sprint tương ứng:** Vitest unit tests cho auth module được viết trong S1 (T1-08), không chờ đến giai đoạn testing riêng. W11–W13 tập trung vào integration tests và coverage improvement.

3. **Buffer Week (W13):** Một tuần dự phòng cố ý được dự trữ để xử lý các vấn đề phát sinh khi deploy production. Thực tế, buffer này được dùng để hoàn thiện documentation và fix các edge-case bugs phát hiện trong UAT.

4. **Critical Path:** Chuỗi công việc dài nhất không thể rút ngắn: `Database Schema → Auth API → Forum Core API → Frontend Integration → Testing → Deployment`. Bất kỳ delay nào trong chuỗi này đều delay toàn bộ dự án.

**Bảng 3.3a — Lịch trình sprint theo tuần**

| Tuần | Từ ngày | Đến ngày | Sprint | Sự kiện chính |
|:----:|:-------:|:-------:|:------:|---|
| W1 | 27/01 | 02/02 | S0 | Kick-off, phân tích yêu cầu, thiết kế ERD |
| W2 | 03/02 | 09/02 | S0 | Setup monorepo, Prisma migrate, app skeleton → **M0** |
| W3 | 10/02 | 16/02 | S1 | Auth controller, OTP service, JWT strategy |
| W4 | 17/02 | 23/02 | S1 | User profile, avatar upload, frontend auth → **M1** |
| W5 | 24/02 | 02/03 | S2 | Post CRUD, block layout system, comment service |
| W6 | 03/03 | 09/03 | S2 | Frontend post/comment pages, block editor → **M2** |
| W7 | 10/03 | 16/03 | S3 | Vote, bookmark, search service (GIN index) |
| W8 | 17/03 | 23/03 | S3 | SSE notification, report system, frontend → **M3** |
| W9 | 24/03 | 30/03 | S4 | Admin controller, audit log, ImageKit media |
| W10 | 31/03 | 06/04 | S4 | Admin-client pages, metrics dashboard → **M4** |
| W11 | 07/04 | 13/04 | S5 | AI bot (vibe-content), LLM adapters, scheduler |
| W12 | 14/04 | 20/04 | S5 | Testing, Docker build, deploy Render + Vercel → **M5** |
| W13 | 21/04 | 27/04 | Buffer | Bug fixes, final docs, presentation prep |

---

## 3.4 Sprint Planning chi tiết (6 Sprint)

### 3.4.1 Tổng quan cấu trúc Sprint

Mỗi Sprint trong dự án MINI-FORUM được tổ chức theo cấu trúc chuẩn Scrum với thích nghi phù hợp cho team nhỏ (1–2 người):

**Hình 3.3 — Vòng lặp Sprint trong dự án MINI-FORUM**

```
┌─────────────────────────────────────────────────────────────────┐
│                      SPRINT (2 TUẦN)                            │
│                                                                  │
│  ┌──────────┐    ┌──────────────────────────────┐    ┌───────┐  │
│  │ SPRINT   │    │       DEVELOPMENT LOOP        │    │SPRINT │  │
│  │ PLANNING │───▶│  Daily Standup (async note)   │───▶│REVIEW │  │
│  │ (~2 giờ) │    │  Coding → Test → Commit       │    │(~1 giờ│  │
│  └──────────┘    │  Self-review checklist        │    └───┬───┘  │
│       ▲          └──────────────────────────────┘        │      │
│       │                                                   ▼      │
│  ┌────┴──────────────────────────────────────────────────────┐   │
│  │              SPRINT RETROSPECTIVE (~1 giờ)                │   │
│  │  What went well? | What to improve? | Action items        │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Quy ước Sprint ceremonies áp dụng:**

| Ceremony | Thời lượng | Tần suất | Mục đích |
|----------|:---:|:---:|---|
| Sprint Planning | 2 giờ | Đầu mỗi sprint | Chọn backlog items, chia tasks, estimate |
| Daily Standup (async) | 10 phút | Mỗi ngày | Ghi note: hôm qua/hôm nay/blocker |
| Sprint Review | 1 giờ | Cuối sprint | Demo deliverable, cập nhật backlog |
| Sprint Retrospective | 1 giờ | Cuối sprint | Cải tiến process cho sprint sau |

---

### Sprint 0 (27/01 – 07/02/2026) — Khởi tạo và Nền tảng

**Sprint Goal:** *"Có nền tảng kỹ thuật vững chắc để bắt đầu develop feature từ Sprint 1."*

**Bảng 3.4 — Sprint 0: Task Breakdown**

| Task ID | Mô tả | Loại | Ước tính | Thực tế | Trạng thái |
|---------|-------|:----:|:--------:|:-------:|:----------:|
| T0-01 | Phân tích yêu cầu nghiệp vụ — viết user stories, xác định stakeholders | Analysis | 2 ngày | 2 ngày | ✅ Done |
| T0-02 | Thiết kế kiến trúc hệ thống — quyết định 4 service monorepo | Design | 1 ngày | 1 ngày | ✅ Done |
| T0-03 | Thiết kế ERD v1 — 5 entity cốt lõi: users, posts, comments, categories, tags | Design | 2 ngày | 2 ngày | ✅ Done |
| T0-04 | Khởi tạo monorepo — package.json, TypeScript, ESLint, Vitest config cho 4 service | Setup | 1 ngày | 1 ngày | ✅ Done |
| T0-05 | Setup PostgreSQL + Prisma — cài đặt, kết nối, `prisma migrate dev --name init` | Setup | 1 ngày | 1 ngày | ✅ Done |
| T0-06 | Cấu hình Express `app.ts` — middleware chain, error handler, routing skeleton | Dev | 1 ngày | 1 ngày | ✅ Done |
| T0-07 | Sprint Review S0 + Planning S1 | PM | 0.5 ngày | 0.5 ngày | ✅ Done |
| **Tổng** | | | **8.5 ngày** | **8.5 ngày** | **100%** |

**Milestone M0 đạt được (07/02/2026):**
- ✅ Monorepo chạy: `backend/`, `frontend/`, `admin-client/`, `vibe-content/` đều có `npm run dev` hoạt động
- ✅ `GET /api/health` trả về `{ status: "ok", timestamp: "..." }`
- ✅ `prisma migrate status` → "All migrations have been applied"
- ✅ 5 bảng đầu (`users`, `posts`, `comments`, `categories`, `tags`) tồn tại trong PostgreSQL

**Retrospective Sprint 0:**
- **Went well:** Thiết kế ERD v1 sớm giúp phát hiện các quan hệ phức tạp (nhiều-nhiều posts-tags) ngay từ đầu.
- **To improve:** Cần dành thêm 0.5 ngày cho TypeScript strict mode — nhiều lỗi type ban đầu khi bật `noImplicitAny`.
- **Action:** Thêm task "TypeScript type audit" vào đầu mỗi sprint tiếp theo.

---

### Sprint 1 (08/02 – 21/02/2026) — Auth & Users

**Sprint Goal:** *"Người dùng có thể đăng ký xác thực OTP, đăng nhập và quản lý hồ sơ cá nhân."*

**User Stories thực hiện:** US-01 (8 SP) + US-02 (5 SP) = 13 SP core

**Hình 3.4 — Luồng xác thực Sprint 1 (Auth Flow)**

```
┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌─────────────┐
│  Client │    │  Backend    │    │ Brevo    │    │  Database   │
│         │    │  (Express)  │    │  SMTP    │    │ (PostgreSQL)│
└────┬────┘    └──────┬──────┘    └────┬─────┘    └──────┬──────┘
     │                │                │                  │
     │ POST /auth/register             │                  │
     │───────────────▶│                │                  │
     │                │ Hash password  │                  │
     │                │ Create user    │                  │
     │                │────────────────────────────────▶ │
     │                │ Generate OTP   │                  │
     │                │ Store OTP (TTL 10min)             │
     │                │────────────────────────────────▶ │
     │                │ Send OTP email │                  │
     │                │───────────────▶│                  │
     │  201 Created   │                │                  │
     │◀───────────────│                │                  │
     │                │                │                  │
     │ POST /auth/verify-otp           │                  │
     │───────────────▶│                │                  │
     │                │ Validate OTP   │                  │
     │                │────────────────────────────────▶ │
     │                │ Activate user  │                  │
     │  200 OK        │                │                  │
     │◀───────────────│                │                  │
     │                │                │                  │
     │ POST /auth/login                │                  │
     │───────────────▶│                │                  │
     │                │ Check password │                  │
     │                │ Generate JWT (15min) + Refresh (7d)
     │ 200 + tokens   │                │                  │
     │◀───────────────│                │                  │
```

**Bảng 3.5 — Sprint 1: Task Breakdown**

| Task ID | Mô tả | Loại | Ước tính | Thực tế | Chênh lệch | Ghi chú |
|---------|-------|:----:|:--------:|:-------:|:----------:|---------|
| T1-01 | `authController.ts` — register, login, logout, refreshToken | Dev | 2 ngày | 2 ngày | 0 | |
| T1-02 | `otpService.ts` — tạo OTP 6 chữ số, TTL 10 phút, lưu DB | Dev | 1 ngày | 1 ngày | 0 | |
| T1-03 | `emailService.ts` + `brevoApiService.ts` — gửi email OTP qua Brevo SMTP API | Dev | 0.5 ngày | 1 ngày | +0.5 | **Blocker R04** |
| T1-04 | JWT token strategy — access token 15 phút, refresh token 7 ngày, rotation | Dev | 1 ngày | 1 ngày | 0 | |
| T1-05 | `authMiddleware.ts`, `roleMiddleware.ts` — bảo vệ routes, RBAC | Dev | 1 ngày | 1 ngày | 0 | |
| T1-06 | `securityMiddleware.ts` — Helmet, CORS, rate limiting (100 req/15 phút) | Dev | 0.5 ngày | 0.5 ngày | 0 | |
| T1-07 | `userController.ts` + `userService.ts` — GET/PUT profile, avatar upload | Dev | 2 ngày | 2 ngày | 0 | |
| T1-08 | Vitest — auth unit tests, mock emailService | Test | 1 ngày | 1 ngày | 0 | |
| T1-09 | Frontend: RegisterPage, LoginPage, AuthContext | Frontend | 1.5 ngày | 1.5 ngày | 0 | |
| **Tổng** | | | **10.5 ngày** | **11 ngày** | **+0.5** | |

> **Blocker R04 — Brevo API rate limit:** Brevo sandbox environment giới hạn 100 email/ngày, không đủ cho development + testing đồng thời. **Giải pháp:** Tạo mock `emailService` trong test environment (`NODE_ENV=test` → console.log OTP thay vì gửi email thật), production vẫn dùng Brevo SMTP. Delay: +0.5 ngày.

**Milestone M1 đạt được (21/02/2026):**
- ✅ `POST /auth/register` → 201 Created
- ✅ `POST /auth/verify-otp` → 200 OK, account activated
- ✅ `POST /auth/login` → 200 OK, trả về access token + refresh token
- ✅ `POST /auth/refresh` → 200 OK, new tokens với rotation
- ✅ `POST /auth/logout` → 200 OK, refresh token invalidated

**Retrospective Sprint 1:**
- **Went well:** JWT rotation pattern hoạt động đúng; TypeScript strict mode bắt được 3 potential null-reference bugs trước runtime.
- **To improve:** Estimate email service quá tự tin — external API integration cần buffer 50%.
- **Action:** Trong Sprint 2 trở đi, mọi task tích hợp external service đều cộng thêm 50% buffer.

---

### Sprint 2 (22/02 – 07/03/2026) — Forum Core

**Sprint Goal:** *"Người dùng có thể đăng bài viết với block layout phong phú và bình luận lồng nhau."*

**User Stories thực hiện:** US-03 (13 SP) + US-04 (8 SP) = 21 SP core

**Hình 3.5 — Kiến trúc Block Layout System (Sprint 2)**

```
POST (posts table)
├── id, title, slug, author_id, category_id
├── status: DRAFT | PUBLISHED | HIDDEN
└── created_at, updated_at

     ▼ 1:N relationship

POST_BLOCKS (post_blocks table)
├── id, post_id
├── block_type: TEXT | IMAGE | CODE | QUOTE
├── sort_order: 1, 2, 3, ...  (drag-and-drop)
├── content: TEXT  ──▶  { text: "Nội dung văn bản..." }
│   IMAGE ─▶  { url: "...", caption: "..." }
│   CODE  ─▶  { language: "typescript", code: "..." }
│   QUOTE ─▶  { source: "...", text: "..." }
└── created_at

Frontend Block Editor:
┌─────────────────────────────────────────────────┐
│  [+ Thêm Block]  [TEXT] [IMAGE] [CODE] [QUOTE]  │
├─────────────────────────────────────────────────┤
│  ≡  Block 1: TEXT    [✏ Edit] [🗑 Delete] [↕]   │
│     "Đây là đoạn văn bản..."                    │
├─────────────────────────────────────────────────┤
│  ≡  Block 2: CODE    [✏ Edit] [🗑 Delete] [↕]   │
│     Language: TypeScript                         │
│     const x: number = 42;                       │
├─────────────────────────────────────────────────┤
│  ≡  Block 3: IMAGE   [✏ Edit] [🗑 Delete] [↕]   │
│     [Hình ảnh đã upload lên ImageKit]           │
└─────────────────────────────────────────────────┘
```

**Bảng 3.6 — Sprint 2: Task Breakdown**

| Task ID | Mô tả | Loại | Ước tính | Thực tế | Chênh lệch | Ghi chú |
|---------|-------|:----:|:--------:|:-------:|:----------:|---------|
| T2-01 | `postController.ts` + `postService.ts` — CRUD post, slug, pagination, soft delete | Dev | 2 ngày | 2.5 ngày | +0.5 | |
| T2-02 | Prisma migration — thêm `post_blocks`, `post_media` tables | Dev | 0.5 ngày | 0.5 ngày | 0 | **Phát sinh scope** |
| T2-03 | Block layout system — `blockService.ts`, `blockValidationService.ts` — TEXT/IMAGE/CODE/QUOTE blocks | Dev | 1.5 ngày | 2 ngày | +0.5 | Thêm mid-sprint |
| T2-04 | `commentController.ts` + `commentService.ts` — nested comment, quote | Dev | 2 ngày | 2 ngày | 0 | |
| T2-05 | `categoryController.ts` + `tagController.ts` — CRUD với permission | Dev | 1 ngày | 1 ngày | 0 | |
| T2-06 | Frontend: HomePage (post list + pagination), PostDetailPage | Frontend | 2 ngày | 2 ngày | 0 | |
| T2-07 | Frontend: CreatePostPage với block editor | Frontend | 1.5 ngày | 2 ngày | +0.5 | Block editor phức tạp |
| **Tổng** | | | **10.5 ngày** | **12 ngày** | **+1.5** | |

> **Phát sinh scope (Scope Creep):** Sau demo Sprint 1, Product Owner yêu cầu editor bài viết hỗ trợ nhiều loại block thay vì textarea đơn giản. Story block layout được thêm vào Sprint 2 với estimate 1.5 ngày nhưng thực tế cần 2 ngày do phải thiết kế lại Prisma schema. **Biện pháp:** Dời một phần task search từ Sprint 3 xuống cuối Sprint 3, adjust velocity target Sprint 3.

**Milestone M2 đạt được (07/03/2026):**
- ✅ Tạo post với 4 loại block, drag-and-drop reorder
- ✅ Render CODE block với syntax highlighting
- ✅ Bình luận lồng nhau 2 cấp, quote bình luận
- ✅ Category filtering trên HomePage

**Retrospective Sprint 2:**
- **Went well:** Thiết kế `post_blocks` với `sort_order` rất linh hoạt, dễ extend sau này.
- **To improve:** Scope creep không được identify sớm — cần Sprint Planning kỹ hơn để chốt scope trước khi bắt đầu.
- **Action:** Freeze scope sau ngày thứ 2 của mỗi sprint. Yêu cầu mới → backlog sprint tiếp theo.

---

### Sprint 3 (08/03 – 21/03/2026) — Tính năng Nâng cao

**Sprint Goal:** *"Forum có hệ thống vote, tìm kiếm full-text và thông báo real-time qua SSE."*

**User Stories thực hiện:** US-05 (5 SP) + US-06 (8 SP) + US-07 (13 SP) = 26 SP core


**Bảng 3.7 — Sprint 3: Task Breakdown**

| Task ID | Mô tả | Loại | Ước tính | Thực tế | Chênh lệch | Ghi chú |
|---------|-------|:----:|:--------:|:-------:|:----------:|---------|
| T3-01 | `voteService.ts` — upvote/downvote post và comment; cập nhật `reputation` user | Dev | 1.5 ngày | 1.5 ngày | 0 | |
| T3-02 | `bookmarkService.ts` — thêm/xóa bookmark, danh sách bookmark của user | Dev | 0.5 ngày | 0.5 ngày | 0 | |
| T3-03 | `searchService.ts` — PostgreSQL `to_tsvector` + `plainsearch`, GIN index | Dev | 1.5 ngày | 2 ngày | +0.5 | GIN index setup phức tạp hơn |
| T3-04 | `sseService.ts` — quản lý SSE connections in-memory (EventEmitter) | Dev | 1 ngày | 1.5 ngày | +0.5 | **R03 discovered** |
| T3-05 | `notificationService.ts` — tạo, đọc, xóa notification; trigger sau vote/reply | Dev | 1.5 ngày | 1.5 ngày | 0 | |
| T3-06 | `blockReportController.ts` + `reportService.ts` — CRUD report, status workflow | Dev | 1 ngày | 1 ngày | 0 | |
| T3-07 | Frontend: SearchPage (debounced input), BookmarksPage, NotificationsPage (SSE listener) | Frontend | 2 ngày | 2 ngày | 0 | |
| T3-08 | `blockService.ts` — user block/unblock, BlockedUsersPage | Dev | 0.5 ngày | 0.5 ngày | 0 | |
| **Tổng** | | | **10 ngày** | **11 ngày** | **+1** | |

> **Risk R03 discovered (Day 4):** Khi test SSE với 20+ connections đồng thời, memory usage tăng tuyến tính. `sseService.ts` dùng `Map<userId, Response[]>` in-memory nên không scale horizontal. **Quyết định:** Accept + Document — giữ nguyên cho prototype, ghi nhận trong `DEPLOYMENT.md` với upgrade path sang WebSocket + Redis pub/sub cho production scale.

**Milestone M3 đạt được (21/03/2026):**
- ✅ Search P95 latency < 150ms (đo bằng Postman, 1000 requests)
- ✅ SSE notification delivered < 1 giây sau trigger event
- ✅ Vote + reputation update là atomic transaction (PostgreSQL)
- ✅ Report workflow: PENDING → RESOLVED/DISMISSED

**Retrospective Sprint 3:**
- **Went well:** PostgreSQL full-text search với GIN index rất nhanh, vượt mục tiêu 200ms.
- **To improve:** SSE không scale — cần ghi nhận rõ limitation trong docs ngay khi phát hiện.
- **Action:** Mọi known limitation phải được document trong DEPLOYMENT.md trong sprint đó, không để lại.

---

### Sprint 4 (22/03 – 04/04/2026) — Admin Panel & Media

**Sprint Goal:** *"Admin panel đầy đủ chức năng quản trị RBAC, audit log ghi nhận mọi hành động."*

**User Stories thực hiện:** US-08 (8 SP) + US-09 (8 SP) + US-10 (5 SP) = 21 SP core

**Hình 3.6 — Kiến trúc RBAC và Audit Log (Sprint 4)**

```
REQUEST                 MIDDLEWARE STACK              CONTROLLER
──────────────────────────────────────────────────────────────────

Admin request  ──▶  authMiddleware  ──▶  roleMiddleware  ──▶  adminController
               │    (verify JWT)        (check ADMIN/     │    (business logic)
               │                         MODERATOR role)  │
               │    ◀── 401 Unauthorized ──┘               │
               │                                           │
               │                                      auditMiddleware
               │                                      (log the action)
               │                                           │
               │                                           ▼
               │                                    audit_logs table
               │                                    ┌──────────────┐
               │                                    │ admin_id     │
               │                                    │ action_type  │
               │                                    │ target_type  │
               │                                    │ target_id    │
               │                                    │ old_value    │
               │                                    │ new_value    │
               │                                    │ ip_address   │
               └────────────────────────────────────│ created_at   │
                                                    └──────────────┘
```

**Bảng 3.8 — Sprint 4: Task Breakdown**

| Task ID | Mô tả | Loại | Ước tính | Thực tế | Chênh lệch | Ghi chú |
|---------|-------|:----:|:--------:|:-------:|:----------:|---------|
| T4-01 | `adminController.ts` — stats, user management (ban/unban/role), post management (hide/pin/lock) | Dev | 2 ngày | 2 ngày | 0 | |
| T4-02 | `auditLogService.ts` — middleware auto-log sau mỗi admin action; enum AuditAction | Dev | 1 ngày | 1 ngày | 0 | |
| T4-03 | `imagekitService.ts` — upload/delete/cleanup với ImageKit SDK; signed URL | Dev | 1.5 ngày | 1.5 ngày | 0 | |
| T4-04 | `postMediaController.ts` + `postMediaService.ts` — upload/reorder/delete media | Dev | 1 ngày | 1 ngày | 0 | |
| T4-05 | `metricsService.ts` + `metricsMiddleware.ts` — response time, request count/endpoint | Dev | 1 ngày | 1 ngày | 0 | |
| T4-06 | Admin-client: DashboardPage (KPI cards) + OperationalDashboardPage (real-time) | Frontend | 1 ngày | 1 ngày | 0 | |
| T4-07 | Admin-client: UsersPage, PostsPage, CommentsPage (full CRUD + filters) | Frontend | 2 ngày | 2 ngày | 0 | |
| T4-08 | Admin-client: ReportsPage (PENDING→RESOLVED workflow) + AuditLogsPage | Frontend | 1 ngày | 1 ngày | 0 | |
| T4-09 | Admin-client: CategoriesPage, TagsPage, SettingsPage | Frontend | 0.5 ngày | 0.5 ngày | 0 | |
| **Tổng** | | | **11 ngày** | **11 ngày** | **0** | Sprint chính xác nhất |

**Milestone M4 đạt được (04/04/2026):**
- ✅ Ban user → audit log ghi `SUSPEND_USER` kèm IP address, old/new status
- ✅ Report workflow PENDING → RESOLVED → admin-client UI cập nhật tức thì
- ✅ Admin panel accessible cho ADMIN và MODERATOR role; blocked với USER role
- ✅ Metrics endpoint `/api/admin/metrics` trả về response time percentiles

**Retrospective Sprint 4:**
- **Went well:** Sprint 4 là sprint chính xác nhất — không có chênh lệch estimate. Bài học từ S1, S2 đã được áp dụng hiệu quả.
- **To improve:** Admin-client và backend cần deploy cùng lúc — manual coordination dễ lỗi.
- **Action:** Tạo deployment checklist trong Sprint 5.

---

### Sprint 5 (05/04 – 18/04/2026) — AI Bot + Testing + Deploy

**Sprint Goal:** *"Bot AI sinh nội dung tự động mỗi giờ; test coverage > 60%; Docker image production-ready."*

**User Stories thực hiện:** US-11 (21 SP) = 21 SP core

**Hình 3.7 — Kiến trúc Multi-LLM Fallback (Sprint 5 — vibe-content)**

```
Scheduler (mỗi giờ)
        │
        ▼
ContextGathererService ──▶ Lấy posts/comments gần nhất từ backend API
        │
        ▼
ActionSelectorService ──▶ Quyết định: đăng bài / bình luận / vote
        │
        ▼
PromptBuilderService ──▶ Xây dựng prompt context-aware theo personality bot
        │
        ▼
ContentGeneratorService
   │
   ├──▶ [1] Google Gemini API ──▶ Thành công (~75%) ──▶ Content
   │         │ Thất bại (timeout/rate-limit)
   ├──▶ [2] Groq API (Llama) ──▶ Thành công (~20%) ──▶ Content
   │         │ Thất bại
   ├──▶ [3] Cerebras API ──▶ Thành công (~4%) ──▶ Content
   │         │ Thất bại
   └──▶ [4] Nvidia NIM API ──▶ Thành công (~1%) ──▶ Content
              │ Tất cả thất bại
              └──▶ Skip cycle, log error
        │
        ▼
ValidationService ──▶ Kiểm tra chất lượng (độ dài, không spam, đúng ngôn ngữ)
        │
        ▼
APIExecutorService ──▶ Gọi backend API để đăng bài/comment
```

**Bảng 3.9 — Sprint 5: Task Breakdown**

| Task ID | Mô tả | Loại | Ước tính | Thực tế | Chênh lệch | Ghi chú |
|---------|-------|:----:|:--------:|:-------:|:----------:|---------|
| T5-01 | `PersonalityService.ts` — tạo và quản lý bot profiles với JSON personality | Dev | 1.5 ngày | 1.5 ngày | 0 | |
| T5-02 | LLM adapters — Gemini, Groq, Cerebras, Nvidia API clients với retry logic | Dev | 1 ngày | 1 ngày | 0 | R02 mitigation |
| T5-03 | `ContentGeneratorService.ts` — orchestrate multi-LLM với fallback chain | Dev | 1.5 ngày | 1.5 ngày | 0 | |
| T5-04 | `PromptBuilderService.ts` — xây dựng context-aware prompt từ forum data | Dev | 1 ngày | 1 ngày | 0 | |
| T5-05 | `ActionSelectorService.ts` — chọn hành động (post/comment/vote) theo context | Dev | 0.5 ngày | 0.5 ngày | 0 | |
| T5-06 | `ContextGathererService.ts` + `APIExecutorService.ts` — thu thập data, gọi API | Dev | 1 ngày | 1 ngày | 0 | |
| T5-07 | Scheduler — cron jobs mỗi giờ, rate limiting để không spam | Dev | 0.5 ngày | 0.5 ngày | 0 | |
| T5-08 | Vitest test suite — backend: auth, upload middleware; frontend: components | Test | 2 ngày | 2 ngày | 0 | |
| T5-09 | Docker multi-stage Dockerfile — build stage + production stage; `docker-entrypoint.sh` | DevOps | 1.5 ngày | 1.5 ngày | 0 | |
| T5-10 | Deployment config — `render.json` (backend/vibe-content), `vercel.json` (frontend/admin) | DevOps | 0.5 ngày | 0.5 ngày | 0 | |
| T5-11 | Documentation hoàn thiện — README, DEPLOYMENT.md, DB_SETUP.md | Docs | 0.5 ngày | 0.5 ngày | 0 | |
| **Tổng** | | | **10.5 ngày** | **10.5 ngày** | **0** | |

> **Multi-LLM fallback (R02 mitigation):** `ContentGeneratorService` implement vòng lặp providers: Gemini → Groq → Cerebras → Nvidia. Nếu provider đầu tiên trả lỗi (rate limit, network timeout), tự động thử provider tiếp theo. Kết quả thực tế: Gemini ~75%, Groq ~20%, Cerebras/Nvidia ~5%.

**Milestone M5 đạt được (18/04/2026):**
- ✅ Bot tạo 3 bài viết và 5 bình luận trong test run (30 phút)
- ✅ Vitest: 15 test files, 120+ test cases, tất cả pass
- ✅ Test coverage overall ≈ 68% (vượt mục tiêu 60%)
- ✅ `docker build` hoàn thành < 5 phút, final image ~200MB (multi-stage)
- ✅ Deploy Render.com: backend + vibe-content hoạt động
- ✅ Deploy Vercel: frontend + admin-client hoạt động

**Retrospective Sprint 5:**
- **Went well:** Multi-LLM fallback hoạt động hoàn hảo — không bị gián đoạn ngay cả khi một provider down.
- **To improve:** Documentation nên được viết song song với development, không để dồn vào cuối sprint.
- **Action (cho dự án tương lai):** Mỗi task cần kèm theo acceptance criteria dưới dạng documentation ngay khi implement.

---

### 3.4.2 Tổng kết Sprint Planning — So sánh Estimate vs Actual

**Bảng 3.10 — Tổng hợp estimate vs actual toàn dự án**

| Sprint | SP Planned | SP Completed | Accuracy | Ngày Planned | Ngày Actual | Chênh lệch |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| S0 (Setup) | — | — | — | 8.5 | 8.5 | 0% |
| S1 (Auth) | 30 | 28 | 93.3% | 10.5 | 11 | +4.8% |
| S2 (Forum Core) | 35 | 33 | 94.3% | 10.5 | 12 | +14.3% |
| S3 (Advanced) | 35 | 35 | 100% | 10 | 11 | +10% |
| S4 (Admin) | 32 | 32 | 100% | 11 | 11 | 0% |
| S5 (AI+Test) | 30 | 30 | 100% | 10.5 | 10.5 | 0% |
| **Tổng** | **162** | **158** | **97.5%** | **61.5** | **64** | **+4.1%** |

> **Nhận xét:** Accuracy estimate cải thiện rõ rệt từ S1–S2 (93–94%) lên S3–S5 (100%). Sai lệch thực tế chỉ +4.1% tổng thời gian — nằm trong ngưỡng chấp nhận được (< 10%) của phương pháp Scrum. Buffer week (W13) hấp thụ toàn bộ phần dư.

---

## 3.5 Kết luận chương

Chương 3 đã trình bày toàn bộ quy trình lập kế hoạch dự án MINI-FORUM theo phương pháp Scrum Agile, bao gồm:

1. **WBS 3 cấp** với 7 thành phần hệ thống, 25+ module và 70+ task cụ thể — đảm bảo 100% scope được phân rã đến mức có thể thực thi và kiểm tra.

2. **Product Backlog 11 User Stories** (102 SP) được ưu tiên theo MoSCoW, phân bổ hợp lý qua 5 sprint với velocity trung bình 31.6 SP/sprint.

3. **Gantt Chart 13 tuần** với 6 milestone rõ ràng, tiêu chí xác nhận cụ thể — tất cả 6 milestone đều đạt đúng hoặc sớm hơn kế hoạch.

4. **Sprint Planning chi tiết** cho S0–S5 với task breakdown, estimate, actual và retrospective — giúp nhóm liên tục cải thiện accuracy từ 93% lên 100%.

---

*[Tiếp theo: Chương 4 — Quản lý rủi ro]*

