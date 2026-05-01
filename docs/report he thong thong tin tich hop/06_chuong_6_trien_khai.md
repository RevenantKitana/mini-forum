# CHƯƠNG 6 — TRIỂN KHAI VÀ VẬN HÀNH

---

## 6.1 Containerization — Docker Multi-stage Build

### 6.1.1 Chiến lược Multi-stage Build

MINI-FORUM sử dụng **Docker multi-stage build** với 3 stage riêng biệt, tối ưu hóa kích thước image cuối và bảo mật:

**Hình 6.1 — Quá trình Docker Multi-stage Build**

```
╔══════════════════════════════════════════════════════════════════╗
║              DOCKER MULTI-STAGE BUILD PIPELINE                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │  STAGE 1: deps (node:20-alpine)                         │    ║
║  │                                                          │    ║
║  │  Nhiệm vụ: Build native dependencies                    │    ║
║  │  • apk add python3 make g++ openssl (build tools)       │    ║
║  │  • npm ci --omit=dev (production deps only)             │    ║
║  │  • npx prisma generate (Prisma client)                  │    ║
║  │                                                          │    ║
║  │  Output: /app/node_modules (với native binary bcrypt)   │    ║
║  └─────────────────────────┬───────────────────────────────┘    ║
║                             │ COPY node_modules                  ║
║  ┌─────────────────────────▼───────────────────────────────┐    ║
║  │  STAGE 2: builder (node:20-alpine)                      │    ║
║  │                                                          │    ║
║  │  Nhiệm vụ: TypeScript compilation                       │    ║
║  │  • npm ci --ignore-scripts (chỉ types, không native)    │    ║
║  │  • COPY Prisma types từ stage 1                         │    ║
║  │  • npm run build → tsc → dist/                          │    ║
║  │                                                          │    ║
║  │  Output: /app/dist/ (compiled JavaScript)               │    ║
║  └─────────────────────────┬───────────────────────────────┘    ║
║                             │ COPY dist/                         ║
║  ┌─────────────────────────▼───────────────────────────────┐    ║
║  │  STAGE 3: production (node:20-alpine) ← FINAL IMAGE    │    ║
║  │                                                          │    ║
║  │  Chỉ chứa:                                              │    ║
║  │  ✅ dist/ (compiled JS, không có .ts)                   │    ║
║  │  ✅ node_modules/ (production only)                     │    ║
║  │  ✅ prisma/ (schema + migrations)                       │    ║
║  │  ✅ docker-entrypoint.sh                                │    ║
║  │                                                          │    ║
║  │  KHÔNG có:                                               │    ║
║  │  ❌ src/ (TypeScript source)                            │    ║
║  │  ❌ node_modules devDependencies                        │    ║
║  │  ❌ python3, make, g++ (build tools)                    │    ║
║  │  ❌ npm, npx (không cần sau khi build)                  │    ║
║  │                                                          │    ║
║  │  Chạy với user không có quyền root (su-exec appuser)   │    ║
║  └─────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════╝
```

### 6.1.2 Dockerfile chi tiết (backend)

```dockerfile
# syntax=docker/dockerfile:1

# ─── Stage 1: Production deps (native compilation) ───────────────
FROM node:20-alpine AS deps

# Build tools cho native modules (bcrypt, node-gyp)
RUN apk add --no-cache python3 make g++ openssl openssl-dev

WORKDIR /app

COPY package.json package-lock.json ./
# BuildKit cache mount: tái sử dụng npm cache giữa các lần build
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

# Generate Prisma client vào production node_modules
COPY prisma ./prisma
RUN npx prisma generate

# ─── Stage 2: TypeScript compiler ────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: bỏ qua native build (chỉ cần types cho tsc)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --no-audit --no-fund

# Overlay Prisma types từ stage 1 để tsc có type chính xác
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY tsconfig.json ./
COPY src ./src
RUN npm run build   # → dist/

# ─── Stage 3: Production runtime ─────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# OpenSSL runtime (Prisma cần) + su-exec (privilege drop)
RUN apk add --no-cache libssl3 openssl su-exec

# Tạo user không có quyền root
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy artifacts từ các stage trước
COPY --from=deps    /app/node_modules    ./node_modules
COPY --from=builder /app/dist            ./dist
COPY package.json   ./
COPY prisma         ./prisma

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
```

