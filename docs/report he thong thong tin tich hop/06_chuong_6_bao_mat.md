# CHƯƠNG 6 — BẢO MẬT VÀ KIỂM SOÁT TRUY CẬP

---

## Giới thiệu chương

Bảo mật là nền tảng xuyên suốt kiến trúc MINI-FORUM, được thiết kế theo mô hình **Defense-in-Depth**: nhiều lớp bảo mật độc lập, mỗi lớp là rào cản riêng. Chương này phân tích 5 khía cạnh: kiến trúc 5 lớp phòng thủ, ma trận RBAC, bảo vệ dữ liệu nhạy cảm, đối chiếu OWASP Top 10, và bảo mật cho Vibe-Content Service.

---

## 6.1 Kiến trúc bảo mật 5 lớp

**Hình 6.1 — Kiến trúc Defense-in-Depth 5 lớp**

```
╔══════════════════════════════════════════════════════════════════╗
║  LAYER 1 — NETWORK / TRANSPORT                                   ║
║  • HTTPS (TLS 1.2+) + HSTS — buộc HTTPS, không downgrade       ║
╠══════════════════════════════════════════════════════════════════╣
║  LAYER 2 — APPLICATION (securityMiddleware.ts)                   ║
║  • Helmet.js: CSP, X-Frame-Options: DENY, X-Content-Type-Options ║
║  • CORS Whitelist: [FRONTEND_URL, ADMIN_CLIENT_URL] only         ║
║  • Rate Limiting:                                                ║
║    - Global: 300 req/15min/IP                                   ║
║    - Auth: 10 req/15min/IP   | OTP send: 3 req/5min/IP          ║
║    - Create content: 5 req/min/IP | Vote: 30 req/min/IP         ║
╠══════════════════════════════════════════════════════════════════╣
║  LAYER 3 — AUTHENTICATION (authMiddleware.ts)                    ║
║  • JWT Access Token: HS256, TTL 15 phút                         ║
║  • Refresh Token: TTL 7 ngày, lưu DB (revocable), httpOnly cookie║
╠══════════════════════════════════════════════════════════════════╣
║  LAYER 4 — AUTHORIZATION (roleMiddleware.ts)                     ║
║  • RBAC: MEMBER < MODERATOR < ADMIN                             ║
║  • Resource Ownership Check ở tầng service                      ║
╠══════════════════════════════════════════════════════════════════╣
║  LAYER 5 — INPUT VALIDATION & DATA PROTECTION                    ║
║  • Zod Schema Validation — validate mọi request body            ║
║  • Prisma ORM — parameterized queries, không SQL injection       ║
║  • bcrypt (SALT_ROUNDS=12), secrets chỉ trong env variables      ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 6.2 Ma trận phân quyền RBAC

### 6.2.1 Hệ thống Role

```
Guest (không đăng nhập) < MEMBER < MODERATOR < ADMIN
```

Ngoài ra có **BOT** role đặc biệt cho vibe-content (MEMBER permission + audit tracking).

### 6.2.2 Ma trận Permission

**Bảng 6.1 — Ma trận phân quyền theo resource và role**

| Resource / Hành động | Guest | Member | Moderator | Admin |
|---------------------|:-----:|:------:|:---------:|:-----:|
| **POST** | | | | |
| Xem bài viết (ALL category) | ✅ | ✅ | ✅ | ✅ |
| Xem bài viết (MEMBER/MODERATOR category) | ❌ | ✅/❌ | ✅ | ✅ |
| Tạo / Sửa / Xóa bài của mình | ❌ | ✅ | ✅ | ✅ |
| Sửa/xóa bài người khác | ❌ | ❌ | ✅ | ✅ |
| Ghim bài viết / Khóa bình luận | ❌ | ❌ | ✅* | ✅ |
| **COMMENT** | | | | |
| Xem / Tạo bình luận | ✅/❌ | ✅ | ✅ | ✅ |
| Sửa/xóa bình luận của mình | ❌ | ✅† | ✅ | ✅ |
| Ẩn/xóa bình luận người khác | ❌ | ❌ | ✅ | ✅ |
| **USER / INTERACTION** | | | | |
| Xem profile | ✅ | ✅ | ✅ | ✅ |
| Vote / Bookmark / Report | ❌ | ✅ | ✅ | ✅ |
| Thay đổi role / Vô hiệu hóa tài khoản | ❌ | ❌ | ❌ | ✅ |
| **ADMIN** | | | | |
| Audit Log / Admin Dashboard / HTTP Metrics | ❌ | ❌ | ❌ | ✅ |
| Xử lý báo cáo (resolve/dismiss) | ❌ | ❌ | ✅ | ✅ |

*Ghim: chỉ ADMIN; Khóa: MODERATOR/ADMIN. †Sửa trong giới hạn `COMMENT_EDIT_TIME_LIMIT` giây.

### 6.2.3 Cơ chế thực thi RBAC

```typescript
// roleMiddleware.ts
export const authorize = (...allowedRoles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!allowedRoles.includes(req.user.role as Role))
      return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };

export const isAdmin     = authorize('ADMIN');
export const isModerator = authorize('MODERATOR', 'ADMIN');

// Sử dụng trong routes:
router.patch('/posts/:id/pin', authenticate, isAdmin, postController.pinPost);
router.delete('/posts/:id',    authenticate, isModerator, postController.deletePost);
```

Ngoài RBAC, **resource ownership check** ở tầng service đảm bảo chỉ tác giả hoặc MODERATOR/ADMIN mới sửa/xóa được nội dung của người khác:

```typescript
const isAuthor    = post.author_id === userId;
const canModerate = ['MODERATOR', 'ADMIN'].includes(userRole);
if (!isAuthor && !canModerate) throw new ForbiddenError('...');
```

---

## 6.3 Bảo vệ dữ liệu nhạy cảm

### 6.3.1 Mật khẩu — bcrypt Hash

```typescript
const SALT_ROUNDS = 12;  // ~300ms — đủ chậm để brute force khó khăn
const password_hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
const isValid = await bcrypt.compare(plainPassword, user.password_hash);
```

### 6.3.2 Refresh Token — SHA-256 Hash trong DB

```typescript
const rawRefreshToken = crypto.randomBytes(64).toString('hex');  // gửi cho client
const hashedToken = crypto.createHash('sha256').update(rawRefreshToken).digest('hex'); // lưu DB

res.cookie('refreshToken', rawRefreshToken, {
  httpOnly: true,   // JavaScript không đọc được → chống XSS
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
});
```

**Lý do hash refresh token**: Nếu DB bị compromise, attacker chỉ có hash, không thể dùng để lấy access token mới.

### 6.3.3 JWT Token và lưu trữ phía client

Access token payload chứa tối thiểu `{userId, role}` — không lưu email, password, địa chỉ. MINI-FORUM dùng **localStorage cho Access Token** (TTL 15 phút) và **httpOnly cookie cho Refresh Token** (TTL 7 ngày, chống XSS).

### 6.3.4 Audit Trail

Mọi hành động quản trị được ghi vào `audit_logs` với `user_id`, `action`, `target_type`, `target_id`, `old_value`, `new_value`, `ip_address`, `user_agent` — đảm bảo non-repudiation và hỗ trợ forensics.

---


## 6.5 Bảo mật tích hợp cho Vibe-Content

1. **Bot User Authentication**: Vibe-content authenticate với Forum API bằng JWT của bot user — bị ràng buộc bởi tất cả business logic và middleware như người dùng thực, không thể vượt quá quyền MEMBER.

2. **Direct DB Access Control**: Kết nối Prisma của vibe-content chỉ thực hiện SELECT. Có thể enforce ở cấp PostgreSQL:
   ```sql
   CREATE ROLE vibe_content_readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO vibe_content_readonly;
   ```

3. **Rate Limiting**: Bot bị ràng buộc bởi cả rate limiter backend lẫn **internal limiter riêng** của vibe-content (chặt hơn: 2 bài/ngày, 10 comment/giờ, 20 vote/giờ), đảm bảo hành vi bot không kích hoạt rate limiter của backend.

---

## Tóm tắt chương

Hệ thống bảo mật MINI-FORUM theo nguyên tắc Defense-in-Depth với 5 lớp độc lập, đảm bảo không có single point of failure. RBAC được thực thi ở 2 tầng (middleware + service layer), bcrypt + SHA-256 bảo vệ credential ngay cả khi DB bị compromise, và toàn bộ 10 rủi ro OWASP đều có biện pháp đối phó cụ thể trong codebase.

---

*[Tiếp theo: Chương 7 — Triển khai và vận hành]*
