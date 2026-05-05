# CHƯƠNG 4: QUẢN LÝ RỦI RO

---

## Giới thiệu chương

Quản lý rủi ro là một trong những thực hành quan trọng nhất trong quản lý dự án phần mềm, đặc biệt với các dự án Agile nơi phạm vi có thể thay đổi theo từng sprint. Chương này trình bày quy trình quản lý rủi ro được áp dụng trong dự án MINI-FORUM, bao gồm nhận diện, đánh giá, lập kế hoạch phản hồi và theo dõi 7 rủi ro chính trong suốt 13 tuần thực hiện. Mỗi rủi ro được phân tích chi tiết với chiến lược xử lý cụ thể và kết quả thực tế đo được.

---

## 4.1 Tổng quan về quản lý rủi ro trong dự án

### 4.1.1 Quy trình quản lý rủi ro

Dự án MINI-FORUM áp dụng quy trình quản lý rủi ro theo chuẩn **PMBOK Risk Management Process** được đơn giản hóa phù hợp với Scrum Agile và team nhỏ, gồm bốn bước liên tục xuyên suốt các sprint:

**Hình 4.1 — Quy trình quản lý rủi ro 4 bước**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VÒNG LẶP QUẢN LÝ RỦI RO                         │
│                                                                      │
│  ┌───────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  1. NHẬN DIỆN │    │ 2. ĐÁNH GIÁ │    │  3. LẬP KẾ HOẠCH    │  │
│  │   Identify    │───▶│   Analyze   │───▶│     Respond          │  │
│  │               │    │             │    │                      │  │
│  │ Sprint 0:     │    │ Xác suất:   │    │ Avoid / Mitigate /  │  │
│  │ Risk workshop │    │ Cao/TB/Thấp │    │ Transfer / Accept   │  │
│  │               │    │             │    │                      │  │
│  │ Ongoing:      │    │ Tác động:   │    │ Owner rõ ràng       │  │
│  │ Daily check   │    │ Cao/TB/Thấp │    │ Deadline action     │  │
│  └───────────────┘    └──────────────┘    └──────────┬───────────┘  │
│           ▲                                          │              │
│           │           ┌──────────────┐               │              │
│           └───────────│ 4. THEO DÕI  │◀──────────────┘              │
│                       │   Monitor   │                              │
│                       │             │                              │
│                       │ Review mỗi  │                              │
│                       │  sprint     │                              │
│                       │ Update      │                              │
│                       │  register   │                              │
│                       └──────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.1.2 Thang đánh giá rủi ro

Mỗi rủi ro được đánh giá theo hai chiều độc lập:

**Bảng 4.1a — Thang đánh giá xác suất xảy ra**

| Mức | Nhãn | Xác suất | Đặc điểm |
|:---:|------|:---:|---|
| 3 | Cao | > 60% | Đã từng xảy ra trong dự án tương tự; điều kiện phát sinh đã tồn tại |
| 2 | Trung bình | 30–60% | Có thể xảy ra; có một số dấu hiệu cảnh báo |
| 1 | Thấp | < 30% | Không chắc xảy ra; điều kiện bất lợi |

**Bảng 4.1b — Thang đánh giá tác động**

| Mức | Nhãn | Ảnh hưởng | Hệ quả điển hình |
|:---:|------|---|---|
| 3 | Cao | Ảnh hưởng milestone hoặc budget đáng kể | Delay > 3 ngày, phải cắt scope |
| 2 | Trung bình | Delay 1–3 ngày | Cần adjust sprint plan, không ảnh hưởng milestone |
| 1 | Thấp | Không ảnh hưởng milestone | Xử lý trong sprint hiện tại không tốn thêm effort |

**Công thức tính mức độ rủi ro:**

$$\text{Risk Score} = \text{Xác suất} \times \text{Tác động}$$

