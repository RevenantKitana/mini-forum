# CHƯƠNG 2
# PHÂN TÍCH NGHIỆP VỤ

---

## 2.1 Các tác nhân (Actors)

### 2.1.1 Định nghĩa và phân cấp tác nhân

Trong phân tích hệ thống thông tin, **tác nhân** (Actor) là bất kỳ thực thể nào nằm ngoài ranh giới hệ thống, tương tác với hệ thống để trao đổi thông tin. Tác nhân có thể là người dùng trực tiếp, hệ thống bên ngoài hoặc thiết bị phần cứng.

Hệ thống MINI-FORUM có **5 tác nhân người dùng** với phân cấp quyền hạn tuyến tính từ thấp đến cao. Phân cấp này được triển khai trực tiếp trong Prisma schema qua enum `Role`:

```prisma
// backend/prisma/schema.prisma
enum Role {
  MEMBER      // Thành viên thông thường
  MODERATOR   // Kiểm duyệt viên
  ADMIN       // Quản trị viên cấp cao
  BOT         // Tài khoản AI tự động
}
```

> **Lưu ý thiết kế:** `Guest` (khách chưa đăng nhập) không phải là Role trong database. Đây là trạng thái "unauthenticated" được xử lý tại middleware layer — khi không có JWT token hợp lệ trong header.

**Sơ đồ phân cấp quyền hạn:**

```
╔══════════════════════════════════════════════════════╗
║         PHÂN CẤP QUYỀN HẠN MINI-FORUM               ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  ┌──────────────────────────────────────────────┐   ║
║  │              ADMIN (Cao nhất)                │   ║
║  │  Full system access + audit log + settings   │   ║
║  │  ┌──────────────────────────────────────┐    │   ║
║  │  │     MODERATOR                        │    │   ║
║  │  │  Moderation + reports + dashboard    │    │   ║
║  │  │  ┌──────────────────────────────┐    │    │   ║
║  │  │  │      MEMBER                  │    │    │   ║
║  │  │  │  Post, comment, vote, ...    │    │    │   ║
║  │  │  │  ┌────────────────────┐      │    │    │   ║
║  │  │  │  │      GUEST         │      │    │    │   ║
║  │  │  │  │  View public only  │      │    │    │   ║
║  │  │  │  └────────────────────┘      │    │    │   ║
║  │  │  └──────────────────────────────┘    │    │   ║
║  │  └──────────────────────────────────────┘    │   ║
║  └──────────────────────────────────────────────┘   ║
║                                                      ║
║         BOT: Lateral role — tạo content tự động     ║
╚══════════════════════════════════════════════════════╝
```

**Hình 2.1 — Phân cấp quyền hạn các tác nhân MINI-FORUM**

### 2.1.2 Mô tả chi tiết các tác nhân

**Bảng 2.1 — Danh sách Actor và đặc điểm**

| Actor | Nguồn gốc | Mô tả chi tiết | Quyền hạn tiêu biểu |
|-------|:--------:|----------------|:-------------------:|
| **Guest** | Không có tài khoản (unauthenticated) | Người dùng truy cập ẩn danh, chưa đăng nhập. Chỉ thấy nội dung công khai (`view_permission = ALL`) | Xem bài viết công khai, tìm kiếm |
| **Member** | `Role.MEMBER` (default sau đăng ký) | Thành viên đã xác thực OTP email. Đây là actor chủ lực của hệ thống — họ tạo ra toàn bộ UGC | Đăng bài, bình luận, vote, bookmark, báo cáo |
| **Moderator** | `Role.MODERATOR` (được Admin bổ nhiệm) | Kiểm duyệt viên tin cậy được Admin nâng cấp. Có thể quản lý nội dung nhưng không quản lý hệ thống | Ẩn/xóa bài viết, xử lý báo cáo, khóa thread, xem dashboard |
| **Admin** | `Role.ADMIN` (cấp cao nhất) | Quản trị viên toàn quyền. Chịu trách nhiệm toàn bộ cấu hình và vận hành hệ thống | Full access: user management, config, audit log, tất cả Mod actions |
| **Bot** | `Role.BOT` (tài khoản đặc biệt) | Tài khoản AI agent được vibe-content service sử dụng để tự động đăng bài và bình luận | Tạo bài viết và comment tự động; KHÔNG vote, KHÔNG bookmark |

### 2.1.3 Ma trận phân quyền chi tiết

**Bảng 2.2 — Ma trận phân quyền đầy đủ theo chức năng**

| Chức năng | Guest | Member | Moderator | Admin | Bot |
|----------|:-----:|:------:|:---------:|:-----:|:---:|
| **Xem bài viết (public category)** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Xem bài viết (member-only category)** | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Tìm kiếm full-text** | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Đăng ký / Đăng nhập** | ✓ | — | — | — | — |
| **Tạo bài viết** | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Chỉnh sửa bài viết (của mình)** | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Xóa bài viết (của mình)** | ✗ | ✓ | ✓ | ✓ | — |
| **Ẩn/xóa bài viết (của người khác)** | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Ghim bài viết** | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Khóa thread** | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Tạo bình luận** | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Sửa bình luận (trong thời hạn)** | ✗ | ✓ | ✓ | ✓ | ✓ |
| **Vote bài viết / comment** | ✗ | ✓ | ✓ | ✓ | ✗ |
| **Bookmark** | ✗ | ✓ | ✓ | ✓ | ✗ |
| **Báo cáo vi phạm** | ✗ | ✓ | ✓ | ✓ | ✗ |
| **Xử lý báo cáo vi phạm** | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Xem dashboard thống kê** | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Quản lý người dùng (ban/role)** | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Quản lý category/tag (CRUD)** | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Xem audit log** | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Cấu hình hệ thống** | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Upload avatar** | ✗ | ✓ | ✓ | ✓ | ✗ |
| **Chặn người dùng (block)** | ✗ | ✓ | ✓ | ✓ | ✗ |

