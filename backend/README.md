
### Hệ thống phân quyền (RBAC)

| Role | Cấp độ | Quyền |
|---|---|---|
| `MEMBER` | 1 | Tạo/sửa nội dung mình, vote, bookmark, báo cáo |
| `MODERATOR` | 2 | + Pin/lock bài, ẩn/hiện nội dung, quản lý reports, tags |
| `ADMIN` | 3 | + Quản lý categories, users, roles, xem audit logs |
| `BOT` | 1 | Tạo nội dung tự động (tương đương MEMBER) |

### Xác thực (Authentication)

- **Access Token**: JWT, hết hạn sau 15 phút (mặc định)
- **Refresh Token**: JWT, hết hạn sau 7 ngày, lưu trong DB
- **OTP**: 6 chữ số, hết hạn sau 10 phút, giới hạn 5 lần thử
- **Password**: bcrypt với 12-round salt

### Rate Limiting

| Endpoint | Giới hạn | Thời gian |
|---|---|---|
| API chung | 300 requests | 15 phút |
| Auth (login) | 10 requests | 15 phút |
| Tạo nội dung | 5 requests | 1 phút |
| Vote | 30 requests | 1 phút |
| Gửi OTP | 3 requests | 5 phút |
| Xác thực OTP | 10 requests | 10 phút |
| Tìm kiếm | 30 requests | 1 phút |

## API Endpoints

Xem chi tiết tại [docs/API_REFERENCE.md](../docs/API_REFERENCE.md).

### Tóm tắt nhóm API

| Nhóm | Base Path | Mô tả |
|---|---|---|
| Auth | `/api/v1/auth` | Đăng ký, đăng nhập, OTP, refresh token |
| Posts | `/api/v1/posts` | CRUD bài viết, pin, lock, status |
| Comments | `/api/v1/comments` | CRUD bình luận, reply chains |
| Users | `/api/v1/users` | Profile, settings, avatar |
| Categories | `/api/v1/categories` | Quản lý danh mục |
| Tags | `/api/v1/tags` | Quản lý tags |
| Votes | `/api/v1/posts/:id/vote` | Vote bài viết & bình luận |
| Bookmarks | `/api/v1/posts/:id/bookmark` | Lưu bài viết |
| Search | `/api/v1/search` | Tìm kiếm bài viết & users |
| Notifications | `/api/v1/notifications` | Thông báo người dùng |
| Reports | `/api/v1/reports` | Báo cáo vi phạm |
| Admin | `/api/v1/admin` | Quản trị hệ thống |
| Config | `/api/v1/config` | Cấu hình công khai |

## Database

Xem schema chi tiết tại [docs/DATABASE.md](../docs/DATABASE.md).

### Models chính

- `users` — Tài khoản người dùng với roles & reputation
- `posts` — Bài viết với categories, tags, voting, pinning
- `comments` — Bình luận lồng nhau, quote, voting
- `categories` — Danh mục với permissions
- `tags` — Tags phân loại nội dung
- `votes` — Upvote/downvote tracking
- `bookmarks` — Bài viết đã lưu
- `notifications` — Thông báo
- `reports` — Báo cáo vi phạm
- `user_blocks` — Block người dùng
- `audit_logs` — Nhật ký hành động admin


