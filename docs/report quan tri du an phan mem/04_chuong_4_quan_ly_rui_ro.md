# CHƯƠNG 4: QUẢN LÝ RỦI RO

---

## 4.1 Tổng quan quy trình

Dự án MINI-FORUM áp dụng **PMBOK Risk Management** đơn giản hóa phù hợp với Scrum team nhỏ, gồm 4 bước liên tục: **(1) Nhận diện** (Sprint 0 + daily check) → **(2) Đánh giá** (xác suất × tác động) → **(3) Lập kế hoạch phản hồi** (Avoid/Mitigate/Transfer/Accept) → **(4) Theo dõi** (review cuối mỗi sprint).

$$\text{Risk Score} = \text{Xác suất (1–3)} \times \text{Tác động (1–3)}$$

**Bảng 4.1a — Thang đánh giá xác suất**

| Mức | Xác suất | Đặc điểm |
|:---:|:---:|---|
| 3 | > 60% | Đã từng xảy ra trong dự án tương tự |
| 2 | 30–60% | Có thể xảy ra; có dấu hiệu cảnh báo |
| 1 | < 30% | Không chắc xảy ra |

**Bảng 4.1b — Thang đánh giá tác động và mức độ rủi ro**

| Mức tác động | Hệ quả | Risk Score | Mức độ | Hành động |
|:---:|---|:---:|---|---|
| 3 | Delay > 3 ngày, phải cắt scope | 9 | 🔴 Nghiêm trọng | Xử lý ngay |
| 2 | Delay 1–3 ngày, adjust sprint | 6 | 🟠 Cao | Lập kế hoạch phản hồi |
| 1 | Xử lý trong sprint, không ảnh hưởng milestone | 3–4 | 🟡 Trung bình | Theo dõi chặt |
| — | — | 1–2 | 🟢 Thấp | Chấp nhận |

---

## 4.2 Risk Register — 7 rủi ro chính

**Bảng 4.2 — Risk Register và trạng thái cuối dự án**

| ID | Mô tả rủi ro | XS | TĐ | **Score** | Mức độ | Chiến lược | Sprint phát hiện | Trạng thái |
|----|-------------|:---:|:---:|:---:|---|---|:---:|:---:|
| **R01** | Schema database thay đổi, breaking migration | 3 | 3 | **9** | 🔴 Nghiêm trọng | Mitigate | S0 | ✅ Resolved |
| **R02** | LLM API: rate limit, quota, provider downtime | 3 | 2 | **6** | 🟠 Cao | Mitigate | S0 | ✅ Resolved |
| **R03** | SSE real-time không scale, memory leak | 2 | 3 | **6** | 🟠 Cao | Accept+Doc | S3 | ⚠ Documented |
| **R04** | Email delivery (Brevo) chậm/fail dev/test | 2 | 3 | **6** | 🟠 Cao | Mitigate | S1 | ✅ Resolved |
| **R05** | ImageKit storage quota tier free vượt mức | 1 | 1 | **1** | 🟢 Thấp | Accept+Monitor | S4 | ✅ No issue |
| **R06** | Tech debt từ block layout scope creep S2 | 3 | 2 | **6** | 🟠 Cao | Mitigate | S2 | ✅ Resolved |
| **R07** | Môi trường deployment khác development | 2 | 3 | **6** | 🟠 Cao | Mitigate | S0 | ✅ Resolved |

*XS = Xác suất, TĐ = Tác động*

**Phân loại theo nguồn gốc:** R01/R03/R06 — kỹ thuật nội bộ, kiểm soát được | R02/R04/R05 — phụ thuộc external services, cần fallback | R07 — môi trường, giải quyết bằng containerization.

### Tiến hóa Risk Score theo sprint

**Bảng 4.3 — Risk Score qua các Sprint**

