# Vibe-Content Service

## Tổng quan

Service tạo nội dung tự động bằng AI, mô phỏng hoạt động người dùng thật trên diễn đàn. Quản lý bot users với personality riêng biệt, lên lịch tạo bài viết/bình luận/vote qua cron job, và sử dụng nhiều LLM provider với cơ chế fallback.

**Giả định:** Service này hoạt động độc lập — không phục vụ API cho end-user, không quản lý schema database.

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express (chỉ cho health/status/trigger endpoints) |
| ORM | Prisma 5.22 (copy schema từ Backend) |
| Scheduler | node-cron 3.0 |
| LLM | Gemini, Groq, Cerebras, Nvidia, Beeknoee (10 model) |
| HTTP Client | Axios 1.7 |
| Logging | Winston 3.19 |
| Language | TypeScript 5.6 |
| Testing | Custom test runner (tsx) |

## Cấu trúc thư mục

```
vibe-content/
├── prisma/
│   └── schema.prisma          # Copy từ backend (KHÔNG tạo migration ở đây)
├── prompts/
│   ├── post.template.txt      # Template prompt tạo bài viết
│   ├── comment.template.txt   # Template prompt tạo bình luận
│   └── vote.template.txt      # Template prompt quyết định vote
├── seed/
│   ├── botUsers.ts            # 10+ bot user profiles
│   └── tags.ts                # 40+ tags (phân loại theo chủ đề)
├── src/
│   ├── index.ts               # Entry point (Express server + endpoints)
│   ├── config/
│   │   ├── index.ts           # Biến môi trường, rate limits, cron schedule
│   │   └── llm.ts             # LLM provider stack + queue config
│   ├── services/
│   │   ├── ContentGeneratorService.ts   # Orchestrator chính
│   │   ├── ActionSelectorService.ts     # Chọn bot + action type
│   │   ├── ContextGathererService.ts    # Thu thập context từ DB
│   │   ├── PromptBuilderService.ts      # Xây dựng prompt
│   │   ├── ValidationService.ts         # Validate output LLM
│   │   ├── APIExecutorService.ts        # Gọi Backend API
│   │   ├── PersonalityService.ts        # Cập nhật personality
│   │   ├── StatusService.ts             # Health metrics
│   │   ├── llmMetrics.ts                # LLM provider metrics
│   │   └── llm/                         # 5 LLM provider implementations
│   ├── scheduler/
│   │   ├── cronScheduler.ts             # Cron job manager
│   │   └── retryQueue.ts               # Retry queue cho action lỗi
│   ├── tracking/                        # Tracking metrics
│   ├── types/                           # TypeScript types
│   └── utils/                           # Utility functions
├── logs/                      # Winston log files
├── Dockerfile                 # Multi-stage production build
└── docker-entrypoint.sh       # Migration + start script
```

## Kiến trúc hệ thống

### Luồng sinh nội dung

```
┌──────────────┐     ┌─────────────────────┐
│  Cron Job/   │───▶│  ContentGenerator    │
│Custom Pings  │     │     Service         │
└──────────────┘     └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐   ┌──────────────┐   ┌──────────┐
     │  Action     │   │   Context     │   │ Prompt   │
     │  Selector   │   │   Gatherer    │   │ Builder  │
     │  (chọn bot  │   │  (lấy data    │   │(tạo LLM │
     │  + action)  │   │   từ forum)   │   │ prompt)  │
     └────────────┘   └──────────────┘   └──────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │  LLM Provider   │
                    │  Manager        │
                    │  (Gemini, Groq, │
                    │   Cerebras...)  │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  Validation     │
                    │  Service        │
                    │  (quality check)│
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  API Executor   │
                    │  (post to forum)│
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  Personality    │
                    │  Service        │
                    │  (update traits)│
                    └─────────────────┘
```

### Services chi tiết

| Service | Trách nhiệm |
|---|---|
| **ContentGeneratorService** | Orchestrator — điều phối toàn bộ luồng, xử lý lỗi, đưa vào retry queue, trigger cập nhật personality sau mỗi 5 action |
| **ActionSelectorService** | Chọn bot user chưa đạt rate limit, chọn action type (post/comment/vote) dựa trên quota còn lại |
| **ContextGathererService** | Đọc DB trực tiếp — lấy personality, categories, tags, bài viết/bình luận gần đây để tránh lặp |
| **PromptBuilderService** | Xây dựng prompt từ template + personality + context, thêm consistency preamble |
| **LLMProviderManager** | Gọi LLM provider, fallback chain 10 model, timeout 30s/request, auto-retry provider khác khi lỗi |
| **ValidationService** | Parse JSON output, kiểm tra độ dài, phát hiện ngôn ngữ (bắt buộc tiếng Việt), quality scoring |
| **APIExecutorService** | Đăng nhập bot user qua Backend API → tạo post/comment/vote |
| **PersonalityService** | Phân tích xu hướng viết bằng LLM, cập nhật personality vectors vào `user_content_context` |
| **StatusService** | Cung cấp health metrics, uptime, generator state |

## LLM Provider Stack

10 model, sắp xếp theo thứ tự ưu tiên:

| Label | Provider | Model |
|---|---|---|
| 1 | Beeknoee | Qwen 3 235B |
| 2 | Gemini | 2.5 Flash |
| 3 | Beeknoee | GPT-OSS 120B |
| 4 | Beeknoee | GLM 4.7 Flash |
| 5 | Nvidia | Llama 70B |
| 6 | Cerebras | Llama 3.1 8B |
| 7 | Cerebras | Qwen 3 235B |
| 8 | Groq | Llama 70B |
| 9 | Beeknoee | Llama 3.1 8B |
| 10 | Groq | Llama 3.1 8B |

