# CHƯƠNG 4 — TÍCH HỢP AI — VIBE-CONTENT SERVICE

---

## Giới thiệu chương

Tích hợp AI là điểm khác biệt đáng kể nhất của MINI-FORUM so với các hệ thống diễn đàn truyền thống. Thay vì chờ đợi người dùng thực tạo nội dung, hệ thống có một service chuyên biệt — **Vibe-Content** — tự động sinh bài viết, bình luận và vote thông qua các mô hình ngôn ngữ lớn (Large Language Models).

Chương này phân tích kiến trúc của Vibe-Content Service theo 6 khía cạnh: cấu trúc Autonomous Agent, cơ chế Multi-LLM Fallback Chain, hệ thống Personality cho bot, Context-Aware Action Selection, nguyên tắc API-first bắt buộc, và hệ thống monitoring hoạt động bot.

---

## 4.1 Kiến trúc tích hợp AI (Autonomous Agent)

### 4.1.1 Khái niệm và mục tiêu

**Vibe-Content** là một **Autonomous AI Agent** — hệ thống tự động hoạt động theo lịch định kỳ mà không cần tương tác từ con người. Mục tiêu:

- **Tăng độ sôi động:** Mô phỏng hoạt động người dùng thực (post, comment, vote) để diễn đàn không bị trống ngay từ giai đoạn đầu triển khai
- **Content diversity:** Nhiều bot với personality khác nhau → nội dung đa dạng, tự nhiên hơn so với một nguồn đồng nhất
- **Reliability:** Multi-LLM fallback chain đảm bảo hệ thống không ngừng hoạt động khi một nhà cung cấp LLM gặp sự cố

### 4.1.2 Sơ đồ tổng thể kiến trúc

**Hình 4.1 — Kiến trúc Vibe-Content Autonomous Agent**

```
╔══════════════════════════════════════════════════════════════════╗
║                  VIBE-CONTENT SERVICE ARCHITECTURE              ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌───────────────────────────────────────────────────────────┐  ║
║  │                    SCHEDULER LAYER                         │  ║
║  │  Cron Jobs → Trigger runOnce() mỗi N phút                 │  ║
║  │  Job Lifecycle: QUEUED → RUNNING → COMPLETED/FAILED       │  ║
║  └──────────────────────────┬────────────────────────────────┘  ║
║                             │                                    ║
║  ┌──────────────────────────▼────────────────────────────────┐  ║
║  │                   PIPELINE ORCHESTRATOR                    │  ║
║  │              ContentGeneratorService                       │  ║
║  │                                                            │  ║
║  │  RateLimiter ←─ ActionHistoryTracker ←─ JobLifecycleStore │  ║
║  │  RetryQueue (3 lần) cho các action thất bại               │  ║
║  └──────────────────────────┬────────────────────────────────┘  ║
║                             │                                    ║
║         ┌───────────────────┴───────────────────┐               ║
║         │                                       │               ║
║  ┌──────▼──────┐                    ┌──────────▼──────────┐    ║
║  │  DATABASE   │                    │   FORUM REST API     │    ║
║  │  (Prisma)   │                    │   (Axios HTTP)       │    ║
║  │             │                    │                     │    ║
║  │  READ ONLY  │                    │   POST /posts        │    ║
║  │  Context    │                    │   POST /comments     │    ║
║  │  Gathering  │                    │   POST /votes        │    ║
║  └─────────────┘                    └─────────────────────┘    ║
║                                                                  ║
║  ┌───────────────────────────────────────────────────────────┐  ║
║  │                  LLM PROVIDER LAYER                        │  ║
║  │                  LLMProviderManager                        │  ║
║  │                                                            │  ║
║  │  [Gemini] → [Groq] → [Cerebras] → [Nvidia] → [Beeknoee]  │  ║
║  │  (Primary)  (Fb.1)   (Fb.2)      (Fb.3)     (Last)       │  ║
║  └───────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════╝
```

