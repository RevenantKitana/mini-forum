# CHƯƠNG 1 — TỔNG QUAN KIẾN TRÚC HỆ THỐNG

---

## 1.1 Bối cảnh và lý do chọn kiến trúc Monorepo Multi-service

### 1.1.1 Bối cảnh dự án

MINI-FORUM là một ứng dụng diễn đàn trực tuyến full-stack được xây dựng trong khuôn khổ thực tập kỹ thuật. Yêu cầu nghiệp vụ bao gồm: quản lý bài viết, bình luận, vote, bookmark, thông báo thời gian thực, phân quyền người dùng và tích hợp AI để sinh nội dung tự động.

Trước khi bắt đầu triển khai, nhóm đã đánh giá ba kiến trúc phổ biến:

1. **Monolith**: Toàn bộ logic trong một ứng dụng duy nhất
2. **Monorepo Multi-service** *(lựa chọn cuối)*: Nhiều package/service trong cùng một repository
3. **Microservices thuần**: Mỗi service là repository và deployment đơn vị độc lập

### 1.1.2 So sánh kiến trúc

**Bảng 1.1 — So sánh ba kiến trúc trên 7 tiêu chí**

| Tiêu chí | Monolith | **Monorepo Multi-service** | Microservices thuần |
|---|:---:|:---:|:---:|
| Độ phức tạp thiết lập ban đầu | Thấp | **Trung bình** | Cao |
| Chia sẻ code / types | Dễ | **Có (shared types, configs)** | Khó (cần package registry) |
| Scale từng thành phần độc lập | Không | **Có (Docker/container)** | Có |
| Phù hợp với team nhỏ (1–3 người) | Có | **Có** | Không |
| Cô lập cơ sở dữ liệu | Không | **Không hoàn toàn** | Có |
| Thêm service mới về sau | Khó (refactor lớn) | **Dễ (thêm thư mục)** | Trung bình |
| Overhead vận hành | Thấp | **Trung bình** | Cao |

### 1.1.3 Lý do lựa chọn Monorepo Multi-service

Ba lý do chính:

**a) Tính linh hoạt mở rộng:** Dịch vụ `vibe-content` (AI content generation) được thêm vào ở Sprint 5 — sau khi forum core hoàn thiện. Với Monorepo, việc này chỉ cần thêm một thư mục mới mà không cần tách repository hay refactor codebase hiện có.

**b) Chia sẻ kiến trúc và tooling:** Các service đều dùng TypeScript, Prisma, ESLint với cấu hình đồng nhất. `vibe-content` có thể tái sử dụng Prisma schema từ `backend` thông qua `DATABASE_URL` chung, tránh định nghĩa lại model.

**c) Phù hợp với phạm vi và thời gian:** Trong 3 tháng với quy mô team nhỏ, việc quản lý nhiều repository riêng sẽ tạo overhead không cần thiết. Monorepo cho phép tập trung vào logic nghiệp vụ thay vì hạ tầng phối hợp service.

---

## 1.2 Kiến trúc tổng thể 4-tier

Hệ thống MINI-FORUM tổ chức theo mô hình **4-tier architecture**:

**Hình 1.1 — Sơ đồ kiến trúc tổng thể**

