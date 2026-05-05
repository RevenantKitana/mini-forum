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
    └─► MEMBER (đã xác thực email)
            └─► MODERATOR (được admin nâng cấp)
                    └─► ADMIN (quyền cao nhất)
                            └─► BOT (service account cho AI)
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

```
╔══════════════════════════════════════════════════════════════════════╗
║  MINI-FORUM Admin                              [admin ▼] [Logout]   ║
╠══════════════════════════════════════════════════════════════════════╣
║  [Dashboard] [Users] [Posts] [Reports] [Audit Log] [Config]         ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  TỔNG QUAN CỘNG ĐỒNG              Cập nhật: 04/05/2026 09:15        ║
║                                                                      ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ║
║  │  1,234       │ │  +23 hôm nay │ │  5,678       │ │  456       │ ║
║  │  👥 Users    │ │  📈 Users mới│ │  📝 Bài viết │ │💬 Bình luận║ ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ ║
║                                                                      ║
║  ┌──────────────┐ ┌──────────────┐  ← Exception indicators          ║
║  │  3  ⚠️       │ │  1  🔍       │    (cần chú ý ngay!)             ║
║  │Reports PEND. │ │Reports REVW. │                                   ║
║  └──────────────┘ └──────────────┘                                  ║
║                                                                      ║
║  Bài viết mới theo ngày (7 ngày gần nhất)                           ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │ 30 │                                                         │   ║
║  │    │      ██                                                 │   ║
║  │ 20 │  ██  ██  ██                                             │   ║
║  │    │  ██  ██  ██  ██                                         │   ║
║  │ 10 │  ██  ██  ██  ██  ██                                     │   ║
║  │    │  ██  ██  ██  ██  ██  ██                                 │   ║
║  │  0 └──────────────────────────────                           │   ║
║  │      T2   T3   T4   T5   T6   T7   CN                        │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
║                                                                      ║
║  Top Categories theo bài viết                                        ║
║  ┌──────────────────────────────────────────────────────────────┐   ║
║  │  Programming   ████████████████████████████  234 bài         │   ║
║  │  Technology    ████████████████████          156 bài         │   ║
║  │  General       ████████████                   89 bài         │   ║
║  │  Q&A           ████████                        67 bài        │   ║
║  │  Announcements ███                             12 bài        │   ║
║  └──────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════╝
```

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

### 6.3.3 Biểu đồ xu hướng

Dashboard cung cấp hai biểu đồ xu hướng giúp admin đánh giá động lực cộng đồng:

**Biểu đồ 1 — "Bài viết mới theo ngày" (7 ngày):**
- Query: `GROUP BY DATE(created_at)` trong 7 ngày gần nhất
- Mục đích: Phát hiện drop đột ngột (sự cố kỹ thuật) hoặc spike bất thường (spam campaign)

**Biểu đồ 2 — "Top Categories theo bài viết":**
- Query: `JOIN categories GROUP BY category_id ORDER BY post_count DESC LIMIT 10`
- Mục đích: Xác định category cần nội dung seed thêm, category đang bị bỏ quên

---

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
┌──────────────────────────────────────────────────────────────────────┐
│  OPERATIONAL METRICS                  Làm mới: [30s ▼] [↻ Refresh] │
│                                                                      │
│  Endpoint                Count   Error%  P50     P95     P99        │
│  ─────────────────────────────────────────────────────────────────  │
│  GET /posts              12.453    0,2%   38ms    95ms   234ms      │
│  GET /posts/:id           8.901    0,1%   22ms    67ms   156ms      │
│  POST /auth/login         2.341    3,1%⚠  45ms   112ms   456ms      │
│  GET /notifications       6.782    0,0%   18ms    45ms    89ms      │
│  POST /votes              4.123    0,3%   28ms    78ms   189ms      │
│  GET /search              1.234    1,2%  145ms   456ms  1234ms ⚠    │
│                                                                      │
│  ─── Top Slowest Endpoints (P95) ─────────────────────────────────  │
│  1. GET /search           456ms  ← cần GIN full-text index          │
│  2. POST /auth/login      112ms  ← bcrypt cost cao (expected)       │
│  3. GET /admin/audit-logs  98ms  ← cần pagination optimization      │
└──────────────────────────────────────────────────────────────────────┘
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

### 6.5.4 Ví dụ một bản ghi Audit Log thực tế

Khi Admin thực hiện hành động ban tài khoản `spam_account_99` với lý do vi phạm nội quy:

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

Hệ thống báo cáo vi phạm (Report System) là cơ chế cộng đồng tự kiểm soát quan trọng nhất của MINI-FORUM. Thay vì chỉ dựa vào Admin/Moderator theo dõi nội dung thủ công, hệ thống trao quyền cho toàn bộ cộng đồng tham gia vào quá trình phát hiện vi phạm — điều này được gọi là **"Crowdsourced Moderation"**.

