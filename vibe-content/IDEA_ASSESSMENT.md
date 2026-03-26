# ĐÁNH GIÁ TÍNH KHẢ THI & RÕ RÀNG HÓA Ý TƯỞNG
**Hệ Sinh Thái Forum Tự Động Sinh Content qua LLM**

---

## 📋 TÓM LƯỢC NHANH

### Mục Tiêu Dự Án
Xây dựng một **hệ thống tự động mô phỏng hành vi người dùng** để sinh content forum (bài viết, bình luận, vote) bằng cách:
- Kích hoạt định kỳ qua **HTTP triggers/scheduler**
- Sử dụng **LLM (OpenAI, Anthropic, Gemini, etc.)** để sinh content
- Thực thi qua **backend API** giống người thật
- **Fallback linh động** giữa nhiều LLM provider khi API key hết quota

### Nhu Cầu Giải Quyết
- **API-based services** trên free tier thường bị sleep → cần keep-alive thường xuyên
- Thay vì chỉ *ping* đơn giản → thực hiện các *action phức tạp* (post, comment, vote)
- Tập hợp content sample để phát triển & test tính năng forum

---

## 🎯 QUYẾT ĐỊNH KHẢ THI (Tóm Lược)

| Khía Cạnh | Đánh Giá | Mô Tả |
|-----------|---------|-------|
| **Kiến trúc kỹ thuật** | ✅ **CÓ KHẢ THI** | Đơn giản, rõ ràng, không cần công nghệ mới |
| **Công nghệ LLM** | ✅ **CÓ KHẢ THI** | LLM APIs đã mature, có fallback options nhiều |
| **Content quality** | ⚠️ **CẦN KIỂM SOÁT** | Cần validation & consistency layer, khó đạt 100% perfect |
| **Cost/Budget** | ⚠️ **CẦN QUẢN LÝ** | Free tier có giới hạn, cần rate limiting thông minh |
| **Độ phức tạp thực thi** | ✅ **VỪA PHẢI** | MVP có thể hoàn thành 2-3 tuần, scale dần sau |
| **Rủi ro & giải pháp** | ✅ **ĐÃ XÁC ĐỊNH** | Các rủi ro chính đã có giải pháp rõ ràng |

### **Kết Luận: ✅ Ý tưởng CÓ KHẢ THI** 
*Với điều kiện: MVP approach, multi-provider fallback, validation layer, monitoring system.*

---

## 📊 QUYẾT ĐỊNH CHI TIẾT

### ✅ ĐIỂM MẠNH (Tại Sao CÓ KHẢ THI)

#### 1. **Nền Tảng Công Nghệ Chắc Chắn**
- LLM APIs (OpenAI, Anthropic, Google Gemini) đã ổn định, có rate limit rõ ràng
- Có fallback options nhiều → không bị lock-in một provider
- Existing backend (Express, TypeScript, Prisma) phù hợp để extend

#### 2. **Kiến Trúc Đơn Giản Nhưng Mạnh**
```
Định kỳ (Cron Job) → Chọn Action → Thu Context → Build Prompt → LLM → Validate → Save & API Call
```
- Mỗi bước độc lập và có thể test riêng
- Không cần distributed systems phức tạp

#### 3. **Forum Structure Sẵn Có**
- Categories, Tags, Rules đã định nghĩa rõ ràng
- Dễ dàng điều chỉnh prompt dựa trên category

#### 4. **MVP Khả Thi Nhanh**
- Có thể bắt đầu với 1 action type duy nhất (POST)
- Validate concept viability trong 2-3 tuần
- Scale dần sang Comment → Vote → Reply

---

### ⚠️ THÁCH THỨC & GIẢI PHÁP (Tại Sao Cần Cẩn Thận)

#### **1. Content Quality & Consistency** (Rủi Ro: CAO)

**Vấn Đề:**
- LLM không đảm bảo output coherent 100% mỗi lần
- Có thể sinh content mâu thuẫn (post nói "yêu X" nhưng comment nói "ghét X")
- Tag có thể không phù hợp, tone không consistent với bio user
- Duplicate content, cách diễn đạt lặp lại

