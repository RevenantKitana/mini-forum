# CHƯƠNG 2: MÔ HÌNH PHÁT TRIỂN VÀ LÝ DO LỰA CHỌN

---

## 2.1 So sánh các mô hình phát triển phần mềm

### 2.1.1 Tổng quan về các mô hình phát triển phần mềm

Lựa chọn mô hình phát triển phần mềm (Software Development Methodology) là một trong những quyết định quan trọng nhất trong giai đoạn khởi động dự án, bởi nó chi phối toàn bộ cách tổ chức công việc, phân bổ nguồn lực, quản lý rủi ro và phản ứng trước sự thay đổi yêu cầu trong suốt vòng đời dự án.

Trước khi khởi động dự án MINI-FORUM, nhóm phát triển đã tiến hành đánh giá có hệ thống ba mô hình phổ biến nhất: **Waterfall** (thác nước), **Kanban** và **Scrum**. Việc đánh giá dựa trên bộ tiêu chí phù hợp với đặc thù của dự án: quy mô team nhỏ (1–3 người), thời gian cố định 3 tháng, yêu cầu có thể thay đổi trong quá trình phát triển, và cần demo tiến độ định kỳ cho giảng viên hướng dẫn.

### 2.1.2 Đặc điểm từng mô hình

**Mô hình Waterfall (Thác nước):**

Waterfall là mô hình phát triển tuần tự truyền thống, trong đó dự án tiến hành qua các pha cố định: Yêu cầu → Phân tích → Thiết kế → Lập trình → Kiểm thử → Triển khai → Bảo trì. Mỗi pha phải hoàn thành trước khi pha tiếp theo bắt đầu. Mô hình này phù hợp với các dự án có yêu cầu cố định từ đầu, ít thay đổi, và cần tài liệu hóa đầy đủ (ví dụ: hệ thống phần mềm nhúng, hệ thống y tế có quy định nghiêm ngặt).

**Mô hình Kanban:**

Kanban (xuất phát từ Toyota Production System) là hệ thống quản lý luồng công việc trực quan thông qua bảng Kanban với các cột (To Do → In Progress → Done) và giới hạn WIP (Work In Progress). Kanban không quy định iteration có độ dài cố định, phù hợp với công việc vận hành liên tục (support, maintenance). Tuy nhiên, Kanban thiếu cấu trúc Sprint Goal và Retrospective, khiến khó đo lường tiến độ tổng thể.

**Mô hình Scrum:**

Scrum (Schwaber & Sutherland, 1993) là một framework Agile cung cấp cấu trúc vòng lặp rõ ràng (Sprint), các vai trò xác định (Product Owner, Scrum Master, Development Team), và một bộ ceremonies (Sprint Planning, Daily Standup, Sprint Review, Retrospective). Scrum đặc biệt phù hợp với các dự án có yêu cầu không chắc chắn, cần phản hồi liên tục, và team nhỏ có khả năng tự tổ chức.

### 2.1.3 Bảng so sánh chi tiết

**Bảng 2.1 — So sánh ba mô hình phát triển phần mềm theo 8 tiêu chí**

