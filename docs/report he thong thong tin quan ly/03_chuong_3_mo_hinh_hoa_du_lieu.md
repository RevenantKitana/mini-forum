# CHƯƠNG 3
# MÔ HÌNH HÓA DỮ LIỆU

---

Mô hình hóa dữ liệu là bước trung tâm trong quá trình phân tích và thiết kế hệ thống thông tin. Sau khi xác định được các nghiệp vụ và use case ở chương trước, chương này chuyển hóa chúng thành cấu trúc lưu trữ dữ liệu cụ thể — nền tảng để các luồng xử lý thông tin hoạt động chính xác và hiệu quả.

Chương 3 được tổ chức theo ba tầng phân tích: (1) **ERD tổng thể** — cái nhìn bao quát về các entity và quan hệ; (2) **Mô tả chi tiết từng entity** — thuộc tính, ràng buộc và business rule; (3) **Data Dictionary** — bảng tra cứu đầy đủ các kiểu dữ liệu, enum và trạng thái. Ngoài ra, chương trình bày hai quyết định thiết kế đặc thù của MINI-FORUM: chiến lược **denormalization** có mục đích và kiến trúc **Block Layout** cho nội dung bài viết phong phú.

---

## 3.1 Entity-Relationship Diagram (ERD)

### 3.1.1 Tổng quan các thực thể

Hệ thống MINI-FORUM được xây dựng trên nền tảng PostgreSQL với Prisma ORM, quản lý toàn bộ 17 Model được phân chia thành 4 nhóm chức năng chính:

- **Nhóm cốt lõi (Core):** `users`, `posts`, `comments`, `categories` — bộ tứ entity trung tâm, hình thành xương sống nghiệp vụ diễn đàn
- **Nhóm nội dung (Content):** `post_blocks`, `post_media`, `post_tags`, `tags` — quản lý nội dung phong phú đa dạng
- **Nhóm tương tác (Interaction):** `votes`, `bookmarks`, `reports`, `user_blocks` — các hành động người dùng thực hiện với nội dung
- **Nhóm hệ thống (System):** `notifications`, `audit_logs`, `refresh_tokens`, `otp_tokens`, `user_content_context` — hạ tầng xác thực, an toàn và AI

Tất cả 17 model đều xoay quanh trục trung tâm là entity `users` — mọi hành động trong hệ thống đều gắn với một tài khoản người dùng cụ thể.

**Bảng 3.1 — Danh sách 17 Model trong Prisma Schema**

| STT | Model | Kiểu quan hệ | Vai trò nghiệp vụ | Nhóm |
|-----|-------|-------------|-----------------|------|
| 1 | `users` | Root entity | Tài khoản người dùng, xác thực | Core |
| 2 | `posts` | Nhiều → 1 (users, categories) | Bài viết diễn đàn | Core |
| 3 | `comments` | Nhiều → 1 (users, posts); Self-ref | Bình luận (lồng 2 cấp) | Core |
| 4 | `categories` | 1 → Nhiều (posts) | Danh mục phân loại bài viết | Core |
| 5 | `tags` | N:M với posts (qua post_tags) | Thẻ phân loại | Content |
| 6 | `post_tags` | Junction table (posts ↔ tags) | Quan hệ N:M bài viết-thẻ | Content |
| 7 | `post_blocks` | Nhiều → 1 (posts) | Nội dung dạng block (TEXT/IMAGE/CODE/QUOTE) | Content |
| 8 | `post_media` | Nhiều → 1 (posts, post_blocks) | File media trong bài viết | Content |
| 9 | `votes` | Nhiều → 1 (users); Polymorphic | Vote upvote/downvote | Interaction |
| 10 | `bookmarks` | Nhiều → 1 (users, posts) | Bookmark bài viết | Interaction |
| 11 | `reports` | Nhiều → 1 (users); Polymorphic | Báo cáo nội dung vi phạm | Interaction |
| 12 | `user_blocks` | Nhiều → 1 (users×2) | Chặn người dùng | Interaction |
| 13 | `notifications` | Nhiều → 1 (users) | Thông báo người dùng | System |
| 14 | `audit_logs` | Nhiều → 1 (users) | Nhật ký hành động quản trị | System |
| 15 | `refresh_tokens` | Nhiều → 1 (users) | JWT refresh token management | System |
| 16 | `otp_tokens` | Nhiều → 1 (users) | OTP cho email verification | System |
| 17 | `user_content_context` | 1 → 1 (users) | Context tracking cho AI bot | System |

### 3.1.2 ERD Tổng thể

ERD tổng thể dưới đây mô tả toàn bộ 17 entity và các quan hệ chính giữa chúng. Để đảm bảo tính rõ ràng, các entity nhóm System (refresh_tokens, otp_tokens) được ẩn bớt chi tiết thuộc tính do chức năng phụ trợ. Mũi tên `──►` ký hiệu **FK** (khóa ngoại), `◄──►` ký hiệu **N:M junction**, số `1` và `N` ghi trên đường nối biểu thị **cardinality**.

**Hình 3.1 — Entity-Relationship Diagram tổng thể**

