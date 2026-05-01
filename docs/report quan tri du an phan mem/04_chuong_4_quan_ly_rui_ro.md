# CHƯƠNG 4: QUẢN LÝ RỦI RO

---

## 4.1 Tổng quan về quản lý rủi ro trong dự án

### 4.1.1 Quy trình quản lý rủi ro

Dự án MINI-FORUM áp dụng quy trình quản lý rủi ro gồm bốn bước liên tục xuyên suốt các sprint:

```
1. NHẬN DIỆN      2. ĐÁNH GIÁ        3. LẬP KẾ HOẠCH    4. THEO DÕI
   Identify    →     Analyze       →     Respond        →   Monitor
   
   • Sprint 0:      • Xác suất          • Chiến lược        • Review
     Risk workshop    (Cao/TB/Thấp)       (Avoid/Mitigate/    mỗi sprint
   • Ongoing:       • Tác động            Transfer/Accept)  • Update
     Daily standup    (Cao/TB/Thấp)     • Owner rõ ràng       register
     blocker check  • Mức độ ưu tiên    • Deadline action
```

### 4.1.2 Thang đánh giá rủi ro

Mỗi rủi ro được đánh giá theo hai chiều:

- **Xác suất xảy ra:** Cao (> 60%) / Trung bình (30–60%) / Thấp (< 30%)
- **Tác động:** Cao (ảnh hưởng milestone hoặc budget) / Trung bình (delay 1–3 ngày) / Thấp (không ảnh hưởng milestone)
- **Mức độ rủi ro** = Xác suất × Tác động → 4 mức: Nghiêm trọng / Cao / Trung bình / Thấp

---

## 4.2 Risk Register — Bảng đăng ký rủi ro

**Bảng 4.1 — Risk Register: 7 rủi ro chính của dự án MINI-FORUM**

| ID | Mô tả rủi ro | Xác suất | Tác động | **Mức độ** | Chiến lược xử lý | Owner | Sprint phát hiện |
|----|-------------|----------|----------|-----------|-----------------|-------|-----------------|
| **R01** | Schema database thay đổi ảnh hưởng nhiều service đồng thời (breaking migration) | Cao | Cao | 🔴 **Nghiêm trọng** | Mitigate — Prisma migration có version; soft deprecation; không drop column ngay | Lead Dev | S0 |
| **R02** | LLM API không ổn định: rate limit, quota vượt mức, nhà cung cấp ngừng dịch vụ | Cao | Trung bình | 🟠 **Cao** | Mitigate — Multi-LLM fallback chain: Gemini → Groq → Cerebras → Nvidia | Lead Dev | S0 |
| **R03** | SSE real-time không scale với nhiều concurrent users, memory leak tiềm ẩn | Trung bình | Cao | 🟠 **Cao** | Accept + Document — Giới hạn scope prototype; ghi nhận upgrade path WebSocket | Lead Dev | S3 |
| **R04** | Email delivery (Brevo) chậm hoặc fail trong môi trường development/test | Trung bình | Cao | 🟠 **Cao** | Mitigate — OTP có TTL + retry; mock email service trong test environment | Lead Dev | S1 |
| **R05** | ImageKit storage quota tier free bị vượt mức, service suspend | Thấp | Thấp | 🟢 **Thấp** | Accept + Monitor — Cleanup script thường xuyên; theo dõi usage dashboard | Lead Dev | S4 |
| **R06** | Tech debt tích lũy do block layout thêm vào giữa Sprint 2 (scope creep) | Cao | Trung bình | 🟡 **Trung bình** | Mitigate — Adjust Sprint 3 scope; refactor sau khi feature ổn định | Lead Dev | S2 |
| **R07** | Deployment environment khác development — môi trường sản xuất không nhất quán | Trung bình | Cao | 🟠 **Cao** | Mitigate — Docker container đảm bảo nhất quán; `docker-entrypoint.sh` tự động hóa | Lead Dev | S0 |

---

## 4.3 Ma trận xác suất — tác động

### 4.3.1 Risk Matrix

