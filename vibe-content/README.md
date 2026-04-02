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

