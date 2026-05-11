# CHƯƠNG 6
# HỆ THỐNG BÁO CÁO VÀ KIỂM SOÁT
---

## Giới thiệu chương

Hệ thống thông tin quản lý không chỉ dừng lại ở việc thu thập và xử lý dữ liệu — một MIS trưởng thành còn phải cung cấp cơ chế **kiểm soát toàn diện** để đảm bảo rằng mọi hoạt động trong hệ thống diễn ra đúng quy tắc, mọi vi phạm đều được phát hiện và khắc phục kịp thời, và mọi quyết định của người quản trị đều có thể được truy vết.

Chương 6 trình bày toàn bộ cơ sở hạ tầng kiểm soát và báo cáo của MINI-FORUM, được tổ chức theo mô hình ba tầng kiểm soát chuẩn của MIS: **Preventive Controls** (ngăn ngừa rủi ro trước khi xảy ra), **Detective Controls** (phát hiện bất thường đang diễn ra) và **Corrective Controls** (khắc phục sau khi vi phạm được xác nhận). Mỗi tầng đều có đầy đủ thiết kế kỹ thuật, giao diện người dùng và API tương ứng.

---

## 6.1 Tổng quan hệ thống kiểm soát

### 6.1.1 Sự cần thiết của kiểm soát trong Community MIS

Không giống với Enterprise MIS nơi người dùng là nhân viên nội bộ được kiểm soát bởi hợp đồng lao động, **Community MIS** như MINI-FORUM phải đối mặt với người dùng từ bên ngoài — những người có thể có động cơ phá hoại, spam, hoặc phát tán nội dung vi phạm. Đây là thách thức kiểm soát đặc thù mà các mô hình MIS truyền thống không cần xử lý.

Ba câu hỏi kiểm soát cốt lõi của một Community MIS:

1. **Ngăn ngừa:** Làm thế nào để người dùng không thể thực hiện những gì họ không được phép?
2. **Phát hiện:** Làm thế nào để nhận biết khi nào có vi phạm đang xảy ra?
3. **Khắc phục:** Khi vi phạm xảy ra rồi, làm thế nào để xử lý nhanh và không để lại hệ quả lâu dài?

MINI-FORUM trả lời ba câu hỏi này bằng kiến trúc kiểm soát ba tầng được mô tả dưới đây.

### 6.1.2 Kiến trúc ba tầng kiểm soát

**Hình 6.1 — Kiến trúc ba tầng kiểm soát của MINI-FORUM**

