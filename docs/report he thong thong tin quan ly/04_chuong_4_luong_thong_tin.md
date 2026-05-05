# CHƯƠNG 4
# LUỒNG THÔNG TIN TRONG HỆ THỐNG

---

Chương 3 đã xây dựng mô hình tĩnh của dữ liệu — cấu trúc các entity và quan hệ giữa chúng. Chương này chuyển sang góc độ **động**: phân tích cách thông tin **di chuyển** qua hệ thống từ khi người dùng gửi yêu cầu đến khi nhận phản hồi. Phân tích luồng thông tin là công cụ thiết yếu để phát hiện điểm nghẽn (bottleneck), xác định điểm kiểm soát bảo mật và hiểu phạm vi tác động của từng hành động.

Công cụ phân tích được sử dụng trong chương này là **DFD (Data Flow Diagram)** theo ký pháp Yourdon-DeMarco, kết hợp với **sequence diagram** dạng ASCII để mô tả các giao tiếp giữa các thành phần. Nội dung bao gồm 8 luồng thông tin quan trọng nhất của MINI-FORUM, từ luồng cấp hệ thống (DFD Mức 0) đến các luồng chức năng cụ thể (xác thực, vote, thông báo, báo cáo vi phạm, AI content, tìm kiếm).

---

## 4.1 DFD Mức 0 — Context Diagram

### 4.1.1 Tổng quan luồng thông tin cấp hệ thống

DFD Mức 0 (Context Diagram) là cấp cao nhất trong phân tích luồng dữ liệu — mô tả toàn bộ MINI-FORUM như một **hộp đen duy nhất** với các tác nhân bên ngoài (External Entities) tương tác thông qua các luồng dữ liệu vào/ra. Ở cấp này, ta chưa quan tâm đến nội bộ hệ thống xử lý gì — chỉ xác định **ai tương tác** và **thông tin gì chảy vào/ra**.

MINI-FORUM có **5 tác nhân ngoại vi** chính:
1. **Member** — Người dùng đã đăng ký và xác thực email
2. **Guest** — Người dùng chưa đăng nhập (chỉ đọc nội dung công khai)
3. **Admin** — Người quản trị hệ thống (có quyền cao nhất)
4. **Bot (vibe-content)** — Service sinh nội dung tự động bằng AI
5. **External Services** — Brevo (email), ImageKit (CDN ảnh)

**Hình 4.1 — DFD Mức 0 (Context Diagram)**

```
                 ┌─────────────────────────────────────────────────────┐
                 │                                                     │
  ┌──────────┐   │                MINI-FORUM SYSTEM                   │   ┌────────────────┐
  │          │──►│  Yêu cầu xác thực, tạo/đọc/cập nhật bài viết,    │──►│                │
  │  Member  │   │  bình luận, vote, bookmark, báo cáo vi phạm        │   │    Brevo       │
  │          │◄──│  Thông báo real-time (SSE), kết quả truy vấn       │◄──│  (Email SaaS)  │
  └──────────┘   │                                                     │   └────────────────┘
                 │                                                     │
  ┌──────────┐   │                                                     │   ┌────────────────┐
  │          │──►│  Lệnh quản trị: quản lý user, category, tag,       │──►│                │
  │  Admin   │   │  xử lý báo cáo, xem audit log, config hệ thống     │   │   ImageKit     │
  │          │◄──│  Dashboard thống kê, báo cáo, audit log            │◄──│  (CDN / Media) │
  └──────────┘   │                                                     │   └────────────────┘
                 │                                                     │
  ┌──────────┐   │                                                     │
  │   Bot    │──►│  Bài viết và bình luận được tạo tự động bởi AI     │
  │ (vibe-   │   │  (interact qua API như Member bình thường)          │
  │ content) │◄──│  Xác nhận tạo thành công / thông báo lỗi           │
  └──────────┘   │                                                     │
                 │                                                     │
  ┌──────────┐   │                                                     │
  │  Guest   │──►│  Yêu cầu xem nội dung công khai, tìm kiếm          │
  │(ẩn danh) │◄──│  Nội dung bài viết, kết quả tìm kiếm               │
  └──────────┘   │                                                     │
                 └─────────────────────────────────────────────────────┘
```

**Bảng 4.1 — Mô tả chi tiết các luồng dữ liệu trong Context Diagram**

