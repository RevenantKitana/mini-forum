# CHƯƠNG 2
# PHÂN TÍCH NGHIỆP VỤ

---

## 2.1 Các tác nhân (Actors)

### 2.1.1 Định nghĩa và phân cấp

Hệ thống MINI-FORUM có **5 tác nhân** (Actor) với phân cấp quyền hạn tuyến tính từ thấp đến cao. Phân cấp này được mã hóa trực tiếp trong Prisma schema qua enum `Role`:

```prisma
// backend/prisma/schema.prisma
enum Role {
  MEMBER
  MODERATOR
  ADMIN
  BOT
}
```

> **Lưu ý:** Guest không phải là Role trong database — đây là trạng thái "chưa xác thực" được xử lý ở middleware layer.

**Bảng 2.1 — Danh sách Actor và quyền hạn**

| Actor | Nguồn gốc | Mô tả | Quyền hạn chính |
|-------|----------|-------|----------------|
| **Guest** | Không có tài khoản | Người dùng chưa đăng nhập, truy cập ẩn danh | Xem bài viết trong category có `view_permission = ALL`; Tìm kiếm |
| **Member** | `Role.MEMBER` | Thành viên đã xác thực OTP | Đăng bài viết, bình luận, vote, bookmark, báo cáo, upload avatar |
| **Moderator** | `Role.MODERATOR` | Kiểm duyệt viên được Admin bổ nhiệm | Ẩn/xóa bài viết, xử lý báo cáo vi phạm, khóa thread |
| **Admin** | `Role.ADMIN` | Quản trị viên cấp cao | Full access: quản lý user/category/tag/config, xem audit log, dashboard |
| **Bot** | `Role.BOT` | Tài khoản AI agent | Đăng bài và comment tự động qua vibe-content service |

### 2.1.2 Ma trận phân quyền

**Bảng 2.2 — Ma trận phân quyền theo chức năng**

| Chức năng | Guest | Member | Moderator | Admin | Bot |
|----------|:-----:|:------:|:---------:|:-----:|:---:|
| Xem bài viết (public) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Xem bài viết (member-only) | ✗ | ✓ | ✓ | ✓ | ✓ |
| Tạo bài viết | ✗ | ✓ | ✓ | ✓ | ✓ |
| Chỉnh sửa bài viết (của mình) | ✗ | ✓ | ✓ | ✓ | ✓ |
| Xóa bài viết (của mình) | ✗ | ✓ | ✓ | ✓ | — |
| Ẩn/xóa bài viết (của người khác) | ✗ | ✗ | ✓ | ✓ | ✗ |
| Tạo bình luận | ✗ | ✓ | ✓ | ✓ | ✓ |
| Vote bài viết/comment | ✗ | ✓ | ✓ | ✓ | ✗ |
| Bookmark | ✗ | ✓ | ✓ | ✓ | ✗ |
| Báo cáo vi phạm | ✗ | ✓ | ✓ | ✓ | ✗ |
| Xử lý báo cáo | ✗ | ✗ | ✓ | ✓ | ✗ |
| Quản lý người dùng | ✗ | ✗ | ✗ | ✓ | ✗ |
| Quản lý category/tag | ✗ | ✗ | ✗ | ✓ | ✗ |
| Xem audit log | ✗ | ✗ | ✗ | ✓ | ✗ |
| Xem dashboard thống kê | ✗ | ✗ | ✓ | ✓ | ✗ |
| Ghim bài viết | ✗ | ✗ | ✗ | ✓ | ✗ |
| Thay đổi cấu hình hệ thống | ✗ | ✗ | ✗ | ✓ | ✗ |

---

## 2.2 Use Case Diagram

### 2.2.1 Tổng quan 28 Use Cases

Hệ thống có **28 Use Case** được tổ chức thành 4 nhóm chức năng:

**Bảng 2.3 — Danh sách đầy đủ 28 Use Case**

