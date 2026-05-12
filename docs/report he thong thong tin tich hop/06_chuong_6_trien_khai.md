# CHƯƠNG 6 — TRIỂN KHAI VÀ VẬN HÀNH

---

## Giới thiệu chương

Chương này trình bày toàn bộ chiến lược triển khai và vận hành hệ thống MINI-FORUM trên môi trường production. Nội dung bao gồm sáu phần chính: (1) quy trình đóng gói ứng dụng bằng Docker Multi-stage Build nhằm tối ưu hóa kích thước image và bảo mật; (2) cấu hình triển khai đa nền tảng trên Render.com và Vercel; (3) quản lý biến môi trường và bí mật hệ thống; (4) chiến lược migration cơ sở dữ liệu không gây gián đoạn dịch vụ (zero-downtime); (5) hệ thống giám sát và quan sát (Observability Stack); và (6) bộ script bảo trì phục vụ vận hành lâu dài.

---

## 6.1 Containerization — Docker Multi-stage Build

### 6.1.1 Tổng quan về Docker và Containerization

**Containerization** (đóng gói container) là kỹ thuật đóng gói ứng dụng cùng với mọi phụ thuộc (dependencies) vào một đơn vị triển khai độc lập gọi là **container**. Khác với máy ảo (Virtual Machine), container chia sẻ kernel của hệ điều hành host nhưng cô lập hoàn toàn về filesystem, network và process namespace, đảm bảo tính nhất quán giữa môi trường phát triển, kiểm thử và production.

MINI-FORUM áp dụng Docker cho hai service backend là `backend` và `vibe-content`, trong khi `frontend` và `admin-client` được phục vụ dưới dạng static file bởi Vercel CDN — không cần container.

**Bảng 6.1 — Lý do chọn Docker cho backend services**

| Tiêu chí | Không dùng Docker | Dùng Docker |
|----------|:-----------------:|:-----------:|
| Tính nhất quán môi trường | Phụ thuộc Node.js version của server | Cố định node:20-alpine |
| Native dependency (bcrypt) | Cần build tools trên server | Build trong container stage 1 |
| Khả năng tái tạo (reproducibility) | Thấp — "works on my machine" | Cao — image xác định hoàn toàn |
| Triển khai trên Render.com | Chỉ hỗ trợ Node.js native | Hỗ trợ đầy đủ Docker |
| Bảo mật | Chạy với quyền OS | Cô lập, user không có root |

### 6.1.2 Chiến lược Multi-stage Build

MINI-FORUM sử dụng **Docker multi-stage build** với 3 stage riêng biệt, mỗi stage đảm nhiệm một nhiệm vụ cụ thể. Chiến lược này cho phép tách biệt môi trường build (cần build tools, compiler) khỏi môi trường runtime (chỉ cần artifacts đã biên dịch), giảm đáng kể kích thước image cuối và loại bỏ attack surface không cần thiết.

**Hình 6.1 — Sơ đồ quá trình Docker Multi-stage Build**

