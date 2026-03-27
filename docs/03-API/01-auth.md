# Auth Endpoints

> **Base path**: `/auth`  
> **Endpoints**: 13  
> [← Quay lại API Reference](./README.md)
>
> **Last Updated**: 2026-03-27

---

## Quick Reference

| Method | Path | Auth | Rate Limit |
|--------|------|------|------------|
| GET | `/auth/check-email` | Public | — |
| GET | `/auth/check-username` | Public | — |
| POST | `/auth/send-otp-register` | Public | 3 req/5 phút |
| POST | `/auth/verify-otp-register` | Public | 10 req/10 phút |
| POST | `/auth/register` | Public | — |
| POST | `/auth/send-otp-reset` | Public | 3 req/5 phút |
| POST | `/auth/verify-otp-reset` | Public | 10 req/10 phút |
| POST | `/auth/reset-password` | Public | — |
| POST | `/auth/login` | Public | — |
| POST | `/auth/refresh` | Public | — |
| POST | `/auth/logout` | Public | — |
| POST | `/auth/logout-all` | Bearer | — |
| GET | `/auth/me` | Bearer | — |

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
| `registrationToken` | string | No | Token từ verify-otp-register |

```json
{
  "email": "john@example.com",
  "username": "john_doe",
  "password": "SecurePass1",
  "displayName": "John Doe",
  "registrationToken": "abc123..."
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

## `POST /auth/send-otp-register`

Gửi mã OTP xác thực email để đăng ký.

**Access**: Public  
**Rate Limit**: 3 requests / 5 phút

**Request Body**:

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `email` | string | Yes | Email cần xác thực |

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "verificationToken": "hex-string-32-bytes",
    "expiresIn": 600
  },
  "message": "OTP sent successfully"
}
```

**Error `409`**: Email đã được đăng ký.

---

## `POST /auth/verify-otp-register`

Xác thực mã OTP cho đăng ký.

**Access**: Public  
**Rate Limit**: 10 requests / 10 phút

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | Valid email |
| `verificationToken` | string | Yes | Token từ send-otp-register |
| `otp` | string | Yes | 6 chữ số (`/^\d{6}$/`) |

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "registrationToken": "token-string",
    "otpVerified": true,
    "nextStep": "register"
  }
}
```

**Error**: OTP không hợp lệ, hết hạn, hoặc quá số lần thử.

---

## `POST /auth/send-otp-reset`

Gửi mã OTP để đặt lại mật khẩu.

**Access**: Public  
**Rate Limit**: 3 requests / 5 phút

**Request Body**:

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "verificationToken": "hex-string-32-bytes",
    "expiresIn": 600
  }
}
```

> Luôn trả về success để tránh enumeration attack.

---

## `POST /auth/verify-otp-reset`

Xác thực mã OTP cho đặt lại mật khẩu.

**Access**: Public  
**Rate Limit**: 10 requests / 10 phút

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | Valid email |
| `verificationToken` | string | Yes | Token từ send-otp-reset |
| `otp` | string | Yes | 6 chữ số |

**Response `200`**:
```json
{
  "success": true,
  "data": {
    "resetToken": "token-string",
    "otpVerified": true,
    "nextStep": "reset-password"
  }
}
```

---

## `POST /auth/reset-password`

Đặt lại mật khẩu bằng reset token.

**Access**: Public

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | Valid email |
| `resetToken` | string | Yes | Token từ verify-otp-reset |
| `newPassword` | string | Yes | Min 8 chars, uppercase + lowercase + số |

**Response `200`**:
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

> Invalidates tất cả refresh tokens của user.

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
