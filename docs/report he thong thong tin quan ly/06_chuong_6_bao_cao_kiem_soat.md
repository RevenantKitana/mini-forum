# CHƯƠNG 6
# HỆ THỐNG BÁO CÁO VÀ KIỂM SOÁT

---

## 6.1 Tổng quan hệ thống kiểm soát

### 6.1.1 Các tầng kiểm soát trong MINI-FORUM

MINI-FORUM có 3 tầng kiểm soát bổ sung cho nhau:

**Hình 6.1 — Ba tầng kiểm soát**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CÁC TẦNG KIỂM SOÁT                          │
├─────────────────────────────────────────────────────────────────┤
│  TẦNG 1: PREVENTIVE CONTROLS (Ngăn ngừa)                       │
│  • Authentication + Authorization (JWT + RBAC)                 │
│  • Input validation (Zod schema tại API boundary)              │
│  • Rate limiting (express-rate-limit)                          │
│  • Category permission (view/post/comment)                     │
├─────────────────────────────────────────────────────────────────┤
│  TẦNG 2: DETECTIVE CONTROLS (Phát hiện)                        │
│  • Community reporting (báo cáo vi phạm bởi members)           │
│  • Admin Dashboard (thống kê bất thường)                       │
│  • Operational Metrics (error rate, response time)             │
│  • Audit Trail (ai làm gì, khi nào, với dữ liệu nào)          │
├─────────────────────────────────────────────────────────────────┤
│  TẦNG 3: CORRECTIVE CONTROLS (Khắc phục)                       │
│  • Report Management Workflow (moderator xử lý reports)         │
│  • Content moderation (ẩn/xóa vi phạm)                         │
│  • User sanctions (ban, role change)                           │
│  • Soft delete (data có thể phục hồi)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6.2 Admin Dashboard — Metrics quản trị

### 6.2.1 DashboardPage — Thống kê vận hành

`DashboardPage.tsx` trong `admin-client` hiển thị các chỉ số cộng đồng theo thời gian thực:

**Bảng 6.1 — Metrics trên Admin Dashboard**

| Metric | Query tương ứng | Tần suất cập nhật | Ý nghĩa quản trị |
|--------|---------------|-----------------|----------------|
| **Tổng số Users** | `SELECT COUNT(*) FROM users WHERE is_active = true` | Mỗi tải trang | Quy mô cộng đồng |
| **Users mới hôm nay** | `WHERE created_at >= CURRENT_DATE` | Mỗi tải trang | Tốc độ tăng trưởng |
| **Tổng bài viết** | `SELECT COUNT(*) FROM posts WHERE status = 'PUBLISHED'` | Mỗi tải trang | Lượng nội dung |
| **Bài viết hôm nay** | `WHERE created_at >= CURRENT_DATE AND status = 'PUBLISHED'` | Mỗi tải trang | Mức độ hoạt động |
| **Tổng bình luận** | `SELECT COUNT(*) FROM comments WHERE status = 'VISIBLE'` | Mỗi tải trang | Tương tác cộng đồng |
| **Reports PENDING** | `SELECT COUNT(*) FROM reports WHERE status = 'PENDING'` | Mỗi tải trang | **Alert!** Cần xử lý |
| **Reports REVIEWING** | `SELECT COUNT(*) FROM reports WHERE status = 'REVIEWING'` | Mỗi tải trang | Đang trong quá trình |

### 6.2.2 Biểu đồ thống kê theo thời gian

Admin Dashboard cũng cung cấp biểu đồ xu hướng:

**Hình 6.2 — Các biểu đồ thống kê**