```
╔═══════════════════════════════════════════════════════════════════════╗
║               KIẾN TRÚC KIỂM SOÁT BA TẦNG — MINI-FORUM              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ╔═══════════════════════════════════════════════════════════════╗    ║
║  ║  TẦNG 1: PREVENTIVE CONTROLS (Ngăn ngừa)                     ║    ║
║  ║  Mục tiêu: Ngăn hành vi trái phép TRƯỚC KHI xảy ra           ║    ║
║  ║                                                               ║    ║
║  ║  ┌───────────────┐ ┌────────────────┐ ┌──────────────────┐   ║    ║
║  ║  │  JWT + RBAC   │ │  Zod Validate  │ │  Rate Limiting   │   ║    ║
║  ║  │  (AuthN/Z)    │ │ (Input Guard)  │ │  (Anti-Abuse)    │   ║    ║
║  ║  └───────────────┘ └────────────────┘ └──────────────────┘   ║    ║
║  ║  ┌──────────────────────────────────────────────────────┐     ║    ║
║  ║  │   Category Permission (view / post / comment)        │     ║    ║
║  ║  └──────────────────────────────────────────────────────┘     ║    ║
║  ╚═══════════════════════════════════════════════════════════════╝    ║
║                           ▼ Nếu vượt qua                             ║
║  ╔═══════════════════════════════════════════════════════════════╗    ║
║  ║  TẦNG 2: DETECTIVE CONTROLS (Phát hiện)                      ║    ║
║  ║  Mục tiêu: Nhận biết bất thường ĐANG diễn ra                 ║    ║
║  ║                                                               ║    ║
║  ║  ┌───────────────┐ ┌────────────────┐ ┌──────────────────┐   ║    ║
║  ║  │   Community   │ │     Admin      │ │   Operational    │   ║    ║
║  ║  │   Reporting   │ │   Dashboard    │ │    Dashboard     │   ║    ║
║  ║  │ (member báo)  │ │  (biz metrics) │ │ (HTTP perf)      │   ║    ║
║  ║  └───────────────┘ └────────────────┘ └──────────────────┘   ║    ║
║  ║  ┌──────────────────────────────────────────────────────┐     ║    ║
║  ║  │   Audit Trail (ai làm gì, lúc nào, với dữ liệu nào)  │     ║    ║
║  ║  └──────────────────────────────────────────────────────┘     ║    ║
║  ╚═══════════════════════════════════════════════════════════════╝    ║
║                           ▼ Khi phát hiện vi phạm                    ║
║  ╔═══════════════════════════════════════════════════════════════╗    ║
║  ║  TẦNG 3: CORRECTIVE CONTROLS (Khắc phục)                     ║    ║
║  ║  Mục tiêu: Xử lý vi phạm ĐÃ xảy ra, khôi phục trật tự       ║    ║
║  ║                                                               ║    ║
║  ║  ┌───────────────┐ ┌────────────────┐ ┌──────────────────┐   ║    ║
║  ║  │    Report     │ │    Content     │ │  User Sanctions  │   ║    ║
║  ║  │   Workflow    │ │  Moderation    │ │(Ban/Role Change) │   ║    ║
║  ║  │  (4 trạng    │ │(ẩn/xóa/khôi   │ │  + Force Logout  │   ║    ║
║  ║  │    thái)     │ │   phục)        │ │                  │   ║    ║
║  ║  └───────────────┘ └────────────────┘ └──────────────────┘   ║    ║
║  ║  ┌──────────────────────────────────────────────────────┐     ║    ║
║  ║  │   Soft Delete (dữ liệu có thể phục hồi hoàn toàn)    │     ║    ║
║  ║  └──────────────────────────────────────────────────────┘     ║    ║
║  ╚═══════════════════════════════════════════════════════════════╝    ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### 6.1.3 Quan hệ giữa ba tầng kiểm soát

Ba tầng kiểm soát không hoạt động độc lập mà tạo thành một **vòng kiểm soát liên tục** (Control Loop). Kết quả của tầng Corrective được phản hồi vào tầng Preventive để cải thiện các quy tắc ngăn ngừa — ví dụ, nếu một loại nội dung vi phạm liên tục bị report và resolve, admin có thể cân nhắc thêm category permission nghiêm ngặt hơn hoặc điều chỉnh rate limiting cho phù hợp.

**Bảng 6.1 — So sánh ba tầng kiểm soát**

| Tiêu chí | Preventive | Detective | Corrective |
|---------|-----------|----------|-----------|
| **Thời điểm tác động** | Trước khi vi phạm | Trong khi vi phạm | Sau khi vi phạm |
| **Chi phí triển khai** | Cao (thiết kế từ đầu) | Trung bình | Thấp |
| **Hiệu quả** | Cao nhất — ngăn hoàn toàn | Trung bình — có độ trễ | Thấp hơn — đã có thiệt hại |
| **Ví dụ trong MINI-FORUM** | JWT, Zod validate | Report system, Audit log | Ban user, Delete post |
| **Nhân lực vận hành** | Tối thiểu (tự động) | Cần monitoring | Cần moderator xử lý |

---

## 6.2 Tầng 1 — Preventive Controls: Kiểm soát ngăn ngừa

### 6.2.1 Authentication & Authorization (JWT + RBAC)

Cơ chế xác thực và phân quyền là lớp bảo vệ đầu tiên và quan trọng nhất. Mọi request đến backend đều phải đi qua hai lớp middleware:

**Lớp 1 — `authMiddleware.authenticate()`:** Xác minh JWT access token trong `Authorization: Bearer <token>` header. Nếu token hợp lệ, thông tin user được gắn vào `req.user` để các middleware tiếp theo sử dụng.

**Lớp 2 — `roleMiddleware.requireRole(role)`:** Kiểm tra role của user có đủ quyền truy cập endpoint này không. MINI-FORUM triển khai RBAC với phân cấp tuyến tính:

```
GUEST (không đăng nhập)
    └─► MEMBER (đã xác thực email)/BOT (service account cho AI)
            └─► MODERATOR (được admin nâng cấp)
                    └─► ADMIN (quyền cao nhất)
                            
```

Mỗi role kế thừa toàn bộ quyền của role bên dưới, cộng thêm các quyền đặc thù:

**Bảng 6.2 — Phân quyền theo Role (RBAC Matrix)**

| Hành động | GUEST | MEMBER | MODERATOR | ADMIN | BOT |
|----------|:-----:|:------:|:---------:|:-----:|:---:|
| Đọc bài viết public | ✓ | ✓ | ✓ | ✓ | ✓ |
| Đọc bài viết category restricted | ✗ | ✓ | ✓ | ✓ | ✓ |
| Tạo bài viết | ✗ | ✓ | ✓ | ✓ | ✓ |
| Bình luận | ✗ | ✓ | ✓ | ✓ | ✓ |
| Vote (upvote/downvote) | ✗ | ✓ | ✓ | ✓ | ✗ |
| Báo cáo vi phạm | ✗ | ✓ | ✓ | ✓ | ✗ |
| Ẩn/Xóa comment của user khác | ✗ | ✗ | ✓ | ✓ | ✗ |
| Xử lý report | ✗ | ✗ | ✓ | ✓ | ✗ |
| Ban/Unban user | ✗ | ✗ | ✗ | ✓ | ✗ |
| Xem Audit Log | ✗ | ✗ | ✗ | ✓ | ✗ |
| Thay đổi cấu hình hệ thống | ✗ | ✗ | ✗ | ✓ | ✗ |
| Ghim/Khóa bài viết | ✗ | ✗ | ✗ | ✓ | ✗ |

### 6.2.2 Input Validation với Zod Schema

Toàn bộ dữ liệu đầu vào từ client được kiểm tra bằng **Zod schema tại API boundary** — ngay tại controller layer trước khi bất kỳ business logic nào được thực thi. Nguyên tắc này đảm bảo dữ liệu "bẩn" không thâm nhập vào service layer.

**Hình 6.2 — Luồng Input Validation với Zod**

```
Client gửi Request Body:
{
  "title": "...",
  "content": "...",
  "category_id": "abc"   ← sai kiểu dữ liệu!
}
         │
         ▼
