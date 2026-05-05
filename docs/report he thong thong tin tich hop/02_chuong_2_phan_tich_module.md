# CHƯƠNG 2 — PHÂN TÍCH VÀ THIẾT KẾ MODULE

---

## 2.1 Kiến trúc module Backend — 6 nhóm chức năng

### 2.1.1 Nguyên tắc tổ chức module

Backend MINI-FORUM được tổ chức theo nguyên tắc **domain-driven module structure**: mỗi domain nghiệp vụ độc lập có controller và service riêng. Các module không phụ thuộc trực tiếp vào nhau ở tầng controller — sự phối hợp giữa các module (nếu có) được thực hiện ở tầng service thông qua dependency injection. Toàn bộ mã nguồn backend nằm trong thư mục `backend/src/`.

Việc phân chia theo domain nghiệp vụ thay vì theo kiểu kỹ thuật (ví dụ: không nhóm tất cả controller vào một tầng riêng biệt) mang lại lợi ích rõ ràng: khi cần sửa đổi chức năng Vote, lập trình viên chỉ cần tìm đến `voteController.ts` và `voteService.ts` mà không cần duyệt qua toàn bộ codebase.

### 2.1.2 Sơ đồ tổ chức module Backend

**Hình 2.1 — Sơ đồ tổ chức 6 module nghiệp vụ của Backend**

```
backend/src/
│
├── ════════════════════════════════════════════════════════
│   MODULE 1 — Auth & Security (Xác thực và Bảo mật)
│   ════════════════════════════════════════════════════════
│   controllers/
│   └── authController.ts      ← Xử lý đăng ký, đăng nhập, refresh token,
│                                 đặt lại mật khẩu qua OTP
│   services/
│   ├── authService.ts         ← JWT sign/verify, bcrypt hash, quản lý refresh token
│   ├── otpService.ts          ← Sinh mã OTP 6 chữ số, xác thực, hết hạn
│   ├── emailService.ts        ← Abstraction layer gửi email (tách biệt với provider)
│   └── brevoApiService.ts     ← Adapter gọi Brevo Transactional Email API
│   middlewares/
│   ├── authMiddleware.ts      ← Xác minh JWT, attach req.user vào request
│   ├── roleMiddleware.ts      ← RBAC: kiểm tra role của user >= role yêu cầu
│   └── securityMiddleware.ts  ← Helmet HTTP headers, CORS whitelist, Rate Limiting
│
├── ════════════════════════════════════════════════════════
│   MODULE 2 — Forum Core (Nội dung diễn đàn)
│   ════════════════════════════════════════════════════════
│   controllers/
│   ├── postController.ts         ← CRUD bài viết, ghim (pin), khóa (lock)
│   ├── postMediaController.ts    ← Upload và xóa ảnh đính kèm bài viết
│   ├── commentController.ts      ← CRUD bình luận, thread lồng nhau, trích dẫn
│   ├── categoryController.ts     ← CRUD danh mục, thiết lập permission level
│   └── tagController.ts          ← CRUD nhãn, gán nhãn cho bài viết
│   services/
│   ├── postService.ts            ← Business logic bài viết, đếm view_count
│   ├── postMediaService.ts       ← Upload/xóa ảnh lên ImageKit CDN
│   ├── commentService.ts         ← Logic bình luận lồng nhau, giới hạn thời gian sửa
│   ├── categoryService.ts        ← Kiểm tra và áp dụng category permission
│   └── tagService.ts             ← Quản lý nhãn, cập nhật usage_count
│
├── ════════════════════════════════════════════════════════
│   MODULE 3 — Interaction (Tương tác người dùng)
│   ════════════════════════════════════════════════════════
│   controllers/
│   ├── voteController.ts         ← Upvote/downvote bài viết và bình luận
│   ├── bookmarkController.ts     ← Lưu/bỏ bookmark bài viết
│   └── searchController.ts       ← Full-text search theo từ khóa
│   services/
│   ├── voteService.ts            ← Logic vote, toggle vote, cập nhật reputation
│   ├── bookmarkService.ts        ← Toggle bookmark (thêm nếu chưa có, xóa nếu đã có)
│   └── searchService.ts          ← PostgreSQL full-text search với GIN index
│
├── ════════════════════════════════════════════════════════
│   MODULE 4 — Notification (Thông báo thời gian thực)
│   ════════════════════════════════════════════════════════
│   controllers/
│   └── notificationController.ts ← Lấy danh sách, đánh dấu đã xem, xóa thông báo
│   services/
│   ├── notificationService.ts    ← Tạo notification theo từng loại sự kiện
│   └── sseService.ts             ← Quản lý pool kết nối SSE (Server-Sent Events)
│
├── ════════════════════════════════════════════════════════
│   MODULE 5 — Moderation & Admin (Kiểm duyệt và Quản trị)
│   ════════════════════════════════════════════════════════
│   controllers/
│   ├── adminController.ts        ← Dashboard, quản lý người dùng, xem metrics
│   ├── blockReportController.ts  ← Block/unblock người dùng, báo cáo vi phạm
│   └── configController.ts       ← Đọc/ghi cấu hình động của hệ thống
│   services/
│   ├── blockService.ts           ← Tạo và xóa quan hệ block
│   ├── blockValidationService.ts ← Kiểm tra quan hệ block trước khi thực hiện action
│   ├── reportService.ts          ← Xử lý báo cáo (resolve/dismiss)
│   ├── auditLogService.ts        ← Ghi nhật ký hành động admin (audit trail)
│   └── metricsService.ts         ← Thu thập, lưu và truy vấn HTTP metrics
│
└── ════════════════════════════════════════════════════════
    MODULE 6 — User Management (Quản lý người dùng)
    ════════════════════════════════════════════════════════
    controllers/
    └── userController.ts         ← Xem/cập nhật hồ sơ, thay đổi avatar
    services/
    ├── userService.ts            ← Business logic người dùng, tìm kiếm user
    └── imagekitService.ts        ← Tích hợp ImageKit CDN: upload, xóa, signed URL

    ════════════════════════════════════════════════════════
    CROSS-CUTTING CONCERNS (Middleware dùng chung)
    ════════════════════════════════════════════════════════
    middlewares/
    ├── validateMiddleware.ts     ← Wrapper Zod schema validation
    ├── errorMiddleware.ts        ← Global error handler, chuẩn hóa format response
    ├── httpLoggerMiddleware.ts   ← Structured HTTP access log (morgan-style)
    ├── metricsMiddleware.ts      ← Đếm request, đo response time theo endpoint
    ├── requestIdMiddleware.ts    ← Gán unique request ID (X-Request-ID header)
    └── uploadMiddleware.ts       ← Multer cấu hình cho file upload (ảnh)
```

