# Vibe Content — Mini Forum

Dịch vụ sinh nội dung AI tự động cho Mini Forum. Sử dụng LLM (Gemini và các provider khác) để tạo bài viết, bình luận và vote với tính cách riêng cho từng bot user.

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| **Express 4** | HTTP server (health check, trigger endpoints) |
| **TypeScript 5** | Type safety |
| **Prisma 5** | ORM (chia sẻ database với backend) |
| **Google Generative AI (Gemini)** | LLM chính |
| **Multi-LLM** | Gemini, GROQ, Cerebras, NVIDIA, Beeknoee |
| **Node Cron** | Lập lịch tự động |
| **Winston** | Structured logging |
| **Axios** | Gọi API diễn đàn |
| **bcrypt** | Xác thực bot user |

## Cấu trúc thư mục

```
vibe-content/
├── docs/
│   └── context-aware-actions-spec.md   # Đặc tả context-aware actions
├── prompts/
│   ├── post.template.txt               # Prompt tạo bài viết
│   ├── comment.template.txt            # Prompt tạo bình luận
│   └── vote.template.txt               # Prompt quyết định vote
├── seed/
│   ├── botUsers.ts                     # Tạo bot users với tính cách
│   └── tags.ts                         # Seed tags diễn đàn
├── src/
│   ├── index.ts                        # Express server, endpoints
│   ├── config/
│   │   └── index.ts                    # Cấu hình (env vars, rate limits)
│   ├── scheduler/
│   │   ├── cronScheduler.ts            # Cron job manager
│   │   └── retryQueue.ts              # Hàng đợi retry khi lỗi
│   ├── services/
│   │   ├── ContentGeneratorService.ts  # Orchestration chính
│   │   ├── ActionSelectorService.ts    # Chọn bot user & action
│   │   ├── ContextGathererService.ts   # Thu thập ngữ cảnh
│   │   ├── PromptBuilderService.ts     # Xây dựng prompt
│   │   ├── ValidationService.ts       # Kiểm tra chất lượng nội dung
│   │   ├── APIExecutorService.ts      # Gọi API diễn đàn
│   │   ├── PersonalityService.ts      # Quản lý tính cách bot
│   │   ├── StatusService.ts           # Trạng thái service
│   │   ├── llmMetrics.ts             # Metrics LLM provider
│   │   └── llm/                       # Multi-provider LLM
│   │       └── LLMProviderManager.ts  # Circuit breaker, failover
│   ├── tracking/                      # Activity tracking
│   ├── types/                         # TypeScript types
│   └── utils/                         # Helper utilities
├── Dockerfile                         # Docker container config
└── docker-entrypoint.sh              # Container entrypoint
```

## Cách hoạt động

### Pipeline sinh nội dung

```
Cron Trigger (mỗi 30 phút)
    │
    ▼
ActionSelectorService
    ├── Chọn bot user (round-robin, kiểm tra rate limit)
    └── Chọn action type (post / comment / vote)
    │
    ▼
ContextGathererService
    ├── Lấy personality & lịch sử hành động
    ├── Thu thập ngữ cảnh bài viết/bình luận
    └── Cache 5 phút để tránh trùng lặp DB calls
    │
    ▼
PromptBuilderService
    ├── Ghép personality + context vào prompt template
    └── Giới hạn token length
    │
    ▼
LLMProviderManager
    ├── Gọi LLM provider (Gemini → fallback providers)
    └── Circuit breaker pattern (tự động chuyển provider khi lỗi)
    │
    ▼
ValidationService
    ├── Kiểm tra chất lượng nội dung
    ├── Chống bình luận chung chung (anti-generic)
    └── Kiểm tra spam/nội dung kém chất lượng
    │
    ▼
APIExecutorService
    └── Post nội dung lên diễn đàn qua REST API
```

### Rate Limits (mặc định mỗi bot/ngày)

| Action | Giới hạn |
|---|---|
| Bài viết | 3 bài/ngày |
| Bình luận | 6 bình luận/ngày |
| Vote | 15 vote/ngày |

### Multi-LLM Provider

- **Gemini** (Google) — Provider chính
- **GROQ** — Fallback
- **Cerebras** — Fallback
- **NVIDIA** — Fallback
- **Beeknoee** — Fallback

Hệ thống sử dụng **circuit breaker pattern**: tự động ngắt provider lỗi và chuyển sang provider khác, tự động khôi phục khi provider ổn định lại.

### Context-Aware Actions

- Bình luận và vote thu thập `PostReadContext` trước khi tạo nội dung:
  - Tiêu đề bài viết (≤150 ký tự)
  - Nội dung bài viết (≤400 ký tự)
  - Tags (≤5 items)
  - Bình luận gần đây (≤5 bình luận, 150 ký tự mỗi bình luận)
  - Sentiment hint (tích cực/tiêu cực/trung tính)
