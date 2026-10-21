# Mini Forum

Ứng dụng diễn đàn trực tuyến full-stack hiện đại với kiến trúc **Monorepo**, bao gồm giao diện người dùng, trang quản trị chuyên sâu, ứng dụng di động đa nền tảng, máy chủ REST API bảo mật cao và dịch vụ sinh nội dung AI tự động.

---

## 🏛️ Tổng Quan Kiến Trúc (Architecture Overview)

```
mini-forum/
├── frontend/        # Giao diện người dùng Web (React 18 + Vite + TailwindCSS)
├── admin-client/    # Bảng điều khiển Quản trị viên (React 18 + Vite + Radix UI)
├── mobile/          # Ứng dụng di động (React Native + Expo SDK 52 cho iOS & Android)
├── backend/         # Máy chủ REST API (Express + TypeScript + Prisma + PostgreSQL 17)
├── vibe-content/    # Dịch vụ sinh nội dung AI tự hành (Gemini + Multi-LLM + Cron)
├── scripts/         # Bộ công cụ DevOps tự động hóa triển khai máy chủ từ xa (remote-vm)
├── docs/            # Trung tâm tài liệu kỹ thuật & kiến trúc dự án
└── vm.bat           # Bảng điều khiển CLI quản lý máy chủ Remote VM (Windows)
```

| Phân hệ | Công nghệ chính | Port mặc định | Mô tả chức năng |
| :--- | :--- | :---: | :--- |
| **Backend** | Express 4, TypeScript 5, Prisma 5, PostgreSQL 17 | `5000` | REST API core, xác thực Dual-Token an toàn, tìm kiếm Trigram, SSE realtime |
| **Frontend** | React 18, Vite, TailwindCSS, TanStack Query | `5173` | Giao diện thảo luận diễn đàn, trải nghiệm người dùng tối ưu |
| **Admin Client** | React 18, Vite, Radix UI, Lucide Icons | `5174` | Bảng điều khiển kiểm duyệt nội dung, quản lý người dùng & audit logs |
| **Mobile App** | React Native, Expo SDK 52, Expo Router | `8081` | Ứng dụng di động iOS/Android (chạy trực tiếp qua Expo Go QR hoặc APK) |
| **Vibe Content** | Node.js, Multi-LLM (Gemini, Groq, Cerebras...), Cron | `4000` | Bot tự hành tạo bài viết, bình luận ngữ cảnh và vote với tính cách riêng |

---

## ✨ Tính Năng Nổi Bật

- **Diễn đàn Đầy đủ & Tương tác Cao:** Bài viết rich-content, bình luận lồng nhau đa cấp (nested comments), trích dẫn phản hồi, upvote/downvote cập nhật điểm uy tín theo database transaction, bookmark và gắn tag phân loại.
- **Bảo mật Xác thực Tiêu chuẩn Doanh nghiệp:**
  - Mô hình **Dual-Token**: Access Token lưu In-Memory RAM (15m) + Refresh Token lưu trong HttpOnly Cookie (7d) — miễn nhiễm hoàn toàn với tấn công XSS đánh cắp token.
  - **Refresh Token Rotation (RTR)** kết hợp cơ chế **Phát hiện tái sử dụng (Reuse Detection)**: Tự động vô hiệu hóa toàn bộ phiên khi phát hiện tấn công Replay Attack.
  - Xác thực đăng ký và đổi mật khẩu qua mã OTP gửi bằng Brevo API.
- **Thông báo Thời gian thực (Real-time SSE):** Đẩy thông báo tức thì đến người dùng bằng Server-Sent Events (SSE) nhẹ nhàng và ổn định.
- **Tìm kiếm Toàn văn:** PostgreSQL Trigram Search hỗ trợ tìm kiếm mờ tiêu đề bài viết và nội dung.
- **Phân quyền Đa tầng (RBAC):** 4 vai trò rõ ràng (`MEMBER`, `MODERATOR`, `ADMIN`, `BOT`) cùng hệ thống cấp bậc danh mục (`permission_level`).
- **Trang Quản trị & Kiểm toán:** Dashboard thống kê, duyệt và ẩn bài/bình luận, xử lý báo cáo vi phạm, và hệ thống **Audit Trail** ghi vết mọi thao tác quản trị.
- **Tự động hóa Nội dung với Multi-LLM (Vibe-Content):**
  - Tích hợp 5 nhà cung cấp mô hình ngôn ngữ lớn (Gemini, Groq, Cerebras, Beeknoee, NVIDIA) kèm Circuit Breaker và cơ chế Fallback tự động.
  - Bot "đọc" nội dung bài viết trước khi đưa ra bình luận hoặc vote (Context-Aware pipeline).
  - PostgreSQL Advisory Locks chống xung đột giữa các background worker.
- **Tối ưu Hóa Media:** Tải lên và tự động nén, cắt kích thước ảnh thông qua ImageKit CDN.

---

## 💻 Yêu Cầu Môi Trường (Prerequisites)

- **Node.js** >= 18.x
- **PostgreSQL** >= 14 (Khuyên dùng PostgreSQL 17 qua Docker)
- **npm** hoặc **yarn** / **pnpm**
- **Docker & Docker Compose** (Tùy chọn cho môi trường container)

---

## 🚀 Khởi Động Nhanh (Local Development)

### 1. Clone mã nguồn
```bash
git clone <repository-url>
cd mini-forum
```

### 2. Cài đặt dependencies cho từng sub-project
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Admin Client
cd ../admin-client && npm install

# Mobile App (Tùy chọn)
cd ../mobile && npm install

