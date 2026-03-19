# 🚀 Deployment Plan: DA-Mini-Forum

**Target Stack**: Node/Express FE (Vercel) → BE (Railway/Render) → DB (Supabase)  
**Version**: 1.0.0  
**Created**: 2026-03-19  
**Estimated Cost**: $0-5/month (depends on usage)

---

## 📋 Mục lục

1. [Phân tích dự án](#1-phân-tích-dự-án)
2. [Architecture](#2-architecture)
3. [Chuẩn bị code](#3-chuẩn-bị-code)
4. [Setup Supabase](#4-setup-supabase)
5. [Deploy Backend](#5-deploy-backend)
6. [Deploy Frontend](#6-deploy-frontend)
7. [Environment Variables](#7-environment-variables)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Timeline & Checklist](#10-timeline--checklist)

---

## 1. Phân tích dự án

### 1.1 Project Structure

```
DA-mini-forum/
├── backend/                (Node.js + Express API)
│   ├── src/
│   ├── prisma/            (Database schema + migrations)
│   ├── jest.config.js
│   ├── package.json       (Main: ^18.0.0)
│   └── .env.example
├── frontend/              (React + Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── admin-client/          (React + Vite Admin Panel)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── e2e/                   (Playwright tests)
├── docker-compose.yml
└── package.json           (monorepo root)
```

### 1.2 Tech Stack Analysis

| Component | Tech | Version | Deploy | Notes |
|-----------|------|---------|--------|-------|
| Backend | Express + TypeScript | ^4.21.1 | Railway/Render | Port: 5000 |
| Frontend | React + Vite | ^18.2.0 | Vercel | SPA (Client-side routing) |
| Admin | React + Vite | ^18.2.0 | Vercel/Netlify | Separate app |
| Database | PostgreSQL | 15+ | Supabase | Prisma ORM |
| Authentication | JWT | - | Backend | JWT tokens via API |
| ORM | Prisma | ^5.22.0 | - | Migrations required |

### 1.3 Dependencies Review

**Backend Production Dependencies:**
- `express` - API server
- `@prisma/client` - Database ORM
- `jsonwebtoken` - Auth
- `bcrypt` - Password hashing
- `cors` - Cross-origin
- `helmet` - Security headers
- `express-rate-limit` - Request throttling
- `nodemailer` - Email service
- `zod` - Input validation
- `morgan` - Logging

**Backend DevDependencies:**
- `typescript` - Type safety
- `jest` + `supertest` - Testing
- `ts-jest` - TypeScript support for Jest
- `nodemon` - Development reload

**Frontend Dependencies:**
- `react`, `react-dom` - Frontend framework
- `@tanstack/react-query` - Data fetching & caching
- `axios` - HTTP client
- `@radix-ui/` - UI components
- `tailwindcss` - Styling

### 1.4 Environment Requirements

**Backend (.env)**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host/db
JWT_ACCESS_SECRET=(min 32 chars)
JWT_REFRESH_SECRET=(min 32 chars)
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Frontend (.env)**
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_API=false
```

**Admin (.env)**
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_API=false
```

---

## 2. Architecture

### 2.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                      │
├─────────────────────────┬──────────────────────────────────┤
│ yourdomain.com (Vercel) │ admin.yourdomain.com (Vercel)    │
│ - React App             │ - Admin Dashboard                │
│ - Static hosting        │ - Static hosting                 │
│ - Auto CI/CD from Git   │ - Auto CI/CD from Git            │
└──────────────┬──────────┴────────────────┬──────────────────┘
               │                          │
               └──────────┬───────────────┘
                          │ HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────┐
│         api.yourdomain.com (Railway/Render)                 │
│              Node.js + Express Server                        │
│  - REST API endpoints                                        │
│  - JWT Authentication                                        │
│  - Business logic                                            │
│  - Database connection                                       │
│  - Rate limiting & Security                                 │
└──────────┬───────────────────────────────────────────────────┘
           │ DATABASE_URL (PostgreSQL connection string)
           ▼
┌──────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Auth)                    │
│  - Managed PostgreSQL database                              │
│  - Automatic backups                                         │
│  - Point-in-time recovery                                   │
│  - 500MB free tier / $25/month for more                     │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **User** → Accesses `yourdomain.com` (Vercel CDN)
2. **Browser** → Loads React app (static files cached globally)
3. **Frontend App** → Makes API calls to `api.yourdomain.com`
4. **Backend** → Validates JWT, executes business logic
5. **Backend** → Queries Supabase PostgreSQL via Prisma
6. **Response** → Returns JSON → Frontend → Renders UI

### 2.3 Cost Breakdown

| Service | Free Tier | Cost | Notes |
|---------|-----------|------|-------|
| **Vercel** | ✅ Included | $0 | Unlimited deployments, builds, edge functions |
| **Railway/Render** | ⏸️ $5 credit | $5-15/mo | Billable when free tier exhausted (Bengal: $5/500gb-hrs) |
| **Supabase** | ✅ Included | $0-25/mo | 500MB free, $25/mo = 8GB, Auto-scaling |
| **Total** | - | ~$0-5/month* | *Low traffic apps stay in free tier |

---

## 3. Chuẩn bị code

### 3.1 Code Changes Required

#### ✅ Backend

**File: `backend/src/config/index.ts`**
- Verify all environment variables are set
- Add production defaults for optional configs

**File: `backend/package.json`**
```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon",
    "db:generate": "prisma generate",
    "test": "jest"
  }
}
```

**File: `backend/.env.example` → Backend provider config**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_ACCESS_SECRET=your-secure-secret-at-least-32-chars-long
JWT_REFRESH_SECRET=your-refresh-secret-at-least-32-chars-long
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
SMTP_FROM=noreply@yourdomain.com
```

**File: `backend/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### ✅ Frontend & Admin

**File: `frontend/package.json`**
```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  }
}
```

**File: `frontend/.env.example`**
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_API=false
```

**File: `frontend/vite.config.ts`**
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
    minify: 'terser'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});
```

**File: `admin-client/.env.example`**
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_API=false
```

### 3.2 Deployment Configuration Files

#### Create `backend/Dockerfile`
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY prisma ./prisma
EXPOSE 5000
CMD ["npm", "start"]
```

#### Create `backend/.dockerignore`
```
node_modules
npm-debug.log
dist
.env
.env.local
.git
.gitignore
README.md
```

### 3.3 Migration Strategy

**Backend: Database Migrations**
```bash
# Local
npm run db:generate    # Generate Prisma client
npm run db:migrate    # Create migrations

# Production (automatic during deployment)
npm run db:push       # Push schema to Supabase
npm run db:seed       # Optional: seed initial data
```

---

## 4. Setup Supabase

### 4.1 Create Supabase Project

**Steps:**

1. Go to [supabase.com](https://supabase.com) → Sign up/Login
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `da-mini-forum-prod`
   - **Password**: Generate strong password (save to password manager)
   - **Region**: Select closest to your users (e.g., Singapore, Tokyo)
4. **Create Project** (wait 5-10 minutes)

### 4.2 Get Connection String

1. Go to **Project Settings** → **Database**
2. Find **Connection String** section
3. Copy **URI** format:
   ```
   postgresql://[user]:[password]@[host]:5432/[database]
   ```
4. Store as `DATABASE_URL` environment variable

### 4.3 Configure Prisma

**File: `backend/prisma/schema.prisma`**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ... rest of schema
```

### 4.4 Run Initial Migration

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Create & run migrations
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

### 4.5 Supabase Configuration

**Recommended Settings:**

| Setting | Value | Reason |
|---------|-------|--------|
| **Connection Pooling** | Enabled (PgBouncer) | Better connection management |
| **Backups** | Daily | Point-in-time recovery |
| **SSL** | Required | Encrypt data in transit |
| **Network** | Restrict to Backend IP | Added security |

**Enable in Supabase:**
1. **Database** → **Connection Pooling**
   - Mode: `Transaction` (for serverless backends)
   - Set Min/Max connections
2. **Database** → **Backups**
   - Retention: 7 days (included in free tier)
3. **Security** → **SSL enforcement**
   - Set to "Require"

---

## 5. Deploy Backend

### 5.1 Option A: Railway (Recommended)

#### Setup

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. **Create New Project** → **Deploy from GitHub**
3. Select your repository
4. Railway auto-detects Node.js project
5. Follow the setup wizard

#### Configuration

**File: `railway.toml`** (optional)
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run build && npm start"
restartPolicyMaxRetries = 5
```

**Environment Variables in Railway Dashboard:**

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | Manual |
| `PORT` | `5000` | Manual (Railway sets this) |
| `DATABASE_URL` | `postgresql://...` | Supabase |
| `JWT_ACCESS_SECRET` | (32+ char) | Generate: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | (32+ char) | Generate: `openssl rand -base64 32` |
| `CORS_ORIGIN` | `https://yourdomain.com,...` | Your domains |
| `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP |
| `SMTP_PORT` | `587` | Gmail port |
| `SMTP_USER` | `your-email@gmail.com` | Your email |
| `SMTP_PASSWORD` | (app password) | Gmail App Password |
| `SMTP_FROM` | `noreply@yourdomain.com` | Your domain |

#### Deploy Steps

1. Click **Deploy** button
2. Railway builds & deploys
3. Get public URL: `https://*.railway.app`
4. Test API: `https://*.railway.app/api/v1/health`

#### Post-Deploy

```bash
# SSH into Railway container
railway shell

# Run migrations
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

### 5.2 Option B: Render

#### Setup

1. Go to [render.com](https://render.com)
2. **New +** → **Web Service**
3. Connect GitHub repository
4. Select branch and service

#### Configuration

**Create `render.yaml` in root:**
```yaml
services:
  - type: web
    name: da-mini-forum-api
    runtime: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: supabase
          property: connectionString
```

**Manual Configuration in Render Dashboard:**

1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`
3. **Node Version**: `18`
4. Add all environment variables (same as Railway)

#### Deploy & Monitor

1. Render auto-deploys on push to main branch
2. View logs in Render Dashboard
3. Get URL: `https://da-mini-forum-api.onrender.com`

### 5.3 Backend Verification Post-Deploy

```bash
# Health check
curl https://api.yourdomain.com/api/v1/health

# Expected response:
{
  "success": true,
  "message": "Server is running healthy"
}

# Database test
curl -X GET https://api.yourdomain.com/api/v1/categories

# Auth test
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@forum.com","password":"Admin@123"}'
```

---

## 6. Deploy Frontend

### 6.1 Frontend on Vercel

#### Setup

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **Add New...** → **Project**
3. Select your GitHub repository
4. **Import Project**

#### Configuration

Vercel auto-detects:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Override if needed:**

| Setting | Value |
|---------|-------|
| **Framework Present** | Detect |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm ci` |
| **Node Version** | 18.x |

#### Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**:

```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_API=false
```

#### Deploy

1. Click **Deploy**
2. Vercel builds & deploys automatically
3. Get URL: `https://yourdomain.vercel.app` (or your domain)

### 6.2 Admin Dashboard on Vercel (Separate Project)

#### Setup

1. Create separate Vercel project for admin-client
2. Same process as frontend
3. Set environment variables:

```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_API=false
```

#### URL Structure

```
└── Your Repository
    ├── Frontend → yourdomain.com (Vercel)
    └── Admin    → admin.yourdomain.com (Vercel)
```

**Option**: Deploy both from same repo → create separate Vercel projects → override **Root Directory**:
- Frontend: `./frontend`
- Admin: `./admin-client`

### 6.3 Custom Domains

#### Connect Domain to Vercel

1. **Vercel Dashboard** → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter `yourdomain.com`

**Two Options:**

**Option A: Vercel Nameservers (Recommended)**
1. Copy Vercel nameservers
2. Update domain registrar DNS pointing to Vercel
3. Wait 24-48 hours for propagation

**Option B: CNAME Record**
1. Add CNAME: `yourdomain.com` → `cname.vercel-dns.com`
2. Propagates faster (minutes)

#### Configure Subdomain for Admin

```
admin.yourdomain.com → admin-vercel-project.vercel.app
```

Same process, use CNAME or NS records.

### 6.4 HTTPS/SSL

✅ **Automatic**: Vercel provides free SSL certificates (auto-renewed)

### 6.5 Frontend Verification

```bash
# Test main frontend
curl https://yourdomain.com

# Test admin
curl https://admin.yourdomain.com

# Check API calls
curl https://api.yourdomain.com/api/v1/health
```

---

## 7. Environment Variables

### 7.1 Backend Environment Variables

**Railway/Render Environment Setup:**

```bash
# Database
DATABASE_URL=postgresql://user:pass@db.host:5432/db

# Security
NODE_ENV=production
PORT=5000
JWT_ACCESS_SECRET=your-secure-token-min-32-chars-abc123def456ghi789
JWT_REFRESH_SECRET=your-refresh-token-min-32-chars-xyz789abc456def123

# CORS
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@yourdomain.com

# Optional
LOG_LEVEL=info
API_VERSION=v1
```

**Generate Secure Secrets:**

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(24))
```

### 7.2 Frontend Environment Variables

**Vercel Environment:**

```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_API=false
```

### 7.3 Gmail SMTP Configuration (for production emails)

1. **Enable 2FA** on Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Select "App passwords"
   - Generate password for "Mail" + "Windows Computer"
   - Copy to `SMTP_PASSWORD`
3. Alternative: Use nodemailer-smtp-transport with OAuth2

---

## 8. CI/CD Pipeline

### 8.1 GitHub Actions (Optional but Recommended)

**File: `.github/workflows/backend-ci.yml`**

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'package*.json'
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: mini_forum_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install backend dependencies
        run: |
          cd backend
          npm ci

      - name: Generate Prisma
        run: |
          cd backend
          npm run db:generate

      - name: Run tests
        run: |
          cd backend
          npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mini_forum_test

      - name: Build
        run: |
          cd backend
          npm run build

  deploy:
    needs: build-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        run: |
          npx railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**File: `.github/workflows/frontend-ci.yml`**

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - 'admin-client/**'
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci

      - name: Build frontend
        run: |
          cd frontend
          npm run build

      - name: Install admin dependencies
        run: |
          cd admin-client
          npm ci

      - name: Build admin
        run: |
          cd admin-client
          npm run build

  # Vercel auto-deploys on push, no manual deploy step needed
```

---

## 9. Monitoring & Logging

### 9.1 Backend Logging

**File: `backend/src/config` - logging setup**

```typescript
// Production logging
if (config.nodeEnv === 'production') {
  // Log to stdout (Railway/Render captures automatically)
  console.log('[INFO]', message);
  console.error('[ERROR]', error);
} else {
  // Development detailed logging
  console.log('[DEBUG]', message);
}
```

### 9.2 Railway/Render Monitoring

**Railway Dashboard:**
- **Logs**: View real-time logs
- **Metrics**: CPU, Memory, Network
- **Alerts**: Set up email notifications

**Render Dashboard:**
- **Logs**: Real-time streaming logs
- **Metrics**: Environment metrics
- **Health Checks**: Automatic endpoint monitoring

### 9.3 Uptime Monitoring

**Recommended: UptimeRobot** (free tier)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add Monitor → HTTP
3. Set URL: `https://api.yourdomain.com/api/v1/health`
4. Check Interval: 5 minutes
5. Alerts: Email notification

### 9.4 Error Tracking (Optional)

**Sentry Integration:**

1. Create account on [sentry.io](https://sentry.io)
2. Create project (Node.js)
3. Install: `npm install --save @sentry/node`
4. Initialize in `backend/src/app.ts`:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 10. Timeline & Checklist

### Phase 1: Preparation (Day 1-2)

- [ ] Create SSH keys for deployments
- [ ] Generate JWT secrets (32+ chars)
- [ ] Prepare Gmail app password for SMTP
- [ ] Review environment variables
- [ ] Test `.env` locally
- [ ] Test database migrations locally
- [ ] Run full test suite locally

### Phase 2: Database Setup (Day 2)

- [ ] Create Supabase account
- [ ] Create project in Supabase
- [ ] Get `DATABASE_URL` connection string
- [ ] Enable connection pooling
- [ ] Configure backups
- [ ] Test connection locally
- [ ] Run migrations locally
- [ ] Seed initial data

### Phase 3: Backend Deployment (Day 3)

- [ ] Create Railway account (or Render)
- [ ] Connect GitHub repository
- [ ] Set all environment variables
- [ ] Deploy backend
- [ ] Test API endpoints
- [ ] Run migrations on production
- [ ] Verify database is working
- [ ] Test authentication flows

### Phase 4: Frontend Deployment (Day 3-4)

- [ ] Create Vercel account
- [ ] Import frontend repository
- [ ] Set environment variables
- [ ] Deploy frontend
- [ ] Test frontend on Vercel domain
- [ ] Configure custom domain
- [ ] Test API integration

### Phase 5: Admin Dashboard (Day 4)

- [ ] Create second Vercel project for admin-client
- [ ] Set environment variables
- [ ] Deploy admin dashboard
- [ ] Configure subdomain (admin.yourdomain.com)
- [ ] Test admin functionality

### Phase 6: Monitoring & Security (Day 5)

- [ ] Setup UptimeRobot monitoring
- [ ] Configure SSL/HTTPS (auto-done by Vercel)
- [ ] Setup error tracking (Sentry)
- [ ] Enable CORS properly
- [ ] Enable rate limiting
- [ ] Review security headers
- [ ] Test with production data

### Phase 7: Go Live (Day 5-6)

- [ ] All tests passing
- [ ] All endpoints verified
- [ ] Performance acceptable
- [ ] Monitoring in place
- [ ] Backup strategy confirmed
- [ ] DNS pointing to Vercel
- [ ] Domain SSL active
- [ ] Launch announcement

---

## 11. Cost Calculation

### Year 1 Estimate (Low Traffic: <1000 users/month)

| Service | Free Tier | Extra Cost | Notes |
|---------|-----------|-----------|-------|
| **Vercel** | Unlimited | $0 | Includes builds, deployments, edge functions |
| **Railway** | $5 credit | $0-5/month* | After $5 credit exhausted |
| **Supabase** | 500MB | $0** | Enough for most small forums |
| **UptimeRobot** | Free | $0 | Basic monitoring included |
| **Domain** | - | $10-15/year | .com domain via Namecheap, etc. |
| **Email (Gmail)** | Free | $0 | Unlimited SMTP with app password |
| **Total/Month** | - | **$0-5*** | Depends on backend usage |
| **Total/Year** | - | **$0-65*** | Plus domain registration |

\* Railway (Bengal): $5 per 500GB-hours. Low-traffic app ~$0/month
\** Supabase: First 500MB free, upgrade to $25/month = 8GB

### Scale Up Estimate (Medium: 10k-100k users/month)

| Service | Free Tier | Cost | Monthly Total |
|---------|-----------|------|----------------|
| **Vercel** | - | $20/month | Pro plan for 100GB bandwidth |
| **Railway** | - | $10-20/month | Based on usage |
| **Supabase** | - | $25-100/month | 8GB-32GB storage |
| **Email Service** | - | $10-20/month | SendGrid/Mailgun for reliability |
| **Monitoring** | - | $0/month | UptimeRobot free tier |
| **Total/Month** | - | **$65-165** | Scales with usage |

---

## 12. Troubleshooting Guide

### Issue: Database Connection Timeout

**Symptoms**: Backend crashes on startup with "connection timeout"

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check Supabase project is active (not sleeping)
3. Enable connection pooling in Supabase
4. Whitelist Railway/Render IP in Supabase firewall

### Issue: CORS Errors in Frontend

**Symptoms**: Browser console shows "Access to XMLHttpRequest blocked by CORS policy"

**Solution**: Update backend `CORS_ORIGIN` environment variable
```bash
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com,https://*.vercel.app
```

### Issue: JWT Token Invalid

**Symptoms**: Login works locally but fails on production

**Solution:**
1. Verify `JWT_ACCESS_SECRET` in production matches locally
2. Ensure secrets are exactly 32+ characters
3. Check backend is using environment variables (not hardcoded)

### Issue: Email Not Sending

**Symptoms**: Forgot password email not working

**Solutions:**
1. Enable "Less secure app access" in Gmail
2. Use app-specific password (2FA enabled)
3. Check `SMTP_*` variables are set correctly
4. Test with: `npm run test:email` (if available)

### Issue: High Database Costs

**Symptoms**: Supabase bill unexpectedly high

**Solutions:**
1. Enable query optimization
2. Add database indexes on frequently queried columns
3. Archive old logs/audit_logs
4. Monitor query performance with Supabase analytics

### Issue: Slow Frontend Performance

**Symptoms**: Website slow to load

**Solutions:**
1. Enable Vercel Analytics (see performance metrics)
2. Check bundle size: `npm run build -- --report`
3. Optimize images (use WebP format)
4. Enable gzip compression (Vercel auto-enables)
5. Use Vercel Edge Caching

### Issue: 502 Bad Gateway

**Symptoms**: "502 Bad Gateway" from Railway/Render

**Solutions:**
1. Check backend logs for crashes
2. Verify database connection string
3. Ensure environment variables are set
4. Restart backend service
5. Check Railway/Render quota not exceeded

---

## 13. Production Checklist

### Pre-Launch

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Backup strategy confirmed (Supabase daily backups)
- [ ] SSL/HTTPS working on all domains
- [ ] CORS configured for all frontend domains
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet.js)
- [ ] Error handling working properly
- [ ] Logging in place
- [ ] Uptime monitoring active

### Performance

- [ ] Frontend: Lighthouse score >90
- [ ] Backend: Response time <200ms
- [ ] Database: Query execution <100ms
- [ ] No console errors in Chrome DevTools
- [ ] All images optimized
- [ ] Unnecessary dependencies removed

### Security

- [ ] SSL/HTTPS enforced
- [ ] CORS whitelist only trusted domains
- [ ] Rate limiting on all API routes
- [ ] JWT secrets are strong & unique
- [ ] No secrets hardcoded in code
- [ ] No admin credentials in public repos
- [ ] HTTPS on all connections
- [ ] Input validation on all endpoints

### Testing

- [ ] Unit tests pass (Jest)
- [ ] Integration tests pass
- [ ] E2E tests pass (Playwright)
- [ ] All API endpoints tested
- [ ] Authentication flows verified
- [ ] Error cases handled

---

## 14. Deployment Commands Quick Reference

### Backend Deployment

```bash
# Local testing
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev

# Build for production
npm run build

# Manual deployment to Railway
railway up

# View logs
railway logs

# SSH into Railway container
railway shell
```

### Frontend Deployment

```bash
cd frontend

# Build
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel (if using CLI)
vercel --prod
```

### Admin Dashboard Deployment

```bash
cd admin-client
npm run build
vercel --prod
```

### Database Management

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ DANGEROUS - deletes all data)
npx prisma migrate reset

# Open Prisma Studio (local only)
npm run db:studio
```

---

## 15. Maintenance & Updates

### Regular Tasks

**Weekly:**
- [ ] Check uptime monitoring alerts
- [ ] Monitor error tracking (if using Sentry)
- [ ] Review API performance metrics

**Monthly:**
- [ ] Update dependencies: `npm update`
- [ ] Review database backups in Supabase
- [ ] Check Vercel & Railway metrics
- [ ] Review CORS configuration

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Update Node.js if new LTS available
- [ ] Blue-green deployment testing

### Keeping Updated

**Node.js LTS:**
```bash
# Check current version
node --version

# Update in Railway/Render:
# 1. Update runtime in configuration
# 2. Rebuild and redeploy
# 3. Test thoroughly
```

**Dependencies:**
```bash
# Check for outdated packages
npm outdated

# Update minor versions
npm update

# Update major versions (breaking changes)
npm install package-name@latest
npm test  # Verify nothing broke
```

---

## References

- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Express Security**: https://expressjs.com/en/advanced/best-practice-security.html
- **Node.js Security**: https://nodejs.org/en/docs/guides/security

---

**Next Steps:**
1. Review this plan with team
2. Create accounts (Supabase, Railway/Render, Vercel)
3. Start Phase 1: Preparation
4. Update timeline based on team capacity

**Questions?** - Update this plan as you discover new requirements!

---

*Last Updated: 2026-03-19*  
*Version: 1.0.0*
