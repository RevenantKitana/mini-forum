# Render Deployment Guide - Vibe Content Service

## 📋 Yêu Cầu Trước Khi Deploy

- ✅ Render account: https://render.com
- ✅ GitHub repository (code được push)
- ✅ Docker image sẵn sàng (Dockerfile + .dockerignore)
- ✅ Environment variables theo `.env.production`
- ✅ PostgreSQL connection string

## 🚀 Bước 1: Chuẩn Bị Repository

### Đảm bảo file cần thiết trong `vibe-content/`:
```
vibe-content/
├── Dockerfile            ✅
├── .dockerignore         ✅
├── docker-entrypoint.sh  ✅
├── package.json
├── tsconfig.json
├── src/
├── seed/
└── prisma/
```

### Push code lên GitHub:
```bash
git add vibe-content/
git commit -m "Add Docker files for vibe-content production"
git push origin main
```

---

## 🐳 Bước 2: Deploy trên Render

### 2.1 Tạo Web Service mới

1. Vào https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Chọn **"Build and deploy from a Git repository"**
4. Kết nối GitHub repo
5. Chọn repository: `mini-forum` (hoặc tên repo của bạn)

### 2.2 Cấu Hình Web Service

| Setting | Value |
|---------|-------|
| **Name** | `vibe-content` |
| **Environment** | `Docker` |
| **Region** | `Singapore` (hoặc gần nhất) |
| **Branch** | `main` |
| **Root Directory** | `vibe-content` |
| **Port** | `4000` |

### 2.3 Build Configuration

Render sẽ tự detect `Dockerfile` trong thư mục root:
- Tìm `vibe-content/Dockerfile` ✅
- Build image từ Dockerfile
- Push đến Render registry
- Deploy container

### 2.4 Environment Variables

Sau khi tạo service, đi vào **"Environment"** tab:

```env
FORUM_API_URL=https://api.mini-forum.com/api
DATABASE_URL=postgresql://user:password@db-host:5432/mini_forum?schema=public&sslmode=require
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
CEREBRAS_API_KEY=your-cerebras-key
BOT_PASSWORD=your-bot-password
CRON_SCHEDULE=*/30 * * * *
BATCH_SIZE=1
MAX_POSTS_PER_USER_DAY=3
MAX_COMMENTS_PER_USER_DAY=6
MAX_VOTES_PER_USER_DAY=15
PROVIDER_TIMEOUT_MS=30000
PORT=4000
NODE_ENV=production
LOG_LEVEL=info
```

**⚠️ Lưu ý:** Render tự động expose `PORT` từ environment

---

## 🔄 Bước 3: Auto-Deploy sau GitHub Push

### Mặc định (Nên bật):
- ✅ Auto-deploy khi có `git push` vào `main` branch
- ✅ Render tự trigger build → deploy

### Cấu hình (nếu cần):
1. Vào Web Service
2. **Settings** → **Deploy Hook**
3. Copy webhook URL
4. Paste vào GitHub repo: **Settings → Webhooks**

---

## 📊 Monitoring & Logs

### Xem Logs Real-time:
```bash
# Render dashboard → Logs tab
# Hoặc sử dụng Render CLI:
npm install -g @render/cli
render logs vibe-content
```

### Health Check Status:
- Render tự động kiểm tra `/health` endpoint mỗi 30s
- Nếu fail 3 lần → restart container

---

## 🚨 Troubleshooting

### Build Fail

**Lỗi: "Cannot find module"**
```bash
# Kiểm tra:
# 1. package.json có tất cả dependencies?
# 2. tsconfig.json correct?
# 3. npm ci chạy thành công?

# Xem logs chi tiết:
render logs vibe-content
```

**Lỗi: "Docker build failed"**
```bash
# Rebuild bằng Render CLI:
render builds vibe-content

# Hoặc manual trigger:
- Vào Dashboard
- Click "Manual Deploy"
- Chọn branch
```

### Service Crash

**"Service exits immediately"**
```
Nguyên nhân thường:
1. DATABASE_URL sai → service không kết nối DB
2. API endpoint unreachable → khởi tạo connection fail
3. Port 4000 bị occupy

Giải pháp:
1. Kiểm tra env vars
2. Test DATABASE_URL locally: psql $DATABASE_URL
3. Xem logs: render logs vibe-content
```

**"Health check failing"**
```
- Container chạy nhưng không respond
- Kiểm tra PORT=4000 có set không?
- API endpoint `/health` có implement không?
```

---

## 📈 Scaling Tips

### Resource Management:
1. **Free Tier**: 
   - 0.5 CPU, 512MB RAM
   - Tốt cho dev/test
   - Tự pause nếu inactive 15 min

2. **Pro**: `$7/month`
   - 1 CPU, 512MB RAM
   - Keep-alive (không pause)
   - Tốt cho production

3. **Plus/Premium**: `$12-50/month`
   - 2+ CPU, 1GB+ RAM
   - Cho traffic cao

### Chỉnh Cấu Hình:
1. Dashboard → vibe-content service
2. **Settings** → **Plan**
3. Upgrade/downgrade

### Load Balancing:
- Render tự động horizontal scaling cho Pro+ plans
- Tạo multiple instances nếu cần

---

## 🔐 Security Best Practices

### 1. **Environment Variables**
```
✅ Lưu sensitive keys trong Render dashboard
❌ KHÔNG commit .env.production vào git
```

### 2. **Database Connection**
```
✅ Sử dụng SSL: sslmode=require
✅ Restrict IP access trong DB firewall
❌ KHÔNG expose DATABASE_URL công khai
```

### 3. **API Keys**
```
✅ Rotate API keys mỗi 90 ngày
✅ Xoá old keys sau khi update
❌ KHÔNG hardcode keys trong code
```

---

## 📝 Deployment Checklist

- [ ] Dockerfile + .dockerignore trong `vibe-content/`
- [ ] Code push lên GitHub
- [ ] Render account tạo + kết nối GitHub
- [ ] Web Service tạo với Docker
- [ ] Root Directory = `vibe-content`
- [ ] Environment variables đầy đủ
- [ ] DATABASE_URL test OK (psql)
- [ ] FORUM_API_URL verify có response
- [ ] API keys (Gemini, Groq, Cerebras) valid
- [ ] Manual deploy test từ Render
- [ ] Health check pass
- [ ] Logs check for errors
- [ ] Setup auto-deploy webhook (optional)

---

## 🎯 Ví Dụ Full Deployment

```bash
# 1. Local test
cd vibe-content
docker build -t vibe-content:test .
docker run -e NODE_ENV=production --env-file .env.production -p 4000:4000 vibe-content:test

# 2. Verify endpoints
curl http://localhost:4000/health
curl http://localhost:4000/api/stats

# 3. Push lên GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 4. Render auto-deploy (hoặc manual trigger)
# → Check logs: render logs vibe-content
# → Verify service running: curl https://vibe-content.onrender.com/health
```

---

## 📞 Support

**Render Docs:** https://render.com/docs
**Render Status:** https://status.render.com

**Vibe-Content Logs:**
```bash
render logs vibe-content --tail 100
```

**Manual Restart:**
```bash
render restart vibe-content
```
