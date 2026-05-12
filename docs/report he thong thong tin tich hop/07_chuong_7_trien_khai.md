# CHƯƠNG 7 — TRIỂN KHAI VÀ VẬN HÀNH

---

## Giới thiệu chương

Chương này trình bày chiến lược triển khai và vận hành MINI-FORUM trên production, bao gồm: (1) đóng gói Docker Multi-stage Build; (2) cấu hình triển khai đa nền tảng Render.com/Vercel; (3) quản lý biến môi trường; (4) chiến lược migration database; (5) hệ thống giám sát Observability; và (6) scripts bảo trì vận hành.

---

## 7.1 Containerization — Docker Multi-stage Build

MINI-FORUM áp dụng Docker cho `backend` và `vibe-content`. `frontend` và `admin-client` được phục vụ dưới dạng static file bởi Vercel CDN.

**Hình 7.1 — Docker Multi-stage Build Pipeline**

```
╔══════════════════════════════════════════════════════════════════════╗
║  STAGE 1: deps  ── FROM node:20-alpine AS deps                      ║
║  • apk add python3 make g++ openssl  → compile bcrypt native binary ║
║  • npm ci --omit=dev --no-audit      → chỉ production deps          ║
║  • npx prisma generate               → Prisma Client types          ║
║  OUTPUT: node_modules/ (có bcrypt.node native binary)               ║
╠══════════════════════════════════════════════════════════════════════╣
║  STAGE 2: builder  ── FROM node:20-alpine AS builder                ║
║  • npm ci --ignore-scripts           → cài deps + type definitions  ║
║  • COPY --from=deps .prisma          → overlay Prisma types         ║
║  • npm run build → tsc → dist/       → TypeScript → ES2020 JS       ║
║  OUTPUT: dist/ (compiled .js files)                                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  STAGE 3: production  ── FROM node:20-alpine AS production          ║
║  CHỈ CHỨA: dist/, node_modules/ (prod), prisma/                     ║
║  KHÔNG CHỨA: src/ (.ts), devDeps, build tools, tsconfig.json       ║
║  • Chạy với non-root user (su-exec appuser:appgroup)                ║
║  • Kích thước: ~250MB (so với ~800MB single-stage)                  ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 7.1.1 docker-entrypoint.sh — Khởi động có kiểm soát

```bash
#!/bin/sh
set -e  # Thoát ngay nếu bất kỳ lệnh nào thất bại

# Bước 1: Chờ database sẵn sàng
sleep 3

# Bước 2: Chạy database migrations (idempotent)
npx prisma migrate deploy --schema=prisma/schema.prisma

# Bước 3: Khởi động server với user không có root
# exec: Node.js thừa kế PID của shell → nhận SIGTERM đúng cách (graceful shutdown)
exec su-exec appuser:appgroup node dist/index.js
```

---

## 7.2 Cấu hình triển khai đa nền tảng

### 7.2.1 Kiến trúc Split Deployment

**Hình 7.2 — Sơ đồ triển khai đa nền tảng**

```
[Người dùng]        [Quản trị viên]
      │                    │
      ▼                    ▼
┌──────────────┐   ┌──────────────────┐
│  VERCEL CDN  │   │   VERCEL CDN     │
│  frontend/   │   │  admin-client/   │
│  React SPA   │   │  React SPA       │
└──────┬───────┘   └────────┬─────────┘
       └──────────┬──────────┘
                  │ HTTPS REST API
                  ▼
        ┌──────────────────┐
        │   RENDER.COM     │
        │   backend/       │
        │   Docker :5000   │
        └──────────┬───────┘
                   │ TCP (Prisma)
                   ▼
        ┌──────────────────┐    ┌──────────────────┐
        │  PostgreSQL 15   │◄───│  RENDER.COM      │
        │  (Supabase/      │    │  vibe-content/   │
        │   Render)        │    │  Docker :4000    │
        └──────────────────┘    └──────────────────┘
