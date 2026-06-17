# Phân Tích Services Vibe-Content & Endpoint Kiểm Tra LLM

## 📋 Tổng Quan Kiến Trúc Vibe-Content

Vibe-Content là một dịch vụ tạo nội dung tự động cho forum, sử dụng multiple LLM providers với fallback mechanism. Kiến trúc được chia thành các layers sau:

### 1. Core Services

#### **ContentGeneratorService** (`src/services/ContentGeneratorService.ts`)
- **Chức năng**: Orchestrator chính điều phối toàn bộ quy trình tạo nội dung
- **Responsibilities**:
  - Chọn action (post, comment, vote) dựa trên rate limiting
  - Gather context từ forum API
  - Build prompts cho LLM
  - Call LLM providers với fallback stack
  - Validate output từ LLM
  - Post content lên forum
  - Track thống kê và metrics

#### **LLMProviderManager** (`src/services/llm/LLMProviderManager.ts`)
- **Chức năng**: Quản lý tất cả LLM providers
- **Key Features**:
  - Build provider queue theo task type (post/comment/vote)
  - Circuit breaker pattern để phòng chống cascading failures
  - Cooldown mechanism (2 hours) sau rate limit
  - Retry logic (3 times) với exponential backoff
  - Track provider status: available, cooldown, circuit open, missing API key
  - Async health check cho mỗi provider

#### **StatusService** (`src/services/StatusService.ts`)
- **Chức năng**: Cung cấp comprehensive status payload
- **Output**:
  - Uptime
  - Provider health details (available/unavailable count)
  - Provider stack information
  - Recent actions
  - Queue statistics
  - Metrics ngày hôm nay

#### **LLMHealthCheckService** (`src/services/LLMHealthCheckService.ts`) [NEW]
- **Chức năng**: Chuyên biệt kiểm tra availability của tất cả LLM providers
- **Features**:
  - Comprehensive health check cho tất cả providers
  - Circuit breaker state tracking
  - Cooldown window monitoring
  - Overall health status (healthy/degraded/unhealthy)
  - Availability rate calculation
  - Provider grouping by status

### 2. LLM Providers

Hỗ trợ 5 loại providers với 10 model variants:

| Provider | Model ID | Supported Models | Status |
|----------|----------|------------------|--------|
| **Beeknoee** | `beeknoee-qwen3-235b` | qwen-3-235b-a22b-instruct-2507 | 1 |
| | `beeknoee-gpt-oss-120b` | openai/gpt-oss-120b | 3 |
| | `beeknoee-glm-4.7-flash` | glm-4.7-flash | 4 |
| | `beeknoee-llama-3.1-8b` | llama3.1-8b | 9 |
| **Gemini** | `gemini-flash` | gemini-2.5-flash | 2 |
| **Groq** | `groq-70b` | llama-3.3-70b-versatile | 8 |
| | `groq-8b` | llama-3.1-8b-instant | 10 |
| **Cerebras** | `cerebras-llama` | llama-3.1-8b | 6 |
| | `cerebras-qwen` | qwen-3-235b-a22b | 7 |
| **Nvidia** | `nvidia-llama-70b` | meta/llama-3.3-70b-instruct | 5 |

**Provider Queues:**
- POST: tất cả 10 providers
- COMMENT: groq-70b → cerebras-qwen → cerebras-llama → nvidia-llama-70b
- VOTE: reverse của POST queue

