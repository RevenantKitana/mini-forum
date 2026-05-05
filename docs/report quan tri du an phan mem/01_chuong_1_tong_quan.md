# CHƯƠNG 1: TỔNG QUAN DỰ ÁN

---

## 1.1 Mô tả dự án

### 1.1.1 Giới thiệu chung

MINI-FORUM là ứng dụng diễn đàn trực tuyến full-stack được thiết kế và phát triển từ đầu trong khuôn khổ thực tập chuyên đề kéo dài 3 tháng (27/01/2026 – 27/04/2026). Đây là một dự án phần mềm có quy mô vừa, hướng tới việc cung cấp nền tảng thảo luận cộng đồng hiện đại, nơi người dùng có thể đăng bài viết với định dạng nội dung phong phú (block layout), tương tác qua hệ thống bình luận lồng nhau đa cấp (nested comments), bình chọn và đánh giá chất lượng nội dung thông qua cơ chế upvote/downvote, cũng như nhận thông báo hoạt động theo thời gian thực.

Dự án được xây dựng theo kiến trúc **monorepo** với bốn thành phần riêng biệt, mỗi thành phần giải quyết một miền vấn đề độc lập và có thể triển khai độc lập lên các nền tảng đám mây. Toàn bộ hệ thống được đóng gói bằng Docker, áp dụng TypeScript strict mode trên cả frontend lẫn backend, và sử dụng Prisma ORM để quản lý tầng dữ liệu với cơ sở dữ liệu PostgreSQL.

Điểm khác biệt nổi bật của MINI-FORUM so với các hệ thống diễn đàn thông thường là việc tích hợp service sinh nội dung AI tự động (`vibe-content`) — một microservice độc lập có khả năng sử dụng nhiều nhà cung cấp Mô hình Ngôn ngữ Lớn (LLM — Large Language Model) theo cơ chế fallback tự động (Gemini → Groq → Cerebras → Nvidia). Service này đảm nhận vai trò giải quyết vấn đề **cold-start** — một thách thức kinh điển của mọi nền tảng cộng đồng mới: làm thế nào để khi người dùng đầu tiên đăng ký, họ không thấy một diễn đàn trống rỗng.

Về bối cảnh dự án, MINI-FORUM được phát triển như một hệ thống thực tế có thể triển khai sản xuất, không chỉ là bài tập học thuật. Mọi quyết định kỹ thuật đều cân nhắc đến tính ổn định, bảo mật (OWASP Top 10), khả năng bảo trì và khả năng mở rộng theo chiều ngang trong tương lai.

### 1.1.2 Bối cảnh và lý do hình thành dự án

Nhu cầu xây dựng MINI-FORUM xuất phát từ ba quan sát thực tế:

**Thứ nhất**, các diễn đàn hiện có trên thị trường (Reddit, Discourse, NodeBB) hoặc quá phức tạp về mặt vận hành, hoặc không cung cấp khả năng tùy biến sâu về logic nghiệp vụ. Một tổ chức muốn có diễn đàn nội bộ với quy tắc kiểm duyệt riêng cần một giải pháp có thể kiểm soát toàn bộ codebase.

**Thứ hai**, các hệ thống CMS truyền thống không hỗ trợ tốt trải nghiệm tương tác cộng đồng (vote, nested comments, real-time notifications) vốn là yêu cầu cốt lõi của một diễn đàn kỹ thuật.

**Thứ ba**, thực tập sinh cần một dự án đủ phức tạp để rèn luyện kỹ năng full-stack toàn diện: thiết kế database quan hệ, REST API với xác thực và phân quyền, frontend reactive, tích hợp dịch vụ bên thứ ba (email, CDN, AI) và quy trình CI/CD.

### 1.1.3 Kiến trúc tổng thể hệ thống

Hệ thống MINI-FORUM được tổ chức theo mô hình monorepo với bốn thành phần độc lập, mỗi thành phần có `package.json`, `Dockerfile` và cấu hình triển khai riêng. Các thành phần giao tiếp với nhau thông qua giao thức HTTP/REST — không có message broker hay event bus trong phiên bản hiện tại.

