# TIMELINE PHÁT TRIỂN THỐNG NHẤT — DỰ ÁN MINI-FORUM

> **Thời gian giả định:** 27/01/2026 — 27/04/2026 (13 tuần / ~3 tháng)
> **Mô hình phát triển:** Scrum (6 Sprint × 2 tuần + 1 tuần buffer)
> **Codebase tham chiếu:** monorepo `mini-forum` (backend / frontend / admin-client / vibe-content)

---

## 1. Lý do chọn mô hình Scrum

| Tiêu chí | Giải thích |
|---|---|
| **Yêu cầu thay đổi liên tục** | Diễn đàn online có nhiều tính năng phụ thuộc nhau (auth → post → comment → vote); không thể xác định toàn bộ yêu cầu từ đầu |
| **Team nhỏ** | 1–3 developer, không cần overhead quản lý quy trình nặng như RUP |
| **Cần phản hồi sớm** | Mỗi sprint tạo ra increment chạy được, cho phép test tích hợp liên tục |
| **Risk management** | Sprint review sau mỗi 2 tuần phát hiện sớm rủi ro kỹ thuật (schema DB, API contract) |
| **So sánh với Waterfall** | Waterfall không phù hợp vì tích hợp AI (vibe-content) chỉ rõ ràng sau khi có dữ liệu thật từ forum |

---

## 2. Tổng quan Timeline

```
THÁNG 1 (Tuần 1-2)     THÁNG 2 (Tuần 3-6)          THÁNG 3 (Tuần 7-10)         THÁNG 4 (Tuần 11-13)
|────────────────────|──────────────────────────|──────────────────────────|──────────────────|
  Sprint 0             Sprint 1    Sprint 2       Sprint 3    Sprint 4       Sprint 5    Buffer
  Khởi tạo &           Backend     Forum Core     Nâng cao    Admin +        Vibe-       Hoàn
  Phân tích            Nền tảng    (Post/Cmt)     (Vote/SSE)  Media          Content AI  thiện
  (Jan 27 - Feb 7)     (Feb 8-21)  (Feb 22-Mar7)  (Mar8-21)  (Mar22-Apr4)  (Apr5-18)  (Apr19-27)
```

---

## 3. Chi tiết từng Sprint

### Sprint 0 — Khởi tạo & Phân tích Yêu cầu
**Thời gian:** 27/01/2026 – 07/02/2026

**Mục tiêu:** Xác lập nền tảng dự án, đồng thuận về kiến trúc, thiết kế database schema ban đầu.

**Hoạt động:**
- Phân tích yêu cầu nghiệp vụ (forum: bài viết, bình luận, người dùng, phân quyền)
- Quyết định kiến trúc: monorepo, 4 service (backend / frontend / admin-client / vibe-content)
- Thiết kế Prisma schema ban đầu: `users`, `posts`, `comments`, `categories`, `tags`
- Khởi tạo repository, cấu hình CI/CD cơ bản
- Chọn tech stack: Express + Prisma + PostgreSQL / React + Vite + TailwindCSS

**Deliverables:**
- Tài liệu yêu cầu (SRS sơ bộ)
- ERD phiên bản 1
- Monorepo skeleton với 4 thư mục

**Milestone M0:** Codebase skeleton commit, schema v1 approved

---

### Sprint 1 — Backend Nền tảng (Auth & Users)
**Thời gian:** 08/02/2026 – 21/02/2026

**Mục tiêu:** Hệ thống xác thực và quản lý người dùng hoàn chỉnh.

**Hoạt động:**
- Triển khai `authController.ts`: đăng ký, đăng nhập, refresh token, đổi mật khẩu
- OTP qua email (Brevo): `otpService.ts`, `emailService.ts`, `brevoApiService.ts`
- JWT access token (15 phút) + refresh token (7 ngày): `refresh_tokens` table
- Middleware: `authMiddleware.ts` (xác thực), `roleMiddleware.ts` (phân quyền RBAC)
- Security layer: `securityMiddleware.ts` (Helmet, CORS, rate limiting, CSP)
- Input validation: Zod schemas (`validations/`)
- `userController.ts`: CRUD profile, avatar upload (ImageKit)

**Deliverables:**
- API `/auth/*`, `/users/*` hoạt động với test coverage
- Schema: `users`, `refresh_tokens`, `otp_tokens`