```
╔══════════════════════════════════════════════════════════════════╗
║              MINI-FORUM — SYSTEM ARCHITECTURE                   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  TIER 1 — BROWSER CLIENTS                                        ║
║  ┌─────────────────────┐    ┌──────────────────────────┐         ║
║  │     frontend/       │    │      admin-client/        │        ║
║  │   React + Vite      │    │      React + Vite         │        ║
║  │   Port :5173        │    │      Port :5174           │        ║
║  │                     │    │                           │        ║
║  │  React Query        │    │  React Query              │        ║
║  │  React Router       │    │  React Router             │        ║
║  │  Tailwind CSS       │    │  Radix UI                 │        ║
║  └─────────┬───────────┘    └─────────┬─────────────────┘        ║
║            │                          │                          ║
║            └──────────────┬───────────┘                          ║
║                           │ HTTPS / REST API                     ║
║                           │ Authorization: Bearer {JWT}          ║
╠═══════════════════════════╪══════════════════════════════════════╣
║                           ▼                                      ║
║  TIER 2 — BACKEND API SERVICE                                    ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │                    backend/  :5000                         │  ║
║  │  Express.js + TypeScript + Prisma ORM                      │◄─║──── vibe-content
║  │                                                            │  ║     (HTTP/REST)
║  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │  ║
║  │  │ 9 Middlewares│  │ 14 Controllers│  │  21 Services     │  │  ║
║  │  │             │  │              │  │                  │  │  ║
║  │  │ Security    │→ │ Auth         │→ │  AuthService     │  │  ║
║  │  │ Auth        │  │ Post         │  │  PostService     │  │  ║
║  │  │ Role        │  │ Comment      │  │  CommentService  │  │  ║
║  │  │ Validate    │  │ User         │  │  UserService     │  │  ║
║  │  │ Logger      │  │ Admin        │  │  NotifService    │  │  ║
║  │  │ Metrics     │  │ ...+9 more   │  │  ...+16 more     │  │  ║
║  │  └─────────────┘  └──────────────┘  └──────────────────┘  │  ║
║  └────────────────────────────┬───────────────────────────────┘  ║
║                               │ Prisma ORM / TCP                 ║
╠═══════════════════════════════╪══════════════════════════════════╣
║                               ▼                                  ║
║  TIER 3 — DATABASE                                               ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │                    PostgreSQL :5432                        │  ║
║  │              (Supabase / Render hosted)                    │  ║
║  │                                                            │◄─║──── vibe-content
║  │  19 Models | Prisma Migrations | Full-text Search          │  ║     (Prisma, READ)
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  TIER 4 — AI SERVICE                                             ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │               vibe-content/  :4000                         │  ║
║  │   Node.js + Prisma + Multi-LLM Fallback Chain              │  ║
║  │                                                            │  ║
║  │  Cron Scheduler                                            │  ║
║  │       ↓                                                    │  ║
║  │  ContextGatherer → ActionSelector → PromptBuilder          │  ║
║  │       ↓                                                    │  ║
║  │  ContentGenerator [Gemini → Groq → Cerebras → Nvidia]      │  ║
║  │       ↓                                                    │  ║
║  │  ValidationService → APIExecutor → StatusService           │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  EXTERNAL SERVICES                                               ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   ║
║  │  Brevo API   │  │  ImageKit    │  │  LLM Providers       │   ║
║  │  (Email)     │  │  (CDN Media) │  │  Gemini/Groq/...     │   ║
║  └──────────────┘  └──────────────┘  └──────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════╝
```

### Mô tả các tier

**Tier 1 — Browser Clients:** Hai ứng dụng React chạy trên trình duyệt. `frontend/` phục vụ người dùng cuối với đầy đủ tính năng diễn đàn. `admin-client/` dành riêng cho quản trị viên với bảng điều khiển vận hành.

**Tier 2 — Backend API Service:** Lớp xử lý nghiệp vụ trung tâm. Nhận request từ browser clients và vibe-content, áp dụng middleware pipeline, thực thi business logic qua service layer, trả về JSON response.

**Tier 3 — Database:** PostgreSQL đóng vai trò nguồn dữ liệu duy nhất (single source of truth). Được truy cập bởi cả backend (đọc/ghi) và vibe-content (chỉ đọc context).

**Tier 4 — AI Service:** Dịch vụ autonomous chạy độc lập, thu thập context từ database và thực hiện hành động qua Forum API. Không phục vụ request từ browser trực tiếp.

---

## 1.3 Mô hình dữ liệu — PostgreSQL Database Schema

### 1.3.1 Tổng quan 19 Model

PostgreSQL database được quản lý bởi Prisma ORM với **19 model** chia thành 6 nhóm chức năng:

**Bảng 1.2 — Danh sách 19 model trong schema**

| Nhóm | Model | Mô tả chức năng |
|------|-------|----------------|
| **User & Auth** | `users` | Tài khoản người dùng, role, avatar, reputation |
| | `refresh_tokens` | JWT refresh token (server-side revocation) |
| | `otp_tokens` | One-time password cho đặt lại mật khẩu |
| **Content** | `posts` | Bài viết với block layout, status, pin |
| | `post_blocks` | Các khối nội dung (text/image) trong bài viết |
| | `post_media` | File ảnh đính kèm bài viết (ImageKit) |
| | `comments` | Bình luận với thread cha/con và quote |
| **Taxonomy** | `categories` | Danh mục với permission level |
| | `tags` | Nhãn bài viết |
| | `post_tags` | Bảng liên kết nhiều-nhiều post–tag |
| **Interaction** | `votes` | Vote bài viết và bình luận (upvote/downvote) |
| | `bookmarks` | Lưu bài viết yêu thích |
| | `notifications` | Thông báo người dùng |
| **Moderation** | `reports` | Báo cáo vi phạm |
| | `user_blocks` | Chặn người dùng |
| | `audit_logs` | Nhật ký hành động admin |
| **Config** | `site_config` | Cấu hình động của hệ thống |
| **AI** | `user_content_context` | Lịch sử và trạng thái bot vibe-content |
| | *(config table)* | Cấu hình scheduler |

