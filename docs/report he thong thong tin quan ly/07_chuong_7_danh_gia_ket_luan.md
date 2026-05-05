# CHƯƠNG 7
# ĐÁNH GIÁ VÀ KẾT LUẬN

---

## Giới thiệu chương

Chương 7 là chương kết thúc của báo cáo, thực hiện đánh giá toàn diện hệ thống MINI-FORUM trên nhiều chiều: chất lượng thiết kế dữ liệu, kiến trúc phần mềm, tiến độ phát triển, và mức độ đáp ứng các tiêu chí chất lượng của một MIS chuẩn mực. Chương cũng rút ra các bài học kinh nghiệm từ quá trình xây dựng và đề xuất hướng phát triển tiếp theo.

---

## 7.1 Đánh giá thiết kế dữ liệu

### 7.1.1 Chiến lược chuẩn hóa (Normalization Strategy)

Một trong những quyết định thiết kế quan trọng nhất của MINI-FORUM là chiến lược chuẩn hóa cơ sở dữ liệu — cân bằng giữa tính chính xác dữ liệu (normalization) và hiệu suất truy vấn (performance).

**Bảng 7.1 — Đánh giá mức chuẩn hóa các Entity chính**

| Entity | Dạng chuẩn đạt được | Nhận xét chi tiết |
|--------|:------------------:|-------------------|
| `users` | 3NF | Đạt chuẩn 3NF — mọi thuộc tính phụ thuộc trực tiếp vào primary key |
| `posts` | 2NF* | **Chủ ý denormalize:** `upvote_count`, `downvote_count`, `comment_count` vi phạm 3NF nhưng có mục đích rõ ràng về read performance |
| `comments` | 3NF | Đạt 3NF, self-reference qua `parent_id` hợp lý và có index |
| `categories` | 3NF | Đạt 3NF — `post_count` denormalized có mục đích hiển thị |
| `tags` | 3NF | Đạt 3NF — `usage_count` denormalized để sort phổ biến |
| `post_tags` | BCNF | Junction table chuẩn, PK composite (post_id, tag_id) đúng |
| `votes` | 3NF + Polymorphic | Polymorphic constraint được enforce ở application layer |
| `audit_logs` | 3NF | Immutable by design; `target_name` denormalized để đảm bảo audit còn nghĩa sau khi bản gốc xóa |
| `user_content_context` | 3NF | 1:1 với users; `personality` và `last_posts` là JSON blob (flexible schema) |

> **Nhận xét tổng quan:** Chiến lược chuẩn hóa của MINI-FORUM là **"normalize by default, denormalize by intent"** — 3NF là mặc định, sau đó **có chủ đích** denormalize các counter fields để tối ưu read performance tại các hot path (load danh sách bài viết, hiển thị số vote). Mỗi quyết định denormalize đều được document rõ ràng với lý do kỹ thuật.

### 7.1.2 Chiến lược Index

**Bảng 7.2 — Phân tích Index Strategy**

| Bảng | Index | Query được tối ưu |
|------|-------|-----------------|
| `posts` | `(author_id)` | Lấy bài viết của một user cụ thể |
| `posts` | `(category_id)` | Lấy bài viết theo danh mục |
| `posts` | `(created_at DESC)` | Feed sắp xếp theo thời gian mới nhất |
| `posts` | `(status)` | Filter bài viết theo trạng thái |
| `posts` | `(is_pinned, pin_order)` | Query bài ghim đầu danh sách |
| `comments` | `(post_id)` | Lấy tất cả bình luận của một bài viết |
| `comments` | `(author_id)` | Lấy bình luận của một user |
| `comments` | `(parent_id)` | Lấy replies của một bình luận cụ thể |
| `votes` | `(target_type, target_id)` | Kiểm tra vote trên post/comment |
| `votes` | `(user_id)` | Lấy lịch sử vote của user |
| `notifications` | `(user_id, deleted_at)` | Lấy notifications chưa xóa mềm |
| `notifications` | `(user_id, is_read)` | Lấy notifications chưa đọc |
| `audit_logs` | `(user_id)`, `(action)`, `(created_at)` | Trace theo nhiều chiều khác nhau |

### 7.1.3 Điểm mạnh thiết kế dữ liệu

**1. Migration-versioned schema:**
Prisma Migrations cung cấp lịch sử thay đổi schema có version, có thể rollback — quan trọng trong môi trường production khi cần hotfix schema. Mỗi migration file được đặt tên theo timestamp và mô tả nội dung thay đổi.