┌──────────────────────────────────┐
│  Zod Schema: CreatePostSchema    │
│                                  │
│  title: z.string()               │
│           .min(5)   ← tối thiểu 5 ký tự
│           .max(200) ← tối đa 200 ký tự
│  content: z.string().min(10)     │
│  category_id: z.number()         │
│               .int()  ← phải là số nguyên!
│               .positive()        │
└──────────────┬───────────────────┘
               │ parse()
               ▼
     ┌─────────────────────────────────┐
     │  Validation FAIL                │
     │  (category_id không phải số)    │
     │                                 │
     │  → HTTP 400 Bad Request         │
     │  → { "errors": [                │
     │      { "field": "category_id",  │
     │        "message": "Expected     │
     │         number, received string"│
     │      }] }                       │
     │  → Dừng lại, không vào service  │
     └─────────────────────────────────┘

Nếu PASS → Data đã typed, safe → vào Service layer
```

**Bảng 6.3 — Các Zod Schema validation chính**

| Schema | Validate cho | Quy tắc tiêu biểu |
|--------|------------|-----------------|
| `RegisterSchema` | Đăng ký tài khoản | Email hợp lệ; password min 8 ký tự, có chữ hoa, có số |
| `CreatePostSchema` | Tạo bài viết | title 5–200 ký tự; category_id là positive integer |
| `CreateCommentSchema` | Tạo bình luận | content 1–10.000 ký tự; parent_id optional number |
| `BanUserSchema` | Ban user | reason bắt buộc, tối thiểu 10 ký tự |
| `UpdateReportSchema` | Xử lý report | status thuộc enum; review_note required khi RESOLVE |
| `UpdateCategorySchema` | Sửa danh mục | name không rỗng; permission_level thuộc enum hợp lệ |

### 6.2.3 Rate Limiting — Chống lạm dụng API

`express-rate-limit` được áp dụng với nhiều cấu hình khác nhau tùy mức độ nhạy cảm của endpoint:

**Bảng 6.4 — Cấu hình Rate Limiting theo nhóm endpoint**

| Nhóm Endpoint | Giới hạn | Cửa sổ thời gian | Lý do |
|--------------|:-------:|:--------------:|-------|
| `POST /auth/login` | 10 requests | 15 phút | Chống brute-force mật khẩu |
| `POST /auth/register` | 5 requests | 1 giờ | Chống tạo tài khoản hàng loạt |
| `POST /auth/forgot-password` | 3 requests | 15 phút | Chống spam email reset |
| `POST /auth/resend-otp` | 3 requests | 15 phút | Chống spam OTP |
| `POST /posts` | 20 requests | 1 giờ | Chống spam bài viết |
| `POST /comments` | 30 requests | 15 phút | Chống spam bình luận |
| `POST /reports` | 10 requests | 1 giờ | Chống báo cáo hàng loạt |
| Các endpoint còn lại | 200 requests | 15 phút | Giới hạn mặc định chống DDoS |

Khi vượt quá giới hạn, backend trả về `HTTP 429 Too Many Requests` với header `Retry-After` chỉ định thời gian chờ tối thiểu.

### 6.2.4 Category Permission — Kiểm soát truy cập theo danh mục

Một điểm đặc biệt trong thiết kế Preventive Control của MINI-FORUM là **category-level permission** — mỗi danh mục bài viết cấu hình độc lập ba loại quyền:

```
Category {
  view_permission:    GUEST | MEMBER | MODERATOR | ADMIN
  post_permission:    GUEST | MEMBER | MODERATOR | ADMIN
  comment_permission: GUEST | MEMBER | MODERATOR | ADMIN
}
```

Điều này cho phép các use case như:
- **Category "Thông báo hệ thống":** view = GUEST (mọi người đọc), post = ADMIN (chỉ admin đăng), comment = ADMIN (không ai bình luận)
- **Category "Thảo luận nội bộ Mod":** view = MODERATOR, post = MODERATOR, comment = MODERATOR
- **Category "Hỏi đáp cộng đồng":** view = GUEST, post = MEMBER, comment = MEMBER

---

## 6.3 Tầng 2 — Detective Controls: Admin Dashboard

### 6.3.1 Tổng quan Admin Dashboard

`DashboardPage.tsx` trong `admin-client` là giao diện trung tâm để quản trị viên theo dõi tình trạng cộng đồng. Dashboard được thiết kế theo nguyên tắc **"Exception-based management"** — chỉ hiển thị nổi bật những chỉ số cần chú ý.

**Hình 6.3 — Bố cục giao diện Admin Dashboard**

<Tự chụp>

### 6.3.2 Chi tiết 7 Metrics quản trị

**Bảng 6.5 — Chi tiết Metrics trên Admin Dashboard**

| Metric | Query Logic | Tần suất | Ý nghĩa quản trị | Ngưỡng cảnh báo |
|--------|-----------|---------|----------------|----------------|
| **Tổng Users** | `COUNT(*) WHERE is_active = true AND is_banned = false` | Mỗi tải trang | Quy mô cộng đồng hiện tại | — |
| **Users mới hôm nay** | `COUNT(*) WHERE DATE(created_at) = CURRENT_DATE` | Mỗi tải trang | Tốc độ tăng trưởng | 0 nhiều ngày liên tiếp → xem lại UX |
| **Tổng bài viết** | `COUNT(*) WHERE status = 'PUBLISHED'` | Mỗi tải trang | Lượng nội dung hiện có | — |
| **Bài viết hôm nay** | `COUNT(*) WHERE DATE(created_at) = CURRENT_DATE AND status = 'PUBLISHED'` | Mỗi tải trang | Mức độ hoạt động cộng đồng | — |
| **Tổng bình luận** | `COUNT(*) WHERE status = 'VISIBLE'` | Mỗi tải trang | Mức độ tương tác | — |
| **Reports PENDING** | `COUNT(*) WHERE status = 'PENDING'` | Mỗi tải trang | **Khối lượng cần xử lý ngay** | > 10 → cần thêm moderator |
| **Reports REVIEWING** | `COUNT(*) WHERE status = 'REVIEWING'` | Mỗi tải trang | Đang trong quy trình xem xét | > 5 lâu ngày → moderator bị kẹt? |


## 6.4 Tầng 2 — Detective Controls: Operational Dashboard

### 6.4.1 Mục đích và phạm vi

Trong khi Admin Dashboard phục vụ góc nhìn kinh doanh (business metrics), **Operational Dashboard** (`OperationalDashboardPage.tsx`) phục vụ góc nhìn kỹ thuật — giúp đội vận hành phát hiện vấn đề hiệu suất, bottleneck và error rate bất thường trước khi người dùng phàn nàn.

### 6.4.2 Kiến trúc thu thập metrics kỹ thuật

**Hình 6.4 — Luồng thu thập và hiển thị HTTP Metrics**

```
Mỗi HTTP Request đến backend         metricsService.ts (in-memory store)
          │                                      │
          ▼                                      │
