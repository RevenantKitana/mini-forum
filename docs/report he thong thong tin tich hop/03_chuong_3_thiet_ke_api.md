# CHƯƠNG 3 — THIẾT KẾ API VÀ GIAO TIẾP LIÊN SERVICE

---

## Giới thiệu chương

Trong kiến trúc Monorepo Multi-service, **API** là "khế ước" ràng buộc mọi thành phần của hệ thống. Bất kỳ service nào — từ frontend người dùng, admin dashboard, đến AI bot — đều phải tuân thủ cùng một tập quy tắc giao tiếp thống nhất.

Chương này trình bày toàn bộ thiết kế lớp API của MINI-FORUM bao gồm: nguyên tắc REST được áp dụng nhất quán, bản đồ 14 nhóm route, cơ chế xác thực JWT dual-token, ma trận giao tiếp giữa 4 service, pipeline middleware bảo mật 9 lớp và cách tích hợp API tại phía client thông qua React Query. Mỗi quyết định thiết kế đều có lý giải rõ ràng dựa trên yêu cầu thực tế của dự án.

---

## 3.1 Nguyên tắc thiết kế REST API

### 3.1.1 Tổng quan

REST (Representational State Transfer) là phong cách kiến trúc API phổ biến nhất hiện nay nhờ tính đơn giản, nhất quán và khả năng tương thích với mọi HTTP client. Thay vì định nghĩa lại các quy tắc riêng, MINI-FORUM tuân theo đúng 6 ràng buộc cốt lõi của REST theo định nghĩa gốc của Roy Fielding (2000), với một số quy ước bổ sung cho phù hợp thực tiễn.

### 3.1.2 Năm nguyên tắc cốt lõi

API của MINI-FORUM tuân theo 5 nguyên tắc REST cốt lõi, đảm bảo tính nhất quán và dễ dự đoán cho mọi client:

**Bảng 3.1 — Nguyên tắc REST API và cách áp dụng trong MINI-FORUM**

| Nguyên tắc | Quy tắc áp dụng | Ví dụ trong codebase |
|-----------|----------------|---------------------|
| **Resource-based URL** | URL đặt tên theo danh từ số nhiều, không dùng động từ | `/posts`, `/users/:id`, `/categories` |
| **HTTP Verbs đúng ngữ nghĩa** | GET = đọc; POST = tạo; PATCH = cập nhật một phần; DELETE = xóa | `PATCH /posts/:id` thay vì `POST /posts/:id/update` |
| **Stateless** | Mỗi request tự mang đầy đủ thông tin xác thực, server không lưu session | `Authorization: Bearer {JWT}` trên mọi request được bảo vệ |
| **Response nhất quán** | Thành công: `{ data: ... }`; Lỗi: `{ error: string, details?: object }` | Xử lý tập trung bởi `errorMiddleware` và `successResponse()` helper |
| **Pagination chuẩn hóa** | Query params `?page=1&limit=20` cho tất cả endpoint danh sách | `GET /posts?page=2&limit=10&categoryId=3&sortBy=createdAt` |

### 3.1.3 Cấu trúc Response chuẩn hóa

Mọi response từ API đều tuân theo định dạng thống nhất, giúp client xử lý một cách nhất quán:

**Response thành công (2xx):**
```json
{
  "data": { ... },
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Response lỗi (4xx / 5xx):**
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "title", "message": "Title must be at least 10 characters" },
    { "field": "categoryId", "message": "Required" }
  ]
}
```

**Bảng 3.2 — HTTP Status Code được sử dụng**

| Status | Ý nghĩa | Khi nào dùng |
|--------|---------|-------------|
| 200 OK | Thành công | GET, PATCH thành công |
| 201 Created | Đã tạo | POST tạo resource mới |
| 204 No Content | Thành công không có data | DELETE không trả body |
| 400 Bad Request | Dữ liệu đầu vào lỗi | Zod validation thất bại |
| 401 Unauthorized | Chưa xác thực | Thiếu / hết hạn JWT |
| 403 Forbidden | Không có quyền | Đúng token nhưng sai role / ownership |
| 404 Not Found | Không tìm thấy | Resource không tồn tại trong DB |
| 409 Conflict | Xung đột dữ liệu | Email / username đã tồn tại |
| 429 Too Many Requests | Vượt rate limit | Quá nhiều request trong thời gian ngắn |
| 500 Internal Server Error | Lỗi server | Lỗi không lường trước được |

### 3.1.4 Cấu trúc URL — Quy ước đặt tên

Toàn bộ API được đặt dưới prefix `/api/v1`, cho phép versioning khi cần nâng cấp mà không phá vỡ client cũ.

