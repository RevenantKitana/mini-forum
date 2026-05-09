# CHƯƠNG 1
# TỔNG QUAN HỆ THỐNG THÔNG TIN

---

## 1.1 Bối cảnh và định hướng

MINI-FORUM là hệ thống diễn đàn full-stack được xây dựng như Management Information System (MIS) hoàn chỉnh, khác biệt với các nền tảng hiện có bởi: (1) workflow moderation và audit trail đầy đủ, (2) RBAC đa cấp (Guest/Member/Moderator/Admin/Bot), (3) kiến trúc monorepo cho phép triển khai độc lập từng service, (4) tích hợp AI content seeding.

Đề tài được lựa chọn do tính thực tiễn cao (production-ready codebase), bao phủ toàn diện các khái niệm MIS (ERD, DFD, RBAC, audit trail), sử dụng tech stack hiện đại (Node.js/TypeScript/React/PostgreSQL/Prisma), và cung cấp mô hình kiến trúc monorepo phù hợp để nghiên cứu phân tách trách nhiệm hệ thống.

---

## 1.2 Khái niệm MIS và MINI-FORUM

MIS là tập hợp tổ chức của con người, quy trình, dữ liệu và công nghệ nhằm thu thập, xử lý, lưu trữ và phân phối thông tin phục vụ ra quyết định và kiểm soát trong một tổ chức. MINI-FORUM hoạt động theo mô hình IPO (Input—Processing—Output) với: (1) Input từ UGC (bài viết, bình luận, vote, báo cáo), (2) Processing qua 14 route modules với business logic trong 21 services, (3) Output qua RBAC 4 cấp, SSE notifications, email, và dashboard admin.

MINI-FORUM thuộc nhóm **Community MIS** (khác với Enterprise MIS): dữ liệu đầu vào từ cộng đồng mở, đòi hỏi cơ chế moderation và reputation system tinh vi. Hệ thống đáp ứng 5 tiêu chí MIS: thu thập UGC (form đăng ký, bài viết, bình luận, vote), xử lý qua 14 modules, lưu trữ qua PostgreSQL 19 models, phân phối qua RBAC và SSE, hỗ trợ ra quyết định qua dashboard admin và audit trail.

## 1.3 Phạm vi và kiến trúc hệ thống

**Phạm vi hệ thống:** Quản lý thành viên (auth/profile), nội dung (bài viết/bình luận lồng nhau), tương tác (vote/bookmark/search), kiểm duyệt (moderation/audit log), thông báo real-time (SSE), quản lý media (CDN), AI seeding. **Ngoài phạm vi:** Hệ thống thanh toán, BI/Advanced Analytics, mobile apps, video streaming.

**Kiến trúc tổng thể:** 4 service trong monorepo (backend Express, frontend React, admin-client React, vibe-content Node.js) giao tiếp qua HTTP REST, chia sẻ PostgreSQL database và Prisma schema. Mô hình IPO: Input từ 5 tác nhân (Guest/Member/Moderator/Admin/Bot) → Processing qua 14 route modules + 21 services → Output qua RBAC, SSE, email, dashboard.

**Hình 1.2 — Kiến trúc tổng thể hệ thống (4 service)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 KIẾN TRÚC TỔNG THỂ HỆ THỐNG MINI-FORUM                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────────────┐
│ frontend             │  │ admin-client         │  │ vibe-content            │
│ React 18 + Vite      │  │ React 18 + Vite      │  │ Node.js + TypeScript    │
│ Port: 5173           │  │ Port: 5174           │  │ Port: 3001              │
│ UI cho member/guest  │  │ Dashboard quản trị    │  │ Bot seeding nội dung    │
└──────────┬───────────┘  └──────────┬───────────┘  │ LLM: Gemini/Groq/       │
          │                         │              │ Cerebras/Nvidia         │
          └──────────────┬──────────┴──────────────┴──────────────┐
                       │ HTTP REST / JSON                       │
                       ▼                                        │
               ┌──────────────────────────────────────┐           │
               │ backend                              │◄──────────┘
               │ Express + TypeScript                 │
               │ Port: 3000                           │
               │ 14 route modules + 21 services       │
               │ Auth / Content / Moderation / SSE    │
               └──────────────────┬───────────────────┘
                                │ Prisma ORM
                                ▼
               ┌──────────────────────────────────────┐
               │ PostgreSQL + Prisma Schema           │
               │ Single Source of Truth               │
               │ 19 Models / 10 Enums                 │
               │ Foreign keys enforced                │
               └──────────────────────────────────────┘
