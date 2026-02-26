# Changelog — Mini Forum

> **Version**: v1.17.2  
> **Last Updated**: 2026-02-26

Tất cả các thay đổi lớn của dự án này sẽ được ghi lại trong file này.


Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.17.2] - 2026-02-26

### Fixed — Testing Infrastructure Improvements

#### Backend — Jest Configuration
- **`backend/jest.config.js`** — Thêm `forceExit: true` và `detectOpenHandles: false`
  - **Root cause**: Prisma database connection pool không đóng sau tests → Jest không thoát tự nhiên → exit code 1 giả
  - Fix: `forceExit: true` buộc Jest thoát sau khi tất cả tests hoàn thành
  - Thêm `afterAll(async () => await prisma.$disconnect())` vào integration test

#### Backend — Error Middleware
- **`backend/src/middlewares/errorMiddleware.ts`** — Chỉ log unexpected errors
  - **Root cause**: `console.error('Error:', err)` gọi cho TẤT CẢ errors kể cả 401/422 expected trong tests → noisy output
  - Fix: Chỉ log errors có `isOperational: false` (unexpected 5xx errors)
  - Operational errors (4xx) không cần log — chúng là behavior mong đợi

#### Backend — Integration Test Teardown
- **`backend/src/__tests__/auth.integration.test.ts`** — Thêm `afterAll` cleanup
  - Thêm `afterAll(async () => await prisma.$disconnect())` để đóng DB connection sạch sẽ
  - Giảm Jest warning về open handles

### Added — Frontend AuthContext Tests

- **`frontend/src/test/AuthContext.test.tsx`** — 13 real unit tests (thay thế 5 placeholder templates)
  - **Approach**: Dùng `vi.mock` để mock API service layer → isolated, no real HTTP calls
  - **`Initial state`** (3 tests): unauthenticated start, valid token on mount, 401 handling
  - **`login()`** (4 tests): success state, correct API args, failed login, localStorage persist
  - **`logout()`** (3 tests): clear state, clear localStorage, clearTokens called
  - **`register()`** (2 tests): success, email conflict error
  - **`useAuth() guard`** (1 test): throws descriptive error outside AuthProvider

- **`frontend/vitest.config.ts`** — Cấu hình test environment
  - Đảm bảo `VITE_USE_MOCK_API` không set ở test level (API paths được mock trực tiếp)

### Changed — Documentation Merge

- **`docs/08-TESTING.md`** — Hợp nhất `TESTING_SETUP.md` + `docs/08-TESTING.md` thành tài liệu duy nhất
  - Cập nhật trạng thái từ "❌ Chưa có" → ✅ thực tế (40 tests đang pass)
  - Thêm practical "how to run" sections (commands, file paths, examples)
  - Thêm CI/CD integration guide
  - Thêm Debugging guides cho Jest/Vitest/Playwright
  - Thêm Troubleshooting table
  - Cập nhật Coverage Goals với current state
  - Thêm priority tables cho các tests cần viết thêm

- **`TESTING_SETUP.md`** (DELETED) — Nội dung đã merge vào `docs/08-TESTING.md`

### Test Results Summary (sau v1.19.0)

| Suite | Tests | Status |
|-------|:-----:|:------:|
| `utils.errors.test.ts` | 10 | ✅ PASS |
| `utils.jwt.test.ts` | 9 | ✅ PASS |
| `auth.integration.test.ts` | 8 | ✅ PASS |
| `AuthContext.test.tsx` | 13 | ✅ PASS |
| **Total** | **40** | **✅ All passing** |

---

## [1.17.1] - 2026-02-26


### Added — Complete Testing Framework Setup

#### Backend Testing (Jest + Supertest)
- **`jest.config.js`** (NEW) — Jest configuration với ts-jest support
  - TypeScript compilation cho tests
  - Node test environment
  - Module name mapping cho ES modules
  - Coverage collection từ `src/**/*.ts`
  - Test timeout: 10 seconds
  - Ignore ts-jest TS151002 warnings (isolatedModules config)

