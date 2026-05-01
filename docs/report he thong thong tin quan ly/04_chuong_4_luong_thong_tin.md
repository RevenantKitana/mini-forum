# CHƯƠNG 4
# LUỒNG THÔNG TIN TRONG HỆ THỐNG

---

## 4.1 DFD Mức 0 — Context Diagram

### 4.1.1 Tổng quan luồng thông tin cấp hệ thống

Sơ đồ DFD Mức 0 (Context Diagram) mô tả MINI-FORUM như một hệ thống duy nhất với các luồng dữ liệu ra/vào từ các tác nhân bên ngoài.

**Hình 4.1 — DFD Mức 0 (Context Diagram)**

```
                 ┌─────────────────────────────────────────────────────┐
                 │                                                     │
  ┌────────┐     │                MINI-FORUM SYSTEM                   │     ┌────────┐
  │        │────►│  Yêu cầu: đăng nhập, xem bài, tạo bài, comment... │────►│        │
  │ Member │     │                                                     │     │ Member │
  │        │◄────│  Phản hồi: nội dung forum, thông báo RT, profile   │◄────│        │
  └────────┘     │                                                     │     └────────┘
                 │                                                     │
  ┌────────┐     │                                                     │     ┌────────────┐
  │        │────►│  Lệnh quản trị: quản lý user, category, config     │────►│            │
  │ Admin  │     │                                                     │     │ External   │
  │        │◄────│  Báo cáo: thống kê, audit log, report queue        │     │ Services   │
  └────────┘     │                                                     │     │(Email,CDN) │
                 │                                                     │     └────────────┘
  ┌────────┐     │                                                     │
  │  Bot   │────►│  Nội dung AI: bài viết và comment tự động          │
  │(vibe)  │     │                                                     │
  └────────┘     │                                                     │
                 │                                                     │
  ┌────────┐     │                                                     │
  │ Guest  │────►│  Yêu cầu: xem bài public, tìm kiếm                 │
  │        │◄────│  Phản hồi: nội dung public                         │
  └────────┘     │                                                     │
                 └─────────────────────────────────────────────────────┘
```

**Bảng 4.1 — Mô tả các luồng dữ liệu trong Context Diagram**

| Tác nhân | Luồng Vào (Input) | Luồng Ra (Output) |
|---------|------------------|------------------|
| **Member** | Credentials đăng nhập, bài viết, bình luận, vote, báo cáo vi phạm, thông tin profile | Trang forum, danh sách bài viết, notification real-time, kết quả tìm kiếm |
| **Guest** | Yêu cầu xem trang public, từ khóa tìm kiếm | Nội dung bài viết public, kết quả tìm kiếm |
| **Admin** | Lệnh quản lý user/category/tag/config, xử lý báo cáo | Dashboard thống kê, audit log, danh sách báo cáo |
| **Bot (vibe-content)** | Prompt AI, nội dung sinh tự động | Bài viết và comment được đăng trong forum |
| **Email Service (Brevo)** | — (nhận request) | OTP email, notification email |
| **CDN (ImageKit)** | — (nhận upload) | URL ảnh đã xử lý (preview, standard) |

---

## 4.2 DFD Mức 1 — Các quy trình xử lý chính

### 4.2.1 DFD Mức 1 — Luồng tạo bài viết

**Hình 4.2 — DFD Mức 1: Forum Core Flow (Tạo bài viết)**

```
  ┌─────────┐   POST /posts        ┌──────────────────────────────────────┐
  │ Member  │─────────────────────►│  1.0                                 │
  └─────────┘   {title, content,   │  Xác thực & Phân quyền              │
                 category, tags}   │  authMiddleware: verify JWT          │
                                   │  roleMiddleware: check category perm │
                                   └──────────────┬───────────────────────┘
                                                  │  Authenticated request
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  2.0                                 │
                                   │  Validate Input                      │
                                   │  Zod schema: title, content,         │
                                   │  category_id, tags[]                 │
                                   └──────────────┬───────────────────────┘
                                                  │  Validated data
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  3.0                                 │
                                   │  Xử lý nghiệp vụ Post               │
                                   │  postService.createPost()            │
                                   │  ├── Tạo slug (slugify + unique)     │
                                   │  ├── INSERT posts record             │
                                   │  ├── INSERT post_blocks (if block)   │
                                   │  ├── UPSERT post_tags                │
                                   │  └── UPDATE categories.post_count    │
                                   └──────────────┬───────────────────────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                                    ▼             ▼             ▼
                             ┌──────────┐  ┌──────────┐  ┌──────────┐
                             │D1: posts  │  │D2: post_ │  │D3: audit │
                             │ table    │  │  blocks  │  │  _logs   │
                             └──────────┘  └──────────┘  └──────────┘
```