### 3. Task Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Action Selection                                         │
│    - Select user + action type respecting rate limits       │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Context Gathering (ContextGathererService)              │
│    - Fetch category, tags, recent posts                    │
│    - Get bot user details                                  │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Prompt Building (PromptBuilderService)                  │
│    - Build contextual prompt cho LLM                       │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. LLM Generation (LLMProviderManager)                     │
│    - Iterate through provider queue                        │
│    - Check availability, cooldown, circuit breaker         │
│    - Call generate() với retry logic                       │
│    - Record metrics                                        │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Validation (ValidationService)                          │
│    - Validate JSON structure                               │
│    - Quality scoring (relevance, length, etc.)             │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Forum API Call (APIExecutorService)                     │
│    - Post content to forum                                 │
│    - Handle response                                       │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Tracking & Metrics                                      │
│    - Record success/failure                                │
│    - Update personality service                            │
│    - Retry failed actions                                  │
└─────────────────────────────────────────────────────────────┘
```

### 4. Failure Handling

- **Circuit Breaker**: Mở (OPEN) khi failure threshold được vượt quá (5 failures trong 60s window)
- **Cooldown**: 2 hours sau rate limit
- **Retry**: 3 attempts với exponential backoff (1s, 2s, 4s)
- **Fallback**: Tự động chuyển sang provider kế tiếp trong queue
- **Retry Queue**: Failed actions được retry lần sau (max 3 retries)

---

## 🚀 Endpoints Kiểm Tra LLM Availability

### 1. **GET `/llm-health`** - Comprehensive Health Check
Returns detailed health status của tất cả LLM providers.

**Response (HTTP 200 - Healthy):**
```json
{
  "timestamp": "2026-06-17T10:30:45.123Z",
  "totalProviders": 10,
  "availableCount": 10,
  "unavailableCount": 0,
  "providers": [
    {
      "id": "beeknoee-qwen3-235b",
      "available": true,
      "reason": null,
      "message": null,
      "checkedAt": "2026-06-17T10:30:45.123Z",
      "cooldownUntil": null,
      "circuitState": "CLOSED",
      "failureCount": 0,
      "openSince": null
    },
    ...
  ],
  "summary": {
    "overall": "healthy",
    "availabilityRate": 100,
    "message": "All 10 LLM providers are available"
  }
}
```

**Response (HTTP 206 - Degraded):**
```json
{
  "summary": {
    "overall": "degraded",
    "availabilityRate": 60,
    "message": "6/10 LLM providers available (4 unavailable)"
  }
}
```

**Response (HTTP 503 - Unhealthy):**
```json
{
  "summary": {
    "overall": "unhealthy",
    "availabilityRate": 0,
    "message": "All LLM providers are currently unavailable"
  }
}
```

### 2. **GET `/llm-health/quick`** - Quick Status
Minimal response chỉ gồm summary (dùng cho monitoring/heartbeat).

```json
{
  "status": "healthy",
  "available": 10,
  "total": 10,
  "message": "All 10 LLM providers are available"
}
```

**HTTP Status Codes:**
- `200`: healthy
- `206`: degraded
- `503`: unhealthy

### 3. **GET `/llm-health/by-status`** - Grouped by Status
Nhóm providers theo trạng thái của chúng.

```json
{
  "timestamp": "2026-06-17T10:30:45.123Z",
  "available": [
    "beeknoee-qwen3-235b",
    "gemini-flash",
    "beeknoee-gpt-oss-120b"
  ],
  "unavailable": [
    "groq-70b"
  ],
  "cooldown": [
    "cerebras-qwen"
  ],
  "circuitOpen": []
}
```

### 4. **GET `/llm-health/:providerId`** - Provider Detail
Check status của specific provider.

```json
{
  "id": "gemini-flash",
  "available": true,
  "reason": null,
  "message": null,
  "checkedAt": "2026-06-17T10:30:45.123Z",
  "cooldownUntil": null,
  "circuitState": "CLOSED",
  "failureCount": 0,
  "openSince": null
}
```

**HTTP Status:**
- `200`: Provider available
- `404`: Provider not found
- `503`: Provider unavailable

---

## 📊 Provider Status Reasons

| Reason | Description |
|--------|-------------|
| `available` | Provider available & ready |
| `missing_api_key` | API key not configured |
| `cooldown` | Rate limited, cooling down (2h) |
| `auth_error` | Authentication failed |
| `rate_limited` | Hit rate limit |
| `timeout` | Request timeout |
| `unavailable` | Service unavailable |

---

## 🔄 Provider State Transitions

```
AVAILABLE
    ↓
  [Use Provider]
    ├─ Success → Record Success (Clear Unavailable)
    └─ Failure → Set Unavailable Reason
                    ├─ RATE_LIMIT → Set Cooldown (2h)
                    ├─ TIMEOUT → Transient (10m TTL)
                    └─ Other Error → Mark Unavailable