### 2.1.3 Thống kê tổng hợp các module

**Bảng 2.1 — Thống kê controller và service theo từng module**

| Module | Số Controller | Số Service | Chức năng chính |
|---|:---:|:---:|---|
| Auth & Security | 1 | 4 | Xác thực JWT, OTP, Email giao dịch (Brevo) |
| Forum Core | 5 | 5 | CRUD bài viết, bình luận, danh mục, nhãn, ảnh |
| Interaction | 3 | 3 | Vote, Bookmark, Full-text Search |
| Notification | 1 | 2 | SSE real-time, Notification CRUD |
| Moderation & Admin | 3 | 5 | Kiểm duyệt, Block, Audit Log, Config, Metrics |
| User Management | 1 | 2 | Hồ sơ người dùng, ImageKit CDN |
| **Tổng cộng** | **14** | **21** | |

Trong tổng số 21 services, 6 service thuộc nhóm **cross-module dependencies** — tức là được gọi từ các module khác ngoài module chủ của chúng. Điển hình là `notificationService` (được gọi từ postService, commentService, voteService khi phát sinh sự kiện), `auditLogService` (được gọi từ adminController khi thực hiện thao tác quản trị) và `blockValidationService` (được gọi ở đầu nhiều service để kiểm tra xem hai người dùng có đang chặn nhau không trước khi cho phép tương tác).

---

## 2.2 Dependency Graph — Luồng xử lý Request

### 2.2.1 Pipeline middleware tổng quát

Mọi HTTP request đến backend đều đi qua một pipeline có thứ tự cố định trước khi đến được controller handler. Pipeline này được thiết kế theo nguyên tắc **fail-fast**: nếu một bước xác thực thất bại (ví dụ: token không hợp lệ), request bị từ chối ngay lập tức mà không tiếp tục xuống các lớp sâu hơn.

**Hình 2.2 — Dependency Graph — Luồng xử lý request qua middleware pipeline**

