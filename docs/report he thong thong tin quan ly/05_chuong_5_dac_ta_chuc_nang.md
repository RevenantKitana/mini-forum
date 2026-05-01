# CHƯƠNG 5
# ĐẶC TẢ CHỨC NĂNG CHI TIẾT

---

## 5.1 Module Authentication & Authorization

### 5.1.1 Tổ chức code

Mô-đun xác thực được tổ chức theo mô hình **Controller → Service → Repository (Prisma)**:

```
backend/src/
├── controllers/
│   └── authController.ts      ← HTTP handlers, request/response
├── services/
│   ├── authService.ts         ← Business logic đăng nhập/đăng ký
│   └── otpService.ts          ← Tạo, lưu, xác minh OTP
├── middlewares/
│   ├── authMiddleware.ts      ← JWT verification (protect routes)
│   └── roleMiddleware.ts      ← RBAC: kiểm tra role requirement
└── routes/
    └── authRoutes.ts          ← Route definitions
```

### 5.1.2 API Endpoints — Module Auth

**Bảng 5.1 — API Endpoints: Module Authentication**

| Method | Endpoint | Chức năng | Auth Required | Rate Limited |
|--------|---------|-----------|:-------------:|:------------:|
| POST | `/auth/register` | Đăng ký tài khoản mới | Không | Có |
| POST | `/auth/verify-otp` | Xác nhận OTP email | Không | Có |
| POST | `/auth/login` | Đăng nhập, nhận token | Không | Có |
| POST | `/auth/refresh` | Làm mới access token | Không (dùng cookie) | Không |
| POST | `/auth/logout` | Đăng xuất, xóa token | Có | Không |
| POST | `/auth/forgot-password` | Gửi OTP reset password | Không | Có |
| POST | `/auth/reset-password` | Đổi mật khẩu qua OTP | Không | Có |
| POST | `/auth/resend-otp` | Gửi lại OTP | Không | Có |

### 5.1.3 Middleware Pipeline

**Hình 5.1 — Middleware Pipeline xác thực**

```
Incoming Request
      │
      ▼
┌─────────────────────┐
│  helmet()           │  Security headers (XSS, HSTS, etc.)
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  cors()             │  CORS origin whitelist
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  express-rate-limit  │  Rate limiting (100 req/15min global)
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  authMiddleware     │  Nếu route có protect():
│  .authenticate()    │  - Đọc Authorization: Bearer <token>
│                     │  - jwt.verify(token, JWT_SECRET)
│                     │  - SELECT user FROM DB (verify still active)
│                     │  - Attach req.user = { id, role, ... }
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  roleMiddleware     │  Nếu route yêu cầu role cụ thể:
│  .requireRole(...)  │  - Kiểm tra req.user.role >= requiredRole
└──────────┬──────────┘
           ▼
      Controller
```

### 5.1.4 Đặc tả bảo mật

**Bảng 5.2 — Đặc tả bảo mật Module Auth**

| Cơ chế | Triển khai | Mục đích |
|--------|-----------|---------|
| **Password hashing** | bcrypt, salt rounds = 10 | Không lưu plain text, brute-force resistant |
| **JWT signing** | HS256 với `JWT_SECRET` (env) | Xác thực stateless |
| **Access token TTL** | 15 phút | Giảm thiệt hại nếu token bị đánh cắp |
| **Refresh token storage** | httpOnly Secure SameSite=Strict cookie | XSS không đọc được token |
| **Refresh token DB** | `refresh_tokens` table | Cho phép revoke bất kỳ lúc nào |
| **Rate limiting** | 100 req/15 phút cho `/auth/*` | Ngăn brute-force và abuse |
| **OTP TTL** | Giới hạn theo config | OTP lộ sẽ tự hết hạn |
| **CORS** | Whitelist explicit origins | Ngăn CSRF từ domain khác |

---

## 5.2 Module Post Management

### 5.2.1 Tổ chức code