### 4.2.2 DFD Mức 1 — Luồng đăng nhập

**Hình 4.3 — DFD Mức 1: Authentication Flow**

```
  ┌─────────┐  POST /auth/login   ┌──────────────────────────────────────┐
  │  User   │────────────────────►│  1.0  Validate format                │
  └─────────┘  {email, password}  │  Zod: email format, pw length        │──► Error 400
                                   └──────────────┬───────────────────────┘
                                                  │ Valid format
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  2.0  Tra cứu tài khoản             │
                                   │  SELECT * FROM users                  │
                                   │  WHERE email = $1                     │──► Error 401
                                   └──────────────┬───────────────────────┘
                                                  │ User found
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  3.0  Xác minh mật khẩu             │
                                   │  bcrypt.compare(pw, hash)            │──► Error 401
                                   └──────────────┬───────────────────────┘
                                                  │ Password OK
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  4.0  Kiểm tra trạng thái TK        │
                                   │  is_active && !is_banned             │──► Error 403
                                   └──────────────┬───────────────────────┘
                                                  │ Account active
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  5.0  Tạo tokens                    │
                                   │  JWT access (15 phút)               │
                                   │  Refresh UUID (7 ngày) → DB         │
                                   │  Ghi audit_log: LOGIN               │
                                   └──────────────┬───────────────────────┘
                                                  │
                                                  ▼
                                   Response: { accessToken }
                                   Set-Cookie: refreshToken (httpOnly)
```

---

## 4.3 Luồng xác thực chi tiết (Auth Flow)

### 4.3.1 Kiến trúc JWT + Refresh Token

MINI-FORUM sử dụng **dual-token strategy** để cân bằng giữa security và user experience:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DUAL-TOKEN STRATEGY                          │
│                                                                 │
│  ACCESS TOKEN (JWT)              REFRESH TOKEN (UUID)           │
│  ─────────────────               ────────────────────           │
│  • Signed JWT                    • Opaque UUID string           │
│  • TTL: 15 phút                  • TTL: 7 ngày                 │
│  • Stored: memory (JS var)       • Stored: httpOnly cookie      │
│  • Contains: userId, role        • Stored in DB: refresh_tokens │
│  • Stateless verification        • Stateful (revocable)         │
│                                                                 │
│  Lý do TTL ngắn:                 Lý do lưu DB:                 │
│  Nếu bị đánh cắp →              Có thể revoke khi:             │
│  chỉ dùng được 15 phút          - Logout                        │
│                                  - Đổi mật khẩu                │
│                                  - Admin force logout           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3.2 Quy trình refresh token

**Hình 4.4 — Luồng Refresh Token**

```
Khi access token hết hạn:

  Frontend                        Backend
     │                               │
     │─── POST /auth/refresh ────────►│
     │    Cookie: refreshToken        │
     │                               │  1. Đọc refreshToken từ cookie
     │                               │  2. SELECT * FROM refresh_tokens
     │                               │     WHERE token = $1 AND expires_at > NOW()
     │                               │  3. Verify user vẫn active, không bị ban
     │                               │  4. Tạo access token mới
     │                               │  5. Rotate refresh token (xóa cũ, tạo mới)
     │◄── { accessToken } ───────────│
     │    Set-Cookie: newRefreshToken │
     │                               │
```

**Security benefit của refresh token rotation:** Nếu refresh token bị đánh cắp, việc kẻ tấn công dùng nó trước sẽ làm token cũ bị xóa → legitimate user bị logout → phát hiện compromise.

---

## 4.4 Luồng Vote → Cập nhật Reputation

### 4.4.1 Mô tả luồng đầy đủ

**Hình 4.5 — Luồng Vote → Reputation → Notification**