```
╔══════════════════════════════════════════════════════════════════════╗
║              DOCKER MULTI-STAGE BUILD PIPELINE                      ║
║              Áp dụng cho: backend/ và vibe-content/                 ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌───────────────────────────────────────────────────────────────┐  ║
║  │  STAGE 1: deps  ── FROM node:20-alpine AS deps               │  ║
║  │  Mục tiêu: Biên dịch native dependencies                     │  ║
║  │                                                               │  ║
║  │  INPUT:  package.json, package-lock.json, prisma/            │  ║
║  │                                                               │  ║
║  │  [1] apk add python3 make g++ openssl openssl-dev            │  ║
║  │      → Cài build tools để compile bcrypt native binary       │  ║
║  │  [2] npm ci --omit=dev --no-audit                            │  ║
║  │      → Chỉ cài production deps, bỏ devDependencies           │  ║
║  │  [3] npx prisma generate                                     │  ║
║  │      → Sinh Prisma Client TypeScript types                   │  ║
║  │                                                               │  ║
║  │  OUTPUT: /app/node_modules/ (có bcrypt.node native binary)   │  ║
║  └───────────────────────────┬───────────────────────────────────┘  ║
║                               │ COPY node_modules/                   ║
║                               │ COPY node_modules/.prisma/           ║
║  ┌────────────────────────────▼──────────────────────────────────┐  ║
║  │  STAGE 2: builder  ── FROM node:20-alpine AS builder          │  ║
║  │  Mục tiêu: Biên dịch TypeScript sang JavaScript              │  ║
║  │                                                               │  ║
║  │  INPUT:  tsconfig.json, src/ (TypeScript source)             │  ║
║  │                                                               │  ║
║  │  [1] npm ci --ignore-scripts                                 │  ║
║  │      → Cài deps kèm type definitions (không native build)    │  ║
║  │  [2] COPY --from=deps .prisma và @prisma/client              │  ║
║  │      → Overlay Prisma types để tsc có đủ type information    │  ║
║  │  [3] npm run build  →  tsc  →  dist/                        │  ║
║  │      → TypeScript được biên dịch sang ES2020 JavaScript      │  ║
║  │                                                               │  ║
║  │  OUTPUT: /app/dist/ (compiled .js files, không có .ts)       │  ║
║  └────────────────────────────┬──────────────────────────────────┘  ║
║                               │ COPY dist/                           ║
║  ┌────────────────────────────▼──────────────────────────────────┐  ║
║  │  STAGE 3: production  ── FROM node:20-alpine AS production    │  ║
║  │  Mục tiêu: Runtime image tối giản, bảo mật                  │  ║
║  │                                                               │  ║
║  │  CHỈ CHỨA:                        KHÔNG CHỨA:                │  ║
║  │  ✅ dist/          (compiled JS)   ❌ src/    (TypeScript)    │  ║
║  │  ✅ node_modules/  (prod only)     ❌ devDependencies         │  ║
║  │  ✅ prisma/        (migrations)    ❌ python3, make, g++      │  ║
║  │  ✅ docker-entrypoint.sh           ❌ npm, npx binaries       │  ║
║  │                                    ❌ tsconfig.json           │  ║
║  │                                                               │  ║
║  │  Kích thước: ~250MB (so với ~800MB single-stage)             │  ║
║  │  Bảo mật: Chạy với non-root user (su-exec appuser:appgroup)  │  ║
║  └───────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════╝
```

*Nguồn: Tổng hợp từ backend/Dockerfile và vibe-content/Dockerfile*

### 6.1.3 Dockerfile chi tiết (backend)

Multi-stage build 3 tầng cho backend:

```dockerfile
# STAGE 1: Cài dependency + compile native (bcrypt)
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ openssl openssl-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate

# STAGE 2: Compile TypeScript → JavaScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --no-audit --no-fund
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# STAGE 3: Runtime tối giản (non-root user)
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libssl3 openssl su-exec
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./prisma ./
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown -R appuser:appgroup /app
EXPOSE 5000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
```

### 6.1.4 docker-entrypoint.sh — Khởi động có kiểm soát

Script 3 bước trước khi khởi động server:

```bash
#!/bin/sh
set -e

echo "MINI-FORUM Backend Starting Up (NODE_ENV: $NODE_ENV)"

echo "[1/3] Waiting for database..."
sleep 3

echo "[2/3] Running migrations..."
MIGRATION_OUTPUT=$(npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1)
MIGRATION_EXIT=$?

if [ $MIGRATION_EXIT -ne 0 ]; then
    if echo "$MIGRATION_OUTPUT" | grep -q "P3005"; then
        npx prisma migrate resolve --applied "20260210050735_init" --schema=prisma/schema.prisma
        npx prisma migrate resolve --applied "20260304043512_add_tags_votes_bookmarks" --schema=prisma/schema.prisma
        npx prisma migrate resolve --applied "20260326052535_add_bot_role" --schema=prisma/schema.prisma
        npx prisma migrate resolve --applied "20260326095131_add_user_content_context" --schema=prisma/schema.prisma
        npx prisma migrate deploy --schema=prisma/schema.prisma
    else
        echo "Migration failed: $MIGRATION_OUTPUT" && exit 1
    fi
fi
echo "✓ Migrations completed"

echo "[3/3] Starting server..."
exec su-exec appuser:appgroup node dist/index.js
```

### 6.1.5 So sánh Single-stage vs Multi-stage

| Tiêu chí | Single-stage | Multi-stage |
|----------|:--------:|:--------:|
| Kích thước | ~800 MB | ~250 MB |
| Build tools | Có | Không |
| Attack surface | Lớn | Nhỏ |
| Production ready | ❌ | ✅ |

---

## 6.2 Cấu hình triển khai đa nền tảng

### 6.2.1 Kiến trúc Split Deployment

MINI-FORUM áp dụng mô hình **Split Deployment** — tách riêng static frontend khỏi dynamic backend để tối ưu chi phí và hiệu suất:

- **Static assets** (frontend, admin-client): Vercel CDN — phân tán toàn cầu, latency thấp, không tốn phí băng thông cho API traffic.
- **API server** (backend, vibe-content): Render.com — hỗ trợ long-running process, cron jobs, SSE connections và Docker container.
- **Database**: PostgreSQL trên Supabase/Render — fully managed, backup tự động, connection pooling.

**Hình 6.2 — Sơ đồ triển khai đa nền tảng (Deployment Topology)**

```
┌────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT TOPOLOGY                            │
│                      MINI-FORUM System                             │
└────────────────────────────────────────────────────────────────────┘

  [Người dùng cuối]               [Quản trị viên]
          │                              │
          │ HTTPS (TLS 1.3)              │ HTTPS (TLS 1.3)
          ▼                              ▼
┌──────────────────────┐   ┌──────────────────────────┐
│    VERCEL CDN        │   │       VERCEL CDN          │
│  ─────────────────   │   │  ──────────────────────   │
│  frontend/           │   │  admin-client/            │
│  React SPA           │   │  React SPA                │
│  Build: Vite         │   │  Build: Vite              │
│  Output: dist/       │   │  Output: dist/            │
│  vercel.json:        │   │  vercel.json:             │
│  /* → index.html     │   │  /* → index.html          │
└──────────┬───────────┘   └────────────┬──────────────┘
           │                             │
           └──────────────┬──────────────┘
                          │ HTTPS REST API
                          │ Authorization: Bearer {JWT}
                          │ (VITE_API_URL)
                          ▼
                ┌──────────────────────┐
                │     RENDER.COM       │
                │  ─────────────────   │
                │  backend/            │
                │  Docker Container    │
                │  Port: 5000          │
                │  Health: GET /health │
                └──────────┬───────────┘
                           │ TCP (Prisma)
                           │ DATABASE_URL (pooled)
                           │ DIRECT_URL (migrations)
                           ▼
                ┌──────────────────────┐     ┌──────────────────────┐
                │   SUPABASE /         │     │    RENDER.COM        │
                │   RENDER PostgreSQL  │◄────│  vibe-content/       │
                │  ─────────────────   │     │  Docker Container    │
                │  PostgreSQL 15       │     │  Port: 4000          │
                │  Port: 5432          │     │  Cron: /30 phút      │
                │  pgbouncer pooling   │     │  LLM API calls       │
                └──────────────────────┘     └──────────────────────┘

  Luồng dữ liệu:
  ──────────────
  [1] User → Vercel CDN    : Tải React SPA (HTML/JS/CSS)
  [2] React → Backend API  : Fetch data (REST JSON)
  [3] Backend → PostgreSQL : Query/Write (Prisma ORM)
  [4] Vibe-content → Forum API : Post/Comment (HTTP REST)
  [5] Vibe-content → PostgreSQL: Read context (Prisma)
  [6] Backend → SSE → User : Push notifications (EventStream)
```

*Nguồn: Tổng hợp từ render.json và vercel.json các service trong dự án*

### 6.2.2 Cấu hình Render.com — Backend

File `render.json` cấu hình Docker service với biến môi trường (secret có `"sync": false`):

```json
{
  "services": [{
    "type": "web",
    "name": "mini-forum-api",
    "runtime": "docker",
    "region": "singapore",
    "branch": "main",
    "healthCheckPath": "/health",
    "envVars": [
      { "key": "NODE_ENV", "value": "production" },
      { "key": "PORT", "value": "5000" },
      { "key": "DATABASE_URL", "sync": false },
      { "key": "DIRECT_URL", "sync": false },
      { "key": "JWT_ACCESS_SECRET", "sync": false },
      { "key": "JWT_REFRESH_SECRET", "sync": false },
      { "key": "BREVO_API_KEY", "sync": false },
      { "key": "IMAGEKIT_PRIVATE_KEY", "sync": false }
    ]
  }]
}
```

**Lưu ý:** `"sync": false` = nhập thủ công trong Render Dashboard (không commit secret vào Git).

