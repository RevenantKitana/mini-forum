# User Endpoints

> **Base path**: `/users`  
> **Endpoints**: 10  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/users/me/votes` | Bearer |
| GET | `/users/username/:username` | Optional |
| GET | `/users/:id` | Optional |
| GET | `/users/:id/posts` | Optional |
| GET | `/users/:id/comments` | Optional |
| PUT | `/users/:id` | Owner |
| PATCH | `/users/:id/username` | Owner |
| PATCH | `/users/:id/password` | Owner |
| PATCH | `/users/:id/avatar` | Owner |
| GET | `/users/:username/posts` | Public |

---

## `GET /users/me/votes`

Lịch sử bình chọn của tôi.

**Access**: Private (Bearer Token)

**Query Parameters**:

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | integer | `1` | Trang hiện tại |
| `limit` | integer | `10` | Số kết quả mỗi trang (max 50) |

**Response `200`**: Danh sách vote history với pagination.

---

## `GET /users/username/:username`

Lấy thông tin user theo username.

**Access**: Public (Optional Auth)

**Path Parameters**:

| Param | Type | Mô tả |
|-------|------|-------|
| `username` | string | Username của user |

**Response `200`**:
```json
{
  "success": true,
  "data": { "...User Object..." }
}
```

---

## `GET /users/:id`

Lấy thông tin user theo ID.

**Access**: Public (Optional Auth)

**Path Parameters**:

| Param | Type | Mô tả |
|-------|------|-------|
| `id` | integer | User ID |

**Response `200`**:
```json
{
  "success": true,
  "data": { "...User Object..." }
}
```

---

## `GET /users/:id/posts`

Lấy danh sách bài viết của user.

**Access**: Public (Optional Auth)

**Path Parameters**: `id` — User ID

**Query Parameters**:

| Param | Type | Default |
|-------|------|---------|
| `page` | integer | `1` |
| `limit` | integer | `10` (max 50) |

**Response `200`**: Danh sách bài viết với pagination.

---

## `GET /users/:id/comments`

Lấy danh sách bình luận của user.

**Access**: Public (Optional Auth)

**Path Parameters**: `id` — User ID

**Query Parameters**: `page`, `limit` (tương tự trên)

**Response `200`**: Danh sách comment với pagination.

---

## `PUT /users/:id`

Cập nhật hồ sơ người dùng.

**Access**: Private (Bearer Token, chỉ chính user đó)

**Path Parameters**: `id` — User ID

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `displayName` | string | No | 1-50 chars |
| `bio` | string | No | Max 500 chars |
| `dateOfBirth` | string | No | ISO datetime, nullable |
| `gender` | string | No | `male` \| `female` \| `other`, nullable |

```json
{
  "displayName": "New Display Name",
  "bio": "About me...",
  "gender": "male"
}
```

**Response `200`**: Updated User Object.

---

## `PATCH /users/:id/username`

Đổi username.

**Access**: Private (Bearer Token, chỉ chính user đó)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `username` | string | Yes | 3-30 chars, chỉ `[a-zA-Z0-9_]` |

**Response `200`**: `{ "message": "Username updated" }`

**Error `409`**: Username đã tồn tại.

---

## `PATCH /users/:id/password`

Đổi mật khẩu.

**Access**: Private (Bearer Token, chỉ chính user đó)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `currentPassword` | string | Yes | Mật khẩu hiện tại |
| `newPassword` | string | Yes | Min 8 chars, uppercase + lowercase + số |
| `confirmPassword` | string | Yes | Phải khớp `newPassword` |

**Response `200`**: `{ "message": "Password updated" }`

**Error `401`**: `currentPassword` sai.

---

## `PATCH /users/:id/avatar`

Cập nhật avatar URL.

**Access**: Private (Bearer Token, chỉ chính user đó)

**Request Body**:

| Field | Type | Required |
|-------|------|----------|
| `avatarUrl` | string | Yes |

**Response `200`**: Updated User Object.

---

## `GET /users/:username/posts`

Lấy bài viết theo username (alias route).

**Access**: Public

**Path Parameters**: `username` — Username của tác giả

**Query Parameters**: `page`, `limit`

**Response `200`**: Danh sách bài viết với pagination.
