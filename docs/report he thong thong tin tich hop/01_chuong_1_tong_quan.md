# CHƯƠNG 1 — TỔNG QUAN KIẾN TRÚC HỆ THỐNG

---

## 1.1 Bối cảnh và lý do lựa chọn kiến trúc Monorepo Multi-service

### 1.1.1 Bối cảnh dự án

MINI-FORUM là một ứng dụng diễn đàn trực tuyến full-stack được xây dựng trong khuôn khổ thực tập kỹ thuật phần mềm, với thời gian triển khai ba tháng (từ ngày 27/01/2026 đến ngày 27/04/2026). Mục tiêu của dự án là xây dựng một nền tảng cộng đồng hoàn chỉnh, đáp ứng các yêu cầu nghiệp vụ thực tế bao gồm: quản lý bài viết đa định dạng, tổ chức danh mục và nhãn phân loại, hệ thống bình luận lồng nhau (nested comments), cơ chế vote và bookmark, thông báo thời gian thực, phân quyền người dùng theo vai trò, kiểm duyệt nội dung, và tích hợp trí tuệ nhân tạo để tự động sinh nội dung.

Quy mô kỹ thuật của dự án bao gồm bốn dịch vụ riêng biệt, một cơ sở dữ liệu PostgreSQL với 19 model, hơn 50 API endpoint, và một dịch vụ AI autonomous có khả năng tương tác với diễn đàn theo lịch định kỳ. Tính phức tạp này đặt ra yêu cầu quan trọng về lựa chọn kiến trúc tổ chức codebase: kiến trúc nào cho phép phát triển nhanh, dễ mở rộng, nhưng không tạo ra overhead vận hành quá lớn cho một nhóm nhỏ?

Trước khi bắt đầu giai đoạn thiết kế, nhóm đã tiến hành đánh giá ba mô hình kiến trúc phổ biến trong lĩnh vực phát triển ứng dụng web hiện đại:

Trước khi bắt đầu giai đoạn thiết kế, nhóm đã tiến hành đánh giá ba mô hình kiến trúc phổ biến:

1. **Kiến trúc Monolith**: Toàn bộ business logic, API và giao diện người dùng đặt trong một ứng dụng và một repository duy nhất.
2. **Kiến trúc Monorepo Multi-service** *(phương án được lựa chọn)*: Nhiều dịch vụ độc lập về mặt runtime nhưng được quản lý trong cùng một repository, chia sẻ tooling và cấu hình.
3. **Kiến trúc Microservices thuần**: Mỗi dịch vụ là một repository và đơn vị triển khai hoàn toàn độc lập, giao tiếp qua API gateway hoặc message bus.

### 1.1.2 Phân tích và so sánh các phương án kiến trúc

Để đưa ra quyết định khách quan, nhóm đánh giá ba kiến trúc dựa trên bảy tiêu chí liên quan trực tiếp đến phạm vi, quy mô và thời gian của dự án:

**Bảng 1.1 — So sánh ba kiến trúc trên 7 tiêu chí đánh giá**

| Tiêu chí đánh giá | Monolith | **Monorepo Multi-service** | Microservices thuần |
|---|:---:|:---:|:---:|
| Độ phức tạp thiết lập ban đầu | Thấp | **Trung bình** | Cao |
| Khả năng chia sẻ code / types | Dễ | **Có (shared types, configs)** | Khó (cần package registry) |
| Scale từng thành phần độc lập | Không | **Có (Docker/container)** | Có |
| Phù hợp với team nhỏ (1–3 người) | Có | **Có** | Không |
| Cô lập cơ sở dữ liệu | Không | **Không hoàn toàn** | Có |
| Dễ thêm service mới về sau | Khó (refactor lớn) | **Dễ (thêm thư mục)** | Trung bình |
| Overhead vận hành | Thấp | **Trung bình** | Cao |

*Nguồn: Đánh giá tổng hợp dựa trên tài liệu kỹ thuật và thực tiễn triển khai dự án*

Phân tích chi tiết từng phương án:

**Kiến trúc Monolith** phù hợp với các ứng dụng có phạm vi hẹp và không có nhu cầu tách biệt dịch vụ. Tuy nhiên, khi dịch vụ AI (`vibe-content`) cần được triển khai và vận hành độc lập so với API chính — do tần suất cập nhật, tài nguyên tính toán và lịch trình thực thi khác nhau — kiến trúc Monolith sẽ buộc phải đặt tất cả trong cùng một tiến trình, gây khó khăn trong quản lý và debug.