| Tác nhân | Luồng Vào (→ Hệ thống) | Luồng Ra (← Hệ thống) | Giao thức |
|---------|----------------------|---------------------|-----------|
| **Member** | Credentials đăng nhập, thông tin đăng ký, nội dung bài viết/comment, tham số vote/bookmark/report, thông tin profile | Trang forum, danh sách bài viết, thông báo SSE real-time, kết quả tìm kiếm, JWT access token | HTTPS REST API + SSE |
| **Guest** | URL truy cập, từ khóa tìm kiếm | Nội dung bài viết công khai (category có `view_permission = ALL`), kết quả tìm kiếm | HTTPS REST API |
| **Admin** | Lệnh quản lý user/category/tag/report/config, truy vấn audit log | Dashboard thống kê (số user, bài viết, report pending), audit trail, danh sách báo cáo chờ xử lý | HTTPS REST API (admin-client) |
| **Bot (vibe-content)** | Nội dung bài viết/comment được sinh bởi LLM, kèm JWT của bot account | HTTP 201 Created / lỗi nếu content vi phạm validation | HTTPS REST API |
| **Brevo** | — (nhận lệnh gửi email từ hệ thống) | Email OTP, email thông báo | HTTPS API (Brevo SDK) |
| **ImageKit** | File ảnh (binary upload) | URL ảnh đã xử lý (preview + standard), fileId | HTTPS API (ImageKit SDK) |

---

## 4.2 DFD Mức 1 — Các quy trình xử lý chính

### 4.2.1 DFD Mức 1 — Luồng tạo bài viết

DFD Mức 1 phân rã hệ thống thành các **process con** với data store và luồng dữ liệu cụ thể hơn. Luồng tạo bài viết là luồng phức tạp nhất về số bước xử lý và số bảng dữ liệu liên quan.

**Hình 4.2 — DFD Mức 1: Forum Core Flow (Tạo bài viết)**

```
  ┌─────────┐   POST /posts        ┌──────────────────────────────────────┐
  │ Member  │─────────────────────►│  1.0                                 │
  └─────────┘   {title, content,   │  Xác thực & Phân quyền              │─► 401/403 Error
                 category, tags}   │  authMiddleware: verify JWT          │
                                   │  roleMiddleware: category perm check │
                                   └──────────────┬───────────────────────┘
                                                  │  req.user verified
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  2.0                                 │
                                   │  Validate Input (Zod schema)        │─► 400 Bad Request
                                   │  - title: min 5, max 200 chars      │
                                   │  - content: min 10 chars            │
                                   │  - category_id: exists, active      │
                                   │  - tags[]: max 5, slugs valid       │
                                   └──────────────┬───────────────────────┘
                                                  │  Validated DTO
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  3.0                                 │
                                   │  Kiểm tra quyền đăng bài            │─► 403 Forbidden
                                   │  category.post_permission           │
                                   │  vs user.role (RBAC check)          │
                                   └──────────────┬───────────────────────┘
                                                  │  Permission OK
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  4.0                                 │
                                   │  Xử lý nghiệp vụ                    │
                                   │  postService.createPost()            │
                                   │  ├── Tạo slug (slugify + unique      │
                                   │  │     suffix từ nano ID)            │
                                   │  ├── INSERT posts record             │
                                   │  ├── INSERT post_blocks[] (nếu block)│
                                   │  ├── UPSERT tags + post_tags         │
                                   │  └── UPDATE categories.post_count += 1│
                                   └──────────────┬───────────────────────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                                    ▼             ▼             ▼
                             ┌──────────┐  ┌──────────┐  ┌──────────────┐
                             │D1: posts │  │D2: post_ │  │D3: audit_log │
                             │          │  │ blocks   │  │(CREATE POST) │
                             └──────────┘  └──────────┘  └──────────────┘
                                                  │
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  5.0                                 │
                                   │  Tạo phản hồi                       │
                                   │  - Map entity → DTO (loại bỏ trường │
                                   │    nhạy cảm)                        │
                                   │  - HTTP 201 Created                  │
                                   └──────────────────────────────────────┘
```

### 4.2.2 DFD Mức 1 — Luồng đăng nhập

Luồng đăng nhập có 5 bước kiểm tra tuần tự theo nguyên tắc **fail-fast**: mỗi bước thất bại sẽ dừng ngay và trả lỗi cụ thể, không tiếp tục xử lý.

**Hình 4.3 — DFD Mức 1: Authentication Flow (Đăng nhập)**

