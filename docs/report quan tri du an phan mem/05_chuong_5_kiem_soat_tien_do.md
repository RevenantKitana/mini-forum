# CHƯƠNG 5: KIỂM SOÁT TIẾN ĐỘ VÀ CHẤT LƯỢNG

---

## 5.1 Velocity Tracking — Theo dõi tốc độ phát triển

**Velocity** = tổng Story Points (SP) hoàn thành trong sprint, đạt đủ Definition of Done. Chỉ số này dự báo sprint kế tiếp, phát hiện overcommit/undercommit, và nhận diện nguyên nhân velocity drop.

**Definition of Done (DoD):**

| # | Tiêu chí | Kiểm tra |
|:---:|---|---|
| 1 | TypeScript compile không lỗi | `tsc --noEmit` pass |
| 2 | ESLint không có warning | `eslint src/` exit 0 |
| 3 | Unit tests pass | `vitest run` all green |
| 4 | API endpoint đúng acceptance criteria | Postman/REST Client manual |
| 5 | Self-review theo checklist | CONTRIBUTING.md |
| 6 | Documentation cập nhật (nếu có API mới) | README/inline comment |

### Bảng Velocity toàn dự án

**Bảng 5.1 — Velocity Tracking 6 Sprint**

| Sprint | Thời gian | SP Planned | SP Completed | Velocity | Deviation | Ghi chú |
|--------|----------|:---:|:---:|:---:|:---:|---------|
| **S0** | 27/01–07/02 | N/A | N/A | — | — | Sprint thiết lập |
| **S1** | 08/02–21/02 | 30 | 28 | **28** | -6.7% | Brevo integration delay (R04) |
| **S2** | 22/02–07/03 | 35 | 33 | **33** | -5.7% | Block layout scope creep |
| **S3** | 08/03–21/03 | 35 | 35 | **35** | 0% | On track sau khi adjust từ S2 |
| **S4** | 22/03–04/04 | 32 | 32 | **32** | 0% | Estimate chính xác nhất |
| **S5** | 05/04–18/04 | 30 | 30 | **30** | 0% | AI integration có buffer đủ |

**Tổng SP:** 158 SP | **Average velocity:** 31.6 SP/sprint | **Sprint ổn định nhất:** S3–S5

**Dự báo sprint tiếp theo:**
$$V_{dự báo} = \frac{V_{S3} + V_{S4} + V_{S5}}{3} = \frac{35 + 32 + 30}{3} \approx 32 \text{ SP/sprint}$$

Confidence interval ±10%: có thể commit **29–35 SP**.

**Bảng 5.2 — Phân tích nguyên nhân velocity theo sprint**

| Sprint | Velocity | Nguyên nhân | Corrective Action |
|--------|:---:|---|---|
| S1 | 28 | Brevo API rate limit (+0.5 ngày unexpected) | Mock email service cho S2+ |
| S2 | 33 | Scope creep block layout (+1.5 ngày) bù bằng buffer | Freeze scope sau ngày 2 sprint |
| S3 | 35 | Estimate hiệu chỉnh từ S1–S2 actuals | Duy trì quy trình estimate mới |
| S4–S5 | 32/30 | Estimate chính xác; buffer cho testing/deploy | — |

---

## 5.2 Burndown Chart — Tổng hợp 5 Sprint

**Bảng 5.3 — So sánh Burndown pattern qua 5 Sprint**

| Sprint | Mô hình Burndown | Ngày gặp vấn đề | Nguyên nhân | Kết quả |
|--------|-----------------|:---:|---|:---:|
| **S1** | Chậm hơn ideal ngày 6–8; về 0 đúng hạn | Day 6–8 | Brevo integration chậm | ✅ 0 SP |
| **S2** | Flat Day 1–3; bắt kịp Day 4–10 | Day 1–3 | Block layout re-design | ✅ 0 SP |
| **S3** | On track Day 1–3; Flat Day 4; recover Day 5–10 | Day 4 | SSE memory management (R03) | ✅ 0 SP |
| **S4** | Gần lý tưởng xuyên suốt — sprint tốt nhất | Không có | Estimate chính xác | ✅ 0 SP |
| **S5** | Tăng tốc Day 7–8 | Không có | AI integration đơn giản hơn dự kiến | ✅ 0 SP |

> **Tất cả 5 sprint đều đạt 0 SP remaining vào Sprint Review Day** — chỉ số chứng minh quy trình Scrum hoạt động hiệu quả.

**Sprint 3 — Sự kiện quan trọng (Day 4):** `sseService.ts` gặp vấn đề memory management khi test 20+ connections. Daily standup khẩn xác định: tiếp tục implement SSE sẽ mất 2–3 ngày kết quả vẫn giới hạn → quyết định Accept R03, implement in-memory đơn giản, document limitation. Velocity recovery hoàn toàn Day 5–10.

---

## 5.3 Quality Gates — Cổng kiểm soát chất lượng

### Kiến trúc 4 lớp

| Layer | Thời điểm | Công cụ | Kiểm tra |
|:---:|---|---|---|
| **1 — Automated** | Mỗi save/commit (~5s) | TypeScript, ESLint, Vitest | Compile, lint, unit tests |
| **2 — API Testing** | Sau mỗi feature | Postman/REST Client | Status codes, response schema, edge cases |
| **3 — Runtime Validation** | Mỗi request (production) | Zod schemas, authMiddleware, roleMiddleware | Input validation, JWT, RBAC |
| **4 — Security Review** | Cuối mỗi Sprint | OWASP Top 10 checklist | Manual review |

### Test Coverage

**Bảng 5.4 — Test Coverage theo module**

