# 📊 Database Schema Documentation

## Tổng quan

Dự án **DA Mini Forum** sử dụng **PostgreSQL** làm cơ sở dữ liệu chính, với **Prisma ORM** để quản lý schema và migrations.

### Thông tin kỹ thuật

| Thuộc tính | Giá trị |
|------------|---------|
| Database | PostgreSQL |
| ORM | Prisma |
| Schema Location | `backend/prisma/schema.prisma` |
| Migrations | `backend/prisma/migrations/` |

---

## 📋 Danh sách các bảng

| STT | Tên bảng | Mô tả |
|-----|----------|-------|
| 1 | `users` | Thông tin người dùng |
| 2 | `categories` | Danh mục bài viết |
| 3 | `tags` | Thẻ/nhãn cho bài viết |
| 4 | `posts` | Bài viết |
| 5 | `post_tags` | Quan hệ nhiều-nhiều Post ↔ Tag |
| 6 | `comments` | Bình luận |
| 7 | `refresh_tokens` | Token làm mới phiên đăng nhập |
| 8 | `votes` | Phiếu bầu (upvote/downvote) |
| 9 | `bookmarks` | Lưu bài viết yêu thích |
| 10 | `notifications` | Thông báo |
| 11 | `user_blocks` | Chặn người dùng |
| 12 | `reports` | Báo cáo vi phạm |

---

## 🔢 Enums (Kiểu liệt kê)

### Role - Vai trò người dùng
| Giá trị | Mô tả |
|---------|-------|
| `MEMBER` | Thành viên thường |
| `MODERATOR` | Người kiểm duyệt |
| `ADMIN` | Quản trị viên |

### PostStatus - Trạng thái bài viết
| Giá trị | Mô tả |
|---------|-------|
| `DRAFT` | Bản nháp |
| `PUBLISHED` | Đã xuất bản |
| `HIDDEN` | Ẩn |
| `DELETED` | Đã xóa |

### CommentStatus - Trạng thái bình luận
| Giá trị | Mô tả |
|---------|-------|
| `VISIBLE` | Hiển thị |
| `HIDDEN` | Ẩn |
| `DELETED` | Đã xóa |

### VoteTarget - Đối tượng bỏ phiếu
| Giá trị | Mô tả |
|---------|-------|
| `POST` | Bài viết |
| `COMMENT` | Bình luận |

### NotificationType - Loại thông báo
| Giá trị | Mô tả |
|---------|-------|
| `NEW_COMMENT` | Có bình luận mới |
| `REPLY` | Có phản hồi |
| `VOTE` | Có vote mới |
| `MENTION` | Được đề cập |
| `SYSTEM` | Thông báo hệ thống |

### ReportTarget - Đối tượng báo cáo
| Giá trị | Mô tả |
|---------|-------|
| `USER` | Người dùng |
| `POST` | Bài viết |
| `COMMENT` | Bình luận |

### ReportStatus - Trạng thái báo cáo
| Giá trị | Mô tả |
|---------|-------|
| `PENDING` | Đang chờ xử lý |
| `REVIEWED` | Đã xem xét |
| `RESOLVED` | Đã giải quyết |
| `REJECTED` | Đã từ chối |

---

## 📝 Chi tiết các bảng

### 1. `users` - Người dùng

Lưu trữ thông tin tài khoản và hồ sơ người dùng.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID người dùng |
| `email` | VARCHAR | UNIQUE, NOT NULL | Email đăng nhập |
| `username` | VARCHAR | UNIQUE, NOT NULL | Tên người dùng |
| `password_hash` | VARCHAR | NOT NULL | Mật khẩu đã mã hóa |
| `display_name` | VARCHAR | NULL | Tên hiển thị |
| `avatar_url` | VARCHAR | NULL | URL ảnh đại diện |
| `bio` | TEXT | NULL | Tiểu sử |
| `date_of_birth` | DATETIME | NULL | Ngày sinh |
| `gender` | VARCHAR | NULL | Giới tính |
| `role` | ENUM(Role) | DEFAULT 'MEMBER' | Vai trò |
| `reputation` | INT | DEFAULT 0 | Điểm uy tín |
| `is_verified` | BOOLEAN | DEFAULT false | Đã xác thực email |
| `is_active` | BOOLEAN | DEFAULT true | Tài khoản hoạt động |
| `last_active_at` | DATETIME | NULL | Hoạt động lần cuối |
| `username_changed_at` | DATETIME | NULL | Lần đổi username cuối |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |
| `updated_at` | DATETIME | AUTO | Ngày cập nhật |

