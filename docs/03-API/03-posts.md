# Post Endpoints

> **Base path**: `/posts`  
> **Endpoints**: 13  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/posts` | Optional |
| GET | `/posts/featured` | Optional |
| GET | `/posts/latest` | Optional |
| GET | `/posts/slug/:slug` | Optional |
| GET | `/posts/:id` | Optional |
| POST | `/posts` | MEMBER+ |
| PUT | `/posts/:id` | Owner/MOD/ADMIN |
| DELETE | `/posts/:id` | Owner/MOD/ADMIN |
| PATCH | `/posts/:id/status` | Owner/MOD/ADMIN |
| PATCH | `/posts/:id/pin` | MOD/ADMIN |
| PATCH | `/posts/:id/lock` | MOD/ADMIN |
| GET | `/posts/:postId/comments` | Public |
| POST | `/posts/:postId/comments` | MEMBER+ |

---

## `GET /posts`

Lấy danh sách bài viết (có phân trang & lọc).

**Access**: Public (Optional Auth)

**Query Parameters**:

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | integer | `1` | Trang |
| `limit` | integer | `10` | Số items (max 50) |
| `category` | string | — | Slug của category |
| `tag` | string | — | Slug của tag đơn |
| `tags` | string | — | Nhiều tag, cách nhau bằng dấu phẩy |
| `author` | string | — | Username tác giả |
| `sort` | string | `latest` | `latest` \| `popular` \| `trending` \| `oldest` \| `oldest_first` \| `unpopular` \| `least_trending` |
| `status` | string | `PUBLISHED` | `DRAFT` \| `PUBLISHED` \| `HIDDEN` \| `DELETED` |
| `search` | string | — | Từ khóa tìm kiếm |
| `dateFrom` | string | — | ISO date string (từ ngày) |
| `dateTo` | string | — | ISO date string (đến ngày) |

**Response `200`**: Danh sách posts với pagination.

---

## `GET /posts/featured`

Lấy bài viết nổi bật.

**Access**: Public (Optional Auth)

**Query Parameters**: `page`, `limit`

**Response `200`**: Danh sách featured posts với pagination.

---

## `GET /posts/latest`

Lấy bài viết mới nhất.

**Access**: Public (Optional Auth)

**Query Parameters**: `page`, `limit`

**Response `200`**: Danh sách latest posts với pagination.

---

## `GET /posts/slug/:slug`

Lấy bài viết theo slug.

**Access**: Public (Optional Auth)

**Path Parameters**:

| Param | Type | Mô tả |
|-------|------|-------|
| `slug` | string | Slug của bài viết |

**Response `200`**: Chi tiết Post Object (bao gồm `content`).

---

## `GET /posts/:id`

Lấy bài viết theo ID.

**Access**: Public (Optional Auth)

**Path Parameters**: `id` — Post ID (integer)

**Response `200`**: Chi tiết Post Object.

---

## `POST /posts`

Tạo bài viết mới.

**Access**: Private (MEMBER+)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `title` | string | Yes | 10-200 chars |
| `content` | string | Yes | 20-50000 chars (Markdown) |
| `categoryId` | integer | Yes | Positive integer |
| `tags` | string[] | No | Max 10 tags, mỗi tag max 50 chars |
| `status` | string | No | `DRAFT` \| `PUBLISHED` (default: `PUBLISHED`) |

```json
{
  "title": "My Post Title Here",
  "content": "# Heading\nContent here...",
  "categoryId": 2,
  "tags": ["javascript", "nodejs"],
  "status": "PUBLISHED"
}
```

**Response `201`**: Post Object vừa tạo.

---

## `PUT /posts/:id`

Cập nhật bài viết.

**Access**: Private (tác giả hoặc MODERATOR/ADMIN)

**Path Parameters**: `id` — Post ID

**Request Body** (tất cả optional):

| Field | Type | Validation |
|-------|------|-----------|
| `title` | string | 10-200 chars |
| `content` | string | 20-50000 chars |
| `categoryId` | integer | Positive |
| `tags` | string[] | Max 10 tags |

**Response `200`**: Updated Post Object.

---

## `DELETE /posts/:id`

Xóa bài viết.

**Access**: Private (tác giả hoặc MODERATOR/ADMIN)

**Response `200`**: `{ "message": "Post deleted" }`

---

## `PATCH /posts/:id/status`

Cập nhật trạng thái bài viết.

**Access**: Private (tác giả hoặc MODERATOR/ADMIN)

**Request Body**:

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | Yes | `DRAFT` \| `PUBLISHED` \| `HIDDEN` \| `DELETED` |

**Response `200`**: Updated Post Object.

---

## `PATCH /posts/:id/pin`

Toggle ghim/bỏ ghim bài viết.

**Access**: Private (MODERATOR/ADMIN)

**Request Body** (optional):

| Field | Type | Mô tả |
|-------|------|-------|
| `pinType` | string | `GLOBAL` \| `CATEGORY` |

**Response `200`**: `{ "isPinned": true, "pinType": "GLOBAL" }`

---

## `PATCH /posts/:id/lock`

Toggle khóa/mở khóa bình luận bài viết.

**Access**: Private (MODERATOR/ADMIN)

**Response `200`**: `{ "isLocked": true }`

---

## `GET /posts/:postId/comments`

Lấy danh sách bình luận của một bài viết.

**Access**: Public

**Path Parameters**: `postId` — Post ID

**Query Parameters**:

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | integer | `1` | Trang |
| `limit` | integer | `20` | Số items (max 100) |
| `sort` | string | `oldest` | `latest` \| `oldest` \| `popular` |

**Response `200`**: Danh sách Comment Objects với pagination.

---

## `POST /posts/:postId/comments`

Tạo bình luận mới trong bài viết.

**Access**: Private (MEMBER+)

**Path Parameters**: `postId` — Post ID

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `content` | string | Yes | 1-5000 chars |
| `parentId` | integer | No | ID comment cha (để reply) |
| `quotedCommentId` | integer | No | ID comment được trích dẫn |

```json
{
  "content": "This is my comment!",
  "parentId": 5,
  "quotedCommentId": 3
}
```

**Response `201`**: Comment Object vừa tạo.

**Error `403`**: Bài viết bị khóa (isLocked).