**Hình 6.8 — State Machine: Vòng đời của một Report**

```
                    ┌──────────────────────┐
                    │     Tạo Report        │
                    │   (member submit)     │
                    └──────────┬───────────┘
                               │ POST /reports
                               ▼
                    ┌──────────────────────┐
                    │      PENDING         │ ← Trạng thái ban đầu
                    │   (Chờ xem xét)      │   Hiển thị ⚠️ trên Dashboard
                    └──────────┬───────────┘
                               │
               ┌───────────────┼────────────────────┐
               │               │                    │
       Bắt đầu xem xét   Quyết định ngay      Quyết định ngay
               │               │                    │
               ▼               │                    │
   ┌──────────────────┐        │                    │
   │    REVIEWING     │        │                    │
   │  (Đang xem xét)  │        │                    │
   └─────────┬────────┘        │                    │
             │                 │                    │
      ┌──────┴──────┐          │                    │
      │             │          │                    │
      ▼             ▼          ▼                    ▼
┌──────────┐  ┌──────────┐ ┌──────────┐      ┌──────────┐
│ RESOLVED │  │DISMISSED │ │ RESOLVED │      │DISMISSED │
│(Vi phạm  │  │(Không vi │ │(Vi phạm  │      │(Không vi │
│xác nhận) │  │ phạm)    │ │xác nhận) │      │ phạm)    │
└────┬─────┘  └──────────┘ └────┬─────┘      └──────────┘
     │                          │
     └──────────────┬───────────┘
                    ▼
     Hành động khắc phục (tuỳ chọn kèm theo):
     ├── DELETE post   → posts.status = 'DELETED'
     ├── HIDE comment  → comments.status = 'HIDDEN'
     └── BAN user      → users.is_banned = true
         (Mỗi hành động → 1 audit_log riêng biệt)
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
Moderator đăng nhập admin-client
              │
              ▼
    GET /admin/reports?status=PENDING
              │
              ▼
    ╔═════════════════════════════════════════════╗
    ║  Danh sách Reports đang chờ:               ║
    ║  #101 - POST vi phạm - "Nội dung..."  ⚠️  ║
    ║  #102 - COMMENT spam - "user_abc"     ⚠️  ║
    ║  #103 - USER harass  - "troll_99"     ⚠️  ║
    ╚══════════════════════╦══════════════════════╝
                           │ Click vào Report #101
                           ▼
    ╔═════════════════════════════════════════════╗
    ║  CHI TIẾT REPORT #101                      ║
    ║                                             ║
    ║  Người báo cáo: user_honest                ║
    ║    (3 reports trước: 2 đúng, 1 sai)        ║
    ║  Lý do: "Nội dung kích động, vi phạm §4.3"║
    ║                                             ║
    ║  Nội dung bị báo cáo:                       ║
    ║  ┌─────────────────────────────────────┐    ║
    ║  │ [Bài viết: "Tiêu đề bài X"]         │    ║
    ║  │ "...nội dung vi phạm ở đây..."      │    ║
    ║  └─────────────────────────────────────┘    ║
    ║                                             ║
    ║  Lịch sử tác giả: 12 báo cáo,              ║
    ║                    3 lần đã RESOLVED trước  ║
    ║                                             ║
    ║  Ghi chú xem xét: [_____________________]  ║
    ║                                             ║
    ║  [Bắt đầu xem xét] [✓ Vi phạm] [✗ Bác bỏ]║
    ╚══════════════════════╦══════════════════════╝
                           │ Click "✓ Vi phạm"
                           ▼
    PATCH /admin/reports/101
    { status: "RESOLVED",
      review_note: "Vi phạm điều 4.3 nội quy cộng đồng" }
                           │
              ┌────────────┴────────────────┐
              ▼                             ▼
    Ghi audit_log                   Tùy chọn: hành động
    (UPDATE, REPORT:101)            PATCH /admin/posts/456
                                    { status: "DELETED" }
                                    → audit_log (DELETE, POST:456)
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

---

## 6.7 Tầng 3 — Corrective Controls: User Management

### 6.7.1 Quy trình Ban User

Hành động ban user là quyết định có tác động lớn nhất trong hệ thống — nó vô hiệu hóa tài khoản và kết thúc mọi phiên làm việc đang hoạt động. Quy trình được thiết kế cẩn thận với nhiều tầng bảo vệ tránh lạm dụng.

**Hình 6.10 — Quy trình Ban User chi tiết**

```
Admin nhấn [Ban User] trên trang quản lý user_B
                    │
                    ▼
         ╔════════════════════════════════╗
         ║  Hộp thoại xác nhận:          ║
         ║  Ban user: user_B?             ║
         ║                               ║
         ║  Lý do (bắt buộc, ≥10 ký tự):║
         ║  [______________________________]
         ║                               ║
         ║  [Hủy]     [Xác nhận Ban]     ║
         ╚════════════════════╦══════════╝
                              │ Điền lý do và xác nhận
                              ▼
         PATCH /admin/users/:id/ban
         { reason: "Spam liên tục vi phạm nội quy 3 lần" }
                              │
                              ▼
     ┌────────────────────────────────────────────────┐
     │  userService.banUser(adminId, targetId, data)  │
     │                                                │
     │  Bước 1: Kiểm tra an toàn                      │
     │  ├── target.role === 'ADMIN'  → 403 Forbidden  │
     │  └── adminId === targetId     → 400 Bad Request│
     │                                                │
     │  Bước 2: Cập nhật trạng thái                   │
     │  UPDATE users                                  │
     │  SET is_banned = true                          │
     │  WHERE id = targetId                           │
     │                                                │
     │  Bước 3: Force logout toàn bộ thiết bị         │
     │  DELETE FROM refresh_tokens                    │
     │  WHERE user_id = targetId                      │
     │  (→ user bị kick khỏi mọi phiên ngay lập tức) │
     │                                                │
     │  Bước 4: Ghi audit_log                         │
     │  action: BAN, target: USER:targetId            │
     │  old_value: { is_banned: false }               │
     │  new_value: { is_banned: true, reason: "..." } │
     └────────────────────────────────────────────────┘
                              │
                              ▼
                HTTP 200 OK + Success notification
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