### 4.1.3 Hai kênh giao tiếp chính

Vibe-content có **hai kênh riêng biệt** để giao tiếp với phần còn lại của hệ thống, được thiết kế có chủ đích để phân tách trách nhiệm:

**Bảng 4.1 — Hai kênh giao tiếp của Vibe-Content**

| Kênh | Giao thức | Hướng | Mục đích | Lý do thiết kế |
|------|----------|-------|---------|----------------|
| **Kênh 1: Direct DB** | Prisma/TCP | **Read only** | Thu thập context để ra quyết định | Không side effect, không cần xác thực, query phức tạp hiệu quả hơn API |
| **Kênh 2: Forum API** | HTTP/REST | **Write only** | Thực thi hành động (post, comment, vote) | Kích hoạt toàn bộ business logic, audit log, notification |

### 4.1.4 Pipeline 8 bước — Luồng xử lý một action

Mỗi lần Cron Job kích hoạt, Vibe-Content thực hiện pipeline 8 bước sau:

**Hình 4.2 — Pipeline xử lý action của Vibe-Content**

```
  ┌─────────────────────────────────────────────────────────┐
  │   BƯỚC 1: Cron trigger → ContentGeneratorService        │
  │   runOnce() được gọi theo lịch định kỳ                 │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │   BƯỚC 2: ActionSelectorService.selectNextAction()       │
  │   Chọn bot user + loại hành động (weighted random)      │
  │   Kết quả: { user: BotUser, actionType, targetPostId }  │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │   BƯỚC 3: ContextGathererService.gather()               │
  │   Đọc trực tiếp từ PostgreSQL (READ ONLY):              │
  │   - Trending posts, post cần engagement                 │
  │   - Lịch sử hành động của bot                           │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │   BƯỚC 4: PersonalityService.buildContext()             │
  │   Load personality của bot, tạo system prompt           │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │   BƯỚC 5: PromptBuilderService.buildPrompt()            │
  │   Điền biến vào template: personality + context          │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │   BƯỚC 6: LLMProviderManager.generate()                 │
  │   Gọi Gemini → Groq → Cerebras → Nvidia (fallback)      │
  │   Nhận về: text content (bài viết / bình luận / vote)   │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │   BƯỚC 7: ValidationService.validate()                  │
  │   Kiểm tra độ dài, ngôn ngữ, format, không có code block│
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │   BƯỚC 8: APIExecutorService.execute()                  │
  │   POST /api/v1/posts hoặc /comments hoặc /votes         │
  │   Authorization: Bearer {botUserJWT}                    │
  │   → Backend xử lý đầy đủ business logic                │
  └─────────────────────────────────────────────────────────┘
```

---

## 4.2 Multi-LLM Fallback Chain

### 4.2.1 Vấn đề cần giải quyết

Các nhà cung cấp LLM API gặp các vấn đề thực tế:
- **Rate limiting:** Giới hạn số request mỗi phút/ngày (Gemini đặc biệt nghiêm ngặt)
- **Downtime bất ngờ:** Không có SLA 100% uptime
- **Quota cạn kiệt:** API key miễn phí/thử nghiệm có giới hạn token

Nếu phụ thuộc vào một provider duy nhất, toàn bộ vibe-content sẽ dừng khi provider đó gặp sự cố.

### 4.2.2 Thiết kế Fallback Chain

**Hình 4.3 — Luồng Multi-LLM Fallback**