| Risk Score | Mức độ | Hành động |
|:---:|---|---|
| 9 | 🔴 Nghiêm trọng | Xử lý ngay lập tức, ưu tiên cao nhất |
| 6 | 🟠 Cao | Lập kế hoạch phản hồi cụ thể trước khi bắt đầu sprint |
| 4 | 🟡 Trung bình | Theo dõi và có kế hoạch dự phòng |
| 2–3 | 🟡 Thấp-TB | Theo dõi thụ động |
| 1 | 🟢 Thấp | Chấp nhận, ghi nhận |

---

## 4.2 Risk Register — Bảng đăng ký rủi ro

### 4.2.1 Risk Register đầy đủ

Risk Register là tài liệu trung tâm của quản lý rủi ro, được cập nhật sau mỗi sprint review. Dự án MINI-FORUM xác định **7 rủi ro chính** trong Sprint 0 và theo dõi xuyên suốt dự án.

**Bảng 4.2 — Risk Register: 7 rủi ro chính của dự án MINI-FORUM**

| ID | Mô tả rủi ro | Xác suất (1-3) | Tác động (1-3) | **Risk Score** | **Mức độ** | Chiến lược | Owner | Sprint phát hiện | Trạng thái cuối |
|----|-------------|:---:|:---:|:---:|---|---|---|---|:---:|
| **R01** | Schema database thay đổi ảnh hưởng nhiều service (breaking migration) | 3 (Cao) | 3 (Cao) | **9** | 🔴 Nghiêm trọng | Mitigate | Lead Dev | S0 | ✅ Resolved |
| **R02** | LLM API không ổn định: rate limit, quota, provider ngừng dịch vụ | 3 (Cao) | 2 (TB) | **6** | 🟠 Cao | Mitigate | Lead Dev | S0 | ✅ Resolved |
| **R03** | SSE real-time không scale với nhiều concurrent users, memory leak | 2 (TB) | 3 (Cao) | **6** | 🟠 Cao | Accept+Doc | Lead Dev | S3 | ⚠ Documented |
| **R04** | Email delivery (Brevo) chậm/fail trong môi trường dev/test | 2 (TB) | 3 (Cao) | **6** | 🟠 Cao | Mitigate | Lead Dev | S1 | ✅ Resolved |
| **R05** | ImageKit storage quota tier free bị vượt mức, service suspend | 1 (Thấp) | 1 (Thấp) | **1** | 🟢 Thấp | Accept+Monitor | Lead Dev | S4 | ✅ No issue |
| **R06** | Tech debt tích lũy do block layout scope creep giữa Sprint 2 | 3 (Cao) | 2 (TB) | **6** | 🟠 Cao | Mitigate | Lead Dev | S2 | ✅ Resolved |
| **R07** | Deployment environment khác development — môi trường không nhất quán | 2 (TB) | 3 (Cao) | **6** | 🟠 Cao | Mitigate | Lead Dev | S0 | ✅ Resolved |

### 4.2.2 Phân loại rủi ro theo nguồn gốc

**Bảng 4.3 — Phân loại rủi ro theo nguồn gốc**

| Nguồn gốc | Rủi ro | Đặc điểm |
|-----------|--------|----------|
| **Kỹ thuật nội bộ** | R01 (Schema), R03 (SSE), R06 (Tech debt) | Kiểm soát được; giải quyết bằng thiết kế và coding practice |
| **Phụ thuộc dịch vụ bên ngoài** | R02 (LLM API), R04 (Email), R05 (ImageKit) | Ít kiểm soát; cần fallback và resilience pattern |
| **Môi trường & Vận hành** | R07 (Deployment) | Giải quyết bằng containerization và automation |

---

## 4.3 Ma trận xác suất — tác động

### 4.3.1 Risk Matrix

**Hình 4.2 — Ma trận rủi ro (Probability × Impact Matrix)**

> *Mô tả hình:* Ma trận 3×3 với trục X là Xác suất (Thấp/Trung bình/Cao) và trục Y là Tác động (Thấp/Trung bình/Cao). Các ô được tô màu gradient từ xanh lá (rủi ro thấp) đến đỏ (nghiêm trọng). Mỗi rủi ro được đặt vào ô tương ứng với mã ID.

