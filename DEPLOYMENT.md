# Deployment Guide - Mini Forum

Hướng dẫn chi tiết deploy mini-forum lên **Vercel** (Frontend & Admin-client) và **Render** (Backend & Vibe-content).

---

## 📋 Tổng Quan

| Service | Platform | URL | Database |
|---------|----------|-----|----------|
| Frontend | Vercel | https://mini-forum.vercel.app | - |
| Admin Client | Vercel | https://admin-mini-forum.vercel.app | - |
| Backend API | Render | https://backend-mini-forum.onrender.com | PostgreSQL |
| Vibe Content | Render | https://vibe-content.onrender.com | PostgreSQL (shared) |

---

## 🚀 Phase 1: Chuẩn bị Render Services

### 1. Setup PostgreSQL Database

**Option A: Render Managed PostgreSQL** (Recommended)
1. Go to [render.com](https://render.com) → Dashboard
2. New + → PostgreSQL
3. Set name: `mini-forum-db`
4. Copy connection string (with SSL)
5. Keep for later use

**Option B: Supabase PostgreSQL**
1. Go to [supabase.com](https://supabase.com)
2. New project → PostgreSQL
3. Copy connection string with `?schema=public&sslmode=require`

### 2. Deploy Backend to Render

**Step-by-step:**

1. **Push code to Git** (GitHub/GitLab)
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Create Render Service**
   - Go to [render.com](https://render.com) → New + → Web Service
   - Connect your Git repository
   - Settings:
     - **Name**: `mini-forum-backend`
     - **Root Directory**: `backend`
     - **Build Command**: `npm ci && npm run build`
     - **Start Command**: `/app/docker-entrypoint.sh` (or) `node dist/index.js`
     - **Environment**: Node
     - **Plan**: Standard/Pro (based on needs)

3. **Set Environment Variables** (copy from `.env.example`):
   ```
   NODE_ENV=production
   PORT=5000
   LOG_LEVEL=info
   
   DATABASE_URL={your_postgres_connection_url}
   DIRECT_URL={your_postgres_direct_url}  # for migrations
   
   JWT_ACCESS_SECRET={generate: openssl rand -base64 32}
   JWT_REFRESH_SECRET={generate: openssl rand -base64 32}
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   
   FRONTEND_URL=https://mini-forum.vercel.app,https://admin.vercel.app
   COMMENT_EDIT_TIME_LIMIT=30
   
   BREVO_API_KEY={your_brevo_key}
   BREVO_FROM_EMAIL=noreply@example.com
   BREVO_FROM_NAME=Mini Forum
   
   IMAGEKIT_PUBLIC_KEY={your_imagekit_key}
   IMAGEKIT_PRIVATE_KEY={your_imagekit_key}
   ```

4. **Deploy**: Click "Deploy" button
5. **Wait for completion** → Copy backend URL (e.g., `https://backend-mini-forum.onrender.com`)

### 3. Deploy Vibe-Content to Render

1. **Create Render Service**
   - New + → Web Service
   - Same repository but different settings
   - **Name**: `mini-forum-vibe-content`
   - **Root Directory**: `vibe-content`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `node dist/src/index.js`

2. **Set Environment Variables** (copy from `.env.example`):
   ```
   NODE_ENV=production
   PORT=4000
   LOG_LEVEL=info
   
   DATABASE_URL={same_postgres_url}
   
   FORUM_API_URL={backend_url}  # e.g., https://backend-mini-forum.onrender.com/api/v1
   BOT_PASSWORD={your_bot_password}
   
   GEMINI_API_KEY={your_gemini_key}
   GROQ_API_KEY={optional}
   BEEKNOEE_API_KEY={optional}
   CEREBRAS_API_KEY={optional}
   
   CRON_SCHEDULE=*/30 * * * *
   BATCH_SIZE=1
   MAX_POSTS_PER_USER_DAY=3
   MAX_COMMENTS_PER_USER_DAY=6
   MAX_VOTES_PER_USER_DAY=15
   PROVIDER_TIMEOUT_MS=30000
   
   RUN_MIGRATIONS=true  # first deploy only
   ```

3. **Deploy** and copy Vibe-Content URL

---

## 🎨 Phase 2: Deploy Frontend & Admin to Vercel

### 1. Frontend Deployment

1. **Login to [vercel.com](https://vercel.com)**
2. **Import Project**
   - Select your Git repository
   - Set:
     - **Framework**: Vite
     - **Root Directory**: `frontend`
   - Click Import

3. **Set Environment Variables**:
   ```
   VITE_API_URL=https://backend-mini-forum.onrender.com/api/v1
   VITE_IMAGE_KIT_URL=https://ik.imagekit.io/your_id
   VITE_IMAGE_KIT_PUBLIC_KEY={your_imagekit_public_key}
   ```

4. **Deploy** → Copy Frontend URL

### 2. Admin-Client Deployment

1. **Add Existing Project** to Vercel
   - Same repository, different configuration
   - **Root Directory**: `admin-client`
   - **Framework**: Vite

2. **Set Environment Variables**:
   ```
   VITE_API_URL=https://backend-mini-forum.onrender.com/api/v1
   ```

3. **Deploy** → Copy Admin URL

### 3. Update Backend CORS

Go to Render Backend → Environment Variables and update:
```
FRONTEND_URL=https://your-frontend.vercel.app,https://your-admin.vercel.app
```

---

## ✅ Verification Checklist

After deployment:

- [ ] **Backend** responds to `GET /api/v1/health`
- [ ] **Frontend** loads without CORS errors
- [ ] **Admin** can login with admin credentials
- [ ] **Database** has tables migrated (check via `prisma studio`)
- [ ] **Vibe-content** runs cron jobs (check logs)
- [ ] **ImageKit** files upload successfully
- [ ] **Email** notifications send (check Brevo logs)

---

## 🔧 Troubleshooting

### Common Issues

**Backend won't start**
- Check logs: `Render Dashboard → Service → Logs`
- Verify `DATABASE_URL` format
- Run migrations manually if needed

**Frontend 404 errors**
- Vercel `vercel.json` has `"outputDirectory": "dist"`
- Routes rewrite to `/index.html` configured

**CORS errors**
- Update `FRONTEND_URL` in Backend environment variables
- Match exact domain (no trailing slash)

**Database connection fails**
- Test connection string locally first
- Ensure SSL is enabled (`?sslmode=require`)
- Check firewall/IP whitelist on database provider

---

## 📝 Production Checklist

- [ ] Environment variables are SECURE (no secrets in code)
- [ ] Database backups configured
- [ ] Email templates configured
- [ ] Image upload limits set
- [ ] Logging level appropriate
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Monitor API performance (Render monitoring)
- [ ] Set up auto-scaling if needed

---

## 🔄 Continuous Deployment

Both Vercel and Render auto-deploy on Git push:
1. Push to `main` branch
2. Vercel/Render automatically builds and deploys
3. Check deployment logs if build fails

---

## 📞 Support

If deployment fails:
1. Check service logs (Render/Vercel dashboard)
2. Verify all environment variables are set
3. Test locally first: `npm run build && npm start`
4. Check database connectivity
