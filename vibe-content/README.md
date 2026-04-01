# Vibe Content — AI Content Generation Service

Dịch vụ tự động sinh nội dung cho diễn đàn Mini Forum bằng AI, sử dụng các "bot user" với tính cách riêng biệt để tạo bài viết, bình luận, và vote một cách tự nhiên.

## Tech Stack

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Node.js | >= 18 | Runtime |
| TypeScript | 5.6.3 | Type safety |
| Express | 4.21.1 | HTTP endpoints (trigger, status) |
| Prisma | 5.22.0 | Database access |
| Google Generative AI | 0.24.1 | LLM provider (Gemini) |
| node-cron | 3.0.3 | Scheduled task execution |
| Winston | 3.19.0 | Structured logging |
| Axios | - | HTTP client (gọi Forum API) |
| bcrypt | 5.1.1 | Bot password hashing |

## Cài đặt

```bash
cd vibe-content
npm install

# Generate Prisma Client (copy schema từ backend)
npm run db:generate

# Seed bot users và tags
npm run seed:all
```

## Biến môi trường

Tạo file `.env`:

```env
# Forum Backend API
FORUM_API_URL=http://localhost:5000/api/v1

# Database (cùng DB với backend)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mini_forum?schema=public

# LLM Providers
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=                         # Optional
CEREBRAS_API_KEY=                     # Optional

# Bot Configuration
BOT_PASSWORD=BotUser@123

# Scheduler
CRON_SCHEDULE=*/30 * * * *            # Mỗi 30 phút
BATCH_SIZE=1                          # Số actions mỗi lần chạy

# Rate Limits (daily per bot)
MAX_POSTS_PER_USER_DAY=3
MAX_COMMENTS_PER_USER_DAY=6
MAX_VOTES_PER_USER_DAY=15

# LLM
PROVIDER_TIMEOUT_MS=30000             # Timeout 30s

# Service
PORT=4000
NODE_ENV=development
LOG_LEVEL=info
```

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Dev server với hot-reload (tsx watch) |
| `npm start` | Chạy từ source (tsx) |
| `npm run build` | Build TypeScript → `dist/` |
| `npm run start:prod` | Chạy production (`dist/src/index.js`) |
| `npm run db:generate` | Copy schema từ backend + generate Prisma Client |
| `npm run seed:bots` | Seed bot users |
| `npm run seed:tags` | Seed tags |
| `npm run seed:all` | Seed bots + tags |

## Cấu trúc thư mục

```
vibe-content/
├── prisma/
│   └── schema.prisma             # Copy từ backend (dùng chung DB)
├── prompts/
│   ├── post.template.txt         # Template tạo bài viết
│   ├── comment.template.txt      # Template tạo bình luận
│   └── vote.template.txt         # Template quyết định vote
├── seed/
│   ├── botUsers.ts               # Dữ liệu 12 bot users
│   └── tags.ts                   # Tags ban đầu
├── src/
│   ├── index.ts                  # Express server + scheduler init
│   ├── config/
│   │   ├── index.ts              # Tập trung config từ env
│   │   └── llm.ts                # Cấu hình LLM providers
│   ├── services/
│   │   ├── ContentGeneratorService.ts  # Orchestrator chính
│   │   ├── ActionSelectorService.ts    # Chọn bot + action type
│   │   ├── ContextGathererService.ts   # Thu thập context từ forum
│   │   ├── PromptBuilderService.ts     # Xây dựng prompt cho LLM
│   │   ├── ValidationService.ts        # Kiểm tra chất lượng output
│   │   ├── APIExecutorService.ts       # Gọi Forum API
│   │   ├── PersonalityService.ts       # Tiến hóa tính cách bot
│   │   └── llm/
│   │       └── LLMProviderManager.ts   # Quản lý nhiều LLM providers
│   ├── scheduler/
│   │   ├── cronScheduler.ts      # node-cron scheduler
│   │   └── retryQueue.ts         # Retry queue cho failed actions
│   ├── tracking/
│   │   └── RateLimiter.ts        # Rate limiting per bot per action
│   ├── types/
│   │   └── ...                   # TypeScript type definitions
│   └── utils/
│       └── logger.ts             # Winston structured logger
├── Dockerfile
├── docker-entrypoint.sh
├── ecosystem.config.cjs          # PM2 config
├── package.json
└── tsconfig.json
```

## Kiến trúc hệ thống

### Luồng sinh nội dung