> **Nguyên tắc RBAC:** Permission check thực hiện theo thứ tự tuyến tính: `ALL < MEMBER < MODERATOR < ADMIN`. Mỗi cấp cao hơn kế thừa toàn bộ quyền của cấp thấp hơn.

---

## 2.2 Use Case Diagram

### 2.2.1 Tổng quan 28 Use Cases

Hệ thống MINI-FORUM có **28 Use Case** được tổ chức thành **4 nhóm chức năng** theo phạm vi nghiệp vụ:

**Bảng 2.3 — Danh sách đầy đủ 28 Use Case**

| Nhóm | Mã UC | Tên Use Case | Actor chính | Độ ưu tiên |
|------|:----:|-------------|:-----------:|:----------:|
| **Quản lý người dùng** | UC-01 | Đăng ký tài khoản | Guest | Cao |
| | UC-02 | Xác thực OTP qua email | Guest | Cao |
| | UC-03 | Đăng nhập hệ thống | Member/Admin/Bot | Cao |
| | UC-04 | Cập nhật thông tin cá nhân | Member | Trung bình |
| | UC-05 | Đổi mật khẩu | Member | Trung bình |
| | UC-06 | Quên mật khẩu — reset qua email | Guest | Trung bình |
| | UC-07 | Chặn người dùng | Member | Thấp |
| | UC-08 | Upload avatar lên CDN | Member | Trung bình |
| **Quản lý nội dung** | UC-09 | Tạo bài viết | Member | Cao |
| | UC-10 | Chỉnh sửa bài viết | Member/Admin | Cao |
| | UC-11 | Xóa bài viết | Member/Mod/Admin | Cao |
| | UC-12 | Tạo bình luận | Member | Cao |
| | UC-13 | Reply bình luận | Member | Cao |
| | UC-14 | Quote bình luận | Member | Trung bình |
| | UC-15 | Chỉnh sửa bình luận (giới hạn thời gian) | Member | Trung bình |
| **Tương tác cộng đồng** | UC-16 | Vote upvote/downvote bài viết | Member | Cao |
| | UC-17 | Vote upvote/downvote bình luận | Member | Cao |
| | UC-18 | Bookmark bài viết | Member | Trung bình |
| | UC-19 | Tìm kiếm toàn văn bản (FTS) | Member/Guest | Cao |
| | UC-20 | Nhận thông báo real-time (SSE) | Member | Cao |
| **Quản trị hệ thống** | UC-21 | Quản lý danh mục (CRUD category) | Admin | Cao |
| | UC-22 | Quản lý thẻ tag (CRUD tag) | Admin | Trung bình |
| | UC-23 | Báo cáo nội dung vi phạm | Member | Cao |
| | UC-24 | Xử lý báo cáo vi phạm | Moderator/Admin | Cao |
| | UC-25 | Xem và tìm kiếm audit log | Admin | Trung bình |
| | UC-26 | Xem dashboard thống kê | Admin/Moderator | Cao |
| | UC-27 | Ghim bài viết (global/category) | Admin | Thấp |
| | UC-28 | Khóa thread (không cho bình luận) | Admin/Moderator | Trung bình |

### 2.2.2 Use Case Diagram — Nhóm Quản lý người dùng

**Hình 2.2 — Use Case Diagram: Nhóm Quản lý người dùng**

