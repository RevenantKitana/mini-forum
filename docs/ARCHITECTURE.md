# Architecture — Mini Forum

## Tổng quan hệ thống

Mini Forum là hệ thống diễn đàn cộng đồng tiếng Việt, được thiết kế theo kiến trúc **monorepo** gồm 4 sub-project độc lập giao tiếp qua REST API.

```
                    ┌─────────────────────────────────────────────┐
                    │              Internet / CDN                  │
                    └────────┬──────────────┬─────────────────────┘
                             │              │
                    ┌────────▼───────┐   ┌──▼─────────────┐
                    │   Frontend     │   │  Admin Client   │
                    │   (React SPA)  │   │  (React SPA)    │
                    │   Vercel       │   │  Vercel          │
                    │   :5173        │   │  :5174           │
                    └────────┬───────┘   └──┬──────────────┘
                             │              │
                             ▼              ▼
                    ┌───────────────────────────────┐
                    │        Backend API             │
                    │     (Express + TypeScript)     │
                    │         :5000                  │
                    │                               │
                    │  ┌─────────┐  ┌────────────┐  │
                    │  │ Routes  │──│Controllers │  │
                    │  └─────────┘  └─────┬──────┘  │
                    │                     │         │
                    │  ┌──────────────────▼───────┐ │
                    │  │      Services            │ │
                    │  │   (Business Logic)       │ │
                    │  └──────────┬───────────────┘ │
                    │             │                 │
                    │  ┌──────────▼───────────────┐ │
                    │  │    Prisma ORM             │ │
                    │  └──────────┬───────────────┘ │
                    └─────────────┼─────────────────┘
                                  │
                    ┌─────────────▼─────────────────┐
                    │       PostgreSQL Database      │
                    │     (Single shared instance)   │
                    └─────────────▲─────────────────┘
                                  │
                    ┌─────────────┼─────────────────┐
                    │    Vibe Content Service        │
                    │   (Bot Content Generator)     │
                    │         :4000                  │
                    │                               │
                    │  ┌──────────┐  ┌───────────┐  │
                    │  │Scheduler │──│ Content   │  │
                    │  │(node-cron│  │ Generator │  │
                    │  └──────────┘  └─────┬─────┘  │
                    │                      │        │
                    │  ┌───────────────────▼──────┐ │
                    │  │   LLM Provider Manager   │ │
                    │  │  (Gemini, Groq, Cerebras)│ │
                    │  └──────────────────────────┘ │
                    └───────────────────────────────┘
```

## Design Patterns & Nguyên tắc thiết kế

### Backend

#### Layered Architecture (Kiến trúc phân tầng)

```
┌─────────────────────────────────────┐
│  Presentation Layer (Routes)        │  Định nghĩa endpoints, middleware chains
├─────────────────────────────────────┤
│  Controller Layer                   │  Extract params, gọi service, format response
├─────────────────────────────────────┤
│  Service Layer                      │  Business logic, validation, data orchestration
├─────────────────────────────────────┤
│  Data Access Layer (Prisma)         │  Database queries, transactions
├─────────────────────────────────────┤
│  Database (PostgreSQL)              │  Data persistence
└─────────────────────────────────────┘
```

- **Routes**: Chỉ chứa khai báo endpoints và middleware chains
- **Controllers**: Thin controllers — extract request data, gọi service, trả response
- **Services**: Chứa toàn bộ business logic, query database qua Prisma
- **Middlewares**: Cross-cutting concerns (auth, validation, rate limiting, error handling)

#### Middleware Pipeline

Thứ tự middleware trong Express app:

```
1. Helmet             → Security headers
2. CORS               → Cross-origin config  
3. Morgan             → Request logging
4. Rate Limiter       → API rate limiting
5. Body Parser        → JSON parsing
6. Routes             → API endpoints
7. Not Found Handler  → 404 responses
8. Error Handler      → Global error catching
```

#### Validation Strategy

- **Input validation**: Zod schemas tại middleware layer
- **Business validation**: Tại service layer
- **Database constraints**: Tại Prisma schema

### Frontend (React)