```
  ┌─────────┐  POST /auth/login   ┌──────────────────────────────────────┐
  │  User   │────────────────────►│  1.0  Validate format (Zod)          │
  └─────────┘  {email, password}  │  - email: valid email format         │──► 400 Bad Request
                                   │  - password: 6-128 chars             │
                                   └──────────────┬───────────────────────┘
                                                  │ Format OK
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  2.0  Tra cứu tài khoản             │
                                   │  SELECT id, email, password_hash,    │──► 401 Unauthorized
                                   │    role, is_active, is_verified      │   "Thông tin đăng nhập
                                   │  FROM users WHERE email = $1         │    không chính xác"
                                   │  [Không tiết lộ: user tồn tại hay   │
                                   │   không — dùng chung 401]            │
                                   └──────────────┬───────────────────────┘
                                                  │ User found
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  3.0  Xác minh mật khẩu             │
                                   │  bcrypt.compare(password, hash)      │──► 401 (same message)
                                   │  [Time-constant comparison —         │
                                   │   tránh timing attack]               │
                                   └──────────────┬───────────────────────┘
                                                  │ Password OK
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  4.0  Kiểm tra trạng thái tài khoản │
                                   │  - is_verified = true ?              │──► 403 "Chưa xác thực email"
                                   │  - is_active = true ?                │──► 403 "Tài khoản bị vô hiệu"
                                   └──────────────┬───────────────────────┘
                                                  │ Account active + verified
                                                  ▼
                                   ┌──────────────────────────────────────┐
                                   │  5.0  Tạo và lưu tokens              │
                                   │  - JWT access token (HS256, 15 min)  │
                                   │    payload: { userId, role, iat, exp}│
                                   │  - Refresh token (UUID v4, 7 days)   │
                                   │    INSERT refresh_tokens table        │
                                   │  - UPDATE users.last_active_at       │
                                   │  - INSERT audit_logs (LOGIN)         │
                                   └──────────────┬───────────────────────┘
                                                  │
                                                  ▼
                                   Response 200 OK:
                                   { accessToken: "eyJhbGc..." }
                                   Set-Cookie: refreshToken=<uuid>;
                                     HttpOnly; Secure; SameSite=Strict;
                                     Path=/auth/refresh; Max-Age=604800
```

> **Nguyên tắc bảo mật quan trọng:** Bước 2 và bước 3 đều trả về HTTP 401 với cùng một thông báo lỗi chung. Điều này ngăn kẻ tấn công dùng thông báo lỗi để suy ra email nào đã đăng ký trong hệ thống (user enumeration attack).

---

## 4.3 Luồng xác thực chi tiết (Auth Flow)

### 4.3.1 Kiến trúc JWT + Refresh Token

MINI-FORUM sử dụng **dual-token strategy** (chiến lược hai token) để cân bằng giữa bảo mật và trải nghiệm người dùng. Đây là pattern được áp dụng rộng rãi trong các ứng dụng web hiện đại, phù hợp với môi trường Single Page Application (SPA).

**Hình 4.4 — Kiến trúc Dual-Token Strategy**

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    DUAL-TOKEN STRATEGY                          │
  │                                                                 │
  │  ACCESS TOKEN (JWT)              REFRESH TOKEN (UUID)           │
  │  ────────────────────────        ────────────────────────────   │
  │  • Loại: Signed JWT (HS256)      • Loại: Opaque UUID v4         │
  │  • TTL: 15 phút                  • TTL: 7 ngày                 │
  │  • Lưu ở: JS memory              • Lưu ở: httpOnly cookie       │
  │    (biến JavaScript)               (không đọc được bằng JS)    │
  │  • Nội dung: { userId, role,     • Lưu DB: refresh_tokens table │
  │    iat, exp }                    • Có thể revoke bất kỳ lúc nào │
  │  • Không cần DB để verify        • Có thể xem user đang login   │
  │                                                                 │
  │  Lý do TTL ngắn (15 phút):       Lý do lưu httpOnly cookie:     │
  │  Nếu bị đánh cắp, kẻ tấn công   • XSS không thể đọc cookie    │
  │  chỉ có 15 phút để dùng —        • CSRF được ngăn bởi          │
  │  giảm thiểu thiệt hại tối đa     SameSite=Strict               │
  │                                                                 │
  │  Lý do lưu Refresh Token vào DB: Cho phép revoke khi:          │
  │  - User logout                   - Admin ban user               │
  │  - User đổi mật khẩu            - Phát hiện compromise         │
  └─────────────────────────────────────────────────────────────────┘
