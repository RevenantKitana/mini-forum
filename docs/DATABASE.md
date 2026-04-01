# Database Schema — Mini Forum

Database: **PostgreSQL** via **Prisma ORM**

## Sơ đồ quan hệ (ER Diagram)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  users   │────▶│  posts   │────▶│categories│
│          │     │          │     │          │
│ id       │     │ id       │     │ id       │
│ email    │     │ title    │     │ name     │
│ username │     │ slug     │     │ slug     │
│ role     │     │ content  │     │ color    │
│ reputation│    │ author_id│     │ sort_order│
└──────┬───┘     │ category_│     └──────────┘
       │         │ status   │
       │         └────┬─────┘
       │              │
       │    ┌─────────┴─────────┐
       │    │                   │
       │    ▼                   ▼
       │ ┌──────────┐    ┌──────────┐
       │ │ comments │    │post_tags │──▶┌──────┐
       │ │          │    │          │   │ tags │
       │ │ id       │    │ post_id  │   │      │
       │ │ content  │    │ tag_id   │   │ id   │
       │ │ post_id  │    └──────────┘   │ name │
       │ │ author_id│                   │ slug │
       │ │ parent_id│                   └──────┘
       │ └──────────┘
       │
       ├──▶ votes
       ├──▶ bookmarks
       ├──▶ notifications
       ├──▶ reports
       ├──▶ user_blocks
       ├──▶ refresh_tokens
       ├──▶ audit_logs
       └──▶ user_content_context