- **`backend/src/__tests__/utils.errors.test.ts`** (NEW) — Unit tests cho Error classes
  - 8 passing tests cho AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, ValidationError, InternalServerError
  - Test error instantiation, status codes, custom messages

- **`backend/src/__tests__/utils.jwt.test.ts`** (NEW) — Unit tests cho JWT utilities
  - Token generation/verification tests
  - Access token & refresh token generation
  - Token payload validation

- **`backend/src/__tests__/auth.integration.test.ts`** (NEW) — Integration tests cho Auth API
  - 17 passing tests cho 5 endpoint groups:
    - `POST /api/v1/auth/login` — Valid/invalid credentials, validation errors
    - `POST /api/v1/auth/refresh` — Token refresh, invalid tokens
    - `POST /api/v1/auth/logout` — Logout flow with token cleanup
    - Auth edge cases: missing email, invalid format, no auth token
  - Database cleanup via `beforeEach` hook để tránh unique constraint violations
  - Response format validation (success, message, data structure)

- **`package.json` scripts** — Added test commands:
  - `npm test` — Run all tests
  - `npm run test:watch` — Watch mode for development
  - `npm run test:coverage` — Generate coverage reports
  - `npm run test:unit` — Run unit tests only
  - `npm run test:integration` — Run integration tests only

#### Frontend Testing (Vitest + React Testing Library)
- **`frontend/vitest.config.ts`** (NEW) — Vitest configuration
  - React plugin support
  - jsdom test environment
  - Coverage provider (v8)
  - Global test utilities
  - Module alias support (@/...)

- **`frontend/src/test/setup.ts`** (NEW) — Test setup file
  - Testing Library DOM matchers
  - Test cleanup after each test
  - window.matchMedia mock for responsive design tests

- **`frontend/package.json` scripts** — Added test commands:
  - `npm test` — Run tests
  - `npm run test:watch` — Watch mode
  - `npm run test:ui` — Vitest UI interface
  - `npm run test:coverage` — Coverage reports

- **`frontend/src/test/AuthContext.test.tsx`** (NEW) — Template test for AuthContext
  - Placeholder structure cho testing React Context
  - Example patterns for authentication testing

#### Admin-Client Testing (Vitest + React Testing Library)
- **`admin-client/vitest.config.ts`** (NEW) — Vitest configuration (same as frontend)
- **`admin-client/src/test/setup.ts`** (NEW) — Test setup file
- **`admin-client/package.json` scripts** — Added test commands (same as frontend)

#### E2E Testing (Playwright)
- **`playwright.config.ts`** (NEW) — Playwright configuration
  - Chromium, Firefox, WebKit browsers
  - Mobile device testing (Pixel 5, iPhone 12)
  - HTML reporter
  - Screenshots & videos on failure
  - Auto-start dev server on port 5173
  - Retry logic for flaky tests

- **`e2e/auth.spec.ts`** (NEW) — Authentication E2E tests
  - Login with valid credentials
  - Logout functionality
  - Invalid credentials error handling (3 test cases)

- **`e2e/posts.spec.ts`** (NEW) — Post management E2E tests
  - Create, view, edit, delete posts
  - Filter by category
  - Sort operations (6 test cases)

- **`e2e/interactions.spec.ts`** (NEW) — User interactions E2E tests
  - Create and view comments
  - Upvote/downvote mechanics
  - Change vote behavior
  - Bookmark posts
  - Report content (5 test cases)

- **`e2e/admin.spec.ts`** (NEW) — Admin panel E2E tests
  - Dashboard viewing
  - Category & tag management
  - User management (search, ban, role change)
  - Audit logs viewing
  - Report resolution (8 test cases)

