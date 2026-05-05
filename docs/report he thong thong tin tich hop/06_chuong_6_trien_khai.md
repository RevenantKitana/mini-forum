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

Dưới đây là Dockerfile của service `backend` với chú thích kỹ thuật:

```dockerfile
# syntax=docker/dockerfile:1
# Khai báo syntax version để dùng BuildKit features (cache mounts)

# ════════════════════════════════════════════════════════════════
# STAGE 1: Production Dependencies (native compilation)
# Base: node:20-alpine — Alpine Linux nhỏ gọn (~5MB base)
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps

# Build tools cần thiết cho bcrypt (C++ native addon):
# python3: node-gyp yêu cầu Python để chạy binding.gyp
# make/g++: compile C++ source của bcrypt thành .node binary
# openssl/openssl-dev: Prisma engine cần OpenSSL cho TLS
RUN apk add --no-cache python3 make g++ openssl openssl-dev

WORKDIR /app

COPY package.json package-lock.json ./

# BuildKit cache mount: /root/.npm được cache giữa các lần build
# → Không cần re-download packages nếu package-lock.json không đổi
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

# Generate Prisma Client TypeScript types
COPY prisma ./prisma
RUN npx prisma generate


# ════════════════════════════════════════════════════════════════
# STAGE 2: TypeScript Compiler
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# --ignore-scripts: Không chạy postinstall scripts (bỏ qua native build)
# Stage này chỉ cần TypeScript definitions để tsc chạy được
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --no-audit --no-fund

# Overlay Prisma types từ Stage 1
# Không có bước này → tsc báo lỗi "Cannot find module '@prisma/client'"
COPY --from=deps /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY tsconfig.json ./
COPY src ./src

# npm run build chạy: tsc --project tsconfig.json
# Output: dist/ chứa .js và .js.map (source maps)
RUN npm run build


# ════════════════════════════════════════════════════════════════
# STAGE 3: Production Runtime (FINAL IMAGE)
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# libssl3: Prisma engine cần OpenSSL để kết nối PostgreSQL (TLS)
# su-exec: Lightweight tool để drop root privileges
RUN apk add --no-cache libssl3 openssl su-exec

# Tạo system group và user không có quyền root
# -g 1001 / -u 1001: UID/GID cố định (reproducible)
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy chỉ những artifacts cần thiết để chạy
COPY --from=deps    /app/node_modules    ./node_modules
COPY --from=builder /app/dist            ./dist
COPY package.json   ./
COPY prisma         ./prisma

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
RUN chown -R appuser:appgroup /app

EXPOSE 5000

# ENTRYPOINT (không phải CMD) để script luôn chạy
ENTRYPOINT ["/app/docker-entrypoint.sh"]
```

### 6.1.4 docker-entrypoint.sh — Khởi động có kiểm soát

Script `docker-entrypoint.sh` thực hiện ba nhiệm vụ theo đúng thứ tự trước khi khởi động Node.js server:

```bash
#!/bin/sh
set -e  # Thoát ngay nếu bất kỳ lệnh nào thất bại

echo "========================================"
echo "  MINI-FORUM Backend Starting Up"
echo "  NODE_ENV: $NODE_ENV"
echo "========================================"

# ── Bước 1: Chờ database sẵn sàng ──────────────────────────────
# Container backend có thể khởi động trước khi DB accept connections.
echo "[1/3] Waiting for database to be ready..."
sleep 3

# ── Bước 2: Chạy database migrations ────────────────────────────
echo "[2/3] Running database migrations..."

MIGRATION_OUTPUT=$(npx prisma migrate deploy \
    --schema=prisma/schema.prisma 2>&1)
MIGRATION_EXIT=$?

if [ $MIGRATION_EXIT -ne 0 ]; then
    # P3005: Database not empty — xảy ra khi deploy lần đầu
    # trên DB đã có schema từ trước
    if echo "$MIGRATION_OUTPUT" | grep -q "P3005"; then
        echo "  → Existing schema detected. Resolving baseline..."
        npx prisma migrate resolve \
            --applied "20260210050735_init" \
            --schema=prisma/schema.prisma
        npx prisma migrate resolve \
            --applied "20260304043512_add_tags_votes_bookmarks" \
            --schema=prisma/schema.prisma
        npx prisma migrate resolve \
            --applied "20260326052535_add_bot_role" \
            --schema=prisma/schema.prisma
        npx prisma migrate resolve \
            --applied "20260326095131_add_user_content_context" \
            --schema=prisma/schema.prisma
        npx prisma migrate deploy --schema=prisma/schema.prisma
    else
        echo "  ✗ Migration failed:"
        echo "$MIGRATION_OUTPUT"
        exit $MIGRATION_EXIT
    fi
fi
echo "  ✓ Migrations completed"

# ── Bước 3: Khởi động server với user không có root ─────────────
# exec: replace shell process với Node.js → PID 1 = Node.js
# → Đảm bảo SIGTERM/SIGINT được gửi đúng (graceful shutdown)
echo "[3/3] Starting server as appuser..."
exec su-exec appuser:appgroup node dist/index.js
```