| Nhóm | Mã UC | Tên Use Case | Actor chính |
|------|-------|-------------|------------|
| **Quản lý người dùng** | UC-01 | Đăng ký tài khoản | Guest |
| | UC-02 | Xác thực OTP qua email | Guest |
| | UC-03 | Đăng nhập | Member/Admin/Bot |
| | UC-04 | Cập nhật thông tin cá nhân | Member |
| | UC-05 | Đổi mật khẩu | Member |
| | UC-06 | Quên mật khẩu — reset qua email | Guest |
| | UC-07 | Chặn người dùng | Member |
| | UC-08 | Upload avatar (ImageKit CDN) | Member |
| **Quản lý nội dung** | UC-09 | Tạo bài viết | Member |
| | UC-10 | Chỉnh sửa bài viết | Member (tác giả) / Admin |
| | UC-11 | Xóa bài viết | Member (tác giả) / Moderator / Admin |
| | UC-12 | Tạo bình luận | Member |
| | UC-13 | Reply bình luận | Member |
| | UC-14 | Quote bình luận | Member |
| | UC-15 | Chỉnh sửa bình luận (giới hạn thời gian) | Member (tác giả) |
| **Tương tác cộng đồng** | UC-16 | Vote upvote/downvote bài viết | Member |
| | UC-17 | Vote upvote/downvote bình luận | Member |
| | UC-18 | Bookmark bài viết | Member |
| | UC-19 | Tìm kiếm toàn văn bản (Full-text) | Member / Guest |
| | UC-20 | Nhận thông báo real-time (SSE) | Member |
| **Quản trị hệ thống** | UC-21 | Quản lý danh mục (CRUD category) | Admin |
| | UC-22 | Quản lý thẻ tag (CRUD tag) | Admin |
| | UC-23 | Báo cáo nội dung vi phạm | Member |
| | UC-24 | Xử lý báo cáo vi phạm | Moderator / Admin |
| | UC-25 | Xem và tìm kiếm audit log | Admin |
| | UC-26 | Xem dashboard thống kê | Admin / Moderator |
| | UC-27 | Ghim bài viết (global/category) | Admin |
| | UC-28 | Khóa thread (không cho bình luận) | Admin / Moderator |

### 2.2.2 Use Case Diagram — Nhóm Quản lý người dùng

**Hình 2.1 — Use Case Diagram: Quản lý người dùng**

```
┌──────────────────────────────────────────────────────────────────┐
│                    HỆ THỐNG MINI-FORUM                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │         NHÓM: QUẢN LÝ NGƯỜI DÙNG                           │ │
│  │                                                             │ │
│  │   (UC-01) Đăng ký tài khoản ◄────────────── Guest          │ │
│  │   (UC-02) Xác thực OTP      ◄────────────── Guest          │ │
│  │   (UC-03) Đăng nhập         ◄──────────┬─── Member         │ │
│  │                             ◄──────────┼─── Admin          │ │
│  │                             ◄──────────┘─── Bot            │ │
│  │   (UC-04) Cập nhật profile  ◄────────────── Member         │ │
│  │   (UC-05) Đổi mật khẩu     ◄────────────── Member         │ │
│  │   (UC-06) Reset mật khẩu   ◄────────────── Guest          │ │
│  │   (UC-07) Chặn người dùng  ◄────────────── Member         │ │
│  │   (UC-08) Upload avatar     ◄────────────── Member         │ │
│  │                                                             │ │
│  │   [include] UC-01 ──includes──► UC-02 (OTP verification)   │ │
│  │   [include] UC-06 ──includes──► UC-02 (OTP for reset)      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2.3 Use Case Diagram — Nhóm Quản lý nội dung

**Hình 2.2 — Use Case Diagram: Quản lý nội dung**

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │         NHÓM: QUẢN LÝ NỘI DUNG                             │ │
│  │                                                             │ │
│  │   (UC-09) Tạo bài viết    ◄───────────────── Member        │ │
│  │   (UC-10) Sửa bài viết   ◄────────────┬───── Member (tg)  │ │
│  │                           ◄────────────┘───── Admin        │ │
│  │   (UC-11) Xóa bài viết   ◄────────┬─────────  Member (tg) │ │
│  │                           ◄────────┼─────────  Moderator   │ │
│  │                           ◄────────┘─────────  Admin       │ │
│  │   (UC-12) Tạo bình luận  ◄───────────────────  Member      │ │
│  │   (UC-13) Reply comment  ◄───────────────────  Member      │ │
│  │   (UC-14) Quote comment  ◄───────────────────  Member      │ │
│  │   (UC-15) Sửa comment    ◄───────────────────  Member (tg) │ │
│  │           [time limit constraint: COMMENT_EDIT_TIME_LIMIT]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2.4 Use Case Diagram — Nhóm Tương tác và Quản trị

**Hình 2.3 — Use Case Diagram: Tương tác & Quản trị**

```
┌─────────────────────────────────────────────────────────────────┐
│  TƯƠNG TÁC CỘNG ĐỒNG                                           │
│  (UC-16) Vote post       ◄─── Member                           │
│  (UC-17) Vote comment    ◄─── Member                           │
│  (UC-18) Bookmark post   ◄─── Member                           │
│  (UC-19) Full-text search◄──────┬── Member                     │
│                          ◄──────┘── Guest                      │
│  (UC-20) Nhận SSE notify ◄─── Member                           │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  QUẢN TRỊ HỆ THỐNG                                             │
│  (UC-21) Quản lý category◄─── Admin                            │
│  (UC-22) Quản lý tag     ◄─── Admin                            │
│  (UC-23) Báo cáo vi phạm ◄─── Member                           │
│  (UC-24) Xử lý báo cáo  ◄──────┬── Moderator                  │
│                          ◄──────┘── Admin                      │
│  (UC-25) Xem audit log   ◄─── Admin                            │
│  (UC-26) Dashboard stats ◄──────┬── Admin                      │
│                          ◄──────┘── Moderator                  │
│  (UC-27) Ghim bài viết   ◄─── Admin                            │
│  (UC-28) Khóa thread     ◄──────┬── Admin                      │
│                          ◄──────┘── Moderator                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.3 Đặc tả Use Case tiêu biểu