**Hình 1.1 — Kiến trúc tổng thể hệ thống MINI-FORUM**

```
╔═══════════════════════════════════════════════════════════════════════╗
║                     MINI-FORUM — Kiến trúc Monorepo                  ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║   TẦNG GIAO DIỆN (Presentation Layer)                                 ║
║  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    ║
║  │   frontend/      │  │  admin-client/   │  │  vibe-content/   │    ║
║  │                  │  │                  │  │                  │    ║
║  │  React 18        │  │  React 18        │  │  Node.js Bot     │    ║
║  │  Vite 5.x        │  │  Vite 5.x        │  │  TypeScript      │    ║
║  │  TailwindCSS 3   │  │  Radix UI        │  │  Cron Scheduler  │    ║
║  │  React Query 5   │  │  shadcn/ui       │  │                  │    ║
║  │  Dark Mode ✓     │  │  Data Tables     │  │  LLM Providers:  │    ║
║  │                  │  │                  │  │  • Gemini (1st)  │    ║
║  │  14 trang React  │  │  12 trang quản   │  │  • Groq (2nd)    │    ║
║  │                  │  │  trị viên        │  │  • Cerebras (3rd)│    ║
║  │  Port: 5173      │  │  Port: 5174      │  │  • Nvidia (4th)  │    ║
║  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘    ║
║           │                     │                     │              ║
║           └─────────────────────┴─────────────────────┘              ║
║                                 │ HTTP / REST API                    ║
║                                 │ (JSON over HTTPS)                  ║
║                                 ▼                                    ║
║   TẦNG XỬ LÝ NGHIỆP VỤ (Business Logic Layer)                        ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │                        backend/                              │    ║
║  │                                                              │    ║
║  │  Node.js 18 + Express 4.x + TypeScript (strict mode)        │    ║
║  │  Prisma 5.x ORM    │    9 Middlewares                        │    ║
║  │  14 Controllers    │    21 Services                          │    ║
║  │                                                              │    ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    ║
║  │  │ Auth Module  │  │ Forum Core   │  │  Admin Module    │   │    ║
║  │  │ JWT + OTP    │  │ Post/Comment │  │  Moderation      │   │    ║
║  │  │ RBAC (3 vai  │  │ Vote/Search  │  │  Audit Log       │   │    ║
║  │  │ trò)         │  │ SSE Notif.   │  │  Dashboard       │   │    ║
║  │  └──────────────┘  └──────────────┘  └──────────────────┘   │    ║
║  │                                                              │    ║
║  │  Port: 5000                                                  │    ║
║  └──────────────────────────────┬───────────────────────────────┘    ║
║                                 │ Prisma ORM (SQL)                   ║
║                                 ▼                                    ║
║   TẦNG DỮ LIỆU (Data Layer)                                          ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │                  PostgreSQL Database                         │    ║
║  │                  19 Models / Tables                          │    ║
║  │                                                              │    ║
║  │  Users, Posts, PostBlocks, Comments, Categories, Tags        │    ║
║  │  Votes, Notifications, Bookmarks, Reports, AuditLogs, ...   │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                       ║
║   DỊCH VỤ BÊN NGOÀI (External Services)                              ║
║  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ║
║  │  Brevo API  │  │  ImageKit    │  │  Render.com  │  │  Vercel  │  ║
║  │  (Email OTP)│  │  (CDN Media) │  │  (Backend)   │  │  (Front) │  ║
║  └─────────────┘  └──────────────┘  └──────────────┘  └──────────┘  ║
╚═══════════════════════════════════════════════════════════════════════╝
```

*Nguồn: Tác giả tự xây dựng*

**Bảng 1.1 — Kiến trúc bốn thành phần hệ thống MINI-FORUM**