### 6.1.3 docker-entrypoint.sh — Startup Script

```bash
#!/bin/sh

# Bước 1: Chờ database sẵn sàng (Render có thể cần vài giây)
echo "Waiting for database..."
sleep 3

# Bước 2: Chạy Prisma migrations tự động
MIGRATION_OUTPUT=$(npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1)
MIGRATION_EXIT=$?

if [ $MIGRATION_EXIT -ne 0 ]; then
  # Xử lý trường hợp database đã có schema (P3005: production database not empty)
  if echo "$MIGRATION_OUTPUT" | grep -q "P3005"; then
    echo "Database schema exists. Baseling migrations..."
    # Đánh dấu các migration đã được apply trước đó
    npx prisma migrate resolve --applied 20260210050735_init
    npx prisma migrate resolve --applied 20260304043512_
    # ... các migration khác
  else
    echo "Migration failed:"
    echo "$MIGRATION_OUTPUT"
    exit $MIGRATION_EXIT
  fi
fi

# Bước 3: Chạy server với user không có quyền root (security)
exec su-exec appuser:appgroup node dist/index.js
```

**Ý nghĩa su-exec:** Node.js server chạy với user `appuser` (không phải root), hạn chế thiệt hại nếu process bị compromised.

### 6.1.4 Lợi ích Multi-stage Build

| Khía cạnh | Single-stage | Multi-stage |
|-----------|:-----------:|:-----------:|
| Image size | ~800MB (với build tools) | ~250MB (chỉ runtime) |
| Attack surface | Lớn (có compiler, build tools) | Nhỏ (chỉ runtime artifacts) |
| Build time | Nhanh hơn (không tách stage) | Chậm hơn (nhưng có cache) |
| Bí mật bị lộ | Có thể (nếu có trong build stage) | Không (chỉ env runtime) |

---

## 6.2 Cấu hình triển khai đa nền tảng

### 6.2.1 Tổng quan deployment

**Hình 6.2 — Sơ đồ triển khai đa nền tảng**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TOPOLOGY                          │
└─────────────────────────────────────────────────────────────────┘

  [User Browser]           [Admin Browser]
        │                        │
        │ HTTPS                  │ HTTPS
        ▼                        ▼
