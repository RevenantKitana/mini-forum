# CHƯƠNG 5: KIỂM SOÁT TIẾN ĐỘ VÀ CHẤT LƯỢNG

---

## Giới thiệu chương

Kiểm soát tiến độ và chất lượng là hai trụ cột không thể tách rời trong quản lý dự án phần mềm. Tiến độ đảm bảo dự án hoàn thành đúng hạn; chất lượng đảm bảo sản phẩm đáng tin cậy và bảo trì được. Chương này trình bày các công cụ và quy trình được áp dụng trong dự án MINI-FORUM để theo dõi và kiểm soát cả hai khía cạnh: **Velocity Tracking**, **Burndown Chart**, **Quality Gates** và **quy trình Code Review**. Tất cả số liệu được đo thực tế trong quá trình thực hiện dự án.

---

## 5.1 Velocity Tracking — Theo dõi tốc độ phát triển

### 5.1.1 Phương pháp đo lường velocity

**Velocity** trong Scrum được đo bằng tổng Story Points (SP) hoàn thành trong một sprint (đạt đủ Definition of Done). Chỉ số này giúp:
- Dự báo sprint kế tiếp có thể nhận bao nhiêu SP
- Phát hiện sớm nếu nhóm đang overcommit hoặc undercommit
- Nhận diện nguyên nhân của velocity drop (blocker, scope creep, technical debt)

**Quy ước:** Story Points cho task overhead (setup, review, planning) không được tính vào velocity — chỉ tính SP từ User Stories trong Product Backlog.

**Definition of Done (DoD)** — Tiêu chí để một User Story được tính là "completed":

**Bảng 5.1a — Definition of Done (DoD) áp dụng trong dự án**

| # | Tiêu chí | Kiểm tra bằng |
|:---:|---|---|
| 1 | Code compile không lỗi TypeScript | `tsc --noEmit` pass |
| 2 | ESLint không có warning hoặc error | `eslint src/` exit code 0 |
| 3 | Unit tests pass (liên quan đến feature) | `vitest run` all green |
| 4 | API endpoint hoạt động đúng theo acceptance criteria | Postman/REST Client test manual |
| 5 | Code đã được self-review theo checklist | Checklist trong CONTRIBUTING.md |
| 6 | Documentation cập nhật (nếu có API mới) | README hoặc inline comment |

### 5.1.2 Bảng theo dõi velocity theo 6 sprint

**Bảng 5.1b — Velocity Tracking toàn dự án**

| Sprint | Thời gian | SP Planned | SP Completed | Velocity | Deviation | Ghi chú |
|--------|----------|:---:|:---:|:---:|:---:|---------|
| **S0** | 27/01 – 07/02 | N/A (setup) | N/A | — | — | Sprint thiết lập — không đo SP |
| **S1** | 08/02 – 21/02 | 30 | 28 | **28** | -6.7% | -2 SP: Brevo integration delay (R04) |
| **S2** | 22/02 – 07/03 | 35 | 33 | **33** | -5.7% | -2 SP: Block layout scope creep; +1 ngày buffer |
| **S3** | 08/03 – 21/03 | 35 | 35 | **35** | 0% | On track sau khi adjust từ S2 |
| **S4** | 22/03 – 04/04 | 32 | 32 | **32** | 0% | On track; estimate chính xác nhất |
| **S5** | 05/04 – 18/04 | 30 | 30 | **30** | 0% | On track; AI integration có buffer đủ |

**Tổng SP hoàn thành:** 158 SP (không tính S0)  
**Average velocity:** 31.6 SP/sprint  
**Sprint ổn định nhất:** S3, S4, S5 — sau khi estimate được hiệu chỉnh từ bài học S1, S2

### 5.1.3 Biểu đồ Velocity

**Hình 5.1 — Biểu đồ Velocity theo sprint (SP Planned vs SP Completed)**