```
             ┌──────────────────────────────────────┐
             │         HTTP Request đến             │
             │  (từ frontend / admin-client /        │
             │         vibe-content)                 │
             └────────────────┬─────────────────────┘
                              │
             ┌────────────────▼─────────────────────┐
             │         requestIdMiddleware           │
             │  • Gán X-Request-ID = uuid()          │
             │  • Attach req.id vào request object   │
             │  • Mục đích: distributed tracing      │
             └────────────────┬─────────────────────┘
                              │
             ┌────────────────▼─────────────────────┐
             │          metricsMiddleware            │
             │  • Ghi nhận thời điểm bắt đầu xử lý  │
             │  • Đếm request theo endpoint + method │
             │  • Đo response time khi kết thúc      │
             └────────────────┬─────────────────────┘
                              │
             ┌────────────────▼─────────────────────┐
             │         httpLoggerMiddleware          │
             │  • Log: method, URL, IP, user-agent   │
             │  • Log: status code, duration (ms)    │
             │  • Format: JSON structured logging    │
             └────────────────┬─────────────────────┘
                              │
             ┌────────────────▼─────────────────────┐
             │          securityMiddleware           │
             │  ├── helmet()  → Bảo mật HTTP headers │
             │  ├── cors()    → Whitelist origin      │
             │  └── rateLimit() → Giới hạn 100 req/  │
             │                   15 phút mỗi IP      │
             └────────────────┬─────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │ Route có yêu cầu xác thực?              │
         │ (protected endpoint)                    │
         └────────────┬────────────────────────────┘
                      │ Có                          │ Không
                      ▼                             │
     ┌────────────────────────────┐                 │
     │       authMiddleware       │                 │
     │  • Đọc Authorization header│                 │
     │  • Verify JWT signature    │                 │
     │  • Kiểm tra hạn sử dụng   │                 │
     │  • attach req.user         │                 │
     │  • 401 nếu token không hợp │                 │
     └──────────────┬─────────────┘                 │
                    │                               │
                    ▼                               │
     ┌────────────────────────────┐                 │
     │       roleMiddleware       │                 │
     │  • Đọc req.user.role       │                 │
     │  • So sánh với role yêu cầu│                 │
     │    của route               │                 │
     │  • 403 nếu không đủ quyền  │                 │
     └──────────────┬─────────────┘                 │
                    │                               │
                    └──────────────┬────────────────┘
                                   │
             ┌─────────────────────▼────────────────┐
             │          validateMiddleware           │
             │  • Gọi schema.parse(req.body)         │
             │  • Zod schema tùy theo route          │
             │  • 400 + error details nếu invalid    │
             └─────────────────────┬────────────────┘
                                   │
             ┌─────────────────────▼────────────────┐
             │        Controller Handler             │
             │  • Trích xuất dữ liệu đã validate    │
             │  • Gọi service method tương ứng       │
             │  • Format và trả JSON response        │
             └──────┬───────────────────┬────────────┘
                    │                   │
        ┌───────────▼──────┐  ┌─────────▼────────────┐
        │   Service Layer  │  │  Side Effects        │
        │  Business Logic  │  │                      │
        │                  │  │  notificationService │
        │  prisma queries  │  │  + sseService        │
        │  transaction     │  │                      │
        └───────────┬──────┘  │  auditLogService     │
                    │         │  (admin actions)     │
                    ▼         └──────────────────────┘
             ┌────────────────────────────────┐
             │         PostgreSQL DB          │
             └────────────────────────────────┘
```

### 2.2.2 Quy tắc dependency giữa các lớp

Để đảm bảo tính nhất quán và khả năng kiểm thử (testability), các quy tắc phụ thuộc sau được áp dụng nghiêm ngặt trong toàn bộ codebase:

**Bảng 2.2 — Quy tắc dependency và lý do áp dụng**

| Quy tắc | Mô tả chi tiết | Lý do |
|---|---|---|
| Controller không gọi Prisma trực tiếp | Mọi truy cập database phải đi qua service | Đảm bảo business logic luôn được thực thi; dễ mock trong test |
| Service không đọc `req`/`res` | Service là pure function — không phụ thuộc Express | Có thể gọi service từ context không phải HTTP (cron job, test) |
| Cross-module service call | Service A có thể gọi Service B qua import trực tiếp | Cho phép tái sử dụng logic mà không cần duplicate |
| Side effects tách biệt khỏi main flow | Notification, audit log không block main response | Lỗi phụ không ảnh hưởng đến kết quả nghiệp vụ chính |
| Middleware không chứa business logic | Middleware chỉ làm gate-keeping (auth, validate, log) | Rõ ràng về trách nhiệm; dễ bật/tắt middleware theo route |

### 2.2.3 Ví dụ minh họa: Luồng xử lý tạo bài viết mới

Luồng dưới đây minh họa chi tiết cách một request `POST /api/v1/posts` được xử lý qua toàn bộ pipeline, bao gồm các side effects được kích hoạt sau khi nghiệp vụ chính hoàn thành:

**Hình 2.3 — Sequence Diagram — Luồng tạo bài viết mới**

