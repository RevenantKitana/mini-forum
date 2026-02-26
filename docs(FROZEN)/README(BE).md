# Mini Forum - Backend

Node.js + Express.js + TypeScript + Prisma ORM

## Prerequisites

- Node.js 18+ (recommend 20 LTS)
- PostgreSQL 14+
- npm or pnpm

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Setup environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update `DATABASE_URL` with your PostgreSQL connection string.

### 3. Setup database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
```

Server will be running at `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | Logout | No |
| POST | `/api/v1/auth/logout-all` | Logout from all devices | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | API health check |

## Test Accounts

After running seed:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@forum.com | Admin@123 |
| Moderator | mod@forum.com | Moderator@123 |
| Member | john@example.com | Member@123 |

## Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run db:generate # Generate Prisma Client
npm run db:migrate  # Run database migrations
npm run db:push     # Push schema changes (development)
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed database with initial data
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── src/
│   ├── config/          # Configuration files
│   ├── constants/       # Constants and enums
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Express middlewares
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validations/     # Zod schemas
│   ├── app.ts           # Express app setup
│   └── index.ts         # Entry point
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
└── nodemon.json
```