```
┌──────────────────────────────────────────────────────────────────────┐
│                        HỆ THỐNG MINI-FORUM                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │               NHÓM: QUẢN LÝ NGƯỜI DÙNG                        │  │
│  │                                                                │  │
│  │                                                                │  │
│  │   (UC-01) Đăng ký tài khoản  ◄────────────────── Guest        │  │
│  │                │                                              │  │
│  │                │ «include»                                     │  │
│  │                ▼                                               │  │
│  │   (UC-02) Xác thực OTP       ◄────────────────── Guest        │  │
│  │                ▲                                               │  │
│  │                │ «include»                                     │  │
│  │   (UC-06) Reset mật khẩu     ◄────────────────── Guest        │  │
│  │                                                                │  │
│  │   (UC-03) Đăng nhập          ◄────────────┬────── Member      │  │
│  │                              ◄────────────┼────── Admin       │  │
│  │                              ◄────────────┘────── Bot         │  │
│  │                                                                │  │
│  │   (UC-04) Cập nhật profile   ◄────────────────── Member       │  │
│  │   (UC-05) Đổi mật khẩu      ◄────────────────── Member       │  │
│  │   (UC-07) Chặn người dùng   ◄────────────────── Member       │  │
│  │   (UC-08) Upload avatar      ◄────────────────── Member       │  │
│  │               │ «include»                                      │  │
│  │               ▼                                                │  │
│  │         [ImageKit CDN]                                         │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**Quan hệ Include/Extend:**
- UC-01 `«include»` UC-02: Đăng ký bắt buộc phải xác thực OTP.
- UC-06 `«include»` UC-02: Reset mật khẩu cũng cần xác thực OTP để xác nhận danh tính.
- UC-08 `«include»` [ImageKit CDN]: Upload avatar bắt buộc thông qua ImageKit API.

### 2.2.3 Use Case Diagram — Nhóm Quản lý nội dung

**Hình 2.3 — Use Case Diagram: Nhóm Quản lý nội dung**

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              NHÓM: QUẢN LÝ NỘI DUNG                           │  │
│  │                                                                │  │
│  │   (UC-09) Tạo bài viết    ◄──────────────────── Member        │  │
│  │               │ «extend»   ◄──────────────────── Bot          │  │
│  │               ▼                                                │  │
│  │         [Block Layout]                                         │  │
│  │                                                                │  │
│  │   (UC-10) Sửa bài viết   ◄──────────────┬───── Member(tg)    │  │
│  │                          ◄──────────────┘───── Admin          │  │
│  │                                                                │  │
│  │   (UC-11) Xóa bài viết   ◄──────────┬────────── Member(tg)   │  │
│  │                          ◄──────────┼────────── Moderator     │  │
│  │                          ◄──────────┘────────── Admin         │  │
│  │                                                                │  │
│  │   (UC-12) Tạo bình luận  ◄───────────────────── Member        │  │
│  │               │ «extend»                                       │  │
│  │               ▼                                                │  │
│  │   (UC-13) Reply comment  ◄───────────────────── Member        │  │
│  │               │ «extend»                                       │  │
│  │               ▼                                                │  │
│  │   (UC-14) Quote comment  ◄───────────────────── Member        │  │
│  │                                                                │  │
│  │   (UC-15) Sửa comment    ◄───────────────────── Member(tg)    │  │
│  │       [constraint: COMMENT_EDIT_TIME_LIMIT giây]              │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**Ghi chú:** "(tg)" = tác giả (chính chủ). Các member chỉ có thể sửa/xóa bài viết và comment của chính mình, trừ Moderator và Admin có thể thao tác bài của người khác.

### 2.2.4 Use Case Diagram — Nhóm Tương tác và Quản trị

**Hình 2.4 — Use Case Diagram: Tương tác Cộng đồng & Quản trị Hệ thống**

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │            NHÓM: TƯƠNG TÁC CỘNG ĐỒNG                          │  │
│  │                                                                │  │
│  │   (UC-16) Vote post       ◄─────── Member                     │  │
│  │   (UC-17) Vote comment    ◄─────── Member                     │  │
│  │         │ «include»                                            │  │
│  │         ▼                                                      │  │
│  │   [Cập nhật Reputation]                                        │  │
│  │                                                                │  │
│  │   (UC-18) Bookmark post   ◄─────── Member                     │  │
│  │                                                                │  │
│  │   (UC-19) Full-text search◄──────────┬── Member               │  │
│  │                          ◄──────────┘── Guest                 │  │
│  │                                                                │  │
│  │   (UC-20) SSE Notification◄─────── Member (passive)           │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │            NHÓM: QUẢN TRỊ HỆ THỐNG                            │  │
│  │                                                                │  │
│  │   (UC-21) CRUD category   ◄─────── Admin                      │  │
│  │   (UC-22) CRUD tag        ◄─────── Admin                      │  │
│  │                                                                │  │
│  │   (UC-23) Báo cáo VP      ◄─────── Member                     │  │
│  │                  │                                             │  │
│  │                  ▼                                             │  │
│  │   (UC-24) Xử lý báo cáo  ◄──────────┬── Moderator            │  │
│  │                          ◄──────────┘── Admin                 │  │
│  │              │ «include»                                       │  │
│  │              ▼                                                 │  │
│  │         [Ghi Audit Log]                                        │  │
│  │                                                                │  │
│  │   (UC-25) Xem audit log   ◄─────── Admin                      │  │
│  │   (UC-26) Dashboard stats ◄──────────┬── Admin                │  │
│  │                          ◄──────────┘── Moderator             │  │
│  │   (UC-27) Ghim bài viết   ◄─────── Admin                      │  │
│  │   (UC-28) Khóa thread     ◄──────────┬── Admin                │  │
│  │                          ◄──────────┘── Moderator             │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2.3 Đặc tả Use Case chi tiết

### 2.3.1 UC-01: Đăng ký tài khoản

**Bảng 2.4 — Đặc tả UC-01: Đăng ký tài khoản**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-01 |
| **Tên** | Đăng ký tài khoản |
| **Actor chính** | Guest |
| **Actor phụ** | Brevo Email Service (hệ thống bên ngoài) |
| **Mô tả** | Người dùng mới tạo tài khoản trong hệ thống, bắt buộc xác thực email bằng OTP trước khi kích hoạt |
| **Precondition** | 1. Email chưa tồn tại trong bảng `users` <br> 2. Username chưa tồn tại trong bảng `users` |
| **Postcondition** | Tài khoản được tạo với `is_active = true`, `is_verified = true`, `role = MEMBER` |
| **Trigger** | Guest nhấn nút "Đăng ký" trên trang chủ |

**Main Flow (Luồng chính):**

| Bước | Hành động người dùng | Phản hồi hệ thống |
|:----:|---------------------|------------------|
| 1 | Truy cập trang đăng ký, nhập: email, username, password | — |
| 2 | Nhấn "Đăng ký" | Validate với Zod schema: email đúng format, password ≥ 8 ký tự, username chỉ chứa ký tự hợp lệ |
| 3 | — | `prisma.users.findUnique({ where: { email } })` — kiểm tra email chưa tồn tại |
| 4 | — | `prisma.users.findUnique({ where: { username } })` — kiểm tra username chưa tồn tại |
| 5 | — | `bcrypt.hash(password, 10)` — hash mật khẩu |
| 6 | — | Tạo record `users` với `is_active = false`, `role = MEMBER` |
| 7 | — | Tạo OTP 6 chữ số ngẫu nhiên, lưu vào `otp_tokens` với `expires_at = now + TTL` |
| 8 | — | Gọi Brevo API gửi email chứa mã OTP đến email đã nhập |
| 9 | Nhận email, nhập mã OTP vào form xác thực | — |
| 10 | — | Tìm `otp_tokens` theo email + code + `purpose = REGISTER` |
| 11 | — | Kiểm tra `expires_at > now()` (OTP còn hạn) |
| 12 | — | Cập nhật `users.is_active = true`, `users.is_verified = true`; xóa record `otp_tokens` |
| 13 | — | Trả về `201 Created` + thông báo đăng ký thành công |

**Alternative Flows (Luồng ngoại lệ):**

| Mã | Điều kiện kích hoạt | Xử lý |
|:--:|---------------------|-------|
| **2a** | Email không đúng format | Trả về `400 Bad Request` "Email không hợp lệ" |
| **2b** | Password ít hơn 8 ký tự | Trả về `400` "Mật khẩu phải có ít nhất 8 ký tự" |
| **3a** | Email đã tồn tại trong DB | Trả về `409 Conflict` "Email đã được đăng ký" |
| **4a** | Username đã tồn tại trong DB | Trả về `409 Conflict` "Username đã được sử dụng" |
| **8a** | Gửi email thất bại (Brevo API lỗi) | Log lỗi, retry tối đa 3 lần với exponential backoff; nếu vẫn thất bại → `500 Internal Server Error` |
| **11a** | OTP sai mã | Trả về `400` "Mã OTP không đúng" (không tiết lộ OTP đúng) |
| **11b** | OTP hết hạn (`expires_at < now()`) | Trả về `400` "Mã OTP đã hết hạn"; hiển thị nút "Gửi lại OTP" |

**Business Rules áp dụng:**
- **BR-01:** Mỗi địa chỉ email chỉ được đăng ký một tài khoản duy nhất (UNIQUE constraint).
- **BR-02:** OTP có TTL cấu hình qua environment variable (`OTP_TTL`), không hardcode.
- **BR-03:** Rate limiting áp dụng trên `/auth/register` để ngăn abuse (tạo hàng loạt tài khoản).

---

### 2.3.2 UC-03: Đăng nhập hệ thống

**Bảng 2.5 — Đặc tả UC-03: Đăng nhập hệ thống**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-03 |
| **Tên** | Đăng nhập hệ thống |
| **Actor chính** | Member / Admin / Bot |
| **Mô tả** | Người dùng xác thực danh tính để nhận JWT access token và refresh token |
| **Precondition** | 1. Tài khoản đã xác thực OTP (`is_active = true`, `is_verified = true`) <br> 2. Tài khoản chưa bị ban (`is_banned = false`) |
| **Postcondition** | Client nhận: `accessToken` trong response body (lưu trong memory), `refreshToken` trong httpOnly cookie |

**Main Flow:**

| Bước | Hành động | Chi tiết kỹ thuật |
|:----:|----------|-----------------|
| 1 | Nhập email + password | — |
| 2 | — | Zod validate: email format, password không rỗng |
| 3 | — | `prisma.users.findUnique({ where: { email } })` |
| 4 | — | `bcrypt.compare(plainPassword, user.password_hash)` |
| 5 | — | Kiểm tra `user.is_active === true` và `user.is_banned !== true` |
| 6 | — | `jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' })` → `accessToken` |
| 7 | — | Tạo `refreshToken = uuid()` → lưu vào `refresh_tokens` với `expires_at = now + 7d` |
| 8 | — | Ghi `audit_logs`: action `LOGIN`, target_type `USER`, target_id = userId |
| 9 | — | Response: `{ accessToken }` + `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict` |