┌────────────────────────┐  Ghi dữ liệu          │
│  metricsMiddleware.ts  │ ─────────────────────►│
│                        │                       │ Map<endpoint, {
│  Khi request đến:      │  key: "GET /posts"    │   count: 1024,
│  startTime = Date.now()│  duration: 45ms       │   errorCount: 12,
│                        │  statusCode: 200      │   totalDuration: 46080,
│  Khi response gửi đi:  │                       │   p50: 38ms,
│  duration = now-start  │                       │   p95: 95ms,
│  ghi vào metricsService│                       │   p99: 234ms
└────────────────────────┘                       │ }>
                                                 │
              GET /admin/metrics                  │
              ◄────────────────────────────────── │
              Admin yêu cầu xem metrics           │
                                                 ▼
                              OperationalDashboardPage.tsx
                              hiển thị bảng + biểu đồ
```

### 6.4.3 Metrics kỹ thuật được theo dõi

**Bảng 6.6 — Chi tiết Metrics trong Operational Dashboard**

| Metric | Công thức tính | Ngưỡng tốt | Ngưỡng cảnh báo | Hành động đề xuất |
|--------|--------------|:---------:|:--------------:|-----------------|
| **Request Count** | Tổng số lần gọi endpoint | — | — | Xác định endpoint phổ biến nhất |
| **Error Rate** | `errorCount / count × 100%` | < 1% | > 5% | Debug log, kiểm tra business logic |
| **P50 Latency** | Median của response times | < 100ms | > 500ms | Profile query, thêm index |
| **P95 Latency** | 95th percentile | < 500ms | > 2.000ms | Kiểm tra query complexity, JOIN |
| **P99 Latency** | 99th percentile | < 1.000ms | > 5.000ms | EXPLAIN ANALYZE, xem xét cache |
| **Avg Duration** | `totalDuration / count` | < 200ms | > 1.000ms | Redis cache cho hot queries |

**Hình 6.5 — Giao diện Operational Dashboard**

```

