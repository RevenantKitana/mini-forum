# Vibe Content Service - Production Docker Setup

## 📋 Overview

Optimized multi-stage Dockerfile for production deployment of the vibe-content service. Uses Alpine Linux for minimal image size (~300MB) and follows security best practices.

## 🏗️ Architecture

### Multi-Stage Build
```
Stage 1: deps
  ├─ Install build tools
  ├─ npm ci --omit=dev (production dependencies only)
  └─ prisma generate (Prisma client)

Stage 2: builder
  ├─ npm ci --ignore-scripts (faster, no native builds)
  ├─ Copy Prisma generated types from deps
  └─ npm run build (TypeScript → JavaScript)

Stage 3: production
  ├─ Base image: node:20-alpine
  ├─ Copy production node_modules from deps
  ├─ Copy compiled files from builder
  ├─ Non-root user (nodejs:1001)
  ├─ Health check
  └─ Tini as PID 1
```

## 🚀 Quick Start

### Build the image
```bash
# Development build
docker build -t vibe-content:dev .

# Production build
docker build --target production -t vibe-content:latest .

# With BuildKit cache (faster rebuilds)
DOCKER_BUILDKIT=1 docker build -t vibe-content:latest .
```

### Run with docker-compose
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f vibe-content

# Stop services
docker-compose -f docker-compose.prod.yml down

# Clean up volumes
docker-compose -f docker-compose.prod.yml down -v
```

## 🔧 Configuration

### Environment Variables (Required)

Copy `.env.example` to `.env` and update:

```bash
# Database
FORUM_API_URL=https://your-backend.com/api
DATABASE_URL=postgresql://user:password@db:5432/mini_forum?schema=public

# LLM Providers
GEMINI_API_KEY=your-key-here
GROQ_API_KEY=your-key-here
CEREBRAS_API_KEY=your-key-here

# Bot credentials
BOT_PASSWORD=SecurePassword123

# Service
PORT=4000
NODE_ENV=production
LOG_LEVEL=info
```

### Environment Variables (Optional)

```bash
# Scheduler
CRON_SCHEDULE=*/30 * * * *      # Every 30 minutes
BATCH_SIZE=1                     # Actions per batch

# Rate Limits
MAX_POSTS_PER_USER_DAY=3
MAX_COMMENTS_PER_USER_DAY=6
MAX_VOTES_PER_USER_DAY=15

# Provider
PROVIDER_TIMEOUT_MS=30000        # 30 seconds
```

## 📊 Image Optimization

### Size Breakdown
- Base (node:20-alpine): ~170MB
- Production dependencies: ~100MB
- **Total: ~300MB** (vs ~1.2GB with full Node.js)

### Optimizations Applied
1. **Multi-stage builds**: Removes build tools from final image
2. **Alpine Linux**: Minimal base image
3. **npm ci --omit=dev**: Production dependencies only
4. **.dockerignore**: Excludes unnecessary files during build
5. **BuildKit cache mount**: ~/.npm cache reused across builds
6. **Non-root user**: Security isolation
7. **Health check**: Automated monitoring

## 🔒 Security Features

- ✅ Non-root user (nodejs:1001)
- ✅ Read-only root filesystem (add `--read-only` to docker run)
- ✅ No vulnerability-prone build tools in production image
- ✅ Health check for automatic restart
- ✅ Tini as PID 1 for proper signal handling
- ✅ BuildKit cache isolation

## 📈 Health Check

The container includes a health check that:
- Runs every 30 seconds
- Checks `/status` endpoint
- Waits 10 seconds after start
- Retries 3 times before marking unhealthy

```bash
# Check container health
docker inspect vibe-content --format='{{.State.Health.Status}}'
```

## 📝 Logging

Winston logs are written to `/app/logs`:

```bash
# View logs from container
docker exec vibe-content tail -f logs/combined.log

# Or mount logs volume
docker run -v vibe-content-logs:/app/logs vibe-content:latest
```

## 🐳 Docker Compose Features

The `docker-compose.prod.yml` includes:

- **PostgreSQL 16**: Database service
- **Volume persistence**: Logs and database data
- **Health checks**: Automatic restart on failure
- **Logging**: JSON driver with rotation (10MB max, 3 files)
- **Network isolation**: mini-forum bridge network
- **Restart policy**: unless-stopped (auto-restart on reboot)

## 🚢 Deployment Options

### Option 1: Kubernetes
```bash
# Create ConfigMap for .env
kubectl create configmap vibe-content-env --from-file=.env

# Deploy
kubectl apply -f k8s/deployment.yaml
```

### Option 2: Docker Swarm
```bash
# Build and push to registry
docker build -t registry.example.com/vibe-content:latest .
docker push registry.example.com/vibe-content:latest

# Deploy
docker service create \
  --name vibe-content \
  --env-file .env \
  registry.example.com/vibe-content:latest
```

### Option 3: Render/Railway/Vercel
1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set start command: `node dist/src/index.js`
4. Set environment variables in dashboard
5. Deploy!

## 🧪 Testing

### Local Testing
```bash
# Build
docker build -t vibe-content:test .

# Run with test env
docker run \
  -e NODE_ENV=production \
  -e LOG_LEVEL=debug \
  --port 4000:4000 \
  vibe-content:test

# Test the service
curl http://localhost:4000/status
```

### Performance Testing
```bash
# Check image size
docker images vibe-content

# Check build time
time docker build -t vibe-content:latest .

# Monitor resource usage
docker stats vibe-content
```

## 🐛 Troubleshooting

### Health check failing
```bash
# Check logs
docker logs vibe-content

# Test endpoint manually
docker exec vibe-content wget http://localhost:4000/status -O -

# Increase grace period in docker-compose.prod.yml start_period
```

### Out of memory
```bash
# Monitor memory usage
docker stats vibe-content

# Limit resources in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 512M
```

### Database connection failed
```bash
# Check DB is running
docker ps | grep db

# Check connection string
docker exec vibe-content printenv DATABASE_URL

# Test connection
docker exec vibe-content node -e "require('pg').connect(process.env.DATABASE_URL)"
```

## 📚 References

- [Docker best practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Alpine Linux](https://alpinelinux.org/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)

## 📌 What's Next

1. ✅ Test locally with `docker-compose.prod.yml`
2. ✅ Push image to Docker Hub / Container Registry
3. ✅ Deploy to production environment
4. ✅ Setup monitoring and alerts
5. ✅ Configure auto-scaling if needed

---

**Note**: Always test the production Dockerfile locally before deploying to production!