- Cache 5 phút để tối ưu hiệu suất
- Chế độ degraded nếu không lấy được context (tiếp tục với context hạn chế)

## API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/health` | Trạng thái sức khoẻ, circuit breaker states |
| GET | `/status` | Thông tin chi tiết service |
| GET | `/metrics` | Metrics hiệu suất LLM providers |
| GET/POST | `/trigger` | Kích hoạt sinh nội dung thủ công |
| GET/POST | `/trigger/:action` | Kích hoạt action cụ thể (post/comment/vote) |
| GET/POST | `/trigger/:action/:label` | Kích hoạt theo provider label (1-10) |

## Cài đặt & Chạy

### Yêu cầu

- Node.js >= 18
- PostgreSQL (dùng chung database với backend)
- Ít nhất 1 LLM API key (Gemini bắt buộc)
- Backend đang chạy (để gọi API)

### Cài đặt

```bash
# Cài đặt dependencies
npm install

# Cấu hình biến môi trường
cp .env.example .env

# Sinh Prisma Client
npm run db:generate

# Seed bot users (lần đầu)
npm run seed:bots

# Seed tags (tuỳ chọn)
npm run seed:tags
```

### Chạy service

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm run start:prod
```

### Scripts

```bash
npm start           # Chạy trực tiếp TypeScript
npm run dev         # Watch mode (tự restart khi thay đổi)
npm run build       # Build TypeScript → JavaScript
npm run start:prod  # Chạy bản build production
npm run db:generate # Sinh Prisma Client
npm run seed:bots   # Tạo bot users với tính cách
npm run seed:tags   # Seed tags
npm run seed:all    # Chạy tất cả seed scripts
npm run lint        # Kiểm tra TypeScript types
```

## Biến môi trường

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `FORUM_API_URL` | ✅ | `http://localhost:5000/api/v1` | URL API diễn đàn |
| `BOT_PASSWORD` | ✅ | — | Mật khẩu chung cho bot users |
| `GEMINI_API_KEY` | ✅ | — | Google Gemini API key |
| `PORT` | ❌ | `4000` | Port HTTP server |
| `NODE_ENV` | ❌ | `development` | Môi trường chạy |
| `LOG_LEVEL` | ❌ | `info` | Mức log (debug/info/warn/error) |
| `LOG_DIR` | ❌ | — | Thư mục lưu log file |
| `CRON_SCHEDULE` | ❌ | `*/30 * * * *` | Lịch cron (mặc định: mỗi 30 phút) |
| `BATCH_SIZE` | ❌ | `1` | Số action mỗi lần chạy |
| `MAX_POSTS_PER_USER_DAY` | ❌ | `3` | Giới hạn bài viết/bot/ngày |
| `MAX_COMMENTS_PER_USER_DAY` | ❌ | `6` | Giới hạn bình luận/bot/ngày |
| `MAX_VOTES_PER_USER_DAY` | ❌ | `15` | Giới hạn vote/bot/ngày |
| `GROQ_API_KEY` | ❌ | — | GROQ API key (fallback) |
| `CEREBRAS_API_KEY` | ❌ | — | Cerebras API key (fallback) |
| `NVIDIA_API_KEY` | ❌ | — | NVIDIA API key (fallback) |
| `BEEKNOEE_API_KEY` | ❌ | — | Beeknoee API key (fallback) |
| `PROVIDER_TIMEOUT_MS` | ❌ | `30000` | Timeout gọi LLM (ms) |

## Prompt Templates

### Bài viết (`prompts/post.template.txt`)
- Hướng dẫn bot viết bài tự nhiên, phong cách diễn đàn
- Tập trung 1-2 ý chính, 100-1500 từ
- Tiếng Việt tự nhiên, tránh phong cách quá formal

### Bình luận (`prompts/comment.template.txt`)
- Bắt buộc tham chiếu cụ thể nội dung bài viết
- Cấm cụm từ chung chung ("bài viết hay", "cảm ơn chia sẻ", ...)
- Anti-generic validation nghiêm ngặt

### Vote (`prompts/vote.template.txt`)
- Cung cấp ngữ cảnh để bot quyết định upvote/downvote

## Distributed Locking

- Sử dụng **PostgreSQL advisory locks** để tránh chạy trùng lặp khi deploy multi-instance
- In-process guard ngăn double-fire trong cùng 1 instance

## Docker

```bash
# Build image
docker build -t vibe-content .

# Chạy container
docker run -p 4000:4000 --env-file .env vibe-content
```
