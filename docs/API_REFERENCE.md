# API Reference — Mini Forum Backend

Base URL: `/api/v1`

## Quy ước chung

### Authentication

Các endpoint đánh dấu **Auth: Private** yêu cầu header:

```
Authorization: Bearer <access_token>
```

Các endpoint **Auth: Optional** sẽ trả thêm thông tin nếu có token hợp lệ.

### Response format

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Pagination

Các endpoint danh sách hỗ trợ:

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 10-20 | Số item per page |

Response pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 1. Authentication (`/auth`)

### `GET /auth/check-email`

Kiểm tra email khả dụng.

| Param | Type | Mô tả |
|---|---|---|
| `email` | query | Email cần kiểm tra |

### `GET /auth/check-username`

Kiểm tra username khả dụng.

| Param | Type | Mô tả |
|---|---|---|
| `username` | query | Username cần kiểm tra |

### `POST /auth/send-otp-register`

Gửi OTP qua email để đăng ký. **Rate limit: 3 requests / 5 phút.**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `email` | string | ✅ | Email đăng ký |

### `POST /auth/verify-otp-register`

Xác thực OTP đăng ký. **Rate limit: 10 requests / 10 phút.**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `email` | string | ✅ | Email đã gửi OTP |
| `otp` | string | ✅ | Mã OTP 6 chữ số |

### `POST /auth/register`

Đăng ký tài khoản mới (cần verify OTP trước).

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `email` | string | ✅ | Email đã verify |
| `username` | string | ✅ | Username (unique) |
| `password` | string | ✅ | Mật khẩu |
| `displayName` | string | ✅ | Tên hiển thị |

### `POST /auth/send-otp-reset`

Gửi OTP reset mật khẩu. **Rate limit: 3 requests / 5 phút.**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `email` | string | ✅ | Email tài khoản |

### `POST /auth/verify-otp-reset`

Xác thực OTP reset mật khẩu. **Rate limit: 10 requests / 10 phút.**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `email` | string | ✅ | Email tài khoản |
| `otp` | string | ✅ | Mã OTP |

### `POST /auth/reset-password`

Reset mật khẩu (sau khi verify OTP).

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `email` | string | ✅ | Email đã verify |
| `password` | string | ✅ | Mật khẩu mới |

### `POST /auth/login`

Đăng nhập. **Rate limit: 10 requests / 15 phút (failed attempts only).**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `email` | string | ✅ | Email |
| `password` | string | ✅ | Mật khẩu |

**Response**: `{ accessToken, refreshToken, user }`

### `POST /auth/refresh`

Refresh access token.

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `refreshToken` | string | ✅ | Refresh token |

**Response**: `{ accessToken, refreshToken }`

### `POST /auth/logout`

Đăng xuất (invalidate refresh token hiện tại).

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `refreshToken` | string | ✅ | Refresh token cần invalidate |

### `POST /auth/logout-all` — **Auth: Private**

Đăng xuất tất cả phiên. Xóa toàn bộ refresh tokens của user.

### `GET /auth/me` — **Auth: Private**

Lấy thông tin user hiện tại.

---

## 2. Posts (`/posts`)

### `GET /posts` — **Auth: Optional**

Lấy danh sách bài viết (phân trang, lọc).

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `page` | number | 1 | Trang |
| `limit` | number | 20 | Số bài per page |
| `categoryId` | number | - | Lọc theo category |
| `tagId` | number | - | Lọc theo tag |
| `status` | string | - | Lọc theo status |
| `sort` | string | - | Sắp xếp |

### `GET /posts/featured` — **Auth: Optional**

Lấy bài viết nổi bật (pinned).

### `GET /posts/latest` — **Auth: Optional**

Lấy bài viết mới nhất.

### `GET /posts/:id` — **Auth: Optional**

Lấy chi tiết bài viết. Tự tăng `view_count`.

### `POST /posts` — **Auth: Private**

