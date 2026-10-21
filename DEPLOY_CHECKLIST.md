# 📋 Deploy Checklist - Mini Forum

**Kiến trúc mục tiêu hiện tại**:
- **Backend API, PostgreSQL 17 & Vibe-Content AI**: Remote VM (Oracle Cloud / VPS) chạy qua Docker Compose & Cloudflare Tunnel
- **Frontend & Admin Client**: Vercel (Edge CDN)
- **Mobile App**: Expo / React Native (iOS & Android)

---

## 📑 Mục lục
1. [Giai đoạn 1: Chuẩn bị trước khi Triển khai (Pre-Deployment)](#1-chuẩn-bị-trước-khi-triển-khai-pre-deployment)
2. [Giai đoạn 2: Cấu hình & Deploy Remote VM (Oracle Cloud)](#2-cấu-hình--deploy-remote-vm-oracle-cloud)
3. [Giai đoạn 3: Khởi tạo & Đồng bộ CSDL (Database Setup & Migrations)](#3-khởi-tạo--đồng-bộ-csdl-database-setup--migrations)
4. [Giai đoạn 4: Deploy Frontend & Admin-Client lên Vercel](#4-deploy-frontend--admin-client-lên-vercel)
5. [Giai đoạn 5: Cấu hình Ứng dụng Di động (Mobile App)](#5-cấu-hình-ứng-dụng-di-động-mobile-app)
6. [Giai đoạn 6: Kiểm tra Sức khỏe Hậu triển khai (Post-Deployment Smoke Tests)](#6-kiểm-tra-sức-khỏe-hậu-triển-khai-post-deployment-smoke-tests)
7. [Giai đoạn 7: Giám sát, Sao lưu & Kế hoạch Rollback](#7-giám-sát-sao-lưu--kế-hoạch-rollback)

---

## 1. Chuẩn bị trước khi Triển khai (Pre-Deployment)

- [ ] **Mã nguồn đã sẵn sàng**:
  - [ ] Tất cả thay đổi đã commit vào Git branch chính (`main`).
  - [ ] Kiểm tra trạng thái Git sạch sẽ: `git status`.
- [ ] **Kiểm thử cục bộ (Local Testing)**:
  - [ ] Backend build không có lỗi TypeScript: `cd backend && npm run build`.
  - [ ] Frontend build không có lỗi: `cd frontend && npm run build`.
  - [ ] Admin Client build không có lỗi: `cd admin-client && npm run build`.
  - [ ] Vibe-Content build không có lỗi: `cd vibe-content && npm run build`.
- [ ] **Chuẩn bị sẵn Khóa bảo mật & Credentials**:
  - [ ] `JWT_ACCESS_SECRET` (tạo bằng `openssl rand -base64 32`).
  - [ ] `JWT_REFRESH_SECRET` (tạo bằng `openssl rand -base64 32`).
  - [ ] `BREVO_API_KEY` (xác thực gửi mã OTP email).
  - [ ] `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` (CDN tải & xử lý ảnh).
  - [ ] `GEMINI_API_KEY` (hoặc API key của các provider AI khác: Groq, Cerebras...).
  - [ ] `TUNNEL_TOKEN` (từ Cloudflare Zero Trust > Networks > Tunnels).

---

## 2. Cấu hình & Deploy Remote VM (Oracle Cloud)

### 2.1. Thiết lập kết nối máy chủ
- [ ] File SSH Private Key (ví dụ `134.185.83.12.key`) đã được phân quyền an toàn:
  - Trên Windows (PowerShell): `icacls <key_file> /inheritance:r /grant:r "$($env:USERNAME):(R)"`
  - Trên Linux/macOS: `chmod 400 <key_file>`
- [ ] Tạo file cấu hình `scripts/remote-vm/.vm_config` (sao chép từ `.vm_config.example`):
  ```bash
  VM_IP="134.185.83.12"
  VM_USER="ubuntu"
  KEY_FILE="$REPO_ROOT/134.185.83.12.key"
  REMOTE_APP_DIR="/home/ubuntu/mini-forum"
  ```
- [ ] Kiểm tra kết nối SSH thử nghiệm:
  - Dùng `vm 7` hoặc `./scripts/remote-vm/ssh.sh`

### 2.2. Chọn Chế độ Tài nguyên (Resource Profile)
- [ ] **Nếu là máy Micro 1GB RAM (`VM.Standard.E2.1.Micro`)**:
  - [ ] Thiết lập `COMPOSE_FILE="docker-compose.micro.yml"` trong `.vm_config`.
  - [ ] Chạy khởi tạo swap 4GB & tinh chỉnh sysctl kernel:
    - Dùng lệnh: `vm s` hoặc `./scripts/remote-vm/setup_micro_vm.sh`.
  - [ ] Deploy tuần tự tránh nghẽn CPU:
    - Dùng lệnh: `vm m` hoặc `./scripts/remote-vm/deploy_micro.sh`.
- [ ] **Nếu là máy Standard (ARM 4 OCPU 24GB RAM hoặc VPS thông thường)**:
  - [ ] Thiết lập `COMPOSE_FILE="docker-compose.yml"` trong `.vm_config`.
  - [ ] Chạy khởi tạo: `vm 8` (bootstrap) hoặc `./scripts/remote-vm/setup_vm.sh`.
  - [ ] Deploy song song: `vm 1` hoặc `./scripts/remote-vm/deploy.sh`.

### 2.3. Cấu hình Biến Môi trường trên VM (`.env`)
- [ ] File `.env` tại thư mục `/home/ubuntu/mini-forum/.env` trên máy chủ đã có đủ các biến:
  ```env
  POSTGRES_USER=forum_user
  POSTGRES_PASSWORD=your_strong_password
  POSTGRES_DB=mini_forum

  PORT=5000
  NODE_ENV=production
  LOG_LEVEL=info

  JWT_ACCESS_SECRET=your_jwt_access_secret
  JWT_REFRESH_SECRET=your_jwt_refresh_secret
  JWT_ACCESS_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d

  # Điền domain Vercel sau khi deploy bước 4
  FRONTEND_URL=https://mini-forum.vercel.app,https://admin-mini-forum.vercel.app
  COMMENT_EDIT_TIME_LIMIT=30

  BREVO_API_KEY=your_brevo_key
  BREVO_FROM_EMAIL=noreply@yourdomain.com
  BREVO_FROM_NAME="Mini Forum"

  IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
  IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
  IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

  GEMINI_API_KEY=your_gemini_key
  TUNNEL_TOKEN=your_cloudflare_tunnel_token
  ```

### 2.4. Khởi chạy Cloudflare Tunnel
- [ ] Kích hoạt tunnel bảo vệ (không mở port 5000/4000 ra Internet công cộng):
  - Dùng lệnh: `./scripts/remote-vm/install_tunnel.sh <TUNNEL_TOKEN>`
  - Hoặc bật profile tunnel trong docker-compose: `docker compose --profile tunnel up -d`
- [ ] Trên Cloudflare Zero Trust Dashboard:
  - Trỏ public hostname `api.yourdomain.com` → `http://localhost:5000`.

---

## 3. Khởi tạo & Đồng bộ CSDL (Database Setup & Migrations)

- [ ] Container PostgreSQL (`mini-forum-db`) đang chạy và ở trạng thái **healthy**:
  - Kiểm tra qua: `vm 2` (status) hoặc `docker ps`.
- [ ] Áp dụng Schema Migrations:
  - [ ] Chạy Prisma migrations trong container Backend:
    ```bash
    docker exec -it mini-forum-backend npx prisma migrate deploy
    ```
- [ ] Khôi phục dữ liệu mẫu hoặc bản sao lưu (Nếu có):
  - [ ] Bản dump mới nhất nằm trong `backend/backups/`.
  - [ ] Nạp dữ liệu vào PostgreSQL VM:
    - Chạy: `vm 6` hoặc `./scripts/remote-vm/restore_db.sh`.
- [ ] Kiểm tra dữ liệu:
  - [ ] Danh mục mặc định (`categories`) đã có đầy đủ.
  - [ ] Các tag bài viết hệ thống đã được nạp.
  - [ ] Tài khoản Quản trị viên (Admin) sẵn sàng để đăng nhập.

---

## 4. Deploy Frontend & Admin-Client lên Vercel

### 4.1. Cấu hình Frontend
- [ ] Import repository lên [Vercel](https://vercel.com).
- [ ] Cấu hình project Frontend:
  - **Framework Preset**: Vite
  - **Root Directory**: `frontend`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- [ ] **Environment Variables** (Frontend):
  ```env
  VITE_API_URL=https://api.yourdomain.com/api/v1
  VITE_IMAGE_KIT_URL=https://ik.imagekit.io/your_id
  VITE_IMAGE_KIT_PUBLIC_KEY=your_imagekit_public_key
  ```
- [ ] Bấm **Deploy** và lưu lại domain production (ví dụ: `https://mini-forum.vercel.app`).

### 4.2. Cấu hình Admin Client
- [ ] Thêm một New Project trên Vercel từ cùng repository:
  - **Framework Preset**: Vite
  - **Root Directory**: `admin-client`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- [ ] **Environment Variables** (Admin Client):
  ```env
  VITE_API_URL=https://api.yourdomain.com/api/v1
  ```
- [ ] Bấm **Deploy** và lưu lại domain production (ví dụ: `https://admin-mini-forum.vercel.app`).

### 4.3. Cập nhật CORS Backend
- [ ] Cập nhật biến `FRONTEND_URL` trong file `.env` trên VM với domain Vercel thực tế:
  ```env
  FRONTEND_URL=https://mini-forum.vercel.app,https://admin-mini-forum.vercel.app
  ```
- [ ] Khởi động lại container Backend để nhận CORS mới:
  ```bash
  docker compose restart backend
  ```

---

## 5. Cấu hình Ứng dụng Di động (Mobile App)

- [ ] Cấu hình API Endpoint trong app di động:
  - Mở app trên điện thoại (qua Expo Go), nhấn icon ⚙️ Cài đặt.
  - Điền URL Backend: `https://api.yourdomain.com/api/v1`.
  - Nhấn nút **Kiểm tra kết nối** (Ping test) → Thông báo thành công.
- [ ] Kiểm tra đăng nhập, lướt danh sách bài viết và đọc bình luận trên điện thoại.
- [ ] (Tùy chọn) Đóng gói Standalone APK:
  - Chạy `eas build -p android --profile preview` qua Expo Application Services.

---

## 6. Kiểm tra Sức khỏe Hậu triển khai (Post-Deployment Smoke Tests)

- [ ] **Backend API Health Check**:
  - Truy cập `GET https://api.yourdomain.com/api/v1/health` → Trả về status 200 OK.
- [ ] **Kiểm tra Cơ chế Xác thực & Token Bảo mật**:
  - Đăng ký tài khoản mới bằng OTP qua Brevo.
  - Đăng nhập tài khoản thành công.
  - Kiểm tra Cookie trình duyệt: Refresh token nằm trong **HttpOnly Cookie** (không lộ ra JavaScript `localStorage`).
  - Kiểm tra Refresh Token Rotation (RTR): Reload trang và gọi API được tự động làm mới token trơn tru.
- [ ] **Kiểm tra Nghiệp vụ Diễn đàn**:
  - Tạo bài viết mới kèm ảnh tải lên ImageKit.
  - Đăng bình luận lồng nhau (nested comments).
  - Thử Upvote/Downvote và kiểm tra điểm uy tín (reputation) được cập nhật.
  - Thử tìm kiếm bài viết qua Trigram Search.
- [ ] **Kiểm tra Thông báo Thời gian thực (SSE)**:
  - Dùng 2 tài khoản khác nhau: Tài khoản B comment bài của tài khoản A.
  - Tài khoản A nhận thông báo notification tức thì qua Server-Sent Events.
- [ ] **Kiểm tra Bảng điều khiển Quản trị (Admin Client)**:
  - Đăng nhập bằng tài khoản Moderator / Admin.
  - Bảng điều khiển Dashboard hiển thị đúng số liệu thống kê.
  - Các trang Quản lý bài viết, Quản lý người dùng, Báo cáo vi phạm hoạt động bình thường.
  - Mở trang `Audit Logs` xác nhận các thao tác quản trị được lưu vết đầy đủ.
- [ ] **Kiểm tra Bot AI (Vibe-Content)**:
  - Theo dõi live logs bot: `vm 4` hoặc `docker logs -f mini-forum-vibe`.
  - Kiểm tra bot tự động quét ngữ cảnh bài viết và sinh comment/vote theo lịch cron.
  - Không có lỗi crash hoặc tràn quota LLM.

---

## 7. Giám sát, Sao lưu & Kế hoạch Rollback

### 7.1. Giám sát Tài nguyên Hệ thống
- [ ] Chạy lệnh `vm 2` (`status.sh`) để kiểm tra:
  - Tải CPU ổn định dưới 70%.
  - Bộ nhớ RAM tiêu thụ nằm trong mức ngân sách an toàn:
    - Micro VM (1GB): Tổng RAM sử dụng < 800MB (Swap còn dư > 3GB).
    - Standard VM: Tổng RAM sử dụng < 3GB.
  - Dung lượng ổ đĩa boot volume còn trống > 20GB.

### 7.2. Quy trình Sao lưu Dữ liệu Định kỳ
- [ ] Sao lưu Database định kỳ về máy cục bộ:
  - Chạy `vm 5` hoặc `./scripts/remote-vm/backup_db.sh`.
  - Bản dump `.sql.dump` tự động được kéo về thư mục `backend/backups/`.

### 7.3. Kế hoạch Khôi phục Sự cố (Rollback Plan)
- [ ] **Nếu container Backend/Vibe gặp lỗi crash sau bản deploy mới**:
  - Checkout lại commit ổn định trước đó: `git checkout <previous_commit_hash>`.
  - Chạy lại lệnh deploy: `vm 1` (hoặc `vm m` nếu là Micro VM).
- [ ] **Nếu CSDL bị lỗi hoặc hỏng dữ liệu**:
  - Khôi phục bản snapshot gần nhất: `vm 6` (hoặc `./scripts/remote-vm/restore_db.sh`).
- [ ] **Nếu Cloudflare Tunnel mất kết nối**:
  - SSH vào VM qua `vm 7`, khởi động lại service tunnel: `sudo systemctl restart cloudflared` hoặc `docker compose restart tunnel`.

---

**Ngày triển khai**: ____________________  
**Người phụ trách**: ____________________  
**Trạng thái**:  `[ ] Thành công`  |  `[ ] Cần theo dõi`  |  `[ ] Thất bại (Rollback)`  
