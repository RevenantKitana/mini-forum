# 🗄️ Cẩm Nang Quản Trị Cơ Sở Dữ Liệu (Database Guide)

Tài liệu hướng dẫn toàn diện về kiến trúc cơ sở dữ liệu PostgreSQL, quy trình làm việc với Prisma ORM, và các thao tác sao lưu/khôi phục dữ liệu cho hệ thống **Mini Forum**.

---

## 🏛️ 1. Kiến Trúc & Lược Đồ Dữ Liệu (Schema Architecture)

Hệ thống sử dụng **PostgreSQL 17** kết hợp **Prisma ORM 5** với hơn 20 bảng quan hệ được thiết kế chặt chẽ:

```
                            ┌────────────────┐
                            │     users      │
                            └───────┬────────┘
                                    │ 1
        ┌───────────────────────────┼───────────────────────────┐
        │ N                         │ N                         │ N
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│     posts     │           │   comments    │           │     votes     │
└───────┬───────┘           └───────┬───────┘           └───────────────┘
        │ 1                         │ 1 (Self-Ref: Parent/Child)
        ├───────────────┐           │
        ▼ N             ▼ N         │
┌───────────────┐┌───────────────┐  │
│  post_tags    ││  post_media   │  │
└───────┬───────┘└───────────────┘  │
        ▼ 1                         │
┌───────────────┐                   │
│     tags      │                   │
└───────────────┘                   │
                                    ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  categories   │◄──────────┤ notifications │           │  audit_logs   │
└───────────────┘           └───────────────┘           └───────────────┘
```

### Các nhóm bảng chính:
1. **Quản lý Tài khoản & Định danh:**
   - `users`: Thông tin người dùng, điểm uy tín (`reputation`), role (`MEMBER`, `MODERATOR`, `ADMIN`, `BOT`).
   - `refresh_tokens`: Lưu trữ Refresh Token hashed kèm cơ chế phát hiện tái sử dụng (Reuse Detection).
   - `otp_tokens`: Quản lý mã OTP xác thực email qua Brevo.
   - `user_blocks`: Danh sách quan hệ chặn giữa các thành viên.
2. **Nội dung & Tương tác:**
   - `posts`: Bài viết với trạng thái (`DRAFT`, `PUBLISHED`, `HIDDEN`, `DELETED`), chỉ mục Trigram hỗ trợ tìm kiếm mờ.
   - `post_media`: Quản lý siêu dữ liệu ảnh đính kèm bài viết trên ImageKit CDN.
   - `comments`: Bình luận dạng cây phân cấp đa tầng (nested comments) hỗ trợ tự tham chiếu `parentId`.
   - `categories`: Phân mục bài viết với cấu hình cấp độ quyền truy cập (`permission_level`).
   - `tags` / `post_tags`: Hệ thống gắn nhãn phân loại nội dung.
   - `votes`: Upvote/Downvote cho cả bài viết lẫn bình luận, cập nhật điểm uy tín theo database transaction.
   - `bookmarks`: Lưu bài viết yêu thích của từng người dùng.
3. **Quản trị, Kiểm duyệt & Hệ thống:**
   - `reports`: Báo cáo vi phạm bài viết/bình luận (`PENDING`, `RESOLVED`, `DISMISSED`).
   - `audit_logs`: Nhật ký kiểm toán bất biến ghi lại mọi thao tác của Moderator/Admin.
   - `notifications`: Thông báo người dùng đẩy qua Server-Sent Events (SSE).

---

## 💻 2. Môi Trường Cơ Sở Dữ Liệu

### A. Môi trường Development (Cục bộ)
Có thể chạy PostgreSQL trực tiếp trên máy hoặc qua Docker container nhanh:
```bash
docker run --name mini-forum-local-pg \
  -e POSTGRES_USER=forum_user \
  -e POSTGRES_PASSWORD=forum_secure_pass_2026 \
  -e POSTGRES_DB=mini_forum \
  -p 5432:5432 \
  -d postgres:17-alpine
```

Chuỗi kết nối `.env` cục bộ (`backend/.env` & `vibe-content/.env`):
```env
DATABASE_URL=postgresql://forum_user:forum_secure_pass_2026@localhost:5432/mini_forum
```

### B. Môi trường Production (Remote VM)
PostgreSQL chạy dưới dạng service `postgres` trong Docker Compose, dữ liệu được ánh xạ vào Docker Named Volume `mini_forum_postgres_data`.