Tạo bài viết mới. **Rate limit: 5 requests / phút.**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `title` | string | ✅ | Tiêu đề |
| `content` | string | ✅ | Nội dung (markdown) |
| `categoryId` | number | ✅ | Danh mục |
| `tagIds` | number[] | ❌ | Danh sách tag IDs |
| `status` | string | ❌ | `DRAFT` hoặc `PUBLISHED` (default) |

### `PUT /posts/:id` — **Auth: Private** (Owner)

Cập nhật bài viết.

### `DELETE /posts/:id` — **Auth: Private** (Owner/Mod/Admin)

Xóa bài viết.

### `PATCH /posts/:id/status` — **Auth: Private**

Thay đổi trạng thái bài viết.

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `status` | string | ✅ | `PUBLISHED`, `HIDDEN`, `DELETED` |

### `PATCH /posts/:id/pin` — **Auth: Private** (Mod/Admin)

Toggle pin bài viết.

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `is_pinned` | boolean | ✅ | Pin/unpin |
| `pin_type` | string | ❌ | `GLOBAL` hoặc `CATEGORY` |

### `PATCH /posts/:id/lock` — **Auth: Private** (Mod/Admin)

Toggle lock bài viết (ngăn comment mới).

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `is_locked` | boolean | ✅ | Lock/unlock |

### `GET /posts/:postId/comments`

Lấy bình luận của bài viết.

### `POST /posts/:postId/comments` — **Auth: Private**

Tạo bình luận cho bài viết.

### `GET /users/:username/posts`

Lấy bài viết của user theo username.

---

## 3. Comments (`/comments`)

### `GET /comments/:id`

Lấy chi tiết bình luận.

### `PUT /comments/:id` — **Auth: Private** (Owner)

Cập nhật bình luận (giới hạn thời gian sửa: 30 phút mặc định).

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `content` | string | ✅ | Nội dung mới |

### `DELETE /comments/:id` — **Auth: Private** (Owner/Mod/Admin)

Xóa bình luận (soft delete).

### `GET /comments/:id/replies`

Lấy replies của bình luận.

---

## 4. Categories (`/categories`)

### `GET /categories`

Lấy tất cả danh mục.

### `GET /categories/slug/:slug`

Lấy danh mục theo slug.

### `GET /categories/:id`

Lấy danh mục theo ID.

### `GET /categories/:id/tags`

Lấy tags phổ biến trong danh mục.

### `POST /categories` — **Auth: Private** (Admin)

Tạo danh mục mới.

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `name` | string | ✅ | Tên danh mục |
| `description` | string | ❌ | Mô tả |
| `color` | string | ❌ | Mã màu |
| `sort_order` | number | ❌ | Thứ tự sắp xếp |
| `view_permission` | string | ❌ | `ALL`, `MEMBER`, `MODERATOR`, `ADMIN` |
| `post_permission` | string | ❌ | Quyền tạo bài |
| `comment_permission` | string | ❌ | Quyền bình luận |

### `PUT /categories/:id` — **Auth: Private** (Admin)

Cập nhật danh mục.

### `DELETE /categories/:id` — **Auth: Private** (Admin)

Xóa danh mục.

---

## 5. Tags (`/tags`)

### `GET /tags`

Lấy tất cả tags.

### `GET /tags/slug/:slug`

Lấy tag theo slug.

### `GET /tags/:id`

Lấy tag theo ID.

### `POST /tags` — **Auth: Private** (Mod/Admin)

Tạo tag mới.

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `name` | string | ✅ | Tên tag |
| `description` | string | ❌ | Mô tả |
| `use_permission` | string | ❌ | `ALL`, `MEMBER`, `MODERATOR`, `ADMIN` |

### `PUT /tags/:id` — **Auth: Private** (Mod/Admin)

Cập nhật tag.

### `DELETE /tags/:id` — **Auth: Private** (Mod/Admin)

Xóa tag.

---

## 6. Votes

### `GET /posts/:id/vote` — **Auth: Private**

Lấy vote của user trên bài viết.

### `POST /posts/:id/vote` — **Auth: Private**

Vote bài viết. **Rate limit: 30 requests / phút.**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `value` | number | ✅ | `1` (upvote) hoặc `-1` (downvote) |