```

> **Lưu ý về kiến trúc:** Metrics được lưu **in-memory** trong `metricsService.ts`. Sau mỗi lần restart server, toàn bộ dữ liệu lịch sử sẽ mất. Đây là thiết kế MVP phù hợp với giai đoạn hiện tại; môi trường production sẽ cần tích hợp Prometheus để lưu time-series vĩnh viễn và Grafana để visualize lịch sử.

---

## 6.5 Tầng 2 — Detective Controls: Hệ thống Audit Trail

### 6.5.1 Triết lý thiết kế Audit Trail

Audit Trail là yêu cầu bắt buộc của bất kỳ hệ thống MIS nghiêm túc nào. Nguyên tắc cốt lõi của hệ thống audit log trong MINI-FORUM là **non-repudiation** — bất kỳ hành động nào của Admin/Moderator đều được ghi nhận một cách bất biến, không thể xóa và không thể sửa.

Điều này phục vụ ba mục đích:

1. **Trách nhiệm giải trình (Accountability):** Mọi quyết định ban user, xóa nội dung đều có người chịu trách nhiệm cụ thể.
2. **Điều tra sự cố (Forensics):** Khi có tranh chấp, audit log cung cấp bằng chứng khách quan về thứ tự các sự kiện.
3. **Phát hiện hành vi bất thường (Anomaly Detection):** Một moderator xóa bất thường nhiều bài trong một ngày là dấu hiệu đáng ngờ cần điều tra.

### 6.5.2 Cấu trúc bảng `audit_logs`

**Bảng 6.7 — Cấu trúc Model `audit_logs` trong Prisma Schema**

| Trường | Kiểu dữ liệu | Nullable | Mô tả |
|--------|------------|:-------:|------|
| `id` | Int (auto increment) | Không | Primary key |
| `user_id` | Int (FK → users) | Không | ID của Admin/Moderator thực hiện |
| `action` | AuditAction (enum) | Không | Loại hành động (BAN, DELETE, HIDE...) |
| `target_type` | AuditTarget (enum) | Không | Loại đối tượng bị tác động |
| `target_id` | Int | Có | ID của đối tượng bị tác động |
| `target_name` | String | Có | Tên/tiêu đề đối tượng (denormalized) |
| `old_value` | String (JSON) | Có | Trạng thái trước khi thay đổi |
| `new_value` | String (JSON) | Có | Trạng thái sau khi thay đổi |
| `ip_address` | String | Có | Địa chỉ IP của người thực hiện |
| `user_agent` | String | Có | Browser/client string |
| `created_at` | DateTime | Không | Thời điểm xảy ra (UTC) |

> **Lưu ý thiết kế:** `target_name` là trường denormalized — lưu tên username/tiêu đề bài viết **tại thời điểm** thực hiện hành động. Điều này đảm bảo audit log vẫn có ý nghĩa ngay cả khi bản ghi gốc bị xóa sau đó.

### 6.5.3 Danh sách đầy đủ 15 AuditAction

**Bảng 6.8 — 15 Loại AuditAction và ý nghĩa**

| AuditAction | AuditTarget | Ghi old_value | Ghi new_value | Mô tả hành động |
|------------|------------|:------------:|:------------:|----------------|
| `BAN` | `USER` | ✓ | ✓ | Admin ban tài khoản người dùng |
| `UNBAN` | `USER` | ✓ | ✓ | Admin gỡ bỏ lệnh ban |
| `DELETE` | `POST` | ✓ | ✓ | Admin/Mod xóa mềm bài viết |
| `HIDE` | `COMMENT` | ✓ | ✓ | Admin/Mod ẩn bình luận |
| `SHOW` | `POST` / `COMMENT` | ✓ | ✓ | Admin khôi phục nội dung đã ẩn/xóa |
| `PIN` | `POST` | ✓ | ✓ | Admin ghim bài lên đầu danh sách |
| `LOCK` | `POST` | ✓ | ✓ | Admin khóa thread (không comment thêm) |
| `ROLE_CHANGE` | `USER` | ✓ | ✓ | Admin thay đổi role người dùng |
| `UPDATE` | `REPORT` | ✓ | ✓ | Mod/Admin cập nhật trạng thái report |
| `UPDATE` | `CATEGORY` | ✓ | ✓ | Admin thay đổi cấu hình danh mục |
| `UPDATE` | `SETTINGS` | ✓ | ✓ | Admin thay đổi cấu hình hệ thống |
| `LOGIN` | `USER` | ✗ | ✗ | Ghi nhận đăng nhập Admin/Mod |
| `LOGOUT` | `USER` | ✗ | ✗ | Ghi nhận đăng xuất Admin/Mod |
| `VIEW_MASKED_CONTENT` | `COMMENT` | ✗ | ✗ | Admin xem nội dung đã bị mask |
| `FORCE_LOGOUT` | `USER` | ✗ | ✗ | Admin revoke session của user khác |



Ví dụ: Khi Admin thực hiện hành động ban tài khoản `spam_account_99` với lý do vi phạm nội quy:

```json
{
  "id": 1234,
  "user_id": 1,
  "action": "BAN",
  "target_type": "USER",
  "target_id": 99,
  "target_name": "spam_account_99",
  "old_value": "{\"is_banned\": false, \"role\": \"MEMBER\", \"reputation\": 45}",
  "new_value": "{\"is_banned\": true, \"ban_reason\": \"Spam liên tục, vi phạm nội quy 3 lần\"}",
  "ip_address": "42.112.45.67",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "created_at": "2026-05-04T08:30:00.000Z"
}
```

Bản ghi này trả lời đầy đủ **5 câu hỏi kiểm soát**: **Ai** (user_id: 1 — admin), **Làm gì** (BAN), **Với ai** (USER:99 — spam_account_99), **Khi nào** (2026-05-04T08:30Z), **Từ đâu** (IP: 42.112.45.67, browser/OS qua user_agent).

### 6.5.5 Tính bất biến của Audit Log — Ba cấp bảo vệ

**Hình 6.6 — Cơ chế đảm bảo tính bất biến Audit Log**

```
┌─────────────────────────────────────────────────────────────────┐
│              ĐẢM BẢO TÍNH BẤT BIẾN (IMMUTABILITY)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cấp 1: API Design — Không có route xóa/sửa                    │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  ✓  GET    /admin/audit-logs        (chỉ đọc)       │        │
│  │  ✗  DELETE /admin/audit-logs        (không tồn tại) │        │
│  │  ✗  PUT    /admin/audit-logs/:id    (không tồn tại) │        │
│  └─────────────────────────────────────────────────────┘        │
│                             ▼                                   │
│  Cấp 2: Service Layer — Chỉ INSERT                              │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  auditLogService.createAuditLog()  ← INSERT only    │        │
│  │  auditLogService.getAuditLogs()    ← SELECT only    │        │
│  │  (Không có hàm update/delete)                       │        │
│  └─────────────────────────────────────────────────────┘        │
│                             ▼                                   │
│  Cấp 3: Database — Row-Level Security                           │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  REVOKE DELETE ON audit_logs FROM app_user;         │        │
│  │  REVOKE UPDATE ON audit_logs FROM app_user;         │        │
│  │  (PostgreSQL RLS policy)                            │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5.6 API Endpoints — Audit Log