```
  Member A vote UPVOTE bài của Member B
          │
          │ POST /votes { target_type: "POST", target_id: 42, value: 1 }
          ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  voteService.createVote()                                     │
  │                                                               │
  │  1. Kiểm tra user A không phải tác giả bài 42               │
  │     (không tự vote cho bài của mình)                         │
  │                                                               │
  │  2. Kiểm tra đã vote chưa: SELECT FROM votes                  │
  │     WHERE user_id=A, target_type='POST', target_id=42         │
  │     → Nếu chưa: tạo mới                                      │
  │     → Nếu rồi (cùng chiều): xóa vote (toggle off)            │
  │     → Nếu rồi (khác chiều): cập nhật value                   │
  │                                                               │
  │  3. Transaction:                                              │
  │     ├── UPDATE posts SET upvote_count = upvote_count + 1      │
  │     │         WHERE id = 42                                   │
  │     └── UPDATE users SET reputation = reputation + DELTA      │
  │               WHERE id = B.id                                 │
  │                                                               │
  │  [DELTA = UPVOTE_REPUTATION_DELTA (config value)]             │
  └──────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  notificationService.createVoteNotification()                 │
  │                                                               │
  │  INSERT notifications {                                       │
  │    user_id: B.id,                                             │
  │    type: 'UPVOTE',                                            │
  │    title: "Member A đã upvote bài viết của bạn",             │
  │    related_id: 42, related_type: 'POST'                       │
  │  }                                                            │
  └──────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  sseService.pushToUser(B.id)                                  │
  │                                                               │
  │  Kiểm tra Member B có đang kết nối SSE không?                │
  │  → Có: gửi ngay event:                                       │
  │        data: { type: "UPVOTE", postId: 42, ... }             │
  │  → Không: notification vẫn được lưu trong DB                 │
  │    B sẽ nhận khi mở lại app và fetch notifications           │
  └────────────────────────────────────────────────────────────────┘
```

### 4.4.2 Bảng quyết định Vote

**Bảng 4.2 — Bảng quyết định xử lý vote**

| Trạng thái hiện tại | Value mới | Hành động | Cập nhật counter |
|--------------------|----------|----------|----------------|
| Chưa vote | +1 (upvote) | INSERT vote | `upvote_count += 1`, `reputation += UPVOTE_DELTA` |
| Chưa vote | -1 (downvote) | INSERT vote | `downvote_count += 1`, `reputation -= DOWNVOTE_DELTA` |
| Đã upvote (+1) | +1 (upvote lại) | DELETE vote | `upvote_count -= 1`, `reputation -= UPVOTE_DELTA` |
| Đã downvote (-1) | -1 (downvote lại) | DELETE vote | `downvote_count -= 1`, `reputation += DOWNVOTE_DELTA` |
| Đã upvote (+1) | -1 (đổi sang downvote) | UPDATE vote | `upvote_count -= 1`, `downvote_count += 1`, `reputation -= (UPVOTE_DELTA + DOWNVOTE_DELTA)` |
| Đã downvote (-1) | +1 (đổi sang upvote) | UPDATE vote | `downvote_count -= 1`, `upvote_count += 1`, `reputation += (UPVOTE_DELTA + DOWNVOTE_DELTA)` |

---

## 4.5 Luồng thông báo Real-time (SSE)

### 4.5.1 Kiến trúc Server-Sent Events

**Hình 4.6 — Kiến trúc SSE Notification**

```
  Client (Member B)                              Backend Server
        │                                               │
        │──── GET /notifications/stream ───────────────►│
        │     Header: Authorization: Bearer <token>     │
        │                                               │  sseService.addClient(B.id, res)
        │◄─── HTTP 200 text/event-stream ───────────────│
        │     Connection: keep-alive                    │  (res giữ mở, không close)
        │     Cache-Control: no-cache                   │
        │                                               │
        │         ... đang đợi ...                      │
        │                                               │
        │                                 Member A comment post của B
        │                                               │
        │                                 commentService.createComment()
        │                                               │
        │                                 notificationService.create({
        │                                   user_id: B.id,
        │                                   type: 'COMMENT'
        │                                 })
        │                                               │
        │                                 sseService.pushToUser(B.id)
        │                                               │
        │◄─── data: {"type":"COMMENT","postId":10} ─────│
        │     id: 1735123456789                        │
        │                                               │
        │         ... tiếp tục đợi ...                 │
        │                                               │
        │──── (sau 30s) GET /notifications/stream ─────►│  (reconnect tự động)
        │     Last-Event-ID: 1735123456789             │
```

### 4.5.2 Các loại sự kiện SSE

**Bảng 4.3 — Các loại sự kiện SSE được hỗ trợ**