**Ý nghĩa kỹ thuật của từng quyết định:**

| Kỹ thuật | Lý do |
|---------|-------|
| `set -e` | Dừng script ngay khi có lỗi, không chạy tiếp trong trạng thái sai |
| `exec su-exec` | Drop root privileges; Node.js chạy với UID 1001, không phải root |
| `exec` (thay vì `su-exec ... &`) | Node.js thừa kế PID của shell → nhận SIGTERM từ Docker stop |
| `sleep 3` | Buffer time cho PostgreSQL service khởi động trước backend |

### 6.1.5 So sánh Single-stage và Multi-stage Build

**Bảng 6.2 — So sánh chiến lược Docker Build**

| Tiêu chí | Single-stage | Multi-stage (MINI-FORUM) |
|----------|:-----------:|:------------------------:|
| Kích thước image cuối | ~800 MB | ~250 MB |
| Chứa build tools (python3, g++) | Có | Không |
| Chứa TypeScript source (.ts) | Có | Không |
| Attack surface | Lớn | Nhỏ |
| Tái sử dụng cache giữa stages | Không | Có |
| Thời gian build lần đầu | Nhanh hơn (~10%) | Chậm hơn |
| Thời gian build có cache | Tương đương | Tương đương |
| Bí mật bị lộ trong layer | Có thể | Không |
| Phù hợp production | Không khuyến khích | Có |

*Ghi chú: Số liệu kích thước đo trên backend MINI-FORUM, node:20-alpine base*

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

Render.com đọc file `render.json` để tự động cấu hình service khi deploy:

```json
{
  "services": [
    {
      "type": "web",
      "name": "mini-forum-api",
      "runtime": "docker",
      "region": "singapore",
      "plan": "free",
      "branch": "main",
      "healthCheckPath": "/health",
      "envVars": [
        { "key": "NODE_ENV",             "value": "production" },
        { "key": "PORT",                 "value": "5000" },
        { "key": "DATABASE_URL",         "sync": false },
        { "key": "DIRECT_URL",           "sync": false },
        { "key": "JWT_ACCESS_SECRET",    "sync": false },
        { "key": "JWT_REFRESH_SECRET",   "sync": false },
        { "key": "BREVO_API_KEY",        "sync": false },
        { "key": "IMAGEKIT_PRIVATE_KEY", "sync": false },
        { "key": "FRONTEND_URL",         "sync": false },
        { "key": "ADMIN_CLIENT_URL",     "sync": false }
      ]
    }
  ]
}
```

Trường `"sync": false` đánh dấu các biến nhạy cảm — không lưu trong `render.json` (tránh commit secret lên Git) mà phải nhập thủ công trong Render Dashboard.

### 6.2.3 Cấu hình Vercel — SPA Rewrite

```json
// frontend/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Hình 6.3 — Cơ chế SPA Rewrite trên Vercel CDN**

```
  Người dùng truy cập: https://mini-forum.vercel.app/posts/my-slug
                                │
                                ▼
                ┌────────────────────────────┐
                │     Vercel Edge CDN         │
                │                            │
                │  Tìm kiếm file:            │
                │  /posts/my-slug            │← Không tồn tại trong dist/
                │                            │
                │  Áp dụng rewrite rule:     │
                │  /(.*) → /index.html        │
                └──────────────┬─────────────┘
                               │ Trả về index.html
                               ▼
                ┌────────────────────────────┐
                │    React App Bootstrap     │
                │                            │
                │  ReactDOM.render(<App/>)   │
                │         ↓                  │
                │  React Router DOM          │
                │  Đọc window.location.href  │
                │  Match: /posts/:slug       │
                │         ↓                  │
                │  Render <PostDetailPage/>  │
                └────────────────────────────┘