```
Base URL: /api/v1

Danh sách resource:
  GET    /api/v1/posts
  POST   /api/v1/posts

Tài nguyên cụ thể:
  GET    /api/v1/posts/:id
  PATCH  /api/v1/posts/:id
  DELETE /api/v1/posts/:id

Nested resource:
  GET    /api/v1/posts/:postId/comments
  POST   /api/v1/posts/:postId/comments

Actions trên resource:
  POST   /api/v1/posts/:id/vote
  POST   /api/v1/posts/:id/bookmark
  POST   /api/v1/posts/:id/pin

User-specific:
  GET    /api/v1/users/:username/posts
  GET    /api/v1/users/me/bookmarks
  GET    /api/v1/users/me/votes
```

---

## 3.2 Bản đồ API Routes — 14 nhóm route

Tất cả route được đăng ký tập trung trong `backend/src/routes/index.ts`, sau đó phân tán sang **14 file route** theo domain. Thiết kế này đảm bảo mỗi file route chỉ quản lý một nhóm chức năng liên quan, tuân theo nguyên tắc Separation of Concerns.

**Hình 3.1 — Sơ đồ phân cấp Route**

```
backend/src/routes/
│
├── index.ts               ← Aggregator: mount tất cả route vào Express
├── authRoutes.ts          ← /api/v1/auth/*          (8 endpoints)
├── postRoutes.ts          ← /api/v1/posts/*          (11 endpoints)
├── commentRoutes.ts       ← /api/v1/comments/*       (3 endpoints)
├── userRoutes.ts          ← /api/v1/users/*          (8 endpoints)
├── adminRoutes.ts         ← /api/v1/admin/*          (7 endpoints)
├── categoryRoutes.ts      ← /api/v1/categories/*     (5 endpoints)
├── tagRoutes.ts           ← /api/v1/tags/*           (4 endpoints)
├── searchRoutes.ts        ← /api/v1/search           (1 endpoint)
├── notificationRoutes.ts  ← /api/v1/notifications/*  (4 endpoints)
├── configRoutes.ts        ← /api/v1/config/*         (2 endpoints)
├── blockReportRoutes.ts   ← /api/v1/blocks/*         (3 endpoints)
│                            /api/v1/reports/*        (3 endpoints)
├── bookmarkRoutes.ts      ← /api/v1/bookmarks/*      (2 endpoints)
└── voteRoutes.ts          ← /api/v1/votes/*          (2 endpoints)
```

### 3.2.1 Auth Routes — `/api/v1/auth`

Quản lý toàn bộ vòng đời xác thực: đăng ký, đăng nhập, làm mới token, đặt lại mật khẩu qua OTP.

**Bảng 3.3 — Auth API Endpoints**

| Method | Endpoint | Mô tả | Middleware |
|--------|----------|-------|-----------|
| POST | `/auth/register` | Đăng ký tài khoản mới | `validate(registerSchema)` |
| POST | `/auth/login` | Đăng nhập, nhận JWT pair | `authLimiter`, `validate(loginSchema)` |
| POST | `/auth/logout` | Đăng xuất, xóa refresh token khỏi DB | `authMiddleware` |
| POST | `/auth/refresh` | Làm mới access token từ refresh cookie | — |
| POST | `/auth/forgot-password` | Gửi OTP 6 số về email | `otpSendLimiter` |
| POST | `/auth/verify-otp` | Xác minh OTP, nhận `registrationToken` | `otpVerifyLimiter` |
| POST | `/auth/reset-password` | Đặt lại mật khẩu sau xác minh OTP | `authLimiter` |
| GET  | `/auth/me` | Lấy thông tin user đang đăng nhập | `authMiddleware` |

### 3.2.2 Post Routes — `/api/v1/posts`

Quản lý bài viết — đây là resource trung tâm của toàn hệ thống với nhiều endpoint nhất.

**Bảng 3.4 — Post API Endpoints**

