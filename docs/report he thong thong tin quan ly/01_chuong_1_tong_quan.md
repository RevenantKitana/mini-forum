# CHƯƠNG 1
# TỔNG QUAN HỆ THỐNG THÔNG TIN

---

## 1.1 Định nghĩa hệ thống

### 1.1.1 Khái niệm Hệ thống Thông tin Quản lý

Hệ thống thông tin quản lý (MIS — Management Information System) được định nghĩa là tập hợp có tổ chức của con người, quy trình, dữ liệu và công nghệ nhằm mục đích **thu thập, xử lý, lưu trữ và phân phối thông tin** phục vụ ra quyết định, phối hợp hoạt động và kiểm soát trong một tổ chức (Laudon & Laudon, 2022).

Một MIS hoàn chỉnh bao gồm ba thành phần cốt lõi:

1. **Thành phần dữ liệu:** Nguồn dữ liệu đầu vào thô (raw data) từ các hoạt động nghiệp vụ.
2. **Thành phần xử lý:** Các quy trình chuyển đổi dữ liệu thành thông tin có giá trị.
3. **Thành phần thông tin:** Đầu ra dưới dạng báo cáo, cảnh báo, thống kê phục vụ quản lý.

### 1.1.2 MINI-FORUM là Community MIS

**MINI-FORUM** là một **Hệ thống Thông tin Quản lý Cộng đồng** (Community Management Information System — Community MIS) — hệ thống phần mềm phục vụ ba nhóm chức năng chính:

| Nhóm chức năng | Mô tả | Ví dụ trong hệ thống |
|---------------|-------|---------------------|
| **Hoạt động người dùng** | Thu thập và xử lý tương tác của thành viên | Tạo bài viết, bình luận, vote, bookmark |
| **Quản trị nội dung** | Kiểm soát, kiểm duyệt và quản lý nội dung | Moderation, báo cáo vi phạm, audit trail |
| **Sinh thông tin tự động** | Tạo và quản lý nội dung bởi AI agent | Vibe-content service sử dụng LLM |

**Bảng 1.1 — So sánh MIS truyền thống và Community MIS**

| Tiêu chí | MIS Truyền thống | Community MIS (MINI-FORUM) |
|---------|-----------------|---------------------------|
| **Người dùng chính** | Nhân viên nội bộ | Cộng đồng bên ngoài |
| **Dữ liệu đầu vào** | Giao dịch kinh doanh | Nội dung do cộng đồng tạo (UGC) |
| **Phân quyền** | Theo chức vụ công ty | Theo vai trò cộng đồng (Guest/Member/Mod/Admin) |
| **Kiểm soát chất lượng** | Quy trình nội bộ | Moderation + community reporting |
| **Thông tin đầu ra** | Báo cáo cho ban quản lý | Dashboard + notification + audit log |
| **AI/Automation** | Không phổ biến | Bot role tích hợp (vibe-content) |

---

## 1.2 Mô hình hệ thống tổng quát

### 1.2.1 Mô hình IPO (Input — Processing — Output)

Mô hình IPO mô tả luồng thông tin cấp cao nhất của MINI-FORUM:

**Hình 1.1 — Mô hình IPO của MINI-FORUM**

```
╔══════════════════════════════════════════════════════════════════════╗
║                        MINI-FORUM MIS                               ║
╠═════════════════╦════════════════════════╦═════════════════════════╣
║   INPUT LAYER   ║   PROCESSING LAYER     ║     OUTPUT LAYER        ║
╠═════════════════╬════════════════════════╬═════════════════════════╣
║ • Form đăng ký  ║ • Auth service         ║ • Trang diễn đàn        ║
║ • Bài viết mới  ║ • Post service         ║ • Thông báo real-time   ║
║ • Bình luận     ║ • Comment service      ║ • Admin dashboard       ║
║ • Vote          ║ • Vote service         ║ • Audit logs            ║
║ • Báo cáo VP    ║ • Report service       ║ • Báo cáo thống kê      ║
║ • AI prompt     ║ • LLM service          ║ • Nội dung AI           ║
║ • Tìm kiếm      ║ • Search service       ║ • Kết quả tìm kiếm      ║
╚═════════════════╩════════════════════════╩═════════════════════════╝
                              │
                              ▼
                   ┌─────────────────────┐
                   │  PostgreSQL Database │
                   │ (Single source of   │
                   │      truth)         │
                   └─────────────────────┘
```

### 1.2.2 Kiến trúc Monorepo — 4 dịch vụ độc lập