| Tiêu chí đánh giá | Waterfall | Kanban | **Scrum** |
|------------------|-----------|--------|-----------|
| **Phản ứng với thay đổi yêu cầu** | ❌ Rất kém — thay đổi sau pha Thiết kế gây tốn kém và delay toàn bộ lịch trình | ✅ Linh hoạt tuyệt đối — thêm task bất cứ lúc nào | ✅ **Linh hoạt có kiểm soát** — thay đổi được tích hợp vào Sprint kế tiếp, không làm vỡ Sprint hiện tại |
| **Phù hợp team nhỏ (1–3 người)** | ⚠️ Overhead tài liệu thiết kế quá cao so với quy mô team | ✅ Phù hợp — ít overhead | ✅ **Phù hợp** — ceremonies nhẹ, có thể điều chỉnh cho team 1 người |
| **Deliverable định kỳ có thể demo** | ❌ Chỉ có sản phẩm hoàn chỉnh ở cuối dự án; không thể demo giữa kỳ | ⚠️ Liên tục nhưng không có Sprint Goal rõ ràng | ✅ **Mỗi 2 tuần** có Working Software Increment có thể demo cho PO |
| **Phát hiện và xử lý rủi ro** | ❌ Rủi ro tích lũy đến cuối dự án mới lộ ra; chi phí fix cao | ⚠️ Không có cơ chế chủ động kiểm tra rủi ro | ✅ **Sprint Review** phát hiện rủi ro sớm; có thể điều chỉnh sau mỗi 2 tuần |
| **Quản lý tích hợp phức tạp (AI Service)** | ❌ Yêu cầu thiết kế AI từ Sprint 0 khi chưa có dữ liệu thật — rủi ro cao | ⚠️ Không có cơ chế ưu tiên rõ ràng khi tích hợp module mới | ✅ **Có thể dời AI sang Sprint 5** khi forum core đã có dữ liệu thật — giảm rủi ro tích hợp |
| **Theo dõi và báo cáo tiến độ** | ✅ Milestone rõ ràng theo pha — dễ báo cáo theo giai đoạn | ⚠️ WIP Limit nhưng không có deadline Sprint cứng — khó báo cáo % hoàn thành | ✅ **Velocity tracking** theo Story Points từng Sprint — số liệu cụ thể để báo cáo |
| **Phù hợp bối cảnh thực tập** | ⚠️ Không demo được giữa kỳ; toàn bộ công việc mới thấy ở cuối | ⚠️ Không có Sprint Goal để báo cáo tiến độ theo từng mốc | ✅ **Sprint Goal rõ ràng** — dễ trình bày tiến độ theo từng 2 tuần với giảng viên |
| **Hỗ trợ cải tiến quy trình liên tục** | ❌ Không có ceremony retrospective | ⚠️ Có thể retrospective nhưng không có cấu trúc bắt buộc | ✅ **Sprint Retrospective** bắt buộc sau mỗi Sprint — cải tiến quy trình liên tục |

**Kết luận đánh giá:** Scrum vượt trội trong 6/8 tiêu chí với điều kiện đặc thù của dự án MINI-FORUM. Waterfall bị loại do yêu cầu có thể thay đổi và cần demo định kỳ. Kanban bị loại do thiếu cấu trúc Sprint Goal — không phù hợp để báo cáo tiến độ theo mốc thời gian với giảng viên.

### 2.1.4 Phân tích lý do lựa chọn Scrum — Các quyết định thực tế

Quyết định chọn Scrum không chỉ là lý thuyết mà còn được xác nhận bởi ba tình huống thực tế xảy ra trong quá trình dự án:

**Tình huống 1 — Yêu cầu Block Layout xuất hiện sau Sprint 1:**

Tính năng `post_blocks` — cho phép bài viết chứa nhiều loại nội dung (TEXT, IMAGE, CODE, QUOTE) theo thứ tự tùy chỉnh — **không có trong backlog ban đầu**. Tính năng này được đề xuất sau khi demo Sprint 1 vì trình soạn thảo chỉ hỗ trợ văn bản thuần không đáp ứng nhu cầu của diễn đàn kỹ thuật (cần đăng code snippet và hình ảnh minh họa trong cùng một bài).

→ Scrum cho phép đưa story mới vào Sprint 2 Backlog thông qua quy trình Backlog Refinement, mà **không cần thiết kế lại toàn bộ schema** như Waterfall yêu cầu.

**Tình huống 2 — AI Service cần dữ liệu forum có sẵn:**

`vibe-content` — AI bot sinh nội dung — chỉ có thể hoạt động hiệu quả khi hệ thống đã có cấu trúc categories, tags, và ít nhất một số tài khoản người dùng thật. Nếu implement AI từ Sprint 0–1 (như Waterfall yêu cầu trong pha thiết kế tích hợp), AI bot sẽ không biết generate bài viết cho category nào, với persona nào.

→ Scrum cho phép dời `vibe-content` sang Sprint 5 (sau khi forum core hoàn chỉnh Sprint 1–4), **giảm rủi ro tích hợp đáng kể**.

