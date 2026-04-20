# Bao Cao De Xuat Build Testing - Mini Forum

## 1. Muc tieu va pham vi

Tai lieu nay de xuat chien luoc testing bam sat codebase hien tai cua monorepo `mini-forum`, gom cac scope:
- Unit Test
- Component Test (frontend)
- Integration Test
- API Test
- System Test
- End-to-End (E2E) Test

Muc tieu:
- Tang do tin cay cho cac luong nghiep vu critical: auth, permission, moderation, notification, va bot content generation.
- Dong bo voi cac muc SLO/SLA hien co trong `docs/SLO_SLA.md`.
- Trien khai theo giai doan, uu tien phan co rui ro cao truoc.

## 2. Hien trang codebase (thuc te repo)

### 2.1. Kien truc va quy mo

- Monorepo gom 4 service chinh: `backend`, `frontend`, `admin-client`, `vibe-content`.
- Quy mo module chinh:
- `backend`: 18 services, 13 controllers, 14 routes, 10 validation modules.
- `frontend`: 14 pages, 13 hooks, 36 component files.
- `admin-client`: 12 pages, 18 component files.
- `vibe-content`: 16 service files (bao gom llm providers), 4 tracking files.

### 2.2. Khoang cach giua tai lieu va code

- README cua cac service mo ta da co `Jest/Vitest/Playwright` va script test.
- Thuc te hien tai trong repo:
- Chua co `test` script trong `package.json` cua `backend`, `frontend`, `admin-client`, `vibe-content`.
- Chua co test config (`jest.config.*`, `vitest.config.*`, `playwright.config.*`).
- Chua co file test (`*.test.*`, `*.spec.*`).
- Chua co workflow CI trong `.github/workflows` (thu muc rong).
- `docs/openapi.yaml` duoc nhac den trong README nhung chua ton tai.

Ket luan: can bat dau tu xay nen tang test va CI, khong nen dat ky vong full E2E ngay lap tuc.

## 3. Nguyen tac chon scope test

- Test pyramid de xuat:
- Unit: nhieu nhat, nhanh, o muc function/service.
- Integration/API: muc trung binh, bao dam contract giua module va DB/API.
- Component: tap trung vao UI co logic, khong test snapshot dai tra.
- System/E2E: it nhung bao phu luong critical.

- Uu tien theo rui ro nghiep vu:
- Cao: auth, role/permission, post/comment lifecycle, moderation, token refresh, SSE, fallback LLM, cron lock.
- Trung binh: search, bookmark, profile.
- Thap: cac view tinh, UI thu?n hien thi.

## 4. De xuat scope test theo thanh phan

## 4.1 Backend (Express + Prisma)

### Unit Test

Nen test:
- `src/utils/slug.ts`: slug sanitize, truncate, unique pattern dau vao dac biet.
- `src/utils/snakeToCamel.ts`: bien doi nested object/array, giu nguyen primitive.
- Permission helpers trong service:
- `postService.checkPermission`, `buildViewPermissionFilter`.
- Security helpers:
- `sanitizeString`, `sanitizeObject`, `preventNoSQLInjection`.
- `metricsService`: tinh p50/p95/p99, throughput, alert threshold.

Khong nen test unit qua sau:
- Controller chi mapping req/res (de danh cho API/Integration).

### Integration Test

Nen test voi test DB (PostgreSQL test schema):
- `authService`: register/login/refresh/logout, rotate refresh token, user inactive.
- `postService`: create/update/delete, tag upsert, category permission, related posts ranking.
- `adminController` service flow: role change, ban/unban, report status workflow, pin reorder transaction.
- `notificationService` + `sseService`: tao notification va phat su kien SSE.

### API Test

Nen dung Supertest cho endpoint-level:
- `/api/v1/auth/*`: login, refresh, otp flows, rate limit auth.
- `/api/v1/posts`, `/comments`, `/votes`: auth + permission + validation schema.
- `/api/v1/admin/*`: 403/401/200 theo role ADMIN/MODERATOR.
- `/api/v1/notifications/stream`: token query cho SSE va ket noi heartbeat.
- `/ping`, `/api/v1/health` cho smoke/availability.

Assertion can co:
- Response envelope `{ success, message, data }`.
- Field camelCase do middleware transform.
- Ma loi dung (400/401/403/404/429).

