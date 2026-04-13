# Tính Năng Gửi OTP Qua API Brevo

## Giới Thiệu

Tính năng này cho phép gửi mã OTP (One-Time Password) cho người dùng qua API Brevo thay vì SMTP truyền thống. Phương pháp này đáng tin cậy hơn, nhanh hơn và dễ quản lý hơn.

## Các Cải Tiến So Với SMTP

| Tiêu Chí | SMTP | API |
|---------|------|-----|
| **Tốc độ** | Chậm (phải kết nối SMTP server) | Nhanh (HTTP API) |
| **Độ tin cậy** | Có thể bị block hoặc timeout | Stable và reliable |
| **Cấu hình** | Phức tạp (multiple credentials) | Đơn giản (một API Key) |
| **Error Handling** | Khó debug | Dễ debug (HTTP status codes) |
| **Fallback** | Không có | Auto fallback đến SMTP |

## Cấu Hình

### 1. Lấy API Key từ Brevo

1. Đăng nhập vào [Brevo Dashboard](https://app.brevo.com/)
2. Đi tới **Settings** → **SMTP & API** → **API Keys**
3. Sao chép **API v3 Key**

### 2. Cập Nhật File .env

```bash
# Sử dụng API (RECOMMENDED)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxx

# Hoặc giữ SMTP làm fallback (tùy chọn)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_smtp_user
BREVO_SMTP_KEY=your_smtp_key
```

### 3. Các Biến Môi Trường Cần Thiết

```env
# Bắt buộc
BREVO_API_KEY=               # API Key từ Brevo
BREVO_FROM_EMAIL=            # Email sender
BREVO_FROM_NAME=             # Tên hiển thị

# OTP Configuration
OTP_LENGTH=6                 # Độ dài mã OTP
OTP_EXPIRATION_MINUTES=10    # Thời gian hết hạn
OTP_MAX_ATTEMPTS=3           # Số lần thử tối đa
OTP_RESEND_DELAY_SECONDS=30  # Thời gian chờ gửi lại
```

## Cách Hoạt Động

### Luồng Xử Lý OTP

```
User Request
    ↓
otpService.ts
    ├─ Tạo mã OTP ngẫu nhiên
    ├─ Lưu vào database
    └─ Gọi emailService.sendOtpEmail()
        ↓
    emailService.ts
        ├─ Kiểm tra: API Key có sẵn không?
        │   ├─ YES → brevoApiService.sendOtpEmailViaApi()
        │   └─ NO  → Fallback to SMTP (transporter)
        │
        └─ Gửi Email thành công
            ↓
        Response to User
```

### Sự Ưu Tiên Gửi Email

1. **Ưu tiên 1**: API Brevo (nếu `BREVO_API_KEY` được cấu hình)
2. **Fallback**: SMTP Brevo (nếu API thất bại hoặc key không có)
3. **Error**: Nếu cả 2 đều không sẵn, sẽ throw error

## Các Endpoint Sử Dụng OTP

### 1. Gửi OTP Đăng Ký
```http
POST /api/v1/auth/send-otp-register
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationToken": "abc123...",
    "expiresIn": 600
  },
  "message": "OTP sent successfully"
}
```

### 2. Xác Nhận OTP Đăng Ký
```http
POST /api/v1/auth/verify-otp-register
Content-Type: application/json

{
  "email": "user@example.com",
  "verificationToken": "abc123...",
  "otp": "123456"
}
```

### 3. Gửi OTP Reset Mật Khẩu
```http
POST /api/v1/auth/send-otp-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 4. Xác Nhận OTP Reset
```http
POST /api/v1/auth/verify-otp-reset
Content-Type: application/json

{
  "email": "user@example.com",
  "verificationToken": "xyz789...",
  "otp": "123456"
}
```

## Các File Thay Đổi

### Tập Tin Mới
- `src/services/brevoApiService.ts` - Service gửi OTP qua API Brevo
- `src/types/brevo.d.ts` - Type definitions cho SDK

### Tập Tin Cập Nhật
- `src/config/index.ts` - Thêm `brevo.apiKey`
- `src/services/emailService.ts` - Thêm hỗ trợ API + Fallback SMTP
- `.env` - Bật `BREVO_API_KEY`
- `.env.example` - Hướng dẫn cấu hình

### Package.json
- Thêm dependency: `sib-api-v3-sdk` (SDK Brevo Official)

## Testing

### 1. Test Gửi OTP via API
```bash
curl -X POST http://localhost:5000/api/v1/auth/send-otp-register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 2. Xem Logs
Kiểm tra logs của application để xác nhận OTP được gửi thành công:
```
✓ OTP sent via Brevo API for test@example.com
```

### 3. Test Fallback to SMTP
- Tạm thời comment `BREVO_API_KEY` trong `.env`
- Gửi OTP lại
- System sẽ fallback to SMTP

## Xử Lý Lỗi

### Lỗi Thường Gặp

**1. "Brevo API key not configured"**
```
Nguyên nhân: BREVO_API_KEY chưa được cấu hình
Giải pháp: Thêm BREVO_API_KEY vào .env
```

**2. "Failed to send email via Brevo API"**
```
Nguyên nhân: API Key không hợp lệ hoặc Brevo API lỗi
Giải pháp:
- Kiểm tra BREVO_API_KEY
- Kiểm tra Brevo service status
- System sẽ tự động fallback to SMTP
```

**3. Mã OTP không được gửi**
```
Nguyên nhân: Email invalid hoặc rate limit
Giải pháp:
- Kiểm tra email format
- Chờ OTP_RESEND_DELAY_SECONDS trước khi gửi lại
```

## Tính Năng Bảo Mật

✅ **OTP được mã hóa bcrypt** - Không lưu mã gốc  
✅ **Verify token độc lập** - Ngăn chặn brute force  
✅ **Rate limiting** - Giới hạn số lần gửi/thử  
✅ **Expiration time** - OTP hết hạn sau vài phút  
✅ **Max attempts** - Phòng chống brute force attack  

## Logs và Monitoring

### Các Log Messages

```log
✓ OTP sent via Brevo API for user@example.com
✗ Brevo API error, falling back to SMTP: [error details]
✓ OTP verified successfully for user@example.com (register)
✗ Invalid OTP code for user@example.com
⚠ Resend delay not met for email: user@example.com (remaining: 30s)
```

## Tối Ưu Hóa Tương Lai

- [ ] Thêm SMS OTP support (Twilio, SNS)
- [ ] Queue system cho sending (Bull Queue, RabbitMQ)
- [ ] Metrics/Analytics cho OTP delivery success rate
- [ ] Custom email templates database
- [ ] Webhook support từ Brevo để track email status

## Tham Khảo

- [Brevo API Documentation](https://developers.brevo.com/docs/transactional-emails)
- [sib-api-v3-sdk GitHub](https://github.com/getbrevo/brevo-node)
- [OTP Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