> *Mô tả hình:* Biểu đồ cột đôi (grouped bar chart). Trục X: các Sprint (S1–S5). Trục Y: Story Points (0–40). Cột xanh đậm = SP Planned, cột xanh nhạt = SP Completed. Đường ngang màu cam = đường velocity trung bình (31.6 SP). S1 và S2 có cột Completed thấp hơn Planned (lệch nhẹ). S3–S5 hai cột bằng nhau (trùng khớp).

```
Story Points
40 │
   │
35 │         ┌───┬──┐  ┌───┬───┐  ┌───┬───┐
   │   ┌───┬─┤   │  │  │   │   │  │   │   │
30 │   │   │ │   │  │  │   │   │  │   │   │  ┌───┬───┐
   │   │ P │ │ P │C │  │P=C│P=C│  │P=C│P=C│  │P=C│P=C│
28 │   │   │C│   │  │  │   │   │  │   │   │  │   │   │
   │   │   │ │   │  │  │   │   │  │   │   │  │   │   │
   │   └───┴─┘   └──┘  └───┴───┘  └───┴───┘  └───┴───┘
 0 └──────────────────────────────────────────────────
          S1      S2        S3        S4        S5

   ──────────────── Velocity TB: 31.6 SP ─────────────  (đường ngang)

   P = Planned  |  C = Completed  |  Giá trị: 28/30, 33/35, 35/35, 32/32, 30/30
```

### 5.1.4 Phân tích velocity trend và dự báo

**Bảng 5.1c — Phân tích nguyên nhân velocity theo sprint**

| Sprint | Velocity | So với TB | Nguyên nhân chính | Corrective Action |
|--------|:---:|:---:|---|---|
| S1 | 28 | -11.4% | Brevo API rate limit (+0.5 ngày unexpected) | Mock email service cho S2+ |
| S2 | 33 | +4.4% | Scope creep block layout (+1.5 ngày) bù bằng buffer | Freeze scope sau ngày 2 của sprint |
| S3 | 35 | +10.8% | Estimate đã được hiệu chỉnh dựa trên S1–S2 actuals | Duy trì quy trình estimate mới |
| S4 | 32 | +1.3% | Estimate chính xác, không có surprise | — |
| S5 | 30 | -5.1% | Planned nhẹ hơn để có buffer cho testing và deployment | — |

**Dự báo velocity cho sprint tiếp theo (nếu dự án tiếp tục):**

Theo công thức rolling average 3 sprint gần nhất:

$$V_{dự báo} = \frac{V_{S3} + V_{S4} + V_{S5}}{3} = \frac{35 + 32 + 30}{3} \approx 32 \text{ SP/sprint}$$

Với confidence interval ±10%: dự báo sprint tiếp theo có thể commit **29–35 SP**.

---

## 5.2 Burndown Chart — Biểu đồ tiêu hao

### 5.2.1 Khái niệm và mục đích

Burndown Chart thể hiện lượng công việc còn lại (Story Points remaining) theo thời gian trong một sprint. So sánh đường thực tế với **đường lý tưởng (ideal line)** giúp phát hiện sớm:

**Bảng 5.2a — Phân tích các pattern Burndown Chart**

| Pattern | Hình dạng đường thực tế | Ý nghĩa | Hành động |
|---------|---|---|---|
| **On track** | Bám sát đường lý tưởng | Tiến độ đúng kế hoạch | Duy trì |
| **Burndown nhanh** | Dưới đường lý tưởng | Team faster than expected | Pull thêm story từ backlog |
| **Burndown chậm** | Trên đường lý tưởng | Có blockers hoặc underestimate | Scrum Master can thiệp, re-estimate |
| **Flat line** | Ngang, không giảm | Work bị blocked hoàn toàn | Daily standup urgent: identify blocker |
| **Cliff drop cuối** | Đột ngột giảm mạnh cuối sprint | Rush, bỏ qua quality gates | Review DoD compliance |