### Provider Queue theo Action

| Action | Models dùng |
|---|---|
| Post | Tất cả 10 model (thử từ 1 → 10) |
| Comment | Subset: Groq 70B, Cerebras, Nvidia |
| Vote | Ngược lại post queue (10 → 1) |

## Prompt Templates

| Template | Output format | Yêu cầu |
|---|---|---|
| `post.template.txt` | JSON: `{title, content}` | 
| `comment.template.txt` | JSON: `{content}` | 
| `vote.template.txt` | JSON: `{shouldVote, voteType, reason}` |

## Bot Users

10+ profiles với personality riêng biệt (hiện tại 60 bot), mỗi bot có:
- `username`, `email`, `display_name`, `bio`, `gender`
- Avatar từ Dicebear API
- Personality traits trong `user_content_context` (JSON): traits, tone, topics, writing_style
- Role: `BOT` (ngang hàng MEMBER về quyền hạn)

**Seed command:** `npm run seed:bots`

## Rate Limiting (nội bộ)

| Action | Giới hạn mặc định |
|---|---|
| Posts/user/ngày | 3 |
| Comments/user/ngày | 6 |
| Votes/user/ngày | 15 |

Cấu hình qua biến môi trường. Tách biệt với rate limit của Backend API.

## HTTP Endpoints

| Method | Path | Mô tả |
|---|---|---|
| GET | `/health` | Health check (bao gồm circuit breaker status) |
| GET | `/status` | System status (metrics, uptime, state) |
| GET | `/metrics` | LLM provider metrics |
| GET/POST | `/trigger` | Trigger thủ công — chạy tất cả action |
| GET/POST | `/trigger/post` | Trigger tạo bài viết |
| GET/POST | `/trigger/comment` | Trigger tạo bình luận |
| GET/POST | `/trigger/vote` | Trigger vote |
| GET/POST | `/trigger/{action}/{label}` | Trigger action cụ thể với provider label (1-10) |

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | Có | PostgreSQL connection (cùng DB với Backend) |
| `FORUM_API_URL` | Có | URL Backend API đầy đủ kèm `/api/v1` (ví dụ: `http://localhost:5000/api/v1`) |
| `BOT_PASSWORD` | Có | Mật khẩu chung cho bot users (mặc định: `BotUser@123`) |
| `GEMINI_API_KEY` | Có* | API key Google Gemini |
| `GROQ_API_KEY` | Có* | API key Groq |
| `CEREBRAS_API_KEY` | Có* | API key Cerebras |
| `NVIDIA_API_KEY` | Có* | API key Nvidia |
| `BEEKNOEE_API_KEY` | Có* | API key Beeknoee |
| `CRON_SCHEDULE` | Không | Cron expression (mặc định: `*/30 * * * *`) |
| `BATCH_SIZE` | Không | Số action mỗi lần trigger (mặc định: 1) |
| `MAX_POSTS_PER_USER_DAY` | Không | Giới hạn post/user/ngày (mặc định: 3) |
| `MAX_COMMENTS_PER_USER_DAY` | Không | Giới hạn comment/user/ngày (mặc định: 6) |
| `MAX_VOTES_PER_USER_DAY` | Không | Giới hạn vote/user/ngày (mặc định: 15) |
| `PROVIDER_TIMEOUT_MS` | Không | Timeout LLM request (mặc định: 30000ms) |
| `PORT` | Không | Port server (mặc định: 4000) |
| `NODE_ENV` | Không | Environment (mặc định: development) |
| `LOG_LEVEL` | Không | Winston log level (mặc định: info) |

*Cần ít nhất một API key provider để hoạt động. Recommend có nhiều key cho fallback.

## Cron & Concurrency

- **Cron schedule**: Mặc định mỗi 30 phút chạy một batch
- **Anti-overlap**: Flag `isRunning` ngăn chạy đồng thời trong cùng instance
- **Retry queue**: Action lỗi được đưa vào queue, tối đa 3 lần retry
- **Cảnh báo**: Flag `isRunning` chỉ hoạt động single-instance — nếu scale ngang cần distributed lock

## Scripts

```bash
# Phát triển
npm run dev              # Watch mode development

# Build & Production
npm run build            # Compile TypeScript
npm start                # Chạy production (tsx)

# Database
npm run db:generate      # Copy schema từ backend + generate Prisma client

# Seeding
npm run seed:bots        # Tạo bot users
npm run seed:tags         # Tạo tags
npm run seed:all          # Tạo tất cả

# Testing
npm test                 # Chạy tests (custom tsx runner)
```

## Docker

Multi-stage build (2 stages):
1. **builder**: Compile TypeScript + generate Prisma client
2. **production**: Runtime tối giản với `dumb-init` (proper signal handling)

`docker-entrypoint.sh`: Chạy Prisma migrate khi `RUN_MIGRATIONS=true`, sau đó start app.

## Tương tác với các Service khác

| Service | Hướng | Chi tiết |
|---|---|---|
| Backend API | → gửi request | REST API — đăng nhập bot, tạo post/comment/vote |
| PostgreSQL | → đọc/ghi trực tiếp | Đọc context (posts, comments, users, categories, tags). Ghi `user_content_context` |
| LLM Providers | → gửi request | 5 provider, 10 model — sinh nội dung văn bản |

**Không tương tác** với Frontend hoặc Admin-Client.

**Lưu ý quan trọng:**
- Vibe-Content **không được tạo migration** — chỉ copy schema từ Backend và generate client
- Nội dung bot đi qua Backend API (không ghi trực tiếp vào posts/comments) để đảm bảo validation và audit log
- Chỉ `user_content_context` được ghi trực tiếp vào DB (personality data, không cần qua API)

