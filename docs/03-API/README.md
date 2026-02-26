# API Reference — Mini Forum

> **Version**: v1.16.0  
> **Base URL**: `http://localhost:5000/api/v1`  
> **Format**: JSON (`Content-Type: application/json`)  
> **Last Updated**: 2026-02-25

## Mục đích

Tài liệu tổng quan API: conventions, authentication, response format, error codes, và data models. Từng nhóm endpoint được tách ra file riêng.

## Table of Contents

- [1. Overview](#1-overview)
- [2. Authentication](#2-authentication)
- [3. Response Format](#3-response-format)
- [4. Error Codes](#4-error-codes)
- [5. Data Models](#5-data-models)
- [6. Endpoint Index](#6-endpoint-index)
- [7. Validation Rules](#7-validation-rules)

---

## 1. Overview

### Base URL

```
http://localhost:5000/api/v1
```

### Versioning

API version nằm trong URL: `/api/v1/...`

### Rate Limiting

| Loại | Giới hạn |
|------|----------|
| Chung (toàn API) | 300 requests / 15 phút |
| Auth (login/register) | 10 requests / 15 phút |

---

## 2. Authentication

API sử dụng **JWT Bearer Token** với cơ chế Access Token + Refresh Token.

### Access Token

```
Authorization: Bearer <access_token>
```

| Property | Value |
|----------|-------|
| Loại | Bearer JWT |
| Hết hạn | 15 phút (mặc định) |
| Header | `Authorization: Bearer <token>` |

### Refresh Token

| Property | Value |
|----------|-------|
| Lưu trữ | Body response khi login/register |
| Hết hạn | 7 ngày (mặc định) |
| Endpoint | `POST /auth/refresh` |

### Phân Quyền (Roles)

| Role | Mô tả |
|------|-------|
| `MEMBER` | User thông thường, đã đăng ký |
| `MODERATOR` | Quản trị viên cấp vừa |
| `ADMIN` | Super admin, toàn quyền |

---

## 3. Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [ ... ]
  }
}
```

---

## 4. Error Codes

| HTTP Code | Error Code | Mô tả |
|-----------|-----------|-------|
| `400` | `VALIDATION_ERROR` | Request body hoặc query params không hợp lệ |
| `401` | `UNAUTHORIZED` | Thiếu hoặc token không hợp lệ |
| `401` | `TOKEN_EXPIRED` | Access token đã hết hạn |
| `403` | `FORBIDDEN` | Không đủ quyền thực hiện |
| `404` | `NOT_FOUND` | Resource không tồn tại |
| `409` | `CONFLICT` | Trùng lặp dữ liệu (email, username đã tồn tại) |
| `422` | `UNPROCESSABLE_ENTITY` | Logic nghiệp vụ không hợp lệ |
| `429` | `RATE_LIMIT_EXCEEDED` | Vượt quá giới hạn request |
| `500` | `INTERNAL_SERVER_ERROR` | Lỗi server |

---

## 5. Data Models

### User Object

```json
{
  "id": 1,
  "username": "john_doe",
  "displayName": "John Doe",
  "email": "john@example.com",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Short biography",
  "role": "MEMBER",
  "reputation": 150,
  "postCount": 20,
  "commentCount": 55,
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-02-01T00:00:00.000Z"
}
```

### Post Object

```json
{
  "id": 1,
  "title": "Post title here",
  "slug": "post-title-here",
  "content": "Full markdown content...",
  "status": "PUBLISHED",
  "isPinned": false,
  "pinType": null,
  "isLocked": false,
  "upvoteCount": 12,
  "downvoteCount": 2,
  "viewCount": 150,
  "commentCount": 8,
  "author": { "id": 1, "username": "john_doe", "displayName": "John Doe" },
  "category": { "id": 2, "name": "General", "slug": "general" },
  "tags": [{ "id": 1, "name": "javascript", "slug": "javascript" }],
  "createdAt": "2026-02-01T00:00:00.000Z",
  "updatedAt": "2026-02-10T00:00:00.000Z"
}
```

### Comment Object

```json
{
  "id": 1,
  "content": "Comment content here...",
  "status": "VISIBLE",
  "isEdited": false,
  "isContentMasked": false,
  "upvoteCount": 5,
  "downvoteCount": 0,
  "author": { "id": 1, "username": "john_doe", "displayName": "John Doe" },
  "postId": 1,
  "parentId": null,
  "quotedCommentId": null,
  "replyCount": 2,
  "createdAt": "2026-02-05T00:00:00.000Z",
  "updatedAt": "2026-02-05T00:00:00.000Z"
}
```

### Notification Object

```json
{
  "id": 1,
  "type": "COMMENT",
  "title": "Tiêu đề thông báo",
  "content": "Nội dung thông báo",
  "isRead": false,
  "relatedId": 5,
  "relatedType": "post",
  "createdAt": "2026-02-15T00:00:00.000Z"
}
```

### Enums

| Enum | Values |
|------|--------|
| `PostStatus` | `DRAFT`, `PUBLISHED`, `HIDDEN`, `DELETED` |
| `CommentStatus` | `VISIBLE`, `HIDDEN`, `DELETED` |
| `PinType` | `GLOBAL`, `CATEGORY` |
| `NotificationType` | `COMMENT`, `REPLY`, `MENTION`, `UPVOTE`, `SYSTEM` |
| `ReportStatus` | `PENDING`, `REVIEWING`, `RESOLVED`, `DISMISSED` |
| `VoteTarget` | `POST`, `COMMENT` |
| `PermissionLevel` | `ALL`, `MEMBER`, `MODERATOR`, `ADMIN` |
| `Role` | `MEMBER`, `MODERATOR`, `ADMIN` |

---

## 6. Endpoint Index

### Tổng số: **116 endpoints**

| # | Group | Count | Auth | File |
|---|-------|-------|------|------|
| 1 | Auth | 8 | Hỗn hợp | [01-auth.md](./01-auth.md) |
| 2 | Users | 10 | Hỗn hợp | [02-users.md](./02-users.md) |
| 3 | Posts | 13 | Hỗn hợp | [03-posts.md](./03-posts.md) |
| 4 | Comments | 5 | Hỗn hợp | [04-comments.md](./04-comments.md) |
| 5 | Votes | 7 | MEMBER+ | [05-votes.md](./05-votes.md) |
| 6 | Bookmarks | 5 | MEMBER+ | [06-bookmarks.md](./06-bookmarks.md) |
| 7 | Block & Report | 11 | MEMBER+ | [07-block-report.md](./07-block-report.md) |
| 8 | Categories | 7 | Hỗn hợp | [08-categories.md](./08-categories.md) |
| 9 | Tags | 8 | Hỗn hợp | [09-tags.md](./09-tags.md) |
| 10 | Search | 3 | Public | [10-search.md](./10-search.md) |
| 11 | Notifications | 7 | MEMBER+ | [11-notifications.md](./11-notifications.md) |
| 12 | Admin | 31 | MOD/ADMIN | [12-admin.md](./12-admin.md) |
| 13 | Misc | 1 | Public | _(xem bên dưới)_ |

### Misc Endpoint

#### `GET /health`

Kiểm tra trạng thái hoạt động của API.

**Access**: Public

```json
{ "success": true, "message": "API is running", "timestamp": "..." }
```

---

## 7. Validation Rules

| Field | Rule |
|-------|------|
| Email | Valid email format, max 255 chars |
| Username (register) | 3-50 chars, `[a-zA-Z0-9_]` only |
| Username (change) | 3-30 chars, `[a-zA-Z0-9_]` only |
| Password | Min 8 chars, 1 uppercase + 1 lowercase + 1 digit |
| Post title | 10-200 chars |
| Post content | 20-50000 chars (Markdown) |
| Comment content | 1-5000 chars |
| Tag name | 2-50 chars |
| Tag slug | 2-50 chars, `[a-z0-9-]` only |
| Bio | Max 500 chars |
| Report reason | 1-100 chars |
| Report description | Max 1000 chars |
| Search query | 1-100 chars |
| Tags per post | Max 10 tags |

---

**Xem thêm**:
- [Architecture](../01-ARCHITECTURE.md)
- [Database Schema](../02-DATABASE.md)