**Luồng Refresh Token (liên quan):**

```
  [accessToken hết hạn (15 min)]
        │
        ▼
  Client POST /auth/refresh
  (Cookie refreshToken tự động đính kèm)
        │
        ▼
  Backend: Validate refresh_tokens table
  → Check expires_at > now()
  → Sign new accessToken
        │
        ▼
  Response: { newAccessToken }
```

**Security Notes:**
- `refreshToken` lưu trong `httpOnly cookie` → JavaScript không thể đọc → Bảo vệ XSS.
- `accessToken` lưu trong memory (React state) → Không lưu `localStorage` → Không bị XSS đọc.
- Mỗi lần `logout` xóa record trong `refresh_tokens` → **Token Revocation** hoàn toàn.
- Nếu phát hiện token bị đánh cắp: Admin xóa tất cả refresh_tokens của user là đủ.

---

### 2.3.3 UC-09: Tạo bài viết

**Bảng 2.6 — Đặc tả UC-09: Tạo bài viết**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-09 |
| **Tên** | Tạo bài viết |
| **Actor chính** | Member (cũng áp dụng cho Bot) |
| **Mô tả** | Thành viên tạo bài viết mới trong một danh mục hệ thống |
| **Precondition** | 1. User đã đăng nhập, JWT hợp lệ <br> 2. Category tồn tại và `post_permission` ≤ role của user <br> 3. Tài khoản chưa bị ban |
| **Postcondition** | Bài viết được tạo với `status = PUBLISHED` (mặc định); `categories.post_count += 1` |