```
                           ┌──────────────────┐
                           │   categories     │
                           │──────────────────│
                           │ PK id            │
                           │    name          │
                           │ UQ slug          │
                           │    description   │
                           │    color         │
                           │    sort_order    │
                           │    post_count*   │ ← denormalized
                           │    is_active     │
                           │    view_perm     │
                           │    post_perm     │
                           │    comment_perm  │
                           └────────┬─────────┘
                                    │ 1 : N
                                    │ (category_id)
    ┌──────────────┐         ┌──────┴──────────────────────────┐
    │     tags     │  N : M  │            posts                │
    │──────────────│◄──────►│─────────────────────────────────│
    │ PK id        │(post_  │ PK id                           │
    │    name      │ tags)  │    title                        │
    │ UQ slug      │        │ UQ slug                         │
    │    usage_cnt*│        │    content                      │
    └──────────────┘        │    excerpt                      │
                            │ FK author_id ──────────┐        │
                            │ FK category_id          │        │
                            │    view_count*          │        │
                            │    upvote_count*        │        │
                            │    downvote_count*      │        │
                            │    comment_count*       │        │
                            │    status (ENUM)        │        │
                            │    is_pinned            │        │
                            │    pin_type (ENUM)      │        │
                            │    pin_order            │        │
                            │    is_locked            │        │
                            │    use_block_layout     │        │
                            └──────────┬──────────────┘        │
                                       │ 1 : N                 │
                          ┌────────────┼────────────┐          │
                          │            │            │          │
                    ┌─────┴──────┐ ┌───┴────────┐ ┌┴────────┐ │
                    │post_blocks │ │ post_media │ │bookmarks│ │
                    │────────────│ │────────────│ │─────────│ │
                    │ PK id      │ │ PK id      │ │ PK id   │ │
                    │ FK post_id │ │ FK post_id │ │FK post  │ │
                    │    type    │ │ FK block_id│ │FK user  │ │
                    │    content │ │ ik_file_id │ └─────────┘ │
                    │ sort_order │ │ preview_url│             │
                    └────────────┘ │ standard  │             │
                         1:N       └────────────┘             │
                                                              │
    ┌──────────────────────────────────────────────────────────┘
    │                      users (root entity)
    │  ┌────────────────────────────────────────────────────────┐
    └─►│ PK id                                                  │
       │ UQ email                                               │
       │ UQ username                                            │
       │    password_hash                                       │
       │    display_name                                        │
       │    avatar_preview_url                                  │
       │    avatar_standard_url                                 │
       │    avatar_imagekit_file_id                             │
       │    bio │ date_of_birth │ gender                        │
       │    role (ENUM: MEMBER/MODERATOR/ADMIN/BOT)             │
       │    reputation*  ← denormalized                         │
       │    is_verified │ is_active                             │
       │    last_active_at │ username_changed_at                │
       └─┬────────┬────────────┬─────────────┬─────────────────┘
         │        │            │             │
         │1:N     │1:N         │1:N          │1:N
         ▼        ▼            ▼             ▼
   ┌──────────┐ ┌────────┐ ┌────────────┐ ┌─────────────────────┐
   │ comments │ │ votes  │ │  reports   │ │    notifications    │
   │(self-ref)│ │(poly.) │ │  (poly.)   │ │                     │
   └──────────┘ └────────┘ └────────────┘ └─────────────────────┘
         │1:N                         1:1
         ▼                             ▼
   ┌──────────────────┐   ┌───────────────────────────┐
   │  user_blocks     │   │   user_content_context    │
   │  (self-ref users)│   │   (AI bot personality)    │
   └──────────────────┘   └───────────────────────────┘
         │1:N                    │1:N          │1:N
         ▼                       ▼             ▼
   ┌──────────┐          ┌────────────┐ ┌────────────┐
   │audit_logs│          │refresh_tkn │ │ otp_tokens │
   └──────────┘          └────────────┘ └────────────┘

  * = denormalized counter (xem mục 3.4.3)
```

> **Ghi chú đọc sơ đồ:** Các quan hệ có dấu `*` trên thuộc tính là **denormalized counter** — giá trị được duy trì đồng bộ qua application logic thay vì tính toán lại từ các bảng liên quan. Thiết kế này giúp tăng hiệu năng đọc nhưng đòi hỏi kỷ luật trong việc cập nhật (xem phân tích chi tiết tại mục 3.4.3).

### 3.1.3 ERD Chi tiết — Quan hệ COMMENTS (self-referencing)

Entity `comments` sở hữu **hai quan hệ self-referencing** — đây là đặc điểm thiết kế đáng chú ý nhất trong schema, phản ánh nghiệp vụ bình luận lồng 2 cấp và chức năng trích dẫn (quote) bình luận của người khác.

**Hình 3.2 — Cấu trúc self-referencing của COMMENTS**

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMMENTS                                │
│─────────────────────────────────────────────────────────────────│
│  PK id              INT                                         │
│     content         TEXT          (nội dung bình luận)          │
│  FK author_id       INT → users.id                              │
│  FK post_id         INT → posts.id                              │
│  FK parent_id       INT? ─────────────────────────┐             │
│  FK quoted_comment_id INT? ──────────────────────┐│             │
│     upvote_count    INT  DEFAULT 0               ││             │
│     downvote_count  INT  DEFAULT 0               ││             │
│     status          ENUM (VISIBLE/HIDDEN/DELETED) ││             │
│     is_edited       BOOL DEFAULT false            ││             │
│     is_content_masked BOOL DEFAULT false          ││             │
│     created_at      DATETIME                      ││             │
│     updated_at      DATETIME                      ││             │
└───────────────────────────────────────────────────┼┼─────────────┘
                                                    ││
              ┌─────────────────────────────────────┘│
              │  Quan hệ 1: parent_id                │
              │  (xác định cây bình luận 2 cấp)       │ Quan hệ 2: quoted_comment_id
              ▼                                       │ (trích dẫn bình luận bất kỳ)
   ┌──────────────────────┐                          ▼
   │   Root Comment       │              ┌──────────────────────┐
   │  (parent_id = NULL)  │              │   Quoted Comment     │
   │  Bình luận gốc       │              │   (có thể là bất kỳ) │
   └──────────┬───────────┘              └──────────────────────┘
              │
              │ Các reply trỏ về root bằng parent_id = root.id
              ▼
   ┌──────────────────────┐
   │   Reply Comment      │   ← CẤP 2 (tối đa)
   │ (parent_id = root.id)│
   │ Không được reply lại │
   └──────────────────────┘
              ✗
   ┌──────────────────────┐
   │   Level 3 (BLOCKED)  │   ← Application layer từ chối
   └──────────────────────┘