| Thành phần | Công nghệ chính | Vai trò | Cổng mặc định | Triển khai |
|------------|----------------|---------|--------------|-----------|
| `backend/` | Node.js 18, Express 4.x, TypeScript 5, Prisma 5.x | REST API server, business logic, quản lý database, SSE notifications | 5000 | Render.com (Docker) |
| `frontend/` | React 18, Vite 5.x, TailwindCSS 3.x, React Query 5, React Router 6 | Giao diện người dùng cuối — diễn đàn, hồ sơ cá nhân, tìm kiếm, thông báo | 5173 | Vercel |
| `admin-client/` | React 18, Vite 5.x, Radix UI, shadcn/ui, Recharts | Bảng điều khiển quản trị viên — kiểm duyệt, thống kê, audit log | 5174 | Vercel |
| `vibe-content/` | Node.js 18, TypeScript, node-cron, Prisma, Axios | AI Bot sinh nội dung tự động, hỗ trợ 4 LLM provider với fallback | 3001 | Render.com (Docker) |

### 1.1.4 Quy mô kỹ thuật dự án

Sau 13 tuần phát triển theo mô hình Scrum (6 Sprint × 2 tuần + 1 tuần Buffer), hệ thống đạt được quy mô kỹ thuật như sau:

**Bảng 1.1b — Thống kê quy mô kỹ thuật hệ thống**

| Module | Số lượng | Chi tiết |
|--------|---------|---------|
| **Backend Controllers** | 14 | auth, users, posts, comments, categories, tags, votes, notifications, bookmarks, reports, search, admin, upload, sse |
| **Backend Services** | 21 | Mỗi domain có service riêng; emailService, imageKitService, sseService độc lập |
| **Backend Middlewares** | 9 | authenticate, authorize, rateLimiter, validation, upload, errorHandler, ... |
| **Database Models (Prisma)** | 19 | User, Post, PostBlock, Comment, Category, Tag, Vote, Notification, Bookmark, Report, AuditLog, ... |
| **Frontend Pages** | 14 | HomePage, PostDetailPage, ProfilePage, SearchPage, NotificationsPage, BookmarksPage, ... |
| **Admin Pages** | 12 | Dashboard, Users, Posts, Comments, Reports, AuditLogs, Categories, Tags, Analytics, ... |
| **AI Bot Services** | 8 | contentGenerator, postScheduler, commentScheduler, voteScheduler, llmFallback, personalityEngine, ... |
| **LLM Providers** | 4 | Google Gemini (primary), Groq, Cerebras, Nvidia NIM (fallback chain) |
| **API Endpoints** | ~65 | Phủ đầy đủ CRUD + actions đặc thù (ban, report, resolve, bookmark, vote, ...) |
| **Test Files** | 12+ | Vitest unit tests cho auth, posts, comments, upload, notifications |

---

## 1.2 Phạm vi và mục tiêu

### 1.2.1 Mục tiêu dự án

Dự án MINI-FORUM được xây dựng hướng tới hai nhóm mục tiêu song song: mục tiêu kinh doanh và mục tiêu kỹ thuật, có sự giao thoa và hỗ trợ lẫn nhau.

**Nhóm mục tiêu kinh doanh:**

1. **Cung cấp nền tảng diễn đàn độc lập, có thể triển khai ngay** — Hệ thống phải hoạt động đầy đủ sau khi cài đặt, không phụ thuộc vào dịch vụ của bên thứ ba (ngoại trừ email service và CDN tùy chọn). Tổ chức có thể self-host hoàn toàn bằng Docker Compose.

2. **Trang bị hệ thống kiểm duyệt nội dung (moderation) hoàn chỉnh** — Quản trị viên cần có công cụ xử lý báo cáo vi phạm, khóa/mở tài khoản, xóa/ẩn bài viết và bình luận, đồng thời theo dõi mọi hành động quản trị thông qua audit log để đảm bảo trách nhiệm giải trình.

3. **Giải quyết vấn đề cold-start bằng AI** — Thay vì chờ cộng đồng tự hình thành (có thể mất nhiều tháng), hệ thống sử dụng AI bot để tạo nội dung seed ban đầu có chất lượng, giả lập hoạt động cộng đồng trong giai đoạn khởi động.