```

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

### 6.4.2 Quy trình Migration đầy đủ

**Hình 6.5 — Quy trình Prisma Migration từ Development đến Production**

```
  DEVELOPER WORKFLOW (local machine)
  ════════════════════════════════════════════════════════

  [1] Thay đổi prisma/schema.prisma
      ví dụ: thêm field view_count vào model Post
                │
                ▼
  [2] $ npx prisma migrate dev --name "add_post_view_count"
                │
                ├─→ Prisma diff schema.prisma ↔ DB hiện tại
                ├─→ Sinh file SQL:
                │   prisma/migrations/20260401_add_post_view_count/
                │   └── migration.sql:
                │       ALTER TABLE "posts"
                │       ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
                ├─→ Apply SQL lên local PostgreSQL
                └─→ Chạy `prisma generate` → TypeScript types cập nhật
                │
                ▼
  [3] Git commit: prisma/migrations/ + prisma/schema.prisma
      Git push → CI/CD trigger → Render deploy

  ════════════════════════════════════════════════════════
  PRODUCTION WORKFLOW (Render.com Docker container)
  ════════════════════════════════════════════════════════

  [1] Container khởi động
      docker-entrypoint.sh chạy
                │
                ▼
  [2] $ npx prisma migrate deploy
                │
                ├─→ Đọc tất cả files trong prisma/migrations/
                ├─→ Query bảng _prisma_migrations trong DB
                ├─→ So sánh: migration nào chưa được apply?
                ├─→ Apply CHỈ các migration pending
                │   (idempotent: chạy lại không bị lỗi)
                └─→ Cập nhật _prisma_migrations
                │
                ▼
  [3] exec su-exec appuser node dist/index.js
      → Server khởi động với schema đã up-to-date

  ┌───────────────────────────────────────────────────────┐
  │  ĐẶC TÍNH IDEMPOTENT của prisma migrate deploy:      │
  │  • Chạy khi không có pending migration → Không làm gì │
  │  • Chạy khi có N pending migrations → Apply đúng N    │
  │  • Chạy lại sau khi đã apply → Không apply lại       │
  │  → An toàn khi container restart hoặc deploy lại      │
  └───────────────────────────────────────────────────────┘
```

### 6.4.3 Lịch sử Migrations trong dự án

**Bảng 6.5 — Danh sách Prisma Migrations theo thứ tự thời gian**

| Timestamp | Tên Migration | Nội dung | Sprint |
|-----------|-------------|---------|:------:|
| `20260210050735` | `_init` | Schema ban đầu: users, posts, comments, categories, roles, sessions | 0 |
| `20260304043512` | `_add_tags_votes_bookmarks` | Bảng tags, post_tags, post_votes, comment_votes, bookmarks | 2 |
| `20260326052535` | `_add_bot_role` | Thêm giá trị `BOT` vào enum Role | 5 |
| `20260326095131` | `_add_user_content_context` | Bảng `bot_action_history` cho vibe-content tracking | 5 |

### 6.4.4 Chiến lược Rollback

Prisma không cung cấp cơ chế rollback tự động. MINI-FORUM áp dụng hai phương án tùy mức độ nghiêm trọng:

**Hình 6.6 — Decision Tree Rollback Database**

```
  Phát hiện lỗi sau khi deploy migration
                │
                ▼
    Lỗi có làm mất dữ liệu không?
         │                  │
        Không               Có
    (ADD COLUMN,       (DROP TABLE/COLUMN,
     ADD INDEX)         thay đổi kiểu dữ liệu)
         │                  │
         ▼                  ▼
  OPTION B:           OPTION A:
  Forward Fix         Restore Backup
  ────────────        ─────────────────
  Viết migration mới  1. Dừng service
  để revert:          2. Restore:
                         psql $DB < backup.sql
  prisma migrate dev  3. Revert code commit
    --name "fix_xxx"  4. Khởi động lại
  SQL thủ công:
  ALTER TABLE posts
  DROP COLUMN IF EXISTS
    view_count;
