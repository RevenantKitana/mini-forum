# Deployment & Setup

> **Version**: v1.16.0  
> **Last Updated**: 2026-02-25

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Quick Start (TL;DR)](#2-quick-start-tldr)
3. [Setup Database](#3-setup-database)
4. [Setup Backend](#4-setup-backend)
5. [Setup Frontend](#5-setup-frontend)
6. [Setup Admin Client](#6-setup-admin-client)
7. [Seed Data & Test Accounts](#7-seed-data--test-accounts)
8. [Biến môi trường](#8-biến-môi-trường)
9. [Build Production](#9-build-production)
10. [Docker Compose](#10-docker-compose)
11. [Kiểm tra hệ thống](#11-kiểm-tra-hệ-thống)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Yêu cầu hệ thống

### Phần mềm bắt buộc

| Phần mềm | Version tối thiểu | Kiểm tra |
|----------|:------------------:|----------|
| Node.js | 18.0+ (khuyến nghị 20 LTS) | `node --version` |
| npm | 9.0+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |
| Git | 2.30+ | `git --version` |

### Phần mềm tùy chọn

| Phần mềm | Mục đích |
|----------|----------|
| Docker Desktop | Chạy PostgreSQL qua container |
| Prisma Studio | GUI quản lý database (tích hợp sẵn) |
| VS Code | Editor khuyến nghị |

### Ports sử dụng

| Service | Port | URL |
|---------|:----:|-----|
| Backend API | 5000 | http://localhost:5000 |
| Frontend | 5173 | http://localhost:5173 |
| Admin Client | 5174 | http://localhost:5174 |
| PostgreSQL | 5432 | localhost:5432 |
| Prisma Studio | 5555 | http://localhost:5555 |

Kiểm tra ports chưa bị chiếm:

```bash
# Windows
netstat -ano | findstr "5000 5173 5174 5432"

# macOS/Linux
lsof -i :5000 -i :5173 -i :5174 -i :5432
```

---

## 2. Quick Start (TL;DR)

```bash
# 1. Clone
git clone <repo-url> && cd DA-mini-forum

# 2. Database (Docker)
docker-compose up -d

# 3. Backend
cd backend
npm install
cp .env.example .env
# → Sửa .env: điền JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (min 32 chars)
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev

# 4. Frontend (terminal mới)
cd frontend
npm install
cp .env.example .env
# → Sửa: VITE_USE_MOCK_API=false
npm run dev

# 5. Admin (terminal mới)
cd admin-client
npm install
cp .env.example .env
npm run dev

# 6. Truy cập
# Frontend:  http://localhost:5173  (john@example.com / Member@123)
# Admin:     http://localhost:5174  (admin@forum.com / Admin@123)
# API:       http://localhost:5000/api/v1/health
```

---

## 3. Setup Database

### Option A: Docker (khuyến nghị)

```bash
# Từ thư mục gốc dự án
docker-compose up -d
```

Kiểm tra:

```bash
docker ps
# → mini_forum_db    postgres:15-alpine   Up

docker exec -it mini_forum_db psql -U postgres -d mini_forum
# → mini_forum=# (prompt thành công)
\q
```

### Option B: PostgreSQL thủ công

```bash
# Khởi động PostgreSQL service
# Windows: Services → postgresql → Start
# macOS:   brew services start postgresql@15
# Linux:   sudo systemctl start postgresql

# Tạo database
psql -U postgres
CREATE DATABASE mini_forum;
\q
```

---

## 4. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Cấu hình `backend/.env`:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_forum?schema=public"
JWT_ACCESS_SECRET=<chuỗi ngẫu nhiên min 32 ký tự>
JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên min 32 ký tự>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Tạo JWT secret ngẫu nhiên:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

Chạy database migrations + seed:

```bash
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Tạo tables
npm run db:seed        # Dữ liệu mẫu (tùy chọn)
```

Khởi động server:

```bash
npm run dev
# → ✅ Database connected successfully
# → 🚀 Server is running on http://localhost:5000
```

Xác nhận:

```bash
curl http://localhost:5000/api/v1/health
# → {"success": true, "message": "API is running", ...}
```

---

## 5. Setup Frontend

> Mở terminal mới, giữ backend đang chạy.

```bash
cd frontend
npm install
cp .env.example .env
```

Cấu hình `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api/v1
VITE_USE_MOCK_API=false
```

```bash
npm run dev
# → http://localhost:5173
```

> Đặt `VITE_USE_MOCK_API=true` nếu muốn chạy UI mà không cần backend.

---

## 6. Setup Admin Client

> Mở terminal thứ ba.

```bash
cd admin-client
npm install
cp .env.example .env
```

Cấu hình `admin-client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api/v1
```

```bash
npm run dev
# → http://localhost:5174
```

---

## 7. Seed Data & Test Accounts

### Test Accounts

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | `admin@forum.com` | `Admin@123` | Frontend + Admin Client |
| Moderator | `mod@forum.com` | `Moderator@123` | Frontend + Admin Client |
| Member | `john@example.com` | `Member@123` | Frontend only |

> Admin Client yêu cầu role MODERATOR hoặc ADMIN.

### Dữ liệu mẫu (seed)

- Categories & Tags
- Bài viết mẫu (bao gồm bài viết được ghim)
- Bình luận mẫu
- Notifications mẫu

### Quản lý dữ liệu

```bash
cd backend

# Xem dữ liệu qua GUI
npm run db:studio          # → http://localhost:5555

# Seed lại
npm run db:seed

# Reset toàn bộ database
npx prisma migrate reset   # → nhập 'yes' → auto seed
```

---

## 8. Biến môi trường

### backend/.env

| Biến | Bắt buộc | Default | Mô tả |
|------|:--------:|---------|-------|
| `PORT` | — | `5000` | Port HTTP server |
| `NODE_ENV` | — | `development` | `development` \| `production` |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret key cho access token (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret key cho refresh token (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | — | `15m` | Thời hạn access token |
| `JWT_REFRESH_EXPIRES_IN` | — | `7d` | Thời hạn refresh token |
| `FRONTEND_URL` | — | `http://localhost:5173` | CORS allowed origin |
| `COMMENT_EDIT_TIME_LIMIT` | — | `30` | Phút giới hạn edit comment |

### frontend/.env

| Biến | Bắt buộc | Default | Mô tả |
|------|:--------:|---------|-------|
| `VITE_API_URL` | ✅ | — | URL tới backend API |
| `VITE_USE_MOCK_API` | — | `true` | `true` mock, `false` API thật |

### admin-client/.env

| Biến | Bắt buộc | Mô tả |
|------|:--------:|-------|
| `VITE_API_URL` | ✅ | URL tới backend API |

---

## 9. Build Production

```bash
# Backend
cd backend
npm run build
NODE_ENV=production node dist/index.js

# Frontend
cd frontend
npm run build          # → dist/

# Admin Client
cd admin-client
npm run build          # → dist/
```

### Production Checklist

| Item | Status | Ghi chú |
|------|:------:|---------|
| Environment variables | ⚠️ | Cần set production values |
| CORS configuration | ✅ | Cấu hình domain production |
| HTTPS | ❌ | Cần Nginx / reverse proxy |
| Database migrations | ✅ | `prisma migrate deploy` |
| Build process | ✅ | `npm run build` |
| Logging | ⚠️ | Console only — nên chuyển structured logger |
| Monitoring | ❌ | Cần setup APM |
| Backup | ❌ | Cần setup automated backup |

---

## 10. Docker Compose

File `docker-compose.yml` ở root cung cấp PostgreSQL:

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: mini_forum_db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mini_forum
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Lệnh quản lý:

```bash
docker-compose up -d      # Khởi động
docker-compose down        # Dừng
docker-compose down -v     # Dừng + xóa data
docker logs mini_forum_db  # Xem logs
```

---

## 11. Kiểm tra hệ thống

### Checklist sau khi setup

```
□ Backend health:  http://localhost:5000/api/v1/health → {"success": true}
□ Frontend:        http://localhost:5173 → Trang chủ hiển thị
□ Admin Client:    http://localhost:5174 → Trang đăng nhập hiển thị
□ Login user:      john@example.com / Member@123
□ Login admin:     admin@forum.com / Admin@123
□ Tạo bài viết:   Tạo thử một bài viết
□ Notifications:   Bell icon hiển thị đúng
```

### Quick test API

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Lấy posts
curl http://localhost:5000/api/v1/posts

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@forum.com","password":"Admin@123"}'
```

---

## 12. Troubleshooting

### Lỗi kết nối database

**Triệu chứng**: `P1001 - Can't reach database server at 'localhost:5432'`

```bash
# Kiểm tra PostgreSQL đang chạy
docker ps | grep mini_forum_db     # Docker
sc query postgresql-x64-14          # Windows service

# Restart nếu cần
docker-compose up -d
```

Kiểm tra `DATABASE_URL` đúng format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### Port đang bị chiếm

**Triệu chứng**: `EADDRINUSE: address already in use :::5000`

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti :5000 | xargs kill -9
```

Hoặc đổi port trong `.env`.

### Frontend CORS / Network error

1. Kiểm tra `VITE_USE_MOCK_API=false` trong `frontend/.env`
2. Kiểm tra `VITE_API_URL=http://localhost:5000/api/v1`
3. Kiểm tra `FRONTEND_URL=http://localhost:5173` trong `backend/.env`
4. Restart Vite sau khi sửa `.env`

### Admin Client 403 Forbidden

- Admin panel yêu cầu role **MODERATOR** hoặc **ADMIN**
- Dùng: `admin@forum.com / Admin@123` hoặc `mod@forum.com / Moderator@123`

### JWT Token invalid / expired

1. Xóa localStorage: DevTools → Application → Local Storage → Clear All
2. Kiểm tra JWT secrets trong `backend/.env` không để trống (min 32 chars)

### Prisma migration thất bại

```bash
cd backend
npx prisma migrate reset    # Reset toàn bộ + re-seed
```

### Node version không đúng

```bash
node --version              # Cần >= 18.0
nvm install 20 && nvm use 20
```

### TypeScript compile errors

```bash
cd backend
npm run db:generate          # Regenerate Prisma client types
npm run build                # Kiểm tra TS errors
```

---

## Liên kết

- [Kiến trúc hệ thống](./01-ARCHITECTURE.md)
- [API Reference](./03-API/README.md)
- [Security](./09-SECURITY.md)
- [Changelog](./05-CHANGELOG.md)