**Nhóm mục tiêu kỹ thuật:**

1. Xây dựng REST API hoàn chỉnh với xác thực hai lớp: **JWT** (access token 15 phút + refresh token 7 ngày) kết hợp **OTP email** 6 chữ số hết hạn sau 10 phút, và phân quyền RBAC ba cấp (MEMBER, MODERATOR, ADMIN).

2. Triển khai hệ thống thông báo thời gian thực qua **Server-Sent Events (SSE)** — giải pháp nhẹ hơn WebSocket, phù hợp với mô hình thông báo một chiều từ server xuống client.

3. Implement tìm kiếm **full-text search** tận dụng khả năng `tsvector/tsquery` của PostgreSQL, tránh phụ thuộc vào Elasticsearch cho quy mô MVP.

4. Đóng gói toàn bộ hệ thống bằng **Docker multi-stage build** để đảm bảo tính nhất quán giữa môi trường phát triển và sản xuất, giảm thiểu "works on my machine" syndrome.

5. Đạt độ bao phủ kiểm thử **(test coverage) ≥ 60%** trên backend với framework **Vitest**, tập trung vào các domain có logic nghiệp vụ phức tạp (auth, voting, notification triggers).

### 1.2.2 Phạm vi kỹ thuật

Việc xác định rõ ràng phạm vi trong/ngoài dự án là bước quan trọng trong giai đoạn lập kế hoạch, giúp tránh scope creep — một trong những nguyên nhân hàng đầu dẫn đến trễ deadline trong dự án phần mềm.

**Bảng 1.2 — Phạm vi kỹ thuật hệ thống MINI-FORUM**

| Hạng mục | Trong phạm vi (Implemented) | Ngoài phạm vi (Excluded) | Lý do loại trừ |
|----------|----------------------------|--------------------------|----------------|
| **Giao diện người dùng** | Web app responsive (React), Admin panel web | Mobile app (iOS/Android), Desktop app (Electron) | Tăng scope quá nhiều, không phù hợp thời gian thực tập |
| **Giao tiếp thời gian thực** | Server-Sent Events (SSE) — push thông báo 1 chiều | WebSocket, chat thời gian thực, video call | SSE đủ cho use case thông báo; WebSocket là upgrade path tương lai |
| **Xác thực & Bảo mật** | Email OTP (Brevo), JWT access+refresh token, bcrypt | OAuth2 (Google/Facebook/GitHub), SSO (SAML), Passkey | Phức tạp; có thể bổ sung sau khi hệ thống core ổn định |
| **Quản lý media** | Upload ảnh lên ImageKit CDN, resize tự động | Video streaming, audio upload, file đính kèm (PDF, ZIP) | Chi phí lưu trữ và bandwidth video không phù hợp MVP |
| **Thanh toán** | Không áp dụng | Gói premium, subscription, donate | Ngoài phạm vi sản phẩm cộng đồng mở |
| **Tìm kiếm** | Full-text search PostgreSQL (`tsvector`) | Elasticsearch, Algolia, Meilisearch | PostgreSQL đủ cho quy mô dưới 100k bài viết |
| **Triển khai** | Docker, Docker Compose, Render.com, Vercel | Kubernetes, Terraform, multi-region deployment | Overkill cho MVP; Kubernetes là upgrade path rõ ràng |
| **Tính năng AI** | AI sinh bài viết/bình luận/vote theo lịch | AI moderation (auto-detect toxic), image recognition, voice-to-text | Cần dataset training riêng, không feasible trong 3 tháng |

### 1.2.3 Yêu cầu chức năng — Phân loại MoSCoW

