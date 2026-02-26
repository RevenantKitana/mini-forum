# PHASE 3: ADVANCED FEATURES (Tính năng nâng cao)

## Mô tả
Vote, Bookmark, Profile, Search, Notifications

## Thời gian ước tính
2-3 tuần

## Các Task

### 📦 TASK P3-01: Database Schema - Votes & Bookmarks

**Mô tả:** Schema cho Vote và Bookmark

**Dependencies:** P2-02, P2-07

**Schema:**
```prisma
model Vote {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  targetType VoteTarget @map("target_type")
  targetId   Int      @map("target_id")
  voteType   Int      @map("vote_type") // 1 = up, -1 = down
  createdAt  DateTime @default(now()) @map("created_at")
  
  user       User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, targetType, targetId])
  @@map("votes")
}

model Bookmark {
  userId    Int      @map("user_id")
  postId    Int      @map("post_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id])
  post      Post     @relation(fields: [postId], references: [id])
  
  @@id([userId, postId])
  @@map("bookmarks")
}

enum VoteTarget {
  POST
  COMMENT
}
```

**Output:**
- Bảng votes, bookmarks được tạo

**Ước tính:** 1-2 giờ

---

### 📦 TASK P3-02: Vote API

**Mô tả:** API cho Upvote/Downvote

**Dependencies:** P3-01

**Endpoints:**
```
POST   /api/v1/posts/:id/vote       → Vote post
DELETE /api/v1/posts/:id/vote       → Remove vote
POST   /api/v1/comments/:id/vote    → Vote comment
DELETE /api/v1/comments/:id/vote    → Remove vote
```

**Logic:**
- Toggle vote (up → down → remove)
- Update count trên post/comment
- Update user reputation (author)

**Output:**
- Vote hoạt động
- Counts update realtime

**Ước tính:** 3-4 giờ

---

### 📦 TASK P3-03: Bookmark API

**Mô tả:** API cho Bookmark bài viết

**Dependencies:** P3-01

**Endpoints:**
```
GET    /api/v1/users/:id/bookmarks     → List bookmarks
POST   /api/v1/posts/:id/bookmark      → Add bookmark
DELETE /api/v1/posts/:id/bookmark      → Remove bookmark
```

**Output:**
- Bookmark toggle hoạt động

**Ước tính:** 2 giờ

---

### 📦 TASK P3-04: Frontend - Vote Components

**Mô tả:** UI cho vote buttons

**Dependencies:** P3-02

**Steps:**
```bash
1. Tạo src/components/common/VoteButtons.tsx
2. Props: targetType, targetId, upvotes, downvotes, userVote
3. Handle click → API call
4. Optimistic update
5. Integrate vào PostCard, PostDetail, CommentItem
```

**Output:**
- Vote hoạt động từ UI
- Visual feedback

**Ước tính:** 3-4 giờ

---

### 📦 TASK P3-05: Frontend - Bookmark Feature

**Mô tả:** UI và logic cho Bookmark

**Dependencies:** P3-03

**Steps:**
```bash
1. Tạo BookmarkButton component
2. Toggle state
3. Integrate vào PostCard, PostDetail
4. Tạo Bookmarks page (list saved posts)
```

**Output:**
- Bookmark toggle hoạt động
- Bookmarks page hiển thị

**Ước tính:** 2-3 giờ

---

### 📦 TASK P3-06: User Profile API

**Mô tả:** API cho Profile người dùng

**Dependencies:** P1-03

**Endpoints:**
```
GET    /api/v1/users/:id             → Get profile
PUT    /api/v1/users/:id             → Update profile (Owner)
PATCH  /api/v1/users/:id/avatar      → Upload avatar (Owner)
PATCH  /api/v1/users/:id/password    → Change password (Owner)
GET    /api/v1/users/:id/posts       → User's posts
GET    /api/v1/users/:id/comments    → User's comments
```

**Features:**
- Username change restriction (x days)
- Avatar upload với Multer
- Public/private fields

**Output:**
- Profile CRUD hoàn chỉnh

**Ước tính:** 4-5 giờ

---

### 📦 TASK P3-07: Frontend - Profile Page

**Mô tả:** Trang hồ sơ người dùng

**Dependencies:** P3-06

**Steps:**
```bash
1. Update ProfilePage.tsx
2. Hiển thị: avatar, username, display name, bio, stats
3. Tabs: Posts, Comments, Activity
4. Edit button (if owner)
5. Responsive design
```

**Output:**
- Profile page hoạt động
- Stats hiển thị

**Ước tính:** 4-5 giờ

---

### 📦 TASK P3-08: Frontend - Edit Profile

**Mô tả:** Form chỉnh sửa profile

**Dependencies:** P3-07

**Steps:**
```bash
1. Tạo EditProfilePage.tsx hoặc Modal
2. Form: display name, bio, date of birth, gender
3. Avatar upload với preview
4. Username change (với warning về cooldown)
5. Validation và submit
```

**Output:**
- Edit profile hoạt động
- Avatar upload hoạt động

**Ước tính:** 4 giờ

---

### 📦 TASK P3-09: Search API