**Main Flow:**

| Bước | Hành động | Chi tiết kỹ thuật |
|:----:|----------|-----------------|
| 1 | Điền form: title, content/blocks, category, tags | Frontend validate sơ bộ (required fields) |
| 2 | Submit `POST /posts` | `authMiddleware` verify JWT → gán `req.user = { id, role }` |
| 3 | — | `categoryService.checkPermission(categoryId, req.user.role)` → 403 nếu không đủ quyền |
| 4 | — | Zod validate: title không rỗng (max 255), category_id tồn tại, tags là array |
| 5 | — | `slugify(title) + '-' + timestamp` → tạo slug unique |
| 6 | — | `prisma.posts.create(...)` với `status = PUBLISHED`, `author_id = req.user.id` |
| 7 | — | **Nếu** `use_block_layout = true`: tạo nhiều records `post_blocks` theo `sort_order` |
| 8 | — | Với mỗi tag: `prisma.tags.upsert(...)` + tạo `post_tags` + tăng `tags.usage_count` |
| 9 | — | `prisma.categories.update({ data: { post_count: { increment: 1 } } })` |
| 10 | — | Trả về `201 Created` + bài viết mới kèm slug để redirect |

**Luồng thay thế:**

| Mã | Điều kiện | Xử lý |
|:--:|----------|-------|
| **2a** | JWT hết hạn (401) | Frontend interceptor tự động gọi `/auth/refresh`; nếu thành công retry request |
| **3a** | `post_permission = MODERATOR`, user là `MEMBER` | `403 Forbidden` "Không đủ quyền đăng bài trong danh mục này" |
| **4a** | Title rỗng hoặc quá dài (>255 chars) | `400 Bad Request` với Zod validation error |
| **5a** | Slug trùng sau khi thêm timestamp suffix | Append random suffix thêm cho đến khi unique |

**State Diagram — Trạng thái bài viết:**

**Hình 2.5 — State Machine: PostStatus**

```
                   ┌─────────────┐
                   │   INITIAL   │
                   └──────┬──────┘
                          │ Tạo bài viết
                  ┌───────┴──────────┐
                  ▼                  ▼
           ┌──────────┐       ┌──────────┐
           │  DRAFT   │       │PUBLISHED │
           │(lưu nháp)│       │(công bố) │
           └──────┬───┘       └────┬─────┘
                  │ Publish         │
                  └────────────────►│
                                    │ Admin/Mod ẩn
                                    ▼
                             ┌──────────┐
                             │  HIDDEN  │
                             │ (bị ẩn)  │◄─── Mod/Admin
                             └────┬─────┘
                                  │ Khôi phục
                                  │ (SHOW action)
                                  ▼
                             ┌──────────┐
                             │PUBLISHED │
                             └────┬─────┘
                                  │ Xóa
                                  ▼
                             ┌──────────┐
                             │ DELETED  │
                             │(soft del)│
                             └──────────┘
```

---

### 2.3.4 UC-16/17: Vote bài viết / bình luận

**Bảng 2.7 — Đặc tả UC-16: Vote bài viết**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-16 |
| **Tên** | Vote upvote/downvote bài viết |
| **Actor chính** | Member |
| **Precondition** | 1. Member đã đăng nhập <br> 2. Bài viết tồn tại, `status = PUBLISHED` <br> 3. Member không phải tác giả bài viết |
| **Postcondition** | Record `votes` được tạo hoặc cập nhật; `posts.upvote_count` / `posts.downvote_count` cập nhật; `users.reputation` của tác giả thay đổi |

**Main Flow — Vote lần đầu:**

```
  Member A gửi POST /votes
  { target_type: "POST", target_id: 5, value: 1 }
          │
          ▼
  Kiểm tra: A != tác giả bài 5 ?
          │ Đúng
          ▼
  prisma.votes.create({ user_id: A, target_type: POST, target_id: 5, value: 1 })
          │
          ├──► posts.upvote_count += 1
          │
          └──► users.reputation += UPVOTE_REPUTATION_DELTA (tác giả bài 5)
```

**Alternative Flow — Đổi chiều vote:**

```
  Member A đã vote upvote bài 5, nay muốn downvote:
          │
          ▼
  prisma.votes.update({ where: { user_id_target_type_target_id: ... }, data: { value: -1 } })
          │
          ├──► posts.upvote_count -= 1
          ├──► posts.downvote_count += 1
          │
          └──► users.reputation -= (UPVOTE_DELTA + DOWNVOTE_DELTA) (tác giả)
```

**Business Rules áp dụng:**
- **BR-10:** `UNIQUE(user_id, target_type, target_id)` constraint đảm bảo mỗi user chỉ có một vote cho mỗi mục tiêu.
- **BR-11:** User không thể vote cho bài/comment của chính mình (kiểm tra trong `voteService.ts`).
- **BR-12:** `value` chỉ nhận `+1` (upvote) hoặc `-1` (downvote).

---

### 2.3.5 UC-24: Xử lý báo cáo vi phạm

**Bảng 2.8 — Đặc tả UC-24: Xử lý báo cáo vi phạm**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-24 |
| **Tên** | Xử lý báo cáo vi phạm |
| **Actor chính** | Moderator / Admin |
| **Actor phụ** | Hệ thống Audit Log |
| **Precondition** | 1. Tồn tại ít nhất một report với `status = PENDING` <br> 2. Moderator/Admin đã đăng nhập vào admin-client |
| **Postcondition** | Report được cập nhật status (RESOLVED/DISMISSED/REVIEWING); hành động ghi vào `audit_logs` |