### 6.2.3 Cấu hình Vercel — SPA Rewrite

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{
    "source": "/assets/(.*)",
    "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
  }]
}
```

Mọi route được rewrite về `index.html` → React Router xử lý client-side navigation.

### 6.2.4 Bảng tổng hợp cấu hình triển khai

**Bảng 6.3 — Cấu hình triển khai 5 thành phần hệ thống**

| Service | Nền tảng | File cấu hình | Port | Build | Khởi động | Runtime |
|---------|----------|:------------:|:----:|-------|-----------|---------|
| `backend` | Render.com | `render.json` | 5000 | Docker build | `docker-entrypoint.sh` | node:20-alpine |
| `vibe-content` | Render.com | `render.json` | 4000 | Docker build | `docker-entrypoint.sh` | node:20-alpine |
| `frontend` | Vercel | `vercel.json` | — | `npm run build` | Vercel CDN | Vite/React |
| `admin-client` | Vercel | `vercel.json` | — | `npm run build` | Vercel CDN | Vite/React |
| PostgreSQL | Supabase/Render | `DB_SETUP.md` | 5432 | — | Managed | PostgreSQL 15 |

---

## 6.3 Quản lý biến môi trường

### 6.3.1 Nguyên tắc và phân tầng

Hệ thống MINI-FORUM quản lý biến môi trường theo nguyên tắc **12-Factor App** và phân thành 3 tầng rõ ràng dựa trên độ nhạy cảm:

**Hình 6.4 — Phân tầng biến môi trường theo độ nhạy cảm**

```
┌─────────────────────────────────────────────────────────────────┐
│              PHÂN TẦNG BIẾN MÔI TRƯỜNG                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TẦNG 1 — PUBLIC (có thể version-control trong repo)           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  NODE_ENV=production                                      │  │
│  │  PORT=5000                                                │  │
│  │  COMMENT_EDIT_TIME_LIMIT=1800                             │  │
│  │  VITE_APP_NAME=Mini Forum                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  TẦNG 2 — SEMI-PUBLIC (nhập trong platform dashboard)          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FRONTEND_URL=https://mini-forum.vercel.app               │  │
│  │  ADMIN_CLIENT_URL=https://mini-forum-admin.vercel.app     │  │
│  │  VITE_API_URL=https://mini-forum-api.onrender.com/api/v1  │  │
│  │  IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxx         │  │
│  │  IMAGEKIT_PUBLIC_KEY=public_xxxxx                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  TẦNG 3 — SECRET (chỉ trong platform secret vault)             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  DATABASE_URL=postgresql://user:PASS@host:6543/db         │  │
│  │  DIRECT_URL=postgresql://user:PASS@host:5432/db           │  │
│  │  JWT_ACCESS_SECRET=<64-byte random base64>                │  │
│  │  JWT_REFRESH_SECRET=<64-byte random base64>               │  │
│  │  BREVO_API_KEY=xkeysib-...                                │  │
│  │  IMAGEKIT_PRIVATE_KEY=private_...                         │  │
│  │  GEMINI_API_KEY=AIza...                                   │  │
│  │  GROQ_API_KEY=gsk_...                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ⚠ QUAN TRỌNG: Biến có prefix VITE_* sẽ được bundle vào JS    │
│    và gửi đến browser. TUYỆT ĐỐI không đặt secret vào VITE_*  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3.2 Biến môi trường Backend

```env
# ─── DATABASE ─────────────────────────────────────────────────────
# Qua pgbouncer (Supabase port 6543) — dùng cho queries thông thường
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:6543/postgres?schema=public&pgbouncer=true&connection_limit=1

# Direct TCP (port 5432) — BẮT BUỘC cho prisma migrate deploy
DIRECT_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres

# ─── JWT AUTHENTICATION ───────────────────────────────────────────
# Sinh bằng: openssl rand -base64 64
JWT_ACCESS_SECRET=<chuỗi ngẫu nhiên 64 byte>
JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên khác 64 byte>
JWT_ACCESS_EXPIRES_IN=15m      # Access token hết hạn sau 15 phút
JWT_REFRESH_EXPIRES_IN=7d      # Refresh token hết hạn sau 7 ngày

# ─── EMAIL — Brevo Transactional Email ────────────────────────────
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_FROM_EMAIL=noreply@forum.example.com
BREVO_FROM_NAME=Mini Forum

# ─── CDN — ImageKit ───────────────────────────────────────────────
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxxxxx   # Chỉ server biết
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# ─── CORS ─────────────────────────────────────────────────────────
FRONTEND_URL=https://mini-forum.vercel.app
ADMIN_CLIENT_URL=https://mini-forum-admin.vercel.app

# ─── SERVER ───────────────────────────────────────────────────────
PORT=5000
NODE_ENV=production

# ─── FEATURE FLAGS ────────────────────────────────────────────────
COMMENT_EDIT_TIME_LIMIT=1800    # 30 phút, tính bằng giây
```