```

> **Quyết định thiết kế — Giới hạn 2 cấp:** `parent_id` chỉ được phép tham chiếu đến **root comment** (comment có `parent_id = NULL`). Khi người dùng cố reply một reply, hệ thống redirect về `parent_id` của reply đó (tức là root). Giới hạn này được enforce ở **application layer** (`commentService.ts`), không phải database constraint — cho phép dữ liệu linh hoạt hơn trong tương lai nếu cần mở rộng lên 3 cấp.

---

## 3.2 Mô tả Entity chi tiết

Phần này đặc tả chi tiết 5 entity cốt lõi. Với mỗi entity, bảng thuộc tính liệt kê đầy đủ: tên trường, kiểu dữ liệu, ràng buộc tính toàn vẹn (integrity constraints) và ý nghĩa nghiệp vụ. Các entity nhóm System (refresh_tokens, otp_tokens, user_content_context) được mô tả ngắn gọn do mục đích kỹ thuật đơn thuần.

### 3.2.1 Entity: USERS

Entity `users` là **trung tâm** của toàn bộ hệ thống — mọi thao tác đọc/ghi đều gắn với một user cụ thể. Thiết kế entity này phải cân bằng giữa: (a) đủ thông tin để xác thực và phân quyền; (b) đủ thông tin profile để hiển thị; (c) hỗ trợ tính năng avatar qua CDN; (d) tương thích với AI bot (role BOT).

**Bảng 3.2 — Mô tả thuộc tính Entity USERS**

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
|-----------|------------|----------|-----------------|
| `id` | Int | PK, AUTO INCREMENT | Khóa chính định danh nội bộ |
| `email` | String | UNIQUE, NOT NULL | Địa chỉ email đăng nhập — định danh duy nhất, không thể đổi |
| `username` | String | UNIQUE, NOT NULL | Tên đăng nhập — hiển thị trong forum, có thể đổi (giới hạn tần suất) |
| `password_hash` | String | NOT NULL | Mật khẩu đã hash bởi bcrypt (cost=10), không bao giờ lưu plain text |
| `display_name` | String? | nullable | Tên hiển thị tuỳ chỉnh; nếu null thì UI dùng `username` |
| `avatar_url` | String? | **@deprecated** | URL avatar legacy — chỉ dùng làm fallback khi chưa migrate |
| `avatar_preview_url` | String? | nullable | URL avatar nhỏ (80×80px, face-focused) từ ImageKit CDN |
| `avatar_standard_url` | String? | nullable | URL avatar chuẩn (400×400px) từ ImageKit CDN |
| `avatar_imagekit_file_id` | String? | nullable | FileID trên ImageKit — cần để xóa/thay thế file cũ |
| `bio` | String? | nullable | Giới thiệu bản thân hiển thị trên trang profile |
| `date_of_birth` | DateTime? | nullable | Ngày sinh (optional, dùng cho tính năng profile đầy đủ) |
| `gender` | String? | nullable | Giới tính (free-text, không bị ràng buộc enum) |
| `role` | Role (enum) | DEFAULT MEMBER | Vai trò phân quyền: MEMBER / MODERATOR / ADMIN / BOT |
| `reputation` | Int | DEFAULT 0 | Điểm uy tín — **denormalized counter** tích lũy từ votes nhận được |
| `is_verified` | Boolean | DEFAULT false | Đã xác thực email qua OTP (false = chưa verify, không được đăng bài) |
| `is_active` | Boolean | DEFAULT true | Tài khoản đang hoạt động (false = đã bị vô hiệu hóa/ban) |
| `last_active_at` | DateTime? | nullable | Timestamp lần hoạt động cuối — dùng cho chỉ số "online gần đây" |
| `username_changed_at` | DateTime? | nullable | Timestamp đổi username lần gần nhất — enforce cooldown period |
| `created_at` | DateTime | DEFAULT now() | Thời điểm đăng ký tài khoản |
| `updated_at` | DateTime | AUTO UPDATE | Tự động cập nhật khi có bất kỳ thay đổi nào |

> **Quyết định thiết kế 1 — Reputation counter:** `reputation` là denormalized counter được cập nhật trực tiếp trong `voteService.ts` khi có vote mới thay vì tính `SUM` từ bảng `votes`. Điều này đánh đổi consistency nhỏ (có thể lệch nếu có lỗi transaction) lấy performance đọc lớn (không cần GROUP BY khi render profile).
>
> **Quyết định thiết kế 2 — Triple avatar fields:** Ba trường `avatar_url`, `avatar_preview_url`, `avatar_standard_url` tồn tại song song do quá trình migration từ hệ thống lưu ảnh cũ (Cloudinary) sang ImageKit. Script migration `migrateAvatarUrls.ts` xử lý chuyển đổi từng batch.

### 3.2.2 Entity: POSTS

Entity `posts` là **nội dung trung tâm** của diễn đàn. Thiết kế đặc biệt ở chỗ hỗ trợ hai chế độ lưu nội dung (simple text và block layout), đồng thời có đầy đủ các cờ quản trị (pin, lock, status) để Moderator/Admin điều phối nội dung.

**Bảng 3.3 — Mô tả thuộc tính Entity POSTS**

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
|-----------|------------|----------|-----------------|
| `id` | Int | PK, AUTO INCREMENT | Khóa chính nội bộ |
| `title` | String | NOT NULL | Tiêu đề bài viết hiển thị |
| `slug` | String | UNIQUE, NOT NULL | URL-friendly identifier (vd: `huong-dan-react-hooks`) — tạo từ title + id suffix |
| `content` | String | NOT NULL | Nội dung plain text / Markdown; rỗng nếu dùng block layout |
| `excerpt` | String? | nullable | Tóm tắt tự động hoặc do tác giả nhập — hiển thị trên card bài viết |
| `author_id` | Int | FK → users.id | Tác giả bài viết |
| `category_id` | Int | FK → categories.id | Danh mục chứa bài viết |
| `view_count` | Int | DEFAULT 0 | **Denormalized:** số lượt xem — tăng mỗi khi bài được truy cập |
| `upvote_count` | Int | DEFAULT 0 | **Denormalized:** số vote tích cực |
| `downvote_count` | Int | DEFAULT 0 | **Denormalized:** số vote tiêu cực |
| `comment_count` | Int | DEFAULT 0 | **Denormalized:** tổng số bình luận đang hiển thị |
| `status` | PostStatus | DEFAULT PUBLISHED | Trạng thái: DRAFT / PUBLISHED / HIDDEN / DELETED |
| `is_pinned` | Boolean | DEFAULT false | Bài viết được ghim — hiển thị ưu tiên lên đầu |
| `pin_type` | PinType? | nullable | GLOBAL (ghim toàn site) / CATEGORY (ghim trong danh mục) |
| `pin_order` | Int | DEFAULT 0 | Thứ tự hiển thị khi có nhiều bài ghim cùng level |
| `is_locked` | Boolean | DEFAULT false | Khóa thread — ngăn thêm comment mới (Admin/Mod có thể vẫn comment) |
| `use_block_layout` | Boolean | DEFAULT false | Bật block editor — content rỗng, nội dung lưu trong `post_blocks` |
| `created_at` | DateTime | DEFAULT now() | Thời điểm đăng bài |
| `updated_at` | DateTime | AUTO UPDATE | Cập nhật khi tác giả chỉnh sửa |

**Database Indexes trên bảng posts:**

| Index | Cột | Mục đích hiệu năng |
|-------|-----|--------------------|
| Composite | `(author_id)` | Lấy tất cả bài của một tác giả (trang profile) |
| Composite | `(category_id)` | Lấy bài trong một danh mục (trang category) |
| B-Tree | `(created_at DESC)` | Sắp xếp feed theo thời gian mới nhất |
| Composite | `(is_pinned, pin_order)` | Query bài ghim — ưu tiên hiển thị |
| Partial | `(status)` | Filter theo trạng thái — thường là PUBLISHED |

> **Quyết định thiết kế — Slug generation:** Slug được tạo từ tiêu đề + id ngắn (ví dụ: `huong-dan-react-hooks-abc1`). Cơ chế này đảm bảo: (1) URL thân thiện với SEO, (2) tính duy nhất dù hai bài có tiêu đề giống nhau, (3) ổn định khi tác giả đổi tiêu đề (slug không đổi theo tiêu đề).

### 3.2.3 Entity: COMMENTS (self-referencing)

Entity `comments` có độ phức tạp cao nhất trong schema do hai quan hệ self-referencing. Bên cạnh cấu trúc phân cấp, entity này còn lưu trạng thái kiểm duyệt và cờ `is_content_masked` — cho phép Admin ẩn nội dung nhạy cảm mà không xóa hoàn toàn.

**Bảng 3.4 — Mô tả thuộc tính Entity COMMENTS**

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
|-----------|------------|----------|-----------------|
| `id` | Int | PK, AUTO INCREMENT | Khóa chính |
| `content` | String | NOT NULL | Nội dung bình luận (plain text hoặc Markdown giới hạn) |
| `author_id` | Int | FK → users.id | Tác giả bình luận |
| `post_id` | Int | FK → posts.id, CASCADE DELETE | Bài viết chứa bình luận — bị xóa theo bài |
| `parent_id` | Int? | FK → comments.id, SET NULL | **Self-ref:** null = root comment; = root.id = reply (chỉ 2 cấp) |
| `quoted_comment_id` | Int? | FK → comments.id | **Self-ref:** bình luận được trích dẫn (quote feature) |
| `upvote_count` | Int | DEFAULT 0 | **Denormalized:** số vote tích cực |
| `downvote_count` | Int | DEFAULT 0 | **Denormalized:** số vote tiêu cực |
| `status` | CommentStatus | DEFAULT VISIBLE | VISIBLE / HIDDEN / DELETED |
| `is_edited` | Boolean | DEFAULT false | Đã từng chỉnh sửa — hiển thị "(đã chỉnh sửa)" trong UI |
| `is_content_masked` | Boolean | DEFAULT false | Nội dung bị che bởi Admin — chỉ Admin/Mod xem được nội dung gốc |
| `created_at` | DateTime | DEFAULT now() | Thời điểm tạo |
| `updated_at` | DateTime | AUTO UPDATE | Cập nhật khi chỉnh sửa |

> **Quyết định thiết kế — Limit 2 cấp:** `parent_id` phải là `null` hoặc ID của một root comment (`parent_id = null`). Application layer kiểm tra và flatten: nếu user reply một reply, hệ thống tự động đặt `parent_id = reply.parent_id`. Điều này đơn giản hóa query load comment tree — không cần recursive CTE.

### 3.2.4 Entity: CATEGORIES

Entity `categories` là hệ thống phân loại nội dung với **mô hình phân quyền 3 chiều độc lập** (xem, đăng, bình luận), cho phép Admin tạo các danh mục với mức độ mở cửa khác nhau.

**Bảng 3.5 — Mô tả thuộc tính Entity CATEGORIES**

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
|-----------|------------|----------|-----------------|
| `id` | Int | PK, AUTO INCREMENT | Khóa chính |
| `name` | String | NOT NULL | Tên danh mục hiển thị cho người dùng |
| `slug` | String | UNIQUE, NOT NULL | URL-friendly identifier (vd: `lap-trinh`, `hoi-dap`) |
| `description` | String? | nullable | Mô tả mục đích và nội dung danh mục |
| `color` | String? | nullable | Mã màu HEX (vd: `#3B82F6`) — nhận diện thương hiệu trên UI |
| `sort_order` | Int | DEFAULT 0 | Thứ tự hiển thị trong menu điều hướng |
| `post_count` | Int | DEFAULT 0 | **Denormalized:** tổng bài viết đang PUBLISHED trong danh mục |
| `is_active` | Boolean | DEFAULT true | Danh mục đang hoạt động (false = ẩn, không hiện trong menu) |
| `view_permission` | PermissionLevel | DEFAULT ALL | Quyền **xem** danh mục: ALL / MEMBER / MODERATOR / ADMIN |
| `post_permission` | PermissionLevel | DEFAULT MEMBER | Quyền **đăng bài** mới: ALL / MEMBER / MODERATOR / ADMIN |
| `comment_permission` | PermissionLevel | DEFAULT MEMBER | Quyền **bình luận**: ALL / MEMBER / MODERATOR / ADMIN |
| `created_at` | DateTime | DEFAULT now() | Thời điểm tạo danh mục |
| `updated_at` | DateTime | AUTO UPDATE | Lần cập nhật gần nhất |