```
Client                Backend                   DB
  │                     │                        │
  │─POST /api/v1/posts──►│                        │
  │  Authorization: JWT  │                        │
  │  body: {title,       │                        │
  │    categoryId, tags} │                        │
  │                      │                        │
  │              [authMiddleware]                  │
  │              └─► verify JWT ✓                  │
  │              └─► req.user = {id:5, role:MEMBER}│
  │                      │                        │
  │              [validateMiddleware]              │
  │              └─► Zod.parse(body) ✓             │
  │              └─► validated = {title, catId,...}│
  │                      │                        │
  │              [postController.createPost()]     │
  │              └─► postService.create(data)      │
  │                            │                  │
  │                            │─SELECT categories─►│
  │                            │◄─{id,viewPerm}────│
  │                            │                  │
  │                            │─INSERT posts─────►│
  │                            │◄─{id: 42, slug}───│
  │                            │                  │
  │                            │─INSERT post_tags─►│
  │                            │◄─success──────────│
  │                            │                  │
  │              ┌─────────────┘                  │
  │              │ (side effect, async)            │
  │              └─► notificationService           │
  │                   └─► subscribers của category │
  │                   └─► INSERT notifications ───►│
  │                   └─► sseService.push() [SSE]  │
  │                      │                        │
  │◄─HTTP 201 ────────────│                        │
  │  {post: {id:42, ...}} │                        │
```

*Điểm quan trọng:* Side effect gửi notification được thực hiện **sau khi** response 201 đã được gửi về client. Điều này đảm bảo người dùng không phải chờ quá trình gửi notification hoàn thành — giảm perceived latency và cô lập lỗi notification khỏi luồng nghiệp vụ chính.

---

## 2.3 Kiến trúc Module Vibe-Content Service (Pipeline 8 bước)

### 2.3.1 Tổng quan và mục đích của service

`vibe-content` là dịch vụ **autonomous content generator** — hoạt động theo lịch định kỳ, không phục vụ HTTP request từ trình duyệt hay người dùng. Mục tiêu của dịch vụ là mô phỏng hoạt động của người dùng thực trong diễn đàn thông qua trí tuệ nhân tạo, nhằm duy trì sự sôi động của nội dung, đặc biệt trong giai đoạn đầu khi lượng người dùng thật còn ít.

Mỗi "bot" trong hệ thống là một tài khoản người dùng thực sự trong database, có tên gọi, avatar và phong cách viết riêng. `vibe-content` đăng nhập với tài khoản bot, thu thập ngữ cảnh hiện tại của diễn đàn, quyết định hành động phù hợp, và tạo nội dung bằng AI trước khi đăng lên qua Forum API.

**Cấu trúc thư mục của Vibe-Content Service:**

```
vibe-content/src/
├── index.ts                       ← Entry point, khởi tạo scheduler
├── scheduler/
│   └── jobs.ts                    ← Định nghĩa cron jobs và tần suất
├── services/
│   ├── ContextGathererService.ts  ← Bước 1: Thu thập dữ liệu từ DB
│   ├── ActionSelectorService.ts   ← Bước 2: Quyết định hành động
│   ├── PersonalityService.ts      ← Bước 3: Load cá tính bot
│   ├── PromptBuilderService.ts    ← Bước 4: Xây dựng prompt
│   ├── ContentGeneratorService.ts ← Bước 5: Gọi LLM sinh nội dung
│   ├── ValidationService.ts       ← Bước 6: Kiểm tra chất lượng
│   ├── APIExecutorService.ts      ← Bước 7: Đăng qua Forum API
│   ├── StatusService.ts           ← Bước 8: Cập nhật trạng thái
│   └── llm/                       ← Provider adapters
│       ├── geminiProvider.ts      ← Google Gemini (ưu tiên 1)
│       ├── groqProvider.ts        ← Groq/Llama (ưu tiên 2)
│       ├── cerebrasProvider.ts    ← Cerebras (ưu tiên 3)
│       └── nvidiaProvider.ts      ← Nvidia NIM (ưu tiên 4)
├── tracking/                      ← Bot activity metrics
├── config/                        ← Biến môi trường riêng của service
└── types/                         ← TypeScript type definitions
```

### 2.3.2 Pipeline 8 bước — Mô tả chi tiết từng bước

**Hình 2.4 — Sơ đồ Pipeline 8 bước của Vibe-Content Service**