**Report Status State Machine:**

**Hình 2.6 — Quy trình xử lý báo cáo vi phạm**

```
                     ┌──────────────┐
  Member báo cáo ───►│   PENDING    │
                     └──────┬───────┘
                            │ Mod bắt đầu xem
                            ▼
                     ┌──────────────┐
                     │  REVIEWING   │
                     └──────┬───────┘
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
     ┌────────────────┐          ┌──────────────────┐
     │    RESOLVED    │          │    DISMISSED     │
     │(xác nhận VP,   │          │(không vi phạm,   │
     │ đã xử phạt)    │          │ bỏ qua báo cáo)  │
     └────────────────┘          └──────────────────┘
```

**Main Flow:**

| Bước | Hành động | Chi tiết |
|:----:|----------|---------|
| 1 | Moderator mở trang Reports trên admin-client | Hiển thị danh sách `reports` với `status = PENDING`, sort by `created_at DESC` |
| 2 | Chọn một report để xem chi tiết | Hiển thị: nội dung bị báo cáo, lý do, lịch sử báo cáo của reporter |
| 3 | Cập nhật `status = REVIEWING`, `reviewed_by = mod.id` | Đánh dấu đang xem xét |
| 4a | **RESOLVE:** Xác nhận vi phạm | `reports.status = RESOLVED`; chọn hành động: xóa bài / ẩn comment / ban user |
| 4b | **DISMISS:** Xác nhận không vi phạm | `reports.status = DISMISSED`, `review_note = "Nội dung không vi phạm quy định"` |
| 5 | — | **BẮT BUỘC:** Ghi `audit_logs`: action `UPDATE`, target_type `REPORT`, target_id = report.id |
| 6 | — | Nếu có thêm action (xóa bài, ban user): Ghi thêm audit_log cho action đó |
| 7 | — | Cập nhật `reports.reviewed_at = now()` |

**Business Rules áp dụng:**
- **BR-13:** Mọi hành động xử lý báo cáo **bắt buộc** ghi vào `audit_logs` — không có exception.
- **BR-14:** Moderator không thể xóa audit log — đây là bất biến (immutable) của hệ thống.
- **BR-15:** `review_note` nên được điền để giải thích quyết định (khuyến nghị, không bắt buộc).

---

### 2.3.6 UC-12/13: Tạo bình luận và Reply

**Bảng 2.9 — Đặc tả UC-12/13: Tạo bình luận**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-12, UC-13 |
| **Tên** | Tạo bình luận / Reply bình luận |
| **Actor chính** | Member |
| **Precondition** | 1. Bài viết `status = PUBLISHED` <br> 2. Bài viết `is_locked = false` <br> 3. Category `comment_permission` ≤ role của user |
| **Postcondition** | Record `comments` được tạo; `posts.comment_count += 1`; notification gửi đến tác giả bài viết (nếu là comment gốc) hoặc tác giả comment cha (nếu là reply) |

**Cấu trúc cây Comment (2 cấp):**

**Hình 2.7 — Cấu trúc cây bình luận 2 cấp**

```
┌─────────────────────────────────────────────────────┐
│  BÀI VIẾT: "Hướng dẫn sử dụng React Query"          │
│                                                     │
│  ▼ COMMENT GỐC (parent_id = NULL)                   │
│  ┌───────────────────────────────────────────┐      │
│  │ [Comment #1] — User A                     │      │
│  │ "Bài viết rất hay, cảm ơn tác giả!"       │      │
│  │ ↳ REPLY (parent_id = #1)                  │      │
│  │   ┌─────────────────────────────────┐     │      │
│  │   │ [Comment #3] — User B           │     │      │
│  │   │ "Đồng ý! Đặc biệt phần cache."  │     │      │
│  │   └─────────────────────────────────┘     │      │
│  │   ┌─────────────────────────────────┐     │      │
│  │   │ [Comment #5] — User C           │     │      │
│  │   │ "Tôi gặp lỗi ở bước 3, help?"  │     │      │
│  │   └─────────────────────────────────┘     │      │
│  └───────────────────────────────────────────┘      │
│                                                     │
│  ▼ COMMENT GỐC #2                                   │
│  ┌───────────────────────────────────────────┐      │
│  │ [Comment #2] — User D                     │      │
│  │ "Có thể demo với TypeScript không?"        │      │
│  │ ↳ REPLY (parent_id = #2)                  │      │
│  │   ┌─────────────────────────────────┐     │      │
│  │   │ [Comment #4] — User A (tác giả)│      │      │
│  │   │ "Vâng, tôi sẽ update phần 2!"  │     │      │
│  │   └─────────────────────────────────┘     │      │
│  └───────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘

  Rule: Reply (cấp 2) KHÔNG được reply tiếp → chỉ 2 cấp
  Rule: parent_id chỉ trỏ đến root comment (parent_id = NULL)
```

**Business Rule:** `parent_id` chỉ được tham chiếu đến root comment (comment có `parent_id = NULL`). Khi reply một reply (cấp 2), hệ thống tự động gán `parent_id = reply.parent_id` (leo lên cấp 1). Đây là quyết định thiết kế để tránh cây comment sâu vô hạn.

---

### 2.3.7 UC-20: Thông báo thời gian thực (SSE)

**Bảng 2.10 — Đặc tả UC-20: Nhận thông báo SSE**