MINI-FORUM được tổ chức theo kiến trúc **monorepo** với 4 dịch vụ, mỗi dịch vụ có trách nhiệm riêng biệt:

**Bảng 1.2 — Các dịch vụ trong kiến trúc monorepo MINI-FORUM**

| Dịch vụ | Công nghệ | Vai trò | Cổng (Port) |
|---------|----------|---------|-------------|
| **backend** | Node.js, Express, TypeScript, Prisma | API server chính — xử lý mọi nghiệp vụ forum | 3000 |
| **frontend** | React, Vite, TypeScript, Tailwind CSS | Giao diện người dùng cuối | 5173 |
| **admin-client** | React, Vite, TypeScript, Tailwind CSS | Giao diện quản trị viên | 5174 |
| **vibe-content** | Node.js, TypeScript, Prisma | Dịch vụ sinh nội dung AI (LLM) | 3001 |

**Hình 1.2 — Kiến trúc tổng thể hệ thống**

```
┌─────────────────┐    ┌─────────────────┐
│    frontend     │    │  admin-client   │
│  (React/Vite)   │    │  (React/Vite)   │
│  Port: 5173     │    │  Port: 5174     │
└────────┬────────┘    └────────┬────────┘
         │                      │
         │    HTTP/REST (axios)  │
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │      backend         │
         │ (Express/TypeScript) │◄─── vibe-content
         │  Port: 3000          │     (HTTP/REST)
         │                      │
         │  Routes:             │
         │  /auth, /posts,      │
         │  /comments, /votes,  │
         │  /admin, ...         │
         └──────────┬───────────┘
                    │
                    │ Prisma ORM
                    ▼
         ┌──────────────────────┐
         │   PostgreSQL DB      │
         │  (Single source      │
         │    of truth)         │
         └──────────────────────┘
                    ▲
                    │ Prisma ORM (direct)
                    │
         ┌──────────────────────┐
         │   vibe-content       │
         │ (Node/TypeScript)    │
         │  LLM Providers:      │
         │  Gemini, Groq,       │
         │  Cerebras, Nvidia    │
         └──────────────────────┘
```

**Nguyên tắc giao tiếp giữa các dịch vụ:**
- `frontend` và `admin-client` giao tiếp với `backend` qua HTTP/REST API, sử dụng biến môi trường `VITE_API_URL`
- `vibe-content` giao tiếp với `backend` qua HTTP/REST và kết nối trực tiếp database qua `DATABASE_URL`
- Toàn bộ trạng thái nghiệp vụ được lưu trong **PostgreSQL** — không có state phân tán

---

## 1.3 Phạm vi nghiệp vụ

### 1.3.1 Bối cảnh kinh doanh

MINI-FORUM được xây dựng cho nhu cầu của **cộng đồng thảo luận theo chủ đề trực tuyến** — tương tự mô hình Reddit, Stack Overflow hay các diễn đàn học thuật. Đây là loại nền tảng có giá trị thương mại và xã hội cao: thúc đẩy chia sẻ kiến thức, xây dựng cộng đồng chuyên môn, và tạo nền tảng cho các thảo luận có chiều sâu.

**Đặc điểm kinh doanh nổi bật:**
- Nội dung do người dùng tạo ra (User Generated Content — UGC) là tài sản cốt lõi
- Chất lượng cộng đồng phụ thuộc vào cơ chế kiểm duyệt và reputation
- Tăng trưởng organic thông qua nội dung AI seed (vibe-content)
- Phân cấp quyền hạn nghiêm ngặt để bảo vệ toàn vẹn nội dung

### 1.3.2 Các quy trình nghiệp vụ chính

Hệ thống MINI-FORUM bao gồm **6 quy trình nghiệp vụ** tạo thành vòng đời hoàn chỉnh:

```
┌──────────────────────────────────────────────────────────┐
│               VÒNG ĐỜI NGHIỆP VỤ MINI-FORUM             │
│                                                          │
│  [1. Đăng ký & Xác thực] ──► [2. Tạo & Quản lý Nội dung]│
│          ▲                              │                │
│          │                              ▼                │
│  [6. Thông báo RT]         [3. Phân loại Nội dung]       │
│          ▲                              │                │
│          │                              ▼                │
│  [5. Quản trị & Kiểm duyệt] ◄── [4. Tương tác CĐ]       │
└──────────────────────────────────────────────────────────┘
```