> **Business Rule — Kiểm tra quyền truy cập:** `PermissionLevel` được sắp xếp theo thứ bậc tăng dần: `ALL (0) < MEMBER (1) < MODERATOR (2) < ADMIN (3)`. Hệ thống cho phép truy cập khi `rank(user.role) >= rank(required_permission)`. Guest không có role nên chỉ có thể truy cập permission `ALL`.
>
> **Ví dụ thực tế:** Một danh mục "Nội bộ Moderator" có thể được cấu hình: `view_permission = MODERATOR`, `post_permission = MODERATOR`, `comment_permission = MODERATOR` — hoàn toàn ẩn với Member thông thường và Guest.

### 3.2.5 Entity: AUDIT_LOGS

Entity `audit_logs` là **hồ sơ bất biến** ghi lại mọi hành động quản trị trong hệ thống. Không có `updated_at` — một bản ghi audit đã tạo thì không bao giờ được sửa đổi. Đây là nguyên tắc **immutable audit trail** đảm bảo tính tin cậy của nhật ký.

**Bảng 3.6 — Mô tả thuộc tính Entity AUDIT_LOGS**

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Ý nghĩa nghiệp vụ |
|-----------|------------|----------|-----------------|
| `id` | Int | PK, AUTO INCREMENT | Khóa chính |
| `user_id` | Int | FK → users.id, CASCADE | Admin / Moderator thực hiện hành động |
| `action` | AuditAction | NOT NULL | Loại hành động (xem Bảng 3.7 — enum đầy đủ) |
| `target_type` | AuditTarget | NOT NULL | Loại đối tượng bị tác động (POST / USER / COMMENT / ...) |
| `target_id` | Int? | nullable | ID cụ thể của đối tượng (null nếu action là LOGIN/LOGOUT) |
| `target_name` | String? | nullable | **Denormalized:** tên/tiêu đề đối tượng — trace mà không cần JOIN |
| `old_value` | String? | nullable | Giá trị **trước** thay đổi (JSON serialized) |
| `new_value` | String? | nullable | Giá trị **sau** thay đổi (JSON serialized) |
| `ip_address` | String? | nullable | Địa chỉ IP của người thực hiện (từ `req.ip`) |
| `user_agent` | String? | nullable | Browser/client identifier (từ `User-Agent` header) |
| `created_at` | DateTime | DEFAULT now() | Timestamp bất biến — không có `updated_at` |

