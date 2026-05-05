# CHƯƠNG 5 — BẢO MẬT VÀ KIỂM SOÁT TRUY CẬP

---

## Giới thiệu chương

Bảo mật không phải là một tính năng thêm vào sau, mà là nền tảng xuyên suốt toàn bộ kiến trúc MINI-FORUM. Từ transport layer (HTTPS/TLS) đến từng query database (Prisma parameterized queries), mỗi tầng đều có cơ chế bảo vệ riêng theo mô hình **Defense-in-Depth**.

Chương này phân tích hệ thống bảo mật theo 5 khía cạnh: kiến trúc 5 lớp phòng thủ, ma trận phân quyền RBAC, bảo vệ dữ liệu nhạy cảm, đối chiếu với OWASP Top 10, và các biện pháp bảo mật riêng cho Vibe-Content Service.

---

## 5.1 Tổng quan kiến trúc bảo mật 5 lớp

MINI-FORUM áp dụng nguyên tắc **Defense-in-Depth** (bảo mật theo chiều sâu): nhiều lớp bảo mật độc lập, mỗi lớp là một rào cản riêng. Khi một lớp bị vượt qua, các lớp còn lại vẫn bảo vệ hệ thống.

**Hình 5.1 — Kiến trúc bảo mật 5 lớp**

