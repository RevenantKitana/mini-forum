# CHƯƠNG 1
# TỔNG QUAN HỆ THỐNG THÔNG TIN

---

## 1.1 Đặt vấn đề và lý do chọn đề tài

### 1.1.1 Bối cảnh thực tiễn

Trong kỷ nguyên chuyển đổi số, các nền tảng cộng đồng trực tuyến đã trở thành một trong những hạ tầng thông tin quan trọng nhất của xã hội hiện đại. Từ các diễn đàn học thuật chuyên ngành đến các cộng đồng chia sẻ kiến thức như Stack Overflow, Reddit hay Hacker News — tất cả đều có một điểm chung: chúng không chỉ là nơi lưu trữ văn bản, mà là **hệ thống thông tin quản lý** (Management Information System — MIS) thực thụ với đầy đủ các thành phần: thu thập dữ liệu từ người dùng, xử lý theo quy tắc nghiệp vụ phức tạp, phân phối thông tin theo phân quyền, và cung cấp dashboard quản trị cho người điều hành.

Tuy nhiên, hầu hết các hệ thống diễn đàn hiện có ở thị trường Việt Nam đều gặp một số hạn chế cơ bản:

- **Thiếu kiểm soát nội dung có hệ thống:** Không có workflow moderation rõ ràng, audit trail đầy đủ.
- **Phân quyền đơn giản:** Chỉ phân biệt admin/user, thiếu cấp kiểm duyệt viên (moderator) linh hoạt.
- **Không tích hợp AI:** Nội dung hoàn toàn phụ thuộc vào người dùng, không có cơ chế seed nội dung ban đầu.
- **Kiến trúc monolith lỗi thời:** Khó mở rộng, bảo trì và triển khai độc lập các thành phần.

**Dự án MINI-FORUM** được xây dựng để giải quyết các hạn chế trên: một nền tảng diễn đàn trực tuyến full-stack, kiến trúc monorepo hiện đại, tích hợp AI content generation, và đặc biệt — được thiết kế như một MIS hoàn chỉnh với đầy đủ audit trail, phân quyền đa cấp RBAC, dashboard thống kê và workflow kiểm duyệt nội dung.

### 1.1.2 Lý do chọn đề tài

Đề tài **"Phân tích và thiết kế Hệ thống Thông tin Quản lý MINI-FORUM"** được lựa chọn vì:

1. **Tính thực tiễn cao:** Dự án là mã nguồn mở hoàn chỉnh với codebase production-ready, không phải đề tài lý thuyết.
2. **Bao phủ toàn diện kiến thức MIS:** Từ ERD, DFD đến RBAC, audit trail — tất cả đều hiện diện trong một hệ thống duy nhất.
3. **Công nghệ hiện đại:** Node.js/TypeScript/React/PostgreSQL/Prisma là stack được ưa chuộng nhất trong ngành công nghiệp 2024–2026.
4. **Tính mở rộng:** Kiến trúc monorepo với 4 service độc lập là mô hình tốt để nghiên cứu phân tách trách nhiệm hệ thống.

---

## 1.2 Khái niệm Hệ thống Thông tin Quản lý

### 1.2.1 Định nghĩa MIS

Hệ thống thông tin quản lý (MIS — Management Information System) được định nghĩa là:

> *"Tập hợp có tổ chức của con người, quy trình, dữ liệu và công nghệ nhằm mục đích thu thập, xử lý, lưu trữ và phân phối thông tin phục vụ ra quyết định, phối hợp hoạt động và kiểm soát trong một tổ chức."*
> — Laudon & Laudon, *Management Information Systems*, 16th Edition (2022)

Một MIS hoàn chỉnh vận hành theo mô hình **IPO (Input — Processing — Output)**:

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│   INPUT LAYER   │     │   PROCESSING LAYER   │     │    OUTPUT LAYER      │
│  (Đầu vào)      │────►│  (Xử lý)             │────►│  (Đầu ra)            │
│                 │     │                      │     │                      │
│ • Dữ liệu thô   │     │ • Lọc, phân tích     │     │ • Báo cáo quản lý    │
│ • Giao dịch     │     │ • Tính toán           │     │ • Dashboard          │
│ • Yêu cầu NSD   │     │ • Kiểm tra nghiệp vụ │     │ • Thông tin quyết    │
│                 │     │ • Phân quyền truy cập│     │   định               │
└─────────────────┘     └──────────────────────┘     └──────────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   DATABASE LAYER    │
                         │  (Lưu trữ dữ liệu) │
                         └─────────────────────┘