### 2.3.1 UC-01: Đăng ký tài khoản

**Bảng 2.4 — Đặc tả UC-01: Đăng ký tài khoản**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-01 |
| **Tên** | Đăng ký tài khoản |
| **Actor chính** | Guest |
| **Actor phụ** | Brevo Email Service |
| **Mô tả** | Người dùng mới tạo tài khoản trong hệ thống |
| **Precondition** | 1. Email chưa tồn tại trong bảng `users` <br> 2. Username chưa tồn tại trong bảng `users` |
| **Postcondition** | Tài khoản được tạo với `is_active = true`, `is_verified = true` |

**Main Flow (Luồng chính):**

| Bước | Hành động người dùng | Phản hồi hệ thống |
|------|---------------------|------------------|
| 1 | Nhập email, username, password | — |
| 2 | Submit form đăng ký | Validate với Zod schema: format email, độ dài password ≥ 8, username không có ký tự đặc biệt |
| 3 | — | Kiểm tra email và username chưa tồn tại trong DB |
| 4 | — | Hash password với bcrypt (salt rounds = 10) |
| 5 | — | Tạo record `users` với `is_active = false`, `role = MEMBER` |
| 6 | — | Tạo OTP token (6 chữ số) lưu vào `otp_tokens` với TTL |
| 7 | — | Gửi email chứa OTP qua Brevo API |
| 8 | Nhập mã OTP nhận được | — |
| 9 | — | Xác minh OTP còn hạn và đúng mã |
| 10 | — | Cập nhật `users.is_active = true`, `users.is_verified = true`; xóa OTP token |

**Alternative Flows (Luồng thay thế):**

| Mã | Điều kiện | Xử lý |
|----|----------|-------|
| 2a | Email không đúng format | Trả về error 400 "Email không hợp lệ" |
| 3a | Email đã tồn tại | Trả về error 409 "Email đã được đăng ký" |
| 3b | Username đã tồn tại | Trả về error 409 "Username đã được sử dụng" |
| 7a | Gửi email thất bại | Retry với exponential backoff; nếu thất bại sau 3 lần → error 500 |
| 9a | OTP sai | Trả về error 400 "Mã OTP không đúng" |
| 9b | OTP hết hạn | Trả về error 400 "Mã OTP đã hết hạn"; cung cấp option gửi lại |

**Business Rules:**
- Một địa chỉ email chỉ được đăng ký một tài khoản duy nhất
- OTP có TTL giới hạn (cấu hình qua environment variable)
- Rate limiting áp dụng trên endpoint `/auth/register` để ngăn abuse

---

### 2.3.2 UC-09: Tạo bài viết

**Bảng 2.5 — Đặc tả UC-09: Tạo bài viết**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-09 |
| **Tên** | Tạo bài viết |
| **Actor chính** | Member |
| **Mô tả** | Thành viên tạo bài viết mới trong một danh mục |
| **Precondition** | 1. User đã đăng nhập (JWT hợp lệ) <br> 2. Category tồn tại và `post_permission` cho phép role của user <br> 3. Tài khoản chưa bị ban (`is_banned = false`) |
| **Postcondition** | Bài viết được tạo với status PUBLISHED (hoặc DRAFT), `categories.post_count` được tăng 1 |