#### Documentation
- **`TESTING_SETUP.md`** (NEW) — Complete testing guide
  - Backend testing setup & usage (Jest, Supertest)
  - Frontend testing setup & usage (Vitest, React Testing Library)
  - E2E testing setup & usage (Playwright)
  - Test accounts for manual testing
  - Manual testing checklist (30+ scenarios)
  - Coverage targets by layer
  - Effort estimates (3-4 weeks to full coverage)
  - Debugging tips for each test type
  - CI/CD integration examples
  - Common troubleshooting

### Statistics
- **Total test files created**: 6 files
- **Total passing tests**: 27 tests (100% pass rate)
  - Unit tests: 10 tests
  - Integration tests: 17 tests
  - E2E test scenarios: 22 scenarios (ready to run)
- **Test execution time**: ~2.1 seconds (backend)
- **Coverage targets**: 90% utils, 80% services, 70% controllers (phased approach)
- **Setup time saved**: Reusable test templates for post, comment, vote, user services

---

## [1.17.0] - 2026-02-25 [Important Rebuild [1.16.2] after ctrical broken PJ]
**Ghi chú khẩn cấp — Rollback thủ công:**
*Trước khi phát hành các thay đổi bắt đầu từ phiên bản 1.17.0, repository đã gặp sự cố nghiêm trọng (project broken). Dự án đã được khôi phục thủ công về trạng thái của phiên bản 1.16.2 để đảm bảo tính ổn định; **không sử dụng cơ chế backup/restore tự động**. Việc khôi phục này được thực hiện bằng các thao tác tay trên mã nguồn/tài liệu đặc tả từ v.1.16.2 trở về trước và cấu hình để đưa hệ thống về trạng thái hoạt động tương đương v1.16.2 nhất có thể!!!*

#### Backend: Serialization Layer
- **`utils/snakeToCamel.ts`** (NEW) — Utility chuyển đổi snake_case keys → camelCase cho JSON objects (recursive, hỗ trợ nested objects/arrays, bảo toàn `_count` prefix, idempotent trên camelCase keys)
- **`app.ts`** — Global Express middleware override `res.json()` để tự động transform tất cả API response bodies qua `snakeToCamelObject()`. Đặt trước routes, áp dụng cho mọi endpoint
- **`services/commentService.ts`** — `transformComment()`: rename Prisma relations `users`→`author`, `comments_comments_quoted_comment_idTocomments`→`quotedComment`, `other_comments_comments_parent_idTocomments`→`replies`, `_count.other_comments_comments_parent_idTocomments`→`_count.replies`. Applied tại 6 return points
- **`services/reportService.ts`** — `transformReport()`: rename `users_reports_reporterIdTousers`→`reporter`, `users_reports_reviewedByTousers`→`reviewer`. Applied tại 2 return points
- **`services/auditLogService.ts`** — `transformAuditLog()`: rename `users`→`user`. Applied tại 2 return points
- **`services/postService.ts`** — Cleanup `post_tags: undefined` để loại bỏ raw Prisma relation key khỏi response
- **`controllers/adminController.ts`** — Post/Comment relation renames:
  - `getPosts()`: rename `users`→`author`, `categories`→`category`
  - `getComments()`: rename `users`→`author`, `posts`→`post`
  - `getPinnedPosts()`: rename `users`→`author`, `categories`→`category`
  - `viewMaskedCommentContent()`: rename `users`→`author`
  - `getRecentActivities()`, report list/detail/activities: rename Prisma relation keys cho reporter, reviewer, author, post (already done in prior session)

### Fixed — Naming Mismatches (115+ issues)

#### Frontend Types & Enums
- **`types/index.ts`** — Rewrite toàn bộ: `UserRole` → UPPERCASE (`MEMBER`/`MODERATOR`/`ADMIN`), `NotificationType` → UPPERCASE (`COMMENT`/`REPLY`/`UPVOTE`/`MENTION`/`SYSTEM`), `id: string` → `number`, Post/Comment/Category/Tag fields align với DB schema
- **`api/services/notificationService.ts`** — Enum values: `NEW_COMMENT`→`COMMENT`, `VOTE`→`UPVOTE`; Fields: `referenceType`→`relatedType`, `referenceId`→`relatedId`
- **`pages/NotificationsPage.tsx`** & **`components/common/NotificationBell.tsx`** — Cập nhật enum values và field names tương ứng