```

**Hình 1.1 — Mô hình IPO tổng quát của MIS**

### 1.2.2 Phân loại MIS theo phạm vi phục vụ

Theo phạm vi người dùng, MIS được phân loại thành:

| Loại MIS | Người dùng | Dữ liệu đầu vào | Ví dụ |
|---------|----------|----------------|-------|
| **Enterprise MIS** | Nhân viên nội bộ | Giao dịch kinh doanh | SAP ERP, Oracle |
| **Community MIS** | Cộng đồng mở bên ngoài | User Generated Content (UGC) | Reddit, Stack Overflow |
| **Hybrid MIS** | Cả hai nhóm | Kết hợp UGC + nội bộ | Confluence, Notion |

MINI-FORUM thuộc nhóm **Community MIS** — một dạng MIS đặc thù với thách thức kiểm soát chất lượng nội dung từ cộng đồng, đòi hỏi cơ chế moderation và reputation system tinh vi.

### 1.2.3 MINI-FORUM là Community MIS

MINI-FORUM đáp ứng đầy đủ định nghĩa MIS theo 5 tiêu chí kiểm tra:

| Tiêu chí MIS | Hiện thực hóa trong MINI-FORUM |
|-------------|-------------------------------|
| **Thu thập dữ liệu** | Form đăng ký, tạo bài viết, bình luận, vote, báo cáo vi phạm |
| **Xử lý nghiệp vụ** | 14 route modules với các service classes xử lý business logic |
| **Lưu trữ có cấu trúc** | PostgreSQL với 19 models, 10 enums, fully-indexed schema |
| **Phân phối thông tin** | RBAC 4 cấp, SSE real-time notifications, email transactional |
| **Hỗ trợ ra quyết định** | Admin dashboard, audit log, báo cáo thống kê, moderation workflow |

**Bảng 1.1 — So sánh MIS Truyền thống và Community MIS (MINI-FORUM)**

| Tiêu chí | MIS Truyền thống | Community MIS (MINI-FORUM) |
|---------|:---------------:|:--------------------------:|
| **Người dùng chính** | Nhân viên nội bộ | Cộng đồng mở bên ngoài |
| **Dữ liệu đầu vào** | Giao dịch kinh doanh nội bộ | User Generated Content (UGC) |
| **Kiểm soát chất lượng** | Quy trình nội bộ cứng nhắc | Moderation + community reporting |
| **Phân quyền** | Theo cấp bậc tổ chức | RBAC linh hoạt: Guest/Member/Mod/Admin |
| **Thông tin đầu ra** | Báo cáo định kỳ cho ban lãnh đạo | Dashboard real-time + SSE notifications |
| **AI/Automation** | Không phổ biến | Bot role tích hợp (vibe-content service) |
| **Cơ chế phản hồi** | Từ trên xuống (top-down) | Hai chiều: community ↔ admin |

---

## 1.3 Giới thiệu dự án MINI-FORUM

### 1.3.1 Tổng quan dự án

**MINI-FORUM** là ứng dụng diễn đàn trực tuyến full-stack mã nguồn mở, được xây dựng như một nền tảng cộng đồng hoàn chỉnh, có thể triển khai thực tế (production-ready). Dự án cung cấp đầy đủ các tính năng của một diễn đàn hiện đại:

- **Quản lý thành viên:** Đăng ký, xác thực OTP qua email, đăng nhập JWT + refresh token, quản lý hồ sơ cá nhân, upload avatar lên CDN.
- **Quản lý nội dung:** Tạo/sửa/xóa bài viết hỗ trợ Block Layout (rich text + hình ảnh), bình luận đa cấp, quote.
- **Tương tác cộng đồng:** Vote upvote/downvote ảnh hưởng điểm reputation, bookmark, full-text search.
- **Phân loại nội dung:** Danh mục (categories) với cấp quyền truy cập độc lập, thẻ (tags) đa mục đích.
- **Quản trị nâng cao:** RBAC 4 cấp, moderation workflow, audit trail đầy đủ, dashboard thống kê.
- **Thông báo thời gian thực:** Server-Sent Events (SSE) cho push notification không cần polling.
- **AI Content Generation:** Dịch vụ vibe-content tích hợp LLM (Gemini, Groq, Cerebras) để tự động sinh nội dung seed.

### 1.3.2 Phạm vi và ranh giới hệ thống

```
┌──────────────────────────────────────────────────────────────────┐
│                PHẠM VI HỆ THỐNG MINI-FORUM                      │
│                                                                  │
│  TRONG PHẠM VI (In Scope)               │ NGOÀI PHẠM VI          │
│  ────────────────────────────           │ (Out of Scope)         │
│  ✓ Xác thực & phân quyền               │                        │
│    (JWT + RBAC + OTP email)             │ ✗ Hệ thống thanh toán  │
│  ✓ Quản lý nội dung                     │   / premium            │
│    (bài viết, bình luận)                │                        │
│  ✓ Tương tác cộng đồng                  │ ✗ Business Intelligence │
│    (vote, bookmark, search)             │   / Advanced Analytics │
│  ✓ Kiểm duyệt nội dung                  │                        │
│    (report workflow, moderation)        │ ✗ Mobile application   │
│  ✓ Quản trị hệ thống                    │   (iOS/Android)        │
│    (audit log, dashboard)               │                        │
│  ✓ Thông báo real-time (SSE)            │ ✗ Video streaming      │
│  ✓ Quản lý media (ImageKit CDN)         │   / live chat          │
│  ✓ AI seed content (vibe-content)       │                        │
│  ✓ Email transactional (Brevo)          │                        │
└──────────────────────────────────────────────────────────────────┘
```

**Hình 1.2 — Sơ đồ ranh giới hệ thống MINI-FORUM**

---

## 1.4 Mô hình hệ thống tổng quát

### 1.4.1 Mô hình IPO chi tiết của MINI-FORUM

Áp dụng mô hình IPO vào MINI-FORUM:

**Hình 1.3 — Mô hình IPO chi tiết của MINI-FORUM**

```
╔══════════════════════════════════════════════════════════════════════════╗
║                     MINI-FORUM — MÔ HÌNH IPO                           ║
╠══════════════════╦═══════════════════════════╦══════════════════════════╣
║   INPUT LAYER    ║     PROCESSING LAYER      ║      OUTPUT LAYER        ║
╠══════════════════╬═══════════════════════════╬══════════════════════════╣
║                  ║                           ║                          ║
║ ► Form đăng ký   ║ ► authService             ║ ► Trang diễn đàn (UI)    ║
║ ► Đăng nhập      ║   JWT sign/verify         ║ ► Profile người dùng     ║
║ ► Tạo bài viết   ║   bcrypt hash             ║ ► Danh sách bài viết     ║
║ ► Bình luận      ║   OTP generate/verify     ║ ► Chi tiết bài viết      ║
║ ► Vote           ║ ► postService             ║ ► Thông báo SSE RT       ║
║ ► Bookmark       ║   Slug generation         ║ ► Email OTP/reset        ║
║ ► Báo cáo VP     ║   Permission check        ║ ► Admin dashboard        ║
║ ► Upload media   ║   Block layout render     ║ ► Audit log entries      ║
║ ► Tìm kiếm       ║ ► voteService             ║ ► Báo cáo thống kê       ║
║ ► AI prompt      ║   Reputation update       ║ ► Kết quả FTS            ║
║ ► Admin action   ║ ► notificationService     ║ ► Nội dung AI sinh tự    ║
║                  ║   SSE push                ║   động                   ║
║                  ║ ► reportService           ║ ► Media CDN URLs         ║
║                  ║   Moderation workflow     ║                          ║
║                  ║ ► LLM service             ║                          ║
║                  ║   Content generation      ║                          ║
╚══════════════════╩═══════════════════════════╩══════════════════════════╝
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    PostgreSQL Database   │
                    │  19 Models / 10 Enums   │
                    │  Single Source of Truth │
                    └─────────────────────────┘
