# Search Endpoints

> **Base path**: `/search`  
> **Endpoints**: 3  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/search` | Public |
| GET | `/search/users` | Public |
| GET | `/search/suggestions` | Public |

---

## `GET /search`

Tìm kiếm bài viết toàn văn bản.

**Access**: Public

**Query Parameters**:

| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `q` | string | Yes | Từ khóa tìm kiếm (1-100 chars) |
| `category` | string | No | Filter theo category slug |
| `tag` | string | No | Filter theo tag slug |
| `author` | string | No | Filter theo username tác giả |
| `page` | integer | No (default: `1`) | |
| `limit` | integer | No (default: `10`, max 50) | |
| `sort` | string | No (default: `relevance`) | `relevance` \| `latest` \| `popular` \| `trending` \| `oldest` |

**Response `200`**: Danh sách posts khớp với từ khóa kèm pagination.

---

## `GET /search/users`

Tìm kiếm người dùng.

**Access**: Public

**Query Parameters**:

| Param | Type | Required |
|-------|------|----------|
| `q` | string | Yes |
| `page` | integer | No |
| `limit` | integer | No |

**Response `200`**: Danh sách users với pagination.

---

## `GET /search/suggestions`

Lấy gợi ý tìm kiếm (autocomplete).

**Access**: Public

**Query Parameters**:

| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `q` | string | Yes | Prefix từ khóa |
| `limit` | integer | No (default: 5) | |

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "suggestions": ["javascript", "java", "jamstack"]
  }
}
```
