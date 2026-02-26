# Tag Endpoints

> **Base path**: `/tags`  
> **Endpoints**: 8  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/tags` | Public |
| GET | `/tags/popular` | Public |
| GET | `/tags/search` | Public |
| GET | `/tags/slug/:slug` | Public |
| GET | `/tags/:id` | Public |
| POST | `/tags` | MOD/ADMIN |
| PUT | `/tags/:id` | ADMIN |
| DELETE | `/tags/:id` | ADMIN |

---

## `GET /tags`

Lấy tất cả tags.

**Access**: Public

**Query Parameters**:

| Param | Type | Default |
|-------|------|---------|
| `page` | integer | `1` |
| `limit` | integer | `20` |

**Response `200`**: Danh sách Tag Objects với pagination.

---

## `GET /tags/popular`

Lấy tags phổ biến nhất.

**Access**: Public

**Query Parameters**: `limit` (default: 20)

**Response `200`**: Danh sách tags sắp xếp theo lần sử dụng.

---

## `GET /tags/search`

Tìm kiếm tags theo tên.

**Access**: Public

**Query Parameters**:

| Param | Type | Required |
|-------|------|----------|
| `q` | string | Yes |
| `limit` | integer | No (default: 10) |

**Response `200`**: Danh sách tags khớp với từ khóa.

---

## `GET /tags/slug/:slug`

Lấy tag theo slug.

**Access**: Public

**Response `200`**: Tag Object.

---

## `GET /tags/:id`

Lấy tag theo ID.

**Access**: Public

**Response `200`**: Tag Object.

---

## `POST /tags`

Tạo tag mới.

**Access**: Private (MODERATOR/ADMIN)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | 2-50 chars |
| `slug` | string | No | 2-50 chars, chỉ `[a-z0-9-]`, auto-generate nếu không có |
| `description` | string | No | Max 200 chars |

**Response `201`**: Tag Object vừa tạo.

---

## `PUT /tags/:id`

Cập nhật tag.

**Access**: Private (ADMIN)

**Request Body**: `name` (optional), `description` (optional)

**Response `200`**: Updated Tag Object.

---

## `DELETE /tags/:id`

Xóa tag.

**Access**: Private (ADMIN)

**Response `200`**: `{ "message": "Tag deleted" }`