┌───────────────┐    ┌───────────────────────┐
│   VERCEL CDN  │    │       VERCEL CDN       │
│               │    │                       │
│  frontend/    │    │    admin-client/       │
│  (React SPA)  │    │    (React SPA)         │
│  vercel.json  │    │    vercel.json         │
│               │    │                       │
│  SPA rewrite: │    │  SPA rewrite:          │
│  /* → /index  │    │  /* → /index.html      │
└───────┬───────┘    └──────────┬────────────┘
        │                       │
        └──────────┬────────────┘
                   │ HTTPS API calls
                   │ (VITE_API_URL)
                   ▼
        ┌─────────────────────┐
        │    RENDER.COM       │
        │                     │
        │  backend/           │
        │  Docker Container   │
        │  render.json        │
        │  Port: 5000         │
        │                     │
        │  build: npm ci &&   │
        │    npm run build    │
        │  start: entrypoint  │
        └──────────┬──────────┘
                   │ Prisma/TCP
                   │ DATABASE_URL
                   │
        ┌──────────▼──────────┐
        │    SUPABASE /       │
        │    RENDER           │
        │                     │
        │    PostgreSQL       │
        │    :5432            │
        │    (DB_SETUP.md)    │
        └─────────────────────┘
                   ▲
                   │ Prisma/TCP
                   │ (READ only)
        ┌──────────┴──────────┐
        │    RENDER.COM       │
        │                     │
        │  vibe-content/      │
        │  Docker Container   │
        │  render.json        │
        │  Port: 4000         │
        └─────────────────────┘
```

### 6.2.2 Bảng cấu hình triển khai

**Bảng 6.1 — Cấu hình triển khai 5 service**

| Service | Platform | Config File | Port | Build Command | Start Command |
|---------|----------|-------------|:----:|--------------|--------------|
| `backend` | Render.com | `render.json` | 5000 | `npm ci && npm run build` | `docker-entrypoint.sh` |
| `vibe-content` | Render.com | `render.json` | 4000 | `npm ci && npm run build` | `docker-entrypoint.sh` |
| `frontend` | Vercel | `vercel.json` | — | `npm run build` | Vercel CDN serve |
| `admin-client` | Vercel | `vercel.json` | — | `npm run build` | Vercel CDN serve |
| PostgreSQL | Supabase/Render | `DB_SETUP.md` | 5432 | — | Managed service |

### 6.2.3 Vercel — SPA Configuration

Frontend và Admin-client đều là **Single Page Application (SPA)** — cần cấu hình rewrite để React Router xử lý routing:

```json
// frontend/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Lý do cần rewrite:** Khi người dùng trực tiếp truy cập `https://forum.example.com/posts/my-post`, Vercel CDN không có file `/posts/my-post` — rewrite rule chuyển hướng về `index.html`, React Router xử lý routing client-side.

---

## 6.3 Quản lý biến môi trường

### 6.3.1 Phân nhóm biến môi trường Backend

```env
# ─── DATABASE ───────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public
# Dùng connection pooling (pgbouncer) cho production
# DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://user:pass@host:5432/dbname
# Direct connection (không qua pgbouncer) — dùng cho Prisma migrations

# ─── JWT ─────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=<openssl rand -base64 64>
JWT_REFRESH_SECRET=<openssl rand -base64 64>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── EMAIL (Brevo Transactional) ─────────────────────────────────
BREVO_API_KEY=xkeysib-...
BREVO_FROM_EMAIL=noreply@forum.example.com
BREVO_FROM_NAME=Mini Forum

# ─── CDN (ImageKit) ──────────────────────────────────────────────
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...     # Không bao giờ expose ra client
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# ─── CORS ────────────────────────────────────────────────────────
FRONTEND_URL=https://mini-forum.vercel.app
ADMIN_CLIENT_URL=https://mini-forum-admin.vercel.app

# ─── SERVER ──────────────────────────────────────────────────────
PORT=5000
NODE_ENV=production

# ─── FEATURE FLAGS ───────────────────────────────────────────────
COMMENT_EDIT_TIME_LIMIT=1800    # Giây (30 phút)
```

### 6.3.2 Biến môi trường Vibe-Content

```env
# ─── DATABASE ────────────────────────────────────────────────────
DATABASE_URL=postgresql://...    # Cùng database với backend

# ─── FORUM API ───────────────────────────────────────────────────
FORUM_API_URL=https://mini-forum-api.onrender.com
BOT_EMAIL=bot@internal.forum
BOT_PASSWORD=...

# ─── LLM PROVIDERS ───────────────────────────────────────────────
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=csk-...
NVIDIA_API_KEY=nvapi-...

# ─── SCHEDULER ───────────────────────────────────────────────────
CRON_INTERVAL_MINUTES=30
BOT_ENABLED=true
```

### 6.3.3 Biến môi trường Frontend

```env
# Prefix VITE_ để Vite expose ra browser bundle
VITE_API_URL=https://mini-forum-api.onrender.com/api/v1
VITE_APP_NAME=Mini Forum
```

**Lưu ý bảo mật:** Tất cả `VITE_*` env đều bị bundle vào JavaScript và gửi đến browser. **Tuyệt đối không** đặt API key hay secret vào biến có prefix `VITE_`.

---

## 6.4 Chiến lược migration cơ sở dữ liệu

### 6.4.1 Workflow migration

```
DEVELOPMENT WORKFLOW:
━━━━━━━━━━━━━━━━━━━━
[Thay đổi schema.prisma]
          │
          ▼
$ npx prisma migrate dev --name "add_user_bio_field"
          │
          ├── Tạo file: prisma/migrations/20260215_add_user_bio_field/
          │   └── migration.sql
          │
          ├── Apply SQL migration lên local DB
          │
          └── Generate Prisma Client (TypeScript types cập nhật)

PRODUCTION WORKFLOW:
━━━━━━━━━━━━━━━━━━━
[Deploy Docker container]
          │
          ▼
docker-entrypoint.sh:
$ npx prisma migrate deploy
          │
          ├── Đọc danh sách migration trong prisma/migrations/
          ├── So sánh với bảng _prisma_migrations trong DB
          ├── Chỉ apply migration chưa được chạy (pending)
          └── Không tạo migration mới, không interactive prompt
```

### 6.4.2 Danh sách migrations trong dự án

```
prisma/migrations/
├── 20260210050735_init/
│   └── migration.sql   ← Schema ban đầu: users, posts, comments, categories...
├── 20260304043512_.../
│   └── migration.sql   ← Thêm tính năng: tags, votes, bookmarks
├── 20260326052535_add_bot_role/
│   └── migration.sql   ← Thêm BOT role cho vibe-content users
└── 20260326095131_add_user_content_context/
    └── migration.sql   ← Bảng tracking vibe-content bot history
```

### 6.4.3 Chiến lược Rollback

Prisma không có native rollback. Chiến lược trong dự án:

```
TRƯỚC KHI DEPLOY:
  1. Backup database:
     $ npx ts-node scripts/backupDb.ts
     → Tạo backup/backup_YYYYMMDD_HHmmss.sql

  2. Test migration trên staging environment trước

NẾU CẦN ROLLBACK:
  Option A — Restore từ backup:
     $ psql $DATABASE_URL < backup/backup_YYYYMMDD.sql

  Option B — Viết migration mới để revert:
     $ npx prisma migrate dev --name "revert_add_user_bio_field"
     → Viết SQL DROP COLUMN thủ công trong migration.sql
```

### 6.4.4 DATABASE_URL vs DIRECT_URL

Prisma yêu cầu hai URL khác nhau khi dùng connection pooler (pgbouncer) của Supabase:

| Biến | Dùng cho | Đặc điểm |
|------|---------|----------|
| `DATABASE_URL` | Query thông thường | Qua pgbouncer, connection pooling, hiệu quả hơn |
| `DIRECT_URL` | `prisma migrate deploy` | Direct TCP, bypasses pooler, cần cho DDL statements |

---

## 6.5 Giám sát và quan sát hệ thống (Observability)

### 6.5.1 Ba lớp Observability

```
OBSERVABILITY STACK:
┌─────────────────────────────────────────────────────────┐
│  Layer 1: HTTP METRICS (metricsMiddleware + metricsService)│
│                                                          │
│  Thu thập per-endpoint:                                  │
│  • request_count[method][endpoint][status_code]          │
│  • response_time_ms[endpoint] (avg, p95, p99)            │
│  • error_rate[endpoint]                                  │
│  • active_connections                                    │
│                                                          │
│  Lưu trữ: in-memory (Map) — reset khi restart           │
│  Truy vấn: GET /api/v1/admin/metrics (ADMIN only)        │
└─────────────────────────────────────────────────────────┘
         │
         ▼ Data hiển thị
┌─────────────────────────────────────────────────────────┐
│  Layer 2: OPERATIONAL DASHBOARD (admin-client)           │
│                                                          │
│  OperationalDashboardPage.tsx:                           │
│  • Real-time metrics từ /admin/metrics endpoint          │
│  • Top endpoints by request volume                       │
│  • Top endpoints by error rate                           │
│  • Response time distribution chart                      │
│  • Auto-refresh mỗi 30 giây                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Layer 3: LOG MANAGEMENT (httpLoggerMiddleware)          │
│                                                          │
│  HTTP Access Logs (structured JSON):                     │
│  {                                                       │
│    "requestId": "uuid",                                  │
│    "method": "POST",                                     │
│    "url": "/api/v1/posts",                               │
│    "statusCode": 201,                                    │
│    "duration": 145,                                      │
│    "ip": "203.0.113.1",                                  │
│    "userId": 42                                          │
│  }                                                       │
│                                                          │
│  Vibe-Content Bot Logs (vibe-content/logs/):             │
│  • bot-activity.log: mỗi action được thực hiện          │
│  • llm-usage.log: provider dùng, tokens, latency         │
│  • errors.log: pipeline failures                         │
└─────────────────────────────────────────────────────────┘
```

### 6.5.2 Metrics API Response Format

```json
// GET /api/v1/admin/metrics
{
  "summary": {
    "total_requests": 15234,
    "error_rate": 0.023,
    "avg_response_time_ms": 145,
    "uptime_seconds": 86400
  },
  "top_endpoints": [
    { "path": "GET /posts", "count": 3421, "avg_ms": 89 },
    { "path": "POST /auth/login", "count": 892, "avg_ms": 312 },
    { "path": "GET /notifications/stream", "count": 445, "avg_ms": 0 }
  ],
  "error_endpoints": [
    { "path": "POST /auth/login", "error_count": 234, "error_rate": 0.26 }
  ],
  "response_time_distribution": {
    "p50": 89,
    "p95": 312,
    "p99": 890
  }
}
```

### 6.5.3 Lộ trình nâng cấp Observability

Hệ thống hiện tại phù hợp cho prototype. Để scale production:

| Hiện tại | Nâng cấp đề xuất |
|---------|-----------------|
| In-memory metrics | Prometheus + Grafana Dashboard |
| File logs | ELK Stack (Elasticsearch + Logstash + Kibana) |
| Manual refresh | Alertmanager (cảnh báo tự động khi error rate cao) |
| No APM | Sentry hoặc Datadog APM |

---

## 6.6 Scripts bảo trì

### 6.6.1 Danh sách scripts trong `backend/scripts/`

| Script | Mục đích | Môi trường |
|--------|---------|-----------|
| `backupDb.ts` | Backup toàn bộ PostgreSQL → file SQL local | Production / Staging |
| `cleanupImagekit.ts` | Xóa ảnh orphaned trên ImageKit CDN (không có post/user reference) | Production |
| `cleanupLegacyAvatars.ts` | Cleanup field `avatar_url` deprecated | Migration |
| `clearData.ts` | Xóa toàn bộ data giữ schema | Development / Testing |
| `migrateAvatarUrls.ts` | Migrate legacy `avatar_url` sang `avatar_preview_url`/`avatar_standard_url` | Migration (một lần) |
| `migratePostsToBlocks.ts` | Migrate bài viết từ plain text sang block layout | Migration (một lần) |
| `resetAllMedia.ts` | Xóa và reset tất cả media (dev) | Development |
| `resetAvatarMedia.ts` | Xóa và reset avatar media | Development |
| `resetPostMedia.ts` | Xóa và reset post media | Development |
| `wipeAllDb.ts` | Xóa TOÀN BỘ database (cực kỳ nguy hiểm!) | Development only |

### 6.6.2 Script backup — Chiến lược bảo vệ dữ liệu

```typescript
// scripts/backupDb.ts — luồng backup
async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `backups/backup_${timestamp}.sql`;

  // Dùng pg_dump qua DATABASE_URL
  const command = `pg_dump "${process.env.DATABASE_URL}" > ${backupPath}`;

  await exec(command);
  console.log(`Backup saved to: ${backupPath}`);
}
```

**Khuyến nghị backup schedule:**
- Trước mỗi deploy (production)
- Hàng ngày tự động (cron job)
- Trước khi chạy bất kỳ migration script nào

---

*[Tiếp theo: Chương 7 — Đánh giá và kết luận]*
