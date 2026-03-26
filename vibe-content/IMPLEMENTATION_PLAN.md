# KẾ HOẠCH TRIỂN KHAI: Vibe Content Generation System
**Mini Forum — Hệ Sinh Thái Content Tự Động Qua LLM**

---

## 📊 PHÂN TÍCH DỰ ÁN HIỆN TẠI

### Những gì đã có (Do NOT rebuild)

| Module | Trạng Thái | Ghi Chú |
|--------|-----------|---------|
| **Backend API** | ✅ Hoàn chỉnh | Express + TypeScript + Prisma |
| **Auth System** | ✅ Hoàn chỉnh | JWT, OTP, Refresh Token, Email verify |
| **Posts CRUD** | ✅ Hoàn chỉnh | `/api/posts` — create, read, update, delete |
| **Comments CRUD** | ✅ Hoàn chỉnh | `/api/comments` — kể cả nested/reply |
| **Votes API** | ✅ Hoàn chỉnh | `/api/votes` — post vote, comment vote |
| **Categories API** | ✅ Hoàn chỉnh | `/api/categories` |
| **Tags API** | ✅ Hoàn chỉnh | `/api/tags` |
| **User Profiles** | ✅ Hoàn chỉnh | bio, avatar, reputation |
| **Security** | ✅ Hoàn chỉnh | Helmet, CORS, Rate Limiting, Zod validation |
| **Admin Client** | ✅ Hoàn chỉnh | Dashboard, Users, Posts, Reports, Audit Logs |
| **Frontend** | ✅ Hoàn chỉnh | Tất cả pages người dùng |
| **Database Schema** | ✅ Hoàn chỉnh | users, posts, comments, votes, tags, categories... |

### Những gì CẦN XÂY DỰNG (vibe-content)

| Module | Trạng Thái | Độ Phức Tạp |
|--------|-----------|-------------|
| Bot users (seed data) | ❌ Chưa có | Thấp |
| Categories + Tags seed | ❌ Chưa có (chỉ có 1 admin user) | Thấp |
| `user_content_context` table | ❌ Chưa có trong schema | Thấp |
| LLM Service (multi-provider) | ❌ Chưa có | Cao |
| Prompt Template System | ❌ Chưa có | Trung bình |
| Action Selector | ❌ Chưa có | Trung bình |
| Context Gatherer | ❌ Chưa có | Trung bình |
| Validation Pipeline | ❌ Chưa có | Trung bình |
| Scheduler (Cron) | ❌ Chưa có | Thấp |
| HTTP Trigger Endpoint | ❌ Chưa có | Thấp |
| Cost/Rate Tracker | ❌ Chưa có | Trung bình |
| Logging System | ❌ Chưa có | Thấp |

---

## 🗂️ CẤU TRÚC THƯ MỤC ĐỀ XUẤT

```
vibe-content/
├── IMPLEMENTATION_PLAN.md      ← file này
├── IDEA_ASSESSMENT.md
├── id.txt
└── service/                    ← toàn bộ code vibe-content ở đây
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── src/
    │   ├── index.ts                    ← entry point, HTTP server + cron
    │   ├── config/
    │   │   ├── index.ts                ← load env vars
    │   │   └── llm.ts                  ← LLM provider config
    │   ├── services/
    │   │   ├── llm/
    │   │   │   ├── LLMProviderManager.ts   ← fallback logic
    │   │   │   ├── OpenAIProvider.ts
    │   │   │   ├── AnthropicProvider.ts
    │   │   │   ├── GeminiProvider.ts
    │   │   │   └── TemplateProvider.ts     ← fallback khi tất cả LLM fail
    │   │   ├── ActionSelectorService.ts    ← chọn action ngẫu nhiên
    │   │   ├── ContextGathererService.ts   ← thu thập context từ DB
    │   │   ├── PromptBuilderService.ts     ← xây dựng prompt
    │   │   ├── ValidationService.ts        ← validate LLM output
    │   │   ├── APIExecutorService.ts       ← gọi backend API
    │   │   └── ContentGeneratorService.ts  ← orchestrator chính
    │   ├── scheduler/
    │   │   └── cronScheduler.ts            ← thiết lập cron jobs
    │   ├── tracking/
    │   │   ├── CostTracker.ts             ← theo dõi chi phí LLM
    │   │   └── RateLimiter.ts             ← giới hạn calls per user/provider
    │   ├── types/
    │   │   └── index.ts                   ← shared TypeScript types
    │   └── utils/
    │       └── logger.ts                  ← structured logging
    ├── prompts/
    │   ├── post.template.txt              ← prompt template cho POST
    │   ├── comment.template.txt           ← prompt template cho COMMENT
    │   └── vote.template.txt              ← prompt template cho VOTE
    └── seed/
        ├── botUsers.ts                    ← tạo bot users với profile đa dạng
        ├── categories.ts                  ← seed categories từ content_nocoding/
        └── tags.ts                        ← seed tags ban đầu
```

