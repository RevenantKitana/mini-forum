# API Flow Visualization — Mini Forum

> Hướng dẫn chi tiết luồng API từ Frontend → Backend → Database  
> **Version**: v1.0  
> **Last Updated**: 4 tháng 3, 2026

---

https://www.figma.com/board/yk9QBbscyg98xgAtKDX8sg/Mini-Forum---Create-Post-API-Flow?node-id=1-2&t=7M6YJQjSbBOjRDmC-0
## Mục đích

Tài liệu này giải thích cách một request API hoạt động trong Mini Forum, sử dụng **Create Post** làm ví dụ chi tiết. Bạn sẽ hiểu được:
- Cách Frontend gửi request
- Backend xử lý như thế nào
- Database lưu dữ liệu thế nào
- Response trở lại Frontend như thế nào

---

## Use Case: Create Post (Tạo Bài Viết)

### Luồng Tổng Quan

```
User Input
   ↓
Frontend Validation
   ↓
API Request (HTTP POST)
   ↓
Backend Middleware (Auth)
   ↓
Backend Validation
   ↓
Business Logic
   ↓
Database Query
   ↓
Response Format
   ↓
Frontend Update
   ↓
UI Render
```

---

## Bước Chi Tiết

### 1️⃣ Frontend: User Input

**File**: [frontend/src/pages/CreatePostPage.tsx](../../frontend/src/pages/CreatePostPage.tsx) (hoặc component tương tự)

```typescript
// User điền form: title, content, tags, categoryId
const [formData, setFormData] = useState({
  title: "",
  content: "",
  tags: [],
  categoryId: 1
});

// Click "Post" button
const handleSubmit = async (e) => {
  e.preventDefault();
  // → Đi tới bước 2
};
```

### 2️⃣ Frontend: Validation

**File**: [frontend/src/lib/validation.ts](../../frontend/src/lib/validation.ts) hoặc [frontend/src/utils.ts](../../frontend/src/lib/utils.ts)

```typescript
// Kiểm tra dữ liệu trước khi gửi
- Title: 10-200 chars ✓
- Content: 20-50000 chars ✓
- Tags: max 10 tags ✓
- CategoryId: exists ✓

if (!isValid) {
  showError("Validation failed");
  return; // Dừng ở đây
}
// → Đi tới bước 3
```

**Validation Rules**: Xem [docs/03-API/README.md](./03-API/README.md#7-validation-rules)

### 3️⃣ API Request: Frontend gửi

**File**: [frontend/src/api/axios.ts](../../frontend/src/api/axios.ts) và [frontend/src/api/services/](../../frontend/src/api/services/)

```typescript
// axios client (axios.ts)
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json"
  }
});

// Thêm JWT token vào mỗi request (interceptor)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gửi request
const response = await axiosInstance.post("/posts", {
  title: "My Post Title",
  content: "# Post content...",
  tags: ["javascript", "react"],
  categoryId: 1
});
// → Đi tới bước 4 (Backend nhận request)
```

**HTTP Request Format**:
```
POST /api/v1/posts HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "title": "My Post Title",
  "content": "# Post content...",
  "tags": ["javascript", "react"],
  "categoryId": 1
}
```

### 4️⃣ Backend: Auth Middleware

**File**: [backend/src/middlewares/](../../backend/src/middlewares/) (xem `auth.ts` hoặc tương tự)

```typescript
// 1. Kiểm tra Authorization header
const token = req.headers.authorization?.replace("Bearer ", "");

if (!token) {
  return res.status(401).json({
    success: false,
    error: { code: "UNAUTHORIZED", message: "Token is required" }
  });
}

// 2. Verify JWT signature & expiration
const decoded = jwt.verify(token, process.env.JWT_SECRET);

if (!decoded) {
  return res.status(401).json({
    success: false,
    error: { code: "TOKEN_EXPIRED", message: "Token has expired" }
  });
}

// ✓ Token valid → Pass to next middleware
req.userId = decoded.userId;
next();
// → Đi tới bước 5
```

**Nếu token invalid**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": []
  }
}
```
→ Response trở lại Frontend (HTTP 401)

### 5️⃣ Backend: Request Validation

**File**: [backend/src/validations/](../../backend/src/validations/) (xem `postValidation.ts` hoặc tương tự)

```typescript
// Validate body fields
const schema = {
  title: {
    type: "string",
    minLength: 10,
    maxLength: 200,
    required: true
  },
  content: {
    type: "string",
    minLength: 20,
    maxLength: 50000,
    required: true
  },
  tags: {
    type: "array",
    maxItems: 10,
    required: false
  },
  categoryId: {
    type: "number",
    required: true
  }
};

const validation = validate(req.body, schema);