```

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

### 6.5.2 Kiến trúc Observability ba lớp

**Hình 6.7 — Kiến trúc Observability Stack của MINI-FORUM**

```
┌───────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                            │
│                      MINI-FORUM Backend                           │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LỚP 1 — HTTP METRICS                                            │
│  (metricsMiddleware + metricsService)                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Thu thập per-endpoint (in-memory, real-time):             │ │
│  │  • request_count[method][endpoint][status_code]            │ │
│  │  • response_time_ms — avg, p50, p95, p99                  │ │
│  │  • error_rate = error_count / total_count                  │ │
│  │  • active_sse_connections (Server-Sent Events)             │ │
│  │  • uptime_seconds (từ process.uptime())                    │ │
│  │                                                             │ │
│  │  Lưu trữ: In-memory Map                                    │ │
│  │  Truy vấn: GET /api/v1/admin/metrics (ADMIN role only)     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          │                                        │
│                          ▼ Data hiển thị trực quan               │
│  LỚP 2 — OPERATIONAL DASHBOARD                                   │
│  (admin-client / OperationalDashboardPage.tsx)                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  • Top 10 endpoints by request volume                      │ │
│  │  • Top endpoints by error rate (highlight nếu > 5%)        │ │
│  │  • Response time distribution: p50 / p95 / p99             │ │
│  │  • Active SSE connections counter                          │ │
│  │  • Uptime display (ngày giờ phút giây)                     │ │
│  │  • Auto-refresh mỗi 30 giây                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  LỚP 3 — STRUCTURED LOGGING                                      │
│  (httpLoggerMiddleware + vibe-content logger)                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  HTTP Access Log (mỗi HTTP request):                       │ │
│  │  {                                                          │ │
│  │    "requestId": "550e8400-e29b-41d4-a716-446655440000",    │ │
│  │    "timestamp": "2026-04-15T08:30:00.000Z",                │ │
│  │    "method": "POST",                                        │ │
│  │    "url": "/api/v1/posts",                                  │ │
│  │    "statusCode": 201,                                       │ │
│  │    "duration": 145,                                         │ │
│  │    "ip": "203.0.113.1",                                     │ │
│  │    "userId": 42                                             │ │
│  │  }                                                          │ │
│  │                                                             │ │
│  │  Vibe-Content Bot Logs (vibe-content/logs/):               │ │
│  │  • bot-activity.log — Mỗi hành động bot thực hiện          │ │
│  │  • llm-usage.log    — Provider dùng, token count, latency  │ │
│  │  • errors.log       — Pipeline failures với stack trace    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### 6.5.3 Metrics API Response

Endpoint `GET /api/v1/admin/metrics` trả về:

```json
{
  "summary": {
    "total_requests": 15234,
    "total_errors": 351,
    "error_rate": 0.023,
    "avg_response_time_ms": 145,
    "uptime_seconds": 86400,
    "active_sse_connections": 12
  },
  "top_endpoints_by_volume": [
    { "path": "GET /posts",               "count": 3421, "avg_ms": 89  },
    { "path": "GET /posts/:id",           "count": 2156, "avg_ms": 67  },
    { "path": "GET /notifications/stream","count": 445,  "avg_ms": 0   },
    { "path": "POST /auth/login",          "count": 892,  "avg_ms": 312 }
  ],
  "top_endpoints_by_error_rate": [
    { "path": "POST /auth/login",   "error_count": 234, "error_rate": 0.262 },
    { "path": "POST /auth/register","error_count": 45,  "error_rate": 0.089 }
  ],
  "response_time_distribution": {
    "p50": 89, "p95": 312, "p99": 890, "max": 3420
  },
  "requests_by_status": {
    "2xx": 14883, "3xx": 0, "4xx": 318, "5xx": 33
  }
}
```

### 6.5.4 requestId — Distributed Tracing cơ bản

Mọi request được gán một `requestId` UUID v4 bởi `requestIdMiddleware` và lan truyền qua toàn bộ pipeline:

**Hình 6.8 — Luồng truyền requestId qua middleware pipeline**

```
  HTTP Request vào
  (chưa có X-Request-ID)
          │
          ▼
  requestIdMiddleware
  ─────────────────────
  x-request-id = crypto.randomUUID()
  req.requestId = x-request-id
  res.setHeader('X-Request-ID', requestId)
          │
          ▼
  authMiddleware
  ─────────────────────
  Dùng req.requestId trong error log:
  logger.error({ requestId }, 'JWT invalid')
          │
          ▼
  Controller → Service
  ─────────────────────
  Truyền requestId vào service calls
  Nếu gọi external API (Brevo, ImageKit):
    headers['X-Request-ID'] = requestId
          │
          ▼
  httpLoggerMiddleware (on response finish)
  ─────────────────────────────────────────
  Log entry với requestId:
  { requestId: "550e8400-...", status: 201, duration: 145 }
          │
          ▼
  HTTP Response
  Header: X-Request-ID: 550e8400-...
  (Client dùng ID này để report bug chính xác)
```

