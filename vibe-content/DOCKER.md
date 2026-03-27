# Hướng Dẫn Deployment Vibe-Content với Docker

## 📋 Chuẩn Bị

### Các file cần thiết trong folder `vibe-content/`:
- ✅ `Dockerfile` - Multi-stage production build (with Prisma generation)
- ✅ `.dockerignore` - Loại bỏ file không cần thiết (giữ package-lock.json)
- ✅ `docker-entrypoint.sh` - Script khởi động
- ✅ `package.json` & `package-lock.json` - Dependencies with lock file
- ✅ `tsconfig.json`
- ✅ `src/`, `seed/`, `prisma/` folders
- ✅ `.env.example` - Template environment variables

## 🐳 Build Image

**Important:** The `package-lock.json` file must be included in Docker build context for `npm ci` to work.

```bash
# Build from vibe-content directory (recommended)
cd vibe-content
docker build -t vibe-content:latest .

# Or build from repository root with context specified
docker build -f vibe-content/Dockerfile -t vibe-content:latest vibe-content/
```

### Build Tags

```bash
# Build production image
docker build -t vibe-content:latest .

# Build with specific version tag
docker build -t vibe-content:1.0.0 .

# Build with multiple tags
docker build -t vibe-content:latest -t vibe-content:1.0.0 .
```

### Multi-Stage Build Process

1. **Builder Stage:** Compiles TypeScript and generates Prisma client
2. **Production Stage:** Minimal image with only runtime dependencies
   - Copies compiled output
   - Copies generated Prisma client to ensure ORM is initialized
   - Removes dev dependencies for smaller image

## 🚀 Chạy Container

### Development
```bash
docker run -it --rm \
  --env-file .env \
  -p 4000:4000 \
  vibe-content:latest
```

### Production
```bash
docker run -d --restart=always \
  --name vibe-content \
  --env-file .env.production \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -p 4000:4000 \
  vibe-content:latest
```

## 🌍 Environment Variables (Production)

Tạo `.env.production` với các biến sau:

```env
# Forum Backend API
FORUM_API_URL=https://your-forum-api.com/api
DATABASE_URL=postgresql://user:pass@db-host:5432/mini_forum?schema=public

# LLM Providers
GEMINI_API_KEY=your-api-key
GROQ_API_KEY=your-api-key
CEREBRAS_API_KEY=your-api-key

# Bot User
BOT_PASSWORD=SecurePassword123!

# Scheduler
CRON_SCHEDULE=*/30 * * * *
BATCH_SIZE=1

# Rate Limits
MAX_POSTS_PER_USER_DAY=3
MAX_COMMENTS_PER_USER_DAY=6
MAX_VOTES_PER_USER_DAY=15

# Service
PORT=4000
NODE_ENV=production
LOG_LEVEL=info
PROVIDER_TIMEOUT_MS=30000

# Optional: Run migrations trước khi start
RUN_MIGRATIONS=false
```

## 📊 Health Check

Container có healthcheck tích hợp, kiểm tra mỗi 30 giây:
```bash
docker inspect --format='{{.State.Health.Status}}' vibe-content
```

## 🔧 Docker Compose (Optional)

Nếu muốn chạy với PostgreSQL:
```yaml
version: '3.8'

services:
  vibe-content:
    build: .
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      FORUM_API_URL: http://forum-api:3000/api
      DATABASE_URL: postgresql://postgres:password@db:5432/mini_forum
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mini_forum
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 📦 Kích Thước Image

- **builder stage**: ~450MB (với dependencies)
- **final image**: ~200MB (production only)

## ⚠️ Lưu Ý

1. **Migrations**: Chạy migrations trước khi deploy nếu cần
2. **Env Variables**: Luôn sử dụng `.env.production`, không commit vào git
3. **User Privileges**: Container chạy với user `nodejs` (non-root)
4. **Signal Handling**: Dùng dumb-init để xử lý SIGTERM/SIGKILL đúng cách
5. **Logs**: Tất cả logs sẽ output đến stdout/stderr (phù hợp cho container)

## 🧹 Cleanup

```bash
# Remove container
docker rm vibe-content

# Remove image
docker rmi vibe-content:latest

# Prune all unused resources
docker system prune -a
```

## 🐛 Troubleshooting

```bash
# View logs
docker logs vibe-content

# Follow logs
docker logs -f vibe-content

# Interactive shell
docker exec -it vibe-content sh

# Check health
docker inspect vibe-content | grep -A 5 '"Health"'
```
