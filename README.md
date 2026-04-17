# Mini Forum — Tài liệu Hệ thống

## 1. Tổng quan Hệ thống

### Vấn đề giải quyết

Mini Forum là nền tảng diễn đàn trực tuyến cho phép người dùng tạo bài viết, bình luận, bỏ phiếu và tương tác trong các chủ đề được phân loại theo danh mục và thẻ (tag). Hệ thống bao gồm cơ chế tạo nội dung tự động bằng AI (bot) để duy trì hoạt động diễn đàn.

### Kiến trúc tổng quan

```
┌─────────────┐     ┌─────────────────┐
│  Frontend   │────▶│                 │
│  (port 5173)│     │                 │
└─────────────┘     │    Backend      │     ┌────────────┐
                    │    (port 5000)  │────▶│ PostgreSQL │
┌─────────────┐     │    REST API     │     └────────────┘
│Admin-Client │────▶│                 │           ▲
│  (port 5174)│     │                 │           │
└─────────────┘     └─────────────────┘           │
                                                  │
                    ┌─────────────────┐           │
                    │  Vibe-Content   │───────────┘
                    │  (port 4000)    │
                    │  Bot + LLM     │────▶ Backend API
                    └─────────────────┘
```

- **Frontend** và **Admin-Client** giao tiếp với Backend qua REST API (proxy qua Vite dev server).
- **Vibe-Content** giao tiếp với Backend qua REST API (đăng nhập và tạo nội dung như bot user) và truy cập trực tiếp PostgreSQL (đọc context, cập nhật personality).
- Tất cả service chia sẻ **một database PostgreSQL duy nhất**. Backend là chủ sở hữu schema và chạy migration.

### Nguyên tắc thiết kế

- **Monorepo**: Tất cả service nằm trong một repository, quản lý độc lập về dependency.
- **Tách biệt trách nhiệm**: Mỗi service có phạm vi rõ ràng, không chồng chéo chức năng.
- **Backend là nguồn sự thật duy nhất (single source of truth)**: Mọi logic nghiệp vụ, xác thực, phân quyền đều nằm ở Backend.
- **Bot content tách rời**: Hệ thống tạo nội dung AI hoạt động độc lập, không ảnh hưởng đến luồng chính.

---

## 2. Phân tích từng Service

### 2.1. Backend

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | API server trung tâm xử lý toàn bộ logic nghiệp vụ, xác thực, phân quyền, và quản lý dữ liệu. |
| **Tech stack** | Node.js 20, Express 4, Prisma 5, TypeScript 5, JWT, Zod, Helmet, Jest |
| **Port** | 5000 |

**Trách nhiệm:**
- Cung cấp REST API cho tất cả thao tác CRUD (posts, comments, categories, tags, users, votes, bookmarks, notifications, reports)
- Xác thực (JWT access/refresh token) và phân quyền (MEMBER, MODERATOR, ADMIN, BOT)
- Quản lý OTP (đăng ký, reset mật khẩu) qua Brevo email API
- Audit logging cho mọi hành động
- Full-text search
- Rate limiting ở tầng API
- Sở hữu và quản lý schema database (migration, seed)

**KHÔNG chịu trách nhiệm:**
- Không render giao diện người dùng
- Không tạo nội dung tự động (thuộc Vibe-Content)
- Không quản lý LLM provider hay prompt template

**Xem chi tiết:** [backend/README.md](backend/README.md)

---

### 2.2. Frontend

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Giao diện người dùng cuối (end-user) của diễn đàn. |
| **Tech stack** | React 18, Vite 6, Tailwind 4, Radix UI, MUI, React Router 7, TanStack Query 5, React Hook Form, Vitest |
| **Port** | 5173 |

**Trách nhiệm:**
- Hiển thị bài viết, bình luận, danh mục, thẻ
- Đăng ký, đăng nhập, quên mật khẩu (OTP flow)
- Tạo/sửa bài viết, bình luận
- Bỏ phiếu (upvote/downvote), bookmark
- Tìm kiếm nội dung
- Quản lý hồ sơ cá nhân, thông báo, danh sách chặn
- Dark/light mode, điều chỉnh cỡ chữ

**KHÔNG chịu trách nhiệm:**
- Không chứa logic nghiệp vụ (chỉ gọi API)
- Không có quyền truy cập trực tiếp database
- Không xử lý tác vụ quản trị (thuộc Admin-Client)

**Xem chi tiết:** [frontend/README.md](frontend/README.md)

---

### 2.3. Admin-Client

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Bảng điều khiển quản trị cho ADMIN và MODERATOR. |
| **Tech stack** | React 18, Vite 6, Tailwind 4, Radix UI, React Router 6, TanStack Query 5, Vitest |
| **Port** | 5174 |

**Trách nhiệm:**
- Dashboard tổng quan hệ thống
- Quản lý người dùng (xem, ban, thay đổi role)
- Quản lý bài viết, bình luận (ẩn, xóa, pin)
- Quản lý danh mục, thẻ (CRUD)
- Xử lý báo cáo vi phạm (reports)
- Xem audit logs
- Cấu hình hệ thống (settings)