| Risk ID | S0 | S1 | S2 | S3 | S4 | S5 | Nhận xét |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|---|
| R01 | 9🔴 | 9🔴 | 9🔴 | 6🟠 | 3🟡 | 1🟢 | Giảm dần khi migrations ổn định |
| R02 | 6🟠 | 6🟠 | 6🟠 | 6🟠 | 6🟠 | 2🟢 | Resolved sau S5 (multi-LLM) |
| R03 | — | — | — | 6🟠 | 6🟠 | 6🟠 | Documented limitation |
| R04 | 6🟠 | 4🟡 | 2🟢 | 2🟢 | 2🟢 | 2🟢 | Resolved sau mock email S1 |
| R05 | 1🟢 | 1🟢 | 1🟢 | 1🟢 | 1🟢 | 1🟢 | Stable, no issue |
| R06 | — | — | 6🟠 | 4🟡 | 2🟢 | 1🟢 | Resolved qua refactoring S3 |
| R07 | 6🟠 | 6🟠 | 6🟠 | 6🟠 | 6🟠 | 1🟢 | Resolved sau Docker deploy |

---

## 4.3 Chiến lược xử lý từng rủi ro

### R01 — Schema Database (Score 9 → 1)

Rủi ro cao nhất: monorepo 4 services dùng chung PostgreSQL — bất kỳ schema change nào ảnh hưởng đồng thời toàn hệ thống.

**Biện pháp:**
1. **Prisma Migrations versioned** — lịch sử đầy đủ trong `backend/prisma/migrations/`, rollback bằng một lệnh.
2. **Soft deprecation** — giữ column cũ `@deprecated` thay vì xóa ngay; migration scripts riêng (`migrateAvatarUrls.ts`, `migratePostsToBlocks.ts`) chuyển data nền tảng không block development.

**Kết quả:** Zero breaking changes trong 3 tháng. 4 lần migrate đều thành công trên tất cả services.

---

### R02 — LLM API không ổn định (Score 6 → 2)

**Biện pháp:** Multi-LLM Fallback Chain — khi provider lỗi, tự động chuyển:

```
Gemini 1.5 Flash → Groq llama3 → Cerebras llama3.1 → Nvidia NIM → Log + skip cycle
```



### R03 — SSE Scalability (Score 6 — Documented)

SSE dùng `Map<userId, Response[]>` in-memory. Giới hạn: không scale ngang (mỗi process có Map riêng), mất kết nối khi restart (clients tự reconnect ~1–5s), giới hạn ~500 concurrent connections.

**Lý do Accept thay vì Mitigate:** Prototype < 50 concurrent users — giải pháp đáp ứng đủ. Implement Redis pub/sub ngay tốn 3–5 ngày không mang lại giá trị thực tế. Upgrade path (Redis pub/sub + socket.io) được document trong `DEPLOYMENT.md`.

---

### R04 — Email Delivery (Score 6 → 2)

**Biện pháp:** Mock email service cho `NODE_ENV=test` — test không gọi Brevo API. OTP TTL 10 phút, tối đa 3 lần resend/giờ, 5 lần nhập sai → khóa 15 phút. Khi Brevo timeout → `503 Service Unavailable` graceful.

**Kết quả:** Auth test coverage tăng từ ~60% → ~85%, test time giảm từ ~45s → ~2s.

---

### R05, R06, R07 — Rủi ro phụ

**R05:** ImageKit 20GB tier free — dư thừa cho prototype. Script `cleanupImagekit.ts` xóa orphaned images.

**R06:** Block layout scope creep tạo tech debt cho `postController.ts` và `CreatePostPage`. Dành 1 ngày đầu Sprint 3 refactor — trả debt ngay, không để tích lũy.

**R07:** Docker multi-stage (BUILDER compile TS → PRODUCTION chỉ `/dist` + runtime deps). `docker-entrypoint.sh` tự chạy `prisma migrate deploy`. Image ~200MB, zero environment bug sau deploy.

---

*[Tiếp theo: Chương 5 — Kiểm soát tiến độ và chất lượng]*