**Tình huống 3 — Phát hiện giới hạn của SSE sớm:**

SSE (Server-Sent Events) cho thông báo real-time là một quyết định kiến trúc có rủi ro về scalability (mỗi connection là một HTTP connection liên tục, in-memory). Bằng cách implement trong Sprint 3 và demo kết quả ngay Sprint Review, nhóm xác định được giới hạn của SSE và ghi nhận **upgrade path sang WebSocket** trong tài liệu trước khi bàn giao, thay vì phát hiện vấn đề sau khi deploy lên production.

---

## 2.2 Cấu trúc Scrum áp dụng trong dự án

### 2.2.1 Tổng quan cấu hình Sprint

Scrum framework được áp dụng có điều chỉnh (tailored) cho phù hợp với đặc thù team nhỏ, bối cảnh thực tập và ràng buộc thời gian 13 tuần. Các thông số cơ bản được xác định ngay trong Sprint 0 (tuần đầu tiên):

**Bảng 2.2 — Cấu hình Scrum áp dụng trong MINI-FORUM**

| Thông số Scrum | Cấu hình áp dụng | Lý do lựa chọn |
|----------------|-----------------|----------------|
| **Sprint Duration** | 2 tuần (10 ngày làm việc) | Đủ thời gian deliver 1 module hoàn chỉnh; không quá dài để mất feedback |
| **Tổng số Sprint** | 6 Sprint production + 1 tuần Buffer | 6×2 tuần = 12 tuần + 1 tuần dự phòng = 13 tuần tổng |
| **Thời gian dự án** | 27/01/2026 – 27/04/2026 (13 tuần) | Khung thực tập cố định |
| **Daily Standup** | 15 phút/ngày (sáng đầu giờ) | Phát hiện blocker sớm; giữ đồng bộ team |
| **Sprint Planning** | Nửa ngày (4 giờ) đầu mỗi Sprint | Chọn stories, estimate, tạo Sprint Backlog |
| **Sprint Review** | Nửa ngày (4 giờ) cuối mỗi Sprint | Demo Working Software; thu thập feedback PO |
| **Sprint Retrospective** | 1 giờ sau Sprint Review | Cải tiến quy trình; action items cụ thể |
| **Backlog Refinement** | Giữa Sprint (Tuần thứ 2) | Chuẩn bị stories cho Sprint kế tiếp |
| **Story Point Scale** | Fibonacci: 1, 2, 3, 5, 8, 13 | Planning Poker — tránh phân tích quá chi tiết |
| **Velocity đo lường** | Story Points hoàn thành / Sprint | Cơ sở để dự báo capacity Sprint tiếp theo |

### 2.2.2 Lịch trình 6 Sprint

**Bảng 2.2b — Kế hoạch tổng thể 6 Sprint + Buffer**

| Sprint | Thời gian | Sprint Goal | Module chính |
|--------|-----------|-------------|-------------|
| **Sprint 0** | 27/01 – 07/02 | Thiết lập hạ tầng & database schema | Monorepo setup, Prisma schema 19 models, Docker, CI pipeline |
| **Sprint 1** | 10/02 – 21/02 | Auth & User Management hoàn chỉnh | Register+OTP, Login/Logout, JWT, RBAC, Profile |
| **Sprint 2** | 24/02 – 07/03 | Forum Core — Post & Comment | Post CRUD + Block Layout, Nested Comments, Category/Tag |
| **Sprint 3** | 10/03 – 21/03 | Tính năng tương tác & Real-time | Vote, Search, SSE Notifications, Bookmark |
| **Sprint 4** | 24/03 – 04/04 | Admin Panel & Media | Admin Dashboard, Moderation, Audit Log, ImageKit Upload |
| **Sprint 5** | 07/04 – 18/04 | AI Bot + Testing + Production Deploy | vibe-content, Test coverage ≥60%, Render/Vercel deploy |
| **Buffer** | 21/04 – 27/04 | Bug fix, tài liệu, báo cáo | Documentation, final testing, report |