```
 ┌────────────────────────────────────────────────────────────────┐
 │                    VIBE-CONTENT PIPELINE                       │
 └────────────────────────────────────────────────────────────────┘

 ┌─ BƯỚC 0 ──────────────────────────────────────────────────────┐
 │  Cron Scheduler                                               │
 │  • Trigger theo interval cấu hình (ví dụ: mỗi 30 phút)       │
 │  • Chọn bot user tiếp theo trong hàng đợi luân phiên          │
 │  • Kiểm tra next_scheduled trong user_content_context         │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
 ┌─ BƯỚC 1 ──────────────────────▼───────────────────────────────┐
 │  ContextGathererService                                       │
 │  Nguồn: Prisma → PostgreSQL (READ ONLY)                       │
 │                                                               │
 │  • SELECT top 10 trending posts (view_count cao nhất/24h)     │
 │  • SELECT posts ít comment nhất (cần thảo luận)               │
 │  • SELECT active categories và tags phổ biến hiện tại         │
 │  • SELECT user_content_context (lịch sử hành động của bot)    │
 │  • Tổng hợp thành ForumContext object                         │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
 ┌─ BƯỚC 2 ──────────────────────▼───────────────────────────────┐
 │  ActionSelectorService                                        │
 │  • Phân tích ForumContext → chọn ActionType tối ưu:           │
 │    - CREATE_POST:    Khi category thiếu bài viết mới          │
 │    - CREATE_COMMENT: Khi post có view cao nhưng ít comment    │
 │    - UPVOTE:         Khi cần tăng engagement cho bài hay      │
 │  • Trả về ActionPlan { type, targetPostId?, categoryId? }     │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
 ┌─ BƯỚC 3 ──────────────────────▼───────────────────────────────┐
 │  PersonalityService                                           │
 │  • Load personality profile của bot từ seed/botUsers.ts       │
 │  • Mỗi bot: { tone, topic_interests, interaction_style,       │
 │               writing_level, preferred_categories }           │
 │  • Trả về PersonalityProfile phù hợp với ActionType          │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
 ┌─ BƯỚC 4 ──────────────────────▼───────────────────────────────┐
 │  PromptBuilderService                                         │
 │  • Đọc template: prompts/post.template.txt                    │
 │                  prompts/comment.template.txt                 │
 │  • Inject: forum context + personality + action type          │
 │  • Bổ sung: ràng buộc ngôn ngữ, độ dài, định dạng            │
 │  • Trả về chuỗi prompt hoàn chỉnh sẵn sàng gửi LLM           │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
 ┌─ BƯỚC 5 ──────────────────────▼───────────────────────────────┐
 │  ContentGeneratorService — Multi-LLM Fallback Chain           │
 │                                                               │
 │  [1] geminiProvider.ts   ── Gemini 1.5 Flash (ưu tiên cao)   │
 │       │ (nếu fail: quota, timeout, error)                     │
 │  [2] groqProvider.ts     ── Groq Llama 3 (fallback 1)        │
 │       │ (nếu fail)                                            │
 │  [3] cerebrasProvider.ts ── Cerebras Llama (fallback 2)      │
 │       │ (nếu fail)                                            │
 │  [4] nvidiaProvider.ts   ── Nvidia NIM (fallback cuối)       │
 │       │ (nếu tất cả fail → throw Error, log failure)         │
 │  └─► Trả về raw content string từ LLM                        │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
 ┌─ BƯỚC 6 ──────────────────────▼───────────────────────────────┐
 │  ValidationService                                            │
 │  • Kiểm tra độ dài nội dung (min 50, max 5000 ký tự)         │
 │  • Phát hiện code block không phù hợp với ngữ cảnh           │
 │  • Kiểm tra ngôn ngữ đúng yêu cầu (tiếng Việt/Anh)          │
 │  • Loại bỏ ký tự đặc biệt, meta-commentary của LLM           │
 │  • Nếu invalid → log reason, kết thúc pipeline (skip)        │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
 ┌─ BƯỚC 7 ──────────────────────▼───────────────────────────────┐
 │  APIExecutorService                                           │
 │  • Đăng nhập với bot user credentials → lấy JWT              │
 │  • Gọi Forum REST API:                                        │
 │    ├── POST /api/v1/posts      (nếu CREATE_POST)              │
 │    ├── POST /api/v1/comments   (nếu CREATE_COMMENT)           │
 │    └── POST /api/v1/votes      (nếu VOTE)                    │
 │  • Nhận response { id, success } từ backend                  │
 │  • KHÔNG gọi prisma trực tiếp — tuân thủ API-first          │
 └───────────────────────────────┬───────────────────────────────┘
                                 │
 ┌─ BƯỚC 8 ──────────────────────▼───────────────────────────────┐
 │  StatusService                                                │
 │  • Cập nhật user_content_context:                             │
 │    - last_action: loại hành động vừa thực hiện               │
 │    - action_count: tăng 1                                    │
 │    - last_post_id / last_comment_id: ID vừa tạo              │
 │    - next_scheduled: thời điểm chạy tiếp theo                │
 │  • Ghi log chi tiết vào logs/ (JSON format)                  │
 └───────────────────────────────────────────────────────────────┘
```