### 6.3.3 Biến môi trường Vibe-Content

```env
DATABASE_URL=postgresql://...   # Cùng DB với backend

FORUM_API_URL=https://mini-forum-api.onrender.com
BOT_EMAIL=bot@internal.forum
BOT_PASSWORD=<strong-password>

GEMINI_API_KEY=AIzaSy...        # Provider ưu tiên 1
GROQ_API_KEY=gsk_...            # Provider ưu tiên 2
CEREBRAS_API_KEY=csk-...        # Provider ưu tiên 3
NVIDIA_API_KEY=nvapi-...        # Provider ưu tiên 4

CRON_INTERVAL_MINUTES=30
BOT_ENABLED=true
PORT=4000
NODE_ENV=production
```

### 6.3.4 Biến môi trường Frontend

```env
VITE_API_URL=https://mini-forum-api.onrender.com/api/v1
VITE_APP_NAME=Mini Forum
VITE_IMAGEKIT_ENDPOINT=https://ik.imagekit.io/your_id
```

**Bảng 6.4 — Ma trận biến môi trường theo service**

| Biến | backend | vibe-content | frontend | admin-client | Lý do phân chia |
|------|:-------:|:------------:|:--------:|:------------:|----------------|
| `DATABASE_URL` | ✅ | ✅ | — | — | Cả hai cần đọc DB |
| `DIRECT_URL` | ✅ | — | — | — | Chỉ backend chạy migrate |
| `JWT_*_SECRET` | ✅ | — | — | — | Chỉ backend ký/verify token |
| `BREVO_API_KEY` | ✅ | — | — | — | Chỉ backend gửi email |
| `IMAGEKIT_PRIVATE_KEY` | ✅ | — | — | — | Chỉ backend upload ảnh |
| `GEMINI_API_KEY` | — | ✅ | — | — | Chỉ vibe-content gọi LLM |
| `FORUM_API_URL` | — | ✅ | — | — | Vibe-content gọi Forum API |
| `VITE_API_URL` | — | — | ✅ | ✅ | URL backend cho React |
| `FRONTEND_URL` | ✅ | — | — | — | CORS whitelist backend |

---

## 6.4 Chiến lược migration cơ sở dữ liệu

### 6.4.1 Tổng quan Prisma Migrate

**Prisma Migrate** quản lý schema evolution bằng cách theo dõi sự thay đổi của `schema.prisma` và sinh ra các file SQL migration tương ứng. Mỗi migration được lưu trong `prisma/migrations/` và được ghi nhận trong bảng `_prisma_migrations` của database.

Hai lệnh migrate quan trọng với mục đích khác nhau:

| Lệnh | Môi trường | Hành vi | Tương tác |
|------|:----------:|---------|:---------:|
| `prisma migrate dev` | Development | Tạo file migration mới, apply vào DB, regenerate Client | Có |
| `prisma migrate deploy` | Production | Chỉ apply pending migrations, không tạo mới | Không |

### 6.4.2 Quy trình Migration

**Dev → Commit → Production:**
1. Sửa `schema.prisma` → chạy `npx prisma migrate dev --name "xxx"` → sinh file migration
2. Git commit `prisma/migrations/` + `schema.prisma` → push 
3. Container startup chạy `npx prisma migrate deploy` (idempotent, chỉ apply pending)

### 6.4.3 Lịch sử Migrations trong dự án

**Bảng 6.5 — Danh sách Prisma Migrations theo thứ tự thời gian**

| Timestamp | Tên Migration | Nội dung | Sprint |
|-----------|-------------|---------|:------:|
| `20260210050735` | `_init` | Schema ban đầu: users, posts, comments, categories, roles, sessions | 0 |
| `20260304043512` | `_add_tags_votes_bookmarks` | Bảng tags, post_tags, post_votes, comment_votes, bookmarks | 2 |
| `20260326052535` | `_add_bot_role` | Thêm giá trị `BOT` vào enum Role | 5 |
| `20260326095131` | `_add_user_content_context` | Bảng `bot_action_history` cho vibe-content tracking | 5 |

### 6.4.4 Chiến lược Rollback

Prisma không rollback tự động. Tùy theo mức độ:
- **Lỗi nhẹ** (ADD COLUMN): Viết migration mới để revert
- **Lỗi nặng** (DROP TABLE): Restore backup + revert code

### 6.4.5 DATABASE_URL và DIRECT_URL

