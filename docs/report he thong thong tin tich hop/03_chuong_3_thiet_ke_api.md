# CHƯƠNG 3 — THIẾT KẾ API VÀ GIAO TIẾP LIÊN SERVICE

---

## 3.1 Nguyên tắc thiết kế REST API

API của MINI-FORUM tuân theo 5 nguyên tắc REST cốt lõi, đảm bảo tính nhất quán và dễ dự đoán cho mọi client:

**Bảng 3.1 — Nguyên tắc REST API và cách áp dụng**

| Nguyên tắc | Quy tắc | Ví dụ trong codebase |
|-----------|---------|---------------------|
| **Resource-based URL** | URL đặt tên theo danh từ, không phải động từ | `/posts`, `/users/:id`, `/comments/:id` |
| **HTTP Verbs đúng ngữ nghĩa** | GET (đọc), POST (tạo), PATCH (cập nhật một phần), DELETE (xóa) | `PATCH /posts/:id` — cập nhật title/content |
| **Stateless** | Mỗi request tự mang đủ thông tin xác thực | `Authorization: Bearer {JWT}` trên mọi request bảo vệ |
| **Response nhất quán** | Thành công: `{ data: ... }`, Lỗi: `{ error: string, details?: object }` | Xử lý tập trung bởi `errorMiddleware` |
| **Pagination chuẩn** | Query params `?page=1&limit=20` cho danh sách | `GET /posts?page=2&limit=10&categoryId=3` |

### Cấu trúc URL

```
Base URL: /api/v1

Danh sách resource:
  GET    /api/v1/posts
  POST   /api/v1/posts

Tài nguyên cụ thể:
  GET    /api/v1/posts/:id
  PATCH  /api/v1/posts/:id
  DELETE /api/v1/posts/:id

Nested resource:
  GET    /api/v1/posts/:postId/comments
  POST   /api/v1/posts/:postId/comments

Actions trên resource:
  POST   /api/v1/posts/:id/vote
  POST   /api/v1/posts/:id/bookmark
  POST   /api/v1/posts/:id/pin

User-specific:
  GET    /api/v1/users/:username/posts
  GET    /api/v1/users/me/bookmarks
  GET    /api/v1/users/me/votes
```

---

## 3.2 Bản đồ API Routes — 15 nhóm route

Tất cả route được đăng ký trong `backend/src/routes/index.ts`, chia thành **15 file route** theo domain:

### 3.2.1 Auth Routes — `/api/v1/auth`

| Method | Endpoint | Mô tả | Middleware |
|--------|----------|-------|-----------|
| POST | `/auth/register` | Đăng ký tài khoản | validate(registerSchema) |
| POST | `/auth/login` | Đăng nhập, trả JWT | authLimiter, validate(loginSchema) |
| POST | `/auth/logout` | Đăng xuất, xóa refresh token | authMiddleware |
| POST | `/auth/refresh` | Làm mới access token | — |
| POST | `/auth/forgot-password` | Gửi OTP qua email | authLimiter |
| POST | `/auth/reset-password` | Đặt lại mật khẩu bằng OTP | authLimiter |
| GET  | `/auth/me` | Lấy thông tin user hiện tại | authMiddleware |

### 3.2.2 Post Routes — `/api/v1/posts`

| Method | Endpoint | Mô tả | Middleware |
|--------|----------|-------|-----------|
| GET | `/posts` | Danh sách bài viết, filter, sort | — |
| POST | `/posts` | Tạo bài viết mới | authMiddleware, createContentLimiter |
| GET | `/posts/:id` | Chi tiết bài viết | — |
| PATCH | `/posts/:id` | Cập nhật bài viết | authMiddleware |
| DELETE | `/posts/:id` | Xóa bài viết | authMiddleware |
| PATCH | `/posts/:id/pin` | Ghim/bỏ ghim | authMiddleware, roleMiddleware(ADMIN) |
| PATCH | `/posts/:id/lock` | Khóa/mở khóa bình luận | authMiddleware, roleMiddleware(MODERATOR) |
| POST | `/posts/:id/vote` | Vote bài viết | authMiddleware |
| POST | `/posts/:id/bookmark` | Bookmark bài viết | authMiddleware |
| GET  | `/posts/:postId/comments` | Danh sách bình luận | — |
| POST | `/posts/:postId/comments` | Tạo bình luận | authMiddleware, createContentLimiter |