```
┌──────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD — MINI-FORUM                               │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 1,234    │ │ +23      │ │ 5,678    │ │ 3 ⚠️     │       │
│  │ Users    │ │ New today│ │ Posts    │ │ Reports  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  Bài viết mới theo ngày (7 ngày gần nhất)                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │  25 ─────┐                                         │     │
│  │  20 ─    │     ┌──                                 │     │
│  │  15 ─    └──┐  │  ┌──                              │     │
│  │  10 ─       └──┘  │  ┌──                           │     │
│  │   5 ─             └──┘  └──                        │     │
│  │   0 ─T2──T3──T4──T5──T6──T7──CN                   │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Top Categories theo bài viết                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Programming  ████████████████████ 234             │     │
│  │  Technology   ██████████████       156             │     │
│  │  General      ████████             89              │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## 6.3 Operational Dashboard — Metrics kỹ thuật

### 6.3.1 Nguồn dữ liệu: metricsService.ts

`OperationalDashboardPage.tsx` hiển thị metrics kỹ thuật thu thập bởi `metricsMiddleware.ts`:

**Hình 6.3 — Luồng thu thập metrics kỹ thuật**

```
Incoming HTTP Request
        │
        ▼
┌───────────────────────────┐
│  metricsMiddleware        │
│                           │
│  - Ghi start time         │
│  - req.path, req.method   │
└──────────────┬────────────┘
               │
               ▼  (next middleware xử lý)
               │
┌──────────────┴────────────┐
│  Response sent            │
│                           │
│  metricsMiddleware cont:  │
│  - duration = end - start │
│  - status code            │
│  - Lưu vào metricsService │
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────┐
│  metricsService (in-mem)  │
│                           │
│  Map<endpoint, stats> {   │
│    count: number,         │
│    errorCount: number,    │
│    totalDuration: number, │
│    p50: number,           │
│    p95: number,           │
│    p99: number            │
│  }                        │
└───────────────────────────┘
```

**Bảng 6.2 — Metrics kỹ thuật được theo dõi**

| Metric | Nguồn | Ý nghĩa |
|--------|-------|---------|
| **Request rate** | `metricsService.getMetrics()` | Số requests/phút theo endpoint |
| **Error rate** | `status >= 400 / total requests` | % lỗi theo endpoint |
| **P50 latency** | Percentile 50 của response time | Median response time |
| **P95 latency** | Percentile 95 của response time | Response time của 95% requests |
| **P99 latency** | Percentile 99 của response time | Worst-case đáng kể |
| **Top slow endpoints** | Sort by P95 desc | Candidates để tối ưu |

> **Lưu ý:** Metrics được lưu in-memory trong `metricsService` — reset khi server restart. Đây là MVP implementation; production sẽ cần Prometheus/Grafana hoặc tương tự.

---

## 6.4 Audit Trail System

### 6.4.1 Nguyên tắc thiết kế Audit Log

MINI-FORUM implement audit trail theo nguyên tắc **non-repudiation** — mọi hành động có thể được truy vết, không thể phủ nhận:

**Bảng 6.3 — Các hành động được ghi audit log**

| Hành động | AuditAction | AuditTarget | Ghi old_value | Ghi new_value |
|----------|------------|------------|:------------:|:------------:|
| Admin ban user | `BAN` | `USER` | Có (is_banned: false) | Có (is_banned: true) |
| Admin unban user | `UNBAN` | `USER` | Có | Có |
| Admin xóa bài viết | `DELETE` | `POST` | Có (status: PUBLISHED) | Có (status: DELETED) |
| Moderator ẩn comment | `HIDE` | `COMMENT` | Có | Có |
| Admin restore bài | `SHOW` | `POST` | Có | Có |
| Admin ghim bài | `PIN` | `POST` | Có | Có |
| Admin khóa thread | `LOCK` | `POST` | Có | Có |
| Admin thay đổi role | `ROLE_CHANGE` | `USER` | Có (role cũ) | Có (role mới) |
| Admin approve report | `UPDATE` | `REPORT` | Có (PENDING) | Có (RESOLVED) |
| Admin thay đổi category | `UPDATE` | `CATEGORY` | Có | Có |
| Admin thay đổi config | `UPDATE` | `SETTINGS` | Có | Có |
| User đăng nhập | `LOGIN` | `USER` | Không | Không |
| User đăng xuất | `LOGOUT` | `USER` | Không | Không |
| Admin xem content ẩn | `VIEW_MASKED_CONTENT` | `COMMENT` | Không | Không |

### 6.4.2 Cấu trúc một Audit Log Record

```json
{
  "id": 1234,
  "user_id": 1,
  "action": "BAN",
  "target_type": "USER",
  "target_id": 99,
  "target_name": "username_spam_account",
  "old_value": "{\"is_banned\": false, \"role\": \"MEMBER\"}",
  "new_value": "{\"is_banned\": true, \"ban_reason\": \"Spam và vi phạm nội quy\"}",
  "ip_address": "1.2.3.4",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0...)",
  "created_at": "2026-03-15T08:30:00.000Z"
}
```

**Đặc điểm bất biến (Immutability):**
- Không có endpoint DELETE audit_logs
- Không có endpoint UPDATE audit_logs
- Chỉ có INSERT (tự động trong service layer)
- Row-level security trong PostgreSQL ngăn xóa

### 6.4.3 API Endpoints — Audit Log

**Bảng 6.4 — API Endpoints: Audit Log**

| Method | Endpoint | Chức năng | Auth |
|--------|---------|-----------|------|
| GET | `/admin/audit-logs` | Lấy danh sách audit logs (phân trang) | Có (Admin) |
| GET | `/admin/audit-logs?action=BAN` | Filter theo action | Có (Admin) |
| GET | `/admin/audit-logs?target_type=POST` | Filter theo target | Có (Admin) |
| GET | `/admin/audit-logs?user_id=123` | Filter theo người thực hiện | Có (Admin) |
| GET | `/admin/audit-logs?from=2026-01-01` | Filter theo thời gian | Có (Admin) |

### 6.4.4 Giao diện tra cứu Audit Log

**Hình 6.4 — Giao diện AuditLogPage (admin-client)**

```
┌────────────────────────────────────────────────────────────────────┐
│  AUDIT LOG                                           [Export CSV]  │
│                                                                    │
│  Filter: [Action ▼] [Target ▼] [User ID:___] [From:___] [To:___]  │
│          [Search                               ] [Apply]           │
│                                                                    │
│  Thời gian         User      Action         Target    Detail      │
│  ─────────────────────────────────────────────────────────────    │
│  2026-03-15 08:30  admin     BAN            USER:99   username_sp │
│  2026-03-14 16:45  mod1      HIDE           COMMENT:  "nội dung   │
│                                             115       vi phạm..." │
│  2026-03-14 15:20  admin     UPDATE         SETTINGS  config_key: │
│                                                       EDIT_LIMIT  │
│  2026-03-13 10:00  admin     ROLE_CHANGE    USER:45   MEMBER →    │
│                                                       MODERATOR   │
│                                                                    │
│  [1] [2] [3] ... [50]                          Hiển thị 1-20/234  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 6.5 Report Management Workflow

