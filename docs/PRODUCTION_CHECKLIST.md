# Production Release Checklist

Thực hiện toàn bộ checklist này trước mỗi lần deploy lên môi trường production.

---

## 1. Environment Variables

### Backend (`backend/.env`)
- [ ] `DATABASE_URL` — trỏ đúng database production (không phải localhost)
- [ ] `DIRECT_URL` — đặt nếu dùng pgbouncer/connection pooling
- [ ] `JWT_ACCESS_SECRET` — chuỗi ngẫu nhiên tối thiểu 32 ký tự, khác với dev
- [ ] `JWT_REFRESH_SECRET` — chuỗi ngẫu nhiên tối thiểu 32 ký tự, khác với dev
- [ ] `JWT_ACCESS_EXPIRES_IN` — ví dụ `15m`
- [ ] `JWT_REFRESH_EXPIRES_IN` — ví dụ `7d`
- [ ] `FRONTEND_URL` — danh sách domain production, phân cách bằng dấu phẩy (không có dấu cách), không dấu `/` cuối
- [ ] `BREVO_API_KEY` — API key production của Brevo email service
- [ ] `BREVO_FROM_EMAIL` — email gửi đã được xác minh trên Brevo
- [ ] `BREVO_FROM_NAME` — tên hiển thị trên email gửi đi
- [ ] `NODE_ENV=production`
- [ ] `PORT` — port phù hợp với môi trường (mặc định 5000)

### Frontend (`frontend/.env`)
- [ ] `VITE_API_URL` — URL đầy đủ tới backend production, kèm `/api/v1` (ví dụ: `https://api.example.com/api/v1`)

### Admin-Client (`admin-client/.env`)
- [ ] `VITE_API_URL` — URL đầy đủ tới backend production, kèm `/api/v1`

### Vibe-Content (`vibe-content/.env`)
- [ ] `FORUM_API_URL` — URL đầy đủ tới backend production, kèm `/api/v1` (ví dụ: `https://api.example.com/api/v1`)
- [ ] `DATABASE_URL` — trỏ đúng database production
- [ ] `GEMINI_API_KEY` — API key LLM production
- [ ] `BOT_PASSWORD` — mật khẩu khớp với bot users đã seed trong database
- [ ] `NODE_ENV=production`

---

## 2. Database

- [ ] Migration đã được chạy: `npx prisma migrate deploy` từ thư mục `backend/`
- [ ] Seed data cần thiết đã được áp dụng (bot users, categories, tags ban đầu)
- [ ] Backup database được thực hiện TRƯỚC khi chạy migration
- [ ] Connection pool được cấu hình đúng (pgbouncer hoặc `connection_limit` trong DATABASE_URL)

---

## 3. Kiểm tra API Contract

- [ ] `GET /api/v1/health` trả về `200 OK`
- [ ] Tất cả response đều bọc trong envelope `{ success, message, data }`
- [ ] Response không chứa field `snake_case` (middleware `snakeToCamel` đang hoạt động)
- [ ] `FORUM_API_URL` trong vibe-content **không** kết thúc bằng `/` và bao gồm `/api/v1`

---

## 4. Security

- [ ] `NODE_ENV=production` đã đặt — tắt stack traces trong error responses
- [ ] JWT secrets **khác** với giá trị development/default
- [ ] CORS `FRONTEND_URL` chỉ liệt kê domain hợp lệ, không có wildcard `*`
- [ ] HTTPS được kích hoạt trên tất cả entry points
- [ ] Rate limiting đang hoạt động (`/api/v1` và `/api/v1/auth`)
- [ ] Helmet headers được kiểm tra (CSP, HSTS, etc.)

---

## 5. Build & Docker

- [ ] `docker build` thành công cho tất cả service cần deploy
- [ ] `docker-entrypoint.sh` chạy migration trước khi start server (backend)
- [ ] Health check endpoint phản hồi trước khi load balancer nhận traffic

---

## 6. Sau Deploy

- [ ] `GET /api/v1/health` xác nhận API đang chạy
- [ ] Login flow hoạt động từ đầu đến cuối
- [ ] Kiểm tra logs để phát hiện lỗi startup
- [ ] Vibe-content scheduler đang chạy (log xuất hiện cron job hoặc `/status` endpoint hoạt động)