**Đặc điểm thiết kế quan trọng:**

- **Immutable (bất biến):** Không có `updated_at`, không có endpoint UPDATE — bản ghi audit chỉ được tạo (INSERT), không bao giờ bị sửa hay xóa qua API
- **`target_name` denormalized:** Khi bài viết bị xóa hoàn toàn, `target_name` vẫn còn trong audit log cho phép truy vết lịch sử mà không cần JOIN bảng đã mất dữ liệu
- **`old_value` / `new_value` dạng JSON:** Cho phép so sánh trước/sau (`{ "role": "MEMBER" }` → `{ "role": "MODERATOR" }`) và hỗ trợ "rollback conceptual" — Admin hiểu được thay đổi gì đã xảy ra

**Database Indexes trên audit_logs:**

| Index | Cột | Mục đích |
|-------|-----|---------|
| `idx_audit_action` | `(action)` | Filter theo loại hành động |
| `idx_audit_created` | `(created_at DESC)` | Sắp xếp log theo thời gian |
| `idx_audit_target` | `(target_type, target_id)` | Xem lịch sử của một đối tượng cụ thể |
| `idx_audit_user` | `(user_id)` | Xem lịch sử hành động của một Admin |

---

## 3.3 Data Dictionary — Enums

### 3.3.1 Tổng quan Enums trong hệ thống

MINI-FORUM định nghĩa **12 Enum** trong Prisma Schema để mã hóa tất cả các trạng thái, loại dữ liệu và phân loại có tập giá trị cố định. Việc dùng Enum thay vì String tự do mang lại ba lợi ích: (1) **Type safety** — compiler/linter phát hiện lỗi khi dùng giá trị không hợp lệ; (2) **Consistency** — không thể có "Published" vs "published" hay lỗi typo; (3) **Performance** — PostgreSQL lưu Enum hiệu quả hơn VARCHAR.

**Bảng 3.7 — Data Dictionary: Enums hệ thống**

| Enum | Giá trị | Bảng sử dụng | Ý nghĩa |
|------|---------|-------------|---------|
| **`Role`** | `MEMBER`, `MODERATOR`, `ADMIN`, `BOT` | `users.role` | Vai trò phân quyền; thứ bậc tăng dần từ trái sang phải |
| **`PostStatus`** | `DRAFT`, `PUBLISHED`, `HIDDEN`, `DELETED` | `posts.status` | Trạng thái vòng đời bài viết (xem State Machine 3.3.2) |
| **`CommentStatus`** | `VISIBLE`, `HIDDEN`, `DELETED` | `comments.status` | Trạng thái hiển thị bình luận |
| **`ReportStatus`** | `PENDING`, `REVIEWING`, `RESOLVED`, `DISMISSED` | `reports.status` | Trạng thái xử lý báo cáo vi phạm (xem State Machine 3.3.3) |
| **`ReportTarget`** | `POST`, `COMMENT`, `USER` | `reports.target_type` | Loại nội dung bị báo cáo |
| **`NotificationType`** | `COMMENT`, `REPLY`, `MENTION`, `UPVOTE`, `SYSTEM` | `notifications.type` | Loại sự kiện sinh thông báo |
| **`PermissionLevel`** | `ALL`, `MEMBER`, `MODERATOR`, `ADMIN` | `categories.*_permission` | Mức phân quyền truy cập (tăng dần) |
| **`BlockType`** | `TEXT`, `IMAGE`, `CODE`, `QUOTE` | `post_blocks.type` | Loại block nội dung trong block editor |
| **`PinType`** | `GLOBAL`, `CATEGORY` | `posts.pin_type` | Phạm vi ghim bài viết |
| **`VoteTarget`** | `POST`, `COMMENT` | `votes.target_type` | Loại đối tượng được vote |
| **`AuditAction`** | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `PIN`, `UNPIN`, `LOCK`, `UNLOCK`, `HIDE`, `SHOW`, `BAN`, `UNBAN`, `ROLE_CHANGE`, `VIEW_MASKED_CONTENT` | `audit_logs.action` | Loại hành động quản trị |
| **`AuditTarget`** | `USER`, `POST`, `COMMENT`, `CATEGORY`, `TAG`, `REPORT`, `SETTINGS` | `audit_logs.target_type` | Đối tượng chịu tác động trong audit |

