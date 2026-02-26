# THIẾT KẾ HỆ THỐNG WEBSITE FORUM FULL STACK

> **Đồ án tốt nghiệp đại học - Ngành Công nghệ Thông tin**  
> Ngày tạo: 28/01/2026

---

## MỤC LỤC

1. [Phân tích yêu cầu hệ thống](#1-phân-tích-yêu-cầu-hệ-thống)
2. [Lựa chọn công nghệ](#2-lựa-chọn-công-nghệ)
3. [Thiết kế cơ sở dữ liệu](#3-thiết-kế-cơ-sở-dữ-liệu)
4. [Thiết kế API Backend](#4-thiết-kế-api-backend-restful)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Hướng dẫn triển khai](#6-hướng-dẫn-triển-khai)
7. [Tóm tắt](#7-tóm-tắt)
8. [Scalability & Performance](#8-scalability--performance)
9. [Bảo mật nâng cao](#9-bảo-mật-nâng-cao)
10. [Real-time Features](#10-real-time-features)
11. [Testing & Monitoring](#11-testing--monitoring)
12. [SEO & Accessibility](#12-seo--accessibility)
13. [Deployment & DevOps](#13-deployment--devops)
14. [Product Roadmap](#14-product-roadmap)
15. [Tóm tắt cải tiến](#15-tóm-tắt-cải-tiến)

---

## 1. PHÂN TÍCH YÊU CẦU HỆ THỐNG

### 1.1 Mô tả tổng quan

Website Forum là nền tảng trực tuyến cho phép người dùng:
- Tạo tài khoản và quản lý hồ sơ cá nhân
- Đăng bài viết theo chủ đề (Category/Tag)
- Thảo luận thông qua hệ thống bình luận (hỗ trợ Quote Reply)
- Tương tác bằng Upvote/Downvote
- Bookmark bài viết yêu thích

### 1.2 Các Actor và Quyền hạn

| Actor | Mô tả | Quyền hạn chính |
|-------|-------|-----------------|
| **Guest** | Khách vãng lai | Xem bài viết, tìm kiếm |
| **Member** | Thành viên đã đăng ký | Đăng bài, bình luận, vote, bookmark |
| **Moderator** | Người kiểm duyệt | Xóa/ẩn nội dung vi phạm, gắn tag |
| **Admin** | Quản trị viên | Quản lý toàn bộ hệ thống |

### 1.3 Sơ đồ Use Case tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         FORUM SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐                                                     │
│  │  Guest  │──── Xem bài viết                                   │
│  └────┬────┘──── Xem bình luận                                  │
│       │     ──── Tìm kiếm                                       │
│       │     ──── Đăng ký/Đăng nhập                              │
│       ▼                                                          │
│  ┌─────────┐                                                     │
│  │ Member  │──── Tạo/Sửa/Xóa bài viết                           │
│  └────┬────┘──── Bình luận (Quote Reply)                        │
│       │     ──── Upvote/Downvote                                │
│       │     ──── Bookmark bài viết                              │
│       │     ──── Quản lý Profile                                │
│       │     ──── Ẩn/Chặn người dùng                             │
│       ▼                                                          │
│  ┌───────────┐                                                   │
│  │ Moderator │──── Xóa/Ẩn bài viết vi phạm                      │
│  └────┬──────┘──── Khóa bình luận                               │
│       │       ──── Gắn tag bài viết                             │
│       ▼                                                          │
│  ┌─────────┐                                                     │
│  │  Admin  │──── Quản lý người dùng                             │
│  └─────────┘──── Quản lý Category/Tag                           │
│             ──── Dashboard thống kê                             │
│             ──── Phân quyền vai trò                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Yêu cầu chức năng (Functional Requirements)

#### Module 1: Xác thực & Phân quyền (Authentication & Authorization)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-1.1 | Đăng ký | Email + Password, xác thực email | Cao |
| FR-1.2 | Đăng nhập | Username/Email + Password | Cao |
| FR-1.3 | Đăng xuất | Hủy phiên đăng nhập | Cao |
| FR-1.4 | Quên mật khẩu | Gửi link reset qua email | Trung bình |
| FR-1.5 | Phân quyền RBAC | Role-Based Access Control | Cao |

#### Module 2: Quản lý bài viết (Posts)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-2.1 | Tạo bài viết | Tiêu đề, nội dung, category, tags | Cao |
| FR-2.2 | Xem danh sách | Phân trang, sắp xếp | Cao |
| FR-2.3 | Xem chi tiết | Hiển thị đầy đủ thông tin | Cao |
| FR-2.4 | Sửa bài viết | Chỉ tác giả được sửa | Cao |
| FR-2.5 | Xóa bài viết | Tác giả/Mod/Admin | Cao |
| FR-2.6 | Vote | Upvote/Downvote | Cao |
| FR-2.7 | Bookmark | Lưu bài viết yêu thích | Trung bình |
| FR-2.8 | Tìm kiếm | Theo từ khóa, category, tag | Cao |
| FR-2.9 | Báo cáo | Report bài viết vi phạm | Trung bình |

#### Module 3: Bình luận (Comments)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-3.1 | Thêm bình luận | Comment vào bài viết | Cao |
| FR-3.2 | Quote Reply | Trích dẫn và trả lời | Cao |
| FR-3.3 | Sửa bình luận | Chỉ tác giả được sửa | Cao |
| FR-3.4 | Xóa bình luận | Tác giả/Chủ bài/Mod/Admin | Cao |
| FR-3.5 | Vote bình luận | Upvote/Downvote | Trung bình |

#### Module 4: Hồ sơ người dùng (Profile)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-4.1 | Xem profile | Thông tin công khai | Cao |
| FR-4.2 | Sửa profile | Username, biệt danh, avatar | Cao |
| FR-4.3 | Lịch sử hoạt động | Bài viết, bình luận, vote | Trung bình |
| FR-4.4 | Ẩn/Chặn người dùng | Cá nhân hóa | Thấp |
| FR-4.5 | Cài đặt private/public | Quyền riêng tư | Trung bình |

#### Module 5: Quản trị (Admin)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-5.1 | Dashboard | Thống kê tổng quan | Cao |
| FR-5.2 | Quản lý người dùng | CRUD, khóa/mở tài khoản | Cao |
| FR-5.3 | Quản lý Category | CRUD categories | Cao |
| FR-5.4 | Quản lý Tag | CRUD tags | Trung bình |
| FR-5.5 | Quản lý nội dung | Xóa/ẩn bài viết, bình luận | Cao |

### 1.5 Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu | Mô tả |
|------|---------|-------|
| **Bảo mật** | JWT Authentication | Token-based authentication |
| | Password Hashing | Sử dụng bcrypt |
| | XSS Protection | Sanitize input |
| | CORS | Cross-Origin Resource Sharing |
| **Hiệu năng** | Response Time | < 3 giây |
| | Concurrent Users | Hỗ trợ 100+ users |
| **UI/UX** | Responsive | Desktop + Mobile |
| | SPA | Single Page Application |
| **Khác** | SEO Friendly | Meta tags, semantic HTML |

---

## 2. LỰA CHỌN CÔNG NGHỆ

### 2.1 Tổng quan Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
├─────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite + TailwindCSS + Shadcn/UI     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS (REST API)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND SERVER                           │
├─────────────────────────────────────────────────────────────┤
│           Node.js + Express.js + TypeScript                  │
│                    (hoặc NestJS)                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL Queries
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE                              │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL / MySQL                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Technologies

| Công nghệ | Phiên bản | Lý do lựa chọn |
|-----------|-----------|----------------|
| **React** | 18.x | Thư viện UI phổ biến, component-based, virtual DOM |
| **TypeScript** | 5.x | Type safety, tăng chất lượng code |
| **Vite** | 5.x | Build tool nhanh, HMR tốt |
| **TailwindCSS** | 3.x | Utility-first CSS, responsive dễ dàng |
| **Shadcn/UI** | latest | UI components đẹp, tùy biến cao |
| **React Router** | 6.x | Client-side routing cho SPA |
| **TanStack Query** | 5.x | Server state management, caching |
| **Axios** | 1.x | HTTP client |
| **React Hook Form** | 7.x | Form handling |
| **Zod** | 3.x | Schema validation |

### 2.3 Backend Technologies

| Công nghệ | Phiên bản | Lý do lựa chọn |
|-----------|-----------|----------------|
| **Node.js** | 20.x LTS | JavaScript runtime, non-blocking I/O |
| **Express.js** | 4.x | Web framework minimal, linh hoạt |
| **TypeScript** | 5.x | Type safety |
| **Prisma** | 5.x | ORM hiện đại, type-safe queries |
| **JWT** | - | Authentication stateless |
| **bcrypt** | 5.x | Password hashing |
| **Multer** | 1.x | File upload handling |
| **Nodemailer** | 6.x | Gửi email xác thực |
| **Express Validator** | 7.x | Input validation |

### 2.4 Database

| Công nghệ | Lý do lựa chọn |
|-----------|----------------|
| **PostgreSQL** | Robust, ACID compliant, JSON support |
| *Hoặc* **MySQL** | Phổ biến, dễ deploy, tài liệu nhiều |

### 2.5 Development Tools

| Công cụ | Mục đích |
|---------|----------|
| **Git** | Version control |
| **ESLint + Prettier** | Code linting & formatting |
| **Postman/Thunder Client** | API testing |
| **Docker** (optional) | Containerization |

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU

### 3.1 Sơ đồ ERD (Entity Relationship Diagram)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     USERS       │       │     POSTS       │       │   CATEGORIES    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ email           │◄──┐   │ title           │   ┌──►│ name            │
│ username        │   │   │ content         │   │   │ slug            │
│ password_hash   │   │   │ author_id (FK)──┼───┤   │ description     │
│ display_name    │   │   │ category_id(FK)─┼───┘   │ created_at      │
│ avatar_url      │   │   │ view_count      │       │ updated_at      │
│ bio             │   │   │ upvote_count    │       └─────────────────┘
│ date_of_birth   │   │   │ downvote_count  │
│ gender          │   │   │ status          │       ┌─────────────────┐
│ role            │   │   │ is_pinned       │       │      TAGS       │
│ reputation      │   │   │ created_at      │       ├─────────────────┤
│ is_verified     │   │   │ updated_at      │   ┌──►│ id (PK)         │
│ is_active       │   │   └────────┬────────┘   │   │ name            │
│ last_active_at  │   │            │            │   │ slug            │
│ created_at      │   │            │            │   │ created_at      │
│ updated_at      │   │            ▼            │   └─────────────────┘
└────────┬────────┘   │   ┌─────────────────┐   │
         │            │   │   POST_TAGS     │   │
         │            │   ├─────────────────┤   │
         │            │   │ post_id (FK)────┼───┤
         │            │   │ tag_id (FK)─────┼───┘
         │            │   └─────────────────┘
         │            │
         │            │   ┌─────────────────┐
         │            │   │    COMMENTS     │
         │            │   ├─────────────────┤
         │            └───┼─author_id (FK)  │
         │                │ post_id (FK)    │
         │                │ parent_id (FK)──┼──┐ (self-reference)
         │                │ quoted_id (FK)──┼──┤
         │                │ content         │  │
         │                │ upvote_count    │  │
         │                │ downvote_count  │  │
         │                │ status          │  │
         │                │ created_at      │  │
         │                │ updated_at      │◄─┘
         │                └─────────────────┘
         │
         │            ┌─────────────────┐
         │            │     VOTES       │
         │            ├─────────────────┤
         └───────────►│ user_id (FK)    │
                      │ target_type     │ (post/comment)
                      │ target_id       │
                      │ vote_type       │ (up/down)
                      │ created_at      │
                      └─────────────────┘

         ┌─────────────────┐       ┌─────────────────┐
         │   BOOKMARKS     │       │   USER_BLOCKS   │
         ├─────────────────┤       ├─────────────────┤
         │ user_id (FK)    │       │ blocker_id (FK) │
         │ post_id (FK)    │       │ blocked_id (FK) │
         │ created_at      │       │ created_at      │
         └─────────────────┘       └─────────────────┘

         ┌─────────────────┐       ┌─────────────────┐
         │    REPORTS      │       │  NOTIFICATIONS  │
         ├─────────────────┤       ├─────────────────┤
         │ id (PK)         │       │ id (PK)         │
         │ reporter_id(FK) │       │ user_id (FK)    │
         │ target_type     │       │ type            │
         │ target_id       │       │ content         │
         │ reason          │       │ reference_type  │
         │ description     │       │ reference_id    │
         │ status          │       │ is_read         │
         │ created_at      │       │ created_at      │
         └─────────────────┘       └─────────────────┘
```

### 3.2 Chi tiết các bảng

#### Bảng USERS (Người dùng)
```sql
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      VARCHAR(500),
    bio             TEXT,
    date_of_birth   DATE,
    gender          VARCHAR(20),  -- 'male', 'female', 'other', 'private'
    role            VARCHAR(20) DEFAULT 'member',  -- 'member', 'moderator', 'admin'
    reputation      INT DEFAULT 0,
    is_verified     BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    last_active_at  TIMESTAMP,
    username_changed_at TIMESTAMP,  -- Để kiểm tra thay đổi username
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bảng CATEGORIES (Danh mục)
```sql
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon        VARCHAR(50),  -- Icon class hoặc emoji
    post_count  INT DEFAULT 0,  -- Denormalized for performance
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bảng TAGS
```sql
CREATE TABLE tags (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    slug        VARCHAR(50) UNIQUE NOT NULL,
    usage_count INT DEFAULT 0,  -- Số lần sử dụng
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bảng POSTS (Bài viết)
```sql
CREATE TABLE posts (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    author_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    view_count      INT DEFAULT 0,
    upvote_count    INT DEFAULT 0,
    downvote_count  INT DEFAULT 0,
    comment_count   INT DEFAULT 0,  -- Denormalized
    status          VARCHAR(20) DEFAULT 'published',  -- 'draft', 'published', 'hidden', 'deleted'
    is_pinned       BOOLEAN DEFAULT FALSE,
    is_locked       BOOLEAN DEFAULT FALSE,  -- Khóa bình luận
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index cho tìm kiếm và sắp xếp
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_status ON posts(status);
```

#### Bảng POST_TAGS (Quan hệ N-N)
```sql
CREATE TABLE post_tags (
    post_id     INT REFERENCES posts(id) ON DELETE CASCADE,
    tag_id      INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
```

#### Bảng COMMENTS (Bình luận)
```sql
CREATE TABLE comments (
    id              SERIAL PRIMARY KEY,
    content         TEXT NOT NULL,
    author_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id       INT REFERENCES comments(id) ON DELETE CASCADE,  -- Reply
    quoted_comment_id INT REFERENCES comments(id) ON DELETE SET NULL,  -- Quote
    upvote_count    INT DEFAULT 0,
    downvote_count  INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'visible',  -- 'visible', 'hidden', 'deleted'
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

#### Bảng VOTES
```sql
CREATE TABLE votes (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,  -- 'post', 'comment'
    target_id   INT NOT NULL,
    vote_type   SMALLINT NOT NULL,  -- 1 = upvote, -1 = downvote
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_votes_target ON votes(target_type, target_id);
```

#### Bảng BOOKMARKS
```sql
CREATE TABLE bookmarks (
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    post_id     INT REFERENCES posts(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);
```

#### Bảng USER_BLOCKS
```sql
CREATE TABLE user_blocks (
    blocker_id  INT REFERENCES users(id) ON DELETE CASCADE,
    blocked_id  INT REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_id, blocked_id)
);
```

#### Bảng REPORTS (Báo cáo)
```sql
CREATE TABLE reports (
    id              SERIAL PRIMARY KEY,
    reporter_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type     VARCHAR(20) NOT NULL,  -- 'user', 'post', 'comment'
    target_id       INT NOT NULL,
    reason          VARCHAR(100) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'reviewed', 'resolved', 'rejected'
    reviewed_by     INT REFERENCES users(id),
    reviewed_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bảng NOTIFICATIONS (Thông báo)
```sql
CREATE TABLE notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,  -- 'new_comment', 'reply', 'vote', 'mention'
    content         VARCHAR(255) NOT NULL,
    reference_type  VARCHAR(20),  -- 'post', 'comment'
    reference_id    INT,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

#### Bảng ACTIVITY_LOGS (Nhật ký hoạt động - Optional)
```sql
CREATE TABLE activity_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,  -- 'create_post', 'comment', 'vote', etc.
    target_type VARCHAR(20),
    target_id   INT,
    metadata    JSONB,  -- Thông tin bổ sung
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_user ON activity_logs(user_id, created_at DESC);
```

### 3.3 Quan hệ giữa các bảng

| Quan hệ | Bảng 1 | Bảng 2 | Loại | Mô tả |
|---------|--------|--------|------|-------|
| 1 | users | posts | 1-N | Một user có nhiều posts |
| 2 | users | comments | 1-N | Một user có nhiều comments |
| 3 | categories | posts | 1-N | Một category có nhiều posts |
| 4 | posts | tags | N-N | Nhiều posts có nhiều tags |
| 5 | posts | comments | 1-N | Một post có nhiều comments |
| 6 | comments | comments | 1-N | Comment có thể reply/quote |
| 7 | users | votes | 1-N | Một user có nhiều votes |
| 8 | users | bookmarks | N-N | Nhiều users bookmark nhiều posts |
| 9 | users | user_blocks | N-N | Users chặn lẫn nhau |
| 10 | users | reports | 1-N | User tạo nhiều reports |
| 11 | users | notifications | 1-N | User nhận nhiều notifications |

---

## 4. THIẾT KẾ API BACKEND (RESTful)

### 4.1 Quy ước chung

- **Base URL:** `http://localhost:5000/api/v1`
- **Format:** JSON
- **Authentication:** Bearer Token (JWT)
- **HTTP Methods:** GET, POST, PUT, PATCH, DELETE

### 4.2 Response Format

```json
// Success Response
{
    "success": true,
    "data": { ... },
    "message": "Success message",
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "totalPages": 10
    }
}

// Error Response
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Error message",
        "details": [ ... ]
    }
}
```

### 4.3 API Endpoints

#### 4.3.1 Authentication APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/register` | Đăng ký tài khoản | No |
| POST | `/auth/login` | Đăng nhập | No |
| POST | `/auth/logout` | Đăng xuất | Yes |
| POST | `/auth/refresh-token` | Làm mới token | Yes |
| POST | `/auth/forgot-password` | Yêu cầu reset mật khẩu | No |
| POST | `/auth/reset-password` | Reset mật khẩu | No |
| GET | `/auth/verify-email/:token` | Xác thực email | No |
| GET | `/auth/me` | Lấy thông tin user hiện tại | Yes |

**Chi tiết Request/Response:**

```
POST /auth/register
Request Body:
{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "Password123!",
    "confirmPassword": "Password123!"
}

Response: 201 Created
{
    "success": true,
    "data": {
        "id": 1,
        "email": "user@example.com",
        "username": "johndoe",
        "role": "member"
    },
    "message": "Đăng ký thành công. Vui lòng xác thực email."
}
```

```
POST /auth/login
Request Body:
{
    "identifier": "user@example.com",  // email hoặc username
    "password": "Password123!"
}

Response: 200 OK
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "email": "user@example.com",
            "username": "johndoe",
            "displayName": "John Doe",
            "avatarUrl": "...",
            "role": "member"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

#### 4.3.2 Users APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/users` | Danh sách users (Admin) | Admin |
| GET | `/users/:id` | Xem profile user | No |
| PUT | `/users/:id` | Cập nhật profile | Owner |
| PATCH | `/users/:id/avatar` | Upload avatar | Owner |
| PATCH | `/users/:id/password` | Đổi mật khẩu | Owner |
| GET | `/users/:id/posts` | Bài viết của user | No |
| GET | `/users/:id/comments` | Bình luận của user | No |
| GET | `/users/:id/bookmarks` | Bookmarks của user | Owner |
| POST | `/users/:id/block` | Chặn user | Yes |
| DELETE | `/users/:id/block` | Bỏ chặn user | Yes |
| PATCH | `/users/:id/role` | Đổi role (Admin) | Admin |
| PATCH | `/users/:id/status` | Khóa/Mở tài khoản | Admin |

```
GET /users/:id
Response: 200 OK
{
    "success": true,
    "data": {
        "id": 1,
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "...",
        "bio": "Hello world!",
        "role": "member",
        "reputation": 150,
        "postCount": 25,
        "commentCount": 100,
        "joinedAt": "2025-01-01T00:00:00Z",
        "lastActiveAt": "2026-01-28T10:00:00Z"
    }
}
```

#### 4.3.3 Categories APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/categories` | Danh sách categories | No |
| GET | `/categories/:slug` | Chi tiết category | No |
| POST | `/categories` | Tạo category | Admin |
| PUT | `/categories/:id` | Sửa category | Admin |
| DELETE | `/categories/:id` | Xóa category | Admin |

```
GET /categories
Response: 200 OK
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Công nghệ",
            "slug": "cong-nghe",
            "description": "Thảo luận về công nghệ",
            "icon": "💻",
            "postCount": 150
        },
        ...
    ]
}
```

#### 4.3.4 Tags APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/tags` | Danh sách tags | No |
| GET | `/tags/popular` | Tags phổ biến | No |
| GET | `/tags/:slug` | Chi tiết tag | No |
| POST | `/tags` | Tạo tag | Mod/Admin |
| DELETE | `/tags/:id` | Xóa tag | Admin |

#### 4.3.5 Posts APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/posts` | Danh sách bài viết | No |
| GET | `/posts/featured` | Bài viết nổi bật | No |
| GET | `/posts/latest` | Bài viết mới nhất | No |
| GET | `/posts/:id` | Chi tiết bài viết | No |
| POST | `/posts` | Tạo bài viết | Yes |
| PUT | `/posts/:id` | Sửa bài viết | Owner |
| DELETE | `/posts/:id` | Xóa bài viết | Owner/Mod/Admin |
| PATCH | `/posts/:id/status` | Ẩn/Hiện bài viết | Owner/Mod/Admin |
| PATCH | `/posts/:id/pin` | Ghim bài viết | Mod/Admin |
| PATCH | `/posts/:id/lock` | Khóa bình luận | Mod/Admin |
| POST | `/posts/:id/vote` | Vote bài viết | Yes |
| DELETE | `/posts/:id/vote` | Bỏ vote | Yes |
| POST | `/posts/:id/bookmark` | Bookmark bài viết | Yes |
| DELETE | `/posts/:id/bookmark` | Bỏ bookmark | Yes |
| POST | `/posts/:id/report` | Báo cáo bài viết | Yes |
| GET | `/posts/search` | Tìm kiếm bài viết | No |

**Chi tiết:**

```
GET /posts?page=1&limit=10&category=cong-nghe&tag=react&sort=latest
Response: 200 OK
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "Hướng dẫn React cho người mới",
            "content": "...",  // Có thể truncate
            "author": {
                "id": 1,
                "username": "johndoe",
                "displayName": "John Doe",
                "avatarUrl": "..."
            },
            "category": {
                "id": 1,
                "name": "Công nghệ",
                "slug": "cong-nghe"
            },
            "tags": [
                { "id": 1, "name": "React", "slug": "react" }
            ],
            "viewCount": 100,
            "upvoteCount": 25,
            "downvoteCount": 2,
            "commentCount": 15,
            "isPinned": false,
            "createdAt": "2026-01-28T10:00:00Z"
        }
    ],
    "meta": {
        "page": 1,
        "limit": 10,
        "total": 50,
        "totalPages": 5
    }
}
```

```
POST /posts
Headers: Authorization: Bearer <token>
Request Body:
{
    "title": "Tiêu đề bài viết",
    "content": "Nội dung bài viết...",
    "categoryId": 1,
    "tags": ["react", "javascript", "frontend"]
}

Response: 201 Created
{
    "success": true,
    "data": {
        "id": 100,
        "title": "Tiêu đề bài viết",
        ...
    },
    "message": "Tạo bài viết thành công"
}
```

```
POST /posts/:id/vote
Request Body:
{
    "voteType": "up"  // "up" hoặc "down"
}

Response: 200 OK
{
    "success": true,
    "data": {
        "upvoteCount": 26,
        "downvoteCount": 2,
        "userVote": "up"
    }
}
```

#### 4.3.6 Comments APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/posts/:postId/comments` | Bình luận của bài viết | No |
| POST | `/posts/:postId/comments` | Thêm bình luận | Yes |
| PUT | `/comments/:id` | Sửa bình luận | Owner |
| DELETE | `/comments/:id` | Xóa bình luận | Owner/Post Owner/Mod/Admin |
| POST | `/comments/:id/vote` | Vote bình luận | Yes |
| DELETE | `/comments/:id/vote` | Bỏ vote bình luận | Yes |
| POST | `/comments/:id/report` | Báo cáo bình luận | Yes |

```
GET /posts/:postId/comments?page=1&limit=20
Response: 200 OK
{
    "success": true,
    "data": [
        {
            "id": 1,
            "content": "Bình luận hay quá!",
            "author": {
                "id": 2,
                "username": "jane",
                "displayName": "Jane",
                "avatarUrl": "..."
            },
            "parentId": null,
            "quotedComment": null,  // Hoặc { id, content (truncated), author }
            "upvoteCount": 5,
            "downvoteCount": 0,
            "createdAt": "2026-01-28T11:00:00Z",
            "replies": [
                {
                    "id": 2,
                    "content": "Cảm ơn bạn!",
                    "parentId": 1,
                    ...
                }
            ]
        }
    ],
    "meta": { ... }
}
```

```
POST /posts/:postId/comments
Request Body:
{
    "content": "Nội dung bình luận",
    "parentId": null,       // ID comment cha (nếu reply)
    "quotedCommentId": 5    // ID comment được quote (optional)
}
```

#### 4.3.7 Notifications APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/notifications` | Danh sách thông báo | Yes |
| GET | `/notifications/unread-count` | Số thông báo chưa đọc | Yes |
| PATCH | `/notifications/:id/read` | Đánh dấu đã đọc | Yes |
| PATCH | `/notifications/read-all` | Đọc tất cả | Yes |
| DELETE | `/notifications/:id` | Xóa thông báo | Yes |

#### 4.3.8 Admin APIs

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/admin/dashboard` | Thống kê tổng quan | Admin |
| GET | `/admin/users` | Quản lý users | Admin |
| GET | `/admin/reports` | Danh sách reports | Mod/Admin |
| PATCH | `/admin/reports/:id` | Xử lý report | Mod/Admin |
| GET | `/admin/posts` | Quản lý bài viết | Mod/Admin |
| GET | `/admin/comments` | Quản lý bình luận | Mod/Admin |

```
GET /admin/dashboard
Response: 200 OK
{
    "success": true,
    "data": {
        "stats": {
            "totalUsers": 1500,
            "totalPosts": 5000,
            "totalComments": 25000,
            "newUsersToday": 15,
            "newPostsToday": 50
        },
        "recentActivities": [ ... ],
        "pendingReports": 10
    }
}
```

### 4.4 HTTP Status Codes

| Code | Ý nghĩa | Sử dụng khi |
|------|---------|-------------|
| 200 | OK | Request thành công |
| 201 | Created | Tạo resource thành công |
| 204 | No Content | Xóa thành công |
| 400 | Bad Request | Request không hợp lệ |
| 401 | Unauthorized | Chưa đăng nhập |
| 403 | Forbidden | Không có quyền truy cập |
| 404 | Not Found | Resource không tồn tại |
| 409 | Conflict | Trùng lặp dữ liệu |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Lỗi server |

---

## 5. CẤU TRÚC THƯ MỤC

### 5.1 Frontend Structure (React + TypeScript)

```
frontend/
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── images/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── vite-env.d.ts
│   │
│   ├── api/                        # API layer
│   │   ├── axios.ts                # Axios instance & interceptors
│   │   ├── endpoints.ts            # API endpoints constants
│   │   └── services/
│   │       ├── authService.ts
│   │       ├── userService.ts
│   │       ├── postService.ts
│   │       ├── commentService.ts
│   │       └── categoryService.ts
│   │
│   ├── components/                 # Reusable components
│   │   ├── ui/                     # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/                 # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── common/                 # Shared components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── VoteButtons.tsx
│   │   ├── post/                   # Post-related components
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostList.tsx
│   │   │   ├── PostForm.tsx
│   │   │   └── PostContent.tsx
│   │   ├── comment/                # Comment components
│   │   │   ├── CommentItem.tsx
│   │   │   ├── CommentList.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   └── QuoteReply.tsx
│   │   └── auth/                   # Auth components
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── contexts/                   # React Contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   ├── useComments.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── pages/                      # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── PostDetailPage.tsx
│   │   ├── CreatePostPage.tsx
│   │   ├── EditPostPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── CategoryPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── admin/
│   │       ├── DashboardPage.tsx
│   │       ├── UsersManagePage.tsx
│   │       ├── PostsManagePage.tsx
│   │       └── ReportsPage.tsx
│   │
│   ├── routes/                     # Routing configuration
│   │   ├── index.tsx               # Route definitions
│   │   ├── PrivateRoute.tsx
│   │   └── AdminRoute.tsx
│   │
│   ├── store/                      # State management (optional)
│   │   └── ...
│   │
│   ├── types/                      # TypeScript types
│   │   ├── user.types.ts
│   │   ├── post.types.ts
│   │   ├── comment.types.ts
│   │   ├── category.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/                      # Utility functions
│   │   ├── formatDate.ts
│   │   ├── validation.ts
│   │   ├── storage.ts
│   │   └── helpers.ts
│   │
│   └── styles/                     # Global styles
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
│
├── .env                            # Environment variables
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

### 5.2 Backend Structure (Node.js + Express + TypeScript)

```
backend/
├── src/
│   ├── index.ts                    # Entry point
│   ├── app.ts                      # Express app setup
│   │
│   ├── config/                     # Configuration
│   │   ├── database.ts             # Database connection
│   │   ├── cors.ts                 # CORS config
│   │   ├── jwt.ts                  # JWT config
│   │   └── index.ts                # Export all configs
│   │
│   ├── controllers/                # Request handlers
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── postController.ts
│   │   ├── commentController.ts
│   │   ├── categoryController.ts
│   │   ├── tagController.ts
│   │   ├── notificationController.ts
│   │   └── adminController.ts
│   │
│   ├── middlewares/                # Express middlewares
│   │   ├── authMiddleware.ts       # JWT verification
│   │   ├── roleMiddleware.ts       # Role-based access
│   │   ├── validationMiddleware.ts # Request validation
│   │   ├── errorMiddleware.ts      # Global error handler
│   │   ├── rateLimitMiddleware.ts  # Rate limiting
│   │   └── uploadMiddleware.ts     # File upload (Multer)
│   │
│   ├── models/                     # Prisma models / Entity classes
│   │   └── index.ts                # Re-export Prisma Client
│   │
│   ├── routes/                     # Route definitions
│   │   ├── index.ts                # Route aggregator
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── postRoutes.ts
│   │   ├── commentRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   ├── tagRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   └── adminRoutes.ts
│   │
│   ├── services/                   # Business logic
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── postService.ts
│   │   ├── commentService.ts
│   │   ├── categoryService.ts
│   │   ├── tagService.ts
│   │   ├── notificationService.ts
│   │   ├── emailService.ts
│   │   └── uploadService.ts
│   │
│   ├── repositories/               # Data access layer (optional)
│   │   ├── userRepository.ts
│   │   ├── postRepository.ts
│   │   └── ...
│   │
│   ├── validations/                # Request schemas (Joi/Zod)
│   │   ├── authValidation.ts
│   │   ├── userValidation.ts
│   │   ├── postValidation.ts
│   │   └── commentValidation.ts
│   │
│   ├── types/                      # TypeScript types
│   │   ├── express.d.ts            # Express type extensions
│   │   ├── user.types.ts
│   │   ├── post.types.ts
│   │   └── common.types.ts
│   │
│   ├── utils/                      # Utility functions
│   │   ├── jwt.ts
│   │   ├── bcrypt.ts
│   │   ├── slugify.ts
│   │   ├── pagination.ts
│   │   ├── response.ts             # Response helpers
│   │   └── errors.ts               # Custom error classes
│   │
│   └── constants/                  # Constants
│       ├── roles.ts
│       ├── status.ts
│       └── messages.ts
│
├── prisma/                         # Prisma ORM
│   ├── schema.prisma               # Database schema
│   ├── migrations/                 # Database migrations
│   └── seed.ts                     # Seed data
│
├── uploads/                        # Uploaded files (gitignored)
│   └── avatars/
│
├── tests/                          # Test files (optional)
│   ├── unit/
│   └── integration/
│
├── .env                            # Environment variables
├── .env.example
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

### 5.3 Cấu trúc tổng thể dự án

```
DA-mini-forum/
├── frontend/                       # React frontend
│   └── (như mô tả ở 5.1)
│
├── backend/                        # Node.js backend
│   └── (như mô tả ở 5.2)
│
├── docs/                           # Documentation
│   ├── DO_AN_FORUM_FULLSTACK.md
│   ├── FE design.md
│   ├── SYSTEM_DESIGN.md            # File này
│   ├── API_DOCS.md                 # API documentation (optional)
│   └── DATABASE_SCHEMA.md          # Database docs (optional)
│
├── .gitignore
└── README.md                       # Project overview
```

---

## 6. HƯỚNG DẪN TRIỂN KHAI

### 6.1 Cài đặt môi trường

#### Frontend
```bash
cd frontend
npm install
npm run dev     # Development
npm run build   # Production build
```

#### Backend
```bash
cd backend
npm install
npx prisma generate   # Generate Prisma Client
npx prisma migrate dev  # Run migrations
npm run dev     # Development
npm run build   # Production build
```

### 6.2 Biến môi trường

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Forum
```

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/forum_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB
```

---

## 7. TÓM TẮT

### Công nghệ sử dụng

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Shadcn/UI |
| Backend | Node.js, Express.js, TypeScript, Prisma ORM |
| Database | PostgreSQL / MySQL |
| Authentication | JWT (Access Token + Refresh Token) |

### Các bảng chính trong CSDL
1. **users** - Thông tin người dùng
2. **categories** - Danh mục bài viết
3. **tags** - Thẻ tag
4. **posts** - Bài viết
5. **post_tags** - Quan hệ N-N posts-tags
6. **comments** - Bình luận (hỗ trợ nested)
7. **votes** - Upvote/Downvote
8. **bookmarks** - Bookmark bài viết
9. **user_blocks** - Chặn người dùng
10. **reports** - Báo cáo vi phạm
11. **notifications** - Thông báo

### Số lượng API endpoints chính
- Authentication: 8 endpoints
- Users: 12 endpoints
- Posts: 15 endpoints
- Comments: 7 endpoints
- Categories/Tags: 10 endpoints
- Notifications: 5 endpoints
- Admin: 6 endpoints

**Tổng cộng: ~60+ API endpoints**

---

## 8. SCALABILITY & PERFORMANCE

### 8.1 Chiến lược Caching

```
┌─────────────────────────────────────────────────────────────────┐
│                      CACHING ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client ──► CDN (Static Assets) ──► Application Server         │
│                                              │                   │
│                                              ▼                   │
│                                    ┌─────────────────┐          │
│                                    │   Redis Cache   │          │
│                                    │  (In-Memory)    │          │
│                                    └────────┬────────┘          │
│                                             │                    │
│                                             ▼                    │
│                                    ┌─────────────────┐          │
│                                    │   PostgreSQL    │          │
│                                    │   (Database)    │          │
│                                    └─────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Redis Cache Implementation

| Cache Key Pattern | TTL | Mục đích |
|-------------------|-----|----------|
| `user:{id}` | 1 hour | Profile người dùng |
| `post:{id}` | 30 min | Chi tiết bài viết |
| `posts:list:{page}:{category}` | 5 min | Danh sách bài viết |
| `categories:all` | 1 hour | Danh sách categories |
| `tags:popular` | 15 min | Tags phổ biến |
| `session:{userId}` | 24 hours | Session data |

```typescript
// Ví dụ Redis Cache Service
class CacheService {
  private redis: Redis;
  
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length) await this.redis.del(...keys);
  }
}
```

#### CDN Configuration (Cloudflare/AWS CloudFront)

```
Static Assets được cache tại CDN:
├── /assets/images/*     → Cache 30 days
├── /assets/fonts/*      → Cache 1 year
├── *.js, *.css          → Cache 1 year (với hash)
├── /uploads/avatars/*   → Cache 7 days
└── /uploads/images/*    → Cache 7 days
```

### 8.2 Database Optimization

#### Full-Text Search với PostgreSQL

```sql
-- Tạo index full-text search cho posts
ALTER TABLE posts ADD COLUMN search_vector tsvector;

CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- Trigger cập nhật search vector
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_search_update
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Query tìm kiếm
SELECT * FROM posts 
WHERE search_vector @@ plainto_tsquery('simple', 'react typescript')
ORDER BY ts_rank(search_vector, plainto_tsquery('simple', 'react typescript')) DESC;
```

#### Query Optimization

```sql
-- Index cho các query thường dùng
CREATE INDEX idx_posts_created_desc ON posts(created_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_category_created ON posts(category_id, created_at DESC);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);

-- Partitioning cho bảng lớn (nếu cần)
CREATE TABLE posts (
    id SERIAL,
    created_at TIMESTAMP NOT NULL,
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE posts_2026 PARTITION OF posts
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### 8.3 Load Testing & Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| Response Time (P95) | < 500ms | Artillery/k6 |
| Throughput | 500 req/s | k6 |
| Concurrent Users | 100-500 | Artillery |
| Database Query Time | < 100ms | pg_stat_statements |
| Cache Hit Rate | > 80% | Redis INFO |

```yaml
# k6 load test config
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

---

## 9. BẢO MẬT NÂNG CAO

### 9.1 Rate Limiting Strategy

```typescript
// Rate Limiting Configuration
const rateLimitConfig = {
  // Giới hạn theo endpoint
  auth: {
    login: { windowMs: 15 * 60 * 1000, max: 5 },      // 5 lần/15 phút
    register: { windowMs: 60 * 60 * 1000, max: 3 },   // 3 lần/giờ
    forgotPassword: { windowMs: 60 * 60 * 1000, max: 3 },
  },
  api: {
    general: { windowMs: 60 * 1000, max: 100 },       // 100 req/phút
    createPost: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 bài/giờ
    createComment: { windowMs: 60 * 1000, max: 20 },   // 20 comment/phút
    vote: { windowMs: 60 * 1000, max: 60 },            // 60 vote/phút
  },
  admin: {
    general: { windowMs: 60 * 1000, max: 200 },       // Admin được ưu tiên
  }
};

// Middleware implementation
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const createLimiter = (config: RateLimitConfig) => rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: config.windowMs,
  max: config.max,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 9.2 Content Security Policy (CSP)

```typescript
// Helmet CSP Configuration
import helmet from 'helmet';

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
    fontSrc: ["'self'", "fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "blob:", "cdn.yourforum.com", "*.cloudinary.com"],
    connectSrc: ["'self'", "api.yourforum.com", "wss://yourforum.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));

// Các security headers khác
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
```

### 9.3 Audit Logs

```sql
-- Bảng Audit Logs
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     INT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
```

```typescript
// Audit Log Service
class AuditLogService {
  async log(params: {
    userId: number;
    action: AuditAction;
    resourceType: string;
    resourceId: number;
    oldValues?: object;
    newValues?: object;
    req: Request;
  }) {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        oldValues: params.oldValues,
        newValues: params.newValues,
        ipAddress: params.req.ip,
        userAgent: params.req.headers['user-agent'],
      }
    });
  }
}

// Các action cần audit
enum AuditAction {
  // Admin actions
  USER_BANNED = 'USER_BANNED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  POST_DELETED_BY_ADMIN = 'POST_DELETED_BY_ADMIN',
  CATEGORY_CREATED = 'CATEGORY_CREATED',
  CATEGORY_UPDATED = 'CATEGORY_UPDATED',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  // User sensitive actions
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_CHANGED = 'EMAIL_CHANGED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
}
```

### 9.4 Data Encryption

```typescript
// Encryption cho sensitive data
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Sử dụng cho:
// - API keys, secrets
// - Personal identifiable information (PII) nếu cần
// - Backup encryption
```

### 9.5 Input Validation & Sanitization

```typescript
// Validation với Zod + Sanitization
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const createPostSchema = z.object({
  title: z.string()
    .min(10, 'Tiêu đề tối thiểu 10 ký tự')
    .max(200, 'Tiêu đề tối đa 200 ký tự')
    .transform(val => val.trim()),
  content: z.string()
    .min(50, 'Nội dung tối thiểu 50 ký tự')
    .max(50000, 'Nội dung tối đa 50000 ký tự')
    .transform(val => DOMPurify.sanitize(val, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    })),
  categoryId: z.number().int().positive(),
  tags: z.array(z.string().max(30)).max(5),
});
```

---

## 10. REAL-TIME FEATURES

### 10.1 WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐     WebSocket      ┌─────────────────┐            │
│   │ Client  │◄──────────────────►│  Socket.io      │            │
│   │ (React) │                    │  Server         │            │
│   └─────────┘                    └────────┬────────┘            │
│                                           │                      │
│                                           ▼                      │
│                                  ┌─────────────────┐            │
│                                  │  Redis Pub/Sub  │            │
│                                  │  (Scaling)      │            │
│                                  └────────┬────────┘            │
│                                           │                      │
│                          ┌────────────────┼────────────────┐    │
│                          ▼                ▼                ▼    │
│                    ┌──────────┐    ┌──────────┐    ┌──────────┐│
│                    │ Server 1 │    │ Server 2 │    │ Server N ││
│                    └──────────┘    └──────────┘    └──────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Socket.io Implementation

```typescript
// Backend: Socket.io Server
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Redis adapter cho horizontal scaling
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Event handlers
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  
  // Join user's personal room
  socket.join(`user:${userId}`);
  
  // Join post room khi xem chi tiết
  socket.on('join:post', (postId: number) => {
    socket.join(`post:${postId}`);
  });
  
  socket.on('leave:post', (postId: number) => {
    socket.leave(`post:${postId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

// Emit events từ services
export const emitNotification = (userId: number, notification: Notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

export const emitNewComment = (postId: number, comment: Comment) => {
  io.to(`post:${postId}`).emit('comment:new', comment);
};

export const emitVoteUpdate = (postId: number, voteData: VoteData) => {
  io.to(`post:${postId}`).emit('vote:update', voteData);
};
```

```typescript
// Frontend: Socket.io Client Hook
import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useAuth();
  
  useEffect(() => {
    if (!token) return;
    
    const newSocket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [token]);
  
  return socket;
}

// Hook cho notifications
export function useNotifications() {
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Show toast notification
      toast.info(notification.content);
    });
    
    return () => {
      socket.off('notification:new');
    };
  }, [socket]);
  
  return { notifications, unreadCount };
}
```

### 10.3 Real-time Events

| Event | Direction | Mô tả |
|-------|-----------|-------|
| `notification:new` | Server → Client | Thông báo mới |
| `comment:new` | Server → Room | Comment mới trong bài viết |
| `comment:updated` | Server → Room | Comment được sửa |
| `comment:deleted` | Server → Room | Comment bị xóa |
| `vote:update` | Server → Room | Cập nhật vote count |
| `post:updated` | Server → Room | Bài viết được sửa |
| `user:typing` | Client → Room | User đang gõ comment |

---

## 11. TESTING & MONITORING

### 11.1 Testing Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      TESTING PYRAMID                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        ┌─────────┐                              │
│                        │   E2E   │  ← Cypress/Playwright        │
│                        │  Tests  │    (10%)                     │
│                       ─┴─────────┴─                             │
│                     ┌───────────────┐                           │
│                     │  Integration  │  ← Supertest + Jest       │
│                     │    Tests      │    (30%)                  │
│                    ─┴───────────────┴─                          │
│                  ┌───────────────────────┐                      │
│                  │      Unit Tests       │  ← Jest + Vitest     │
│                  │                       │    (60%)             │
│                  └───────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Unit Tests (Backend)

```typescript
// tests/unit/services/postService.test.ts
import { PostService } from '@/services/postService';
import { prismaMock } from '../mocks/prisma';

describe('PostService', () => {
  let postService: PostService;
  
  beforeEach(() => {
    postService = new PostService(prismaMock);
  });
  
  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const mockPost = {
        id: 1,
        title: 'Test Post',
        content: 'Test content',
        authorId: 1,
        categoryId: 1,
      };
      
      prismaMock.post.create.mockResolvedValue(mockPost);
      
      const result = await postService.create({
        title: 'Test Post',
        content: 'Test content',
        authorId: 1,
        categoryId: 1,
        tags: [],
      });
      
      expect(result).toEqual(mockPost);
      expect(prismaMock.post.create).toHaveBeenCalledTimes(1);
    });
    
    it('should throw error if title is empty', async () => {
      await expect(postService.create({
        title: '',
        content: 'Test content',
        authorId: 1,
        categoryId: 1,
        tags: [],
      })).rejects.toThrow('Title is required');
    });
  });
  
  describe('getPostById', () => {
    it('should return null if post not found', async () => {
      prismaMock.post.findUnique.mockResolvedValue(null);
      
      const result = await postService.getById(999);
      
      expect(result).toBeNull();
    });
  });
});
```

#### Integration Tests (API)

```typescript
// tests/integration/auth.test.ts
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('Auth API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });
  
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
    
    it('should return 409 if email already exists', async () => {
      // Create existing user
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'existing',
          passwordHash: 'hash',
        },
      });
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'newuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });
      
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });
  });
  
  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Setup: create user first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'Password123!',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });
});
```

#### E2E Tests (Frontend)

```typescript
// tests/e2e/auth.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('.toast-success')).toContainText('Đăng ký thành công');
  });
  
  test('should login and redirect to home', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="identifier"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ==================== BACKEND ====================
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: forum_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    defaults:
      run:
        working-directory: ./backend
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Setup database
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/forum_test
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/forum_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/forum_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  # ==================== FRONTEND ====================
  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test -- --coverage
      
      - name: Build
        run: npm run build

  # ==================== E2E ====================
  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # ==================== DEPLOY ====================
  deploy:
    runs-on: ubuntu-latest
    needs: [e2e-test]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          # Deploy commands here
          echo "Deploying to production..."
```

### 11.3 Monitoring & Logging

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Application ──► Prometheus ──► Grafana (Dashboards)           │
│       │                                                          │
│       ├──► Winston/Pino ──► ELK Stack (Logs)                    │
│       │                      └── Elasticsearch                   │
│       │                      └── Logstash                        │
│       │                      └── Kibana                          │
│       │                                                          │
│       └──► Sentry (Error Tracking)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Structured Logging

```typescript
// src/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });
  
  next();
};
```

#### Prometheus Metrics

```typescript
// src/utils/metrics.ts
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Business metrics
export const postsCreated = new Counter({
  name: 'forum_posts_created_total',
  help: 'Total number of posts created',
  registers: [register],
});

export const commentsCreated = new Counter({
  name: 'forum_comments_created_total',
  help: 'Total number of comments created',
  registers: [register],
});

export const activeUsers = new Gauge({
  name: 'forum_active_users',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// Endpoint to expose metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### Error Tracking (Sentry)

```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());

// Frontend (React)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});
```

---

## 12. SEO & ACCESSIBILITY

### 12.1 SEO Optimization

#### Meta Tags Implementation

```typescript
// Frontend: SEO Component
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
}

export function SEO({ 
  title, 
  description, 
  keywords = [],
  image = '/og-image.png',
  url,
  type = 'website',
  author,
  publishedTime,
}: SEOProps) {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;
  
  return (
    <Helmet>
      {/* Basic */}
      <title>{title} | Forum</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Forum" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Article specific */}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
    </Helmet>
  );
}

// Usage in PostDetailPage
<SEO
  title={post.title}
  description={post.content.substring(0, 160)}
  keywords={post.tags.map(t => t.name)}
  url={`/posts/${post.id}`}
  type="article"
  author={post.author.displayName}
  publishedTime={post.createdAt}
/>
```

#### Structured Data (JSON-LD)

```typescript
// Structured data cho bài viết
export function ArticleSchema({ post }: { post: Post }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.content.substring(0, 160),
    author: {
      '@type': 'Person',
      name: post.author.displayName,
    },
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Forum',
      logo: {
        '@type': 'ImageObject',
        url: 'https://yourforum.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://yourforum.com/posts/${post.id}`,
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: post.commentCount,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: post.upvoteCount,
      },
    ],
  };
  
  return (
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
}
```

#### Sitemap & Robots

```typescript
// Backend: Sitemap generator
import { SitemapStream, streamToPromise } from 'sitemap';

app.get('/sitemap.xml', async (req, res) => {
  const smStream = new SitemapStream({ hostname: process.env.SITE_URL });
  
  // Static pages
  smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
  smStream.write({ url: '/categories', changefreq: 'weekly', priority: 0.8 });
  
  // Categories
  const categories = await prisma.category.findMany();
  categories.forEach(cat => {
    smStream.write({
      url: `/category/${cat.slug}`,
      changefreq: 'daily',
      priority: 0.7,
    });
  });
  
  // Posts (last 1000)
  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    orderBy: { createdAt: 'desc' },
    take: 1000,
    select: { id: true, updatedAt: true },
  });
  
  posts.forEach(post => {
    smStream.write({
      url: `/posts/${post.id}`,
      lastmod: post.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: 0.6,
    });
  });
  
  smStream.end();
  
  const sitemap = await streamToPromise(smStream);
  res.header('Content-Type', 'application/xml');
  res.send(sitemap.toString());
});
```

### 12.2 Accessibility (WCAG 2.1)

#### Semantic HTML Structure

```tsx
// Good: Semantic structure
<article aria-labelledby="post-title">
  <header>
    <h1 id="post-title">{post.title}</h1>
    <div className="post-meta">
      <span>Đăng bởi <a href={`/users/${post.author.id}`}>{post.author.displayName}</a></span>
      <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
    </div>
  </header>
  
  <section aria-label="Nội dung bài viết">
    <div dangerouslySetInnerHTML={{ __html: post.content }} />
  </section>
  
  <footer>
    <nav aria-label="Hành động bài viết">
      <VoteButtons postId={post.id} />
      <BookmarkButton postId={post.id} />
    </nav>
  </footer>
</article>

<section aria-labelledby="comments-heading">
  <h2 id="comments-heading">Bình luận ({post.commentCount})</h2>
  <CommentList comments={comments} />
</section>
```

#### Accessible Components

```tsx
// Accessible Vote Buttons
function VoteButtons({ postId, currentVote, upvotes, downvotes }: VoteButtonsProps) {
  return (
    <div role="group" aria-label="Bình chọn bài viết">
      <button
        onClick={() => handleVote('up')}
        aria-pressed={currentVote === 'up'}
        aria-label={`Upvote. Hiện có ${upvotes} upvote`}
        className={cn('vote-btn', currentVote === 'up' && 'active')}
      >
        <ArrowUpIcon aria-hidden="true" />
        <span className="sr-only">Upvote</span>
        <span aria-hidden="true">{upvotes}</span>
      </button>
      
      <button
        onClick={() => handleVote('down')}
        aria-pressed={currentVote === 'down'}
        aria-label={`Downvote. Hiện có ${downvotes} downvote`}
        className={cn('vote-btn', currentVote === 'down' && 'active')}
      >
        <ArrowDownIcon aria-hidden="true" />
        <span className="sr-only">Downvote</span>
        <span aria-hidden="true">{downvotes}</span>
      </button>
    </div>
  );
}

// Skip link for keyboard navigation
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 focus:z-50 focus:bg-white focus:p-4 focus:rounded"
    >
      Chuyển đến nội dung chính
    </a>
  );
}

// Focus trap for modals
import { FocusTrap } from '@headlessui/react';

function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <FocusTrap>
        <Dialog.Panel
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {children}
        </Dialog.Panel>
      </FocusTrap>
    </Dialog>
  );
}
```

#### Accessibility Checklist

| Tiêu chí | Mô tả | Status |
|----------|-------|--------|
| Keyboard Navigation | Tất cả tương tác hoạt động với bàn phím | ✅ |
| Focus Visible | Focus indicator rõ ràng | ✅ |
| Color Contrast | Tỷ lệ tương phản ≥ 4.5:1 | ✅ |
| Alt Text | Tất cả hình ảnh có alt text | ✅ |
| ARIA Labels | Labels cho interactive elements | ✅ |
| Skip Links | Skip to main content | ✅ |
| Form Labels | Tất cả input có label | ✅ |
| Error Messages | Thông báo lỗi rõ ràng | ✅ |
| Responsive Text | Text có thể zoom 200% | ✅ |
| Screen Reader | Test với NVDA/VoiceOver | ✅ |

---

## 13. DEPLOYMENT & DEVOPS

### 13.1 Docker Configuration

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

USER expressjs
EXPOSE 5000

CMD ["node", "dist/index.js"]
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

# Production - Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 13.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ==================== DATABASE ====================
  postgres:
    image: postgres:15-alpine
    container_name: forum-db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ==================== REDIS ====================
  redis:
    image: redis:7-alpine
    container_name: forum-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ==================== BACKEND ====================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: forum-backend
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped

  # ==================== FRONTEND ====================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
        VITE_WS_URL: ${VITE_WS_URL}
    container_name: forum-frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

  # ==================== NGINX (Reverse Proxy) ====================
  nginx:
    image: nginx:alpine
    container_name: forum-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - uploads:/var/www/uploads:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads:

networks:
  default:
    name: forum-network
```

### 13.3 Environment Management

```bash
# .env.example
# ==================== App ====================
NODE_ENV=development
APP_VERSION=1.0.0

# ==================== Database ====================
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=forum_db
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# ==================== Redis ====================
REDIS_URL=redis://localhost:6379

# ==================== JWT ====================
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ==================== Email ====================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourforum.com

# ==================== Frontend ====================
VITE_API_URL=http://localhost:5000/api/v1
VITE_WS_URL=ws://localhost:5000
VITE_SITE_URL=http://localhost:3000

# ==================== External Services ====================
SENTRY_DSN=
CLOUDINARY_URL=
```

```typescript
// backend/src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url(),
  // ... other env vars
});

export const env = envSchema.parse(process.env);
```

### 13.4 Deployment Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STRATEGY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Development          Staging              Production          │
│   ───────────         ─────────            ────────────         │
│   localhost     →     staging.forum.com  →  forum.com           │
│                                                                  │
│   ┌─────────┐        ┌─────────┐          ┌─────────┐          │
│   │  Local  │        │  Test   │          │  Prod   │          │
│   │  Docker │   →    │ Server  │    →     │ Cluster │          │
│   └─────────┘        └─────────┘          └─────────┘          │
│                                                                  │
│   Feature Branch → PR Review → Merge → Auto Deploy              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Blue-Green Deployment

```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: forum-backend-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: forum-backend
      version: blue
  template:
    metadata:
      labels:
        app: forum-backend
        version: blue
    spec:
      containers:
      - name: backend
        image: forum-backend:v1.0.0
        ports:
        - containerPort: 5000
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 15
          periodSeconds: 20
```

#### Rollback Strategy

```bash
#!/bin/bash
# scripts/rollback.sh

# Get previous deployment
PREVIOUS_VERSION=$(docker images forum-backend --format "{{.Tag}}" | sed -n '2p')

echo "Rolling back to version: $PREVIOUS_VERSION"

# Update docker-compose to use previous version
sed -i "s/forum-backend:latest/forum-backend:$PREVIOUS_VERSION/g" docker-compose.prod.yml

# Redeploy
docker-compose -f docker-compose.prod.yml up -d backend

# Verify health
sleep 10
curl -f http://localhost:5000/health || {
    echo "Rollback failed! Manual intervention required."
    exit 1
}

echo "Rollback successful!"
```

### 13.5 Database Migration Strategy

```typescript
// scripts/migrate.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database migration...');
  
  // Check connection
  await prisma.$connect();
  console.log('Database connected');
  
  // Run migrations
  const { execSync } = require('child_process');
  
  try {
    // In production, use deploy instead of dev
    if (process.env.NODE_ENV === 'production') {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } else {
      execSync('npx prisma migrate dev', { stdio: 'inherit' });
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 14. PRODUCT ROADMAP

### 14.1 MVP (Minimum Viable Product) - Phase 1

**Timeline: 4-6 tuần**

| Feature | Priority | Effort |
|---------|----------|--------|
| Authentication (Register/Login/Logout) | P0 | 1 tuần |
| User Profile (View/Edit) | P0 | 0.5 tuần |
| Categories CRUD | P0 | 0.5 tuần |
| Posts CRUD + List với phân trang | P0 | 1.5 tuần |
| Comments (Add/Edit/Delete) | P0 | 1 tuần |
| Upvote/Downvote | P1 | 0.5 tuần |
| Basic Search | P1 | 0.5 tuần |
| Responsive UI | P0 | Throughout |

### 14.2 Phase 2 - Enhanced Features

**Timeline: 3-4 tuần**

| Feature | Priority | Effort |
|---------|----------|--------|
| Tags system | P1 | 0.5 tuần |
| Bookmark posts | P1 | 0.5 tuần |
| Quote Reply | P1 | 0.5 tuần |
| User blocking | P2 | 0.5 tuần |
| Report system | P1 | 1 tuần |
| Admin Dashboard | P1 | 1 tuần |
| Email notifications | P2 | 0.5 tuần |

### 14.3 Phase 3 - Advanced Features

**Timeline: 4-5 tuần**

| Feature | Priority | Effort |
|---------|----------|--------|
| Rich Text Editor (TipTap/Quill) | P1 | 1.5 tuần |
| Image Upload (Posts/Avatar) | P1 | 1 tuần |
| Real-time Notifications | P2 | 1 tuần |
| Full-text Search | P2 | 0.5 tuần |
| Reputation System | P2 | 1 tuần |

### 14.4 Future Enhancements

| Feature | Description |
|---------|-------------|
| OAuth Login | Google, GitHub, Facebook |
| Markdown Support | GFM syntax |
| Code Syntax Highlighting | Prism.js/Shiki |
| Mentions (@user) | Tag users in posts/comments |
| Private Messages | Direct messaging |
| Mobile App | React Native |
| Gamification | Badges, achievements |
| Analytics | User engagement metrics |
| Multi-language | i18n support |
| Dark Mode | Theme switching |

---

## 15. TÓM TẮT CẢI TIẾN

### So sánh trước và sau

| Khía cạnh | Trước | Sau |
|-----------|-------|-----|
| **Caching** | Không có | Redis + CDN strategy |
| **Rate Limiting** | Cơ bản | Chi tiết theo endpoint + Redis store |
| **Security** | JWT + bcrypt | + CSP, Audit Logs, Encryption |
| **Real-time** | Polling | WebSocket với Socket.io |
| **Testing** | Không đề cập | Unit + Integration + E2E |
| **CI/CD** | Không có | GitHub Actions pipeline |
| **Monitoring** | Không có | Prometheus + ELK + Sentry |
| **SEO** | Cơ bản | Meta tags + Schema.org + Sitemap |
| **Accessibility** | Không đề cập | WCAG 2.1 compliance |
| **Deployment** | Manual | Docker + Compose + Rollback |

### Architecture Decision Records (ADR)

| Decision | Rationale |
|----------|-----------|
| PostgreSQL over MongoDB | Relational data, ACID compliance, full-text search |
| Redis for caching | In-memory speed, pub/sub for WebSocket scaling |
| Socket.io over raw WS | Cross-browser support, room management, reconnection |
| Prisma over TypeORM | Type safety, better DX, auto-generated types |
| React Query over Redux | Server state management, caching, simpler code |
| Docker for deployment | Consistency across environments, easy scaling |

---

> **Ghi chú:**
> - Đây là thiết kế toàn diện, phù hợp với đồ án tốt nghiệp đại học
> - MVP có thể hoàn thành trong 4-6 tuần với 1 developer
> - Các phần nâng cao (Phase 2, 3) có thể bổ sung sau khi MVP ổn định
> - Nên triển khai từng module một, ưu tiên các chức năng cốt lõi trước
> - Test liên tục và thu thập feedback để cải thiện

---

*Tài liệu được cập nhật ngày 28/01/2026*