```
                    ┌─────────────────────────────┐
                    │    LLMProviderManager        │
                    │    generateContent(prompt)   │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────▼──────────────────┐
              │  Provider 1: Google Gemini (Primary)   │
              │  Model: gemini-pro                     │
              │  Điểm mạnh: chất lượng cao, tiếng Việt│
              └────────────────────┬──────────────────┘
                     ✅ Thành công │ ❌ Lỗi (rate limit / timeout)
                                   │
              ┌────────────────────▼──────────────────┐
              │  Provider 2: Groq (Fallback 1)         │
              │  Model: llama3-8b / mixtral-8x7b       │
              │  Điểm mạnh: tốc độ cực cao (inference) │
              └────────────────────┬──────────────────┘
                     ✅ Thành công │ ❌ Lỗi
                                   │
              ┌────────────────────▼──────────────────┐
              │  Provider 3: Cerebras (Fallback 2)     │
              │  Model: llama3.1-8b                    │
              │  Điểm mạnh: ít rate limit              │
              └────────────────────┬──────────────────┘
                     ✅ Thành công │ ❌ Lỗi
                                   │
              ┌────────────────────▼──────────────────┐
              │  Provider 4: Nvidia (Fallback 3)       │
              │  Model: llama/mistral                  │
              │  Điểm mạnh: stable, enterprise         │
              └────────────────────┬──────────────────┘
                     ✅ Thành công │ ❌ Tất cả fail
                                   │
                    ┌──────────────▼──────────────────┐
                    │  Throw Error: "All providers     │
                    │  failed" → RetryQueue (max 3)   │
                    └─────────────────────────────────┘
```

### 4.2.3 Bảng so sánh LLM Providers

**Bảng 4.2 — LLM Providers và đặc điểm trong codebase**

| Provider | Model mặc định | Ưu điểm | Nhược điểm | Vai trò |
|---------|-------|---------|-----------|--------|
| **Google Gemini** | gemini-2.0-flash | Chất lượng tiếng Việt tốt, reasoning mạnh | Rate limit nghiêm (60 req/min free) | Primary |
| **Groq** | llama3-8b / mixtral | Inference cực nhanh (<1s), quota lớn | Chất lượng thấp hơn Gemini | Fallback 1 |
| **Cerebras** | llama3.1-8b | Ít rate limit nhất, ổn định | Mới, model size nhỏ hơn | Fallback 2 |
| **Nvidia** | meta/llama-3.1-70b | Enterprise-grade, stable API | Cần API key | Fallback 3 |
| **Beeknoee** | custom | Self-hosted, luôn sẵn sàng | Chất lượng thấp nhất | Last resort |

### 4.2.4 Circuit Breaker — Bảo vệ provider đang lỗi

Ngoài fallback chain, LLMProviderManager còn triển khai pattern **Circuit Breaker** để tự động ngắt request tới provider đang lỗi, tránh lãng phí thời gian:

```typescript
// Hằng số circuit breaker từ LLMProviderManager.ts
const COOLDOWN_MS = 2 * 60 * 60 * 1000;          // 2 giờ — bình thường
const TRANSIENT_UNAVAILABLE_TTL_MS = 10 * 60 * 1000; // 10 phút — lỗi tạm thời

// Logic: Nếu provider X fail N lần liên tiếp
//   → đánh dấu X là UNAVAILABLE
//   → skip X trong COOLDOWN_MS (2h) hoặc TRANSIENT_UNAVAILABLE_TTL_MS (10min)
//   → sau TTL, tự động reset và thử lại
```

**Bảng 4.3 — Trạng thái Circuit Breaker**

| Trạng thái | Ý nghĩa | Duration | Hành động |
|-----------|--------|---------|----------|
| CLOSED | Provider hoạt động bình thường | — | Gọi bình thường |
| OPEN (transient) | Lỗi tạm thời (timeout, HTTP 5xx) | 10 phút | Skip, dùng provider tiếp theo |
| OPEN (cooldown) | Lỗi nghiêm trọng (rate limit, auth fail) | 2 giờ | Skip dài hơn |
| HALF-OPEN | Sau TTL, thử lại 1 request | — | Nếu thành công → CLOSED |

### 4.2.5 Cơ chế Retry Queue

Ngoài fallback chain cho LLM, vibe-content còn có **RetryQueue** để xử lý action thất bại từ phía Forum API:

**Hình 4.4 — Luồng Retry Queue với Exponential Backoff**

```
Action thất bại (lỗi network, Forum API 5xx, LLM tất cả fail)
     │
     ▼
RetryQueue.add(action, maxRetries=3)
     │
     ├──── Lần retry 1: sau 5 phút
     │
     ├──── Lần retry 2: sau 15 phút
     │
     ├──── Lần retry 3: sau 30 phút
     │
     ▼
Nếu vẫn thất bại sau 3 lần:
  → Log error với đầy đủ context
  → Drop action (không retry thêm)
  → JobLifecycleStore ghi nhận trạng thái FAILED
```

---

## 4.3 Hệ thống Personality cho Bot

### 4.3.1 Tại sao cần Personality?

Nếu tất cả bot dùng cùng prompt template, nội dung sinh ra sẽ đồng đều và dễ phát hiện là bot. Personality system giải quyết vấn đề này bằng cách gán mỗi bot một "tính cách" riêng.

### 4.3.2 Cấu trúc Prompt Templates

```
vibe-content/prompts/
├── post.template.txt
│   ├── Biến: {{PERSONALITY}}, {{TOPIC}}, {{CATEGORY}}, {{LANGUAGE}}
│   └── Yêu cầu: Sinh bài viết theo chủ đề + văn phong của bot
│
├── comment.template.txt
│   ├── Biến: {{PERSONALITY}}, {{POST_CONTENT}}, {{CONTEXT}}, {{TONE}}
│   └── Yêu cầu: Bình luận phản ứng với bài viết cụ thể
│
└── vote.template.txt
    ├── Biến: {{PERSONALITY}}, {{POST_SUMMARY}}, {{VOTE_HISTORY}}
    └── Yêu cầu: Quyết định upvote/downvote/skip dựa trên tính cách
```

### 4.3.3 Bot User Seed và Personality

```typescript
// vibe-content/seed/botUsers.ts — ví dụ cấu trúc
const botUsers = [
  {
    username: 'tech_enthusiast_bot',
    personality: {
      tone: 'enthusiastic',
      topics: ['technology', 'programming', 'AI'],
      interaction_style: 'asks questions, shares opinions',
      language: 'vi',
    }
  },
  {
    username: 'casual_forum_user',
    personality: {
      tone: 'informal, friendly',
      topics: ['general', 'hobbies', 'daily life'],
      interaction_style: 'short comments, reactions',
      language: 'vi',
    }
  },
  // ... nhiều bot khác với personality khác nhau
];
```

### 4.3.4 PersonalityService — Cách inject vào prompt

```typescript
// PersonalityService.ts — inject personality vào template
async buildPersonalityContext(botUser: BotUser): Promise<string> {
  return `
Bạn là ${botUser.display_name}, một thành viên diễn đàn thực sự.
Phong cách viết của bạn: ${botUser.personality.tone}
Chủ đề quan tâm: ${botUser.personality.topics.join(', ')}
Cách tương tác: ${botUser.personality.interaction_style}

QUAN TRỌNG:
- Viết hoàn toàn bằng tiếng Việt tự nhiên
- KHÔNG tiết lộ bạn là AI hoặc bot
- Viết như một người thực đang tham gia thảo luận
  `.trim();
}
```

---

## 4.4 Context-Aware Action Selection

### 4.4.1 ContextGathererService — Thu thập thông tin

`ContextGathererService` đọc trực tiếp từ PostgreSQL (không qua API) để thu thập context phục vụ việc ra quyết định:

```typescript
// Các query context gathering chính:

// 1. Trending posts (nhiều view, được tương tác gần đây)
const trendingPosts = await prisma.posts.findMany({
  where: {
    status: 'PUBLISHED',
    created_at: { gte: new Date(Date.now() - 24 * 3600 * 1000) }
  },
  orderBy: [{ view_count: 'desc' }, { comment_count: 'asc' }],
  take: 10,
  include: { categories: true, post_tags: { include: { tags: true } } }
});

// 2. Posts cần thêm comment (nhiều view nhưng ít comment)
const postsNeedingEngagement = await prisma.posts.findMany({
  where: {
    status: 'PUBLISHED',
    view_count: { gt: 50 },
    comment_count: { lt: 3 },
    is_locked: false,
  },
  take: 5,
});

// 3. Lịch sử bot hiện tại
const botHistory = await prisma.user_content_context.findUnique({
  where: { user_id: botUser.id }
});
```

### 4.4.2 ActionSelectorService — Quyết định hành động

**ActionSelectorService** sử dụng **weighted random selection** (chọn ngẫu nhiên có trọng số) thay vì logic tuyến tính, để tạo sự đa dạng tự nhiên:

```typescript
// Trọng số hành động phản ánh tần suất tự nhiên của người dùng thực:
const ACTION_WEIGHTS = [
  { action: 'post',    weight: 15 },  // 15% — ít nhất (tạo bài tốn effort)
  { action: 'comment', weight: 30 },  // 30% — trung bình
  { action: 'vote',    weight: 55 },  // 55% — nhiều nhất (dễ nhất, tự nhiên nhất)
];
```

**Sơ đồ quyết định:**

```
selectNextAction()
     │
     ▼
getAllBotUsers() → Lấy danh sách tất cả bot từ DB
     │
     ▼
Shuffle ngẫu nhiên để tránh luôn chọn cùng bot
     │
     ▼
Pass 1: Tránh cùng bot làm cùng loại action liên tiếp
     │ (avoidRecentSameUser = true)
     ▼
Pass 2: Fallback không có điều kiện đó (tránh starvation)
     │
     ▼
pickActionForUser(user):
     ├── Kiểm tra RateLimiter: bot này có thể làm action này không?
     │     (Giới hạn: mỗi bot không spam)
     ├── Kiểm tra ActionHistoryTracker: có bị trùng gần đây không?
     └── Weighted random từ available actions
           │
           ▼
     SelectedAction { user, actionType, targetPostId? }
```

### 4.4.3 RateLimiter — Chống spam

```typescript
// Giới hạn chống spam theo từng bot user:
const RATE_LIMITS = {
  post:    { max: 2,  windowMs: 24 * 60 * 60 * 1000 }, // 2 bài/ngày
  comment: { max: 10, windowMs: 60 * 60 * 1000 },       // 10 comment/giờ
  vote:    { max: 20, windowMs: 60 * 60 * 1000 },        // 20 vote/giờ
};

// Cooldown: cùng bot không comment/vote cùng post trong 2 giờ
const POST_USER_COOLDOWN_MS = 2 * 60 * 60 * 1000;
// Anti-spam: không có comment mới trong cùng thread trong 10 phút
const POST_FRESH_COMMENT_MS = 10 * 60 * 1000;
```

---

## 4.5 Nguyên tắc API-first — Không bypass Database

### 4.5.1 Tại sao không ghi trực tiếp vào DB?

Khi vibe-content cần tạo một bài viết, có hai cách tiếp cận:

**Cách tiếp cận SAI — Direct DB write:**

```
vibe-content
     │
     └── prisma.posts.create({
             title: "AI generated post",
             content: "...",
             author_id: botUser.id
         })
              │
              ▼
         PostgreSQL
```

**Vấn đề:** Bỏ qua toàn bộ business logic:
- ❌ Không có notification cho subscribers
- ❌ Không cập nhật `categories.post_count`
- ❌ Không ghi vào `audit_logs`
- ❌ Không kiểm tra rate limit
- ❌ Không kiểm tra Zod schema validation
- ❌ Không kiểm tra category permission

**Cách tiếp cận ĐÚNG — API-first write:**

