# CHƯƠNG 5: KIỂM SOÁT TIẾN ĐỘ VÀ CHẤT LƯỢNG

---

## 5.1 Velocity Tracking — Theo dõi tốc độ phát triển

### 5.1.1 Phương pháp đo lường velocity

**Velocity** trong Scrum được đo bằng tổng Story Points (SP) hoàn thành trong một sprint (đạt đủ Definition of Done). Chỉ số này giúp:
- Dự báo sprint kế tiếp có thể nhận bao nhiêu SP
- Phát hiện sớm nếu nhóm đang overcommit hoặc undercommit
- Nhận diện nguyên nhân của velocity drop (blocker, scope creep, technical debt)

**Quy ước:** Story Points cho task overhead (setup, review, planning) không được tính vào velocity — chỉ tính SP từ User Stories trong Product Backlog.

### 5.1.2 Bảng theo dõi velocity theo 6 sprint

**Bảng 5.1 — Velocity Tracking toàn dự án**

| Sprint | Thời gian | SP Planned | SP Completed | Velocity | Ghi chú |
|--------|----------|-----------|-------------|---------|---------|
| **S0** | 27/01 – 07/02 | N/A (setup) | N/A | — | Sprint thiết lập — không đo SP |
| **S1** | 08/02 – 21/02 | 30 | 28 | **28** | -2 SP: Brevo integration delay (R04 xảy ra) |
| **S2** | 22/02 – 07/03 | 35 | 33 | **33** | -2 SP: Block layout scope creep; +1 ngày buffer |
| **S3** | 08/03 – 21/03 | 35 | 35 | **35** | On track sau khi adjust từ S2 |
| **S4** | 22/03 – 04/04 | 32 | 32 | **32** | On track; admin panel phức tạp nhưng estimate chính xác |
| **S5** | 05/04 – 18/04 | 30 | 30 | **30** | On track; AI integration có buffer đủ |

**Tổng SP hoàn thành:** 158 SP (không tính S0)
**Average velocity:** 31.6 SP/sprint
**Sprint ổn định nhất:** S3, S4, S5 — sau khi estimate đã được hiệu chỉnh từ bài học S1, S2

### 5.1.3 Biểu đồ Velocity

**Hình 5.1 — Biểu đồ Velocity theo sprint**

```
Story Points
40 │
   │
35 │         ┌───┐  ┌───┐  ┌───┐     (planned)
   │   ┌───┐ │   │  │   │  │   │
30 │   │   │ │   │  │   │  │   │  ┌───┐
   │   │   │ │   │  │   │  │   │  │   │
25 │   │   │ │   │  │   │  │   │  │   │
   │   │   │ │   │  │   │  │   │  │   │
20 │   │   │ │   │  │   │  │   │  │   │
   │   ░░░ │ ░░░ │  │   │  │   │  │   │
15 │   ░░░ │ ░░░ │  │   │  │   │  │   │
   │   ░░░ │ ░░░ │  │   │  │   │  │   │
10 │   ░░░ │ ░░░ │  │   │  │   │  │   │
   │   ░░░ │ ░░░ │  │   │  │   │  │   │
 5 │   ░░░ │ ░░░ │  │   │  │   │  │   │
   │   ░░░ │ ░░░ │  │   │  │   │  │   │
 0 └───────────────────────────────────
     S1    S2    S3    S4    S5

  ░░░ = SP hụt so với planned (2 SP × 2 sprint đầu)
  ─── = Đường velocity trung bình (31.6 SP)

Velocity:   28    33    35    32    30
Planned:    30    35    35    32    30
```

### 5.1.4 Phân tích velocity trend

- **S1 – S2:** Velocity thấp hơn planned do rủi ro bên ngoài (Brevo) và scope creep nội bộ. Nhóm rút kinh nghiệm về estimate accuracy.
- **S3 – S5:** Velocity ổn định sau khi (1) estimate được hiệu chỉnh dựa trên actual data từ S1–S2, (2) không có blocker mới ngoài kế hoạch.
- **Dự báo velocity Sprint tiếp theo:** Dựa vào average 3 sprint gần nhất (S3–S5): (35+32+30)/3 ≈ **32 SP/sprint**.

---

## 5.2 Burndown Chart — Biểu đồ tiêu hao

### 5.2.1 Khái niệm và mục đích

