# Bot Content Incident Runbook

## 1. First Response (< 5 minutes)

### 1.1 Check service health
```bash
curl http://localhost:4000/health
```
Expected response structure:
```json
{
  "status": "ok | degraded",
  "uptime": <seconds>,
  "providers": [
    {
      "id": "gemini-flash",
      "available": true,
      "circuitState": "CLOSED",
      "circuitFailures": 0,
      "circuitOpenSince": null
    }
  ]
}
```
- `status: "degraded"` means at least one provider circuit is not CLOSED.
- If all circuits are OPEN → escalate to [§3 All Providers Down](#3-all-providers-down).

### 1.2 Check full status
```bash
curl http://localhost:4000/status | jq .
```
Key fields:
| Field | What to look for |
|---|---|
| `providerStatus.unavailable` | Providers with `auth_error` or `missing_api_key` |
| `queue.total` | Jobs waiting for retry |
| `queue.dlqSize` | Jobs that exceeded all retries |
| `jobLifecycle.running` | Jobs currently executing |
| `recentActions` | Last 10 action results + errors |

---

## 2. Common Failure Scenarios

### 2.1 Bot posts/comments stopped

**Symptoms**: No new bot content appearing, `todayStats.totalActions` not growing.

**Steps**:
1. Check `recentActions` for recent failures and error messages.
2. If `providerStatus.available` is empty → all LLM providers down. Go to §3.
3. Check `queue.total` — if rising but no successes, the retry processor may be hung.
4. Check `jobLifecycle.running` — if a job has been `running` for > 5 minutes it is stuck.
5. Restart the service if a stuck job is confirmed:
   ```bash
   # Docker / systemd / PM2 depending on deployment
   docker restart vibe-content
   # or
   pm2 restart vibe-content
   ```

### 2.2 Provider rate limit hit (429)

**Symptoms**: `providerStatus` shows `reason: "rate_limited"` or `reason: "cooldown"`.

**Steps**:
1. Check cooldown expiry in `cooldownUntil` field.
2. Wait for cooldown to expire (2 hours max). Other providers in the fallback chain will be used.
3. If *all* providers are rate-limited → temporarily reduce `BATCH_SIZE` or `CRON_SCHEDULE` in env and restart.
4. Check API quota dashboards:
   - [Google AI Studio](https://aistudio.google.com/) — Gemini
   - [Groq Console](https://console.groq.com/) — Groq
   - [Cerebras Cloud](https://cloud.cerebras.ai/) — Cerebras

### 2.3 Auth failure (401)

**Symptoms**: `providerStatus` shows `reason: "auth_error"`.

**Steps**:
1. Verify API keys in the `.env` file are correct and not expired.
2. Re-roll / regenerate the API key on the provider portal.
3. Update `.env` and restart the service.
4. Confirm recovery:
   ```bash
   curl http://localhost:4000/trigger/post
   ```

### 2.4 Dead-letter queue growing

**Symptoms**: `queue.dlqSize > 0` and continuing to grow.

**Steps**:
1. Inspect DLQ entries in `queue.dlq` from `/status`.
2. Identify the `errorCategory` (timeout / rate_limited / server_error).
3. Resolve the underlying cause (network, rate limit, auth).
4. DLQ items are **not** automatically retried. After fixing the root cause, restart the service. In-flight queue items are retried from memory; DLQ items log final errors and are kept for observability only.
5. If needed, manually trigger a fresh run to backfill:
   ```bash
   curl -X POST http://localhost:4000/trigger/post
   curl -X POST http://localhost:4000/trigger/comment
   ```

### 2.5 Circuit breaker stuck OPEN

**Symptoms**: `/health` returns a provider with `"circuitState": "OPEN"`.

**Steps**:
1. The circuit will automatically probe again after `openDurationMs` (2 minutes default).
2. If the probe succeeds (HALF\_OPEN → CLOSED), recovery is automatic.
3. If the probe keeps failing → the underlying provider is down. See §2.2 or §2.3.
4. Only restart the service as a last resort; restarting resets all circuit breaker state.

### 2.6 Duplicate posts or comments appearing

**Symptoms**: Identical content posted multiple times.

**Steps**:
1. This should be prevented by idempotency keys on all API calls (`X-Idempotency-Key` header).
2. If duplicates still appear, the backend may not be honoring the idempotency key. Investigate `backend` service.
3. Check if the service was restarted mid-job — the in-memory retry queue is lost on restart, but the action was already sent. Verify on the backend side.
4. Short-term: manually delete duplicate content via the admin panel.

### 2.7 Cron job not firing

**Symptoms**: `todayStats.byTrigger.cron` not incrementing.

**Steps**:
1. Confirm the cron schedule is correctly set: check `cronSchedule` in `/status`.
2. Check if another instance holds the Postgres advisory lock (multi-instance deployment). This is expected behaviour — only one instance runs the job. Verify via db:
   ```sql
   SELECT * FROM pg_stat_activity WHERE query LIKE '%advisory%';
   ```
3. If running a single-instance deployment and the lock is orphaned from a crash, restart the service (session locks are released on disconnect).

---

## 3. All Providers Down

**Symptoms**: `/health` returns `status: "degraded"` with all providers unavailable.

**Immediate actions**:
1. Reduce pressure — set `CRON_SCHEDULE=0 */6 * * *` (every 6 hours) and restart.
2. Manually test each provider:
   ```bash
   curl -X POST http://localhost:4000/trigger/post/1   # label 1 = gemini-flash
   curl -X POST http://localhost:4000/trigger/post/2   # label 2 = groq-70b
   # etc.
   ```
3. Check external status pages:
   - https://status.groq.com
   - https://developers.googleblog.com (Gemini status announcements)
4. If all providers are down for > 1 hour, set `CRON_SCHEDULE=0 0 * * *` (once daily) to reduce log noise.

---

## 4. Scaling Notes

- **Distributed lock**: Postgres advisory lock prevents double-firing across multiple instances. The lock is session-scoped and self-releases on crash.
- **Retry queue**: In-memory only. On restart, pending retry queue items are lost. DLQ entries are logged before the process exits.
- **Feature flag**: Set `BATCH_SIZE=0` to pause all bot activity without stopping the service.

---

## 5. Useful Commands

```bash
# Full status (pretty-printed)
curl -s http://localhost:4000/status | jq .

# Health check
curl -s http://localhost:4000/health | jq .

# Manual triggers
curl -X POST http://localhost:4000/trigger/post
curl -X POST http://localhost:4000/trigger/comment
curl -X POST http://localhost:4000/trigger/vote

# Trigger a specific provider (label 1–10)
curl -X POST http://localhost:4000/trigger/post/1

# Docker logs
docker logs vibe-content --tail 100 -f

# Postgres advisory lock status
psql $DATABASE_URL -c "SELECT * FROM pg_locks WHERE locktype='advisory';"
```

---

## 6. Escalation

| Severity | Condition | Action |
|---|---|---|
| P3 | Single provider down, others working | Monitor; auto-recovers |
| P2 | All providers rate-limited | Wait for cooldown; reduce batch size |
| P1 | Service unreachable / all providers down > 30min | Page on-call; restart service; investigate infra |
| P0 | Bot content causing policy violation | Emergency stop: `BATCH_SIZE=0`; restart; investigate content |