```

### 1.4.2 Context Diagram — DFD Mức 0

Context Diagram mô tả MINI-FORUM như một hệ thống hộp đen tương tác với các tác nhân bên ngoài:

**Hình 1.4 — Context Diagram (DFD Mức 0)**

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
  ┌──────────┐      │           MINI-FORUM                     │     ┌──────────────┐
  │  GUEST   │─────►│           MIS System                     │────►│Brevo (Email) │
  │          │◄─────│                                          │◄────│   Service    │
  └──────────┘      │  Boundary: backend REST API              │     └──────────────┘
                    │            Port 3000                     │
  ┌──────────┐      │                                          │     ┌──────────────┐
  │  MEMBER  │─────►│  Internal Modules:                       │────►│ ImageKit CDN │
  │          │◄─────│  Auth | Post | Comment | Vote            │◄────│  (Media)     │
  └──────────┘      │  Search | Notify | Report | Audit        │     └──────────────┘
                    │  Category | Tag | User | Bookmark        │
  ┌──────────┐      │                                          │     ┌──────────────┐
  │MODERATOR │─────►│  Database Layer:                         │────►│ LLM Providers│
  │          │◄─────│  PostgreSQL (via Prisma ORM)             │◄────│ Gemini/Groq/ │
  └──────────┘      │                                          │     │ Cerebras     │
                    │                                          │     └──────────────┘
  ┌──────────┐      │                                          │
  │  ADMIN   │─────►│                                          │
  │          │◄─────│                                          │
  └──────────┘      │                                          │
                    │                                          │
  ┌──────────┐      │                                          │
  │   BOT    │─────►│                                          │
  │(vibe-cnt)│◄─────│                                          │
  └──────────┘      └──────────────────────────────────────────┘
```

**Bảng 1.2 — Giải thích các luồng dữ liệu chính (DFD Mức 0)**