### 6.5.1 Vòng đời đầy đủ của Report

**Hình 6.5 — Report Management Workflow chi tiết**

```
┌──────────────────────────────────────────────────────────────────────┐
│                    REPORT LIFECYCLE                                 │
│                                                                      │
│  ① Member báo cáo vi phạm                                           │
│     │                                                                │
│     ▼                                                                │
│  reports { status: PENDING, reporter_id: X,                         │
│            target_type: POST/COMMENT/USER, reason: "...", }         │
│     │                                                                │
│  ② Moderator/Admin mở admin-client                                  │
│     │                                                                │
│     ▼                                                                │
│  GET /admin/reports?status=PENDING                                  │
│     → Danh sách reports chờ xử lý                                   │
│     │                                                                │
│  ③ Xem chi tiết report                                              │
│     │                                                                │
│     ├── Xem nội dung bị báo cáo                                     │
│     ├── Xem lý do báo cáo                                           │
│     └── Xem lịch sử báo cáo của reporter (có báo cáo sai không?)   │
│                                                                      │
│  ④ Bắt đầu xem xét (optional)                                       │
│     PATCH /reports/:id { status: REVIEWING }                        │
│     → Ngăn Moderator khác xử lý cùng lúc                           │
│     │                                                                │
│  ⑤ Quyết định                                                       │
│     │                                                                │
│     ├── RESOLVE (vi phạm xác nhận)                                  │
│     │   PATCH /reports/:id { status: RESOLVED, review_note: "..." } │
│     │   │                                                            │
│     │   └── Hành động kèm theo (tuỳ chọn):                          │
│     │       ├── DELETE post  → posts.status = DELETED               │
│     │       ├── HIDE comment → comments.status = HIDDEN             │
│     │       └── BAN user     → users.is_banned = true               │
│     │                                                                │
│     └── DISMISS (không vi phạm)                                     │
│         PATCH /reports/:id { status: DISMISSED, review_note: "..." }│
│                                                                      │
│  ⑥ Ghi audit_log cho mọi action (BẮT BUỘC)                        │
│     audit_logs.action = UPDATE, target_type = REPORT               │
│     + Ghi thêm cho từng action trên nội dung                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.5.2 API Endpoints — Report Management

**Bảng 6.5 — API Endpoints: Report Management**

| Method | Endpoint | Chức năng | Auth |
|--------|---------|-----------|------|
| POST | `/reports` | Member tạo báo cáo | Có (Member+) |
| GET | `/admin/reports` | Lấy danh sách reports | Có (Mod/Admin) |
| GET | `/admin/reports/:id` | Xem chi tiết report | Có (Mod/Admin) |
| PATCH | `/admin/reports/:id` | Cập nhật status report | Có (Mod/Admin) |
| GET | `/admin/reports/stats` | Thống kê reports theo status | Có (Admin) |

### 6.5.3 Dashboard Reports Statistics

**Bảng 6.6 — Thống kê báo cáo theo trạng thái**

| Trạng thái | Ý nghĩa quản trị | Threshold cảnh báo |
|-----------|----------------|-------------------|
| `PENDING` | Chờ xử lý | > 10 → cần thêm moderator |
| `REVIEWING` | Đang xử lý | Không cần alert |
| `RESOLVED` | Đã xác nhận vi phạm và xử lý | Tracking để đánh giá moderation quality |
| `DISMISSED` | Báo cáo sai | Tỷ lệ DISMISSED/RESOLVED cao → community education needed |

---

## 6.6 User Management Dashboard

### 6.6.1 API Endpoints — User Admin

**Bảng 6.7 — API Endpoints: Admin User Management**

| Method | Endpoint | Chức năng |
|--------|---------|-----------|
| GET | `/admin/users` | Danh sách users (phân trang, search, filter) |
| GET | `/admin/users/:id` | Chi tiết user + history |
| PATCH | `/admin/users/:id/ban` | Ban user |
| PATCH | `/admin/users/:id/unban` | Unban user |
| PATCH | `/admin/users/:id/role` | Thay đổi role |
| GET | `/admin/users/:id/audit-logs` | Xem audit log của user |
| GET | `/admin/users/:id/posts` | Xem bài viết của user |
| GET | `/admin/users/:id/reports` | Xem báo cáo liên quan user |

### 6.6.2 Quy trình Ban User

**Hình 6.6 — Quy trình Ban User**

```
Admin quyết định ban user B
        │
        ▼