| Method | Endpoint | Mô tả | Middleware bổ sung |
|--------|----------|-------|--------------------|
| GET | `/posts` | Danh sách bài viết; filter theo category/tag/author; sort | `optionalAuth` |
| POST | `/posts` | Tạo bài viết mới | `authMiddleware`, `createContentLimiter` |
| GET | `/posts/:id` | Chi tiết bài viết, tăng view_count | `optionalAuth` |
| PATCH | `/posts/:id` | Cập nhật tiêu đề, nội dung, tag | `authMiddleware` |
| DELETE | `/posts/:id` | Xóa bài viết (soft delete) | `authMiddleware` |
| PATCH | `/posts/:id/pin` | Ghim / bỏ ghim bài viết | `authMiddleware`, `authorize(ADMIN)` |
| PATCH | `/posts/:id/lock` | Khóa / mở khóa bình luận | `authMiddleware`, `authorize(MODERATOR)` |
| POST | `/posts/:id/vote` | Upvote / downvote bài viết | `authMiddleware`, `voteLimiter` |
| POST | `/posts/:id/bookmark` | Thêm / xóa bookmark | `authMiddleware` |
| GET  | `/posts/:id/comments` | Danh sách bình luận của bài viết | `optionalAuth` |
| POST | `/posts/:id/comments` | Tạo bình luận mới | `authMiddleware`, `createContentLimiter` |

### 3.2.3 Comment Routes — `/api/v1/comments`

Thao tác trực tiếp trên bình luận (không qua bài viết cha).

**Bảng 3.5 — Comment API Endpoints**

| Method | Endpoint | Mô tả | Ghi chú |
|--------|----------|-------|---------|
| PATCH | `/comments/:id` | Chỉnh sửa bình luận | Chỉ được sửa trong `COMMENT_EDIT_TIME_LIMIT` giây (cấu hình động) |
| DELETE | `/comments/:id` | Xóa bình luận | Tác giả hoặc MODERATOR/ADMIN |
| POST | `/comments/:id/vote` | Vote bình luận | `voteLimiter` |

### 3.2.4 User Routes — `/api/v1/users`

Quản lý profile và hoạt động cá nhân của từng người dùng.

