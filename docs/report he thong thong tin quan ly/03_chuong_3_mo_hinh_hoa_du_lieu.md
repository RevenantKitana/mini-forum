# CHƯƠNG 3
# MÔ HÌNH HÓA DỮ LIỆU

---

## 3.1 Entity-Relationship Diagram (ERD)

### 3.1.1 Tổng quan các thực thể

Hệ thống MINI-FORUM có **17 Model** trong Prisma Schema, tổ chức xoay quanh trục trung tâm là entity `USERS` và `POSTS`.

**Bảng 3.1 — Danh sách 17 Model trong Prisma Schema**

| STT | Model | Kiểu quan hệ | Vai trò nghiệp vụ |
|-----|-------|-------------|-----------------|
| 1 | `users` | Root entity | Tài khoản người dùng, xác thực |
| 2 | `posts` | Nhiều → 1 (users, categories) | Bài viết diễn đàn |
| 3 | `comments` | Nhiều → 1 (users, posts); Self-ref | Bình luận (lồng 2 cấp) |
| 4 | `categories` | 1 → Nhiều (posts) | Danh mục phân loại bài viết |
| 5 | `tags` | N:M với posts (qua post_tags) | Thẻ phân loại |
| 6 | `post_tags` | Junction table (posts ↔ tags) | Quan hệ N:M bài viết-thẻ |
| 7 | `post_blocks` | Nhiều → 1 (posts) | Nội dung dạng block (TEXT/IMAGE/CODE/QUOTE) |
| 8 | `post_media` | Nhiều → 1 (posts, post_blocks) | File media trong bài viết |
| 9 | `votes` | Nhiều → 1 (users); Polymorphic | Vote upvote/downvote |
| 10 | `bookmarks` | Nhiều → 1 (users, posts) | Bookmark bài viết |
| 11 | `notifications` | Nhiều → 1 (users) | Thông báo người dùng |
| 12 | `reports` | Nhiều → 1 (users); Polymorphic | Báo cáo nội dung vi phạm |
| 13 | `user_blocks` | Nhiều → 1 (users×2) | Chặn người dùng |
| 14 | `audit_logs` | Nhiều → 1 (users) | Nhật ký hành động quản trị |
| 15 | `refresh_tokens` | Nhiều → 1 (users) | JWT refresh token management |
| 16 | `otp_tokens` | Nhiều → 1 (users) | OTP cho email verification |
| 17 | `user_content_context` | 1 → 1 (users) | Context tracking cho AI bot |

### 3.1.2 ERD Tổng thể

**Hình 3.1 — Entity-Relationship Diagram tổng thể**