| Module | Framework | Lines Coverage | Branch Coverage |
|--------|-----------|:---:|:---:|
| Auth (JWT, OTP, refresh) | Vitest | ~85% | ~78% |
| ImageKit Service | Vitest | ~75% | ~70% |
| Upload Middleware | Vitest | ~72% | ~68% |
| Frontend Auth Context | Vitest + RTL | ~65% | ~60% |
| Frontend Post Components | Vitest + RTL | ~62% | ~58% |
| vibe-content Scheduler/Content | Vitest | ~55–58% | ~50–52% |
| **Overall** | — | **~68%** | **~65%** |

**15 test files, ~120 test cases, build time ~8s.** Overall coverage 68% — vượt mục tiêu 60%.

**Quality scripts chuẩn hóa:**

| Script | Lệnh | Thời gian | Thực thi khi nào |
|--------|------|:---:|---|
| `test` | `vitest run` | ~8s | Trước mỗi merge |
| `test:coverage` | `vitest run --coverage` | ~12s | Cuối mỗi sprint |
| `lint` | `eslint src/ --ext .ts,.tsx` | ~5s | Trước mỗi commit |
| `build` | `tsc -p tsconfig.json` | ~15s | Trước deploy |

> **TypeScript strict mode** bắt được ~47 type errors tại compile time (S1–S5), tiết kiệm ước tính ~7.8 giờ debug time.

### Zod Validation Coverage

**Bảng 5.5 — Zod validation coverage**

| Endpoint category | Endpoints | Có Zod | Coverage |
|---|:---:|:---:|:---:|
| Auth (register, login, OTP) | 5 | 5 | 100% |
| User management | 6 | 6 | 100% |
| Posts (create, update) | 4 | 4 | 100% |
| Comments | 3 | 3 | 100% |
| Admin actions | 8 | 8 | 100% |
| Search, bookmark, vote | 5 | 3 | 60% |
| **Tổng** | **31** | **29** | **93.5%** |

---

## 5.4 Quy trình Code Review và Security

### Code Review trong mô hình cá nhân

Áp dụng **structured self-review** kết hợp automated tools: (1) `tsc --noEmit`, `eslint`, `vitest run`; (2) Self-review checklist — naming, error handling, security (không hardcoded secrets, không log sensitive data), input validation, HTTP status codes; (3) Commit theo convention `feat/fix/chore(scope): message`.

**Commit convention:**

| Type | Mục đích | Ví dụ |
|------|---------|-------|
| `feat` | Tính năng mới | `feat(auth): implement OTP verification flow` |
| `fix` | Sửa bug | `fix(vote): prevent double vote on page reload` |
| `refactor` | Cải thiện code | `refactor(post): extract blockService from postService` |
| `test` | Thêm tests | `test(auth): add edge case for expired OTP` |

**Branching:** `feature/us-XX-mo-ta` → merge vào `main` (protected, chỉ merge khi all gates pass) → xóa branch sau merge.

### OWASP Top 10 Security Checklist

**Bảng 5.6 — OWASP Top 10 trong MINI-FORUM**

| OWASP | Biện pháp | Trạng thái | Sprint |
|-------|-----------|:---:|:---:|
| A01 Broken Access Control | `roleMiddleware` + Prisma query lọc theo `user_id` | ✅ | S1 |
| A02 Cryptographic Failures | bcrypt rounds=12; JWT signing với secret từ env | ✅ | S1 |
| A03 Injection | Prisma parameterized queries; Zod validation | ✅ | S2 |
| A04 Insecure Design | OTP verification; refresh token rotation; rate limiting | ✅ | S1 |
| A05 Security Misconfiguration | Helmet.js; CORS whitelist; rate limit 100 req/15min/IP | ✅ | S1 |
| A06 Vulnerable Components | `npm audit` cuối mỗi sprint; 0 critical vulns | ✅ | Ongoing |
| A07 Auth Failures | Access token 15 phút; refresh 7 ngày rotation; lockout sau OTP fail | ✅ | S1 |
| A08 Software Integrity | npm registry chính thức; `package-lock.json` committed | ✅ | S0 |
| A09 Logging Failures | Audit log mọi admin action: IP, user ID, timestamp, old/new | ✅ | S4 |
| A10 SSRF | Không server-side URL fetching từ user input | ✅ | S4 |

> **npm audit cuối Sprint 5:** 0 critical, 0 high, 2 moderate (transitive deps, không ảnh hưởng production).

---

## 5.5 Theo dõi Nợ Kỹ Thuật

**Bảng 5.7 — Technical Debt Tracker**

| ID | Mô tả | Loại | Sprint phát sinh | Sprint xử lý | Trạng thái |
|----|-------|------|:---:|:---:|:---:|
| TD-01 | `postController.ts` viết cho single text → refactor sau khi thêm blocks | Design | S2 | S3 | ✅ Resolved |
| TD-02 | Frontend `CreatePostPage` textarea → viết lại block editor | Design | S2 | S2 | ✅ Resolved |
| TD-03 | SSE in-memory không scale → cần Redis pub/sub | Architecture | S3 | Future | ⚠ Documented |
| TD-04 | `avatar_url` cũ vẫn còn trong schema (`@deprecated`) | Schema | S4 | Future | ⚠ Pending |
| TD-05 | vibe-content tests coverage thấp (55%) | Test | S5 | Future | ⚠ Pending |

**Nguyên tắc:** "Boy Scout Rule" — để code sạch hơn khi rời. Mỗi sprint ưu tiên xử lý 1 TD item nếu effort < 0.5 ngày. TD items với effort lớn hơn → backlog sprint tiếp theo sau Must Have stories.

---

*[Tiếp theo: Chương 6 — Quản lý nguồn lực]*