```
╔══════════════════════════════════════════════════════════════════╗
║              DEFENSE-IN-DEPTH SECURITY ARCHITECTURE             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  LAYER 1 — NETWORK / TRANSPORT                                   ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │  • HTTPS (TLS 1.2+) cho tất cả kết nối production         │  ║
║  │  • HSTS: buộc HTTPS, không downgrade về HTTP              │  ║
║  │  • Chứng chỉ SSL tự động qua Render/Vercel               │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                          ↓ qua được lớp 1                        ║
║  LAYER 2 — APPLICATION SECURITY (securityMiddleware.ts)          ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │  Helmet.js — 12+ Security Headers:                         │  ║
║  │  • Content-Security-Policy (CSP): chặn inline script      │  ║
║  │  • X-Frame-Options: DENY (chống Clickjacking)             │  ║
║  │  • X-Content-Type-Options: nosniff (chống MIME sniffing)  │  ║
║  │  • Strict-Transport-Security (HSTS): buộc HTTPS           │  ║
║  │  • X-DNS-Prefetch-Control: off                            │  ║
║  │  • Referrer-Policy: no-referrer                           │  ║
║  │                                                            │  ║
║  │  CORS Whitelist:                                           │  ║
║  │  • origin: [FRONTEND_URL, ADMIN_CLIENT_URL] only          │  ║
║  │  • credentials: true (cho cookie)                         │  ║
║  │                                                            │  ║
║  │  Rate Limiting (express-rate-limit):                       │  ║
║  │  • Global API: 300 req / 15 phút / IP                     │  ║
║  │  • Auth endpoints: 10 req / 15 phút / IP                  │  ║
║  │  • Create content: 5 req / phút / IP                      │  ║
║  │  • Vote: 30 req / phút / IP                               │  ║
║  │  • OTP send: 3 req / 5 phút / IP                          │  ║
║  │  • OTP verify: 10 req / 10 phút / IP                      │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                          ↓ qua được lớp 2                        ║
║  LAYER 3 — AUTHENTICATION (authMiddleware.ts)                    ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │  JWT Access Token:                                         │  ║
║  │  • Thuật toán: HS256 với JWT_ACCESS_SECRET                 │  ║
║  │  • TTL ngắn: 15 phút (giới hạn thiệt hại khi bị lộ)      │  ║
║  │                                                            │  ║
║  │  Refresh Token:                                            │  ║
║  │  • TTL dài: 7 ngày                                         │  ║
║  │  • Lưu trong DB (refresh_tokens table) → revocable        │  ║
║  │  • Gửi qua httpOnly cookie → JavaScript không đọc được    │  ║
║  │  • Xóa khỏi DB khi logout → server-side invalidation      │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                          ↓ qua được lớp 3                        ║
║  LAYER 4 — AUTHORIZATION (roleMiddleware.ts)                     ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │  RBAC (Role-Based Access Control):                         │  ║
║  │  • Role hierarchy: MEMBER < MODERATOR < ADMIN              │  ║
║  │  • Per-route enforcement: authorize('ADMIN')               │  ║
║  │                                                            │  ║
║  │  Resource Ownership Check (trong service layer):           │  ║
║  │  • Chỉ tác giả hoặc MODERATOR/ADMIN mới sửa/xóa post      │  ║
║  │  • Chỉ tác giả hoặc MODERATOR/ADMIN mới sửa/xóa comment  │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                          ↓ qua được lớp 4                        ║
║  LAYER 5 — INPUT VALIDATION & DATA PROTECTION                    ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │  Zod Schema Validation (validateMiddleware.ts):            │  ║
║  │  • Validate mọi request body trước khi controller xử lý   │  ║
║  │  • Type coercion, whitelist fields, reject unknown fields  │  ║
║  │                                                            │  ║
║  │  Prisma ORM (parameterized queries):                       │  ║
║  │  • Không raw SQL → không SQL injection                    │  ║
║  │  • Type-safe queries → lỗi compile-time thay vì runtime    │  ║
║  │                                                            │  ║
║  │  Password: bcrypt hash (salt rounds = 12)                  │  ║
║  │  Secrets: chỉ trong env variables, không hardcode         │  ║
║  └────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 5.2 Ma trận phân quyền RBAC

### 5.2.1 Hệ thống Role

MINI-FORUM định nghĩa 3 role người dùng với hierarchy tăng dần:

```
Guest (không đăng nhập) < MEMBER < MODERATOR < ADMIN
```

Ngoài ra có **BOT** role đặc biệt cho vibe-content (có MEMBER permission + audit tracking).

### 5.2.2 Ma trận Permission đầy đủ

**Bảng 5.1 — Ma trận phân quyền theo resource và role**

| Resource / Hành động | Guest | Member | Moderator | Admin |
|---------------------|:-----:|:------:|:---------:|:-----:|
| **POST** | | | | |
| Xem bài viết (category: ALL) | ✅ | ✅ | ✅ | ✅ |
| Xem bài viết (category: MEMBER) | ❌ | ✅ | ✅ | ✅ |
| Xem bài viết (category: MODERATOR) | ❌ | ❌ | ✅ | ✅ |
| Tạo bài viết mới | ❌ | ✅ | ✅ | ✅ |
| Sửa bài viết của mình | ❌ | ✅ | ✅ | ✅ |
| Xóa bài viết của mình | ❌ | ✅ | ✅ | ✅ |
| Sửa/xóa bài viết người khác | ❌ | ❌ | ✅ | ✅ |
| Ghim bài viết (Global/Category) | ❌ | ❌ | ❌ | ✅ |
| Khóa bình luận (lock) | ❌ | ❌ | ✅ | ✅ |
| **COMMENT** | | | | |
| Xem bình luận | ✅ | ✅ | ✅ | ✅ |
| Tạo bình luận | ❌ | ✅ | ✅ | ✅ |
| Sửa bình luận của mình | ❌ | ✅* | ✅ | ✅ |
| Xóa bình luận của mình | ❌ | ✅ | ✅ | ✅ |
| Ẩn/xóa bình luận người khác | ❌ | ❌ | ✅ | ✅ |
| **USER MANAGEMENT** | | | | |
| Xem profile người dùng | ✅ | ✅ | ✅ | ✅ |
| Cập nhật profile của mình | ❌ | ✅ | ✅ | ✅ |
| Thay đổi role người dùng | ❌ | ❌ | ❌ | ✅ |
| Vô hiệu hóa tài khoản | ❌ | ❌ | ❌ | ✅ |
| **INTERACTION** | | | | |
| Vote bài viết/bình luận | ❌ | ✅ | ✅ | ✅ |
| Bookmark bài viết | ❌ | ✅ | ✅ | ✅ |
| Chặn người dùng khác | ❌ | ✅ | ✅ | ✅ |
| Báo cáo bài viết/bình luận | ❌ | ✅ | ✅ | ✅ |
| **MODERATION** | | | | |
| Xem danh sách báo cáo | ❌ | ❌ | ✅ | ✅ |
| Xử lý báo cáo (resolve/dismiss) | ❌ | ❌ | ✅ | ✅ |
| **ADMIN** | | | | |
| Xem Audit Log | ❌ | ❌ | ❌ | ✅ |
| Truy cập Admin Dashboard | ❌ | ❌ | ❌ | ✅ |
| Xem HTTP Metrics | ❌ | ❌ | ❌ | ✅ |
| Thay đổi cấu hình hệ thống | ❌ | ❌ | ❌ | ✅ |
| Quản lý danh mục | ❌ | ❌ | ❌ | ✅ |

*✅* = có thể sửa trong giới hạn `COMMENT_EDIT_TIME_LIMIT` giây (cấu hình động)

### 5.2.3 Cơ chế thực thi RBAC trong code

Hàm `authorize()` trong `roleMiddleware.ts` cho phép chỉ định nhiều role được phép cùng lúc qua spread operator, linh hoạt hơn so với hierarchy đơn:

```typescript
// roleMiddleware.ts — hàm authorize() thực tế từ codebase
export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Các hàm helper shortcut:
export const isAdmin = authorize('ADMIN');
export const isModerator = authorize('MODERATOR', 'ADMIN');