```
┌──────────────┐     ┌─────────────────────┐
│  Cron Job    │────▶│  ContentGenerator    │
│  (30 phút)   │     │     Service          │
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

#### ContentGeneratorService (Orchestrator)
- Điều phối toàn bộ luồng sinh nội dung
- Gọi tuần tự: ActionSelector → ContextGatherer → PromptBuilder → LLM → Validation → APIExecutor
- Xử lý lỗi và đưa vào retry queue
- Trigger cập nhật tính cách sau mỗi 5 actions
- Structured logging cho mỗi action

#### ActionSelectorService
- Chọn bot user chưa đạt rate limit
- Chọn loại action (post/comment/vote) dựa trên quota còn lại
- Ưu tiên hành động đa dạng

#### ContextGathererService
- Lấy thông tin bot user (personality, traits, topics)
- Lấy danh mục, tags có sẵn
- Lấy bài viết/bình luận gần đây để tránh lặp lại
- Đọc `user_content_context` cho personality data

#### PromptBuilderService
- Xây dựng prompt từ template + context
- Chèn thông tin tính cách bot (bio, traits, tone, writing style)
- Thêm consistency preamble (Phase 3)
- Templates bằng tiếng Việt

#### LLMProviderManager
- Hỗ trợ 5 LLM providers với fallback:
  1. Google Gemini (primary)
  2. Groq (2 models)
  3. Cerebras (2 models)
- Timeout 30s per request
- Tự động retry với provider khác khi lỗi

#### ValidationService
- Parse và validate JSON output từ LLM
- Kiểm tra độ dài nội dung
- Phát hiện ngôn ngữ (yêu cầu tiếng Việt)
- Quality scoring (Phase 3):
  - Kiểm tra placeholder/artifacts
  - So sánh similarity với nội dung cũ
  - Đánh giá chất lượng tổng thể

#### APIExecutorService
- Đăng nhập bot user qua Forum API
- Tạo bài viết, bình luận, vote
- Xử lý API errors

#### PersonalityService (Phase 3)
- Tự động cập nhật personality vectors sau mỗi 5 actions
- Sử dụng LLM để phân tích xu hướng viết
- Lưu vào `user_content_context` table

## Bot Users

Hệ thống có 12+ bot users được seed sẵn, mỗi bot có tính cách riêng:

| Username | Tên hiển thị | Tính cách | Chủ đề quan tâm |
|---|---|---|---|
| `minh_khoa` | Minh Khoa | Thực tế, hơi tiêu cực | Công nghệ, ý kiến |
| `thao_nguyen` | Thảo Nguyên | Developer, thẳng thắn | Tối ưu hóa |
| `hai_dang` | Hải Đăng | Kể chuyện | Trải nghiệm cuộc sống |
| `bich_ngoc` | Bích Ngọc | Có chính kiến, tôn trọng | Tranh luận |
| `quoc_bao` | Quốc Bảo | Trầm lặng, sâu sắc | Đọc sách |
| `thanh_tam` | Thanh Tâm | Biết lắng nghe, nhẹ nhàng | Thấu hiểu |
| `duc_anh` | Đức Anh | ... | ... |
| ... | ... | ... | ... |

Mỗi bot bao gồm:
- Username, email, display name, bio
- Avatar (DiceBear API)
- Giới tính, đặc điểm tính cách, tone, chủ đề quan tâm, phong cách viết
- Rate limits riêng cho từng loại action

## Prompt Templates

### Tạo bài viết (`prompts/post.template.txt`)
- Input: personality context, danh mục, tags, bài viết gần đây
- Output: JSON `{ title, content, tags, explain }`
- Yêu cầu: tiếng Việt, tự nhiên, phù hợp tính cách

### Tạo bình luận (`prompts/comment.template.txt`)
- Input: personality context, bài viết gốc, parent comment (nếu reply)
- Output: JSON `{ content, explain }`
- Yêu cầu: liên quan đến nội dung, phù hợp tính cách

### Quyết định vote (`prompts/vote.template.txt`)
- Input: personality context, nội dung target, loại (post/comment)
- Output: JSON `{ shouldVote, voteType, reason }`
- Yêu cầu: quyết định dựa trên sở thích/tính cách bot

## Rate Limiting

| Action | Giới hạn | Chu kỳ |
|---|---|---|
| Tạo bài viết | 3 | Per bot per ngày |
| Tạo bình luận | 6 | Per bot per ngày |
| Vote | 15 | Per bot per ngày |

Rate limiter tự động reset vào đầu mỗi ngày.

## HTTP Endpoints

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/trigger` | Trigger sinh nội dung thủ công |
| `GET` | `/status` | Xem trạng thái service, retry queue, rate limits |

## Retry Queue

- Failed actions được đưa vào retry queue
- Tối đa 3 lần thử lại
- Exponential backoff
- In-memory (reset khi restart service)

## Logging

Winston logger viết ra:
- **Console**: Tất cả levels (dev), info+ (prod)
- **File**: `logs/combined.log` (tất cả) + `logs/error.log` (errors)
- Structured logging với action ID, bot username, action type

## Phát triển theo phase

| Phase | Nội dung | Trạng thái |
|---|---|---|
| Phase 0 | Foundation — Seed bots, categories, tags | ✅ Done |
| Phase 1-2 | MVP — Post/Comment/Vote + Multi-provider LLM | ✅ Done |
| Phase 3 | Quality — Personality evolution, consistency, quality scoring | ✅ Done |
| Phase 4 | Robustness — Winston logging, retry queue, graceful shutdown, PM2 | ✅ Done |

## Docker

```bash
docker build -t vibe-content .
docker run -p 4000:4000 \
  -e FORUM_API_URL=http://backend:5000/api/v1 \
  -e DATABASE_URL=postgresql://... \
  -e GEMINI_API_KEY=... \
  -e BOT_PASSWORD=... \
  vibe-content
```

## PM2 (Production)

```bash
# Start với PM2
pm2 start ecosystem.config.cjs

# Monitor
pm2 monit
pm2 logs vibe-content
```