### 3.3.2 State Machine: PostStatus

State Machine của `PostStatus` xác định vòng đời đầy đủ của một bài viết — từ lúc tạo đến khi bị xóa mềm, bao gồm các nhánh phân quyền (ai được phép thực hiện transition nào).

**Hình 3.3 — State Machine: PostStatus**

```
                          ┌────────────────────────┐
                          │   [Author nhấn "Lưu   │
                          │    nháp"]              │
                          │                        │
                          ▼                        │
              ┌───────────────────────┐            │
  [Tạo mới]──►│         DRAFT         │            │
              │    (Chỉ tác giả       │            │
              │     có thể xem)       │            │
              └──────────┬────────────┘            │
                         │                         │
              [Author nhấn Đăng / Tạo luôn]        │
                         │                         │
                         ▼                         │
              ┌───────────────────────┐            │
              │       PUBLISHED        │◄───────────┘
              │    (Công khai cho      │  [Admin/Mod Restore]
              │     mọi người xem)     │
              └──────────┬────────────┘
                         │
            ┌────────────┴──────────────┐
            │                           │
  [Admin/Mod: HIDE]            [Author/Admin/Mod: DELETE]
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│         HIDDEN         │   │        DELETED         │
│   (Admin/Mod vẫn xem  │   │  (Soft delete — data  │
│    được, user không)  │   │   còn trong DB, không  │
└──────────┬────────────┘   │   hiển thị với ai)     │
           │                └───────────────────────┘
  [Admin: RESTORE]             ↑ Terminal state (không khôi phục)
           │
           └──────────────► PUBLISHED
```

**Bảng 3.8 — Phân quyền thực hiện chuyển trạng thái PostStatus**

| Transition | Từ trạng thái | Sang trạng thái | Ai được phép |
|-----------|--------------|----------------|-------------|
| Đăng bài | DRAFT | PUBLISHED | Author |
| Lưu nháp | PUBLISHED | DRAFT | Author |
| Ẩn bài | PUBLISHED | HIDDEN | Admin, Moderator |
| Khôi phục | HIDDEN | PUBLISHED | Admin |
| Xóa bài | PUBLISHED, HIDDEN, DRAFT | DELETED | Author, Admin, Moderator |

### 3.3.3 State Machine: ReportStatus

**Hình 3.4 — State Machine: ReportStatus**

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                    REPORT STATUS LIFECYCLE                      │
  │                                                                  │
  │   [Member gửi báo cáo]                                          │
  │          │                                                      │
  │          ▼                                                      │
  │   ┌─────────────┐                                               │
  │   │   PENDING   │  ← Báo cáo mới, chờ xem xét                 │
  │   │  (default)  │                                               │
  │   └──────┬──────┘                                               │
  │          │                                                      │
  │   [Mod/Admin nhận xét bắt đầu]                                 │
  │          │                                                      │
  │          ▼                                                      │
  │   ┌─────────────┐                                               │
  │   │  REVIEWING  │  ← Đang xem xét, báo cáo được "claimed"     │
  │   └──────┬──────┘                                               │
  │          │                                                      │
  │   ┌──────┴──────────────┐                                       │
  │   │                     │                                       │
  │   ▼                     ▼                                       │
  │ ┌──────────┐      ┌───────────────┐                            │
  │ │ RESOLVED │      │   DISMISSED   │                            │
  │ │(vi phạm  │      │ (không vi phạm│                            │
  │ │ thực sự) │      │  hoặc lỗi rõ  │                            │
  │ │ → hành   │      │   ràng)       │                            │
  │ │   động   │      └───────────────┘                            │
  │ │ thực thi │                                                   │
  │ └──────────┘                                                    │
  │                                                                  │
  │  Lưu ý: RESOLVED không tự động xóa nội dung — Mod/Admin        │
  │  phải thực hiện hành động riêng (DELETE post, BAN user, ...)   │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 3.4 Quan hệ dữ liệu và ràng buộc toàn vẹn

Ràng buộc toàn vẹn tham chiếu (referential integrity) xác định điều gì xảy ra với các bản ghi liên quan khi một bản ghi cha bị xóa. MINI-FORUM sử dụng ba chiến lược: **CASCADE** (xóa theo), **SET NULL** (để trống FK), và **Restrict** (ngăn xóa nếu còn phụ thuộc). Lựa chọn từng chiến lược phản ánh quyết định nghiệp vụ rõ ràng.

### 3.4.1 Bảng tổng hợp các quan hệ chính

**Bảng 3.9 — Tổng hợp quan hệ và ràng buộc toàn vẹn**

| Quan hệ (Cha → Con) | Cardinality | On Delete | Lý do quyết định |
|--------------------|------------|-----------|-----------------|
| `users` → `posts` | 1:N | **Restrict** | Bài viết không bị xóa khi user bị ban/xóa — nội dung cộng đồng tồn tại độc lập với tác giả |
| `users` → `comments` | 1:N | **Restrict** | Tương tự bài viết — bình luận vẫn hiển thị (với tên ẩn) |
| `users` → `votes` | 1:N | **CASCADE** | Vote gắn với người vote — mất người vote thì vote không còn ý nghĩa |
| `users` → `bookmarks` | 1:N | **CASCADE** | Bookmark là dữ liệu cá nhân — xóa user thì xóa cả bookmark |
| `users` → `notifications` | 1:N | **CASCADE** | Notification gửi đến user cụ thể — không có giá trị khi user không còn |
| `users` → `refresh_tokens` | 1:N | **CASCADE** | Token hết hiệu lực khi user bị xóa — bảo mật bắt buộc |
| `users` → `audit_logs` | 1:N | **CASCADE** | Giữ nguyên audit log kể cả khi admin bị xóa (xem lưu ý bên dưới) |
| `users` → `user_blocks` | 1:N (×2) | **CASCADE** | Block list gắn với cả hai phía — xóa một thì block không còn nghĩa |
| `posts` → `comments` | 1:N | **CASCADE** | Bài viết bị xóa → xóa toàn bộ thread bình luận |
| `posts` → `post_blocks` | 1:N | **CASCADE** | Block là phần của bài viết — không tồn tại độc lập |
| `posts` → `post_media` | 1:N | **CASCADE** | Media thuộc bài viết (nhưng cần xóa trên ImageKit riêng qua service) |
| `posts` ↔ `tags` | N:M (qua `post_tags`) | **CASCADE** cả hai | Junction record không có ý nghĩa khi một trong hai bị xóa |
| `comments` → `comments` | Self-ref (parent) | **SET NULL** | Comment gốc bị xóa → reply vẫn còn nhưng `parent_id = null` (orphan reply hiển thị "[comment đã bị xóa]") |
| `post_blocks` → `post_media` | 1:N | **SET NULL** (`block_id`) | Media được đính kèm block, nhưng nếu block bị xóa, media vẫn tồn tại trong bài |