Khi Admin nâng cấp một Member lên Moderator:

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

Bên cạnh xóa hoàn toàn (`status = DELETED`), hệ thống hỗ trợ **Content Masking** — ẩn nội dung nhạy cảm nhưng giữ nguyên cấu trúc luồng thảo luận để không bị "gãy" thread:

**Hình 6.11 — Hiển thị Content Masking trong Frontend**

```
Trước khi mask (bình thường):
┌───────────────────────────────────────────────────────┐
│ [avatar] username_A  •  2 giờ trước                   │
│                                                       │
│ Đây là nội dung bình luận vi phạm cần ẩn...           │
│                                                       │
│ 👍 12   👎 1   [Trả lời]   [Báo cáo]                  │
└───────────────────────────────────────────────────────┘

Sau khi Moderator set is_content_masked = true:
┌───────────────────────────────────────────────────────┐
│ [avatar] username_A  •  2 giờ trước                   │
│                                                       │
│ ▓▓▓  [Nội dung này đã bị ẩn bởi moderator]  ▓▓▓      │
│                              [Xem nội dung gốc →]     │
│                              (chỉ Admin/Mod thấy)     │
│                                                       │
│ 👍 12   👎 1   [Trả lời]   [Báo cáo]                  │
└───────────────────────────────────────────────────────┘
```

Khi Admin/Mod click "Xem nội dung gốc" → Hệ thống ghi `audit_log` với `action: VIEW_MASKED_CONTENT`. Điều này đảm bảo việc xem nội dung nhạy cảm cũng được kiểm soát và truy vết đầy đủ.

### 6.8.2 Soft Delete — Xóa mềm có thể phục hồi

MINI-FORUM không bao giờ thực hiện hard delete bài viết hay bình luận. Thay vào đó, hệ thống dùng **Soft Delete** thông qua trường `status`:

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
User A quyết định chặn User B:
           │
           ▼
  POST /users/me/blocks
  { blocked_id: B.id }
           │
           ▼
  INSERT INTO user_blocks {
    blocker_id: A.id,
    blocked_id: B.id,
    created_at: NOW()
  }
           │
           ▼
  Tác động tức thì trên feed:
  ┌─────────────────────────────────────────────┐
  │  A KHÔNG thấy bài viết/comment của B        │
  │  B KHÔNG thấy bài viết/comment của A        │
  │                                             │
  │  Filter ở query layer:                      │
  │  WHERE author_id NOT IN (                   │
  │    SELECT blocked_id FROM user_blocks       │
  │    WHERE blocker_id = currentUserId         │
  │  )                                          │
  └─────────────────────────────────────────────┘
