# 🚀 Quick Deploy to Render - Vibe Content

## ⚡ 5 Bước Deploy (10 phút)

### 1️⃣ Chuẩn Bị Code (5 phút)

```bash
# Đảm bảo các file trong vibe-content/:
✅ Dockerfile
✅ .dockerignore  
✅ docker-entrypoint.sh
✅ package.json
✅ tsconfig.json
✅ src/, seed/, prisma/

# Push lên GitHub
git add vibe-content/
git commit -m "Deploy vibe-content to Render"
git push origin main
```

---

### 2️⃣ Tạo Web Service (3 phút)

**Trên Render Dashboard:**

1. Click **"New +"** → **"Web Service"**
2. Chọn **GitHub repo** → **Kết nối**
3. Chọn repository `mini-forum`

```
Name:              vibe-content
Environment:       Docker
Region:            Singapore
Branch:            main
Root Directory:    vibe-content  ← MỤC T
```

4. Click **"Create Web Service"** → Render tự build & deploy

---

### 3️⃣ Set Environment Variables (2 phút)

Render auto-deploy đang chạy → Vẫn cấu hình env vars:

**Trong Service Dashboard → "Environment":**

| Key | Value | Bắt buộc |
|-----|-------|---------|
| `FORUM_API_URL` | `https://api.mini-forum.com/api` | ✅ |
| `DATABASE_URL` | PostgreSQL URL + `?sslmode=require` | ✅ |
| `GEMINI_API_KEY` | Gemini API key | ✅ |
| `BOT_PASSWORD` | Strong password | ✅ |
| `GROQ_API_KEY` | Groq key (nếu có) | ❌ |
| `CEREBRAS_API_KEY` | Cerebras key (nếu có) | ❌ |
| `CRON_SCHEDULE` | `*/30 * * * *` | ✅ |
| `BATCH_SIZE` | `1` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `LOG_LEVEL` | `info` | ❌ |

**Thêm từng biến:**
- Click **"Add Environment Variable"**
- Paste key + value
- Save

---

### ✅ Hoàn Tất!

Render tự động:
1. ✅ Build Docker image
2. ✅ Push đến registry
3. ✅ Deploy container
4. ✅ Start service

---

## 📍 Status Check

```
Dashboard → vibe-content → Events
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Build succeeded
✅ Service started on port 4000
✅ Health check passed
```

**URL Service:** `https://vibe-content.onrender.com`

---

## 🧪 Test Service

```bash
# Health check
curl https://vibe-content.onrender.com/health

# API test (nếu có)
curl https://vibe-content.onrender.com/api/stats
```

---

## 🔄 Auto-Deploy

Sau lần đầu tiên:
- ✅ Mỗi `git push` → Render tự rebuild & deploy
- ✅ Không cần manual trigger

---

## 🐛 Nếu Lỗi

### Build Fail (Red)
```
→ Check Logs tab
→ Thường: DATABASE_URL sai, hoặc API unreachable
→ Fix env vars → Manual Deploy
```

### Service Crash (Rebuilding)
```
→ Check Logs: "Error on line X"
→ Xem .env.production, kiểm tra all API keys valid
→ Render auto-restart sau 10s
```

### Health Check Fail
```
→ Service chạy nhưng không respond
→ Thường: PORT sai, hoặc /health endpoint fail
→ Check logs xem service start OK?
```

---

## 📋 Checklist Trước Deploy

- [ ] Code push lên GitHub
- [ ] `vibe-content/Dockerfile` có
- [ ] `vibe-content/.dockerignore` có
- [ ] `package.json` đầy đủ
- [ ] DATABASE_URL test được (psql)
- [ ] FORUM_API_URL reachable
- [ ] API keys (Gemini, Groq) valid
- [ ] BOT_PASSWORD = database seed

---

## 🎯 Một Lần Deploy từ Render Dashboard

**Nếu muốn manual deploy:**
1. Dashboard → vibe-content
2. **Manual Deploy** dropdown
3. Chọn branch `main`
4. Click **Deploy**

---

## 📞 Liên Hệ Support

- Dashboard Logs: Real-time logs
- Status: https://status.render.com
- Docs: https://render.com/docs

---

**Xong! Service đang chạy trên Render 🎉**

Lần sau, chỉ cần `git push` → Render tự deploy.