> **Lưu ý về audit_logs:** Dù có CASCADE từ `users`, `audit_logs` trong thực tế không bị xóa vì hệ thống không có chức năng xóa vĩnh viễn tài khoản (chỉ ban/deactivate). Đây là quyết định bảo toàn lịch sử kiểm soát.

### 3.4.2 Polymorphic Associations

Hệ thống có **2 polymorphic association** — một entity liên kết với nhiều entity khác thông qua cặp `(target_type, target_id)` thay vì FK riêng lẻ. Đây là pattern phổ biến trong thiết kế cơ sở dữ liệu khi một entity có thể "thuộc về" nhiều loại entity khác.

**Hình 3.5 — Polymorphic Associations trong MINI-FORUM**

```
    ┌─────────────────────────────────────────────────────────────┐
    │                    votes                                   │
    │─────────────────────────────────────────────────────────────│
    │  id       | user_id | target_type | target_id | value      │
    │─────────────────────────────────────────────────────────────│
    │  1        | 5       | POST        | 42        | +1         │ → vote cho posts.id = 42
    │  2        | 5       | COMMENT     | 15        | -1         │ → vote cho comments.id = 15
    │  3        | 8       | POST        | 42        | +1         │ → vote cho posts.id = 42
    └─────────────────────────────────────────────────────────────┘

    Không có FK thực sự:
    posts.id = 42  ←──── không có DB constraint ────→  votes.target_id = 42
    Toàn vẹn được đảm bảo bởi: voteService.ts (application layer)

    ┌─────────────────────────────────────────────────────────────┐
    │                    reports                                  │
    │─────────────────────────────────────────────────────────────│
    │  id  | reporter_id | target_type | target_id | reason       │
    │─────────────────────────────────────────────────────────────│
    │  1   | 3          | POST        | 42        | Spam          │ → báo cáo posts.id = 42
    │  2   | 7          | COMMENT     | 15        | Toxic         │ → báo cáo comments.id = 15
    │  3   | 9          | USER        | 5         | Harassment    │ → báo cáo users.id = 5
    └─────────────────────────────────────────────────────────────┘
```

> **Trade-off — Tại sao không dùng FK riêng?** Nếu muốn FK thực sự, cần tạo 3 cột FK riêng: `post_id`, `comment_id`, `user_id` (đều nullable) và chỉ một trong ba có giá trị. Cách này phức tạp hơn khi query và khó mở rộng. Polymorphic approach đơn giản hơn với đánh đổi là mất database-level FK constraint — toàn vẹn phải đảm bảo ở application layer.

### 3.4.3 Chiến lược Denormalization

MINI-FORUM áp dụng **denormalization có mục đích** — lưu dư thừa dữ liệu để tăng tốc độ đọc tại những điểm có tần suất cao nhất. Đây là quyết định kiến trúc cân nhắc giữa **consistency** (tính nhất quán) và **performance** (hiệu năng).

**Bảng 3.10 — Phân tích các Counter được Denormalize**

| Counter field | Bảng lưu | Thay thế cho SQL | Tần suất đọc | Tần suất ghi |
|--------------|---------|-----------------|-------------|-------------|
| `upvote_count` | posts, comments | `SELECT COUNT(*) FROM votes WHERE target_id=? AND value=1` | **Rất cao** — mỗi bài trên feed | Thấp — khi có vote |
| `downvote_count` | posts, comments | `SELECT COUNT(*) FROM votes WHERE target_id=? AND value=-1` | **Rất cao** | Thấp |
| `comment_count` | posts | `SELECT COUNT(*) FROM comments WHERE post_id=? AND status='VISIBLE'` | **Cao** — hiển thị trên card bài viết | Trung bình — mỗi comment mới |
| `post_count` | categories | `SELECT COUNT(*) FROM posts WHERE category_id=? AND status='PUBLISHED'` | **Cao** — menu điều hướng | Thấp — mỗi bài mới |
| `usage_count` | tags | `SELECT COUNT(*) FROM post_tags WHERE tag_id=?` | Trung bình | Thấp |
| `reputation` | users | `SELECT SUM(delta) FROM vote_events WHERE target_author=?` | **Rất cao** — mọi trang profile | Trung bình |

**Cơ chế đảm bảo consistency — Atomic Transaction:**

Các counter được cập nhật trong **cùng một database transaction** với operation tạo/xóa đối tượng. Ví dụ khi tạo comment:

```typescript
// commentService.ts — Tạo comment và tăng counter trong 1 transaction
await prisma.$transaction([
  prisma.comments.create({ data: commentData }),
  prisma.posts.update({
    where: { id: postId },
    data: { comment_count: { increment: 1 } }
  })
]);
// Nếu INSERT comment thất bại → UPDATE counter cũng bị rollback
// → Counter luôn đồng bộ với dữ liệu thực
```

**Rủi ro còn lại:** Nếu có lỗi ứng dụng ngoài transaction (ví dụ: delete comment thành công nhưng decrement counter thất bại do timeout), counter có thể lệch. Script `cleanupImagekit.ts` và các script dọn dẹp khác định kỳ reconcile các counter này.

---

## 3.5 Thiết kế Schema cho Block Layout