### 3.2.3 Comment Routes — `/api/v1/comments`

| Method | Endpoint | Mô tả | Middleware |
|--------|----------|-------|-----------|
| PATCH | `/comments/:id` | Chỉnh sửa bình luận (trong giới hạn thời gian) | authMiddleware |
| DELETE | `/comments/:id` | Xóa bình luận | authMiddleware |
| POST | `/comments/:id/vote` | Vote bình luận | authMiddleware |

### 3.2.4 User Routes — `/api/v1/users`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/users/me` | Profile của mình |
| PATCH | `/users/me` | Cập nhật profile |
| POST | `/users/me/avatar` | Upload avatar |
| DELETE | `/users/me/avatar` | Xóa avatar |
| GET | `/users/:username` | Profile người dùng khác |
| GET | `/users/:username/posts` | Bài viết của user |
| GET | `/users/me/bookmarks` | Bookmark của mình |
| GET | `/users/me/votes` | Lịch sử vote |

### 3.2.5 Admin Routes — `/api/v1/admin`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/admin/users` | Danh sách user + filter | ADMIN |
| PATCH | `/admin/users/:id/role` | Thay đổi role user | ADMIN |
| PATCH | `/admin/users/:id/status` | Kích hoạt/vô hiệu hóa | ADMIN |
| GET | `/admin/metrics` | HTTP metrics dashboard | ADMIN |
| GET | `/admin/audit-logs` | Nhật ký hành động | ADMIN |
| GET | `/admin/reports` | Danh sách báo cáo vi phạm | MODERATOR |
| PATCH | `/admin/reports/:id` | Xử lý báo cáo | MODERATOR |

### 3.2.6 Các route khác

| Prefix | File | Chức năng chính |
|--------|------|----------------|
| `/categories` | categoryRoutes.ts | CRUD danh mục, thống kê |
| `/tags` | tagRoutes.ts | CRUD nhãn, bài viết theo tag |
| `/search` | searchRoutes.ts | Full-text search |
| `/notifications` | notificationRoutes.ts | Đọc, mark as read, SSE stream |
| `/config` | configRoutes.ts | Đọc/ghi cấu hình động |
| `/blocks` | blockReportRoutes.ts | Chặn/bỏ chặn người dùng |
| `/reports` | blockReportRoutes.ts | Báo cáo vi phạm |

---

## 3.3 Luồng xác thực — Token Exchange

MINI-FORUM sử dụng cơ chế **JWT dual-token** với Access Token và Refresh Token để cân bằng giữa security và UX:

- **Access Token:** Tồn tại ngắn (15 phút), gửi qua `Authorization: Bearer` header
- **Refresh Token:** Tồn tại dài (7 ngày), lưu trong `httpOnly cookie` + ghi vào DB (cho phép revoke)

**Hình 3.1 — Sequence Diagram: Authentication Flow**

