# Bookmark Endpoints

> **Routes mount ở root level** `/`  
> **Endpoints**: 5  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/users/:id/bookmarks` | Owner |
| GET | `/posts/:id/bookmark` | Bearer |
| POST | `/posts/:id/bookmark` | Bearer |
| DELETE | `/posts/:id/bookmark` | Bearer |
| PATCH | `/posts/:id/bookmark` | Bearer |

---

## `GET /users/:id/bookmarks`

Lấy danh sách bookmark của user.

**Access**: Private (Bearer Token, chỉ chính user đó)

**Path Parameters**: `id` — User ID

**Query Parameters**:

| Param | Type | Default |
|-------|------|---------|
| `page` | integer | `1` |
| `limit` | integer | `10` (max 50) |

**Response `200`**: Danh sách bookmarked posts với pagination.

---

## `GET /posts/:id/bookmark`

Kiểm tra user đã bookmark bài viết chưa.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — Post ID

**Response `200`**:
```json
{
  "success": true,
  "data": { "isBookmarked": true }
}
```

---

## `POST /posts/:id/bookmark`

Thêm bookmark.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — Post ID

**Response `201`**: `{ "message": "Bookmark added" }`

**Error `409`**: Đã bookmark trước đó.

---

## `DELETE /posts/:id/bookmark`

Xóa bookmark.

**Access**: Private (Bearer Token)

**Response `200`**: `{ "message": "Bookmark removed" }`

---

## `PATCH /posts/:id/bookmark`

Toggle bookmark (add nếu chưa có, remove nếu đã có).

**Access**: Private (Bearer Token)

**Response `200`**:
```json
{
  "success": true,
  "data": { "isBookmarked": true }
}
```