### 2.2.3 Vòng lặp Sprint — Quy trình chi tiết

**Hình 2.1 — Vòng lặp Sprint trong Scrum áp dụng cho MINI-FORUM**

```
╔════════════════════════════════════════════════════════════════════╗
║               VÒNG LẶP SPRINT SCRUM (2 tuần = 10 ngày)            ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ┌─────────────────────────────────────────────────────────────┐  ║
║  │             PRODUCT BACKLOG (tổng hợp)                     │  ║
║  │  11 User Stories — ưu tiên theo MoSCoW                     │  ║
║  │  Được cập nhật sau mỗi Sprint Review                       │  ║
║  └──────────────────────────┬──────────────────────────────────┘  ║
║                             │                                     ║
║                    SPRINT PLANNING (Ngày 1, 4 giờ)                ║
║                    ┌────────▼────────┐                            ║
║                    │  Sprint Backlog │                            ║
║                    │  (tasks đã chọn │                            ║
║                    │  và estimate)   │                            ║
║                    └────────┬────────┘                            ║
║                             │                                     ║
║  ┌──────────────────────────▼──────────────────────────────────┐  ║
║  │                  SPRINT EXECUTION (Ngày 2–9)               │  ║
║  │                                                             │  ║
║  │  Ngày 1  │ Ngày 2  │ Ngày 3  │ ... │ Ngày 9  │ Ngày 10    │  ║
║  │  Planning│ Dev     │ Dev     │     │ Dev     │ Review+Ret. │  ║
║  │          │         │         │     │         │             │  ║
║  │  ◆ DAILY STANDUP 15 phút mỗi ngày (Ngày 2–9):            │  ║
║  │    • "Hôm qua tôi đã hoàn thành..."                       │  ║
║  │    • "Hôm nay tôi sẽ làm..."                              │  ║
║  │    • "Blocker/impediment cần hỗ trợ..."                   │  ║
║  │                                                             │  ║
║  │  ◆ BACKLOG REFINEMENT (Ngày 7, 1 giờ):                   │  ║
║  │    Chuẩn bị stories cho Sprint kế tiếp                    │  ║
║  └──────────────────────────┬──────────────────────────────────┘  ║
║                             │                                     ║
║              ┌──────────────┴──────────────┐                     ║
║              ▼                             ▼                     ║
║   SPRINT REVIEW (Ngày 10, 4 giờ)    SPRINT RETROSPECTIVE         ║
║   ┌────────────────────────┐         (Ngày 10, 1 giờ sau Review) ║
║   │ Demo Working Software  │         ┌──────────────────────────┐ ║
║   │ cho Product Owner      │         │ ✅ What went well?       │ ║
║   │                        │         │ ❌ What to improve?      │ ║
║   │ • Chạy trực tiếp app   │         │ 🔧 Action items (1–3 VP) │ ║
║   │ • Không dùng slide     │         │    cụ thể cho Sprint sau │ ║
║   │ • PO chấp nhận/từ chối │         └──────────────────────────┘ ║
║   │   từng User Story      │                                     ║
║   │ • Cập nhật Backlog     │                                     ║
║   └────────────────────────┘                                     ║
║                                                                    ║
║              ▼ Lặp lại cho Sprint tiếp theo                      ║
╚════════════════════════════════════════════════════════════════════╝
```

*Nguồn: Tác giả tự xây dựng, tham chiếu Scrum Guide (Schwaber & Sutherland, 2020)*

### 2.2.4 Phân công vai trò Scrum

Trong môi trường thực tập với team 1–3 người, các vai trò Scrum không thể tách biệt hoàn toàn như team lớn. Việc kiêm nhiệm được chấp nhận có chủ đích, với ranh giới trách nhiệm rõ ràng:

**Bảng 2.3 — Phân công vai trò Scrum trong MINI-FORUM**