```

## Models

### users

Tài khoản người dùng với hệ thống phân quyền RBAC.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `email` | String | Unique | Email đăng nhập |
| `username` | String | Unique | Tên tài khoản |
| `password_hash` | String | - | bcrypt hash |
| `display_name` | String | - | Tên hiển thị |
| `avatar_url` | String? | - | URL avatar |
| `bio` | String? | - | Tiểu sử |
| `date_of_birth` | DateTime? | - | Ngày sinh |
| `gender` | String? | - | Giới tính |
| `role` | Role | Default: MEMBER | Vai trò |
| `reputation` | Int | Default: 0 | Điểm uy tín |
| `is_verified` | Boolean | Default: false | Đã xác thực email |
| `is_active` | Boolean | Default: true | Tài khoản hoạt động |
| `last_active_at` | DateTime? | - | Lần hoạt động cuối |
| `username_changed_at` | DateTime? | - | Lần đổi username cuối |
| `created_at` | DateTime | Default: now() | Ngày tạo |
| `updated_at` | DateTime | Auto-update | Ngày cập nhật |

**Relations**: posts, comments, votes, bookmarks, notifications, refreshTokens, reports, blocks, blockBy, auditLogs, contentContext

**Indexes**: `email` (unique), `username` (unique)

---

### posts

Bài viết diễn đàn với hỗ trợ Markdown, voting, pinning.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `title` | String | - | Tiêu đề |
| `slug` | String | Unique | URL-friendly slug |
| `content` | String | - | Nội dung (Markdown) |
| `excerpt` | String? | - | Tóm tắt |
| `author_id` | Int | FK → users.id | Tác giả |
| `category_id` | Int | FK → categories.id | Danh mục |
| `status` | PostStatus | Default: PUBLISHED | Trạng thái |
| `view_count` | Int | Default: 0 | Lượt xem |
| `upvote_count` | Int | Default: 0 | Số upvote |
| `downvote_count` | Int | Default: 0 | Số downvote |
| `comment_count` | Int | Default: 0 | Số bình luận |
| `is_pinned` | Boolean | Default: false | Đã ghim |
| `pin_type` | PinType? | - | GLOBAL hoặc CATEGORY |
| `pin_order` | Int? | - | Thứ tự ghim |
| `is_locked` | Boolean | Default: false | Khóa bình luận |
| `created_at` | DateTime | Default: now() | Ngày tạo |
| `updated_at` | DateTime | Auto-update | Ngày cập nhật |

**Relations**: author (users), category, tags (post_tags), comments, bookmarks, votes

**Indexes**: `slug` (unique), `author_id`, `category_id`, `status`

---

### comments

Bình luận lồng nhau với reply chains và quote.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `content` | String | - | Nội dung |
| `author_id` | Int | FK → users.id | Tác giả |
| `post_id` | Int | FK → posts.id | Bài viết |
| `parent_id` | Int? | FK → comments.id (self) | Comment cha (reply) |
| `quoted_comment_id` | Int? | FK → comments.id | Comment được trích dẫn |
| `status` | CommentStatus | Default: VISIBLE | Trạng thái |
| `upvote_count` | Int | Default: 0 | Số upvote |
| `downvote_count` | Int | Default: 0 | Số downvote |
| `is_edited` | Boolean | Default: false | Đã chỉnh sửa |
| `is_content_masked` | Boolean | Default: false | Nội dung bị ẩn (admin mask) |
| `created_at` | DateTime | Default: now() | Ngày tạo |
| `updated_at` | DateTime | Auto-update | Ngày cập nhật |

**Relations**: author (users), post, parent (self-ref), replies (self-ref), quotedComment, votes

**Indexes**: `post_id`, `author_id`, `parent_id`

---

### categories

Danh mục diễn đàn với hệ thống phân quyền riêng.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `name` | String | - | Tên danh mục |
| `slug` | String | Unique | URL slug |
| `description` | String? | - | Mô tả |
| `color` | String? | - | Mã màu hex |
| `sort_order` | Int | Default: 0 | Thứ tự hiển thị |
| `post_count` | Int | Default: 0 | Số bài viết |
| `is_active` | Boolean | Default: true | Đang hoạt động |
| `view_permission` | PermissionLevel | Default: ALL | Quyền xem |
| `post_permission` | PermissionLevel | Default: MEMBER | Quyền đăng bài |
| `comment_permission` | PermissionLevel | Default: MEMBER | Quyền bình luận |
| `created_at` | DateTime | Default: now() | Ngày tạo |
| `updated_at` | DateTime | Auto-update | Ngày cập nhật |

**Relations**: posts

---

### tags

Tags phân loại nội dung.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `name` | String | - | Tên tag |
| `slug` | String | Unique | URL slug |
| `description` | String? | - | Mô tả |
| `usage_count` | Int | Default: 0 | Số lần sử dụng |
| `is_active` | Boolean | Default: true | Đang hoạt động |
| `use_permission` | PermissionLevel | Default: ALL | Quyền sử dụng |
| `created_at` | DateTime | Default: now() | Ngày tạo |
| `updated_at` | DateTime | Auto-update | Ngày cập nhật |

**Relations**: posts (post_tags)

---

### post_tags

Bảng liên kết many-to-many giữa posts và tags.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `post_id` | Int | FK → posts.id | Bài viết |
| `tag_id` | Int | FK → tags.id | Tag |

**Primary Key**: `[post_id, tag_id]`

---

### votes

Hệ thống upvote/downvote cho cả bài viết và bình luận.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `userId` | Int | FK → users.id | Người vote |
| `targetType` | VoteTarget | - | `POST` hoặc `COMMENT` |
| `targetId` | Int | - | ID bài viết hoặc bình luận |
| `value` | Int | - | `1` (upvote) hoặc `-1` (downvote) |
| `created_at` | DateTime | Default: now() | Ngày tạo |
| `updated_at` | DateTime | Auto-update | Ngày cập nhật |

**Unique**: `[userId, targetType, targetId]` — mỗi user chỉ vote 1 lần per target

---

### bookmarks

Bài viết đã lưu.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `userId` | Int | FK → users.id | Người lưu |
| `postId` | Int | FK → posts.id | Bài viết |
| `created_at` | DateTime | Default: now() | Ngày lưu |

**Unique**: `[userId, postId]`

---

### notifications

Thông báo hoạt động.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `userId` | Int | FK → users.id | Người nhận |
| `type` | NotificationType | - | Loại thông báo |
| `title` | String | - | Tiêu đề |
| `content` | String? | - | Nội dung |
| `relatedId` | Int? | - | ID đối tượng liên quan |
| `relatedType` | String? | - | Loại đối tượng |
| `isRead` | Boolean | Default: false | Đã đọc |
| `deleted_at` | DateTime? | - | Soft delete |
| `created_at` | DateTime | Default: now() | Ngày tạo |

---

### reports

Báo cáo vi phạm (user, post, comment).

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `reporterId` | Int | FK → users.id | Người báo cáo |
| `targetType` | ReportTarget | - | `USER`, `POST`, `COMMENT` |
| `targetId` | Int | - | ID đối tượng |
| `reason` | String | - | Lý do |
| `description` | String? | - | Mô tả chi tiết |
| `status` | ReportStatus | Default: PENDING | Trạng thái xử lý |
| `reviewedBy` | Int? | FK → users.id | Admin xử lý |
| `reviewedAt` | DateTime? | - | Thời điểm xử lý |
| `reviewNote` | String? | - | Ghi chú xử lý |
| `created_at` | DateTime | Default: now() | Ngày tạo |
| `updated_at` | DateTime | Auto-update | Ngày cập nhật |

---

### user_blocks

Hệ thống chặn người dùng.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `blockerId` | Int | FK → users.id | Người chặn |
| `blockedId` | Int | FK → users.id | Người bị chặn |
| `created_at` | DateTime | Default: now() | Ngày chặn |

**Unique**: `[blockerId, blockedId]`

---

### refresh_tokens

JWT refresh tokens cho quản lý phiên đăng nhập.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `token` | String | Unique | Refresh token |
| `userId` | Int | FK → users.id | Người dùng |
| `expiresAt` | DateTime | - | Thời điểm hết hạn |
| `created_at` | DateTime | Default: now() | Ngày tạo |

---

### audit_logs

Nhật ký hành động quản trị.

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `user_id` | Int | FK → users.id | Admin thực hiện |
| `action` | AuditAction | - | Loại hành động |
| `targetType` | AuditTarget | - | Loại đối tượng |
| `target_id` | String | - | ID đối tượng |
| `old_value` | Json? | - | Giá trị cũ |
| `new_value` | Json? | - | Giá trị mới |
| `ip_address` | String? | - | Địa chỉ IP |
| `user_agent` | String? | - | User agent |
| `created_at` | DateTime | Default: now() | Ngày tạo |

**Indexes**: `action`, `created_at`, `[targetType, target_id]`, `user_id`

---

### user_content_context

Context cá nhân hóa cho bot users (Vibe Content Service).

| Column | Type | Constraints | Mô tả |
|---|---|---|---|
| `id` | Int | PK, auto-increment | ID |
| `user_id` | Int | FK → users.id, Unique | Bot user |
| `personality` | Json? | - | Personality vectors |
| `last_posts` | Json? | - | Bài viết gần đây |
| `last_comments` | Json? | - | Bình luận gần đây |
| `action_count` | Int | Default: 0 | Số actions đã thực hiện |
| `created_at` | DateTime | Default: now() | Ngày tạo |
| `updated_at` | DateTime | Auto-update | Ngày cập nhật |

---

## Enums

### Role

| Giá trị | Mô tả |
|---|---|
| `MEMBER` | Thành viên thường |
| `MODERATOR` | Quản trị viên nội dung |
| `ADMIN` | Quản trị viên hệ thống |
| `BOT` | Bot tự động |

### PostStatus

| Giá trị | Mô tả |
|---|---|
| `DRAFT` | Bản nháp |
| `PUBLISHED` | Đã xuất bản |
| `HIDDEN` | Đã ẩn (bởi mod/admin) |
| `DELETED` | Đã xóa |

### CommentStatus

| Giá trị | Mô tả |
|---|---|
| `VISIBLE` | Hiển thị |
| `HIDDEN` | Đã ẩn |
| `DELETED` | Đã xóa |

### PinType

| Giá trị | Mô tả |
|---|---|
| `GLOBAL` | Ghim toàn diễn đàn |
| `CATEGORY` | Ghim trong danh mục |

### VoteTarget

| Giá trị | Mô tả |
|---|---|
| `POST` | Vote bài viết |
| `COMMENT` | Vote bình luận |

### ReportTarget

| Giá trị | Mô tả |
|---|---|
| `USER` | Báo cáo người dùng |
| `POST` | Báo cáo bài viết |
| `COMMENT` | Báo cáo bình luận |

### ReportStatus

| Giá trị | Mô tả |
|---|---|
| `PENDING` | Chờ xử lý |
| `REVIEWING` | Đang xem xét |
| `RESOLVED` | Đã xử lý |
| `DISMISSED` | Đã bác bỏ |

### NotificationType

| Giá trị | Mô tả |
|---|---|
| `COMMENT` | Bình luận mới trên bài viết |
| `REPLY` | Reply bình luận |
| `MENTION` | Được nhắc đến |
| `UPVOTE` | Được upvote |
| `SYSTEM` | Thông báo hệ thống |

### PermissionLevel

| Giá trị | Mô tả |
|---|---|
| `ALL` | Tất cả (kể cả khách) |
| `MEMBER` | Yêu cầu đăng nhập |
| `MODERATOR` | Yêu cầu Moderator+ |
| `ADMIN` | Yêu cầu Admin |

### AuditAction

| Giá trị | Mô tả |
|---|---|
| `CREATE` | Tạo mới |
| `UPDATE` | Cập nhật |
| `DELETE` | Xóa |
| `LOGIN` | Đăng nhập |
| `LOGOUT` | Đăng xuất |
| `PIN` | Ghim bài viết |
| `UNPIN` | Bỏ ghim |
| `LOCK` | Khóa bình luận |
| `UNLOCK` | Mở khóa |
| `HIDE` | Ẩn nội dung |
| `SHOW` | Hiện nội dung |
| `BAN` | Cấm tài khoản |
| `UNBAN` | Mở cấm |
| `ROLE_CHANGE` | Thay đổi role |
| `VIEW_MASKED_CONTENT` | Xem nội dung ẩn |

### AuditTarget

| Giá trị | Mô tả |
|---|---|
| `USER` | Người dùng |
| `POST` | Bài viết |
| `COMMENT` | Bình luận |
| `CATEGORY` | Danh mục |
| `TAG` | Tag |
| `REPORT` | Báo cáo |
| `SETTINGS` | Cài đặt |

### OtpPurpose

| Giá trị | Mô tả |
|---|---|
| `REGISTER` | Đăng ký |
| `RESET_PASSWORD` | Reset mật khẩu |

## Migration History

| Migration | Ngày | Mô tả |
|---|---|---|
| `20260210050735_init` | 2026-02-10 | Schema khởi tạo |
| `20260304043512_` | 2026-03-04 | Cập nhật schema |
| `20260326052535_add_bot_role` | 2026-03-26 | Thêm role BOT vào enum |
| `20260326095131_add_user_content_context` | 2026-03-26 | Thêm bảng user_content_context |
