# Mini Forum

> **Version**: v1.16.0 — MVP hoàn thành (55/55 tasks)

Website Forum Full Stack — đăng bài, bình luận, vote, bookmark, thông báo, quản trị.

---

## Quick Start

```bash
docker-compose up -d                           # PostgreSQL
cd backend  && npm i && cp .env.example .env   # Sửa JWT secrets
npm run db:generate && npm run db:migrate && npm run db:seed && npm run dev
cd ../frontend     && npm i && cp .env.example .env && npm run dev   # VITE_USE_MOCK_API=false
cd ../admin-client && npm i && cp .env.example .env && npm run dev
```

| Service | URL | Test Account |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | `john@example.com` / `Member@123` |
| Admin Client | http://localhost:5174 | `admin@forum.com` / `Admin@123` |
| Backend API | http://localhost:5000/api/v1/health | — |

> Chi tiết đầy đủ: [docs/07-DEPLOYMENT.md](docs/07-DEPLOYMENT.md)

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Node.js 20+, Express 4.21, TypeScript (strict), Prisma 5.22, Zod 3.24 |
| Frontend | React 18.3, Vite 6.3, TailwindCSS 4.1, TanStack Query 5.90, React Router 7.13 |
| Admin Client | React 18.2, Vite 5, TailwindCSS 3.4, React Router 6.21, shadcn/ui |
| Database | PostgreSQL 15+ (13 models, 11 enums) |
| Auth | JWT (Access 15m + Refresh 7d), RBAC (Admin / Moderator / Member) |

---

## Cấu trúc dự án

```
DA-mini-forum/
├── backend/            ← API Server (Express + Prisma)
├── frontend/           ← User Client (React + Vite)
├── admin-client/       ← Admin Dashboard (React + Vite)
├── docs/               ← Tài liệu dự án (HIỆN TẠI — actively maintained)
├── docs(FROZEN)        ← Tài liệu dự án (LEGACY — archived) ; Không tham khảo nếu không yêu cầu
└── docker-compose.yml  ← PostgreSQL container
```

---

## Tài liệu

| Tài liệu | Mô tả |
|-----------|-------|
| [docs/README.md](docs/README.md) | Mục lục tài liệu |
| [docs/01-ARCHITECTURE.md](docs/01-ARCHITECTURE.md) | Kiến trúc hệ thống |
| [docs/02-DATABASE.md](docs/02-DATABASE.md) | Database schema (13 models) |
| [docs/03-API/](docs/03-API/README.md) | API Reference (116 endpoints) |
| [docs/04-FEATURES.md](docs/04-FEATURES.md) | Tính năng cross-module |
| [docs/05-CHANGELOG.md](docs/05-CHANGELOG.md) | Lịch sử phiên bản |
| [docs/06-ROADMAP.md](docs/06-ROADMAP.md) | Roadmap & trạng thái |
| [docs/07-DEPLOYMENT.md](docs/07-DEPLOYMENT.md) | Setup & deployment |
| [docs/08-TESTING.md](docs/08-TESTING.md) | Testing strategy |
| [docs/09-SECURITY.md](docs/09-SECURITY.md) | Security features |

### Module READMEs

| Module | Mô tả |
|--------|-------|
| [backend/README.md](backend/README.md) | Backend development guide |
| [frontend/README.md](frontend/README.md) | Frontend development guide |
| [admin-client/README.md](admin-client/README.md) | Admin Client development guide |

---

## Tính năng chính

- **Posts**: CRUD, Markdown, draft auto-save, filter/sort, pinning (Global/Category)
- **Comments**: 2-level threading, quote reply, edit time limit
- **Voting**: Upvote/downvote cho posts & comments, optimistic updates
- **Bookmarks**: Toggle, danh sách riêng
- **Notifications**: 5 loại (comment, reply, mention, upvote, system), soft delete
- **Search**: Full-text posts + users, suggestions
- **Moderation**: Pin/lock/hide posts, hide comments, ban users, audit logs
- **Admin Dashboard**: Statistics (stat cards), management tables, CRUD categories/tags
- **UX**: Dark/light mode, ~30+ CSS animations, skeleton loading, responsive design