PATCH /admin/users/:id/ban
{ reason: "Spam liên tục, vi phạm nội quy nhiều lần" }
        │
        ▼
┌──────────────────────────────────────────────┐
│  userService.banUser()                       │
│                                              │
│  1. Kiểm tra target không phải ADMIN         │
│     (Admin không thể ban Admin khác)         │
│                                              │
│  2. UPDATE users SET                         │
│     is_banned = true                         │
│     WHERE id = targetId                      │
│                                              │
│  3. Xóa tất cả refresh_tokens của user       │
│     (force logout mọi phiên)                │
│                                              │
│  4. Ghi audit_log:                           │
│     action: BAN, target: USER:targetId       │
│     old_value: { is_banned: false }          │
│     new_value: { is_banned: true, reason }   │
└──────────────────────────────────────────────┘
```

---

## 6.7 Hệ thống kiểm soát chất lượng nội dung

### 6.7.1 Content Masking

Admin/Moderator có thể ẩn nội dung nhạy cảm mà không xóa hoàn toàn:

```
Comment có nội dung không phù hợp:
├── comments.is_content_masked = true
└── Hiển thị trong frontend:
    "[Nội dung đã bị ẩn]  [Xem nội dung] (chỉ Admin/Mod)"

Khi Admin xem nội dung bị mask:
→ Ghi audit_log: action: VIEW_MASKED_CONTENT, target: COMMENT
```

### 6.7.2 User Block (Chặn người dùng)

**Hình 6.7 — Cơ chế User Block**

```
User A block User B:
        │
        ▼
