# CHƯƠNG 5 — TÍCH HỢP BLACKBOX: IMAGEKIT VÀ BREVO OTP MAIL SERVICE

---

## Giới thiệu chương

MINI-FORUM tích hợp hai **dịch vụ bên thứ ba dạng blackbox** — hệ thống gọi vào API/SDK của nhà cung cấp mà không kiểm soát được logic bên trong:

1. **ImageKit** — Lưu trữ, xử lý và phân phối media qua CDN toàn cầu
2. **Brevo (Sendinblue)** — Gửi email giao dịch (transactional email) phục vụ luồng xác thực OTP

---

## 5.1 Tổng quan kiến trúc tích hợp

### 5.1.1 Mô hình Adapter — Cô lập phụ thuộc bên thứ ba

MINI-FORUM áp dụng **Adapter Pattern** để cô lập dependency bên thứ ba khỏi business logic:

**Hình 5.1 — Vị trí hai dịch vụ bên thứ ba trong kiến trúc tổng thể**

```
╔══════════════════════════════════════════════════════════════════════╗
║                    MINI-FORUM SYSTEM BOUNDARY                       ║
║                                                                     ║
║   Frontend / Admin-Client                                           ║
║         │ HTTP Request (multipart/form-data, JSON)                  ║
║         ▼                                                           ║
║   ┌─────────────────────────────────────────────────────────┐      ║
║   │              BACKEND (Express/TypeScript)               │      ║
║   │  ┌───────────────┐       ┌──────────────────────────┐  │      ║
║   │  │ userController│       │     authController       │  │      ║
║   │  │ postMedia     │       │  otpService              │  │      ║
║   │  │ Controller    │       │  emailService            │  │      ║
║   │  └───────┬───────┘       └────────────┬─────────────┘  │      ║
║   │  ┌───────▼───────┐       ┌────────────▼─────────────┐  │      ║
║   │  │imagekitService│       │    brevoApiService        │  │      ║
║   │  │  (Adapter)    │       │      (Adapter)            │  │      ║
║   │  └───────┬───────┘       └────────────┬─────────────┘  │      ║
║   └──────────┼────────────────────────────┼─────────────────┘      ║
╚══════════════╪════════════════════════════╪═════════════════════════╝
               ▼ HTTPS API calls            ▼ HTTPS API calls
    ┌──────────────────┐        ┌──────────────────────┐
    │    IMAGEKIT CDN  │        │    BREVO SMTP/API    │
    └──────────────────┘        └──────────────────────┘
```

**Bảng 5.1 — Phân tầng Adapter cho hai dịch vụ bên thứ ba**

| Tầng | ImageKit | Brevo | Vai trò |
|------|---------|-------|---------|
| **Consumer** | `userController`, `postMediaService` | `otpService`, `authService` | Gọi interface nội bộ; không biết nhà cung cấp cụ thể |
| **Facade/Adapter** | `imagekitService.ts` | `emailService.ts` → `brevoApiService.ts` | Ẩn chi tiết SDK, chuyển đổi giao thức |
| **External SDK** | `@imagekit/nodejs` | `sib-api-v3-sdk` | Thư viện của nhà cung cấp |

Lợi ích: nếu cần thay ImageKit bằng Cloudinary, chỉ viết lại `imagekitService.ts` mà không thay đổi bất kỳ controller nào.

---

## 5.2 Tích hợp ImageKit — Lưu trữ và phân phối media

### 5.2.1 Cấu hình và Transformation Presets

```typescript
// Khởi tạo singleton client
const imagekit = new ImageKit({ privateKey: config.imagekit.privateKey });

// Hai preset cố định — consumer không tùy ý truyền tham số
const TRANSFORMATION_PRESETS = {
  preview:  [{ width: 300,  height: 300, crop: 'force', quality: 80, format: 'webp' }],
  standard: [{ width: 1200, quality: 85, format: 'webp' }],
};
```

**Bảng 5.2 — So sánh hai Transformation Preset**

| Tiêu chí | `preview` | `standard` |
|---------|-----------|-----------|
| Kích thước | 300×300 px (crop center) | Tối đa 1200px chiều rộng |
| Mục đích | Thumbnail, avatar, danh sách | Ảnh chi tiết, xem đầy đủ |
| Dung lượng ước tính | ~10–30 KB | ~80–200 KB |

Transformation được thực hiện **on-the-fly** trên CDN ImageKit — `getTransformedUrl()` là pure function, không gọi network, không tăng latency backend.

### 5.2.2 Luồng upload Avatar và Media bài viết

**Hình 5.2 — Sequence Diagram: Upload Avatar**