#### State Management

```
┌──────────────────────────────────────┐
│  React Query (TanStack)             │  Server state (API data)
│  - 5 min stale time                 │
│  - 1 retry                          │
│  - No window focus refetch          │
├──────────────────────────────────────┤
│  React Context                       │  Client state
│  - AuthContext (user auth)           │
│  - SidebarContext (UI state)         │
│  - FontSizeContext (accessibility)   │
│  - GlobalLoadingContext (UI state)   │
├──────────────────────────────────────┤
│  Component Local State               │  UI-specific state
│  - useState, useReducer             │
└──────────────────────────────────────┘
```

#### Component Architecture

```
App.tsx
├── Providers (QueryClient, Auth, Sidebar, FontSize, Loading)
│   └── Router
│       ├── MainLayout (Header + Sidebars + Footer)
│       │   ├── Public Pages
│       │   └── Protected Pages (PrivateRoute guard)
│       └── Auth Pages (no layout)
```

#### API Layer

```
src/api/
├── axios.ts          # Axios instance
│   ├── Base URL from env
│   ├── Request interceptor (attach JWT)
│   └── Response interceptor (refresh token on 401)
├── endpoints.ts      # Endpoint constants
└── services/         # API service functions
    ├── authService.ts
    ├── postService.ts
    ├── commentService.ts
    └── ...
```

### Vibe Content (Bot Service)

#### Pipeline Architecture

```
Cron Trigger (every 30 min)
    │
    ▼
ActionSelectorService ──── Chọn bot + action type
    │                       (respects rate limits)
    ▼
ContextGathererService ─── Lấy forum data
    │                       (categories, tags, posts, personality)
    ▼
PromptBuilderService ───── Xây prompt từ template + context
    │
    ▼
LLMProviderManager ─────── Gọi AI provider (with fallback)
    │
    ▼
ValidationService ──────── Validate output quality
    │
    ▼
APIExecutorService ─────── Post content to forum
    │
    ▼
PersonalityService ─────── Update bot personality (every 5 actions)
```

#### Multi-Provider LLM

```
LLMProviderManager
├── Provider 1: Google Gemini (Primary)
├── Provider 2: Groq Model A
├── Provider 3: Groq Model B
├── Provider 4: Cerebras Model A
└── Provider 5: Cerebras Model B

Fallback: Provider 1 fail → Provider 2 → Provider 3 → ...
Timeout: 30s per request
```

## Giao tiếp giữa các services

### Frontend ↔ Backend

```
Frontend ──HTTP/REST──▶ Backend API (:5000)
           │
           ├── Authorization: Bearer <JWT>
           ├── Content-Type: application/json
           └── Auto-refresh token on 401
```

### Vibe Content ↔ Backend

```
Vibe Content ──HTTP/REST──▶ Backend API (:5000)
                │
                ├── Login as bot user → get JWT
                ├── Create posts/comments via API
                └── Vote on content via API
```

### Vibe Content ↔ Database

```
Vibe Content ──Prisma──▶ PostgreSQL (shared DB)
                │
                ├── Read: user_content_context
                ├── Write: user_content_context
                └── Read: users (bot users)
```

## Authentication Flow

### Đăng ký (Register)

```
Client                    Backend                   Email Service
  │                         │                          │
  ├──send-otp-register────▶│                          │
  │                         ├──Generate OTP──────────▶│──Send email──▶User
  │                         ├──Store OTP (memory)     │
  │◀──────────────OK────────┤                          │
  │                         │                          │
  ├──verify-otp-register──▶│                          │
  │                         ├──Verify OTP             │
  │◀──────────────OK────────┤                          │
  │                         │                          │
  ├──register─────────────▶│                          │
  │                         ├──Create user             │
  │                         ├──Generate JWT pair        │
  │◀──tokens + user────────┤                          │
```

### Đăng nhập (Login)

```
Client                    Backend
  │                         │
  ├──POST /login──────────▶│
  │  { email, password }    ├──Find user by email
  │                         ├──Verify password (bcrypt)
  │                         ├──Generate access token (15m)
  │                         ├──Generate refresh token (7d)
  │                         ├──Store refresh token in DB
  │◀──{ accessToken,────────┤
  │    refreshToken, user } │
```