```
                    ┌──────────────── PROBABILITY × IMPACT MATRIX ────────────────┐
                    │                                                              │
     TÁC ĐỘNG       │        Thấp (1)       Trung bình (2)        Cao (3)         │
    ─────────────   │  ─────────────────────────────────────────────────────────  │
                    │                                                              │
    Cao (3)         │    Score=3 🟡      Score=6 🟠           Score=9 🔴          │
                    │                      R06                  R01 ⚠             │
                    │                                                              │
    Trung bình (2)  │    Score=2 🟢      Score=4 🟡           Score=6 🟠          │
                    │                                          R02, R03            │
                    │                                          R04, R07            │
                    │                                                              │
    Thấp (1)        │    Score=1 🟢      Score=2 🟢           Score=3 🟡          │
                    │       R05                                                    │
                    │                                                              │
                    └──────────────────────────────────────────────────────────── ┘
                               Thấp (1)      Trung bình (2)       Cao (3)
                                              XÁC SUẤT

    Chú giải màu sắc:
    🔴 Score 9    — Nghiêm trọng: Xử lý ngay, ưu tiên tuyệt đối
    🟠 Score 6    — Cao: Lập kế hoạch phản hồi cụ thể và chủ động
    🟡 Score 3–4  — Trung bình: Theo dõi chặt chẽ, có contingency plan
    🟢 Score 1–2  — Thấp: Theo dõi thụ động, chấp nhận được
```

### 4.3.2 Phân tích từng nhóm rủi ro

**Nhóm Nghiêm trọng 🔴 (Score = 9):** R01 — Schema database là rủi ro duy nhất ở mức nghiêm trọng do cả xác suất lẫn tác động đều ở mức cao. Với monorepo 4 services cùng sử dụng một database, bất kỳ thay đổi schema nào cũng có thể phá vỡ API contracts của tất cả services đồng thời. Rủi ro này cần được theo dõi liên tục qua mỗi Prisma migration.

**Nhóm Cao 🟠 (Score = 6):** R02, R03, R04, R06, R07 — Năm rủi ro này chia thành hai nhóm:
- *Phụ thuộc external services* (R02, R04): Không kiểm soát được nguồn gốc, chỉ kiểm soát được response. Giải pháp chủ yếu là fallback pattern và isolation.
- *Quyết định kiến trúc và scope* (R03, R06, R07): Kiểm soát được bằng thiết kế tốt ngay từ đầu.

**Nhóm Thấp 🟢 (Score = 1):** R05 — ImageKit là dịch vụ ổn định với tier free đủ cho quy mô prototype, và có cleanup script sẵn sàng nếu cần.

### 4.3.3 Tiến hóa Risk Score theo sprint

**Bảng 4.4 — Theo dõi Risk Score qua các Sprint**

| Risk ID | S0 | S1 | S2 | S3 | S4 | S5 | Trạng thái |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|---|
| R01 | 9🔴 | 9🔴 | 9🔴 | 6🟠 | 3🟡 | 1🟢 | ✅ Giảm dần khi migrations ổn định |
| R02 | 6🟠 | 6🟠 | 6🟠 | 6🟠 | 6🟠 | 2🟢 | ✅ Resolved sau S5 (multi-LLM hoạt động) |
| R03 | — | — | — | 6🟠 | 6🟠 | 6🟠 | ⚠ Vẫn ở mức cao — documented limitation |
| R04 | 6🟠 | 4🟡 | 2🟢 | 2🟢 | 2🟢 | 2🟢 | ✅ Resolved sau mock email implementation |
| R05 | 1🟢 | 1🟢 | 1🟢 | 1🟢 | 1🟢 | 1🟢 | ✅ Stable — no issues |
| R06 | — | — | 6🟠 | 4🟡 | 2🟢 | 1🟢 | ✅ Resolved qua refactoring cuối S3 |
| R07 | 6🟠 | 6🟠 | 6🟠 | 6🟠 | 6🟠 | 1🟢 | ✅ Resolved sau Docker deploy thành công |

---

## 4.4 Chiến lược xử lý rủi ro thực tế

### 4.4.1 R01 — Schema Database thay đổi