### 6.5.5 Lộ trình nâng cấp Observability

**Bảng 6.7 — Lộ trình nâng cấp từ Prototype lên Production Scale**

| Thành phần | Hiện tại (Prototype) | Nâng cấp đề xuất | Lợi ích |
|-----------|:------------------:|:----------------:|---------|
| Metrics storage | In-memory Map | Prometheus TSDB | Lịch sử dài hạn, không mất khi restart |
| Visualization | Custom React page | Grafana dashboards | Biểu đồ phong phú, drill-down |
| Alerting | Không có | Alertmanager | Cảnh báo tự động khi error rate > 5% |
| Log storage | stdout + file | Grafana Loki | Full-text search, retention policy |
| Distributed tracing | requestId (partial) | OpenTelemetry + Jaeger | Trace xuyên suốt microservices |
| Error tracking | Không có | Sentry | Stack traces, user context, release tracking |
| Uptime monitoring | Render health check | UptimeRobot / Betterstack | Multi-region checks, SLA tracking |

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

### 6.6.2 Script Backup — Bảo vệ dữ liệu production

```typescript
// scripts/backupDb.ts — Luồng xử lý
async function backupDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  const timestamp = new Date().toISOString()
    .replace(/[:.]/g, '-').slice(0, 19);

  const backupDir = path.join(__dirname, '..', 'backups');
  const backupPath = path.join(backupDir, `backup_${timestamp}.sql`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Starting backup → ${backupPath}`);

  // pg_dump: xuất toàn bộ schema + data ra plain SQL
  await execAsync(
    `pg_dump "${databaseUrl}" --no-password --format=plain \
     --no-acl --no-owner > "${backupPath}"`
  );

  const sizeMB = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2);
  console.log(`✓ Backup done: ${backupPath} (${sizeMB} MB)`);
}
```

### 6.6.3 Quy trình bảo trì định kỳ

**Hình 6.9 — Lịch bảo trì hệ thống đề xuất**

```
  HÀNG NGÀY — 02:00 UTC (cron job hoặc thủ công):
  ────────────────────────────────────────────────
  → backupDb.ts
    • Lưu vào backups/backup_YYYYMMDD-HHmmss.sql
    • Giữ 7 bản gần nhất, tự động xóa cũ hơn

  HÀNG TUẦN — Chủ nhật:
  ─────────────────────
  → cleanupImagekit.ts
    • Query DB lấy danh sách file ID đang được reference
    • So sánh với danh sách file trên ImageKit CDN
    • Xóa orphaned files (không có reference trong DB)
    • Log: số file xóa, dung lượng giải phóng

  TRƯỚC MỖI DEPLOY (BẮT BUỘC):
  ─────────────────────────────
  1. npx ts-node scripts/backupDb.ts     ← Backup trước
  2. Kiểm tra pending migrations
  3. Test trên staging (nếu có schema change)
  4. Deploy lên production
  5. Verify: GET /health
  6. Verify: GET /api/v1/admin/metrics
```

---

## Tóm tắt chương 6

Chương 6 đã trình bày toàn diện chiến lược triển khai và vận hành của MINI-FORUM. Sáu điểm cốt lõi:

1. **Docker Multi-stage Build** (3 stage: deps → builder → production) giảm kích thước image từ ~800MB xuống ~250MB, loại bỏ build tools khỏi runtime và tăng cường bảo mật qua non-root user.

2. **Split Deployment** — frontend/admin-client trên Vercel CDN (static) và backend/vibe-content trên Render.com (dynamic Docker) — tối ưu cho từng loại workload với chi phí hợp lý.

3. **Quản lý môi trường** theo 3 tầng (public/semi-public/secret) với quy tắc VITE_* prefix và không bao giờ commit secret vào repository.

4. **Prisma Migrate** cung cấp quy trình migration idempotent, có kiểm soát và audit trail đầy đủ qua bảng `_prisma_migrations`.

5. **Observability 3 lớp** (Metrics in-memory → Dashboard → Structured Logs) cung cấp khả năng quan sát đủ cho giai đoạn prototype với lộ trình rõ ràng để nâng cấp.

6. **Scripts bảo trì** có phân loại theo môi trường và rủi ro, với quy trình backup bắt buộc trước mọi thao tác có rủi ro cao.

---

*[Tiếp theo: Chương 7 — Đánh giá và Kết luận]*
