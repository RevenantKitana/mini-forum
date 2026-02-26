# Comment Endpoints

> **Base path**: `/comments`  
> **Endpoints**: 5  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/comments/:id` | Public |
| GET | `/comments/:id/replies` | Public |
| PUT | `/comments/:id` | Owner |
| DELETE | `/comments/:id` | Owner/MOD/ADMIN |
| PATCH | `/comments/:id/hide` | MOD/ADMIN |

---

## `GET /comments/:id`

Lấy chi tiết một bình luận.

**Access**: Public

**Path Parameters**: `id` — Comment ID

**Response `200`**: Comment Object.

---

## `GET /comments/:id/replies`

Lấy danh sách replies của một bình luận.

**Access**: Public

**Path Parameters**: `id` — Comment ID

**Query Parameters**: `page`, `limit`

**Response `200`**: Danh sách Comment Objects (replies) với pagination.

---

## `PUT /comments/:id`

Cập nhật nội dung bình luận.

**Access**: Private (chỉ tác giả)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `content` | string | Yes | 1-5000 chars |

**Response `200`**: Updated Comment Object.

---

## `DELETE /comments/:id`

Xóa bình luận.

**Access**: Private (tác giả hoặc MODERATOR/ADMIN)

**Response `200`**: `{ "message": "Comment deleted" }`

---

## `PATCH /comments/:id/hide`

Ẩn/hiện bình luận (soft hide).

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**: `{ "status": "HIDDEN" }`