**Milestone M1:** Auth flow end-to-end test pass (register → OTP → login → refresh)

---

### Sprint 2 — Forum Core (Posts, Comments, Categories, Tags)
**Thời gian:** 22/02/2026 – 07/03/2026

**Mục tiêu:** Chức năng cốt lõi của diễn đàn.

**Hoạt động:**
- `postController.ts` + `postService.ts`: CRUD bài viết, phân trang, slug tự động
- Schema mở rộng: `posts`, `post_blocks`, `post_media`, `post_tags`
- Block layout system: `post_blocks` (TEXT/IMAGE blocks) cho editor phong phú
- `commentController.ts` + `commentService.ts`: comment lồng nhau (nested), quote comment
- `categoryController.ts` + `categoryService.ts`: quản lý danh mục với permission level
- `tagController.ts` + `tagService.ts`: tags với `use_permission`
- Frontend: trang `HomePage`, `PostDetailPage`, `CategoriesPage`, `TagsPage`
- Admin: skeleton `CategoriesPage`, `TagsPage`

**Deliverables:**
- Forum CRUD đầy đủ, frontend hiển thị bài viết và bình luận

**Milestone M2:** Demo forum cơ bản hoạt động end-to-end

---

### Sprint 3 — Tính năng Nâng cao (Votes, Bookmarks, Search, Notifications)
**Thời gian:** 08/03/2026 – 21/03/2026

**Mục tiêu:** Tăng tương tác và trải nghiệm người dùng.

**Hoạt động:**
- `voteController.ts` + `voteService.ts`: upvote/downvote cho post và comment, cập nhật `reputation`
- `bookmarkController.ts` + `bookmarkService.ts`: bookmark/unbookmark bài viết
- `searchController.ts` + `searchService.ts`: full-text search PostgreSQL (posts + comments)
- `notificationController.ts` + `notificationService.ts`: tạo notification khi có comment, vote, reply
- `sseService.ts`: Server-Sent Events cho real-time notification push
- `blockReportController.ts`: chặn người dùng (`user_blocks`), báo cáo vi phạm (`reports`)
- Frontend: `SearchPage`, `BookmarksPage`, `NotificationsPage`, `BlockedUsersPage`

**Deliverables:**
- Hệ thống tương tác hoàn chỉnh, SSE notification hoạt động

**Milestone M3:** Notification SSE demo, search latency < 200ms

---

### Sprint 4 — Admin Panel + Media Upload + Reports + Audit
**Thời gian:** 22/03/2026 – 04/04/2026

**Mục tiêu:** Bộ công cụ quản trị đầy đủ cho admin/moderator.

**Hoạt động:**
- `adminController.ts`: thống kê tổng quan, quản lý users/posts/comments
- `auditLogService.ts`: ghi nhật ký mọi hành động admin (`audit_logs` table)
- `postMediaController.ts` + `imagekitService.ts`: upload ảnh qua ImageKit CDN
- `metricsService.ts` + `metricsMiddleware.ts`: thu thập metrics HTTP
- `configController.ts`: cấu hình hệ thống động (comment edit time limit, v.v.)
- Admin-client hoàn thiện: `DashboardPage`, `UsersPage`, `PostsPage`, `CommentsPage`, `ReportsPage`, `AuditLogsPage`, `OperationalDashboardPage`
- Schema: `audit_logs`, `post_media` với ImageKit fields

**Deliverables:**
- Admin panel đầy đủ tính năng, audit trail hoàn chỉnh

**Milestone M4:** Admin RBAC test pass (role: ADMIN vs MODERATOR), audit log ghi đúng mọi action

---

### Sprint 5 — Vibe-Content AI Service + Testing + Deployment
**Thời gian:** 05/04/2026 – 18/04/2026

**Mục tiêu:** Tích hợp AI bot sinh nội dung, hoàn thiện test suite, chuẩn bị deploy.

**Hoạt động:**
- Thiết kế `vibe-content` service: bot users với `user_content_context` tracking
- `ContentGeneratorService.ts`: sinh nội dung (post/comment/vote) bằng multi-LLM (Gemini, Groq, Cerebras)
- `PersonalityService.ts`: mỗi bot có tính cách riêng theo prompt template
- `ActionSelectorService.ts` + `ContextGathererService.ts`: bot tự quyết định hành động theo context
- `scheduler/`: cron jobs tự động kích hoạt bot định kỳ
- Vitest unit test cho backend (`__tests__/`)
- Vitest unit test cho frontend (`__tests__/`)
- Docker multi-stage build: `Dockerfile` cho backend và vibe-content
- Deployment config: `render.json`, `vercel.json`, `docker-entrypoint.sh`

