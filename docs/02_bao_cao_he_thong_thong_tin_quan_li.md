# BÁO CÁO CHUYÊN ĐỀ
## THỰC TẬP HỆ THỐNG THÔNG TIN QUẢN LÍ
### Dự án: MINI-FORUM — Ứng dụng Diễn đàn Trực tuyến Full-stack

---

> **Thời gian thực tập giả định:** 27/01/2026 – 27/04/2026
> **Nguồn tham chiếu:** Codebase tại monorepo `mini-forum`, Prisma schema tại `backend/prisma/schema.prisma`

---

## MỤC LỤC

1. [Tổng quan hệ thống thông tin](#1-tổng-quan-hệ-thống-thông-tin)
2. [Phân tích nghiệp vụ](#2-phân-tích-nghiệp-vụ)
3. [Mô hình hóa dữ liệu](#3-mô-hình-hóa-dữ-liệu)
4. [Luồng thông tin trong hệ thống](#4-luồng-thông-tin-trong-hệ-thống)
5. [Đặc tả chức năng chi tiết](#5-đặc-tả-chức-năng-chi-tiết)
6. [Hệ thống báo cáo và kiểm soát](#6-hệ-thống-báo-cáo-và-kiểm-soát)
7. [Đánh giá và kết luận](#7-đánh-giá-và-kết-luận)

---

## 1. Tổng quan hệ thống thông tin

### 1.1 Định nghĩa hệ thống

MINI-FORUM là một **Hệ thống Thông tin Quản lí Cộng đồng** (Community Management Information System) — hệ thống thu thập, xử lý, lưu trữ và phân phối thông tin phục vụ ba nhóm chức năng chính:

1. **Hoạt động người dùng** (tạo nội dung, tương tác, cá nhân hóa)
2. **Quản trị nội dung** (moderation, báo cáo vi phạm, audit)
3. **Sinh thông tin tự động** (AI bot tạo nội dung seed)

### 1.2 Mô hình hệ thống tổng quát

```
┌─────────────────────────────────────────────────────────┐
│                     MINI-FORUM MIS                      │
├───────────────┬─────────────────┬───────────────────────┤
│  Input Layer  │ Processing Layer│    Output Layer        │
├───────────────┼─────────────────┼───────────────────────┤
│ - Form đăng ký│ - Auth service  │ - Trang diễn đàn      │
│ - Bài viết    │ - Post service  │ - Thông báo real-time │
│ - Bình luận   │ - Comment svc   │ - Admin dashboard     │
│ - Vote        │ - Vote service  │ - Audit logs          │
│ - Báo cáo     │ - Report svc    │ - Báo cáo thống kê    │
│ - AI prompt   │ - LLM service   │ - Nội dung AI         │
└───────────────┴─────────────────┴───────────────────────┘
                        │
                        ▼
              PostgreSQL Database
              (Single source of truth)
```

### 1.3 Phạm vi nghiệp vụ

**Bối cảnh kinh doanh:** Diễn đàn trực tuyến cho cộng đồng thảo luận theo chủ đề.

**Các quy trình nghiệp vụ chính:**
- Đăng ký và xác thực thành viên
- Tạo và quản lý nội dung (bài viết, bình luận)
- Phân loại nội dung (danh mục, thẻ tag)
- Tương tác cộng đồng (vote, bookmark, reply)
- Quản trị và kiểm duyệt nội dung
- Thông báo và tương tác thời gian thực

---

## 2. Phân tích nghiệp vụ

### 2.1 Các tác nhân (Actors)

| Actor | Mô tả | Quyền hạn |
|-------|-------|----------|
| **Guest** | Người dùng chưa đăng nhập | Xem bài viết (theo category permission) |
| **Member** | Thành viên đã xác thực | Đăng bài, comment, vote, bookmark, báo cáo |
| **Moderator** | Kiểm duyệt viên | Xóa/ẩn bài viết, xử lý báo cáo |
| **Admin** | Quản trị viên | Full access: quản lý user, category, config |
| **Bot** | Tài khoản AI | Đăng bài và comment tự động |

> **Nguồn:** `backend/prisma/schema.prisma` — enum `Role { MEMBER MODERATOR ADMIN BOT }`

### 2.2 Use Case Diagram (văn bản)

**Nhóm UC — Quản lý người dùng:**
- UC-01: Đăng ký tài khoản (Member)
- UC-02: Xác thực OTP qua email (Member)
- UC-03: Đăng nhập (Member/Admin/Bot)
- UC-04: Cập nhật thông tin cá nhân (Member)
- UC-05: Đổi mật khẩu (Member)
- UC-06: Quên mật khẩu — reset qua email (Member)
- UC-07: Chặn người dùng (Member)
- UC-08: Upload avatar (Member) — sử dụng ImageKit CDN

**Nhóm UC — Quản lý nội dung:**
- UC-09: Tạo bài viết (Member)
- UC-10: Chỉnh sửa bài viết (Author/Admin)
- UC-11: Xóa bài viết (Author/Moderator/Admin)
- UC-12: Tạo bình luận (Member)
- UC-13: Reply bình luận (Member)
- UC-14: Quote bình luận (Member)
- UC-15: Chỉnh sửa bình luận (Author, giới hạn thời gian: `COMMENT_EDIT_TIME_LIMIT`)

**Nhóm UC — Tương tác:**
- UC-16: Vote upvote/downvote bài viết (Member)
- UC-17: Vote upvote/downvote bình luận (Member)
- UC-18: Bookmark bài viết (Member)
- UC-19: Tìm kiếm full-text (Member/Guest)
- UC-20: Nhận thông báo real-time (Member)

**Nhóm UC — Quản trị:**
- UC-21: Quản lý danh mục (Admin)
- UC-22: Quản lý thẻ tag (Admin)
- UC-23: Báo cáo vi phạm (Member)
- UC-24: Xử lý báo cáo (Moderator/Admin)
- UC-25: Xem audit log (Admin)
- UC-26: Xem dashboard thống kê (Admin)
- UC-27: Ghim bài viết (Admin)
- UC-28: Khóa thread (Admin/Moderator)

### 2.3 Đặc tả Use Case tiêu biểu

#### UC-01: Đăng ký tài khoản

| Trường | Nội dung |
|--------|---------|
| **Actor** | Member (mới) |
| **Precondition** | Email chưa tồn tại trong hệ thống |
| **Main Flow** | 1. User nhập email, username, password → 2. Hệ thống validate (Zod schema) → 3. Hash password (bcrypt) → 4. Tạo user với status chưa kích hoạt → 5. Gửi OTP qua Brevo email → 6. User nhập OTP → 7. Kích hoạt tài khoản |
| **Alternative Flow** | 3a. Email đã tồn tại → trả về error 409 |
| **Exception** | 5a. Email delivery fail → retry với backoff |
| **Postcondition** | Tài khoản hoạt động, user có thể đăng nhập |
| **Business Rule** | OTP có TTL giới hạn; 1 email chỉ 1 tài khoản |

#### UC-09: Tạo bài viết

| Trường | Nội dung |
|--------|---------|
| **Actor** | Member |
| **Precondition** | User đã đăng nhập; category cho phép `post_permission >= MEMBER` |
| **Main Flow** | 1. User điền form (title, content, category, tags) → 2. Validate (Zod) → 3. Tạo `posts` record với slug tự động → 4. Tạo `post_blocks` nếu dùng block layout → 5. Link `post_tags` → 6. Tăng `post_count` của category |
| **Business Rule** | Slug phải unique; post có thể ở trạng thái DRAFT hoặc PUBLISHED |

#### UC-24: Xử lý báo cáo vi phạm

| Trường | Nội dung |
|--------|---------|
| **Actor** | Moderator/Admin |
| **Precondition** | Có report với status PENDING |
| **Main Flow** | 1. Moderator xem danh sách reports → 2. Xem nội dung bị báo cáo → 3. Quyết định action (approve/reject) → 4. Cập nhật `reports.status` → 5. Ghi `audit_logs` → 6. Có thể xóa/ẩn nội dung liên quan |
| **Business Rule** | Mọi action của moderator đều ghi vào audit_logs |

---

## 3. Mô hình hóa dữ liệu

### 3.1 Entity-Relationship Diagram (ERD)

**Các entity chính và quan hệ:**

```
USERS ─────────────────────────────────────────────────────
  │ 1                                                       │
  │ ├──(writes)──────── POSTS ──────────────────────┐      │
  │ │                     │ 1                       │      │
  │ │                     │                         │      │
  │ │            POST_TAGS│(N:M)   POST_BLOCKS      │      │
  │ │             │ TAG_ID│          │               │      │
  │ │             ▼       │          │               │      │
  │ │            TAGS     │     POST_MEDIA           │      │
  │ │                     │                         │      │
  │ ├──(writes)──── COMMENTS ──(belongs to)─────────┘      │
  │ │                 │ (self-ref: parent_id,               │
  │ │                 │  quoted_comment_id)                 │
  │ ├──(votes)──── VOTES ──(on posts/comments)             │
  │ ├──(bookmarks)─ BOOKMARKS ──(on posts)                 │
  │ ├──(reports)──  REPORTS                                │
  │ ├──(blocks)───  USER_BLOCKS                            │
  │ ├──(receives)── NOTIFICATIONS                          │
  │ ├──(has)──────  REFRESH_TOKENS                         │
  │ └──(has)──────  OTP_TOKENS                             │
  │                                                         │
CATEGORIES ──(contains)── POSTS                            │
                                                            │
AUDIT_LOGS ──(tracks)─────────────────────────────────────┘
```

### 3.2 Mô tả Entity chi tiết

#### Entity: USERS

| Thuộc tính | Kiểu | Ràng buộc | Ý nghĩa |
|-----------|------|----------|---------|
| `id` | Int | PK, auto | Khóa chính |
| `email` | String | UNIQUE, NOT NULL | Email đăng nhập |
| `username` | String | UNIQUE, NOT NULL | Tên đăng nhập |
| `password_hash` | String | NOT NULL | Mật khẩu đã hash (bcrypt) |
| `display_name` | String? | nullable | Tên hiển thị |
| `avatar_preview_url` | String? | nullable | URL ảnh đại diện (preview) |
| `avatar_standard_url` | String? | nullable | URL ảnh đại diện (standard) |
| `role` | Role | DEFAULT MEMBER | Vai trò: MEMBER/MODERATOR/ADMIN/BOT |
| `reputation` | Int | DEFAULT 0 | Điểm uy tín (tăng/giảm theo votes nhận) |
| `is_active` | Boolean | DEFAULT true | Tài khoản đang hoạt động |
| `is_banned` | Boolean | DEFAULT false | Tài khoản bị cấm |

> **Business Rule:** `reputation` là tổng hợp votes nhận được; tính toán trong `voteService.ts`

#### Entity: POSTS

| Thuộc tính | Kiểu | Ràng buộc | Ý nghĩa |
|-----------|------|----------|---------|
| `id` | Int | PK | |
| `title` | String | NOT NULL | Tiêu đề |
| `slug` | String | UNIQUE | URL-friendly identifier |
| `content` | String | NOT NULL | Nội dung (raw text hoặc serialized blocks) |
| `author_id` | Int | FK → users | |
| `category_id` | Int | FK → categories | |
| `view_count` | Int | DEFAULT 0 | Số lượt xem (denormalized) |
| `upvote_count` | Int | DEFAULT 0 | Denormalized từ votes |
| `downvote_count` | Int | DEFAULT 0 | Denormalized |
| `comment_count` | Int | DEFAULT 0 | Denormalized |
| `status` | PostStatus | DEFAULT PUBLISHED | DRAFT/PUBLISHED/HIDDEN/DELETED |
| `is_pinned` | Boolean | DEFAULT false | Ghim bài viết |
| `pin_type` | PinType? | nullable | GLOBAL/CATEGORY |
| `is_locked` | Boolean | DEFAULT false | Khóa bình luận |
| `use_block_layout` | Boolean | DEFAULT false | Dùng block editor |

> **Quyết định thiết kế:** Các counter fields (`view_count`, `upvote_count`, `comment_count`) được lưu denormalized để tránh COUNT query trên table lớn.

#### Entity: COMMENTS (self-referencing)

| Thuộc tính | Ý nghĩa |
|-----------|---------|
| `parent_id` | FK → comments.id — comment lồng nhau (1 cấp) |
| `quoted_comment_id` | FK → comments.id — quote comment (khác với reply) |
| `status` | VISIBLE/HIDDEN/DELETED |
| `is_content_masked` | Ẩn nội dung nhạy cảm |

#### Entity: CATEGORIES (permission-aware)

| Thuộc tính | Ý nghĩa |
|-----------|---------|
| `view_permission` | PermissionLevel: ALL/MEMBER/MODERATOR/ADMIN |
| `post_permission` | Ai có quyền đăng bài |
| `comment_permission` | Ai có quyền bình luận |

> **Business Rule:** Guest chỉ xem được category có `view_permission = ALL`

#### Entity: AUDIT_LOGS

| Thuộc tính | Ý nghĩa |
|-----------|---------|
| `action` | AuditAction enum (CREATE/UPDATE/DELETE/BAN/UNBAN...) |
| `target_type` | AuditTarget enum (USER/POST/COMMENT/REPORT...) |
| `old_value` | Giá trị trước thay đổi (JSON string) |
| `new_value` | Giá trị sau thay đổi (JSON string) |
| `ip_address` | IP của người thực hiện |

### 3.3 Data Dictionary — Enums quan trọng

| Enum | Giá trị | Nguồn |
|------|---------|-------|
| `Role` | MEMBER, MODERATOR, ADMIN, BOT | `schema.prisma` |
| `PostStatus` | DRAFT, PUBLISHED, HIDDEN, DELETED | `schema.prisma` |
| `CommentStatus` | VISIBLE, HIDDEN, DELETED | `schema.prisma` |
| `ReportStatus` | PENDING, APPROVED, REJECTED | `schema.prisma` |
| `ReportTarget` | POST, COMMENT, USER | `schema.prisma` |
| `NotificationType` | COMMENT, REPLY, VOTE, MENTION, SYSTEM | `schema.prisma` |
| `PermissionLevel` | ALL, MEMBER, MODERATOR, ADMIN | `schema.prisma` |
| `BlockType` | TEXT, IMAGE, CODE, QUOTE | `schema.prisma` |
| `PinType` | GLOBAL, CATEGORY | `schema.prisma` |

---

## 4. Luồng thông tin trong hệ thống

### 4.1 Data Flow Diagram (DFD) — Mức 0 (Context Diagram)

```
                    ┌─────────────────────────────────────┐
  Member ──────────►│                                     │──────────► Member
  (request)         │         MINI-FORUM SYSTEM           │         (response/content)
                    │                                     │
  Admin ───────────►│    (Processing + Storage + Output)  │──────────► Admin
  (management cmd)  │                                     │         (reports/logs)
                    │                                     │
  Bot ─────────────►│                                     │──────────► External
  (AI content)      │                                     │         (email notifications)
                    └─────────────────────────────────────┘
```

### 4.2 DFD Mức 1 — Forum Core Flow

```
[Member]
   │
   │ (1) POST /posts
   ▼
[1.0 Xác thực & Phân quyền]
   │ authMiddleware + roleMiddleware
   │
   ▼
[2.0 Validate Input]
   │ Zod schema validation
   │
   ▼
[3.0 Xử lý nghiệp vụ Post]
   │ postService.createPost()
   │ ├── Tạo slug tự động
   │ ├── Tăng category.post_count
   │ └── Link post_tags
   │
   ▼
[D1 PostgreSQL]   [D2 Log]
posts table       audit_logs
```

### 4.3 Luồng xác thực (Auth Flow)

```
User nhập credentials
        │
        ▼
[Validate email/password format] ─── Fail ──► Error 400
        │
        ▼
[Kiểm tra email tồn tại trong DB] ─── Not found ──► Error 401
        │
        ▼
[So sánh password với hash bcrypt] ─── Mismatch ──► Error 401
        │
        ▼
[Kiểm tra account active/banned] ─── Banned ──► Error 403
        │
        ▼
[Tạo JWT Access Token (15 phút)]
        │
        ▼
[Tạo Refresh Token (7 ngày)] → Lưu vào refresh_tokens table
        │
        ▼
[Trả về tokens cho client]
        │
        ▼
[Client lưu access token trong memory]
[Client lưu refresh token trong httpOnly cookie]
```

### 4.4 Luồng Vote → Reputation

```
Member vote upvote trên post của User B
        │
        ▼
[voteService.createVote()] 
        │
        ├── Tăng posts.upvote_count += 1
        │
        └── Tăng users.reputation (user B) += UPVOTE_REPUTATION_DELTA
                │
                ▼
        [notificationService.createVoteNotification()]
                │
                ▼
        [sseService.pushToUser(userB_id)]  ──► Real-time notification đến User B
```

> **Business Rule quan trọng:** Reputation là thước đo uy tín cộng đồng, tích lũy qua thời gian. Việc denormalize `upvote_count/downvote_count` trực tiếp trên `posts` và `comments` giúp hiển thị nhanh mà không cần aggregate query.

### 4.5 Luồng Thông báo Real-time (SSE)

```
Server-Sent Events (SSE) Architecture:

Client (Member B)                         Backend
      │                                      │
      │──── GET /notifications/stream ──────►│
      │                                      │ sseService.addClient(userId, res)
      │◄─── text/event-stream ───────────────│ (keep-alive connection)
      │                                      │
      │           ...                        │ Member A comments on post
      │                                      │ notificationService.createNotification()
      │◄─── data: {type:"COMMENT", ...} ─────│ sseService.pushToUser(B.id)
      │                                      │
```

> **Giới hạn thiết kế:** SSE là one-way (server → client), phù hợp cho notification. Không dùng WebSocket vì không cần bidirectional trong use case này.

### 4.6 Luồng Báo cáo Vi phạm

```
Member báo cáo bài viết
        │
        ▼
[blockReportController.createReport()]
        │
        ▼
[Lưu reports: status=PENDING]
        │
        ▼
[Admin/Moderator vào admin-client]
        │
        ▼
[Xem ReportsPage] → Filter theo status
        │
        ▼
[Xử lý: APPROVE hoặc REJECT]
        │
        ├── APPROVE: Có thể xóa/ẩn nội dung
        │
        └── Cả hai: Ghi audit_logs → created_by=moderator_id, action, target
```

---

## 5. Đặc tả chức năng chi tiết

### 5.1 Module Authentication & Authorization

**Tổ chức code:**
- `backend/src/controllers/authController.ts` — request handler
- `backend/src/services/authService.ts` — business logic
- `backend/src/middlewares/authMiddleware.ts` — JWT verification
- `backend/src/middlewares/roleMiddleware.ts` — RBAC check

**Chức năng đặc tả:**

| Endpoint | Method | Chức năng | Auth Required |
|---------|--------|-----------|---------------|
| `/auth/register` | POST | Đăng ký, gửi OTP | Không |
| `/auth/verify-otp` | POST | Xác nhận OTP | Không |
| `/auth/login` | POST | Đăng nhập, nhận token | Không |
| `/auth/refresh` | POST | Làm mới access token | Không (dùng refresh token) |
| `/auth/logout` | POST | Xóa refresh token | Có |
| `/auth/forgot-password` | POST | Gửi OTP reset password | Không |
| `/auth/reset-password` | POST | Đổi mật khẩu qua OTP | Không |

**Bảo mật:**
- Password hash: bcrypt với salt rounds = 10
- Access token TTL: 15 phút (ngắn để giảm rủi ro stolen token)
- Refresh token TTL: 7 ngày, stored in DB → có thể revoke
- Rate limiting: Helmet + express-rate-limit trên `/auth/*`

### 5.2 Module Post Management

**Đặc tả schema nghiệp vụ:**

```
Post có thể tồn tại ở 2 chế độ:
1. Simple mode: content = plain text/markdown (use_block_layout = false)
2. Block mode: content trống, nội dung lưu trong post_blocks (use_block_layout = true)

post_blocks: mỗi block có type (TEXT/IMAGE/CODE/QUOTE) và sort_order
Ảnh trong block: lưu trong post_media với block_id reference
```

**Phân loại bài viết theo trạng thái:**

```
DRAFT ──(publish)──► PUBLISHED
                          │
                     (admin/mod)
                     ├──(hide)──► HIDDEN ──(restore)──► PUBLISHED
                     └──(delete)─► DELETED (soft delete)
```

### 5.3 Module Comment System

**Cấu trúc comment lồng nhau:**

```
Comment (root: parent_id = null)
├── Reply (parent_id = root.id)
│   └── Reply (parent_id = root.id, không lồng thêm)
└── Quote Comment (quoted_comment_id = another_comment.id)
```

> **Quyết định thiết kế:** Giới hạn 2 cấp (root + reply) thay vì lồng vô hạn — tránh UI phức tạp và giảm recursive query. Quote comment là cơ chế riêng biệt với reply.

**Business Rule:** Comment chỉ có thể chỉnh sửa trong `COMMENT_EDIT_TIME_LIMIT` giây sau khi tạo (cấu hình động qua `configController`).

### 5.4 Module Search

**Kỹ thuật:**
- PostgreSQL Full-Text Search với `tsvector/tsquery`
- Search trên cả `posts.title`, `posts.content` và `comments.content`
- Ranking theo relevance (`ts_rank`)

**Scope tìm kiếm:**

```
/search?q=keyword&type=posts    → Tìm bài viết
/search?q=keyword&type=comments → Tìm bình luận  
/search?q=keyword               → Tìm cả hai
```

### 5.5 Module Notification

**Các loại notification:**

| NotificationType | Khi nào kích hoạt | Nguồn |
|-----------------|-------------------|-------|
| COMMENT | Ai đó comment trên bài viết của user | commentService |
| REPLY | Ai đó reply comment của user | commentService |
| VOTE | Bài viết/comment của user nhận vote | voteService |
| MENTION | Ai đó @mention user trong comment | commentService |
| SYSTEM | Thông báo từ admin | adminController |

**Soft delete:** Notification có `deleted_at` field — user có thể xóa khỏi view nhưng data vẫn tồn tại.

---

## 6. Hệ thống báo cáo và kiểm soát

### 6.1 Admin Dashboard — Thông tin quản trị

**DashboardPage** (`admin-client/src/pages/DashboardPage.tsx`) hiển thị:

| Metric | Nguồn dữ liệu | Cập nhật |
|--------|--------------|---------|
| Tổng số user | `COUNT(*) FROM users` | Real-time |
| User mới hôm nay | `WHERE created_at >= today` | Real-time |
| Tổng bài viết | `COUNT(*) FROM posts WHERE status='PUBLISHED'` | Real-time |
| Bài viết mới | `WHERE created_at >= today` | Real-time |
| Tổng bình luận | `COUNT(*) FROM comments` | Real-time |
| Báo cáo chờ xử lý | `COUNT(*) FROM reports WHERE status='PENDING'` | Real-time |

### 6.2 Operational Dashboard

**OperationalDashboardPage** — metrics kỹ thuật:
- HTTP request rate (từ `metricsService.ts`)
- Error rate theo endpoint
- Response time percentiles

> **Nguồn:** `metricsMiddleware.ts` ghi lại mọi HTTP request với timing.

### 6.3 Audit Trail

**Hệ thống ghi nhật ký đầy đủ:**

Mọi hành động của Admin/Moderator đều được ghi vào `audit_logs`:

| Hành động | AuditAction | AuditTarget |
|-----------|------------|-------------|
| Admin ban user | BAN | USER |
| Admin xóa bài | DELETE | POST |
| Moderator ẩn comment | HIDE | COMMENT |
| Admin approve report | APPROVE_REPORT | REPORT |
| Admin thay đổi category | UPDATE | CATEGORY |
| Admin thay đổi config | UPDATE | CONFIG |

**Audit log record** lưu cả `old_value` và `new_value` (JSON) → cho phép trace lại mọi thay đổi.

### 6.4 Report Management Workflow

```
Member gửi báo cáo
        │
        ▼
reports.status = PENDING
        │
        ▼ (Admin/Mod vào ReportsPage)
[Filter: PENDING reports]
        │
        ▼
[Review: xem content bị report, xem lịch sử reporter]
        │
     APPROVE           REJECT
        │                 │
        ▼                 ▼
reports.status      reports.status
= APPROVED          = REJECTED
        │
   (Tuỳ chọn)
Action trên content:
- Xóa bài viết
- Ẩn comment
- Ban user
        │
        ▼
[Ghi audit_log cho từng action]
```

---

## 7. Đánh giá và kết luận

### 7.1 Đánh giá thiết kế dữ liệu

**Điểm mạnh:**
- Schema normalized đúng chuẩn 3NF cho hầu hết entities
- Denormalization có mục đích: `upvote_count`, `comment_count`, `post_count` tránh COUNT query heavy
- Self-referencing trên `comments` xử lý đúng cho nested comments
- Prisma ORM với migration versioned → audit trail schema evolution

**Điểm cần lưu ý:**
- `avatar_url` deprecated nhưng còn trong schema → cần migration script (`migrateAvatarUrls.ts` đã có)
- `user_content_context` trong vibe-content schema phục vụ AI context tracking — cần đảm bảo không expose sang forum API

### 7.2 Phân tích luồng thông tin theo giai đoạn phát triển

| Sprint | Luồng thông tin được xây dựng |
|--------|------------------------------|
| Sprint 0 | ERD thiết kế, xác định entity chính |
| Sprint 1 | Luồng Auth: input form → validate → hash → JWT → cookie |
| Sprint 2 | Luồng CRUD Post/Comment, Category taxonomy |
| Sprint 3 | Luồng Vote → Reputation, SSE notification pipeline |
| Sprint 4 | Luồng Audit: mọi admin action → audit_logs |
| Sprint 5 | Luồng AI: prompt → LLM → validate → post via API |

### 7.3 Kết luận

MINI-FORUM là hệ thống thông tin quản lí cộng đồng có thiết kế rõ ràng về phân lớp trách nhiệm:
- **Lớp nghiệp vụ:** 28+ use case bao quát đầy đủ vòng đời nội dung và người dùng
- **Lớp dữ liệu:** 19 entity với schema được normalize và có migration history
- **Lớp luồng thông tin:** Mọi dữ liệu đi qua validation layer → business layer → persistence, không có bypass
- **Lớp kiểm soát:** Audit trail đầy đủ, report workflow, permission-aware data access

---

## PHỤ LỤC

### A. Prisma Schema — Danh sách 19 Models

| # | Model | Vai trò |
|---|-------|---------|
| 1 | `users` | Tài khoản người dùng, authentication |
| 2 | `posts` | Bài viết diễn đàn |
| 3 | `comments` | Bình luận (self-ref) |
| 4 | `categories` | Danh mục bài viết |
| 5 | `tags` | Thẻ phân loại |
| 6 | `post_tags` | Quan hệ N:M posts-tags |
| 7 | `post_blocks` | Block layout cho posts |
| 8 | `post_media` | Media files trong posts |
| 9 | `votes` | Lịch sử vote |
| 10 | `bookmarks` | Bookmark bài viết |
| 11 | `notifications` | Thông báo người dùng |
| 12 | `reports` | Báo cáo vi phạm |
| 13 | `user_blocks` | Chặn người dùng |
| 14 | `audit_logs` | Nhật ký hành động quản trị |
| 15 | `refresh_tokens` | JWT refresh token management |
| 16 | `otp_tokens` | OTP cho email verification |
| 17 | `user_content_context` | Context tracking cho AI bot |

### B. API Endpoints — Nhóm theo nghiệp vụ

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
