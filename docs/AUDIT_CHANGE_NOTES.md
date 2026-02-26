# Documentation Audit — Change Notes

> **Ngày thực hiện**: 2026-02-25  
> **Phương pháp**: Source code là Single Source of Truth — đối chiếu toàn bộ 3 codebase (backend, frontend, admin-client) với thư mục `docs/` và các README.

---

## Tóm tắt

| Metric | Số lượng |
|--------|:--------:|
| Files đã sửa | 7 |
| Files không cần sửa | 6 |
| Tổng thay đổi | ~25 edits |
| Sai lệch nghiêm trọng | 3 (bcrypt salt, password rules, unused deps) |
| Sai lệch trung bình | 8 (permission matrix, enums, rate limiters) |
| Sai lệch nhẹ | ~14 (mô tả, từ ngữ) |

---

## Chi tiết theo file

### 1. `docs/01-ARCHITECTURE.md` — 2 edits

| # | Sai lệch | Docs cũ | Code thực tế | Sửa |
|---|----------|---------|-------------|-----|
| 1 | Admin Client tech stack | Liệt kê TanStack Query, TanStack Table, Recharts như đang dùng | 6 deps có trong `package.json` nhưng **KHÔNG được import** trong source code. App dùng `useState` + `useEffect` + `axios` | Viết lại section, đánh dấu unused deps |
| 2 | Permission matrix | MOD: Tags CRUD ❌, Users "View", Audit "⚠️ Own" | MOD CAN CRUD tags (requireRole MODERATOR), MOD can View+Ban users, MOD CANNOT view audit logs | Sửa 3 ô trong permission matrix |

### 2. `docs/02-DATABASE.md` — Không thay đổi ✅

Đối chiếu `prisma/schema.prisma`: 13 models, 11 enums — tất cả khớp chính xác.

### 3. `docs/03-API/README.md` — 2 edits (3 fixes)

| # | Sai lệch | Docs cũ | Code thực tế | Sửa |
|---|----------|---------|-------------|-----|
| 1 | ReportStatus enum | `REVIEWED`, `REJECTED` | `REVIEWING`, `DISMISSED` | Sửa 2 giá trị enum |
| 2 | VoteType enum | `UPVOTE`, `DOWNVOTE` | Enum tên `VoteTarget` với giá trị `POST`, `COMMENT` | Sửa tên + giá trị |
| 3 | Rate limiter phantom | Liệt kê "Sensitive (đổi mật khẩu)" limiter | Chỉ `apiLimiter` và `authLimiter` được apply trong `app.ts` | Xóa rate limiter không tồn tại |

### 4. `docs/03-API/12-admin.md` — Không thay đổi ✅

Đối chiếu `adminRoutes.ts`: 31/31 endpoints khớp chính xác (method, path, middleware, controller).

### 5. `docs/04-FEATURES.md` — 3 edits

| # | Sai lệch | Docs cũ | Code thực tế | Sửa |
|---|----------|---------|-------------|-----|
| 1 | Admin Client UX | "Dashboard charts \| Recharts", "Data tables \| TanStack Table" | Stat cards (không charts), custom tables (không TanStack Table) | Sửa 2 dòng trong bảng UX |
| 2 | Moderation permissions | "View masked content ADMIN only", "Ban user chưa rõ MOD" | MOD/ADMIN can view masked, MOD can change status | Sửa 3 mục |
| 3 | Permission matrix | Tags MOD ❌, Users MOD "View only", Audit MOD "⚠️ Own" | Tags MOD ✅, Users MOD "View+Ban", Audit MOD ❌, Settings MOD "✅ read-only" | Sửa 4 ô + thêm 1 dòng |

### 6. `docs/09-SECURITY.md` — 5 edits

| # | Sai lệch | Docs cũ | Code thực tế | Sửa |
|---|----------|---------|-------------|-----|
| 1 | bcrypt salt rounds | `SALT_ROUNDS = 10` | `SALT_ROUNDS = 12` (authService.ts:7) | Sửa 10 → 12 |
| 2 | Password policy | "min 6 ký tự" | Regex: min 8 + uppercase + lowercase + digit | Sửa mô tả |
| 3 | Rate limiting | 5 tiers liệt kê (bao gồm createContentLimiter, voteLimiter, searchLimiter) | Chỉ 2 được apply: `apiLimiter` (300/15m), `authLimiter` (10/15m). 3 cái còn lại defined nhưng KHÔNG apply | Viết lại section, thêm ghi chú |
| 4 | RBAC permission matrix | Tags MOD ❌, Ban MOD ❌, Audit "⚠️ Own" | Tags MOD ✅, Ban MOD ✅, Audit MOD ❌ | Sửa 3 ô + thêm "Delete users" row |
| 5 | Audit checklist | Ghi chú password "min 6" | Cập nhật thành "min 8 + complexity" | Sửa ghi chú |