| Vai trò Scrum | Người đảm nhận | Trách nhiệm cụ thể trong dự án | Thời gian dành cho vai trò |
|--------------|---------------|-------------------------------|--------------------------|
| **Product Owner** | Giảng viên hướng dẫn (chính) + Lead Developer (hỗ trợ) | Xác định và ưu tiên Product Backlog; viết Acceptance Criteria; xác nhận/từ chối User Story trong Sprint Review | ~20% thời gian PO (giảng viên); ~10% thời gian Lead Dev |
| **Scrum Master** | Lead Developer (kiêm nhiệm) | Điều phối Sprint Planning và Retrospective; phát hiện và loại bỏ blocker; bảo vệ Sprint Goal khỏi scope creep; theo dõi velocity | ~15% thời gian Lead Dev |
| **Development Team** | Lead Developer (Backend + DevOps) + Frontend Developer | Implement, write tests, code review, deploy; tự tổ chức công việc trong sprint | ~75% thời gian Lead Dev; ~100% FE Dev |

> **Ghi chú về kiêm nhiệm:** Trong Scrum Guide (2020), Scrum Master không nên kiêm Development Team để tránh conflict of interest. Tuy nhiên với team 1–2 người, đây là điều kiện bắt buộc. Biện pháp kiểm soát: Sprint Goal được viết thành văn bản và không thay đổi trong sprint; mọi scope change phải chờ Sprint kế tiếp.

### 2.2.5 Công cụ hỗ trợ quy trình Scrum

**Bảng 2.4 — Bộ công cụ Scrum của dự án MINI-FORUM**

| Công cụ | Loại | Mục đích trong dự án | Tích hợp với |
|---------|------|---------------------|-------------|
| **Trello** | Kanban Board | Quản lý Sprint Backlog: cột Backlog → In Progress → In Review → Done | — |
| **Git (GitHub)** | Version Control | Feature branch per story (`feature/auth-otp`, `feature/block-layout`); merge vào `main` sau review | Trello (card link) |
| **Markdown + `docs/`** | Tài liệu | Sprint Planning notes; ADR (Architecture Decision Records); API documentation | Git repository |
| **Vitest** | Test Framework | Unit test backend; `vitest run` là automated quality gate; coverage report | `package.json` scripts |
| **ESLint + TypeScript** | Static Analysis | Lint error = build fail; strict type checking = compile-time safety | Pre-commit hook |
| **Postman / REST Client** | API Testing | Test endpoint trước khi viết frontend; `.http` files lưu trong repo | — |
| **Docker Compose** | Environment | Đồng nhất môi trường dev/staging; `docker-compose up` cho full stack | Render.com staging |

### 2.2.6 Quy trình làm việc với Git — Branching Strategy

Chiến lược phân nhánh Git được chuẩn hóa từ Sprint 0 để đảm bảo tính ổn định của nhánh `main`:

**Hình 2.2 — Git Branching Strategy trong MINI-FORUM**

```
main (production-ready, chỉ merge qua PR)
  │
  ├── develop (integration branch)
  │     │
  │     ├── feature/sprint1-auth-register
  │     ├── feature/sprint1-auth-login-jwt
  │     ├── feature/sprint1-user-profile
  │     │     └── [sau khi pass review] ──► merge vào develop
  │     │
  │     ├── feature/sprint2-post-blocks
  │     ├── feature/sprint2-nested-comments
  │     │
  │     └── [cuối Sprint] Sprint Review pass ──► merge develop vào main
  │
  └── hotfix/... (chỉ khi có bug critical trên production)
```

**Quy tắc branch:**
- Tên branch: `feature/[sprint]-[mô-tả-ngắn]` (ví dụ: `feature/sprint3-sse-notifications`)
- Một feature branch ứng với một User Story
- Merge vào `develop` sau khi code review pass và unit test xanh
- Merge `develop` vào `main` chỉ tại thời điểm Sprint Review

---

## 2.3 Definition of Done (DoD)

### 2.3.1 Tầm quan trọng của Definition of Done

**Definition of Done (DoD)** là thỏa thuận minh bạch giữa Development Team và Product Owner về tiêu chí để một User Story được tính là hoàn thành. DoD không phải là danh sách Acceptance Criteria của từng story (đó là "Definition of Ready") — DoD là **bộ tiêu chí kỹ thuật chung áp dụng cho TẤT CẢ stories** của dự án.