**Kiến trúc Microservices thuần** cung cấp độ cô lập cao nhất nhưng yêu cầu hạ tầng phức tạp: API gateway, service discovery, distributed tracing, và quy trình CI/CD riêng biệt cho từng service. Với quy mô nhóm 1–3 người và thời hạn 3 tháng, overhead này sẽ chiếm phần lớn thời gian phát triển, làm giảm khả năng tập trung vào logic nghiệp vụ.

**Kiến trúc Monorepo Multi-service** là điểm cân bằng tối ưu: mỗi service có thể triển khai và vận hành độc lập, nhưng chia sẻ cùng một repository để đồng bộ tooling, dễ theo dõi thay đổi liên quan giữa các service, và giảm overhead quản lý.

### 1.1.3 Lý do quyết định lựa chọn Monorepo Multi-service

Quyết định lựa chọn kiến trúc Monorepo Multi-service dựa trên ba lý do kỹ thuật cụ thể:

**Lý do 1 — Tính linh hoạt mở rộng theo yêu cầu thực tế:**

Dịch vụ `vibe-content` (sinh nội dung bằng AI) không có trong kế hoạch ban đầu và chỉ được thêm vào ở Sprint 5, sau khi forum core đã hoàn thiện. Với kiến trúc Monorepo, việc bổ sung một service mới chỉ đòi hỏi tạo thêm một thư mục con với `package.json` riêng, tái sử dụng Prisma schema sẵn có, và cấu hình deploy độc lập. Không cần refactor codebase hiện có, không cần tạo repository mới, không ảnh hưởng đến hoạt động của các service khác.

**Lý do 2 — Chia sẻ kiến trúc và tooling đồng nhất:**

Tất cả service trong dự án đều sử dụng TypeScript, Prisma ORM, ESLint và cấu hình tương tự. Trong môi trường Monorepo, dịch vụ `vibe-content` có thể kế thừa trực tiếp `schema.prisma` từ `backend/prisma/` thông qua biến môi trường `DATABASE_URL` chung, tránh việc định nghĩa lại các model hoặc duy trì hai phiên bản schema song song — một nguồn lỗi phổ biến trong kiến trúc đa repository.

**Lý do 3 — Phù hợp với phạm vi và thời gian dự án:**

Trong điều kiện thời gian 3 tháng với quy mô nhóm nhỏ, việc quản lý nhiều repository độc lập sẽ tạo ra overhead không cần thiết: phối hợp versioning, quản lý quyền truy cập, theo dõi cross-repository dependencies. Monorepo cho phép toàn bộ thay đổi — dù là ở backend, frontend hay AI service — đều được commit, review và deploy trong cùng một luồng làm việc thống nhất.

---

## 1.2 Kiến trúc tổng thể hệ thống theo mô hình 4-tier

### 1.2.1 Tổng quan kiến trúc phân tầng

Hệ thống MINI-FORUM được thiết kế theo mô hình **4-tier architecture** (kiến trúc 4 tầng), trong đó mỗi tầng có trách nhiệm rõ ràng và giao tiếp với tầng liền kề theo giao thức được định nghĩa trước. Mô hình này tách biệt hoàn toàn giữa lớp trình bày (presentation), lớp xử lý nghiệp vụ (business logic), lớp dữ liệu (data), và lớp dịch vụ chuyên biệt (AI service).

Ưu điểm chính của mô hình phân tầng là khả năng thay thế hoặc mở rộng từng tầng một cách độc lập. Ví dụ: có thể nâng cấp cơ sở dữ liệu từ PostgreSQL sang một hệ thống khác mà không ảnh hưởng đến tầng giao diện, miễn là tầng backend duy trì cùng interface với tầng dữ liệu.

**Hình 1.1 — Sơ đồ kiến trúc tổng thể hệ thống MINI-FORUM**