```

**Bảng 1.4 — Nguyên tắc giao tiếp giữa các dịch vụ**

| Kết nối | Giao thức | Biến môi trường | Mô tả |
|---------|:--------:|:---------------:|-------|
| `frontend` → `backend` | HTTP/REST | `VITE_API_URL` | Mọi thao tác người dùng cuối |
| `admin-client` → `backend` | HTTP/REST | `VITE_API_URL` | Mọi thao tác quản trị viên |
| `vibe-content` → `backend` | HTTP/REST | `FORUM_API_URL` | Post/comment tự động qua API |
| `vibe-content` → `database` | Prisma ORM | `DATABASE_URL` | Đọc context người dùng trực tiếp |

> **Nguyên tắc "Single Source of Truth":** Toàn bộ trạng thái nghiệp vụ chỉ được lưu tại PostgreSQL. Không có bộ nhớ đệm phân tán hay trạng thái cục bộ giữa các service.

### 1.5.3 Kiến trúc Middleware Pipeline

Mỗi HTTP request đi qua pipeline middleware tuần tự:

**Hình 1.6 — Pipeline Middleware của Backend**

```
  HTTP Request đến backend (Port 3000)
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  cors()                                 │
  │  → Kiểm tra Origin, cho phép cross-origin│
  └──────────────────┬──────────────────────┘
                     ▼
  ┌─────────────────────────────────────────┐
  │  helmet()                               │
  │  → Set HTTP security headers            │
  │  (CSP, HSTS, X-Frame-Options, ...)      │
  └──────────────────┬──────────────────────┘
                     ▼
  ┌─────────────────────────────────────────┐
  │  express-rate-limit                     │
  │  → Giới hạn request/IP/phút            │
  │  → Chống brute-force và DDoS           │
  └──────────────────┬──────────────────────┘
                     ▼
  ┌─────────────────────────────────────────┐
  │  authMiddleware                         │
  │  → Verify JWT token từ Authorization   │
  │  → Gắn req.user = { id, role }         │
  └──────────────────┬──────────────────────┘
                     ▼
  ┌─────────────────────────────────────────┐
  │  roleMiddleware / requireRole()         │
  │  → Kiểm tra Role đủ điều kiện truy cập │
  │  → 403 nếu không đủ quyền             │
  └──────────────────┬──────────────────────┘
                     ▼
  ┌─────────────────────────────────────────┐
  │  validateMiddleware (Zod schema)        │
  │  → Validate request body/params/query  │
  │  → 400 nếu data không hợp lệ          │
  └──────────────────┬──────────────────────┘
                     ▼
  ┌──────────────┐   │   ┌──────────────┐
  │  Controller  │◄──┘   │  Service     │
  │ (điều phối)  │──────►│ (business    │
  │              │       │  logic)      │
  └──────────────┘       └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │  Prisma ORM  │
                         │ (type-safe   │
                         │  DB access)  │
                         └──────┬───────┘
                                │
                         PostgreSQL DB