| Trường | Nội dung |
|--------|---------|
| **Mã UC** | UC-20 |
| **Tên** | Nhận thông báo thời gian thực |
| **Actor chính** | Member (passive actor — hệ thống chủ động gửi) |
| **Mô tả** | Hệ thống push notification đến client khi có sự kiện liên quan đến người dùng |

**Kiến trúc SSE:**

**Hình 2.8 — Kiến trúc Server-Sent Events**

```
  Client (Browser)                    Backend
       │                                 │
       │  GET /notifications/stream      │
       │  Authorization: Bearer <token>  │
       │────────────────────────────────►│
       │                                 │── authMiddleware verify JWT
       │                                 │── Thêm res vào SSEConnectionMap
       │  HTTP 200                       │   (userId → Response object)
       │  Content-Type: text/event-stream│
       │  Connection: keep-alive         │
       │◄────────────────────────────────│
       │                                 │
       │  [Kết nối mở liên tục]          │
       │◄────────────────────────────────│
       │                                 │
       │  [User B comment vào bài User A]│
       │                                 │── Tạo notification record
       │                                 │── Lookup SSEConnectionMap[userId_A]
       │                                 │── res.write("data: {...}\n\n")
       │  data: {"type":"COMMENT",       │
       │         "title":"Bình luận mới",│
       │         "content":"User B..."}  │
       │◄────────────────────────────────│
```

**Các loại thông báo (NotificationType enum):**

| Loại | Trigger | Nội dung thông báo |
|------|---------|------------------|
| `COMMENT` | Có người comment bài của mình | "Có bình luận mới trong bài [title]" |
| `REPLY` | Có người reply comment của mình | "User X đã trả lời bình luận của bạn" |
| `MENTION` | Bị nhắc đến trong comment | "User X đã nhắc đến bạn" |
| `UPVOTE` | Bài viết/comment nhận upvote | "Bài viết của bạn nhận được upvote" |
| `SYSTEM` | Thông báo từ Admin (ban, warn) | Nội dung tùy theo action |

---

## 2.4 Business Rules tổng hợp

### 2.4.1 Quy tắc nghiệp vụ về nội dung

**Bảng 2.11 — Business Rules về nội dung**

| ID | Quy tắc | Nguồn implementation |
|:--:|--------|:-------------------:|
| **BR-C01** | Slug của bài viết phải unique trong toàn bộ bảng `posts` | `posts.slug UNIQUE constraint` (DB level) |
| **BR-C02** | Comment chỉ chỉnh sửa được trong `COMMENT_EDIT_TIME_LIMIT` giây kể từ khi tạo | `commentController.ts` kiểm tra `createdAt + limit > now()` |
| **BR-C03** | Cây comment chỉ có 2 cấp: root và reply (không thể reply một reply) | `parent_id` chỉ được tham chiếu root comment |
| **BR-C04** | Xóa bài viết là **soft delete** — dữ liệu vẫn còn trong DB với `status = DELETED` | `PostStatus.DELETED` (không `DELETE` SQL) |
| **BR-C05** | Khi `is_locked = true`, không tạo được comment mới trên bài đó | `commentService.ts` kiểm tra `post.is_locked` |
| **BR-C06** | Bài viết dùng Block Layout: `posts.content` để rỗng, nội dung thực lưu trong `post_blocks` | `use_block_layout = true` flag |
| **BR-C07** | Mỗi bài viết chỉ thuộc một category duy nhất | `posts.category_id FK` (NOT NULL, no M:N) |

### 2.4.2 Quy tắc nghiệp vụ về phân quyền

**Bảng 2.12 — Business Rules về phân quyền**

| ID | Quy tắc | Nguồn implementation |
|:--:|--------|:-------------------:|
| **BR-P01** | Guest chỉ xem được category có `view_permission = ALL` | `categoryService.ts` filter theo `view_permission` |
| **BR-P02** | Permission check theo thứ tự tuyến tính: ALL < MEMBER < MODERATOR < ADMIN | `PermissionLevel` enum với numeric ordering |
| **BR-P03** | Bot có thể tạo bài viết và comment nhưng KHÔNG thể vote hay bookmark | Logic trong `vibe-content` service |
| **BR-P04** | Admin không thể bị ban bởi Moderator | Role hierarchy check trong `userService.ts` |
| **BR-P05** | Moderator chỉ có thể thay đổi role của MEMBER (không thể thay đổi role Admin khác) | `adminController.ts` kiểm tra target user role |

### 2.4.3 Quy tắc nghiệp vụ về Reputation

**Bảng 2.13 — Business Rules về Reputation**

| ID | Quy tắc | Công thức | Nguồn |
|:--:|--------|:---------:|-------|
| **BR-R01** | Upvote bài viết → tác giả nhận điểm dương | `reputation += UPVOTE_REPUTATION_DELTA` | `voteService.ts` |
| **BR-R02** | Downvote bài viết → tác giả mất điểm | `reputation -= DOWNVOTE_REPUTATION_DELTA` | `voteService.ts` |
| **BR-R03** | Upvote comment → tác giả nhận điểm dương | `reputation += UPVOTE_REPUTATION_DELTA` | `voteService.ts` |
| **BR-R04** | User KHÔNG thể tự vote bài/comment của chính mình | `if (target.author_id === req.user.id) throw 403` | `voteService.ts` |
| **BR-R05** | Mỗi user chỉ vote MỘT LẦN cho mỗi mục tiêu (có thể đổi chiều) | `UNIQUE(user_id, target_type, target_id)` | DB constraint |
| **BR-R06** | Khi bài viết bị xóa, vote history vẫn còn trong DB (cascade xóa votes cùng bài) | `onDelete: Cascade` trong Prisma schema | Schema |