**Lưu ý:** Vibe-content service chạy như một **standalone Node.js process** riêng biệt, 
giao tiếp với backend Forum qua REST API + trực tiếp với DB qua Prisma (để đọc context).

---

## 🚀 CÁC PHASES TRIỂN KHAI

---

### PHASE 0: Foundation (Tiên Quyết) — 3-5 ngày

**Mục tiêu:** Chuẩn bị nền tảng data & infrastructure. Không có phase này, tất cả các phase sau sẽ không có gì để test.

#### 0.1 — Seed Data: Bot Users
**File:** `vibe-content/service/seed/botUsers.ts`

Tạo **10-15 bot users** với profile đa dạng. Mỗi user cần:
- `username`, `display_name`, `bio` — tính cách riêng biệt
- `avatar_url` — dùng dicebear API (không cần upload)
- `role: MEMBER`, `is_verified: true`, `is_active: true`
- Password chuẩn để có thể login qua API

Ví dụ profile types cần có:
```
- "Người mới, hay hỏi, tone ngây thơ"
- "Dân tech thực dụng, nói thẳng"
- "Hay kể chuyện cuộc sống, emotional"
- "Người hay tranh luận, có chính kiến"
- "Im lặng nhưng câu nào ra câu đó"
```

**Deliverable:** Chạy `npm run seed:bots` → 10-15 users trong DB

#### 0.2 — Seed Data: Categories & Tags
**File:** `vibe-content/service/seed/categories.ts`, `seed/tags.ts`

Dựa theo `content_nocoding/categories.txt`:
```
Categories cần tạo:
- Thông báo & Hướng dẫn   (permission: ADMIN only post)
- Góp ý & Phản hồi         (permission: ALL)
- Chia sẻ & đúc kết        (permission: MEMBER)
- Kể chuyện                 (permission: MEMBER)
- Cần lời khuyên            (permission: MEMBER)
- Bàn luận & góc nhìn      (permission: MEMBER)
- Tán gẫu                   (permission: MEMBER)
```

Tags ban đầu (~30-50 tags): tâm lý, công việc, học tập, mối quan hệ, tiền bạc, sức khỏe, 
cuộc sống, cảm xúc, kỹ năng, công nghệ, gia đình, bạn bè, tình yêu, v.v.

**Deliverable:** `npm run seed:forum` → categories + tags trong DB

#### 0.3 — Prisma Migration: `user_content_context`
**File:** `backend/prisma/schema.prisma` (thêm model mới)

```prisma
model user_content_context {
  id              Int      @id @default(autoincrement())
  user_id         Int      @unique
  personality     Json     // { traits: [], tone: "", topics: [] }
  last_posts      Json     // array of last 5 post snippets
  last_comments   Json     // array of last 5 comment snippets
  action_count    Int      @default(0)
  updated_at      DateTime @updatedAt
  users           users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

Chạy: `cd backend && npx prisma migrate dev --name add_user_content_context`

#### 0.4 — Vibe-Content Service Scaffold
Khởi tạo project structure:
```bash
cd vibe-content/service
npm init
npm install typescript tsx dotenv node-cron axios winston
npm install -D @types/node @types/node-cron
```

Setup `tsconfig.json`, `.env.example`, entry point cơ bản.

**Deliverable:** `npm start` chạy được, log "Vibe Content Service started"

---

### PHASE 1: MVP — Single LLM, POST Only — 7-10 ngày

**Mục tiêu:** Có thể trigger tự động 1 lần → chọn bot user → sinh 1 bài post → đăng lên forum. Prove the concept.

**Scope giới hạn cố ý:**
- ✅ Chỉ action: **POST** (không comment, không vote)
- ✅ Chỉ LLM: **OpenAI** (không fallback)
- ✅ Validation: chỉ **format + length** (không consistency check)
- ✅ Trigger: **HTTP endpoint** (manual) + cron cơ bản
- ✅ Logging: **console** (không file/metrics)

#### 1.1 — Config & Types
**File:** `src/config/index.ts`, `src/types/index.ts`

```typescript
// types/index.ts
export type ActionType = 'post' | 'comment' | 'vote';

