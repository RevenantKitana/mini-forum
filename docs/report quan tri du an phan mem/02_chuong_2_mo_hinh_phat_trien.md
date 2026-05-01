# CHƯƠNG 2: MÔ HÌNH PHÁT TRIỂN VÀ LÝ DO LỰA CHỌN

---

## 2.1 So sánh các mô hình phát triển phần mềm

### 2.1.1 Tổng quan các mô hình

Trước khi khởi động dự án MINI-FORUM, nhóm đã đánh giá ba mô hình phát triển phần mềm phổ biến nhất: **Waterfall**, **Kanban** và **Scrum**. Việc lựa chọn mô hình phù hợp có ý nghĩa quyết định đến cách tổ chức công việc, phân bổ nguồn lực và khả năng thích ứng với thay đổi trong suốt 3 tháng thực hiện dự án.

### 2.1.2 Bảng so sánh chi tiết

**Bảng 2.1 — So sánh các mô hình phát triển phần mềm**

| Tiêu chí đánh giá | Waterfall | Kanban | **Scrum** |
|------------------|-----------|--------|-----------|
| **Thích nghi với thay đổi yêu cầu** | ❌ Không phù hợp — thay đổi yêu cầu sau thiết kế gây tốn kém | ✅ Linh hoạt cao — thay đổi bất cứ lúc nào | ✅ **Linh hoạt có kiểm soát** — thay đổi được tích hợp vào sprint kế tiếp |
| **Phù hợp với team nhỏ (1–3 người)** | ⚠️ Overhead tài liệu cao so với quy mô team | ✅ Phù hợp nhưng thiếu cấu trúc | ✅ **Phù hợp** — ceremony nhẹ, linh hoạt điều chỉnh |
| **Deliverable định kỳ** | ❌ Chỉ bàn giao cuối dự án | ⚠️ Liên tục nhưng không có sprint goal | ✅ **Mỗi 2 tuần** có increment có thể demo |
| **Risk management** | ❌ Phát hiện rủi ro muộn (cuối dự án) | ⚠️ Không có cơ chế chủ động | ✅ **Sprint Review** giúp phát hiện sớm sau mỗi 2 tuần |
| **Quản lý tích hợp phức tạp (AI)** | ❌ Phải thiết kế AI từ đầu, rủi ro cao | ⚠️ Không rõ ràng về thứ tự ưu tiên | ✅ **Dời tích hợp AI sang Sprint 5** khi đã có dữ liệu thật |
| **Tracing tiến độ** | ✅ Milestone rõ ràng theo pha | ⚠️ WIP limit nhưng không có deadline cứng | ✅ **Velocity tracking** theo từng sprint |
| **Phù hợp với dự án thực tập** | ⚠️ Khó demo tiến độ giữa kỳ | ⚠️ Không có sprint goal để báo cáo | ✅ **Sprint goal rõ ràng** — dễ báo cáo định kỳ |

### 2.1.3 Phân tích lý do chọn Scrum

**Lý do 1 — Yêu cầu evolve theo feedback thực tế:**
Block layout (`post_blocks`) — tính năng cho phép bài viết chứa nhiều loại nội dung (TEXT, IMAGE, CODE, QUOTE) — không có trong backlog ban đầu. Tính năng này được đề xuất sau khi demo Sprint 1 vì giao diện soạn thảo đơn giản không đủ đáp ứng nhu cầu diễn đàn kỹ thuật. Scrum cho phép đưa story mới vào Sprint 2 với quy trình backlog refinement, điều mà Waterfall không thể làm được.

**Lý do 2 — Tích hợp AI đòi hỏi dữ liệu trước:**
`vibe-content` — service AI sinh nội dung — chỉ có thể hoạt động hiệu quả khi forum đã có cấu trúc categories, tags và người dùng thật. Scrum cho phép dời tích hợp AI sang Sprint 5 (sau khi forum core hoàn chỉnh), trong khi Waterfall sẽ yêu cầu thiết kế AI từ Sprint 0.

**Lý do 3 — Risk exposure sớm:**
SSE (Server-Sent Events) cho thông báo real-time là quyết định kiến trúc có rủi ro về scalability. Bằng cách implement trong Sprint 3 và demo sớm, nhóm xác định được giới hạn của SSE (in-memory connection management) và ghi nhận upgrade path sang WebSocket trước khi bàn giao, thay vì phát hiện sau khi deploy.

---

## 2.2 Cấu trúc Scrum áp dụng trong dự án

### 2.2.1 Tổng quan cấu hình Sprint

**Bảng 2.2 — Cấu hình Scrum áp dụng trong MINI-FORUM**

| Thông số | Cấu hình |
|----------|---------|
| Sprint duration | 2 tuần (10 ngày làm việc) |
| Tổng số Sprint | 6 Sprint production + 1 tuần Buffer |
| Tổng thời gian | 13 tuần (27/01/2026 – 27/04/2026) |
| Daily Standup | 15 phút/ngày (sáng đầu giờ) |
| Sprint Planning | Nửa ngày đầu sprint |
| Sprint Review | Nửa ngày cuối sprint |
| Sprint Retrospective | 1 giờ sau Sprint Review |
| Velocity đo lường | Story Points (Planning Poker) |

### 2.2.2 Vòng lặp Sprint

**Hình 2.1 — Vòng lặp Sprint trong Scrum (áp dụng cho MINI-FORUM)**