### 2.4.4 Quy tắc nghiệp vụ về Audit

**Bảng 2.14 — Business Rules về Audit Trail**

| ID | Quy tắc | Ý nghĩa |
|:--:|--------|--------|
| **BR-A01** | Mọi hành động của Admin/Moderator đều ghi vào `audit_logs` — không có ngoại lệ | Accountability và truy vết |
| **BR-A02** | `audit_logs` là immutable — không có API xóa hoặc sửa | Tính toàn vẹn nhật ký |
| **BR-A03** | Audit log ghi: `action`, `target_type`, `target_id`, `old_value`, `new_value`, `ip_address` | Đủ thông tin để tái hiện sự kiện |
| **BR-A04** | Login/Logout cũng được ghi vào audit_logs | Phát hiện truy cập bất thường |

**Bảng 2.15 — Danh sách AuditAction và AuditTarget**

| AuditAction | AuditTarget | Ý nghĩa |
|:----------:|:-----------:|--------|
| `CREATE` | `POST`, `COMMENT`, `CATEGORY`, `TAG` | Tạo mới đối tượng |
| `UPDATE` | `USER`, `POST`, `COMMENT`, `CATEGORY`, `TAG`, `REPORT`, `SETTINGS` | Cập nhật đối tượng |
| `DELETE` | `POST`, `COMMENT`, `CATEGORY`, `TAG` | Xóa đối tượng |
| `LOGIN` | `USER` | Đăng nhập thành công |
| `LOGOUT` | `USER` | Đăng xuất |
| `PIN` / `UNPIN` | `POST` | Ghim / bỏ ghim bài viết |
| `LOCK` / `UNLOCK` | `POST` | Khóa / mở khóa thread |
| `HIDE` / `SHOW` | `POST`, `COMMENT` | Ẩn / hiện nội dung |
| `BAN` / `UNBAN` | `USER` | Ban / gỡ ban tài khoản |
| `ROLE_CHANGE` | `USER` | Thay đổi role người dùng |
| `VIEW_MASKED_CONTENT` | `COMMENT` | Xem nội dung đã bị mask |

---

## 2.5 Đặc tả API Endpoints chính

### 2.5.1 Module Auth

**Bảng 2.16 — API Endpoints: Module Auth**

| Method | Endpoint | Auth | Mô tả |
|:------:|---------|:----:|-------|
| `POST` | `/auth/register` | — | Đăng ký tài khoản (UC-01) |
| `POST` | `/auth/verify-otp` | — | Xác thực OTP (UC-02) |
| `POST` | `/auth/login` | — | Đăng nhập (UC-03) |
| `POST` | `/auth/refresh` | Cookie | Refresh access token |
| `POST` | `/auth/logout` | Bearer | Đăng xuất, xóa refresh token |
| `POST` | `/auth/forgot-password` | — | Yêu cầu reset mật khẩu (UC-06) |
| `POST` | `/auth/reset-password` | — | Đặt lại mật khẩu sau OTP |
| `PUT` | `/auth/change-password` | Bearer | Đổi mật khẩu (UC-05) |

### 2.5.2 Module Post

**Bảng 2.17 — API Endpoints: Module Post**

| Method | Endpoint | Auth | Mô tả |
|:------:|---------|:----:|-------|
| `GET` | `/posts` | Optional | Lấy danh sách bài viết (phân trang, filter) |
| `GET` | `/posts/:slug` | Optional | Lấy chi tiết bài viết theo slug |
| `POST` | `/posts` | Bearer (MEMBER+) | Tạo bài viết (UC-09) |
| `PUT` | `/posts/:id` | Bearer | Chỉnh sửa bài viết (UC-10) |
| `DELETE` | `/posts/:id` | Bearer | Xóa bài viết (UC-11) |
| `PATCH` | `/posts/:id/pin` | Bearer (ADMIN) | Ghim/bỏ ghim bài viết (UC-27) |
| `PATCH` | `/posts/:id/lock` | Bearer (MOD+) | Khóa/mở khóa thread (UC-28) |
| `PATCH` | `/posts/:id/hide` | Bearer (MOD+) | Ẩn bài viết |
| `GET` | `/posts/pinned` | Optional | Lấy danh sách bài viết được ghim |

---

## Tóm tắt chương 2

Chương 2 đã hoàn thành toàn bộ phân tích nghiệp vụ của hệ thống MINI-FORUM:

| Nội dung | Kết quả chính |
|:--------:|--------------|
| **Tác nhân** | 5 actor với phân cấp quyền hạn tuyến tính rõ ràng (Guest → Admin + Bot lateral) |
| **Ma trận phân quyền** | 22 chức năng được phân quyền chi tiết cho từng actor |
| **Use Cases** | 28 use case tổ chức thành 4 nhóm chức năng, bao phủ toàn bộ vòng đời nội dung |
| **Đặc tả chi tiết** | 7 use case tiêu biểu được đặc tả với main flow, alternative flow và business rules |
| **Business Rules** | 22 business rules được trích xuất trực tiếp từ codebase, phân loại theo 4 nhóm |
| **API Design** | 17 endpoints tiêu biểu được liệt kê với method, auth requirement và mô tả |

**Chương tiếp theo** sẽ chuyển hóa các use case và business rules này thành **mô hình dữ liệu** — ERD chi tiết, Data Dictionary và phân tích các quan hệ giữa các entity.
