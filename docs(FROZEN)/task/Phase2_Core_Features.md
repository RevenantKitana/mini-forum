# PHASE 2: CORE FEATURES (Tính năng cốt lõi)

## Mô tả
Posts, Comments, Categories, Tags

## Thời gian ước tính
3-4 tuần

## Các Task

### 📦 TASK P2-01: Database Schema - Categories & Tags

**Mô tả:** Tạo schema cho Categories và Tags

**Dependencies:** P1-03

**Schema:**
```prisma
model Category {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  icon        String?
  postCount   Int      @default(0) @map("post_count")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  posts       Post[]
  
  @@map("categories")
}

model Tag {
  id         Int      @id @default(autoincrement())
  name       String
  slug       String   @unique
  usageCount Int      @default(0) @map("usage_count")
  createdAt  DateTime @default(now()) @map("created_at")
  
  posts      PostTag[]
  
  @@map("tags")
}
```

**Steps:**
```bash
1. Thêm models vào schema.prisma
2. Run migration
3. Seed data mẫu cho categories
```

**Output:**
- Bảng categories, tags được tạo
- Có sẵn 5-10 categories mẫu

**Ước tính:** 1-2 giờ

---

### 📦 TASK P2-02: Database Schema - Posts

**Mô tả:** Tạo schema cho Posts và quan hệ

**Dependencies:** P2-01

**Schema:**
```prisma
model Post {
  id            Int       @id @default(autoincrement())
  title         String
  content       String
  authorId      Int       @map("author_id")
  categoryId    Int       @map("category_id")
  viewCount     Int       @default(0) @map("view_count")
  upvoteCount   Int       @default(0) @map("upvote_count")
  downvoteCount Int       @default(0) @map("downvote_count")
  commentCount  Int       @default(0) @map("comment_count")
  status        PostStatus @default(PUBLISHED)
  isPinned      Boolean   @default(false) @map("is_pinned")
  isLocked      Boolean   @default(false) @map("is_locked")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  author        User      @relation(fields: [authorId], references: [id])
  category      Category  @relation(fields: [categoryId], references: [id])
  tags          PostTag[]
  comments      Comment[]
  
  @@map("posts")
}

model PostTag {
  postId Int @map("post_id")
  tagId  Int @map("tag_id")
  
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
  @@map("post_tags")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  HIDDEN
  DELETED
}
```

**Output:**
- Bảng posts, post_tags được tạo
- Relations hoạt động

**Ước tính:** 2 giờ

---

### 📦 TASK P2-03: Categories API - CRUD

**Mô tả:** API endpoints cho Categories

**Dependencies:** P2-01

**Files:**
- `src/routes/categoryRoutes.ts`
- `src/controllers/categoryController.ts`
- `src/services/categoryService.ts`
- `src/validations/categoryValidation.ts`

**Endpoints:**
```
GET    /api/v1/categories          → List all
GET    /api/v1/categories/:slug    → Get by slug
POST   /api/v1/categories          → Create (Admin)
PUT    /api/v1/categories/:id      → Update (Admin)
DELETE /api/v1/categories/:id      → Delete (Admin)
```

**Output:**
- CRUD Categories hoàn chỉnh
- Tự động generate slug

**Ước tính:** 3-4 giờ

---

### 📦 TASK P2-04: Tags API - CRUD

**Mô tả:** API endpoints cho Tags

**Dependencies:** P2-01

**Endpoints:**
```
GET    /api/v1/tags                → List all
GET    /api/v1/tags/popular        → Popular tags
GET    /api/v1/tags/:slug          → Get by slug
POST   /api/v1/tags                → Create (Mod/Admin)
DELETE /api/v1/tags/:id            → Delete (Admin)
```

**Output:**
- CRUD Tags hoàn chỉnh

**Ước tính:** 2-3 giờ

---

### 📦 TASK P2-05: Posts API - Create & Read

**Mô tả:** Tạo và xem bài viết

**Dependencies:** P2-02, P2-03, P2-04

**Files:**
- `src/routes/postRoutes.ts`
- `src/controllers/postController.ts`
- `src/services/postService.ts`
- `src/validations/postValidation.ts`