```
╔══════════════════════════════════════════════════════════════════════╗
║                  MINI-FORUM — KIẾN TRÚC HỆ THỐNG                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  TẦNG 1 — GIAO DIỆN NGƯỜI DÙNG (Browser Clients)                     ║
║                                                                      ║
║  ┌──────────────────────────┐    ┌────────────────────────────────┐  ║
║  │       frontend/          │    │         admin-client/          │  ║
║  │   Giao diện người dùng   │    │   Bảng điều khiển quản trị     │  ║
║  │   React 18 + Vite 5      │    │   React 18 + Vite 5            │  ║
║  │   Port :5173 (dev)       │    │   Port :5174 (dev)             │  ║
║  │                          │    │                                │  ║
║  │  • React Query           │    │  • React Query                 │  ║
║  │  • React Router v6       │    │  • React Router v6             │  ║
║  │  • Tailwind CSS          │    │  • Radix UI + shadcn/ui        │  ║
║  │  • Zod (client valid.)   │    │  • Recharts (dashboard)        │  ║
║  └──────────────┬───────────┘    └──────────────┬─────────────────┘  ║
║                 │                               │                    ║
║                 └───────────────┬───────────────┘                    ║
║                                 │                                    ║
║              HTTPS / REST API — Authorization: Bearer {JWT}          ║
║                                 │                                    ║
╠═════════════════════════════════╪════════════════════════════════════╣
║                                 ▼                                    ║
║  TẦNG 2 — BACKEND API SERVICE                                        ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │                   backend/  — Port :5000                     │◄───║── vibe-content
║  │           Express.js + TypeScript + Prisma ORM               │    ║   HTTP/REST
║  │                                                              │    ║
║  │  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐  │    ║
║  │  │  9 Middleware │  │ 14 Controller │  │   21 Services     │  │    ║
║  │  │              │  │               │  │                   │  │    ║
║  │  │ requestId    │→ │ auth          │→ │  AuthService      │  │    ║
║  │  │ metrics      │  │ post          │  │  PostService      │  │    ║
║  │  │ httpLogger   │  │ comment       │  │  CommentService   │  │    ║
║  │  │ security     │  │ user          │  │  UserService      │  │    ║
║  │  │ auth         │  │ admin         │  │  NotifService     │  │    ║
║  │  │ role         │  │ vote          │  │  VoteService      │  │    ║
║  │  │ validate     │  │ bookmark      │  │  AuditLogService  │  │    ║
║  │  │ upload       │  │ notification  │  │  MetricsService   │  │    ║
║  │  │ error        │  │ ...+6 more    │  │  ...+13 more      │  │    ║
║  │  └──────────────┘  └───────────────┘  └───────────────────┘  │    ║
║  └──────────────────────────────┬───────────────────────────────┘    ║
║                                 │ Prisma ORM / TCP :5432             ║
╠═════════════════════════════════╪════════════════════════════════════╣
║                                 ▼                                    ║
║  TẦNG 3 — CƠ SỞ DỮ LIỆU                                             ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │                  PostgreSQL — Port :5432                     │    ║
║  │            Hosted: Supabase (prod) / Docker (dev)            │◄───║── vibe-content
║  │                                                              │    ║   Prisma READ
║  │   19 Models | Prisma Migrations | Full-text Search (GIN)     │    ║
║  │   Enum Types | Composite Indexes | Foreign Key Constraints   │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  TẦNG 4 — DỊCH VỤ AI AUTONOMOUS                                      ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │              vibe-content/  — Port :4000                     │    ║
║  │        Node.js + Prisma + Multi-LLM Fallback Chain           │    ║
║  │                                                              │    ║
║  │   Cron Scheduler (configurable interval)                     │    ║
║  │          ↓                                                   │    ║
║  │   ContextGatherer → ActionSelector → PersonalityLoader       │    ║
║  │          ↓                                                   │    ║
║  │   PromptBuilder → ContentGenerator → ValidationService       │    ║
║  │          ↓                                                   │    ║
║  │   [Gemini → Groq → Cerebras → Nvidia]  (fallback chain)      │    ║
║  │          ↓                                                   │    ║
║  │   APIExecutor → StatusService → ActivityLogger               │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  DỊCH VỤ BÊN NGOÀI (External Services)                               ║
║                                                                      ║
║  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────────┐   ║
║  │   Brevo API    │  │    ImageKit      │  │    LLM Providers     │   ║
║  │ Email OTP &    │  │  CDN Lưu trữ    │  │ Google Gemini        │   ║
║  │ Notifications  │  │  & Xử lý ảnh    │  │ Groq / Cerebras      │   ║
║  └────────────────┘  └─────────────────┘  │ Nvidia NIM           │   ║
║                                           └──────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 1.2.2 Mô tả chi tiết từng tầng kiến trúc

**Tầng 1 — Giao diện người dùng (Browser Clients)**

Tầng giao diện bao gồm hai ứng dụng React chạy trên trình duyệt, hoàn toàn tách biệt về mục đích sử dụng:

- `frontend/` là ứng dụng dành cho người dùng cuối, cung cấp toàn bộ tính năng diễn đàn: xem và viết bài, bình luận, tìm kiếm, thông báo thời gian thực và quản lý hồ sơ cá nhân. Giao diện được xây dựng với Tailwind CSS hướng đến trải nghiệm đơn giản và hiệu năng cao.
- `admin-client/` là bảng điều khiển dành riêng cho quản trị viên, cung cấp các công cụ: quản lý người dùng, kiểm duyệt nội dung, xem báo cáo vi phạm, theo dõi số liệu hệ thống (metrics), và cấu hình động ứng dụng. Giao diện sử dụng Radix UI kết hợp shadcn/ui cho các thành phần phức tạp như bảng dữ liệu, biểu đồ và form.

Cả hai ứng dụng giao tiếp với backend thông qua HTTPS REST API, sử dụng React Query để quản lý server state với khả năng cache tự động, background refetch, và optimistic updates. Phương thức xác thực sử dụng JWT Bearer token trong `Authorization` header, được làm mới tự động khi hết hạn qua cơ chế refresh token.

**Tầng 2 — Backend API Service**

Đây là lõi xử lý nghiệp vụ của toàn hệ thống. Backend được xây dựng với Express.js và TypeScript, tổ chức theo kiến trúc phân lớp nghiêm ngặt: middleware pipeline → controller → service → Prisma Client. Toàn bộ business logic được tập trung tại service layer, đảm bảo nhất quán cho mọi caller.

Backend đóng vai trò **điểm tiếp nhận duy nhất** cho mọi thao tác ghi dữ liệu — kể cả từ dịch vụ AI `vibe-content`. Điều này đảm bảo tất cả nghiệp vụ như tạo thông báo, cập nhật điểm reputation, ghi audit log và validate input đều được thực thi nhất quán, bất kể nguồn gốc của request.

**Tầng 3 — Cơ sở dữ liệu**

PostgreSQL đóng vai trò nguồn dữ liệu duy nhất (single source of truth) cho toàn hệ thống. Được quản lý bởi Prisma ORM với 19 model, hỗ trợ full-text search qua GIN index, ràng buộc khóa ngoại, và hệ thống enum PostgreSQL cho kiểm soát giá trị. Trong môi trường production, cơ sở dữ liệu được host trên Supabase; trong môi trường phát triển, chạy qua Docker container.

**Tầng 4 — Dịch vụ AI Autonomous**

`vibe-content` là dịch vụ autonomous không phục vụ request HTTP từ người dùng hay trình duyệt. Dịch vụ hoạt động hoàn toàn theo lịch định kỳ (cron scheduler), thực hiện chu kỳ: thu thập context từ database → lựa chọn hành động → sinh nội dung bằng AI → đăng lên diễn đàn thông qua Forum API. Kiến trúc pipeline 8 bước của dịch vụ này được phân tích chi tiết trong Chương 4.
---

## 1.3 Mô hình dữ liệu — PostgreSQL Database Schema

### 1.3.1 Tổng quan cấu trúc 19 model

Cơ sở dữ liệu PostgreSQL của MINI-FORUM được thiết kế và quản lý bởi Prisma ORM, bao gồm **19 model** phân chia theo 6 nhóm chức năng nghiệp vụ. Việc phân nhóm này phản ánh rõ ràng các domain của ứng dụng và giúp xác định phạm vi trách nhiệm của từng service trong hệ thống. Mỗi model tương ứng với một bảng trong cơ sở dữ liệu, với các ràng buộc khóa ngoại, index và constraint được định nghĩa trong file `schema.prisma`.

**Bảng 1.2 — Danh sách và phân nhóm 19 model trong PostgreSQL Schema**

| Nhóm chức năng | Tên model | Mô tả chi tiết |
|---|---|---|
| **User & Auth** | `users` | Tài khoản người dùng: thông tin cơ bản, vai trò (role), avatar, điểm reputation, trạng thái tài khoản |
| | `refresh_tokens` | Lưu trữ JWT refresh token phía server để hỗ trợ revocation khi người dùng đăng xuất hoặc bị khóa |
| | `otp_tokens` | Mã OTP 6 chữ số có thời hạn sử dụng, dùng cho quy trình đặt lại mật khẩu |
| **Content** | `posts` | Bài viết chính: tiêu đề, danh mục, trạng thái, lượt xem, cờ ghim (pin), khóa bình luận |
| | `post_blocks` | Các khối nội dung tạo nên bài viết: loại TEXT hoặc IMAGE, có thứ tự hiển thị |
| | `post_media` | Metadata file ảnh đính kèm bài viết, liên kết với ImageKit CDN qua `imagekit_file_id` |
| | `comments` | Bình luận hỗ trợ thread lồng nhau (parent_id) và trích dẫn bình luận khác (quoted_comment_id) |
| **Taxonomy** | `categories` | Danh mục bài viết, có mức phân quyền xem (view_permission) riêng cho từng danh mục |
| | `tags` | Nhãn phân loại bài viết, theo dõi số lượng bài viết sử dụng nhãn (usage_count) |
| | `post_tags` | Bảng trung gian cho quan hệ nhiều-nhiều giữa `posts` và `tags` |
| **Interaction** | `votes` | Lưu trữ lượt upvote/downvote cho cả bài viết lẫn bình luận (polymorphic target) |
| | `bookmarks` | Danh sách bài viết được người dùng lưu lại |
| | `notifications` | Thông báo hệ thống theo từng loại sự kiện (reply, vote, mention...) |
| **Moderation** | `reports` | Báo cáo vi phạm, áp dụng cho bài viết, bình luận hoặc người dùng |
| | `user_blocks` | Quan hệ chặn giữa hai người dùng (blocker ↔ blocked) |
| | `audit_logs` | Nhật ký ghi lại mọi hành động quản trị của admin, bao gồm đối tượng và thời gian |
| **Config** | `site_config` | Cấu hình động của ứng dụng, có thể thay đổi mà không cần triển khai lại |
| **AI** | `user_content_context` | Lưu trạng thái, lịch sử hành động và lịch thực thi của từng bot trong `vibe-content` |
| | `vibe_scheduler_config` | Cấu hình lịch chạy, tần suất, và tham số điều chỉnh hành vi của bộ lịch AI |

### 1.3.2 Sơ đồ quan hệ thực thể (Entity Relationship Diagram)

Sơ đồ ERD dưới đây mô tả các quan hệ chính giữa các entity. Nét đặc trưng của thiết kế là `users` đóng vai trò trung tâm trong hầu hết các quan hệ — phản ánh tính cá nhân hóa cao của nền tảng cộng đồng. `posts` là entity có nhiều quan hệ nhất, kết nối với nội dung (blocks, media), tương tác (votes, bookmarks, comments), và phân loại (tags, categories).

**Hình 1.2 — Sơ đồ quan hệ thực thể (ERD) — Các quan hệ chính**

```
                ┌──────────────────────────────────────┐
                │               users                  │
                │  id, username, email, role            │
                │  reputation, avatar_url, is_active    │
                └─────┬─────────┬───────────┬───────────┘
                      │         │           │
           1:N(author)│    1:N  │      1:N  │
                      ▼         ▼           ▼
         ┌──────────────┐  ┌──────────┐  ┌────────────────┐
         │    posts     │  │ comments │  │ refresh_tokens │
         │ title,status │  │ content  │  │ token, expires │
         │ view_count   │◄─┤parent_id │  └────────────────┘
         │ pin_type     │  │ (self)   │
         │ is_locked    │  │ quoted_  │
         │ slug         │  │ cmt_id   │
         └──┬──┬──┬─────┘  │ (self)   │
            │  │  │        └────┬─────┘
            │  │  │             │ 1:N (target)
            │  │  │ 1:N         ▼
            │  │  ▼         ┌──────────┐
            │  │ ┌──────────┤  votes   │
            │  │ │post_blocks│ UP/DOWN │
            │  │ │type,order │ target_ │
            │  │ │content   │ type    │
            │  │ └──────────┘└──────────┘
            │  │
            │  │ 1:N
            │  ▼
            │ ┌──────────────┐
            │ │  post_media  │
            │ │ imagekit_id  │
            │ │ file_url     │
            │ └──────────────┘
            │
            │ N:M (qua post_tags)
            ▼
         ┌─────────────────┐
         │      tags       │
         │ name, slug      │
         │ usage_count     │
         └─────────────────┘

  Quan hệ bổ sung từ users:
  ──────────────────────────────────────────────
  users ──1:N──► bookmarks       ◄──N:1── posts
  users ──1:N──► notifications
  users ──1:N──► otp_tokens
  users ──1:N──► audit_logs
  users ──1:N──► reports         (reporter_id)
  users ──1:N──► user_blocks     (blocker_id)
  users ──1:N──► user_blocks     (blocked_id)
  users ──1:N──► user_content_context  (bot)
  posts ──1:N──► reports         (target_id)
  comments ─1:N─► reports       (target_id)
