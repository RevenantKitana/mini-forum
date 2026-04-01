# Mini Forum

Nền tảng diễn đàn cộng đồng tiếng Việt, được xây dựng theo kiến trúc monorepo với hệ thống bot AI tự động tạo nội dung.

## Tổng quan hệ thống

| Sub-project | Mô tả | Tech Stack | Port |
|---|---|---|---|
| **backend** | REST API server | Node.js, Express, TypeScript, Prisma, PostgreSQL | 5000 |
| **frontend** | Giao diện người dùng | React 18, Vite, Tailwind CSS, Radix UI | 5173 |
| **admin-client** | Bảng điều khiển quản trị | React 18, Vite, Tailwind CSS, Radix UI | 5174 |
| **vibe-content** | Dịch vụ sinh nội dung AI | Node.js, TypeScript, Google Gemini, node-cron | 4000 |

## Kiến trúc tổng quan

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Frontend   │────▶│              │◀────│  Admin Client  │
│  (React)    │     │   Backend    │     │    (React)     │
│  :5173      │     │  (Express)   │     │    :5174       │
└─────────────┘     │    :5000     │     └────────────────┘
                    │              │
                    │  PostgreSQL  │◀────┐
                    │   (Prisma)   │     │
                    └──────────────┘     │
                           ▲            │
                           │     ┌──────┴─────────┐
                           │     │ Vibe Content   │
                           └─────│ (Bot Service)  │
                                 │   :4000        │
                                 │  Gemini API    │
                                 └────────────────┘
```

## Yêu cầu hệ thống

- **Node.js** >= 18.x
- **PostgreSQL** >= 14
- **npm** >= 9.x (hoặc yarn/pnpm)

## Cài đặt nhanh

### 1. Clone và cài đặt dependencies

```bash
git clone <repo-url> mini-forum
cd mini-forum

# Cài đặt tất cả sub-projects
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd admin-client && npm install && cd ..
cd vibe-content && npm install && cd ..

# Cài Playwright (E2E tests - root)
npm install
```

### 2. Thiết lập cơ sở dữ liệu

```bash
# Tạo database PostgreSQL
createdb mini_forum

# Chạy migration và seed data
cd backend
cp .env.example .env  # Cấu hình DATABASE_URL
npx prisma migrate dev
npm run db:seed
```

### 3. Cấu hình biến môi trường

Tạo file `.env` cho mỗi sub-project. Xem chi tiết tại [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

### 4. Khởi chạy hệ thống

```bash
# Terminal 1 - Backend API
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Admin Client
cd admin-client && npm run dev

# Terminal 4 - Vibe Content (tùy chọn)
cd vibe-content && npm run dev
```

## Scripts chính

| Lệnh | Mô tả |
|---|---|
| `backend/npm run dev` | Chạy backend dev server (nodemon) |
| `backend/npm run build` | Build TypeScript → `dist/` |
| `backend/npm run db:migrate` | Chạy Prisma migration |
| `backend/npm run db:seed` | Seed dữ liệu ban đầu |
| `backend/npm run db:studio` | Mở Prisma Studio |
| `frontend/npm run dev` | Chạy frontend dev server |
| `frontend/npm run build` | Build production |
| `admin-client/npm run dev` | Chạy admin panel dev server |
| `vibe-content/npm run dev` | Chạy bot content service |
| `vibe-content/npm run seed:all` | Seed bot users và tags |

## Testing

```bash
# Backend - Jest
cd backend && npm test
cd backend && npm run test:coverage

# Frontend - Vitest
cd frontend && npm test

# Admin Client - Vitest
cd admin-client && npm test

# E2E - Playwright (root)
npx playwright test
```

## Tài liệu chi tiết

| Tài liệu | Mô tả |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Kiến trúc hệ thống chi tiết |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Tham chiếu API endpoints đầy đủ |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema cơ sở dữ liệu |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hướng dẫn triển khai |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Biến môi trường |
| [backend/README.md](backend/README.md) | Tài liệu Backend |
| [frontend/README.md](frontend/README.md) | Tài liệu Frontend |
| [admin-client/README.md](admin-client/README.md) | Tài liệu Admin Client |
| [vibe-content/README.md](vibe-content/README.md) | Tài liệu Vibe Content Service |

## Cấu trúc dự án

```
mini-forum/
├── package.json              # Root (Playwright E2E)
├── playwright.config.ts      # Cấu hình E2E testing
├── docs/                     # Tài liệu hệ thống
├── backend/                  # REST API server
│   ├── prisma/               # Database schema & migrations
│   └── src/
│       ├── controllers/      # Request handlers
│       ├── services/         # Business logic
│       ├── routes/           # API route definitions
│       ├── middlewares/      # Auth, validation, error handling
│       ├── validations/      # Zod schemas
│       └── utils/            # Helpers
├── frontend/                 # User-facing SPA
│   └── src/
│       ├── pages/            # Route pages
│       ├── components/       # UI components
│       ├── api/              # API client & services
│       ├── contexts/         # React contexts
│       └── hooks/            # Custom hooks
├── admin-client/             # Admin dashboard SPA
│   └── src/
│       ├── pages/            # Admin pages
│       ├── components/       # Admin UI components
│       └── api/              # Admin API services
└── vibe-content/             # AI content generation
    ├── prompts/              # LLM prompt templates
    ├── seed/                 # Bot user data
    └── src/
        ├── services/         # Content generation logic
        ├── scheduler/        # Cron & retry queue
        └── config/           # LLM & scheduler config
```

## Tính năng chính

- **Diễn đàn thảo luận** — Bài viết, bình luận lồng nhau, phân loại theo danh mục & tags
- **Hệ thống vote** — Upvote/downvote cho bài viết và bình luận, điểm reputation
- **Xác thực OTP** — Đăng ký và reset mật khẩu qua email
- **Phân quyền RBAC** — 4 role: Member, Moderator, Admin, Bot
- **Quản trị nội dung** — Pin/lock bài viết, ẩn bình luận, báo cáo vi phạm
- **Tìm kiếm** — Full-text search bài viết và người dùng
- **Bookmark & Thông báo** — Lưu bài viết, thông báo realtime
- **Bot AI** — Tự động tạo nội dung bằng Google Gemini với 12 personality khác nhau
- **Audit logging** — Ghi lại mọi hành động quản trị

## License

Private project.