```
┌──────────┐              ┌────────────────┐            ┌──────────────┐
│  Client  │              │  Backend API   │            │  PostgreSQL  │
│(Browser) │              │  :5000         │            │              │
└────┬─────┘              └───────┬────────┘            └──────┬───────┘
     │                            │                            │
     │ ═══════ BƯỚC 1: ĐĂNG NHẬP ══════════════════════════════════
     │                            │                            │
     │─── POST /auth/login ──────►│                            │
     │  { email, password }       │                            │
     │                            │─── SELECT users WHERE ────►│
     │                            │    email = ?               │
     │                            │◄─── { user } ─────────────│
     │                            │                            │
     │                            │ bcrypt.compare(password,   │
     │                            │   user.password_hash)      │
     │                            │                            │
     │                            │─── INSERT refresh_tokens ─►│
     │                            │    { token, user_id,       │
     │                            │      expires_at: +7d }     │
     │◄── 200 { accessToken } ───│                            │
     │    Set-Cookie: refresh     │                            │
     │    Token (httpOnly, 7d)    │                            │
     │                            │                            │
     │ ═══════ BƯỚC 2: GỬI REQUEST ĐÃ XÁC THỰC ═══════════════
     │                            │                            │
     │─── GET /posts ────────────►│                            │
     │  Authorization: Bearer     │ authMiddleware:            │
     │  {accessToken}             │ jwt.verify(token, SECRET)  │
     │                            │ → req.user = { id, role }  │
     │◄── 200 { posts: [...] } ──│                            │
     │                            │                            │
     │ ═══════ BƯỚC 3: LÀM MỚI TOKEN (sau 15 phút) ═══════════
     │                            │                            │
     │─── POST /auth/refresh ────►│                            │
     │   Cookie: refreshToken     │                            │
     │                            │─── SELECT refresh_tokens ─►│
     │                            │    WHERE token = ?         │
     │                            │    AND expires_at > NOW()  │
     │                            │◄─── { valid: true } ──────│
     │                            │                            │
     │◄── 200 { accessToken } ───│ jwt.sign({ userId, role }, │
     │                            │   SECRET, { exp: '15m' })  │
     │                            │                            │
     │ ═══════ BƯỚC 4: ĐĂNG XUẤT ═══════════════════════════════
     │                            │                            │
     │─── POST /auth/logout ─────►│                            │
     │   Authorization: Bearer    │─── DELETE refresh_tokens ─►│
     │                            │    WHERE token = ?         │
     │◄── 200 { success } ───────│                            │
     │   Clear-Cookie: refresh    │                            │
└────┴─────┘              └───────┴────────┘            └──────┴───────┘
```

### Lý do thiết kế httpOnly cookie cho Refresh Token

| Phương án | Lưu nơi | XSS risk | CSRF risk |
|-----------|---------|----------|-----------|
| localStorage | Browser | **Cao** (JS có thể đọc) | Thấp |
| sessionStorage | Browser | **Cao** | Thấp |
| **httpOnly cookie** *(lựa chọn)* | Browser (JS không đọc được) | **Không** | Có (cần CSRF token nếu cần) |

MINI-FORUM dùng `httpOnly cookie` cho refresh token — JavaScript không thể đọc được, bảo vệ khỏi XSS.

---

## 3.4 Ma trận giao tiếp liên service

**Bảng 3.2 — Ma trận giao tiếp đầy đủ giữa các thành phần**

| Source | Target | Giao thức | Xác thực | Hướng | Mục đích |
|--------|--------|----------|---------|-------|---------|
| `frontend` | `backend` | HTTPS/REST | JWT Bearer | Request/Response | Mọi tương tác người dùng |
| `admin-client` | `backend` | HTTPS/REST | JWT Bearer | Request/Response | Quản trị hệ thống |
| `vibe-content` | `backend` | HTTP/REST | JWT Bearer (bot user) | Request only | Thực thi hành động AI |
| `vibe-content` | PostgreSQL | Prisma/TCP | DATABASE_URL | Read only | Thu thập context |
| `backend` | PostgreSQL | Prisma/TCP | DATABASE_URL | Read/Write | Toàn bộ data access |
| `backend` | Brevo API | HTTPS/REST | API Key | Outbound | Gửi email OTP, xác nhận |
| `backend` | ImageKit | HTTPS/REST | API Key + Signed URL | Outbound | Upload/delete ảnh |
| `frontend` | `backend` (SSE) | HTTP/SSE | JWT in query param | Server push | Nhận notification realtime |

### Chi tiết kết nối SSE

Server-Sent Events được dùng cho thông báo real-time một chiều:

```
Client                              Backend
  │                                    │
  │─── GET /api/v1/notifications/stream ──►│
  │   ?token={accessToken}            │
  │                                    │ sseService.addConnection(userId, res)
  │◄── HTTP/1.1 200 OK ──────────────│
  │    Content-Type: text/event-stream │
  │    Connection: keep-alive          │
  │                                    │
  │◄── data: {"type":"NEW_COMMENT",───│ Khi có notification mới:
  │          "title":"..."}           │ notificationService tạo record
  │    \n\n                           │ sseService.sendToUser(userId, data)
  │                                    │
  │◄── data: {"type":"NEW_VOTE",...}──│
  │    \n\n                           │
  │                                    │
  │  [Client đóng tab / disconnect]    │
  │─── (close connection) ───────────►│ sseService.removeConnection(userId)
  │                                    │
```