**KHÔNG chịu trách nhiệm:**
- Không phục vụ người dùng cuối (end-user) — chỉ dành cho quản trị viên
- Không chứa logic nghiệp vụ
- Không truy cập trực tiếp database
- Không chia sẻ code với Frontend (dù có tech stack tương tự)

**Xem chi tiết:** [admin-client/README.md](admin-client/README.md)

---

### 2.4. Vibe-Content

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Service tạo nội dung tự động bằng AI, mô phỏng hoạt động người dùng thật trên diễn đàn. |
| **Tech stack** | Node.js 20, Express (health/status), Prisma 5, node-cron, Winston, TypeScript 5, Axios |
| **Port** | 4000 |

**Trách nhiệm:**
- Quản lý bot user profiles (personality, traits, tone, writing style)
- Lên lịch tạo nội dung qua cron job (mặc định mỗi 30 phút)
- Chọn hành động (post/comment/vote) và bot user phù hợp
- Xây dựng prompt từ template + context diễn đàn + personality
- Gọi LLM providers (Gemini, Groq, Cerebras, Nvidia, Beeknoee — 10 model) với cơ chế fallback
- Validate output từ LLM (JSON parsing, độ dài, ngôn ngữ, chất lượng)
- Thực thi hành động qua Backend API (đăng nhập bot → tạo post/comment/vote)
- Cập nhật personality vector sau mỗi 5 hành động
- Rate limiting nội bộ (3 post/6 comment/15 vote mỗi bot mỗi ngày)

**KHÔNG chịu trách nhiệm:**
- Không phục vụ API cho frontend/admin
- Không quản lý schema database (copy schema từ Backend)
- Không xử lý xác thực người dùng thật
- Không can thiệp vào logic nghiệp vụ của Backend

**Xem chi tiết:** [vibe-content/README.md](vibe-content/README.md)

---

## 3. Giao tiếp giữa các Service

### Mô hình giao tiếp

| Nguồn → Đích | Phương thức | Chi tiết |
|---|---|---|
| Frontend → Backend | REST API qua Vite proxy | `VITE_API_URL` → `/api/v1/*` |
| Admin-Client → Backend | REST API qua Vite proxy | `VITE_API_URL` → `/api/v1/*` |
| Vibe-Content → Backend | REST API trực tiếp | `FORUM_API_URL` — URL đầy đủ kèm `/api/v1` (ví dụ: `http://host/api/v1`) — đăng nhập bot, tạo post/comment/vote |
| Vibe-Content → PostgreSQL | Prisma ORM trực tiếp | Đọc context (posts, comments, users), ghi `user_content_context` |
| Backend → PostgreSQL | Prisma ORM | Chủ sở hữu schema, toàn quyền đọc/ghi |

### Luồng dữ liệu chính

**Luồng người dùng thường:**
```
User → Frontend → Backend API → PostgreSQL → Response → Frontend
```

**Luồng quản trị:**
```
Admin → Admin-Client → Backend API (admin routes) → PostgreSQL → Response → Admin-Client
```

**Luồng bot tạo nội dung:**
```
Cron trigger → ContentGeneratorService
  → ActionSelector (chọn bot + action)
  → ContextGatherer (đọc DB trực tiếp)
  → PromptBuilder (template + personality + context)
  → LLMProviderManager (gọi AI, fallback chain)
  → ValidationService (kiểm tra output)
  → APIExecutorService (đăng nhập bot → gọi Backend API)
  → PersonalityService (cập nhật personality vào DB)
```

### Ranh giới giao ước (Contract Boundaries)

- **Backend API**: Endpoint prefix `/api/v1`, request/response dạng JSON, xác thực qua Bearer token.
- **Database schema**: Backend sở hữu, Vibe-Content copy schema và chỉ generate Prisma client — **không được tạo migration**.
- **JWT Token**: Backend phát hành, Frontend/Admin-Client lưu ở `localStorage`, Vibe-Content lấy token qua API login cho từng bot user.
- **Response transform**: Backend tự động chuyển đổi `snake_case` → `camelCase` trong response.
- **API Contract**: Xem [docs/openapi.yaml](docs/openapi.yaml) để biết đầy đủ các endpoint, request/response schema.
- **Production Deploy**: Thực hiện [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) trước mỗi lần deploy.

---

## 4. Biểu đồ Phụ thuộc

### Hướng phụ thuộc

```
Frontend ──────────▶ Backend ──────────▶ PostgreSQL
Admin-Client ──────▶ Backend ──────────▶ PostgreSQL
Vibe-Content ──────▶ Backend (API) ────▶ PostgreSQL
Vibe-Content ──────▶ PostgreSQL (trực tiếp, đọc context)
Vibe-Content ──────▶ LLM Providers (Gemini, Groq, Cerebras, Nvidia, Beeknoee)
Backend ───────────▶ Brevo API (gửi email OTP)
```