### 2.3.3 Hai kênh giao tiếp với hệ thống Backend

`vibe-content` có hai kênh giao tiếp được thiết kế với mục đích khác nhau và áp dụng nguyên tắc khác nhau:

**Kênh 1 — Đọc context trực tiếp từ Database (Prisma READ-ONLY):**

Dịch vụ sử dụng Prisma Client để trực tiếp truy vấn PostgreSQL khi thu thập ngữ cảnh (Bước 1). Lý do chọn direct DB access thay vì gọi API cho tác vụ này:

- Hiệu quả cao hơn: một truy vấn tổng hợp (aggregate query) có thể thu thập dữ liệu từ nhiều bảng trong một round-trip, so với nhiều API call riêng lẻ.
- Không có side effect: truy vấn SELECT thuần túy không thay đổi trạng thái database, do đó không cần thông qua business logic.
- Không cần xác thực: truy vấn chạy từ server đến server, không qua public API endpoint.

```typescript
// ContextGathererService.ts — chỉ SELECT, không có INSERT/UPDATE
const trendingPosts = await prisma.posts.findMany({
  where: {
    status: 'PUBLISHED',
    created_at: { gte: yesterday }
  },
  orderBy: { view_count: 'desc' },
  take: 10,
  include: {
    categories: true,
    post_tags: { include: { tags: true } },
    _count: { select: { comments: true } }
  }
});
```

**Kênh 2 — Thực thi hành động qua Forum REST API (HTTP):**

Khi cần tạo bài viết, bình luận hoặc vote (Bước 7), dịch vụ bắt buộc sử dụng Forum API thay vì gọi Prisma trực tiếp. Đây là áp dụng của Nguyên tắc API-first được trình bày ở Chương 1:

```typescript
// APIExecutorService.ts — LUÔN qua API, không dùng prisma.create()
const response = await axios.post(
  `${process.env.FORUM_API_URL}/api/v1/posts`,
  {
    title: generatedTitle,
    categoryId: selectedCategoryId,
    blocks: [{ type: 'TEXT', content: generatedContent, order: 0 }],
    tags: selectedTags
  },
  {
    headers: { Authorization: `Bearer ${botAccessToken}` }
  }
);
```

Qua API, toàn bộ business logic của backend được kích hoạt: Zod validation, kiểm tra category permission, tạo notification cho subscribers, ghi audit log, và cập nhật usage_count của tags. Bot hoạt động **đúng như một người dùng thực**, không có "đặc quyền" kỹ thuật nào.

---

## 2.4 Cấu trúc Module Frontend

### 2.4.1 Tổng quan kiến trúc ứng dụng React

Ứng dụng `frontend/` được xây dựng với React 18 và Vite 5, tổ chức theo **feature-based structure** kết hợp **layered API client**. Cấu trúc này tách biệt rõ ràng giữa: lớp routing và truy cập kiểm soát, lớp component UI tái sử dụng, lớp trang (page) theo 1:1 với route, và lớp API client tích hợp React Query.

**Hình 2.5 — Sơ đồ cấu trúc thư mục Frontend**