**Bảng 6.9 — API Endpoints: Audit Log**

| Method | Endpoint | Chức năng | Quyền | Query Params hỗ trợ |
|--------|---------|-----------|-------|---------------------|
| GET | `/admin/audit-logs` | Danh sách audit logs (phân trang) | Admin | `page`, `limit` |
| GET | `/admin/audit-logs` | Filter theo loại hành động | Admin | `action` |
| GET | `/admin/audit-logs` | Filter theo loại đối tượng | Admin | `target_type` |
| GET | `/admin/audit-logs` | Filter theo người thực hiện | Admin | `user_id` |
| GET | `/admin/audit-logs` | Filter theo khoảng thời gian | Admin | `from`, `to` |

### 6.5.7 Giao diện tra cứu Audit Log (admin-client)

**Hình 6.7 — Giao diện AuditLogPage**

```
╔══════════════════════════════════════════════════════════════════════╗
║  AUDIT LOG                                          [Export CSV ↓]  ║
╠══════════════════════════════════════════════════════════════════════╣
║  Lọc theo:                                                           ║
║  Hành động:[Tất cả ▼]  Đối tượng:[Tất cả ▼]  User ID:[______]      ║
║  Từ ngày:[__/__/____]  Đến ngày:[__/__/____]            [Áp dụng]   ║
╠══════════════════════════════════════════════════════════════════════╣
║  Thời gian           User      Hành động    Đối tượng   Chi tiết    ║
║  ─────────────────────────────────────────────────────────────────  ║
║  04/05/2026 08:30    admin     BAN          USER:99     spam_acc...  ║
║  03/05/2026 16:45    mod1      HIDE         CMT:115     "nội dung..  ║
║  03/05/2026 15:20    admin     UPDATE       SETTINGS    EDIT_LIMIT   ║
║  02/05/2026 10:00    admin     ROLE_CHANGE  USER:45     MEMBER →     ║
║                                                         MODERATOR    ║
║  01/05/2026 14:30    mod2      DELETE       POST:78     "Tiêu đề..   ║
║                                                                      ║
║  ◄ Trước   [1] [2] [3] ... [50]   Sau ►    Hiển thị 1-20 / 234     ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 6.6 Tầng 3 — Corrective Controls: Report Management Workflow

### 6.6.1 Vòng đời đầy đủ của Report

Hệ thống Report là cơ chế **crowdsourced moderation** cốt lõi: cộng đồng chủ động phát hiện vi phạm, moderator/admin xác minh và xử lý.

**Hình 6.8 — State Machine: Vòng đời của một Report**

```
Member gửi report (POST /reports)
  │
  ▼
     PENDING  (hiển thị cảnh báo trên Dashboard)
  │
  ├─> REVIEWING (tuỳ chọn)
  │      ├─> RESOLVED
  │      └─> DISMISSED
  │
  ├─> RESOLVED  (đi tắt)
  └─> DISMISSED (đi tắt)

