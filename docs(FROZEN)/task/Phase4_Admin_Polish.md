# PHASE 4: ADMIN & POLISH

## Mô tả
Admin dashboard, Reports, Optimization

## Thời gian ước tính
1.5-2 tuần

## Các Task

### 📦 TASK P4-01: Admin Dashboard API

**Mô tả:** API thống kê cho Admin

**Dependencies:** Tất cả schema

**Endpoints:**
```
GET /api/v1/admin/dashboard
```

**Response:**
```json
{
  "stats": {
    "totalUsers": 1500,
    "totalPosts": 5000,
    "totalComments": 25000,
    "newUsersToday": 15,
    "newPostsToday": 50
  },
  "recentActivities": [...],
  "pendingReports": 10
}
```

**Output:**
- Dashboard stats API hoạt động

**Ước tính:** 2-3 giờ

---

### 📦 TASK P4-02: Admin Users Management API

**Mô tả:** API quản lý users

**Dependencies:** P1-03

**Endpoints:**
```
GET   /api/v1/admin/users              → List users (paginated)
PATCH /api/v1/admin/users/:id/role     → Change role
PATCH /api/v1/admin/users/:id/status   → Activate/Deactivate
```

**Output:**
- User management API hoạt động

**Ước tính:** 2-3 giờ

---

### 📦 TASK P4-03: Admin Reports Management API

**Mô tả:** API xử lý reports

**Dependencies:** P3-14

**Endpoints:**
```
GET   /api/v1/admin/reports            → List reports
PATCH /api/v1/admin/reports/:id        → Update status
```

**Output:**
- Reports management API

**Ước tính:** 2 giờ

---

### 📦 TASK P4-04: Frontend - Admin Layout

**Mô tả:** Layout riêng cho Admin area

**Dependencies:** P1-15

**Steps:**
```bash
1. Tạo AdminLayout.tsx
2. Admin sidebar với navigation
3. Admin header
4. Wrap trong AdminRoute
```

**Output:**
- Admin layout hoạt động

**Ước tính:** 2-3 giờ

---

### 📦 TASK P4-05: Frontend - Admin Dashboard

**Mô tả:** Trang dashboard admin

**Dependencies:** P4-01, P4-04

**Steps:**
```bash
1. Tạo pages/admin/DashboardPage.tsx
2. Stat cards (users, posts, etc.)
3. Charts (optional với recharts)
4. Recent activities table
5. Pending reports count
```

**Output:**
- Dashboard hiển thị stats

**Ước tính:** 3-4 giờ

---

### 📦 TASK P4-06: Frontend - Users Management

**Mô tả:** Trang quản lý users

**Dependencies:** P4-02, P4-04

**Steps:**
```bash
1. Tạo pages/admin/UsersManagePage.tsx
2. DataTable với users
3. Search, filter, sort
4. Actions: change role, activate/deactivate
5. Confirmation dialogs
```

**Output:**
- User management hoạt động

**Ước tính:** 4-5 giờ

---

### 📦 TASK P4-07: Frontend - Reports Management

**Mô tả:** Trang xử lý reports

**Dependencies:** P4-03, P4-04

**Steps:**
```bash
1. Tạo pages/admin/ReportsPage.tsx
2. List reports với filters
3. View report details
4. Actions: resolve, reject
5. Quick navigation to reported content
```

**Output:**
- Reports management hoạt động

**Ước tính:** 3-4 giờ

---

### 📦 TASK P4-08: Edit Post Page

**Mô tả:** Trang chỉnh sửa bài viết

**Dependencies:** P2-06, P2-15

**Steps:**
```bash
1. Tạo EditPostPage.tsx
2. Load existing post data
3. Reuse PostForm component
4. Authorization check (owner only)
5. Submit update
```

**Output:**
- Edit post hoạt động

**Ước tính:** 2-3 giờ

---

### 📦 TASK P4-09: Error Handling & Loading States

**Mô tả:** Xử lý lỗi và loading toàn app

**Dependencies:** All Frontend tasks

**Steps:**
```bash
1. Tạo ErrorBoundary component
2. Tạo các error pages (404, 500)
3. Loading skeletons cho mỗi page
4. Toast notifications cho actions
5. Retry logic cho failed requests
```

**Output:**
- UX tốt hơn với error handling

**Ước tính:** 3-4 giờ

---

### 📦 TASK P4-10: Responsive Design Polish

**Mô tả:** Hoàn thiện responsive

**Dependencies:** All Frontend UI tasks

**Steps:**
```bash
1. Test trên mobile/tablet/desktop
2. Fix layout issues
3. Mobile navigation (hamburger menu)
4. Touch-friendly interactions
5. Mobile-specific adjustments
```

**Output:**
- App responsive trên mọi device

**Ước tính:** 4-5 giờ

---

### 📦 TASK P4-11: Performance Optimization

**Mô tả:** Tối ưu performance

**Dependencies:** All tasks

**Steps:**
```bash
1. React.memo cho heavy components
2. useMemo/useCallback optimization
3. Lazy loading cho routes
4. Image optimization
5. Bundle analysis và code splitting
```

**Output:**
- Load time < 3s
- Smooth interactions

**Ước tính:** 3-4 giờ

---

### 📦 TASK P4-12: Security Hardening

**Mô tả:** Tăng cường bảo mật

**Dependencies:** All Backend tasks

**Steps:**
```bash
1. Rate limiting cho tất cả endpoints
2. Input sanitization
3. SQL injection prevention (Prisma đã handle)
4. XSS prevention
5. CORS configuration
6. Helmet security headers
```

**Output:**
- App bảo mật hơn

**Ước tính:** 3-4 giờ

---

### 📦 TASK P4-13: Database Seeding

**Mô tả:** Tạo data mẫu

**Dependencies:** All Schema tasks

**Steps:**
```bash
1. Tạo prisma/seed.ts
2. Seed categories (10+)
3. Seed tags (20+)
4. Seed users (admin, mod, members)
5. Seed posts với comments
6. npm run db:seed script
```

**Output:**
- Database có data demo

**Ước tính:** 2-3 giờ

---

### 📦 TASK P4-14: Documentation

**Mô tả:** Viết tài liệu

**Steps:**
```bash
1. README.md với setup instructions
2. API documentation (Swagger/Postman collection)
3. Database schema diagram
4. Deployment guide
5. Code comments
```

**Output:**
- Documentation đầy đủ

**Ước tính:** 4-5 giờ

---

### 📦 TASK P4-15: Final Testing & Bug Fixes

**Mô tả:** Testing tổng thể

**Steps:**
```bash
1. Test tất cả user flows
2. Test authorization
3. Test edge cases
4. Fix bugs phát hiện
5. Cross-browser testing
```

**Output:**
- App hoạt động stable

**Ước tính:** 5-7 giờ