### 7. `docs/06-ROADMAP.md` — 1 edit

| # | Sai lệch | Docs cũ | Code thực tế | Sửa |
|---|----------|---------|-------------|-----|
| 1 | Admin tools mô tả | "dashboard + charts" | Dashboard dùng stat cards, không có charts | "dashboard + management tools" |

### 8. `README.md` (root) — 2 edits

| # | Sai lệch | Docs cũ | Code thực tế | Sửa |
|---|----------|---------|-------------|-----|
| 1 | Admin Client tech stack | "TanStack Table 8.11" trong bảng Tech Stack | TanStack Table không được import | Xóa, thay bằng "shadcn/ui" |
| 2 | Features list | "charts, data tables" | Stat cards, custom tables | Sửa mô tả |

### 9. `admin-client/README.md` — 6 edits

| # | Sai lệch | Docs cũ | Code thực tế | Sửa |
|---|----------|---------|-------------|-----|
| 1 | Title | "TailwindCSS v3 + TanStack Table" | TanStack Table không dùng | Xóa khỏi title |
| 2 | Tech Stack table | 13 deps liệt kê bình thường | 6 deps chưa import (react-query, react-table, react-hook-form, zod, recharts, date-fns) | Thêm cột "Sử dụng" + tech debt note |
| 3 | So sánh Frontend | "Table library: TanStack Table" | Custom tables (shadcn/ui) | Sửa |
| 4 | Permission Matrix | "Users (ban, role) MOD ❌", "Settings MOD ❌" | MOD can ban users (not role), Settings page is read-only for all | Tách Users thành 2 dòng, Settings MOD "✅ read-only" + thêm ghi chú routing |
| 5 | Data Tables section | "Tất cả sử dụng @tanstack/react-table" | Custom HTML tables + shadcn/ui | Viết lại toàn bộ section |
| 6 | Dashboard Charts section | "Recharts: Line, Bar, Pie charts" | Stat cards only, recharts chưa import | Viết lại thành "Dashboard Stats" |

### 10. Các file không thay đổi

| File | Lý do |
|------|-------|
| `docs/02-DATABASE.md` | Khớp 100% với `schema.prisma` |
| `docs/03-API/12-admin.md` | 31/31 endpoints khớp với `adminRoutes.ts` |
| `docs/05-CHANGELOG.md` | Nhật ký thay đổi — nội dung lịch sử, chính xác |
| `docs/07-DEPLOYMENT.md` | Hướng dẫn setup chính xác (ports, env vars, commands) |
| `docs/08-TESTING.md` | Phản ánh đúng: chưa có automated tests |
| `backend/README.md` | Chính xác (controllers, services, middlewares, routes) |
| `frontend/README.md` | Chính xác (pages, hooks, contexts, components) |

---

## 3 phát hiện nghiêm trọng nhất

### 1. Admin Client — 6 unused dependencies
**`@tanstack/react-query`**, **`@tanstack/react-table`**, **`react-hook-form`**, **`zod`**, **`recharts`**, **`date-fns`** — tất cả có trong `package.json` nhưng không có `import` nào trong source code. Tài liệu mô tả sai rằng app dùng TanStack Table cho data tables và Recharts cho dashboard charts. Thực tế app dùng `useState`/`useEffect`/`axios` cho data fetching và custom HTML tables.

### 2. Bcrypt salt rounds & Password policy
Tài liệu nói salt = 10, password min 6 ký tự. Code thực tế: `SALT_ROUNDS = 12`, password regex yêu cầu min 8 + uppercase + lowercase + digit.

### 3. Rate limiters — 3/5 không được apply
`createContentLimiter`, `voteLimiter`, `searchLimiter` được **define** trong `securityMiddleware.ts` nhưng **KHÔNG được apply** trong `app.ts`. Chỉ `apiLimiter` (300 req/15m) và `authLimiter` (10 req/15m) thực sự hoạt động.

---

## Khuyến nghị

1. **Dọn unused deps**: Chạy `npm uninstall @tanstack/react-query @tanstack/react-table react-hook-form zod recharts date-fns` trong `admin-client/` — hoặc integrate chúng nếu cần.
2. **Apply rate limiters**: Mount `createContentLimiter`, `voteLimiter`, `searchLimiter` vào routes tương ứng trong `app.ts`.
3. **Permission routing**: Cân nhắc thêm `requireAdmin` vào ProtectedRoute cho các page ADMIN-only (Users role/delete, Categories, Audit Logs) thay vì chỉ dựa vào API 403.