```
                           ┌──────────────┐
                           │  categories  │
                           │─────────────│
                           │ id (PK)      │
                           │ name         │
                           │ slug (UQ)    │
                           │ view_perm    │
                           │ post_perm    │
                           │ comment_perm │
                           │ post_count   │
                           └──────┬───────┘
                                  │ 1
                                  │ contains
                                  │ N
    ┌──────────────┐       ┌──────┴───────┐       ┌──────────────┐
    │    tags      │  N:M  │    posts     │  1:N  │ post_blocks  │
    │─────────────│◄──────│─────────────│──────►│─────────────│
    │ id (PK)      │post_  │ id (PK)      │       │ id (PK)      │
    │ name         │tags   │ title        │       │ type         │
    │ slug (UQ)    │       │ slug (UQ)    │       │ content      │
    │ usage_count  │       │ content      │       │ sort_order   │
    └──────────────┘       │ author_id(FK)│       └──────┬───────┘
                           │ category_id  │              │ 1:N
                           │ view_count   │       ┌──────┴───────┐
                           │ upvote_count │       │  post_media  │
                           │ downvote_cnt │       │─────────────│
                           │ comment_cnt  │       │ id (PK)      │
                           │ status       │       │ imagekit_id  │
                           │ is_pinned    │       │ preview_url  │
                           │ is_locked    │       │ standard_url │
                           │ use_block_ly │       └──────────────┘
                           └──────┬───────┘
                                  │ N
                                  │ writes
                                  │ 1
     ┌────────────────────────────┴────────────────────────────────┐
     │                          users                              │
     │─────────────────────────────────────────────────────────────│
     │ id (PK) │ email (UQ) │ username (UQ) │ password_hash        │
     │ display_name │ avatar_preview_url │ avatar_standard_url      │
     │ role (MEMBER/MODERATOR/ADMIN/BOT)                           │
     │ reputation │ is_verified │ is_active │ is_banned(implicit)  │
     └────┬──────────┬─────────┬──────────┬────────────┬───────────┘
          │          │         │          │            │
          │1:N       │1:N      │1:N       │1:N         │1:1
          ▼          ▼         ▼          ▼            ▼
    ┌──────────┐ ┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────────────┐
    │ comments │ │ votes  │ │book-  │ │notifica- │ │user_content_ctx  │
    │(self-ref)│ │(poly-  │ │marks  │ │tions     │ │(AI bot context)  │
    └──────────┘ │morphic)│ └───────┘ └──────────┘ └──────────────────┘
                 └────────┘
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  reports     │  │ user_blocks  │  │ audit_logs   │  │refresh_tokens│
     │(polymorphic) │  │(self-ref usr)│  │(admin audit) │  │(JWT mgmt)    │
     └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### 3.1.3 ERD Chi tiết — Quan hệ COMMENTS (self-referencing)

**Hình 3.2 — Cấu trúc self-referencing của COMMENTS**

```
┌───────────────────────────────────────────────────────┐
│                     COMMENTS                          │
│──────────────────────────────────────────────────────│
│  id          INT (PK)                                │
│  content     TEXT                                    │
│  author_id   INT (FK → users.id)                    │
│  post_id     INT (FK → posts.id)                    │
│  parent_id   INT? ──────────────┐ (FK → comments.id)│
│  quoted_id   INT? ─────────────┐│ (FK → comments.id)│
│  upvote_count INT               ││                  │
│  downvote_count INT             ││                  │
│  status      ENUM               ││                  │
│  is_edited   BOOL               ││                  │
└─────────────────────────────────┼┼──────────────────┘
                                  ││
          ┌───────────────────────┘│
          │  Self-referencing      │ Self-referencing
          │  (parent_id)           │ (quoted_comment_id)
          ▼                        ▼
  ┌───────────────────┐    ┌───────────────────┐
  │   Root Comment    │    │  Quoted Comment   │
  │ (parent_id = NULL)│    │ (any comment)     │
  └─────────┬─────────┘    └───────────────────┘
            │
            │ parent_id = root.id
            ▼
  ┌───────────────────┐
  │   Reply Comment   │
  │ (parent_id = root)│
  │ (max depth = 2)   │
  └───────────────────┘