```
Client → PUT /users/:id (multipart)
  → userController: getAvatarImagekitFileId(id) từ DB
  → imagekitService.uploadImage(buffer, 'avatar_{id}_{ts}', '/avatars')
      → ImageKit API: POST /v1/files/upload
      ← {fileId, filePath, url}
  → getTransformedUrl(filePath, 'preview')  → CDN URL #1
  → getTransformedUrl(filePath, 'standard') → CDN URL #2
  → DB: uploadAvatarToImageKit(id, {fileId, preview_url, standard_url})
  → [fire-and-forget] deleteImage(oldFileId)  ← không await, không throw
  ← 200 {user data}
```

**Điểm thiết kế**: Xóa file cũ thực hiện theo kiểu **fire-and-forget** — upload mới thành công là đủ; rác tạm thời trên ImageKit được xử lý bởi script `cleanupImagekit.ts`.

Upload media bài viết (`postMediaService`) tương tự nhưng hỗ trợ nhiều file, giới hạn `MAX_MEDIA_PER_POST = 10`, naming convention `post_{id}_{timestamp}_{index}`.

### 5.2.3 Schema Database lưu metadata ImageKit

```sql
-- Bảng users: lưu avatar
users.avatar_imagekit_file_id VARCHAR   -- dùng để xóa file
users.avatar_preview_url      VARCHAR   -- CDN URL 300×300 webp
users.avatar_standard_url     VARCHAR   -- CDN URL 1200px webp

-- Bảng post_media: lưu ảnh bài viết
CREATE TABLE post_media (
  id               SERIAL PRIMARY KEY,
  post_id          INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  imagekit_file_id VARCHAR NOT NULL,
  preview_url      VARCHAR NOT NULL,
  standard_url     VARCHAR NOT NULL,
  sort_order       INTEGER NOT NULL,
  block_id         INTEGER REFERENCES post_blocks(id) ON DELETE SET NULL
);
```

---

## 5.3 Tích hợp Brevo — OTP Mail Service

### 5.3.1 Kiến trúc phân tầng Email Service

MINI-FORUM tách email integration thành hai tầng:

```
otpService.ts
    │ sendOtpEmail(to, otp, purpose, expiresInMinutes)
    ▼
emailService.ts  ←── Facade: validate, logging, error wrapping
    │ sendOtpEmailViaApi({to, otp, purpose, expiresInMinutes})
    ▼
brevoApiService.ts  ←── Adapter: tương tác sib-api-v3-sdk
    │ dynamic import('sib-api-v3-sdk')  ←── Lazy loading cho ESM compat
    ▼
Brevo API (HTTPS) → Hộp thư người dùng
```

`emailService.ts` đóng vai trò Facade: cho phép thêm fallback provider (SendGrid, Mailgun) hoặc retry logic sau này mà không thay đổi `otpService.ts`.

### 5.3.2 Xử lý CJS/ESM Compatibility

`sib-api-v3-sdk` là CommonJS module trong khi backend chạy ở ESM mode. Giải pháp là **lazy dynamic import**:

```typescript
let sibApiV3Sdk: any;
async function getSibApiV3Sdk(): Promise<any> {
  if (!sibApiV3Sdk) sibApiV3Sdk = await import('sib-api-v3-sdk');
  return sibApiV3Sdk;
}
// Trong sendOtpEmailViaApi():
const rawSdk = await getSibApiV3Sdk();
const SibApiV3Sdk = rawSdk.default ?? rawSdk;  // Handle ESM vs test env
// Tạo instance mới thay vì singleton — tránh state leak giữa requests
const apiClient = new SibApiV3Sdk.ApiClient();
apiClient.authentications['api-key'].apiKey = config.brevo.apiKey;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi(apiClient);
```

### 5.3.3 Luồng OTP đầy đủ — Đăng ký tài khoản

**Hình 5.3 — Sequence Diagram: OTP Registration Flow**

```
POST /auth/send-otp-register {email}
  → otpService.sendOtpForRegister(email)
  → [DB] kiểm tra email trùng lặp
  → checkResendDelay(email, REGISTER)
  → crypto.randomInt() → OTP code (6 digits)
  → bcrypt.hash(code, SALT_ROUNDS=10) → hashed_code
  → crypto.randomBytes(32) → verificationToken
  → [DB] prisma.otps.create({email, hashed_code, verificationToken, expires_at})
  → emailService → brevoApiService.sendTransacEmail()
  ← 200 {verificationToken, expiresIn}

POST /auth/verify-otp-register {email, verificationToken, otp}
  → validateAndVerifyOtp(): kiểm tra token, TTL, max attempts
  → bcrypt.compare(inputOtp, hash)
  → [DB] prisma.otps.update(verified_at)
  → generateVerificationToken() → registrationToken
  ← 200 {registrationToken}

POST /auth/register {email, password, ..., registrationToken}
  ← 201 {user, tokens}
```