**Hạn chế của SSE hiện tại:** Connection được lưu trong bộ nhớ (`Map<userId, Response>`). Khi scale horizontal (nhiều instance backend), SSE sẽ không hoạt động vì connection chỉ tồn tại ở một instance. Giải pháp tương lai: Redis Pub/Sub.

---

## 3.5 Middleware Security Stack — 9 lớp

Mỗi request vào Backend đi qua pipeline gồm **9 middleware** theo thứ tự:

**Hình 3.2 — Thứ tự xử lý middleware stack**

```
                    ┌────────────────────────────────────┐
                    │        Incoming Request             │
                    └─────────────┬──────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [1] requestIdMiddleware                              │
          │  • Gán UUID v4 vào mỗi request: req.id              │
          │  • Set header: X-Request-ID: {uuid}                  │
          │  • Dùng cho log correlation và debug tracing         │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [2] metricsMiddleware                               │
          │  • Ghi nhận start_time                               │
          │  • Đếm request count theo endpoint                   │
          │  • Sau response: đo duration, ghi error count        │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [3] httpLoggerMiddleware                            │
          │  • Log: method, url, ip, user-agent, requestId       │
          │  • Sau response: log status code, duration           │
          │  • Structured JSON format                            │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [4] securityMiddleware (tổng hợp)                  │
          │  ┌────────────────────────────────────────────────┐  │
          │  │ helmet() — HTTP Security Headers:              │  │
          │  │  • Content-Security-Policy (CSP)               │  │
          │  │  • X-Frame-Options: DENY                       │  │
          │  │  • X-Content-Type-Options: nosniff             │  │
          │  │  • Strict-Transport-Security (HSTS)            │  │
          │  │  • X-DNS-Prefetch-Control: off                 │  │
          │  │  • Referrer-Policy: no-referrer                │  │
          │  └────────────────────────────────────────────────┘  │
          │  ┌────────────────────────────────────────────────┐  │
          │  │ cors() — Cross-Origin Resource Sharing:        │  │
          │  │  • origin: [FRONTEND_URL, ADMIN_CLIENT_URL]    │  │
          │  │  • credentials: true                           │  │
          │  │  • methods: GET,POST,PATCH,DELETE,OPTIONS      │  │
          │  └────────────────────────────────────────────────┘  │
          │  ┌────────────────────────────────────────────────┐  │
          │  │ rateLimit() — Giới hạn request:                │  │
          │  │  • Global: 100 req / 15 phút / IP              │  │
          │  │  • Auth: 10 req / 15 phút / IP                 │  │
          │  │  • Create content: 30 req / 15 phút            │  │
          │  └────────────────────────────────────────────────┘  │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [5] authMiddleware *(per-route, khi cần auth)*      │
          │  • Extract Bearer token từ Authorization header      │
          │  • jwt.verify(token, JWT_ACCESS_SECRET)             │
          │  • Nếu hết hạn/invalid → 401 Unauthorized           │
          │  • attach req.user = { id, email, role }             │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [6] roleMiddleware *(per-route, khi cần role)*      │
          │  • Kiểm tra req.user.role >= required role           │
          │  • Nếu không đủ quyền → 403 Forbidden               │
          │  • Hỗ trợ: roleMiddleware('ADMIN'),                  │
          │            roleMiddleware('MODERATOR')               │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [7] validateMiddleware *(per-route)*                │
          │  • Zod.parse(req.body hoặc req.query)                │
          │  • Nếu invalid → 400 Bad Request + chi tiết lỗi     │
          │  • Nếu valid → attach req.validated                  │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [8] Controller Handler                              │
          │  • Xử lý business logic qua service layer            │
          │  • Trả JSON response                                 │
          └───────────────────────┬─────────────────────────────┘
                                  │
          ┌───────────────────────▼─────────────────────────────┐
          │  [9] errorMiddleware *(global error handler)*        │
          │  • Catch mọi error thrown từ controller/service     │
          │  • Format: { error: string, details?: object }       │
          │  • Map lỗi Prisma → HTTP status phù hợp             │
          │  • Log stack trace trong development                 │
          └────────────────────────────────────────────────────┘
```