```

### 4.3.2 Luồng làm mới token (Token Refresh)

Khi access token hết hạn (sau 15 phút), frontend tự động gọi endpoint refresh mà không làm gián đoạn trải nghiệm người dùng. Cơ chế **refresh token rotation** đảm bảo rằng mỗi refresh token chỉ dùng được một lần — khi dùng xong sẽ bị xóa và thay bằng token mới.

**Hình 4.5 — Luồng Refresh Token với Rotation**

```
  Frontend (React SPA)               Backend API Server
        │                                    │
        │  [Nhận 401 Unauthorized]           │
        │  [Tự động gửi refresh request]     │
        │                                    │
        │──── POST /auth/refresh ───────────►│
        │     Cookie: refreshToken=<uuid>    │
        │     (tự động gửi do httpOnly)      │
        │                                    │
        │                                    │ 1. Đọc refreshToken từ cookie
        │                                    │
        │                                    │ 2. SELECT * FROM refresh_tokens
        │                                    │    WHERE token = $1
        │                                    │    AND expires_at > NOW()
        │                                    │    → Không tìm thấy: 401
        │                                    │
        │                                    │ 3. Lấy user từ token.user_id
        │                                    │    Verify: is_active = true
        │                                    │    → User bị ban: 403
        │                                    │
        │                                    │ 4. Xóa refresh token cũ (ROTATION)
        │                                    │    DELETE FROM refresh_tokens
        │                                    │    WHERE token = $1
        │                                    │
        │                                    │ 5. Tạo mới:
        │                                    │    - JWT access token mới
        │                                    │    - Refresh token mới → INSERT DB
        │                                    │
        │◄── 200 OK { accessToken: "..." } ──│
        │    Set-Cookie: refreshToken=<new>  │
        │                                    │
        │  [Retry original request với       │
        │   access token mới]                │
```

> **Security benefit của Rotation:** Nếu kẻ tấn công đánh cắp refresh token và dùng nó trước người dùng hợp lệ — token cũ bị xóa, người dùng hợp lệ dùng token cũ nhận lỗi 401 → biết tài khoản bị compromise → cần đổi mật khẩu ngay. Đây là **detect and invalidate** pattern.

---

## 4.4 Luồng Vote → Cập nhật Reputation

### 4.4.1 Mô tả nghiệp vụ

Vote là tính năng tương tác cốt lõi của forum — ảnh hưởng đến **ba đối tượng dữ liệu cùng lúc**: (1) bản ghi vote, (2) counter của bài viết/comment, (3) điểm reputation của tác giả. Đây là luồng có tính **atomic** cao nhất — mọi thao tác phải thành công cùng nhau hoặc rollback hoàn toàn.

**Hình 4.6 — Luồng Vote → Reputation → Notification (đầy đủ)**

```
  Member A (voter) vote UPVOTE cho bài viết #42 của Member B
          │
          │ POST /votes
          │ { target_type: "POST", target_id: 42, value: 1 }
          │ Authorization: Bearer <A's access token>
          ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  voteController → voteService.createOrUpdateVote()            │
  │                                                               │
  │  KIỂM TRA ĐIỀU KIỆN:                                          │
  │  1. A không phải tác giả của bài 42                          │
  │     (không self-vote) → 403 nếu vi phạm                      │
  │                                                               │
  │  2. Tìm vote hiện tại:                                        │
  │     SELECT * FROM votes                                       │
  │     WHERE user_id=A.id AND target_type='POST'                 │
  │       AND target_id=42                                        │
  │                                                               │
  │  LOGIC XỬ LÝ (xem Bảng 4.2 cho đầy đủ):                      │
  │  Case A: Chưa vote → INSERT vote { value: +1 }               │
  │  Case B: Đã upvote → DELETE vote (toggle off)                │
  │  Case C: Đã downvote → UPDATE vote { value: +1 }             │
  └──────────────────────────────┬─────────────────────────────────┘
                                 │ Xác định action và delta
                                 ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  prisma.$transaction([...])  ← ATOMIC OPERATION               │
  │                                                               │
  │  // Tuỳ theo case:                                            │
  │  prisma.votes.create/delete/update(...)                       │
  │                                                               │
  │  prisma.posts.update({                                        │
  │    where: { id: 42 },                                         │
  │    data: {                                                    │
  │      upvote_count: { increment: +1 },   // Case A            │
  │      // hoặc decrement, tùy case                             │
  │    }                                                          │
  │  })                                                           │
  │                                                               │
  │  prisma.users.update({                                        │
  │    where: { id: B.id },   // tác giả bài                     │
  │    data: {                                                    │
  │      reputation: { increment: UPVOTE_DELTA }  // +10 point   │
  │    }                                                          │
  │  })                                                           │
  └──────────────────────────────┬─────────────────────────────────┘
                                 │ Transaction committed
                                 ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  notificationService.createVoteNotification() [bất đồng bộ]  │
  │  (chỉ khi Case A — vote mới, không phải toggle off)           │
  │                                                               │
  │  INSERT notifications {                                       │
  │    user_id: B.id,         ← người nhận                       │
  │    type: 'UPVOTE',                                            │
  │    title: "user_A đã upvote bài viết của bạn",               │
  │    content: posts.title (substring),                          │
  │    related_id: 42,                                            │
  │    related_type: 'POST'                                       │
  │  }                                                            │
  └──────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  sseService.pushToUser(B.id)                                  │
  │                                                               │
  │  Kiểm tra: B có đang kết nối SSE không?                      │
  │  ├─ Có  → Gửi ngay event:                                    │
  │  │        data: { type: "UPVOTE",                             │
  │  │                postId: 42, postTitle: "...",               │
  │  │                voter: "user_A" }                           │
  │  └─ Không → Notification đã lưu trong DB                     │
  │             B sẽ thấy khi mở app và fetch /notifications     │
  └────────────────────────────────────────────────────────────────┘
