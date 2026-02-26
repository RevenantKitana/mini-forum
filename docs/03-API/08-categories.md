# Category Endpoints

> **Base path**: `/categories`  
> **Endpoints**: 7  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/categories` | Public |
| GET | `/categories/slug/:slug` | Public |
| GET | `/categories/:id` | Public |
| GET | `/categories/:id/tags` | Public |
| POST | `/categories` | ADMIN |
| PUT | `/categories/:id` | ADMIN |
| DELETE | `/categories/:id` | ADMIN |

---

## `GET /categories`

Lấy tất cả categories.

**Access**: Public

**Response `200`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "General",
      "slug": "general",
      "description": "General discussion",
      "color": "#3B82F6",
      "sortOrder": 0,
      "postCount": 45,
      "isActive": true,
      "viewPermission": "ALL",
      "postPermission": "MEMBER",
      "commentPermission": "MEMBER"
    }
  ]
}
```

---

## `GET /categories/slug/:slug`

Lấy category theo slug.

**Access**: Public

**Path Parameters**: `slug` — Category slug

**Response `200`**: Category Object.

---

## `GET /categories/:id`

Lấy category theo ID.

**Access**: Public

**Path Parameters**: `id` — Category ID

**Response `200`**: Category Object.

---

## `GET /categories/:id/tags`

Lấy danh sách tags phổ biến trong category.

**Access**: Public

**Path Parameters**: `id` — Category ID

**Response `200`**: Danh sách Tag Objects.

---

## `POST /categories`

Tạo category mới.

**Access**: Private (ADMIN)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | |
| `slug` | string | No | Auto-generated từ name nếu không có |
| `description` | string | No | |
| `color` | string | No | Hex color |
| `sortOrder` | integer | No | |
| `viewPermission` | string | No | `ALL` \| `MEMBER` \| `MODERATOR` \| `ADMIN` |
| `postPermission` | string | No | Tương tự |
| `commentPermission` | string | No | Tương tự |

**Response `201`**: Category Object vừa tạo.

---

## `PUT /categories/:id`

Cập nhật category.

**Access**: Private (ADMIN)

**Request Body**: Tất cả fields như POST, đều optional.

**Response `200`**: Updated Category Object.

---

## `DELETE /categories/:id`

Xóa category.

**Access**: Private (ADMIN)

**Response `200`**: `{ "message": "Category deleted" }`