### Ví dụ cấu hình middleware trong `app.ts`

```typescript
// Thứ tự đăng ký middleware trong app.ts phản ánh pipeline trên:
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(requestIdMiddleware);
app.use(metricsMiddleware);
app.use('/api/v1', apiLimiter);          // 100 req/15min
app.use('/api/v1/auth', authLimiter);    // 10 req/15min
app.use(httpLoggerMiddleware);
app.use('/api/v1', routes);
app.use(errorMiddleware);                // Cuối cùng
```

---

## 3.6 Frontend API Integration với React Query

### 3.6.1 Kiến trúc API client

Frontend sử dụng **3 lớp** để giao tiếp với Backend:

```
Component/Page
     │ gọi hook
     ▼
React Query Hook    ← Quản lý cache, loading, error state
     │ gọi
     ▼
API Service         ← Định nghĩa endpoint, transform data
     │ gọi
     ▼
Axios Instance      ← Base URL, interceptors, token injection
     │ HTTP
     ▼
Backend API
```

### 3.6.2 Axios Instance với Auto Token Injection

```typescript
// frontend/src/api/axiosInstance.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // Tự động gửi cookie (refresh token)
});

// Request interceptor: tự động thêm Authorization header
api.interceptors.request.use((config) => {
  const token = getAccessToken();  // Từ AuthContext
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: tự động refresh token khi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true });
        setAccessToken(data.accessToken);
        return api(error.config);  // Retry request gốc
      } catch {
        logout();  // Refresh thất bại → buộc đăng nhập lại
      }
    }
    return Promise.reject(error);
  }
);
```

### 3.6.3 React Query — Query Pattern

```typescript
// Ví dụ: hook lấy danh sách bài viết với filter
export function usePostsQuery(params: PostQueryParams) {
  return useQuery({
    queryKey: ['posts', params],      // Cache key
    queryFn: () => postService.getAll(params),
    staleTime: 1000 * 60,            // Cache 60 giây
    keepPreviousData: true,          // Không xóa data khi thay filter
  });
}

// Sử dụng trong component
function HomePage() {
  const { data, isLoading, error } = usePostsQuery({
    page: 1,
    limit: 20,
    categoryId: selectedCategory,
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;
  return <PostList posts={data.posts} />;
}
```

### 3.6.4 React Query — Mutation Pattern

```typescript
// Mutation với cache invalidation
export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostInput) => postService.create(data),
    onSuccess: (newPost) => {
      // Invalidate danh sách bài viết để refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // Thêm bài viết mới trực tiếp vào cache (optimistic)
      queryClient.setQueryData(['posts', newPost.id], newPost);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

### 3.6.5 SSE Integration — Real-time Notifications

```typescript
// frontend/src/hooks/useSSE.ts
export function useSSE() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    const eventSource = new EventSource(
      `${API_URL}/api/v1/notifications/stream?token=${token}`
    );

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      // Thêm vào React Query cache
      queryClient.setQueryData(
        ['notifications'],
        (old) => [notification, ...(old || [])]
      );
      // Hiển thị toast
      toast.info(notification.title);
    };

    return () => eventSource.close();
  }, [user, token]);
}
```

### 3.6.6 Error Handling Thống nhất

```typescript
// Tất cả API error đều đi qua một điểm xử lý
api.interceptors.response.use(null, (error: AxiosError) => {
  const message = error.response?.data?.error || 'Đã xảy ra lỗi';
  const status = error.response?.status;

  switch (status) {
    case 400: throw new ValidationError(message, error.response?.data?.details);
    case 401: /* Xử lý bởi refresh interceptor */ break;
    case 403: throw new ForbiddenError(message);
    case 404: throw new NotFoundError(message);
    case 429: throw new RateLimitError('Quá nhiều yêu cầu, thử lại sau');
    default:  throw new ApiError(message, status);
  }
});
```

---

*[Tiếp theo: Chương 4 — Tích hợp AI — Vibe-Content Service]*