Kỹ thuật phân loại **MoSCoW** (Must have / Should have / Could have / Won't have) được áp dụng để ưu tiên hóa backlog ngay từ Sprint 0. Đây là cơ sở để quyết định thứ tự implement các tính năng trong 6 Sprint.

**Hình 1.2 — Sơ đồ phân loại yêu cầu theo MoSCoW**

```
╔══════════════════════════════════════════════════════════════════╗
║              PHÂN LOẠI YÊU CẦU THEO MOSCOW                      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │  MUST HAVE — Bắt buộc (Sprint 0–2)                     │    ║
║  │  ▸ Đăng ký tài khoản + xác thực OTP email (Brevo)      │    ║
║  │  ▸ Đăng nhập / Đăng xuất + JWT access/refresh token    │    ║
║  │  ▸ Phân quyền 3 cấp: MEMBER / MODERATOR / ADMIN        │    ║
║  │  ▸ CRUD bài viết với Block Layout (TEXT/IMAGE/CODE/     │    ║
║  │    QUOTE)                                               │    ║
║  │  ▸ Bình luận lồng nhau (nested) và trích dẫn (quote)   │    ║
║  │  ▸ Quản lý category và tag cho bài viết                │    ║
║  │  ▸ Dashboard thống kê (admin)                          │    ║
║  │  ▸ Hệ thống báo cáo vi phạm và xử lý                  │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │  SHOULD HAVE — Nên có (Sprint 3–4)                     │    ║
║  │  ▸ Vote upvote/downvote + tính điểm reputation         │    ║
║  │  ▸ Tìm kiếm full-text PostgreSQL                       │    ║
║  │  ▸ Thông báo real-time qua SSE                         │    ║
║  │  ▸ Audit log ghi nhận hành động quản trị               │    ║
║  │  ▸ Bookmark bài viết yêu thích                         │    ║
║  │  ▸ Upload và quản lý avatar qua ImageKit CDN           │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │  COULD HAVE — Có thì tốt (Sprint 5)                    │    ║
║  │  ▸ AI bot sinh nội dung (vibe-content) đa nhân vật     │    ║
║  │  ▸ Upload ảnh trong bài viết (ImageKit CDN)             │    ║
║  │  ▸ Chặn người dùng (user block list)                   │    ║
║  │  ▸ Hồ sơ cá nhân mở rộng (bio, social links)          │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │  WON'T HAVE — Ngoài phạm vi dự án này                 │    ║
║  │  ▸ Mobile app (iOS/Android native)                     │    ║
║  │  ▸ Chat thời gian thực (WebSocket)                     │    ║
║  │  ▸ OAuth2 social login                                 │    ║
║  │  ▸ Video streaming / podcast                           │    ║
║  │  ▸ Hệ thống thanh toán / subscription                 │    ║
║  └─────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════╝
```

*Nguồn: Tác giả tự xây dựng dựa trên phương pháp MoSCoW (Clegg & Barker, 1994)*

### 1.2.4 Yêu cầu phi chức năng

Yêu cầu phi chức năng (Non-Functional Requirements — NFR) xác định chất lượng hệ thống, không phải tính năng cụ thể. Đây là các ràng buộc kỹ thuật chi phối toàn bộ quyết định thiết kế kiến trúc.

**Bảng 1.3 — Yêu cầu phi chức năng và giải pháp kỹ thuật**

| Thuộc tính | Chỉ tiêu cụ thể | Giải pháp kỹ thuật áp dụng | Trạng thái |
|------------|----------------|---------------------------|-----------|
| **Hiệu năng** | API latency < 200ms (P95) cho các endpoint đọc; < 500ms cho write | PostgreSQL composite index; React Query caching (staleTime 5 phút); Pagination cursor-based | ✅ Đạt |
| **Bảo mật** | Không có lỗ hổng trong OWASP Top 10 | Helmet.js headers; express-rate-limit (100 req/15min); Zod schema validation; bcrypt (saltRounds=12); HttpOnly cookies cho refresh token | ✅ Đạt |
| **Khả năng mở rộng** | Horizontal scaling ready (stateless) | Stateless JWT (không lưu session server-side); Docker container; Database connection pool (Prisma) | ✅ Đạt |
| **Bảo trì** | TypeScript strict, zero lint error | TypeScript `"strict": true`; ESLint + Prettier; Prisma schema-first; Zod type inference | ✅ Đạt |
| **Khả dụng** | Deployment ready, health check | Docker multi-stage build; `/api/health` endpoint; Graceful shutdown xử lý SIGTERM | ✅ Đạt |
| **Khả năng kiểm thử** | Test coverage ≥ 60% (backend) | Vitest + Supertest; Test isolation với database mock; CI-ready `vitest run` command | ✅ Đạt |

---

## 1.3 Các bên liên quan (Stakeholders)

### 1.3.1 Tổng quan về quản lý stakeholder

Nhận diện và quản lý các bên liên quan (Stakeholder Management) là một trong những hoạt động cốt lõi trong quản trị dự án phần mềm. Theo PMBOK® Guide (PMI, 2021), stakeholder là "các cá nhân, nhóm hoặc tổ chức có thể ảnh hưởng hoặc bị ảnh hưởng bởi dự án, và có lợi ích trong thành công hoặc thất bại của dự án."

Trong bối cảnh dự án MINI-FORUM quy mô nhỏ (1–3 người), việc xác định rõ stakeholder giúp tránh tình trạng build sai thứ — phát triển tính năng không ai cần, hoặc bỏ sót yêu cầu cốt lõi của người dùng thực sự.

### 1.3.2 Nhận diện và phân tích stakeholder

Dự án MINI-FORUM có bốn nhóm stakeholder chính. Mỗi nhóm có profile lợi ích, mức độ tham gia và ảnh hưởng khác nhau đối với các quyết định dự án.

**Bảng 1.4 — Phân tích chi tiết các bên liên quan**

| Stakeholder | Mô tả | Quyền lợi chính | Mối lo ngại | Mức độ tham gia | Mức độ ảnh hưởng |
|-------------|-------|----------------|------------|----------------|-----------------|
| **Development Team** (Nhóm phát triển) | Nhóm 1–3 người: Lead Developer kiêm Scrum Master; Frontend Developer | Sản phẩm hoạt động đúng spec; code quality cao; học được công nghệ mới; deadline đúng hạn | Scope creep, nợ kỹ thuật tích lũy, thiếu feedback | **Cao** — tham gia 100% thời gian dự án | **Cao** — ra mọi quyết định kỹ thuật |
| **Product Owner** (Chủ sản phẩm) | Giảng viên hướng dẫn / đại diện yêu cầu nghiệp vụ | Hệ thống đáp ứng đầy đủ use case; UX trực quan; tài liệu đầy đủ | Dự án không hoàn thành đúng hạn; feature không hoạt động khi demo | **Trung bình** — Sprint Planning (đầu sprint) và Sprint Review (cuối sprint) | **Cao** — xác nhận/từ chối acceptance criteria |
| **End User — Member** (Người dùng thành viên) | Người dùng cuối: đọc bài, đăng bài, bình luận, vote, nhận thông báo | Giao diện thân thiện; tốc độ tải nhanh; thông báo kịp thời; nội dung phong phú | Trải nghiệm kém (lag, UI phức tạp); mất dữ liệu; spam nội dung | **Thấp** — phản hồi qua user testing nội bộ Sprint 4–5 | **Trung bình** — phản hồi định hướng UX |
| **Admin User** (Quản trị viên) | Người vận hành nền tảng: kiểm duyệt nội dung, quản lý user, xử lý báo cáo | Dashboard đầy đủ; công cụ moderation nhanh; audit log tin cậy; ít thao tác thủ công | Thiếu công cụ xử lý vi phạm; audit log không đầy đủ; không rõ hành động nào được phép | **Trung bình** — kiểm thử admin panel Sprint 4 | **Trung bình** — yêu cầu tính năng admin module |

### 1.3.3 Ma trận ảnh hưởng và mức độ tham gia (Power-Interest Grid)

Ma trận Power-Interest (hay còn gọi là Power-Interest Grid, Eden & Ackermann, 1998) là công cụ phân tích stakeholder phổ biến, giúp xác định chiến lược quản lý phù hợp cho từng nhóm.

**Hình 1.3 — Ma trận Power-Interest của các bên liên quan MINI-FORUM**

```
  Mức độ ảnh hưởng (Power)
         │
    Cao  │  ┌──────────────────────────────────┐
         │  │    MANAGE CLOSELY                │
         │  │                                  │
         │  │   ◉ Product Owner               │
         │  │   ◉ Development Team            │
    ---  ┼  ├──────────────────────────────────┤
         │  │    KEEP INFORMED                 │
   Thấp  │  │                                  │
         │  │   ◎ Admin User                  │
         │  │                          ◎ End  │
         │  │                            User  │
         │  └──────────────────────────────────┘
         └──────────────────────────────────────
              Thấp                         Cao
                    Mức độ tham gia (Interest)
```

| Vùng ma trận | Stakeholder | Chiến lược quản lý |
|-------------|-------------|-------------------|
| **Manage Closely** (Power cao, Interest cao) | Development Team, Product Owner | Giao tiếp thường xuyên; cập nhật tiến độ hàng ngày; ra quyết định cùng nhau |
| **Keep Satisfied** (Power cao, Interest thấp) | — | N/A trong dự án này |
| **Keep Informed** (Power thấp, Interest cao) | Admin User, End User | Cập nhật qua Sprint Review demo; thu thập feedback định kỳ |
| **Monitor** (Power thấp, Interest thấp) | — | N/A trong dự án này |

### 1.3.4 Chiến lược giao tiếp và tham gia stakeholder

Dựa trên phân tích ma trận ở trên, các chiến lược giao tiếp cụ thể được thiết lập cho từng nhóm:

**Bảng 1.5 — Kế hoạch giao tiếp stakeholder**

| Stakeholder | Kênh giao tiếp | Tần suất | Nội dung | Người chịu trách nhiệm |
|-------------|---------------|---------|---------|----------------------|
| **Development Team** | Daily Standup (15 phút) | Hàng ngày (mỗi sáng) | Tiến độ hôm qua / hôm nay; blocker cần xử lý | Scrum Master (Lead Dev) |
| **Product Owner** | Sprint Planning | Đầu mỗi sprint (2 tuần/lần) | Sprint Goal; chọn stories từ backlog; estimate | Lead Developer |
| **Product Owner** | Sprint Review (demo) | Cuối mỗi sprint | Demo working software; thu thập feedback; update backlog | Toàn team |
| **Product Owner** | Sprint Retrospective | Sau Sprint Review | Cải tiến quy trình; action items | Scrum Master |
| **End User** | User Testing Session | Sprint 4 và Sprint 5 | Test giao diện frontend; thu thập UX feedback | Frontend Developer |
| **Admin User** | Admin Panel Testing | Sprint 4 | Kiểm thử workflow quản trị; feedback về UX admin | Lead Developer |
| **Tất cả** | Documentation trong `docs/` | Cập nhật liên tục | Quyết định kỹ thuật, API docs, README | Lead Developer |

### 1.3.5 Quản lý kỳ vọng stakeholder

Một rủi ro thường gặp trong dự án có Product Owner là giảng viên là **kỳ vọng không được quản lý tốt** — sinh viên làm theo ý mình mà không xác nhận với giảng viên, dẫn đến sprint review thất bại hoặc phải làm lại.

Biện pháp phòng ngừa được áp dụng:
- **Sprint Goal viết thành văn bản** trước khi bắt đầu mỗi sprint, được Product Owner xác nhận.
- **Acceptance Criteria cụ thể** cho mỗi User Story (ví dụ: "Khi đăng nhập sai mật khẩu 5 lần, tài khoản bị khóa 30 phút").
- **Demo live** thay vì chỉ trình bày slide — mọi tính năng phải chạy được trong buổi Sprint Review.
- **Backlog refinement** vào giữa sprint để phát hiện sớm nếu sprint goal có nguy cơ không đạt.

---

*[Tiếp theo: Chương 2 — Mô hình phát triển và lý do lựa chọn]*