POST /users/me/blocks { blocked_id: B.id }
        │
        ▼
INSERT user_blocks {
  blocker_id: A.id,
  blocked_id: B.id,
  created_at: now()
}
        │
        ▼
Tác động:
├── B không thể gửi comment trực tiếp cho A trong context
└── A không thấy bài viết/comment của B trong feed
    (filter ở query layer)
```

---

## 6.8 Tổng kết hệ thống kiểm soát

### 6.8.1 Ma trận kiểm soát toàn diện

**Bảng 6.8 — Ma trận các cơ chế kiểm soát**

| Rủi ro | Cơ chế Ngăn ngừa | Cơ chế Phát hiện | Cơ chế Khắc phục |
|--------|-----------------|-----------------|-----------------|
| Truy cập trái phép | JWT + RBAC | Audit log LOGIN attempts | Force logout, ban user |
| Nội dung vi phạm | Category permissions | Community reporting, moderation | Hide/Delete content |
| Spam | Rate limiting | Dashboard metrics | Ban user |
| Brute-force | Rate limiting `/auth/*` | Error rate monitoring | Auto-block IP |
| Dữ liệu bị xóa nhầm | Soft delete | Audit log với old_value | Restore từ soft delete |
| Abuse báo cáo | — | Theo dõi tỷ lệ DISMISSED | Hạn chế quyền báo cáo |
| Tài khoản bị đánh cắp | Short TTL access token | Audit log bất thường | Revoke refresh tokens |

### 6.8.2 Báo cáo thống kê định kỳ (từ audit_log)

Admin có thể trích xuất báo cáo định kỳ từ `audit_logs`:

```sql
-- Báo cáo hoạt động moderation trong tháng
SELECT
  u.username AS moderator,
  al.action,
  al.target_type,
  COUNT(*) AS action_count
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE
  al.created_at >= DATE_TRUNC('month', NOW())
  AND al.action IN ('BAN', 'UNBAN', 'HIDE', 'DELETE', 'SHOW')
GROUP BY u.username, al.action, al.target_type
ORDER BY moderator, action_count DESC;
```

---

## Tóm tắt chương 6

Chương 6 đã trình bày hệ thống báo cáo và kiểm soát toàn diện của MINI-FORUM với 3 tầng:

1. **Preventive Controls:** Authentication/Authorization, Zod validation, rate limiting, permission-aware categories
2. **Detective Controls:**
   - Admin Dashboard với 7 metrics thời gian thực
   - Operational Dashboard với HTTP performance metrics
   - Audit Trail — 15 loại AuditAction, ghi old/new value JSON
3. **Corrective Controls:**
   - Report Workflow 4 trạng thái (PENDING → REVIEWING → RESOLVED/DISMISSED)
   - User Ban/Unban với force logout toàn bộ phiên
   - Content Masking, Soft Delete, User Block

**Điểm nổi bật:** Mọi hành động của Admin/Moderator đều bắt buộc ghi `audit_logs` — không có backdoor, không thể bypass. Đây là đặc tính non-repudiation quan trọng của một MIS chuẩn mực.

Chương cuối sẽ đánh giá toàn diện thiết kế hệ thống và rút ra các bài học từ quá trình xây dựng.
