# 🗄️ Database Setup Guide

Quick reference for setting up PostgreSQL and running migrations for Mini Forum.

---

## Option 1: Render Managed PostgreSQL (Recommended for Production)

1. **Create Database**
   - Go to [render.com](https://render.com) → Dashboard
   - Click "New +" → "PostgreSQL"
   - Configure:
     - **Name**: `mini-forum-db`
     - **Database**: `mini_forum`
     - **User**: `postgres` (or custom)
     - **Version**: 15 or latest
     - **Region**: Same as your services

2. **Copy Connection String**
   - Connection string format: `postgresql://user:password@host:port/database?schema=public&sslmode=require`
   - Keep this for environment variables

3. **Set as Environment Variables**
   ```
   DATABASE_URL={connection_string}
   DIRECT_URL={connection_string_without_pooling}  # For migrations
   ```

---

## Option 2: Supabase PostgreSQL (Free tier available)

1. **Sign up** at [supabase.com](https://supabase.com)
2. **Create Project**
   - Set strong password
   - Select region
3. **Connection Details**
   - Found in Settings → Database → Connection String
   - Use format with `sslmode=require`

---

## Option 3: Local PostgreSQL (Development)

### Windows
```powershell
# Install via chocolatey or PostgreSQL installer
choco install postgresql

# Start service
net start postgresql-x64-15

# Create database
createdb mini_forum

# Connect to test
psql -U postgres -d mini_forum
```

### macOS
```bash
brew install postgresql
brew services start postgresql

createdb mini_forum
psql -U postgres -d mini_forum
```

### Linux
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

sudo -u postgres createdb mini_forum
```

---

## Running Migrations

### On Backend Deployment (Render)

The `docker-entrypoint.sh` automatically runs migrations on service startup.

**Manual migration** (if needed):
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### Local Development

```bash
# Add `.env` file first
cp .env.example .env
# Fill in: DATABASE_URL

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# View in Prisma Studio
npm run db:studio
```

---

## Database Schema Overview

### Key Tables
- **users**: Forum users (with roles: user, moderator, admin)
- **posts**: Forum posts with content blocks
- **comments**: Comments on posts
- **tags**: Forum tags/categories
- **votes**: User votes on posts/comments
- **reports**: Moderation reports
- **audit_logs**: Admin activity logs
- **bot_users**: Bot accounts for content generation

### Relations
```
User
├── Posts (1:many)
├── Comments (1:many)
├── Votes (1:many)
└── AuditLogs (1:many)

Post
├── Comments (1:many)
├── Votes (1:many)
├── Tags (many:many)
└── Reports (1:many)
```

---

## Seeding Database

### Seed Initial Data (Admin User, Bot Users, Tags)

#### Backend Initial Seed
```bash
cd backend

# Create admin user & initial data
npm run db:seed
```

**Admin credentials** (from seed):
```
Email: admin@miniforum.com
Password: AdminPassword123!
```

#### Vibe-Content Bot Users
```bash
cd vibe-content

# Seed bot users & tags
npm run seed:bots
npm run seed:tags

# Or both
npm run seed:all
```

---

## Connection Testing

### Test Connection Locally
```bash
# PowerShell (Windows)
$env:DATABASE_URL = "postgresql://user:pass@localhost/mini_forum"
psql $env:DATABASE_URL

# Bash (macOS/Linux)
export DATABASE_URL="postgresql://user:pass@localhost/mini_forum"
psql $DATABASE_URL
```

### Test Render/Supabase
```bash
# Copy connection string from provider
psql "postgresql://user:password@host:6543/database?sslmode=require"
```

### Test in Node.js
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected:', result);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

---

## Common Issues & Solutions

### Connection Refused
**Problem**: `ECONNREFUSED`
- **Solution**: PostgreSQL not running. Start service and verify PORT

### SSL Certificate Error
**Problem**: `CERTIFICATE_VERIFY_FAILED`
- **Solution**: Add `?sslmode=require` to connection string

### Migration Fails
**Problem**: `P3005` (database already exists)
- **Solution**: Run `prisma migrate resolve --applied {migration_name}`

### Prisma Generate Error
**Problem**: Can't find Prisma schema
- **Solution**: Ensure `prisma/schema.prisma` exists and path is correct

### Connection Pool Exhausted
**Problem**: Too many connections
- **Solution**: Use connection pooling (Render provides `pooler.supabase.com`)

---

## Backup & Restore

### Backup Database

**Using pg_dump**:
```bash
pg_dump -U postgres -h localhost mini_forum > backup.sql
```

**On Render**: Automated backups available in Dashboard

**On Supabase**: Backups in Settings → Database → Backups

### Restore Database

```bash
psql -U postgres -h localhost mini_forum < backup.sql
```

---

## Development vs Production

| Feature | Development | Production |
|---------|-------------|-----------|
| Database | Local/Docker | Managed (Render/Supabase) |
| SSL | Optional | Required |
| Backups | Manual | Automatic (daily) |
| Scaling | Single instance | Can scale |
| Monitoring | Basic logs | Dashboards available |
| Cost | Free | Paid |

---

## Environment Variables Template

```bash
# .env (for local development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/mini_forum?schema=public

# .env (for Render production)
DATABASE_URL=postgresql://user:password@host:6543/database?schema=public&sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?schema=public&sslmode=require
```

---

## Next Steps

1. ✅ Choose database provider (Render/Supabase/Local)
2. ✅ Create database instance
3. ✅ Set CONNECTION STRING in environment
4. ✅ Run migrations: `npm run db:migrate`
5. ✅ Seed initial data: `npm run db:seed`
6. ✅ Verify with Prisma Studio: `npm run db:studio`
7. ✅ Start backend: `npm run dev`

---

**Last Updated**: April 25, 2026
