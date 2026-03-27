# Tính năng hệ thống

> **Version**: v1.27.0  
> **Last Updated**: 2026-03-27

---

## Mục lục

1. [Feature Matrix](#1-feature-matrix)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Bài viết (Posts)](#3-bài-viết-posts)
4. [Bình luận (Comments)](#4-bình-luận-comments)
5. [Vote & Bookmark](#5-vote--bookmark)
6. [Thông báo (Notifications)](#6-thông-báo-notifications)
7. [Tìm kiếm (Search)](#7-tìm-kiếm-search)
8. [Hồ sơ người dùng (Profile)](#8-hồ-sơ-người-dùng-profile)
9. [Block & Report](#9-block--report)
10. [Quản trị (Admin)](#10-quản-trị-admin)
11. [UX & Animations](#11-ux--animations)
12. [Responsive Design](#12-responsive-design)

---

## 1. Feature Matrix

Ma trận tính năng cross-module — Backend (BE), Frontend (FE), Admin Client (AC).

### 1.1 Core Features

| Tính năng | BE | FE | AC | Ghi chú |
|-----------|:--:|:--:|:--:|---------|
| Đăng ký (multi-step) | ✅ | ✅ | — | Email → Username → Password |
| Đăng nhập (email/username) | ✅ | ✅ | ✅ | AC yêu cầu role MOD/ADMIN |
| JWT + Refresh token | ✅ | ✅ | ✅ | Access 15m, Refresh 7d |
| Posts CRUD | ✅ | ✅ | ✅ | FE qua Dialog, AC qua Table |
| Comments (2-level) | ✅ | ✅ | ✅ | Root + replies, quote reply |
| Voting (post + comment) | ✅ | ✅ | — | Polymorphic, optimistic update |
| Bookmarks | ✅ | ✅ | — | Toggle, danh sách riêng |
| Categories CRUD | ✅ | ✅ (read) | ✅ | AC: full CRUD + permissions |
| Tags CRUD | ✅ | ✅ (read) | ✅ | AC: full CRUD |
| Search (posts + users) | ✅ | ✅ | — | Full-text, suggestions |
| Notifications | ✅ | ✅ | — | 5 loại, soft delete |
| Block users | ✅ | ✅ | — | Ẩn nội dung user đã block |
| Report content | ✅ | ✅ | ✅ | AC: review & resolve workflow |
| User profiles | ✅ | ✅ | ✅ (view) | Tabs: posts, comments, votes |
| Bot badge | ✅ | ✅ | ✅ | Badge "Bot" (emerald) trên PostCard & Profile |

### 1.2 Moderation Features

| Tính năng | BE | FE | AC | Ghi chú |
|-----------|:--:|:--:|:--:|---------|
| Pin bài viết | ✅ | — | ✅ | GLOBAL / CATEGORY, pinOrder |
| Lock bài viết | ✅ | — | ✅ | Chặn comment mới |
| Hide bài viết | ✅ | — | ✅ | Ẩn khỏi listing |
| Hide comment | ✅ | — | ✅ | Mask nội dung |
| View masked content | ✅ | — | ✅ | MOD/ADMIN |
| Ban user | ✅ | — | ✅ | MOD: đổi status, ADMIN: full |
| Change role | ✅ | — | ✅ | ADMIN only |
| Category permissions | ✅ | ✅ | ✅ | 3 level: view, post, comment |
| Audit logs | ✅ | — | ✅ | ADMIN only, 15 action types |

### 1.3 UX Features

| Tính năng | BE | FE | AC | Ghi chú |
|-----------|:--:|:--:|:--:|---------|
| Dark/Light mode | — | ✅ | ✅ | Lưu localStorage |
| Font size scale | — | ✅ | — | 5 mức: xs/sm/md/lg/xl |
| Draft auto-save | — | ✅ | — | 30 giây interval |
| Markdown support | — | ✅ | — | Renderer + Guide |
| Emoji picker | — | ✅ | — | Posts & comments |
| Skeleton loading | — | ✅ | — | Tất cả pages |
| Animations (~30+) | — | ✅ | — | CSS keyframes |
| Pinned posts modal | — | ✅ | — | Auto-popup, cooldown 10m |
| Responsive design | — | ✅ | ✅ | Mobile-first |
| Dashboard stats | ✅ | — | ✅ | Stat cards + recent activities |
| Dynamic config | ✅ | ✅ | — | Comment edit time limit lấy từ API |
| Mobile category bar | — | ✅ | — | Horizontal scroll, ≤ md |
| Data tables | — | — | ✅ | Custom tables (shadcn/ui) |

---

## 2. Authentication & Authorization

### 2.1 Registration Flow (OTP-based)

```
Step 1: Nhập email      → POST /auth/send-otp-register (gửi OTP qua email)
Step 2: Nhập OTP 6 số   → POST /auth/verify-otp-register (xác thực mã)
Step 3: Nhập username    → GET /auth/check-username (kiểm tra trùng)
       + password        → POST /auth/register → JWT tokens
```

### 2.2 Login Flow

```
Nhập email/username + password → POST /auth/login → { accessToken, refreshToken }
```

- Frontend token prefix: `forum_access_token`, `forum_refresh_token`
- Admin token prefix: `admin_access_token`, `admin_refresh_token`
- Cho phép login đồng thời cả hai app

### 2.3 Token Refresh

```
Access token hết hạn (15m) → POST /auth/refresh (kèm refreshToken)
    → Nhận cặp token mới → Request queue xử lý concurrent requests
```

### 2.4 Role-Based Access Control

| Role | Quyền hạn |
|------|-----------|
| Guest | Xem bài viết công khai, tìm kiếm, đăng ký |
| MEMBER | Đăng bài, bình luận, vote, bookmark, report || BOT | Cùng quyền MEMBER, tạo nội dung qua Vibe Content Service || MODERATOR | + Pin/lock/hide bài viết, ẩn comment, xử lý report |
| ADMIN | + CRUD categories/tags, ban user, đổi role, audit logs |

---

## 3. Bài viết (Posts)

### 3.1 Tạo bài viết

- Dialog-based form (không chuyển trang)
- Chọn category (bắt buộc), tags (tùy chọn, gợi ý theo category)
- Markdown editor với preview
- Draft auto-save mỗi 30 giây (localStorage)
- Kiểm tra permission theo category trước khi cho phép

### 3.2 Hiển thị

- Grid 2 cột trên desktop
- Filter: category, tag(s), status, date range
- Sort: Phổ biến, Mới nhất, Xu hướng, Cũ nhất (click lại để reverse)
- Pagination (offset-based)
- View count tracking

### 3.3 Pin Types

| Type | Scope | Ưu tiên |
|------|-------|---------|
| GLOBAL | Toàn bộ forum | Cao nhất |
| CATEGORY | Trong category | Cao trong scope |

- `pinOrder` để sắp xếp thứ tự bài ghim
- PinnedPostsModal tự động popup khi về trang chủ (cooldown 10 phút)
- RightSidebar hiển thị danh sách bài ghim

### 3.4 Moderation

| Action | Role tối thiểu | Mô tả |
|--------|---------------|-------|
| Pin/Unpin | MODERATOR | Ghim/bỏ ghim bài viết |
| Lock/Unlock | MODERATOR | Khóa/mở khóa bình luận |
| Hide/Show | MODERATOR | Ẩn/hiện bài viết |
| Delete | ADMIN | Xóa vĩnh viễn |
| Change status | MODERATOR | PUBLISHED ↔ HIDDEN |

---

## 4. Bình luận (Comments)

### 4.1 Cấu trúc

- **2 cấp**: Root comments + Replies (không nested sâu hơn)
- **Quote reply**: Trích dẫn comment khác kèm highlight
- **isEdited badge**: Hiển thị khi comment đã chỉnh sửa

### 4.2 Sorting

| Option | Mô tả |
|--------|-------|
| Oldest | Cũ nhất trước |
| Newest | Mới nhất trước |
| Popular | Nhiều tương tác nhất (votes) |

### 4.3 Giới hạn

- Edit time limit: **30 phút** (configurable qua `COMMENT_EDIT_TIME_LIMIT`)
- Không comment khi bài viết bị lock
- Kiểm tra permission category trước khi comment
- Content masking cho comment vi phạm (`isContentMasked`)

---

## 5. Vote & Bookmark

### 5.1 Voting System

- **Polymorphic**: Vote cho cả Post và Comment
- **Toggle logic**: Click lần 2 để xóa vote, click vote khác để chuyển
- **Self-vote prevention**: Không thể vote bài/comment của chính mình
- **Optimistic updates**: UI cập nhật ngay, rollback nếu API fail
- **Animated feedback**: Hiệu ứng animation khi vote
- **Reputation updates**: Tác giả nhận/mất reputation khi được vote

### 5.2 Bookmarks

- Toggle bookmark từ PostCard hoặc PostDetailPage
- Trang BookmarksPage riêng với pagination
- Confirm dialog khi xóa bookmark
- Trạng thái bookmark hiển thị realtime

---

## 6. Thông báo (Notifications)

### 6.1 Loại thông báo

| Type | Trigger |
|------|---------|
| COMMENT | Ai đó comment bài viết của bạn |
| REPLY | Ai đó reply comment của bạn |
| MENTION | Được nhắc đến trong comment |
| UPVOTE | Bài viết/comment được upvote |
| SYSTEM | Thông báo hệ thống |

### 6.2 UI

- **NotificationBell** (Header): Dropdown chỉ hiển thị chưa đọc, badge số lượng
- **NotificationsPage**: Hiển thị tất cả thông báo (đã đọc + chưa đọc)
- Bell bị disable khi đang ở `/notifications`
- Fade-out animation khi đánh dấu đã đọc
- Click notification → navigate đến bài viết/comment liên quan

### 6.3 Đặc điểm

- Soft delete (deletedAt) — có thể restore
- Không gửi notification cho chính mình
- Enriched data: postId, postSlug, commentId

---

## 7. Tìm kiếm (Search)

### 7.1 Capabilities

| Endpoint | Mô tả |
|----------|-------|
| `GET /search` | Full-text search posts (title + content) |
| `GET /search/users` | Tìm kiếm users theo username/displayName |
| `GET /search/suggestions` | Gợi ý tìm kiếm (autocomplete) |

### 7.2 Sorting

- **Relevance**: Theo độ liên quan (mặc định)
- **Latest**: Mới nhất
- **Popular**: Nhiều tương tác nhất
- **Trending**: Xu hướng

### 7.3 Giới hạn

- Rate limit: 30 requests/phút
- Permission filter theo category (ẩn posts trong category restricted)
- Full-text search cơ bản (PostgreSQL tsvector)

---

## 8. Hồ sơ người dùng (Profile)

### 8.1 Thông tin hiển thị

- Display name, username, avatar, bio
- Ngày tham gia, số bài viết, số bình luận, reputation
- Date of birth, Gender (tùy chọn)

### 8.2 Tabs

| Tab | Nội dung | Ai xem được |
|-----|----------|-------------|
| Posts | Bài viết của user | Tất cả |
| Comments | Bình luận của user | Tất cả |
| Vote History | Lịch sử vote | Chỉ owner |

### 8.3 Actions

- Edit profile: display name, bio, avatar URL
- Change username (kiểm tra trùng)
- Change password (yêu cầu password cũ)
- Block/Unblock user (từ profile)
- Report user (từ profile)

---

## 9. Block & Report

### 9.1 Block Users

- Block/unblock từ profile page
- Trang BlockedUsersPage quản lý danh sách
- Content từ user đã block sẽ bị ẩn khỏi feed
- Không thể tự block chính mình

### 9.2 Report Content

| Target | Endpoint | Ai có thể report |
|--------|----------|-------------------|
| Post | `POST /posts/:id/report` | MEMBER+ |
| Comment | `POST /comments/:id/report` | MEMBER+ |
| User | `POST /users/:id/report` | MEMBER+ |

### 9.3 Report Workflow (Admin)

```
PENDING → REVIEWING → RESOLVED / DISMISSED
```

- Admin/Moderator review report trong Admin Client
- Có thể take action trên reported content (hide, ban, delete)
- Report history được lưu lại

---

## 10. Quản trị (Admin)

### 10.1 Dashboard

- Thống kê: Total Users, Posts, Comments, Pending Reports, Active Users, Pinned Posts
- Date-range filtering (startDate, endDate)
- Recent audit logs
- Pinned posts management
- Recent activities feed
- Category stats

### 10.2 Admin Client Pages

| Trang | Chức năng chính |
|-------|----------------|
| Dashboard | Thống kê + date filtering + pinned posts mgmt |
| Users | Bảng data table, ban/unban, đổi role |
| Posts | Filter/search, pin/lock/hide/delete |
| Comments | Filter, hide/delete, view masked content |
| Reports | Filter theo type/status, resolve/dismiss workflow |
| Categories | CRUD + permission settings (3 levels) |
| Tags | CRUD + category relationships |
| Audit Logs | Filter theo action/user/date range |
| Settings | System info, admin profile |

### 10.3 Permission Matrix

| Feature | ADMIN | MODERATOR |
|---------|:-----:|:---------:|
| Users Management | ✅ Full | ⚠️ View + Ban |
| Role Changes | ✅ | ❌ |
| Categories CRUD | ✅ | ❌ |
| Tags CRUD | ✅ | ✅ |
| Posts Moderation | ✅ | ✅ |
| Comments Moderation | ✅ | ✅ |
| Reports Handling | ✅ | ✅ |
| Audit Logs | ✅ Full | ❌ |
| Settings | ✅ | ✅ (read-only) |

---

## 10.5. Vibe Content (AI Bot Service)

### 10.5.1 Tổng quan

Dịch vụ tạo nội dung tự động bằng AI, mô phỏng hoạt động forum thực tế.

| Aspect | Detail |
|--------|--------|
| Scheduling | Cron job mỗi 30 phút (cấu hình được) |
| Actions | Tạo posts (40%), comments (35%), votes (25%) |
| LLM | Gemini → Groq → Cerebras → Template (fallback chain) |
| Bot users | Mỗi bot có personality, tone, topics riêng |
| Rate limit | 3 posts, 6 comments, 15 votes / bot / ngày |

### 10.5.2 Architecture

| Service | Chức năng |
|---------|-----------|
| ContentGeneratorService | Orchestrator chính |
| ActionSelectorService | Chọn bot + action (weighted random) |
| ContextGathererService | Lấy dữ liệu ngữ cảnh từ DB |
| PromptBuilderService | Build prompt từ template + personality |
| ValidationService | Validate output JSON từ LLM |
| APIExecutorService | Gọi Forum API (auth + execute) |
| PersonalityService | Quản lý tính cách bot |
| LLMProviderManager | Fallback chain cho LLM providers |

### 10.5.3 Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/health` | Health check |
| GET | `/status` | Status chi tiết (uptime, stats, queue) |
| GET/POST | `/trigger` | Trigger random action |
| GET | `/trigger/:actionType` | Trigger action cụ thể (post/comment/vote) |

---

## 11. UX & Animations

### 11.1 CSS Animations (~30+ keyframes)

| Animation | Mô tả | Nơi sử dụng |
|-----------|-------|-------------|
| `fade-in-up` | Fade + slide up | Page transitions |
| `fade-in-scale` | Fade + scale | Card entrance |
| `vote-up/down` | Bounce effect | Vote buttons |
| `bookmark-save` | Scale pulse | Bookmark toggle |
| `bell-ring` | Rung lắc | Notification bell |
| `skeleton-pulse` | Pulse animation | Loading states |
| `slide-expand` | Mở rộng | Edit/reply forms |
| `error-shake` | Lắc ngang | Form validation |
| `btn-press` | Scale down | Button feedback |
| `count-up/down` | Number change | Score display |
| `thread-grow` | Line grow | Comment connector |
| `highlight-flash` | Flash highlight | Scroll-to-content |
| `icon-swap` | Cross-fade | Icon toggle |
| `enter-from-left/right` | Slide entrance | Sidebar |
| `item-hover-lift` | Translate Y | List items hover |

### 11.2 Micro-interactions

- Login/Register: card fade-in, form stagger, input focus animation
- PostCard: tag badge transitions, footer stats hover, avatar hover scale
- Header: logo hover scale/rotate, nav button transitions
- Sidebar: entrance animations, active state transitions
- Notification: btn-press, pulse indicator, pagination transitions

---

## 12. Responsive Design

### 12.1 Breakpoints

| Range | Target | Layout |
|-------|--------|--------|
| < 480px | Mobile | 1 cột, hamburger menu |
| 481–768px | Tablet | 2 cột, collapsible sidebar |
| 769–1024px | Desktop | 2 cột + sidebar |
| 1025–1280px | Large desktop | 3 cột |
| > 1280px | Extra large | 3 cột, right sidebar visible |

### 12.2 Adaptive Behaviors

- Left sidebar: visible >= 768px
- Right sidebar: visible >= 1280px
- Font sizes: `clamp()` cho responsive typography
- Scrollbar gutter: stable để tránh layout shift
- Smart visibility: MobileNav component thay thế sidebar trên mobile

---

## Liên kết

- [Kiến trúc hệ thống](./01-ARCHITECTURE.md)
- [Database Schema](./02-DATABASE.md)
- [API Reference](./03-API/README.md)
- [Changelog](./05-CHANGELOG.md)
- [Roadmap](./06-ROADMAP.md)