// Sử dụng trong route files:
router.patch('/posts/:id/pin',
  authenticate,
  isAdmin,                        // Chỉ ADMIN
  validate(pinPostSchema),
  postController.pinPost
);

router.delete('/posts/:id',
  authenticate,
  isModerator,                    // MODERATOR hoặc ADMIN
  postController.deletePost
);

router.post('/categories',
  authenticate,
  authorize('ADMIN'),             // Trực tiếp
  validate(createCategorySchema),
  categoryController.create
);
```

### 5.2.4 Resource Ownership Check

Ngoài RBAC, có cơ chế kiểm tra **ownership** ở tầng service để đảm bảo người dùng chỉ sửa đổi nội dung của chính mình (trừ khi có quyền MODERATOR/ADMIN):

```typescript
// postService.ts — kiểm tra ownership trước khi cập nhật
async updatePost(postId: number, userId: number, userRole: Role, data: UpdatePostDto) {
  const post = await prisma.posts.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post not found');

  // Chỉ author hoặc MODERATOR/ADMIN mới được sửa
  const isAuthor = post.author_id === userId;
  const canModerate = ['MODERATOR', 'ADMIN'].includes(userRole);

  if (!isAuthor && !canModerate) {
    throw new ForbiddenError('You do not have permission to edit this post');
  }

  return prisma.posts.update({ where: { id: postId }, data });
}
```

**Hàm `isOwnerOrModerator()`** từ `roleMiddleware.ts` được dùng cho các resource check nhanh trong middleware:

```typescript
export const isOwnerOrModerator = (getOwnerId: (req: AuthRequest) => number | undefined) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const ownerId = getOwnerId(req);
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (userId === ownerId || userRole === 'MODERATOR' || userRole === 'ADMIN') {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
};
```

---

## 5.3 Bảo vệ dữ liệu nhạy cảm

### 5.3.1 Mật khẩu — bcrypt Hash

Mật khẩu không bao giờ được lưu dưới dạng plaintext. Mọi mật khẩu đều được hash bằng bcrypt với `SALT_ROUNDS = 12`:

```typescript
// authService.ts — hash mật khẩu với bcrypt
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;  // ~300ms trên hardware trung bình — đủ chậm để brute force khó khăn

