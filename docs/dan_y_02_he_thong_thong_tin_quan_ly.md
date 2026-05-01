# DÀN Ý BÁO CÁO
## MÔN: HỆ THỐNG THÔNG TIN QUẢN LÝ (HTTTQL)
### Dự án: MINI-FORUM — Ứng dụng Diễn đàn Trực tuyến Full-stack

---

> **Thời gian thực tập giả định:** 27/01/2026 – 27/04/2026
> **Nguồn tham chiếu:** `backend/prisma/schema.prisma`, `docs/02_bao_cao_he_thong_thong_tin_quan_li.md`

---

## CHƯƠNG 1 — TỔNG QUAN HỆ THỐNG THÔNG TIN

### 1.1 Định nghĩa hệ thống
- **Nội dung cốt lõi:** MINI-FORUM là **Hệ thống Thông tin Quản lý Cộng đồng** (Community MIS) phục vụ 3 nhóm chức năng:
  1. Hoạt động người dùng (tạo nội dung, tương tác, cá nhân hóa).
  2. Quản trị nội dung (moderation, báo cáo vi phạm, audit trail).
  3. Sinh thông tin tự động (AI bot tạo nội dung seed).

### 1.2 Mô hình hệ thống tổng quát (IPO)
- **Nội dung cốt lõi:** Mô hình 3 lớp Input → Processing → Output:
  - **Input:** Form đăng ký, bài viết, bình luận, vote, báo cáo, AI prompt.
  - **Processing:** Auth service, Post service, Comment service, Vote service, Report service, LLM service.
  - **Output:** Trang diễn đàn, thông báo real-time, Admin dashboard, Audit logs, Báo cáo thống kê, Nội dung AI.
  - **Storage:** PostgreSQL — single source of truth.

### 1.3 Phạm vi nghiệp vụ
- **Nội dung cốt lõi:** Bối cảnh kinh doanh diễn đàn thảo luận theo chủ đề; 6 quy trình nghiệp vụ chính — Đăng ký/xác thực, CRUD nội dung, Phân loại (category/tag), Tương tác (vote/bookmark/reply), Quản trị/kiểm duyệt, Thông báo real-time.

---

## CHƯƠNG 2 — PHÂN TÍCH NGHIỆP VỤ

### 2.1 Các tác nhân (Actors)
- **Nội dung cốt lõi:** 5 actor với phân cấp quyền tăng dần:

| Actor | Mô tả | Quyền hạn chính |
|-------|-------|----------------|
| **Guest** | Chưa đăng nhập | Xem bài viết (category `view_permission = ALL`) |
| **Member** | Đã xác thực | Đăng bài, comment, vote, bookmark, báo cáo |
| **Moderator** | Kiểm duyệt viên | Xóa/ẩn bài viết, xử lý báo cáo |
| **Admin** | Quản trị viên | Full access: user/category/config management |
| **Bot** | Tài khoản AI | Đăng bài và comment tự động |

- **Nguồn:** `schema.prisma` — `enum Role { MEMBER MODERATOR ADMIN BOT }`

### 2.2 Use Case Diagram (28 Use Cases)
- **Nội dung cốt lõi:** Phân nhóm 4 nhóm UC:
  - **Quản lý người dùng (UC-01 → UC-08):** Đăng ký, OTP, Đăng nhập, Cập nhật profile, Đổi mật khẩu, Quên mật khẩu, Chặn user, Upload avatar (ImageKit CDN).
  - **Quản lý nội dung (UC-09 → UC-15):** Tạo/sửa/xóa bài viết, Tạo/reply/quote/sửa bình luận.
  - **Tương tác (UC-16 → UC-20):** Vote post/comment, Bookmark, Full-text search, SSE notification.
  - **Quản trị (UC-21 → UC-28):** Quản lý category/tag, Báo cáo vi phạm, Xử lý báo cáo, Audit log, Dashboard, Ghim bài, Khóa thread.

### 2.3 Đặc tả Use Case tiêu biểu (3 UC quan trọng nhất)

#### UC-01: Đăng ký tài khoản
- **Nội dung cốt lõi:** Actor: Member mới; Main flow 7 bước: nhập email/username/password → Zod validate → bcrypt hash → tạo user chưa kích hoạt → gửi OTP qua Brevo → nhập OTP → kích hoạt; Alt flow: Email trùng → 409; Business rule: OTP có TTL, 1 email chỉ 1 tài khoản.

#### UC-09: Tạo bài viết
- **Nội dung cốt lõi:** Actor: Member; Precondition: đã đăng nhập, category `post_permission >= MEMBER`; Main flow 6 bước: điền form → validate (Zod) → tạo post với auto slug → tạo `post_blocks` (nếu block layout) → link `post_tags` → tăng `post_count`; Business rule: Slug unique, post có trạng thái DRAFT/PUBLISHED.