if (!validation.valid) {
  return res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request body",
      details: validation.errors
    }
  });
}
// → Đi tới bước 6
```

### 6️⃣ Backend: Controller Logic

**File**: [backend/src/controllers/postController.ts](../../backend/src/controllers/) hoặc tương tự

```typescript
export const createPost = async (req, res) => {
  try {
    const { title, content, tags, categoryId } = req.body;
    const userId = req.userId; // từ auth middleware

    // 1. Check category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Category not found" }
      });
    }

    // 2. Call service layer (business logic)
    const newPost = await postService.createPost({
      title,
      content,
      tags,
      categoryId,
      authorId: userId
    });

    // 3. Return success response
    res.status(201).json({
      success: true,
      data: newPost,
      message: "Post created successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: error.message }
    });
  }
};
```

### 7️⃣ Backend: Business Logic (Service Layer)

**File**: [backend/src/services/postService.ts](../../backend/src/services/) hoặc tương tự

```typescript
export const createPost = async (data) => {
  const {
    title,
    content,
    tags = [],
    categoryId,
    authorId
  } = data;

  // 1. Check user exists
  const user = await prisma.user.findUnique({
    where: { id: authorId }
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 2. Process tags (tạo hoặc lấy existing)
  const processedTags = await Promise.all(
    tags.map(async (tagName) => {
      let tag = await prisma.tag.findUnique({
        where: { slug: slugify(tagName) }
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: tagName,
            slug: slugify(tagName)
          }
        });
      }

      return tag;
    })
  );

  // 3. Create post (Bước 8️⃣)
  const post = await prisma.post.create({
    data: {
      title,
      slug: slugify(title),
      content,
      status: "PUBLISHED",
      categoryId,
      authorId,
      tags: {
        connect: processedTags.map(t => ({ id: t.id }))
      }
    },
    include: {
      author: true,
      category: true,
      tags: true
    }
  });

  return post;
};
```

### 8️⃣ Database: Insert Query

**File**: [backend/prisma/schema.prisma](../../backend/prisma/schema.prisma)

```prisma
model Post {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(200)
  slug        String    @unique
  content     String    @db.Text
  status      PostStatus @default(PUBLISHED) // DRAFT, PUBLISHED, HIDDEN, DELETED
  
  authorId    Int
  author      User      @relation(fields: [authorId], references: [id])
  
  categoryId  Int
  category    Category  @relation(fields: [categoryId], references: [id])
  
  tags        Tag[]     @relation("PostToTag", through: "post_tags")
  comments    Comment[]
  votes       Vote[]
  bookmarks   Bookmark[]
  reports     Report[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([authorId])
  @@index([categoryId])
  @@index([status])
}

model PostTag {
  postId    Int
  tagId     Int
  post      Post      @relation("PostToTag", fields: [postId], references: [id], onDelete: Cascade)
  tag       Tag       @relation("PostToTag", fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
}

model Tag {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  slug      String    @unique
  posts     Post[]    @relation("PostToTag", through: "post_tags")
  createdAt DateTime  @default(now())
}
```

**SQL Executed**:
```sql
-- Insert post
INSERT INTO posts (title, slug, content, status, authorId, categoryId, createdAt, updatedAt)
VALUES ('My Post Title', 'my-post-title', '# Post content...', 'PUBLISHED', 1, 1, NOW(), NOW());
-- Returns: postId = 42

-- Insert tags (if new)
INSERT INTO tags (name, slug, createdAt) VALUES ('javascript', 'javascript', NOW());
INSERT INTO tags (name, slug, createdAt) VALUES ('react', 'react', NOW());

-- Link post to tags
INSERT INTO post_tags (postId, tagId) VALUES (42, 1), (42, 2);
```

**Data saved**:
```
┌─────┬────────────────────┬─────────────────────────┬──────────┐
│ id  │ title              │ authorId │ categoryId  │ status   │
├─────┼────────────────────┼──────────┼─────────────┼──────────┤
│ 42  │ My Post Title      │ 1        │ 1           │ PUBLISHED│
└─────┴────────────────────┴──────────┴─────────────┴──────────┘
```

### 9️⃣ Backend: Format Response

```typescript
// postService.createPost() returns:
{
  id: 42,
  title: "My Post Title",
  slug: "my-post-title",
  content: "# Post content...",
  status: "PUBLISHED",
  isPinned: false,
  isLocked: false,
  upvoteCount: 0,
  downvoteCount: 0,
  viewCount: 0,
  commentCount: 0,
  author: {
    id: 1,
    username: "john_doe",
    displayName: "John Doe",
    avatarUrl: "https://..."
  },
  category: {
    id: 1,
    name: "General",
    slug: "general"
  },
  tags: [
    { id: 1, name: "javascript", slug: "javascript" },
    { id: 2, name: "react", slug: "react" }
  ],
  createdAt: "2026-02-20T10:30:00Z",
  updatedAt: "2026-02-20T10:30:00Z"
}
```

### 🔟 Backend: Send Response

```typescript
// HTTP 201 Created
res.status(201).json({
  success: true,
  data: newPost,
  message: "Post created successfully"
});
```

**HTTP Response**:
```
HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 1234

{
  "success": true,
  "data": {
    "id": 42,
    "title": "My Post Title",
    ...
  },
  "message": "Post created successfully"
}
```

### 1️⃣1️⃣ Frontend: Receive & Update State

**File**: [frontend/src/pages/CreatePostPage.tsx](../../frontend/src/pages/CreatePostPage.tsx) hoặc [frontend/src/api/services/](../../frontend/src/api/services/)

```typescript
try {
  const response = await axiosInstance.post("/posts", formData);
  
  // ✓ Success (HTTP 201)
  const newPost = response.data.data; // { id, title, content, ... }
  
  // Update local state/cache
  setPost(newPost);
  
  // Show notification
  toast.success(response.data.message);
  
  // Navigate to post detail page
  navigate(`/posts/${newPost.slug}`);
  
} catch (error) {
  // ✗ Error (HTTP 4xx/5xx)
  const errorCode = error.response?.data?.error?.code;
  
  if (errorCode === "VALIDATION_ERROR") {
    showErrors(error.response.data.error.details);
  } else if (errorCode === "UNAUTHORIZED") {
    redirectToLogin();
  } else {
    toast.error("Failed to create post");
  }
}
```

### 1️⃣2️⃣ Frontend: Render UI

```typescript
// Show newly created post in list
<PostCard post={newPost} />

// Or navigate to post detail page
<PostDetail postId={newPost.id} />
```

---

## Common Error Scenarios

### ❌ Scenario 1: Missing JWT Token

```
1. Frontend → API (no Authorization header)
2. Backend Auth middleware checks header
3. ✗ Token not found
4. Response: 401 UNAUTHORIZED
   {
     "success": false,
     "error": {
       "code": "UNAUTHORIZED",
       "message": "Token is required"
     }
   }
5. Frontend: Redirect to Login
```

### ❌ Scenario 2: Token Expired

```
1. Frontend → API (expired token)
2. Backend Auth middleware verifies JWT
3. ✗ Token signature invalid or expired
4. Response: 401 TOKEN_EXPIRED
5. Frontend: Call /auth/refresh or redirect to Login
```

### ❌ Scenario 3: Validation Failed

```
1. Frontend → API (title too short: "Hi")
2. Backend Request Validation checks rules
3. ✗ title < 10 chars
4. Response: 400 VALIDATION_ERROR
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid request body",
       "details": [
         { "field": "title", "message": "must be at least 10 characters" }
       ]
     }
   }
