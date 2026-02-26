# Admin Endpoints

> **Base path**: `/admin`  
> **Endpoints**: 31  
> **Tất cả endpoints yêu cầu role MODERATOR hoặc ADMIN, trừ khi có ghi chú khác (ADMIN only).**  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/dashboard` | MOD/ADMIN |
| GET | `/admin/users` | MOD/ADMIN |
| GET | `/admin/users/:id` | MOD/ADMIN |
| PATCH | `/admin/users/:id/role` | **ADMIN only** |
| PATCH | `/admin/users/:id/status` | MOD/ADMIN |
| DELETE | `/admin/users/:id` | **ADMIN only** |
| GET | `/admin/reports` | MOD/ADMIN |
| GET | `/admin/reports/:id` | MOD/ADMIN |
| PATCH | `/admin/reports/:id` | MOD/ADMIN |
| GET | `/admin/posts` | MOD/ADMIN |
| GET | `/admin/posts/pinned` | MOD/ADMIN |
| PATCH | `/admin/posts/:id/status` | MOD/ADMIN |
| PATCH | `/admin/posts/:id/pin` | MOD/ADMIN |
| PATCH | `/admin/posts/:id/pin-order` | MOD/ADMIN |
| PATCH | `/admin/posts/:id/lock` | MOD/ADMIN |
| PATCH | `/admin/posts/reorder-pins` | **ADMIN only** |
| DELETE | `/admin/posts/:id` | MOD/ADMIN |
| GET | `/admin/comments` | MOD/ADMIN |
| GET | `/admin/comments/:id/content` | MOD/ADMIN |
| PATCH | `/admin/comments/:id/status` | MOD/ADMIN |
| PATCH | `/admin/comments/:id/mask` | MOD/ADMIN |
| DELETE | `/admin/comments/:id` | MOD/ADMIN |
| GET | `/admin/categories` | MOD/ADMIN |
| POST | `/admin/categories` | **ADMIN only** |
| PATCH | `/admin/categories/:id` | **ADMIN only** |
| DELETE | `/admin/categories/:id` | **ADMIN only** |
| GET | `/admin/tags` | MOD/ADMIN |
| POST | `/admin/tags` | MOD/ADMIN |
| PATCH | `/admin/tags/:id` | MOD/ADMIN |
| DELETE | `/admin/tags/:id` | MOD/ADMIN |
| GET | `/admin/audit-logs` | **ADMIN only** |

---

## Dashboard

### `GET /admin/dashboard`

Lấy thống kê tổng quan của hệ thống.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 500,
    "totalPosts": 1200,
    "totalComments": 8000,
    "newUsersToday": 10,
    "newPostsToday": 25,
    "pendingReports": 5,
    "activeUsers7d": 120
  }
}
```

---

## User Management

### `GET /admin/users`

Lấy danh sách tất cả users.

**Access**: Private (MODERATOR/ADMIN)

**Query Parameters**:

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | integer | `1` | |
| `limit` | integer | `20` | |
| `search` | string | — | Tìm theo username/email |
| `role` | string | — | Filter theo role |
| `status` | string | — | Filter theo trạng thái |

**Response `200`**: Danh sách User Objects với pagination.

---

### `GET /admin/users/:id`

Lấy chi tiết user theo ID.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**: Chi tiết User Object bao gồm stats và activity.

---

### `PATCH /admin/users/:id/role`

Thay đổi role của user.

**Access**: Private (**ADMIN only**)

**Request Body**:

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `role` | string | Yes | `MEMBER` \| `MODERATOR` \| `ADMIN` |

**Response `200`**: `{ "message": "Role updated" }`

---

### `PATCH /admin/users/:id/status`

Kích hoạt hoặc vô hiệu hóa user.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**:

| Field | Type | Required |
|-------|------|----------|
| `isActive` | boolean | Yes |
| `reason` | string | No |

**Response `200`**: `{ "message": "User status updated" }`

---

### `DELETE /admin/users/:id`

Xóa user vĩnh viễn.

**Access**: Private (**ADMIN only**)

**Response `200`**: `{ "message": "User deleted" }`

---

## Report Management

### `GET /admin/reports`

Lấy danh sách báo cáo (admin view với chi tiết đầy đủ).

**Access**: Private (MODERATOR/ADMIN)

**Query Parameters**: `page`, `limit`, `status`, `targetType`

**Response `200`**: Danh sách report objects với pagination.

---

### `GET /admin/reports/:id`

Xem chi tiết báo cáo.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**: Report Object đầy đủ thông tin.

---

### `PATCH /admin/reports/:id`

Cập nhật trạng thái báo cáo.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**:

| Field | Type | Required |
|-------|------|----------|
| `status` | string | Yes |
| `note` | string | No |

**Response `200`**: Updated Report Object.

---

## Post Management

### `GET /admin/posts`

Lấy danh sách tất cả bài viết (bao gồm cả HIDDEN/DELETED).

**Access**: Private (MODERATOR/ADMIN)

**Query Parameters**:

| Param | Type | Mô tả |
|-------|------|-------|
| `page` | integer | |
| `limit` | integer | |
| `search` | string | |
| `status` | string | Filter trạng thái |
| `category` | string | Filter category |
| `author` | string | Filter tác giả |

---

### `GET /admin/posts/pinned`

Lấy danh sách bài viết đang được ghim.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**: Danh sách pinned posts theo thứ tự.

---

### `PATCH /admin/posts/:id/status`

Cập nhật trạng thái bài viết.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**: `{ "status": "HIDDEN" | "PUBLISHED" | "DELETED" | "DRAFT" }`

---

### `PATCH /admin/posts/:id/pin`

Toggle ghim bài viết.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**: `{ "pinType": "GLOBAL" | "CATEGORY" }`

---

### `PATCH /admin/posts/:id/pin-order`

Cập nhật thứ tự ghim của bài viết.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**:
```json
{ "pinOrder": 2 }
```

---

### `PATCH /admin/posts/:id/lock`

Toggle khóa bài viết.

**Access**: Private (MODERATOR/ADMIN)

---

### `PATCH /admin/posts/reorder-pins`

Sắp xếp lại thứ tự tất cả bài viết được ghim.

**Access**: Private (**ADMIN only**)

**Request Body**:
```json
{ "postIds": [3, 1, 5, 2] }
```

---

### `DELETE /admin/posts/:id`

Xóa bài viết (ADMIN action).

**Access**: Private (MODERATOR/ADMIN)

---

## Comment Management

### `GET /admin/comments`

Lấy danh sách tất cả bình luận.

**Access**: Private (MODERATOR/ADMIN)

**Query Parameters**: `page`, `limit`, `search`, `status`, `postId`

---

### `GET /admin/comments/:id/content`

Xem nội dung gốc của bình luận đã bị mask.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**:
```json
{
  "success": true,
  "data": { "originalContent": "Unmasked content here..." }
}
```

---

### `PATCH /admin/comments/:id/status`

Cập nhật trạng thái bình luận.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**: `{ "status": "VISIBLE" | "HIDDEN" | "DELETED" }`

---

### `PATCH /admin/comments/:id/mask`

Toggle mask/unmask nội dung bình luận nhạy cảm.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**: `{ "isContentMasked": true }`

---

### `DELETE /admin/comments/:id`

Xóa bình luận.

**Access**: Private (MODERATOR/ADMIN)

---

## Category Management (Admin)

### `GET /admin/categories`

Lấy tất cả categories (bao gồm inactive).

**Access**: Private (MODERATOR/ADMIN)

---

### `POST /admin/categories`

Tạo category mới (qua admin panel).

**Access**: Private (**ADMIN only**)

**Request Body**: Giống [POST /categories](./08-categories.md#post-categories)

---

### `PATCH /admin/categories/:id`

Cập nhật category.

**Access**: Private (**ADMIN only**)

---

### `DELETE /admin/categories/:id`

Xóa category.

**Access**: Private (**ADMIN only**)

---

## Tag Management (Admin)

### `GET /admin/tags`

Lấy tất cả tags (admin view với thống kê chi tiết).

**Access**: Private (MODERATOR/ADMIN)

---

### `POST /admin/tags`

Tạo tag mới qua admin panel.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**: Giống [POST /tags](./09-tags.md#post-tags)

---

### `PATCH /admin/tags/:id`

Cập nhật tag.

**Access**: Private (MODERATOR/ADMIN)

---

### `DELETE /admin/tags/:id`

Xóa tag.

**Access**: Private (MODERATOR/ADMIN)

---

## Audit Logs

### `GET /admin/audit-logs`

Lấy nhật ký hoạt động hệ thống.

**Access**: Private (**ADMIN only**)

**Query Parameters**:

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | integer | `1` | |
| `limit` | integer | `50` | |
| `userId` | integer | — | Filter theo user |
| `action` | string | — | Loại hành động |
| `targetType` | string | — | Loại đối tượng |
| `dateFrom` | string | — | ISO date |
| `dateTo` | string | — | ISO date |

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "action": "DELETE_POST",
      "targetType": "POST",
      "targetId": 55,
      "targetName": "Post Title",
      "oldValue": null,
      "newValue": null,
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-02-20T10:00:00.000Z"
    }
  ],
  "pagination": { "..." }
}
```