**Chiến lược:** Mitigate (Giảm thiểu) | Risk Score: 9 → 1 (cuối dự án)

**Phân tích nguyên nhân gốc rễ:** Dự án sử dụng monorepo với 4 services đều kết nối cùng một PostgreSQL database qua Prisma ORM. Khi schema thay đổi (thêm/sửa/xóa column hoặc table), mọi service phải được cập nhật đồng thời để tránh runtime errors. Với Agile iterative development, schema thay đổi thường xuyên — đây là rủi ro có xác suất cao và tác động rất lớn.

**Biện pháp kỹ thuật:**

*Biện pháp 1: Prisma Migrations versioned*

```
backend/prisma/migrations/
├── 20260127000000_init/
│   └── migration.sql          ← Init 5 tables cốt lõi
├── 20260215000000_add_post_blocks/
│   └── migration.sql          ← Thêm post_blocks, post_media
├── 20260301000000_add_avatar_fields/
│   └── migration.sql          ← Thêm avatar_imagekit_file_id
└── 20260322000000_add_audit_log/
    └── migration.sql          ← Thêm audit_logs table
```

Toàn bộ lịch sử thay đổi schema được lưu dưới dạng timestamped migration files, cho phép rollback bất cứ lúc nào bằng `prisma migrate reset` hoặc revert migration cụ thể.

*Biện pháp 2: Soft deprecation — không xóa column ngay*

```prisma
model users {
  // Các field hiện tại...
  
  // @deprecated — legacy (UC-08): dùng avatar_*_url riêng biệt
  avatar_url              String?
  
  // Mới: phân tách rõ ràng
  avatar_preview_url      String?   // 150×150px thumbnail
  avatar_standard_url     String?   // 400×400px standard
  avatar_imagekit_file_id String?   // ID để cleanup khi user xóa avatar
}
```

Column cũ `avatar_url` được giữ lại để backward compatibility, không bị xóa ngay. Code cũ vẫn hoạt động trong khi code mới dần dần chuyển sang dùng fields mới.

*Biện pháp 3: Migration scripts độc lập*

Hai migration scripts quan trọng được tạo ra để migrate data cũ sang schema mới mà không block development:
- `backend/scripts/migrateAvatarUrls.ts`: Chuyển data từ `avatar_url` sang 3 fields mới
- `backend/scripts/migratePostsToBlocks.ts`: Chuyển nội dung text post sang block layout

**Kết quả đo được:** Zero breaking changes trong toàn bộ 3 tháng. 4 lần Prisma migrate đều thành công. Tất cả 4 services hoạt động bình thường xuyên suốt mọi lần thay đổi schema.

---

### 4.4.2 R02 — LLM API không ổn định

**Chiến lược:** Mitigate (Giảm thiểu) | Risk Score: 6 → 2 (sau S5)

**Phân tích nguyên nhân gốc rễ:** Dịch vụ LLM API (Gemini, Groq, Cerebras, Nvidia) là external services với SLA không đảm bảo cho tier free. Các vấn đề thực tế có thể xảy ra:
- Rate limit: vượt quá số request/phút hoặc token/ngày
- Provider maintenance: downtime không báo trước
- API breaking changes: provider cập nhật API không backward compatible
- Network latency: timeout không nhất quán

**Biện pháp kỹ thuật — Multi-LLM Fallback Chain:**

```
ContentGeneratorService.generateContent()
│
├─── Khởi tạo providers theo thứ tự ưu tiên:
│    [GeminiAdapter, GroqAdapter, CerebrasAdapter, NvidiaAdapter]
│
├─── VÒNG LẶP TRY-FALLBACK:
│    for (const provider of providers) {
│      try {
│        const result = await provider.generate(prompt, { timeout: 30000 });
│        if (result && result.length > 50) return result;  // Validate output
│      } catch (error) {
│        logger.warn(`Provider ${provider.name} failed: ${error.message}`);
│        continue;  // Thử provider tiếp theo
│      }
│    }
│
└─── Nếu tất cả fail: throw Error("All LLM providers unavailable")
     → Scheduler skip cycle này, retry vào giờ tiếp theo
```

