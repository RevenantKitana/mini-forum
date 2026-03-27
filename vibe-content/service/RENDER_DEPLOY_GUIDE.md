# Vibe Content Service - Render Deployment Guide

> ⚠️ **Date**: 2026-03-27  
> ⚠️ **Status**: Critical issues found & fixed

---

## 🚀 QUICK DEPLOY CHECKLIST

- [ ] Fix #1: Port 3000 → 4000 in healthcheck
- [ ] Fix #2: Prisma client properly copied in Dockerfile
- [ ] Configure 6 required environment variables on Render
- [ ] Allow 5-10 minutes for build & cold start on Render

---

## 📋 DEPLOY STEPS

### Step 1: Connect Repository to Render
1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Select repository `mini-forum`
4. **Name**: `vibe-content-service`
5. **Region**: Choose closest to your users (e.g., Singapore, US-East)
6. **Branch**: `main` (or your production branch)
7. **Root Directory**: `vibe-content/service/`

### Step 2: Build & Run Configuration

**Build Command**:
```bash
npm run build
```

**Start Command**:
```bash
npm run start:prod
```

**Instance Type**: Standard (2 CPU, 4GB RAM min)

### Step 3: Configure Environment Variables

Go to **Environment** tab and add these **6 REQUIRED variables**:

#### Database (REQUIRED)
```
DATABASE_URL=postgresql://user:password@host:port/mini_forum?schema=public&sslmode=require
```
**Get from**:
- If using managed PostgreSQL: Copy from provider dashboard
- If existing mini-forum backend DB: Use same connection string with `?sslmode=require`

#### Forum API (REQUIRED)
```
FORUM_API_URL=https://your-mini-forum-backend.com/api
```
**Example**: `https://mini-forum-backend.onrender.com/api`

#### LLM Providers (AT LEAST 1 REQUIRED)
```
GEMINI_API_KEY=AIzaSy...your_key...
GROQ_API_KEY=gsk_...your_key...
CEREBRAS_API_KEY=your_key...
```
**Status**:
- `GEMINI_API_KEY`: **Required** (primary provider)
- `GROQ_API_KEY`: Optional (fallback)
- `CEREBRAS_API_KEY`: Optional (fallback)

#### Bot Credentials (REQUIRED)
```
BOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD
```
Must match password seeded in database (`prisma/seed.ts`)

#### Optional Configuration Variables
```
NODE_ENV=production
LOG_LEVEL=info
CRON_SCHEDULE=*/30 * * * *
BATCH_SIZE=1
MAX_POSTS_PER_USER_DAY=3
MAX_COMMENTS_PER_USER_DAY=6
MAX_VOTES_PER_USER_DAY=15
PROVIDER_TIMEOUT_MS=30000
```

### Step 4: Deploy

Click **Create Web Service** → Render builds & deploys automatically

**Expected build time**: 5-10 minutes (first time)
- Download deps: ~2-3 min
- Compile TypeScript: ~1-2 min
- Copy layers: ~1 min
- Start service: ~30s

### Step 5: Verify Deployment

#### Check health endpoint
```bash
curl https://vibe-content-service.onrender.com/status
```

**Expected response**:
```json
{
  "status": "ok",
  "uptime": "0h 1m",
  "env": "production",
  "providers": ["gemini", "groq", "cerebras"],
  "todayStats": {
    "totalActions": 0,
    "successCount": 0,
    "failedCount": 0,
    "successRate": "N/A"
  }
}
```

#### Check logs
Render Dashboard → Logs tab → see real-time output

---

## 🔴 COMMON DEPLOY ERRORS & FIXES

