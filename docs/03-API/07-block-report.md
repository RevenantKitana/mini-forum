# Block & Report Endpoints

> **Routes mount ở root level** `/`  
> **Endpoints**: 11  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/users/me/blocked` | Bearer |
| GET | `/users/:id/block` | Bearer |
| POST | `/users/:id/block` | Bearer |
| DELETE | `/users/:id/block` | Bearer |
| POST | `/posts/:id/report` | Bearer |
| POST | `/comments/:id/report` | Bearer |
| POST | `/users/:id/report` | Bearer |
| GET | `/reports` | MOD/ADMIN |
| GET | `/reports/pending/count` | MOD/ADMIN |
| GET | `/reports/:id` | MOD/ADMIN |
| PATCH | `/reports/:id/status` | MOD/ADMIN |

---

## Block

### `GET /users/me/blocked`

Lấy danh sách user đã bị block.

**Access**: Private (Bearer Token)

**Response `200`**: Danh sách blocked users.

---

### `GET /users/:id/block`

Kiểm tra user có đang bị block không.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — User ID cần kiểm tra

**Response `200`**:
```json
{
  "success": true,
  "data": { "isBlocked": false }
}
```

---

### `POST /users/:id/block`

Block một user.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — User ID cần block

**Response `200`**: `{ "message": "User blocked" }`

---

### `DELETE /users/:id/block`

Unblock một user.

**Access**: Private (Bearer Token)

**Response `200`**: `{ "message": "User unblocked" }`

---

## Report

### `POST /posts/:id/report`

Báo cáo bài viết vi phạm.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — Post ID

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `reason` | string | Yes | 1-100 chars |
| `description` | string | No | Max 1000 chars |

**Response `201`**: `{ "message": "Report submitted" }`

---

### `POST /comments/:id/report`

Báo cáo bình luận vi phạm.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — Comment ID

**Request Body**: Tương tự report post.

**Response `201`**: `{ "message": "Report submitted" }`

---

### `POST /users/:id/report`

Báo cáo người dùng vi phạm.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — User ID

**Request Body**: Tương tự report post.

**Response `201`**: `{ "message": "Report submitted" }`

---

## Report Management (MOD/ADMIN)

### `GET /reports`

Lấy danh sách báo cáo.

**Access**: Private (MODERATOR/ADMIN)

**Query Parameters**:

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | integer | `1` | |
| `limit` | integer | `20` (max 50) | |
| `status` | string | — | `PENDING` \| `REVIEWED` \| `RESOLVED` \| `REJECTED` |
| `targetType` | string | — | `USER` \| `POST` \| `COMMENT` |

**Response `200`**: Danh sách report objects với pagination.

---

### `GET /reports/pending/count`

Lấy số lượng báo cáo đang pending.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**:
```json
{
  "success": true,
  "data": { "count": 15 }
}
```

---

### `GET /reports/:id`

Xem chi tiết báo cáo.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**: Report Object chi tiết.

---

### `PATCH /reports/:id/status`

Cập nhật trạng thái báo cáo.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**:

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | Yes | `REVIEWED` \| `RESOLVED` \| `REJECTED` |

**Response `200`**: Updated Report Object.