| Loại sự kiện | Khi nào kích hoạt | Dữ liệu đi kèm |
|-------------|------------------|----------------|
| `COMMENT` | Ai đó comment bài viết của user | postId, commentId, commenterUsername |
| `REPLY` | Ai đó reply comment của user | postId, commentId, parentCommentId |
| `MENTION` | Ai đó @mention username trong comment | postId, commentId |
| `UPVOTE` | Bài viết/comment của user nhận upvote | targetType, targetId, voterUsername |
| `SYSTEM` | Thông báo từ Admin (system-wide) | message, title |

### 4.5.3 Giới hạn thiết kế và lý do chọn SSE

**Bảng 4.4 — So sánh SSE và WebSocket**

| Tiêu chí | SSE (Chọn) | WebSocket |
|---------|-----------|----------|
| **Chiều thông tin** | Server → Client (one-way) | Bidirectional |
| **Độ phức tạp** | Thấp — HTTP/1.1 thuần túy | Cao — cần handshake riêng |
| **Load balancer** | Dễ — sticky sessions hoặc pub/sub | Cần xử lý đặc biệt |
| **Reconnect** | Tự động (browser built-in) | Cần implement thủ công |
| **Phù hợp với use case** | ✓ Notification (server push) | Overkill cho notification |

> **Kết luận:** SSE là lựa chọn phù hợp vì notification trong forum là luồng **một chiều** (server push thông báo đến client). Client không cần gửi dữ liệu real-time ngược lại server. WebSocket sẽ phù hợp hơn nếu có tính năng live chat.

---

## 4.6 Luồng báo cáo vi phạm

### 4.6.1 Workflow đầy đủ

**Hình 4.7 — Luồng báo cáo vi phạm từ đầu đến cuối**

```
  ┌─────────┐                                            ┌──────────────┐
  │ Member  │                                            │  Moderator/  │
  │  (A)    │                                            │    Admin     │
  └────┬────┘                                            └──────┬───────┘
       │                                                        │
       │ POST /reports                                          │
       │ { target_type: "POST",                                 │
       │   target_id: 42,                                       │
       │   reason: "Spam",                                      │
       │   description: "..." }                                 │
       │                                                        │
       ▼                                                        │
  ┌─────────────────────────┐                                   │
  │  blockReportController  │                                   │
  │  .createReport()        │                                   │
  │                         │                                   │
  │  Validate:              │                                   │
  │  - Post/comment tồn tại │                                   │
  │  - Chưa báo cáo trùng  │                                   │
  └────────────┬────────────┘                                   │
               │                                                │
               ▼                                                │
  ┌─────────────────────────┐                                   │
  │  INSERT reports {       │                                   │
  │    reporter_id: A.id,   │                                   │
  │    target_type: "POST", │                                   │
  │    target_id: 42,       │                                   │
  │    status: "PENDING"    │                                   │
  │  }                      │                                   │
  └─────────────────────────┘                                   │
                                                                │
                              GET /admin/reports?status=PENDING │
                                                                ▼
                                               ┌────────────────────────────┐
                                               │  ReportsPage               │
                                               │  (admin-client)            │
                                               │                            │
                                               │  Hiển thị: nội dung bài   │
                                               │  viết bị báo cáo, lý do,  │
                                               │  lịch sử reporter         │
                                               └────────────┬───────────────┘
                                                            │
                                               ┌────────────┴────────────┐
                                               │                         │
                                           RESOLVE                   DISMISS
                                               │                         │
                                               ▼                         ▼
                                  ┌─────────────────────┐   ┌────────────────────┐
                                  │ PATCH /reports/:id  │   │ PATCH /reports/:id │
                                  │ { status: RESOLVED } │   │ { status: DISMISSED}│
                                  │                     │   └────────────────────┘
                                  │ Optional actions:   │
                                  │ - DELETE post 42    │
                                  │ - HIDE comment      │
                                  │ - BAN user          │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │  audit_logs:        │
                                  │  action: UPDATE     │
                                  │  target: REPORT     │
                                  │  + action trên nội  │
                                  │    dung (nếu có)    │
                                  └─────────────────────┘
```

---

## 4.7 Luồng AI Content Generation (vibe-content)

### 4.7.1 Kiến trúc vibe-content service

**Hình 4.8 — Luồng AI Content Generation**