### `DELETE /posts/:id/vote` — **Auth: Private**

Hủy vote bài viết.

### `GET /comments/:id/vote` — **Auth: Private**

Lấy vote của user trên bình luận.

### `POST /comments/:id/vote` — **Auth: Private**

Vote bình luận. **Rate limit: 30 requests / phút.**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `value` | number | ✅ | `1` hoặc `-1` |

### `DELETE /comments/:id/vote` — **Auth: Private**

Hủy vote bình luận.

### `GET /users/me/votes` — **Auth: Private**

Lấy lịch sử vote của user.

---

## 7. Bookmarks

### `GET /posts/:id/bookmark` — **Auth: Private**

Kiểm tra bài viết đã bookmark chưa.

### `POST /posts/:id/bookmark` — **Auth: Private**

Bookmark bài viết.

### `DELETE /posts/:id/bookmark` — **Auth: Private**

Bỏ bookmark bài viết.

### `GET /users/bookmarks` — **Auth: Private**

Lấy danh sách bài viết đã bookmark.

---

## 8. Users (`/users`)

### `GET /users/username/:username` — **Auth: Optional**

Lấy thông tin user theo username.

### `GET /users/:id` — **Auth: Optional**

Lấy thông tin user theo ID.

### `GET /users/:id/posts` — **Auth: Optional**

Lấy bài viết của user.

### `GET /users/:id/comments` — **Auth: Optional**

Lấy bình luận của user.

### `PUT /users/:id` — **Auth: Private** (Owner)

Cập nhật hồ sơ.

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `displayName` | string | ❌ | Tên hiển thị |
| `bio` | string | ❌ | Tiểu sử |
| `dateOfBirth` | string | ❌ | Ngày sinh |
| `gender` | string | ❌ | Giới tính |

### `PATCH /users/:id/username` — **Auth: Private** (Owner)

Đổi username (giới hạn 1 lần / 30 ngày).

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `username` | string | ✅ | Username mới |

### `PATCH /users/:id/password` — **Auth: Private** (Owner)

Đổi mật khẩu.

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `currentPassword` | string | ✅ | Mật khẩu hiện tại |
| `newPassword` | string | ✅ | Mật khẩu mới |

### `PATCH /users/:id/avatar` — **Auth: Private** (Owner)

Cập nhật avatar URL.

---

## 9. Block & Report

### Block users

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/users/me/blocked` | Private | Danh sách user đã chặn |
| `GET` | `/users/:id/block` | Private | Kiểm tra đã chặn chưa |
| `POST` | `/users/:id/block` | Private | Chặn user |
| `DELETE` | `/users/:id/block` | Private | Bỏ chặn user |

### Report content

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/posts/:id/report` | Private | Báo cáo bài viết |
| `POST` | `/comments/:id/report` | Private | Báo cáo bình luận |
| `POST` | `/users/:id/report` | Private | Báo cáo người dùng |

**Body báo cáo:**

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `reason` | string | ✅ | Lý do báo cáo |
| `description` | string | ❌ | Mô tả chi tiết |

