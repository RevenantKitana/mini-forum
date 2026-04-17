

## VIBE CONTENT DASHBOARD PLAN (MVP -> V1)

### Queue 0 - Scope va contract (blocking)
- [ ] Chot scope MVP: chi monitor + retry job, chua cho edit noi dung.
- [ ] Chot role access: `ADMIN` full, `MODERATOR` read-only.
- [ ] Chot API contract FE/BE cho dashboard, jobs list, job detail, actions.
- [ ] Chot data retention: metrics 24h/7d, job log 30 ngay.
- [ ] AC: Co file spec API + mapping field snake_case/camelCase.

### Queue 1 - Backend metrics endpoints (MVP)
- [ ] Tao endpoint overview: throughput, success/fail/retry, queue depth.
- [ ] Tao endpoint timeseries 24h (bucket 5p/15p) cho chart.
- [ ] Tao endpoint provider stats (provider/model, success rate, avg latency).
- [ ] Tao endpoint scheduler health (last run, next run, lock status).
- [ ] AC: Endpoint co paging/filter co ban, response on dinh khi khong co data.

### Queue 2 - Job management endpoints (MVP)
- [ ] Tao endpoint list jobs: status, attempts, createdAt, updatedAt, error summary.
- [ ] Tao endpoint job detail: timeline step, prompt/meta, error stack da sanitize.
- [ ] Tao action `retry job` (idempotent, co audit log).
- [ ] Tao action `cancel job` (chi cho state hop le).
- [ ] AC: Co validation state transition + test cho edge case retry/cancel.

### Queue 3 - Admin client UI (MVP)
- [ ] Tao page `VibeContentDashboardPage` + route/menu item.
- [ ] KPI cards: queued/running/success/failed/retrying.
- [ ] Chart 24h: throughput, success rate, error rate.
- [ ] Bang Recent Jobs: filter theo status/provider/date.
- [ ] Drawer/Detail panel cho 1 job + nut Retry/Cancel theo role.
- [ ] AC: Loading/empty/error state day du, polling 30s khong flicker.

### Queue 4 - Reliability va observability hardening
- [ ] Them circuit-breaker status widget + so lan trip trong 24h.
- [ ] Them dead-letter/retry queue widget + oldest pending age.
- [ ] Them alert rules: error spike, queue backlog, provider degrade.
- [ ] Gui alert den kenh da chon (log + webhook/Slack neu co).
- [ ] AC: Co test scenario cho 3 alert chinh, alert khong spam duplicate.

### Queue 5 - Testing va quality gate
- [ ] Backend: unit test metrics aggregator + integration test endpoints.
- [ ] Frontend: test render states, filter, retry action, permission gate.
- [ ] E2E: luong monitor -> mo job detail -> retry thanh cong.
- [ ] Performance test nhe cho endpoint timeseries/jobs list.
- [ ] AC: CI pass, khong co regression o admin routes hien tai.

### Queue 6 - Security, governance, docs
- [ ] Redact PII trong logs/job payload.
- [ ] Audit log cho moi action quan tri (`retry`, `cancel`, `pause/resume` neu co).
- [ ] RBAC check dong nhat FE/BE, khong de moderator thay action admin-only.
- [ ] Viet runbook: cach doc dashboard, triage incident, rollback.
- [ ] AC: Security review pass + runbook co playbook cho 3 loi pho bien.

### Queue 7 - V1 enhancements (sau MVP)
- [ ] Pause/Resume scheduler tu dashboard.
- [ ] Bulk retry jobs theo filter.
- [ ] Cost dashboard theo provider/model (token, uoc tinh chi phi).
- [ ] SLA/SLO panel rieng cho vibe-content pipeline.
- [ ] AC: Co baseline KPI truoc/sau khi rollout.

## Milestone de xuat
- [ ] M1 (1-2 ngay): Queue 0 + Queue 1.
- [ ] M2 (2-3 ngay): Queue 2 + Queue 3 (MVP go-live noi bo).
- [ ] M3 (2 ngay): Queue 4 + Queue 5.
- [ ] M4 (1 ngay): Queue 6 + chot docs.
- [ ] M5 (tuy chon): Queue 7.