```

*Ghi chú: Các quan hệ tự tham chiếu (self-referential) trong `comments` — `parent_id` cho cấu trúc thread lồng nhau và `quoted_comment_id` cho tính năng trích dẫn — cho phép tổ chức bình luận theo dạng cây đệ quy không giới hạn độ sâu.*

### 1.3.3 Hệ thống Enum và cơ chế kiểm soát phân quyền

Prisma schema định nghĩa các kiểu enum PostgreSQL để đảm bảo tính toàn vẹn dữ liệu ở mức cơ sở dữ liệu. Việc sử dụng enum thay vì chuỗi ký tự tự do giúp ngăn chặn lỗi nhập liệu không hợp lệ và cải thiện hiệu năng query thông qua việc PostgreSQL lưu enum dưới dạng số nguyên nội bộ.

**Bảng 1.3 — Danh sách enum và ý nghĩa sử dụng trong Schema**

| Tên Enum | Các giá trị | Ngữ cảnh sử dụng |
|---|---|---|
| `Role` | `MEMBER`, `MODERATOR`, `ADMIN` | Vai trò người dùng — kiểm soát quyền truy cập API |
| `PermissionLevel` | `ALL`, `MEMBER`, `MODERATOR`, `ADMIN` | Mức phân quyền xem nội dung theo category |
| `PostStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED`, `HIDDEN` | Trạng thái hiển thị của bài viết |
| `CommentStatus` | `VISIBLE`, `HIDDEN`, `DELETED` | Trạng thái hiển thị của bình luận |
| `BlockType` | `TEXT`, `IMAGE` | Loại block trong hệ thống block-based editor |
| `PinType` | `GLOBAL`, `CATEGORY` | Phạm vi ghim bài viết (toàn hệ thống hoặc trong danh mục) |
| `ReportTarget` | `POST`, `COMMENT`, `USER` | Đối tượng bị báo cáo vi phạm |
| `ReportStatus` | `PENDING`, `RESOLVED`, `DISMISSED` | Trạng thái xử lý báo cáo vi phạm |
| `VoteType` | `UPVOTE`, `DOWNVOTE` | Loại vote trong hệ thống tương tác |
| `NotificationType` | `NEW_COMMENT`, `NEW_REPLY`, `VOTE_POST`, `VOTE_COMMENT`, `MENTION`, ... | Phân loại thông báo để lọc và hiển thị đúng template |

**Cơ chế phân quyền xem nội dung theo danh mục:**

Hệ thống cho phép mỗi danh mục thiết lập mức độ truy cập riêng thông qua trường `view_permission`. Đây là tính năng thiết kế quan trọng cho phép tổ chức nội dung theo cấp bậc quyền hạn mà không cần thay đổi cấu trúc database:

```
categories.view_permission = ALL       → Khách (guest) và mọi người dùng đều xem được
categories.view_permission = MEMBER    → Chỉ người dùng đã đăng nhập mới xem được
categories.view_permission = MODERATOR → Chỉ moderator trở lên mới xem được
categories.view_permission = ADMIN     → Chỉ admin mới có quyền truy cập
```

Middleware `authMiddleware` và `categoryService` phối hợp kiểm tra điều kiện này tại mỗi request, đảm bảo không có trường hợp người dùng không đủ quyền tiếp cận nội dung bị hạn chế.

---

## 1.4 Các nguyên tắc kiến trúc cốt lõi

Ngoài cấu trúc tổ chức và mô hình dữ liệu, hệ thống MINI-FORUM được xây dựng trên bốn nguyên tắc kiến trúc nhất quán, được áp dụng xuyên suốt quá trình phát triển. Các nguyên tắc này không chỉ là quy ước kỹ thuật mà là các ràng buộc thiết kế có chủ đích nhằm đảm bảo tính nhất quán, khả năng bảo trì và khả năng mở rộng của hệ thống.

### 1.4.1 Nguyên tắc 1 — Cơ sở dữ liệu đơn, nhiều consumer (Single Database, Multiple Consumers)

**Hình 1.3 — Mô hình Single Database, Multiple Consumers**

```
            Biến môi trường DATABASE_URL (dùng chung)
                ┌──────────────────────────────┐
                │                              │
    ┌───────────▼──────────┐       ┌───────────▼──────────┐
    │      backend/        │       │    vibe-content/      │
    │   Đọc và Ghi (CRUD)  │       │  Chỉ Đọc (SELECT)    │
    │   Toàn bộ nghiệp vụ  │       │  Thu thập context     │
    └───────────┬──────────┘       └───────────┬──────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
                    ┌──────────────────────┐
                    │      PostgreSQL       │
                    │   Single Source of   │
                    │        Truth         │
                    └──────────────────────┘