| Luồng | Nguồn → Đích | Nội dung dữ liệu |
|:-----:|-------------|-----------------|
| F1 | Guest → System | Yêu cầu xem bài viết, tìm kiếm, đăng ký |
| F2 | System → Guest | Nội dung bài viết công khai, kết quả tìm kiếm |
| F3 | Member → System | Bài viết, bình luận, vote, báo cáo vi phạm, upload media |
| F4 | System → Member | Nội dung được cá nhân hóa, thông báo SSE, profile |
| F5 | Admin/Mod → System | Xử lý báo cáo, cấu hình hệ thống, quản lý người dùng |
| F6 | System → Admin/Mod | Audit log, dashboard thống kê, danh sách báo cáo chờ |
| F7 | System → Brevo | Yêu cầu gửi email OTP, email reset mật khẩu |
| F8 | Bot (vibe-content) → System | Bài viết và bình luận AI sinh tự động |
| F9 | LLM Providers → vibe-content | Nội dung text được sinh bởi AI |
| F10 | System ↔ ImageKit | Upload ảnh lên CDN, nhận preview/standard URL |

---

## 1.5 Kiến trúc kỹ thuật hệ thống

### 1.5.1 Kiến trúc Monorepo — 4 dịch vụ độc lập

MINI-FORUM được tổ chức theo kiến trúc **monorepo**: nhiều package độc lập trong một repository duy nhất. Ưu điểm:
- Chia sẻ type definitions và utilities dễ dàng
- Triển khai độc lập từng service (mỗi service có Dockerfile riêng)
- Quản lý phiên bản tập trung

**Bảng 1.3 — Các dịch vụ trong kiến trúc Monorepo MINI-FORUM**

| Dịch vụ | Công nghệ | Vai trò | Port |
|---------|----------|---------|:----:|
| **backend** | Node.js, Express, TypeScript, Prisma, Zod | API server chính — xử lý toàn bộ nghiệp vụ forum | 3000 |
| **frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Query | Giao diện người dùng cuối | 5173 |
| **admin-client** | React 18, Vite, TypeScript, Tailwind CSS, React Query | Giao diện quản trị viên và kiểm duyệt | 5174 |
| **vibe-content** | Node.js, TypeScript, Prisma, LLM SDKs | Dịch vụ sinh nội dung AI tự động | 3001 |

### 1.5.2 Kiến trúc tổng thể và giao tiếp giữa các dịch vụ

**Hình 1.5 — Kiến trúc tổng thể hệ thống MINI-FORUM**

```
╔══════════════════════════════════════════════════════════════════════╗
║                    KIẾN TRÚC HỆ THỐNG MINI-FORUM                    ║
╚══════════════════════════════════════════════════════════════════════╝

      TẦNG TRÌNH BÀY (Presentation Tier)
┌──────────────────────┐    ┌──────────────────────┐
│      frontend        │    │    admin-client       │
│  (React 18 + Vite)   │    │  (React 18 + Vite)    │
│  Port: 5173          │    │  Port: 5174           │
│                      │    │                       │
│  • Forum UI          │    │  • Dashboard stats    │
│  • Post / Comment    │    │  • Report workflow    │
│  • Search, Vote      │    │  • Audit log viewer   │
│  • SSE notification  │    │  • Category/Tag CRUD  │
└──────────┬───────────┘    └───────────┬───────────┘
           │  HTTP/REST (axios)          │  HTTP/REST (axios)
           │  VITE_API_URL               │  VITE_API_URL
           └──────────────┬─────────────┘
                          │
      TẦNG ỨNG DỤNG (Application Tier)
        ┌─────────────────▼──────────────────┐
        │            backend                  │
        │     (Express + TypeScript)          │
        │          Port: 3000                 │
        │                                     │
        │  Middleware: cors → helmet →         │
        │  rateLimit → auth → role →          │
        │  validate → controller → service    │
        │                                     │
        │  Routes (14 modules):               │
        │  /auth  /posts  /comments  /votes   │
        │  /search  /categories  /tags        │
        │  /users  /bookmarks  /reports       │
        │  /notifications  /admin  /config    │
        └──────────────┬──────────────────────┘
                       │                    ▲
              Prisma ORM│                   │ HTTP/REST (FORUM_API_URL)
                       │                   │
      TẦNG DỮ LIỆU (Data Tier)
        ┌──────────────▼──────────┐   ┌────┴───────────────────┐
        │    PostgreSQL DB        │   │      vibe-content       │
        │    (Single Source       │◄──┤  (Node + TypeScript)    │
        │      of Truth)          │   │  Port: 3001             │
        │                         │   │  LLM: Gemini/Groq/      │
        │  19 Models / 10 Enums   │   │  Cerebras/Nvidia        │
        │  Foreign keys enforced  │   └─────────────────────────┘
        └─────────────────────────┘
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