**Quan hệ:**
- 1-N với `refresh_tokens`
- 1-N với `posts` (tác giả)
- 1-N với `comments` (tác giả)
- 1-N với `votes`
- 1-N với `bookmarks`
- 1-N với `notifications`
- 1-N với `user_blocks` (chặn/bị chặn)
- 1-N với `reports`

---

### 2. `categories` - Danh mục

Phân loại bài viết theo chủ đề.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID danh mục |
| `name` | VARCHAR | NOT NULL | Tên danh mục |
| `slug` | VARCHAR | UNIQUE, NOT NULL | Slug URL-friendly |
| `description` | TEXT | NULL | Mô tả |
| `icon` | VARCHAR | NULL | Icon (emoji/class) |
| `color` | VARCHAR | NULL | Mã màu |
| `sort_order` | INT | DEFAULT 0 | Thứ tự sắp xếp |
| `post_count` | INT | DEFAULT 0 | Số bài viết (cache) |
| `is_active` | BOOLEAN | DEFAULT true | Đang hoạt động |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |
| `updated_at` | DATETIME | AUTO | Ngày cập nhật |

**Quan hệ:**
- 1-N với `posts`

---

### 3. `tags` - Thẻ

Nhãn/tag để gắn vào bài viết.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID tag |
| `name` | VARCHAR | NOT NULL | Tên tag |
| `slug` | VARCHAR | UNIQUE, NOT NULL | Slug URL-friendly |
| `description` | TEXT | NULL | Mô tả |
| `usage_count` | INT | DEFAULT 0 | Số lần sử dụng (cache) |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |
| `updated_at` | DATETIME | AUTO | Ngày cập nhật |

**Quan hệ:**
- N-N với `posts` (qua `post_tags`)

---

### 4. `posts` - Bài viết

Lưu trữ các bài đăng trên forum.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID bài viết |
| `title` | VARCHAR | NOT NULL | Tiêu đề |
| `slug` | VARCHAR | UNIQUE, NOT NULL | Slug URL-friendly |
| `content` | TEXT | NOT NULL | Nội dung (HTML/Markdown) |
| `excerpt` | TEXT | NULL | Tóm tắt |
| `author_id` | INT | FK → users.id | ID tác giả |
| `category_id` | INT | FK → categories.id | ID danh mục |
| `view_count` | INT | DEFAULT 0 | Lượt xem |
| `upvote_count` | INT | DEFAULT 0 | Số upvote |
| `downvote_count` | INT | DEFAULT 0 | Số downvote |
| `comment_count` | INT | DEFAULT 0 | Số bình luận |
| `status` | ENUM(PostStatus) | DEFAULT 'PUBLISHED' | Trạng thái |
| `is_pinned` | BOOLEAN | DEFAULT false | Ghim bài viết |
| `is_locked` | BOOLEAN | DEFAULT false | Khóa bình luận |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |
| `updated_at` | DATETIME | AUTO | Ngày cập nhật |

**Index:**
- `author_id`
- `category_id`
- `status`
- `created_at`

**Quan hệ:**
- N-1 với `users` (tác giả)
- N-1 với `categories`
- N-N với `tags` (qua `post_tags`)
- 1-N với `comments`
- 1-N với `bookmarks`

---

### 5. `post_tags` - Quan hệ Post ↔ Tag

Bảng trung gian cho quan hệ nhiều-nhiều.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `post_id` | INT | PK, FK → posts.id | ID bài viết |
| `tag_id` | INT | PK, FK → tags.id | ID tag |

**Composite Primary Key:** (`post_id`, `tag_id`)

**On Delete:** CASCADE

---

### 6. `comments` - Bình luận