**Bảng 4.5 — Thống kê hiệu suất LLM providers trong test run**

| Provider | Thứ tự ưu tiên | Success Rate | Avg Latency | Lý do thất bại phổ biến |
|----------|:---:|:---:|:---:|---|
| Google Gemini | 1 | ~75% | ~3.2s | Rate limit (free tier) |
| Groq (Llama) | 2 | ~20% | ~1.8s | Quota vượt mức |
| Cerebras | 3 | ~4% | ~2.5s | Fallback khi 2 trên fail |
| Nvidia NIM | 4 | ~1% | ~4.1s | Last resort |

**Kết quả:** Bot hoạt động không gián đoạn trong toàn bộ Sprint 5. Tổng cộng 0 lần "complete outage" (tất cả providers fail cùng lúc) trong 48 giờ test run.

---

### 4.4.3 R03 — SSE Scalability

**Chiến lược:** Accept + Document (Chấp nhận và ghi nhận) | Risk Score: 6 (vẫn còn cuối dự án)

**Phân tích kỹ thuật chi tiết:**

`sseService.ts` quản lý SSE connections bằng cấu trúc in-memory:

```typescript
// sseService.ts — Kiến trúc hiện tại (in-memory)
const connections = new Map<string, Response[]>();
//                       ^userId  ^SSE response objects

// Khi user kết nối:
connections.set(userId, [...(connections.get(userId) || []), res]);

// Khi có event:
connections.get(targetUserId)?.forEach(res => {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
});
```

**Bảng 4.6 — Phân tích giới hạn SSE in-memory**

| Giới hạn | Mô tả | Tác động thực tế |
|----------|-------|-----------------|
| **Không scale ngang** | Mỗi process có `connections` Map riêng. Nếu deploy 2 instances, user A kết nối instance 1 sẽ không nhận notification từ instance 2 | Không thể dùng load balancer thông thường |
| **Mất kết nối khi restart** | Server restart → `connections` Map bị xóa → tất cả clients phải reconnect | SSE clients thường tự reconnect (EventSource API); downtime 1–5 giây |
| **Memory scaling** | Mỗi connection chiếm ~1–5KB RAM. 100 concurrent users = ~500KB | Chấp nhận được cho prototype; vấn đề ở 10,000+ users |
| **Không persistent** | Notification chỉ delivered khi user đang online. User offline sẽ miss notifications | Cần database backup (đã có `notifications` table) |

**Upgrade Path được ghi nhận trong DEPLOYMENT.md:**

```markdown
## Known Limitations — SSE Scalability

Current implementation uses in-memory SSE connection management.
NOT suitable for:
- Multi-instance deployments (load-balanced)
- High-concurrency (> 1,000 concurrent users)

Upgrade path for production scale:
1. Replace in-memory Map with Redis pub/sub (redis.publish/subscribe)
2. Replace SSE with WebSocket (socket.io) for bidirectional communication
3. Add Redis adapter for horizontal scaling across multiple instances

Estimated effort: 3–5 days for full migration
```

**Lý do Accept thay vì Mitigate:** Với quy mô prototype thực tập (< 50 concurrent users), SSE in-memory hoàn toàn đáp ứng được. Việc implement Redis pub/sub ngay từ đầu sẽ tốn 3–5 ngày mà không mang lại giá trị thực tế cho giai đoạn này. Quyết định **"right solution for the right scale"** — không over-engineer.

---

### 4.4.4 R04 — Email Delivery (Brevo)

**Chiến lược:** Mitigate (Giảm thiểu) | Risk Score: 6 → 2 (sau S1)

**Phân tích vấn đề thực tế trong Sprint 1:**

Brevo (trước đây là Sendinblue) cung cấp SMTP API với tier free giới hạn 300 email/ngày. Vấn đề phát sinh khi môi trường development gửi OTP liên tục trong quá trình testing, nhanh chóng đạt giới hạn sandbox 100 email/ngày.

**Biện pháp kỹ thuật:**

*Biện pháp 1: Environment isolation với mock service*

