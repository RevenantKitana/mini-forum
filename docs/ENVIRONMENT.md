# Environment Variables — Mini Forum

Tổng hợp tất cả biến môi trường cần thiết cho từng sub-project.

---

## Backend (`backend/.env`)

### Server

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `PORT` | ❌ | `5000` | Port server |
| `NODE_ENV` | ❌ | `development` | `development` / `production` |

### Database

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |

Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`

### JWT

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | ✅ | - | Secret cho access token (tối thiểu 32 ký tự) |
| `JWT_REFRESH_SECRET` | ✅ | - | Secret cho refresh token (tối thiểu 32 ký tự) |
| `JWT_ACCESS_EXPIRES_IN` | ❌ | `15m` | Thời hạn access token |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | `7d` | Thời hạn refresh token |

### CORS

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `FRONTEND_URL` | ✅ | Danh sách origins cho phép, cách nhau bởi dấu phẩy |

Ví dụ: `http://localhost:5173,http://localhost:5174`

### Email (Brevo SMTP)

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `BREVO_SMTP_HOST` | ❌ | `smtp-relay.brevo.com` | Brevo SMTP host |
| `BREVO_SMTP_PORT` | ❌ | `587` | Brevo SMTP port |
| `BREVO_SMTP_USER` | ✅ | - | Brevo SMTP login (cho gửi OTP email) |
| `BREVO_SMTP_KEY` | ✅ | - | Brevo SMTP key |
| `BREVO_FROM_EMAIL` | ❌ | `noreply@example.com` | Email người gửi |
| `BREVO_FROM_NAME` | ❌ | `Mini Forum` | Tên người gửi |

### OTP

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `OTP_LENGTH` | ❌ | `6` | Số chữ số OTP |
| `OTP_EXPIRATION_MINUTES` | ❌ | `10` | Thời hạn OTP (phút) |
| `OTP_MAX_ATTEMPTS` | ❌ | `5` | Số lần thử tối đa |
| `OTP_RESEND_DELAY_SECONDS` | ❌ | `60` | Delay giữa các lần gửi (giây) |

### Comments

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `COMMENT_EDIT_TIME_LIMIT` | ❌ | `30` | Thời gian cho phép sửa comment (phút) |

### File .env mẫu

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mini_forum?schema=public

JWT_ACCESS_SECRET=change-this-to-random-32-characters-minimum
JWT_REFRESH_SECRET=change-this-to-different-32-characters-min
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173,http://localhost:5174

BREVO_SMTP_USER=your-brevo-smtp-login
BREVO_SMTP_KEY=your-brevo-smtp-key
BREVO_FROM_EMAIL=noreply@example.com
BREVO_FROM_NAME=Mini Forum

OTP_LENGTH=6
OTP_EXPIRATION_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_DELAY_SECONDS=60

COMMENT_EDIT_TIME_LIMIT=30
```

---

## Frontend (`frontend/.env.local`)

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `VITE_API_URL` | ✅ | - | URL backend API |
| `VITE_USE_MOCK_API` | ❌ | `false` | Sử dụng mock API (cho testing) |

### File .env.local mẫu

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_USE_MOCK_API=false
```

---

## Admin Client (`admin-client/.env.local`)

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `VITE_API_URL` | ✅ | - | URL backend API |

### File .env.local mẫu

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Vibe Content (`vibe-content/.env`)

### Forum API

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `FORUM_API_URL` | ✅ | - | URL backend API (cho bot post content) |

### Database

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (cùng DB với backend) |

### LLM Providers

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `GROQ_API_KEY` | ❌ | Groq API key (fallback) |
| `CEREBRAS_API_KEY` | ❌ | Cerebras API key (fallback) |

### Bot Configuration

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `BOT_PASSWORD` | ✅ | - | Mật khẩu chung cho tất cả bot users |

### Scheduler

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `CRON_SCHEDULE` | ❌ | `*/30 * * * *` | Cron expression cho scheduler |
| `BATCH_SIZE` | ❌ | `1` | Số actions mỗi lần chạy |

### Rate Limits

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `MAX_POSTS_PER_USER_DAY` | ❌ | `3` | Giới hạn bài viết/bot/ngày |
| `MAX_COMMENTS_PER_USER_DAY` | ❌ | `6` | Giới hạn bình luận/bot/ngày |
| `MAX_VOTES_PER_USER_DAY` | ❌ | `15` | Giới hạn vote/bot/ngày |

### LLM

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `PROVIDER_TIMEOUT_MS` | ❌ | `30000` | Timeout gọi LLM (ms) |

### Service

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `PORT` | ❌ | `4000` | Port service |
| `NODE_ENV` | ❌ | `development` | Environment |
| `LOG_LEVEL` | ❌ | `info` | Winston log level |

### File .env mẫu

```env
FORUM_API_URL=http://localhost:5000/api/v1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mini_forum?schema=public

GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=
CEREBRAS_API_KEY=

BOT_PASSWORD=BotUser@123

CRON_SCHEDULE=*/30 * * * *
BATCH_SIZE=1

MAX_POSTS_PER_USER_DAY=3
MAX_COMMENTS_PER_USER_DAY=6
MAX_VOTES_PER_USER_DAY=15

PROVIDER_TIMEOUT_MS=30000

PORT=4000
NODE_ENV=development
LOG_LEVEL=info
```

---

## Lưu ý bảo mật

- **Không commit** file `.env` vào Git
- JWT secrets phải ngẫu nhiên, tối thiểu 32 ký tự
- Sử dụng **App Password** cho Gmail SMTP (không dùng mật khẩu chính)
- Database password phải mạnh trong production
- API keys (Gemini, Groq, Cerebras) không chia sẻ công khai
- `FRONTEND_URL` chỉ chứa domain được phép trong production
