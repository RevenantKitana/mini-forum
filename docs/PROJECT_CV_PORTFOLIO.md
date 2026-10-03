# MINI FORUM — TÀI LIỆU MÔ TẢ DỰ ÁN CHO HỒ SƠ NGHỀ NGHIỆP (CV & PORTFOLIO)

> **Bản chất dự án:** Dự án cá nhân thực nghiệm & học hỏi ("Làm để biết"), không phải dự án thương mại đặt hàng. Được phát triển tự phát nhằm khám phá toàn diện kiến trúc phần mềm, bảo mật xác thực, cơ sở dữ liệu quan hệ và tích hợp AI.
> **Phạm vi mô tả:** Monorepo `mini-forum` (Backend API, Frontend Client, Admin Client, Vibe-Content Service). Không bao gồm phân hệ `RBPWeb`.
> **Cơ sở dữ liệu & codebase tham chiếu:** Node.js/Express, TypeScript, Prisma ORM, PostgreSQL, React 18, Vite, Multi-LLM, ImageKit, Brevo.

---

## 📑 MỤC LỤC
1. [Phiên bản dành cho CV](#1-phiên-bản-dành-cho-cv)
2. [Phiên bản dành cho Portfolio](#2-phiên-bản-dành-cho-portfolio)
   - [Bối cảnh & Động lực: Dự án "Làm để biết"](#21-bối-cảnh--động-lực-dự-án-làm-để-biết)
   - [Kiến trúc Hệ thống & Nguồn gốc Phân hệ AI](#22-kiến-trúc-hệ-thống--nguồn-gốc-phân-hệ-ai)
   - [Trải nghiệm Người dùng (UX) & Use Cases Diễn đàn](#23-trải-nghiệm-người-dùng-ux--use-cases-diễn-đàn)
   - [Những Thử nghiệm Kỹ thuật & Thiết kế Đáng chú ý](#24-những-thử-nghiệm-kỹ-thuật--thiết-kế-đáng-chú-ý)
   - [Hiện trạng & Phương hướng Phát triển](#25-hiện-trạng--phương-hướng-phát-triển)
   - [Tổng hợp Công nghệ Sử dụng](#26-tổng-hợp-công-nghệ-sử-dụng)

---

# 1. Phiên bản dành cho CV

### Mini Forum — Diễn đàn Thảo luận Full-Stack & Dịch vụ AI Sinh nội dung (Dự án Cá nhân)

Dự án monorepo tự phát triển nhằm thực nghiệm kiến trúc phần mềm, bảo mật phiên đăng nhập, xử lý dữ liệu quan hệ phân cấp và tích hợp Multi-LLM tự động.

- **Kiến trúc Monorepo & Full-Stack:** Xây dựng 4 service độc lập gồm REST API (Node.js, Express, TypeScript, Prisma, PostgreSQL), 2 ứng dụng SPA React 18/TypeScript cho Người dùng và Quản trị viên, cùng Background Service tự hành (Vibe-Content); đóng gói Docker deploy trên Render và Vercel.
- **Bảo mật Xác thực & Quản lý Phiên:** Triển khai cơ chế Dual-Token an toàn (Access Token lưu In-Memory RAM, Refresh Token lưu HttpOnly Cookie), Refresh Token Rotation (RTR) kèm Reuse Detection chống Replay Attack, xác thực OTP email qua Brevo API và khử khuẩn XSS qua CSP/DOMPurify.
- **Nghiệp vụ Diễn đàn & Thời gian thực:** Thiết kế lược đồ 20+ bảng quan hệ; hỗ trợ bài viết dạng khối tối ưu ảnh qua ImageKit CDN, bình luận lồng nhau đa cấp (nested comments), Upvote/Downvote cập nhật điểm uy tín trong Database Transaction, tìm kiếm mờ (`pg_trgm`) và đẩy thông báo tức thời qua SSE.
- **Quản trị Kiểm toán & Tự động hóa Multi-LLM:** Bảng điều khiển quản trị phân quyền 4 vai trò (RBAC) với cơ chế Audit Trail ghi vết mọi can thiệp; phát triển bot tự hành sinh nội dung theo ngữ cảnh (Context-Aware), điều phối luân chuyển 5 provider LLM (Gemini, Groq, Cerebras...) với Circuit Breaker và PostgreSQL Advisory Locks.

---

# 2. Phiên bản dành cho Portfolio

## Mini Forum: Khám phá Kiến trúc Full-Stack & Tích hợp Tự động hóa Multi-LLM qua Mô hình Diễn đàn

Mini Forum là một dự án cá nhân được xây dựng với tinh thần **"làm để biết"** — một sân chơi thực nghiệm nhằm khám phá sâu các khía cạnh kỹ thuật trong phát triển phần mềm hiện đại: từ quản lý phiên đăng nhập an toàn, mô hình dữ liệu quan hệ có cấu trúc lồng nhau, quy trình kiểm duyệt nội dung, cho đến việc tích hợp các mô hình ngôn ngữ lớn (LLM) vào bài toán vận hành tự động.

---

### 2.1. Bối cảnh & Động lực: Dự án "Làm để biết"

Dự án này không xuất phát từ một yêu cầu thương mại hay một bài toán kinh doanh có sẵn, mà xuất phát từ mong muốn chủ động tìm hiểu và rèn luyện kỹ năng:

- **Lựa chọn mô hình Diễn đàn (Forum):** Diễn đàn được chọn vì đây là một kịch bản kinh điển nhưng chứa đựng đầy đủ các bài toán đa dạng và thách thức trong kỹ thuật phần mềm: cấu trúc cây phân cấp (bình luận lồng nhau), tính nhất quán dữ liệu (bỏ phiếu, tính điểm uy tín), bảo mật phân quyền (nhiều cấp bậc người dùng), tìm kiếm linh hoạt và thông báo thời gian thực.
- **Mục tiêu học hỏi & Thực hành:** Tự tay thiết kế và hiện thực hóa trọn vẹn vòng đời một ứng dụng từ database schema, API logic, giao diện người dùng, trang quản trị độc lập đến khâu đóng gói Docker và deploy lên cloud.

---

### 2.2. Kiến trúc Hệ thống & Nguồn gốc Phân hệ AI

#### A. Kiến trúc Tổng thể
Dự án được cấu trúc dạng Monorepo với 4 service đảm nhiệm các vai trò riêng biệt:

```
mini-forum/
├── backend/       # REST API server (Express, TypeScript, Prisma ORM, PostgreSQL)
├── frontend/      # Giao diện người dùng diễn đàn (React 18, Vite, TailwindCSS)
├── admin-client/  # Bảng điều khiển quản trị & kiểm duyệt (React 18, Radix UI)
└── vibe-content/  # Background service tự động sinh nội dung tương tác (Multi-LLM, Cron)
```

```
                        ┌───────────────────────────────┐
                        │      PostgreSQL Database      │
                        │   (20+ Tables, Advisory Lock) │
                        └───────▲───────────────▲───────┘
                                │               │
                  Prisma Client │               │ Prisma Client / Context
                                │               │
┌───────────────────────────────┴───┐       ┌───┴───────────────────────────┐
│           Backend API             │◄──────┤     Vibe-Content Service      │
│   (Express, Auth, SSE, Search)    │ HTTP  │ (Cron, LLMs, Circuit Breaker) │
└──────▲─────────────────────▲──────┘       └───────────────────────────────┘
       │ REST / SSE          │ REST
       │                     │
┌──────┴──────────┐   ┌──────┴──────────┐
│ Frontend Client │   │  Admin Client   │
│  (Member UI)    │   │  (Mod / Admin)  │
└─────────────────┘   └─────────────────┘
```

#### B. Nguồn gốc Hình thành Phân hệ Vibe-Content
Phân hệ `vibe-content` ban đầu **không nằm trong kế hoạch thiết kế ban đầu**, mà được hình thành hoàn toàn từ thực tế triển khai:
1. Khi deploy Backend lên gói miễn phí của Render, server sẽ tự động "sleep" sau một thời gian không có request. Nhu cầu ban đầu chỉ là cần một script cron định kỳ ping vào endpoint `/health` để giữ server thức.
2. Từ thao tác ping đơn giản, một ý tưởng nảy sinh: *"Nếu không chỉ gửi những request rỗng, mà biến nó thành những hành vi giao tiếp nghiệp vụ thực sự thì sao?"*
3. Kết hợp với thực tế diễn đàn demo chưa có người dùng thật, nội dung còn thưa thớt, ý tưởng phát triển thành một **Background Service sử dụng Multi-LLM** điều khiển các bot có tính cách riêng, tự động đọc bài viết và tham gia bình luận/bỏ phiếu theo ngữ cảnh.

---

### 2.3. Trải nghiệm Người dùng (UX) & Use Cases Diễn đàn

Nhìn từ góc độ trải nghiệm thực tế (User Experience), hệ thống phục vụ 2 nhóm người dùng chính:

```
                  ┌─────────────────────────────────────────┐
                  │          NGƯỜI DÙNG HỆ THỐNG            │
                  └────────────┬────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│    THÀNH VIÊN (MEMBER) │             │ QUẢN TRỊ / MODERATOR  │
└───────────┬───────────┘             └───────────┬───────────┘
            │                                     │
            ├─ Khám phá & Tìm kiếm                ├─ Kiểm duyệt nội dung (Ghim/Khóa/Ẩn)
            ├─ Soạn thảo đa phương tiện           ├─ Triage hàng đợi Báo cáo vi phạm
            ├─ Bình luận lồng nhau & Trích dẫn    ├─ Che nội dung nhạy cảm (Content Masking)
            ├─ Bỏ phiếu & Điểm uy tín             ├─ Quản lý thành viên (Ban/Role)
            ├─ Đánh dấu, Chặn 2 chiều, Báo cáo    └─ Tra soát Nhật ký Kiểm toán (Audit Trail)
            └─ Thông báo Realtime (SSE)
```

#### A. Trải nghiệm của Thành viên Diễn đàn (Member Experience)
- **Khám phá & Tìm kiếm Thông minh:** Lướt danh sách bài viết theo danh mục, thẻ chủ đề hoặc bài ghim; tìm kiếm bài viết và tác giả với khả năng tự động sửa lỗi chính tả/gõ sai nhờ PostgreSQL Trigram Fuzzy Search (`pg_trgm`).
- **Soạn thảo & Đăng tải Đa phương tiện:** Viết bài linh hoạt theo từng khối văn bản hoặc chèn ảnh; hình ảnh đính kèm và avatar được tự động tối ưu hóa qua ImageKit CDN thành 2 định dạng WebP (preview thu nhỏ và standard chuẩn nét).
- **Thảo luận Sâu & Trích dẫn:** Trao đổi dưới dạng bình luận phân cấp hình cây (nested comments); hỗ trợ tính năng trích dẫn bình luận gốc để giữ mạch thảo luận; cho phép chỉnh sửa nội dung trong giới hạn thời gian quy định.
- **Tương tác Đa chiều & Điểm Uy tín:** Bỏ phiếu Upvote/Downvote cho bài viết và bình luận yêu thích, điểm vote sẽ trực tiếp tích lũy vào danh tiếng (reputation) của tác giả; bookmark lưu lại bài viết hay; chặn tương tác hai chiều với người dùng không mong muốn; gửi báo cáo khi phát hiện nội dung xấu.
- **Phản hồi Tức thời & Cá nhân hóa Giao diện:** Nhận thông báo đẩy realtime ngay trên màn hình (qua SSE) khi có người phản hồi hoặc tương tác với bài viết của mình; tùy chỉnh giao diện Sáng/Tối (Dark Mode) và kích thước chữ đọc bài.

#### B. Trải nghiệm của Điều hành viên & Quản trị (Moderator & Admin Experience)
- **Kiểm duyệt & Điều hướng Luồng thảo luận:** Duyệt danh sách bài viết/bình luận tập trung; ghim bài viết quan trọng lên đầu trang chủ (Global Pin) hoặc đầu danh mục (Category Pin); khóa chủ đề khi cuộc thảo luận đi quá giới hạn.
- **Quy trình Xử lý Báo cáo Vi phạm (Report Triage):** Tiếp nhận hàng đợi báo cáo từ thành viên theo luồng trạng thái rõ ràng (`PENDING` $\rightarrow$ `REVIEWING` $\rightarrow$ `RESOLVED` / `DISMISSED`) và thực hiện ngay hành động xử lý (ẩn bài, xóa nội dung, khóa tài khoản vi phạm).
- **Bảo vệ Nội dung Nhạy cảm (Content Masking):** Che nội dung bình luận vi phạm bằng nhãn `[Nội dung đã được che]`. Khi quản trị viên cần bấm mở xem lại nội dung gốc, hệ thống bắt buộc ghi nhận lại vết tra soát nhằm đảm bảo quyền riêng tư.
- **Quản lý Định danh & Phân quyền:** Quản lý danh sách thành viên, cấm/mở khóa tài khoản (Ban/Unban), thăng cấp hoặc điều chỉnh vai trò giữa Member, Moderator và Admin.
- **Giám sát & Nhật ký Kiểm toán (Audit Trail):** Theo dõi số liệu tổng quan hệ thống, thời gian phản hồi API và tra cứu lịch sử chi tiết mọi hành vi can thiệp của đội ngũ quản trị trong bảng Audit Log.

---

### 2.4. Những Thử nghiệm Kỹ thuật & Thiết kế Đáng chú ý

#### A. Thực nghiệm Kiến trúc Xác thực: In-Memory Token & Refresh Token Rotation
Nhằm giải quyết triệt để rủi ro đánh cắp token qua lỗ hổng XSS khi lưu trữ trong `localStorage`, hệ thống đã thực nghiệm mô hình xác thực đa tầng:

```
[Khởi động / F5 App] ──► Gửi HttpOnly Cookie ──► Backend: Xác thực & Rotate Token
                                                    │
                                ┌───────────────────┴───────────────────┐
                        Token hợp lệ                           Token đã bị thu hồi (Replay)
                                │                                       │
                    Cấp Access Token mới (RAM)            🚨 Hủy TOÀN BỘ phiên của User
                    Set Cookie Refresh Token mới                  Buộc đăng xuất toàn hệ thống
```

1. **Lưu trữ Phân tách:** Access Token (15 phút) chỉ tồn tại trong RAM của ứng dụng; Refresh Token (7 ngày) được bảo vệ an toàn trong Cookie với cờ `HttpOnly`, `SameSite=Strict`, `Secure`.
2. **Khôi phục Phiên Tự động (Silent Refresh):** Khi người dùng tải lại trang (F5), ứng dụng tự động thực hiện một request ngầm lên Backend để lấy lại Access Token vào bộ nhớ RAM.
3. **Phát hiện Tái sử dụng Token (Reuse Detection):** Mỗi phiên đăng nhập được gắn một chuỗi `family_id`. Mỗi lần cấp mới, token cũ bị thu hồi (`is_revoked = true`). Nếu kẻ gian dùng lại một token cũ đã thu hồi, hệ thống lập tức nhận diện nguy cơ Replay Attack và **vô hiệu hóa toàn bộ tất cả token** của tài khoản đó.

#### B. Khả năng Chịu lỗi & Điều phối Multi-LLM (Circuit Breaker)
Để dịch vụ `vibe-content` hoạt động ổn định và không phụ thuộc vào một nhà cung cấp AI duy nhất:
- **Tích hợp 5 Provider:** Google Gemini (chính), kết hợp dự phòng qua Groq, Cerebras, NVIDIA, Beeknoee.
- **Mô hình Circuit Breaker:** Tự động ngắt kết nối (`OPEN`) khi một provider lỗi quá 5 lần trong 60 giây, chuyển hướng sang provider tiếp theo; tự động kích hoạt Cooldown 2 giờ nếu gặp lỗi Rate Limit; sau thời gian chờ sẽ chuyển sang `HALF_OPEN` để thăm dò phục hồi.
- **Endpoint Health Check LLM Thực tế (`/llm-health`):** Thực hiện kiểm tra định kỳ bằng cách gửi prompt siêu ngắn (`"Respond with exactly: 'health_check_ok'"`) song song tới tất cả provider để đo độ trễ và báo cáo sức khỏe mà không gây lãng phí token.

#### C. Xử lý Đồng thời với PostgreSQL Advisory Locks
Để tránh tình trạng nhiều instance của service `vibe-content` cùng chạy cron và tạo nội dung trùng lặp, hệ thống sử dụng khóa phân tán cấp giao dịch của PostgreSQL (`pg_advisory_xact_lock`). Cơ chế này đảm bảo chỉ duy nhất một tiến trình được quyền sinh nội dung tại một thời điểm.

---

### 2.5. Hiện trạng & Phương hướng Phát triển

- **Hiện trạng Triển khai:**
  - Toàn bộ 4 phân hệ (Backend, Frontend, Admin Client, Vibe-Content) đã hoàn thiện mã nguồn và vượt qua các bộ kiểm thử tự động (Vitest) cho các luồng cốt lõi.
  - Ứng dụng đã được cấu hình CI/CD và triển khai thực tế trên nền tảng **Vercel** (Frontend, Admin-Client) và **Render** (Backend API, Vibe-Content qua Docker container).
- **Phương hướng Phát triển Tiếp theo:**
  - **Tối ưu hóa UX/UI:** Cải tiến liên tục dựa trên phản hồi người dùng và tối ưu hóa trải nghiệm tương thích trên nhiều kích thước màn hình.
  - **Xây dựng Client Mobile App:** Phát triển ứng dụng di động độc lập để tối ưu hóa trải nghiệm đọc bài và nhận thông báo đẩy trên thiết bị di động.
  - **Tối ưu hóa Hiệu năng Server:** Bổ sung tầng bộ nhớ đệm (Redis Cache) cho các truy vấn bảng tin trang chủ, phân trang danh mục và tối ưu hóa thêm các chỉ mục (Indexes) phức hợp trong PostgreSQL.

---

### 2.6. Tổng hợp Công nghệ Sử dụng

| Phân hệ | Công nghệ cốt lõi | Vai trò kỹ thuật trong dự án |
|---|---|---|
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL | Xử lý logic nghiệp vụ, quản lý dữ liệu quan hệ, phân quyền RBAC, Server-Sent Events, PostgreSQL Trigram Search |
| **Frontend Client** | React 18, TypeScript, Vite, TailwindCSS, TanStack Query, React Router DOM 7 | Giao diện người dùng diễn đàn, quản lý state và cache client-side, xác thực In-Memory |
| **Admin Client** | React 18, TypeScript, Vite, Radix UI, TailwindCSS, TanStack Query | Giao diện quản trị & kiểm duyệt độc lập, điều phối báo cáo vi phạm, tra soát Audit Log |
| **Vibe Content** | Node.js, Express, TypeScript, Node-cron, Google Generative AI | Background service tự hành, phân tích ngữ cảnh bài viết, điều phối Multi-LLM (Gemini, Groq, Cerebras, NVIDIA, Beeknoee) |
| **Bảo mật & Tiện ích** | JWT, bcrypt, Helmet, Zod, DOMPurify, Brevo API, ImageKit | Bảo vệ phiên đăng nhập, chống Replay/XSS, gửi OTP email, xử lý và tối ưu hóa hình ảnh CDN |
| **Hạ tầng & Đóng gói** | Docker, Vercel, Render | Container hóa ứng dụng, cấu hình triển khai phân tán cho môi trường web |