```

---

## 1.6 Các quy trình nghiệp vụ chính

### 1.6.1 Vòng đời nghiệp vụ MINI-FORUM

Hệ thống MINI-FORUM bao gồm **6 quy trình nghiệp vụ** tạo thành vòng đời hoàn chỉnh:

**Hình 1.7 — Vòng đời nghiệp vụ MINI-FORUM**

```
╔═══════════════════════════════════════════════════════════╗
║              VÒNG ĐỜI NGHIỆP VỤ MINI-FORUM               ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║    ┌──────────────────────────────────────────────┐      ║
║    │                                              │      ║
║    │  [1] Đăng ký &   ──►  [2] Tạo & Quản lý     │      ║
║    │      Xác thực          Nội dung              │      ║
║    │       ▲                     │                │      ║
║    │       │                     ▼                │      ║
║    │  [6] Thông báo      [3] Phân loại            │      ║
║    │      Real-time           Nội dung            │      ║
║    │       ▲                     │                │      ║
║    │       │                     ▼                │      ║
║    │  [5] Quản trị &   ◄── [4] Tương tác          │      ║
║    │      Kiểm duyệt          Cộng đồng           │      ║
║    │                                              │      ║
║    └──────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════╝
```

**Bảng 1.5 — Chi tiết 6 quy trình nghiệp vụ cốt lõi**

| STT | Quy trình | Mô tả | Thực thể DB chính |
|:---:|----------|-------|:----------------:|
| **1** | **Đăng ký & Xác thực** | Onboarding: đăng ký, xác thực OTP email, đăng nhập JWT, refresh token, reset mật khẩu | `users`, `otp_tokens`, `refresh_tokens` |
| **2** | **Tạo & Quản lý nội dung** | Tạo bài viết text/block layout, ảnh đính kèm; bình luận đa cấp; chỉnh sửa, xóa (soft delete) | `posts`, `post_blocks`, `post_media`, `comments` |
| **3** | **Phân loại nội dung** | Phân loại bài viết theo danh mục, gắn thẻ tag; mỗi category có permission riêng | `categories`, `tags`, `post_tags` |
| **4** | **Tương tác cộng đồng** | Vote upvote/downvote ảnh hưởng reputation; bookmark; full-text search PostgreSQL | `votes`, `bookmarks`, `users.reputation` |
| **5** | **Quản trị & Kiểm duyệt** | Báo cáo vi phạm → moderation workflow; quản lý tài khoản; audit trail toàn bộ hành động admin | `reports`, `audit_logs`, `user_blocks` |
| **6** | **Thông báo thời gian thực** | Push notification qua SSE khi có sự kiện: reply, mention, vote, system | `notifications` |

### 1.6.2 DFD Mức 1 — Forum Core Flow

**Hình 1.8 — DFD Mức 1: Các tiến trình nghiệp vụ chính**

```
                     ┌──────────────────────────────────────────┐
                     │          MINI-FORUM DFD MỨC 1            │
                     │                                          │
  ┌──────────┐       │   ┌──────────────┐  ┌───────────────┐   │   ┌──────────┐
  │  Member  │──────►│   │  [P1] Auth   │  │  [P2] Content │   │──►│  Email   │
  │          │◄──────│   │  Module      │  │  Module       │   │◄──│  Brevo   │
  └──────────┘       │   └──────┬───────┘  └───────┬───────┘   │   └──────────┘
                     │          │DS1               │DS1         │
                     │          ▼                  ▼            │
                     │   ┌──────────────────────────────────┐   │   ┌──────────┐
                     │   │    D S 1 : PostgreSQL Database   │   │──►│ImageKit  │
                     │   └──────────────────────────────────┘   │◄──│   CDN    │
                     │          ▲                  ▲            │   └──────────┘
                     │          │DS1               │DS1         │
  ┌──────────┐       │   ┌──────┴───────┐  ┌───────┴───────┐   │
  │  Member  │──────►│   │[P3] Interact │  │  [P4] Admin   │   │   ┌──────────┐
  │          │◄──────│   │  Module      │  │  Module       │   │──►│LLM APIs  │
  └──────────┘       │   └──────────────┘  └───────────────┘   │◄──│(AI Gen)  │
                     │          ▲                  ▲            │   └──────────┘
  ┌──────────┐       │          │                  │            │
  │  Admin/  │──────►│──────────┘                  │            │
  │   Mod    │◄──────│─────────────────────────────┘            │
  └──────────┘       │                                          │
                     │   ┌──────────────────────────────────┐   │
  ┌──────────┐       │   │       [P5] AI Module             │   │
  │   Bot    │──────►│   │  (vibe-content → LLM → backend)  │   │
  └──────────┘       │   └──────────────────────────────────┘   │
                     └──────────────────────────────────────────┘