**Bảng 3.6 — User API Endpoints**

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/users/me` | Profile của mình (full data) | Bắt buộc |
| PATCH | `/users/me` | Cập nhật display_name, bio, date_of_birth, gender | Bắt buộc |
| POST | `/users/me/avatar` | Upload avatar (multipart/form-data → ImageKit) | Bắt buộc |
| DELETE | `/users/me/avatar` | Xóa avatar, trở về default | Bắt buộc |
| GET | `/users/:username` | Profile công khai của người dùng khác | Không bắt buộc |
| GET | `/users/:username/posts` | Danh sách bài viết của user đó | Không bắt buộc |
| GET | `/users/me/bookmarks` | Danh sách bài viết đã bookmark | Bắt buộc |
| GET | `/users/me/votes` | Lịch sử vote (upvote/downvote) | Bắt buộc |

### 3.2.5 Admin Routes — `/api/v1/admin`

Bảng điều khiển quản trị hệ thống, chỉ dành cho vai trò ADMIN và MODERATOR.

**Bảng 3.7 — Admin API Endpoints**

| Method | Endpoint | Mô tả | Role yêu cầu |
|--------|----------|-------|-------------|
| GET | `/admin/users` | Danh sách user + filter trạng thái, role | ADMIN |
| PATCH | `/admin/users/:id/role` | Thay đổi role (MEMBER ↔ MODERATOR) | ADMIN |
| PATCH | `/admin/users/:id/status` | Kích hoạt / vô hiệu hóa tài khoản | ADMIN |
| GET | `/admin/metrics` | Thống kê HTTP: request count, latency, error rate | ADMIN |
| GET | `/admin/audit-logs` | Nhật ký hành động | ADMIN |
| GET | `/admin/reports` | Danh sách báo cáo vi phạm | MODERATOR |
| PATCH | `/admin/reports/:id` | Xử lý báo cáo | MODERATOR |

### 3.2.6 Các route khác

| Prefix | File | Chức năng chính |
|--------|------|----------------|---------|
| `/categories` | `categoryRoutes.ts` | CRUD danh mục, thống kê post_count | Chỉ ADMIN tạo/sửa/xóa |
| `/tags` | `tagRoutes.ts` | Xem tag, bài viết theo tag | Tự động tạo khi post mới |
| `/search` | `searchRoutes.ts` | Full-text search theo title + content | `searchLimiter` |
| `/notifications` | `notificationRoutes.ts` | Đọc, mark as read, SSE stream | SSE yêu cầu token qua query param |
| `/config` | `configRoutes.ts` | Đọc/ghi cấu hình hệ thống động | Ghi chỉ ADMIN |
| `/blocks` | `blockReportRoutes.ts` | Block / unblock người dùng khác | MEMBER trở lên |
| `/reports` | `blockReportRoutes.ts` | Báo cáo bài viết / bình luận vi phạm | MEMBER trở lên |

---

## 3.3 Luồng xác thực — JWT Dual-Token

### 3.3.1 Tổng quan cơ chế

MINI-FORUM sử dụng cơ chế **JWT dual-token** gồm hai loại token có TTL khác nhau, giải quyết bài toán cân bằng giữa bảo mật và trải nghiệm người dùng:

| Token | Thuật toán | TTL | Lưu trữ | Mục đích |
|-------|-----------|-----|---------|---------|
| **Access Token** | HS256 | 15 phút | Memory (JS variable / localStorage) | Gửi kèm mọi request bảo vệ qua `Authorization: Bearer` |
| **Refresh Token** | HS256 | 7 ngày | httpOnly Cookie + Database (hashed) | Tạo Access Token mới khi hết hạn |

**Payload Access Token** (tối thiểu hóa để giảm kích thước):
```json
{
  "userId": 42,
  "role": "MEMBER",
  "iat": 1746000000,
  "exp": 1746000900
}
```

**Lý do TTL ngắn (15 phút) cho Access Token:** Nếu token bị đánh cắp qua XSS hay Man-in-the-Middle, kẻ tấn công chỉ có tối đa 15 phút sử dụng. Server-side revocation không cần thiết.

**Lý do lưu Refresh Token có hash trong Database:** Cho phép thu hồi tức thì khi người dùng logout, đổi mật khẩu, hoặc phát hiện tài khoản bị xâm phạm. Hash SHA-256 của token được lưu (không phải plaintext).

### 3.3.2 Sequence Diagram: Authentication Flow đầy đủ

**Hình 3.2 — Sequence Diagram: Authentication Flow (5 bước)**

```
┌──────────┐              ┌────────────────┐            ┌──────────────┐
│  Client  │              │  Backend API   │            │  PostgreSQL  │
│(Browser) │              │  :5000         │            │              │
└────┬─────┘              └───────┬────────┘            └──────┬───────┘
     │                            │                            │
     │ ═══════ BƯỚC 1: ĐĂNG NHẬP ══════════════════════════════════
     │                            │                            │
     │─── POST /auth/login ──────►│                            │
     │  { email, password }       │                            │
     │                            │─── SELECT users WHERE ────►│
     │                            │    email = $1              │
     │                            │◄─── { user row } ─────────│
     │                            │                            │
     │                            │ bcrypt.compare(password,   │
     │                            │   user.password_hash)      │
     │                            │                            │
     │                            │─── INSERT refresh_tokens ─►│
     │                            │    { token, user_id,       │
     │                            │      expires_at: +7d }     │
     │◄── 200 { accessToken } ───│                            │
     │    Set-Cookie: refresh     │                            │
     │    Token (httpOnly, 7d)    │                            │
     │                            │                            │
     │ ═══════ BƯỚC 2: GỬI REQUEST ĐÃ XÁC THỰC ═══════════════
     │                            │                            │
     │─── GET /posts ────────────►│                            │
     │  Authorization: Bearer     │ authMiddleware:            │
     │  {accessToken}             │ jwt.verify(token, SECRET)  │
     │                            │ → req.user = { id, role }  │
     │◄── 200 { posts: [...] } ──│                            │
     │                            │                            │
     │ ═══════ BƯỚC 3: LÀM MỚI TOKEN (sau 15 phút) ═══════════
     │                            │                            │
     │─── POST /auth/refresh ────►│                            │
     │   Cookie: refreshToken     │                            │
     │                            │─── SELECT refresh_tokens ─►│
     │                            │    WHERE token_hash = ?    │
     │                            │    AND expires_at > NOW()  │
     │                            │◄─── { valid: true } ──────│
     │                            │                            │
     │◄── 200 { accessToken } ───│ jwt.sign({ userId, role }, │
     │                            │   SECRET, { exp: '15m' })  │
     │                            │                            │
     │ ═══════ BƯỚC 4: ĐĂNG XUẤT ═══════════════════════════════
     │                            │                            │
     │─── POST /auth/logout ─────►│                            │
     │   Authorization: Bearer    │─── DELETE refresh_tokens ─►│
     │                            │    WHERE token_hash = ?    │
     │◄── 200 { success } ───────│                            │
     │   Clear-Cookie: refresh    │                            │