**Endpoints:**
```
GET  /api/v1/posts                 → List (paginated, filterable)
GET  /api/v1/posts/featured        → Featured posts
GET  /api/v1/posts/latest          → Latest posts
GET  /api/v1/posts/:id             → Get by ID
POST /api/v1/posts                 → Create (Member+)
```

**Query params for list:**
- `page`, `limit`
- `category` (slug)
- `tag` (slug)
- `sort` (latest, popular, trending)
- `author` (username)

**Output:**
- Tạo post với tags
- List posts với pagination
- Filter theo category/tag

**Ước tính:** 4-5 giờ

---

### 📦 TASK P2-06: Posts API - Update & Delete

**Mô tả:** Sửa và xóa bài viết

**Dependencies:** P2-05

**Endpoints:**
```
PUT    /api/v1/posts/:id           → Update (Owner)
DELETE /api/v1/posts/:id           → Delete (Owner/Mod/Admin)
PATCH  /api/v1/posts/:id/status    → Change status (Owner/Mod/Admin)
PATCH  /api/v1/posts/:id/pin       → Pin/Unpin (Mod/Admin)
PATCH  /api/v1/posts/:id/lock      → Lock comments (Mod/Admin)
```

**Logic:**
- Owner chỉ sửa bài của mình
- Mod/Admin có thể xóa/ẩn bài
- Soft delete (status = DELETED)

**Output:**
- Update/Delete hoạt động với authorization

**Ước tính:** 3-4 giờ

---

### 📦 TASK P2-07: Database Schema - Comments

**Mô tả:** Tạo schema cho Comments (nested + quote)

**Dependencies:** P2-02

**Schema:**
```prisma
model Comment {
  id              Int      @id @default(autoincrement())
  content         String
  authorId        Int      @map("author_id")
  postId          Int      @map("post_id")
  parentId        Int?     @map("parent_id")
  quotedCommentId Int?     @map("quoted_comment_id")
  upvoteCount     Int      @default(0) @map("upvote_count")
  downvoteCount   Int      @default(0) @map("downvote_count")
  status          CommentStatus @default(VISIBLE)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  author          User     @relation(fields: [authorId], references: [id])
  post            Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent          Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies         Comment[] @relation("CommentReplies")
  quotedComment   Comment? @relation("QuotedComment", fields: [quotedCommentId], references: [id])
  quotes          Comment[] @relation("QuotedComment")
  
  @@map("comments")
}

enum CommentStatus {
  VISIBLE
  HIDDEN
  DELETED
}
```

**Output:**
- Bảng comments với self-reference

**Ước tính:** 1-2 giờ

---

### 📦 TASK P2-08: Comments API - CRUD

**Mô tả:** API cho bình luận

**Dependencies:** P2-07

**Endpoints:**
```
GET    /api/v1/posts/:postId/comments   → List comments
POST   /api/v1/posts/:postId/comments   → Add comment (Member+)
PUT    /api/v1/comments/:id             → Update (Owner)
DELETE /api/v1/comments/:id             → Delete (Owner/PostOwner/Mod/Admin)
```

**Features:**
- Nested comments (parentId)
- Quote reply (quotedCommentId)
- Pagination

**Output:**
- CRUD Comments hoạt động
- Nested structure in response

**Ước tính:** 4-5 giờ

---

### 📦 TASK P2-09: Frontend - Layout Components

**Mô tả:** Xây dựng layout chung

**Dependencies:** P1-10

**Components:**
- `src/components/layout/MainLayout.tsx`
- Update `Header.tsx` (logo, nav, user menu)
- Update `Footer.tsx`
- Update `Sidebar.tsx` (left: categories, right: trending)

**Output:**
- Layout responsive
- Header với user dropdown

**Ước tính:** 4-5 giờ

---

### 📦 TASK P2-10: Frontend - Category Sidebar

**Mô tả:** Sidebar hiển thị danh sách categories

**Dependencies:** P2-03, P2-09

**Steps:**
```bash
1. Tạo src/api/services/categoryService.ts
2. Tạo src/hooks/useCategories.ts
3. Update Sidebar.tsx với CategoryList
4. Click category → filter posts
```