### ❌ Error: "Health check failed"
**Cause**: Dockerfile tried port 3000 instead of 4000  
**Fix**: Already fixed in Dockerfile (see Dockerfile#L68)

**Verify**:
```bash
docker build -t vibe-content:test .
docker run -p 4000:4000 vibe-content:test
curl http://localhost:4000/status
```

---

### ❌ Error: Build fails with "ERR! ERR! ERR!"
**Cause**: Missing environment variables  
**Fix**: Check Render Environment tab — all 6 vars must be set

**Verify in logs**:
```
> npm run build
> tsc --outDir dist
✓ TypeScript compiled successfully
```

---

### ❌ Error: "ECONNREFUSED DATABASE_URL"
**Cause**: `DATABASE_URL` is wrong or database unreachable  
**Fix**: 
1. Verify PostgreSQL server is running & accessible
2. Test connection locally:
   ```bash
   psql postgresql://user:password@host:port/mini_forum
   ```
3. Ensure `?sslmode=require` in connection string for Render

---

### ❌ Error: "Cannot find module __dirname"
**Cause**: ES modules issue (already fixed with proper tsconfig)  
**Fix**: Already handled in tsconfig.json + package.json type:module

---

### ❌ Error: "Prisma client not generated"
**Cause**: `node_modules/.prisma` folder missing in production image  
**Fix**: Already fixed in Dockerfile (see line ~75)

**Verify**:
```bash
# In Dockerfile deps stage
RUN npx prisma generate

# In production stage
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
```

---

## 📊 MONITORING & LOGS

### Real-time Logs
Render Dashboard → **Logs** tab

### Common log entries to watch
```
[Vibe::Cron] Scheduler started: */30 * * * *
[Cron Trigger] Starting content generation batch
[LLM] Using provider: gemini
[Action] Type=post, UserId=bot_1, Provider=gemini, Success=true
[Retry] Action queued for retry (attempt 1/3)
```

### Performance metrics
Use `/status` endpoint to track:
- Daily action count
- Success rate
- Active retry queue
- Last action details

---

## 🔧 MANUAL TRIGGERS (for testing)

Once deployed, test manually:

```bash
# Trigger entire batch
curl -X POST https://vibe-content-service.onrender.com/trigger

# Trigger specific action type
curl -X POST https://vibe-content-service.onrender.com/trigger/post
curl -X POST https://vibe-content-service.onrender.com/trigger/comment
curl -X POST https://vibe-content-service.onrender.com/trigger/vote
```

---

## 🆘 TROUBLESHOOTING

### Service keeps crashing (status: "down")
**Diagnosis**:
1. Check Logs tab in Render
2. Look for error in startup messages
3. Most common: missing env var

**Solutions**:
```bash
# Locally reproduce:
docker build -t vibe-content:test .
docker run -e DATABASE_URL=... \
           -e FORUM_API_URL=... \
           -e GEMINI_API_KEY=... \
           vibe-content:test
```

### Cold start too slow (>15 seconds)
**Expected**: 5-10 sec first time, 2-3 sec subsequent  
**Common causes**:
- Slow database connection
- LLM provider timeout
- Network latency to backend

**Optimize**:
1. Use `Standard` instance or higher
2. Keep `PROVIDER_TIMEOUT_MS=30000` (don't lower)
3. Ensure backend is fast

### Out of memory errors
**Sign**: Service crashes suddenly  
**Fix**: Use larger instance (Pro/Premium) if running high batch size

Render Standard = 4GB RAM (default sufficient for batch_size=1)

---

## 📞 SUPPORT RESOURCES

- **Render Docs**: https://render.com/docs
- **Docker Docs**: https://docs.docker.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Node ES Modules**: https://nodejs.org/api/esm.html

---

## ✅ DEPLOYMENT CHECKLIST - FINAL

Before going to production:

- [ ] All 6 environment variables configured
- [ ] Test healthcheck: `/status` returns 200
- [ ] Monitor logs for 1 hour
- [ ] Trigger manual batch: `curl -X POST .../trigger`
- [ ] Verify 1+ actions created in backend
- [ ] Cron scheduler running (logs show "Scheduler started")
- [ ] No errors in last 30 minutes of logs
- [ ] Database connection stable (check logs)

✨ **Deployment ready!**