└────┴─────┘              └───────┴────────┘            └──────┴───────┘
```

### 3.3.3 Bảo vệ Refresh Token — Hash SHA-256 trước khi lưu DB

```typescript
// authService.ts
import crypto from 'node:crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Khi tạo refresh token: lưu HASH, không lưu plaintext
await prisma.refresh_tokens.create({
  data: {
    token_hash: hashToken(refreshToken),
    user_id: user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  }
});
```

**Ý nghĩa:** Nếu database bị xâm phạm, kẻ tấn công chỉ có hash SHA-256 — không thể suy ngược ra refresh token gốc.

### 3.3.4 So sánh phương án lưu trữ token phía client

**Bảng 3.9 — So sánh các phương án lưu token**

| Phương án | Nơi lưu | Đọc được bởi JS | XSS risk | CSRF risk | Quyết định |
|-----------|---------|:--------------:|:--------:|:---------:|:----------:|
| localStorage | Browser | ✅ Có | **Cao** | Thấp | ❌ Không dùng |
| sessionStorage | Browser | ✅ Có | **Cao** | Thấp | ❌ Không dùng |
| Memory (JS variable) | RAM | ✅ Có | Trung bình | Thấp | ✅ **Access Token** |
| **httpOnly Cookie** | Browser | ❌ Không | **Thấp** | Có (mitigated) | ✅ **Refresh Token** |

---

## 3.4 Ma trận giao tiếp liên service

### 3.4.1 Sơ đồ tổng quan

MINI-FORUM gồm 4 service hoạt động độc lập nhưng giao tiếp chặt chẽ với nhau. Không có service nào trực tiếp "biết" về implementation của service khác — tất cả giao tiếp qua HTTP/REST hoặc database connection được định nghĩa rõ ràng.

**Hình 3.3 — Sơ đồ giao tiếp giữa các service**

```
                    ┌────────────────────────────────────────┐
                    │              Internet                  │
                    └───────────┬───────────────┬────────────┘
                                │               │
           ┌────────────────────▼──┐    ┌───────▼──────────────┐
           │    FRONTEND           │    │    ADMIN-CLIENT       │
           │  (Vercel / React)     │    │   (Vercel / React)    │
           │  React Query          │    │  React Query          │
           │  Axios + Token Mgr    │    │  Axios + Token Mgr    │
           └────────┬──────────────┘    └──────────┬───────────┘
                    │ HTTPS/REST                   │ HTTPS/REST
                    │ JWT Bearer                   │ JWT Bearer
           ┌────────▼──────────────────────────────▼───────────┐
           │                   BACKEND                          │
           │          (Render / Node.js / Express)              │
           │  14 Route Groups → 14 Controllers → 21 Services    │
           └──────┬────────────────────────────────────────────┘
                  │ Prisma/TCP              ↑ HTTP/REST (JWT Bearer)
          ┌───────▼──────────┐    ┌─────────┴──────────────────┐
          │   PostgreSQL DB   │    │       VIBE-CONTENT          │
          │  (Render Postgres)│◄───│   (Render / Node.js)        │
          │  19 Tables        │    │   Prisma (READ ONLY)        │
          └───────────────────┘    │   Axios → Backend API       │
                                   └────────────────────────────┘
```

### 3.4.2 Ma trận giao tiếp chi tiết

**Bảng 3.10 — Ma trận giao tiếp đầy đủ giữa các thành phần**

| Nguồn | Đích | Giao thức | Xác thực | Hướng | Mục đích |
|-------|------|----------|---------|-------|---------|
| `frontend` | `backend` | HTTPS/REST | JWT Bearer | Request/Response | Mọi tương tác người dùng (đọc/ghi) |
| `admin-client` | `backend` | HTTPS/REST | JWT Bearer (ADMIN role) | Request/Response | Quản trị hệ thống |
| `vibe-content` | `backend` | HTTP/REST | JWT Bearer (BOT user) | Request only | Thực thi hành động AI: post/comment/vote |
| `vibe-content` | PostgreSQL | Prisma/TCP | `DATABASE_URL` | **Read only** | Thu thập context để ra quyết định AI |
| `backend` | PostgreSQL | Prisma/TCP | `DATABASE_URL` | Read/Write | Toàn bộ data access |
| `backend` | Brevo API | HTTPS/REST | API Key header | Outbound | Gửi email OTP và xác nhận đăng ký |
| `backend` | ImageKit | HTTPS/REST | API Key + Signed URL | Outbound | Upload và delete ảnh người dùng |
| `frontend` | `backend` (SSE) | HTTP/SSE | JWT trong query param | **Server push** | Nhận notification real-time |

### 3.4.3 Real-time Notifications qua Server-Sent Events (SSE)

SSE là lựa chọn thay thế cho WebSocket khi luồng dữ liệu chỉ cần **một chiều** (server → client). MINI-FORUM sử dụng SSE cho notification real-time:

**Hình 3.4 — SSE Connection Lifecycle**

```
Client (Frontend)                    Backend (SSEService)
     │                                       │
     │── GET /notifications/stream ─────────►│
     │   ?token={accessToken}               │  authMiddleware kiểm tra token
     │                                       │  sseService.addConnection(userId, res)
     │◄── HTTP 200 ─────────────────────────│
     │    Content-Type: text/event-stream    │
     │    Connection: keep-alive             │
     │                                       │
     │                                       │  [Có comment mới vào bài của user]
     │◄── data: {"type":"NEW_COMMENT",───────│  notificationService.create(...)
     │          "postId":42,                │  sseService.sendToUser(userId, data)
     │          "message":"Ai đó comment"} │
     │    \n\n                               │
     │                                       │
     │  [Heartbeat: mỗi 30s giữ kết nối]    │
     │◄── : keep-alive ──────────────────────│
     │    \n\n                               │
     │                                       │
     │  [Client đóng tab / timeout]          │
     │  ─── disconnect ─────────────────────►│  sseService.removeConnection(userId)
