# CHƯƠNG 1: TỔNG QUAN DỰ ÁN

---

## 1.1 Mô tả dự án

### 1.1.1 Giới thiệu chung

MINI-FORUM là ứng dụng diễn đàn trực tuyến full-stack được thiết kế và phát triển từ đầu trong vòng 3 tháng thực tập (27/01/2026 – 27/04/2026). Hệ thống cung cấp một nền tảng thảo luận cộng đồng hiện đại, nơi người dùng có thể đăng bài viết với định dạng phong phú (block layout), tương tác qua bình luận lồng nhau, bỏ phiếu đánh giá nội dung, và nhận thông báo thời gian thực. Dự án được xây dựng theo kiến trúc monorepo với bốn thành phần riêng biệt, mỗi thành phần giải quyết một miền vấn đề độc lập.

Điểm nổi bật của MINI-FORUM so với các hệ thống diễn đàn thông thường là tích hợp hệ thống sinh nội dung AI tự động (`vibe-content`) — một service độc lập có khả năng sử dụng nhiều nhà cung cấp LLM (Large Language Model) theo cơ chế fallback, đóng vai trò tạo dữ liệu seed ban đầu và duy trì hoạt động cộng đồng.

### 1.1.2 Kiến trúc tổng thể

Hệ thống MINI-FORUM được tổ chức theo mô hình monorepo với bốn thành phần độc lập, mỗi thành phần có package.json, Dockerfile và cấu hình triển khai riêng:

**Hình 1.1 — Kiến trúc tổng thể hệ thống MINI-FORUM**