# Vibe Content (Tùy chọn)
cd ../vibe-content && npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` cho từng phân hệ từ file mẫu `.env.example` tương ứng:

- **Backend** (`backend/.env`):
  ```env
  DATABASE_URL=postgresql://forum_user:forum_secure_pass_2026@localhost:5432/mini_forum
  JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters
  JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters
  JWT_ACCESS_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d
  FRONTEND_URL=http://localhost:5173,http://localhost:5174
  COMMENT_EDIT_TIME_LIMIT=30
  BREVO_API_KEY=your_brevo_api_key
  BREVO_FROM_EMAIL=noreply@yourdomain.com
  IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
  IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
  IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
  ```

- **Vibe Content** (`vibe-content/.env`):
  ```env
  DATABASE_URL=postgresql://forum_user:forum_secure_pass_2026@localhost:5432/mini_forum
  FORUM_API_URL=http://localhost:5000/api/v1
  BOT_PASSWORD=your_bot_password
  GEMINI_API_KEY=your_gemini_api_key
  ```

### 4. Khởi tạo Cơ sở dữ liệu (Database Migrations & Seed)
```bash
cd backend
npm run db:migrate    # Chạy migrations Prisma
npm run db:generate   # Sinh mã Prisma Client
npm run db:seed       # Nạp danh mục mẫu và tài khoản quản trị
```

### 5. Khởi chạy các dịch vụ
Mở các cửa sổ terminal riêng biệt:

```bash
# Terminal 1 - Backend API (Port 5000)
cd backend && npm run dev

# Terminal 2 - Frontend User (Port 5173)
cd frontend && npm run dev

# Terminal 3 - Admin Portal (Port 5174)
cd admin-client && npm run dev

# Terminal 4 - Vibe-Content AI Worker (Port 4000 - Tùy chọn)
cd vibe-content && npm run dev

# Terminal 5 - Mobile App (Port 8081 - Tùy chọn)
cd mobile && npx expo start
```

---

## 🌐 Triển Khai Thực Tế (Production Deployment)

Hệ thống được thiết kế theo mô hình triển khai phân tán tối ưu chi phí và hiệu năng:

1. **Backend, PostgreSQL 17 & Vibe-Content:**
   - Đóng gói Docker, triển khai trên máy chủ ảo (Oracle Cloud VM / VPS Linux).
   - Hỗ trợ cả máy cấu hình tiêu chuẩn và **máy cấu hình thấp (1GB RAM - Micro VM)** với bộ tham số kernel/Cgroup được tối ưu riêng biệt.
   - Kết nối an toàn không mở port qua **Cloudflare Zero Trust Tunnel**.
   - Điều khiển nhanh qua công cụ dòng lệnh [`vm.bat`](./vm.bat) hoặc thư mục [`scripts/remote-vm/`](./scripts/remote-vm/README.md).
2. **Frontend & Admin Client:**
   - Triển khai dạng Static SPA trên **Vercel** toàn cầu.
3. **Mobile App:**
   - Phân phối nội bộ qua **Expo Go** (quét QR) hoặc đóng gói file APK độc lập qua **EAS Build**.

> [!TIP]
> Trước khi thực hiện deploy, hãy tham khảo cẩn thận [Bảng Kiểm Triển Khai (DEPLOY_CHECKLIST.md)](./DEPLOY_CHECKLIST.md) để tránh thiếu sót.

---

## 📚 Trung Tâm Tài Liệu Chi Tiết

Tất cả tài liệu kỹ thuật chuyên sâu được quản lý tập trung trong thư mục [`docs/`](./docs/README.md):

- 🏛️ [Kiến Trúc Hệ Thống & Bảo Mật (docs/ARCHITECTURE.md)](./docs/ARCHITECTURE.md) — Chi tiết mô hình Dual-Token, RTR, SSE, và luồng AI Fallback Stack.
- 🚀 [Hướng Dẫn Deploy Oracle Cloud VM (docs/DEPLOY_ORACLE_VM.md)](./docs/DEPLOY_ORACLE_VM.md) — Cẩm nang triển khai máy chủ tự động hóa qua `vm.bat` và Cloudflare Tunnel.
- ⚡ [Tối Ưu Micro VM 1GB RAM (docs/DEPLOY_MICRO_VM.md)](./docs/DEPLOY_MICRO_VM.md) — Hướng dẫn vận hành an toàn trên cấu hình Free Tier của Oracle Cloud.
- 🗄️ [Cẩm Nang Quản Trị CSDL (docs/DATABASE_GUIDE.md)](./docs/DATABASE_GUIDE.md) — Prisma migrations, sao lưu & khôi phục tự động giữa máy cá nhân và VM.
- 📄 [Tóm Tắt Dự Án Cho CV & Portfolio (docs/PROJECT_CV_PORTFOLIO.md)](./docs/PROJECT_CV_PORTFOLIO.md) — Bản mô tả kỹ thuật chuẩn mực cho CV ứng tuyển và Portfolio.
- 🗃️ [Kho Lưu Trữ Tài Liệu Lịch Sử (docs/legacy/)](./docs/legacy/README.md) — Lưu trữ các tài liệu từ các giai đoạn thử nghiệm ban đầu (Render, Supabase, spec cũ).

---

## 👥 Tài Liệu Cho Từng Sub-Project

- [Backend API README](backend/README.md)
- [Frontend User Client README](frontend/README.md)
- [Admin Portal README](admin-client/README.md)
- [Mobile App README](mobile/README.md)
- [Vibe-Content AI Worker README](vibe-content/README.md)
- [DevOps Remote VM Toolset README](scripts/remote-vm/README.md)