```

**Bảng 3.11 — Các loại Notification Event**

| Event Type | Khi nào kích hoạt | Dữ liệu kèm |
|-----------|------------------|-------------|
| `NEW_COMMENT` | Ai đó comment vào bài viết của user | postId, commentId, authorName |
| `NEW_VOTE` | Bài viết/comment của user nhận vote | postId, voteType, totalVotes |
| `NEW_REPLY` | Ai đó reply vào comment của user | postId, commentId, authorName |
| `POST_PINNED` | Bài viết được admin ghim | postId, pinType |
| `REPORT_RESOLVED` | Báo cáo vi phạm được xử lý | reportId, resolution |

**Hạn chế kỹ thuật và hướng mở rộng:** Connection SSE được lưu trong bộ nhớ (`Map<userId, Response>`). Khi scale horizontal (nhiều instance backend), notification có thể gửi đến sai instance. Giải pháp tương lai: Redis Pub/Sub.

---

## 3.5 Middleware Security Stack — 9 lớp


Mỗi request vào Backend đi qua pipeline gồm **9 middleware** theo thứ tự:

**Hình 3.2 — Thứ tự xử lý middleware stack**

```
                    ┌────────────────────────────────────┐
                    │        Incoming Request             │
                    └─────────────┬──────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [1] requestIdMiddleware                              │
          │  • Gán UUID v4 vào mỗi request: req.id              │
          │  • Set header: X-Request-ID: {uuid}                  │
          │  • Dùng cho log correlation và debug tracing         │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [2] metricsMiddleware                               │
          │  • Ghi nhận start_time                               │
          │  • Đếm request count theo endpoint                   │
          │  • Sau response: đo duration, ghi error count        │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [3] httpLoggerMiddleware                            │
          │  • Log: method, url, ip, user-agent, requestId       │
          │  • Sau response: log status code, duration           │
          │  • Structured JSON format                            │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [4] securityMiddleware (tổng hợp)                  │
          │  ┌────────────────────────────────────────────────┐  │
          │  │ helmet() — HTTP Security Headers:              │  │
          │  │  • Content-Security-Policy (CSP)               │  │
          │  │  • X-Frame-Options: DENY                       │  │
          │  │  • X-Content-Type-Options: nosniff             │  │
          │  │  • Strict-Transport-Security (HSTS)            │  │
          │  │  • X-DNS-Prefetch-Control: off                 │  │
          │  │  • Referrer-Policy: no-referrer                │  │
          │  └────────────────────────────────────────────────┘  │
          │  ┌────────────────────────────────────────────────┐  │
          │  │ cors() — Cross-Origin Resource Sharing:        │  │
          │  │  • origin: [FRONTEND_URL, ADMIN_CLIENT_URL]    │  │
          │  │  • credentials: true                           │  │
          │  │  • methods: GET,POST,PATCH,DELETE,OPTIONS      │  │
          │  └────────────────────────────────────────────────┘  │
          │  ┌────────────────────────────────────────────────┐  │
          │  │ rateLimit() — Giới hạn request:                │  │
          │  │  • Global: 100 req / 15 phút / IP              │  │
          │  │  • Auth: 10 req / 15 phút / IP                 │  │
          │  │  • Create content: 30 req / 15 phút            │  │
          │  └────────────────────────────────────────────────┘  │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [5] authMiddleware *(per-route, khi cần auth)*      │
          │  • Extract Bearer token từ Authorization header      │
          │  • jwt.verify(token, JWT_ACCESS_SECRET)             │
          │  • Nếu hết hạn/invalid → 401 Unauthorized           │
          │  • attach req.user = { id, email, role }             │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [6] roleMiddleware *(per-route, khi cần role)*      │
          │  • Kiểm tra req.user.role so với allowedRoles[]     │
          │  • Nếu không đủ quyền → 403 Forbidden               │
          │  • authorize('ADMIN'), authorize('MODERATOR','ADMIN')│
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [7] validateMiddleware *(per-route)*                │
          │  • Zod.parseAsync(req.body hoặc req.query)           │
          │  • Nếu invalid → 400 Bad Request + chi tiết lỗi     │
          │  • Nếu valid → req.body được replace bằng parsed data│
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [8] Controller Handler                              │
          │  • Nhận request đã validate, gọi service layer       │
          │  • Service gọi Prisma → PostgreSQL                  │
          │  • Trả JSON response chuẩn hóa                      │
          └───────────────────────┬─────────────────────────────┘
                                  │ hoặc error thrown
          ┌───────────────────────▼─────────────────────────────┐
          │  [9] errorMiddleware *(global error handler)*        │
          │  • Catch mọi Error từ controller/service            │
          │  • Map lỗi Prisma P2002 → 409 Conflict              │
          │  • Map lỗi Prisma P2025 → 404 Not Found             │
          │  • Format: { error: string, details?: object }      │
          │  • ẨN stack trace trong NODE_ENV=production          │
          └────────────────────────────────────────────────────┘