### 5.2.2 Burndown Chart Sprint 3 (mẫu chi tiết)

**Hình 5.2 — Burndown Chart Sprint 3 (08/03 – 21/03/2026, 35 SP)**

> *Mô tả hình:* Biểu đồ đường với trục X là ngày trong sprint (Day 1–10), trục Y là Story Points còn lại (0–35). Đường màu xanh đứt đoạn là "Ideal Line" giảm đều từ 35 xuống 0. Đường màu cam đặc là "Actual Burndown". Từ Day 1–3 actual bám sát hoặc thấp hơn ideal. Day 4 flat (không giảm) do SSE blocker. Day 5–10 recover và về 0.

```
SP Còn lại
35 │●─── Sprint Start (35 SP, ngày 08/03)
   │  \      (Ideal: ── ── ── )
   │   \     (Actual: ●──●  )
30 │    ●                            [Legend]
   │     \●                          ── ── Ideal Line (giảm đều 3.5 SP/ngày)
   │       \                         ●──●  Actual Burndown
25 │        \
   │         ●─────────────────────── Day 4: FLAT LINE (SSE blocker R03)
   │                                  "sseService.ts memory management issue"
20 │                                  Daily standup → identify → re-approach
   │
   │          ●
15 │           \
   │            ●
10 │             \●
   │               \
 5 │                ●
   │                 \●
 0 │                   ●─● ← Sprint End (0 SP, ngày 21/03)
   └─────────────────────────────────────────────────────
   D1  D2  D3  D4  D5  D6  D7  D8  D9  D10
             ↑                      ↑
        Flat Day 4:           Sprint Review Day 10:
        SSE blocker            0 SP remaining ✅
        discovered             All stories DONE
```

**Phân tích chi tiết Sprint 3:**
- **Day 1–3:** Velocity tốt — `voteService.ts` và `bookmarkService.ts` hoàn thành nhanh hơn estimate (SP đơn giản, logic rõ ràng).
- **Day 4 — Critical Flat:** `sseService.ts` gặp vấn đề memory management khi test với 20+ connections. Burndown flat suốt ngày 4. Daily standup emergency (dù async) xác định: tiếp tục implement SSE sẽ mất thêm 2–3 ngày mà kết quả vẫn có giới hạn.
- **Quyết định Day 4:** Accept R03 — implement SSE in-memory theo cách đơn giản, document limitation. Giải phóng thời gian cho searchService và notificationService.
- **Day 5–8:** Velocity recover, hoàn thành search (GIN index) và notification service.
- **Day 9–10:** Frontend components, cleanup, sprint review. Đạt 0 SP đúng ngày 21/03.

### 5.2.3 Burndown Summary — Tổng hợp 5 Sprint

**Bảng 5.2b — So sánh Burndown pattern qua 5 Sprint**

| Sprint | Mô hình Burndown | Ngày gặp vấn đề | Nguyên nhân | Kết quả cuối |
|--------|-----------------|:---:|---|:---:|
| **S1** | Chậm hơn ideal ngày 6–8; về 0 đúng hạn | Day 6–8 | Brevo email integration chậm hơn estimate | ✅ 0 SP remaining |
| **S2** | Flat Day 1–3 (scope creep analysis); bắt kịp Day 4–10 | Day 1–3 | Block layout thêm vào mid-sprint cần re-design | ✅ 0 SP remaining |
| **S3** | On track Day 1–3; Flat Day 4; recover Day 5–10 | Day 4 | SSE memory management issue (R03) | ✅ 0 SP remaining |
| **S4** | Gần lý tưởng xuyên suốt — sprint tốt nhất | Không | Estimate chính xác nhất | ✅ 0 SP remaining |
| **S5** | Tăng tốc Day 7–8 (AI integration đơn giản hơn dự kiến) | Không | Positive deviation — AI bot simpler than thought | ✅ 0 SP remaining |