## 4.2 Frontend (React end-user)

### Unit Test

Nen test:
- Hooks co logic cache/query key:
- `usePosts`, `useComments`, `useRealtimeNotifications` (retry policy).
- `AuthContext`: init auth, fallback 401/429, invalidate query khi user thay doi.
- API client interceptors trong `src/api/axios.ts`:
- attach token
- queue request khi refresh token
- retry khi 429

### Component Test (frontend)

Nen test component co nhieu branch logic:
- `PrivateRoute`: loading -> redirect -> render children.
- `PostDetailPage`:
- hien/an comment form theo auth + category permission + lock state.
- thao tac comment/reply/edit/delete branch theo role + time limit.
- `MarkdownRenderer`: xu ly content rong/co media.
- `NotificationBell`/notification widgets: cap nhat state khi co event.

Khuyen nghi:
- React Testing Library + MSW de mock API.
- Tranh snapshot test lon, uu tien assertion theo role/label/hanh vi.

### Integration Test (frontend app)

Nen test o muc route + context + API mock:
- Login thanh cong -> route protected duoc mo.
- Token het han -> auto refresh -> request replay.
- User role/identity doi -> cache invalidation cho posts/search.

## 4.3 Admin-client (React admin dashboard)

### Unit Test

Nen test:
- `AuthContext` role gate (ADMIN/MODERATOR).
- `api/axios.ts` refresh token cho admin storage keys.

### Component Test

Nen test cac page co action moderation:
- `ReportsPage`: render status badge, action resolve/dismiss, pagination.
- `UsersPage`: disable action nguy hiem trong case self/admin constraints.
- `OperationalDashboardPage`: hien thi alert khi error rate vuot nguong.

### Integration/API Test (qua backend)

Nen co test role-based:
- Moderator khong duoc goi route chi ADMIN (vd `/admin/metrics`).
- Workflow report PENDING -> REVIEWING -> RESOLVED/DISMISSED.

## 4.4 Vibe-content (AI bot orchestration)

### Unit Test

Nen test dam dac vi logic phuc tap:
- `LLMProviderManager`:
- queue theo task (`post/comment/vote_llm`)
- cooldown 2h sau rate-limit
- circuit breaker open/close
- map error -> unavailable reason.
- `RateLimiter` theo ngay va reset theo date.
- `ValidationService`: parse JSON, language gate, quality checks.
- `APIExecutorService`: token cache, refresh fallback, idempotency key.

### Integration Test

Nen test voi dependency mock:
- `ContentGeneratorService.runOnce` cho 3 action post/comment/vote.
- RetryQueue: non-validation error thi retry, validation error thi skip retry.
- Cron scheduler:
- in-process guard `isRunning`
- distributed lock acquire/release.

### API Test (vibe-content endpoints)

Nen test:
- `/health`, `/status`, `/metrics` tra du lieu hop le.
- `/trigger/*` return ket qua dung cho action thanh cong/that bai.

## 4.5 System Test

Muc tieu: kiem chung tuong tac giua service trong moi truong gan production.

Kich ban system test de xuat:
- Khoi dong stack: Postgres + backend + frontend + admin-client + vibe-content.
- Seed du lieu toi thieu, bot users, categories/tags.
- Trigger bot action qua `/trigger/post` va xac nhan:
- post duoc tao qua backend API
- audit log duoc ghi
- metrics backend/vibe-content cap nhat.
- Kiem tra Ops metrics endpoint va dashboard route admin.

Khuyen nghi:
- Tao `docker-compose.test.yml` phuc vu test stack.
- Trong system test, mock LLM provider de test on dinh (khong phu thuoc internet/quota).

## 4.6 End-to-End (E2E) Test

E2E chi nen cover "critical user journeys":
- End-user:
- Register/Login
- Tao post
- Comment + vote + bookmark
- Nhan notification real-time.
- Admin:
- Login admin
- Xu ly report
- Lock/hide post/comment
- Kiem tra thay doi phan anh tren frontend.

Cong cu de xuat:
- Playwright cho browser E2E.
- Chay E2E tren staging-like env sau khi API/Integration pass.

## 5. De xuat build testing (CI pipeline)

## 5.1 Muc tieu CI

