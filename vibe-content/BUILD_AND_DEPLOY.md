# Vibe Content Service - Docker Build & Deploy Guide

## Quick Commands

### Development Setup
```bash
# Build and run with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f vibe-content-dev

# Stop
docker-compose -f docker-compose.dev.yml down

# Clean up (remove volumes)
docker-compose -f docker-compose.dev.yml down -v
```

### Production Build

#### Option 1: BuildKit (Recommended)
```bash
# Build with BuildKit cache (3-5x faster rebuilds)
DOCKER_BUILDKIT=1 docker build \
  -t vibe-content:latest \
  -t vibe-content:1.0.0 \
  --target production \
  .
```

#### Option 2: Standard Docker
```bash
# Build without BuildKit
docker build \
  -t vibe-content:latest \
  -t vibe-content:1.0.0 \
  --target production \
  .
```

#### Option 3: Multi-platform Build (for M1/M2 Mac or cross-platform)
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t vibe-content:latest \
  -t vibe-content:1.0.0 \
  --push \
  .
```

### Production Deployment

#### Local Testing
```bash
# Start with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost:4000/status

# View logs
docker-compose -f docker-compose.prod.yml logs -f vibe-content

# Stop
docker-compose -f docker-compose.prod.yml down
```

#### Push to Registry
```bash
# Login to Docker Hub or Container Registry
docker login

# Tag image
docker tag vibe-content:latest yourusername/vibe-content:latest
docker tag vibe-content:latest yourusername/vibe-content:1.0.0

# Push
docker push yourusername/vibe-content:latest
docker push yourusername/vibe-content:1.0.0
```

#### Deploy to Kubernetes
```bash
# Update image in k8s/deployment.yaml
# Then apply:
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods -l app=vibe-content
kubectl logs -f deployment/vibe-content-deployment
```

#### Deploy to Cloud Platform

**Render.com:**
1. Connect GitHub repo
2. Create new Web Service
3. Select Repository
4. Build command: `npm run build`
5. Start command: `node dist/src/index.js`
6. Add environment variables from `.env.production`
7. Deploy!

**AWS ECS:**
```bash
# Create task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster vibe-forum \
  --service-name vibe-content \
  --task-definition vibe-content:1 \
  --desired-count 2
```

**Railway.app:**
1. Import GitHub repo
2. Select Dockerfile (auto-detected)
3. Add environment variables
4. Deploy!

## Image Inspection

```bash
# Check image size
docker images vibe-content

# Inspect layers
docker history vibe-content:latest

# Get image details
docker inspect vibe-content:latest

# Check for vulnerabilities
docker scout cves vibe-content:latest
```

## Performance Testing

```bash
# Build and measure time
time docker build -t vibe-content:test .

# Check final image size
docker images vibe-content

# Run with resource limits
docker run \
  -m 512m \
  --cpus 1 \
  -e NODE_ENV=production \
  vibe-content:latest

# Monitor resource usage
docker stats vibe-content
```

## Security Scanning

```bash
# Scan with Trivy (free vulnerability scanner)
trivy image vibe-content:latest

# Scan with Docker Scout (included with Docker CLI)
docker scout cves vibe-content:latest

# Check for secrets in image
docker run --rm -i aquasec/trivy image \
  --severity HIGH,CRITICAL \
  vibe-content:latest
```

## Cleanup

```bash
# Remove dangling images
docker image prune

# Remove all vibe-content images
docker rmi $(docker images vibe-content -q)

# Remove unused volumes
docker volume prune

# Full cleanup (dangerous!)
docker system prune -a --volumes
```

## Environment Variables Setup

### Create .env File for Docker Compose
```bash
# Copy template
cp .env.production .env

# Edit with your values
nano .env  # or your editor

# Verify before building
cat .env | grep -v '^#' | grep .
```

### Pass Environment to Container
```bash
# Option 1: --env-file flag
docker run --env-file .env vibe-content:latest

# Option 2: Individual --env flags
docker run \
  -e DATABASE_URL="..." \
  -e GEMINI_API_KEY="..." \
  vibe-content:latest

# Option 3: docker-compose.yml (uses .env automatically)
docker-compose -f docker-compose.prod.yml up
```

## Troubleshooting

### Container won't start
```bash
# Check container logs
docker logs vibe-content

# Run in interactive mode to debug
docker run -it vibe-content:latest sh

# Check if port is in use
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows
```

### Health check failing
```bash
# Manually test endpoint
docker exec vibe-content curl http://localhost:4000/status

# Check health status
docker inspect vibe-content --format='{{json .State.Health}}'

# Increase timeout in docker-compose file
```

### Database connection issues
```bash
# Check if DB container is running
docker ps | grep db

# Test connection
docker exec vibe-content psql -h db -U postgres -c "SELECT 1"

# View DB logs
docker logs vibe-content-db
```

### Out of memory
```bash
# Monitor RAM usage
docker stats vibe-content

# Check available system memory
free -h  # Linux
vm_stat  # macOS
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Build and Deploy Vibe Content

on:
  push:
    branches: [main]
    paths:
      - 'vibe-content/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - uses: docker/build-push-action@v4
        with:
          context: vibe-content/service
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/vibe-content:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/vibe-content:${{ github.sha }}
```

## Version Management

```bash
# Tag with version
docker tag vibe-content:latest vibe-content:1.0.0

# Push versions
docker push vibe-content:1.0.0
docker push vibe-content:latest

# Rollback to previous version
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml set image vibe-content=vibe-content:1.0.0
docker-compose -f docker-compose.prod.yml up -d
```

---

For detailed information, see [DOCKER_PRODUCTION.md](./DOCKER_PRODUCTION.md)
