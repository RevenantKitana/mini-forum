# Incident Response Runbook — Mini Forum

> Phiên bản 1.0 · Tháng 4/2026

---

## 1. Phát hiện sự cố

### Nguồn cảnh báo
| Nguồn | Điều kiện kích hoạt |
|---|---|
| **Ops Dashboard** (admin-client) | Badge "Cảnh báo đang kích hoạt" màu đỏ |
| **Backend log** (`WARN ALERT:`) | Error rate > 10% trong 1 phút |
| **Backend log** (`WARN SLOW QUERY`) | Query ≥ 500ms |
| **Vibe-content log** (`WARN LLM provider...low success rate`) | Success rate < 50% sau 10 lần gọi |
| **Health check** (`/ping` / `/health`) | HTTP ≠ 200 |

---

## 2. Phân loại mức độ

| Severity | Tiêu chí | Thời gian phản hồi |
|---|---|---|
| **P1 – Critical** | API hoàn toàn down, DB không kết nối được, error rate > 50% | 15 phút |
| **P2 – High** | Error rate 10–50%, P99 > 5s, LLM toàn bộ fail | 1 giờ |
| **P3 – Medium** | Slow query lặp lại, 1 LLM provider fail | 4 giờ |
| **P4 – Low** | Lỗi đơn lẻ, cảnh báo không tái diễn | Best-effort |

---

## 3. Quy trình xử lý

### Bước 1 — Xác nhận sự cố (5 phút)
```bash
# Kiểm tra health
curl https://<API_URL>/ping
curl https://<API_URL>/api/v1/health

# Xem metrics hiện tại
curl -H "Authorization: Bearer <token>" https://<API_URL>/api/v1/admin/metrics | jq .

# Xem log gần nhất (production)
docker logs --tail=100 mini-forum-backend 2>&1 | grep -E "ERROR|WARN|ALERT"
```

### Bước 2 — Cô lập nguyên nhân

#### API lỗi nhiều (5xx)
```bash
# Lọc log lỗi với requestId
docker logs mini-forum-backend 2>&1 | grep '"level":"ERROR"' | tail -50 | jq .
```
- Kiểm tra lỗi DB: tìm `"message":"Prisma error"` hoặc `"message":"slow_query"`
- Kiểm tra lỗi code: tìm `"errorName":"TypeError"` hoặc tương tự

#### Database chậm / lỗi
```bash
# Log slow query
grep "slow_query" /var/log/mini-forum/backend.log | tail -20

# Kiểm tra connection pool (nếu dùng pgbouncer)
psql $DATABASE_URL -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

#### LLM fail / bot không hoạt động
```bash
# Vibe-content health
curl https://<VIBE_CONTENT_URL>/health | jq .

# LLM metrics
curl https://<VIBE_CONTENT_URL>/metrics | jq .

# Log vibe-content
docker logs mini-forum-vibe-content 2>&1 | grep -E "ERROR|WARN" | tail -50
```

### Bước 3 — Khắc phục nhanh

| Tình huống | Hành động |
|---|---|
| Backend crash / OOM | `docker restart mini-forum-backend` |
| DB connection exhausted | Restart pgbouncer / giảm pool size |
| LLM rate-limited toàn bộ | Đợi cooldown 2h hoặc xem `/health` để biết provider còn lại |
| Deploy lỗi (regression) | Rollback image: `docker pull <prev-tag> && docker-compose up -d` |
| Memory leak | Kiểm tra `docker stats`, restart nếu RSS > 80% limit |

### Bước 4 — Thông báo

#### Trong sự cố (P1/P2)
- Ghi lại: thời điểm phát hiện, triệu chứng, requestId liên quan
- Thông báo team (Slack / Discord / Zalo)

#### Sau sự cố (Post-mortem)
1. Timeline sự cố (phát hiện → xử lý → recover)
2. Root cause
3. Impact (số user bị ảnh hưởng, thời gian downtime)
4. Action items để tránh lặp lại

---

## 4. Thông tin liên lạc khẩn

| Vai trò | Trách nhiệm |
|---|---|
| On-call engineer | Phản hồi cảnh báo, thực hiện bước 1–3 |
| DB admin | Hỗ trợ khi có vấn đề database |
| Team lead | Thông báo escalate P1, quyết định rollback |

---

## 5. Checklist sau sự cố

- [ ] Metrics đã trở về bình thường (error rate < 1%, P95 < 300ms)
- [ ] Không còn cảnh báo active trong Ops Dashboard
- [ ] Log đã ghi rõ `requestId` của các request lỗi
- [ ] Đã tạo ticket / note post-mortem
- [ ] Đã cập nhật SLO nếu cần thiết