export interface GenerationContext {
  user: BotUser;
  category: Category;
  availableTags: Tag[];
}

export interface LLMOutput {
  content: string;
  tags?: string[];
  explain?: string; // LLM tự giải thích (debugging)
}

export interface ActionResult {
  success: boolean;
  actionType: ActionType;
  userId: number;
  provider: string;
  latencyMs: number;
  error?: string;
}
```

#### 1.2 — OpenAI LLM Provider
**File:** `src/services/llm/OpenAIProvider.ts`

```typescript
// Chỉ cần gọi chat completion API
// Model: gpt-3.5-turbo (rẻ nhất)
// Timeout: 30s
// Retry: 3 lần với exponential backoff

interface LLMProvider {
  generate(prompt: string): Promise<LLMOutput>;
  isAvailable(): boolean;
}
```

Xử lý errors: Rate limit (429), Auth error (401), Timeout → throw cụ thể để caller biết

#### 1.3 — Context Gatherer Service
**File:** `src/services/ContextGathererService.ts`

Kết nối trực tiếp DB qua Prisma Client (đọc-only):
```typescript
async function gatherPostContext(userId: number): Promise<GenerationContext> {
  // 1. Lấy user info (bio, display_name)
  // 2. Chọn ngẫu nhiên 1 category MEMBER có thể post
  // 3. Lấy available tags từ DB
  // 4. Lấy 3 bài gần nhất của user (tránh lặp)
  return { user, category, availableTags, recentPosts }
}
```

#### 1.4 — Prompt Builder Service
**File:** `src/services/PromptBuilderService.ts`, `prompts/post.template.txt`

Template đơn giản cho bài POST:
```
Bạn là {DISPLAY_NAME}.
Bio: {BIO}

Gần đây bạn có viết:
{RECENT_POSTS_SNIPPETS}

NHIỆM VỤ: Viết 1 bài đăng cho category "{CATEGORY_NAME}" — {CATEGORY_DESCRIPTION}

Yêu cầu:
- Viết bằng tiếng Việt, tự nhiên như người thật
- Độ dài: 80-400 chữ
- Có tiêu đề (title) và nội dung (content)
- Chọn 1-3 tags phù hợp từ danh sách: {TAG_POOL}
- Tone: {TONE}

Output JSON (CHỈ JSON, không text thêm):
{
  "title": "...",
  "content": "...",
  "tags": ["tag1", "tag2"],
  "explain": "lý do chọn tags này..."
}
```

#### 1.5 — Validation Service (Basic)
**File:** `src/services/ValidationService.ts`

```typescript
function validatePostOutput(raw: string): ValidationResult {
  // 1. Parse JSON → fail nếu invalid JSON
  // 2. Check required fields: title, content, tags (array)
  // 3. Title: 10-200 ký tự
  // 4. Content: 50-2000 ký tự
  // 5. Tags: tất cả phải tồn tại trong DB (query confirm)
  // 6. Không chứa English stopwords lạ hoặc JSON artifacts
}
```

#### 1.6 — API Executor Service
**File:** `src/services/APIExecutorService.ts`

Gọi backend Forum API với JWT token của bot user:
```typescript
// 1. Login bot user → get access_token
//    POST /api/auth/login { email, password }
// 2. Cache token (expire check)
// 3. POST /api/posts { title, content, categoryId, tagIds }
// 4. Handle responses: 201 success, 429 backoff, 5xx retry
```

**Quan trọng:** Token của mỗi bot user được cache riêng, không dùng chung.

#### 1.7 — Content Generator Orchestrator
**File:** `src/services/ContentGeneratorService.ts`

```typescript
async function runOnce(): Promise<ActionResult> {
  // 1. Chọn random bot user từ danh sách active
  // 2. GatherContext(userId)
  // 3. BuildPrompt(context)
  // 4. LLM.generate(prompt) → raw output
  // 5. Validate(raw) → nếu fail → log & return failed result
  // 6. APIExecutor.createPost(userId, validated) → call forum API
  // 7. Log kết quả
  // 8. Return ActionResult
}
```

#### 1.8 — HTTP Trigger + Cron
**File:** `src/index.ts`, `src/scheduler/cronScheduler.ts`

```typescript
// HTTP Server (express nhẹ):
// POST /trigger → chạy runOnce() ngay lập tức
// GET /health   → kiểm tra service còn sống
// GET /status   → xem stats đơn giản (success count, last run)