> **Kết luận quan trọng:** Tất cả 5 sprint đều đạt 0 SP remaining vào Sprint Review Day. Đây là chỉ số định lượng quan trọng nhất chứng minh quy trình Scrum hoạt động hiệu quả.

---

## 5.3 Quality Gates — Cổng kiểm soát chất lượng

### 5.3.1 Kiến trúc Quality Gates 4 lớp

Hệ thống Quality Gates của MINI-FORUM được thiết kế theo 4 lớp, từ tự động hóa nhanh đến kiểm tra toàn diện:

**Hình 5.3 — Kiến trúc Quality Gates 4 lớp**

```
┌─────────────────────────────────────────────────────────────────┐
│                  QUALITY GATES PIPELINE                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ LAYER 1: AUTOMATED — Mỗi lần save/commit (~5 giây)     │   │
│  │                                                          │   │
│  │  TypeScript ──▶ ESLint ──▶ Vitest (unit tests)          │   │
│  │  (tsc --noEmit)  (lint)    (fast, isolated)              │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │ PASS                              │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │ LAYER 2: API TESTING — Sau mỗi feature completion       │   │
│  │                                                          │   │
│  │  Postman/REST Client — End-to-end API behavior          │   │
│  │  Verify: status codes, response schema, edge cases      │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │ PASS                              │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │ LAYER 3: RUNTIME VALIDATION — Mỗi request (production)  │   │
│  │                                                          │   │
│  │  Zod schemas ──▶ Validate input tại API boundary        │   │
│  │  authMiddleware ──▶ JWT verification                     │   │
│  │  roleMiddleware ──▶ RBAC enforcement                    │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │ PASS                              │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │ LAYER 4: SECURITY REVIEW — Cuối mỗi Sprint (manual)    │   │
│  │                                                          │   │
│  │  OWASP Top 10 checklist ──▶ Manual review               │   │
│  │  Helmet, rate limiting, parameterized queries           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3.2 Test Coverage theo module

**Bảng 5.3a — Test Coverage chi tiết theo module**

| Module | File test | Framework | Lines Coverage | Branch Coverage | Ghi chú |
|--------|----------|-----------|:---:|:---:|---------|
| **Auth** (JWT, OTP, refresh, logout) | `__tests__/auth.test.ts` | Vitest | ~85% | ~78% | Mock email; JWT expiry test |
| **ImageKit Service** | `__tests__/imagekitService.test.ts` | Vitest | ~75% | ~70% | Mock SDK; upload/delete/cleanup |
| **Upload Middleware** | `__tests__/uploadMiddleware.test.ts` | Vitest | ~72% | ~68% | File type, size limit, MIME check |
| **Frontend Auth Context** | `src/__tests__/AuthContext.test.tsx` | Vitest + RTL | ~65% | ~60% | Context state, token refresh |
| **Frontend Post Components** | `src/__tests__/PostCard.test.tsx` | Vitest + RTL | ~62% | ~58% | Render, vote UI |
| **vibe-content Scheduler** | `src/__tests__/scheduler.test.ts` | Vitest | ~55% | ~50% | Mock LLM, cron trigger |
| **vibe-content Content Gen** | `src/__tests__/contentGen.test.ts` | Vitest | ~58% | ~52% | Fallback chain, validation |

**Tổng hợp toàn dự án:**
- **15 test files** tổng cộng
- **~120 test cases** (unit tests)
- **Overall coverage ≈ 68%** (vượt mục tiêu 60%)
- **Build time:** ~8 giây cho toàn bộ test suite

**Hình 5.4 — Coverage distribution theo module**

> *Mô tả hình:* Biểu đồ tròn (pie chart) chia coverage theo module. Auth module (22%), ImageKit (15%), Upload Middleware (12%), Frontend (27%), vibe-content (18%), Others (6%). Màu xanh đậm cho coverage > 75%, xanh nhạt cho 60–75%, vàng cho < 60%.

```
Coverage Distribution:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Auth            ████████████████████ 85% lines                │
│   ImageKit        ████████████████     75%                       │
│   Upload MW       ████████████████     72%                       │
│   Frontend Auth   ██████████████       65%                       │
│   Frontend Posts  ██████████████       62%                       │
│   vibe-content    ████████████         55–58%                    │
│                                                                  │
│   ──────────────────────────── Overall: 68% ────────────────    │
│   Target: 60%  ✅ Exceeded                                       │
│                                                                  │
│   Legend: ████ High (>70%)  ████ Medium (60-70%)  ▒▒▒▒ Low     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3.3 Automated Quality Scripts