**Giải Pháp:**
```
1. Content Validation Layer
   - Length check (50-500 ký tự phù hợp)
   - Format check (valid JSON, tags tồn tại)
   - Language check (phát hiện spam/encode)
   - Toxicity filter (nếu có API)

2. Consistency Check
   - LLM-based: Gọi LLM kiểm tra "content này có coherent với bio/previous posts không?"
   - Rule-based: Regex patterns để detect contradictions
   - Semantic: Embedding similarity nếu budget cho phép

3. Content Coherence Store
   - Lưu riêng "personality vector" của mỗi user (extracted từ bio + past content)
   - Include vector vào mỗi prompt để nhắc nhở LLM
```

**Impact:** Cần +1-2 tuần development, nhưng giảm risk content bị "lạ" từ 70% → 15%

---

#### **2. API Key Management** (Rủi Ro: CAO)

**Vấn Đề:**
- Free tier LLM APIs có rate limit chặt (OpenAI: 3 requests/min, Anthropic: 50k tokens/day)
- Chi phí tăng nhanh nếu frequency cao
- Risk: Key expose, abuse, quota hết bất ngờ

**Giải Pháp:**
```
1. Multi-Provider Fallback (Bắt Buộc)
   Provider Priority: OpenAI → Anthropic → Gemini → Ollama (local)
   
   Flow:
   ├─ Try OpenAI
   │  ├─ Success → Use & track cost
   │  └─ Fail (rate limit/auth error) → Next
   ├─ Try Anthropic
   │  └─ Fail → Next
   ├─ Try Gemini
   │  └─ Fail → Next
   └─ Fallback: Template-based content (safe net)

2. Smart Rate Limiting
   - Per-provider quota tracking (refresh daily)
   - Per-user rate limit (max 5 posts/day, 10 comments/day)
   - Queue system: Nếu quota hết → queue for next cycle

3. Cost Tracking
   - Log mỗi LLM call với chi phí
   - Alert nếu vượt ngân sách
   - Auto-scale down frequency nếu cần

4. Key Rotation
   - Support multiple keys per provider
   - Rotate khi quota hết
```

**Impact:** +2-3 tuần setup, nhưng tránh production crisis

---

#### **3. User Profile Consistency** (Rủi Ro: TRUNG BÌNH)

**Vấn Đề:**
- Mỗi user có bio/profile nhưng LLM không đảm bảo tuân theo
- Sau N actions, user có thể "out of character"
- Khó debug: "Why did bot user suddenly post political content khi bio nói '안전한 tech discussions'"?

**Giải Pháp:**
```
1. User Personality Vector
   - Trích xuất từ bio + past 5 posts/comments
   - Format: { traits: ["helpful", "beginner", "curious"], tone: "polite", topics: ["react", "ts"] }
   - Update sau mỗi 5 actions

2. Prompt Injection
   Include vào prompt:
   "Bạn là {USERNAME}, đặc điểm: {TRAITS}, tone: {TONE}, quan tâm: {TOPICS}"
   "Các bài viết gần đây của bạn: [snippets]"

3. Post-Generation Alignment
   - Sau LLM output, check: "Bài này consistent với user profile?"
   - Reject nếu score < threshold
```

**Impact:** +1 tuần, reduce "out of character" từ 40% → 10%

---

#### **4. Database Consistency & Race Conditions** (Rủi Ro: TRUNG BÌNH)

**Vấn Đề:**
- Concurrent posts từ multiple bot users → FK constraint violation
- Asset (posts, tags, users) có thể bị xóa giữa validation → insert failure
- Idempotency: Nếu API call success nhưng không get response → có thể insert 2 lần

**Giải Pháp:**
```
1. Transaction-Based
   BEGIN TRANSACTION
   ├─ Lock user row (SELECT FOR UPDATE)
   ├─ Verify: tags exist, target post exists, user not banned
   ├─ Insert content
   ├─ Update user stats (post_count, etc)
   └─ COMMIT (or ROLLBACK nếu fail)

2. Pre-Validation
   - Validate tất cả foreign keys trước khi call LLM
   - Reduce risk của stale data

3. Idempotency Key
   - Generate UUID per action
   - DB unique constraint: (user_id, action_id) → prevent duplicates
```

**Impact:** +3-5 days, nhưng eliminate race condition bugs

---

#### **5. Prompt Engineering Quality** (Rủi Ro: TRUNG BÌNH)

**Vấn Đề:**
- Prompt cần đủ detail để LLM hiểu nhưng không quá dài (token cost ↑)
- Hard to control output format → parsing errors
- Iterating prompts mất thời gian