#### UC-24: Xử lý báo cáo vi phạm
- **Nội dung cốt lõi:** Actor: Moderator/Admin; Precondition: có report PENDING; Main flow: xem danh sách → xem nội dung → quyết định APPROVE/REJECT → cập nhật `reports.status` → ghi `audit_logs` → tùy chọn xóa/ẩn nội dung; Business rule: Mọi action moderator đều ghi audit_logs.

---

## CHƯƠNG 3 — MÔ HÌNH HÓA DỮ LIỆU

### 3.1 Entity-Relationship Diagram (ERD)
- **Nội dung cốt lõi:** Sơ đồ quan hệ 17 entity chính xoay quanh trung tâm USERS:
  - USERS →(writes)→ POSTS →(has)→ POST_BLOCKS, POST_MEDIA
  - POSTS ←(N:M via POST_TAGS)→ TAGS
  - USERS →(writes)→ COMMENTS (self-referencing: parent_id, quoted_comment_id)
  - USERS →(votes)→ VOTES →(on)→ POSTS/COMMENTS
  - USERS →(bookmarks)→ BOOKMARKS →(on)→ POSTS
  - USERS →(reports)→ REPORTS; USERS →(blocks)→ USER_BLOCKS
  - USERS →(receives)→ NOTIFICATIONS
  - USERS →(has)→ REFRESH_TOKENS, OTP_TOKENS
  - CATEGORIES →(contains)→ POSTS
  - AUDIT_LOGS →(tracks)→ tất cả admin actions

### 3.2 Mô tả Entity chi tiết (5 entity cốt lõi)

#### Entity: USERS
- **Nội dung cốt lõi:** 11 thuộc tính quan trọng — id (PK), email (UNIQUE), username (UNIQUE), password_hash (bcrypt), display_name, avatar_preview_url, avatar_standard_url, role (MEMBER/MODERATOR/ADMIN/BOT), **reputation** (tích lũy từ votes nhận được), is_active, is_banned.
- **Business Rule:** `reputation` tính toán trong `voteService.ts`; tăng/giảm khi nhận upvote/downvote.

#### Entity: POSTS
- **Nội dung cốt lõi:** 15 thuộc tính — id, title, slug (UNIQUE), content, author_id (FK), category_id (FK), **view_count/upvote_count/downvote_count/comment_count** (denormalized counters), status (DRAFT/PUBLISHED/HIDDEN/DELETED), is_pinned, pin_type (GLOBAL/CATEGORY), is_locked, **use_block_layout**.
- **Quyết định thiết kế:** Denormalize counters → tránh COUNT query heavy trên table lớn.

#### Entity: COMMENTS (self-referencing)
- **Nội dung cốt lõi:** `parent_id` (FK → comments.id, lồng 1 cấp), `quoted_comment_id` (FK → comments.id, quote riêng biệt), status (VISIBLE/HIDDEN/DELETED), is_content_masked.
- **Quyết định thiết kế:** Giới hạn 2 cấp (root + reply) — tránh UI phức tạp, giảm recursive query.

#### Entity: CATEGORIES (permission-aware)
- **Nội dung cốt lõi:** Ba trường phân quyền — `view_permission`, `post_permission`, `comment_permission` (PermissionLevel: ALL/MEMBER/MODERATOR/ADMIN).
- **Business Rule:** Guest chỉ xem category có `view_permission = ALL`.

#### Entity: AUDIT_LOGS
- **Nội dung cốt lõi:** action (AuditAction enum), target_type (AuditTarget enum), old_value/new_value (JSON string), ip_address, user_agent — không thể xóa, phục vụ non-repudiation.

### 3.3 Data Dictionary — 9 Enums quan trọng
- **Nội dung cốt lõi:** Bảng mapping enum → giá trị → nguồn schema.prisma:

| Enum | Giá trị |
|------|---------|
| `Role` | MEMBER, MODERATOR, ADMIN, BOT |
| `PostStatus` | DRAFT, PUBLISHED, HIDDEN, DELETED |
| `CommentStatus` | VISIBLE, HIDDEN, DELETED |
| `ReportStatus` | PENDING, APPROVED, REJECTED |
| `NotificationType` | COMMENT, REPLY, VOTE, MENTION, SYSTEM |
| `PermissionLevel` | ALL, MEMBER, MODERATOR, ADMIN |
| `BlockType` | TEXT, IMAGE, CODE, QUOTE |
| `PinType` | GLOBAL, CATEGORY |
| `ReportTarget` | POST, COMMENT, USER |