// Cron (node-cron):
// '*/30 * * * *' → mỗi 30 phút, tự trigger 1 lần
```

**Deliverable Phase 1:**
- Chạy `npm start` → service khởi động
- `POST /trigger` → sinh 1 bài post, đăng lên forum
- Sau 30 phút → tự động đăng tiếp
- Log chi tiết từng bước ra console

---

### PHASE 2: All Actions + Multi-Provider Fallback — 8-12 ngày

**Mục tiêu:** Hệ thống đầy đủ action types và không còn phụ thuộc vào 1 LLM provider.

**Bổ sung so với Phase 1:**
- ✅ Actions: **POST + COMMENT + REPLY + VOTE**
- ✅ Multi-provider fallback: OpenAI → Anthropic → Gemini → Template
- ✅ Weighted action selection (POST 40%, COMMENT 35%, VOTE 25%)
- ✅ Rate limiting: max 3 posts/day, 6 comments/day per bot user
- ✅ Per-provider quota tracking

#### 2.1 — LLM Provider Manager
**File:** `src/services/llm/LLMProviderManager.ts`

```typescript
class LLMProviderManager {
  private providers: LLMProvider[] = [
    new OpenAIProvider(),
    new AnthropicProvider(),
    new GeminiProvider(),
    new TemplateProvider(), // không fail bao giờ
  ];

  async generate(prompt: string): Promise<{ output: LLMOutput; provider: string }> {
    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue; // quota hết → skip
      try {
        const output = await provider.generate(prompt);
        return { output, provider: provider.name };
      } catch (err) {
        this.handleProviderError(provider, err);
        // continue to next provider
      }
    }
    throw new Error('All providers failed');
  }
}
```

#### 2.2 — Anthropic + Gemini Providers
**File:** `src/services/llm/AnthropicProvider.ts`, `GeminiProvider.ts`

Cùng interface `LLMProvider`, cùng error handling pattern.

Models:
- Anthropic: `claude-3-haiku-20240307` (rẻ nhất)
- Gemini: `gemini-1.5-flash` (free tier tốt nhất)

#### 2.3 — Template Provider (Fallback an toàn)
**File:** `src/services/llm/TemplateProvider.ts`

Khi tất cả LLM fail → sinh content từ templates cứng:
```typescript
// Pool của ~20-30 post templates dạng fill-in-the-blank
// Pool của ~30-40 comment templates
// Chọn ngẫu nhiên + fill context
// Đủ để keep-alive mà không cần LLM
```

#### 2.4 — Comment & Reply Actions
**File:** `src/services/ContextGathererService.ts` (mở rộng), `prompts/comment.template.txt`

Để sinh comment:
1. Lấy random post gần đây (không phải của chính bot user đó)
2. Đọc title + excerpt của post đó
3. Prompt: "Đọc bài này, hãy comment 1 câu..."
4. Gọi `POST /api/posts/{postId}/comments`

Để sinh reply:
1. Lấy comment gần đây trong 1 thread đang active
2. Trả lời đúng vào comment đó (parent_id)

#### 2.5 — Vote Action
**File:** `src/services/VoteActionService.ts`

Vote đơn giản hơn (không cần LLM generate content):
1. Lấy random post/comment gần đây
2. Xác suất: 70% upvote, 30% downvote
3. Kiểm tra bot user chưa vote bài đó
4. Kiểm tra không tự vote (self-vote)
5. `POST /api/votes { targetType, targetId, value }`

#### 2.6 — Rate Limiter
**File:** `src/tracking/RateLimiter.ts`

Simple in-memory tracker (đủ cho MVP):
```typescript
// Giới hạn per bot user per ngày:
// - POST: max 3/ngày
// - COMMENT: max 6/ngày
// - VOTE: max 15/ngày