**Giải Pháp:**
```
1. Structured Output (JSON Schema)
   Prompt:
   "Output STRICTLY as JSON: { \"content\": \"...\", \"tags\": [...], \"explain\": \"...\" }"
   
   Parser:
   - Try JSON parse
   - If fail → reject & retry with simpler model

2. Few-Shot Examples
   Include 2-3 good examples trong prompt:
   "Example 1: Input bio='React developer', Output={'content': '...'}"
   
   → Dramatically improve LLM consistency

3. Iterative Refinement
   - Phase 1: Basic prompt (generic)
   - Phase 2: A/B test 2-3 variations, pick best
   - Phase 3: Category-specific prompts (different for "Advice" vs "Story")
```

**Impact:** +1-2 weeks, increase output quality từ 60% → 85%

---

#### **6. Monitoring & Observability** (Rủi Ro: THẤP → TRUNG BÌNH)

**Vấn Đề:**
- Khó debug khi content bị "lạ" hoặc action fail
- Không biết: rejected bao nhiêu content? Fail ở stage nào?
- No alerting → discover issue sau vài ngày

**Giải Pháp:**
```
1. Structured Logging
   Mỗi action log chi tiết:
   {
     "timestamp": "2024-03-26T10:30:00Z",
     "action_id": "uuid-123",
     "user_id": 42,
     "action_type": "post",
     "stage": "validation",
     "status": "rejected",
     "reason": "toxicity_score=0.89 > threshold=0.7",
     "llm_provider": "openai",
     "cost_tokens": 450,
     "latency_ms": 2350
   }

2. Metrics
   - success_rate (% of actions → API call success)
   - validation_reject_rate (% rejected at validation)
   - avg_latency per stage
   - cost/action
   - api_errors per provider

3. Alerts
   - success_rate < 70% → PagerDuty alert
   - cost/day > budget → Slack notification
   - validation_reject > 50% → Debug prompt
```

**Impact:** +1 week setup, MASSIVE time save during troubleshooting

---

## 🏗️ KIẾN TRÚC CHI TIẾT