```
frontend/src/
│
├── main.tsx                   ← Entry point: mount React app, providers
│
├── App.tsx                    ← Root component: cấu hình React Router, layout
│
├── routes/                    ← Route guard wrappers
│   ├── ProtectedRoute.tsx     ← Redirect về /login nếu user chưa đăng nhập
│   └── GuestRoute.tsx         ← Redirect về / nếu user đã đăng nhập
│
├── pages/                     ← 14 trang (1:1 với route URL)
│   ├── HomePage.tsx           ← Feed bài viết, lọc theo category/tag, sắp xếp
│   ├── PostDetailPage.tsx     ← Nội dung bài viết + toàn bộ thread bình luận
│   ├── CategoriesPage.tsx     ← Danh sách danh mục với số bài viết
│   ├── TagsPage.tsx           ← Danh sách nhãn + bài viết theo nhãn
│   ├── SearchPage.tsx         ← Full-text search với highlight từ khóa
│   ├── ProfilePage.tsx        ← Hồ sơ người dùng, lịch sử bài viết
│   ├── EditProfilePage.tsx    ← Cập nhật thông tin cá nhân, đổi avatar
│   ├── BookmarksPage.tsx      ← Danh sách bài viết đã lưu
│   ├── NotificationsPage.tsx  ← Danh sách thông báo + kết nối SSE
│   ├── BlockedUsersPage.tsx   ← Danh sách người dùng đã chặn
│   ├── LoginPage.tsx          ← Form đăng nhập với xác thực
│   ├── RegisterPage.tsx       ← Form đăng ký tài khoản mới
│   ├── ForgotPasswordPage.tsx ← Quy trình đặt lại mật khẩu qua OTP
│   └── EditPostPage.tsx       ← Block-based editor để chỉnh sửa bài viết
│
├── components/                ← Shared components tái sử dụng
│   ├── layout/
│   │   ├── Navbar.tsx         ← Thanh điều hướng: logo, auth state, notification bell
│   │   ├── Sidebar.tsx        ← Sidebar: danh mục, tag cloud, trending
│   │   └── Footer.tsx         ← Footer với liên kết và thông tin
│   ├── ui/                    ← Atomic UI: Button, Input, Modal, Dropdown, Badge
│   ├── post/
│   │   ├── PostCard.tsx       ← Card hiển thị bài viết trong danh sách
│   │   ├── PostEditor.tsx     ← Block-based editor (TEXT + IMAGE blocks)
│   │   └── BlockRenderer.tsx  ← Render block theo loại (text/image)
│   ├── comment/
│   │   ├── CommentTree.tsx    ← Hiển thị thread bình luận lồng nhau đệ quy
│   │   ├── CommentForm.tsx    ← Form tạo/sửa bình luận
│   │   └── QuoteBlock.tsx     ← Hiển thị trích dẫn bình luận
│   └── common/
│       ├── Spinner.tsx        ← Loading indicator
│       ├── ErrorBoundary.tsx  ← React error boundary
│       └── Avatar.tsx         ← Hiển thị avatar với fallback
│
├── api/                       ← API client layer
│   ├── axiosInstance.ts       ← Axios instance với interceptors:
│   │                             - Tự động inject Authorization header
│   │                             - Tự động refresh token khi 401
│   └── services/
│       ├── postService.ts     ← useQuery/useMutation hooks cho post
│       ├── commentService.ts  ← hooks cho comment operations
│       ├── userService.ts     ← hooks cho user profile
│       ├── voteService.ts     ← hooks cho vote
│       ├── bookmarkService.ts ← hooks cho bookmark
│       ├── searchService.ts   ← hooks cho search
│       └── ...                ← Mỗi domain có file hooks riêng
│
├── contexts/
│   └── AuthContext.tsx        ← Global auth state: user, token, logout()
│
├── hooks/                     ← Custom React hooks domain-specific
│   ├── useDebounce.ts         ← Debounce input để giảm API call
│   ├── useInfiniteScroll.ts   ← Infinite scroll với Intersection Observer
│   └── useSSE.ts              ← Kết nối và nhận Server-Sent Events
│
├── types/                     ← TypeScript interfaces phản chiếu API response
├── utils/                     ← Pure helper functions
└── constants/                 ← App-wide constants (routes, labels)
```

### 2.4.2 Kiến trúc quản lý State hai tầng

Frontend áp dụng nguyên tắc phân tách rõ ràng giữa **server state** và **client state**. Sự phân tách này tránh được vấn đề "stale data" phổ biến khi đặt API data vào Redux/Context, đồng thời giảm đáng kể lượng boilerplate code cần viết.

**Hình 2.6 — Kiến trúc quản lý State hai tầng trong Frontend**

```
 ┌──────────────────────────────────────────────────────────────┐
 │                    React Application                         │
 │                                                              │
 │  ┌─────────────────────────┐  ┌────────────────────────────┐ │
 │  │     SERVER STATE         │  │      CLIENT STATE          │ │
 │  │     (React Query)        │  │   (Context + useState)     │ │
 │  │                          │  │                            │ │
 │  │  Nguồn: Backend API      │  │  Nguồn: User interaction   │ │
 │  │                          │  │                            │ │
 │  │  • posts, comments       │  │  AuthContext:              │ │
 │  │  • users, categories     │  │  • user (profile data)     │ │
 │  │  • notifications         │  │  • accessToken (JWT)       │ │
 │  │  • search results        │  │  • logout()                │ │
 │  │  • bookmarks             │  │                            │ │
 │  │                          │  │  Local state:              │ │
 │  │  • Auto-cache (60s)      │  │  • form inputs             │ │
 │  │  • Background refetch    │  │  • modal open/close        │ │
 │  │  • Optimistic updates    │  │  • pagination cursor       │ │
 │  │  • Auto invalidation     │  │  • filter selections       │ │
 │  │    sau mutation          │  │                            │ │
 │  └────────────┬─────────────┘  └────────────────────────────┘ │
 │               │ Axios + JWT interceptors                       │
 └───────────────┼──────────────────────────────────────────────┘
                 │ HTTPS REST API
                 ▼
           [Backend API — :5000]
```