### Token Refresh

```
Client                    Backend
  │                         │
  ├──API call──────────────▶│
  │  (expired token)        ├──401 Unauthorized
  │◀────────────401─────────┤
  │                         │
  ├──POST /refresh─────────▶│
  │  { refreshToken }       ├──Verify refresh token
  │                         ├──Generate new access token
  │                         ├──Generate new refresh token
  │                         ├──Replace old in DB
  │◀──{ accessToken,────────┤
  │    refreshToken }       │
  │                         │
  ├──Retry original call──▶│
  │  (new token)            ├──200 OK
  │◀────────────────────────┤
```

## Error Handling

### Backend Error Flow

```
Service throws error
    │
    ▼
Controller catches (or not)
    │
    ▼
errorMiddleware catches
    │
    ├── AppError (known) → status code + message
    ├── ValidationError → 400 + details
    ├── AuthError → 401/403
    └── Unknown → 500 + generic message (no stack in prod)
```

### Custom Error Classes

| Class | HTTP Status | Sử dụng |
|---|---|---|
| `AppError` | Tùy chỉnh | Base error class |
| `NotFoundError` | 404 | Resource không tìm thấy |
| `UnauthorizedError` | 401 | Chưa xác thực |
| `ForbiddenError` | 403 | Không có quyền |
| `ValidationError` | 400 | Input không hợp lệ |
| `ConflictError` | 409 | Xung đột (duplicate) |

### Frontend Error Handling

- Axios interceptor bắt 401 → tự refresh token
- React Query retry: 1 lần
- Toast notifications (Sonner) cho user-facing errors
- Global error boundary cho critical errors

## Security

### Measures

| Layer | Biện pháp |
|---|---|
| Transport | HTTPS (production) |
| Headers | Helmet (X-Content-Type, HSTS, XSS Protection, etc.) |
| CORS | Whitelist frontend URLs only |
| Authentication | JWT with short-lived access tokens |
| Password | bcrypt 12-round salt |
| Input | Zod validation tại middleware |
| Rate Limiting | express-rate-limit per endpoint group |
| SQL Injection | Prisma parameterized queries |
| XSS | React auto-escaping + Helmet |

### Rate Limiting Strategy

```
express-rate-limit
├── Global: 300 req / 15 min
├── Auth: 10 req / 15 min
├── Content creation: 5 req / 1 min
├── Voting: 30 req / 1 min
├── OTP send: 3 req / 5 min
├── OTP verify: 10 req / 10 min
└── Search: 30 req / 1 min
```

## Testing Strategy

| Layer | Framework | Approach |
|---|---|---|
| Backend Unit | Jest | Service/utility functions |
| Backend Integration | Jest + Supertest | API endpoint testing |
| Frontend Unit | Vitest + React Testing Library | Component testing |
| E2E | Playwright | Full user flow testing |

### E2E Testing (Playwright)

```
playwright.config.ts
├── Browsers: Chromium, Firefox, WebKit
├── Mobile: Pixel 5, iPhone 12
├── Base URL: http://localhost:5173
├── Retries: 2 on CI
├── Artifacts: screenshot + video on failure
└── Trace: on first retry
```

## Scalability Considerations

### Hiện tại (Single Server)

```
1 Server
├── Backend API (:5000)
├── PostgreSQL (:5432)
├── Vibe Content (:4000)
└── Frontend/Admin (Vercel CDN)
```

### Có thể mở rộng

| Component | Chiến lược mở rộng |
|---|---|
| Backend API | Horizontal scaling (multiple instances) + load balancer |
| Database | Read replicas, connection pooling |
| Frontend/Admin | CDN (Vercel) — đã sẵn sàng |
| Vibe Content | Single instance (rate-limited by design) |
| Search | Chuyển sang Elasticsearch/Meilisearch |
| Cache | Redis cho sessions, rate limiting, queries |
| File Storage | S3/Cloudflare R2 cho avatars, media |