### 1.3.2 Entity Relationship Diagram (ERD) — Các quan hệ chính

**Hình 1.2 — ERD các entity chính**

```
users ──────────────────────────────────────────────┐
 │                                                   │
 │ 1:N (author)          1:N (voter)                 │
 ▼                       ▼                          │
posts ──────── post_blocks                        votes
 │  │           │                                    │
 │  │ 1:N       │ 1:N                               │ N:1
 │  ▼           ▼                                   │
 │ comments  post_media                          comments
 │  │           │                                    │
 │  │           │(imagekit_file_id)                  │
 │  │           ▼                                    │
 │  │       [ImageKit CDN]                           │
 │  │                                                │
 │  └── quoted_comment_id (self-ref: quote)          │
 │  └── parent_id (self-ref: thread)                 │
 │                                                   │
 │ N:M (via post_tags)                               │
 ▼                                                   │
tags                                                 │
                                                     │
users ──── bookmarks ──── posts                      │
users ──── notifications                             │
users ──── refresh_tokens                            │
users ──── audit_logs                                │
users ──── user_blocks (blocker, blocked)            │
users ──── reports                                   │
users ──── user_content_context (bot tracking)       │
posts ──── reports                                   │
comments ── reports                                  │
```

### 1.3.3 Enum và Permission System

Schema sử dụng các enum PostgreSQL để kiểm soát giá trị:

```
Role:            MEMBER | MODERATOR | ADMIN
PermissionLevel: ALL | MEMBER | MODERATOR | ADMIN
PostStatus:      DRAFT | PUBLISHED | ARCHIVED | HIDDEN
CommentStatus:   VISIBLE | HIDDEN | DELETED
BlockType:       TEXT | IMAGE
PinType:         GLOBAL | CATEGORY
ReportTarget:    POST | COMMENT | USER
ReportStatus:    PENDING | RESOLVED | DISMISSED
AuditAction:     (các hành động admin)
AuditTarget:     (các đối tượng audit)
NotificationType:(các loại thông báo)
```

**Cơ chế phân quyền xem nội dung theo category:**

```
categories.view_permission = ALL     → Guest có thể xem
categories.view_permission = MEMBER  → Chỉ user đã đăng nhập
categories.view_permission = ADMIN   → Chỉ admin
```

---

## 1.4 Nguyên tắc kiến trúc cốt lõi

Hệ thống được xây dựng theo **4 nguyên tắc kiến trúc** nhất quán xuyên suốt:

### Nguyên tắc 1: Single Database, Multiple Consumers

```
                 DATABASE_URL
        ┌────────────────────────────┐
        │                            │
   [backend/]                [vibe-content/]
   (Read + Write)             (Read only)
        │                            │
        └─────────────┬──────────────┘
                      ▼
               [PostgreSQL]
           (Single Source of Truth)
```

*Lợi ích:* Data consistency tuyệt đối — không cần đồng bộ dữ liệu giữa service.

*Trade-off:* Coupling ở tầng DB — thay đổi schema ảnh hưởng cả hai service.

### Nguyên tắc 2: API-first Integration

```
✅ ĐÚNG — Ghi qua Forum API:
vibe-content → POST /api/v1/posts → [Backend Business Logic] → DB
                                    ↳ Tạo notification
                                    ↳ Cập nhật post_count
                                    ↳ Ghi audit_log
                                    ↳ Validate content

❌ SAI — Ghi thẳng vào DB:
vibe-content → prisma.posts.create() → DB (bypass toàn bộ business logic)
```

*Lý do:* Đảm bảo mọi consumer (frontend, admin-client, vibe-content) đều kích hoạt đúng business logic. Không có "đường tắt" tạo dữ liệu không nhất quán.

### Nguyên tắc 3: Stateless Backend

Mỗi HTTP request tự mang đầy đủ thông tin để xử lý (JWT trong `Authorization` header). Server không lưu session state trong memory. Lợi ích: dễ scale horizontal — thêm instance backend mà không cần session sharing.

### Nguyên tắc 4: Layered Architecture

```
HTTP Request
     ↓
[Middleware Layer]  — Không chứa business logic
     ↓
[Controller Layer]  — Chỉ parse request, gọi service, trả response
     ↓
[Service Layer]     — Chứa toàn bộ business logic
     ↓
[Prisma Client]     — Data access layer
     ↓
[PostgreSQL]        — Storage
```

*Quy tắc không được vi phạm:*
- Controller không gọi `prisma` trực tiếp
- Service không đọc `req` hoặc `res` object
- Middleware không gọi service layer (ngoại trừ `authMiddleware`)

---

*[Tiếp theo: Chương 2 — Phân tích và thiết kế module]*
