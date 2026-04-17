# SLO / SLA — Mini Forum

> Tháng 4/2026 · Phiên bản 1.0

---

## 1. Phạm vi áp dụng

Tài liệu này định nghĩa các mục tiêu chất lượng dịch vụ (SLO) và cam kết dịch vụ (SLA) cho các API chính của Mini Forum backend.

---

## 2. Định nghĩa SLO (Service Level Objectives)

### 2.1 Availability (Khả năng sẵn sàng)

| Môi trường | Mục tiêu |
|---|---|
| Production | **99.5%** uptime theo tháng (~3.6h downtime/tháng) |
| Staging | 95% |

**Cách đo:** Tỉ lệ thành công của health-check `/ping` (HTTP 200) trong mỗi khoảng 1 phút.

### 2.2 Latency (Độ trễ API)

| Endpoint | P95 | P99 |
|---|---|---|
| `GET /api/v1/posts` | ≤ 300ms | ≤ 800ms |
| `GET /api/v1/posts/:id` | ≤ 200ms | ≤ 500ms |
| `POST /api/v1/auth/login` | ≤ 400ms | ≤ 1000ms |
| `POST /api/v1/posts` | ≤ 500ms | ≤ 1200ms |
| `GET /api/v1/search` | ≤ 600ms | ≤ 1500ms |
| Tất cả endpoint admin | ≤ 800ms | ≤ 2000ms |

### 2.3 Error Rate (Tỉ lệ lỗi)

| Loại lỗi | Ngưỡng tối đa |
|---|---|
| Lỗi server (5xx) / tổng request | < 1% theo giờ |
| Lỗi DB (query timeout / connection fail) | < 0.5% theo giờ |
| Cảnh báo tự động khi error rate > | **10%** trong 1 phút |

### 2.4 Throughput

| API | Tối thiểu đảm bảo |
|---|---|
| Read endpoints (GET) | 50 req/s |
| Write endpoints (POST/PATCH/DELETE) | 10 req/s |

### 2.5 LLM / Vibe-Content

| Chỉ số | Mục tiêu |
|---|---|
| LLM provider success rate (per provider) | ≥ 70% sau 10 lần gọi |
| Fallback hoạt động khi provider chính fail | < 5 phút |
| Thời gian cooldown sau rate-limit | 2 giờ (tự động) |

### 2.6 Database

| Chỉ số | Ngưỡng |
|---|---|
| Query time bình thường | < 100ms |
| Slow query cảnh báo | ≥ 500ms → log `WARN slow_query` |
| Query nghiêm trọng | ≥ 2000ms → escalate ngay |

---

## 3. Chu kỳ đo & báo cáo

- **Real-time:** `/api/v1/admin/metrics` — cập nhật từng request
- **Ops Dashboard:** Admin client → "Ops Dashboard" — làm mới mỗi 30s
- **Báo cáo tháng:** Tóm tắt error rate, p95 latency, uptime

---

## 4. SLA — Cam kết dịch vụ (nếu vượt ngưỡng)

| Mức vi phạm | Hành động |
|---|---|
| Downtime > 1 giờ liên tục | Thông báo nội bộ ngay, bắt đầu incident |
| Error rate > 10% trong 5 phút | Cảnh báo tự động + kiểm tra ngay |
| P99 latency > 2s kéo dài > 10 phút | Kiểm tra DB / LLM / infra |
| Tất cả LLM provider fail | Tắt bot tạm thời, log incident |

---

## 5. Loại trừ

Các tình huống không tính vào SLO:
- Bảo trì có lịch (thông báo trước 24h)
- Tấn công DDoS ngoài tầm kiểm soát
- Sự cố từ nhà cung cấp cloud/DB/LLM bên thứ ba