```

---

## 3.2 Mô tả Entity chi tiết

### 3.2.1 Entity: USERS

**Bảng 3.2 — Mô tả thuộc tính Entity USERS**

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
|-----------|------------|----------|-----------------|
| `id` | Int | PK, AUTO INCREMENT | Khóa chính định danh |
| `email` | String | UNIQUE, NOT NULL | Địa chỉ email đăng nhập — định danh duy nhất |
| `username` | String | UNIQUE, NOT NULL | Tên đăng nhập — hiển thị trong forum |
| `password_hash` | String | NOT NULL | Mật khẩu đã hash bởi bcrypt (không lưu plain text) |
| `display_name` | String? | nullable | Tên hiển thị tuỳ chỉnh (override username trong UI) |
| `avatar_url` | String? | **deprecated** | URL avatar cũ — legacy, có migration script |
| `avatar_preview_url` | String? | nullable | URL avatar nhỏ (preview size) từ ImageKit |
| `avatar_standard_url` | String? | nullable | URL avatar tiêu chuẩn từ ImageKit |
| `avatar_imagekit_file_id` | String? | nullable | ID file trên ImageKit để có thể xóa/thay thế |
| `bio` | String? | nullable | Mô tả bản thân |
| `date_of_birth` | DateTime? | nullable | Ngày sinh |
| `gender` | String? | nullable | Giới tính |
| `role` | Role (enum) | DEFAULT MEMBER | Vai trò: MEMBER/MODERATOR/ADMIN/BOT |
| `reputation` | Int | DEFAULT 0 | Điểm uy tín tích lũy từ votes nhận được |
| `is_verified` | Boolean | DEFAULT false | Đã xác thực email OTP |
| `is_active` | Boolean | DEFAULT true | Tài khoản hoạt động (false → chưa kích hoạt) |
| `last_active_at` | DateTime? | nullable | Timestamp hoạt động cuối |
| `username_changed_at` | DateTime? | nullable | Hỗ trợ giới hạn tần suất đổi username |
| `created_at` | DateTime | DEFAULT now() | Thời điểm đăng ký |
| `updated_at` | DateTime | AUTO UPDATE | Cập nhật tự động khi có thay đổi |

> **Quyết định thiết kế:** `reputation` là denormalized counter — được cập nhật trực tiếp trong `voteService.ts` khi có vote mới thay vì tính toán lại từ bảng `votes`. Điều này đánh đổi consistency (nhỏ) lấy performance đọc (lớn).

---

### 3.2.2 Entity: POSTS

**Bảng 3.3 — Mô tả thuộc tính Entity POSTS**

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
|-----------|------------|----------|-----------------|
| `id` | Int | PK | Khóa chính |
| `title` | String | NOT NULL | Tiêu đề bài viết |
| `slug` | String | UNIQUE | URL-friendly identifier (e.g., `cach-hoc-react-hieu-qua`) |
| `content` | String | NOT NULL | Nội dung text (rỗng nếu dùng block layout) |
| `excerpt` | String? | nullable | Tóm tắt ngắn cho preview |
| `author_id` | Int | FK → users | Tác giả bài viết |
| `category_id` | Int | FK → categories | Danh mục chứa bài viết |
| `view_count` | Int | DEFAULT 0 | **Denormalized:** số lượt xem |
| `upvote_count` | Int | DEFAULT 0 | **Denormalized:** số vote tích cực |
| `downvote_count` | Int | DEFAULT 0 | **Denormalized:** số vote tiêu cực |
| `comment_count` | Int | DEFAULT 0 | **Denormalized:** tổng số bình luận |
| `status` | PostStatus | DEFAULT PUBLISHED | Trạng thái: DRAFT/PUBLISHED/HIDDEN/DELETED |
| `is_pinned` | Boolean | DEFAULT false | Bài viết được ghim |
| `pin_type` | PinType? | nullable | GLOBAL (ghim toàn site) / CATEGORY (ghim trong danh mục) |
| `pin_order` | Int | DEFAULT 0 | Thứ tự hiển thị khi nhiều bài được ghim |
| `is_locked` | Boolean | DEFAULT false | Khóa thread — không cho comment mới |
| `use_block_layout` | Boolean | DEFAULT false | Dùng block editor (content lưu trong post_blocks) |
| `created_at` | DateTime | DEFAULT now() | Thời điểm đăng bài |
| `updated_at` | DateTime | AUTO UPDATE | Cập nhật khi chỉnh sửa |

**Database Indexes trên posts:**

| Index | Mục đích |
|-------|---------|
| `posts(author_id)` | Query bài viết theo tác giả |
| `posts(category_id)` | Query bài viết theo danh mục |
| `posts(created_at)` | Sắp xếp theo thời gian (feed) |
| `posts(is_pinned, pin_order)` | Query bài viết được ghim |
| `posts(status)` | Filter theo trạng thái |

---

### 3.2.3 Entity: COMMENTS (self-referencing)

**Bảng 3.4 — Mô tả thuộc tính Entity COMMENTS**

| Thuộc tính | Kiểu dữ liệu | Ý nghĩa nghiệp vụ |
|-----------|------------|-----------------|
| `id` | Int PK | Khóa chính |
| `content` | String | Nội dung bình luận |
| `author_id` | Int FK → users | Tác giả |
| `post_id` | Int FK → posts | Bài viết thuộc về |
| `parent_id` | Int? FK → comments.id | **Self-ref:** null nếu là root, = root.id nếu là reply |
| `quoted_comment_id` | Int? FK → comments.id | **Self-ref:** comment được trích dẫn (quote) |
| `upvote_count` | Int DEFAULT 0 | **Denormalized:** vote tích cực |
| `downvote_count` | Int DEFAULT 0 | **Denormalized:** vote tiêu cực |
| `status` | CommentStatus | VISIBLE / HIDDEN / DELETED |
| `is_edited` | Boolean | Đã từng chỉnh sửa (hiển thị "(đã chỉnh sửa)") |
| `is_content_masked` | Boolean | Nội dung nhạy cảm bị ẩn (Admin có thể xem) |
| `created_at` | DateTime | Thời điểm tạo |
| `updated_at` | DateTime | Cập nhật khi chỉnh sửa |

> **Quyết định thiết kế:** `parent_id` chỉ tham chiếu đến **root comment** (comment có `parent_id = null`). Reply của reply không tồn tại — hệ thống enforce giới hạn 2 cấp ở application layer, tránh N+1 query khi load comment tree và tránh UI phức tạp.

---

### 3.2.4 Entity: CATEGORIES

**Bảng 3.5 — Mô tả thuộc tính Entity CATEGORIES**

| Thuộc tính | Kiểu dữ liệu | Ý nghĩa nghiệp vụ |
|-----------|------------|-----------------|
| `id` | Int PK | Khóa chính |
| `name` | String | Tên danh mục hiển thị |
| `slug` | String UNIQUE | URL-friendly identifier |
| `description` | String? | Mô tả danh mục |
| `color` | String? | Màu sắc thương hiệu (hex code) |
| `sort_order` | Int DEFAULT 0 | Thứ tự hiển thị |
| `post_count` | Int DEFAULT 0 | **Denormalized:** tổng số bài trong danh mục |
| `is_active` | Boolean DEFAULT true | Danh mục đang hoạt động |
| `view_permission` | PermissionLevel | Quyền **xem** danh mục: ALL/MEMBER/MODERATOR/ADMIN |
| `post_permission` | PermissionLevel | Quyền **đăng bài**: ALL/MEMBER/MODERATOR/ADMIN |
| `comment_permission` | PermissionLevel | Quyền **bình luận**: ALL/MEMBER/MODERATOR/ADMIN |
| `created_at` | DateTime | Thời điểm tạo |
| `updated_at` | DateTime | Cập nhật gần nhất |

> **Business Rule:** `PermissionLevel` có thứ tự tăng dần: ALL < MEMBER < MODERATOR < ADMIN. User chỉ truy cập nếu `role >= permission_required`. Guest không có role nên chỉ truy cập permission `ALL`.

---

### 3.2.5 Entity: AUDIT_LOGS

**Bảng 3.6 — Mô tả thuộc tính Entity AUDIT_LOGS**

| Thuộc tính | Kiểu dữ liệu | Ý nghĩa nghiệp vụ |
|-----------|------------|-----------------|
| `id` | Int PK | Khóa chính |
| `user_id` | Int FK → users | Admin/Moderator thực hiện action |
| `action` | AuditAction | Loại hành động (xem bảng enum bên dưới) |
| `target_type` | AuditTarget | Loại đối tượng bị tác động |
| `target_id` | Int? | ID cụ thể của đối tượng |
| `target_name` | String? | Tên/tiêu đề đối tượng (để trace không cần JOIN) |
| `old_value` | String? | Giá trị **trước** thay đổi (serialized JSON) |
| `new_value` | String? | Giá trị **sau** thay đổi (serialized JSON) |
| `ip_address` | String? | Địa chỉ IP của người thực hiện |
| `user_agent` | String? | Browser/client identifier |
| `created_at` | DateTime | Timestamp không thể thay đổi |

**Đặc điểm quan trọng:**
- **Không có `updated_at`** — audit log là immutable once written (bất biến sau khi ghi)
- `old_value` và `new_value` lưu JSON string → cho phép compare và rollback conceptual
- `target_name` denormalized để tránh JOIN khi hiển thị audit history (tên bài viết có thể bị xóa)

---

## 3.3 Data Dictionary — Enums

### 3.3.1 Enums trong Prisma Schema

**Bảng 3.7 — Data Dictionary: Enums hệ thống**

| Enum | Giá trị | Nguồn | Ý nghĩa |
|------|---------|-------|---------|
| **`Role`** | `MEMBER`, `MODERATOR`, `ADMIN`, `BOT` | `schema.prisma` | Vai trò người dùng |
| **`PostStatus`** | `DRAFT`, `PUBLISHED`, `HIDDEN`, `DELETED` | `schema.prisma` | Trạng thái bài viết |
| **`CommentStatus`** | `VISIBLE`, `HIDDEN`, `DELETED` | `schema.prisma` | Trạng thái bình luận |
| **`ReportStatus`** | `PENDING`, `REVIEWING`, `RESOLVED`, `DISMISSED` | `schema.prisma` | Trạng thái báo cáo vi phạm |
| **`ReportTarget`** | `POST`, `COMMENT`, `USER` | `schema.prisma` | Đối tượng bị báo cáo |
| **`NotificationType`** | `COMMENT`, `REPLY`, `MENTION`, `UPVOTE`, `SYSTEM` | `schema.prisma` | Loại thông báo |
| **`PermissionLevel`** | `ALL`, `MEMBER`, `MODERATOR`, `ADMIN` | `schema.prisma` | Mức phân quyền truy cập |
| **`BlockType`** | `TEXT`, `IMAGE`, `CODE`, `QUOTE` | `schema.prisma` | Loại block trong block editor |
| **`PinType`** | `GLOBAL`, `CATEGORY` | `schema.prisma` | Phạm vi ghim bài viết |
| **`AuditAction`** | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `PIN`, `UNPIN`, `LOCK`, `UNLOCK`, `HIDE`, `SHOW`, `BAN`, `UNBAN`, `ROLE_CHANGE`, `VIEW_MASKED_CONTENT` | `schema.prisma` | Hành động trong audit log |
| **`AuditTarget`** | `USER`, `POST`, `COMMENT`, `CATEGORY`, `TAG`, `REPORT`, `SETTINGS` | `schema.prisma` | Đối tượng trong audit log |
| **`VoteTarget`** | `POST`, `COMMENT` | `schema.prisma` | Đối tượng được vote |

### 3.3.2 Phân tích State Machine

**Hình 3.3 — State Machine: PostStatus**

```
                    ┌────────────────────┐
                    │                    │
             ┌──────▼──────┐      ┌──────┴──────┐
    (tạo)───►│    DRAFT    │─────►│  PUBLISHED  │◄─── (restore)
             └─────────────┘      └──────┬──────┘
                                         │         │
                                    (hide)│         │(hide)
                                         ▼         │
                                   ┌──────────┐    │
                                   │  HIDDEN  │────┘
                                   └────┬─────┘
                                        │
                                   (delete)│
                                        ▼
                                   ┌──────────┐
                                   │ DELETED  │ (terminal — soft delete)
                                   └──────────┘