**Main Flow:**

| Bước | Hành động | Chi tiết kỹ thuật |
|------|----------|-----------------|
| 1 | User điền form: title, content, category, tags | Frontend validate sơ bộ |
| 2 | Submit POST `/posts` | `authMiddleware` verify JWT token |
| 3 | — | `roleMiddleware` kiểm tra permission trên category |
| 4 | — | Zod schema validate: title không rỗng, content không rỗng, category_id tồn tại |
| 5 | — | `postService.createPost()`: tạo slug từ title (slugify) + timestamp suffix nếu trùng |
| 6 | — | Tạo record `posts` với `status = PUBLISHED` (mặc định) |
| 7 | — | Nếu `use_block_layout = true`: tạo các record `post_blocks` theo thứ tự `sort_order` |
| 8 | — | Link tags: upsert `post_tags` records cho mỗi tag được chọn; tăng `tags.usage_count` |
| 9 | — | Tăng `categories.post_count += 1` |
| 10 | — | Trả về bài viết mới tạo kèm slug |

**Alternative Flows:**

| Mã | Điều kiện | Xử lý |
|----|----------|-------|
| 2a | JWT hết hạn | `authMiddleware` trả về 401; frontend tự động refresh token |
| 3a | Category yêu cầu MODERATOR role nhưng user là MEMBER | Trả về error 403 |
| 4a | Title rỗng hoặc quá ngắn | Zod validation error 400 |
| 5a | Slug trùng sau khi thêm suffix | Thêm suffix khác (timestamp millisecond) |

**Business Rules:**
- Slug phải unique trong toàn bộ bảng `posts`
- Bài viết có thể ở trạng thái DRAFT (lưu nháp) hoặc PUBLISHED (công bố ngay)
- Nếu dùng Block Layout, `posts.content` để trống, nội dung thực tế lưu trong `post_blocks`

---

### 2.3.3 UC-24: Xử lý báo cáo vi phạm

**Bảng 2.6 — Đặc tả UC-24: Xử lý báo cáo vi phạm**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-24 |
| **Tên** | Xử lý báo cáo vi phạm |
| **Actor chính** | Moderator / Admin |
| **Mô tả** | Kiểm duyệt viên xem xét và xử lý các báo cáo nội dung vi phạm |
| **Precondition** | 1. Có ít nhất một report với `status = PENDING` trong DB <br> 2. Moderator/Admin đã đăng nhập vào admin-client |
| **Postcondition** | Report được cập nhật status (RESOLVED/DISMISSED); hành động moderator được ghi vào `audit_logs` |

**Main Flow:**

| Bước | Hành động | Chi tiết |
|------|----------|---------|
| 1 | Moderator mở trang Reports trên admin-client | Hệ thống hiển thị danh sách reports theo filter `status = PENDING` |
| 2 | Xem chi tiết report | Hệ thống hiển thị: nội dung bị báo cáo, lý do báo cáo, lịch sử báo cáo của reporter |
| 3 | Quyết định xử lý | Moderator chọn RESOLVE (xử phạt) hoặc DISMISS (bỏ qua) |
| 4a | **RESOLVE:** Moderator xác nhận hành vi vi phạm | Hệ thống cập nhật `reports.status = RESOLVED`, `reports.reviewed_by`, `reports.reviewed_at` |
| 4b | — | Tùy chọn action: xóa bài viết / ẩn comment / ban user |
| 5a | **DISMISS:** Moderator xác nhận không vi phạm | Hệ thống cập nhật `reports.status = DISMISSED` |
| 6 | — | Ghi `audit_logs` cho action xử lý report (AuditAction: `UPDATE`, AuditTarget: `REPORT`) |
| 7 | — | Nếu có action trên nội dung (xóa/ẩn/ban): ghi thêm `audit_logs` cho action đó |

**Business Rules:**
- Mọi hành động của Moderator/Admin đều **bắt buộc** ghi vào `audit_logs` — không thể bypass
- `review_note` có thể kèm theo lý do quyết định
- Moderator chỉ xem được reports, không thể thay đổi cấu hình hệ thống (đó là quyền Admin)

---

### 2.3.4 UC-03: Đăng nhập