// Đăng ký: hash mật khẩu trước khi lưu
const password_hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
await prisma.users.create({ data: { email, username, password_hash } });

// Đăng nhập: so sánh không expose hash
const isValid = await bcrypt.compare(plainPassword, user.password_hash);
if (!isValid) throw new UnauthorizedError('Invalid credentials');
```

**Bảng 5.2 — So sánh thuật toán hash mật khẩu**

| Thuật toán | Salt | Adaptive | Chi phí | Dùng trong dự án |
|-----------|:----:|:-------:|--------|:---------------:|
| MD5 | ❌ | ❌ | Rất nhanh (không an toàn) | ❌ |
| SHA-256 | ❌ | ❌ | Nhanh (không an toàn cho mật khẩu) | ❌ |
| bcrypt | ✅ | ✅ | ~300ms (SALT_ROUNDS=12) | **✅** |
| Argon2id | ✅ | ✅ | Tốt nhất, memory-hard | Tương lai |

### 5.3.2 Refresh Token — SHA-256 Hash trong DB

Không chỉ mật khẩu, **refresh token cũng được hash** trước khi lưu vào database:

```typescript
// authService.ts — hashToken function
import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Khi tạo refresh token:
const rawRefreshToken = crypto.randomBytes(64).toString('hex');  // Token gửi cho client
const hashedToken = hashToken(rawRefreshToken);                   // Token lưu vào DB

await prisma.refresh_tokens.create({
  data: {
    token_hash: hashedToken,    // Chỉ lưu hash
    user_id: user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  }
});

// httpOnly cookie chứa rawRefreshToken (không phải hash)
res.cookie('refreshToken', rawRefreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 3600 * 1000,
});
```

**Lý do hash refresh token:** Nếu database bị compromise, attacker chỉ có hash, không thể dùng để lấy access token mới.

### 5.3.3 JWT Token — Thiết kế bảo mật

```typescript
// authService.ts — JWT configuration
const ACCESS_TOKEN_CONFIG = {
  expiresIn: '15m',      // TTL ngắn: giảm thiệt hại nếu bị lộ
  algorithm: 'HS256',
};

// Access token payload: chứa thông tin tối thiểu
const accessTokenPayload = {
  userId: user.id,
  role: user.role,
  // KHÔNG lưu: email, password, địa chỉ, số điện thoại
};
```

**Bảng 5.3 — So sánh phương pháp lưu trữ token phía client**

| Tiêu chí | localStorage | sessionStorage | httpOnly Cookie |
|---------|:------------:|:--------------:|:---------------:|
| JavaScript có thể đọc | ✅ (XSS risk) | ✅ (XSS risk) | ❌ **(an toàn)** |
| Tự xóa khi đóng tab | ❌ | ✅ | Cấu hình được |
| Tự gửi trong request | ❌ | ❌ | ✅ (credentials) |
| CSRF risk | ❌ | ❌ | ✅ (cần mitigation) |
| **MINI-FORUM dùng cho** | Access Token | — | **Refresh Token** |

MINI-FORUM dùng **localStorage cho Access Token** (TTL 15 phút, mất giá trị nhanh) và **httpOnly cookie cho Refresh Token** (TTL 7 ngày, cần bảo vệ XSS mạnh hơn).

### 5.3.4 API Keys và Secrets

Tất cả secrets được quản lý qua **environment variables**, không hardcode trong source code:

```typescript
// config/index.ts — tập trung cấu hình từ env
const config = {
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
  },
  email: {
    brevoApiKey: process.env.BREVO_API_KEY!,
  },
  imagekit: {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,  // Không expose ra client
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
  },
};