- Fast feedback cho PR (< 10-15 phut).
- Gate theo tang: lint -> unit -> integration/api -> system/e2e (co the nightly).
- Tach test theo service de scale.

## 5.2 Pipeline de xuat

Stage 1 - PR nhanh (bat buoc):
- Type-check/lint cho 4 service.
- Unit tests backend/frontend/admin/vibe.
- API smoke tests backend (`/ping`, `/health`, auth basic).

Stage 2 - PR day du (bat buoc voi thay doi backend/auth/moderation):
- Integration + API tests backend voi Postgres test container.
- Frontend/admin component+integration tests voi MSW.

Stage 3 - Nightly / pre-release:
- System tests (stack full).
- E2E Playwright (critical flows).
- Bao cao SLO synthetic checks (latency/error-rate baseline).

## 5.3 Branch gate de xuat

- Block merge neu fail:
- lint/typecheck
- unit + integration/api test
- coverage threshold toi thieu giai doan hien tai.

- Khong block merge ngay cho:
- full E2E suite (co the bat dau o nightly) trong giai doan dau.

## 6. Coverage threshold de xuat theo giai doan

Giai doan 1 (2-3 sprint dau):
- Backend unit+integration: >= 60% line, >= 70% critical module.
- Frontend/admin component+hook: >= 50% line.
- Vibe-content unit: >= 60% line (uu tien manager/validator/executor).

Giai doan 2 (on dinh hon):
- Backend: >= 75% line.
- Frontend/admin: >= 65% line.
- Vibe-content: >= 70% line.
- E2E: bao phu >= 80% user journey critical (khong tinh theo line).

## 7. Lo trinh trien khai de xuat

Sprint 1 - Dat nen tang:
- Chon framework va script test cho tung service.
- Them config test + setup file + mock strategy.
- Tao CI workflow co lint + unit.

Sprint 2 - Backend first:
- Hoan thanh unit cho utils/security/metrics.
- Integration+API cho auth/posts/admin critical.

Sprint 3 - Frontend/Admin:
- Component tests cho route guard, PostDetailPage, ReportsPage.
- Integration tests cho auth refresh + cache invalidation.

Sprint 4 - Vibe-content + system:
- Unit cho LLMProviderManager/RateLimiter/APIExecutor.
- Integration cho ContentGeneratorService + cron lock.
- Khoi tao system test stack.

Sprint 5 - E2E:
- Them Playwright cho 3-5 luong critical nhat.
- Dua E2E vao nightly va pre-release gate.

## 8. Danh sach uu tien test case (Top 15)

1. Backend auth refresh token rotation va revoke.
2. Backend role authorization cho `/admin/*`.
3. Backend post create voi category/tag permission.
4. Backend report workflow status transition.
5. Backend response envelope + camelCase transform.
6. Backend rate limit cho auth routes (429 + retry-after).
7. Frontend axios interceptor queue khi refresh token.
8. Frontend `PrivateRoute` redirect flow.
9. Frontend `PostDetailPage` branch lock/permission/comment form.
10. Admin `ProtectedRoute` voi requireAdmin.
11. Admin `ReportsPage` resolve/dismiss + pagination.
12. Vibe `LLMProviderManager` fallback/cooldown/circuit breaker.
13. Vibe `APIExecutorService` idempotency + token cache refresh.
14. Vibe `ContentGeneratorService` skip retry voi validation error.
15. System flow: trigger bot -> post tao thanh cong -> audit log + metrics cap nhat.

## 9. De xuat cong cu ky thuat

- Backend: Jest + Supertest + Testcontainers (PostgreSQL).
- Frontend/Admin: Vitest + React Testing Library + MSW.
- Vibe-content: Vitest (hoac Jest) + fake timers + dependency mocks.
- E2E: Playwright.
- Coverage report: `c8`/Vitest coverage + Jest coverage, upload artifact tren CI.

## 10. Tong ket

Huong di phu hop voi codebase hien tai la:
- Build nen tang test tu dau (scripts + config + CI),
- Uu tien backend auth/permission/moderation va frontend route/auth logic,
- Sau do mo rong sang vibe-content orchestration,
- Cuoi cung moi mo rong system + E2E theo critical journeys.

Cach lam nay can bang giua toc do giao hang va giam rui ro van hanh theo dung SLO/SLA da dat ra.