```

**Hình 3.4 — State Machine: ReportStatus**

```
    (tạo)───►  PENDING  ──(review bắt đầu)──►  REVIEWING
                                                    │
                                     ┌──────────────┤
                                     │              │
                                 (resolve)       (dismiss)
                                     │              │
                                     ▼              ▼
                                 RESOLVED       DISMISSED
                                 (vi phạm)      (không vi phạm)
```

---

## 3.4 Quan hệ dữ liệu và ràng buộc toàn vẹn

### 3.4.1 Các quan hệ chính

**Bảng 3.8 — Bảng tổng hợp quan hệ giữa các Entity**

| Quan hệ | Loại | Cascade | Ghi chú |
|--------|------|---------|--------|
| `users` → `posts` | 1:N | ON DELETE: posts vẫn còn (author bị ẩn) | Bài viết không bị xóa khi user xóa |
| `users` → `comments` | 1:N | Restrict | Comment vẫn còn khi user bị xóa |
| `users` → `votes` | 1:N | CASCADE | Vote bị xóa khi user bị xóa |
| `users` → `bookmarks` | 1:N | CASCADE | Bookmark bị xóa khi user bị xóa |
| `users` → `notifications` | 1:N | CASCADE | Notification bị xóa khi user bị xóa |
| `users` → `refresh_tokens` | 1:N | CASCADE | Tokens hết hiệu lực khi user bị xóa |
| `users` → `audit_logs` | 1:N | CASCADE | Audit log vẫn còn (retain) |
| `posts` → `comments` | 1:N | CASCADE | Comment bị xóa khi bài viết bị xóa |
| `posts` → `post_blocks` | 1:N | CASCADE | Block bị xóa khi bài viết bị xóa |
| `posts` → `post_media` | 1:N | CASCADE | Media bị xóa khi bài viết bị xóa |
| `posts` ↔ `tags` | N:M via `post_tags` | CASCADE cả hai phía | Junction table |
| `comments` → `comments` | Self N:M | SetNull (parent_id khi comment gốc bị xóa) | Reply hiển thị "[comment đã bị xóa]" |
| `post_blocks` → `post_media` | 1:N | SetNull | Media không bị xóa khi block bị xóa |

### 3.4.2 Polymorphic Associations

Hệ thống có 2 **polymorphic association** — một entity liên kết với nhiều entity khác qua `target_type` + `target_id`:

**1. VOTES (polymorphic):**
```sql
votes.target_type IN ('POST', 'COMMENT')
votes.target_id   → id trong bảng tương ứng
```

Ví dụ:
- `{ target_type: 'POST', target_id: 42 }` → vote cho posts.id = 42
- `{ target_type: 'COMMENT', target_id: 15 }` → vote cho comments.id = 15

**2. REPORTS (polymorphic):**
```sql
reports.target_type IN ('POST', 'COMMENT', 'USER')
reports.target_id   → id trong bảng tương ứng
```

> **Trade-off:** Polymorphic association không có foreign key constraint trong PostgreSQL → toàn vẹn tham chiếu được đảm bảo ở application layer (`reportService.ts`). Đây là đánh đổi thiết kế phổ biến để tránh tạo quá nhiều bảng junction riêng.

### 3.4.3 Chiến lược Denormalization

MINI-FORUM sử dụng denormalized counters có mục đích:

**Bảng 3.9 — Các trường Denormalized và lý do**

| Trường | Bảng | Thay thế cho | Lý do Denormalize |
|--------|------|-------------|-----------------|
| `upvote_count` | posts, comments | `COUNT(*) FROM votes WHERE value=1` | Tránh aggregate query khi load danh sách bài viết |
| `downvote_count` | posts, comments | `COUNT(*) FROM votes WHERE value=-1` | Tương tự |
| `comment_count` | posts | `COUNT(*) FROM comments WHERE post_id=?` | Hiển thị số comment trên card bài viết |
| `post_count` | categories | `COUNT(*) FROM posts WHERE category_id=?` | Hiển thị trong menu danh mục |
| `usage_count` | tags | `COUNT(*) FROM post_tags WHERE tag_id=?` | Hiển thị độ phổ biến tag |
| `reputation` | users | Aggregate từ votes nhận | Profile user, ranking |

**Cơ chế đảm bảo consistency:** Các counter được cập nhật trong cùng transaction với operation tạo/xóa đối tượng. Ví dụ khi tạo comment:

```typescript
// commentService.ts
await prisma.$transaction([
  prisma.comments.create({ data: commentData }),
  prisma.posts.update({
    where: { id: postId },
    data: { comment_count: { increment: 1 } }
  })
]);
```

---

## 3.5 Thiết kế Schema cho Block Layout

### 3.5.1 Kiến trúc lưu nội dung dạng Block

Một bài viết trong MINI-FORUM có thể dùng **2 chế độ lưu nội dung**:

**Chế độ 1 — Simple Mode** (`use_block_layout = false`):
```
posts
├── content: "# Giới thiệu\n\nBài viết này..."  (Markdown)
└── post_blocks: [] (empty)
```

**Chế độ 2 — Block Mode** (`use_block_layout = true`):
```
posts
├── content: ""  (empty)
└── post_blocks:
    ├── { type: TEXT, content: "# Giới thiệu", sort_order: 0 }
    ├── { type: IMAGE, content: null, sort_order: 1 }
    │       └── post_media: { preview_url, standard_url }
    ├── { type: CODE, content: "console.log('hello')", sort_order: 2 }
    └── { type: QUOTE, content: "Quote nội dung...", sort_order: 3 }