**Bảng 2.7 — Đặc tả UC-03: Đăng nhập**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-03 |
| **Tên** | Đăng nhập hệ thống |
| **Actor chính** | Member / Admin / Bot |
| **Precondition** | Tài khoản đã xác thực OTP (`is_active = true`), chưa bị ban |
| **Postcondition** | Client nhận JWT access token (15 phút) và refresh token (7 ngày trong httpOnly cookie) |

**Main Flow:**

| Bước | Hành động | Chi tiết kỹ thuật |
|------|----------|-----------------|
| 1 | Nhập email + password | — |
| 2 | — | Validate format với Zod |
| 3 | — | `users.findUnique({ where: { email } })` |
| 4 | — | `bcrypt.compare(password, user.password_hash)` |
| 5 | — | Kiểm tra `is_active && !is_banned` |
| 6 | — | Ký `accessToken` với JWT (payload: userId, role, TTL: 15 phút) |
| 7 | — | Tạo `refreshToken` (UUID) → lưu vào `refresh_tokens` với `expires_at = now + 7 days` |
| 8 | — | Ghi `audit_logs`: action `LOGIN`, target `USER` |
| 9 | — | Response: `{ accessToken }` + Set-Cookie: `refreshToken` (httpOnly, Secure, SameSite=Strict) |

**Security Notes:**
- Refresh token lưu trong `httpOnly cookie` → không thể đọc bởi JavaScript (XSS protection)
- Access token lưu trong memory (biến React state) → không lưu localStorage
- Mỗi lần logout xóa record trong `refresh_tokens` → token revocation

---

## 2.4 Business Rules tổng hợp

### 2.4.1 Quy tắc nghiệp vụ về nội dung

| ID | Quy tắc | Nguồn implementation |
|----|--------|---------------------|
| BR-01 | Slug của bài viết phải unique trong toàn hệ thống | `posts.slug UNIQUE constraint` |
| BR-02 | Comment chỉ chỉnh sửa được trong `COMMENT_EDIT_TIME_LIMIT` giây | `commentController.ts` + config |
| BR-03 | Comment chỉ lồng tối đa 2 cấp (root + reply) | `parent_id` chỉ tham chiếu root comment |
| BR-04 | Bài viết bị DELETED là soft delete — data vẫn còn trong DB | `PostStatus.DELETED` |
| BR-05 | Khi lock thread (`is_locked = true`), không tạo được comment mới | `commentService.ts` validation |

### 2.4.2 Quy tắc nghiệp vụ về phân quyền

| ID | Quy tắc | Nguồn implementation |
|----|--------|---------------------|
| BR-06 | Guest chỉ xem được category có `view_permission = ALL` | `categoryService.ts` |
| BR-07 | Permission check theo thứ tự: ALL < MEMBER < MODERATOR < ADMIN | `PermissionLevel` enum ordering |
| BR-08 | Bot có thể tạo bài viết và comment nhưng không thể vote hay bookmark | Implicit via vibe-content service logic |
| BR-09 | Admin không thể bị ban bởi Moderator | Role hierarchy check trong `userService.ts` |

### 2.4.3 Quy tắc nghiệp vụ về reputation

| ID | Quy tắc | Nguồn implementation |
|----|--------|---------------------|
| BR-10 | Upvote bài viết/comment → tác giả nhận `+UPVOTE_REPUTATION_DELTA` điểm | `voteService.ts` |
| BR-11 | Downvote bài viết/comment → tác giả mất `DOWNVOTE_REPUTATION_DELTA` điểm | `voteService.ts` |
| BR-12 | User không thể tự vote bài viết/comment của chính mình | `voteService.ts` validation |
| BR-13 | Mỗi user chỉ vote một lần cho mỗi bài viết/comment (có thể đổi chiều) | `votes UNIQUE(user_id, target_type, target_id)` |

---

## Tóm tắt chương 2

Chương 2 đã hoàn thành phân tích nghiệp vụ MINI-FORUM với:

- **5 actor** có phân cấp quyền hạn rõ ràng từ Guest đến Admin
- **28 use case** được tổ chức thành 4 nhóm chức năng bao phủ toàn bộ vòng đời nội dung
- **4 use case tiêu biểu** được đặc tả chi tiết với main flow, alternative flow và business rules
- **13 business rules** được trích xuất từ codebase, là nền tảng cho thiết kế dữ liệu và xử lý nghiệp vụ

Chương tiếp theo sẽ chuyển hóa các use case và business rules này thành mô hình dữ liệu — ERD và Data Dictionary.
