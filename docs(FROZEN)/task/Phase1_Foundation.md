# PHASE 1: FOUNDATION (Nền tảng)

## Mô tả
Setup môi trường, DB schema, Auth system

## Thời gian ước tính
1.5-2 tuần

## Các Task

### 📦 TASK P1-01: Khởi tạo Backend Project

**Mô tả:** Setup project Node.js + Express + TypeScript

**Steps:**
```bash
1. Tạo thư mục backend/
2. npm init -y
3. Cài đặt dependencies:
   - express, cors, helmet, morgan, dotenv
   - typescript, ts-node, @types/node, @types/express
   - nodemon (dev)
4. Cấu hình tsconfig.json
5. Cấu hình nodemon.json
6. Tạo cấu trúc thư mục cơ bản
7. Tạo file src/index.ts với Express server cơ bản
8. Tạo scripts trong package.json (dev, build, start)
```

**Output:**
- Server chạy được tại `http://localhost:5000`
- Response "Hello World" khi GET `/`

**Ước tính:** 2-3 giờ

---

### 📦 TASK P1-02: Setup Prisma ORM & Database

**Mô tả:** Cấu hình Prisma với PostgreSQL

**Dependencies:** P1-01

**Steps:**
```bash
1. Cài đặt: prisma, @prisma/client
2. npx prisma init
3. Cấu hình DATABASE_URL trong .env
4. Tạo file .env.example
5. Tạo Prisma Client singleton (src/config/database.ts)
6. Test kết nối database
```

**Output:**
- Prisma CLI hoạt động
- Kết nối database thành công

**Ước tính:** 1-2 giờ

---

### 📦 TASK P1-03: Định nghĩa Database Schema - Users

**Mô tả:** Tạo schema cho bảng Users trong Prisma

**Dependencies:** P1-02

**Schema:**
```prisma
model User {
  id                Int       @id @default(autoincrement())
  email             String    @unique
  username          String    @unique
  passwordHash      String    @map("password_hash")
  displayName       String?   @map("display_name")
  avatarUrl         String?   @map("avatar_url")
  bio               String?
  dateOfBirth       DateTime? @map("date_of_birth")
  gender            String?
  role              Role      @default(MEMBER)
  reputation        Int       @default(0)
  isVerified        Boolean   @default(false) @map("is_verified")
  isActive          Boolean   @default(true) @map("is_active")
  lastActiveAt      DateTime? @map("last_active_at")
  usernameChangedAt DateTime? @map("username_changed_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  @@map("users")
}

enum Role {
  MEMBER
  MODERATOR
  ADMIN
}
```

**Steps:**
```bash
1. Thêm model User vào schema.prisma
2. npx prisma migrate dev --name init_users
3. npx prisma generate
4. Verify bằng npx prisma studio
```

**Output:**
- Bảng `users` được tạo trong database
- Prisma Client có type User

**Ước tính:** 1-2 giờ

---

### 📦 TASK P1-04: Cấu hình Express Middleware Cơ bản

**Mô tả:** Setup các middleware cần thiết

**Dependencies:** P1-01

**Steps:**
```bash
1. Tạo src/app.ts (tách khỏi index.ts)
2. Cấu hình middlewares:
   - express.json()
   - express.urlencoded()
   - cors()
   - helmet()
   - morgan() (logging)
3. Tạo global error handler middleware
4. Tạo 404 not found handler
5. Tạo response helper utilities
```

**Files tạo mới:**
- `src/app.ts`
- `src/middlewares/errorMiddleware.ts`
- `src/utils/response.ts`
- `src/utils/errors.ts` (Custom Error classes)

**Output:**
- Server handle được errors gracefully
- Response format chuẩn hóa

**Ước tính:** 2-3 giờ

---

### 📦 TASK P1-05: Tạo Auth Routes & Controller Structure

**Mô tả:** Tạo cấu trúc routes và controllers cho Auth

**Dependencies:** P1-04

**Steps:**
```bash
1. Tạo src/routes/index.ts (route aggregator)
2. Tạo src/routes/authRoutes.ts
3. Tạo src/controllers/authController.ts (skeleton)
4. Tạo src/services/authService.ts (skeleton)
5. Kết nối routes vào app.ts
```

**Endpoints (skeleton):**
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

**Output:**
- Routes trả về placeholder response
- Cấu trúc MVC rõ ràng

**Ước tính:** 2 giờ

---

### 📦 TASK P1-06: Implement User Registration

**Mô tả:** Hoàn thiện chức năng đăng ký

**Dependencies:** P1-03, P1-05

**Steps:**
```bash
1. Cài đặt: bcrypt, @types/bcrypt
2. Cài đặt: zod (validation)
3. Tạo src/validations/authValidation.ts
4. Tạo validation middleware
5. Implement authService.register()
6. Implement authController.register()
7. Hash password với bcrypt
8. Kiểm tra email/username trùng lặp
```

**Validation Rules:**
- Email: valid format, unique
- Username: 3-50 chars, alphanumeric + underscore, unique
- Password: min 8 chars, có chữ hoa, chữ thường, số

**Output:**
- POST `/api/v1/auth/register` hoạt động
- Test bằng Postman/Thunder Client

**Ước tính:** 3-4 giờ

---

### 📦 TASK P1-07: Implement JWT Authentication

**Mô tả:** Tạo hệ thống JWT cho login/logout

**Dependencies:** P1-06