**Hình 4.1 — Ma trận rủi ro (Probability × Impact Matrix)**

```
TÁC ĐỘNG
         │   Thấp          Trung bình       Cao
─────────┼──────────────────────────────────────────
  Cao    │                    R06         R01 (⚠)
         │                    🟡           🔴
─────────┼──────────────────────────────────────────
Trung    │                    R02         R03, R04, R07
 bình    │                    🟠           🟠 🟠 🟠
─────────┼──────────────────────────────────────────
  Thấp   │   R05
         │   🟢
─────────┴──────────────────────────────────────────
          XÁC SUẤT XẢY RA

Chú thích:
  🔴 Nghiêm trọng — xử lý ngay, ưu tiên cao nhất
  🟠 Cao — lập kế hoạch phản hồi cụ thể
  🟡 Trung bình — theo dõi và giảm thiểu
  🟢 Thấp — chấp nhận, theo dõi thụ động
```

### 4.3.2 Phân tích từng nhóm rủi ro

**Nhóm rủi ro Nghiêm trọng (🔴):** Chỉ có R01 — rủi ro về schema database. Đây là rủi ro cao nhất vì thay đổi schema có thể break toàn bộ API và cả hai frontend cùng lúc. Tuy nhiên, xác suất xảy ra cao vì dự án đang trong giai đoạn phát triển tích cực.

**Nhóm rủi ro Cao (🟠):** R02, R03, R04, R07 — các rủi ro này liên quan đến phụ thuộc vào dịch vụ bên ngoài (LLM API, Email, Docker deployment) và quyết định kiến trúc (SSE). Tất cả đều có kế hoạch phản hồi cụ thể.

**Nhóm rủi ro Trung bình (🟡):** R06 — scope creep là không thể tránh khỏi trong Scrum, nhưng có thể kiểm soát thông qua sprint boundaries nghiêm ngặt.

---

## 4.4 Chiến lược xử lý rủi ro thực tế

### 4.4.1 R01 — Schema Database thay đổi

**Chiến lược:** Mitigate (Giảm thiểu)

**Biện pháp kỹ thuật:**
1. **Prisma Migrations versioned** — toàn bộ lịch sử thay đổi schema được lưu trong `backend/prisma/migrations/` theo dạng timestamped folders, cho phép rollback bất cứ lúc nào.
2. **Soft deprecation** — khi cần thay đổi column, không xóa ngay mà thêm column mới, giữ column cũ với comment `@deprecated`. Ví dụ thực tế trong `schema.prisma`:

```prisma
model users {
  // ...
  avatar_url         String?   // @deprecated — legacy fallback (UC-08)
  avatar_preview_url String?   // mới — thumbnail từ ImageKit
  avatar_standard_url String?  // mới — standard resolution từ ImageKit
  avatar_imagekit_file_id String? // mới — để cleanup
}
```

3. **Migration scripts** — `backend/scripts/migrateAvatarUrls.ts` và `migratePostsToBlocks.ts` là ví dụ về data migration có thể chạy independently mà không block development.

**Kết quả:** Zero breaking change trong toàn bộ 3 tháng. Tất cả service (backend, frontend, admin-client, vibe-content) vẫn hoạt động bình thường qua các lần thay đổi schema.

---

### 4.4.2 R02 — LLM API không ổn định

**Chiến lược:** Mitigate (Giảm thiểu)

**Biện pháp kỹ thuật — Multi-LLM Fallback Chain:**

```
ContentGeneratorService
│
├── Try Provider 1: Google Gemini
│   ├── Timeout: 30 giây
│   ├── Retry: 2 lần
│   └── On failure → Provider 2
│
├── Try Provider 2: Groq (Llama)
│   ├── Timeout: 30 giây
│   ├── Retry: 2 lần
│   └── On failure → Provider 3
│
├── Try Provider 3: Cerebras
│   ├── Timeout: 30 giây
│   └── On failure → Provider 4
│
└── Try Provider 4: Nvidia NIM
    ├── Timeout: 30 giây
    └── On failure → Log error, skip this action cycle
```