**2. Soft delete nhất quán:**
Thay vì hard delete, `PostStatus.DELETED` và `CommentStatus.DELETED` cho phép khôi phục dữ liệu khi cần, đồng thời duy trì toàn vẹn tham chiếu (referential integrity) với các bảng audit_logs, votes, notifications.

**3. Polymorphic associations được kiểm soát:**
MINI-FORUM chỉ có 2 polymorphic relationships (`votes`, `reports`), thay vì dùng rộng rãi — giữ được referential integrity tối đa cho phần còn lại của schema.

**4. Audit log immutable:**
Thiết kế không có UPDATE/DELETE trên `audit_logs` ở cả API, service và database layer — đảm bảo non-repudiation tuyệt đối.

**5. Enum-typed states:**
Sử dụng PostgreSQL native enums thay vì VARCHAR — type-safe và efficient storage. TypeScript type inference hoạt động hoàn hảo với Prisma.

### 7.1.4 Các điểm cần cải thiện

**Bảng 7.3 — Điểm cần cải thiện trong thiết kế dữ liệu**

| Vấn đề | Mô tả chi tiết | Giải pháp đề xuất |
|--------|--------------|-----------------|
| `avatar_url` deprecated | Field cũ vẫn còn trong schema — legacy từ trước khi tích hợp ImageKit | Chạy `migrateAvatarUrls.ts` và drop column sau khi xác nhận migration thành công |
| `user_content_context` coupling | Model AI context nằm trong cùng schema với forum data | Tách riêng sang schema của `vibe-content` service |
| Thiếu explicit `is_banned` | Trạng thái ban lẫn vào `is_active` gây nhầm lẫn | Thêm `banned_at TIMESTAMPTZ` để phân biệt rõ ban tạm thời / vĩnh viễn |
| Thiếu full-text index | Không có GIN index cho PostgreSQL FTS | `CREATE INDEX ON posts USING GIN(to_tsvector('simple', title \|\| content))` |

---

## 7.2 Đánh giá kiến trúc hệ thống

### 7.2.1 Sơ đồ kiến trúc phân lớp

