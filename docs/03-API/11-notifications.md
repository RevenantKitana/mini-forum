# Notification Endpoints

> **Base path**: `/notifications`  
> **Endpoints**: 7  
> **Tất cả endpoints yêu cầu xác thực.**  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/notifications` | Bearer |
| GET | `/notifications/unread-count` | Bearer |
| PATCH | `/notifications/read-all` | Bearer |
| PATCH | `/notifications/:id/read` | Bearer |
| PATCH | `/notifications/:id/restore` | Bearer |
| DELETE | `/notifications/:id` | Bearer |
| DELETE | `/notifications` | Bearer |

---

## `GET /notifications`

Lấy danh sách thông báo.

**Access**: Private (Bearer Token)

**Query Parameters**:

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | integer | `1` | |
| `limit` | integer | `20` (max 50) | |
| `unreadOnly` | boolean | `false` | `true` để chỉ lấy chưa đọc |
| `includeDeleted` | boolean | `false` | `true` để bao gồm đã xóa |

> **Lưu ý**: Dùng string `"true"` / `"false"` cho boolean params trong query string.

**Response `200`**: Danh sách Notification Objects với pagination.

---

## `GET /notifications/unread-count`

Lấy số lượng thông báo chưa đọc.

**Access**: Private (Bearer Token)

**Response `200`**:
```json
{
  "success": true,
  "data": { "count": 3 }
}
```

---

## `PATCH /notifications/read-all`

Đánh dấu tất cả thông báo là đã đọc.

**Access**: Private (Bearer Token)

**Response `200`**: `{ "message": "All notifications marked as read" }`

---

## `PATCH /notifications/:id/read`

Đánh dấu một thông báo là đã đọc.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — Notification ID

**Response `200`**: Updated Notification Object.

---

## `PATCH /notifications/:id/restore`

Khôi phục thông báo đã xóa (soft delete).

**Access**: Private (Bearer Token)

**Response `200`**: `{ "message": "Notification restored" }`

---

## `DELETE /notifications/:id`

Xóa một thông báo (soft delete).

**Access**: Private (Bearer Token)

**Response `200`**: `{ "message": "Notification deleted" }`

---

## `DELETE /notifications`

Xóa tất cả thông báo.

**Access**: Private (Bearer Token)

**Response `200`**: `{ "message": "All notifications deleted" }`