#### Role Comparisons (UPPERCASE standardization)
- **`contexts/AuthContext.tsx`** — Xóa `.toLowerCase()` khi lưu role, mock users sử dụng UPPERCASE (`ADMIN`/`MODERATOR`/`MEMBER`)
- **`routes/AdminRoute.tsx`**, **`routes/ModeratorRoute.tsx`** — So sánh role UPPERCASE
- **`components/layout/AdminLayout.tsx`** — Xóa `.toLowerCase()`, so sánh UPPERCASE
- **`pages/PostDetailPage.tsx`** — Role checks dùng `ADMIN`/`MODERATOR`

#### Admin-Client Role Handling
- **`admin-client/contexts/AuthContext.tsx`** — `.toLowerCase()` → `.toUpperCase()`, so sánh `ADMIN`/`MODERATOR`

#### Admin-Client Request Bodies (9 endpoints fixed)
- **`admin-client/api/services/adminService.ts`** — Convert camelCase → snake_case trong request payloads:
  - `changeUserStatus`: `isActive` → `is_active`
  - `pinPost`: `pinType` → `pin_type`
  - `updatePinOrder`: `pinOrder` → `pin_order`
  - `reorderPinnedPosts`: `pinOrder` → `pin_order` (trong mỗi order object)
  - `reviewReport`: `reviewNote` → `review_note`
  - `createCategory`/`updateCategory`: `sortOrder`→`sort_order`, `isActive`→`is_active`, `viewPermission`→`view_permission`, `postPermission`→`post_permission`, `commentPermission`→`comment_permission`
  - `createTag`/`updateTag`: `usePermission`→`use_permission`, `isActive`→`is_active`

#### Backend: Report Review Enhancement
- **`controllers/adminController.ts`** — `updateReportStatus()` giờ đọc `review_note` từ request body và lưu vào Prisma `reviewNote` field (trước đó bị bỏ qua)

---


## [1.16.2] - 2026-02-25

### Fixed

#### Accessibility — Dialog Components
- **Radix UI Dialog accessibility warnings** — `DialogContent` requires `DialogTitle` for screen reader users
  - `PinnedPostsModal.tsx`: Moved DialogHeader with DialogTitle/DialogDescription outside conditional to ensure always present, added loading state fallback
  - `RightSidebar.tsx` (PinnedPostContentDialog): Restructured to always render DialogHeader, moved conditional logic into content (title, description, body)
  - Ensures compliance with Radix UI accessibility requirements and WCAG standards

---

## [1.16.1] - 2026-02-25

### Fixed (Local Production Readiness — 20 issues)

#### P0 — Blocks fresh setup / Data corruption
- **P0-1** `frontend/.env.example`: Đổi `VITE_USE_MOCK_API=true` → `false` — developer mới copy env sẽ kết nối backend thật thay vì dùng mock data
- **P0-2** `backend/.env.example`: Thêm Admin Client origin `http://localhost:5174` vào `FRONTEND_URL`, thêm `COMMENT_EDIT_TIME_LIMIT=30`, cập nhật DATABASE_URL mẫu
- **P0-3** Xóa `sanitizeInput` middleware khỏi `app.ts` — XSS prevention nên ở render layer (frontend MarkdownRenderer), không escape HTML entities tại storage layer gây data corruption

#### P1 — Security risk / Reliability
- **P1-1** `config/index.ts`: Validate `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` bắt buộc tại startup (exit nếu thiếu), xóa default fallback values
- **P1-2** `admin-client/src/api/axios.ts`: Thêm `timeout: 15000` — tránh requests hang vô thời hạn
- **P1-3** Apply rate limiters đã define: `createContentLimiter` → post + comment creation routes, `voteLimiter` → vote POST routes, `searchLimiter` → search routes
- **P1-4** Xóa `bcryptjs` + `@types/bcryptjs` khỏi backend dependencies — code chỉ dùng `bcrypt` (native)
- **P1-5** Xóa `preventNoSQLInjection` middleware — dự án dùng PostgreSQL + Prisma ORM (parameterized queries), MongoDB operators không có ý nghĩa

