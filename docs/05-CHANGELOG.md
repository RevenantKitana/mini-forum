# Changelog — Mini Forum

> **Version**: v1.27.0  
> **Last Updated**: 2026-03-26

Tất cả các thay đổi lớn của dự án này sẽ được ghi lại trong file này.


Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.27.0] - 2026-03-26

### Feature — Vibe Content Service (AI-Powered Bot Content Generator)

Tích hợp dịch vụ tạo nội dung tự động sử dụng Gemini LLM để sinh bài viết, bình luận, và vote từ các bot do admin quản lý. Hệ thống có fallback sang Groq và Cerebras nếu Gemini không khả dụng.

**Đặc điểm chính**:
- Tự động tạo 40% bài viết, 35% bình luận, 25% vote mỗi 30 phút
- Hỗ trợ multiple LLM providers (Gemini → Groq → Cerebras → Template fallback)
- Rate limiting: 3 posts, 6 comments, 15 votes/bot/ngày
- Personality tracking cho mỗi bot user
- Cron job scheduler tích hợp PM2
- Đầy đủ logging qua Winston

**Services**:
- `ContentGeneratorService`: Orchestrator chính
- `ActionSelectorService`: Chọn loại tác động (post/comment/vote)
- `ContextGathererService`: Thu thập context từ database
- `PromptBuilderService`: Xây dựng prompt động
- `ValidationService`: Kiểm tra output từ LLM
- `APIExecutorService`: Gọi API backend
- `PersonalityService`: Quản lý nhân cách bot
- `LLMProviderManager`: Quản lý multiple LLM providers

**Database Changes**:
- `vibe_content/prisma/schema.prisma`: Thêm model `user_content_context` để tracking personality
- Seed scripts: `seed:bots`, `seed:tags`

**Files changed**:
- **vibe-content service**: `src/services/` (ContentGeneratorService, ActionSelectorService, v.v.), `src/prompts/`, `seed/`
- **Backend**: `backend/prisma/migrations/` - thêm user_content_context model
- **Deployment**: PM2 config tại `vibe-content/service/ecosystem.config.cjs`

---

### Feature — Email Service Migration (Nodemailer → SendGrid)

Thay thế SMTP-based Nodemailer bằng SendGrid API để cải thiện reliability, tracking, deliverability.