```typescript
// backend/src/services/emailService.ts
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    // Không gọi Brevo API trong test environment
    console.log(`[TEST] OTP for ${email}: ${otp}`);
    return;
  }
  
  if (process.env.NODE_ENV === 'development') {
    // Development: gửi thật nhưng log thêm để debug
    console.log(`[DEV] Sending OTP ${otp} to ${email}`);
  }
  
  // Production: gọi Brevo SMTP API
  await brevoApiService.sendTransactionalEmail({ to: email, otp });
}
```

*Biện pháp 2: OTP TTL và Rate Limiting*

```
OTP flow với bảo vệ:
- OTP hết hạn sau 10 phút (TTL)
- Tối đa 3 lần resend OTP per email per giờ
- Tối đa 5 lần nhập OTP sai → khóa 15 phút
- OTP được hash trước khi lưu vào database (không lưu plain text)
```

*Biện pháp 3: Graceful degradation*

Khi Brevo API timeout (> 10 giây), backend trả về `503 Service Unavailable` với message hướng dẫn user thử lại sau 60 giây, thay vì để request hang hoặc crash.

**Bảng 4.7 — Test coverage sau khi implement mock email service**

| Test scenario | Trước mock | Sau mock |
|---|:---:|:---:|
| Register + verify OTP | Depend on Brevo | ✅ Isolated |
| Forgot password flow | Depend on Brevo | ✅ Isolated |
| Test execution time | ~45s (network) | ~2s (mock) |
| Tests fail due to Brevo limit | ~20% cases | 0% |

**Kết quả:** Auth module test coverage tăng từ ~60% lên ~85% sau khi loại bỏ phụ thuộc Brevo trong test environment. Không còn test failure do external service.

---

### 4.4.5 R07 — Deployment Environment

**Chiến lược:** Mitigate (Giảm thiểu) | Risk Score: 6 → 1 (sau S5)