// Giới hạn per LLM provider per ngày:
// - OpenAI: 50 requests/ngày (free tier)
// - Anthropic: 40 requests/ngày
// - Gemini: 60 requests/ngày

// Reset lúc 00:00 UTC mỗi ngày
```

#### 2.7 — Action Selector (Full)
**File:** `src/services/ActionSelectorService.ts`

```typescript
async function selectNextAction(): Promise<SelectedAction | null> {
  // 1. Lấy danh sách bot users không bị rate-limited
  // 2. Chọn random user từ danh sách đó
  // 3. Weighted random action type:
  //    - POST: 40% (nhưng check rate limit)
  //    - COMMENT: 35%
  //    - VOTE: 25%
  // 4. Nếu action bị rate-limited → fallback sang action khác
  // 5. Chọn target: nếu COMMENT → chọn post có comment gần đây
  return { userId, actionType, targetId? }
}
```

**Deliverable Phase 2:**
- Tất cả 3 action types hoạt động
- Khi OpenAI hết quota → tự động dùng Anthropic
- Khi tất cả LLM fail → dùng template (service không die)
- Không bot nào spam quá giới hạn/ngày

---

### PHASE 3: Quality & Consistency — 8-10 ngày

**Mục tiêu:** Content trông "có hồn" hơn, nhất quán với profile user, ít bị reject hơn.

#### 3.1 — User Personality Vector
**File:** `src/services/PersonalityService.ts`

Đọc từ `user_content_context` table (đã tạo ở Phase 0):
```typescript
interface PersonalityVector {
  traits: string[];     // ["hay hỏi", "thẳng thắn", "khiêm tốn"]
  tone: string;         // "casual" | "formal" | "emotional"
  topics: string[];     // ["công việc", "tâm lý", "học tập"]
  writingStyle: string; // "ngắn gọn" | "dài dòng" | "dùng dấu ..."
}

// Cập nhật sau mỗi 5 actions của user
async function updatePersonalityVector(userId: number): Promise<void> {
  const recent = await getRecentPostsAndComments(userId, 5);
  // Gọi LLM để extract personality từ recent content
  // Lưu vào user_content_context
}
```

#### 3.2 — Consistency-Aware Prompts
**File:** `src/services/PromptBuilderService.ts` (mở rộng)

Inject personality vector vào mọi prompt:
```
Thêm vào đầu prompt:
"Bạn là {NAME}. 
Tính cách: {TRAITS}
Cách viết: {WRITING_STYLE}  
Chủ đề quan tâm: {TOPICS}
Tone thường dùng: {TONE}

3 bài viết gần nhất của bạn:
[snippet 1]
[snippet 2]  
[snippet 3]

Hãy viết sao cho nhất quán với tính cách trên."
```

#### 3.3 — Output Quality Scorer
**File:** `src/services/ValidationService.ts` (mở rộng)

Thêm scoring vào pipeline:
```typescript
interface QualityScore {
  lengthOk: boolean;       // 50-2000 ký tự
  languageOk: boolean;     // Tiếng Việt detected
  tagsValid: boolean;      // Tags tồn tại trong DB
  noJsonArtifacts: boolean; // Không còn "```json" hay tương tự
  notDuplicate: boolean;   // Không giống hệt post gần đây
  overallPass: boolean;    // Tất cả trên đều pass
}