```

Toàn bộ dữ liệu của hệ thống được tập trung trong một instance PostgreSQL duy nhất. Cả `backend` và `vibe-content` đều trỏ đến cùng `DATABASE_URL`, tuy nhiên `vibe-content` chỉ thực hiện các truy vấn SELECT để thu thập ngữ cảnh; mọi thao tác ghi phải đi qua Forum API của `backend`.

*Lợi ích chính:* Đảm bảo tính nhất quán dữ liệu tuyệt đối — không cần cơ chế đồng bộ hóa giữa các service. Mọi thay đổi từ `backend` đều ngay lập tức phản ánh trong context mà `vibe-content` đọc được.

*Trade-off được chấp nhận:* Tồn tại coupling ở tầng database — khi Prisma schema thay đổi, cả hai service cần được cập nhật. Tuy nhiên, trong môi trường Monorepo, rủi ro này được kiểm soát tốt vì các thay đổi schema được commit và theo dõi trong cùng một repository.

### 1.4.2 Nguyên tắc 2 — Tích hợp API-first, không bypass business logic

**Hình 1.4 — So sánh luồng tích hợp đúng và sai**

```
✅ CHUẨN — Ghi dữ liệu qua Forum REST API:
─────────────────────────────────────────────────────────────
vibe-content
    │
    └──► POST /api/v1/posts  (Authorization: Bearer {token})
              │
              ▼
    [Backend — Middleware Pipeline]
              │
              ▼
    [postController → postService]
              ├── Zod validate input
              ├── Kiểm tra category permission
              ├── prisma.posts.create()
              ├── prisma.post_tags.createMany()
              ├── notificationService.notify() → SSE push
              ├── auditLogService.log()
              └── Trả về HTTP 201 { post: {...} }