**Phân tích vấn đề:** Developer sử dụng Windows 11 + Node.js 18.x. Production server (Render.com) sử dụng Ubuntu 22.04 LTS + Node.js 18.x (LTS). Các khác biệt tiềm ẩn:
- Đường dẫn file (Windows `\` vs Linux `/`)
- Biến môi trường (`.env` vs Render environment variables)
- Hành vi của `node_modules` (Windows case-insensitive vs Linux case-sensitive)
- Database connection pool behavior

**Biện pháp kỹ thuật — Docker containerization:**

**Hình 4.3 — Docker multi-stage build cho backend**

```
┌─────────────────── Dockerfile (multi-stage) ───────────────────┐
│                                                                  │
│  Stage 1: BUILDER                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FROM node:18-alpine AS builder                         │   │
│  │  WORKDIR /app                                           │   │
│  │  COPY package*.json ./                                  │   │
│  │  RUN npm ci                           ← Production deps │   │
│  │  COPY . .                                               │   │
│  │  RUN npm run build                    ← TypeScript → JS │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼ Copy only what's needed             │
│  Stage 2: PRODUCTION                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FROM node:18-alpine AS production     ← Clean base     │   │
│  │  WORKDIR /app                                           │   │
│  │  COPY --from=builder /app/dist ./dist  ← Compiled JS    │   │
│  │  COPY --from=builder /app/node_modules ./               │   │
│  │  COPY --from=builder /app/prisma ./prisma               │   │
│  │  COPY docker-entrypoint.sh .                            │   │
│  │  RUN chmod +x docker-entrypoint.sh                      │   │
│  │  EXPOSE 5000                                            │   │
│  │  ENTRYPOINT ["./docker-entrypoint.sh"]                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Final image size: ~200MB (vs ~500MB non-multi-stage)           │
└─────────────────────────────────────────────────────────────────┘
```

**Quy trình khởi động trong `docker-entrypoint.sh`:**

```bash
#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy      # Apply pending migrations (production-safe)

echo "Starting server..."
node dist/index.js             # Start compiled Express server
```

**Lợi ích Docker đạt được:**
- **Reproducibility:** `docker build` trên Windows và Linux cho cùng kết quả (Alpine Linux base image)
- **Isolation:** Dependencies được đóng gói, không phụ thuộc vào Node.js version trên host
- **Auto-migration:** `prisma migrate deploy` tự động chạy khi container khởi động
- **Security:** Multi-stage build loại bỏ build tools và dev dependencies khỏi image production

**Kết quả:** Không có environment-specific bug nào sau khi deploy production. `docker build` và `docker run` hoàn toàn nhất quán giữa môi trường development (Windows) và Render.com (Linux Ubuntu).

---

### 4.4.6 R05 và R06 — Rủi ro phụ

**R05 — ImageKit storage quota:**

ImageKit tier free cung cấp 20GB storage và 20GB bandwidth/tháng. Với quy mô prototype, quota này dư thừa. Biện pháp phòng ngừa: script `cleanupImagekit.ts` xóa orphaned images (media không còn được reference bởi bất kỳ post nào). Script được chạy manually khi cần.

**R06 — Technical debt từ scope creep:**

Block layout được thêm vào giữa Sprint 2 tạo ra tech debt:
1. `postController.ts` ban đầu viết cho single text content → phải refactor để support blocks
2. Frontend `CreatePostPage` ban đầu là textarea đơn giản → phải viết lại toàn bộ block editor component

Biện pháp xử lý: Dành 1 ngày đầu Sprint 3 để refactor `postController.ts` và `postService.ts`. Tech debt được trả ngay, không để tích lũy sang Sprint 4.

---

## 4.5 Lessons Learned về quản lý rủi ro

**Bảng 4.8 — Tổng kết Lessons Learned từ quản lý rủi ro**

| # | Bài học | Ngữ cảnh | Áp dụng cho dự án tương lai |
|---|---------|---------|--------------------------|
| 1 | **Nhận diện rủi ro sớm (Sprint 0) là đầu tư đáng giá** | Cả 7 rủi ro đều được nhận diện trước khi bắt đầu develop | Luôn dành ít nhất 2 giờ cho risk workshop trong Sprint 0 |
| 2 | **Scope creep là rủi ro bị underestimate** | R06 không có trong Risk Register ban đầu | Thêm "Feature Scope Creep" như rủi ro mặc định trong mọi dự án Scrum |
| 3 | **External service dependency cần fallback** | R02 (LLM), R04 (Email): không kiểm soát được external service | Mọi tích hợp external API đều cần fallback hoặc mock cho test |
| 4 | **Accept phải đi kèm documentation** | R03 (SSE): quyết định Accept nhưng documented rõ upgrade path | Known limitation phải được ghi trong DEPLOYMENT.md ngay khi phát hiện |
| 5 | **Containerization giải quyết 80% environment risk** | R07: Docker loại bỏ "works on my machine" | Dockerfile nên được setup ngay từ Sprint 0, không đợi đến cuối |
| 6 | **Risk Score nên được cập nhật mỗi sprint** | R01 giảm từ 9 xuống 1 khi migrations ổn định | Risk Register là tài liệu "living document", không phải static |

---

## 4.6 Kết luận chương

Chương 4 đã trình bày toàn bộ quy trình quản lý rủi ro của dự án MINI-FORUM, từ nhận diện, đánh giá đến chiến lược xử lý và theo dõi 7 rủi ro chính. Kết quả nổi bật:

- **6/7 rủi ro được resolved** hoàn toàn trước khi kết thúc dự án.
- **R03 (SSE scalability)** được chấp nhận có chủ đích với documentation rõ ràng về upgrade path.
- **Risk Score trung bình** giảm từ 5.1 (Sprint 0) xuống 2.0 (Sprint 5) — phản ánh hiệu quả của các biện pháp mitigate.
- Không có rủi ro nào nằm ngoài tầm kiểm soát dẫn đến delay milestone.

Kinh nghiệm quan trọng nhất: **Quản lý rủi ro proactive (trước khi xảy ra) hiệu quả hơn nhiều so với reactive (sau khi xảy ra)**. Chi phí prevent luôn thấp hơn chi phí fix.

---

*[Tiếp theo: Chương 5 — Kiểm soát tiến độ và chất lượng]*