```

---

## 📈 Circuit Breaker States

```
CLOSED (Normal)
    ↓
  [5 failures in 60s window]
    ↓
OPEN (Reject requests)
    ├─ Duration: 2 minutes
    └─ After timeout: HALF_OPEN
    
HALF_OPEN (Test recovery)
    ├─ Success → CLOSED
    └─ Failure → OPEN (restart timer)
```

---

## 🛠️ Configuration Keys

Location: `src/config/llm.ts`

```typescript
export const LLM_STACK: LLMStackEntry[] = [
  // 10 providers configured here
];

export const POST_PROVIDER_QUEUE = LLM_STACK.map((entry) => entry.id);
export const COMMENT_PROVIDER_QUEUE = [...]; // Custom queue
export const VOTE_LLM_PROVIDER_QUEUE = [...PROVIDER_QUEUE].reverse();
export const MODEL_LABEL_MAP: Record<number, string> = {
  1: 'beeknoee-qwen3-235b',
  2: 'gemini-flash',
  // ... labels 1-10 mapping to providers
};
```

---

## 📝 Usage Examples

### Monitor all providers
```bash
curl http://localhost:3001/llm-health
```

### Quick health check (for load balancer)
```bash
curl http://localhost:3001/llm-health/quick
```

### Get providers grouped by status
```bash
curl http://localhost:3001/llm-health/by-status
```

### Check specific provider
```bash
curl http://localhost:3001/llm-health/gemini-flash
```

### Integration with monitoring
```javascript
// Every 30 seconds
setInterval(async () => {
  const response = await fetch('http://localhost:3001/llm-health/quick');
  const data = await response.json();
  
  if (data.status === 'unhealthy') {
    alert('All LLM providers are down!');
  } else if (data.status === 'degraded') {
    console.warn(`Only ${data.available}/${data.total} LLM providers available`);
  }
}, 30000);
```

---

## 📦 Implementation Details

### New Files Created
- `src/services/LLMHealthCheckService.ts` - Health check service

### Modified Files
- `src/services/ContentGeneratorService.ts` - Added `getLLMManager()` method
- `src/index.ts` - Added 4 new endpoints for LLM health checking

### Metrics Tracked
- Total providers
- Available/unavailable count
- Availability rate (%)
- Circuit breaker state per provider
- Cooldown windows
- Transient failure TTL (10 minutes)

---

## 🎯 Best Practices

1. **Regular Monitoring**
   - Use `/llm-health/quick` for frequent checks (30s intervals)
   - Use `/llm-health` for detailed diagnostics

2. **Alert Triggers**
   - `overall === 'unhealthy'` → critical alert
   - `overall === 'degraded' && availabilityRate < 30%` → warning

3. **Provider Selection**
   - System automatically uses fallback queue
   - Manual provider selection via label: `GET /trigger/post/:label`

4. **Debugging**
   - Check `/llm-health/by-status` to see which providers are in cooldown
   - Check `/llm-health/:providerId` for specific provider issues
   - Check `/metrics` for LLM call statistics

---

## 📊 Related Existing Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic server health (uptime) |
| `GET /status` | Comprehensive system status |
| `GET /metrics` | LLM call statistics & timing |
| `GET /llm-health` | **[NEW]** Detailed LLM provider health |
| `GET /llm-health/quick` | **[NEW]** Quick LLM status |
| `GET /llm-health/by-status` | **[NEW]** Grouped provider status |
| `GET /llm-health/:providerId` | **[NEW]** Specific provider health |

---

**Ngày tạo:** 2026-06-17  
**Phiên bản:** 1.0  
**Status:** Production Ready