5. Frontend: Show error message to user
```

### ❌ Scenario 4: Category Not Found

```
1. Frontend → API (categoryId: 9999)
2. Backend: Controller checks if category exists
3. ✗ Category not found in database
4. Response: 404 NOT_FOUND
5. Frontend: Show error "Category not found"
```

### ❌ Scenario 5: Database Error

```
1. Frontend → API
2. Backend → Database
3. ✗ Database connection fails / SQL error
4. Response: 500 INTERNAL_SERVER_ERROR
   {
     "success": false,
     "error": {
       "code": "INTERNAL_SERVER_ERROR",
       "message": "Database connection failed"
     }
   }
5. Frontend: Show generic error message (don't expose DB details)
```

---

## Response Format Reference

### ✅ Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Post created successfully",
  "pagination": { ... } // optional
}
```

HTTP Status: `200 OK`, `201 Created`, `204 No Content`

### ❌ Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

HTTP Status: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`

**Error Codes**: [docs/03-API/README.md](./03-API/README.md#4-error-codes)

---

## Key Files Reference

| Component | Files |
|-----------|-------|
| Frontend API | [frontend/src/api/axios.ts](../../frontend/src/api/axios.ts) |
| Frontend Service | [frontend/src/api/services/](../../frontend/src/api/services/) |
| Backend Routes | [backend/src/routes/](../../backend/src/routes/) |
| Backend Controller | [backend/src/controllers/](../../backend/src/controllers/) |
| Backend Service | [backend/src/services/](../../backend/src/services/) |
| Backend Middleware | [backend/src/middlewares/](../../backend/src/middlewares/) |
| Database Schema | [backend/prisma/schema.prisma](../../backend/prisma/schema.prisma) |
| Validation Rules | [docs/03-API/README.md](./03-API/README.md#7-validation-rules) |
| Error Codes | [docs/03-API/README.md](./03-API/README.md#4-error-codes) |

---

## Other API Flows

Luồng tương tự áp dụng cho các API khác:

- **User Login**: Frontend form → Backend auth check → JWT creation → Frontend store token
- **Get Posts**: Frontend request → Backend query → Database fetch → Format response → Frontend render list
- **Upvote Post**: Frontend button click → Backend check user voted → Update votes table → Response count
- **Delete Post**: Frontend confirm → Backend auth + permission check → Database cascade delete → Frontend update
- **Search Posts**: Frontend search input → API query → Database full-text search → Paginated results

---

**Xem thêm**:
- [API Reference](./03-API/README.md)
- [Database Schema](./02-DATABASE.md)
- [Architecture](./01-ARCHITECTURE.md)