Burndown Chart thể hiện lượng công việc còn lại (Story Points remaining) theo thời gian trong một sprint. So sánh đường thực tế với đường lý tưởng giúp phát hiện sớm:
- **Burndown nhanh hơn ideal:** Team đang work faster than expected — có thể pull thêm story.
- **Burndown chậm hơn ideal:** Có blocker hoặc estimate bị underestimate — cần điều chỉnh.
- **Burndown phẳng (flat):** Work bị blocked — cần Scrum Master can thiệp ngay.

### 5.2.2 Burndown Chart Sprint 3 (mẫu)

**Hình 5.2 — Burndown Chart Sprint 3 (Mar 8 – Mar 21, 35 SP)**

```
SP Còn lại
35 │● ← Sprint Start (35 SP)
   │  \
   │   ●          (Ideal line ──────)
30 │    \ ●       (Actual line ●──●)
   │     \
   │      \
25 │       ● ────────────────────────── (ideal Day 5 = 17.5 SP)
   │        \
20 │         \
   │          ●
   │           \
15 │            \ ●
   │             \
   │              \   ●
10 │               \     ●
   │                \
 5 │                 \    ●
   │                  \    ●
 0 │                   ●──●  ← Sprint End (0 SP)
   └─────────────────────────────────
   D1  D2  D3  D4  D5  D6  D7  D8  D9  D10
                 ↑              ↑
           Flat Day 4:    Sprint Review
           sseService    Day 10: 0 SP
           blocker
```

**Phân tích Sprint 3:**
- **Day 1–3:** Velocity tốt — voteService và bookmarkService hoàn thành nhanh hơn estimate.
- **Day 4:** Burndown bị phẳng — sseService gặp vấn đề với SSE memory management (R03 discovered). Daily standup ngày 4 identify blocker và adjust approach.
- **Day 5–8:** Velocity recover sau khi quyết định Accept R03 và implement theo cách đơn giản hơn.
- **Day 9–10:** Cleanup, testing, sprint review. Đạt 0 SP đúng hạn.

### 5.2.3 So sánh Burndown các Sprint

```
Sprint     Mô hình Burndown           Kết luận
─────────────────────────────────────────────────────────
S1         Chậm hơn ideal (Day 6–8)  Brevo delay làm chậm auth tests
S2         Chậm Day 1–4, bắt kịp     Block layout thêm mid-sprint
           Day 5–10
S3         Flat Day 4, bắt kịp       SSE blocker được resolve nhanh
S4         Gần ideal suốt            Estimate chính xác nhất
S5         Tăng tốc Day 7–8          AI integration đơn giản hơn dự kiến
           (pull thêm docs task)
```

---

## 5.3 Quality Gates — Cổng kiểm soát chất lượng

### 5.3.1 Kiến trúc Quality Gates

Hệ thống Quality Gates của MINI-FORUM được thiết kế theo 4 lớp, từ tự động hóa đến kiểm tra thủ công:

```
LAYER 1: AUTOMATED (Tự động — chạy mỗi lần commit)
├── TypeScript compiler (tsc --noEmit)
│   └── Bắt type errors trước khi runtime
├── ESLint
│   └── Enforce code style, detect anti-patterns
└── Vitest (unit tests)
    └── Đảm bảo logic không bị regression

LAYER 2: API TESTING (Bán tự động — chạy sau mỗi sprint)
└── Postman/REST Client
    └── End-to-end API behavior verification

LAYER 3: RUNTIME VALIDATION (Tự động — mỗi request)
└── Zod schemas trong backend/src/validations/
    └── Validate input tại API boundary

LAYER 4: SECURITY REVIEW (Thủ công — checklist)
└── OWASP Top 10 checklist
    └── Helmet, rate limiting, parameterized queries
```

### 5.3.2 Test Coverage theo module

**Bảng 5.2 — Test Coverage theo module**

| Module | File test | Framework | Coverage mục tiêu | Coverage thực tế | Ghi chú |
|--------|----------|-----------|------------------|-----------------|---------|
| **Auth** (JWT, OTP, refresh) | `__tests__/setup.ts` + auth integration | Vitest | > 80% | ~85% | Mock email service; kiểm tra JWT expiry |
| **ImageKit Service** | `__tests__/imagekitService.test.ts` | Vitest | > 70% | ~75% | Mock SDK calls |
| **Upload Middleware** | `__tests__/uploadMiddleware.test.ts` | Vitest | > 70% | ~72% | File type validation, size limit |
| **Frontend Components** | `frontend/src/__tests__/` | Vitest + RTL | > 60% | ~65% | Auth context, post rendering |
| **vibe-content** | Seed integration tests | Vitest | > 50% | ~55% | LLM mock, scheduler test |