Bình luận trên bài viết, hỗ trợ nested replies.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID bình luận |
| `content` | TEXT | NOT NULL | Nội dung |
| `author_id` | INT | FK → users.id | ID tác giả |
| `post_id` | INT | FK → posts.id | ID bài viết |
| `parent_id` | INT | FK → comments.id, NULL | ID comment cha (reply) |
| `quoted_comment_id` | INT | FK → comments.id, NULL | ID comment được trích dẫn |
| `upvote_count` | INT | DEFAULT 0 | Số upvote |
| `downvote_count` | INT | DEFAULT 0 | Số downvote |
| `status` | ENUM(CommentStatus) | DEFAULT 'VISIBLE' | Trạng thái |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |
| `updated_at` | DATETIME | AUTO | Ngày cập nhật |

**Index:**
- `author_id`
- `post_id`
- `parent_id`

**Quan hệ:**
- N-1 với `users` (tác giả)
- N-1 với `posts`
- N-1 với `comments` (self-relation: parent)
- 1-N với `comments` (self-relation: replies)
- N-1 với `comments` (quoted comment)

---

### 7. `refresh_tokens` - Token làm mới

Quản lý JWT refresh tokens.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID token |
| `token` | VARCHAR | UNIQUE, NOT NULL | Giá trị token |
| `user_id` | INT | FK → users.id | ID người dùng |
| `expires_at` | DATETIME | NOT NULL | Thời điểm hết hạn |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |

**Index:**
- `user_id`
- `token`

**On Delete:** CASCADE

---

### 8. `votes` - Phiếu bầu

Lưu upvote/downvote cho posts và comments.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID vote |
| `user_id` | INT | FK → users.id | ID người bỏ phiếu |
| `target_type` | ENUM(VoteTarget) | NOT NULL | Loại đối tượng (POST/COMMENT) |
| `target_id` | INT | NOT NULL | ID đối tượng |
| `vote_type` | INT | NOT NULL | 1 = upvote, -1 = downvote |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |

**Unique Constraint:** (`user_id`, `target_type`, `target_id`)

**Index:**
- `user_id`
- (`target_type`, `target_id`)

> **Note:** Sử dụng polymorphic pattern - `target_id` tham chiếu đến Post hoặc Comment tùy thuộc vào `target_type`.

---

### 9. `bookmarks` - Đánh dấu

Lưu bài viết yêu thích của người dùng.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `user_id` | INT | PK, FK → users.id | ID người dùng |
| `post_id` | INT | PK, FK → posts.id | ID bài viết |
| `created_at` | DATETIME | DEFAULT now() | Ngày lưu |

**Composite Primary Key:** (`user_id`, `post_id`)

**Index:**
- `user_id`
- `post_id`

**On Delete:** CASCADE

---

### 10. `notifications` - Thông báo

Hệ thống thông báo cho người dùng.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID thông báo |
| `user_id` | INT | FK → users.id | ID người nhận |
| `type` | ENUM(NotificationType) | NOT NULL | Loại thông báo |
| `content` | VARCHAR | NOT NULL | Nội dung thông báo |
| `reference_type` | VARCHAR | NULL | Loại đối tượng liên quan |
| `reference_id` | INT | NULL | ID đối tượng liên quan |
| `is_read` | BOOLEAN | DEFAULT false | Đã đọc |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |

**Index:**
- `user_id`
- `is_read`
- `created_at`

**On Delete:** CASCADE

---

### 11. `user_blocks` - Chặn người dùng

Quản lý việc chặn giữa các người dùng.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `blocker_id` | INT | PK, FK → users.id | ID người chặn |
| `blocked_id` | INT | PK, FK → users.id | ID người bị chặn |
| `created_at` | DATETIME | DEFAULT now() | Ngày chặn |

**Composite Primary Key:** (`blocker_id`, `blocked_id`)

**On Delete:** CASCADE

---

### 12. `reports` - Báo cáo vi phạm