- **Cấu hình Standard VM:** Cấp phát `shared_buffers=1GB`, `effective_cache_size=4GB`, `max_connections=100`.
- **Cấu hình Micro VM (1GB RAM):** Cấp phát `shared_buffers=64MB`, `work_mem=4MB`, `max_connections=35`, giới hạn cứng bộ nhớ `mem_limit: 200m`. Xem chi tiết tại [DEPLOY_MICRO_VM.md](./DEPLOY_MICRO_VM.md).

Chuỗi kết nối nội bộ giữa các container trong cùng mạng Docker:
```env
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
```

---

## ⚙️ 3. Quy Trình Làm Việc Với Prisma ORM

Các lệnh được thực thi trong thư mục `backend/`:

| Lệnh | Ý nghĩa | Môi trường áp dụng |
| :--- | :--- | :--- |
| `npm run db:migrate` | So sánh schema và sinh file migration mới (`prisma migrate dev`) | Development |
| `npx prisma migrate deploy` | Áp dụng các migration chưa chạy lên CSDL | Production / Staging |
| `npm run db:generate` | Sinh code TypeScript cho Prisma Client | Sau mỗi lần sửa schema |
| `npm run db:seed` | Nạp dữ liệu danh mục mẫu, tag và tài khoản Admin ban đầu | Mọi môi trường |
| `npx prisma studio` | Mở giao diện web tương tác và duyệt dữ liệu trực quan | Development |

---

## 💾 4. Sao Lưu & Khôi Phục Dữ Liệu (Backup & Restore)

Dự án cung cấp công cụ tự động hóa sao lưu và đồng bộ CSDL giữa máy cục bộ và máy chủ từ xa:

### 1. Sao lưu CSDL từ VM về máy cục bộ
Chạy lệnh sau trên máy cá nhân:
```bash
# Trên Windows
vm 5

# Hoặc qua Bash
./scripts/remote-vm/backup_db.sh
```
**Cơ chế hoạt động:**
1. Script SSH vào VM và kích hoạt `docker exec mini-forum-db pg_dump`.
2. Tạo file snapshot nén gzip dạng: `mini_forum_backup_YYYYMMDD_HHMMSS.sql.dump`.
3. Tự động tải file về thư mục `backend/backups/` trên máy cá nhân của bạn.
4. Xóa file tạm trên VM để tiết kiệm dung lượng ổ đĩa.

### 2. Khôi phục CSDL từ máy cá nhân lên VM
Đặt file `.dump` vào thư mục `backend/backups/` và chạy:
```bash
# Trên Windows
vm 6

# Hoặc qua Bash
./scripts/remote-vm/restore_db.sh
```
**Cơ chế hoạt động:**
1. Tự động nhận diện bản backup mới nhất trong `backend/backups/`.
2. Đẩy file lên VM và nạp trực tiếp vào container `mini-forum-db` qua `pg_restore`.
3. Kiểm tra tính toàn vẹn của dữ liệu sau khi nạp.

---

## 🧹 5. Bộ Script Tiện Ích Dọn Dẹp & Đồng Bộ (Maintenance Scripts)

Các script quản trị chuyên sâu nằm tại `backend/scripts/`:

### A. Reset & Làm sạch dữ liệu
- **`backupDb.ts`**: Script sao lưu cơ sở dữ liệu qua Node.js:
  ```bash
  cd backend && npx ts-node scripts/backupDb.ts
  ```
- **`clearData.ts`**: Xóa sạch toàn bộ bài viết, bình luận, vote mà vẫn giữ nguyên cấu trúc danh mục và người dùng.
- **`wipeAllDb.ts`**: Xóa sạch toàn bộ bảng trong database về trạng thái rỗng hoàn toàn.

### B. Quản lý Ảnh Media & CDN ImageKit
Chi tiết xem tại [`backend/scripts/README_MEDIA_SCRIPTS.md`](../backend/scripts/README_MEDIA_SCRIPTS.md):
- **`resetPostMedia.ts`**: Xóa toàn bộ ảnh đính kèm bài viết trên cả ImageKit và database.
- **`resetAvatarMedia.ts`**: Xóa avatar thành viên trên ImageKit và reset trường avatar trong DB.
- **`resetAllMedia.ts`**: Reset toàn bộ media bài viết và avatar trong 1 lệnh duy nhất.
- **`cleanupImagekit.ts`**: Quét và dọn dẹp các file rác mồ côi (orphaned files) trên ImageKit không còn liên kết với bản ghi nào trong database.