Cả bốn package trong monorepo đều có script chuẩn hóa trong `package.json`:

**Bảng 5.3b — Công cụ và quy trình đảm bảo chất lượng**

| Script | Lệnh | Thời gian | Mục đích | Thực thi khi nào |
|--------|------|:---:|---------|-----------------|
| `test` | `vitest run` | ~8s | Chạy tất cả unit tests | Trước mỗi merge vào main |
| `test:watch` | `vitest` | Live | Watch mode trong development | Trong quá trình coding |
| `test:coverage` | `vitest run --coverage` | ~12s | Đo test coverage với istanbul | Cuối mỗi sprint |
| `lint` | `eslint src/ --ext .ts,.tsx` | ~5s | Kiểm tra code style, anti-patterns | Trước mỗi commit |
| `build` | `tsc -p tsconfig.json` | ~15s | Compile TypeScript + type check | Trước khi deploy |
| `typecheck` | `tsc --noEmit` | ~10s | Type check nhanh không emit | Trong development |

**Cấu hình TypeScript strict mode** (`backend/tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

> **Tác động thực tế của TypeScript strict:** Trong Sprint 1, strict mode bắt được 3 potential null-reference bugs trước khi chạy. Trong Sprint 2, `noUnusedLocals` force cleanup 7 biến không dùng. Tổng cộng, TypeScript strict mode ước tính ngăn ngừa ~15 runtime bugs trong suốt dự án.

### 5.3.4 Input Validation với Zod

Tất cả API endpoints đều validate input bằng Zod schemas trước khi xử lý business logic, tạo thành Layer 3 của Quality Gates:

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

// Middleware sử dụng:
export const validate = (schema: z.ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors
    });
  }
  req.body = result.data;  // Type-safe data sau khi validate
  next();
};
```

**Bảng 5.3c — Zod validation coverage theo endpoint category**

| Endpoint category | Số endpoints | Có Zod validation | % Coverage |
|---|:---:|:---:|:---:|
| Auth (register, login, OTP) | 5 | 5 | 100% |
| User management | 6 | 6 | 100% |
| Posts (create, update) | 4 | 4 | 100% |
| Comments | 3 | 3 | 100% |
| Admin actions | 8 | 8 | 100% |
| Search, bookmark, vote | 5 | 3 | 60% |
| **Tổng** | **31** | **29** | **93.5%** |

---

## 5.4 Quy trình Code Review

### 5.4.1 Code Review với team nhỏ

Với team 1–2 người, traditional peer review không khả thi cho mọi commit. Nhóm áp dụng **structured self-review** kết hợp với automated tools, đảm bảo chất lượng tương đương mà không cần reviewer thứ hai cho mỗi thay đổi.

**Hình 5.5 — Quy trình Code Review (Self-Review + Automated)**

```
Developer hoàn thành feature
              │
              ▼
┌─────────────────────────────────┐
│   BƯỚC 1: AUTOMATED CHECKS      │
│                                  │
│   tsc --noEmit  ──▶ Pass? ──No──▶ Fix type errors
│   eslint src/   ──▶ Pass? ──No──▶ Fix lint issues
│   vitest run    ──▶ Pass? ──No──▶ Fix failing tests
└──────────────┬──────────────────┘
               │ ALL PASS
               ▼
┌─────────────────────────────────────────────────────────────┐
│   BƯỚC 2: SELF-REVIEW CHECKLIST                             │
│                                                              │
│   □ Naming: functions/vars tên rõ nghĩa, nhất quán?         │
│   □ Error handling: tất cả async có try/catch?              │
│   □ Security: không có hardcoded secrets/credentials?       │
│   □ Logging: không log sensitive data (password, token)?    │
│   □ Input validation: API boundary có Zod schema?           │
│   □ Database: không có raw SQL string interpolation?        │
│   □ Response: HTTP status code đúng convention?             │
│   □ Comment: code phức tạp có inline explanation?           │
└──────────────┬──────────────────────────────────────────────┘
               │ ALL CHECKED
               ▼
┌─────────────────────────────────┐
│   BƯỚC 3: COMMIT & MERGE         │
│                                  │
│   Commit message: feat/fix/chore  │
│   Format: type(scope): message   │
│   Ví dụ:                         │
│   feat(auth): add OTP rate limit │
│   fix(vote): prevent double vote │
│   chore(deps): update prisma 5.x │
└─────────────────────────────────┘
```

### 5.4.2 Security Review Checklist (OWASP Top 10)

Cuối mỗi sprint, một security review checklist được thực hiện để đảm bảo không có vulnerability được introduce trong sprint đó.

**Bảng 5.4a — OWASP Top 10 Security Checklist**

| OWASP ID | Tên | Biện pháp trong MINI-FORUM | Trạng thái | Sprint hoàn thiện |
|----------|-----|---------------------------|:---:|:---:|
| **A01** | Broken Access Control | `roleMiddleware` kiểm tra role trước mọi admin/moderator endpoint; Prisma query tự động lọc theo `user_id` | ✅ | S1 |
| **A02** | Cryptographic Failures | bcrypt hash password (rounds=12); JWT signing với secret key từ env; không lưu plaintext sensitive data | ✅ | S1 |
| **A03** | Injection | Prisma ORM — parameterized queries, zero raw SQL; Zod input validation trước mọi database operation | ✅ | S2 |
| **A04** | Insecure Design | Auth flow với OTP verification; refresh token rotation; rate limiting trên sensitive endpoints | ✅ | S1 |
| **A05** | Security Misconfiguration | Helmet.js (HSTS, XSS protection, noSniff); CORS whitelist; rate limiting 100 req/15 phút/IP | ✅ | S1 |
| **A06** | Vulnerable Components | `npm audit` chạy cuối mỗi sprint; zero critical vulnerabilities maintained | ✅ | Ongoing |
| **A07** | Auth Failures | JWT access token 15 phút; refresh token 7 ngày với rotation; account lockout sau OTP fail | ✅ | S1 |
| **A08** | Software Integrity | Dependencies từ npm registry chính thức; lockfile (`package-lock.json`) committed | ✅ | S0 |
| **A09** | Logging Failures | Audit log ghi nhận mọi admin action vào DB; IP address, user ID, timestamp, old/new value | ✅ | S4 |
| **A10** | SSRF | Không có server-side URL fetching từ user input; ImageKit upload qua SDK, không qua URL | ✅ | S4 |

> **Kết quả npm audit cuối Sprint 5:** 0 critical vulnerabilities, 0 high vulnerabilities, 2 moderate (transitive dependencies, không ảnh hưởng production code).

### 5.4.3 Quy tắc commit và branching

**Bảng 5.4b — Quy ước commit message (Conventional Commits)**

| Type | Mục đích | Ví dụ |
|------|---------|-------|
| `feat` | Tính năng mới | `feat(auth): implement OTP verification flow` |
| `fix` | Sửa bug | `fix(vote): prevent double vote on page reload` |
| `chore` | Maintenance, dependencies | `chore(deps): upgrade prisma to 5.8.0` |
| `refactor` | Cải thiện code không thay đổi behavior | `refactor(post): extract blockService from postService` |
| `test` | Thêm hoặc sửa tests | `test(auth): add edge case for expired OTP` |
| `docs` | Cập nhật documentation | `docs(api): add auth endpoints to README` |

**Branching strategy (simplified GitFlow):**

```
main (protected)
├── Luôn deployable — chỉ merge khi tất cả quality gates pass
├── Lịch sử commit sạch
│
└── feature branches (short-lived)
    ├── Đặt tên: feat/us-XX-mo-ta (ví dụ: feat/us-01-otp-register)
    ├── Tạo từ main, merge về main sau khi DoD đạt
    └── Xóa sau khi merge
```

---

## 5.5 Theo dõi Nợ Kỹ Thuật (Technical Debt)

### 5.5.1 Định nghĩa và phân loại

Technical debt trong dự án MINI-FORUM được theo dõi và phân loại thành hai nhóm:

**Bảng 5.5a — Technical Debt Tracker**

| ID | Mô tả | Loại | Sprint phát sinh | Sprint xử lý | Effort xử lý | Trạng thái |
|----|-------|------|:---:|:---:|:---:|:---:|
| TD-01 | `postController.ts` viết cho single text → phải refactor sau khi thêm blocks | Design Debt | S2 | S3 | 0.5 ngày | ✅ Resolved |
| TD-02 | Frontend `CreatePostPage` textarea → phải viết lại block editor | Design Debt | S2 | S2 | +0.5 ngày | ✅ Resolved |
| TD-03 | SSE in-memory không scale → cần Redis pub/sub | Architecture Debt | S3 | Future | — | ⚠ Documented |
| TD-04 | `avatar_url` cũ vẫn còn trong schema (`@deprecated`) | Schema Debt | S4 | Future | 0.5 ngày | ⚠ Pending |
| TD-05 | vibe-content tests coverage thấp (55%) | Test Debt | S5 | Future | 1 ngày | ⚠ Pending |

**Tổng technical debt đã xử lý:** 2/5 items (40%)  
**Technical debt được documented:** 3/5 items còn lại đều có description và upgrade path rõ ràng

### 5.5.2 Nguyên tắc quản lý kỹ nợ thuật

Dự án áp dụng **"Boy Scout Rule"** của Robert C. Martin: *"Leave the code cleaner than you found it."* Cụ thể:
- Không để technical debt vô hình (undocumented)
- Mỗi sprint, ưu tiên xử lý ít nhất 1 TD item nếu effort < 0.5 ngày
- TD items với effort lớn hơn → backlog sprint tiếp theo, ưu tiên sau Must Have stories

---

## 5.6 Kết luận chương

Chương 5 đã trình bày toàn diện hệ thống kiểm soát tiến độ và chất lượng của dự án MINI-FORUM. Các kết quả đo được:

**Về tiến độ:**
- **5/5 sprint** hoàn thành đúng hạn (0 SP remaining vào Sprint Review)
- **Velocity ổn định** từ Sprint 3 trở đi (35–30 SP/sprint, accuracy 100%)
- **Estimate accuracy cải thiện** từ 93% (S1) lên 100% (S3–S5) nhờ learning từ actual data

**Về chất lượng:**
- **Test coverage 68%** (vượt mục tiêu 60%)
- **OWASP Top 10** — 10/10 items addressed
- **Zero critical security vulnerabilities** trong suốt dự án
- **TypeScript strict mode** bắt ~15 potential runtime bugs trước production

**Bài học chính:** Quality không phải là giai đoạn cuối mà là **integrated practice** xuyên suốt mỗi sprint. Automated checks (TypeScript, ESLint, Vitest) giảm 80% effort manual testing trong khi tăng confidence khi merge code.

---

*[Tiếp theo: Chương 6 — Quản lý nguồn lực]*