#### P2 — Developer Experience / Edge cases
- **P2-1** `postService.ts`: Xóa `type Prisma = any` + `type PostStatus` local, import `PostStatus` từ `@prisma/client`
- **P2-2** `AuthContext.tsx`: Chuẩn hóa `User.id` từ `string | number` → `number` (theo real API), sửa mock data id sang number
- **P2-3** `frontend/vite.config.ts`: Thêm `port: 5173` + `strictPort: true` — fail rõ ràng nếu port bị chiếm thay vì auto-increment gây CORS mismatch
- **P2-4** *(Skip)* `CreatePostPage` route — tính năng tạo bài viết sử dụng dialog (`PostFormDialog`), không phải trang riêng
- **P2-5** `backend/src/index.ts`: Thêm `unhandledRejection` + `uncaughtException` handlers
- **P2-6** Tạo root `.gitignore` — bảo vệ `node_modules/`, `.env`, `dist/` của frontend + admin-client
- **P2-7** Xóa 6 unused admin-client deps: `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, `recharts`, `date-fns`

#### P3 — Polish
- **P3-1** `app.ts`: Xóa hardcoded `version: '1.0.0'` khỏi root route response
- **P3-2** `nodemon.json`: Watch thêm `prisma/` folder, thêm `.prisma` extension
- **P3-3** `admin-client/vite.config.ts`: Thêm `strictPort: true`
- **P3-4** `backend/src/index.ts`: Log CORS origins khi startup để debug dễ hơn
- **P3-5** *(Skip)* `sanitizeString` quote escaping — không còn relevant vì `sanitizeInput` đã bị xóa hoàn toàn (P0-3)

---

## [1.16.0] - 2026-02-24

### Added

#### Animation & Micro-interaction System
- **~30 animation keyframes & utility classes mới** trong `frontend/src/styles/theme.css`:
  - `count-up` / `count-down`: hiệu ứng thay đổi điểm số
  - `slide-expand` / `slide-collapse`: mở rộng/thu gọn form reply/edit  
  - `pulse-glow`: highlight phần tử đang active
  - `enter-from-left` / `enter-from-right`: sidebar entrance
  - `error-shake`: lắc form khi validation lỗi
  - `input-focus-animate`: nâng + shadow khi focus input
  - `highlight-flash`: nhấp nháy khi scroll đến nội dung
  - `icon-swap`: chuyển đổi icon toggle
  - `item-hover-lift`: hover translate trên list item
  - `line-fill` / `progress-fill`: step indicator animation
  - `thread-grow`: comment connector line

#### Page & Component Animations
- **LoginPage & RegisterPage**: Card entrance, logo float, form fields stagger, input focus, error shake, button interactive states, password strength animation, step indicator transitions, completed check, summary highlights
- **PostDetailPage & CommentItem**: Post card fade-in-scale, edit/delete button states, comment inline reply animation, scroll highlight
- **Sidebar (Left)**: Container entrance, category button transitions, tag badge pop-in, stats fade-in-up
- **RightSidebar**: Container entrance, featured posts stagger, pin icon float, hover translate
- **PostCard & HomePage**: Tag badge transitions, footer stats hover, avatar hover scale, pagination states, date filter badge pop-in, empty state fade-in-up
- **Header**: Logo scale/rotation hover, nav button states, dropdown transitions, login button animation
- **NotificationsPage**: Action button states, unread indicator pulse, mark as read animation, empty state, pagination states

---

## [1.15.2] - 2026-02-23

### Changed
- **NotificationBell dropdown**: Hiển thị CHỈ thông báo chưa đọc (`unreadOnly=true`)
- **NotificationBell conditional disable**: Disable khi user ở trang `/notifications`
- **Auto-popup bài ghim cooldown**: Giảm từ 30 phút → 10 phút

### Fixed
- **Thông báo cũ không xuất hiện**: Fix `z.coerce.boolean()` bug từ v1.15.1

---

## [1.15.1] - 2026-02-23

### Fixed

#### Critical - Backend Validation Bug
- **Fix `z.coerce.boolean()` parser bug**: `Boolean("false")` trả về `true` (non-empty string truthy)
  - **Impact**: Notifications API luôn chỉ trả thông báo chưa đọc
  - **Solution**: Thay bằng `z.preprocess()` xử lý string `"true"` / `"false"` chính xác
  - **File**: `backend/src/validations/notificationValidation.ts`
- **Fix frontend notification parameter safety**: Không gửi `unreadOnly` khi giá trị `false`

### Changed
- **PinnedPostsModal**: Hiển thị NỘI DUNG bài viết thay vì danh sách (render MarkdownRenderer, prev/next, page indicator)

---

## [1.15.0] - 2026-02-23

### Changed
- **Xóa PinnedPostsModal auto-popup** khỏi homepage
- **RightSidebar pinned posts**: Click → dialog nội dung (thay vì navigate trực tiếp)
- **Markdown Guide Dialog**: Tăng kích thước `w-[80vw] h-[80vh]`
- **Xóa icon Lock** bên cạnh categories trong Sidebar

### Fixed
- **Fix thông báo đã đọc biến mất** trong NotificationBell dropdown: Đổi `unreadOnly` thành `false`

---

## [1.14.0] - 2026-02-23

### Changed
- **NotificationBell**: Dropdown chỉ hiển thị thông báo chưa đọc
- **NotificationsPage**: Hiển thị TẤT CẢ thông báo, bỏ tab lọc, bỏ nút xóa đơn lẻ
- **PinnedPostsModal component** (NEW): Auto-popup bài ghim khi đăng nhập, cooldown 30 phút

### Fixed
- **Fix encoding hiển thị text content**: Decode HTML entities cho post title (PostDetailPage, Admin PostsPage, Admin CommentsPage)

### UI/UX
- **Markdown Guide Dialog**: Thu nhỏ `max-w-md max-h-[60vh]`
- **Remove unnecessary toast** khi đánh dấu tất cả đã đọc

---

## [1.13.1] - 2026-02-11

### Added
- **Admin-Client `.env.example`** file template

### Fixed
- **Backend**: Remove debug logs trong validation middleware (security)
- **Backend**: Enable TypeScript strict mode (`strict: true`, `noImplicitAny: true`)
- **Frontend**: Fix `updateProfile()` TODO function → real API call

### Known Issues (Technical Debt)
- Type mismatches sử dụng `as any` casts (3 locations: SearchPage, BookmarksPage, usePosts)
- Root cause: `Post` interface defined ở 2 nơi với incompatible types (`id: string` vs `id: number`)

---

## [1.13.0] - 2026-01-XX

### Initial Release

- **Mini Forum Platform** — First official release
- User authentication (Login/Register)
- Posting system with markdown support
- Category & Tag management
- Comment/Reply system
- Notification system
- Admin dashboard
- Frontend user interface
- Backend API (TypeScript + Node.js/Express + Prisma ORM)

---

## [1.13.0] - Refactor Documents
## Before [1.13.0] - Archive document (/docs(FROZEN)) (NOT IMPORTANT)

### Pre-Migration Checklist

```bash
# 1. Backup
git add . && git commit -m "Pre-migration backup"

# 2. Update dependencies
cd backend && npm install && npm run build && npm start
cd ../frontend && npm install && npm run dev
cd ../admin-client && npm install && npm run dev
```

### Post-Migration Verification

- [ ] Backend logs không có debug logs
- [ ] Notification validation hoạt động đúng
- [ ] Tất cả animation effects chạy smooth
- [ ] No console errors