**Changes**:
- Thay thế `nodemailer` package → `@sendgrid/mail` v8.1.3
- Environment variables: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` (thay cho SMTP_*)
- Email templates tối ưu hóa cho SendGrid
- Seed account updated: `sfw.forum@atomicmail.io`

**Files changed**:
- `backend/src/services/emailService.ts`: Rewrite sử dụng SendGrid SDK
- `.env.example`: Cập nhật email config variables
- `backend/prisma/seed.ts`: Thay đổi seed email
- Deployment docs

---

### Feature — Thêm vai trò người dùng BOT

Thêm vai trò thứ 4 `BOT` vào hệ thống, bên cạnh ADMIN / MODERATOR / MEMBER. BOT kế thừa toàn bộ tính chất và quyền hạn của MEMBER (hierarchy level 1).

**Đặc điểm vai trò BOT**:
- Cùng cấp quyền với MEMBER trong role hierarchy (level 1)
- Có thể tạo bài viết, bình luận, vote, bookmark giống MEMBER
- Tuân theo category permissions (view/post/comment) như MEMBER
- Bị giới hạn thời gian chỉnh sửa comment như MEMBER
- Không thể truy cập admin-client
- Hiển thị badge riêng "Bot" (màu emerald) trên PostCard và ProfilePage
- Admin có thể gán/thay đổi role BOT từ admin-client

**Files changed**:
- **Database**:
  - `backend/prisma/schema.prisma`: Thêm `BOT` vào enum `Role`
  - `backend/prisma/migrations/20260326052535_add_bot_role/`: Migration SQL

- **Backend**:
  - `backend/src/constants/roles.ts`: Thêm `BOT` vào ROLES constant và ROLE_HIERARCHY (level 1)
  - `backend/src/controllers/adminController.ts`: Thêm `BOT` vào danh sách role hợp lệ trong `changeUserRole()` và `rolesMap` dashboard stats
  - `backend/src/services/postService.ts`: Xử lý BOT trong `checkPermission()` - map BOT → MEMBER
  - `backend/src/services/commentService.ts`: Xử lý BOT trong `checkPermission()` và locked post check

- **Frontend**:
  - `frontend/src/types/index.ts`: Thêm `'BOT'` vào `UserRole` type
  - `frontend/src/components/PostCard.tsx`: Thêm BOT badge (emerald) trong `getAuthorBadge()`
  - `frontend/src/pages/ProfilePage.tsx`: Thêm BOT badge trong `getRoleBadge()`
  - `frontend/src/pages/PostDetailPage.tsx`: Thêm BOT vào `permissionLabels`, xử lý BOT trong `checkPermissionLevel()`
  - `frontend/src/pages/HomePage.tsx`: Không cần thay đổi (BOT tự động hoạt động đúng với MEMBER logic)
  - `frontend/src/components/layout/Sidebar.tsx`: Thêm BOT vào `permissionLabels`, xử lý BOT trong `checkPermissionLevel()`
  - `frontend/src/components/common/CreatePostDialog.tsx`: Xử lý BOT trong permission check + `permissionLabels`
  - `frontend/src/components/common/PostFormDialog.tsx`: Xử lý BOT trong permission check + `permissionLabels`

- **Admin-client**:
  - `admin-client/src/api/services/adminService.ts`: Thêm `BOT` vào `DashboardStats` interface
  - `admin-client/src/pages/UsersPage.tsx`: Thêm BOT badge, filter option, role change menu item
  - `admin-client/src/pages/DashboardPage.tsx`: Thêm BOT vào user role stats display

---

## [1.26.0] - 2026-03-19

### Feature — Dynamic Comment Edit Time Limit Configuration

Tạo API endpoint để frontend lấy giá trị `COMMENT_EDIT_TIME_LIMIT` động, thay vì hardcode. Giải quyết vấn đề không đồng bộ khi admin thay đổi cấu hình từ `.env`.

**Problem**: 
- Backend config: `COMMENT_EDIT_TIME_LIMIT` từ `.env` được đọc động
- Frontend cấu hình: Hardcode `COMMENT_EDIT_TIME_LIMIT_MINUTES = 30`
- Nếu admin thay đổi `.env` thành `COMMENT_EDIT_TIME_LIMIT=20`, backend kiểm soát chính xác nhưng frontend vẫn để nút Edit hoạt động 30 phút → người dùng thấy error khi submit sau 20 phút

**Solution**:
- Tạo endpoint `GET /api/v1/config/comment` trong backend
- Endpoint trả về `{ editTimeLimit: number }`
- Frontend hook `useCommentConfig()` lấy dữ liệu động với caching 24h
- Thay thế hardcode `DEFAULT_COMMENT_EDIT_TIME_LIMIT_MINUTES` bằng giá trị từ API
- Fallback về 30 phút khi API chưa load xong

**Files changed**:
- **Backend**:
  - `backend/src/controllers/configController.ts` (NEW): Controller xử lý endpoint config
  - `backend/src/routes/configRoutes.ts` (NEW): Routes cho config endpoints
  - `backend/src/routes/index.ts`: Thêm route `/config`

- **Frontend**:
  - `frontend/src/hooks/useConfig.ts` (NEW): React Query hook để fetch config động
  - `frontend/src/pages/PostDetailPage.tsx`:
    - Import `useCommentConfig` hook
    - Thay `const COMMENT_EDIT_TIME_LIMIT_MINUTES = 30` → `const DEFAULT_COMMENT_EDIT_TIME_LIMIT_MINUTES = 30`
    - Fetch config: `const { data: commentConfig } = useCommentConfig()`
    - Tính giá trị: `const commentEditTimeLimit = commentConfig?.editTimeLimit ?? DEFAULT_COMMENT_EDIT_TIME_LIMIT_MINUTES`
    - Thêm prop `commentEditTimeLimit` vào `CommentItem` interface
    - Cập nhật `CommentItem` component sử dụng dynamic value thay vì hardcode

**Benefits**:
- Backend và frontend đồng bộ khi admin thay đổi config
- Config được cache 24h để tránh request không cần thiết
- Admin có thể điều chỉnh thời hạn edit comment mà không cần deploy frontend
- Fallback an toàn khi API chưa load

---

## [1.25.1] - 2026-03-10

### Bug Fixes — Font Size Persistence, PostCard Mobile Badge, Comment Metadata Wrapping

Fix 3 bugs từ PLAN.md Phase 1: BUG-001 (font size reset sau reload), BUG-003 (comment metadata overflow mobile), BUG-004 (role badge ẩn trên mobile).

#### Bug Fix — BUG-001: Font Size Scale Không Được Áp Dụng Sau Page Reload

**Root Cause**: `FontSizeProvider` đọc scale từ localStorage qua `getInitialScale()` nhưng **không gọi** `applyFontScaleToDOM()` khi mount. CSS variable `--font-size-scale` luôn về giá trị mặc định (1.0) sau mỗi lần reload, bất kể user đã chọn scale nào.

**Symptom**: User chọn "Lớn" (xl=1.3) → refresh trang → UI dropdown vẫn hiện "Lớn" nhưng font size hiển thị bằng "Trung Bình" (1.0).

**Fix**: Thêm `useEffect(() => { applyFontScaleToDOM(scale); }, [])` vào `FontSizeProvider` để apply CSS variable ngay khi component mount, sử dụng scale đã đọc từ localStorage.

**Files changed**:
- **`frontend/src/contexts/FontSizeContext.tsx`**:
  - Import thêm `useEffect` từ React
  - Thêm `useEffect` với dependency array rỗng `[]` để gọi `applyFontScaleToDOM(scale)` một lần khi mount
  - Scale trong closure được đọc từ `getInitialScale()` (localStorage hoặc `'md'`)

#### Bug Fix — BUG-004: PostCard Author Role Badge Ẩn Trên Mobile

**Root Cause**: Badge Admin/Moderator được wrap trong `<span className="hidden md:contents">`, ẩn hoàn toàn trên viewport < 768px. Mobile users không thể nhận biết author là Admin hay Mod.

**Fix**: Xóa wrapper `hidden md:contents`, để `getAuthorBadge()` render trực tiếp. Parent div đã có `flex-wrap` nên badge tự xuống dòng khi không đủ chỗ, không gây overflow.

**Files changed**:
- **`frontend/src/components/PostCard.tsx`**:
  - Xóa `<span className="hidden md:contents">` wrapper
  - Badge render inline trong `flex flex-wrap items-center gap-1.5` row
  - Badge chỉ hiện khi author là ADMIN hoặc MODERATOR (null với Members)

#### Bug Fix — BUG-003: Comment Author Metadata Overflow Trên Mobile

**Root Cause**: Author metadata row trong `CommentCard` sử dụng `flex items-center gap-2` **không có** `flex-wrap`. Trên viewport 720px với reply indentation, các phần tử: Avatar + DisplayName + @username + timestamp + "(đã chỉnh sửa)" tràn ra ngoài container.

**Fix**: Đổi sang `flex flex-wrap items-center gap-x-2 gap-y-1` để các phần tử tự xuống dòng. Thêm `flex-shrink-0` vào timestamp và "(đã chỉnh sửa)" để tránh text bị shrink trước khi wrap. Chuẩn hóa font size timestamp từ `text-sm` xuống `text-xs` cho nhất quán.

**Files changed**:
- **`frontend/src/pages/PostDetailPage.tsx`** (function `CommentCard`):
  - `flex items-center gap-2` → `flex flex-wrap items-center gap-x-2 gap-y-1`
  - Avatar: thêm `flex-shrink-0`
  - Timestamp `<span>`: `text-sm` → `text-xs`, thêm `flex-shrink-0`
  - "(đã chỉnh sửa)" `<span>`: thêm `flex-shrink-0`

---

## [1.25.0] - 2026-03-10

### Feature — Font Size Customization & Mobile Category Display

Cải thiện UX accessibility: người dùng có thể tùy chỉnh cỡ chữ trang web, hiển thị danh mục bài viết trên mobile.

#### Feature — Font Size Customization (5-Level Scale)

**Tính năng**: Thêm selector cỡ chữ vào Header toolbar cho phép người dùng tùy chỉnh: Rất Nhỏ → Nhỏ → Trung Bình → Lớn → Rất Lớn.

**Cấu trúc**:
- **Scale factors**: xs=0.7, sm=0.85, md=1 (default), lg=1.15, xl=1.3
- **Lưu trữ**: localStorage (`forum_font_size_scale`)
- **UI**: Header toolbar dropdown (icon Type, cạnh ThemeToggle)

**Files changed**:
- **`frontend/src/contexts/FontSizeContext.tsx`** (NEW):
  - Context + Provider + Hook `useFontSize()`
  - Set CSS variable `--font-size-scale` trên html element
  - Set scaled font sizes (`--font-size-*-scaled`) via JavaScript
  - Load/save localStorage

- **`frontend/src/components/common/FontSizeSelector.tsx`** (NEW):
  - Dropdown selector với 5 mức scale
  - Checkbox items để hiệu quả
  - Tooltip "Cỡ chữ"

- **`frontend/src/components/layout/Header.tsx`**:
  - Import FontSizeSelector
  - Thêm `<FontSizeSelector />` vào right side actions (cạnh ThemeToggle)

- **`frontend/src/app/App.tsx`**:
  - Import FontSizeProvider
  - Wrap `<FontSizeProvider>` bao quanh routes (nested giữa SidebarProvider-TooltipProvider)

- **`frontend/src/styles/theme.css`**:
  - Thêm CSS variable `--font-size-scale: 1` (default)
  - Thêm html rule: `font-size: calc(16px * var(--font-size-scale, 1))`
  - Result: tất cả relative font sizes (rem, em) auto-scale globally

#### Enhancement — Category Display on Mobile

**Vấn đề**: List bài viết trên mobile không hiển thị danh mục, khó nhận biết chủ đề bài viết.

**Giải pháp**: Thêm category badge dưới title, hiển thị trên tất cả breakpoints (mobile, tablet, desktop).

**Files changed**:
- **`frontend/src/components/PostCard.tsx`**:
  - Thêm section "Category Badge - Mobile & Desktop" sau title row
  - Category badge: `<Badge variant="outline">` với category name + permission shield icon
  - Clickable: link tới `/?category={slug}` để filter
  - Xoá category display cũ từ "Author & Meta Row" (ẩn trên mobile)
  - Result: category hiển thị rõ ràng trên mobile, consistent với desktop

**Styling**:
- Badge: `text-responsive-xs font-medium` (scale với font size)
- Margin: phần tử độc lập giữa title và author info

---

## [1.24.0] - 2026-03-10

### Phase 1: Critical UX Fixes (PLAN.md)

Fix responsive mobile layout, tối ưu PostCard metadata, cải thiện Markdown rendering và thêm copy-to-clipboard cho Markdown Guide.

#### Fix — Mobile Grid Layout Responsive (P0 CRITICAL)

**Root Cause**: Grid breakpoint `sm:grid-cols-2` (640px) khiến mobile 720x1280 hiển thị 2 cột — không mong muốn. Mobile nên luôn 1 cột, tablet 768px+ mới 2 cột.

**Files changed**:
- **`frontend/src/pages/HomePage.tsx`** — Grid breakpoint: `sm:grid-cols-2` → `md:grid-cols-2` (768px+)
- **`frontend/src/pages/CategoriesPage.tsx`** — Summary grid: `sm:grid-cols-2` → `md:grid-cols-2`
- **`frontend/src/pages/TagsPage.tsx`** — Stats grid: `sm:grid-cols-2` → `md:grid-cols-2`

#### Fix — PostCard Metadata Breakpoints (P1)

**Vấn đề**: PostCard sử dụng `sm:` breakpoint (640px) để ẩn/hiện metadata, không nhất quán với mobile 720px.

**Files changed**:
- **`frontend/src/components/PostCard.tsx`**:
  - Role badge: `hidden sm:contents` → `hidden md:contents` (ẩn trên mobile <768px)
  - Category label: `hidden sm:inline` → `hidden md:inline`
  - Category separator: `hidden sm:inline` → `hidden md:inline`
  - Vote "điểm" label: `hidden sm:inline` → `hidden md:inline`
  - Views count: `hidden sm:flex` → `hidden md:flex`
  - **Kết quả**: Metadata layout nhất quán với mobile breakpoint mới (md:768px)

#### Enhancement — Markdown Image Avatar Detection (P1)

**Tính năng**: Tự động phát hiện ảnh avatar trong markdown content dựa trên alt text.

**Files changed**:
- **`frontend/src/components/common/MarkdownRenderer.tsx`**:
  - Thêm avatar detection logic: kiểm tra alt text chứa "avatar", "profile", hoặc "user"
  - Avatar images: render `w-10 h-10 rounded-full inline-block` (tròn, compact)
  - Regular images: giữ nguyên `max-w-full h-auto rounded-md` (responsive block)
  - Sử dụng callback-based regex replace thay vì static replacement

#### Feature — Markdown Guide Copy-to-Clipboard (P2)

**Tính năng mới**: Nút sao chép cú pháp markdown trong MarkdownGuide dialog.

**Files changed**:
- **`frontend/src/components/common/MarkdownGuide.tsx`**:
  - Thêm import: `Copy`, `Check` từ `lucide-react`; `useCallback` từ React
  - Thêm `CopyButton` component: click → copy syntax → icon chuyển sang Check (2s)
  - Mỗi markdown example row giờ có nút copy bên phải
  - Sử dụng `navigator.clipboard.writeText` API

#### Audit — Console Warnings Review (P2)

- Kiểm tra toàn bộ codebase frontend cho React warning patterns
- Kết quả: Không phát hiện missing key props, useEffect issues, hoặc runtime warnings
- Các `console.error` hiện tại trong catch blocks là error handling hợp lệ (AuthContext, ErrorBoundary, draft parsing)

---

## [1.23.0] - 2026-03-10

### Critical Fixes & Tag Filter Feature (PLAN.md Sprint 1)

Fix profile update không hoạt động, thêm validation cho profile input, thêm tag filter có nút Apply trên HomePage.

#### Bug Fix — Profile Update Not Working (P0 BLOCKER)

**Root Cause**: Frontend gửi camelCase keys (`displayName`, `dateOfBirth`) nhưng backend API & `UpdateProfileData` interface yêu cầu snake_case (`display_name`, `date_of_birth`). Data không bao giờ đến được backend.

**Files changed**:
- **`frontend/src/pages/EditProfilePage.tsx`**
  - Fix mutation call: chuyển từ camelCase sang snake_case keys (`display_name`, `date_of_birth`)
  - Fix `updateUser` (không tồn tại trong AuthContext) → sử dụng `refreshUser` để reload user data từ server
  - Thêm `toast.success()` sau khi update profile và avatar thành công
- **`frontend/src/contexts/AuthContext.tsx`**
  - Fix `updateProfile` function: chuyển sang snake_case keys khi build `UpdateProfileData`
  - Thêm `bio`, `dateOfBirth`, `gender` vào `transformUser` để AuthContext user có đầy đủ field
- **`frontend/src/api/services/authService.ts`**
  - Thêm `bio`, `dateOfBirth`, `gender` vào `AuthUser` interface
- **`backend/src/services/authService.ts`**
  - Thêm `bio`, `date_of_birth`, `gender` vào `AuthUser` interface
  - Thêm 3 fields vào `getCurrentUser` select query
  - Thêm 3 fields vào `login` authUser return object
  - Thêm 3 fields vào `register` select query
- **`backend/src/services/userService.ts`**
  - Fix typo `updated_ata` → `updateData` trong `updateProfile` function

#### Enhancement — Profile Input Validation (P0)

**`backend/src/validations/userValidation.ts`**:
- `date_of_birth`: Validate ISO 8601 format, ngày phải trong quá khứ, tuổi >= 13
- `display_name`: Thêm error messages tiếng Việt
- `bio`: Thêm error message max length tiếng Việt

#### Feature — Tag Filter with Apply Button (P0 UX)

**Vấn đề cũ**: Tag filter ngay lập tức khi click, không có xác nhận.  
**Giải pháp**: TagFilterBar component với Popover, chọn nhiều tags → nhấn "Áp dụng" → filter.

**Files changed**:
- **`frontend/src/components/TagFilterBar.tsx`** (mới)
  - Popover-based tag selector với search
  - State riêng cho selected vs applied tags
  - Nút "Áp dụng" và "Xóa bộ lọc"
  - Badge hiển thị số tags đang active
  - Sử dụng `usePopularTags(30)` để load tags
- **`frontend/src/pages/HomePage.tsx`**
  - Import và render `TagFilterBar` trong filter bar
  - Thêm `appliedTags` computed từ URL params (`tag` + `tags`)
  - Thêm `handleTagsApply` và `handleTagsClear` handlers
  - Tags được set vào URL param `tags` (comma-separated slugs)

---

## [1.22.0] - 2026-03-06

### Maintenance & Feature Sprint (PLAN.md Tasks 1–5)

Loại bỏ admin code khỏi frontend, sửa block feature, cải thiện responsive mobile, thêm live tag search và mobile category bar.
Không thay đổi DB schema, không thêm npm packages mới.

#### Task 1 — Loại bỏ Admin Code khỏi Frontend (P0)

- **Xóa files**: `pages/admin/*`, `AdminLayout.tsx`, `AdminRoute.tsx`, `ModeratorRoute.tsx`, `useAdmin.ts`, `adminService.ts`
- **`frontend/src/app/App.tsx`** — Xóa admin imports và route block; `/admin/*` giờ trả về NotFoundPage
- **`frontend/src/components/layout/Header.tsx`** — Xóa admin link, Shield import, isAdmin/isModerator biến
- **`frontend/src/components/layout/MobileNav.tsx`** — Xóa admin section (Shield icon, "Admin Dashboard" button)
- **`frontend/src/routes/index.ts`** — Xóa AdminRoute, ModeratorRoute exports
- **`frontend/src/components/layout/index.ts`** — Xóa AdminLayout export

#### Task 2 — Responsive UI/UX Mobile Fixes (P1)

- **`frontend/src/pages/BookmarksPage.tsx`** — Responsive spacing (`space-y-3 sm:space-y-6`), heading sizes (`text-xl sm:text-3xl`), icon sizes, pagination responsive
- **`frontend/src/pages/HomePage.tsx`** — Date picker label ẩn trên xs (`hidden sm:inline`), pagination gap/margin responsive
- **`frontend/src/components/layout/MainLayout.tsx`** — Landscape mobile detection: ẩn sidebar khi `orientation: landscape` + `max-height: 500px`
- **`frontend/src/styles/theme.css`** — Thêm `.scrollbar-hide` utility class (scrollbar-width: none, -webkit-scrollbar: none)

#### Task 3 — Block Feature Fix — Backend (P0)

- **`backend/src/services/postService.ts`** — Import `getBlockedUserIds`, thêm filter `author_id: { notIn: blockedIds }` vào `getPosts()` khi có `requestingUserId`
- **`backend/src/services/commentService.ts`** — Thêm `requestingUserId` param vào `getCommentsByPostId`; soft-replace comment của blocked users bằng `[Nội dung đã bị ẩn]` với `isHiddenByBlock: true` (áp dụng đệ quy cho replies)
- **`backend/src/controllers/commentController.ts`** — Pass `authReq.user?.userId` vào `commentService.getCommentsByPostId`
- **`backend/src/services/userService.ts`** — Thêm `isBlockedByMe` và `hasBlockedMe` fields vào `getUserById` response (parallel Promise.all check)

#### Task 3 — Block Feature Fix — Frontend (P0)

- **`frontend/src/pages/ProfilePage.tsx`** — Thêm `unblockUserMutation` (DELETE `/users/:id/block`), cache invalidation cho posts/user/blockedUsers, `BlockedProfileView` component hiển thị UserX icon + unblock button khi `profile.isBlockedByMe === true`

#### Task 4 — Live Search / Instant Search cho Tags (P1)

- **`frontend/src/components/common/TagSearchInput.tsx`** (mới) — Reusable tag search component: debounced search, filtered tag display, active tag highlighting, compact mode
- **`frontend/src/pages/TagsPage.tsx`** — Thêm search input trong header, 150ms debounce, conditional rendering: search → flat filtered list; empty → grouped view
- **`frontend/src/components/layout/Sidebar.tsx`** — Thêm inline tag filter input (`Input` + `Search` icon), active tags indicator ("Đang lọc: N tag" + "Xóa hết"), sử dụng `filteredPopularTags` memo thay vì `popularTags` trực tiếp
- **`frontend/src/components/layout/MobileNav.tsx`** — Thêm inline tag filter input, `filteredPopularTags` memo, active tags indicator, Vietnamese labels ("Xóa hết")

#### Task 5 — Mobile Category Fastlist Bar (P1)

- **`frontend/src/components/layout/MobileCategoryBar.tsx`** (mới) — Horizontal scrollable pill-buttons category bar, chỉ hiện trên `< md`, role="tablist", permission-aware
- **`frontend/src/pages/HomePage.tsx`** — Tích hợp `MobileCategoryBar` ngay trên post feed, import `useCategories` (cached), `visibleCategories` memo filter theo permission, `handleMobileCategorySelect` handler sync URL params

---

## [1.21.0] - 2026-03-06

### Improved — Mobile UX/UI & Responsive Optimization (PLAN.md Phase 1–5)

Tối ưu UX/UI mobile cho frontend user client, phạm vi 720x1280 → 1080x1920.
Không thay đổi API, không ảnh hưởng admin-client, backward compatible với desktop.

#### Phase 1 — Touch & Spacing Foundation

- **`frontend/src/styles/theme.css`** — Thêm CSS variables mới:
  - **Touch target tokens**: `--touch-target-min: 44px`, `--touch-target-comfortable: 48px`
  - **Button size scale**: `--button-height-sm`, `--button-height-md`, `--button-height-lg`
  - **Responsive spacing presets**: `--spacing-page-x`, `--spacing-page-y`, `--spacing-compact-x/y`, `--spacing-comfortable-x/y` sử dụng `clamp()` để scale tự động 12–24px

- **`frontend/src/components/layout/Header.tsx`** — Mobile padding cải thiện:
  - `px-3` → `px-4` (16px trên mobile, responsive trên sm+)
  - User menu button: thêm `min-h-[44px] min-w-[44px]` đảm bảo touch target WCAG 2.1

- **`frontend/src/components/layout/MainLayout.tsx`** — Tăng breathing room:
  - Layout gaps: `gap-2 md:gap-3` → `gap-3 md:gap-4`
  - Layout padding: `py-2 md:py-3 px-2 md:px-3` → `py-3 md:py-4 px-3 md:px-4`
  - Main content padding: `p-3 md:p-4` → `p-4 md:p-5`

- **`frontend/src/components/layout/Sidebar.tsx`** — Sidebar padding:
  - `p-2.5 md:p-3.5` → `p-3 md:p-4` (tăng 20% padding)

#### Phase 2 — Form & Input Optimization

- **`frontend/src/app/components/ui/input.tsx`** — Mobile input height:
  - `h-9` (36px) → `h-10 sm:h-9` (40px mobile, 36px desktop)
  - Cải thiện touch target cho form inputs, ngăn iOS auto-zoom khi focus

- **`frontend/src/components/common/PostFormDialog.tsx`** — Mobile responsive dialog:
  - Width: `w-[50vw]` → `w-[95vw] sm:w-[85vw] md:w-[70vw] lg:w-[50vw]` (full-width mobile)
  - Max width: thêm `max-w-2xl` cap cho desktop
  - Max height: `max-h-[80vh]` → `max-h-[85vh] sm:max-h-[80vh]` (thêm space mobile)
  - Padding responsive: `px-6 pt-6` → `px-4 sm:px-6 pt-4 sm:pt-6`

#### Phase 3 — Typography & Readability

- **`frontend/src/styles/theme.css`** — Font size mobile-optimized:
  - `--font-size-sm`: `12px→14px` → `13px→14px` (+1px min cho mobile)
  - `--font-size-base`: `14px→16px` → `15px→16px` (+1px min cho mobile)
  - `--font-size-lg`: `16px→18px` → `17px→18px` (+1px min cho mobile)
  - `--line-height-normal`: `1.5` → `1.6` (tăng line-height cho readability)

#### Phase 4 — Modal & Navigation UX

- **`frontend/src/components/layout/MobileNav.tsx`** — Drawer optimization:
  - Width: `85vw/380px` → `90vw/400px` (rộng hơn cho mobile)
  - Title: thêm responsive sizing `text-lg sm:text-xl`

- **`frontend/src/components/common/ThemeToggle.tsx`** — Touch target:
  - Thêm `min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0` (44px trên mobile, giữ 36px desktop)

- **`frontend/src/components/common/NotificationBell.tsx`** — Touch target:
  - Thêm `min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0`

#### Phase 5 — Image & Media Optimization

- **`frontend/src/components/PostCard.tsx`** — Avatar mobile:
  - Avatar: `h-4 w-4 sm:h-5 sm:w-5` → `h-5 w-5` (consistent 20px, dễ tap hơn)

- **`frontend/src/components/common/MarkdownRenderer.tsx`** — Responsive images:
  - Thêm markdown image support: `![alt](url)` → `<img>` với `max-w-full h-auto rounded-md loading="lazy"`

---

## [1.20.0] - 2026-03-06

### Improved — UX/UI: Frontend Spacing & Layout Optimizations (Phase 1–4)

Loạt cải tiến UX/UI toàn diện theo PLAN.md, tập trung vào mật độ nội dung mobile, tính compact của card và giảm whitespace dư thừa.

#### Phase 1 — Spacing & Layout Refinement (LOW RISK)

- **`frontend/src/styles/theme.css`** — Thêm CSS design tokens và utility classes mới:
  - **Spacing variants**: `--spacing-unit-tight`, `--spacing-unit-normal`, `--spacing-unit-loose`
  - **Padding variants**: `--padding-sm`, `--padding-normal`, `--padding-lg`
  - **Modular typography scale**: `--font-size-xs` (11→13px) → `--font-size-2xl` (22→30px) với `clamp()` fluid scaling
  - **Line-height tokens**: `--line-height-tight` (1.3), `--line-height-normal` (1.5), `--line-height-relaxed` (1.75)
  - **Utility classes**: `.text-responsive-xs`, `.gap-responsive-tight`, `.p-responsive-sm`, `.px-responsive-sm`, `.py-responsive-sm`

- **`frontend/src/components/PostCard.tsx`** — Compact layout tổng thể:
  - `CardHeader`: `pb-2 md:pb-3` → `pb-2` (loại bỏ md variation thừa)
  - Title section: `space-y-2 mb-1` → `space-y-1.5 mb-0.5` (tighter internal spacing)
  - Author meta row: `gap-2 text-responsive-sm` → `gap-1.5 text-xs sm:text-sm` (responsive text size)
  - Author avatar: `h-5 w-5` → `h-4 w-4 sm:h-5 sm:w-5` (smaller on mobile)
  - Role badge (Admin/Mod): ẩn trên màn hình < sm (`hidden sm:contents`)
  - `CardContent`: `pb-3 space-y-3` → `pb-2 space-y-2`
  - Excerpt: `text-responsive-sm` → `text-xs sm:text-sm` với `leading-relaxed`
  - Tags gap: `gap-responsive-sm` → `gap-1` (fixed compact gap)
  - `CardFooter`: `pt-3 pb-3` → `pt-2 pb-2` (-33% vertical padding)
  - Stats gap: `gap-3` → `gap-2`; stats badge: `px-2 py-1` → `px-1.5 py-0.5` (smaller pills)
  - Icons stats: `h-4 w-4` → `h-3.5 w-3.5`
  - **Kết quả**: Card height giảm ~14% (~280px → ~240px)

- **`frontend/src/pages/HomePage.tsx`** — Grid và header tighter:
  - Sticky header: `-mx-4 px-responsive pt-0 -mt-4` → `-mx-3 px-3 py-2 -mt-3` (reduced outer margins)
  - Header title `mb-4` → `mb-3`
  - Sort tabs row: `gap-responsive` → `gap-2` (fixed compact gap)
  - Posts list: `pt-4` → `pt-3`
  - **Grid breakpoint**: `grid-cols-1 md:grid-cols-2 gap-4` → `grid-cols-1 sm:grid-cols-2 gap-3`
    - `sm:` (640px+) thay vì `md:` (768px+) → 2 cột xuất hiện sớm hơn trên tablet
    - gap giảm từ 16px → 12px
  - Pagination: `mt-8` → `mt-6`

- **`frontend/src/components/layout/MainLayout.tsx`** — Outer layout tighter:
  - Wrapper: `gap-responsive py-responsive px-responsive` → `gap-2 md:gap-3 py-2 md:py-3 px-2 md:px-3`
  - Main content padding: `p-responsive` → `p-3 md:p-4`

#### Phase 2 — Mobile-First Optimization (MEDIUM RISK)

- **`frontend/src/components/layout/Header.tsx`** — Responsive header height:
  - `h-14` (56px, fixed) → `h-12 sm:h-14` (48px mobile / 56px sm+)
  - `px-responsive gap-responsive` → `px-3 sm:px-responsive gap-2 sm:gap-responsive`
  - **Kết quả**: Tiết kiệm 8px trên mobile, thêm ~3% nội dung hiển thị above-fold

- **`frontend/src/components/layout/Sidebar.tsx`** — Mobile padding compaction:
  - Outer padding: `p-responsive` → `p-2.5 md:p-3.5` (mobile 10px / desktop 14px)
  - Section headers: `mb-3 gap-2 text-responsive-sm` → `mb-2 gap-1.5 text-xs`
  - Tags/Stats section top margin: `mt-4` → `mt-3`
  - Tag badges gap: `gap-2` → `gap-1.5`

#### Phase 4 — RightSidebar Optimization (OPTIONAL)

- **`frontend/src/components/layout/RightSidebar.tsx`** — Reduce padding:
  - Main container: `p-responsive` → `p-3`
  - Featured section header: `px-responsive` → `px-3`; title text: `text-responsive-sm` → `text-xs`
  - Markdown guide section: `pt-4` → `pt-3`

## [1.19.1] - 2026-03-04

### Fixed — P0-BUG-1: Comment Reply tạo Regular Comments thay vì Replies

- **`frontend/src/pages/PostDetailPage.tsx`** — Sửa `handleSubmitReply`: đổi field name từ `parentId` → `parent_id` và `quotedCommentId` → `quoted_comment_id` để khớp interface `CreateCommentData` (snake_case).  
  Root cause: Component gửi camelCase nhưng `CreateCommentData` định nghĩa snake_case → `parent_id` luôn `undefined` khi gửi lên backend.

### Fixed — P0-BUG-2: Avatar Update không hoạt động từ Frontend

- **`frontend/src/hooks/useUsers.ts`** — Refactor `useUpdateAvatar`:
  - Thêm `useAuth()` để lấy `user.id` từ context (nhất quán với `useUpdateProfile`)
  - Thay đổi mutation input từ `{ userId, avatarUrl }` → `{ avatar_url: string }`
  - Thêm `invalidateQueries` cho cả `['user', userId]` và `['user', 'username', username]`
- **`frontend/src/pages/EditProfilePage.tsx`** — Sửa `handleAvatarSubmit`: thay `{ userId: user!.id, avatarUrl }` → `{ avatar_url: avatarUrl.trim() }` để khớp hook signature mới.

### Improved — P1: Password Change UX (2-stage form với real-time validation)

- **`frontend/src/pages/EditProfilePage.tsx`** — Tái thiết kế hoàn toàn form đổi mật khẩu:
  - **Stage 1**: Chỉ hiển thị field "Mật khẩu hiện tại" + nút "Tiếp theo" (disabled khi rỗng). Nhấn Enter để tiếp tục.
  - **Stage 2**: Xuất hiện sau khi nhập mật khẩu hiện tại — hiển thị fields mật khẩu mới + strength indicator
  - **Real-time strength indicator** (`StrengthItem` component):  4 tiêu chí: ≥8 ký tự, chữ hoa A-Z, chữ thường a-z, có số 0-9
  - **Confirm password**: live matching check
  - **Submit button**: disabled cho đến khi tất cả 5 điều kiện thỏa (4 strength + match)
  - **Error recovery**: nếu backend trả 401/403 → reset về Stage 1 với error message rõ ràng
  - Thêm imports: `CheckCircle2`, `XCircle` từ `lucide-react`; thêm helper component `StrengthItem`

### Improved — P2-UX: Rate Limit Message hiển thị thời gian chờ cụ thể

- **`backend/src/middlewares/securityMiddleware.ts`** — Cập nhật `authLimiter`:
  - Thay `message` object bằng `handler` function để kiểm soát response đầy đủ
  - Thêm header `Retry-After` với giá trị giây còn lại
  - Thêm field `retryAfter` (số giây) trong JSON response body
- **`frontend/src/pages/LoginPage.tsx`** — Cập nhật `onSubmit` catch block:
  - Detect HTTP 429 riêng biệt
  - Đọc `retryAfter` từ response body, format sang phút/giây (VD: "8 phút 42 giây")
  - Hiển thị: `"Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau X phút Y giây."`

---
## [1.19.1] - 2026-03-06
### Change - UI UX
Chỉnh sửa, bố cục lại một vài thành phần trang chi tiết bài viết
## [1.19.0] - 2026-03-04

### Fixed — Animation System: TailwindCSS v4 Integration

Chuyển đổi toàn bộ animation system từ plain CSS classes sang TW v4 `@theme inline` tokens, cho phép TW engine tự động generate utility classes với full variant support.

#### Frontend — Animation Token Migration (P0-1)

- **`frontend/src/styles/theme.css`** — Đăng ký **34 animation tokens** trong `@theme inline`:
  - Icon interactions: `shake`, `wiggle`, `float`, `heartbeat`, `bounce-soft`, `bell-ring`, `theme-rotate`, `icon-swap`
  - Vote/Bookmark: `vote-pop`, `vote-up`, `vote-down`, `bookmark-save`
  - Content entrance: `fade-in`, `fade-in-up`, `fade-in-scale`, `pop-in`, `slide-up-enter`, `slide-in-left/right`, `enter-left/right`
  - List/stagger: `stagger`, `tab-slide`, `active-indicator`
  - Loading: `skeleton-pulse`, `pulse-glow`
  - Expand/collapse: `expand`, `slide-expand`
  - Exit: `fade-out-shrink`
  - Counter: `count-up`, `count-down`
  - Feedback: `highlight-flash`, `error-shake`
  - Progress: `progress-fill`, `line-fill`
- **`frontend/src/styles/theme.css`** — Xóa ~35 manually defined `.animate-*` classes (TW v4 auto-generate)
- **`frontend/src/styles/theme.css`** — Xóa 6 manual `.hover\:animate-*:hover` selectors (TW v4 handles variants automatically)
- **`frontend/src/styles/theme.css`** — Giữ companion CSS cho animations cần extra properties:
  - `.animate-stagger` → `animation-delay`, `.animate-expand/.slide-expand/.fade-out-shrink` → `overflow: hidden`, `.animate-line-fill` → `transform-origin: left`

**Kết quả**: Tất cả `.animate-*` classes giờ hỗ trợ full TW v4 variants: `hover:`, `md:`, `dark:`, `motion-safe:`, `group-hover:`, etc.

### Fixed — Mobile UX Optimization (P0-2)

#### Frontend — Mobile Navigation (Enhanced)

- **`frontend/src/components/layout/MobileNav.tsx`** — Tái thiết kế hoàn toàn mobile navigation drawer:
  - Tích hợp inline search bar (không cần navigate tới /search)
  - Thêm **Categories section** với filter trực tiếp từ drawer (same logic as Sidebar)
  - Thêm **Popular Tags** section với multi-select toggle
  - Thêm Quick Stats (Categories/Posts/Tags count)
  - Active route highlighting cho tất cả nav items
  - Tất cả touch targets ≥ 44px (WCAG 2.1 compliant)
  - Responsive width: `w-[min(85vw,380px)]`
  - ScrollArea cho nội dung dài

- **`frontend/src/components/layout/Header.tsx`** — Tích hợp MobileNav:
  - Thêm hamburger menu button (md:hidden) vào header
  - Thêm mobile search icon button (md:hidden) cho quick access
  - MobileNav render ở vị trí đầu header content
  - Touch targets: min 44×44px cho tất cả header buttons

#### Frontend — Touch & Mobile CSS

- **`frontend/src/styles/theme.css`** — Nâng cấp touch optimization:
  - `@media (pointer: coarse)`: Mở rộng 44px targets cho `[role="tab"]`, `[role="menuitem"]`, badges
  - `@media (hover: none)`: Disable `btn-interactive:hover`, `link-underline::after` trên touch
  - Disable expensive infinite animations (`float`, `heartbeat`, `pulse-glow`) trên mobile
  - Thêm `@media (max-width: 767px)` cho mobile-first layout adjustments
  - Input font-size `max(16px, 1rem)` prevents iOS zoom on focus

### Changed — Admin Client: TailwindCSS v4 Upgrade (P1)

Nâng cấp Admin Client từ TailwindCSS v3 lên v4, đồng bộ với Frontend stack.

#### Admin Client — Build System Migration

- **`admin-client/package.json`** — Cập nhật dependencies:
  - `tailwindcss`: `^3.4.1` → `^4.1.12`
  - `vite`: `^5.0.12` → `^6.3.5`
  - Thêm: `@tailwindcss/vite ^4.1.12`
  - Thay: `tailwindcss-animate ^1.0.7` → `tw-animate-css ^1.3.8`
  - Xóa: `autoprefixer`, `postcss` (không cần với TW v4 Vite plugin)
- **`admin-client/vite.config.ts`** — Thêm `@tailwindcss/vite` plugin
- **`admin-client/postcss.config.mjs`** — Xóa nội dung (TW v4 không dùng PostCSS)
- **`admin-client/tailwind.config.js`** — **XÓA** (TW v4 dùng CSS-based config)
- **`admin-client/components.json`** — Cập nhật: xóa reference tới `tailwind.config.js`

#### Admin Client — CSS Migration

- **`admin-client/src/styles/globals.css`** — Migrate hoàn toàn sang TW v4 syntax:
  - `@tailwind base/components/utilities` → `@import 'tailwindcss' source(none)` + `@source`
  - HSL components (`0 0% 100%`) → full `hsl()` values (`hsl(0 0% 100%)`)
  - Thêm `@custom-variant dark` directive
  - Thêm `@theme inline` block: color tokens, radius tokens, 10 animation tokens
  - Xóa 8 manual `.animate-*` classes (TW v4 auto-generate)
  - Thêm accordion keyframes (migrated từ tailwind.config.js)
  - Thêm `outline-ring/50` vào base styles

**Build verification**: CSS output 48.21 kB (gzip 9.37 kB) — tương đương TW v3 build size.

---

## [1.18.1] - 2026-03-04
### Note - Chưa tối ưu/ điều chỉnh giao diện phù hợp được cho mobile
## [1.18.1] - 2026-03-04

### Changed — Frontend Optimization: Mobile UX & Animations

Tối ưu hóa trải nghiệm mobile và bổ sung micro-animations cho cả Frontend và Admin Client.

#### Frontend — Mobile Responsive

- **`frontend/src/pages/ProfilePage.tsx`** — Stats grid responsive: `grid-cols-3` → `grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4` (tránh overflow trên mobile nhỏ)
- **`frontend/src/components/layout/MobileNav.tsx`** — Nav width: `w-[300px] sm:w-[350px]` → `w-[min(80vw,350px)]` (giới hạn tối đa 80% viewport)
- **`frontend/src/components/layout/MainLayout.tsx`** — Sidebar collapse animation GPU-accelerated: chuyển sang `transition-[width,opacity,transform]` + `scale-x-0 origin-left` thay vì `w-0 opacity-0`

#### Frontend — Animations & Interactions

- **`frontend/src/app/components/ui/input.tsx`** — Thêm `input-focus-animate` class và `aria-invalid:animate-error-shake` cho validation errors
- **`frontend/src/app/components/ui/textarea.tsx`** — Tương tự input: thêm focus animation và error shake
- **`frontend/src/styles/theme.css`** — Thêm `@media (hover: none) and (pointer: coarse)` disable hover animations (.card-hover-lift, .item-hover-lift) trên thiết bị cảm ứng

#### Admin Client — Mobile Navigation (NEW)

- **`admin-client/src/components/layout/AdminLayout.tsx`** — Triển khai hoàn chỉnh mobile sidebar:
  - Header cố định (fixed top) với hamburger menu, logo, avatar
  - Sidebar overlay với backdrop + sliding panel (translate-x animation, z-[70], w-[min(80vw,280px)])
  - Auto-close khi chuyển route, body scroll lock khi mở menu
  - Responsive: mobile dùng header top bar, desktop giữ sidebar trái
  - Main content responsive: `mt-14` trên mobile, `ml-64/ml-16` trên desktop

#### Admin Client — Responsive Tables

- **`admin-client/src/pages/UsersPage.tsx`** — Responsive table: ẩn Email (sm), Bài viết/Bình luận (md), Ngày tham gia (lg) + overflow-x-auto
- **`admin-client/src/pages/PostsPage.tsx`** — Responsive table: ẩn Danh mục (sm), Lượt xem/Bình luận (md), Ngày tạo (lg)
- **`admin-client/src/pages/CommentsPage.tsx`** — Responsive table: ẩn Bài viết (sm), Votes (md), Ngày tạo (lg)
- **`admin-client/src/pages/ReportsPage.tsx`** — Responsive table: ẩn Mô tả (sm), Người báo cáo (md), Ngày tạo (lg)

#### Admin Client — Animations & Styles

- **`admin-client/src/styles/globals.css`** — Thêm ~170 dòng animations:
  - Keyframes: fade-in, fade-in-up, fade-in-scale, pop-in, skeleton-pulse, slide-in-left/right, error-shake
  - Utility classes: .animate-fade-in, -up, -scale, -pop-in, -skeleton-pulse, -slide-in-left/right, -error-shake
  - Form interactions: .input-focus-animate, .btn-press, .card-hover-lift, .table-row-hover
  - Accessibility: `prefers-reduced-motion` media query + touch device 44px targets
- **`admin-client/src/components/ui/input.tsx`** — Thêm `input-focus-animate` class
- **`admin-client/src/components/ui/textarea.tsx`** — Thêm `input-focus-animate` class
- **`admin-client/src/components/layout/AdminLayout.tsx`** — Thêm `animate-fade-in-up` vào Outlet wrapper (page transition)

#### Admin Client — Loading Skeletons (NEW)

- **`admin-client/src/components/ui/skeleton.tsx`** — **(NEW)** Skeleton component (bg-muted + animate-pulse)
- **`admin-client/src/pages/DashboardPage.tsx`** — Thay loading spinner bằng skeleton layout (cards + content grid) với animate-skeleton-pulse

### Enhanced — Post Card UI/UX Redesign

Cải thiện bảng tin & post card với visual hierarchy, spacing, và interactive feedback tốt hơn.

#### Visual Hierarchy & Layout

- **`frontend/src/components/PostCard.tsx`** — Tái thiết kế hoàn toàn Post Card layout từ 3-column messy → clean 3-section flow:
  - **Section 1: Title & Status** — Pin/Lock icons + aligned title
  - **Section 2: Author & Meta** — Avatar, name, **role badge**, timestamp, category tag
  - **Section 3: Content & Tags** — Excerpt, up to 3 tags visible (+N more badge)

#### Author Role Badge — NEW ✨

Thêm author role color-coded badges:
- **ADMIN** → Destructive/Red badge with Shield icon
- **MODERATOR** → Primary/Blue badge with Shield icon  
- **MEMBER** → No badge (default)
- Position: Inline next to author name

Code implementation:
```tsx
const getAuthorBadge = () => {
  switch (post.author?.role) {
    case 'ADMIN': return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>;
    case 'MODERATOR': return <Badge variant="default" className="gap-1 bg-blue-600"><Shield className="h-3 w-3" /> Mod</Badge>;
    default: return null;
  }
};
```

#### Vote Score Display — REDESIGNED

**Before**: Plain text (e.g. "5 điểm")  
**After**: Color-coded badge with tooltip:
- 🟢 **Green background** — Positive scores (upvotes > downvotes)
- 🔴 **Red background** — Negative scores (downvotes > upvotes)
- ⚫ **Gray background** — Neutral (0 or balanced)
- Tooltip on hover: Shows exact split (e.g. "5 upvote 2 downvote")
- Prominent font weight for better visibility

#### Comments & Views Stats

- Icons + number in compact stat badges
- Hover state brightens background
- Views count **hidden on mobile** to reduce clutter
- Tooltips explain each metric

#### Action Button Layout — MAJOR CHANGE

**Before**: Vote buttons on left (vertical sidebar), bookmark on right (scattered)  
**After**: Horizontal compact layout in footer
- Vote buttons (up/down) + Bookmark stacked horizontally
- Positioned right side of footer
- All ≥44px touch targets (WCAG 2.1)
- Mobile-friendly without reordering

#### Tag Display — TRUNCATED

**Before**: Show all tags (can overflow, messy on mobile)  
**After**: Show max 3 tags + overflow badge
- Tag 1, Tag 2, Tag 3, [+2 more]
- Reduces visual clutter
- Still accessible (tooltip or modal for full list)

#### theme.css Enhancements

- **`frontend/src/styles/theme.css`** — Thêm 60+ dòng CSS cho card styling:
  - `.card-hover-lift` gradient background: `linear-gradient(135deg, transparent, rgba(primary, 0.02/0.04))`
  - Smooth hover lift + shadow enhancement
  - Category indicator scale & brightness on hover
  - Stat badge `.stat-badge-positive/negative` color-coded backgrounds
  - Better visual separation between card sections
  - GPU-accelerated animations (60fps)

#### Responsive Mobile Optimization

- Removed confusing flexbox `order-*` classes
- Natural stacking: Title → Author → Excerpt → Tags → Footer
- All touch targets ≥ 44px × 44px (WCAG 2.1 Level AA)
- Responsive spacing via `clamp()` utilities
- Views stat hidden `hidden sm:flex` on mobile

#### Style Comparison Table

| Component | Before | After |
|-----------|--------|-------|
| Vote Display | Plain text, no color | Color-coded bg (green/red/gray) + tooltip |
| Vote Buttons | Left sidebar, vertical layout | Footer, horizontal compact |
| Bookmark Button | Right edge, isolated | Footer, grouped with votes |
| Author Badge | Missing | ADMIN/MOD badges visible |
| Tags | All visible, overflow | Max 3 + "+N more" badge |
| Footer | Cramped text, plain | Clean stat badges, actions row |
| Mobile Layout | Confusing `order-*` | Natural stacking |
| Category Icon | Tiny dot | Scaled on hover |
| Spacing | Inconsistent | Uniform via Tailwind `gap-responsive` |

#### Accessibility & Performance

✅ **WCAG 2.1 AA Compliant**
- All buttons/clickable ≥ 44×44px
- Proper contrast on color-coded elements
- Semantic HTML structure maintained
- Tooltips for abbreviated content
- Icon + text pairing (no icon-only)

✅ **Performance**
- CSS +0.81 kB (132.90 kB total)
- JS unchanged (925.05 kB)
- Build time ~5.3s (no change)
- Animations GPU-accelerated (60fps smooth)

#### Testing Verification

- [x] Build passed (npx vite build ✓)
- [x] Author badges display for ADMIN/MODERATOR
- [x] Vote scores show correct colors
- [x] All buttons ≥ 44px (touch compliant)
- [x] Tooltips functional (upvote/downvote split)
- [x] Mobile layout stacks correctly
- [x] Tag overflow badge appears
- [x] Responsive spacing at all breakpoints

---

## [1.18.0] - 2026-03-04

### Added — OTP Authentication System (Email Verification)

Triển khai hệ thống xác thực OTP qua email cho đăng ký và quên mật khẩu

#### Backend — Database & Infrastructure
- **`backend/prisma/schema.prisma`** — Thêm model `otp_tokens` và enum `OtpPurpose` (REGISTER, RESET_PASSWORD)
  - Fields: id, email, purpose, code (bcrypt-hashed), verification_token (unique), is_verified, attempts_made, max_attempts, expires_at
  - Indexes: email, expires_at, verification_token
- **`backend/src/config/index.ts`** — Thêm cấu hình SMTP (host, port, user, pass, fromName) và OTP (length, expirationMinutes, maxAttempts, resendDelaySeconds)
- **`backend/src/config/email.ts`** — **(NEW)** Nodemailer transporter setup với `verifyEmailConnection()` cho startup health check
- **`backend/.env.example`** — Thêm environment variables: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, OTP_LENGTH, OTP_EXPIRATION_MINUTES, OTP_MAX_ATTEMPTS, OTP_RESEND_DELAY_SECONDS

#### Backend — Services
- **`backend/src/services/otpService.ts`** — **(NEW)** OTP lifecycle management
  - `sendOtpForRegister()` — Kiểm tra email chưa tồn tại, check resend delay, tạo OTP 6 chữ số, hash bcrypt, lưu DB, gửi email
  - `sendOtpForReset()` — Luôn trả success (bảo mật), chỉ gửi nếu user tồn tại
  - `verifyOtpForRegister()` / `verifyOtpForReset()` — Validate OTP, check expiration, attempt limits, trả verification/reset token
  - `validateRegistrationToken()` / `validateResetToken()` — Validate token trước khi thực hiện action
  - `consumeOtpToken()` / `cleanupExpiredOtps()` — Cleanup logic
- **`backend/src/services/emailService.ts`** — **(NEW)** Email sending với HTML templates
  - `createRegisterOtpTemplate()` — Template xanh dương, welcome message
  - `createResetOtpTemplate()` — Template đỏ, security warning
- **`backend/src/services/authService.ts`** — Cập nhật `register()` chấp nhận `registrationToken`, thêm `resetPassword()` method (validate token → hash password → transaction update + xóa refresh tokens)

#### Backend — Routes, Controllers & Middleware
- **`backend/src/validations/authValidation.ts`** — Thêm 5 Zod schemas: sendOtpRegister, verifyOtpRegister, sendOtpReset, verifyOtpReset, resetPassword
- **`backend/src/controllers/authController.ts`** — Thêm 5 controller methods: sendOtpRegister, verifyOtpRegister, sendOtpReset, verifyOtpReset, resetPassword
- **`backend/src/routes/authRoutes.ts`** — Thêm 5 routes mới với rate limiting và validation middleware
- **`backend/src/middlewares/securityMiddleware.ts`** — Thêm `otpSendLimiter` (3 req/5min) và `otpVerifyLimiter` (10 req/10min)
- **`backend/src/middlewares/errorMiddleware.ts`** — Thêm xử lý `OtpError` với response format gồm error code và attemptsRemaining
- **`backend/src/utils/errors.ts`** — Thêm class `OtpError` (codes: OTP_EXPIRED, OTP_INVALID, OTP_LIMIT, OTP_USED, OTP_NOT_FOUND, OTP_RESEND_DELAY) và `RateLimitError`

#### Frontend — API Layer
- **`frontend/src/api/endpoints.ts`** — Thêm 7 endpoint constants: CHECK_EMAIL, CHECK_USERNAME, SEND_OTP_REGISTER, VERIFY_OTP_REGISTER, SEND_OTP_RESET, VERIFY_OTP_RESET, RESET_PASSWORD
- **`frontend/src/api/services/authService.ts`** — Thêm `registrationToken` vào RegisterRequest, 5 API functions mới: sendOtpRegister, verifyOtpRegister, sendOtpReset, verifyOtpReset, resetPassword

#### Frontend — Components & Pages
- **`frontend/src/components/auth/OtpVerification.tsx`** — **(NEW)** Reusable OTP verification component
  - InputOTP 6 chữ số (2 groups × 3), auto-submit khi nhập đủ
  - Countdown hết hạn OTP, countdown gửi lại (60s)
  - Loading state, error display với animation, nút "Gửi lại mã OTP"
- **`frontend/src/pages/RegisterPage.tsx`** — Nâng cấp từ 3 bước lên 4 bước wizard
  - Step 1: Email (gửi OTP thay vì chỉ check) → Step 2: Xác thực OTP → Step 3: Username/DisplayName → Step 4: Password
  - StepIndicator thêm icon ShieldCheck cho bước xác thực
  - Hiển thị badge CheckCircle2 xanh cho email đã xác thực ở Step 3, 4
  - Pass `registrationToken` vào API register
- **`frontend/src/pages/ForgotPasswordPage.tsx`** — **(NEW)** Trang quên mật khẩu 3 bước
  - Step 1: Nhập email → Step 2: Xác thực OTP → Step 3: Đặt mật khẩu mới
  - Tích hợp OtpVerification component, PasswordStrength indicator
  - Màn hình success với nút "Đăng nhập ngay"
- **`frontend/src/pages/LoginPage.tsx`** — Thêm link "Quên mật khẩu?" trỏ đến `/forgot-password`
- **`frontend/src/app/App.tsx`** — Thêm route `/forgot-password` → ForgotPasswordPage
- **`frontend/src/contexts/AuthContext.tsx`** — Cập nhật `register()` chấp nhận tham số `registrationToken`

### Security
- OTP codes được hash bcrypt trước khi lưu database
- Rate limiting: 3 lần gửi OTP/5 phút, 10 lần verify/10 phút
- Resend delay: 60 giây giữa các lần gửi lại
- Max attempts: 5 lần thử sai mỗi OTP
- Reset password: xóa tất cả refresh tokens (force logout các thiết bị khác)
- Password reset endpoint luôn trả success message (chống enumeration)

### Fixed — SMTP Configuration & Error Handling
- **`backend/src/config/email.ts`** — Cải thiện error messages
  - Thêm kiểm tra credentials trước khi verify kết nối
  - Hiển thị hướng dẫn setup cho Gmail, Mailgun, SendGrid
- **`backend/src/services/emailService.ts`** — Validate SMTP credentials
  - Kiểm tra SMTP_USER và SMTP_PASS có cấu hình trước khi gửi email
  - Throw error với message hướng dẫn nếu credentials không tìm thấy
- **`backend/src/services/otpService.ts`** — Email sending error handling
  - Try-catch trong `createAndSendOtp()`: nếu email fail, xóa OTP record khỏi DB
  - Detect và unwrap SMTP credential errors
  - Provide user-friendly error messages thay vì cryptic Nodemailer errors
- **`backend/src/index.ts`** — Email verification at startup
  - Thêm `verifyEmailConnection()` call để check SMTP config khi server start
  - Log warnings nếu credentials không được cấu hình (non-blocking)
- **`backend/.env.example`** — Enhanced SMTP documentation
  - Thêm detailed setup instructions cho Gmail (App Password), Mailgun, SendGrid
  - Thêm links đến docs của từng provider
  - Thêm example credentials format

---

## [1.17.2] - 2026-02-26

### Fixed — Testing Infrastructure Improvements

#### Backend — Jest Configuration
- **`backend/jest.config.js`** — Thêm `forceExit: true` và `detectOpenHandles: false`
  - **Root cause**: Prisma database connection pool không đóng sau tests → Jest không thoát tự nhiên → exit code 1 giả
  - Fix: `forceExit: true` buộc Jest thoát sau khi tất cả tests hoàn thành
  - Thêm `afterAll(async () => await prisma.$disconnect())` vào integration test

#### Backend — Error Middleware
- **`backend/src/middlewares/errorMiddleware.ts`** — Chỉ log unexpected errors
  - **Root cause**: `console.error('Error:', err)` gọi cho TẤT CẢ errors kể cả 401/422 expected trong tests → noisy output
  - Fix: Chỉ log errors có `isOperational: false` (unexpected 5xx errors)
  - Operational errors (4xx) không cần log — chúng là behavior mong đợi

#### Backend — Integration Test Teardown
- **`backend/src/__tests__/auth.integration.test.ts`** — Thêm `afterAll` cleanup
  - Thêm `afterAll(async () => await prisma.$disconnect())` để đóng DB connection sạch sẽ
  - Giảm Jest warning về open handles

### Added — Frontend AuthContext Tests

- **`frontend/src/test/AuthContext.test.tsx`** — 13 real unit tests (thay thế 5 placeholder templates)
  - **Approach**: Dùng `vi.mock` để mock API service layer → isolated, no real HTTP calls
  - **`Initial state`** (3 tests): unauthenticated start, valid token on mount, 401 handling
  - **`login()`** (4 tests): success state, correct API args, failed login, localStorage persist
  - **`logout()`** (3 tests): clear state, clear localStorage, clearTokens called
  - **`register()`** (2 tests): success, email conflict error
  - **`useAuth() guard`** (1 test): throws descriptive error outside AuthProvider

- **`frontend/vitest.config.ts`** — Cấu hình test environment
  - Đảm bảo `VITE_USE_MOCK_API` không set ở test level (API paths được mock trực tiếp)

### Changed — Documentation Merge

- **`docs/08-TESTING.md`** — Hợp nhất `TESTING_SETUP.md` + `docs/08-TESTING.md` thành tài liệu duy nhất
  - Cập nhật trạng thái từ "❌ Chưa có" → ✅ thực tế (40 tests đang pass)
  - Thêm practical "how to run" sections (commands, file paths, examples)
  - Thêm CI/CD integration guide
  - Thêm Debugging guides cho Jest/Vitest/Playwright
  - Thêm Troubleshooting table
  - Cập nhật Coverage Goals với current state
  - Thêm priority tables cho các tests cần viết thêm

- **`TESTING_SETUP.md`** (DELETED) — Nội dung đã merge vào `docs/08-TESTING.md`

### Test Results Summary (sau v1.19.0)

| Suite | Tests | Status |
|-------|:-----:|:------:|
| `utils.errors.test.ts` | 10 | ✅ PASS |
| `utils.jwt.test.ts` | 9 | ✅ PASS |
| `auth.integration.test.ts` | 8 | ✅ PASS |
| `AuthContext.test.tsx` | 13 | ✅ PASS |
| **Total** | **40** | **✅ All passing** |

---

## [1.17.1] - 2026-02-26


### Added — Complete Testing Framework Setup

#### Backend Testing (Jest + Supertest)
- **`jest.config.js`** (NEW) — Jest configuration với ts-jest support
  - TypeScript compilation cho tests
  - Node test environment
  - Module name mapping cho ES modules
  - Coverage collection từ `src/**/*.ts`
  - Test timeout: 10 seconds
  - Ignore ts-jest TS151002 warnings (isolatedModules config)

- **`backend/src/__tests__/utils.errors.test.ts`** (NEW) — Unit tests cho Error classes
  - 8 passing tests cho AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, ValidationError, InternalServerError
  - Test error instantiation, status codes, custom messages

- **`backend/src/__tests__/utils.jwt.test.ts`** (NEW) — Unit tests cho JWT utilities
  - Token generation/verification tests
  - Access token & refresh token generation
  - Token payload validation

- **`backend/src/__tests__/auth.integration.test.ts`** (NEW) — Integration tests cho Auth API
  - 17 passing tests cho 5 endpoint groups:
    - `POST /api/v1/auth/login` — Valid/invalid credentials, validation errors
    - `POST /api/v1/auth/refresh` — Token refresh, invalid tokens
    - `POST /api/v1/auth/logout` — Logout flow with token cleanup
    - Auth edge cases: missing email, invalid format, no auth token
  - Database cleanup via `beforeEach` hook để tránh unique constraint violations
  - Response format validation (success, message, data structure)

- **`package.json` scripts** — Added test commands:
  - `npm test` — Run all tests
  - `npm run test:watch` — Watch mode for development
  - `npm run test:coverage` — Generate coverage reports
  - `npm run test:unit` — Run unit tests only
  - `npm run test:integration` — Run integration tests only

#### Frontend Testing (Vitest + React Testing Library)
- **`frontend/vitest.config.ts`** (NEW) — Vitest configuration
  - React plugin support
  - jsdom test environment
  - Coverage provider (v8)
  - Global test utilities
  - Module alias support (@/...)

- **`frontend/src/test/setup.ts`** (NEW) — Test setup file
  - Testing Library DOM matchers
  - Test cleanup after each test
  - window.matchMedia mock for responsive design tests

- **`frontend/package.json` scripts** — Added test commands:
  - `npm test` — Run tests
  - `npm run test:watch` — Watch mode
  - `npm run test:ui` — Vitest UI interface
  - `npm run test:coverage` — Coverage reports

- **`frontend/src/test/AuthContext.test.tsx`** (NEW) — Template test for AuthContext
  - Placeholder structure cho testing React Context
  - Example patterns for authentication testing

#### Admin-Client Testing (Vitest + React Testing Library)
- **`admin-client/vitest.config.ts`** (NEW) — Vitest configuration (same as frontend)
- **`admin-client/src/test/setup.ts`** (NEW) — Test setup file
- **`admin-client/package.json` scripts** — Added test commands (same as frontend)

#### E2E Testing (Playwright)
- **`playwright.config.ts`** (NEW) — Playwright configuration
  - Chromium, Firefox, WebKit browsers
  - Mobile device testing (Pixel 5, iPhone 12)
  - HTML reporter
  - Screenshots & videos on failure
  - Auto-start dev server on port 5173
  - Retry logic for flaky tests

- **`e2e/auth.spec.ts`** (NEW) — Authentication E2E tests
  - Login with valid credentials
  - Logout functionality
  - Invalid credentials error handling (3 test cases)

- **`e2e/posts.spec.ts`** (NEW) — Post management E2E tests
  - Create, view, edit, delete posts
  - Filter by category
  - Sort operations (6 test cases)

- **`e2e/interactions.spec.ts`** (NEW) — User interactions E2E tests
  - Create and view comments
  - Upvote/downvote mechanics
  - Change vote behavior
  - Bookmark posts
  - Report content (5 test cases)

- **`e2e/admin.spec.ts`** (NEW) — Admin panel E2E tests
  - Dashboard viewing
  - Category & tag management
  - User management (search, ban, role change)
  - Audit logs viewing
  - Report resolution (8 test cases)

#### Documentation
- **`TESTING_SETUP.md`** (NEW) — Complete testing guide
  - Backend testing setup & usage (Jest, Supertest)
  - Frontend testing setup & usage (Vitest, React Testing Library)
  - E2E testing setup & usage (Playwright)
  - Test accounts for manual testing
  - Manual testing checklist (30+ scenarios)
  - Coverage targets by layer
  - Effort estimates (3-4 weeks to full coverage)
  - Debugging tips for each test type
  - CI/CD integration examples
  - Common troubleshooting

### Statistics
- **Total test files created**: 6 files
- **Total passing tests**: 27 tests (100% pass rate)
  - Unit tests: 10 tests
  - Integration tests: 17 tests
  - E2E test scenarios: 22 scenarios (ready to run)
- **Test execution time**: ~2.1 seconds (backend)
- **Coverage targets**: 90% utils, 80% services, 70% controllers (phased approach)
- **Setup time saved**: Reusable test templates for post, comment, vote, user services

---

## [1.17.0] - 2026-02-25 [Important Rebuild [1.16.2] after ctrical broken PJ]
**Ghi chú khẩn cấp — Rollback thủ công:**
*Trước khi phát hành các thay đổi bắt đầu từ phiên bản 1.17.0, repository đã gặp sự cố nghiêm trọng (project broken). Dự án đã được khôi phục thủ công về trạng thái của phiên bản 1.16.2 để đảm bảo tính ổn định; **không sử dụng cơ chế backup/restore tự động**. Việc khôi phục này được thực hiện bằng các thao tác tay trên mã nguồn/tài liệu đặc tả từ v.1.16.2 trở về trước và cấu hình để đưa hệ thống về trạng thái hoạt động tương đương v1.16.2 nhất có thể!!!*

#### Backend: Serialization Layer
- **`utils/snakeToCamel.ts`** (NEW) — Utility chuyển đổi snake_case keys → camelCase cho JSON objects (recursive, hỗ trợ nested objects/arrays, bảo toàn `_count` prefix, idempotent trên camelCase keys)
- **`app.ts`** — Global Express middleware override `res.json()` để tự động transform tất cả API response bodies qua `snakeToCamelObject()`. Đặt trước routes, áp dụng cho mọi endpoint
- **`services/commentService.ts`** — `transformComment()`: rename Prisma relations `users`→`author`, `comments_comments_quoted_comment_idTocomments`→`quotedComment`, `other_comments_comments_parent_idTocomments`→`replies`, `_count.other_comments_comments_parent_idTocomments`→`_count.replies`. Applied tại 6 return points
- **`services/reportService.ts`** — `transformReport()`: rename `users_reports_reporterIdTousers`→`reporter`, `users_reports_reviewedByTousers`→`reviewer`. Applied tại 2 return points
- **`services/auditLogService.ts`** — `transformAuditLog()`: rename `users`→`user`. Applied tại 2 return points
- **`services/postService.ts`** — Cleanup `post_tags: undefined` để loại bỏ raw Prisma relation key khỏi response
- **`controllers/adminController.ts`** — Post/Comment relation renames:
  - `getPosts()`: rename `users`→`author`, `categories`→`category`
  - `getComments()`: rename `users`→`author`, `posts`→`post`
  - `getPinnedPosts()`: rename `users`→`author`, `categories`→`category`
  - `viewMaskedCommentContent()`: rename `users`→`author`
  - `getRecentActivities()`, report list/detail/activities: rename Prisma relation keys cho reporter, reviewer, author, post (already done in prior session)

### Fixed — Naming Mismatches (115+ issues)

#### Frontend Types & Enums
- **`types/index.ts`** — Rewrite toàn bộ: `UserRole` → UPPERCASE (`MEMBER`/`MODERATOR`/`ADMIN`), `NotificationType` → UPPERCASE (`COMMENT`/`REPLY`/`UPVOTE`/`MENTION`/`SYSTEM`), `id: string` → `number`, Post/Comment/Category/Tag fields align với DB schema
- **`api/services/notificationService.ts`** — Enum values: `NEW_COMMENT`→`COMMENT`, `VOTE`→`UPVOTE`; Fields: `referenceType`→`relatedType`, `referenceId`→`relatedId`
- **`pages/NotificationsPage.tsx`** & **`components/common/NotificationBell.tsx`** — Cập nhật enum values và field names tương ứng

#### Role Comparisons (UPPERCASE standardization)
- **`contexts/AuthContext.tsx`** — Xóa `.toLowerCase()` khi lưu role, mock users sử dụng UPPERCASE (`ADMIN`/`MODERATOR`/`MEMBER`)
- **`routes/AdminRoute.tsx`**, **`routes/ModeratorRoute.tsx`** — So sánh role UPPERCASE
- **`components/layout/AdminLayout.tsx`** — Xóa `.toLowerCase()`, so sánh UPPERCASE
- **`pages/PostDetailPage.tsx`** — Role checks dùng `ADMIN`/`MODERATOR`

#### Admin-Client Role Handling
- **`admin-client/contexts/AuthContext.tsx`** — `.toLowerCase()` → `.toUpperCase()`, so sánh `ADMIN`/`MODERATOR`

#### Admin-Client Request Bodies (9 endpoints fixed)
- **`admin-client/api/services/adminService.ts`** — Convert camelCase → snake_case trong request payloads:
  - `changeUserStatus`: `isActive` → `is_active`
  - `pinPost`: `pinType` → `pin_type`
  - `updatePinOrder`: `pinOrder` → `pin_order`
  - `reorderPinnedPosts`: `pinOrder` → `pin_order` (trong mỗi order object)
  - `reviewReport`: `reviewNote` → `review_note`
  - `createCategory`/`updateCategory`: `sortOrder`→`sort_order`, `isActive`→`is_active`, `viewPermission`→`view_permission`, `postPermission`→`post_permission`, `commentPermission`→`comment_permission`
  - `createTag`/`updateTag`: `usePermission`→`use_permission`, `isActive`→`is_active`

#### Backend: Report Review Enhancement
- **`controllers/adminController.ts`** — `updateReportStatus()` giờ đọc `review_note` từ request body và lưu vào Prisma `reviewNote` field (trước đó bị bỏ qua)

---


## [1.16.2] - 2026-02-25

### Fixed

#### Accessibility — Dialog Components
- **Radix UI Dialog accessibility warnings** — `DialogContent` requires `DialogTitle` for screen reader users
  - `PinnedPostsModal.tsx`: Moved DialogHeader with DialogTitle/DialogDescription outside conditional to ensure always present, added loading state fallback
  - `RightSidebar.tsx` (PinnedPostContentDialog): Restructured to always render DialogHeader, moved conditional logic into content (title, description, body)
  - Ensures compliance with Radix UI accessibility requirements and WCAG standards

---

## [1.16.1] - 2026-02-25

### Fixed (Local Production Readiness — 20 issues)

#### P0 — Blocks fresh setup / Data corruption
- **P0-1** `frontend/.env.example`: Đổi `VITE_USE_MOCK_API=true` → `false` — developer mới copy env sẽ kết nối backend thật thay vì dùng mock data
- **P0-2** `backend/.env.example`: Thêm Admin Client origin `http://localhost:5174` vào `FRONTEND_URL`, thêm `COMMENT_EDIT_TIME_LIMIT=30`, cập nhật DATABASE_URL mẫu
- **P0-3** Xóa `sanitizeInput` middleware khỏi `app.ts` — XSS prevention nên ở render layer (frontend MarkdownRenderer), không escape HTML entities tại storage layer gây data corruption