**Steps:**
```bash
1. Cài đặt: jsonwebtoken, @types/jsonwebtoken
2. Tạo src/config/jwt.ts
3. Tạo src/utils/jwt.ts (generateToken, verifyToken)
4. Implement authService.login()
5. Implement authController.login()
6. Tạo Access Token (15min-1h)
7. Tạo Refresh Token (7-30 days)
8. Lưu refresh token vào database hoặc memory
```

**Output:**
- Login trả về accessToken + refreshToken
- Token có thể decode được payload

**Ước tính:** 3-4 giờ

---

### 📦 TASK P1-08: Tạo Auth Middleware

**Mô tả:** Middleware xác thực JWT cho protected routes

**Dependencies:** P1-07

**Steps:**
```bash
1. Tạo src/middlewares/authMiddleware.ts
2. Verify JWT từ Authorization header
3. Attach user info vào req.user
4. Tạo src/types/express.d.ts (extend Express Request)
5. Implement refresh token endpoint
```

**Output:**
- Protected routes yêu cầu valid JWT
- GET `/api/v1/auth/me` trả về user info

**Ước tính:** 2-3 giờ

---

### 📦 TASK P1-09: Role-Based Access Control (RBAC)

**Mô tả:** Middleware phân quyền theo role

**Dependencies:** P1-08

**Steps:**
```bash
1. Tạo src/middlewares/roleMiddleware.ts
2. Tạo src/constants/roles.ts
3. Implement hàm authorize(roles: Role[])
4. Test với các role: MEMBER, MODERATOR, ADMIN
```

**Usage:**
```typescript
router.delete('/posts/:id', 
  authenticate, 
  authorize(['MODERATOR', 'ADMIN']),
  postController.delete
);
```

**Output:**
- RBAC hoạt động chính xác
- 403 Forbidden khi không đủ quyền

**Ước tính:** 2 giờ

---

### 📦 TASK P1-10: Setup Frontend Project

**Mô tả:** Khởi tạo React + Vite + TypeScript

**Steps:**
```bash
1. cd frontend (đã có sẵn)
2. Kiểm tra và update dependencies trong package.json
3. npm install
4. Cấu hình Vite aliases (@/ for src/)
5. Setup TailwindCSS (đã có)
6. Setup Shadcn/UI (đã có một phần)
7. Tạo cấu trúc thư mục theo thiết kế
8. Tạo .env với VITE_API_URL
```

**Output:**
- `npm run dev` chạy tại `http://localhost:5173`
- TailwindCSS + Shadcn hoạt động

**Ước tính:** 2 giờ

---

### 📦 TASK P1-11: Setup API Layer Frontend

**Mô tả:** Cấu hình Axios và API services

**Dependencies:** P1-10

**Steps:**
```bash
1. Cài đặt: axios, @tanstack/react-query
2. Tạo src/api/axios.ts (Axios instance)
3. Cấu hình interceptors:
   - Request: attach Authorization header
   - Response: handle 401, refresh token
4. Tạo src/api/endpoints.ts
5. Tạo src/api/services/authService.ts
```

**Output:**
- Axios instance configured
- API calls tự động attach token

**Ước tính:** 2-3 giờ

---

### 📦 TASK P1-12: Implement AuthContext

**Mô tả:** React Context cho quản lý auth state

**Dependencies:** P1-11

**Steps:**
```bash
1. Update src/contexts/AuthContext.tsx
2. Implement các state: user, isAuthenticated, isLoading
3. Implement các methods: login, logout, register
4. Lưu token vào localStorage/cookie
5. Auto-login khi có token
6. Tạo custom hook useAuth()
```

**Output:**
- AuthContext hoạt động
- useAuth() hook sử dụng được

**Ước tính:** 3 giờ

---

### 📦 TASK P1-13: Xây dựng Login Page

**Mô tả:** UI và logic cho trang đăng nhập

**Dependencies:** P1-12

**Steps:**
```bash
1. Cài đặt: react-hook-form, @hookform/resolvers, zod
2. Update src/pages/LoginPage.tsx
3. Tạo form với email/username + password
4. Validation với zod
5. Integrate với authService.login()
6. Hiển thị loading, error states
7. Redirect sau khi login thành công
```

**Output:**
- Login form hoạt động
- Hiển thị lỗi validation
- Redirect về homepage sau login

**Ước tính:** 3-4 giờ

---

### 📦 TASK P1-14: Xây dựng Register Page

**Mô tả:** UI và logic cho trang đăng ký

**Dependencies:** P1-12

**Steps:**
```bash
1. Update src/pages/RegisterPage.tsx
2. Form với email, username, password, confirmPassword
3. Validation rules matching backend
4. Integrate với authService.register()
5. Success message hoặc redirect
```

**Output:**
- Register form hoạt động
- Hiển thị lỗi khi email/username trùng

**Ước tính:** 2-3 giờ

---

### 📦 TASK P1-15: Protected Routes & Routing

**Mô tả:** Cấu hình React Router với protected routes

**Dependencies:** P1-12

**Steps:**
```bash
1. Cài đặt: react-router-dom (nếu chưa có)
2. Tạo src/routes/index.tsx
3. Tạo src/routes/PrivateRoute.tsx
4. Tạo src/routes/AdminRoute.tsx
5. Định nghĩa tất cả routes
6. Implement redirect logic
```

**Route Structure:**
```
/
/login
/register
/posts/:id
/profile/:username
/admin/* → AdminRoute (protected)
```

**Output:**
- Routing hoạt động
- Protected routes redirect về login

**Ước tính:** 2-3 giờ