**Output:**
- Categories load từ API
- Click → navigate với filter

**Ước tính:** 2-3 giờ

---

### 📦 TASK P2-11: Frontend - Post Types & Services

**Mô tả:** Định nghĩa types và API services cho Posts

**Dependencies:** P2-05

**Files:**
```
src/types/post.types.ts
src/api/services/postService.ts
src/hooks/usePosts.ts
src/hooks/usePost.ts (single post)
```

**Output:**
- TypeScript types đầy đủ
- React Query hooks

**Ước tính:** 2-3 giờ

---

### 📦 TASK P2-12: Frontend - Post List Component

**Mô tả:** Component hiển thị danh sách bài viết

**Dependencies:** P2-11

**Components:**
```
src/components/post/PostCard.tsx
src/components/post/PostList.tsx
src/components/common/Pagination.tsx
```

**Features:**
- Card với title, excerpt, author, stats
- Pagination
- Loading skeleton

**Output:**
- PostList render từ API
- Responsive design

**Ước tính:** 4-5 giờ

---

### 📦 TASK P2-13: Frontend - HomePage với Posts

**Mô tả:** Trang chủ hiển thị bài viết

**Dependencies:** P2-10, P2-12

**Steps:**
```bash
1. Update HomePage.tsx
2. Layout: Sidebar Left + PostList Center + Sidebar Right
3. Implement category filtering
4. Implement sorting (latest, popular)
5. Infinite scroll hoặc pagination
```

**Output:**
- Homepage hiển thị posts
- Filter/Sort hoạt động

**Ước tính:** 3-4 giờ

---

### 📦 TASK P2-14: Frontend - Post Detail Page

**Mô tả:** Trang chi tiết bài viết

**Dependencies:** P2-11

**Steps:**
```bash
1. Update PostDetailPage.tsx
2. Fetch post by ID
3. Hiển thị: title, content, author, date, category, tags
4. Vote buttons (UI only, logic later)
5. Bookmark button (UI only)
```

**Output:**
- Post detail hiển thị đầy đủ
- Responsive layout

**Ước tính:** 3-4 giờ

---

### 📦 TASK P2-15: Frontend - Create Post Page

**Mô tả:** Form tạo bài viết mới

**Dependencies:** P2-05, P2-10

**Steps:**
```bash
1. Tạo src/pages/CreatePostPage.tsx
2. Form: title, content (textarea/rich text), category select, tags input
3. Validation với zod
4. Submit → postService.create()
5. Redirect sau khi tạo thành công
```

**Output:**
- Create post hoạt động
- Tags có thể thêm nhiều

**Ước tính:** 4-5 giờ

---

### 📦 TASK P2-16: Frontend - Comment Types & Services

**Mô tả:** Types và services cho Comments

**Dependencies:** P2-08

**Files:**
```
src/types/comment.types.ts
src/api/services/commentService.ts
src/hooks/useComments.ts
```

**Output:**
- Comment types định nghĩa
- API hooks ready

**Ước tính:** 2 giờ

---

### 📦 TASK P2-17: Frontend - Comment Components

**Mô tả:** Components hiển thị và thêm bình luận

**Dependencies:** P2-16

**Components:**
```
src/components/comment/CommentItem.tsx
src/components/comment/CommentList.tsx
src/components/comment/CommentForm.tsx
src/components/comment/QuoteReply.tsx
```

**Features:**
- Nested comments display
- Quote highlight
- Reply button
- Edit/Delete (owner)

**Output:**
- Comments render nested
- Quote reply hoạt động

**Ước tính:** 5-6 giờ

---

### 📦 TASK P2-18: Integrate Comments vào Post Detail

**Mô tả:** Kết nối comments vào trang chi tiết

**Dependencies:** P2-14, P2-17

**Steps:**
```bash
1. Thêm CommentList vào PostDetailPage
2. Thêm CommentForm (logged in only)
3. Handle reply action
4. Handle quote action
5. Real-time update sau khi add comment
```

**Output:**
- Comments hoạt động end-to-end
- Quote reply hoạt động

**Ước tính:** 3-4 giờ