```
  ┌────────────────────────────────────────────────────────────────┐
  │                    vibe-content Service                       │
  │                                                               │
  │  ┌────────────┐    ┌──────────────┐    ┌───────────────────┐ │
  │  │  Scheduler │───►│ Context      │───►│  LLM Provider     │ │
  │  │  (cron)    │    │ Builder      │    │  (Gemini/Groq/    │ │
  │  └────────────┘    │              │    │   Cerebras/Nvidia)│ │
  │                    │ Đọc từ:      │    └────────┬──────────┘ │
  │                    │ user_content │             │            │
  │                    │ _context     │             │ Generated  │
  │                    │ (Prisma)     │             │ content    │
  │                    └──────────────┘             │            │
  │                                                 ▼            │
  │                                    ┌────────────────────┐    │
  │                                    │ Content Validator  │    │
  │                                    │ (format check,     │    │
  │                                    │  safety filter)    │    │
  │                                    └────────┬───────────┘    │
  └─────────────────────────────────────────────┼────────────────┘
                                                │
                                                │ POST /posts (as Bot user)
                                                │ Authorization: Bearer <bot_token>
                                                ▼
                                    ┌────────────────────┐
                                    │   backend API      │
                                    │   (forum backend)  │
                                    │                    │
                                    │   Nhận request từ  │
                                    │   Bot role user    │
                                    │   → xử lý như bài  │
                                    │     viết thường    │
                                    └────────────────────┘
```

**Đặc điểm thiết kế:**
- Bot dùng `Role.BOT` nhưng interact với API như Member bình thường — không có endpoint riêng
- `user_content_context` lưu personality và lịch sử gần đây của bot để duy trì consistency
- Nhiều LLM provider được hỗ trợ để đảm bảo availability (fallback nếu một provider down)

---

## 4.8 Luồng tìm kiếm Full-text

### 4.8.1 Kỹ thuật PostgreSQL FTS

**Hình 4.9 — Luồng xử lý Full-text Search**

```
  ┌─────────┐  GET /search?q=react&type=posts
  │  User   │─────────────────────────────────────────────────────►
  └─────────┘
                                    ┌──────────────────────────────┐
                                    │  searchService.search()      │
                                    │                              │
                                    │  1. Sanitize input           │
                                    │  2. Tạo tsquery:             │
                                    │     plainto_tsquery('vi',    │
                                    │       'react hook')          │
                                    │     → 'react' & 'hook'       │
                                    │                              │
                                    │  3. Execute query:           │
                                    │     SELECT posts.*,          │
                                    │       ts_rank(               │
                                    │         to_tsvector('vi',    │
                                    │           title || content), │
                                    │         query                │
                                    │       ) AS rank              │
                                    │     FROM posts               │
                                    │     WHERE                    │
                                    │       to_tsvector('vi',      │
                                    │         title || content) @@  │
                                    │       query                  │
                                    │     ORDER BY rank DESC       │
                                    │     LIMIT 20                 │
                                    │                              │
                                    │  4. Filter theo permission   │
                                    │     (không trả về private    │
                                    │      category cho guest)     │
                                    └──────────────────────────────┘
```

**Bảng 4.5 — Các scope tìm kiếm**

| Endpoint | Tham số | Tìm kiếm trong |
|---------|--------|---------------|
| `GET /search?q=keyword` | Không có `type` | Cả posts và comments |
| `GET /search?q=keyword&type=posts` | `type=posts` | Chỉ `posts.title` + `posts.content` |
| `GET /search?q=keyword&type=comments` | `type=comments` | Chỉ `comments.content` |

---

## Tóm tắt chương 4

Chương 4 đã phân tích 6 luồng thông tin cốt lõi trong MINI-FORUM:

1. **DFD Context Diagram:** 4 tác nhân ngoài tương tác với hệ thống qua luồng dữ liệu rõ ràng
2. **Auth Flow:** Dual-token strategy (JWT 15 phút + refresh 7 ngày) với fail-fast validation
3. **Vote → Reputation Flow:** Atomic transaction cập nhật counter + reputation + notification trong một đường dẫn dữ liệu nhất quán
4. **SSE Notification:** Kiến trúc one-way push notification — đơn giản, phù hợp use case, không cần WebSocket
5. **Report Workflow:** Quy trình kiểm duyệt có audit trail bắt buộc cho mọi action của Moderator
6. **AI Content Flow:** vibe-content service tích hợp seamless qua Bot role, không cần endpoint riêng

Mọi luồng đều tuân thủ nguyên tắc: **Validate → Business Logic → Persistence → Output**, không có bypass giữa các lớp.

Chương tiếp theo sẽ đặc tả chi tiết từng module chức năng với API endpoints, cấu trúc code và business logic cụ thể.