---

## CHƯƠNG 4 — LUỒNG THÔNG TIN TRONG HỆ THỐNG

### 4.1 DFD Mức 0 — Context Diagram
- **Nội dung cốt lõi:** 3 luồng vào/ra: Member (request/response), Admin (management cmd/reports+logs), Bot (AI content/external email).

### 4.2 DFD Mức 1 — Forum Core Flow (tạo bài viết)
- **Nội dung cốt lõi:** 4 bước xử lý tuần tự: `POST /posts` → [1.0 Xác thực & Phân quyền] (authMiddleware + roleMiddleware) → [2.0 Validate Input] (Zod schema) → [3.0 Xử lý nghiệp vụ Post] (postService.createPost, tạo slug, tăng category.post_count, link post_tags) → [D1 PostgreSQL + D2 audit_logs].

### 4.3 Luồng Xác thực (Auth Flow)
- **Nội dung cốt lõi:** Pipeline 7 bước với fail-fast:
  1. Validate format email/password (Zod) → Error 400 nếu fail.
  2. Kiểm tra email tồn tại DB → Error 401 nếu không tìm thấy.
  3. So sánh password với bcrypt hash → Error 401 nếu không khớp.
  4. Kiểm tra account active/banned → Error 403 nếu bị ban.
  5. Tạo JWT Access Token (TTL 15 phút).
  6. Tạo Refresh Token (7 ngày) → lưu vào `refresh_tokens` table.
  7. Trả về token; client lưu access token trong memory, refresh token trong httpOnly cookie.

### 4.4 Luồng Vote → Reputation
- **Nội dung cốt lõi:** Member vote upvote → `voteService.createVote()` → cập nhật `posts.upvote_count += 1` và `users.reputation (tác giả) += UPVOTE_REPUTATION_DELTA` → `notificationService.createVoteNotification()` → `sseService.pushToUser()` → real-time notification đến tác giả.
- **Business Rule:** Denormalize `upvote_count/downvote_count` trực tiếp trên posts/comments để hiển thị nhanh.

### 4.5 Luồng Thông báo Real-time (SSE)
- **Nội dung cốt lõi:** Server-Sent Events architecture — Client B kết nối `GET /notifications/stream` → SSE keep-alive → khi có event (A comment post của B) → `notificationService.createNotification()` → `sseService.pushToUser(B.id)` → client nhận `data: {type:"COMMENT", ...}`.
- **Giới hạn thiết kế:** SSE one-way (server→client), đủ cho notification — không dùng WebSocket vì không cần bidirectional.

### 4.6 Luồng Báo cáo Vi phạm
- **Nội dung cốt lõi:** Member báo cáo → `reports.status = PENDING` → Admin/Mod vào ReportsPage → filter PENDING → review → APPROVE (tùy chọn xóa/ẩn content) hoặc REJECT → ghi `audit_logs` cho cả hai nhánh.

---

## CHƯƠNG 5 — ĐẶC TẢ CHỨC NĂNG CHI TIẾT

### 5.1 Module Authentication & Authorization
- **Nội dung cốt lõi:** 7 endpoint `/auth/*` (register, verify-otp, login, refresh, logout, forgot-password, reset-password); 4 file cốt lõi (authController, authService, authMiddleware, roleMiddleware).
- **Bảo mật:** bcrypt salt=10, access token 15 phút, refresh token 7 ngày lưu DB (có thể revoke), rate limiting trên `/auth/*`.

### 5.2 Module Post Management
- **Nội dung cốt lõi:** 2 chế độ bài viết — Simple mode (content = plain text, `use_block_layout = false`) và Block mode (`post_blocks` với TEXT/IMAGE/CODE/QUOTE block, ảnh trong `post_media`).
- **State machine:** DRAFT →(publish)→ PUBLISHED →(hide)→ HIDDEN →(restore)→ PUBLISHED; →(delete)→ DELETED (soft delete).

### 5.3 Module Comment System
- **Nội dung cốt lõi:** Cây 2 cấp: root comment (parent_id=null) + reply (parent_id=root.id); quote comment là cơ chế độc lập (quoted_comment_id).
- **Business Rule:** Chỉ sửa được comment trong `COMMENT_EDIT_TIME_LIMIT` giây (config động qua configController).

### 5.4 Module Search
- **Nội dung cốt lõi:** PostgreSQL Full-Text Search với `tsvector/tsquery`; search trên `posts.title`, `posts.content`, `comments.content`; ranking theo `ts_rank`; 3 scope: posts, comments, cả hai (`?type=posts|comments`).