```

---

## 1.7 Công nghệ và nền tảng kỹ thuật

### 1.7.1 Backend Technology Stack

**Bảng 1.6 — Backend Technology Stack**

| Tầng | Thư viện / Framework | Phiên bản | Mục đích sử dụng |
|-----|:-------------------:|:---------:|----------------|
| **Web framework** | Express.js | 4.x | HTTP routing, middleware pipeline |
| **ORM** | Prisma | 6.x | Type-safe database access và migration |
| **Validation** | Zod | 3.x | Schema validation tại request boundary |
| **Authentication** | JSON Web Token (JWT) | — | Access token (15 phút), stateless auth |
| **Password** | bcrypt | — | Password hashing (salt rounds = 10) |
| **Email** | Brevo (Sendinblue) SDK | — | OTP và transactional email |
| **Media** | ImageKit SDK | — | CDN: upload, transform, optimize ảnh |
| **Real-time** | Server-Sent Events (SSE) | — | Push notification server→client |
| **Testing** | Vitest | — | Unit và integration tests |
| **Rate Limiting** | express-rate-limit | — | Chống brute-force và DDoS |
| **Security** | Helmet.js | — | HTTP security headers |
| **Language** | TypeScript | 5.x | Static typing, compile-time safety |

### 1.7.2 Frontend Technology Stack

**Bảng 1.7 — Frontend & Admin-Client Technology Stack**

| Tầng | Thư viện / Framework | Mục đích sử dụng |
|-----|:-------------------:|----------------|
| **UI Framework** | React 18 | Component-based UI, Concurrent features |
| **Build tool** | Vite | Fast HMR, tree-shaking, optimized build |
| **Styling** | Tailwind CSS | Utility-first CSS, responsive design |
| **Components** | Radix UI | Accessible, headless UI primitives |
| **Server state** | TanStack Query (React Query) | Cache, sync, loading/error state cho API |
| **Forms** | React Hook Form + Zod | Form state + validation, tích hợp schema |
| **Routing** | React Router v6 | SPA navigation, nested routes |
| **HTTP client** | Axios | API calls với request/response interceptors |
| **Language** | TypeScript | Static typing, type-safe API integration |

### 1.7.3 Database Technology Stack

**Bảng 1.8 — Database Technology Stack**

| Thành phần | Công nghệ | Chi tiết |
|-----------|:--------:|---------|
| **DBMS** | PostgreSQL 14+ | Relational database với JSON support |
| **ORM** | Prisma 6 | Type-safe queries, migration history |
| **Schema** | — | 19 models, 10 enums |
| **Full-text search** | PostgreSQL native | `tsvector`/`tsquery` cho tìm kiếm tiếng Việt |
| **Indexing** | — | Index tối ưu cho author_id, created_at, status, category_id |
| **Constraints** | — | Foreign key, UNIQUE constraint tại DB level |
| **Soft delete** | — | PostStatus.DELETED, CommentStatus.DELETED (data giữ nguyên) |

### 1.7.4 Schema Database tổng quan

Dưới đây là sơ đồ các model chính và quan hệ:

**Hình 1.9 — Sơ đồ Database Schema (ERD Level 0)**

```
┌──────────────┐       ┌──────────────┐      ┌──────────────┐
│    USERS     │       │    POSTS     │      │  CATEGORIES  │
│──────────────│       │──────────────│      │──────────────│
│ id (PK)      │◄──┐   │ id (PK)      │──┐   │ id (PK)      │
│ email (UQ)   │   │   │ title        │  │   │ name         │
│ username(UQ) │   │   │ slug (UQ)    │  │   │ slug (UQ)    │
│ password_hash│   │   │ content      │  │   │ view_perm    │
│ role (enum)  │   │   │ author_id(FK)│──┘   │ post_perm    │
│ reputation   │   │   │ category_id  │──────►│ comment_perm │
│ is_verified  │   │   │ status(enum) │      └──────────────┘
│ is_active    │   │   │ is_pinned    │
└──────┬───────┘   │   │ is_locked    │      ┌──────────────┐
       │           │   │ use_block    │      │  POST_BLOCKS │
       │           │   └──────┬───────┘      │──────────────│
       │           │          │◄─────────────│ post_id (FK) │
       │           │          │              │ type (enum)  │
       │           │          │              │ content      │
       ▼           │          ▼              │ sort_order   │
┌──────────────┐   │   ┌──────────────┐     └──────────────┘
│  COMMENTS    │   │   │    VOTES     │
│──────────────│   │   │──────────────│     ┌──────────────┐
│ id (PK)      │   │   │ user_id (FK) │─┐   │ AUDIT_LOGS   │
│ content      │   │   │ target_type  │ │   │──────────────│
│ author_id(FK)│───┘   │ target_id    │ │   │ user_id (FK) │
│ post_id (FK) │        │ value(+1/-1)│ └──►│ action(enum) │
│ parent_id(FK)│─►(self)└──────────────┘    │ target_type  │
│ status(enum) │                            │ old_value    │
└──────────────┘   ┌──────────────┐         │ new_value    │
                   │  REPORTS     │         │ ip_address   │
┌──────────────┐   │──────────────│         └──────────────┘
│NOTIFICATIONS │   │ reporter_id  │
│──────────────│   │ target_type  │         ┌──────────────┐
│ user_id (FK) │   │ target_id    │         │    TAGS      │
│ type (enum)  │   │ reason       │         │──────────────│
│ title        │   │ status(enum) │         │ name         │
│ is_read      │   │ reviewed_by  │         │ slug (UQ)    │
└──────────────┘   └──────────────┘         │ use_perm     │
                                            │ usage_count  │
                                            └──────────────┘
