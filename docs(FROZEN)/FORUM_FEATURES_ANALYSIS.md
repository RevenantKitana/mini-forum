# Phân tích chức năng forum từ schema hiện có

> Nguồn dữ liệu: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

## 1) User & Identity
- **Đăng ký/đăng nhập, quản lý phiên đăng nhập dài hạn**
  - Bảng/cột: `User.email`, `User.passwordHash`, `RefreshToken.token`, `RefreshToken.expiresAt`
  - Chức năng: đăng nhập, refresh token, đăng xuất mọi thiết bị
  - Mức độ: thấp–trung bình
- **Hồ sơ người dùng nâng cao**
  - `User.displayName`, `User.avatarUrl`, `User.bio`, `User.gender`, `User.dateOfBirth`
  - Chức năng: profile, tùy biến hồ sơ, hiển thị tác giả
  - Mức độ: thấp
- **Trạng thái tài khoản**
  - `User.isVerified`, `User.isActive`, `User.lastActiveAt`
  - Chức năng: xác thực email, vô hiệu hóa tài khoản, hiển thị “last seen”
  - Mức độ: trung bình
- **Vai trò và phân quyền**
  - `User.role` (MEMBER/MODERATOR/ADMIN)
  - Chức năng: phân quyền quản trị, phân tuyến API
  - Mức độ: trung bình
- **Hệ thống uy tín**
  - `User.reputation`, `Vote` + `Post`/`Comment` đếm vote
  - Chức năng: rank, badge, giới hạn quyền theo uy tín
  - Mức độ: trung bình

## 2) Content & Thread Management
- **Bài viết & trạng thái vòng đời**
  - `Post.status` (DRAFT/PUBLISHED/HIDDEN/DELETED)
  - Chức năng: draft, ẩn bài, soft delete
  - Mức độ: thấp
- **Ghim bài / khóa thảo luận**
  - `Post.isPinned`, `Post.isLocked`
  - Chức năng: pin chủ đề, khóa comment
  - Mức độ: thấp
- **Danh mục, tag, phân loại**
  - `Category`, `Tag`, `PostTag`
  - Chức năng: phân loại, lọc theo tag/category, thống kê
  - Mức độ: thấp–trung bình
- **Thống kê bài viết**
  - `Post.viewCount`, `Post.commentCount`, `Post.upvoteCount`, `Post.downvoteCount`
  - Chức năng: trending, hot, leaderboard
  - Mức độ: trung bình
- **Bình luận lồng nhau & trích dẫn**
  - `Comment.parentId` (reply tree), `Comment.quotedCommentId`
  - Chức năng: reply thread, quote reply
  - Mức độ: trung bình
- **Chỉnh sửa bình luận**
  - `Comment.isEdited`, `Comment.updatedAt`
  - Chức năng: hiển thị “đã chỉnh sửa”
  - Mức độ: thấp

## 3) Moderation & Governance
- **Báo cáo nội dung / người dùng**
  - `Report.targetType`, `Report.targetId`, `Report.status`, `Report.reviewedBy`
  - Chức năng: quy trình review, hàng đợi xử lý
  - Mức độ: trung bình–cao
- **Ẩn/xóa nội dung bằng trạng thái**
  - `Post.status`, `Comment.status`
  - Chức năng: hide/soft delete theo kiểm duyệt
  - Mức độ: thấp
- **Khóa thảo luận theo post**
  - `Post.isLocked`
  - Chức năng: ngăn comment mới
  - Mức độ: thấp

## 4) Security & Abuse Prevention
- **Chặn người dùng**
  - `UserBlock` (blocker/blocked)
  - Chức năng: block, ẩn nội dung, chặn PM/mention
  - Mức độ: trung bình
- **Bảo vệ phiên đăng nhập**
  - `RefreshToken`
  - Chức năng: rotate refresh token, revoke
  - Mức độ: trung bình
- **Rate-limit logic dựa trên hoạt động**
  - `User.lastActiveAt`, `Post.createdAt`, `Comment.createdAt`
  - Chức năng: hạn chế spam
  - Mức độ: trung bình