| STT | Quy trình | Mô tả | Thực thể chính |
|-----|----------|-------|---------------|
| 1 | **Đăng ký & Xác thực thành viên** | Onboarding người dùng mới, xác thực OTP, quản lý phiên đăng nhập | `users`, `otp_tokens`, `refresh_tokens` |
| 2 | **Tạo & Quản lý nội dung** | Tạo bài viết (text/block layout), bình luận, chỉnh sửa, xóa | `posts`, `comments`, `post_blocks`, `post_media` |
| 3 | **Phân loại nội dung** | Phân loại bài viết theo danh mục, gắn thẻ tag | `categories`, `tags`, `post_tags` |
| 4 | **Tương tác cộng đồng** | Vote upvote/downvote, bookmark, reply, quote, tìm kiếm | `votes`, `bookmarks` |
| 5 | **Quản trị & Kiểm duyệt** | Xử lý báo cáo vi phạm, quản lý tài khoản, audit | `reports`, `audit_logs`, `user_blocks` |
| 6 | **Thông báo thời gian thực** | Gửi notification qua SSE khi có sự kiện liên quan | `notifications` |

### 1.3.3 Ranh giới hệ thống (System Boundary)

**Trong phạm vi hệ thống:**
- Toàn bộ logic nghiệp vụ forum (authentication, content management, moderation)
- Quản lý media qua ImageKit CDN
- AI content generation qua LLM providers (Gemini, Groq, Cerebras, Nvidia)
- Email transactional qua Brevo

**Ngoài phạm vi hệ thống:**
- Hệ thống thanh toán (không có tính năng premium)
- Phân tích dữ liệu nâng cao / Business Intelligence
- Mobile application (chỉ có web)

---

## 1.4 Công nghệ và nền tảng kỹ thuật

### 1.4.1 Technology Stack

**Backend (Node.js + Express + TypeScript):**

| Lớp | Công nghệ | Mục đích |
|-----|----------|---------|
| Web framework | Express.js | HTTP routing và middleware pipeline |
| ORM | Prisma | Database access với type-safety |
| Validation | Zod | Schema validation tại request boundary |
| Authentication | JWT + bcrypt | Access token + password hashing |
| Email | Brevo (Sendinblue) | OTP và transactional email |
| Media | ImageKit | CDN lưu trữ và biến đổi ảnh |
| Real-time | Server-Sent Events | Push notifications |
| Testing | Vitest | Unit và integration tests |

**Frontend (React + Vite + TypeScript):**

| Lớp | Công nghệ | Mục đích |
|-----|----------|---------|
| UI Framework | React 18 | Component-based UI |
| Styling | Tailwind CSS + Radix UI | Design system |
| Data fetching | React Query (TanStack) | Cache và sync server state |
| Forms | React Hook Form + Zod | Form validation |
| Routing | React Router v6 | SPA navigation |
| Build tool | Vite | Fast HMR và bundling |

**Database:**

| Thành phần | Chi tiết |
|-----------|---------|
| DBMS | PostgreSQL (phiên bản 14+) |
| ORM | Prisma với Migration history |
| Schema | 17 models, 10 enums |
| Full-text search | PostgreSQL `tsvector`/`tsquery` |
| Indexes | Tối ưu cho các query phổ biến |

### 1.4.2 Deployment Architecture

MINI-FORUM được triển khai theo mô hình **cloud-native**:

```
Internet
    │
    ▼
[Vercel CDN]          [Render.com]
frontend &     ────►  backend API
admin-client          (Docker)
                          │
                          ▼
                    [PostgreSQL]
                   (Render.com /
                    Supabase)
                          ▲
                          │
                    [vibe-content]
                     (Render.com)
                     (Docker)
```

---

## Tóm tắt chương 1

Chương 1 đã xác lập nền tảng lý thuyết và thực tiễn của MINI-FORUM với tư cách là một Community MIS:

- **Về khái niệm:** MINI-FORUM là MIS phục vụ cộng đồng, với đặc điểm UGC làm tài sản cốt lõi, phân quyền đa cấp và audit trail toàn diện.
- **Về kiến trúc:** Monorepo 4 dịch vụ, giao tiếp REST API, PostgreSQL làm single source of truth.
- **Về phạm vi:** 6 quy trình nghiệp vụ tạo vòng đời hoàn chỉnh từ đăng ký đến quản trị.
- **Về công nghệ:** Node.js/Express backend + React frontend + Prisma ORM + PostgreSQL database.

Chương tiếp theo sẽ phân tích chi tiết nghiệp vụ thông qua các tác nhân, use case và đặc tả hành vi hệ thống.
