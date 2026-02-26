# Manual Testing Checklist — Mini Forum

> **Version**: v1.19.0  
> **Last Updated**: 2026-02-26  
> **URLs**: Frontend `http://localhost:5173` | Admin `http://localhost:5174` | Backend `http://localhost:3000`

---

## Test Accounts

| Role | Email | Username | Password |
|------|-------|----------|----------|
| Admin | `admin@forum.com` | `admin` | `Admin@123` |
| Moderator | `mod@forum.com` | `mod` | `Moderator@123` |
| Member | `john@example.com` | `john` | `Member@123` |
| Member 2 | *(tạo mới khi test)* | — | — |

**Legend**: ✅ Pass | ❌ Fail | ⚠️ Partial | ⬜ Chưa test

---

## Mục lục

1. [Authentication](#1-authentication)
2. [Posts — Xem & lọc](#2-posts--xem--lọc)
3. [Posts — CRUD](#3-posts--crud)
4. [Comments](#4-comments)
5. [Votes](#5-votes)
6. [Bookmarks](#6-bookmarks)
7. [Notifications](#7-notifications)
8. [Search](#8-search)
9. [User Profile](#9-user-profile)
10. [Block & Report (Frontend)](#10-block--report-frontend)
11. [Admin — Dashboard & Overview](#11-admin--dashboard--overview)
12. [Admin — Users Management](#12-admin--users-management)
13. [Admin — Posts Moderation](#13-admin--posts-moderation)
14. [Admin — Comments Moderation](#14-admin--comments-moderation)
15. [Admin — Reports](#15-admin--reports)
16. [Admin — Categories & Tags](#16-admin--categories--tags)
17. [Admin — Audit Logs](#17-admin--audit-logs)
18. [UX & Giao diện](#18-ux--giao-diện)
19. [Responsive Design](#19-responsive-design)
20. [Edge Cases & Bảo mật](#20-edge-cases--bảo-mật)

---

## 1. Authentication

### 1.1 Đăng ký (Multi-step)

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 1.1.1 | Truy cập `/register` → Hiển thị Step 1 (email) | ⬜ | |
| 1.1.2 | Step 1: nhập email hợp lệ → kiểm tra real-time availability | ⬜ | |
| 1.1.3 | Step 1: nhập email đã tồn tại → báo lỗi "Email đã được sử dụng" | ⬜ | |
| 1.1.4 | Step 1: nhập email sai format → báo lỗi validation | ⬜ | |
| 1.1.5 | Step 1: nhấn Next → chuyển sang Step 2 (username) | ⬜ | |
| 1.1.6 | Step 2: nhập username hợp lệ → kiểm tra real-time availability | ⬜ | |
| 1.1.7 | Step 2: nhập username đã tồn tại → báo lỗi | ⬜ | |
| 1.1.8 | Step 2: nhấn Back → quay về Step 1, giữ nguyên email | ⬜ | |
| 1.1.9 | Step 2: nhấn Next → chuyển sang Step 3 (password) | ⬜ | |
| 1.1.10 | Step 3: nhập password < 8 ký tự → báo lỗi | ⬜ | |
| 1.1.11 | Step 3: password không khớp confirm → báo lỗi | ⬜ | |
| 1.1.12 | Step 3: password đủ điều kiện → nhấn Submit → đăng ký thành công | ⬜ | |
| 1.1.13 | Sau đăng ký thành công → tự động đăng nhập → redirect về homepage | ⬜ | |

### 1.2 Đăng nhập

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 1.2.1 | Đăng nhập bằng email + password hợp lệ → thành công | ⬜ | |
| 1.2.2 | Đăng nhập bằng username + password hợp lệ → thành công | ⬜ | |
| 1.2.3 | Đăng nhập với password sai → thông báo "Sai thông tin đăng nhập" | ⬜ | |
| 1.2.4 | Đăng nhập với email không tồn tại → báo lỗi | ⬜ | |
| 1.2.5 | Để trống fields → báo lỗi validation  | ⬜ | |
| 1.2.6 | Đăng nhập user bị ban → thông báo tài khoản bị khóa | ⬜ | |
| 1.2.7 | Đăng nhập thành công → accessToken + refreshToken được lưu localStorage | ⬜ | |
| 1.2.8 | Sau đăng nhập → Header hiển thị avatar + tên user | ⬜ | |

### 1.3 Token & Session

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 1.3.1 | Reload trang khi đã đăng nhập → session vẫn còn | ⬜ | |
| 1.3.2 | Access token hết hạn (15m) → tự động refresh token, không bị logout | ⬜ | Cần chờ/mock |
| 1.3.3 | Nhiều requests đồng thời khi token hết hạn → chỉ gọi refresh 1 lần (request queue) | ⬜ | |
| 1.3.4 | Refresh token hết hạn (7d) → bị logout, redirect về /login | ⬜ | |

### 1.4 Đăng xuất

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 1.4.1 | Nhấn Logout → xóa token khỏi localStorage | ⬜ | |
| 1.4.2 | Sau logout → redirect về trang login hoặc homepage | ⬜ | |
| 1.4.3 | Sau logout → truy cập route bảo vệ → redirect đến login | ⬜ | |

---

## 2. Posts — Xem & lọc

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 2.1 | Guest truy cập homepage → thấy danh sách posts công khai | ⬜ | |
| 2.2 | Posts hiển thị dạng grid 2 cột trên desktop | ⬜ | |
| 2.3 | Skeleton loading hiển thị khi đang tải | ⬜ | |
| 2.4 | Có nút chuyển trang (pagination) ở cuối danh sách | ⬜ | |
| 2.5 | Filter theo Category → chỉ hiện posts thuộc category đó | ⬜ | |
| 2.6 | Filter theo Tag → chỉ hiện posts có tag đó | ⬜ | |
| 2.7 | Filter nhiều tags cùng lúc | ⬜ | |
| 2.8 | Sort: "Mới nhất" → bài mới nhất lên trên | ⬜ | |
| 2.9 | Sort: "Phổ biến" → bài nhiều vote lên trên | ⬜ | |
| 2.10 | Sort: "Xu hướng" → bài trending lên trên | ⬜ | |
| 2.11 | Sort: "Cũ nhất" | ⬜ | |
| 2.12 | Click lại nút sort đang active → đảo chiều (reverse) | ⬜ | |
| 2.13 | Kết hợp filter + sort → kết quả chính xác | ⬜ | |
| 2.14 | Bài viết ghim (pinned) hiển thị ở đầu danh sách | ⬜ | |
| 2.15 | PinnedPostsModal tự động popup khi vào trang chủ (lần đầu) | ⬜ | |
| 2.16 | PinnedPostsModal không popup lại trong vòng 10 phút (cooldown) | ⬜ | |
| 2.17 | RightSidebar hiển thị danh sách bài ghim | ⬜ | |
| 2.18 | Truy cập post detail → view count tăng lên | ⬜ | |

---

## 3. Posts — CRUD

### 3.1 Tạo bài viết

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 3.1.1 | Guest nhấn "Tạo bài viết" → redirect về login | ⬜ | |
| 3.1.2 | Member nhấn "Tạo bài viết" → mở dialog (không chuyển trang) | ⬜ | |
| 3.1.3 | Dialog: chọn Category (bắt buộc) | ⬜ | |
| 3.1.4 | Không chọn category → không cho submit | ⬜ | |
| 3.1.5 | Nhập tiêu đề (title) | ⬜ | |
| 3.1.6 | Nhập nội dung bằng Markdown editor | ⬜ | |
| 3.1.7 | Preview Markdown trong editor hoạt động | ⬜ | |
| 3.1.8 | Chọn Tags (tùy chọn, gợi ý theo category đã chọn) | ⬜ | |
| 3.1.9 | Emoji picker trong editor hoạt động | ⬜ | |
| 3.1.10 | Draft tự động lưu vào localStorage sau ~30 giây | ⬜ | |
| 3.1.11 | Reload trang → draft vẫn còn trong editor | ⬜ | |
| 3.1.12 | Submit bài viết hợp lệ → tạo thành công, redirect đến post detail | ⬜ | |
| 3.1.13 | Create trong category yêu cầu permission → kiểm tra permission trước | ⬜ | |

### 3.2 Xem bài viết

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 3.2.1 | PostDetailPage hiển thị đầy đủ: tiêu đề, tác giả, nội dung, tags | ⬜ | |
| 3.2.2 | Nội dung Markdown được render đúng | ⬜ | |
| 3.2.3 | Hiển thị vote score, số comment, ngày đăng | ⬜ | |

### 3.3 Sửa bài viết

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 3.3.1 | Tác giả thấy nút "Edit" trên bài của mình | ⬜ | |
| 3.3.2 | User khác không thấy nút Edit | ⬜ | |
| 3.3.3 | Nhấn Edit → mở dialog/form có sẵn data cũ | ⬜ | |
| 3.3.4 | Chỉnh sửa title, content, tags → lưu thành công | ⬜ | |

### 3.4 Xóa bài viết

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 3.4.1 | Tác giả thấy nút "Delete" trên bài của mình | ⬜ | |
| 3.4.2 | Nhấn Delete → hiển thị confirm dialog | ⬜ | |
| 3.4.3 | Confirm xóa → bài bị xóa, redirect về danh sách | ⬜ | |
| 3.4.4 | Hủy confirm → bài không bị xóa | ⬜ | |

---

## 4. Comments

### 4.1 Tạo comment

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 4.1.1 | Guest không thấy form comment | ⬜ | |
| 4.1.2 | Member thấy form comment ở cuối PostDetailPage | ⬜ | |
| 4.1.3 | Nhập nội dung → Submit → comment hiện lên | ⬜ | |
| 4.1.4 | Gửi comment rỗng → không cho submit | ⬜ | |
| 4.1.5 | Emoji picker trong comment editor hoạt động | ⬜ | |
| 4.1.6 | Markdown trong comment được render đúng | ⬜ | |
| 4.1.7 | Bài viết bị lock → form comment bị disable | ⬜ | |
| 4.1.8 | Comment trong category không có quyền → báo lỗi | ⬜ | |

### 4.2 Reply comment

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 4.2.1 | Nhấn "Reply" trên comment → hiện form reply inline | ⬜ | |
| 4.2.2 | Submit reply → hiện dưới comment gốc (thụt lề) | ⬜ | |
| 4.2.3 | Nhấn "Quote Reply" → nội dung comment gốc được trích dẫn vào form | ⬜ | |
| 4.2.4 | Quote reply hiển thị đúng khi render | ⬜ | |

### 4.3 Sort comments

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 4.3.1 | Sort "Most Engaging" → comment nhiều tương tác lên trên | ⬜ | |
| 4.3.2 | Sort "Newest" → comment mới nhất lên trên | ⬜ | |
| 4.3.3 | Sort "Oldest" → comment cũ nhất lên trên | ⬜ | |

### 4.4 Sửa comment

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 4.4.1 | Tác giả thấy nút Edit trên comment của mình | ⬜ | |
| 4.4.2 | Comment mới hơn 30 phút → nút Edit vẫn hoạt động | ⬜ | |
| 4.4.3 | Comment cũ hơn 30 phút → nút Edit bị disable hoặc ẩn | ⬜ | |
| 4.4.4 | Sửa comment → hiển thị badge "đã chỉnh sửa" (isEdited) | ⬜ | |

### 4.5 Xóa comment

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 4.5.1 | Tác giả có thể xóa comment của mình | ⬜ | |
| 4.5.2 | Confirm dialog trước khi xóa | ⬜ | |

---

## 5. Votes

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 5.1 | Guest không thể vote → redirect login hoặc tooltip | ⬜ | |
| 5.2 | Member upvote bài viết → score tăng 1, animation hiệu ứng | ⬜ | |
| 5.3 | Member downvote bài viết → score giảm 1 | ⬜ | |
| 5.4 | Click upvote lần 2 → hủy vote, score về cũ | ⬜ | |
| 5.5 | Đang upvote → click downvote → vote đổi chiều (score thay đổi 2) | ⬜ | |
| 5.6 | Upvote comment → score tăng 1 | ⬜ | |
| 5.7 | Downvote comment → score giảm | ⬜ | |
| 5.8 | Không thể vote bài viết của chính mình (self-vote prevention) | ⬜ | |
| 5.9 | Không thể vote comment của chính mình | ⬜ | |
| 5.10 | Optimistic update: UI cập nhật ngay lập tức khi vote | ⬜ | |
| 5.11 | Nếu API fail → UI rollback về trạng thái cũ | ⬜ | |
| 5.12 | Vote history trong `/users/me/votes` | ⬜ | |

---

## 6. Bookmarks

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 6.1 | Guest không thể bookmark | ⬜ | |
| 6.2 | Nhấn bookmark icon → bài được thêm vào bookmarks | ⬜ | |
| 6.3 | Icon bookmark đổi trạng thái (animation pulsе) | ⬜ | |
| 6.4 | Nhấn bookmark icon lần 2 → hiện confirm dialog "Xóa bookmark?" | ⬜ | |
| 6.5 | Confirm xóa → bookmark bị xóa, icon trở về trạng thái chưa bookmark | ⬜ | |
| 6.6 | Vào trang `/bookmarks` → thấy danh sách bài đã bookmark | ⬜ | |
| 6.7 | Danh sách bookmarks có pagination | ⬜ | |
| 6.8 | Xóa bookmark từ trang /bookmarks | ⬜ | |

---

## 7. Notifications

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 7.1 | Ai đó comment vào bài → tác giả nhận notification loại COMMENT | ⬜ | |
| 7.2 | Ai đó reply comment → nhận notification loại REPLY | ⬜ | |
| 7.3 | Bài viết được upvote → nhận notification loại UPVOTE | ⬜ | |
| 7.4 | Bell icon hiển thị badge số lượng chưa đọc | ⬜ | |
| 7.5 | Khi đang ở `/notifications` → bell icon bị disable | ⬜ | |
| 7.6 | Click bell → dropdown chỉ hiển thị notifications chưa đọc | ⬜ | |
| 7.7 | Không nhận notification khi tự action trên bài/comment của mình | ⬜ | |
| 7.8 | Click một notification → navigate đến bài viết/comment liên quan | ⬜ | |
| 7.9 | Mark 1 notification as read → badge giảm | ⬜ | |
| 7.10 | "Mark all as read" → badge về 0, tất cả notifications đổi trạng thái | ⬜ | |
| 7.11 | Trang `/notifications` hiển thị cả đã đọc + chưa đọc | ⬜ | |
| 7.12 | Xóa notification → biến mất khỏi danh sách | ⬜ | |
| 7.13 | Fade-out animation khi đánh dấu đã đọc | ⬜ | |

---

## 8. Search

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 8.1 | Nhập từ khóa vào search bar → gợi ý autocomplete xuất hiện | ⬜ | |
| 8.2 | Submit search → ra trang kết quả với posts liên quan | ⬜ | |
| 8.3 | Kết quả search theo độ liên quan (Relevance) | ⬜ | |
| 8.4 | Sort kết quả: Latest, Popular, Trending | ⬜ | |
| 8.5 | Search không có kết quả → hiện "Không tìm thấy" | ⬜ | |
| 8.6 | Search users theo username → trả về user đúng | ⬜ | |
| 8.7 | Posts trong category restricted không hiển thị cho user không có quyền | ⬜ | |
| 8.8 | Rate limit: 30 requests/phút (khó test thủ công — ghi nhận) | ⬜ | Note |

---

## 9. User Profile

### 9.1 Xem profile

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 9.1.1 | Truy cập `/u/:username` → thấy profile page | ⬜ | |
| 9.1.2 | Hiển thị: avatar, display name, username, bio, ngày tham gia | ⬜ | |
| 9.1.3 | Hiển thị: số bài viết, số bình luận, reputation score | ⬜ | |
| 9.1.4 | Tab "Posts" → danh sách bài viết của user | ⬜ | |
| 9.1.5 | Tab "Comments" → danh sách bình luận của user | ⬜ | |
| 9.1.6 | Tab "Vote History" → chỉ hiện khi xem profile của chính mình | ⬜ | |
| 9.1.7 | Xem profile người khác → không thấy tab Vote History | ⬜ | |

### 9.2 Cập nhật profile

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 9.2.1 | Nhấn "Edit Profile" trên profile của mình → mở form | ⬜ | |
| 9.2.2 | Cập nhật display name → lưu thành công | ⬜ | |
| 9.2.3 | Cập nhật bio → lưu thành công | ⬜ | |
| 9.2.4 | Cập nhật avatar URL → ảnh đổi ngay | ⬜ | |
| 9.2.5 | Đổi username → kiểm tra availability, lưu thành công | ⬜ | |
| 9.2.6 | Đổi username trùng → báo lỗi | ⬜ | |
| 9.2.7 | Đổi password: nhập password cũ sai → báo lỗi | ⬜ | |
| 9.2.8 | Đổi password: password cũ đúng, password mới hợp lệ → thành công | ⬜ | |

---

## 10. Block & Report (Frontend)

### 10.1 Block user

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 10.1.1 | Vào profile người dùng → thấy nút "Block" | ⬜ | |
| 10.1.2 | Nhấn Block → confirm → user bị block | ⬜ | |
| 10.1.3 | Nội dung từ user đã block bị ẩn khỏi feed | ⬜ | |
| 10.1.4 | Vào `/blocked-users` → thấy danh sách user đã block | ⬜ | |
| 10.1.5 | Unblock từ trang blocked-users → user xuất hiện lại trong feed | ⬜ | |
| 10.1.6 | Không thể tự block chính mình | ⬜ | |

### 10.2 Report content

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 10.2.1 | Report bài viết → mở form report dropdown | ⬜ | |
| 10.2.2 | Chọn lý do → Submit → thành công | ⬜ | |
| 10.2.3 | Report comment | ⬜ | |
| 10.2.4 | Report user từ profile | ⬜ | |
| 10.2.5 | Guest không thể report | ⬜ | |

---

## 11. Admin — Dashboard & Overview

> Login tại `http://localhost:5174` với account Admin hoặc Moderator

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 11.1 | MEMBER đăng nhập vào admin → bị từ chối (yêu cầu MOD/ADMIN) | ⬜ | |
| 11.2 | Dashboard hiển thị stat cards: Total Users, Posts, Comments | ⬜ | |
| 11.3 | Dashboard hiển thị: New Users Today, New Posts Today | ⬜ | |
| 11.4 | Dashboard hiển thị: Pending Reports count | ⬜ | |
| 11.5 | Dashboard hiển thị: Active Users (7 ngày) | ⬜ | |
| 11.6 | Chart "Posts over time" hiển thị | ⬜ | |
| 11.7 | Chart "Users over time" hiển thị | ⬜ | |
| 11.8 | Quick action "View pending reports" navigate đến Reports page | ⬜ | |

---

## 12. Admin — Users Management

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 12.1 | Trang Users hiển thị data table đầy đủ | ⬜ | |
| 12.2 | Tìm kiếm user theo username/email | ⬜ | |
| 12.3 | Filter theo role (ADMIN/MODERATOR/MEMBER) | ⬜ | |
| 12.4 | Filter theo status (ACTIVE/BANNED) | ⬜ | |
| 12.5 | Xem chi tiết user (click vào row) | ⬜ | |
| 12.6 | Ban user (MOD/ADMIN): đổi status → BANNED | ⬜ | |
| 12.7 | Unban user → status trở về ACTIVE | ⬜ | |
| 12.8 | Đổi role user (ADMIN only): MEMBER → MODERATOR | ⬜ | |
| 12.9 | MODERATOR không thấy nút đổi role | ⬜ | |
| 12.10 | Xóa user (ADMIN only) → confirm dialog → xóa thành công | ⬜ | |
| 12.11 | MODERATOR không có nút xóa user | ⬜ | |

---

## 13. Admin — Posts Moderation

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 13.1 | Trang Posts hiển thị tất cả bài viết (kể cả hidden) | ⬜ | |
| 13.2 | Filter/search posts theo tiêu đề | ⬜ | |
| 13.3 | Filter theo category | ⬜ | |
| 13.4 | Filter theo status (PUBLISHED/HIDDEN) | ⬜ | |
| 13.5 | Pin bài viết: chọn type GLOBAL → bài ghim trên toàn forum | ⬜ | |
| 13.6 | Pin bài viết: chọn type CATEGORY → ghim trong category đó | ⬜ | |
| 13.7 | Unpin bài viết | ⬜ | |
| 13.8 | Reorder pins (ADMIN only): kéo thả hoặc set pinOrder | ⬜ | |
| 13.9 | Lock bài viết → bài không nhận comment mới | ⬜ | |
| 13.10 | Unlock bài viết → bài nhận comment trở lại | ⬜ | |
| 13.11 | Hide bài viết → ẩn khỏi listing công khai | ⬜ | |
| 13.12 | Show lại bài viết đã ẩn | ⬜ | |
| 13.13 | Xóa bài viết → confirm → xóa vĩnh viễn | ⬜ | |
| 13.14 | Xem danh sách pinned posts riêng | ⬜ | |

---

## 14. Admin — Comments Moderation

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 14.1 | Trang Comments hiển thị tất cả comments | ⬜ | |
| 14.2 | Filter comments theo bài viết | ⬜ | |
| 14.3 | Filter theo trạng thái (bình thường / masked) | ⬜ | |
| 14.4 | Hide comment: đổi status → comment bị ẩn | ⬜ | |
| 14.5 | Mask comment content → nội dung bị che (vi phạm) | ⬜ | |
| 14.6 | MOD/ADMIN xem được nội dung comment bị mask | ⬜ | |
| 14.7 | Unmask comment | ⬜ | |
| 14.8 | Xóa comment → confirm → xóa thành công | ⬜ | |

---

## 15. Admin — Reports

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 15.1 | Trang Reports hiển thị tất cả reports | ⬜ | |
| 15.2 | Filter reports theo type: POST / COMMENT / USER | ⬜ | |
| 15.3 | Filter theo status: PENDING / REVIEWING / RESOLVED / DISMISSED | ⬜ | |
| 15.4 | Xem chi tiết report (click vào row) | ⬜ | |
| 15.5 | Đổi status: PENDING → REVIEWING | ⬜ | |
| 15.6 | Resolve report: REVIEWING → RESOLVED | ⬜ | |
| 15.7 | Dismiss report: REVIEWING → DISMISSED | ⬜ | |
| 15.8 | Resolve + action: hide bài/comment vi phạm từ report detail | ⬜ | |
| 15.9 | Report history được lưu giữ | ⬜ | |

---

## 16. Admin — Categories & Tags

### 16.1 Categories (ADMIN only)

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 16.1.1 | Hiển thị danh sách categories | ⬜ | |
| 16.1.2 | MODERATOR không có nút tạo/sửa/xóa category | ⬜ | |
| 16.1.3 | Tạo category mới: tên, slug, mô tả | ⬜ | |
| 16.1.4 | Tạo category trùng tên → báo lỗi | ⬜ | |
| 16.1.5 | Cập nhật category → lưu thành công | ⬜ | |
| 16.1.6 | Xóa category → confirm → xóa thành công | ⬜ | |
| 16.1.7 | Set permission "viewPermission": cho phép tất cả / chỉ members | ⬜ | |
| 16.1.8 | Set permission "postPermission": chỉ members / mods mới post được | ⬜ | |
| 16.1.9 | Set permission "commentPermission" | ⬜ | |
| 16.1.10 | Kiểm tra permission ảnh hưởng lên frontend (guest không thấy posts) | ⬜ | |

### 16.2 Tags (MOD/ADMIN)

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 16.2.1 | Hiển thị danh sách tags | ⬜ | |
| 16.2.2 | Tạo tag mới: tên, liên kết category | ⬜ | |
| 16.2.3 | Tạo tag trùng tên → báo lỗi | ⬜ | |
| 16.2.4 | Cập nhật tag | ⬜ | |
| 16.2.5 | Xóa tag → confirm → xóa thành công | ⬜ | |

---

## 17. Admin — Audit Logs

> Chỉ ADMIN mới xem được

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 17.1 | Trang Audit Logs hiển thị danh sách hoạt động | ⬜ | |
| 17.2 | Mỗi log hiển thị: action type, actor, target, timestamp | ⬜ | |
| 17.3 | Filter theo action type | ⬜ | |
| 17.4 | Filter theo user (actor) | ⬜ | |
| 17.5 | Filter theo date range | ⬜ | |
| 17.6 | MODERATOR login → không thấy menu Audit Logs | ⬜ | |
| 17.7 | Các action: ban user, pin post, hide post, resolve report… đều được ghi log | ⬜ | |

---

## 18. UX & Giao diện

### 18.1 Chủ đề (Dark/Light mode)

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 18.1.1 | Nhấn nút toggle theme → đổi giữa dark/light | ⬜ | |
| 18.1.2 | Reload trang → theme được lưu (localStorage) | ⬜ | |

### 18.2 Animations & Loading

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 18.2.1 | Skeleton loading hiển thị khi tải trang/danh sách | ⬜ | |
| 18.2.2 | Transition animations khi chuyển trang (fade-in-up) | ⬜ | |
| 18.2.3 | Hiệu ứng vote animation khi click vote button | ⬜ | |
| 18.2.4 | Hiệu ứng bookmark animation khi click | ⬜ | |
| 18.2.5 | Bell ring animation khi có notification mới | ⬜ | |
| 18.2.6 | Error shake animation khi submit form lỗi | ⬜ | |
| 18.2.7 | Scroll highlight flash khi navigate đến comment cụ thể | ⬜ | |

### 18.3 Navigation

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 18.3.1 | Logo click → về homepage | ⬜ | |
| 18.3.2 | Left sidebar: hiển thị categories, links điều hướng | ⬜ | |
| 18.3.3 | Breadcrumb (nếu có) hoạt động đúng | ⬜ | |

---

## 19. Responsive Design

| # | Test Case | Viewport | Kết quả | Ghi chú |
|---|-----------|----------|:-------:|---------|
| 19.1 | Layout 1 cột, hamburger menu | < 480px | ⬜ | Mobile |
| 19.2 | Left sidebar ẩn, MobileNav hiển thị | < 768px | ⬜ | |
| 19.3 | Left sidebar hiển thị | ≥ 768px | ⬜ | |
| 19.4 | Layout 2 cột | 769–1024px | ⬜ | |
| 19.5 | Right sidebar hiển thị | ≥ 1280px | ⬜ | |
| 19.6 | Post grid 2 cột trên desktop, 1 cột trên mobile | — | ⬜ | |
| 19.7 | Forms/Dialogs usable trên mobile | — | ⬜ | |
| 19.8 | Admin client responsive (tablet) | — | ⬜ | |

---

## 20. Edge Cases & Bảo mật

| # | Test Case | Kết quả | Ghi chú |
|---|-----------|:-------:|---------|
| 20.1 | Truy cập route private khi chưa đăng nhập → redirect login | ⬜ | |
| 20.2 | Truy cập `/admin` bằng MEMBER account → bị từ chối | ⬜ | |
| 20.3 | Gọi API admin bằng MEMBER token → 403 Forbidden | ⬜ | |
| 20.4 | XSS: nhập `<script>alert(1)</script>` vào title/content → không execute | ⬜ | |
| 20.5 | Thao tác với ID bài viết không tồn tại → 404 | ⬜ | |
| 20.6 | Sửa/xóa bài viết/comment của người khác (không phải owner) → 403 | ⬜ | |
| 20.7 | Token bị xóa thủ công khỏi localStorage → bị logout | ⬜ | |
| 20.8 | Sử dụng token giả/tampered → 401 Unauthorized | ⬜ | |
| 20.9 | Submit form nhiều lần nhanh (double submit) → chỉ tạo 1 bản ghi | ⬜ | |
| 20.10 | Tìm kiếm với ký tự đặc biệt/SQL injection patterns → không crash | ⬜ | |
| 20.11 | Nội dung rất dài (title 500+ chars, content 10000+ chars) → xử lý đúng | ⬜ | |
| 20.12 | Concurrent votes từ 2 session → không duplicate | ⬜ | |

---

## Tổng kết

| Nhóm | Tổng tests | Pass | Fail | Partial | Chưa test |
|------|:----------:|:----:|:----:|:-------:|:---------:|
| 1. Authentication | 17 | | | | |
| 2. Posts — Xem | 18 | | | | |
| 3. Posts — CRUD | 17 | | | | |
| 4. Comments | 17 | | | | |
| 5. Votes | 12 | | | | |
| 6. Bookmarks | 8 | | | | |
| 7. Notifications | 13 | | | | |
| 8. Search | 8 | | | | |
| 9. User Profile | 15 | | | | |
| 10. Block & Report | 11 | | | | |
| 11. Admin — Dashboard | 8 | | | | |
| 12. Admin — Users | 11 | | | | |
| 13. Admin — Posts | 14 | | | | |
| 14. Admin — Comments | 8 | | | | |
| 15. Admin — Reports | 9 | | | | |
| 16. Admin — Cat & Tags | 15 | | | | |
| 17. Admin — Audit Logs | 7 | | | | |
| 18. UX & Giao diện | 13 | | | | |
| 19. Responsive | 8 | | | | |
| 20. Edge Cases | 12 | | | | |
| **TOTAL** | **239** | | | | |

---

*Legend: ✅ Pass | ❌ Fail | ⚠️ Partial | ⬜ Chưa test*