Từ RESOLVED có thể kèm hành động khắc phục:
- DELETE post   -> posts.status = 'DELETED'
- HIDE comment  -> comments.status = 'HIDDEN'
- BAN user      -> users.is_banned = true

Mỗi thay đổi trạng thái/hành động đều ghi audit_log.
```

### 6.6.2 Mô tả chi tiết 4 trạng thái Report

**Bảng 6.11 — Mô tả chi tiết 4 trạng thái Report**

| Trạng thái | Người chuyển | Điều kiện | Tác động hệ thống | Ý nghĩa quản trị |
|-----------|------------|---------|-----------------|----------------|
| `PENDING` | Hệ thống tự động | Member submit report | Tăng counter ⚠️ trên Dashboard | Chờ xem xét từ moderator |
| `REVIEWING` | Moderator/Admin | Click "Bắt đầu xem xét" | Giữ chỗ — mod khác không xử lý cùng lúc | Đang trong quy trình |
| `RESOLVED` | Moderator/Admin | Click "Xác nhận vi phạm" + ghi review_note | Ghi audit_log; giảm counter ⚠️ | Vi phạm xác nhận, đã xử lý |
| `DISMISSED` | Moderator/Admin | Click "Bác bỏ" + ghi review_note | Ghi audit_log; giảm counter ⚠️ | Báo cáo sai, nội dung hợp lệ |

> **Lưu ý thiết kế:** Trạng thái `REVIEWING` là tuỳ chọn (optional). Moderator có thể chuyển thẳng từ `PENDING` sang `RESOLVED` hoặc `DISMISSED` nếu đủ thông tin. `REVIEWING` chủ yếu hữu ích khi cần thêm thời gian điều tra hoặc trong môi trường có nhiều Moderator để tránh xử lý chồng chéo.

### 6.6.3 Luồng xử lý Report từ góc độ Moderator

**Hình 6.9 — Luồng xử lý Report đầy đủ (Moderator view)**

```
1) Mở danh sách chờ: `GET /admin/reports?status=PENDING`
2) Xem chi tiết report: người báo cáo, nội dung bị tố cáo, lịch sử vi phạm
3) Chọn một trong ba thao tác:
  - Bắt đầu xem xét -> `REVIEWING`
  - Xác nhận vi phạm -> `RESOLVED`
  - Bác bỏ -> `DISMISSED`
4) Cập nhật bằng `PATCH /admin/reports/:id` kèm `review_note`
5) Hệ thống ghi `audit_log` cho thay đổi report
6) Nếu cần, thực hiện thêm hành động khắc phục (xóa/ẩn/ban) và ghi audit_log tương ứng
```

### 6.6.4 API Endpoints — Report Management

**Bảng 6.12 — API Endpoints: Report Management**

| Method | Endpoint | Chức năng | Quyền | Request Body |
|--------|---------|-----------|-------|-------------|
| POST | `/reports` | Member tạo báo cáo mới | Member+ | `{ target_type, target_id, reason }` |
| GET | `/admin/reports` | Danh sách reports (filter, phân trang) | Mod/Admin | query: `status`, `page`, `limit` |
| GET | `/admin/reports/:id` | Xem chi tiết một report | Mod/Admin | — |
| PATCH | `/admin/reports/:id` | Cập nhật trạng thái report | Mod/Admin | `{ status, review_note? }` |
| GET | `/admin/reports/stats` | Thống kê số lượng theo status | Admin | — |

### 6.6.5 Phân tích chất lượng Report bằng thống kê

**Bảng 6.13 — Chỉ số chất lượng hệ thống Report**

| Chỉ số | Công thức | Ngưỡng bình thường | Cảnh báo khi | Hành động đề xuất |
|--------|---------|:----------------:|:-----------:|-----------------|
| PENDING count | Đếm trực tiếp | 0–5 | > 10 | Thêm moderator, ưu tiên xử lý |
| Tỷ lệ vi phạm thực | RESOLVED/(RESOLVED+DISMISSED) | 30–60% | < 10% | Cộng đồng báo cáo sai nhiều → cần education |
| Thời gian xử lý trung bình | avg(resolved_at − created_at) | < 24h | > 72h | Quy trình chậm, cần tối ưu hoặc automation |
| Report per user (7 ngày) | COUNT theo reporter_id | < 5 | > 20 | Có thể report abuse, xem xét hạn chế |

Các chỉ số trên giúp tách 3 tình huống: backlog xử lý (`PENDING` cao), chất lượng report thấp (tỷ lệ `RESOLVED` thấp) và lạm dụng report (report/user quá cao).

---

## 6.7 Tầng 3 — Corrective Controls: User Management

### 6.7.1 Quy trình Ban User

Ban user là biện pháp mạnh nhất: khóa tài khoản và chấm dứt toàn bộ phiên đăng nhập. Quy trình có ràng buộc an toàn để tránh lạm quyền.

**Hình 6.10 — Quy trình Ban User chi tiết**

```
Admin chọn Ban User -> nhập lý do (bắt buộc >= 10 ký tự)
  │
  ▼