```

- **Vercel**: static assets (HTML/JS/CSS), CDN toàn cầu, `/* → index.html` rewrite cho SPA routing
- **Render.com**: long-running process, cron jobs, SSE connections, Docker container

**Bảng 7.1 — Cấu hình triển khai 5 thành phần**

| Service | Nền tảng | Port | Build | Runtime |
|---------|----------|:----:|-------|---------|
| `backend` | Render.com | 5000 | Docker multi-stage | node:20-alpine |
| `vibe-content` | Render.com | 4000 | Docker multi-stage | node:20-alpine |
| `frontend` | Vercel | — | `npm run build` | Vite/React CDN |
| `admin-client` | Vercel | — | `npm run build` | Vite/React CDN |
| PostgreSQL | Supabase/Render | 5432 | — | PostgreSQL 15 |

---

## 7.3 Quản lý biến môi trường

**Hình 7.3 — Phân tầng biến môi trường theo độ nhạy cảm**

```
TẦNG 1 — PUBLIC (có thể version-control):
  NODE_ENV=production | PORT=5000 | COMMENT_EDIT_TIME_LIMIT=1800

TẦNG 2 — SEMI-PUBLIC (nhập trong platform dashboard):
  FRONTEND_URL, ADMIN_CLIENT_URL, VITE_API_URL
  IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY

TẦNG 3 — SECRET (chỉ trong platform secret vault):
  DATABASE_URL, DIRECT_URL
  JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
  BREVO_API_KEY, IMAGEKIT_PRIVATE_KEY
  GEMINI_API_KEY, GROQ_API_KEY, ...

⚠ Biến có prefix VITE_* được bundle vào JS gửi đến browser.
  TUYỆT ĐỐI không đặt secret vào VITE_*
```

**Bảng 7.2 — Ma trận biến môi trường theo service**

| Biến | backend | vibe-content | frontend | Lý do phân chia |
|------|:-------:|:------------:|:--------:|----------------|
| `DATABASE_URL` | ✅ | ✅ | — | Cả hai cần đọc DB |
| `DIRECT_URL` | ✅ | — | — | Chỉ backend chạy migrate |
| `JWT_*_SECRET` | ✅ | — | — | Chỉ backend ký/verify token |
| `BREVO_API_KEY` | ✅ | — | — | Chỉ backend gửi email |
| `IMAGEKIT_PRIVATE_KEY` | ✅ | — | — | Chỉ backend upload ảnh |
| `GEMINI_API_KEY` | — | ✅ | — | Chỉ vibe-content gọi LLM |
| `VITE_API_URL` | — | — | ✅ | URL backend cho React |

---

## 7.4 Chiến lược migration cơ sở dữ liệu

### 7.4.1 Quy trình Prisma Migration

**Hình 7.4 — Quy trình từ Development đến Production**

```
DEVELOPER (local):
  [1] Sửa prisma/schema.prisma
  [2] npx prisma migrate dev --name "add_post_view_count"
      → Sinh migration.sql, apply lên local DB, regenerate Client
  [3] git commit prisma/migrations/ + schema.prisma → push

PRODUCTION (Render.com container):
  [1] docker-entrypoint.sh chạy
  [2] npx prisma migrate deploy
      → Đọc prisma/migrations/, so sánh _prisma_migrations
      → Apply CHỈ các migration pending (idempotent)
  [3] Server khởi động với schema up-to-date
```

**Bảng 7.3 — Lịch sử Migrations**

| Timestamp | Tên Migration | Nội dung |
|-----------|-------------|---------|
| `20260210050735` | `_init` | Schema ban đầu: users, posts, comments, categories |
| `20260304043512` | `_add_tags_votes_bookmarks` | tags, post_tags, votes, bookmarks |
| `20260326052535` | `_add_bot_role` | Thêm giá trị `BOT` vào enum Role |
| `20260326095131` | `_add_user_content_context` | Bảng `bot_action_history` |

**DATABASE_URL vs DIRECT_URL**: `DATABASE_URL` qua pgbouncer port 6543 (dùng cho queries thông thường); `DIRECT_URL` TCP trực tiếp port 5432 (bắt buộc cho `prisma migrate deploy` vì cần DDL transactions).

### 7.4.2 Chiến lược Rollback

- **Không mất dữ liệu** (ADD COLUMN, ADD INDEX): Viết migration mới để revert (forward fix)
- **Có thể mất dữ liệu** (DROP TABLE/COLUMN): Dừng service → restore backup SQL → revert commit → khởi động lại

---

## 7.5 Giám sát và quan sát hệ thống (Observability)

**Hình 7.5 — Observability Stack 3 lớp**

```
LỚP 1 — HTTP METRICS (metricsMiddleware + metricsService):
  • request_count[method][endpoint][status_code]
  • response_time_ms: avg, p50, p95, p99
  • error_rate | active_sse_connections | uptime_seconds
  • Lưu: In-memory | Truy vấn: GET /api/v1/admin/metrics (ADMIN only)

LỚP 2 — OPERATIONAL DASHBOARD (admin-client):
  • Top 10 endpoints by volume | Error rate (highlight > 5%)
  • Response time p50/p95/p99 | Active SSE | Uptime
  • Auto-refresh mỗi 30 giây

LỚP 3 — STRUCTURED LOGGING (httpLoggerMiddleware):
  • HTTP Access Log: {requestId, timestamp, method, url, status, duration, userId}
  • Vibe-Content: bot-activity.log | llm-usage.log | errors.log
```

`requestId` UUID v4 được gán cho mọi request bởi `requestIdMiddleware`, lan truyền qua toàn bộ pipeline, trả về trong header `X-Request-ID` — cho phép trace lỗi từ user report đến root cause trong ~15 phút thay vì ~2 giờ.

**Bảng 7.4 — Lộ trình nâng cấp Observability**

| Thành phần | Hiện tại | Đề xuất nâng cấp |
|-----------|:--------:|:----------------:|
| Metrics | In-memory | Prometheus + Grafana |
| Logs | stdout/file | Grafana Loki |
| Alerting | Không có | Alertmanager (error > 5%) |
| Error tracking | Không có | Sentry |
| Tracing | requestId (partial) | OpenTelemetry + Jaeger |

---

## 7.6 Scripts bảo trì

**Bảng 7.5 — Scripts bảo trì theo mục đích và rủi ro**

| Script | Mục đích | Môi trường | Rủi ro |
|--------|---------|-----------|:------:|
| `backupDb.ts` | Backup PostgreSQL → SQL file | Production | Thấp |
| `cleanupImagekit.ts` | Xóa ảnh orphaned trên CDN | Production | Thấp |
| `cleanupLegacyAvatars.ts` | Xóa trường `avatar_url` deprecated | Migration | Trung bình |
| `migrateAvatarUrls.ts` | Migrate legacy → `avatar_preview/standard_url` | Migration | Trung bình |
| `migratePostsToBlocks.ts` | Migrate plain text → block layout | Migration | Trung bình |
| `clearData.ts` | Xóa toàn bộ data, giữ schema | Dev/Test | Cao ⚠️ |
| `wipeAllDb.ts` | Xóa TOÀN BỘ database | Dev only | **Rất cao ☠️** |

**Quy trình bảo trì đề xuất**:
- **Hàng ngày** 02:00 UTC: `backupDb.ts` (giữ 7 bản gần nhất)
- **Hàng tuần**: `cleanupImagekit.ts` (xóa orphaned files)
- **Trước mỗi deploy**: Backup bắt buộc → kiểm tra pending migrations → verify `/health` sau deploy

---

## Tóm tắt chương

| Khía cạnh | Giải pháp | Lợi ích |
|-----------|----------|---------|
| **Containerization** | Docker 3-stage | Image ~250MB, không có build tools trong runtime |
| **Deployment** | Render.com + Vercel | Tối ưu cho static vs. dynamic workload |
| **Secrets** | Platform vault + 3-tier | Không commit secret vào Git |
| **Migration** | Prisma migrate deploy (idempotent) | An toàn restart, audit trail đầy đủ |
| **Observability** | 3-lớp: Metrics + Dashboard + Logs | MTTR từ ~2h xuống ~15 phút |

---

*[Tiếp theo: Chương 8 — Đánh giá và Kết luận]*
