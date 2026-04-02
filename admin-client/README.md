## Tính năng chi tiết

### Dashboard
- Thống kê tổng quan: số users, posts, comments, reports
- Biểu đồ hoạt động
- Danh sách reports mới nhất

### Quản lý người dùng (UsersPage)
- Danh sách người dùng với phân trang, tìm kiếm
- Thay đổi role (Member ↔ Moderator ↔ Admin)
- Ban/unban tài khoản
- Xem chi tiết hoạt động

### Quản lý bài viết (PostsPage)
- Danh sách bài viết với bộ lọc (status, category)
- Pin/unpin bài viết (Global hoặc Category)
- Kéo thả sắp xếp thứ tự pin (React DnD)
- Lock/unlock bình luận
- Thay đổi trạng thái (Published, Hidden, Deleted)

### Quản lý bình luận (CommentsPage)
- Danh sách bình luận
- Ẩn/hiện bình luận (mask content)
- Xem nội dung đã ẩn (Admin only)
- Xóa bình luận

### Xử lý báo cáo (ReportsPage)
- Workflow trạng thái: Pending → Reviewing → Resolved/Dismissed
- Xem nội dung vi phạm (user/post/comment)
- Ghi chú xử lý
- Bộ lọc theo trạng thái

### Quản lý danh mục (CategoriesPage) — Admin only
- CRUD danh mục
- Cấu hình phân quyền view/post/comment per category
- Sắp xếp thứ tự hiển thị
- Chọn màu sắc

### Quản lý tags (TagsPage)
- CRUD tags
- Cấu hình quyền sử dụng (ALL, MEMBER, MODERATOR, ADMIN)
- Theo dõi số lượng sử dụng (usage_count)

### Nhật ký hành động (AuditLogsPage) — Admin only
- Xem tất cả hành động admin (tạo, sửa, xóa, ban, pin, lock...)
- Bộ lọc theo action, target type, user
- Chi tiết old/new values cho mỗi thao tác
- Thông tin IP, user agent