```

### 4.4.2 Bảng quyết định xử lý Vote (Decision Table)

Bảng quyết định dưới đây liệt kê **toàn bộ 6 trường hợp** xảy ra khi người dùng gửi vote, cùng với hành động và cập nhật counter tương ứng.

**Bảng 4.2 — Bảng quyết định xử lý vote**

| # | Trạng thái hiện tại | Giá trị vote mới | DB Action | Cập nhật upvote_count | Cập nhật reputation tác giả |
|---|--------------------|-----------------|-----------|-----------------------|---------------------------|
| 1 | Chưa vote | +1 (upvote) | INSERT | `+1` | `+UPVOTE_DELTA` (thường +10) |
| 2 | Chưa vote | -1 (downvote) | INSERT | downvote `+1` | `-DOWNVOTE_DELTA` (thường -5) |
| 3 | Đã upvote (+1) | +1 (upvote lại) | DELETE (toggle off) | `-1` | `-UPVOTE_DELTA` |
| 4 | Đã downvote (-1) | -1 (downvote lại) | DELETE (toggle off) | downvote `-1` | `+DOWNVOTE_DELTA` |
| 5 | Đã upvote (+1) | -1 (đổi sang downvote) | UPDATE value | upvote `-1`, downvote `+1` | `-(UPVOTE_DELTA + DOWNVOTE_DELTA)` |
| 6 | Đã downvote (-1) | +1 (đổi sang upvote) | UPDATE value | downvote `-1`, upvote `+1` | `+(UPVOTE_DELTA + DOWNVOTE_DELTA)` |

> **Lưu ý:** `UPVOTE_DELTA` và `DOWNVOTE_DELTA` là giá trị cấu hình động lưu trong bảng `config`, Admin có thể thay đổi mà không cần deploy lại.

---

## 4.5 Luồng thông báo Real-time (SSE)

### 4.5.1 Lý do chọn SSE thay vì WebSocket

MINI-FORUM cần cơ chế đẩy thông báo từ server đến client ngay khi có sự kiện (comment mới, upvote, ...) mà không cần client polling liên tục. Có hai lựa chọn phổ biến: **SSE** và **WebSocket**.

**Bảng 4.3 — Phân tích lựa chọn công nghệ: SSE vs WebSocket**

| Tiêu chí | SSE — Server-Sent Events | WebSocket |
|---------|------------------------|-----------|
| **Chiều thông tin** | Server → Client (one-way) | Bidirectional (hai chiều) |
| **Độ phức tạp triển khai** | Thấp — HTTP/1.1 thuần, không cần handshake đặc biệt | Cao — upgrade protocol riêng |
| **Tích hợp với Load Balancer** | Dễ — sticky sessions hoặc Redis pub/sub | Cần cấu hình đặc biệt |
| **Tự động reconnect** | **Có sẵn** trong browser (EventSource API) | Phải implement thủ công |
| **Hỗ trợ Last-Event-ID** | **Có sẵn** — không mất thông báo khi mất kết nối | Phải implement thủ công |
| **Phù hợp với MINI-FORUM** | ✅ Notification chỉ cần server push | ❌ Overkill — không cần client push real-time |

**Kết luận:** SSE là lựa chọn tối ưu cho MINI-FORUM. Tính năng thông báo chỉ cần luồng **một chiều** (server push đến client). Client không cần gửi dữ liệu real-time ngược lại server trong quá trình nhận thông báo. WebSocket chỉ cần thiết nếu sau này có tính năng live chat.

### 4.5.2 Kiến trúc SSE Notification chi tiết

**Hình 4.7 — Kiến trúc SSE Notification (Sequence Diagram)**

```
  Client (Member B)                    Backend API Server
        │                                      │
        │ ─── GET /notifications/stream ──────►│
        │     Authorization: Bearer <token>    │
        │                                      │  1. authMiddleware.authenticate()
        │                                      │     Verify JWT, load user B
        │                                      │
        │                                      │  2. sseService.addClient(B.id, res)
        │                                      │     clients.set(B.id, res)
        │                                      │
        │◄─── HTTP 200 ─────────────────────────│
        │     Content-Type: text/event-stream  │
        │     Connection: keep-alive           │
        │     Cache-Control: no-cache          │
        │     X-Accel-Buffering: no            │  (tắt nginx buffering)
        │                                      │
        │         ... Kết nối được giữ mở ...  │
        │                                      │
        │                         [Member A comment bài của B]
        │                                      │
        │                         commentService.createComment()
        │                                      │
        │                         notificationService.create({
        │                           user_id: B.id,
        │                           type: 'COMMENT'
        │                         })
        │                                      │
        │                         sseService.pushToUser(B.id)
        │                           if (clients.has(B.id)):
        │                             res.write(...)
        │                                      │
        │◄─── SSE Event ─────────────────────────│
        │     id: 1735600000000                │  (timestamp làm event ID)
        │     event: notification              │
        │     data: {"type":"COMMENT",         │
        │             "postId":10,             │
        │             "postTitle":"...",        │
        │             "actorUsername":"user_A"}│
        │                                      │
        │         ... Tiếp tục đợi ...         │
        │                                      │
        │ (Sau 30s không có sự kiện)           │
        │ EventSource tự động reconnect:        │
        │ ─── GET /notifications/stream ──────►│
        │     Last-Event-ID: 1735600000000     │
        │                                      │  Gửi lại các events bỏ lỡ
        │                                      │  (nếu có trong DB)