### Manage reports (Mod/Admin)

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/reports` | Mod/Admin | Danh sách reports |
| `GET` | `/reports/pending/count` | Mod/Admin | Số reports pending |
| `GET` | `/reports/:id` | Mod/Admin | Chi tiết report |
| `PATCH` | `/reports/:id/status` | Mod/Admin | Cập nhật trạng thái |

---

## 10. Search (`/search`)

**Rate limit: 30 requests / phút** cho tất cả search endpoints.

### `GET /search`

Tìm kiếm bài viết.

| Param | Type | Mô tả |
|---|---|---|
| `q` | string | Từ khóa tìm kiếm |
| `page` | number | Trang |
| `limit` | number | Số kết quả |
| `categoryId` | number | Lọc theo category |

### `GET /search/users`

Tìm kiếm người dùng.

| Param | Type | Mô tả |
|---|---|---|
| `q` | string | Từ khóa |
| `page` | number | Trang |
| `limit` | number | Số kết quả |

### `GET /search/suggestions`

Gợi ý tìm kiếm.

| Param | Type | Mô tả |
|---|---|---|
| `q` | string | Từ khóa |

---

## 11. Notifications (`/notifications`)

### `GET /notifications` — **Auth: Private**

Lấy thông báo (phân trang).

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `page` | number | 1 | Trang |
| `limit` | number | 20 | Số thông báo |
| `unreadOnly` | boolean | false | Chỉ chưa đọc |

### `GET /notifications/unread-count` — **Auth: Private**

Lấy số thông báo chưa đọc.

### `PATCH /notifications/read-all` — **Auth: Private**

Đánh dấu tất cả đã đọc.

### `PATCH /notifications/:id/read` — **Auth: Private**

Đánh dấu 1 thông báo đã đọc.

### `PATCH /notifications/:id/restore` — **Auth: Private**

Khôi phục thông báo đã xóa.

### `DELETE /notifications/:id` — **Auth: Private**

Xóa thông báo (soft delete).

### `DELETE /notifications` — **Auth: Private**

Xóa tất cả thông báo.

---

## 12. Admin (`/admin`)

> Tất cả endpoints yêu cầu role **MODERATOR** hoặc **ADMIN** (trừ khi ghi chú riêng).

### Dashboard

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/dashboard` | Thống kê tổng quan (users, posts, comments, reports) |

### User management

| Method | Path | Role | Mô tả |
|---|---|---|---|
| `GET` | `/admin/users` | Mod/Admin | Danh sách users |
| `PATCH` | `/admin/users/:id/role` | Admin | Thay đổi role |
| `PATCH` | `/admin/users/:id/status` | Mod/Admin | Ban/unban |
| `DELETE` | `/admin/users/:id` | Admin | Xóa user |

### Post management

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/posts` | Danh sách posts |
| `PATCH` | `/admin/posts/:id/status` | Thay đổi status |
| `PATCH` | `/admin/posts/:id/pin` | Pin/unpin |
| `PATCH` | `/admin/posts/:id/lock` | Lock/unlock |
| `POST` | `/admin/posts/reorder-pins` | Sắp xếp thứ tự pin |
| `DELETE` | `/admin/posts/:id` | Xóa post |

### Comment management

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/comments` | Danh sách comments |
| `PATCH` | `/admin/comments/:id/status` | Thay đổi status |
| `PATCH` | `/admin/comments/:id/mask` | Mask/unmask nội dung |
| `GET` | `/admin/comments/:id/masked-content` | Xem nội dung đã mask |
| `DELETE` | `/admin/comments/:id` | Xóa comment |

### Category management (Admin only)

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/categories` | Danh sách categories |
| `POST` | `/admin/categories` | Tạo category |
| `PUT` | `/admin/categories/:id` | Cập nhật category |
| `DELETE` | `/admin/categories/:id` | Xóa category |

### Tag management

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/tags` | Danh sách tags |
| `POST` | `/admin/tags` | Tạo tag |
| `PATCH` | `/admin/tags/:id` | Cập nhật tag |
| `DELETE` | `/admin/tags/:id` | Xóa tag |

### Report management

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/reports` | Danh sách reports |
| `POST` | `/admin/reports` | Tạo report |
| `PATCH` | `/admin/reports/:id` | Cập nhật report |
| `DELETE` | `/admin/reports/:id` | Xóa report |

### Audit logs (Admin only)

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/audit-logs` | Nhật ký hành động admin |

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `page` | number | Trang |
| `limit` | number | Số logs per page |
| `action` | string | Lọc theo action |
| `targetType` | string | Lọc theo target type |
| `userId` | number | Lọc theo user |

---

## 13. Config (`/config`)

### `GET /config/public`

Lấy cấu hình công khai (comment edit time limit, etc.).

### `GET /config/categories`

Lấy danh sách categories với permissions (cho menu/navigation).

---

## 14. Health Check

### `GET /`

Root endpoint — trả về thông tin server.

### `GET /api/v1/health`

Health check endpoint.