Trong Scrum Guide (2020), DoD là "cam kết chính thức mô tả tiêu chuẩn chất lượng để tạo ra một sản phẩm có thể phát hành". Nếu một story không đáp ứng DoD, nó **không được tính vào velocity của sprint** và không được demo trong Sprint Review.

Sự cần thiết của DoD trở nên rõ ràng qua một tình huống thực tế trong Sprint 2: tính năng Block Layout (`post_blocks`) được phát triển xong về mặt code nhưng **không có unit test** → khi tích hợp với frontend trong Sprint 3 phát sinh 2 bug về thứ tự `sort_order` của blocks. Việc fix bug mất 1.5 ngày — tương đương ~15% capacity của Sprint 3. Nếu DoD bắt buộc viết test, lỗi này sẽ được phát hiện ngay trong Sprint 2.

### 2.3.2 DoD cấp User Story — 6 tiêu chí bắt buộc

Mỗi User Story trong MINI-FORUM phải đáp ứng đầy đủ 6 tiêu chí sau đây trước khi được chuyển sang trạng thái "Done":

**Bảng 2.5 — Definition of Done — 6 tiêu chí bắt buộc cấp User Story**

| # | Tiêu chí | Mô tả chi tiết | Công cụ kiểm tra | Ví dụ áp dụng trong dự án |
|---|---------|---------------|-----------------|--------------------------|
| **1** | **Code implement đầy đủ** theo Acceptance Criteria | Tất cả acceptance criteria được viết trong Sprint Planning đều phải được implement; không bỏ sót edge case đã được define | Peer review checklist; self-review | `POST /api/auth/register`: xử lý email trùng (409), email thiếu (400), OTP gửi thành công (201) |
| **2** | **Unit test viết và pass** | Không được bỏ qua test với lý do "sẽ viết sau"; test phải cover happy path và ít nhất 2 error case; `vitest run` không có test fail | `npm run test` (vitest run) xanh | `backend/src/__tests__/auth.test.ts`: register, login, logout, refresh token, invalid OTP |
| **3** | **API test bằng Postman / REST Client** | Tất cả endpoint của story phải trả về đúng HTTP status code và response body theo spec; file `.http` lưu trong repository | Postman collection / `.http` file | Auth endpoints test: `200 OK` (login thành công), `401 Unauthorized` (token hết hạn), `429 Too Many Requests` (rate limit) |
| **4** | **Code review passed** | Self-review hoặc peer review theo checklist; không có: magic string, console.log còn sót, type `any` dư thừa, SQL injection vulnerability, missing authorization check | Code review checklist (4 mục) | `backend/src/validations/auth.validation.ts`: Zod schema validate tất cả input; không có raw SQL |
| **5** | **Merge vào branch chính thành công** | Feature branch được merge vào `develop` (và cuối sprint vào `main`) mà không có conflict; CI checks pass | `git log --oneline`; không có merge conflict | Mỗi feature branch sau code review được merge qua Pull Request; không force-push vào main |
| **6** | **Không có lint error và type error** | `eslint src/` và `tsc --noEmit` chạy sạch không có warning/error; TypeScript strict mode bắt toàn bộ type unsafety | `npm run lint`; `npm run typecheck` | `tsconfig.json`: `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` |

### 2.3.3 DoD cấp Sprint — 4 tiêu chí bổ sung

Ngoài DoD cấp User Story, mỗi Sprint còn phải đạt 4 tiêu chí bổ sung ở cấp Sprint trước khi được kết thúc:

**Bảng 2.6 — Definition of Done — 4 tiêu chí cấp Sprint**