// Nếu overallPass = false → reject, không đăng
// Log reason để debug prompt
```

#### 3.4 — Few-Shot Examples trong Prompts
Cập nhật tất cả `prompts/*.template.txt` với 2-3 examples thực tế:
```
EXAMPLES (học theo style này):

EXAMPLE 1:
Input: Category "Kể chuyện", User tính cách "thẳng thắn, hay kể chuyện ngắn"
Output: {
  "title": "Hôm nay tôi từ chối một cuộc họp và không hối hận",
  "content": "Sáng nay có lịch họp 2 tiếng về roadmap Q2...",
  ...
}

EXAMPLE 2:
...
```

#### 3.5 — Cost Tracker
**File:** `src/tracking/CostTracker.ts`

```typescript
interface CostEntry {
  timestamp: Date;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}

class CostTracker {
  async recordUsage(entry: CostEntry): void
  async getDailyCost(): number
  async getMonthlyTotal(): number
  async isOverBudget(limitUSD: number): boolean
}

// Nếu daily cost > limit → disable LLM providers → chỉ dùng template
```

**Deliverable Phase 3:**
- Content trông coherent với bio/tính cách của từng bot user
- Reject rate < 20% (Phase 1 có thể tới 40%)
- Có báo cáo chi phí: `GET /status` → hiện daily/monthly cost
- Few-shot examples giúp output đúng format 95%+ lần

---

### PHASE 4: Robustness & Monitoring — 5-7 ngày

**Mục tiêu:** Hệ thống đủ tin cậy để chạy liên tục mà không cần can thiệp thủ công.

#### 4.1 — Structured Logging
**File:** `src/utils/logger.ts`

Dùng `winston` với format JSON:
```typescript
// Log mỗi action với:
{
  timestamp, action_id, user_id, action_type,
  stage,       // "context_gather" | "llm_call" | "validation" | "api_call"
  status,      // "success" | "failed" | "skipped"
  provider,    // "openai" | "anthropic" | "template"
  cost_tokens, latency_ms, error_reason?
}

// Log files:
// logs/vibe-content.log      ← tất cả
// logs/vibe-content-error.log ← chỉ errors
```

#### 4.2 — Retry Queue (Đơn Giản)
**File:** `src/scheduler/retryQueue.ts`

Không dùng Bull/BullMQ (over-engineer cho MVP). Thay bằng in-memory queue đơn giản:
```typescript
class SimpleRetryQueue {
  private queue: FailedAction[] = [];
  
  add(action: FailedAction, retryAfter: number): void
  
  // Mỗi 5 phút: process expired items
  async processRetries(): Promise<void>
  
  // Max 3 retries, sau đó discard
}
```

#### 4.3 — Admin Status Endpoint
**File:** `src/index.ts` (mở rộng)

```
GET /status → JSON report:
{
  uptime: "2h 35m",
  todayStats: {
    totalActions: 24,
    successCount: 20,
    failedCount: 4,
    successRate: "83%"
  },
  providers: {
    openai: { status: "ok", usedToday: 15, quota: 50 },
    anthropic: { status: "quota_low", usedToday: 38, quota: 40 },
    gemini: { status: "ok", usedToday: 5, quota: 60 }
  },
  costToday: "$0.12",
  lastAction: { type: "comment", userId: 3, at: "2024-03-26T10:30:00Z" },
  queue: { pending: 2, retrying: 1 }
}
```

#### 4.4 — Graceful Shutdown & Error Recovery
```typescript
// Handle SIGTERM/SIGINT → finish current action → shutdown
process.on('SIGTERM', gracefulShutdown);

// Global uncaught exception handler → log → restart (nếu dùng PM2)
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1); // PM2 sẽ restart
});
```

#### 4.5 — Deployment Config
**File:** `vibe-content/service/ecosystem.config.js` (PM2)

```javascript
module.exports = {
  apps: [{
    name: 'vibe-content',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    env: { NODE_ENV: 'production' }
  }]
}
```

**Deliverable Phase 4:**
- Service chạy 24/7 không cần restart thủ công
- Log file rõ ràng để debug khi có vấn đề
- `/status` endpoint cho biết sức khỏe hệ thống real-time
- Actions fail được retry tự động (tối đa 3 lần)

---

## 📋 TỔNG HỢP CÔNG VIỆC & THỨ TỰ ƯU TIÊN

```
PHASE 0 (Foundation)        PHASE 1 (MVP)              PHASE 2 (All Actions)
─────────────────────       ────────────────────        ────────────────────
[3-5 ngày]                  [7-10 ngày]                 [8-12 ngày]

□ Seed bot users            □ Config & Types            □ Anthropic Provider
□ Seed categories/tags      □ OpenAI Provider           □ Gemini Provider
□ Prisma migration          □ Context Gatherer          □ Template Fallback
□ Service scaffold          □ Prompt Builder (POST)     □ LLM Provider Manager
                            □ Validation (basic)        □ Comment/Reply Action
                            □ API Executor              □ Vote Action
                            □ Orchestrator              □ Rate Limiter
                            □ HTTP trigger + Cron       □ Action Selector (full)

PHASE 3 (Quality)           PHASE 4 (Robustness)
──────────────────          ─────────────────────
[8-10 ngày]                 [5-7 ngày]

□ Personality Vector        □ Structured Logging
□ Consistency Prompts       □ Retry Queue
□ Quality Scorer            □ Admin /status endpoint
□ Few-shot Examples         □ Graceful Shutdown
□ Cost Tracker              □ PM2 deployment config
```

---

## ⚙️ BIẾN MÔI TRƯỜNG (.env)

```env
# Forum Backend
FORUM_API_URL=http://localhost:3000/api
FORUM_DB_URL=postgresql://...    # Direct DB access (Prisma - read only)

# LLM Providers (chỉ cần ít nhất 1)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Scheduler
CRON_SCHEDULE=*/30 * * * *      # Mỗi 30 phút
BATCH_SIZE=1                     # Số actions mỗi lần trigger