**Hình 7.1 — Kiến trúc phân lớp Backend (Layered Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│   frontend (React)  │  admin-client (React)  │  REST Client │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP / SSE
┌───────────────────────────────▼─────────────────────────────┐
│                    ROUTE LAYER (Express Router)              │
│  Định nghĩa URL pattern, áp dụng middleware chain           │
│  authMiddleware → roleMiddleware → handler                   │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│               CONTROLLER LAYER (HTTP Handlers)               │
│  Parse request, call service, format response               │
│  Không chứa business logic — chỉ orchestrate               │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                  SERVICE LAYER (Business Logic)              │
│  Toàn bộ business rules, validation nghiệp vụ               │
│  Gọi Prisma client, gọi service khác (email, CDN...)        │
│  Ghi audit_log tại đây — không bao giờ ở controller        │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│              PERSISTENCE LAYER (Prisma ORM)                  │
│  Type-safe database queries                                  │
│  Migrations versioned, schema.prisma là source of truth     │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│               DATABASE (PostgreSQL 15+)                      │
│  Enums, constraints, indexes, RLS policies                   │
└─────────────────────────────────────────────────────────────┘
```

### 7.2.2 Điểm mạnh kiến trúc

**1. Separation of Concerns rõ ràng và nhất quán:**

Mỗi lớp có trách nhiệm duy nhất và không vi phạm ranh giới. Ví dụ điển hình:
- Controller KHÔNG query database trực tiếp
- Service KHÔNG trả về `res.json()` (HTTP concern)
- Prisma client KHÔNG chứa business validation

**2. Monorepo với ranh giới dịch vụ rõ ràng:**

4 package trong monorepo (`backend`, `frontend`, `admin-client`, `vibe-content`) không chia sẻ code trực tiếp — chỉ giao tiếp qua REST API. Điều này đảm bảo các service có thể deploy độc lập.

**3. Validation tại entry point — Fail Fast:**

```
Client ──► Backend
            │
            └─ Zod validate ngay tại request entry point
               Nếu fail → HTTP 400 ngay lập tức
               Không cho data "bẩn" vào business layer
               → Giảm thiểu bề mặt tấn công (attack surface)
```

**4. Observability đầy đủ:**

- `metricsMiddleware` ghi lại mọi request/response với latency
- `audit_logs` ghi lại mọi admin action với context đầy đủ
- Structured logging thay vì `console.log` cho production

### 7.2.3 Hạn chế kiến trúc và hướng cải thiện

**Bảng 7.4 — Hạn chế kiến trúc và giải pháp**

| Hạn chế | Tác động thực tế | Hướng giải quyết |
|--------|----------------|-----------------|
| SSE in-memory (single node) | Khi scale horizontal, users trên server khác không nhận notification | Thay bằng Redis Pub/Sub — mỗi node subscribe cùng channel |
| Metrics in-memory | Reset khi server restart, không có historical data | Tích hợp Prometheus scraping + Grafana dashboards |
| Không có caching layer | Mỗi request đều query DB, kể cả hot data | Redis cache cho category list, trending posts (TTL 5 phút) |
| PostgreSQL FTS hạn chế | Hiệu quả thấp hơn Elasticsearch ở scale > 1M bài viết | Migrate sang Elasticsearch hoặc Meilisearch |
| Email & notification xử lý đồng bộ | Nếu email provider chậm → request bị block | BullMQ/Redis Queue cho async job processing |

---

## 7.3 Phân tích theo giai đoạn phát triển

### 7.3.1 Mapping Sprint với luồng thông tin được xây dựng

**Bảng 7.5 — Phân tích luồng thông tin theo Sprint**

| Sprint | Thời gian | Luồng thông tin được xây dựng | Kết quả cụ thể |
|--------|:--------:|------------------------------|---------------|
| **Sprint 0** | Tuần 1–2 | Thiết kế ERD 17 entity, Prisma schema v1, migrations khởi tạo | Database schema + migration #001; type definitions |
| **Sprint 1** | Tuần 3–4 | Auth flow: form → Zod validate → bcrypt → JWT → httpOnly cookie | 8 auth endpoints; OTP email qua Brevo; refresh token rotation |
| **Sprint 2** | Tuần 5–7 | CRUD Post/Comment, Category taxonomy, permission-aware access | 21 endpoints; block layout; permission matrix cho 3 loại quyền |
| **Sprint 3** | Tuần 8–9 | Vote → Reputation pipeline; SSE notification | Vote system; reputation scoring; real-time push notification |
| **Sprint 4** | Tuần 10–11 | Audit trail; Report workflow; Admin Dashboard | admin-client hoàn chỉnh; 15 AuditAction; 4-state report workflow |
| **Sprint 5** | Tuần 12–13 | AI content flow: prompt → LLM → validate → post via Bot API | vibe-content service; multi-LLM support (OpenAI + Gemini) |

### 7.3.2 Tỷ lệ hoàn thành Use Case

**Bảng 7.6 — Đánh giá hoàn thành theo nhóm Use Case**

| Nhóm Use Case | Tổng UC | Hoàn thành | Tỷ lệ | Ghi chú |
|-------------|:-------:|:-----------:|:-----:|---------|
| Quản lý người dùng (UC-01 → UC-08) | 8 | 8 | 100% | Bao gồm OTP, avatar, block |
| Quản lý nội dung (UC-09 → UC-15) | 7 | 7 | 100% | Block layout, tag, media upload |
| Tương tác cộng đồng (UC-16 → UC-20) | 5 | 5 | 100% | Vote, bookmark, notification, search |
| Quản trị hệ thống (UC-21 → UC-28) | 8 | 8 | 100% | Admin dashboard, audit log, config |
| **Tổng cộng** | **28** | **28** | **100%** | Đúng tiến độ 13 tuần |

### 7.3.3 Phân tích tích lũy độ phức tạp

**Hình 7.2 — Tích lũy độ phức tạp theo Sprint**

```
Số endpoint hoạt động theo thời gian:

Sprint 0:  0  endpoints  ████████ (schema & setup)
Sprint 1:  8  endpoints  ████████████████
Sprint 2: 29  endpoints  ████████████████████████████████████████
Sprint 3: 44  endpoints  ████████████████████████████████████████████████████
Sprint 4: 63  endpoints  █████████████████████████████████████████████...
Sprint 5: 82  endpoints  ██████████████████████████████████████████████████...

        0    10    20    30    40    50    60    70    80
        │────│────│────│────│────│────│────│────│────│
```

Tốc độ phát triển trung bình: **~6 endpoints/tuần** trong 13 tuần, với Sprint 2 có độ phức tạp cao nhất do xây dựng đồng thời CRUD core, permission system và block layout.

---

## 7.4 Đánh giá theo tiêu chí chất lượng MIS

### 7.4.1 Đánh giá theo 5 tiêu chí MIS của Laudon & Laudon

**Bảng 7.7 — Đánh giá MINI-FORUM theo tiêu chí chất lượng MIS**

| Tiêu chí | Định nghĩa | Thực hiện trong MINI-FORUM | Điểm |
|---------|-----------|--------------------------|:----:|
| **Timeliness** (Kịp thời) | Thông tin đến đúng lúc, không trễ | SSE push notification real-time (< 1s); Dashboard cập nhật mỗi tải trang | ★★★★☆ |
| **Accuracy** (Chính xác) | Dữ liệu không lỗi, nhất quán | Zod validation; atomic transactions cho counters; PostgreSQL UNIQUE constraints | ★★★★★ |
| **Relevance** (Phù hợp) | Thông tin phù hợp với từng đối tượng | Permission-based content filtering; notification chỉ gửi cho người liên quan trực tiếp | ★★★★☆ |
| **Completeness** (Đầy đủ) | Cung cấp đủ thông tin cần thiết | 28 UC bao quát đầy đủ vòng đời; audit log với old/new value; 82 API endpoints | ★★★★☆ |
| **Accessibility** (Khả năng truy cập) | Dễ dàng truy cập thông tin | RESTful API với filter/sort/pagination; admin-client UI trực quan; SSE cho real-time | ★★★★☆ |

**Điểm trung bình: 4.2/5** — Đạt mức "Tốt", điểm cải thiện còn lại chủ yếu ở Timeliness (cần Prometheus cho historical metrics) và Accessibility (cần mobile app).

### 7.4.2 Đánh giá bảo mật theo OWASP Top 10

**Bảng 7.8 — MINI-FORUM so với OWASP Top 10 2021**

| Mã | Rủi ro OWASP | Biện pháp trong MINI-FORUM | Mức độ |
|----|------------|--------------------------|:------:|
| A01 | Broken Access Control | JWT + RBAC 5 role; permission-aware categories; middleware chain | ✅ Đầy đủ |
| A02 | Cryptographic Failures | bcrypt password hash (cost factor 12); JWT signed với secret key; HTTPS enforced | ✅ Đầy đủ |
| A03 | Injection | Prisma ORM với parameterized queries (không có raw SQL); Zod input validation | ✅ Đầy đủ |
| A04 | Insecure Design | Separation of concerns; fail-fast validation; immutable audit trail | ✅ Đầy đủ |
| A05 | Security Misconfiguration | Helmet.js security headers; CORS whitelist; environment variables cho secrets | ✅ Đầy đủ |
| A06 | Vulnerable Components | Phụ thuộc npm được quản lý; versions cụ thể trong package.json | ⚠️ Cần audit định kỳ |
| A07 | Auth Failures | Access token TTL 15 phút; refresh token rotation; force logout khi ban | ✅ Đầy đủ |
| A08 | Software/Data Integrity | Migration-versioned schema; immutable audit logs; npm lock file | ✅ Đầy đủ |
| A09 | Logging/Monitoring Failures | Audit trail đầy đủ; operational metrics; structured logging | ✅ Đầy đủ |
| A10 | SSRF | External API calls qua configured services chỉ (ImageKit, Brevo) | ✅ Đầy đủ |

### 7.4.3 Đánh giá theo mô hình FURPS+

**Bảng 7.9 — Đánh giá MINI-FORUM theo FURPS+**

| Tiêu chí FURPS+ | Nội dung đánh giá | Điểm mạnh | Điểm cần cải thiện |
|----------------|-----------------|---------|-------------------|
| **Functionality** | Tính năng hệ thống | 28 UC hoàn chỉnh; 82 endpoints | GraphQL cho mobile efficiency |
| **Usability** | Khả năng sử dụng | UI admin-client trực quan; Radix UI accessible | Cần hướng dẫn onboarding inline |
| **Reliability** | Độ tin cậy | Zod validation; soft delete; retry logic | Cần circuit breaker cho external services |
| **Performance** | Hiệu suất | Index strategy; denormalized counters | Redis cache; async job queue |
| **Supportability** | Khả năng bảo trì | TypeScript strong typing; layered architecture | Cần thêm integration tests |

---

## 7.5 Kết luận

### 7.5.1 Tổng kết 4 lớp trách nhiệm của MINI-FORUM MIS

**Hình 7.3 — Mô hình 4 lớp trách nhiệm hoàn chỉnh**

```
╔══════════════════════════════════════════════════════════════════╗
║              MÔ HÌNH 4 LỚP TRÁCH NHIỆM — MINI-FORUM MIS         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │  LỚP 1: NGHIỆP VỤ (Business)                            │    ║
║  │                                                          │    ║
║  │  • 28 Use Case bao quát đầy đủ vòng đời nội dung         │    ║
║  │  • 5 Actor với phân quyền rõ ràng theo RBAC              │    ║
║  │  • 13+ Business Rules được mã hóa trong service layer    │    ║
║  │  • Category permission linh hoạt 3 chiều                 │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                              ▼                                   ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │  LỚP 2: DỮ LIỆU (Data)                                  │    ║
║  │                                                          │    ║
║  │  • 17 Entity với schema normalize đúng chuẩn 3NF         │    ║
║  │  • Denormalization có chủ đích cho 4 counter fields      │    ║
║  │  • Prisma Migrations — lịch sử schema có version         │    ║
║  │  • 10 Enums mã hóa tất cả trạng thái hệ thống            │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                              ▼                                   ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │  LỚP 3: LUỒNG THÔNG TIN (Information Flow)              │    ║
║  │                                                          │    ║
║  │  • Mọi dữ liệu: Validate → Business Logic → Persistence  │    ║
║  │  • Không có bypass giữa các lớp                          │    ║
║  │  • 6 luồng thông tin cốt lõi được document đầy đủ        │    ║
║  │  • SSE notification pipeline real-time                   │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                              ▼                                   ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │  LỚP 4: KIỂM SOÁT (Control)                             │    ║
║  │                                                          │    ║
║  │  • 3 tầng: Preventive + Detective + Corrective           │    ║
║  │  • Audit trail bất biến — non-repudiation                │    ║
║  │  • Report workflow 4 trạng thái tự động                  │    ║
║  │  • Permission-aware data access tại mọi layer            │    ║
║  └──────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════╝
```

### 7.5.2 Bài học kinh nghiệm từ dự án

Quá trình xây dựng MINI-FORUM để lại 5 bài học quan trọng về thiết kế Hệ thống Thông tin Quản lý:

**Bài học 1 — Schema-first design là bắt buộc:**
Thiết kế database schema trước khi viết một dòng code business logic giúp phát hiện sớm các vấn đề quan hệ phức tạp (self-referencing comments, polymorphic votes, cascade rules). Schema là "nguồn sự thật duy nhất" (single source of truth) — mọi thứ khác dẫn xuất từ đó.

**Bài học 2 — Denormalization là quyết định kiến trúc, không phải lỗi:**
Các counter fields (`upvote_count`, `comment_count`) là denormalization **có mục đích** — phải được document rõ ràng với lý do kỹ thuật và chiến lược đồng bộ (khi nào increment, khi nào recalculate). Denormalization không có mục đích là technical debt; denormalization có mục đích là tối ưu hóa thiết kế.

**Bài học 3 — Audit trail phải được thiết kế từ Sprint 0:**
Audit trail không phải tính năng "thêm sau" — nếu thêm sau sẽ phải refactor toàn bộ service layer để inject `auditLogService`. Thiết kế `audit_logs` từ đầu và bắt buộc tất cả admin actions phải ghi log là quyết định kiến trúc đúng đắn.

**Bài học 4 — Permission model phải phản ánh business rules:**
`PermissionLevel` enum và category permission matrix trực tiếp mã hóa business rules về "ai được làm gì với dữ liệu nào" — giúp code và thiết kế nhất quán, tránh permission check bị rải rác khắp nơi (permission should be centralized, not scattered).

**Bài học 5 — AI integration không cần API riêng:**
`vibe-content` service không cần endpoint riêng — chỉ cần Bot role user và gọi API hiện có (POST /posts, POST /comments). Nguyên tắc "reuse over rebuild" tiết kiệm đáng kể thời gian phát triển và giảm surface area cần maintain.

### 7.5.3 Roadmap phát triển tiếp theo

**Bảng 7.10 — Roadmap phát triển MINI-FORUM**

| Ưu tiên | Tính năng | Lý do kỹ thuật | Độ phức tạp |
|:------:|----------|---------------|:-----------:|
| 🔴 Cao | Redis Pub/Sub cho SSE | Cho phép scale horizontal multi-node | Trung bình |
| 🔴 Cao | GIN index cho Full-text search | Tăng performance search 10–100x khi data lớn | Thấp |
| 🟡 Trung bình | Prometheus + Grafana | Production-grade observability với historical data | Trung bình |
| 🟡 Trung bình | BullMQ job queue | Async email và notification — không block request | Trung bình |
| 🟡 Trung bình | Elasticsearch migration | Search quality và ranking tốt hơn ở scale lớn | Cao |
| 🟢 Thấp | GraphQL API | Giảm over/under-fetching cho mobile client | Cao |
| 🟢 Thấp | Mobile app (React Native) | Mở rộng platform tiếp cận người dùng | Rất cao |

### 7.5.4 Kết luận chung

MINI-FORUM là minh chứng thực tế cho thấy một **Community MIS** hoàn chỉnh có thể được xây dựng trên nền tảng công nghệ hiện đại (Node.js/TypeScript/React/PostgreSQL) với thiết kế phân lớp rõ ràng, kiểm soát chặt chẽ và khả năng mở rộng tốt.

Hệ thống đạt được ba tiêu chí cốt lõi của một MIS chất lượng cao:

1. **Tính chính xác:** Dữ liệu luôn nhất quán nhờ Zod validation, atomic transactions và database constraints
2. **Tính kiểm soát:** Ba tầng kiểm soát (Preventive, Detective, Corrective) phủ đầy đủ mọi kịch bản rủi ro
3. **Tính truy vết:** Audit trail bất biến đảm bảo non-repudiation — đặc trưng không thể thiếu của MIS nghiệp vụ

Dự án cũng chứng minh rằng trong thời đại AI, **tích hợp AI vào MIS không cần phức tạp** — chỉ cần thiết kế API đủ tốt để AI service có thể tái sử dụng, thay vì phải xây dựng lại từ đầu.

---

## PHỤ LỤC

### Phụ lục A — Prisma Schema: Mô tả đầy đủ 17 Models

**Bảng A.1 — Danh sách 17 Models và vai trò trong hệ thống**

| Model | Vai trò chức năng | Quan hệ chính | Ghi chú đặc biệt |
|-------|-----------------|--------------|----------------|
| `users` | Tài khoản người dùng | 1:N posts, 1:N comments, 1:N audit_logs | RBAC role; bcrypt password |
| `posts` | Bài viết diễn đàn | N:1 users, N:1 categories, 1:N comments | Block layout; soft delete; pin/lock |
| `comments` | Bình luận (self-referencing) | N:1 posts, N:1 users, self N:1 via parent_id | Tối đa 2 cấp; soft delete |
| `categories` | Danh mục bài viết | 1:N posts | 3 permission levels (view/post/comment) |
| `tags` | Thẻ phân loại bài viết | N:M posts via post_tags | usage_count denormalized |
| `post_tags` | Junction: posts ↔ tags | N:1 posts, N:1 tags | Composite PK (post_id, tag_id) |
| `post_blocks` | Nội dung block cho bài viết | N:1 posts | BlockType enum (text/image/code/embed) |
| `post_media` | File media đính kèm bài | N:1 posts | ImageKit CDN URL; dimensions |
| `votes` | Vote upvote/downvote | Polymorphic: posts/comments | UNIQUE(user_id, target_type, target_id) |
| `bookmarks` | Lưu bài viết yêu thích | N:1 users, N:1 posts | UNIQUE(user_id, post_id) |
| `notifications` | Thông báo người dùng | N:1 users; ref to posts/comments/users | SSE delivery; soft delete |
| `reports` | Báo cáo vi phạm | Polymorphic: posts/comments/users | 4 trạng thái (PENDING→RESOLVED) |
| `user_blocks` | Chặn giữa người dùng | N:1 users (blocker/blocked) | Tác động feed và comment |
| `audit_logs` | Nhật ký hành động quản trị | N:1 users | Immutable; 15 AuditAction |
| `refresh_tokens` | JWT refresh token management | N:1 users | TTL; rotation on use |
| `otp_tokens` | OTP cho email verification | N:1 users | TTL 15 phút; single-use |
| `user_content_context` | Context tracking cho AI bot | 1:1 users | JSON blob; vibe-content service |

### Phụ lục B — Tổng hợp API Endpoints theo module

**Bảng B.1 — Tổng hợp ~82 API Endpoints**

| Module | URL Prefix | Số endpoint | Yêu cầu Auth |
|--------|-----------|:-----------:|:-----------:|
| Authentication | `/auth` | 8 | Một phần |
| Users | `/users` | 9 | Một phần |
| Posts | `/posts` | 11 | Một phần |
| Comments | `/comments` | 6 | Một phần |
| Categories | `/categories` | 5 | Một phần |
| Tags | `/tags` | 5 | Một phần |
| Votes | `/votes` | 3 | Có |
| Bookmarks | `/bookmarks` | 3 | Có |
| Search | `/search` | 2 | Không |
| Notifications | `/notifications` | 5 | Có |
| Reports (public) | `/reports` | 2 | Một phần |
| Media | `/media` | 4 | Có |
| Admin — Users | `/admin/users` | 8 | Có (Admin) |
| Admin — Reports | `/admin/reports` | 5 | Có (Mod/Admin) |
| Admin — Audit | `/admin/audit-logs` | 1 | Có (Admin) |
| Admin — Dashboard | `/admin/dashboard` | 2 | Có (Mod/Admin) |
| Config | `/config` | 3 | Một phần |
| **Tổng cộng** | | **~82** | |

### Phụ lục C — Cấu trúc thư mục Backend chi tiết

```
backend/src/
│
├── app.ts                         ← Express app setup, middleware chain
├── index.ts                       ← Entry point, server start
│
├── controllers/                   ← HTTP request handlers (no business logic)
│   ├── authController.ts
│   ├── postController.ts
│   ├── commentController.ts
│   ├── voteController.ts
│   ├── userController.ts
│   ├── categoryController.ts
│   ├── tagController.ts
│   ├── notificationController.ts
│   ├── blockReportController.ts
│   ├── adminController.ts
│   ├── configController.ts
│   └── mediaController.ts
│
├── services/                      ← Business logic (pure functions, no HTTP)
│   ├── authService.ts             ← Đăng ký, đăng nhập, OTP, token
│   ├── postService.ts             ← CRUD post, block layout, pin/lock
│   ├── commentService.ts          ← CRUD comment, 2-level thread
│   ├── voteService.ts             ← Vote toggle, reputation update
│   ├── userService.ts             ← Profile, ban, role change
│   ├── categoryService.ts         ← CRUD category, permission management
│   ├── tagService.ts              ← CRUD tag, post-tag junction
│   ├── notificationService.ts     ← Create, mark read, soft delete
│   ├── reportService.ts           ← Report CRUD, workflow management
│   ├── searchService.ts           ← PostgreSQL FTS queries
│   ├── sseService.ts              ← Server-Sent Events connection pool
│   ├── auditLogService.ts         ← Create/query audit logs (INSERT only)
│   ├── imagekitService.ts         ← ImageKit CDN upload, transform
│   ├── postMediaService.ts        ← Post media CRUD, cleanup
│   ├── metricsService.ts          ← In-memory HTTP metrics store
│   ├── emailService.ts            ← Email template rendering
│   └── brevoApiService.ts         ← Brevo (Sendinblue) email delivery
│
├── middlewares/
│   ├── authMiddleware.ts          ← JWT verification, attach req.user
│   ├── roleMiddleware.ts          ← RBAC role requirement check
│   └── metricsMiddleware.ts       ← HTTP request/response metrics collection
│
├── routes/                        ← Express Router definitions
│   ├── authRoutes.ts
│   ├── postRoutes.ts
│   ├── commentRoutes.ts
│   ├── userRoutes.ts
│   ├── categoryRoutes.ts
│   ├── tagRoutes.ts
│   ├── voteRoutes.ts
│   ├── bookmarkRoutes.ts
│   ├── notificationRoutes.ts
│   ├── reportRoutes.ts
│   ├── searchRoutes.ts
│   ├── mediaRoutes.ts
│   ├── adminRoutes.ts
│   └── configRoutes.ts
│
├── validations/                   ← Zod schemas for each endpoint
│   ├── authValidation.ts
│   ├── postValidation.ts
│   ├── commentValidation.ts
│   └── ...
│
├── types/                         ← TypeScript interfaces & type definitions
│   ├── express.d.ts               ← req.user type augmentation
│   └── ...
│
├── config/                        ← App configuration (env vars)
└── constants/                     ← Business constants, enums mirror
```

### Phụ lục D — Stack công nghệ đầy đủ

**Bảng D.1 — Công nghệ sử dụng trong dự án MINI-FORUM**

| Thành phần | Công nghệ | Phiên bản | Lý do chọn |
|-----------|----------|:--------:|------------|
| Runtime Backend | Node.js | 20 LTS | Hiệu năng I/O cao, ecosystem npm phong phú |
| Framework Backend | Express.js | 4.x | Lightweight, middleware-first, mature |
| Ngôn ngữ | TypeScript | 5.x | Type safety, IDE support, refactoring an toàn |
| ORM | Prisma | 5.x | Type-safe queries, migration versioning, auto-generate client |
| Cơ sở dữ liệu | PostgreSQL | 15+ | ACID transactions, native enums, FTS, RLS |
| Validation | Zod | 3.x | TypeScript-first, runtime + compile-time safety |
| Authentication | jsonwebtoken + bcrypt | — | JWT industry standard; bcrypt cho password hashing |
| Email | Brevo (Sendinblue) SDK | — | Transactional email, generous free tier |
| Media CDN | ImageKit SDK | — | On-the-fly image transformation, CDN global |
| Frontend UI | React | 18 | Ecosystem rộng, component model, React Query |
| Build Tool | Vite | 5.x | Fast HMR, native ESM, optimized build |
| Styling | Tailwind CSS | 3.x | Utility-first, design consistency |
| UI Components | Radix UI | — | Accessible headless components |
| Data Fetching | TanStack Query (React Query) | v5 | Server state management, caching, refetch |
| Form | React Hook Form + Zod | 7.x | Performance, validation integration |
| Routing (SPA) | React Router | v6 | Declarative routing, nested routes |
| Container | Docker | — | Reproducible environment |
| CI/CD Frontend | Vercel | — | Zero-config deployment, preview environments |
| CI/CD Backend | Render.com | — | Auto-deploy từ Git, managed PostgreSQL |
| Testing | Vitest | — | Vite-native test runner, Jest-compatible API |

### Phụ lục E — Danh sách 10 Enums hệ thống

**Bảng E.1 — Danh sách Enum và giá trị**

| Enum | Giá trị | Sử dụng ở |
|------|---------|----------|
| `UserRole` | `GUEST`, `MEMBER`, `MODERATOR`, `ADMIN`, `BOT` | `users.role` |
| `PostStatus` | `DRAFT`, `PUBLISHED`, `DELETED`, `ARCHIVED` | `posts.status` |
| `CommentStatus` | `VISIBLE`, `HIDDEN`, `DELETED` | `comments.status` |
| `ReportStatus` | `PENDING`, `REVIEWING`, `RESOLVED`, `DISMISSED` | `reports.status` |
| `ReportTargetType` | `POST`, `COMMENT`, `USER` | `reports.target_type` |
| `VoteType` | `UPVOTE`, `DOWNVOTE` | `votes.type` |
| `NotificationType` | `COMMENT_ON_POST`, `REPLY_TO_COMMENT`, `VOTE_ON_POST`, `MENTION`, `SYSTEM` | `notifications.type` |
| `BlockType` | `TEXT`, `IMAGE`, `CODE`, `EMBED`, `DIVIDER` | `post_blocks.type` |
| `AuditAction` | `BAN`, `UNBAN`, `DELETE`, `HIDE`, `SHOW`, `PIN`, `LOCK`, `ROLE_CHANGE`, `UPDATE`, `LOGIN`, `LOGOUT`, `VIEW_MASKED_CONTENT`, `FORCE_LOGOUT` | `audit_logs.action` |
| `PermissionLevel` | `GUEST`, `MEMBER`, `MODERATOR`, `ADMIN` | `categories.*_permission` |

---

## TÀI LIỆU THAM KHẢO

1. Laudon, K. C., & Laudon, J. P. (2022). *Management Information Systems: Managing the Digital Firm* (17th ed.). Pearson Education.

2. Turban, E., Volonino, L., & Wood, G. R. (2015). *Information Technology for Management: Digital Strategies for Insight, Action, and Sustainable Performance* (10th ed.). Wiley.

3. Prisma Team. (2024). *Prisma ORM Documentation*. https://www.prisma.io/docs

4. OWASP Foundation. (2021). *OWASP Top Ten 2021*. https://owasp.org/Top10

5. Mozilla Developer Network. (2024). *Server-Sent Events — Using server-sent events*. https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

6. Auth0 Engineering. (2024). *Refresh Token Rotation*. https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation

7. Fowler, M. (2018). *Patterns of Enterprise Application Architecture*. Addison-Wesley Professional.

8. PostgreSQL Global Development Group. (2024). *PostgreSQL 15 Documentation: Full Text Search*. https://www.postgresql.org/docs/15/textsearch.html

9. Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson Education.

10. Pressman, R. S., & Maxim, B. (2019). *Software Engineering: A Practitioner's Approach* (9th ed.). McGraw-Hill Education.

---

*Báo cáo được hoàn thành ngày 04/05/2026*

*Toàn bộ nội dung báo cáo dựa trên phân tích codebase thực tế của dự án MINI-FORUM tại monorepo `e:\TT\mini-forum`*