**Kết quả theo dõi:** Trong test run, Gemini xử lý ~75% requests; Groq fallback ~20%; Cerebras/Nvidia < 5%. Bot không bị gián đoạn ngay cả khi một provider có downtime.

---

### 4.4.3 R03 — SSE Scalability

**Chiến lược:** Accept + Document (Chấp nhận và ghi nhận)

**Phân tích kỹ thuật:** `sseService.ts` sử dụng `Map<userId, Response[]>` để lưu các SSE connections trong process memory. Kiến trúc này có giới hạn:
- Không scale ngang (horizontal scaling) — mỗi instance có connection map riêng.
- Nếu server restart, tất cả kết nối bị mất.
- Với 100+ concurrent users, memory sử dụng tăng đáng kể.

**Quyết định:** Với quy mô prototype và mục tiêu thực tập, SSE in-memory là chấp nhận được. Ghi nhận rõ ràng trong `DEPLOYMENT.md`:

```markdown
## Known Limitations
- SSE notifications use in-memory connection management.
  Not suitable for multi-instance deployments.
  Upgrade path: Redis pub/sub + WebSocket for production.
```

**Bài học:** Quyết định Accept phải đi kèm với documentation rõ ràng về giới hạn và upgrade path, để người tiếp nhận dự án biết cần cải tiến gì.

---

### 4.4.4 R04 — Email Delivery (Brevo)

**Chiến lược:** Mitigate (Giảm thiểu)

**Biện pháp kỹ thuật:**
1. **OTP TTL + Retry:** OTP hết hạn sau 10 phút; user có thể yêu cầu gửi lại với rate limit (tối đa 3 lần/giờ per email).
2. **Test environment isolation:** Khi `NODE_ENV=test`, `emailService` không gọi Brevo API mà in OTP ra console — loại bỏ phụ thuộc vào external service trong unit tests.
3. **Error handling graceful:** Nếu Brevo API timeout, trả về lỗi 503 với message hướng dẫn user thử lại sau 60 giây, thay vì crash server.

**Kết quả:** Tất cả Vitest tests cho auth module pass 100% với mock email service. Production delivery rate > 95% (theo Brevo dashboard).

---

### 4.4.5 R07 — Deployment Environment

**Chiến lược:** Mitigate (Giảm thiểu)

**Biện pháp — Docker containerization:**

```dockerfile
# backend/Dockerfile (multi-stage)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
EXPOSE 5000
ENTRYPOINT ["./docker-entrypoint.sh"]
```

```bash
# backend/docker-entrypoint.sh
#!/bin/sh
# Chạy migration trước khi start
npx prisma migrate deploy
# Optional: seed data nếu DB trống
# npx tsx prisma/seed.ts
# Start server
node dist/index.js
```

**Kết quả:** `docker build` và `docker run` hoàn toàn nhất quán giữa máy developer (Windows) và Render.com (Linux). Không có environment-specific bug sau khi deploy.

---

## 4.5 Lessons Learned về quản lý rủi ro

1. **Nhận diện rủi ro sớm (Sprint 0) là đầu tư đáng giá:** Cả 7 rủi ro đều được nhận diện trước khi bắt đầu develop, cho phép build mitigation strategy ngay từ đầu thay vì panic khi vấn đề xảy ra.

2. **R06 (scope creep) là rủi ro khó kiểm soát nhất:** Block layout không được identify trong Risk Register ban đầu → cần thêm "Feature Scope Creep" như một rủi ro mặc định trong mọi dự án Scrum.

3. **Multi-LLM fallback là pattern đúng cho AI integration:** Nguyên tắc "reliability over simplicity" — một provider duy nhất rẻ hơn nhưng có điểm lỗi đơn (single point of failure), không phù hợp với service quan trọng.

4. **Technical debt cần được ghi nhận ngay khi phát sinh:** R03 được ghi vào DEPLOYMENT.md ngay trong Sprint 3, không để sau mới nhớ.

---

*[Tiếp theo: Chương 5 — Kiểm soát tiến độ và chất lượng]*
