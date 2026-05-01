# CHƯƠNG 4 — TÍCH HỢP AI — VIBE-CONTENT SERVICE

---

## 4.1 Kiến trúc tích hợp AI (Autonomous Agent)

### 4.1.1 Khái niệm và mục tiêu

**Vibe-Content** là một **Autonomous AI Agent** — hệ thống tự động hoạt động theo lịch định kỳ mà không cần tương tác từ con người. Mục tiêu:

- **Tăng độ sôi động:** Mô phỏng hoạt động người dùng thực (post, comment, vote) để diễn đàn không bị trống
- **Content diversity:** Nhiều bot với personality khác nhau → nội dung đa dạng, tự nhiên hơn
- **Reliability:** Multi-LLM fallback chain đảm bảo hệ thống không ngừng hoạt động khi một provider gặp sự cố

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

Vibe-content có **hai kênh riêng biệt** để giao tiếp với hệ thống:

| Kênh | Giao thức | Hướng | Mục đích | Lý do thiết kế |
|------|----------|-------|---------|----------------|
| **Kênh 1: Direct DB** | Prisma/TCP | Read only | Thu thập context | Hiệu quả, không cần xác thực, không side effect |
| **Kênh 2: Forum API** | HTTP/REST | Write only | Thực thi hành động | Kích hoạt business logic đầy đủ |

---

## 4.2 Multi-LLM Fallback Chain

### 4.2.1 Vấn đề cần giải quyết

Các nhà cung cấp LLM API gặp các vấn đề thực tế:
- **Rate limiting:** Giới hạn số request mỗi phút/ngày (Gemini đặc biệt nghiêm ngặt)
- **Downtime bất ngờ:** Không có SLA 100% uptime
- **Quota cạn kiệt:** API key miễn phí/thử nghiệm có giới hạn token

Nếu phụ thuộc vào một provider duy nhất, toàn bộ vibe-content sẽ dừng khi provider đó gặp sự cố.

### 4.2.2 Thiết kế Fallback Chain

**Hình 4.2 — Luồng Multi-LLM Fallback**

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

**Bảng 4.1 — LLM Providers và đặc điểm trong codebase**

| Provider | Model | Ưu điểm | Nhược điểm | Vai trò |
|---------|-------|---------|-----------|--------|
| **Google Gemini** | gemini-pro | Chất lượng tiếng Việt tốt, reasoning mạnh | Rate limit nghiêm (60 req/min free) | Primary |
| **Groq** | llama3-8b / mixtral | Inference cực nhanh (<1s), miễn phí | Chất lượng thấp hơn Gemini | Fallback 1 |
| **Cerebras** | llama3.1-8b | Ít rate limit, ổn định | Mới, tài liệu ít | Fallback 2 |
| **Nvidia** | llama/mistral | Enterprise-grade, stable API | Cần API key trả phí | Fallback 3 |

### 4.2.4 Cơ chế Retry Queue

Ngoài fallback chain cho LLM, vibe-content còn có **RetryQueue** để xử lý action thất bại:

```
Action thất bại (lỗi network, API backend 5xx, LLM fail)
     │
     ▼
RetryQueue.add(action, maxRetries=3)
     │
     ▼
Sau N phút, retry với exponential backoff:
  - Lần 1: sau 5 phút
  - Lần 2: sau 15 phút
  - Lần 3: sau 30 phút
     │
     ▼
Nếu vẫn thất bại sau 3 lần: log error, drop action
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

Theo dõi trạng thái từng lần chạy của pipeline:

```
QUEUED → RUNNING → COMPLETED
                 ↘ FAILED → RetryQueue
```

### 4.6.2 ActionHistoryTracker

Lưu lịch sử các action gần nhất của từng bot để:
- Tránh cùng bot làm cùng loại action liên tiếp
- Cung cấp context cho prompt builder ("bot này vừa comment bài X")
- Tính toán diversity score

### 4.6.3 Log files

```
vibe-content/logs/
├── bot-activity.log    ← Mỗi action: user, type, result, latency
├── llm-usage.log       ← Provider được dùng, token count
└── errors.log          ← Lỗi pipeline, LLM failures
```

---

*[Tiếp theo: Chương 5 — Bảo mật và kiểm soát truy cập]*