### 5.3.4 Bảo mật OTP

**Bảng 5.3 — Các cơ chế bảo mật trong luồng OTP**

| Cơ chế | Cài đặt | Mục đích bảo vệ |
|--------|---------|----------------|
| **Bcrypt hash OTP** | `SALT_ROUNDS = 10` | Tránh lộ OTP nếu DB bị breach |
| **TTL** | `OTP_EXPIRATION_MINUTES` (env) | OTP hết hạn, không dùng lại |
| **Max attempts** | `OTP_MAX_ATTEMPTS` (env) | Brute-force protection |
| **Resend delay** | `OTP_RESEND_DELAY_SECONDS` (env) | Chống spam gửi OTP |
| **Verification token** | `crypto.randomBytes(32)` hex | Liên kết OTP với session cụ thể |
| **Security-neutral response** | Reset password luôn trả về 200 | Tránh email enumeration attack |
| **Crypto-secure OTP** | `crypto.randomInt()` | Tránh predictable OTP từ `Math.random()` |

Luồng **đặt lại mật khẩu** luôn trả về 200 dù email không tồn tại (OWASP A07 — tránh tiết lộ thông tin người dùng):

```typescript
if (!existingUser || !existingUser.is_active) {
  return { verificationToken: generateVerificationToken(), expiresIn: ... };
  // Trả về token giả — không tiết lộ email có tồn tại hay không
}
```

---

## 5.4 Quản lý biến môi trường và bảo mật credential

**Bảng 5.4 — Biến môi trường cho hai dịch vụ bên thứ ba**

| Biến | Dịch vụ | Độ nhạy cảm |
|-----|---------|------------|
| `IMAGEKIT_PUBLIC_KEY` | ImageKit | Thấp (build CDN URL) |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit | **Cao** (upload/delete) |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit | Thấp |
| `BREVO_API_KEY` | Brevo | **Cao** (gửi email) |
| `BREVO_FROM_EMAIL` / `BREVO_FROM_NAME` | Brevo | Thấp |
| `OTP_EXPIRATION_MINUTES` / `OTP_MAX_ATTEMPTS` / `OTP_RESEND_DELAY_SECONDS` | OTP logic | Thấp |

**Chiến lược bảo vệ**: Tất cả biến trên đều nằm trong `requiredEnvVars` — server crash có kiểm soát nếu thiếu. `IMAGEKIT_PRIVATE_KEY` chỉ dùng server-side, không bao giờ trả về client. Trên Render.com, secrets được nhập qua Environment Variables UI, không nằm trong `Dockerfile` hay `render.json`.

---

## 5.5 Xử lý lỗi và resilience

**Bảng 5.5 — So sánh chiến lược tích hợp ImageKit vs. Brevo**

| Khía cạnh | ImageKit | Brevo |
|----------|---------|-------|
| **SDK** | `@imagekit/nodejs` (ESM native) | `sib-api-v3-sdk` (CJS, lazy import) |
| **Khởi tạo** | Module-level singleton | Per-request instance |
| **Upload/Gửi** | Blocking (thất bại → lỗi request) | Blocking (thất bại → lỗi request) |
| **Delete/Cleanup** | Non-blocking (fire-and-forget) | N/A |
| **Lưu metadata** | `imagekit_file_id` trong DB | Chỉ `messageId` trong logs |
| **Script bảo trì** | `cleanupImagekit.ts` xóa rác | Không cần (email là ephemeral) |

**Nguyên tắc phân biệt**: Xóa ảnh cũ sau khi upload mới → non-blocking (upload đã thành công, rác không ảnh hưởng user). Gửi OTP → blocking (không thể "đăng ký thành công" mà user không nhận được OTP để xác thực).

Chiến lược xóa media bài viết: ưu tiên tính nhất quán DB — nếu xóa file trên ImageKit thất bại, DB record vẫn bị xóa để tránh dangling reference; rác trên ImageKit được xử lý bởi script cleanup.

---

## Tóm tắt chương

| | ImageKit | Brevo |
|--|---------|-------|
| **Chức năng** | Lưu trữ + CDN media | Gửi OTP email |
| **Pattern tích hợp** | Adapter + singleton client | Adapter + facade + lazy import |
| **Điểm nổi bật** | URL transform on-the-fly, memoryStorage (không ghi disk) | bcrypt OTP hash, ESM/CJS compat, email enumeration prevention |
| **Mock trong test** | `vi.mock('@imagekit/nodejs')` | `vi.mock('../services/brevoApiService')` |

---

*[Tiếp theo: Chương 6 — Bảo mật và kiểm soát truy cập]*