```
backend/src/
├── controllers/
│   └── postController.ts
├── services/
│   ├── postService.ts
│   └── postMediaService.ts
└── routes/
    └── postRoutes.ts
```

### 5.2.2 API Endpoints — Module Post

**Bảng 5.3 — API Endpoints: Module Post Management**

| Method | Endpoint | Chức năng | Auth | Role |
|--------|---------|-----------|------|------|
| GET | `/posts` | Lấy danh sách bài viết (phân trang, filter) | Không | — |
| GET | `/posts/:slug` | Xem chi tiết bài viết theo slug | Không | — |
| POST | `/posts` | Tạo bài viết mới | Có | Member+ |
| PUT | `/posts/:id` | Cập nhật toàn bộ bài viết | Có | Author/Admin |
| PATCH | `/posts/:id` | Cập nhật một phần (status, pin, lock) | Có | Varies |
| DELETE | `/posts/:id` | Xóa bài viết (soft delete) | Có | Author/Mod/Admin |
| GET | `/posts/:id/comments` | Lấy comments của bài viết | Không | — |
| POST | `/posts/:id/media` | Upload media cho bài viết | Có | Author |
| DELETE | `/posts/:id/media/:mediaId` | Xóa media | Có | Author/Admin |
| PATCH | `/posts/:id/pin` | Ghim/bỏ ghim bài viết | Có | Admin |
| PATCH | `/posts/:id/lock` | Khóa/mở khóa thread | Có | Admin/Mod |

### 5.2.3 Query Parameters (GET /posts)

**Bảng 5.4 — Query Parameters cho GET /posts**

| Tham số | Kiểu | Mặc định | Mô tả |
|--------|------|---------|-------|
| `page` | Int | 1 | Trang hiện tại |
| `limit` | Int | 20 | Số bài mỗi trang (max: 50) |
| `category` | String | — | Filter theo category slug |
| `tag` | String | — | Filter theo tag slug |
| `author` | String | — | Filter theo username tác giả |
| `status` | PostStatus | PUBLISHED | Trạng thái (Admin có thể filter HIDDEN) |
| `sort` | String | `created_at` | Sắp xếp: `created_at`, `upvote_count`, `view_count` |
| `order` | String | `desc` | Thứ tự: `asc`, `desc` |
| `search` | String | — | Full-text search trong title + content |

### 5.2.4 State Machine bài viết

**Hình 5.2 — State Machine PostStatus với các transition**

```
┌──────────────────────────────────────────────────────────────────────┐
│                        POST STATUS STATE MACHINE                    │
│                                                                      │
│                         [Author tạo]                               │
│                              │                                      │
│                    ┌─────────┴──────────┐                          │
│                    │                    │                           │
│                    ▼                    ▼                           │
│             ┌────────────┐      ┌────────────────┐                 │
│             │   DRAFT    │      │   PUBLISHED    │                 │
│             │ (lưu nháp) │─────►│  (công khai)   │                 │
│             └────────────┘      └───────┬────────┘                 │
│                                         │                           │
│                              ┌──────────┴──────────┐               │
│                              │                     │               │
│                     [Admin/Mod hide]         [Author/Mod/Admin]     │
│                              │                delete               │
│                              ▼                     │               │
│                       ┌────────────┐               ▼               │
│                       │   HIDDEN   │        ┌────────────┐         │
│                       │(bị ẩn bởi  │        │  DELETED   │         │
│                       │moderator)  │        │(soft delete│         │
│                       └─────┬──────┘        │data còn DB)│         │
│                             │               └────────────┘         │
│                     [Admin restore]                                 │
│                             │                                       │
│                             └──────────────► PUBLISHED             │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2.5 Block Layout Architecture

Khi bài viết sử dụng Block Layout (`use_block_layout = true`), nội dung được lưu như sau:

**Hình 5.3 — Cấu trúc Block Layout**

```
posts
├── id: 42
├── title: "Hướng dẫn React Hooks đầy đủ"
├── content: ""        ← EMPTY khi dùng block layout
├── use_block_layout: true
└── post_blocks:
    │
    ├── { id:1, type: TEXT,  sort_order:0,
    │     content: "## Giới thiệu\n\nReact Hooks là..." }
    │
    ├── { id:2, type: CODE,  sort_order:1,
    │     content: "const [count, setCount] = useState(0);" }
    │
    ├── { id:3, type: IMAGE, sort_order:2,
    │     content: null }
    │     └── post_media: [{
    │           imagekit_file_id: "abc123",
    │           preview_url: "https://ik.imagekit.io/.../img_preview.jpg",
    │           standard_url: "https://ik.imagekit.io/.../img_standard.jpg"
    │         }]
    │
    └── { id:4, type: QUOTE, sort_order:3,
          content: "Hooks let you use state and other React features..." }