**Server state** được quản lý bởi React Query: dữ liệu đến từ API (posts, comments, users...) được cache tự động với TTL cấu hình được, tự động refetch trong nền khi window được focus lại, và bị invalidate ngay sau khi mutation thành công. Điều này đảm bảo người dùng luôn thấy dữ liệu cập nhật nhất mà không cần reload trang.

**Client state** được quản lý bởi React Context và `useState`: thông tin đăng nhập (`AuthContext`) cần chia sẻ toàn cục; các trạng thái UI tạm thời (form input, modal state, pagination) nằm trong local state của component.

### 2.4.3 Cấu hình Routing và cơ chế phân quyền phía Frontend

Frontend sử dụng React Router v6 với ba loại route:

**Hình 2.7 — Sơ đồ cây Route của Frontend**

```
<BrowserRouter>
  └── <App>
       ├── [Public Routes — Ai cũng truy cập được]
       │   ├── /                     → <HomePage />
       │   ├── /posts/:slug          → <PostDetailPage />
       │   ├── /categories           → <CategoriesPage />
       │   ├── /tags                 → <TagsPage />
       │   └── /search               → <SearchPage />
       │
       ├── <GuestRoute> [Chỉ khi CHƯA đăng nhập]
       │   │  → Redirect về / nếu đã đăng nhập
       │   ├── /login                → <LoginPage />
       │   ├── /register             → <RegisterPage />
       │   └── /forgot-password      → <ForgotPasswordPage />
       │
       └── <ProtectedRoute> [Chỉ khi ĐÃ đăng nhập]
            │  → Redirect về /login nếu chưa đăng nhập
            ├── /bookmarks           → <BookmarksPage />
            ├── /notifications       → <NotificationsPage />
            ├── /profile/:username   → <ProfilePage />
            ├── /profile/edit        → <EditProfilePage />
            ├── /posts/:slug/edit    → <EditPostPage />
            └── /blocked-users       → <BlockedUsersPage />
```

**Cơ chế phân quyền hoạt động theo hai lớp độc lập:**

- **Lớp 1 — Frontend (UX):** `ProtectedRoute` kiểm tra `AuthContext.user`. Nếu null → redirect ngay về `/login`. Đây là lớp phân quyền cho trải nghiệm người dùng — ngăn việc render trang bị bảo vệ trước khi đăng nhập.
- **Lớp 2 — Backend (Security):** Mọi API call đều mang JWT token. Middleware `authMiddleware` và `roleMiddleware` độc lập xác minh quyền truy cập. Lớp này là lớp bảo mật thực sự — người dùng không thể bypass dù thao túng frontend.

Ngoài ra, UI còn ẩn/hiện các control tùy theo vai trò: nút **Sửa/Xóa** bài viết chỉ hiện cho tác giả hoặc moderator; bảng điều khiển admin chỉ hiển thị link nếu `user.role === 'ADMIN'`. Tuy nhiên, đây chỉ là UX enhancement — quyết định phân quyền thực sự luôn nằm ở server.

---

## 2.5 Tổng kết Chương 2

Chương này đã phân tích thiết kế module của hệ thống MINI-FORUM trên bốn khía cạnh:

**Về kiến trúc module Backend:** Cấu trúc domain-driven với 6 module, 14 controller và 21 service đảm bảo mỗi domain nghiệp vụ có ranh giới trách nhiệm rõ ràng. Quy tắc phụ thuộc nghiêm ngặt (controller không gọi Prisma, service không đọc req/res) tạo điều kiện cho việc kiểm thử và bảo trì dài hạn.

**Về luồng xử lý request:** Pipeline middleware 7 bước với nguyên tắc fail-fast đảm bảo mọi request đến đúng controller đều đã được xác thực, phân quyền và validate. Side effects (notification, audit log) được tách biệt khỏi main flow để không ảnh hưởng đến performance và độ ổn định.

**Về Vibe-Content Service:** Pipeline 8 bước với fallback chain 4 LLM provider đảm bảo dịch vụ AI hoạt động ổn định ngay cả khi một hoặc nhiều nhà cung cấp không khả dụng. Nguyên tắc API-first được tuân thủ nghiêm ngặt: bot chỉ ghi dữ liệu thông qua Forum API, không bao giờ thao tác trực tiếp trên database.

**Về Frontend Module:** Kiến trúc state hai tầng (React Query cho server state, Context/useState cho client state) và hệ thống routing với hai lớp phân quyền (UX layer + Security layer) đảm bảo trải nghiệm người dùng nhất quán và bảo mật không thể bypass từ phía client.

---

*[Tiếp theo: Chương 3 — Thiết kế API và giao tiếp liên service]*