- **Thống kê tín nhiệm chống lạm dụng**
  - `User.reputation`, `Vote`
  - Chức năng: giới hạn chức năng cho tài khoản mới
  - Mức độ: trung bình

## 5) Configuration & Feature Control
- **Bật/tắt category**
  - `Category.isActive`
  - Chức năng: đóng/mở category
  - Mức độ: thấp
- **Thứ tự hiển thị**
  - `Category.sortOrder`
  - Chức năng: sắp xếp category
  - Mức độ: thấp
- **Hệ thống thông báo**
  - `Notification.type`, `Notification.isRead`, `relatedId`, `relatedType`
  - Chức năng: thông báo theo sự kiện, đọc/chưa đọc
  - Mức độ: trung bình

---

# Các chức năng tiềm năng đang bị khai thác chưa hết
- `User.isVerified`, `User.usernameChangedAt`, `User.lastActiveAt`
  - Có dữ liệu nhưng có thể chưa có logic: yêu cầu xác thực email, giới hạn đổi username theo thời gian, “active status”.
- `Post.excerpt`
  - Có thể dùng làm preview/snippet, SEO, feed tối ưu.
- `Comment.isEdited`
  - Có cột nhưng thường chưa hiển thị flag, chưa có lịch sử chỉnh sửa.
- `Notification.relatedId`/`relatedType`
  - Có thể liên kết chính xác tới post/comment/user; nếu chưa dùng sẽ lãng phí.
- `Report.status` + `reviewedBy`
  - Có workflow đầy đủ nhưng nếu chưa triển khai bảng điều phối (triage/resolve) thì chưa khai thác.
- `UserBlock`
  - Chỉ lưu block nhưng nếu chưa dùng trong query lọc thì chưa có tác dụng thực.
- `Vote.targetType` + `targetId`
  - Mô hình polymorphic, có thể dùng cho nhiều target hơn mà không cần schema mới.

---

# Đề xuất mở rộng/tối ưu (không thay schema lớn)
## User & Identity
- Kích hoạt xác thực email dựa trên `User.isVerified` (trung bình).
- Giới hạn đổi `User.username` theo `User.usernameChangedAt` (thấp).
- “Active badge” dựa trên `User.lastActiveAt` (thấp).

## Content & Thread Management
- Feed “trending” dựa trên `Post.viewCount` + `upvoteCount` + `commentCount` (trung bình).
- Tự động sinh `Post.excerpt` khi tạo/sửa bài (thấp).
- Hiển thị cây bình luận có `parentId`, eager-load theo `postId` (trung bình).
- Hiển thị trích dẫn bình luận từ `quotedCommentId` (trung bình).

## Moderation & Governance
- Quy trình xử lý report: `PENDING` → `REVIEWING` → `RESOLVED/DISMISSED`, lưu `reviewedBy` (trung bình–cao).
- Soft delete bằng `Post.status`/`Comment.status` thay vì xóa thật (thấp).

## Security & Abuse Prevention
- Lọc nội dung từ user bị block trong query list (trung bình).
- Rate-limit tạo post/comment theo `createdAt` và `lastActiveAt` (trung bình).
- “Trust threshold”: chỉ cho phép các action nhạy cảm nếu `User.reputation` đủ (trung bình).

## Configuration & Feature Control
- Ẩn category nếu `Category.isActive = false` trong query (thấp).
- Sắp xếp category theo `sortOrder` ở mọi endpoint list (thấp).
- Thông báo deep-link dựa trên `Notification.relatedId` + `relatedType` (trung bình).

---

# Tối ưu truy vấn / index đề xuất (không đổi schema lớn)
- Tối ưu feed: thêm index kết hợp cho `Post.status + createdAt` (trung bình).
- Tối ưu list comment theo post: index `Comment.postId + createdAt` (trung bình).
- Tối ưu moderation queue: index `Report.status + createdAt` (trung bình).