**Bảng 6.6 — So sánh DATABASE_URL và DIRECT_URL khi dùng Supabase pgbouncer**

| Thuộc tính | `DATABASE_URL` (pooled) | `DIRECT_URL` (direct) |
|-----------|:-----------------------:|:---------------------:|
| Cổng kết nối | 6543 (pgbouncer) | 5432 (PostgreSQL native) |
| Dùng cho | Query thông thường | `prisma migrate deploy` |
| Connection reuse | Có (pooling) | Không |
| Hỗ trợ DDL transactions | Không | Có |
| Hiệu suất cao tải | Tốt hơn | Thấp hơn |
| Cấu hình trong schema.prisma | `datasource.url` | `datasource.directUrl` |

---

## 6.5 Giám sát và quan sát hệ thống (Observability)

### 6.5.1 Khái niệm Observability

**Observability** (khả năng quan sát) là thuộc tính của hệ thống cho phép suy luận về trạng thái nội bộ dựa trên các tín hiệu bên ngoài. Ba trụ cột của Observability gồm:

1. **Metrics** — Số liệu định lượng theo thời gian (request count, response time, error rate).
2. **Logs** — Bản ghi sự kiện có cấu trúc giúp debug và audit.
3. **Traces** — Theo dõi luồng thực thi xuyên suốt các service.

MINI-FORUM triển khai đầy đủ Metrics và Logs; Tracing được xử lý một phần qua `requestId` propagation.

### 6.5.2 Kiến trúc Observability

**3 lớp:** 
- **Metrics** (in-memory): request count, response time p50/p95/p99, error rate, uptime → `/api/v1/admin/metrics`
- **Dashboard**: Hiển thị top endpoints, error rate, SSE connections, auto-refresh 30s
- **Logs**: HTTP access logs (requestId, method, status, duration), vibe-content logs (bot-activity, llm-usage, errors)

### 6.5.3 Metrics API Response

Endpoint `GET /api/v1/admin/metrics` → summary (total_requests, error_rate, avg_response_time, uptime, active_sse_connections), top_endpoints_by_volume, top_endpoints_by_error_rate, response_time_distribution (p50/p95/p99), requests_by_status

### 6.5.4 requestId — Distributed Tracing

Mỗi request được gán UUID v4 → lan truyền qua toàn pipeline → logs và response header X-Request-ID để client track bug.

### 6.5.5 Lộ trình nâng cấp

| Thành phần | Hiện tại | Nâng cấp |
|-----------|---------|---------|
| Metrics | In-memory | Prometheus TSDB |
| Dashboard | React custom | Grafana |
| Logs | File | Grafana Loki |
| Tracing | requestId | OpenTelemetry + Jaeger |
| Errors | Không | Sentry |
| Uptime | Render check | UptimeRobot |

---

## 6.6 Scripts bảo trì

### 6.6.1 Danh sách scripts

Thư mục `backend/scripts/` chứa 10 script TypeScript cho các tác vụ bảo trì, chạy qua `npx ts-node scripts/<tên>.ts`.

**Bảng 6.8 — Scripts bảo trì theo mục đích**

| Script | Mục đích | Môi trường | Tần suất | Mức độ rủi ro |
|--------|---------|-----------|:--------:|:-------------:|
| `backupDb.ts` | Backup PostgreSQL → file SQL | Production/Staging | Hàng ngày | Thấp |
| `cleanupImagekit.ts` | Xóa ảnh orphaned trên ImageKit CDN | Production | Hàng tuần | Thấp |
| `cleanupLegacyAvatars.ts` | Xóa trường `avatar_url` deprecated | Migration | Một lần | Trung bình |
| `clearData.ts` | Xóa toàn bộ data, giữ schema | Dev/Test | Khi cần | Cao ⚠️ |
| `migrateAvatarUrls.ts` | Migrate legacy → `avatar_preview/standard_url` | Migration | Một lần | Trung bình |
| `migratePostsToBlocks.ts` | Migrate plain text → block layout | Migration | Một lần | Trung bình |
| `resetAllMedia.ts` | Xóa và reset tất cả media | Development | Khi cần | Cao ⚠️ |
| `resetAvatarMedia.ts` | Xóa và reset avatar media | Development | Khi cần | Trung bình |
| `resetPostMedia.ts` | Xóa và reset post media | Development | Khi cần | Trung bình |
| `wipeAllDb.ts` | **Xóa TOÀN BỘ database** | Dev only | Hiếm | **Rất cao ☠️** |