```
┌─────────────────────────────────────────────────────────────────┐
│                        MINI-FORUM Monorepo                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  frontend/   │  │ admin-client/│  │   vibe-content/      │  │
│  │              │  │              │  │                      │  │
│  │ React 18     │  │ React 18     │  │ AI Bot Service       │  │
│  │ Vite         │  │ Vite         │  │ Multi-LLM            │  │
│  │ TailwindCSS  │  │ Radix UI     │  │ (Gemini/Groq/        │  │
│  │ React Query  │  │ shadcn/ui    │  │  Cerebras/Nvidia)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┴──────────────────────┘             │
│                           │ HTTP/REST                           │
│                    ┌──────▼───────┐                            │
│                    │  backend/    │                            │
│                    │              │                            │
│                    │ Express.js   │                            │
│                    │ TypeScript   │                            │
│                    │ Prisma ORM   │                            │
│                    └──────┬───────┘                            │
│                           │                                    │
│                    ┌──────▼───────┐                            │
│                    │  PostgreSQL  │                            │
│                    │  Database    │                            │
│                    │  (19 models) │                            │
│                    └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

**Bảng 1.1 — Kiến trúc bốn thành phần hệ thống MINI-FORUM**

| Thành phần | Công nghệ chính | Vai trò | Cổng mặc định |
|------------|----------------|---------|--------------|
| `backend/` | Node.js 18, Express 4.x, TypeScript, Prisma 5.x | REST API server, business logic, quản lý database | 5000 |
| `frontend/` | React 18, Vite 5.x, TailwindCSS 3.x, React Query | Giao diện người dùng cuối — forum, hồ sơ, tìm kiếm | 5173 |
| `admin-client/` | React 18, Vite 5.x, Radix UI, shadcn/ui | Bảng điều khiển quản trị viên — moderation, thống kê | 5174 |
| `vibe-content/` | Node.js 18, TypeScript, cron scheduler, Prisma | Bot AI sinh nội dung tự động đa LLM | 3001 |

### 1.1.3 Quy mô kỹ thuật

Sau 3 tháng phát triển, hệ thống đạt được quy mô kỹ thuật như sau:

- **Backend:** 14 controllers, 21 services, 9 middlewares, tổ chức rõ ràng theo mô hình Controller–Service–Repository.
- **Database:** 19 models Prisma, đầy đủ lịch sử migration, quan hệ phức tạp (bình luận lồng nhau, block layout cho bài viết).
- **Frontend:** 14 trang React (HomePage, PostDetailPage, ProfilePage, SearchPage, v.v.), hỗ trợ dark mode.
- **Admin Panel:** 12 trang quản trị (Dashboard, Users, Posts, Comments, Reports, AuditLogs, v.v.).
- **AI Bot:** 8 services chuyên biệt với hỗ trợ 4 nhà cung cấp LLM và cơ chế fallback tự động.

---

## 1.2 Phạm vi và mục tiêu

### 1.2.1 Mục tiêu dự án

**Mục tiêu kinh doanh:**

1. Cung cấp nền tảng diễn đàn trực tuyến có khả năng triển khai độc lập, phục vụ cộng đồng người dùng trong/ngoài tổ chức.
2. Trang bị hệ thống moderation đầy đủ để quản trị viên kiểm soát nội dung, xử lý báo cáo vi phạm và theo dõi hoạt động qua audit log.
3. Tích hợp AI để tạo nội dung seed ban đầu và duy trì hoạt động cộng đồng trong giai đoạn khởi động (cold-start problem).

**Mục tiêu kỹ thuật:**

1. Xây dựng REST API hoàn chỉnh với xác thực hai lớp (JWT + OTP email), phân quyền RBAC (Member, Moderator, Admin).
2. Triển khai hệ thống thông báo thời gian thực qua Server-Sent Events (SSE).
3. Implement tìm kiếm full-text bằng khả năng tích hợp sẵn của PostgreSQL.
4. Đóng gói toàn bộ hệ thống bằng Docker để đảm bảo tính nhất quán môi trường.
5. Đạt độ bao phủ kiểm thử (test coverage) trên 60% với framework Vitest.

### 1.2.2 Phạm vi kỹ thuật

**Bảng 1.2 — Phạm vi kỹ thuật hệ thống**

| Hạng mục | Trong phạm vi | Ngoài phạm vi |
|----------|--------------|---------------|
| **Giao diện** | Web app (React), Admin panel | Mobile app (iOS/Android), Desktop app |
| **Real-time** | Server-Sent Events (SSE) — thông báo | WebSocket, chat thời gian thực |
| **Xác thực** | Email OTP, JWT access/refresh token | OAuth2 (Google, Facebook), SSO |
| **Media** | Upload ảnh qua ImageKit CDN | Video streaming, audio |
| **Thanh toán** | Không áp dụng | Gói premium, subscription |
| **Tìm kiếm** | Full-text search PostgreSQL | Elasticsearch, Algolia |
| **Triển khai** | Docker, Render.com, Vercel | Kubernetes, microservice độc lập |
| **AI** | Sinh bài viết, bình luận, vote tự động | AI moderation, image recognition |

### 1.2.3 Yêu cầu chức năng chính

Hệ thống cần đáp ứng các nhóm chức năng sau, được phân loại theo mức độ ưu tiên MoSCoW:

**Must Have (bắt buộc):**
- Đăng ký tài khoản với xác thực OTP qua email (Brevo API)
- Đăng nhập, duy trì phiên làm việc bằng JWT access token + refresh token
- Đăng bài viết với block layout (TEXT, IMAGE, CODE, QUOTE)
- Bình luận lồng nhau (nested comments) và trích dẫn bình luận (quote)
- Phân quyền ba cấp: MEMBER, MODERATOR, ADMIN
- Dashboard thống kê cho admin
- Hệ thống báo cáo vi phạm và xử lý

**Should Have (nên có):**
- Vote upvote/downvote cho bài viết và bình luận, tính điểm reputation
- Tìm kiếm full-text bài viết
- Thông báo thời gian thực qua SSE
- Audit log ghi nhận mọi hành động quản trị
- Bookmark bài viết

**Nice to Have (có thì tốt):**
- AI bot tự động sinh nội dung với nhiều "nhân vật" (personality)
- Upload và quản lý ảnh qua ImageKit CDN
- Chặn người dùng (user block)

### 1.2.4 Yêu cầu phi chức năng

| Yêu cầu | Chỉ tiêu | Giải pháp kỹ thuật |
|---------|----------|-------------------|
| Hiệu năng | Latency API < 200ms (P95) | PostgreSQL index, React Query cache |
| Bảo mật | OWASP Top 10 | Helmet, rate limiting, Zod validation, bcrypt |
| Khả năng mở rộng | Horizontal scaling ready | Docker container, stateless JWT |
| Maintainability | TypeScript strict mode | Prisma ORM, Zod schema, ESLint |
| Khả dụng | Deployment ready | Docker multi-stage, health check endpoint |

---

## 1.3 Các bên liên quan (Stakeholders)

### 1.3.1 Phân tích stakeholders

Dự án MINI-FORUM có bốn nhóm stakeholder chính với mức độ tham gia và quyền lợi khác nhau:

**Bảng 1.3 — Phân tích các bên liên quan**

| Stakeholder | Mô tả | Quyền lợi chính | Mức độ tham gia | Ảnh hưởng |
|-------------|-------|----------------|----------------|----------|
| **Development Team** | Nhóm phát triển 1–3 người, kiêm nhiệm Lead Developer + Frontend Developer | Sản phẩm hoạt động đúng spec, code quality cao, deadline đúng hạn | **Cao** — tham gia toàn bộ quá trình | **Cao** |
| **Product Owner** | Đại diện yêu cầu nghiệp vụ, xác nhận sprint review | Hệ thống đáp ứng use case thực tế, UX tốt | **Trung bình** — Sprint Planning và Review | **Cao** |
| **End User (Member)** | Người dùng cuối — đọc, đăng bài, bình luận, vote | Giao diện thân thiện, tốc độ tải nhanh, thông báo kịp thời | **Thấp** — phản hồi qua user testing | **Trung bình** |
| **Admin User** | Quản trị viên nền tảng — kiểm duyệt nội dung, quản lý người dùng | Dashboard đầy đủ, xử lý báo cáo hiệu quả, audit log đáng tin cậy | **Trung bình** — kiểm thử admin panel | **Trung bình** |

### 1.3.2 Ma trận ảnh hưởng và tham gia

```
Mức độ ảnh hưởng
         Cao │ Product Owner    Development Team
             │        ●               ●
             │
      Trung  │ Admin User
      bình   │     ●
             │
         Thấp│             End User
             │                 ●
             └────────────────────────────────
              Thấp     Trung bình     Cao
                      Mức độ tham gia
```

### 1.3.3 Chiến lược quản lý stakeholder

- **Development Team:** Áp dụng Daily Standup 15 phút/ngày để đảm bảo luồng thông tin thông suốt và phát hiện blocker sớm.
- **Product Owner:** Sprint Review cuối mỗi 2 tuần để demo deliverable và điều chỉnh backlog.
- **End User:** Thu thập phản hồi UX qua user testing nội bộ trong Sprint 4–5.
- **Admin User:** Kiểm thử admin panel trong Sprint 4, thu thập feedback về workflow quản trị.

---

*[Tiếp theo: Chương 2 — Mô hình phát triển và lý do lựa chọn]*
