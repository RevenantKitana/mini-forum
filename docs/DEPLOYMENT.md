# Deployment Guide — Mini Forum

## Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Vercel Deployment (Frontend)](#vercel-deployment)

---

## Yêu cầu hệ thống

| Yêu cầu | Version |
|---|---|
| Node.js | >= 18.x |
| PostgreSQL | >= 14 |
| npm | >= 9.x |

---

## Development Setup

### 1. Clone repository

```bash
git clone <repo-url> mini-forum
cd mini-forum
```

### 2. Thiết lập Database

```bash
# Tạo PostgreSQL database
createdb mini_forum

# Hoặc sử dụng psql
psql -U postgres -c "CREATE DATABASE mini_forum;"
```

### 3. Backend

```bash
cd backend
npm install

# Tạo file .env (xem ENVIRONMENT.md)
cp .env.example .env
# Chỉnh sửa DATABASE_URL và các biến khác

# Chạy migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed data
npm run db:seed

# Chạy dev server
npm run dev    # → http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
npm install

# Tạo .env.local
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env.local

# Chạy dev server
npm run dev    # → http://localhost:5173
```

### 5. Admin Client

```bash
cd admin-client
npm install

# Tạo .env.local
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env.local

# Chạy dev server
npm run dev    # → http://localhost:5174
```

### 6. Vibe Content Service (tùy chọn)

```bash
cd vibe-content
npm install

# Tạo .env (cần GEMINI_API_KEY)
cp .env.example .env

# Generate Prisma Client
npm run db:generate

# Seed bot users
npm run seed:all

# Chạy service
npm run dev    # → http://localhost:4000
```

---

## Production Deployment

### Backend (Node.js Server)

```bash
cd backend

# Build
npm run build

# Chạy migrations
npx prisma migrate deploy

# Start
NODE_ENV=production npm start
```

**Với PM2:**

```bash
pm2 start dist/index.js --name mini-forum-backend
pm2 save
pm2 startup
```

### Vibe Content (Node.js Server)

```bash
cd vibe-content

# Build
npm run build

# Start
NODE_ENV=production npm run start:prod
```

**Với PM2:**

```bash
pm2 start ecosystem.config.cjs
```

---

## Docker Deployment

### Backend

```dockerfile
# backend/Dockerfile
# Multi-stage build: Node.js + Prisma
```

```bash
# Build
docker build -t mini-forum-backend ./backend

# Run
docker run -d \
  --name mini-forum-backend \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/mini_forum" \
  -e JWT_ACCESS_SECRET="your-32-char-secret" \
  -e JWT_REFRESH_SECRET="your-32-char-secret" \
  -e FRONTEND_URL="https://your-frontend.vercel.app" \
  -e NODE_ENV=production \
  mini-forum-backend
```

Container tự động chạy migrations và seed khi khởi động (`docker-entrypoint.sh`).

### Vibe Content

```bash
# Build
docker build -t vibe-content ./vibe-content

# Run
docker run -d \
  --name vibe-content \
  -p 4000:4000 \
  -e FORUM_API_URL="http://backend:5000/api/v1" \
  -e DATABASE_URL="postgresql://user:pass@host:5432/mini_forum" \
  -e GEMINI_API_KEY="your-key" \
  -e BOT_PASSWORD="BotUser@123" \
  -e NODE_ENV=production \
  vibe-content
```

### Docker Compose (ví dụ)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mini_forum
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mini_forum
      JWT_ACCESS_SECRET: your-access-secret-min-32-chars-here
      JWT_REFRESH_SECRET: your-refresh-secret-min-32-chars-here
      FRONTEND_URL: http://localhost:5173,http://localhost:5174
      NODE_ENV: production
    depends_on:
      - postgres

  vibe-content:
    build: ./vibe-content
    ports:
      - "4000:4000"
    environment:
      FORUM_API_URL: http://backend:5000/api/v1
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mini_forum
      GEMINI_API_KEY: your-gemini-key
      BOT_PASSWORD: BotUser@123
      NODE_ENV: production
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## Vercel Deployment

### Frontend

1. Import repository trên Vercel
2. Chọn **Root Directory**: `frontend`
3. Framework Preset: **Vite**
4. Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url/api/v1
   ```
5. Deploy

File `frontend/vercel.json` đã cấu hình SPA rewrites.

### Admin Client

1. Import repository (hoặc tạo project mới)
2. Chọn **Root Directory**: `admin-client`
3. Framework Preset: **Vite**
4. Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url/api/v1
   ```
5. Deploy

---

## Checklist triển khai Production

- [ ] PostgreSQL setup với credentials an toàn
- [ ] JWT secrets tối thiểu 32 ký tự, ngẫu nhiên
- [ ] CORS `FRONTEND_URL` chỉ chứa domain production
- [ ] `NODE_ENV=production`
- [ ] SMTP credentials cho email service
- [ ] SSL/TLS cho tất cả endpoints
- [ ] Backup database tự động
- [ ] Monitoring (uptime, logs, metrics)
- [ ] Rate limiting phù hợp production
- [ ] Gemini API key cho Vibe Content (nếu sử dụng)