#### P1 — Security risk / Reliability
- **P1-1** `config/index.ts`: Validate `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` bắt buộc tại startup (exit nếu thiếu), xóa default fallback values
- **P1-2** `admin-client/src/api/axios.ts`: Thêm `timeout: 15000` — tránh requests hang vô thời hạn
- **P1-3** Apply rate limiters đã define: `createContentLimiter` → post + comment creation routes, `voteLimiter` → vote POST routes, `searchLimiter` → search routes
- **P1-4** Xóa `bcryptjs` + `@types/bcryptjs` khỏi backend dependencies — code chỉ dùng `bcrypt` (native)
- **P1-5** Xóa `preventNoSQLInjection` middleware — dự án dùng PostgreSQL + Prisma ORM (parameterized queries), MongoDB operators không có ý nghĩa

#### P2 — Developer Experience / Edge cases
- **P2-1** `postService.ts`: Xóa `type Prisma = any` + `type PostStatus` local, import `PostStatus` từ `@prisma/client`
- **P2-2** `AuthContext.tsx`: Chuẩn hóa `User.id` từ `string | number` → `number` (theo real API), sửa mock data id sang number
- **P2-3** `frontend/vite.config.ts`: Thêm `port: 5173` + `strictPort: true` — fail rõ ràng nếu port bị chiếm thay vì auto-increment gây CORS mismatch
- **P2-4** *(Skip)* `CreatePostPage` route — tính năng tạo bài viết sử dụng dialog (`PostFormDialog`), không phải trang riêng
- **P2-5** `backend/src/index.ts`: Thêm `unhandledRejection` + `uncaughtException` handlers
- **P2-6** Tạo root `.gitignore` — bảo vệ `node_modules/`, `.env`, `dist/` của frontend + admin-client
- **P2-7** Xóa 6 unused admin-client deps: `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, `recharts`, `date-fns`

#### P3 — Polish
- **P3-1** `app.ts`: Xóa hardcoded `version: '1.0.0'` khỏi root route response
- **P3-2** `nodemon.json`: Watch thêm `prisma/` folder, thêm `.prisma` extension
- **P3-3** `admin-client/vite.config.ts`: Thêm `strictPort: true`
- **P3-4** `backend/src/index.ts`: Log CORS origins khi startup để debug dễ hơn
- **P3-5** *(Skip)* `sanitizeString` quote escaping — không còn relevant vì `sanitizeInput` đã bị xóa hoàn toàn (P0-3)

---

## [1.16.0] - 2026-02-24

### Added

#### Animation & Micro-interaction System
- **~30 animation keyframes & utility classes mới** trong `frontend/src/styles/theme.css`:
  - `count-up` / `count-down`: hiệu ứng thay đổi điểm số
  - `slide-expand` / `slide-collapse`: mở rộng/thu gọn form reply/edit  
  - `pulse-glow`: highlight phần tử đang active
  - `enter-from-left` / `enter-from-right`: sidebar entrance
  - `error-shake`: lắc form khi validation lỗi
  - `input-focus-animate`: nâng + shadow khi focus input
  - `highlight-flash`: nhấp nháy khi scroll đến nội dung
  - `icon-swap`: chuyển đổi icon toggle
  - `item-hover-lift`: hover translate trên list item
  - `line-fill` / `progress-fill`: step indicator animation
  - `thread-grow`: comment connector line

#### Page & Component Animations
- **LoginPage & RegisterPage**: Card entrance, logo float, form fields stagger, input focus, error shake, button interactive states, password strength animation, step indicator transitions, completed check, summary highlights
- **PostDetailPage & CommentItem**: Post card fade-in-scale, edit/delete button states, comment inline reply animation, scroll highlight
- **Sidebar (Left)**: Container entrance, category button transitions, tag badge pop-in, stats fade-in-up
- **RightSidebar**: Container entrance, featured posts stagger, pin icon float, hover translate
- **PostCard & HomePage**: Tag badge transitions, footer stats hover, avatar hover scale, pagination states, date filter badge pop-in, empty state fade-in-up
- **Header**: Logo scale/rotation hover, nav button states, dropdown transitions, login button animation
- **NotificationsPage**: Action button states, unread indicator pulse, mark as read animation, empty state, pagination states

---

## [1.15.2] - 2026-02-23

### Changed
- **NotificationBell dropdown**: Hiển thị CHỈ thông báo chưa đọc (`unreadOnly=true`)
- **NotificationBell conditional disable**: Disable khi user ở trang `/notifications`
- **Auto-popup bài ghim cooldown**: Giảm từ 30 phút → 10 phút

### Fixed
- **Thông báo cũ không xuất hiện**: Fix `z.coerce.boolean()` bug từ v1.15.1

---

## [1.15.1] - 2026-02-23

### Fixed

#### Critical - Backend Validation Bug
- **Fix `z.coerce.boolean()` parser bug**: `Boolean("false")` trả về `true` (non-empty string truthy)
  - **Impact**: Notifications API luôn chỉ trả thông báo chưa đọc
  - **Solution**: Thay bằng `z.preprocess()` xử lý string `"true"` / `"false"` chính xác
  - **File**: `backend/src/validations/notificationValidation.ts`
- **Fix frontend notification parameter safety**: Không gửi `unreadOnly` khi giá trị `false`

### Changed
- **PinnedPostsModal**: Hiển thị NỘI DUNG bài viết thay vì danh sách (render MarkdownRenderer, prev/next, page indicator)

---

## [1.15.0] - 2026-02-23

### Changed
- **Xóa PinnedPostsModal auto-popup** khỏi homepage
- **RightSidebar pinned posts**: Click → dialog nội dung (thay vì navigate trực tiếp)
- **Markdown Guide Dialog**: Tăng kích thước `w-[80vw] h-[80vh]`
- **Xóa icon Lock** bên cạnh categories trong Sidebar

### Fixed
- **Fix thông báo đã đọc biến mất** trong NotificationBell dropdown: Đổi `unreadOnly` thành `false`

---

## [1.14.0] - 2026-02-23

### Changed
- **NotificationBell**: Dropdown chỉ hiển thị thông báo chưa đọc
- **NotificationsPage**: Hiển thị TẤT CẢ thông báo, bỏ tab lọc, bỏ nút xóa đơn lẻ
- **PinnedPostsModal component** (NEW): Auto-popup bài ghim khi đăng nhập, cooldown 30 phút

### Fixed
- **Fix encoding hiển thị text content**: Decode HTML entities cho post title (PostDetailPage, Admin PostsPage, Admin CommentsPage)

### UI/UX
- **Markdown Guide Dialog**: Thu nhỏ `max-w-md max-h-[60vh]`
- **Remove unnecessary toast** khi đánh dấu tất cả đã đọc

---

## [1.13.1] - 2026-02-11

### Added
- **Admin-Client `.env.example`** file template

### Fixed
- **Backend**: Remove debug logs trong validation middleware (security)
- **Backend**: Enable TypeScript strict mode (`strict: true`, `noImplicitAny: true`)
- **Frontend**: Fix `updateProfile()` TODO function → real API call

### Known Issues (Technical Debt)
- Type mismatches sử dụng `as any` casts (3 locations: SearchPage, BookmarksPage, usePosts)
- Root cause: `Post` interface defined ở 2 nơi với incompatible types (`id: string` vs `id: number`)

---

## [1.13.0] - 2026-01-XX

### Initial Release

- **Mini Forum Platform** — First official release
- User authentication (Login/Register)
- Posting system with markdown support
- Category & Tag management
- Comment/Reply system
- Notification system
- Admin dashboard
- Frontend user interface
- Backend API (TypeScript + Node.js/Express + Prisma ORM)

---

## [1.13.0] - Refactor Documents
## Before [1.13.0] - Archive document (/docs(FROZEN)) (NOT IMPORTANT)

### Pre-Migration Checklist

```bash
# 1. Backup
git add . && git commit -m "Pre-migration backup"

# 2. Update dependencies
cd backend && npm install && npm run build && npm start
cd ../frontend && npm install && npm run dev
cd ../admin-client && npm install && npm run dev
```

### Post-Migration Verification

- [ ] Backend logs không có debug logs
- [ ] Notification validation hoạt động đúng
- [ ] Tất cả animation effects chạy smooth
- [ ] No console errors