```

---

## 5.3 Module Comment System

### 5.3.1 API Endpoints

**Bảng 5.5 — API Endpoints: Module Comment**

| Method | Endpoint | Chức năng | Auth | Role |
|--------|---------|-----------|------|------|
| POST | `/comments` | Tạo comment (root hoặc reply) | Có | Member+ |
| PUT | `/comments/:id` | Chỉnh sửa comment (giới hạn thời gian) | Có | Author |
| DELETE | `/comments/:id` | Xóa comment | Có | Author/Mod/Admin |
| PATCH | `/comments/:id/hide` | Ẩn comment | Có | Mod/Admin |
| GET | `/comments/:id/replies` | Lấy replies của comment | Không | — |
| POST | `/comments` (với parent_id) | Reply một comment | Có | Member+ |

### 5.3.2 Cấu trúc Comment Tree

**Hình 5.4 — Cấu trúc cây Comment (2 cấp)**

```
POST #42: "Hướng dẫn React Hooks"
│
├── Comment #1 (root, parent_id = null)
│   │  "Bài viết rất hữu ích! Cảm ơn tác giả"
│   │  author: user_A, created_at: T1
│   │
│   ├── Reply #3 (parent_id = 1)
│   │      "Đồng ý với bạn! Hooks thật sự tiện"
│   │      author: user_B, created_at: T3
│   │
│   └── Reply #5 (parent_id = 1, quoted_comment_id = 3)
│          [Quote #3: "Đồng ý với bạn! Hooks thật sự tiện"]
│          "Mình cũng vậy, đặc biệt là useEffect"
│          author: user_C, created_at: T5
│
└── Comment #2 (root, parent_id = null)
    │  "Phần useCallback chưa rõ lắm"
    │  author: user_D, created_at: T2
    │
    └── Reply #4 (parent_id = 2)
           "Bạn có thể giải thích thêm không?"
           author: user_E, created_at: T4

⚠️ KHÔNG CÓ CẤP 3: Reply của Reply không được phép
   Lý do: Tránh UI phức tạp + giảm recursive query
```

### 5.3.3 Business Rule: Comment Edit Time Limit

**Hình 5.5 — Quy trình chỉnh sửa comment với time limit**

```
PUT /comments/:id { content: "nội dung mới" }
         │
         ▼
┌────────────────────────────────────────┐
│  commentController.updateComment()     │
│                                        │
│  1. Tìm comment trong DB               │
│  2. Kiểm tra req.user.id === author_id │──► 403 Forbidden
│  3. Tính time elapsed:                 │
│     now() - comment.created_at         │
│  4. So sánh với                        │
│     COMMENT_EDIT_TIME_LIMIT (seconds)  │──► 403 "Quá thời gian chỉnh sửa"
│  5. UPDATE comment.content             │
│     SET is_edited = true               │
│     SET updated_at = now()             │
└────────────────────────────────────────┘
```

> **Cấu hình động:** `COMMENT_EDIT_TIME_LIMIT` được lưu trong bảng `config` và quản lý qua `configController` — Admin có thể thay đổi giá trị này mà không cần deploy lại.

---

## 5.4 Module User Management

### 5.4.1 API Endpoints

**Bảng 5.6 — API Endpoints: Module User**

| Method | Endpoint | Chức năng | Auth |
|--------|---------|-----------|------|
| GET | `/users/:username` | Xem profile công khai | Không |
| PATCH | `/users/me` | Cập nhật thông tin của bản thân | Có |
| POST | `/users/me/avatar` | Upload ảnh đại diện | Có |
| DELETE | `/users/me/avatar` | Xóa ảnh đại diện | Có |
| PATCH | `/users/me/password` | Đổi mật khẩu | Có |
| GET | `/users/me/bookmarks` | Xem bookmarks của bản thân | Có |
| GET | `/users/me/notifications` | Xem notifications | Có |
| POST | `/users/me/blocks` | Chặn người dùng | Có |
| DELETE | `/users/me/blocks/:userId` | Bỏ chặn người dùng | Có |

### 5.4.2 Quy trình Upload Avatar

**Hình 5.6 — Luồng Upload Avatar qua ImageKit**

```
  User chọn ảnh → POST /users/me/avatar
        │
        ▼
  ┌───────────────────────────────────────────────────────┐
  │  imagekitService.uploadAvatar()                      │
  │                                                       │
  │  1. Validate: file type (jpg/png/webp), size < 5MB   │
  │  2. Upload raw image lên ImageKit                     │
  │     → Nhận: imagekit_file_id, url                    │
  │  3. Tạo 2 transformation URL:                        │
  │     preview: w=80,h=80,fo=face,q=70                  │
  │     standard: w=400,h=400,fo=face,q=85               │
  │  4. Xóa avatar cũ trên ImageKit (if exists)          │
  │     imagekitService.deleteFile(old_imagekit_file_id) │
  │  5. UPDATE users SET:                                 │
  │     avatar_preview_url = preview_url,                │
  │     avatar_standard_url = standard_url,              │
  │     avatar_imagekit_file_id = new_file_id            │
  └───────────────────────────────────────────────────────┘
```

---

## 5.5 Module Notification

### 5.5.1 Các loại Notification

**Bảng 5.7 — Đặc tả các loại NotificationType**

| NotificationType | Khi nào tạo | Nguồn tạo | Dữ liệu |
|----------------|------------|----------|--------|
| `COMMENT` | Ai đó comment vào bài viết của user | `commentService.ts` | postId, commentId, actor username |
| `REPLY` | Ai đó reply comment của user | `commentService.ts` | postId, parentCommentId, replyId |
| `MENTION` | Ai đó @username trong comment | `commentService.ts` | postId, commentId |
| `UPVOTE` | Bài viết/comment của user nhận upvote | `voteService.ts` | targetType, targetId, count |
| `SYSTEM` | Admin gửi thông báo hệ thống | `adminController.ts` | message tuỳ ý |

### 5.5.2 API Endpoints — Notification

**Bảng 5.8 — API Endpoints: Module Notification**

| Method | Endpoint | Chức năng |
|--------|---------|-----------|
| GET | `/notifications` | Lấy danh sách notifications (phân trang) |
| GET | `/notifications/stream` | SSE endpoint — kết nối real-time |
| PATCH | `/notifications/:id/read` | Đánh dấu đã đọc |
| DELETE | `/notifications/:id` | Xóa notification (soft delete) |
| PATCH | `/notifications/read-all` | Đánh dấu tất cả đã đọc |

### 5.5.3 Cơ chế Soft Delete Notification

```
Notification schema:
├── id
├── user_id
├── type
├── is_read: Boolean
├── deleted_at: DateTime?   ← NULL = chưa xóa, có giá trị = đã xóa
└── created_at

Query lấy notifications:
SELECT * FROM notifications
WHERE user_id = ? AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20
```

---

## 5.6 Module Search

### 5.6.1 Kỹ thuật Full-text Search

MINI-FORUM sử dụng PostgreSQL built-in full-text search thay vì Elasticsearch để giảm chi phí vận hành:

**Bảng 5.9 — So sánh FTS approaches**

| Tiêu chí | PostgreSQL FTS (Chọn) | Elasticsearch |
|---------|----------------------|---------------|
| **Chi phí** | Không thêm (đã có PG) | Cần server riêng |
| **Độ phức tạp** | Thấp | Cao |
| **Performance** | Tốt với index GIN | Tốt hơn ở scale lớn |
| **Phù hợp với** | < 1M bài viết | > 10M documents |
| **Tính nhất quán** | Strong (ACID) | Eventually consistent |

**Query FTS trong PostgreSQL:**

```sql
-- Tìm kiếm bài viết
SELECT
  p.*,
  ts_rank(
    to_tsvector('simple', p.title || ' ' || p.content),
    plainto_tsquery('simple', $1)
  ) AS search_rank
FROM posts p
WHERE
  p.status = 'PUBLISHED'
  AND to_tsvector('simple', p.title || ' ' || p.content)
      @@ plainto_tsquery('simple', $1)
ORDER BY
  search_rank DESC,
  p.created_at DESC
LIMIT $2 OFFSET $3
```

> **Lưu ý:** Dùng dictionary `'simple'` thay vì `'vietnamese'` vì PostgreSQL mặc định không có Vietnamese dictionary. `'simple'` chỉ lowercase và không stemming — phù hợp cho tiếng Việt.

---

## 5.7 Module Vote & Bookmark

### 5.7.1 API Endpoints

**Bảng 5.10 — API Endpoints: Vote và Bookmark**

| Method | Endpoint | Chức năng |
|--------|---------|-----------|
| POST | `/votes` | Vote upvote (+1) hoặc downvote (-1) |
| DELETE | `/votes/:id` | Xóa vote |
| GET | `/votes/check` | Kiểm tra trạng thái vote hiện tại |
| POST | `/bookmarks` | Bookmark bài viết |
| DELETE | `/bookmarks/:postId` | Xóa bookmark |
| GET | `/bookmarks` | Lấy danh sách bài đã bookmark |

### 5.7.2 Vote Request Schema

```typescript
// POST /votes
{
  target_type: "POST" | "COMMENT",
  target_id: number,
  value: 1 | -1        // 1 = upvote, -1 = downvote
}
```

---

## 5.8 Module Category & Tag

### 5.8.1 Cấu trúc phân quyền Category

**Hình 5.7 — Logic kiểm tra quyền truy cập Category**

```
User yêu cầu xem category "programming"
        │
        ▼
SELECT view_permission FROM categories WHERE slug = 'programming'
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  Permission check logic:                           │
│                                                    │
│  if (view_permission === 'ALL')                    │
│    → Cho phép tất cả (kể cả Guest)                │
│                                                    │
│  if (view_permission === 'MEMBER')                 │
│    → Cần đăng nhập (không cho Guest)              │
│                                                    │
│  if (view_permission === 'MODERATOR')              │
│    → Cần role MODERATOR hoặc ADMIN                │
│                                                    │
│  if (view_permission === 'ADMIN')                  │
│    → Chỉ ADMIN                                    │
└─────────────────────────────────────────────────────┘
```

### 5.8.2 API Endpoints — Category & Tag

**Bảng 5.11 — API Endpoints: Category và Tag**

| Method | Endpoint | Chức năng | Auth |
|--------|---------|-----------|------|
| GET | `/categories` | Lấy danh sách category (filter theo permission) | Không |
| GET | `/categories/:slug` | Xem chi tiết category | Không |
| POST | `/categories` | Tạo category mới | Có (Admin) |
| PUT | `/categories/:id` | Cập nhật category | Có (Admin) |
| DELETE | `/categories/:id` | Xóa category | Có (Admin) |
| GET | `/tags` | Lấy danh sách tag | Không |
| GET | `/tags/:slug` | Xem chi tiết tag + bài viết | Không |
| POST | `/tags` | Tạo tag | Có (Admin) |
| PUT | `/tags/:id` | Cập nhật tag | Có (Admin) |

---

## 5.9 Module Media Upload

### 5.9.1 Quy trình Upload Media

**Bảng 5.12 — API Endpoints: Media**

| Method | Endpoint | Chức năng |
|--------|---------|-----------|
| POST | `/media/upload` | Upload ảnh, nhận URL |
| DELETE | `/media/:imagekitFileId` | Xóa file trên ImageKit |
| GET | `/media/post/:postId` | Lấy danh sách media của bài |
| PATCH | `/media/:id/reorder` | Sắp xếp lại thứ tự media |

### 5.9.2 ImageKit Integration

```
Upload flow:
1. Client gửi file (multipart/form-data) đến backend
2. Backend dùng ImageKit SDK upload file
3. ImageKit trả về: fileId, url
4. Backend tạo 2 URL transformation:
   - Preview: ?tr=w-200,h-200,fo-face
   - Standard: ?tr=w-800,h-600,q-85
5. Backend lưu cả hai URL vào post_media hoặc users.avatar_*_url
6. Client dùng preview URL để hiển thị thumbnail,
   standard URL để hiển thị full size
```

---

## 5.10 Module Config (Dynamic Configuration)

### 5.10.1 Cơ chế cấu hình động

MINI-FORUM có hệ thống cấu hình động cho phép Admin thay đổi tham số vận hành không cần deploy lại:

**Bảng 5.13 — Các tham số có thể cấu hình động**

| Config Key | Kiểu | Mặc định | Ý nghĩa |
|-----------|------|---------|---------|
| `COMMENT_EDIT_TIME_LIMIT` | Int (seconds) | 300 | Thời gian cho phép chỉnh sửa comment |
| `MAX_TAGS_PER_POST` | Int | 5 | Số tag tối đa mỗi bài viết |
| `UPVOTE_REPUTATION_DELTA` | Int | 10 | Điểm reputation khi nhận upvote |
| `DOWNVOTE_REPUTATION_DELTA` | Int | 5 | Điểm reputation bị trừ khi nhận downvote |
| `MAX_FILE_SIZE_MB` | Int | 5 | Kích thước file upload tối đa |

**Bảng 5.14 — API Endpoints: Config**

| Method | Endpoint | Chức năng | Auth |
|--------|---------|-----------|------|
| GET | `/config` | Lấy tất cả config | Không (public values) |
| GET | `/config/:key` | Lấy giá trị config cụ thể | Không |
| PATCH | `/config/:key` | Cập nhật config | Có (Admin) |

---

## Tóm tắt chương 5

Chương 5 đã đặc tả chi tiết **10 module chức năng** của MINI-FORUM:

1. **Auth Module** — 8 endpoints, dual-token security, OTP flow
2. **Post Module** — 11 endpoints, Block Layout, State Machine 4 trạng thái
3. **Comment Module** — Self-referencing 2 cấp, time-limited edit
4. **User Module** — Profile management, ImageKit avatar
5. **Notification Module** — 5 event types, SSE stream, soft delete
6. **Search Module** — PostgreSQL FTS, 3 scope tìm kiếm
7. **Vote & Bookmark Module** — Idempotent toggle vote, reputation update
8. **Category & Tag Module** — Permission-aware access, tag usage tracking
9. **Media Module** — ImageKit CDN, dual-resolution storage
10. **Config Module** — Dynamic configuration, no-redeploy tuning

Tổng cộng: **~70 API endpoints** được tổ chức theo RESTful convention, tất cả đều có authentication/authorization tại middleware layer — không có business logic nào bypass layer bảo mật.

Chương tiếp theo sẽ phân tích hệ thống báo cáo và kiểm soát: dashboard thống kê, audit trail và quy trình xử lý báo cáo vi phạm.