### Đường dẫn quan trọng (Critical Path)

1. **Backend + PostgreSQL**: Nếu Backend hoặc DB ngưng hoạt động, **toàn bộ hệ thống dừng** (Frontend, Admin-Client, và Vibe-Content đều phụ thuộc).
2. **Vibe-Content → Backend API**: Bot tạo nội dung qua API, nếu Backend không khả dụng, nội dung bot sẽ không được tạo (nhưng không ảnh hưởng đến người dùng thật).
3. **LLM Providers**: Vibe-Content có chuỗi fallback 10 model — nếu tất cả provider lỗi, bot ngừng tạo nội dung nhưng hệ thống vẫn hoạt động bình thường.

### Nút thắt tiềm năng (Bottlenecks)

- **PostgreSQL**: Một database duy nhất phục vụ cả 4 service. Nếu query nặng (full-text search, audit log) hoặc bot ghi nhiều, có thể ảnh hưởng hiệu năng chung.
- **Backend API rate limiting**: Áp dụng trên tất cả request (bao gồm cả bot), có thể gây xung đột giữa traffic thật và traffic bot nếu không cấu hình riêng.
- **LLM Provider timeout**: Mặc định 30s/request — nếu prompt phức tạp hoặc provider chậm, cron job có thể bị trễ.

---

## 5. Quy trình Phát triển

### Phát triển cục bộ

Mỗi service có thể chạy độc lập trong quá trình phát triển:

```bash
# Backend (cần PostgreSQL đang chạy)
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Admin-Client
cd admin-client && npm install && npm run dev

# Vibe-Content (cần Backend đang chạy)
cd vibe-content && npm install && npm run dev
```

**Thứ tự khởi động bắt buộc:**
1. PostgreSQL
2. Backend (chạy migration tự động)
3. Frontend / Admin-Client (độc lập, có thể chạy song song)
4. Vibe-Content (cần Backend API)

### Quản lý Database

- **Migration**: Chỉ tạo từ `backend/prisma/`. Khi schema thay đổi, chạy `npm run db:migrate` tại Backend.
- **Vibe-Content**: Sau khi Backend thay đổi schema, chạy `npm run db:generate` tại Vibe-Content để copy schema và generate lại Prisma client.
- **Seed**: Backend có `prisma/seed.ts`. Vibe-Content có seed riêng cho bot users và tags (`npm run seed:all`).

### Testing

| Service | Framework | Lệnh |
|---|---|---|
| Backend | Jest + Supertest | `npm test`, `npm run test:coverage` |
| Frontend | Vitest + React Testing Library | `npm test`, `npm run test:coverage` |
| Admin-Client | Vitest + React Testing Library | `npm test`, `npm run test:coverage` |
| Root (E2E) | Playwright | `npx playwright test` |

### Versioning

- **Monorepo**: Không có versioning riêng cho từng service (không dùng Lerna/Turborepo).
- **Database migration**: Versioned qua Prisma migration files (timestamp-based).
- **Dependency lock**: Mỗi service có `package.json` riêng, quản lý dependency độc lập.

### CI/CD

- **Docker**: Backend và Vibe-Content có Dockerfile multi-stage build.
- **Deployment**: Hỗ trợ Render (`render.json` tại Vibe-Content), Vercel (`vercel.json` tại Frontend và Admin-Client).
- **Database migration**: Tự động chạy khi container Backend khởi động (`docker-entrypoint.sh`).

---

## 6. Chiến lược Mở rộng

### Khả năng scale độc lập

| Service | Scale độc lập? | Ghi chú |
|---|---|---|
| Backend | Có | Có thể chạy nhiều instance phía sau load balancer. Lưu ý: cần session/token stateless (JWT đã đáp ứng). |
| Frontend | Có | Static build, deploy trên CDN/Vercel. |
| Admin-Client | Có | Static build, deploy trên CDN/Vercel. |
| Vibe-Content | Có (nhưng cần cẩn thận) | Chạy nhiều instance có thể gây trùng lặp nội dung bot — cần cơ chế distributed lock nếu scale ngang. |
| PostgreSQL | Giới hạn | Read replica có thể dùng cho Vibe-Content (đọc context). Write vẫn tập trung tại primary. |

### Giới hạn đã biết

- **Shared database**: Một PostgreSQL duy nhất cho tất cả service — chưa có chiến lược sharding hoặc tách database.
- **Vibe-Content concurrent execution**: Flag `isRunning` chống overlap chỉ hoạt động trong một instance duy nhất.
- **File storage**: Hiện tại không có object storage (S3, etc.) — avatar sử dụng Dicebear API (external).
- **Real-time**: Chưa có WebSocket/SSE — notification chỉ cập nhật khi user refresh hoặc polling.
- **Search**: Full-text search trực tiếp trên PostgreSQL — chưa có Elasticsearch/Meilisearch cho volume lớn.

---

