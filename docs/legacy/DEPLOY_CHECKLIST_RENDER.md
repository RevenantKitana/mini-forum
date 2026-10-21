# 📋 Deploy Checklist - Mini Forum

**Target**: Vercel (Frontend & Admin) + Render (Backend & Vibe)

---

## Pre-Deployment

- [ ] All code committed to Git (`git push`)
- [ ] `.env` files created locally (copy from `.env.example`)
- [ ] Database backup created (if migrating existing data)
- [ ] All tests pass: `npm test`
- [ ] No console errors/warnings in build: `npm run build`

---

## Render - Backend & Vibe-Content

### PostgreSQL Database Setup
- [ ] Database created (Render Managed or Supabase)
- [ ] Connection string copied (with SSL)
- [ ] Firewall allows external connections
- [ ] Test connection locally: `psql "connection_string"`

### Backend Service
- [ ] Git repository pushed to GitHub
- [ ] Repository connected to Render
- [ ] Service name set: `mini-forum-backend`
- [ ] Root directory: `backend`
- [ ] Environment variables set (from Backend section below)
- [ ] Build command verified: `npm ci && npm run build`
- [ ] Start command verified: `/app/docker-entrypoint.sh` or `node dist/index.js`
- [ ] Service deployed successfully
- [ ] Health check passes: `GET /api/v1/health` → 200 OK
- [ ] Backend URL copied (e.g., `https://backend-mini-forum.onrender.com`)

**Backend Environment Variables**:
```
NODE_ENV=production
PORT=5000
DATABASE_URL={postgres_url_with_ssl}
JWT_ACCESS_SECRET={generated_secret}
JWT_REFRESH_SECRET={generated_secret}
FRONTEND_URL=http://localhost:5173,http://localhost:5174  # Will update after Vercel
BREVO_API_KEY={your_key}
IMAGEKIT_PUBLIC_KEY={your_key}
IMAGEKIT_PRIVATE_KEY={your_key}
```

### Vibe-Content Service
- [ ] Service name: `mini-forum-vibe-content`
- [ ] Root directory: `vibe-content`
- [ ] Environment variables set (from Vibe-Content section below)
- [ ] Database URL: Same as backend (or shared schema)
- [ ] Cron schedule configured: `*/30 * * * *`
- [ ] Service deployed successfully
- [ ] Vibe-Content URL copied

**Vibe-Content Environment Variables**:
```
NODE_ENV=production
PORT=4000
DATABASE_URL={same_postgres_url}
FORUM_API_URL={backend_url}/api/v1
BOT_PASSWORD={secure_password}
GEMINI_API_KEY={your_key}
RUN_MIGRATIONS=true  # First deploy only
```

---

## Vercel - Frontend & Admin-Client

### Frontend
- [ ] Project imported to Vercel
- [ ] Framework: Vite
- [ ] Root directory: `frontend`
- [ ] Environment variables set
- [ ] Build output directory: `dist`
- [ ] Deployed successfully
- [ ] Frontend URL copied (e.g., `https://mini-forum.vercel.app`)

**Frontend Environment Variables**:
```
VITE_API_URL={backend_url}/api/v1
VITE_IMAGE_KIT_URL=https://ik.imagekit.io/{your_id}
VITE_IMAGE_KIT_PUBLIC_KEY={your_key}
```

### Admin-Client
- [ ] Project imported to Vercel (same repo, different config)
- [ ] Root directory: `admin-client`
- [ ] Environment variables set
- [ ] Deployed successfully
- [ ] Admin URL copied (e.g., `https://admin.vercel.app`)

**Admin-Client Environment Variables**:
```
VITE_API_URL={backend_url}/api/v1
```

---

## Post-Deployment Verification

### Backend Health
- [ ] `GET {backend_url}/api/v1/health` → `{ status: "ok" }`
- [ ] Database migrations applied
- [ ] Prisma Studio accessible (if enabled)

### Frontend Access
- [ ] Frontend loads without 404/CORS errors
- [ ] Can fetch from backend API
- [ ] Image kit uploads work

### Admin Panel
- [ ] Can login with admin credentials
- [ ] Can see dashboard
- [ ] Can perform admin operations

### Vibe-Content
- [ ] Service is running
- [ ] Logs show cron jobs running
- [ ] Content generation working

### Update Backend CORS
After getting Vercel URLs:
- [ ] Update Backend `FRONTEND_URL` environment variable
- [ ] Redeploy Backend or trigger rebuild
- [ ] Test CORS requests from Frontend

---

## Monitoring & Logs

- [ ] Render Backend logs accessible
- [ ] Render Vibe-Content logs accessible
- [ ] Vercel Deployment logs reviewed
- [ ] No errors in Vercel build logs
- [ ] Monitor Render metrics (CPU, Memory)
- [ ] Set up alerts for service downtime

---

## Rollback Plan

If deployment fails:
- [ ] Previous commit available on Git
- [ ] Database backups created
- [ ] Can redeploy to specific commit
- [ ] Local testing environment intact

---

## Environment Variables Summary

### Required Secrets (Generate/Obtain Before Deploy)
```
JWT_ACCESS_SECRET        # openssl rand -base64 32
JWT_REFRESH_SECRET       # openssl rand -base64 32
BREVO_API_KEY            # From brevo.com
IMAGEKIT_PUBLIC_KEY      # From imagekit.io
IMAGEKIT_PRIVATE_KEY     # From imagekit.io
GEMINI_API_KEY          # From Google AI Studio
BOT_PASSWORD            # Secure password for bot user
```

---

## Final Checklist
- [ ] All services deployed and running
- [ ] All environment variables set
- [ ] Health checks passing
- [ ] No critical errors in logs
- [ ] Frontend ↔ Backend communication working
- [ ] Database operations functioning
- [ ] Ready for user access!

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Status**: ✅ Complete / ⚠️ Issues / ❌ Failed  

**Notes**:
```
_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________
```
