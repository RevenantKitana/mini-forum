# Auth Endpoints

> **Base path**: `/auth`  
> **Endpoints**: 8  
> [← Quay lại API Reference](./README.md)

---

## Quick Reference

| Method | Path | Auth |
|--------|------|------|
| GET | `/auth/check-email` | Public |
| GET | `/auth/check-username` | Public |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Public |
| POST | `/auth/logout` | Public |
| POST | `/auth/logout-all` | Bearer |
| GET | `/auth/me` | Bearer |

---

## `GET /auth/check-email`

Kiểm tra email đã được sử dụng chưa.

**Access**: Public

**Query Parameters**:

| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `email` | string | Yes | Email cần kiểm tra |

**Response `200`**:
```json
{
  "success": true,
  "data": { "available": true }
}
```

---

## `GET /auth/check-username`

Kiểm tra username đã được sử dụng chưa.

**Access**: Public

**Query Parameters**:

| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `username` | string | Yes | Username cần kiểm tra |

**Response `200`**:
```json
{
  "success": true,
  "data": { "available": true }
}
```

---

## `POST /auth/register`

Đăng ký tài khoản mới.

**Access**: Public

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | Valid email, max 255 chars |
| `username` | string | Yes | 3-50 chars, chỉ `[a-zA-Z0-9_]` |
| `password` | string | Yes | Min 8 chars, có uppercase + lowercase + số |
| `displayName` | string | No | Max 100 chars |

```json
{
  "email": "john@example.com",
  "username": "john_doe",
  "password": "SecurePass1",
  "displayName": "John Doe"
}
```

**Response `201`**:
```json
{
  "success": true,
  "data": {
    "user": { "...User Object..." },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Registration successful"
}
```

**Error `409`**: Email hoặc username đã tồn tại.

---

## `POST /auth/login`

Đăng nhập vào hệ thống.

**Access**: Public

**Request Body** (hỗ trợ cả `identifier`, `email`, hoặc `username`):

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `email` | string | Yes* | Email (hoặc dùng `username`) |
| `username` | string | Yes* | Username (hoặc dùng `email`) |
| `password` | string | Yes | Mật khẩu |

> *Một trong hai: `email` hoặc `username`

```json
{
  "email": "john@example.com",
  "password": "SecurePass1"
}
```

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "user": { "...User Object..." },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error `401`**: Sai credentials hoặc tài khoản bị vô hiệu hóa.

---

## `POST /auth/refresh`

Lấy access token mới bằng refresh token.

**Access**: Public

**Request Body**:

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | Yes |

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error `401`**: Refresh token không hợp lệ hoặc đã hết hạn.

---

## `POST /auth/logout`

Đăng xuất (vô hiệu hóa refresh token hiện tại).

**Access**: Public

**Request Body**:

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | No (nếu có sẽ bị revoke) |

**Response `200`**:
```json
{ "success": true, "message": "Logged out successfully" }
```

---

## `POST /auth/logout-all`

Đăng xuất khỏi tất cả thiết bị (revoke toàn bộ refresh tokens).

**Access**: Private (Bearer Token)

**Response `200`**:
```json
{ "success": true, "message": "Logged out from all devices" }
```

---

## `GET /auth/me`

Lấy thông tin người dùng hiện tại.

**Access**: Private (Bearer Token)

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "user": { "...User Object..." }
  }
}
```