Báo cáo nội dung/người dùng vi phạm.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | ID báo cáo |
| `reporter_id` | INT | FK → users.id | ID người báo cáo |
| `target_type` | ENUM(ReportTarget) | NOT NULL | Loại đối tượng |
| `target_id` | INT | NOT NULL | ID đối tượng |
| `reason` | VARCHAR | NOT NULL | Lý do |
| `description` | TEXT | NULL | Mô tả chi tiết |
| `status` | ENUM(ReportStatus) | DEFAULT 'PENDING' | Trạng thái |
| `reviewed_by` | INT | FK → users.id, NULL | ID người xem xét |
| `reviewed_at` | DATETIME | NULL | Thời điểm xem xét |
| `created_at` | DATETIME | DEFAULT now() | Ngày tạo |

**Index:**
- `reporter_id`
- `status`
- (`target_type`, `target_id`)

---

## 🔗 Sơ đồ quan hệ (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │   categories    │     │      tags       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ email           │     │ name            │     │ name            │
│ username        │     │ slug            │     │ slug            │
│ password_hash   │     │ description     │     │ description     │
│ display_name    │     │ icon            │     │ usage_count     │
│ role            │     │ color           │     └────────┬────────┘
│ reputation      │     │ post_count      │              │
└────────┬────────┘     └────────┬────────┘              │
         │                       │                       │
         │ 1                     │ 1                     │ N
         │                       │                       │
         ▼ N                     ▼ N                     ▼
┌─────────────────┐◄────────────────────────────┐     ┌─────────────────┐
│     posts       │                             │     │   post_tags     │
├─────────────────┤                             │     ├─────────────────┤
│ id (PK)         │                             │     │ post_id (PK,FK) │
│ title           │                             │     │ tag_id (PK,FK)  │
│ slug            │                             │     └─────────────────┘
│ content         │                             │
│ author_id (FK)──┼─────────────────────────────┘
│ category_id(FK) │
│ view_count      │
│ upvote_count    │
│ status          │
└────────┬────────┘
         │ 1
         │
         ▼ N
┌─────────────────┐     ┌─────────────────┐
│    comments     │     │ refresh_tokens  │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ content         │     │ token           │
│ author_id (FK)  │     │ user_id (FK)    │
│ post_id (FK)    │     │ expires_at      │
│ parent_id (FK)  │     └─────────────────┘
│ status          │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     votes       │     │   bookmarks     │     │ notifications   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ user_id (PK,FK) │     │ id (PK)         │
│ user_id (FK)    │     │ post_id (PK,FK) │     │ user_id (FK)    │
│ target_type     │     │ created_at      │     │ type            │
│ target_id       │     └─────────────────┘     │ content         │
│ vote_type       │                             │ is_read         │
└─────────────────┘                             └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  user_blocks    │     │    reports      │
├─────────────────┤     ├─────────────────┤
│ blocker_id(PK)  │     │ id (PK)         │
│ blocked_id(PK)  │     │ reporter_id(FK) │
│ created_at      │     │ target_type     │
└─────────────────┘     │ target_id       │
                        │ reason          │
                        │ status          │
                        └─────────────────┘
```

---

## 🚀 Lệnh Prisma thường dùng

```bash
# Xem schema hiện tại
npx prisma db pull

# Tạo migration mới
npx prisma migrate dev --name <migration_name>

# Áp dụng migrations (production)
npx prisma migrate deploy

# Reset database (xóa tất cả dữ liệu)
npx prisma migrate reset

# Seed dữ liệu mẫu
npx prisma db seed

# Mở Prisma Studio (GUI)
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

---

## 📌 Ghi chú thiết kế

### 1. Polymorphic Relations
- Bảng `votes` và `reports` sử dụng pattern polymorphic với cột `target_type` và `target_id` để tham chiếu đến nhiều bảng khác nhau.

### 2. Counter Cache
- Các cột như `post_count`, `usage_count`, `upvote_count`, `comment_count` là counter cache để tối ưu hiệu năng query.

### 3. Soft Delete
- Sử dụng `status` với giá trị `DELETED` thay vì xóa thực sự để giữ lịch sử.

### 4. Self-referencing
- Bảng `comments` có self-relation để hỗ trợ nested replies (parent-child).

### 5. Slug
- Tất cả các entity công khai (posts, categories, tags) đều có `slug` unique để tạo URL thân thiện.

---

*Cập nhật lần cuối: 30/01/2026*