```
┌────────────────────────────────────────────────────────────────┐
│                    VÒNG LẶP SPRINT (2 tuần)                    │
│                                                                │
│  ┌─────────────┐                                               │
│  │   Product   │                                               │
│  │   Backlog   │                                               │
│  │  (ưu tiên   │                                               │
│  │   MoSCoW)   │                                               │
│  └──────┬──────┘                                               │
│         │ Sprint Planning                                      │
│         ▼ (nửa ngày)                                           │
│  ┌─────────────┐                                               │
│  │   Sprint    │                                               │
│  │   Backlog   │ ◄─── Daily Standup (15 phút/ngày)            │
│  │  (sprint    │      • Hôm qua làm gì?                       │
│  │   tasks)    │      • Hôm nay làm gì?                       │
│  └──────┬──────┘      • Blocker gì?                           │
│         │                                                      │
│         │ Sprint Execution (2 tuần)                           │
│         ▼                                                      │
│  ┌─────────────┐                                               │
│  │  Working    │                                               │
│  │  Software   │                                               │
│  │ (increment) │                                               │
│  └──────┬──────┘                                               │
│         │                                                      │
│         ├──────► Sprint Review (nửa ngày)                     │
│         │        Demo cho Product Owner                        │
│         │        Thu thập feedback                            │
│         │                                                      │
│         └──────► Sprint Retrospective (1 giờ)                 │
│                  What went well?                               │
│                  What to improve?                              │
│                  Action items for next sprint                  │
└────────────────────────────────────────────────────────────────┘
```

### 2.2.3 Phân công vai trò Scrum

Với team quy mô 1–3 người, các vai trò Scrum được kiêm nhiệm linh hoạt:

| Vai trò Scrum | Người đảm nhận | Trách nhiệm trong MINI-FORUM |
|--------------|---------------|------------------------------|
| **Product Owner** | Giảng viên hướng dẫn / Lead Developer | Xác định Product Backlog, ưu tiên MoSCoW, xác nhận Definition of Done |
| **Scrum Master** | Lead Developer (kiêm nhiệm) | Điều phối Sprint Planning, loại bỏ blocker, theo dõi velocity |
| **Development Team** | Lead Developer + Frontend Developer | Implement, test, deploy |

> **Lưu ý thực tế:** Trong môi trường team nhỏ, việc kiêm nhiệm Scrum Master + Developer là chấp nhận được với điều kiện có kỷ luật trong sprint boundaries — không thêm scope vào sprint đang chạy nếu không đánh đổi story khác.

### 2.2.4 Công cụ quản lý Scrum

Trong phạm vi thực tập, các công cụ sau được sử dụng để vận hành Scrum:

| Công cụ | Mục đích |
|---------|---------|
| **Trello / Linear** | Quản lý Sprint Backlog, Kanban board (To Do → In Progress → Done) |
| **Markdown + Git** | Ghi chép Sprint Planning, lưu lịch sử quyết định kỹ thuật trong `docs/` |
| **Vitest + ESLint** | Automated quality gate tích hợp trong `package.json` |
| **Postman / REST Client** | API testing trong quá trình phát triển |
| **Git branches** | Feature branch per story, merge vào `main` sau code review |

---

## 2.3 Definition of Done (DoD)

### 2.3.1 Tiêu chí DoD cấp User Story

Một User Story được coi là **DONE** khi và chỉ khi đáp ứng đủ 6 tiêu chí sau:

**Bảng 2.3 — Definition of Done — 6 tiêu chí bắt buộc**

| # | Tiêu chí | Công cụ kiểm tra | Ví dụ trong dự án |
|---|---------|-----------------|-----------------|
| 1 | **Code implement đầy đủ** theo acceptance criteria của User Story | Peer review, tự đánh giá | `authController.ts` xử lý đủ register/login/logout/refresh |
| 2 | **Unit test viết và pass** — không được bỏ qua | `vitest run` không có test fail | `backend/src/__tests__/` — auth tests, upload tests |
| 3 | **API được test bằng Postman** hoặc REST Client — tất cả endpoint trả về đúng HTTP status code | `.rest` file trong repository | Auth endpoints: 200/201/400/401/403 |
| 4 | **Code review passed** — self-review hoặc peer review theo checklist | Checklist: naming, type safety, error handling | `backend/src/validations/` — Zod schema validation |
| 5 | **Merge vào main branch** thành công, không conflict | Git log | Mỗi sprint đều có merge commit ổn định vào main |
| 6 | **Không có lint error** — `eslint src/` clean | ESLint, TypeScript compiler | `"strict": true` trong `tsconfig.json` |

### 2.3.2 Tiêu chí DoD cấp Sprint

Ngoài DoD cấp User Story, mỗi Sprint phải đạt DoD cấp Sprint:

1. **Sprint Goal đạt được** — milestone kỹ thuật tương ứng hoàn thành.
2. **Demo hoạt động** — có thể demo toàn bộ feature của sprint trước Product Owner.
3. **Không có regression** — các feature của sprint trước vẫn hoạt động đúng.
4. **Tài liệu cập nhật** — README, API docs, hoặc migration file (nếu thay đổi schema).

### 2.3.3 Lý do DoD nghiêm ngặt là cần thiết

Kinh nghiệm rút ra từ Sprint 2: block layout (`post_blocks`) được "implement xong" nhưng chưa có unit test → khi integrate với frontend trong Sprint 3 phát sinh 2 bug về thứ tự sort_order của blocks. Nếu DoD bắt buộc viết test từ đầu, lỗi này sẽ được phát hiện sớm hơn 2 sprint.

---

*[Tiếp theo: Chương 3 — Lập kế hoạch dự án]*