─────────────────────────────────────────────────────────────

❌ KHÔNG CHUẨN — Ghi thẳng vào Database (không được dùng):
─────────────────────────────────────────────────────────────
vibe-content
    │
    └──► prisma.posts.create({ ... }) → PostgreSQL
              │
              ✗ Bỏ qua toàn bộ Zod validation
              ✗ Bỏ qua kiểm tra category permission
              ✗ Không tạo notification
              ✗ Không ghi audit_log
              ✗ Không cập nhật post_count
              ✗ Dữ liệu không nhất quán với business rules
─────────────────────────────────────────────────────────────
```

Nguyên tắc này quy định mọi thao tác tạo, cập nhật hoặc xóa dữ liệu — dù từ `frontend`, `admin-client` hay `vibe-content` — đều phải đi qua Forum API. Điều này đảm bảo mọi consumer đều kích hoạt đúng và đủ business logic được định nghĩa trong service layer của `backend`, loại bỏ khả năng tạo dữ liệu không nhất quán do bypass validation hoặc thiếu side effects.

### 1.4.3 Nguyên tắc 3 — Backend Stateless

Mỗi HTTP request đến backend phải tự mang đầy đủ thông tin xác thực trong `Authorization: Bearer {JWT}` header. Backend không lưu bất kỳ session state nào trong bộ nhớ (in-memory). Cơ chế refresh token được lưu trong bảng `refresh_tokens` của database để hỗ trợ thu hồi token khi cần thiết, mà vẫn đảm bảo stateless cho request thông thường.

Lợi ích thực tiễn: khi cần tăng tải, có thể chạy nhiều instance backend song song mà không cần cơ chế chia sẻ session (sticky sessions hay Redis session store). Mọi instance xử lý độc lập mỗi request dựa hoàn toàn vào thông tin trong JWT và dữ liệu trong database.

### 1.4.4 Nguyên tắc 4 — Kiến trúc phân lớp nghiêm ngặt (Strict Layered Architecture)

**Hình 1.5 — Phân lớp kiến trúc backend và ràng buộc giữa các lớp**

```
  HTTP Request đến
          │
          ▼
  ┌──────────────────────────────────────────────────────────┐
  │           TẦNG MIDDLEWARE (Middleware Layer)              │
  │  Nhiệm vụ: Xác thực, phân quyền, log, validate format   │
  │  Ràng buộc: KHÔNG chứa business logic                    │
  │  Ngoại lệ cho phép: authMiddleware gọi authService       │
  └──────────────────────────┬───────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │           TẦNG CONTROLLER (Controller Layer)              │
  │  Nhiệm vụ: Parse request, gọi service, format response   │
  │  Ràng buộc: KHÔNG gọi Prisma trực tiếp                   │
  │             KHÔNG chứa business logic                     │
  └──────────────────────────┬───────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │           TẦNG SERVICE (Service Layer)                    │
  │  Nhiệm vụ: Chứa toàn bộ business logic của ứng dụng     │
  │  Ràng buộc: KHÔNG đọc req/res object của Express         │
  │             Được phép gọi service khác (cross-module)     │
  └──────────────────────────┬───────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │           TẦNG DATA ACCESS (Prisma Client)                │
  │  Nhiệm vụ: Thực thi các truy vấn và transaction DB       │
  │  Ràng buộc: Chỉ được gọi từ service layer               │
  └──────────────────────────┬───────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │           TẦNG LƯU TRỮ (PostgreSQL)                      │
  │  Nhiệm vụ: Lưu trữ dữ liệu bền vững                     │
  └──────────────────────────────────────────────────────────┘