// Kiểm tra bắt buộc khi startup
if (!config.jwt.accessSecret) {
  throw new Error('JWT_ACCESS_SECRET is required');
}
```

**ImageKit — Server-side Signed URL:**
Upload ảnh không cho phép client trực tiếp kết nối ImageKit API. Client gửi file lên Backend → Backend upload lên ImageKit với private key → trả về URL cho client. Private key không bao giờ ra client.

### 5.3.4 Audit Trail

Mọi hành động quản trị được ghi vào `audit_logs`:

```typescript
// auditLogService.ts — ghi nhật ký không thể xóa
await prisma.audit_logs.create({
  data: {
    user_id: adminUserId,
    action: 'BAN_USER',        // AuditAction enum
    target_type: 'USER',       // AuditTarget enum
    target_id: targetUserId,
    target_name: targetUser.username,
    old_value: JSON.stringify({ role: 'MEMBER', status: 'active' }),
    new_value: JSON.stringify({ role: 'MEMBER', status: 'banned' }),
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
  }
});
```

**Ý nghĩa của Audit Trail:**
- **Non-repudiation:** Admin không thể phủ nhận đã thực hiện hành động
- **Accountability:** Biết ai làm gì, lúc nào, từ đâu
- **Forensics:** Khi xảy ra sự cố có thể truy vết ngược

---

## 5.4 Tuân thủ OWASP Top 10

**Bảng 5.4 — Mapping OWASP Top 10 với biện pháp trong codebase**

| # | OWASP Risk | Mô tả nguy cơ | Biện pháp trong codebase | File/Location |
|---|-----------|--------------|--------------------------|---------------|
| **A01** | Broken Access Control | Người dùng không có quyền truy cập tài nguyên bị bảo vệ | `authorize()` + resource ownership check trong service layer | `middlewares/roleMiddleware.ts`, `services/postService.ts` |
| **A02** | Cryptographic Failures | Lưu mật khẩu plaintext, dùng thuật toán yếu | bcrypt hash với SALT_ROUNDS=12; JWT HS256; HTTPS bắt buộc production | `services/authService.ts` |
| **A03** | Injection | SQL injection, command injection | Prisma ORM sử dụng parameterized queries toàn bộ; không raw SQL | `services/*.ts` (tất cả dùng Prisma) |
| **A04** | Insecure Design | Logic bypass, thiếu boundary check | Service layer isolation; API-first cho bot; Zod validation | `middlewares/validateMiddleware.ts` |
| **A05** | Security Misconfiguration | Default config, lộ stack trace, CORS mở | Helmet headers; CORS whitelist; error middleware ẩn stack trace production | `middlewares/securityMiddleware.ts`, `app.ts` |
| **A06** | Vulnerable Components | Thư viện lỗi thời, CVE | `npm audit` định kỳ; cố định version trong package.json | `package.json` |
| **A07** | Auth & Session Failures | Token theft, brute force | Short-lived JWT (15min); httpOnly refresh cookie; authLimiter (10 req/15min, skipSuccessful) | `middlewares/authMiddleware.ts`, `middlewares/securityMiddleware.ts` |
| **A08** | Software & Data Integrity | Giả mạo package, supply chain | npm lockfile; Docker image hash | `package-lock.json`, `Dockerfile` |
| **A09** | Security Logging Failures | Không có audit, không phát hiện tấn công | `auditLogService` cho admin actions; `httpLoggerMiddleware` cho tất cả request | `services/auditLogService.ts` |
| **A10** | Server-Side Request Forgery | Backend bị dụ gửi request đến internal services | Không có user-controlled URL fetch; CORS whitelist; no proxy feature | Không có SSRF surface |

### Chi tiết A03 — SQL Injection Prevention

```typescript
// ✅ ĐÚNG: Prisma parameterized query (safe)
const user = await prisma.users.findFirst({
  where: { email: userInput },  // Prisma tự escape
});

// ❌ SAI: Không bao giờ làm thế này
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = '${userInput}'
`;
// → Nếu userInput = "'; DROP TABLE users; --" thì bị injection

// ✅ Nếu bắt buộc dùng raw query, phải dùng Prisma.sql:
const user = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM users WHERE email = ${userInput}`
);
```

### Chi tiết A04 — Input Validation với Zod

```typescript
// validations/postValidation.ts
export const createPostSchema = z.object({
  title: z.string()
    .min(10, 'Title too short')
    .max(200, 'Title too long')
    .trim(),

  content: z.string()
    .min(20, 'Content too short')
    .max(50000, 'Content too long'),

  categoryId: z.number().int().positive(),

  tags: z.array(z.number().int().positive()).max(10).optional(),

  // Whitelist: chỉ cho phép các field này, reject field lạ
}).strict();

// Áp dụng:
router.post('/posts',
  authMiddleware,
  validate(createPostSchema),  // Zod parse trước controller
  postController.createPost
);
```

---

## 5.5 Bảo mật tích hợp cho Vibe-Content

### 5.5.1 Bot User Authentication

Vibe-content authenticate với Forum API bằng JWT của bot user — không dùng service-to-service token riêng. Điều này có nghĩa:

1. Bot phải đăng ký tài khoản hợp lệ trong hệ thống
2. Bot bị ràng buộc bởi tất cả business logic và middleware như người dùng thực
3. Bot không thể thực hiện hành động vượt quá quyền MEMBER
4. Hành động của bot xuất hiện trong audit logs nếu cần review

### 5.5.2 Direct DB Access Control

Kết nối Prisma của vibe-content đến PostgreSQL chỉ cho phép **SELECT**. Trong production, có thể enforce bằng PostgreSQL role:

```sql
-- PostgreSQL: tạo read-only role cho vibe-content
CREATE ROLE vibe_content_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO vibe_content_readonly;
-- Không GRANT INSERT, UPDATE, DELETE
```

Dù trong codebase hiện tại dùng chung `DATABASE_URL`, nguyên tắc "không ghi trực tiếp" được enforce bởi quy ước code và code review.

### 5.5.3 Giới hạn rate limit cho bot

Bot user bị ràng buộc bởi cùng rate limiter như người dùng thực:
- `createContentLimiter`: 5 bài/phút/IP
- `voteLimiter`: 30 vote/phút/IP

Ngoài ra, vibe-content có **internal rate limiter riêng** (tầng application) với giới hạn chặt hơn (2 bài/ngày, 10 comment/giờ, 20 vote/giờ), đảm bảo hành vi bot luôn ở dưới ngưỡng kích hoạt rate limiter của backend.

---

## 5.6 Tổng kết chương

Chương 5 đã trình bày hệ thống bảo mật toàn diện của MINI-FORUM theo nguyên tắc Defense-in-Depth:

1. **Kiến trúc 5 lớp** (Hình 5.1): Mỗi lớp bảo vệ một khía cạnh khác nhau — từ HTTPS transport đến Zod input validation — đảm bảo không có single point of failure trong bảo mật.

2. **RBAC với `authorize()`** (Bảng 5.1): Ma trận phân quyền rõ ràng giữa Guest/MEMBER/MODERATOR/ADMIN, được thực thi ở 2 tầng (middleware + service layer ownership check), ngăn leo thang đặc quyền.

3. **Bảo vệ dữ liệu nhạy cảm** (Bảng 5.2, 5.3): bcrypt SALT_ROUNDS=12 cho mật khẩu, SHA-256 hash cho refresh token trong DB, httpOnly cookie để chống XSS đánh cắp refresh token.

4. **OWASP Top 10 compliance** (Bảng 5.4): Tất cả 10 rủi ro phổ biến nhất đều có biện pháp đối phó cụ thể được triển khai trong codebase, từ SQL injection (Prisma parameterized) đến security misconfiguration (Helmet + CORS whitelist).

5. **Bảo mật Vibe-Content** (mục 5.5): Bot hoạt động trong giới hạn permission MEMBER thông thường, bị ràng buộc bởi cả rate limiter backend lẫn internal limiter của service, không thể bypass business logic.

---

*[Tiếp theo: Chương 6 — Triển khai và vận hành]*
