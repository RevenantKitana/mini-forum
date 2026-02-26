# Security

> **Version**: v1.16.0  
> **Last Updated**: 2026-02-25

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Authentication](#2-authentication)
3. [Authorization (RBAC)](#3-authorization-rbac)
4. [Rate Limiting](#4-rate-limiting)
5. [Input Validation & Sanitization](#5-input-validation--sanitization)
6. [Security Headers](#6-security-headers)
7. [CORS](#7-cors)
8. [Resolved Vulnerabilities](#8-resolved-vulnerabilities)
9. [Audit Checklist](#9-audit-checklist)
10. [Dependencies](#10-dependencies)

---

## 1. Tổng quan

| Layer | Công cụ | Trạng thái |
|-------|---------|:----------:|
| Authentication | JWT (Access + Refresh) | ✅ |
| Authorization | RBAC (3 roles) | ✅ |
| Rate Limiting | express-rate-limit | ✅ |
| Input Validation | Zod schemas | ✅ |
| Security Headers | Helmet | ✅ |
| CORS | cors middleware | ✅ |
| Password Hashing | bcrypt (salt 12) | ✅ |
| Input Sanitization | Custom middleware | ✅ |
| Audit Logging | AuditLog model | ✅ |
| Automated Security Tests | — | ❌ |
| Dependency Scanning | — | ❌ |

---

## 2. Authentication

### 2.1 JWT Token Flow

```
Login → accessToken (15m) + refreshToken (7d)
    ↓
Request → Authorization: Bearer <accessToken>
    ↓
Expired → POST /auth/refresh { refreshToken } → new token pair
    ↓
Logout → DELETE refresh token from DB
```

### 2.2 Token Configuration

| Parameter | Giá trị | Cấu hình |
|-----------|---------|----------|
| Access Token TTL | 15 phút | `JWT_ACCESS_EXPIRES_IN` |
| Refresh Token TTL | 7 ngày | `JWT_REFRESH_EXPIRES_IN` |
| Algorithm | HS256 (HMAC-SHA256) | Hardcoded |
| Min secret length | 32 ký tự | Validated at startup |

### 2.3 Token Storage

| App | Access Token Key | Refresh Token Key |
|-----|-----------------|-------------------|
| Frontend | `forum_access_token` | `forum_refresh_token` |
| Admin Client | `admin_access_token` | `admin_refresh_token` |

- Tokens lưu trong localStorage (client-side)
- Refresh tokens lưu trong database (`refresh_tokens` table)
- Logout xóa refresh token khỏi DB
- `POST /auth/logout-all` xóa tất cả refresh tokens của user

### 2.4 Password Security

- Hash: bcrypt với **salt rounds = 12**
- Validation: Minimum 8 ký tự, yêu cầu ít nhất 1 chữ hoa + 1 chữ thường + 1 chữ số
- Không lưu plaintext password
- Không trả password trong API responses

---

## 3. Authorization (RBAC)

### 3.1 Role Hierarchy

```
ADMIN > MODERATOR > MEMBER > Guest
```

### 3.2 Permission Matrix

| Resource | Guest | MEMBER | MODERATOR | ADMIN |
|----------|:-----:|:------:|:---------:|:-----:|
| View public posts | ✅ | ✅ | ✅ | ✅ |
| Create post | ❌ | ✅ | ✅ | ✅ |
| Edit own post | ❌ | ✅ | ✅ | ✅ |
| Delete own post | ❌ | ✅ | ✅ | ✅ |
| Vote | ❌ | ✅ | ✅ | ✅ |
| Bookmark | ❌ | ✅ | ✅ | ✅ |
| Report content | ❌ | ✅ | ✅ | ✅ |
| Pin/Lock/Hide posts | ❌ | ❌ | ✅ | ✅ |
| Hide comments | ❌ | ❌ | ✅ | ✅ |
| Resolve reports | ❌ | ❌ | ✅ | ✅ |
| CRUD categories | ❌ | ❌ | ❌ | ✅ |
| CRUD tags | ❌ | ❌ | ✅ | ✅ |
| Ban users (status) | ❌ | ❌ | ✅ | ✅ |
| Change roles | ❌ | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ |

### 3.3 Category Permissions

Mỗi category có 3 permission levels:

| Permission | Mô tả | Values |
|-----------|-------|--------|
| `viewPermission` | Ai được xem | ALL, MEMBER, MODERATOR, ADMIN |
| `postPermission` | Ai được đăng bài | ALL, MEMBER, MODERATOR, ADMIN |
| `commentPermission` | Ai được comment | ALL, MEMBER, MODERATOR, ADMIN |

### 3.4 Middleware Implementation

```
authMiddleware.ts     → JWT verification, attach user to request
roleMiddleware.ts     → Check user.role >= requiredRole
optionalAuth          → Attach user if token present (public routes)
```

---

## 4. Rate Limiting

| Route Group | Limit | Window | Ghi chú |
|-------------|:-----:|:------:|---------|
| General API | 300 req | 15 phút | Toàn bộ `/api/v1` |
| Auth routes | 10 req | 15 phút | Chỉ đếm failed attempts |

> **Lưu ý**: Các rate limiter chuyên biệt (`createContentLimiter`, `voteLimiter`, `searchLimiter`) được định nghĩa trong `securityMiddleware.ts` nhưng chưa được áp dụng vào routes.

Implementation: `express-rate-limit` v7.4.1 trong `securityMiddleware.ts`.

---

## 5. Input Validation & Sanitization

### 5.1 Zod Validation

10 validation schema files cho tất cả API inputs:

| File | Validates |
|------|----------|
| `authValidation.ts` | Login, register, refresh token |
| `postValidation.ts` | Create/update post, query params |
| `commentValidation.ts` | Create/update comment |
| `userValidation.ts` | Update profile, change password |
| `categoryValidation.ts` | CRUD category |
| `tagValidation.ts` | CRUD tag |
| `voteValidation.ts` | Vote params |
| `searchValidation.ts` | Search query |
| `reportValidation.ts` | Report content |
| `notificationValidation.ts` | Notification params |

### 5.2 Sanitization

- HTML entity encoding để prevent XSS
- NoSQL injection prevention
- Request body size limit: **10MB**
- Validate middleware chạy trước controller

---

## 6. Security Headers

Helmet v8.0.0 cấu hình trong `app.ts`:

| Header | Giá trị | Mục đích |
|--------|---------|----------|
| `X-Content-Type-Options` | nosniff | Prevent MIME sniffing |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-XSS-Protection` | 1; mode=block | XSS filter |
| `Strict-Transport-Security` | max-age=... | Force HTTPS |
| `Content-Security-Policy` | Configured | Restrict resource loading |
| `X-DNS-Prefetch-Control` | off | Disable DNS prefetch |
| `Referrer-Policy` | strict-origin-... | Control referrer |

---

## 7. CORS

- Configured origins từ `FRONTEND_URL` env variable
- Hỗ trợ multiple origins (comma-separated)
- Default: `http://localhost:5173,http://localhost:5174`
- Credentials: enabled
- Methods: GET, POST, PUT, PATCH, DELETE
- Exposed headers: Authorization

---

## 8. Resolved Vulnerabilities

| Vulnerability | Severity | Version Fixed | Mô tả |
|--------------|:--------:|:------------:|-------|
| Rate limit bypass | High | v1.4.0 | Rate limiting không áp dụng đúng |
| XSS in markdown | High | v1.6.0 | Markdown render không sanitize |
| Permission leaks | High | v1.8.0 | Endpoint thiếu auth/role check |
| Debug logs in prod | Medium | v1.13.1 | `console.log` trong validation middleware |
| TS strict mode off | Medium | v1.13.1 | `strict: false` trong tsconfig |
| `z.coerce.boolean()` | Medium | v1.15.1 | Boolean parse bug trong query params |

---

## 9. Audit Checklist

### 9.1 Đã implement ✅

- [x] JWT authentication với token rotation
- [x] RBAC (3 roles + category permissions)
- [x] Rate limiting trên tất cả routes
- [x] Input validation (Zod) cho tất cả inputs
- [x] Security headers (Helmet)
- [x] CORS configuration
- [x] Password hashing (bcrypt)
- [x] Input sanitization
- [x] Audit logging (admin actions)
- [x] Soft delete (prevent data loss)
- [x] Graceful shutdown handlers

### 9.2 Chưa implement ❌

- [ ] Automated security tests
- [ ] Dependency vulnerability scanning (npm audit)
- [ ] HTTPS enforcement
- [ ] CSP strict mode
- [ ] Rate limiting per-user (hiện tại per-IP)
- [ ] Account lockout sau N failed logins
- [ ] Email verification
- [ ] Password complexity enforcement (hiện min 8 chars + uppercase + lowercase + digit)
- [ ] Token blacklist (ngoài refresh token revocation)
- [ ] Secret rotation strategy
- [ ] OWASP ZAP scan
- [ ] Penetration testing

### 9.3 Khuyến nghị trước Production

| Task | Priority | Effort |
|------|:--------:|:------:|
| `npm audit` — fix vulnerabilities | P0 | 1h |
| Enforce strong JWT secrets (env) | P0 | 10m |
| HTTPS via reverse proxy (Nginx) | P0 | 2h |
| Password policy (min 8 chars, complexity) | P1 | 1h |
| Account lockout mechanism | P1 | 4h |
| Dependency scanning CI | P2 | 2h |

---

## 10. Dependencies

### Backend Security Packages

| Package | Version | Mục đích | CVEs known |
|---------|:-------:|----------|:----------:|
| helmet | 8.0.0 | Security headers | None |
| bcrypt | 5.1.1 | Password hashing | None |
| jsonwebtoken | 9.0.2 | JWT | None |
| express-rate-limit | 7.4.1 | Rate limiting | None |
| zod | 3.24.1 | Validation | None |
| cors | 2.8.5 | CORS | None |

### Kiểm tra vulnerabilities

```bash
cd backend && npm audit
cd frontend && npm audit
cd admin-client && npm audit
```

---

## Liên kết

- [Kiến trúc hệ thống](./01-ARCHITECTURE.md) — Middleware pipeline
- [API Reference](./03-API/README.md) — Authentication & error codes
- [Deployment](./07-DEPLOYMENT.md) — Environment variables
- [Testing](./08-TESTING.md) — Security testing