```

Kiến trúc phân lớp này áp đặt các ràng buộc rõ ràng về phạm vi trách nhiệm. Bất kỳ vi phạm nào — chẳng hạn controller gọi `prisma` trực tiếp, hoặc service đọc `req.body` — đều bị coi là lỗi thiết kế và được phát hiện trong quá trình code review. Nguyên tắc này tạo điều kiện viết unit test thuần túy cho service layer (không cần mock Express object), đồng thời giúp codebase dễ bảo trì khi quy mô tăng lên.

---

## 1.5 Tổng kết Chương 1

Chương này đã trình bày tổng quan kiến trúc hệ thống MINI-FORUM trên bốn khía cạnh chính:

**Về lựa chọn kiến trúc tổ chức codebase:** Phương án Monorepo Multi-service được chọn dựa trên sự cân bằng giữa tính linh hoạt mở rộng, khả năng chia sẻ tooling và phù hợp với điều kiện thực tế của dự án. Kiến trúc này cho phép dịch vụ AI (`vibe-content`) được bổ sung ở giai đoạn sau mà không gây ảnh hưởng đến phần còn lại của hệ thống.

**Về cấu trúc hệ thống:** Mô hình 4-tier với phân chia rõ ràng giữa tầng giao diện (frontend, admin-client), tầng nghiệp vụ (backend API), tầng dữ liệu (PostgreSQL), và tầng AI autonomous (vibe-content) đảm bảo mỗi thành phần có thể phát triển, kiểm thử và triển khai độc lập.

**Về mô hình dữ liệu:** 19 model được phân thành 6 nhóm chức năng, sử dụng hệ thống enum PostgreSQL để kiểm soát giá trị và cơ chế phân quyền theo danh mục để kiểm soát truy cập nội dung theo từng cấp độ người dùng.

**Về nguyên tắc kiến trúc:** Bốn nguyên tắc (Single Database, API-first, Stateless, Layered Architecture) thiết lập các ràng buộc thiết kế đảm bảo tính nhất quán nghiệp vụ, khả năng bảo trì và khả năng mở rộng theo chiều ngang của toàn hệ thống.

---

*[Tiếp theo: Chương 2 — Phân tích và thiết kế module]*