```

**Bảng 3.10 — Các loại BlockType và đặc điểm**

| BlockType | Lưu nội dung ở đâu | Hỗ trợ media | Ghi chú |
|----------|-------------------|-------------|--------|
| `TEXT` | `post_blocks.content` | Không | Markdown text |
| `IMAGE` | `post_media` (qua `block_id`) | Có | `content` = null trong block |
| `CODE` | `post_blocks.content` | Không | Plain text code snippet |
| `QUOTE` | `post_blocks.content` | Không | Trích dẫn |

---

## Tóm tắt chương 3

Chương 3 đã mô hình hóa toàn bộ cấu trúc dữ liệu của MINI-FORUM:

- **17 Model** trong Prisma Schema với quan hệ rõ ràng, có migration history
- **5 Entity cốt lõi** được đặc tả chi tiết thuộc tính và business rules
- **12 Enum** mã hóa tất cả trạng thái và phân loại trong hệ thống
- **Chiến lược denormalization** có mục đích cho 6 counter fields, cân bằng performance và consistency
- **2 polymorphic associations** (votes, reports) thiết kế linh hoạt với đánh đổi rõ ràng
- **Block layout** là kiến trúc nội dung 2 chế độ, cho phép bài viết phong phú hơn

Chương tiếp theo sẽ phân tích luồng thông tin — cách dữ liệu di chuyển qua các lớp của hệ thống từ input đến output.
