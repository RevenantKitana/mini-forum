# Vote Endpoints

> **Routes mount ở root level** `/`  
> **Endpoints**: 7  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/users/me/votes` | Bearer |
| GET | `/posts/:id/vote` | Bearer |
| POST | `/posts/:id/vote` | Bearer |
| DELETE | `/posts/:id/vote` | Bearer |
| GET | `/comments/:id/vote` | Bearer |
| POST | `/comments/:id/vote` | Bearer |
| DELETE | `/comments/:id/vote` | Bearer |

---

## `GET /users/me/votes`

Xem lịch sử bình chọn của user hiện tại.

> Xem chi tiết tại [User Endpoints > GET /users/me/votes](./02-users.md#get-usersmevotes)

---

## `GET /posts/:id/vote`

Lấy vote hiện tại của user với bài viết.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — Post ID

**Response `200`**:
```json
{
  "success": true,
  "data": { "voteType": "UPVOTE" }
}
```

> `voteType` là `null` nếu chưa vote.

---

## `POST /posts/:id/vote`

Bình chọn cho bài viết.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — Post ID

**Request Body**:

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `voteType` | string | Yes | `UPVOTE` \| `DOWNVOTE` |

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "upvoteCount": 13,
    "downvoteCount": 2
  }
}
```

---

## `DELETE /posts/:id/vote`

Xóa vote của user với bài viết.

**Access**: Private (Bearer Token)

**Response `200`**: `{ "message": "Vote removed" }`

---

## `GET /comments/:id/vote`

Lấy vote hiện tại của user với bình luận.

**Access**: Private (Bearer Token)

**Path Parameters**: `id` — Comment ID

**Response `200`**: Tương tự vote post.

---

## `POST /comments/:id/vote`

Bình chọn cho bình luận.

**Access**: Private (Bearer Token)

**Request Body**: `{ "voteType": "UPVOTE" | "DOWNVOTE" }`

**Response `200`**: Updated vote counts.

---

## `DELETE /comments/:id/vote`

Xóa vote của user với bình luận.

**Access**: Private (Bearer Token)

**Response `200`**: `{ "message": "Vote removed" }`
