# Mini Forum - Full Stack Application

Dự án Forum Full Stack sử dụng React + Node.js + PostgreSQL

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- TailwindCSS + Shadcn/UI
- React Router v6
- TanStack Query v5
- Axios
- React Hook Form + Zod

### Backend
- Node.js + Express.js + TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Bcrypt

## Project Structure

```
DA-mini-forum/
├── frontend/          # React SPA
├── backend/           # Express API
├── docs/              # Documentation
│   ├── FRONTEND_SPEC.md
│   ├── SYSTEM_DESIGN.md
│   └── task/
│       ├── IMPLEMENTATION_PLAN.md
│       ├── Phase1_Foundation.md
│       ├── Phase2_Core_Features.md
│       ├── Phase3_Advanced_Features.md
│       └── Phase4_Admin_Polish.md
└── changelog.txt
```

## Quick Start

### Prerequisites
- Node.js 18+ (recommend 20 LTS)
- PostgreSQL 14+
- npm or pnpm

### 1. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:5000`

### 2. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`

## Test Accounts

| Role      | Email              | Password     |
|-----------|--------------------|--------------|
| Admin     | admin@forum.com    | Admin@123    |
| Moderator | mod@forum.com      | Moderator@123|
| Member    | john@example.com   | Member@123   |

## Development Mode

Frontend có thể chạy ở chế độ mock (không cần backend):
- Set `VITE_USE_MOCK_API=true` trong `.env`

Để kết nối với backend thực:
- Set `VITE_USE_MOCK_API=false` trong `.env`
- Đảm bảo backend đang chạy

## Implementation Progress

- [x] Phase 1: Foundation (Auth, Project Setup)
- [x] Phase 2: Core Features (Posts, Comments, Categories)
- [x] Phase 3: Advanced Features (Vote, Bookmark, Profile, Search)
- [x] Phase 4: Admin & Polish (Dashboard, Reports, Optimization)

## API Endpoints

### Authentication
| Method | Endpoint           | Description           |
|--------|-------------------|-----------------------|
| POST   | /api/v1/auth/register | Register new user   |
| POST   | /api/v1/auth/login    | Login user          |
| POST   | /api/v1/auth/refresh  | Refresh token       |
| POST   | /api/v1/auth/logout   | Logout user         |
| GET    | /api/v1/auth/me       | Get current user    |

### Posts
| Method | Endpoint           | Description           |
|--------|-------------------|-----------------------|
| GET    | /api/v1/posts      | List all posts       |
| POST   | /api/v1/posts      | Create new post      |
| GET    | /api/v1/posts/:id  | Get single post      |
| PUT    | /api/v1/posts/:id  | Update post          |
| DELETE | /api/v1/posts/:id  | Delete post          |

### Comments
| Method | Endpoint              | Description           |
|--------|----------------------|-----------------------|
| GET    | /api/v1/posts/:postId/comments | List comments   |
| POST   | /api/v1/posts/:postId/comments | Create comment  |
| PUT    | /api/v1/comments/:id | Update comment        |
| DELETE | /api/v1/comments/:id | Delete comment        |

### Categories & Tags
| Method | Endpoint           | Description           |
|--------|-------------------|-----------------------|
| GET    | /api/v1/categories | List all categories   |
| GET    | /api/v1/tags       | List all tags         |

### Votes
| Method | Endpoint           | Description           |
|--------|-------------------|-----------------------|
| POST   | /api/v1/votes      | Create/update vote    |
| DELETE | /api/v1/votes      | Remove vote           |

### Bookmarks
| Method | Endpoint                  | Description           |
|--------|-------------------------|-----------------------|
| GET    | /api/v1/bookmarks        | List user bookmarks   |
| POST   | /api/v1/bookmarks        | Add bookmark          |
| DELETE | /api/v1/bookmarks/:postId| Remove bookmark       |

### Admin (requires ADMIN role)
| Method | Endpoint              | Description           |
|--------|----------------------|-----------------------|
| GET    | /api/v1/admin/dashboard | Dashboard stats      |
| GET    | /api/v1/admin/users    | List all users        |
| PUT    | /api/v1/admin/users/:id/role | Change user role |
| PUT    | /api/v1/admin/users/:id/status | Change user status|
| GET    | /api/v1/admin/reports  | List reports          |
| PUT    | /api/v1/admin/reports/:id | Update report status|

## Security Features

- JWT-based authentication with access/refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on all API endpoints
- Stricter rate limiting on auth endpoints
- Input sanitization for XSS prevention
- Helmet.js security headers
- CORS configuration
- SQL injection prevention via Prisma ORM

## Documentation

- [System Design](docs/SYSTEM_DESIGN.md)
- [Frontend Spec](docs/FRONTEND_SPEC.md)
- [Implementation Plan](docs/task/IMPLEMENTATION_PLAN.md)

## License

ISC