PATCH /admin/users/:id/ban { reason }
  │
  ▼
Service layer:
1) Chặn ban ADMIN và chặn tự-ban
2) users.is_banned = true
3) Xóa refresh_tokens của user (force logout mọi thiết bị)
4) Ghi audit_log (old_value/new_value + reason)
  │
  ▼
HTTP 200 + thông báo thành công
```

### 6.7.2 API Endpoints — Admin User Management

**Bảng 6.14 — API Endpoints: Admin User Management**

| Method | Endpoint | Chức năng | Quyền |
|--------|---------|-----------|-------|
| GET | `/admin/users` | Danh sách users (search, filter, phân trang) | Admin |
| GET | `/admin/users/:id` | Chi tiết user + thống kê hoạt động | Admin |
| PATCH | `/admin/users/:id/ban` | Ban user (kèm lý do bắt buộc) | Admin |
| PATCH | `/admin/users/:id/unban` | Gỡ ban user | Admin |
| PATCH | `/admin/users/:id/role` | Thay đổi role | Admin |
| GET | `/admin/users/:id/audit-logs` | Audit log liên quan đến user | Admin |
| GET | `/admin/users/:id/posts` | Tất cả bài viết của user | Admin |
| GET | `/admin/users/:id/reports` | Tất cả reports liên quan đến user | Admin |

### 6.7.3 Quy trình Role Change (Nâng/Hạ cấp quyền)

Khi Admin nâng cấp Member lên Moderator:

```
PATCH /admin/users/:id/role   →  { new_role: "MODERATOR" }

UPDATE users SET role = 'MODERATOR' WHERE id = targetId

audit_log: {
  action:     ROLE_CHANGE,
  target:     USER:targetId,
  old_value:  { role: "MEMBER" },
  new_value:  { role: "MODERATOR" }
}
```

**Ràng buộc an toàn:** Admin không thể thay đổi role của Admin khác, và không thể tự hạ role của bản thân. Hệ thống enforce hai ràng buộc này ở service layer.

---

## 6.8 Kiểm soát chất lượng nội dung

### 6.8.1 Content Masking — Ẩn nội dung giữ nguyên cấu trúc

Bên cạnh xóa mềm, hệ thống hỗ trợ **Content Masking** để ẩn nội dung nhạy cảm nhưng vẫn giữ mạch thảo luận.

**Hình 6.11 — Hiển thị Content Masking trong Frontend**

```
Trước khi mask:
- Hiển thị đầy đủ nội dung comment.

Sau khi mask (`is_content_masked = true`):
- User thường thấy thông báo "Nội dung đã bị ẩn bởi moderator".
- Admin/Mod có thêm nút xem nội dung gốc.
- Cấu trúc thread, vote và reply được giữ nguyên.
```

Khi Admin/Mod xem nội dung gốc, hệ thống ghi `audit_log` với `action: VIEW_MASKED_CONTENT` để đảm bảo truy vết.

### 6.8.2 Soft Delete — Xóa mềm có thể phục hồi

MINI-FORUM không hard delete bài viết/bình luận; hệ thống dùng **Soft Delete** qua trường `status`.

| Loại nội dung | Trường thay đổi | Giá trị | Vẫn còn trong DB? |
|-------------|--------------|---------|:-----------------:|
| Bài viết bị xóa | `posts.status` | `DELETED` | ✓ |
| Bình luận bị ẩn | `comments.status` | `HIDDEN` | ✓ |
| User bị ban | `users.is_banned` | `true` | ✓ |

**Lợi ích của Soft Delete:**
- **Phục hồi nhầm lẫn:** Admin xóa nhầm có thể `SHOW` lại ngay lập tức với đầy đủ nội dung
- **Bằng chứng pháp lý:** Nội dung vi phạm được giữ lại để làm bằng chứng nếu có tranh chấp
- **Báo cáo lịch sử:** Dashboard vẫn có thể thống kê tổng nội dung đã từng tồn tại

### 6.8.3 User Block — Chặn giữa người dùng

**Hình 6.12 — Cơ chế User Block (tự phục vụ)**

```
POST /users/me/blocks { blocked_id }
  │
  ▼
INSERT user_blocks(blocker_id, blocked_id)
  │
  ▼
Tác động feed:
- A không thấy nội dung của B
- B không thấy nội dung của A
- Query layer lọc theo danh sách block
```

> **Phân biệt:** User Block là tính năng tự phục vụ giữa hai người dùng, khác với Admin Ban là biện pháp quản trị toàn hệ thống.

---



