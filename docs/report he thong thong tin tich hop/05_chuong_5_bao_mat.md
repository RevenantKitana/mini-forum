# CHƯƠNG 5 — BẢO MẬT VÀ KIỂM SOÁT TRUY CẬP

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
║  │  • Per-route enforcement: roleMiddleware('ADMIN')          │  ║
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
║  │  Password: bcrypt hash (salt rounds = 10)                  │  ║
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

```typescript
// roleMiddleware.ts — kiểm tra role theo hierarchy
export const roleMiddleware = (requiredRole: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const roleHierarchy = { MEMBER: 1, MODERATOR: 2, ADMIN: 3 };
    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Sử dụng trong route:
router.patch('/posts/:id/pin',
  authMiddleware,
  roleMiddleware('ADMIN'),  // Chỉ ADMIN mới được ghim
  validate(pinPostSchema),
  postController.pinPost
);
```

### 5.2.4 Resource Ownership Check

Ngoài RBAC, có cơ chế kiểm tra **ownership** ở tầng service:

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

---

## 5.3 Bảo vệ dữ liệu nhạy cảm

### 5.3.1 Mật khẩu — bcrypt Hash

```typescript
// authService.ts — không bao giờ lưu plaintext password
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;  // ~100ms trên hardware trung bình

// Đăng ký: hash mật khẩu trước khi lưu
const password_hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
await prisma.users.create({ data: { email, username, password_hash } });

// Đăng nhập: so sánh không expose hash
const isValid = await bcrypt.compare(plainPassword, user.password_hash);
if (!isValid) throw new UnauthorizedError('Invalid credentials');
```

**Tại sao bcrypt?**
- **Adaptive:** Tham số `SALT_ROUNDS` tăng được khi hardware mạnh hơn
- **Salt tích hợp:** Mỗi hash có salt ngẫu nhiên riêng → cùng mật khẩu cho hash khác nhau
- **Chống rainbow table:** Không thể precompute bảng tra cứu

### 5.3.2 JWT Token — Thiết kế bảo mật

```typescript
// authService.ts — JWT configuration
const ACCESS_TOKEN_CONFIG = {
  expiresIn: '15m',      // TTL ngắn: giảm thiệt hại nếu bị lộ
  algorithm: 'HS256',
};

const REFRESH_TOKEN_CONFIG = {
  expiresIn: '7d',
  algorithm: 'HS256',
};

// Access token: chỉ chứa thông tin tối thiểu (không lưu sensitive data trong payload)
const accessTokenPayload = {
  userId: user.id,
  role: user.role,
  // Không lưu: email, password, address, phone
};

// Refresh token: lưu vào DB để có thể revoke
await prisma.refresh_tokens.create({
  data: {
    token: refreshToken,
    user_id: user.id,
    expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  }
});
```

**So sánh localStorage vs httpOnly cookie cho refresh token:**

| Tiêu chí | localStorage | httpOnly Cookie |
|---------|:------------:|:---------------:|
| Accessible via JavaScript | ✅ (rủi ro XSS) | ❌ (an toàn) |
| CSRF vulnerable | ❌ | ✅ (cần CSRF mitigation) |
| Xóa khi đóng tab | Không (persist) | Có thể cấu hình |
| Gửi tự động | Không | Có (với credentials) |
| **Lựa chọn trong dự án** | ❌ | **✅** |

MINI-FORUM chọn **httpOnly cookie** vì XSS là mối đe dọa phổ biến hơn CSRF. Với CORS whitelist chặt, CSRF risk được giảm thiểu đủ cho phạm vi dự án.

### 5.3.3 API Keys và Secrets

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

**Bảng 5.2 — Mapping OWASP Top 10 với biện pháp trong codebase**

| # | OWASP Risk | Mô tả nguy cơ | Biện pháp trong codebase | File/Location |
|---|-----------|--------------|--------------------------|---------------|
| **A01** | Broken Access Control | Người dùng không có quyền truy cập tài nguyên bị bảo vệ | `roleMiddleware` + resource ownership check trong service layer | `middlewares/roleMiddleware.ts`, `services/postService.ts` |
| **A02** | Cryptographic Failures | Lưu mật khẩu plaintext, dùng thuật toán yếu | bcrypt hash với salt=10; JWT HS256; HTTPS bắt buộc production | `services/authService.ts` |
| **A03** | Injection | SQL injection, command injection | Prisma ORM sử dụng parameterized queries toàn bộ; không raw SQL | `services/*.ts` (tất cả dùng Prisma) |
| **A04** | Insecure Design | Logic bypass, thiếu boundary check | Service layer isolation; API-first cho bot; Zod validation | `middlewares/validateMiddleware.ts` |
| **A05** | Security Misconfiguration | Default config, lộ stack trace, CORS mở | Helmet headers; CORS whitelist; error middleware ẩn stack trace production | `middlewares/securityMiddleware.ts`, `app.ts` |
| **A06** | Vulnerable Components | Thư viện lỗi thời, CVE | `npm audit` định kỳ; cố định version trong package.json | `package.json` |
| **A07** | Auth & Session Failures | Token theft, brute force | Short-lived JWT (15min); httpOnly refresh cookie; authLimiter (10 req/15min) | `middlewares/authMiddleware.ts`, `middlewares/securityMiddleware.ts` |
| **A08** | Software & Data Integrity | Giả mạo package, supply chain | npm lockfile; Docker image hash | `package-lock.json`, `Dockerfile` |
| **A09** | Security Logging Failures | Không có audit, không phát hiện tấn công | `auditLogService` cho admin actions; `httpLoggerMiddleware` cho tất cả request; rate limit headers | `services/auditLogService.ts` |
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

---

*[Tiếp theo: Chương 6 — Triển khai và vận hành]*