```

---

## 1.8 Bảo mật hệ thống

### 1.8.1 Mô hình Defense in Depth

Hệ thống áp dụng mô hình **Defense in Depth** (bảo mật theo chiều sâu) — nhiều lớp kiểm soát độc lập:

**Bảng 1.9 — Các lớp bảo mật của MINI-FORUM**

| Lớp | Cơ chế | Mục tiêu bảo vệ |
|:---:|-------|----------------|
| **1. Transport** | HTTPS (TLS) | Mã hóa dữ liệu truyền tải, chống man-in-the-middle |
| **2. Application** | Helmet.js HTTP headers (CSP, HSTS, X-Frame-Options) | XSS, Clickjacking, MIME sniffing |
| **3. Authentication** | JWT access (15 phút) + httpOnly cookie refresh (7 ngày) | Session hijacking, XSS token theft |
| **4. Authorization** | RBAC middleware kiểm tra role/permission mỗi route | Unauthorized access, privilege escalation |
| **5. Input** | Zod schema validation trên mọi endpoint | SQL injection, invalid data |
| **6. Rate limiting** | express-rate-limit per IP | Brute-force attack, DDoS |
| **7. Data** | bcrypt hash salt=10 cho password | Password exposure khi rò rỉ DB |

### 1.8.2 Luồng xác thực bảo mật (Auth Flow)

**Hình 1.10 — Luồng xác thực JWT với Refresh Token**

```
  Client (Browser)                    Backend
       │                                 │
       │  POST /auth/login               │
       │  { email, password }           │
       │────────────────────────────────►│
       │                                 │── bcrypt.compare()
       │                                 │── JWT.sign() accessToken (15min)
       │                                 │── Generate refreshToken UUID
       │                                 │── Store in refresh_tokens table
       │  200 OK                         │
       │  { accessToken }               │
       │  Set-Cookie: refreshToken       │
       │  (httpOnly; Secure; SameSite)   │
       │◄────────────────────────────────│
       │                                 │
       │  [Sau 15 phút]                  │
       │  POST /auth/refresh             │
       │  Cookie: refreshToken (auto)   │
       │────────────────────────────────►│
       │                                 │── Validate refresh_tokens table
       │                                 │── Check expires_at > now()
       │                                 │── JWT.sign() new accessToken
       │  200 OK { newAccessToken }      │
       │◄────────────────────────────────│
       │                                 │
       │  [Logout]                       │
       │  POST /auth/logout              │
       │────────────────────────────────►│
       │                                 │── DELETE FROM refresh_tokens
       │                                 │   WHERE token = cookieToken
       │  200 OK (Cookie cleared)        │
       │◄────────────────────────────────│
```

> **Lý do lưu refresh token trong httpOnly cookie:** Trình duyệt không thể đọc cookie httpOnly qua JavaScript → Bảo vệ khỏi tấn công XSS. Ngay cả khi trang web bị inject script độc hại, kẻ tấn công cũng không thể đánh cắp refresh token.

---

## Tóm tắt chương 1

Chương 1 đã thiết lập toàn bộ nền tảng lý thuyết và thực tiễn cho việc phân tích MINI-FORUM:

| Nội dung | Kết quả chính |
|:--------:|--------------|
| **Lý thuyết MIS** | MINI-FORUM đáp ứng đầy đủ 5 tiêu chí của MIS hoàn chỉnh (Laudon & Laudon 2022) |
| **Kiến trúc** | Monorepo 4 dịch vụ độc lập, REST API, PostgreSQL là Single Source of Truth |
| **Mô hình IPO** | 11 loại đầu vào → 6 module xử lý → 12 loại đầu ra thông tin |
| **Context Diagram** | 5 tác nhân bên ngoài + 3 hệ thống tích hợp (Brevo, ImageKit, LLM) |
| **Phạm vi** | 6 quy trình nghiệp vụ tạo vòng đời hoàn chỉnh từ đăng ký đến quản trị |
| **Công nghệ** | Node.js/Express + React 18 + Prisma + PostgreSQL — stack hiện đại production-ready |
| **Bảo mật** | Defense in Depth: 7 lớp bảo vệ từ transport đến data layer |

**Chương tiếp theo** sẽ đi sâu vào **phân tích nghiệp vụ** thông qua đặc tả chi tiết các tác nhân (Actor), Use Case Diagram, đặc tả use case và Business Rules được trích xuất trực tiếp từ codebase.