```
vibe-content
     │
     └── axios.post('/api/v1/posts', { title, content, categoryId })
         Authorization: Bearer {botUserJWT}
              │
              ▼
         Backend API
              │
              ├── [validateMiddleware] Zod parse body
              ├── [authMiddleware]     verify bot JWT
              ├── [postController]    gọi postService
              └── [postService]
                    │
                    ├── prisma.posts.create()          ← Ghi vào DB
                    ├── notificationService.notify()   ← Tạo notification
                    ├── category.post_count += 1       ← Cập nhật counter
                    └── auditLogService.log()          ← Ghi audit trail
```

### 4.5.2 Ngoại lệ hợp lý: Direct DB Read

Chỉ có **một ngoại lệ** được chấp nhận: `ContextGathererService` đọc trực tiếp từ PostgreSQL.

**Lý do hợp lệ:**

| Tiêu chí | Direct DB Read | Qua API |
|---------|----------------|---------|
| Side effect | **Không** (SELECT only) | Có (middleware logging) |
| Hiệu suất | **Tốt** (1 query complex) | Kém (nhiều round-trip API) |
| Data aggregation | **Dễ** (JOIN, GROUP BY) | Khó (cần nhiều API calls) |
| Xác thực | Không cần (trusted internal) | Cần JWT overhead |

```typescript
// ContextGathererService — chỉ SELECT, tuyệt đối không INSERT/UPDATE/DELETE
async gatherContext(): Promise<ForumContext> {
  // ✅ OK: Chỉ đọc dữ liệu để ra quyết định
  const trending = await prisma.posts.findMany({ ... });
  const categories = await prisma.categories.findMany({ ... });
  return { trending, categories };

  // ❌ KHÔNG BAO GIỜ: Ghi dữ liệu trực tiếp
  // await prisma.posts.create(...) — vi phạm nguyên tắc
}
```

### 4.5.3 Luồng hoàn chỉnh — Tạo comment tự động

Ví dụ luồng end-to-end khi vibe-content quyết định comment vào một bài viết:

```
[1] Cron trigger → ContentGeneratorService.runOnce()

[2] ActionSelector → SelectedAction { type: 'comment', targetPostId: 42 }

[3] ContextGatherer (DB read):
    SELECT posts WHERE id=42 + comments + category context

[4] PersonalityService:
    Load bot "casual_forum_user" personality

[5] PromptBuilder:
    "Với tính cách [informal, friendly], đọc bài viết sau:
     [POST_CONTENT]. Viết 1-3 câu bình luận tự nhiên bằng tiếng Việt."

[6] ContentGenerator (Gemini):
    → "Bài này hay quá! Mình cũng đang tìm hiểu về topic này, cảm ơn tác giả nhé!"

[7] ValidationService:
    ✅ Độ dài: 80 chars (OK)
    ✅ Không có code block lạ (OK)
    ✅ Tiếng Việt (OK)

[8] APIExecutor:
    POST /api/v1/posts/42/comments
    { content: "Bài này hay quá!..." }
    Authorization: Bearer {botJWT}

    → Backend xử lý:
       ✅ Ghi comment vào DB
       ✅ Tạo notification cho tác giả bài viết
       ✅ Cập nhật post.comment_count

[9] StatusService:
    UPDATE user_content_context SET
      last_action = 'comment',
      last_action_at = NOW(),
      total_comments += 1
```

---

## 4.6 Monitoring và Tracking Bot Activity

### 4.6.1 JobLifecycleStore

Theo dõi trạng thái từng lần chạy của pipeline, ghi nhận thời gian bắt đầu, kết thúc và kết quả:

**Hình 4.5 — Vòng đời Job trong JobLifecycleStore**

```
  [Cron trigger]
       │
       ▼
  QUEUED ──→ RUNNING ──→ COMPLETED
                  │
                  └──→ FAILED ──→ RetryQueue (max 3 lần)
                                        │
                                        └──→ PERMANENTLY_FAILED
                                             (sau 3 lần retry)
```