### 5.5 Module Notification
- **Nội dung cốt lõi:** 5 loại NotificationType — COMMENT (commentService), REPLY (commentService), VOTE (voteService), MENTION (commentService), SYSTEM (adminController); soft delete với `deleted_at`.

---

## CHƯƠNG 6 — HỆ THỐNG BÁO CÁO VÀ KIỂM SOÁT

### 6.1 Admin Dashboard — Metrics quản trị
- **Nội dung cốt lõi:** `DashboardPage.tsx` hiển thị 6 metric real-time — Tổng user, User mới hôm nay, Tổng bài viết published, Bài viết mới, Tổng bình luận, Báo cáo chờ xử lý (PENDING).

### 6.2 Operational Dashboard
- **Nội dung cốt lõi:** `OperationalDashboardPage.tsx` — metrics kỹ thuật từ `metricsService.ts`: HTTP request rate, error rate theo endpoint, response time percentiles.

### 6.3 Audit Trail
- **Nội dung cốt lõi:** Mọi action Admin/Moderator ghi vào `audit_logs` với `old_value`/`new_value` (JSON); 6 ví dụ action: BAN USER, DELETE POST, HIDE COMMENT, APPROVE_REPORT, UPDATE CATEGORY, UPDATE CONFIG.

### 6.4 Report Management Workflow
- **Nội dung cốt lõi:** Quy trình đầy đủ: PENDING → Review (xem content + lịch sử reporter) → APPROVE (tùy chọn action: xóa post/ẩn comment/ban user) hoặc REJECT → ghi audit_log cho mỗi action.

---

## CHƯƠNG 7 — ĐÁNH GIÁ VÀ KẾT LUẬN

### 7.1 Đánh giá thiết kế dữ liệu
- **Điểm mạnh:** Schema normalized 3NF; denormalization có mục đích (counters); self-referencing comments đúng; Prisma migration versioned.
- **Điểm cần lưu ý:** `avatar_url` deprecated còn trong schema (có `migrateAvatarUrls.ts`); `user_content_context` không expose sang forum API.

### 7.2 Phân tích luồng thông tin theo sprint
- **Nội dung cốt lõi:** Bảng mapping Sprint → Luồng thông tin xây dựng:
  - S0: ERD, entity chính; S1: Auth flow; S2: CRUD Post/Comment; S3: Vote→Reputation + SSE; S4: Audit trail; S5: AI pipeline (prompt→LLM→post via API).

### 7.3 Kết luận
- **Nội dung cốt lõi:** 4 lớp trách nhiệm rõ ràng — Nghiệp vụ (28+ UC), Dữ liệu (19 entity + migration history), Luồng thông tin (validation→business→persistence, không bypass), Kiểm soát (audit trail + report workflow + permission-aware data access).

---

## PHỤ LỤC

### A. Danh sách 19 Models trong Prisma Schema
| # | Model | Vai trò |
|---|-------|---------|
| 1 | `users` | Tài khoản người dùng |
| 2 | `posts` | Bài viết diễn đàn |
| 3 | `comments` | Bình luận (self-ref) |
| 4 | `categories` | Danh mục bài viết |
| 5 | `tags` | Thẻ phân loại |
| 6 | `post_tags` | Quan hệ N:M posts-tags |
| 7 | `post_blocks` | Block layout editor |
| 8 | `post_media` | Media files trong posts |
| 9 | `votes` | Lịch sử vote |
| 10 | `bookmarks` | Bookmark bài viết |
| 11 | `notifications` | Thông báo người dùng |
| 12 | `reports` | Báo cáo vi phạm |
| 13 | `user_blocks` | Chặn người dùng |
| 14 | `audit_logs` | Nhật ký hành động admin |
| 15 | `refresh_tokens` | JWT refresh token |
| 16 | `otp_tokens` | OTP email verification |
| 17 | `user_content_context` | Context tracking AI bot |

### B. Thống kê API Endpoints theo nhóm nghiệp vụ
| Nhóm | Prefix | Số endpoint |
|------|--------|-------------|
| Auth | `/auth` | 7 |
| Users | `/users` | 8 |
| Posts | `/posts` | 10 |
| Comments | `/comments` | 6 |
| Categories | `/categories` | 5 |
| Tags | `/tags` | 5 |
| Votes | `/votes` | 3 |
| Bookmarks | `/bookmarks` | 3 |
| Search | `/search` | 2 |
| Notifications | `/notifications` | 4 |
| Reports/Blocks | `/reports`, `/blocks` | 6 |
| Admin | `/admin` | 15+ |
| Config | `/config` | 3 |
| Media | `/media` | 4 |
| **Tổng** | | **~81 endpoints** |
