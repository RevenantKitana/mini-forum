# How to Run Tests Locally

This guide explains how to run tests for each service in the mini-forum monorepo.

---

## Prerequisites

| Tool | Min version | Notes |
|------|-------------|-------|
| Node.js | 20 LTS | `node --version` |
| npm | 10+ | `npm --version` |
| PostgreSQL | 14+ | Required for **backend** integration tests only |
| Docker (optional) | any | Alternative to local PostgreSQL |

---

## Quick Start – Run All Unit Tests (No Database)

```bash
# Frontend
cd frontend && npm ci && npm test

# Admin Client
cd admin-client && npm ci && npm test

# Vibe Content
cd vibe-content && npm ci && npm test
```

---

## Backend Tests

Backend tests include **unit tests** (`utils.errors`, `utils.jwt`) and **integration tests** (`auth`, `posts`, `comments`, `votes`, `reports`). Integration tests require a live PostgreSQL database.

### 1. Set up environment variables

Copy the example file and fill in your values:

```bash
cd backend
cp .env.example .env
```

Minimum required variables for tests:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/miniforum_dev
DIRECT_URL=postgresql://USER:PASSWORD@localhost:5432/miniforum_dev
JWT_ACCESS_SECRET=any_random_string_at_least_32_chars_long
JWT_REFRESH_SECRET=another_random_string_at_least_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=test
```

> **Tip – use Docker:** If you don't have PostgreSQL installed, start one quickly:
> ```bash
> docker run -d --name pg-test -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres:16-alpine
> # DATABASE_URL=postgresql://postgres:pass@localhost:5432/postgres
> ```

### 2. Apply migrations and seed data

```bash
cd backend
npx prisma migrate deploy   # apply all migrations
npm run db:seed             # create admin user + categories
```

### 3. Run tests

```bash
# All tests
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# With coverage report
npm run test:coverage

# Only unit tests (no DB required)
npm run test:unit

# Only integration tests
npm run test:integration
```

Coverage HTML report is generated at `backend/coverage/index.html`.

---

## Frontend Tests

Tests use **Vitest** + **jsdom** — no database or running server required.

```bash
cd frontend
npm ci
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Coverage HTML report: `frontend/coverage/index.html`

---

## Admin Client Tests

Same setup as frontend — Vitest + jsdom.

```bash
cd admin-client
npm ci
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Coverage HTML report: `admin-client/coverage/index.html`

---

## Vibe Content Tests

Tests use Node's built-in `node:test` runner — no external test framework.

```bash
cd vibe-content
npm ci
npm test
```

> Note: Coverage reports are not currently supported for vibe-content.

---

## Playwright E2E Smoke Tests

Playwright tests require both the **backend** (with database) and the **frontend** to be running.

### 1. Start the backend

Follow the [Backend Tests](#backend-tests) setup above, then:

```bash
cd backend
npm run dev    # or: node dist/index.js after npm run build
```

### 2. Start the frontend dev server

```bash
cd frontend
VITE_API_URL=http://localhost:5000 npm run dev
```

### 3. Run Playwright tests

```bash
# From the project root
npm run test:e2e

# Open the interactive UI
npx playwright test --ui

# View the HTML report (after a previous run)
npm run test:e2e:report

# Run only on chromium (faster)
npx playwright test --project=chromium
```

Playwright report: `playwright-report/index.html`

---

## Linting / Type-checking

```bash
# Backend (tsc --noEmit)
cd backend && npm run lint

# Frontend (tsc --noEmit + vite build type-check)
cd frontend && npm run lint

# Admin Client (ESLint)
cd admin-client && npm run lint

# Vibe Content (tsc --noEmit)
cd vibe-content && npm run lint
```

---

## CI Pipeline

The CI pipeline runs automatically on every **PR** and every **push** to `main`/`develop`.

| Job | Trigger | Requires DB? |
|-----|---------|--------------|
| `test-backend` | PR + push | Yes (PostgreSQL service) |
| `test-frontend` | PR + push | No |
| `test-admin` | PR + push | No |
| `test-vibe-content` | PR + push | No |
| `e2e` | push to `main` or PR label `run-e2e` | Yes |

### Enable branch protection (block merge on CI failure)

1. Go to **GitHub → Repository → Settings → Branches**
2. Add a **Branch protection rule** for `main` (and `develop`)
3. Check **Require status checks to pass before merging**
4. Add these required checks:
   - `Backend – build & test`
   - `Frontend – build & test`
   - `Admin Client – build & test`
   - `Vibe Content – build & test`
5. Check **Require branches to be up to date before merging**

---

## Coverage Thresholds (Phase 1)

| Service | Lines | Branches | Functions | Statements |
|---------|-------|----------|-----------|------------|
| Backend | 15% | 10% | 15% | 15% |
| Frontend | 10% | 5% | 10% | 10% |
| Admin Client | 10% | 5% | 10% | 10% |

CI fails if coverage drops below these thresholds. Thresholds will be raised in Phase 2.