```

> **Phân biệt:** User Block là tính năng tự phục vụ cho người dùng thông thường — khác với Admin Ban là biện pháp quản trị hệ thống. User Block không ảnh hưởng đến khả năng tương tác của B với phần còn lại của cộng đồng.

---

## 6.9 Tổng kết hệ thống kiểm soát

### 6.9.1 Ma trận rủi ro và cơ chế kiểm soát

**Bảng 6.15 — Ma trận rủi ro — kiểm soát toàn diện**

| Rủi ro | Xác suất | Tác động | Kiểm soát Ngăn ngừa | Kiểm soát Phát hiện | Kiểm soát Khắc phục |
|--------|:-------:|:-------:|-------------------|-------------------|-------------------|
| Đăng nhập trái phép | Cao | Nghiêm trọng | JWT + bcrypt; rate limit 10req/15min | Audit log LOGIN từ IP lạ | Revoke refresh tokens; force logout |
| Nội dung vi phạm | Trung bình | Trung bình | Category permission; Zod validate | Community reporting; dashboard ⚠️ | Hide/Delete; warn/ban user |
| Spam bài viết | Cao | Thấp | Rate limit `POST /posts` 20req/h | Dashboard metrics spike | Ban user; xóa bài hàng loạt |
| Brute-force mật khẩu | Cao | Nghiêm trọng | Rate limit 10req/15min auth | Error rate spike Operational Dashboard | IP block ở tầng infrastructure |
| Xóa nội dung nhầm | Thấp | Trung bình | Confirmation dialog admin-client | Audit log với old_value đầy đủ | Restore từ soft delete |
| Moderator lạm quyền | Rất thấp | Nghiêm trọng | Moderator không ban Admin | Audit log toàn bộ hành động mod | Admin thu hồi role MODERATOR |
| Tài khoản bị đánh cắp | Thấp | Nghiêm trọng | Short TTL access token (15 phút) | Audit log IP/UA bất thường | Revoke tất cả refresh_tokens |

### 6.9.2 Báo cáo định kỳ từ Audit Log

Admin có thể trích xuất báo cáo moderation định kỳ để đánh giá chất lượng và hiệu quả của đội ngũ quản trị:

```sql
-- Báo cáo hoạt động moderation tháng 5/2026
SELECT
    u.username       AS ten_moderator,
    al.action        AS hanh_dong,
    al.target_type   AS doi_tuong,
    COUNT(*)         AS so_lan_thuc_hien
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE
    al.created_at >= '2026-05-01'
    AND al.created_at < '2026-06-01'
    AND al.action IN ('BAN', 'UNBAN', 'HIDE', 'DELETE', 'SHOW', 'ROLE_CHANGE')
GROUP BY
    u.username, al.action, al.target_type
ORDER BY
    ten_moderator, so_lan_thuc_hien DESC;

-- Kết quả mẫu:
-- ten_moderator | hanh_dong | doi_tuong | so_lan_thuc_hien
-- ──────────────┼───────────┼───────────┼─────────────────
-- admin         │ BAN       │ USER      │ 5
-- admin         │ DELETE    │ POST      │ 12
-- mod1          │ HIDE      │ COMMENT   │ 34
-- mod1          │ DELETE    │ POST      │ 8
-- mod2          │ HIDE      │ COMMENT   │ 21
```

---

## Tóm tắt chương 6

Chương 6 đã trình bày toàn bộ hạ tầng báo cáo và kiểm soát của MINI-FORUM, được tổ chức theo mô hình ba tầng:

**1. Preventive Controls (Ngăn ngừa):**
- JWT + RBAC với phân cấp 5 role (GUEST → MEMBER → MODERATOR → ADMIN → BOT)
- Zod schema validation tại mọi API boundary — "fail fast, fail early"
- Rate limiting cấu hình riêng biệt cho từng nhóm endpoint nhạy cảm
- Category-level permission linh hoạt (view/post/comment có thể cấu hình độc lập)

**2. Detective Controls (Phát hiện):**
- Admin Dashboard với 7 business metrics và 2 biểu đồ xu hướng
- Operational Dashboard với 6 HTTP performance metrics (error rate, P50/P95/P99)
- Audit Trail — 15 loại AuditAction, ghi old/new value dạng JSON, bất biến ba cấp

**3. Corrective Controls (Khắc phục):**
- Report Workflow 4 trạng thái (PENDING → REVIEWING → RESOLVED/DISMISSED)
- Ban/Unban user với force logout tức thì trên mọi thiết bị
- Content Masking và Soft Delete — xử lý nội dung mà không mất dữ liệu vĩnh viễn
- User Block — cơ chế tự phục vụ cộng đồng để kiểm soát trải nghiệm cá nhân

**Điểm thiết kế nổi bật:** Toàn bộ kiểm soát được **mã hóa trong code** và **không thể bypass** — không có backdoor, không có đường tắt. Đặc biệt, Audit Trail được bảo vệ ở 3 cấp (API design, service layer, database RLS) đảm bảo tính non-repudiation hoàn toàn — đặc trưng bắt buộc của một MIS đạt chuẩn nghiệp vụ.

Chương 7 tiếp theo sẽ đánh giá toàn diện chất lượng thiết kế hệ thống và rút ra các bài học từ quá trình xây dựng MINI-FORUM.