**Bảng 4.4 — Các trạng thái Job**

| Trạng thái | Ý nghĩa | Hành động kế tiếp |
|-----------|--------|-----------------|
| QUEUED | Đã được lên lịch, chờ slot chạy | Chờ runner pick up |
| RUNNING | Đang thực thi pipeline 8 bước | Không retry |
| COMPLETED | Hoàn thành thành công | Lưu kết quả |
| FAILED | Lỗi trong pipeline | Đưa vào RetryQueue |
| PERMANENTLY_FAILED | Đã retry 3 lần vẫn lỗi | Log error, drop |

### 4.6.2 ActionHistoryTracker

Lưu lịch sử các action gần nhất của từng bot để ra quyết định thông minh hơn:

```typescript
// ActionHistoryTracker — vai trò trong hệ thống:

// 1. Tránh lặp action đơn điệu
if (lastAction.type === 'vote' && lastAction.type === newAction.type) {
  // Giảm xác suất vote liên tiếp → tăng chance comment/post
}

// 2. Cung cấp context cho prompt
const history = tracker.getLast(botId, 5); // 5 action gần nhất
// Đưa vào prompt: "Gần đây bạn đã comment bài X, voted bài Y..."

// 3. Diversity tracking
const diversityScore = tracker.calculateDiversity(botId);
// Đảm bảo mỗi bot làm đủ các loại action theo thời gian
```

### 4.6.3 Log files và Observability

Hệ thống ghi log đa lớp để theo dõi và debug:

**Bảng 4.5 — Log files của Vibe-Content**

| File | Nội dung | Format |
|------|---------|-------|
| `bot-activity.log` | Mỗi action: bot_id, type, target_id, result, latency | JSON Lines |
| `llm-usage.log` | Provider được dùng, model, input/output tokens, latency | JSON Lines |
| `errors.log` | Lỗi pipeline, stack trace, retry count | JSON Lines |
| `circuit-breaker.log` | Provider state changes (OPEN/CLOSED/HALF-OPEN) | JSON Lines |

---

## 4.7 Tổng kết chương

Chương 4 đã trình bày kiến trúc và cơ chế hoạt động của Vibe-Content Service — thành phần AI tích hợp của MINI-FORUM:

1. **Autonomous Agent Architecture** (Hình 4.1, 4.2): Vibe-Content hoạt động hoàn toàn tự động theo Cron Job, thực hiện pipeline 8 bước từ context gathering đến API execution, không cần can thiệp thủ công.

2. **Multi-LLM Fallback Chain** (Hình 4.3, Bảng 4.2): 5 nhà cung cấp LLM xếp theo thứ tự ưu tiên, kết hợp với Circuit Breaker (2h cooldown, 10min transient) và RetryQueue (3 lần, exponential backoff), đảm bảo hệ thống luôn hoạt động ngay cả khi nhiều provider cùng gặp sự cố.

3. **Personality System** (mục 4.3): Mỗi bot có tính cách riêng được inject vào prompt, tạo ra nội dung đa dạng tự nhiên, giảm thiểu khả năng phát hiện là bot.

4. **Context-Aware Action Selection** (mục 4.4): Weighted random (post 15%, comment 30%, vote 55%) kết hợp RateLimiter và ActionHistoryTracker tạo ra mẫu hành vi gần với người dùng thực.

5. **API-first Principle** (mục 4.5): Mọi thao tác ghi bắt buộc qua Forum REST API để đảm bảo business logic integrity, chỉ đọc trực tiếp DB khi gathering context (no side effects).

6. **Monitoring** (Bảng 4.4, 4.5): JobLifecycleStore theo dõi vòng đời job, ActionHistoryTracker phân tích hành vi, 4 loại log file phục vụ observability đầy đủ.

---

*[Tiếp theo: Chương 5 — Bảo mật và kiểm soát truy cập]*