```

### 4.5.3 Các loại sự kiện SSE

**Bảng 4.4 — Đặc tả các loại sự kiện SSE**

| Loại sự kiện | Khi nào kích hoạt | Dữ liệu trong `data` |
|-------------|------------------|---------------------|
| `COMMENT` | Ai đó comment vào bài viết của user | `{ type, postId, postTitle, commentId, actorUsername }` |
| `REPLY` | Ai đó reply comment của user | `{ type, postId, parentCommentId, replyId, actorUsername }` |
| `MENTION` | Ai đó @username trong comment | `{ type, postId, commentId, actorUsername }` |
| `UPVOTE` | Bài viết hoặc comment của user nhận upvote | `{ type, targetType, targetId, actorUsername }` |
| `SYSTEM` | Admin gửi thông báo toàn hệ thống | `{ type, title, message, priority }` |

---

## 4.6 Luồng báo cáo vi phạm

### 4.6.1 Tổng quan quy trình kiểm duyệt

Quy trình xử lý báo cáo vi phạm là **luồng dữ liệu liên quan đến nhiều vai trò nhất**: Member báo cáo, Moderator/Admin xem xét và quyết định, hệ thống tự động ghi audit trail. Luồng này tuân theo mô hình **triage workflow** — báo cáo đi từ PENDING → REVIEWING → RESOLVED/DISMISSED với mỗi bước đều có actor và timestamp rõ ràng.

**Hình 4.8 — Luồng báo cáo vi phạm từ đầu đến cuối**

```
  ┌──────────┐                                              ┌───────────────┐
  │ Member A │                                              │  Moderator /  │
  │ (reporter│                                              │     Admin     │
  └────┬─────┘                                              └───────┬───────┘
       │                                                            │
       │ POST /reports                                              │
       │ {                                                          │
       │   target_type: "POST",   ← hoặc COMMENT / USER            │
       │   target_id: 42,                                           │
       │   reason: "Spam",        ← từ danh sách lý do cố định     │
       │   description: "Bài đăng quảng cáo liên tục..."           │
       │ }                                                          │
       │                                                            │
       ▼                                                            │
  ┌──────────────────────────────────┐                             │
  │  reportController.createReport() │                             │
  │                                  │                             │
  │  Validate:                       │                             │
  │  1. Post/comment/user tồn tại   │                             │
  │  2. Không tự báo cáo bản thân   │                             │
  │  3. Chưa có báo cáo trùng (same │                             │
  │     reporter + same target)      │                             │
  └───────────────┬──────────────────┘                             │
                  │                                                 │
                  ▼                                                 │
  ┌──────────────────────────────────┐                             │
  │  INSERT reports {                │                             │
  │    reporter_id: A.id,            │                             │
  │    target_type: "POST",          │                             │
  │    target_id: 42,                │                             │
  │    reason: "Spam",               │                             │
  │    status: "PENDING",            │                             │
  │    created_at: now()             │                             │
  │  }                               │                             │
  │                                  │                             │
  │  → HTTP 201 Created              │                             │
  └──────────────────────────────────┘                             │
                                                                    │
                          GET /admin/reports?status=PENDING         │
                                                                    ▼
                                                    ┌──────────────────────────┐
                                                    │   Admin Dashboard        │
                                                    │   (admin-client React)   │
                                                    │                          │
                                                    │   Hiển thị danh sách:    │
                                                    │   - Nội dung bị báo cáo  │
                                                    │   - Lý do báo cáo        │
                                                    │   - Lịch sử reporter     │
                                                    │   - Số lần bị báo cáo   │
                                                    └──────────────┬───────────┘
                                                                   │
                                                    ┌──────────────┴────────────┐
                                                    │                           │
                                               [RESOLVE]                   [DISMISS]
                                                    │                           │
                                                    ▼                           ▼
                                       ┌────────────────────┐    ┌────────────────────┐
                                       │ PATCH /reports/:id │    │ PATCH /reports/:id │
                                       │ {                  │    │ {                  │
                                       │   status: RESOLVED,│    │   status: DISMISSED│
                                       │   review_note: "..." │  │   review_note: "..." │
                                       │ }                  │    │ }                  │
                                       │                    │    └────────────────────┘
                                       │ Tùy chọn thêm:     │
                                       │ - Ẩn bài viết 42   │
                                       │ - Xóa bài viết 42  │
                                       │ - Ban user tác giả │
                                       └──────────┬─────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │  audit_logs:         │
                                       │  { action: UPDATE,   │
                                       │    target: REPORT,   │
                                       │    target_id: report.id,
                                       │    old: {PENDING},   │
                                       │    new: {RESOLVED},  │
                                       │    user_id: mod.id } │
                                       └──────────────────────┘
```

### 4.6.2 Luồng xử lý theo cây quyết định

**Bảng 4.5 — Hành động xử lý báo cáo theo loại vi phạm**

| Loại báo cáo | Mức độ vi phạm | Hành động tiêu chuẩn |
|-------------|--------------|---------------------|
| Spam bài viết | Nhẹ (lần đầu) | Ẩn bài (HIDDEN) + Cảnh cáo qua notification |
| Spam bài viết | Nặng (tái phạm) | Xóa bài (DELETED) + Đình chỉ tài khoản |
| Nội dung toxic/hate | Nhẹ | Mask nội dung (`is_content_masked = true`) |
| Nội dung toxic/hate | Nặng | Xóa + Ban tài khoản (`is_active = false`) |
| Báo cáo user | Đã xác minh | Chuyển ROLE về MEMBER + Ghi audit |
| Báo cáo sai | — | DISMISS + Không hành động |

---

## 4.7 Luồng AI Content Generation (vibe-content)

### 4.7.1 Tổng quan kiến trúc vibe-content service

`vibe-content` là **microservice độc lập** được triển khai tách biệt với forum backend. Service này tích hợp với nhiều nhà cung cấp LLM (Large Language Model) để sinh nội dung tự động — bài viết và bình luận — nhằm duy trì hoạt động của forum khi chưa có đủ người dùng thật.

**Nguyên tắc thiết kế quan trọng:** vibe-content **không có API endpoint đặc biệt** — Bot user tương tác với forum API hoàn toàn giống như Member thông thường, chỉ khác ở `role = BOT`. Điều này đơn giản hóa backend và tránh tạo API backdoor không an toàn.

**Hình 4.9 — Kiến trúc vibe-content Service**

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

## 4.8 Luồng tìm kiếm toàn văn (Full-Text Search)

### 4.8.1 Kiến trúc PostgreSQL Full-Text Search

MINI-FORUM sử dụng tính năng **Full-Text Search (FTS) tích hợp sẵn trong PostgreSQL** thay vì giải pháp bên ngoài như Elasticsearch hay Algolia. Quyết định này phù hợp với quy mô dự án hiện tại — tránh thêm dependency không cần thiết và giảm chi phí vận hành, trong khi PostgreSQL FTS đủ mạnh để xử lý.

**Hình 4.11 — Luồng xử lý Full-Text Search**

```
  ┌─────────┐  GET /search?q=react+hook&type=posts
  │  User   │────────────────────────────────────────────────────────────►
  └─────────┘
                                        ┌──────────────────────────────────┐
                                        │  searchController → searchService │
                                        │                                  │
                                        │  BƯỚC 1 — SANITIZE INPUT:        │
                                        │  query = q.trim()                │
                                        │  Loại bỏ ký tự đặc biệt SQL      │
                                        │  Giới hạn độ dài: max 200 chars  │
                                        │                                  │
                                        │  BƯỚC 2 — TẠO tsquery:           │
                                        │  tsQuery = plainto_tsquery(       │
                                        │    'english',                    │
                                        │    'react hook'                  │
                                        │  )                               │
                                        │  → Kết quả: 'react' & 'hook'    │
                                        │                                  │
                                        │  BƯỚC 3 — FULL-TEXT QUERY:       │
                                        │  SELECT                          │
                                        │    posts.*,                      │
                                        │    ts_rank(                      │
                                        │      to_tsvector('english',      │
                                        │        posts.title || ' ' ||     │
                                        │        posts.content             │
                                        │      ),                          │
                                        │      tsQuery                     │
                                        │    ) AS relevance_score          │
                                        │  FROM posts                      │
                                        │  WHERE                           │
                                        │    status = 'PUBLISHED'          │
                                        │    AND to_tsvector('english',    │
                                        │      title || ' ' || content     │
                                        │    ) @@ tsQuery                  │
                                        │  ORDER BY relevance_score DESC   │
                                        │  LIMIT 20 OFFSET (page-1)*20     │
                                        │                                  │
                                        │  BƯỚC 4 — PERMISSION FILTER:     │
                                        │  Loại bỏ bài từ private category │
                                        │  nếu user chưa đăng nhập        │
                                        └──────────────────────────────────┘
                                                         │
                                                         ▼
                                              Response:
                                              {
                                                data: [ posts ],
                                                meta: {
                                                  total,
                                                  page,
                                                  limit,
                                                  q: "react hook"
                                                }
                                              }
```

### 4.8.2 Phạm vi tìm kiếm và chỉ mục

**Bảng 4.7 — Các scope tìm kiếm được hỗ trợ**

| Endpoint | Tham số `type` | Tìm kiếm trong trường | Chỉ mục PostgreSQL |
|---------|--------------|---------------------|-------------------|
| `GET /search?q=keyword` | (không truyền) | `posts.title + posts.content` + `comments.content` | `idx_posts_fulltext`, `idx_comments_fulltext` |
| `GET /search?q=keyword&type=posts` | `posts` | Chỉ `posts.title` và `posts.content` | `idx_posts_fulltext` |
| `GET /search?q=keyword&type=comments` | `comments` | Chỉ `comments.content` | `idx_comments_fulltext` |
| `GET /search?q=keyword&type=users` | `users` | `users.username` và `users.bio` | Partial match (ILIKE) |

> **Về chỉ mục:** PostgreSQL GIN index trên cột `tsvector` cho phép FTS query chạy rất nhanh mà không cần scan toàn bảng. Nếu sau này cần tìm kiếm nâng cao (fuzzy search, ranking phức tạp hơn), có thể nâng cấp lên Elasticsearch mà không cần thay đổi API interface.

---

## Tóm tắt chương 4

Chương 4 đã mô tả và phân tích **tám luồng thông tin chủ yếu** của hệ thống MINI-FORUM, từ mức độ tổng quan (Context Diagram) đến mức độ chi tiết (sequence diagram cho từng quy trình). Mỗi luồng đều được đặt trong ngữ cảnh nghiệp vụ cụ thể và phân tích các quyết định thiết kế.

**Bảng 4.8 — Tổng kết các luồng thông tin**

| # | Luồng | Công nghệ / Pattern | Điểm nổi bật |
|---|-------|-------------------|-------------|
| 4.1 | Context Diagram | DFD Level 0 | 4 tác nhân: Guest, Member, Admin, Third-party Services |
| 4.2 | Đăng nhập (Login) | DFD Level 1 | 5 bước validation với fail-fast; chống user enumeration |
| 4.3 | Dual-Token Auth | JWT + Refresh Rotation | Access token 15 phút + httpOnly cookie; rotation chống token theft |
| 4.4 | Vote → Reputation | Atomic Transaction | 6 case logic trong 1 transaction; UPVOTE_DELTA cấu hình động |
| 4.5 | SSE Notification | Server-Sent Events | One-way push; tự động reconnect; fallback vào DB nếu offline |
| 4.6 | Report Vi phạm | Triage Workflow | PENDING → REVIEWING → RESOLVED/DISMISSED; bắt buộc audit trail |
| 4.7 | AI Content (Bot) | LLM Integration | Bot tương tác qua API như Member bình thường; hỗ trợ nhiều LLM |
| 4.8 | Full-Text Search | PostgreSQL FTS | GIN index; ts_rank relevance scoring; permission-aware results |

Xuyên suốt các luồng, hệ thống tuân thủ nhất quán nguyên tắc thiết kế:

- **Validate trước, xử lý sau** — mọi input đều qua Zod schema validation trước khi chạm vào business logic
- **Atomic hoặc không làm gì** — các thao tác ảnh hưởng nhiều bảng đều bọc trong `prisma.$transaction()`
- **Không tiết lộ thông tin nội bộ** — response lỗi luôn generic, không để lộ cấu trúc DB hay logic
- **Audit trail không thể bỏ qua** — mọi hành động của Moderator/Admin đều ghi `audit_logs`

Chương tiếp theo (Chương 5) sẽ đặc tả chi tiết từng module chức năng với API endpoints đầy đủ, business rule và middleware pipeline tương ứng.