**Deliverables:**
- AI bot hoạt động, docker images build thành công

**Milestone M5:** Bot tạo bài viết tự động mỗi giờ, test coverage > 60%

---

### Buffer — Hoàn thiện & Tài liệu
**Thời gian:** 19/04/2026 – 27/04/2026

**Hoạt động:**
- Fix bugs từ production testing
- Tối ưu query PostgreSQL (indexes đã có trong schema)
- Script bảo trì: `backupDb.ts`, `cleanupImagekit.ts`, `migrateAvatarUrls.ts`
- Hoàn thiện tài liệu (`README.md`, `DEPLOYMENT.md`, `DB_SETUP.md`)
- Final deploy review

---

## 4. Mapping Timeline → 3 Báo cáo

| Sprint | Khoảng thời gian | Báo cáo 1: QTDAPM | Báo cáo 2: HTTTQL | Báo cáo 3: HTTTTÍCH HỢP |
|--------|-----------------|-------------------|-------------------|--------------------------|
| **Sprint 0** | Jan 27 – Feb 7 | Lập kế hoạch dự án, WBS, Product Backlog, risk register | Phân tích nghiệp vụ, use case tổng quan, ERD v1 | Quyết định kiến trúc monorepo, chọn tech stack |
| **Sprint 1** | Feb 8 – Feb 21 | Sprint planning, định nghĩa DoD, velocity tracking | Mô hình hóa quy trình xác thực, luồng OTP | Module Auth: JWT, RBAC, middleware stack |
| **Sprint 2** | Feb 22 – Mar 7 | Sprint review/retrospective, burndown chart | Đặc tả chức năng diễn đàn (post/comment/tag) | Module Forum Core: service layer, block layout |
| **Sprint 3** | Mar 8 – Mar 21 | Quản lý rủi ro kỹ thuật (SSE scalability), scope control | Luồng thông tin: vote → reputation, notification flow | Tích hợp SSE real-time, full-text search PostgreSQL |
| **Sprint 4** | Mar 22 – Apr 4 | Quality gates, audit review, stakeholder demo | Hệ thống báo cáo vi phạm, audit trail, admin workflow | Module Admin: role-based API, ImageKit CDN integration |
| **Sprint 5** | Apr 5 – Apr 18 | Final acceptance testing, deployment checklist | Mô hình AI trong hệ thống thông tin | Tích hợp multi-LLM, Docker deployment, inter-service communication |
| **Buffer** | Apr 19 – Apr 27 | Lessons learned, project closure | Đánh giá chất lượng dữ liệu | Performance tuning, operational monitoring |

---

## 5. Milestones tổng hợp

| ID | Milestone | Sprint | Tiêu chí đạt |
|----|-----------|--------|---------------|
| M0 | Kiến trúc xác lập | Sprint 0 | Monorepo chạy được, schema v1 migrate thành công |
| M1 | Auth hoàn chỉnh | Sprint 1 | Register→OTP→Login→Refresh pass toàn bộ test |
| M2 | Forum cơ bản | Sprint 2 | CRUD post/comment/category/tag hoạt động trên UI |
| M3 | Tương tác đầy đủ | Sprint 3 | Vote, bookmark, search, SSE notification hoạt động |
| M4 | Admin ready | Sprint 4 | Admin dashboard, audit log, media upload production-ready |
| M5 | AI bot live | Sprint 5 | Vibe-content bot sinh nội dung tự động mỗi 1h |
| M6 | Production deploy | Buffer | Docker compose up, tất cả service healthy |

---

## 6. Resource & Team

| Vai trò | Trách nhiệm | Sprint chủ yếu |
|---------|-------------|----------------|
| Fullstack Developer (Lead) | Backend API, DB schema, deployment | Sprint 0–5 |
| Frontend Developer | React UI, React Query, form validation | Sprint 2–4 |
| AI/Integration Developer | vibe-content service, LLM integration | Sprint 5 |

> **Ghi chú:** Với team 1–3 người, các vai trò thường kiêm nhiệm. Scrum đảm bảo mỗi sprint có deliverable rõ ràng ngay cả khi team nhỏ.