| # | Tiêu chí Sprint | Mô tả | Kiểm tra như thế nào |
|---|----------------|-------|---------------------|
| **S1** | **Sprint Goal đạt được** | Mục tiêu kỹ thuật của sprint (ví dụ: "Auth module hoàn chỉnh với JWT + OTP") phải được hoàn thành; không chấp nhận "80% xong" | Product Owner xác nhận trong Sprint Review |
| **S2** | **Demo hoạt động end-to-end** | Tất cả tính năng của sprint phải chạy được trực tiếp (live demo), không phải slide hay screenshot | Demo trực tiếp ứng dụng trong Sprint Review; không dùng mock data |
| **S3** | **Không có regression** | Các tính năng của sprint trước vẫn hoạt động đúng; không có bug mới trên feature đã done | Regression test nhanh (smoke test) trước Sprint Review |
| **S4** | **Tài liệu cập nhật** | `README.md`, migration files (nếu schema thay đổi), hoặc API documentation được cập nhật tương ứng | Review `git diff` trên documentation files |

### 2.3.4 Quy trình kiểm tra DoD — Checklist thực tế

Trước khi chuyển một User Story sang trạng thái "Done" trên Trello, developer thực hiện self-review theo checklist sau:

**Hình 2.3 — DoD Checklist quy trình kiểm tra**

```
╔═══════════════════════════════════════════════════════════════╗
║           DoD CHECKLIST — Trước khi mark story "Done"        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Story: ________________________  Sprint: ___  Date: _______  ║
║                                                               ║
║  Tiêu chí cấp User Story:                                    ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ ☐ 1. Tất cả Acceptance Criteria đều implement xong     │  ║
║  │       → Đánh dấu từng AC một trong Sprint Backlog      │  ║
║  │                                                         │  ║
║  │ ☐ 2. Unit test viết và `vitest run` → 0 failures       │  ║
║  │       → Chạy: npm run test                             │  ║
║  │       → Coverage của story này: ____%                  │  ║
║  │                                                         │  ║
║  │ ☐ 3. API endpoints test xong, file .http cập nhật      │  ║
║  │       → Tất cả endpoints: status code ✓, body ✓        │  ║
║  │                                                         │  ║
║  │ ☐ 4. Code review pass (self hoặc peer)                 │  ║
║  │       ☐ Không có type `any` dư thừa                   │  ║
║  │       ☐ Không có console.log còn sót                  │  ║
║  │       ☐ Authorization check đủ ở endpoint cần bảo vệ  │  ║
║  │       ☐ Input validation bằng Zod schema               │  ║
║  │                                                         │  ║
║  │ ☐ 5. Branch merge vào develop, no conflict             │  ║
║  │       → PR created, reviewed, merged                   │  ║
║  │                                                         │  ║
║  │ ☐ 6. `npm run lint` và `npm run typecheck` → 0 errors  │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  Tất cả 6 tiêu chí ✅ → Chuyển card Trello sang "Done"      ║
║  Có tiêu chí ❌ → Giữ ở "In Review"; ghi note lý do         ║
╚═══════════════════════════════════════════════════════════════╝
```

*Nguồn: Tác giả tự xây dựng*

### 2.3.5 Bài học kinh nghiệm từ việc áp dụng DoD

Quá trình áp dụng DoD trong 6 Sprint của MINI-FORUM rút ra hai bài học quan trọng:

**Bài học 1 — DoD phải được thỏa thuận trước Sprint 0:**
Sprint 2 xảy ra trường hợp Block Layout được mark "Done" mà không có unit test (developer cho rằng "sẽ viết test sau khi tích hợp frontend"). Hậu quả: Sprint 3 mất 1.5 ngày fix bug regression. Từ Sprint 3 trở đi, DoD được in ra và dán ở nơi làm việc — không có ngoại lệ.

**Bài học 2 — DoD cần được điều chỉnh theo sprint nếu cần:**
Trong Sprint 5 (AI Bot + Testing + Deploy), tiêu chí số 3 (API test `.http` file) được bổ sung thêm: "Test thủ công trên staging environment (Render.com) trước khi demo" — vì một số bug về CORS và environment variables chỉ xuất hiện trên môi trường staging, không thể phát hiện bằng unit test local. Đây là ví dụ điển hình về việc DoD phải là "living document" — được cập nhật theo bài học từng sprint.

---

*[Tiếp theo: Chương 3 — Lập kế hoạch dự án]*