### Luồng Hoạt Động Chính

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TRIGGER                                                  │
│    - Cron job: Mỗi 5-15 phút                               │
│    - Payload: { action_type?, priority?, batch_size? }     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. ACTION SELECTION                                         │
│    - Random: user (active, not banned)                     │
│    - Random: action type (post 50%, comment 30%, vote 20%) │
│    - Verify: target exists, no self-action                │
│    - Output: { user_id, action_type, target_id }          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. CONTEXT GATHERING                                       │
│    - User: bio, personality_vector, last 3 posts/comments │
│    - Category: description, purpose, tone, rules           │
│    - Target: title, content (for comment/vote context)    │
│    - Recent: trending posts (for relevance)               │
│    - Tags: existing tags in DB                            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. PROMPT CONSTRUCTION                                      │
│                                                             │
│    Template:                                                │
│    ────────────────────────────────────────────────────    │
│    "Bạn là {USERNAME}                                      │
│     Bio: {BIO}                                             │
│     Tính cách: {TRAITS}                                    │
│                                                             │
│     Gần đây bạn viết: [snippets 3 posts]                  │
│                                                             │
│     TASK: Đăng 1 {ACTION_TYPE} cho category '{CAT_NAME}'  │
│     Mục đích: {CAT_PURPOSE}                               │
│     Tone: {CAT_TONE}                                       │
│     Ví dụ: {CAT_EXAMPLES}                                 │
│                                                             │
│     [If comment/vote context]:                             │
│     Bài viết: {POST_TITLE}. {POST_CONTENT}                │
│                                                             │
│     Yêu cầu:                                               │
│     - 50-500 ký tự                                         │
│     - Tone: {TONE}                                         │
│     - Tags (post only): {TAG_POOL}                         │
│     - Coherent với bio & past posts                        │
│     - Không spam, không toxic, không lặp lại (verbatim)   │
│                                                             │
│     Output: JSON { content, tags?, explain }              │
│    ────────────────────────────────────────────────────    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 5. LLM CALL (Multi-Provider Fallback)                       │
│                                                             │
│    Try in order:                                            │
│    ├─ OpenAI (gpt-3.5-turbo) → timeout 30s                │
│    │  └─ If fail (rate limit, auth, etc) → Log & Next    │
│    ├─ Anthropic (claude-3-haiku) → timeout 30s            │
│    │  └─ If fail → Log & Next                             │
│    ├─ Gemini (gemini-1.5-flash) → timeout 30s             │
│    │  └─ If fail → Log & Next                             │
│    └─ Fallback: Template-based (if all fail)              │
│       └─ Safe net: Generic content từ templates           │
│                                                             │
│    Retry logic (exponential backoff):                       │
│    1st: 1s, 2nd: 2s, 3rd: 4s, 4th: 8s, 5th: 16s → give up│
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 6. VALIDATION & CONSISTENCY CHECK                           │
│                                                             │
│    A. Format Validation:                                    │
│       ✓ JSON valid?                                        │
│       ✓ Required fields present?                           │
│       ✓ Type correct? (string, array)                      │
│                                                             │
│    B. Content Validation:                                  │
│       ✓ Length: 50-500 ký tự?                            │
│       ✓ Language: Tiếng Việt (not random unicode)?        │
│       ✓ Tags: All exist in DB?                            │
│       ✓ Toxicity score < threshold?                        │
│                                                             │
│    C. Consistency Check:                                   │
│       ✓ Coherent với user bio/past posts?                 │
│       ✓ Tone phù hợp category?                            │
│       ✓ If reply/comment: logic hợp lý? (not contradicts) │
│       Implement: LLM-check hoặc semantic similarity        │
│                                                             │
│    D. Logic Check:                                         │
│       ✓ Không self-vote, không vote 2 lần                 │
│       ✓ Comment target still exists?                       │
│                                                             │
│    On Fail:                                                │
│    - Log reason & content                                  │
│    - Increment rejection counter                           │
│    - If rejection_rate > threshold → alert                 │
│    - Skip this action (don't save/post)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 7. DATABASE TRANSACTION + API CALL                          │
│                                                             │
│    Transaction:                                            │
│    BEGIN TRANSACTION                                        │
│    ├─ Lock user row (SELECT FOR UPDATE)                   │
│    ├─ Verify FK: user exists, target exists              │
│    ├─ Insert post/comment/vote into DB                    │
│    ├─ Update user stats (post_count, vote_count, etc)     │
│    └─ COMMIT (or ROLLBACK)                                │
│                                                             │
│    API Call (after DB success):                            │
│    ├─ POST /api/posts { content, tags, category_id }     │
│    ├─ POST /api/comments { content, post_id }            │
│    ├─ POST /api/votes { target_type, target_id, direction }
│    └─ Handle response:                                     │
│       ├─ 2xx → Success ✓                                  │
│       ├─ 4xx → Log as bug (validation error)              │
│       ├─ 429 → Retry with backoff                         │
│       └─ 5xx → Queue for retry                            │
│                                                             │
│    Log Final Result:                                       │
│    { action_id, status, provider, cost, latency, etc }   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────┐
│                  SCHEDULER (Cron Job)                       │
│         Mỗi 5-15 phút → Trigger Content Generation         │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ↓                         ↓
  ┌──────────────┐         ┌──────────────┐
  │ Job Queue    │         │ Config DB    │
  │ (scheduled   │         │ (frequency, │
  │  tasks)      │         │  enabled)    │
  └──────────────┘         └──────────────┘
        │
        ↓
┌─────────────────────────────────────────────────────────────┐
│        CONTENT GENERATION ENGINE (Node.js Service)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Action Selection                                        │
│  ├─ Query: active users, available posts/comments         │
│  └─ Random selection with weighted distribution            │
│                                                             │
│  2. Context Gathering Service                              │
│  ├─ Fetch from DB: user, category, tags, recent posts    │
│  └─ Enrich: personality_vector, tone guidelines           │
│                                                             │
│  3. Prompt Template System                                 │
│  ├─ Dynamic template filling                              │
│  └─ Few-shot examples for better output                   │
│                                                             │
│  4. LLM Provider Manager                                   │
│  ├─ OpenAI client                                         │
│  ├─ Anthropic client                                      │
│  ├─ Gemini client                                         │
│  ├─ Ollama client (local)                                 │
│  └─ Fallback: template-based generator                    │
│                                                             │
│  5. Validation Pipeline                                    │
│  ├─ Format validator (JSON, types)                        │
│  ├─ Content validator (length, language, toxicity)       │
│  ├─ Consistency checker (coherence with bio/category)    │
│  └─ Logic validator (no contradictions)                   │
│                                                             │
│  6. Database Transaction Handler                           │
│  ├─ Prepare transaction                                   │
│  ├─ Lock & verify FK                                      │
│  └─ Insert & commit                                       │
│                                                             │
│  7. API Executor                                           │
│  ├─ Call backend /api/posts, /api/comments, /api/votes   │
│  └─ Handle responses & retries                            │
│                                                             │
│  8. Logging & Metrics                                      │
│  ├─ Winston/Pino structured logs                          │
│  ├─ Prometheus metrics                                    │
│  └─ Sentry error tracking                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┬──────────────┐
        ↓                     ↓              ↓              ↓
   ┌─────────┐         ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ OpenAI  │         │Anthropic │   │ Gemini   │   │ Ollama   │
   │  API    │         │   API    │   │   API    │   │(offline) │
   └─────────┘         └──────────┘   └──────────┘   └──────────┘

        │
        └───────────────────────────┬──────────────────────────┐
                                    │                          │
                            ┌───────▼────────┐      ┌──────────▼─────┐
                            │  Backend Forum │      │  PostgreSQL DB │
                            │     API        │      │  (Prisma ORM)  │
                            ├────────────────┤      ├────────────────┤
                            │ /api/posts     │      │ users          │
                            │ /api/comments  │      │ posts          │
                            │ /api/votes     │      │ comments       │
                            │ /api/tags      │      │ votes          │
                            │ /api/categories│      │ tags           │
                            └────────────────┘      │ categories     │
                                                    │ user_context   │
                                                    └────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            MONITORING & ALERTING                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Logs: Structured logging → ELK / CloudWatch               │
│  Metrics: Prometheus → Grafana dashboards                  │
│  Errors: Sentry → Error tracking & alerts                 │
│  Alerts: Slack / PagerDuty on anomalies                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛣️ ROADMAP TRIỂN KHAI

### **Phase 1: MVP (v0.1) — 2-3 tuần**
**Scope:** POST creation only, single LLM, basic validation
```
Deliverables:
  ✓ Single action: POST (no comments/votes yet)
  ✓ Single LLM: OpenAI (no fallback)
  ✓ Scheduler: Cron job (every 30 mins)
  ✓ Validation: Format + length checks
  ✓ Logging: Basic console/file logs
  ✓ Manual trigger endpoint (easy testing)

Timeline: 10-15 working days
Effort: 1 engineer, 80% capacity
```

### **Phase 2: Expansion (v0.2) — 2-3 tuần**
**Scope:** Comment + Vote, multi-provider fallback
```
Deliverables:
  ✓ All action types: POST + COMMENT + REPLY + VOTE
  ✓ Multi-provider fallback (OpenAI → Anthropic → Gemini)
  ✓ Rate limiting per user & provider
  ✓ Consistency check layer
  ✓ Cost tracking & budget alerts
  ✓ Better logging (Winston)

Timeline: 10-15 working days
Effort: 1 engineer, 80% capacity
```

### **Phase 3: Robustness (v0.3) — 3-4 tuần**
**Scope:** Monitoring, error recovery, content coherence
```
Deliverables:
  ✓ Comprehensive metrics (Prometheus)
  ✓ Error recovery queue (Bull/BullMQ)
  ✓ User personality modeling
  ✓ Semantic consistency check (embedding?)
  ✓ Admin dashboard (view & manage tasks)
  ✓ Analytics (content stats, quality metrics)

Timeline: 15-20 working days
Effort: 1-2 engineers, 60% capacity
```

### **Phase 4: Production (v1.0) — Ongoing**
**Scope:** Polish, scaling, advanced features
```
Deliverables:
  ✓ Config management (UI or CLI)
  ✓ Load testing & optimization
  ✓ Comprehensive documentation
  ✓ Team training & runbooks
  ✓ Integration with monitoring alerts
  ✓ Cost optimization strategies

Timeline: 2-4 tuần + ongoing
Effort: 1 engineer, 30% capacity (maintenance)
```

---

## 📋 DANH SÁCH RỦI RO & GIẢI PHÁP

| # | Rủi Ro | Mức Độ | Giải Pháp | Effort |
|----|--------|--------|----------|--------|
| 1 | Content kém chất lượng | **CAO** | Validation layer + consistency check | 1 week |
| 2 | API key hết quota | **CAO** | Multi-provider fallback + queue | 1.5 weeks |
| 3 | Content mâu thuẫn nội bộ | **CAO** | Content coherence DB + semantic check | 1 week |
| 4 | DB race condition | **TRUNG** | Transaction-based, row locking | 3 days |
| 5 | LLM cost vượt budget | **TRUNG** | Cost tracking + rate limiting | 3 days |
| 6 | Toxic/spam content | **TRUNG** | Toxicity filter + moderation rules | 3 days |
| 7 | User out of character | **TRUNG** | Personality vector + prompt injection | 4 days |
| 8 | Monitoring blind spots | **THẤP** | Structured logging + metrics gateway | 1 week |
| 9 | Output format unparseable | **TRUNG** | JSON schema validation + retry | 3 days |
| 10 | Duplicate duplicate posts | **THẤP** | Idempotency key + DB unique constraint | 2 days |

---

## ✅ ĐIỀU KIỆN THÀNH CÔNG

### Để Ý Tưởng **CÓ KHẢ THI THỰC TẾ:**

✅ **Accept MVP approach** — Không mong Phase 1 là production-ready
✅ **Multi-provider từ đầu** — Không lock-in 1 LLM provider
✅ **Validation layer** — Not just "generate & post blindly"
✅ **Monitoring setup** — Để detect & debug issues nhanh
✅ **Incremental refinement** — Iterate based on real data
✅ **Team alignment** — Clear ownership, acceptance criteria

### Nếu **MỌI THỨ FAIL** (avoid these):

❌ **Mong 100% content quality ngay day 1** → Không realistic
❌ **Single LLM provider, no fallback** → Risk catastrophic
❌ **Zero validation/consistency checks** → Garbage in → garbage out
❌ **No monitoring** → Blind to issues until user complains
❌ **"Ship it" mentality** → Technical debt piles up fast

---

## 🎯 NEXT STEPS (Immediate Actions)

### 1. **Xác Thực Quyết Định**
- [ ] Team agree: MVP approach OK?
- [ ] Budget: Max cost/month for LLM?
- [ ] Timeline: 2-3 tuần cho Phase 1 acceptable?
- [ ] Quality target: Accept 70-80% content success rate for v0.1?

### 2. **Setup Infrastructure**
- [ ] Create `/services/contentGenerator` folder structure
- [ ] Setup LLM client configs (OpenAI, Anthropic, Gemini keys)
- [ ] Initialize job queue (Bull/BullMQ setup)
- [ ] Create Prisma migration for `user_content_context` table

### 3. **Implement Phase 1 MVP**
- [ ] Build `PromptService` (template filling)
- [ ] Build `LLMService` (OpenAI client + error handling)
- [ ] Build `ValidationService` (basic checks)
- [ ] Build `SchedulerService` (Cron trigger)
- [ ] Integrate with existing backend API
- [ ] Manual trigger endpoint for testing

### 4. **Test & Iterate**
- [ ] Manual testing: trigger action 10-20 times
- [ ] Analyze results: success rate, quality, cost
- [ ] Adjust prompt based on failures
- [ ] Document learnings & adjust Phase 2 scope

### 5. **Prepare Phase 2**
- [ ] Plan multi-provider fallback architecture
- [ ] Design consistency check logic
- [ ] Research embedding models for semantic check
- [ ] Estimate effort & timeline for Phase 2

---

## 📝 KẾT LUẬN

### **TL;DR (Very Short Summary)**

| Khía Cạnh | Kết Luận |
|-----------|----------|
| **Tính khả thi** | ✅ **CÓ**, nhưng cần incremental approach |
| **Độ phức tạp** | **TRUNG BÌNH** — Mỗi phần logic nhabsimple, complexity là integrate tất cả |
| **Timeline** | **2-3 tuần MVP** + 6-8 tuần cho v1.0 |
| **Budget** | **$50-200/tháng** nếu dùng free tier thông minh + fallback |
| **Rủi ro** | **Quản lý được** nếu setup monitoring & validation từ đầu |
| **Khuyến nghị** | **START NOW** với Phase 1 MVP, học từ data, scale sang Phase 2 |

### **Ý Tưởng Này ĐÁNG THỰC HIỆN Vì:**
1. ✅ Giải quyết problem thực tế (keep-alive + demo content)
2. ✅ Tech stack mature & stable
3. ✅ MVP có thể ship trong 2-3 tuần
4. ✅ Có clear escalation path (Phase 2, 3, 4)
5. ✅ Learnings từ Phase 1 sẽ guide Phase 2-4 efficiently
6. ✅ ROI cao: Little demo data effort → big value (forum feels alive)

---

*Document này là living artifact — update khi có decision/learnings mới.*
*Last updated: 2024-03-26*
