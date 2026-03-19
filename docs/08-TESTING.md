# Testing

> **Version**: v1.25.1  
> **Last Updated**: 2026-03-19

---

## Mục lục

1. [Trạng thái hiện tại](#1-trạng-thái-hiện-tại)
2. [Testing Pyramid & Stack](#2-testing-pyramid--stack)
3. [Backend Testing (Jest + Supertest)](#3-backend-testing-jest--supertest)
4. [Frontend Testing (Vitest + RTL)](#4-frontend-testing-vitest--rtl)
5. [E2E Testing (Playwright)](#5-e2e-testing-playwright)
6. [Manual Testing](#6-manual-testing)
7. [Coverage Goals](#7-coverage-goals)
8. [CI/CD Integration](#8-cicd-integration)
9. [Debugging Guides](#9-debugging-guides)

---

## 1. Trạng thái hiện tại

| Loại test | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Unit tests (Backend) | ✅ Implemented | Jest + ts-jest — 19 tests passing |
| Integration tests (Backend) | ✅ Implemented | Supertest — 8 tests passing |
| Unit tests (Frontend) | ✅ Implemented | Vitest + RTL — 13 tests passing |
| E2E tests | ✅ Scaffolded | Playwright — 4 spec files, cần chạy với server running |
| Manual testing | ✅ | Tất cả features đã test thủ công |
| Load testing | ❌ Chưa có | Chưa benchmark |

**Tổng hiện tại: 40 automated tests — tất cả đang pass ✅**

---

## 2. Testing Pyramid & Stack

```
        ┌─────────┐
        │  E2E    │   ← Playwright (4 spec files)
        ├─────────┤
        │ Integr. │   ← Supertest (auth: 8 tests)
        ├─────────┤
        │  Unit   │   ← Jest/Vitest (27 backend + 13 frontend)
        └─────────┘
```

| Layer | Tool | Trạng thái |
|-------|------|:----------:|
| Unit (Backend) | Jest + ts-jest | ✅ 27 tests |
| Unit (Frontend) | Vitest + React Testing Library | ✅ 13 tests |
| Integration | Supertest + Jest | ✅ 8 tests |
| E2E | Playwright | ⚙️ Scaffolded |
| Load | k6 hoặc Artillery | ❌ Chưa có |

---

## 3. Backend Testing (Jest + Supertest)

### Cấu hình

**File cấu hình:** `backend/jest.config.js`

```js
// backend/jest.config.js (highlights)
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 10000,
  forceExit: true,       // đóng Prisma connection sau khi tests xong
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }
}
```

### Chạy tests

Từ thư mục `backend/`:

```bash
# Chạy tất cả tests
npm test

# Watch mode (re-run khi file thay đổi)
npm run test:watch

# Với coverage report
npm run test:coverage
# Report: backend/coverage/index.html

# Chỉ unit tests
npm run test:unit

# Chỉ integration tests
npm run test:integration
```

### Test files hiện tại

```
backend/src/__tests__/
├── utils.errors.test.ts          # 10 unit tests — Error classes
├── utils.jwt.test.ts             # 9 unit tests  — JWT utils
└── auth.integration.test.ts      # 8 integration — Auth API endpoints
```

#### `utils.errors.test.ts` (10 tests)
Kiểm tra toàn bộ custom error classes:
- `AppError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`
- `NotFoundError`, `ConflictError`, `ValidationError`, `InternalServerError`

#### `utils.jwt.test.ts` (9 tests)
Kiểm tra JWT utilities:
- `generateAccessToken`, `generateRefreshToken`, `generateTokenPair`
- `verifyAccessToken` / `verifyRefreshToken` — valid, invalid, tampered tokens

#### `auth.integration.test.ts` (8 tests)
Integration tests cho Auth API endpoints (cần database running):
- `POST /api/v1/auth/login` — valid/invalid credentials, validation errors
- `POST /api/v1/auth/refresh` — token refresh flow
- `POST /api/v1/auth/logout` — logout với cleanup

### Viết backend test mới

```typescript
// backend/src/__tests__/my-feature.test.ts
import { describe, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

describe('My Feature', () => {
  afterAll(async () => {
    await prisma.$disconnect(); // đóng connection sau tests
  });

  it('should do something', async () => {
    const res = await request(app)
      .get('/api/v1/my-endpoint')
      .expect(200);
    
    expect(res.body.success).toBe(true);
  });
});
```

### Ưu tiên mở rộng

| Module | Test cases cần thêm | Priority |
|--------|--------------------:|:--------:|
| `utils/slug.ts` | Slug generation, uniqueness | P1 |
| `utils/response.ts` | Response formatters | P1 |
| `services/authService.ts` | Register, login, refresh | P0 |
| `services/postService.ts` | CRUD + permissions | P0 |
| `services/commentService.ts` | Nested comments, 30-min edit | P1 |
| `services/voteService.ts` | Polymorphic vote logic | P1 |
| `POST /posts` | Auth required, validation | P1 |
| `POST /posts/:id/vote` | Vote, change, self-vote | P1 |
| `GET /admin/dashboard` | Admin-only access | P1 |

---

## 4. Frontend Testing (Vitest + RTL)

### Cấu hình

**File cấu hình:**
- `frontend/vitest.config.ts`
- `frontend/src/test/setup.ts`
- `admin-client/vitest.config.ts`

Đặc biệt quan trọng: tests dùng `vi.mock` để mock API services (không gọi backend thật).

### Chạy tests

Từ thư mục `frontend/` hoặc `admin-client/`:

```bash
# Chạy tất cả tests
npm test

# Watch mode
npm run test:watch

# UI interface
npm run test:ui

# Với coverage
npm run test:coverage
# Report: frontend/coverage/index.html
```

### Test files hiện tại

```
frontend/src/test/
├── setup.ts                      # jest-dom, cleanup, matchMedia mock
└── AuthContext.test.tsx          # 13 unit tests — AuthContext & useAuth
```

#### `AuthContext.test.tsx` (13 tests)
Tests hoàn toàn isolated qua `vi.mock`:
- **Initial state** (3): unauthenticated start, token on mount, 401 on mount
- **login()** (4): success, correct args, failed login, localStorage persist
- **logout()** (3): clear state, clear localStorage, clearTokens called
- **register()** (2): success, email conflict
- **useAuth guard** (1): throws outside AuthProvider

### Viết frontend test mới

```typescript
// frontend/src/test/MyComponent.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

// Mock dependencies nếu cần
vi.mock('@/api/services/someService', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: [] }),
}));

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

### Ưu tiên mở rộng

| Component/Hook | Test scope | Priority |
|----------------|-----------|:--------:|
| `VoteButtons` | Vote toggle, self-vote prevention | P1 |
| `PostCard` | Render với props | P1 |
| `usePosts` | Query/mutation logic | P1 |
| `useVotes` | Vote state management | P1 |
| `MarkdownRenderer` | Render markdown | P2 |

---

## 5. E2E Testing (Playwright)

### Cấu hình

**File cấu hình:** `playwright.config.ts` (project root)

### Chạy E2E tests

Yêu cầu: backend + frontend phải đang chạy.

```bash
# Từ project root
npx playwright test

# Headed mode (xem browser)
npx playwright test --headed

# Một file cụ thể
npx playwright test e2e/auth.spec.ts

# Debug mode (mở Playwright inspector)
npx playwright test --debug

# Xem test report
npx playwright show-report
```

### Test files hiện tại

```
e2e/
├── auth.spec.ts          # Authentication flows
├── posts.spec.ts         # Post creation and management
├── interactions.spec.ts  # Voting, bookmarks, reports
└── admin.spec.ts         # Admin panel features
```

### Critical User Flows cần implement

| Flow | Mô tả | Priority |
|------|-------|:--------:|
| Registration | Multi-step form → Login → Homepage | P0 |
| Post lifecycle | Login → Create → View → Edit → Delete | P0 |
| Comment flow | Navigate post → Comment → Reply → Edit | P1 |
| Vote flow | Vote → Change → Remove vote | P1 |
| Admin moderation | Admin login → Pin → Ban user | P2 |
| Search | Search → Navigate → Verify content | P2 |

---

## 6. Manual Testing

### Test Accounts

| Role | Email | Password | Tạo bởi |
|------|-------|----------|--------|
| Admin | `admin@forum.com` | `Admin@123` | Seed (tự động) |
| Moderator | `mod@forum.com` | `Moderator@123` | Tạo thủ công |
| Member | `john@example.com` | `Member@123` | Tạo thủ công |

> **URLs:** Frontend `http://localhost:5173` — Admin `http://localhost:5174`

### Checklist

#### Authentication
- [x] Đăng ký tài khoản mới (3 steps)
- [x] Đăng nhập bằng email
- [x] Đăng nhập bằng username
- [ ] Token refresh tự động
- [x] Logout

#### Posts
- [ ] Xem danh sách posts
- [ ] Filter theo category/tag  
- [ ] Sort (4 options)
- [ ] Tạo bài viết (dialog)
- [ ] Edit bài viết (own)
- [ ] Xóa bài viết (own)
- [ ] Draft auto-save

#### Comments
- [ ] Xem comments
- [ ] Tạo comment
- [ ] Reply comment
- [ ] Quote reply
- [ ] Edit comment (trong 30 phút)
- [ ] Sort comments

#### Interactions
- [ ] Upvote/downvote post
- [ ] Upvote/downvote comment
- [ ] Bookmark/unbookmark
- [ ] Block/unblock user
- [ ] Report content

#### Notifications
- [ ] Nhận notification khi được comment
- [ ] Mark as read / Mark all as read
- [ ] Delete notification

#### Admin (http://localhost:5174)
- [ ] Dashboard stats + charts
- [ ] CRUD categories & tags
- [ ] Pin/lock/hide posts
- [ ] Ban user, change role
- [ ] Resolve reports
- [ ] View audit logs

---

## 7. Coverage Goals

| Layer | Target | Hiện tại |
|-------|:------:|:--------:|
| Backend utils | 90% | ~85% (2/3 utils tested) |
| Backend services | 80% | ~10% (authService partial) |
| Backend controllers | 70% | ~5% (via integration) |
| Frontend hooks | 70% | ~20% (AuthContext only) |
| Frontend components | 60% | 0% |
| E2E critical paths | 100% | 0% (scaffolded only) |

### Effort Estimate (còn lại)

| Task | Effort |
|------|:------:|
| Backend services unit tests | 1 tuần |
| More API integration tests | 3–4 ngày |
| Frontend hooks & components | 1 tuần |
| E2E critical flows (6 flows) | 3–5 ngày |
| **Total remaining** | **~3 tuần** |

---

## 8. CI/CD Integration

Khi chạy trong CI environment (GitHub Actions):

```bash
# Backend
cd backend
npm test --ci --coverage

# Frontend
cd frontend
npm run test:coverage

# E2E
npx playwright test --reporter=github
```

**GitHub Actions example:**  
```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Backend tests
        run: cd backend && npm ci && npm test
      - name: Frontend tests  
        run: cd frontend && npm ci && npm run test:coverage
```

---

## 9. Debugging Guides

### Backend (Jest)

```bash
# Một test file cụ thể
npm test -- utils.jwt.test.ts

# Debug trong VS Code (Node inspector)
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Verbose output
npm test -- --verbose
```

### Frontend (Vitest)

```bash
# Một test file
npm test -- AuthContext.test.tsx

# UI mode (interactive browser interface)
npm run test:ui

# Debug với console output
npm test -- --reporter=verbose
```

### E2E (Playwright)

```bash
# Debug mode (Playwright Inspector)
npx playwright test --debug

# Trace viewer
npx playwright test --trace on
npx playwright show-trace trace.zip

# Headed với slow-mo
npx playwright test --headed --slow-mo=500
```

### Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Tests không chạy | Kiểm tra Node ≥ 16, chạy `npm install` |
| Prisma connection error | Database phải running, kiểm tra `.env` |
| TypeScript errors | Chạy `npm run build` để kiểm tra |
| E2E port conflict | Port 5173 phải trống; sửa `playwright.config.ts` |
| `vi.mock` không work | Đảm bảo `vi.mock()` chạy trước import modules |

---

## Liên kết

- [Roadmap](./06-ROADMAP.md) — Testing timeline
- [Security](./09-SECURITY.md) — Security testing  
- [API Reference](./03-API/README.md) — Endpoints cần test


---

## Mục lục

1. [Trạng thái hiện tại](#1-trạng-thái-hiện-tại)
2. [Chiến lược testing đề xuất](#2-chiến-lược-testing-đề-xuất)
3. [Unit Testing](#3-unit-testing)
4. [Integration Testing](#4-integration-testing)
5. [E2E Testing](#5-e2e-testing)
6. [Manual Testing](#6-manual-testing)
7. [Coverage Goals](#7-coverage-goals)

---

## 1. Trạng thái hiện tại

| Loại test | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Unit tests | ❌ Chưa có | Không có test framework |
| Integration tests | ❌ Chưa có | API chưa có automated tests |
| E2E tests | ❌ Chưa có | Không có Playwright / Cypress |
| Manual testing | ✅ | Tất cả features đã test thủ công |
| Load testing | ❌ Chưa có | Chưa benchmark |

> **Tech debt**: Automated testing là priority P1 trong [Roadmap](./06-ROADMAP.md).

---

## 2. Chiến lược testing đề xuất

### Testing Pyramid

```
        ┌─────────┐
        │  E2E    │   ← Ít nhất, tốn thời gian nhất
        ├─────────┤
        │ Integr. │   ← API endpoint tests
        ├─────────┤
        │  Unit   │   ← Nhiều nhất, nhanh nhất
        └─────────┘
```

### Recommended Stack

| Layer | Tool | Mục đích |
|-------|------|----------|
| Unit (Backend) | Jest + ts-jest | Service functions, utils |
| Unit (Frontend) | Vitest + React Testing Library | Components, hooks |
| Integration | Supertest + Jest | API endpoints |
| E2E | Playwright | User flows cross-module |
| Load | k6 hoặc Artillery | Performance benchmarks |

---

## 3. Unit Testing

### Backend — Ưu tiên cao

| Module | Files cần test | Ưu tiên |
|--------|---------------|:-------:|
| `utils/jwt.ts` | Token generate/verify | P0 |
| `utils/errors.ts` | Custom error classes | P0 |
| `utils/slug.ts` | Slug generation | P1 |
| `utils/response.ts` | Response formatters | P1 |
| `services/authService.ts` | Register, login, refresh | P0 |
| `services/postService.ts` | CRUD + permissions | P0 |
| `services/commentService.ts` | Nested comments, edit time | P1 |
| `services/voteService.ts` | Polymorphic vote logic | P1 |
| `validations/*.ts` | Zod schema validation | P1 |

Setup đề xuất:

```bash
cd backend
npm install -D jest ts-jest @types/jest
```

```json
// jest.config.json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/src"],
  "testMatch": ["**/__tests__/**/*.test.ts"]
}
```

### Frontend — Ưu tiên trung bình

| Component | Test scope | Ưu tiên |
|-----------|-----------|:-------:|
| `AuthContext` | Login/logout state | P0 |
| `VoteButtons` | Vote toggle, self-vote prevention | P1 |
| `PostCard` | Render với các props | P1 |
| `MarkdownRenderer` | Render markdown content | P2 |
| Custom hooks (`usePosts`, `useVotes`) | Query/mutation logic | P1 |

Setup đề xuất:

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## 4. Integration Testing

### API Endpoint Tests

| Endpoint group | Test cases chính | Ưu tiên |
|---------------|-----------------|:-------:|
| `POST /auth/register` | Validation, duplicate check, success | P0 |
| `POST /auth/login` | Email, username, wrong password | P0 |
| `POST /auth/refresh` | Valid/invalid/expired token | P0 |
| `GET /posts` | Pagination, filter, sort, permissions | P0 |
| `POST /posts` | Auth required, validation, category permission | P1 |
| `POST /posts/:id/vote` | Vote, change vote, self-vote | P1 |
| `GET /admin/dashboard` | Admin-only access | P1 |

Setup đề xuất:

```bash
cd backend
npm install -D supertest @types/supertest
```

```typescript
// Ví dụ test pattern
import request from 'supertest';
import app from '../src/app';

describe('POST /api/v1/auth/login', () => {
  it('should return tokens with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@forum.com', password: 'Admin@123' });
    
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('should return 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@forum.com', password: 'wrong' });
    
    expect(res.status).toBe(401);
  });
});
```

---

## 5. E2E Testing

### Critical User Flows

| Flow | Steps | Ưu tiên |
|------|-------|:-------:|
| Registration | Multi-step form → Login → Homepage | P0 |
| Post lifecycle | Login → Create post → View → Edit → Delete | P0 |
| Comment flow | Navigate post → Comment → Reply → Edit | P1 |
| Vote flow | Vote post → Change vote → Remove vote | P1 |
| Admin moderation | Admin login → Pin post → Ban user | P2 |
| Search | Search → Navigate result → Verify content | P2 |

Setup đề xuất:

```bash
npm install -D @playwright/test
npx playwright install
```

---

## 6. Manual Testing

### Hiện tại — Test Accounts

| Role | Email | Password | Tạo bởi |
|------|-------|----------|--------|
| Admin | `admin@forum.com` | `Admin@123` | Seed (tự động) |
| Moderator | `mod@forum.com` | `Moderator@123` | Tạo thủ công |
| Member | `john@example.com` | `Member@123` | Tạo thủ công |

### Checklist thủ công

#### Authentication
- [ ] Đăng ký tài khoản mới (3 steps)
- [ ] Đăng nhập bằng email
- [ ] Đăng nhập bằng username
- [ ] Token refresh tự động
- [ ] Logout

#### Posts
- [ ] Xem danh sách posts
- [ ] Filter theo category/tag
- [ ] Sort (4 options)
- [ ] Tạo bài viết (dialog)
- [ ] Edit bài viết
- [ ] Xóa bài viết
- [ ] Draft auto-save

#### Comments
- [ ] Xem comments
- [ ] Tạo comment
- [ ] Reply comment
- [ ] Quote reply
- [ ] Edit comment (trong 30 phút)
- [ ] Sort comments

#### Interactions
- [ ] Upvote/downvote post
- [ ] Upvote/downvote comment
- [ ] Bookmark/unbookmark
- [ ] Block/unblock user
- [ ] Report content

#### Notifications
- [ ] Nhận notification khi được comment
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Delete notification

#### Admin (http://localhost:5174)
- [ ] Dashboard hiển thị stats + charts
- [ ] CRUD categories
- [ ] CRUD tags
- [ ] Pin/lock/hide bài viết
- [ ] Ban user, change role
- [ ] Resolve report
- [ ] View audit logs

---

## 7. Coverage Goals

### Target (khi implement)

| Layer | Coverage target | Ưu tiên |
|-------|:--------------:|:-------:|
| Backend utils | 90% | P0 |
| Backend services | 80% | P0 |
| Backend controllers | 70% | P1 |
| Frontend hooks | 70% | P1 |
| Frontend components | 60% | P2 |
| E2E critical paths | 100% (6 flows) | P1 |

### Effort Estimate

| Task | Effort |
|------|:------:|
| Backend unit tests (utils + services) | 1 tuần |
| API integration tests | 1 tuần |
| Frontend unit tests | 1 tuần |
| E2E tests (critical paths) | 3–5 ngày |
| **Total** | **~3–4 tuần** |

---

## Liên kết

- [Roadmap](./06-ROADMAP.md) — Testing timeline
- [Security](./09-SECURITY.md) — Security testing
- [API Reference](./03-API/README.md) — Endpoints cần test