**Mô tả:** Full-text search cho posts

**Dependencies:** P2-05

**Endpoint:**
```
GET /api/v1/posts/search?q=keyword&category=&tag=&page=&limit=
```

**Implementation:**
- PostgreSQL full-text search hoặc LIKE (basic)
- Search trong title + content
- Filter kết hợp

**Output:**
- Search trả về kết quả relevant

**Ước tính:** 3-4 giờ

---

### 📦 TASK P3-10: Frontend - Search Feature

**Mô tả:** UI tìm kiếm

**Dependencies:** P3-09

**Steps:**
```bash
1. Tạo SearchPage.tsx
2. Search input trong Header
3. Debounced search
4. Hiển thị kết quả với highlighting
5. Filter options
```

**Output:**
- Search hoạt động từ header
- Results page

**Ước tính:** 3-4 giờ

---

### 📦 TASK P3-11: Database Schema - Notifications

**Mô tả:** Schema cho Notifications

**Dependencies:** P1-03

**Schema:**
```prisma
model Notification {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  type          NotificationType
  content       String
  referenceType String?  @map("reference_type")
  referenceId   Int?     @map("reference_id")
  isRead        Boolean  @default(false) @map("is_read")
  createdAt     DateTime @default(now()) @map("created_at")
  
  user          User     @relation(fields: [userId], references: [id])
  
  @@map("notifications")
}

enum NotificationType {
  NEW_COMMENT
  REPLY
  VOTE
  MENTION
  SYSTEM
}
```

**Output:**
- Bảng notifications được tạo

**Ước tính:** 1 giờ

---

### 📦 TASK P3-12: Notifications API

**Mô tả:** API cho Notifications

**Dependencies:** P3-11

**Endpoints:**
```
GET   /api/v1/notifications              → List notifications
GET   /api/v1/notifications/unread-count → Count unread
PATCH /api/v1/notifications/:id/read     → Mark as read
PATCH /api/v1/notifications/read-all     → Mark all as read
DELETE /api/v1/notifications/:id         → Delete notification
```

**Trigger notifications khi:**
- Có comment mới trên bài viết của user
- Có reply cho comment của user
- Có vote cho post/comment của user

**Output:**
- Notifications CRUD hoạt động

**Ước tính:** 3-4 giờ

---

### 📦 TASK P3-13: Frontend - Notification Bell

**Mô tả:** UI thông báo trong header

**Dependencies:** P3-12

**Steps:**
```bash
1. Tạo NotificationBell component
2. Badge với unread count
3. Dropdown với danh sách notifications
4. Click → mark as read + navigate
5. Polling hoặc WebSocket (optional)
```

**Output:**
- Notification dropdown hoạt động
- Unread badge

**Ước tính:** 3-4 giờ

---

### 📦 TASK P3-14: Database Schema - User Blocks & Reports

**Mô tả:** Schema cho Block và Report

**Dependencies:** P1-03

**Schema:**
```prisma
model UserBlock {
  blockerId Int      @map("blocker_id")
  blockedId Int      @map("blocked_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  blocker   User     @relation("BlocksMade", fields: [blockerId], references: [id])
  blocked   User     @relation("BlocksReceived", fields: [blockedId], references: [id])
  
  @@id([blockerId, blockedId])
  @@map("user_blocks")
}

model Report {
  id          Int         @id @default(autoincrement())
  reporterId  Int         @map("reporter_id")
  targetType  ReportTarget @map("target_type")
  targetId    Int         @map("target_id")
  reason      String
  description String?
  status      ReportStatus @default(PENDING)
  reviewedBy  Int?        @map("reviewed_by")
  reviewedAt  DateTime?   @map("reviewed_at")
  createdAt   DateTime    @default(now()) @map("created_at")
  
  reporter    User        @relation(fields: [reporterId], references: [id])
  
  @@map("reports")
}

enum ReportTarget {
  USER
  POST
  COMMENT
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  REJECTED
}
```

**Output:**
- Bảng user_blocks, reports được tạo

**Ước tính:** 1-2 giờ

---

### 📦 TASK P3-15: Block & Report API

**Mô tả:** API cho Block user và Report

**Dependencies:** P3-14

**Endpoints:**
```
POST   /api/v1/users/:id/block        → Block user
DELETE /api/v1/users/:id/block        → Unblock user
GET    /api/v1/users/me/blocked       → List blocked users

POST   /api/v1/posts/:id/report       → Report post
POST   /api/v1/comments/:id/report    → Report comment
POST   /api/v1/users/:id/report       → Report user
```

**Output:**
- Block/Unblock hoạt động
- Report được tạo

**Ước tính:** 3 giờ

---

### 📦 TASK P3-16: Frontend - Block & Report UI

**Mô tả:** UI cho block và report

**Dependencies:** P3-15

**Steps:**
```bash
1. Block button trong profile
2. Report modal với reason input
3. Hiển thị "Đã ẩn" cho content của user bị block
4. Settings page với blocked users list
```

**Output:**
- Block/Report hoạt động từ UI

**Ước tính:** 3-4 giờ