# Limits
MAX_POSTS_PER_USER_DAY=3
MAX_COMMENTS_PER_USER_DAY=6
MAX_VOTES_PER_USER_DAY=15
DAILY_LLM_BUDGET_USD=0.50        # Dừng gọi LLM khi vượt ngân sách

# Service
PORT=4000
NODE_ENV=development
LOG_LEVEL=info
```

---

## 🔑 QUYẾT ĐỊNH THIẾT KẾ QUAN TRỌNG

### 1. Vibe-Content là service riêng biệt (không tích hợp vào backend)
**Lý do:** 
- Backend forum không cần biết về vibe-content
- Dễ deploy/scale độc lập
- Fault isolation: vibe-content crash không kéo forum down
- Dễ turn off khi không cần

### 2. Giao tiếp qua REST API, không trực tiếp DB để write
**Lý do:**
- Tận dụng toàn bộ validation logic đã có trong backend
- Auth, rate limiting, audit logging đều hoạt động tự động
- Bài post được tạo đúng chuẩn 100% (không bypass business logic)

**Ngoại lệ:** Đọc DB trực tiếp bằng Prisma cho context gathering (performance) - read-only, an toàn.

### 3. Template Provider là safety net bắt buộc
**Lý do:**
- Đảm bảo keep-alive function không bao giờ fail hoàn toàn
- Khi tất cả LLM provider offline → vẫn tạo được content (chất lượng thấp hơn, nhưng đủ dùng)

### 4. Không dùng Bull/BullMQ ở Phase 1-2
**Lý do:**
- Over-engineering cho use case này
- Simple in-memory queue đủ dùng
- Thêm Bull sau nếu scale lên nhiều actions đồng thời

### 5. Bot users login bình thường qua `/api/auth/login`
**Lý do:**
- Không cần API key riêng hay auth bypass
- Tận dụng token refresh logic đã có
- Audit log tự động ghi lại mọi action của bot

---

## 🎯 DEFINITION OF DONE

### Phase 0 ✅ Done khi:
- `npm run seed:bots` → 10+ users trong DB với profile đa dạng
- `npm run seed:forum` → 7 categories + 30+ tags trong DB
- `npx prisma migrate dev` thành công với `user_content_context` table
- `npm start` chạy được, in "Service started on port 4000"

### Phase 1 ✅ Done khi:
- `curl -X POST localhost:4000/trigger` → 1 bài post xuất hiện trên forum
- Sau 30 phút → thêm 1 bài post mới tự động
- Log console hiện đủ: user, category, LLM response, validation result, API response
- Success rate (test 10 trigger): >= 70%

### Phase 2 ✅ Done khi:
- 3 action types đều hoạt động (test 5 lần mỗi loại)
- Tắt OPENAI_API_KEY → service tự động dùng Anthropic/Gemini
- Tắt tất cả LLM keys → service dùng template, không crash
- 1 bot user không post quá 3 lần/ngày

### Phase 3 ✅ Done khi:
- Content của mỗi bot user nhất quán với bio/tính cách sau 10+ actions
- Reject rate < 20% (đo qua log)
- `/status` báo daily cost chính xác
- Không có bài nào bị reject vì wrong JSON format

### Phase 4 ✅ Done khi:
- Service chạy 48h liên tục không crash
- Log file ghi đầy đủ, readable
- `/status` trả về JSON đầy đủ
- Kill process → PM2 restart tự động trong 5s

---

*Tạo lúc: 2026-03-26 | Dựa trên phân tích IDEA_ASSESSMENT.md + cấu trúc dự án hiện tại*