**Tổng hợp:** 15 test files, ~120 test cases, overall coverage ≈ **68%** (vượt mục tiêu 60%).

### 5.3.3 Automated Quality Scripts

Cả bốn package trong monorepo đều có script chuẩn hóa trong `package.json`:

**Bảng 5.3 — Công cụ và quy trình đảm bảo chất lượng**

| Script | Lệnh | Mục đích | Thực thi khi nào |
|--------|------|---------|-----------------|
| `test` | `vitest run` | Chạy tất cả unit tests | Trước mỗi merge |
| `test:watch` | `vitest` | Watch mode trong development | Trong quá trình coding |
| `test:coverage` | `vitest run --coverage` | Đo test coverage | Cuối sprint |
| `lint` | `eslint src/ --ext .ts,.tsx` | Kiểm tra code style | Trước mỗi commit |
| `build` | `tsc -p tsconfig.json` | Compile TypeScript + type check | Trước khi deploy |
| `typecheck` | `tsc --noEmit` | Type check nhanh | Trong development |

**Cấu hình TypeScript strict mode** (`backend/tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 5.3.4 Input Validation với Zod

Tất cả API endpoints đều validate input bằng Zod schemas trước khi xử lý business logic:

```typescript
// Ví dụ: backend/src/validations/authValidation.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string()
    .min(3, 'Username min 3 characters')
    .max(30, 'Username max 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscore only'),
  password: z.string()
    .min(8, 'Password min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
});
```

**Lợi ích của Zod validation:**
1. **Type inference tự động** — schema Zod tạo ra TypeScript type tương ứng.
2. **Error messages có ý nghĩa** — trả về lỗi cụ thể cho từng field.
3. **Defense in depth** — kết hợp với TypeScript strict mode, giảm thiểu runtime errors.

---

## 5.4 Quy trình Code Review

### 5.4.1 Code Review với team nhỏ

Với team 1–3 người, traditional peer review không khả thi cho mọi commit. Nhóm áp dụng **structured self-review** kết hợp với automated tools:

```
Developer hoàn thành feature
          │
          ▼
BƯỚC 1: Automated checks
  ├── tsc --noEmit (type check)
  ├── eslint src/ (lint)
  └── vitest run (tests)
          │
          ▼ (nếu tất cả pass)
BƯỚC 2: Self-review checklist
  ├── Naming conventions nhất quán?
  ├── Error handling đầy đủ?
  ├── Security: no hardcoded secrets?
  ├── Logging phù hợp (không log sensitive data)?
  └── Input validation tại API boundary?
          │
          ▼ (checklist ✓ hết)
BƯỚC 3: Merge vào main
  └── Commit message rõ ràng (feat/fix/chore)
```

### 5.4.2 Security Review Checklist (OWASP Top 10)

| OWASP Item | Biện pháp trong MINI-FORUM | Trạng thái |
|-----------|---------------------------|-----------|
| **A01 — Broken Access Control** | `roleMiddleware` kiểm tra role trước mọi admin endpoint; Prisma query tự động lọc theo user_id | ✅ Implemented |
| **A02 — Cryptographic Failures** | bcrypt hash password (không lưu plaintext); JWT signing với secret key từ env variable | ✅ Implemented |
| **A03 — Injection** | Prisma ORM — parameterized queries, không raw SQL interpolation; Zod input validation | ✅ Implemented |
| **A05 — Security Misconfiguration** | Helmet.js headers; CORS whitelist; rate limiting 100 req/15 phút | ✅ Implemented |
| **A06 — Vulnerable Components** | `npm audit` chạy thường xuyên; dependencies cập nhật | ✅ Monitored |
| **A07 — Auth Failures** | JWT access token 15 phút; refresh token rotation; OTP TTL 10 phút | ✅ Implemented |
| **A09 — Logging Failures** | Audit log ghi nhận mọi admin action vào DB; IP address ghi nhận | ✅ Implemented |

### 5.4.3 Quy tắc commit và branching

```
main branch
├── Protected — chỉ merge sau khi tất cả quality gates pass
├── Lịch sử commit sạch — squash merge khi hợp lý
│
feature branches
├── Đặt tên: feat/us-XX-mo-ta hoặc fix/ten-bug
├── Mỗi PR (hoặc merge) correspond với 1 User Story hoặc 1 Task
└── Merge vào main chỉ sau tất cả checks pass
```

---

*[Tiếp theo: Chương 6 — Quản lý nguồn lực]*