### 3.5.1 Lý do ra đời Block Layout

Trong phiên bản đầu, bài viết chỉ hỗ trợ nội dung Markdown thuần. Điều này hạn chế người dùng khi muốn tạo bài có nhiều ảnh xen kẽ văn bản, hoặc có các đoạn code riêng biệt. Block Layout giải quyết nhu cầu này bằng cách chia nội dung thành các **khối độc lập**, mỗi khối có kiểu riêng.

### 3.5.2 Kiến trúc hai chế độ lưu nội dung

**Hình 3.6 — So sánh Simple Mode và Block Mode**

```
  ┌────────────────────────────────────────────────────────────────┐
  │              CHẾ ĐỘ 1: SIMPLE MODE                           │
  │              (use_block_layout = false)                       │
  │                                                               │
  │   posts                                                       │
  │   ├── id: 42                                                  │
  │   ├── title: "Giới thiệu React Hooks"                         │
  │   ├── content: "## Mở đầu\nReact Hooks ra đời từ..."          │
  │   │             ↑ Toàn bộ nội dung Markdown ở đây            │
  │   ├── use_block_layout: false                                  │
  │   └── post_blocks: [] (EMPTY)                                 │
  │                                                               │
  │   Ưu điểm: Đơn giản, dễ edit                                 │
  │   Hạn chế: Không thể xen kẽ ảnh giữa văn bản, code block     │
  │             không có syntax highlight độc lập                 │
  └────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────┐
  │              CHẾ ĐỘ 2: BLOCK MODE                            │
  │              (use_block_layout = true)                        │
  │                                                               │
  │   posts                                                       │
  │   ├── id: 43                                                  │
  │   ├── title: "Hướng dẫn React Hooks đầy đủ"                   │
  │   ├── content: ""  ← LUÔN RỖNG trong chế độ này              │
  │   ├── use_block_layout: true                                   │
  │   └── post_blocks:                                            │
  │       │                                                       │
  │       ├── { id:1, type:TEXT,  sort_order:0,                   │
  │       │     content: "## Giới thiệu\nHooks cho phép..." }     │
  │       │                                                       │
  │       ├── { id:2, type:IMAGE, sort_order:1,                   │
  │       │     content: null }                                    │
  │       │     └── post_media: [{ preview_url, standard_url }]   │
  │       │                                                       │
  │       ├── { id:3, type:CODE,  sort_order:2,                   │
  │       │     content: "const [count, setCount] = useState(0)"} │
  │       │                                                       │
  │       └── { id:4, type:QUOTE, sort_order:3,                   │
  │             content: "Hooks let you use state without..." }   │
  │                                                               │
  │   Ưu điểm: Nội dung phong phú, xen kẽ ảnh/code/quote         │
  │   Hạn chế: Phức tạp hơn khi lưu/đọc dữ liệu                 │
  └────────────────────────────────────────────────────────────────┘
```

**Bảng 3.11 — Đặc tả các loại BlockType**

| BlockType | Nội dung lưu ở | Có media | Cách render trên UI |
|----------|---------------|---------|---------------------|
| `TEXT` | `post_blocks.content` (Markdown) | Không | Markdown renderer — hỗ trợ bold, italic, heading, list |
| `IMAGE` | `post_media.preview_url` / `standard_url` | **Có** | `<img>` tag với `post_blocks.content = null` |
| `CODE` | `post_blocks.content` (plain text) | Không | `<pre><code>` block với syntax highlight (Prism.js) |
| `QUOTE` | `post_blocks.content` (plain text) | Không | `<blockquote>` với border trái đặc trưng |

### 3.5.3 Thứ tự hiển thị và sắp xếp lại

Trường `sort_order` (Int, DEFAULT 0) quyết định thứ tự hiển thị các block. Khi người dùng kéo thả (drag & drop) để sắp xếp lại:

```
Trước khi sắp xếp:           Sau khi kéo block CODE lên đầu:
  Block 1: TEXT   sort=0       Block 1: CODE  sort=0  (cũ là 2)
  Block 2: IMAGE  sort=1   →   Block 2: TEXT  sort=1  (cũ là 0)
  Block 3: CODE   sort=2       Block 3: IMAGE sort=2  (cũ là 1)

API: PATCH /posts/:id/blocks/reorder
     Body: [{ id:3, sort_order:0 }, { id:1, sort_order:1 }, { id:2, sort_order:2 }]
```

---

## Tóm tắt chương 3

Chương 3 đã mô hình hóa toàn diện cấu trúc dữ liệu của hệ thống MINI-FORUM thông qua ba lớp phân tích:

**Lớp cấu trúc (ERD):** 17 Model trong Prisma Schema, được tổ chức thành 4 nhóm chức năng. ERD tổng thể thể hiện rõ entity trung tâm (`users`) và các quan hệ đơn hướng, hai chiều, tự tham chiếu.

**Lớp chi tiết (Entity Description):** 5 entity cốt lõi được đặc tả đầy đủ — mỗi thuộc tính đều có ràng buộc toàn vẹn và ý nghĩa nghiệp vụ. Hai quyết định thiết kế nổi bật: giới hạn comment 2 cấp (tránh recursive query) và mô hình phân quyền 3 chiều trong categories.

**Lớp ngữ nghĩa (Data Dictionary):** 12 Enum mã hóa mọi tập giá trị cố định. Hai State Machine (PostStatus, ReportStatus) làm rõ vòng đời dữ liệu và phân quyền transition.

**Quyết định kiến trúc:**
- **Denormalization có mục đích:** 6 counter fields giúp tránh aggregate query tại những điểm truy cập cao tần, đảm bảo consistency qua Prisma `$transaction`
- **Polymorphic association:** votes và reports sử dụng `(target_type, target_id)` — đơn giản, dễ mở rộng, với đánh đổi là mất DB-level FK constraint
- **Block Layout:** Hai chế độ lưu nội dung (simple/block) cùng tồn tại, đảm bảo backward compatibility trong khi mở rộng khả năng biểu đạt nội dung

Nền tảng dữ liệu được thiết kế ở chương này là cơ sở trực tiếp cho các luồng thông tin được phân tích tại chương tiếp theo.