```

### 3.5.2 Cấu hình thực tế trong app.ts

```typescript
// backend/src/app.ts — thứ tự middleware phản ánh pipeline trên

// [1+2] Security headers và body parsing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],  // Cho phép ảnh từ ImageKit
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// [3] CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// [4] Request ID
app.use(requestIdMiddleware);

// [5] Metrics
app.use(metricsMiddleware);

// [6] Rate limiting
app.use('/api/v1', apiLimiter);        // 300 req/15min global
app.use('/api/v1/auth', authLimiter);  // 10 req/15min cho auth

// [7] HTTP Logging
app.use(httpLoggerMiddleware);

// [8] Routes (per-route middleware trong từng file route)
app.use('/api/v1', routes);

// [9] Error handler (PHẢI đứng cuối cùng)
app.use(notFoundMiddleware);
app.use(errorMiddleware);
```

### 3.5.3 Rate Limiter — Cấu hình chi tiết

**Bảng 3.12 — Cấu hình Rate Limit từng loại endpoint**

| Limiter | WindowMs | Max requests | Áp dụng cho |
|---------|---------|-------------|------------|
| `apiLimiter` | 15 phút | 300 req / IP | Toàn bộ `/api/v1/*` |
| `authLimiter` | 15 phút | 10 req / IP | `/api/v1/auth/*` (chỉ count failed) |
| `createContentLimiter` | 1 phút | 5 req / IP | POST /posts, POST /comments |
| `voteLimiter` | 1 phút | 30 req / IP | POST /posts/:id/vote, /comments/:id/vote |
| `searchLimiter` | 1 phút | 30 req / IP | GET /search |
| `otpSendLimiter` | 5 phút | 3 req / IP | POST /auth/forgot-password |
| `otpVerifyLimiter` | 10 phút | 10 req / IP | POST /auth/verify-otp |

---

## 3.6 Frontend API Integration với React Query

### 3.6.1 Kiến trúc 3 lớp phía Client

Frontend sử dụng **3 lớp trừu tượng** để giao tiếp với Backend. Mỗi lớp có trách nhiệm riêng biệt:

**Hình 3.5 — Kiến trúc API Client phía Frontend**

```
Component/Page
     │ gọi custom hook
     ▼
     │ gọi hook
     ▼
React Query Hook    ← Quản lý cache, loading, error state
     │ gọi
     ▼
API Service         ← Định nghĩa endpoint, transform data
     │ gọi
     ▼
Axios Instance      ← Base URL, interceptors, token injection
     │ HTTP
     ▼
Backend API
```

### 3.6.2 Axios Instance với Auto Token Injection

```typescript
// frontend/src/api/axiosInstance.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // Tự động gửi cookie (refresh token)
});

// Request interceptor: tự động thêm Authorization header
api.interceptors.request.use((config) => {
  const token = getAccessToken();  // Từ AuthContext
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: tự động refresh token khi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        return api(error.config);  // Retry request gốc
      } catch {
        logout();  // Refresh thất bại → buộc đăng nhập lại
      }
    }
    return Promise.reject(error);
  }
);
```

### 3.6.3 React Query — Query Pattern

```typescript
// Ví dụ: hook lấy danh sách bài viết với filter
export function usePostsQuery(params: PostQueryParams) {
  return useQuery({
    queryKey: ['posts', params],      // Cache key
    queryFn: () => postService.getAll(params),
    staleTime: 1000 * 60,            // Cache 60 giây
    keepPreviousData: true,          // Không xóa data khi thay filter
  });
}

// Sử dụng trong component
function HomePage() {
  const { data, isLoading, error } = usePostsQuery({
    page: 1,
    limit: 20,
    categoryId: selectedCategory,
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;
  return <PostList posts={data.posts} />;
}
```

### 3.6.4 React Query — Mutation Pattern

```typescript
// Mutation với cache invalidation
export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostInput) => postService.create(data),
    onSuccess: (newPost) => {
      // Invalidate danh sách bài viết để refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // Thêm bài viết mới trực tiếp vào cache (optimistic)
      queryClient.setQueryData(['posts', newPost.id], newPost);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

### 3.6.5 SSE Integration — Real-time Notifications

```typescript
// frontend/src/hooks/useSSE.ts
export function useSSE() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    const eventSource = new EventSource(
      `${API_URL}/api/v1/notifications/stream?token=${token}`
    );

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      // Thêm vào React Query cache
      queryClient.setQueryData(
        ['notifications'],
        (old) => [notification, ...(old || [])]
      );
      // Hiển thị toast
      toast.info(notification.title);
    };

    return () => eventSource.close();
  }, [user, token]);
}
```

### 3.6.6 Error Handling Thống nhất

```typescript
// Tất cả API error đều đi qua một điểm xử lý
api.interceptors.response.use(null, (error: AxiosError) => {
  const message = error.response?.data?.error || 'Đã xảy ra lỗi';
  const status = error.response?.status;

  switch (status) {
    case 400: throw new ValidationError(message, error.response?.data?.details);
    case 401: /* Xử lý bởi refresh interceptor */ break;
    case 403: throw new ForbiddenError(message);
    case 404: throw new NotFoundError(message);
    case 429: throw new RateLimitError('Quá nhiều yêu cầu, thử lại sau');
    default:  throw new ApiError(message, status);
  }
});
```

**Bảng 3.13 — Mapping HTTP Status → Hành động xử lý frontend**

| HTTP Status | Loại lỗi | Hành động frontend |
|-------------|---------|-------------------|
| 400 | Dữ liệu không hợp lệ | Hiển thị lỗi bên cạnh từng field form |
| 401 | Token hết hạn | Tự động refresh token, retry request |
| 403 | Không đủ quyền | Toast error "Bạn không có quyền thực hiện thao tác này" |
| 404 | Không tìm thấy | Redirect trang 404 hoặc toast error |
| 409 | Dữ liệu trùng lặp | Toast error cụ thể (VD: "Email đã được sử dụng") |
| 429 | Vượt rate limit | Toast warning "Vui lòng thử lại sau {retryAfter}s" |
| 5xx | Lỗi server | Toast error "Đã xảy ra lỗi, vui lòng thử lại sau" |

---

## 3.7 Tổng kết chương

Chương 3 đã trình bày toàn diện thiết kế API của hệ thống MINI-FORUM theo 6 khía cạnh chính:

1. **Nguyên tắc REST chuẩn hóa** (Bảng 3.1): 5 nguyên tắc được áp dụng nhất quán trên toàn bộ 14 nhóm route, đảm bảo API có tính dự đoán cao, dễ tích hợp và dễ bảo trì.

2. **Bản đồ 14 nhóm route** (Hình 3.1, Bảng 3.3–3.8): Phân tách rõ ràng theo domain (Auth, Post, Comment, User, Admin...), mỗi nhóm có cấu hình middleware phù hợp với yêu cầu bảo mật riêng. Tổng cộng hơn 60 endpoints được tổ chức có hệ thống.

3. **JWT Dual-Token Authentication** (Hình 3.2): Cơ chế 2 loại token với TTL khác nhau, kết hợp hash SHA-256 trước khi lưu DB và httpOnly cookie, cung cấp bảo mật cao mà không ảnh hưởng trải nghiệm người dùng.

4. **Ma trận giao tiếp liên service** (Bảng 3.10): 4 service giao tiếp qua các kênh được định nghĩa rõ ràng theo nguyên tắc least-privilege, ngăn chặn sự phụ thuộc trực tiếp không kiểm soát.

5. **Pipeline middleware 9 tầng** (Hình 3.6): Mỗi tầng có trách nhiệm độc lập, tạo nên hệ thống bảo mật theo chiều sâu (defense-in-depth) hiệu quả.

6. **React Query Integration** (Hình 3.5): Kiến trúc 3 lớp phía client với cơ chế auto-refresh token, cache thông minh, real-time SSE notification và xử lý lỗi thống nhất (Bảng 3.13).

---

*[Tiếp theo: Chương 4 — Tích hợp AI — Vibe-Content Service]*
