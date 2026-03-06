# PLAN.md — Mini Forum: Kế hoạch triển khai Sprint tiếp theo

> **Scope**: Frontend người dùng (port 5173) + Backend (port 5000) khi cần. **Không** bao gồm admin-client.
> **Phiên bản hiện tại**: v1.16.0
> **Người soạn**: Senior Tech Lead / System Architect
> **Ngày cập nhật**: 2026-03-06

---

## Mục lục

1. [Tổng quan & Đánh giá nhanh](#1-tổng-quan--đánh-giá-nhanh)
2. [Task 1 — Loại bỏ AdminDashboard khỏi Frontend người dùng](#2-task-1--loại-bỏ-admindashboard-khỏi-frontend-người-dùng)
3. [Task 2 — Tối ưu Responsive UI/UX Mobile](#3-task-2--tối-ưu-responsive-uiux-mobile)
4. [Task 3 — Sửa Bug: Tính năng Chặn (Block)](#4-task-3--sửa-bug-tính-năng-chặn-block)
5. [Task 4 — Live Search / Instant Search cho Tags (+ Multi-tag Filter)](#5-task-4--live-search--instant-search-cho-tags--multi-tag-filter)
6. [Task 5 — Mobile: Category Fastlist Sidebar](#6-task-5--mobile-category-fastlist-sidebar)
7. [Thứ tự ưu tiên & Effort ước tính](#7-thứ-tự-ưu-tiên--effort-ước-tính)
8. [Nguyên tắc triển khai chung](#8-nguyên-tắc-triển-khai-chung)

---

## 1. Tổng quan & Đánh giá nhanh

### 1.1 Trạng thái hiện tại

| Thành phần | Trạng thái | Vấn đề đang tồn tại |
|---|---|---|
| Frontend (User) | ✅ Functional | Admin pages vẫn còn; block filter chưa đúng; Mobile UX chưa hoàn chỉnh |
| Backend API | ✅ Functional | Block filter chưa áp dụng triệt để trên một số endpoints |
| Admin-Client | ✅ Functional | Không trong scope |

### 1.2 Danh sách vấn đề phát hiện

| # | Vấn đề | Tệp / Vị trí | Mức độ |
|---|---|---|---|
| P0 | Admin pages, routes, AdminLayout còn trong frontend người dùng | `src/app/App.tsx`, `src/pages/admin/`, `src/components/layout/AdminLayout.tsx` | 🔴 Cao |
| P1 | Block feature: bài viết / profile / bình luận của người bị chặn vẫn hiển thị | `PostCard`, `ProfilePage`, `PostDetailPage`, BE services | 🔴 Cao |
| P2 | BookmarksPage UI bị lỗi layout trên mobile (trang bài viết đã lưu) | `BookmarksPage.tsx` | 🟡 Trung bình |
| P2 | HomePage UI layout issue trên màn hình nhỏ (filter bar vỡ layout) | `HomePage.tsx` | 🟡 Trung bình |
| P2 | Mobile không có Category fastlist như desktop sidebar | `MobileNav.tsx` | 🟡 Trung bình |
| P3 | TagsPage không có live search / instant filter | `TagsPage.tsx` | 🟡 Trung bình |
| P3 | Sidebar tag list không hỗ trợ live filter, multi-tag UX thô | `Sidebar.tsx` | 🟡 Trung bình |
| P3 | Responsive chưa tối ưu màn hình xoay ngang (landscape) | Layout components | 🟢 Thấp |

---

## 2. Task 1 — Loại bỏ AdminDashboard khỏi Frontend người dùng

### 2.1 Phân tích hiện trạng

Dù `admin-client` (cổng 5174) đã tồn tại độc lập, `frontend` (cổng 5173) vẫn chứa toàn bộ admin code:

```
frontend/src/
├── pages/admin/                        ← CẦN XÓA (5 trang)
│   ├── AdminDashboardPage.tsx
│   ├── AdminUsersPage.tsx
│   ├── AdminPostsPage.tsx
│   ├── AdminCommentsPage.tsx
│   ├── AdminReportsPage.tsx
│   └── index.ts
├── components/layout/
│   └── AdminLayout.tsx                 ← CẦN XÓA
└── routes/
    └── AdminRoute.tsx                  ← CẦN XÓA (nếu không còn dùng)
```

`App.tsx` hiện đang:
- Import `AdminLayout` và 5 admin pages
- Khai báo route block `/admin/*` với `<AdminLayout>` và 5 children routes

**Rủi ro nếu giữ**: Bundle size tăng; lộ UI admin cho user thường; duplicate logic với admin-client.

### 2.2 Phương án triển khai

> **Chiến lược**: Xóa clean (dead code removal). Truy cập `/admin` sẽ tự động rơi vào `<Route path="*">` → `NotFoundPage` đã có sẵn.

#### Bước 1 — Xóa import và routes trong `App.tsx`

**File**: `frontend/src/app/App.tsx`

Xóa các import:
```tsx
// XÓA:
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminPostsPage,
  AdminCommentsPage,
  AdminReportsPage,
} from '@/pages/admin';
```

Xóa route block:
```tsx
// XÓA toàn bộ block:
{/* Admin Routes */}
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboardPage />} />
  <Route path="users" element={<AdminUsersPage />} />
  <Route path="posts" element={<AdminPostsPage />} />
  <Route path="comments" element={<AdminCommentsPage />} />
  <Route path="reports" element={<AdminReportsPage />} />
</Route>
```

#### Bước 2 — Xóa files / thư mục

```
frontend/src/pages/admin/                    ← Xóa cả thư mục
frontend/src/components/layout/AdminLayout.tsx  ← Xóa file
```

#### Bước 3 — Kiểm tra `useAdmin.ts`

**File**: `frontend/src/hooks/useAdmin.ts`

- Kiểm tra xem hook này có được dùng ngoài admin pages không.
- Nếu **chỉ** dùng cho admin pages → **xóa**.
- Nếu có shared logic → giữ lại, refactor tên nếu cần.

#### Bước 4 — Kiểm tra `AdminRoute.tsx`

**File**: `frontend/src/routes/AdminRoute.tsx`

- Tìm tất cả nơi import `AdminRoute` (grep toàn dự án).
- Nếu không còn dùng → xóa file và cập nhật `routes/index.ts`.

#### Bước 5 — Kiểm tra `Header.tsx` & `MobileNav.tsx`

Tìm kiếm và loại bỏ bất kỳ link điều hướng nội bộ `/admin` nào dành cho user thường:

```bash
# Grep pattern cần tìm:
# "/admin" | "AdminRoute" | navigate('/admin')
```

> **Lưu ý**: Giữ lại link ngoài đến `http://localhost:5174` (admin-client) nếu có, chỉ xóa internal SPA routes.

### 2.3 Acceptance Criteria

- [ ] `frontend` không còn import bất kỳ admin page / component / hook nào
- [ ] Route `/admin/*` không tồn tại trong frontend SPA → trả về `NotFoundPage (404)`
- [ ] Bundle size giảm (kiểm tra: `npm run build -- --report`)
- [ ] Không có TypeScript compile error sau cleanup
- [ ] Tất cả trang user bình thường vẫn hoạt động bình thường

---

## 3. Task 2 — Tối ưu Responsive UI/UX Mobile

### 3.1 Phân tích hiện trạng

**Target screen sizes**:
- Portrait: `720×1280` → `1080×1920`
- Landscape: `720×1280` xoay ngang (`1280×720`) → `1920×1080`

**Vấn đề đã xác định**:

| Trang | Vấn đề cụ thể |
|---|---|
| **BookmarksPage** | PostCard trong bookmark list bị vỡ layout; text/meta tràn; pagination không căn giữa đúng |
| **HomePage** | Filter bar (sort tabs + date picker) bị chèn chồng nhau ở màn hình < 400px; tag badges tràn ngang |
| **Chung (landscape)** | Sidebar trái chiếm quá nhiều vp-height khi xoay ngang; header cứng không co giãn |

### 3.2 Breakpoints cần nhắm

| Breakpoint | Width | Mô tả |
|---|---|---|
| `xs` | < 480px | Điện thoại nhỏ (Galaxy S8, iPhone SE) |
| `sm` | 480–639px | Điện thoại lớn / portrait flagship |
| `md` | 640–767px | Landscape mobile / tablet nhỏ |
| `lg` | 768px+ | Tablet / desktop → sidebar hiển thị |

### 3.3 BookmarksPage — Chi tiết fix

**File**: `frontend/src/pages/BookmarksPage.tsx`

Vấn đề: container wrapping chưa có `max-w` phù hợp trên xs; spacing quá lớn.

```tsx
// Thay:
<div className="space-y-4">
// Thành:
<div className="space-y-3 sm:space-y-4">
```

```tsx
// Pagination container:
// Thêm: mt-4 sm:mt-6 thay vì mt-6 cứng
<div className="flex justify-center gap-2 mt-4 sm:mt-6 flex-wrap">
```

**PostCard mobile fixes** (`frontend/src/components/PostCard.tsx`):
- Avatar: `h-8 w-8 sm:h-10 sm:w-10`
- Title: `text-sm sm:text-base` + `line-clamp-2`
- Footer row: thêm `flex-wrap gap-1.5` để metadata không tràn
- Tag/category badges: thêm `truncate max-w-[100px] sm:max-w-none`

### 3.4 HomePage — Chi tiết fix

**File**: `frontend/src/pages/HomePage.tsx`

Vấn đề: Filter row dùng `flex` không `flex-wrap`:

```tsx
// Filter bar — thêm flex-wrap:
<div className="flex flex-wrap gap-2 items-center">
```

Sort tabs trên mobile:
- Ẩn label text, chỉ hiện icon trên xs: `<span className="hidden sm:inline">Mới nhất</span>`
- Hoặc nhóm lại thành dropdown `<Select>` trên xs

Date picker:
- Nút trigger: thu gọn về icon-only trên xs: `<CalendarDays className="h-4 w-4" /><span className="hidden sm:inline ml-1">Ngày</span>`

### 3.5 Landscape Mode Optimization

**Hook mới**: `frontend/src/hooks/useMediaQuery.ts`

```ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
```

**File**: `frontend/src/components/layout/MainLayout.tsx`

```tsx
const isLandscapeMobile = useMediaQuery(
  '(orientation: landscape) and (max-height: 500px)'
);

// Sử dụng:
const shouldShowLeftSidebar = showLeftSidebar && !isLandscapeMobile;
```

Trên landscape mobile: ẩn sidebar trái → content chiếm full width, dùng `MobileNav` (hamburger) để truy cập danh mục.

### 3.6 Acceptance Criteria

- [ ] BookmarksPage không có horizontal overflow trên `375px`, `390px`, `412px`
- [ ] HomePage filter bar tự wrap xuống dòng khi không đủ rộng
- [ ] Landscape `800×360` (Galaxy S9 xoay): không layout collapse, không scroll ngang
- [ ] Test thủ công trên Chrome DevTools: Galaxy S9 (360×800), Pixel 7 (412×915), iPhone 14 (390×844), landscape variant của cả 3

---

## 4. Task 3 — Sửa Bug: Tính năng Chặn (Block)

### 4.1 Phân tích nguyên nhân gốc rễ

**Vấn đề**: Sau khi User A chặn User B, nội dung của B (bài viết, bình luận, profile) vẫn hiển thị bình thường với A.

**Root cause**:

1. **Backend** — `blockService.ts` có hàm `isUserBlocked()` nhưng:
   - `postService.ts` → query lấy danh sách posts **không** join/filter `UserBlock`
   - `commentService.ts` → query lấy comments **không** filter `UserBlock`
   - `userController.ts` → endpoint `GET /users/:username` không trả về trạng thái block

2. **Frontend** — Không có bất kỳ check block nào trong:
   - `PostCard.tsx` (render mọi bài viết)
   - `PostDetailPage.tsx` (render mọi comment)
   - `ProfilePage.tsx` (render mọi profile)

> **Nguyên tắc**: Fix tại Backend là bắt buộc (security). Frontend là UX layer bổ sung.

### 4.2 Backend Fix

> **Không** thay đổi schema. Tận dụng model `UserBlock` đã có.

#### 4.2.1 Helper function tái sử dụng

**File**: `backend/src/services/blockService.ts` (bổ sung)

```typescript
/**
 * Trả về danh sách userId mà requestingUser đã chặn.
 * Trả về mảng rỗng nếu không có user hoặc chưa chặn ai.
 */
export async function getBlockedUserIds(requestingUserId: number | undefined): Promise<number[]> {
  if (!requestingUserId) return [];
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: requestingUserId },
    select: { blockedId: true },
  });
  return blocks.map(b => b.blockedId);
}
```

#### 4.2.2 `GET /posts` — Filter bài viết của người bị chặn

**File**: `backend/src/services/postService.ts`

Trong hàm `getPosts()`, khi nhận `requestingUserId`:

```typescript
// Thêm vào đầu hàm:
const blockedIds = await getBlockedUserIds(requestingUserId);

// Thêm vào Prisma where clause:
where: {
  ...existingWhere,
  ...(blockedIds.length > 0 && { authorId: { notIn: blockedIds } }),
}
```

> **Performance note**: Query `getBlockedUserIds` chạy thêm 1 DB round-trip. Acceptable ở scale hiện tại. Nếu cần optimize sau: cache trong request context hoặc JOIN vào query chính.

#### 4.2.3 `GET /posts/:id/comments` — Filter bình luận

**File**: `backend/src/services/commentService.ts`

Tương tự, thêm `authorId: { notIn: blockedIds }` vào query Prisma.

**Xử lý comment tree**: Với bình luận dạng cây (root + replies), thay vì xóa hẳn node bị chặn (gây vỡ thread), thay nội dung:

```typescript
// Thay vì filter hard:
// Option A — Soft replace (khuyến nghị):
comments.map(comment => {
  if (blockedIds.includes(comment.authorId)) {
    return {
      ...comment,
      content: '[Nội dung đã bị ẩn]',
      author: null,
      isHiddenByBlock: true,
    };
  }
  return comment;
});
```

#### 4.2.4 `GET /users/:username` — Profile của người bị chặn

**File**: `backend/src/services/userService.ts` hoặc `userController.ts`

Bổ sung trường `isBlockedByMe` vào response:

```typescript
// Khi requestingUserId có:
const isBlockedByMe = requestingUserId
  ? await isUserBlocked(requestingUserId, profileUser.id)
  : false;

const hasBlockedMe = requestingUserId
  ? await isUserBlocked(profileUser.id, requestingUserId)
  : false;

// Trả về trong response:
return {
  ...profileUser,
  isBlockedByMe,
  hasBlockedMe,
};
```

### 4.3 Frontend Fix

#### 4.3.1 `ProfilePage.tsx` — Hiển thị trạng thái bị chặn

```tsx
// Sau khi có profileData:
if (profileData?.data?.isBlockedByMe) {
  return <BlockedProfileView username={username} onUnblock={handleUnblock} />;
}
```

**Component `BlockedProfileView`** (tạo inline hoặc tách file):
```tsx
function BlockedProfileView({ username, onUnblock }: { username: string; onUnblock: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-4 text-center">
      <UserX className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold">@{username}</h2>
      <p className="text-muted-foreground">Bạn đã chặn người dùng này. Nội dung của họ bị ẩn.</p>
      <Button variant="outline" onClick={onUnblock}>Bỏ chặn</Button>
    </div>
  );
}
```

#### 4.3.2 Invalidate cache sau block/unblock

**File**: Nơi gọi block/unblock mutation (ProfilePage hoặc hook riêng):

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['posts'] });
  queryClient.invalidateQueries({ queryKey: ['user', username] });
  queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
};
```

#### 4.3.3 `PostCard.tsx` — Không cần thay đổi

Nếu Backend filter chuẩn, PostCard sẽ không nhận được posts từ blocked users. Frontend không cần thêm logic lọc.

### 4.4 Acceptance Criteria

- [ ] User A block User B → Posts của B không xuất hiện trong feed của A (reload page)
- [ ] User A block User B → Comments của B trong post detail bị thay bằng `[Nội dung đã bị ẩn]`
- [ ] User A block User B → Trang profile của B hiển thị `BlockedProfileView`
- [ ] Bỏ chặn → Nội dung hiển thị lại bình thường (sau reload hoặc cache invalidation)
- [ ] Block không ảnh hưởng đến guest (unauthenticated users thấy mọi nội dung bình thường)
- [ ] API không trả về 500/400 bất thường khi block filter áp dụng
- [ ] `getBlockedUserIds()` trả về `[]` khi `requestingUserId` là `undefined` (guest safety)

---

## 5. Task 4 — Live Search / Instant Search cho Tags (+ Multi-tag Filter)

### 5.1 Phân tích hiện trạng

| Vị trí | Vấn đề |
|---|---|
| `TagsPage.tsx` | Hiển thị toàn bộ tags nhóm theo popularity, không có ô filter nhanh |
| `Sidebar.tsx` | Popular tags được hiển thị nhưng không có input lọc |
| `MobileNav.tsx` | Tags trong Sheet nhưng không có filter |
| Multi-tag | URL params `?tags=a,b` đã support, nhưng UI chỉ click đơn lẻ; không có badge "đang lọc N tags" |

### 5.2 Component `TagSearchInput` (tạo mới, tái sử dụng)

**File**: `frontend/src/components/common/TagSearchInput.tsx`

```tsx
interface TagSearchInputProps {
  tags: Tag[];
  activeTags: string[];          // slugs đang active
  onTagToggle: (slug: string) => void;
  placeholder?: string;
  maxDisplay?: number;           // giới hạn tag hiển thị, default: 20
  showCount?: boolean;           // hiển thị (n) bài viết
  compact?: boolean;             // mode compact cho sidebar
}
```

**Logic cốt lõi**:
1. `useState('')` cho search query
2. Debounce 150ms bằng `useEffect` (không cần thư viện)
3. `useMemo` filter tags theo debounced query (so sánh `toLowerCase()`)
4. Active tag: `bg-primary text-primary-foreground`; inactive: `variant="outline"`

**Debounce pattern** (không thêm thư viện):
```tsx
const [debouncedQuery, setDebouncedQuery] = useState('');
useEffect(() => {
  const t = setTimeout(() => setDebouncedQuery(searchQuery), 150);
  return () => clearTimeout(t);
}, [searchQuery]);

const filteredTags = useMemo(
  () => tags.filter(t => t.name.toLowerCase().includes(debouncedQuery.toLowerCase())),
  [tags, debouncedQuery]
);
```

### 5.3 Cập nhật `TagsPage.tsx`

Thêm `TagSearchInput` phía trên phần grouping.

**UI Layout**:
```
┌────────────────────────────────────┐
│  🏷️ Tags                           │
│  "Khám phá chủ đề..."              │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🔍  Tìm tag...               │  │
│  └──────────────────────────────┘  │
│                                    │
│  Kết quả (n tag):                  │
│  [#vue] [#react] [#nodejs] ...     │
│                                    │
│  (khi query rỗng: nhóm Nổi bật/   │
│   Phổ biến/Thông thường như cũ)    │
└────────────────────────────────────┘
```

Logic render:
```tsx
// Khi có search query → hiện flat list kết quả
// Khi query rỗng → hiện grouped view như hiện tại
{searchQuery.trim()
  ? <FlatTagList tags={filteredTags} activeTags={...} />
  : <GroupedTagView groups={groupedTags} activeTags={...} />
}
```

### 5.4 Cập nhật `Sidebar.tsx` — Tag filter inline

Trong phần "Tags phổ biến", thêm ô filter nhỏ:

```tsx
// Trên list tags:
<Input
  placeholder="Lọc tag..."
  value={tagFilter}
  onChange={e => setTagFilter(e.target.value)}
  className="h-7 text-xs mb-2"
/>

// Sau filter:
const filteredPopularTags = useMemo(
  () => popularTags?.filter(t => t.name.toLowerCase().includes(tagFilter.toLowerCase())) ?? [],
  [popularTags, tagFilter]
);
```

**Multi-tag active indicator** (thêm vào sidebar):

```tsx
{activeTags.length > 0 && (
  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 mb-2">
    <span>Đang lọc: <strong>{activeTags.length}</strong> tag</span>
    <button
      className="text-primary hover:underline"
      onClick={clearAllTags}
    >
      Xóa hết
    </button>
  </div>
)}
```

### 5.5 Cập nhật `MobileNav.tsx` — Tag filter trong Sheet

Tái sử dụng `TagSearchInput` (compact mode):

```tsx
// Trong Sheet content, phần tags:
<div className="space-y-2">
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</p>
  <TagSearchInput
    tags={popularTags ?? []}
    activeTags={activeTags}
    onTagToggle={handleTagClick}
    placeholder="Tìm tag..."
    maxDisplay={12}
    compact
  />
  {activeTags.length > 0 && (
    <button className="text-xs text-primary" onClick={clearAllTagsMobile}>
      Xóa tất cả tags ({activeTags.length})
    </button>
  )}
</div>
```

### 5.6 Backend (không cần thay đổi ngay)

API `GET /tags` đã trả về đủ data. Filter client-side phù hợp với scale hiện tại (< 200 tags).

Nếu tương lai cần server-side search: `GET /tags?search=query&limit=20` (note cho backlog).

### 5.7 Acceptance Criteria

- [ ] TagsPage có input lọc realtime (< 200ms response)
- [ ] Khi gõ query → hiện flat list kết quả; khi xóa → quay lại grouped view
- [ ] Sidebar có inline filter trong popular tags section
- [ ] MobileNav Sheet có tag filter
- [ ] Click nhiều tags → URL `?tags=a,b,c` và filter bài viết
- [ ] "Đang lọc N tags" badge + nút "Xóa hết" khi có active tags
- [ ] Không gửi thêm API request khi filter (pure client-side)
- [ ] UI tag filter trong MobileNav và Sidebar nhất quán về style

---

## 6. Task 5 — Mobile: Category Fastlist Sidebar

### 6.1 Phân tích hiện trạng

| Platform | UX Category |
|---|---|
| Desktop (≥ 768px) | Sidebar trái với category list — click nhanh, luôn visible |
| Mobile (< 768px) | Trong hamburger Sheet — phải mở Sheet → chọn → Sheet tự đóng → muốn đổi phải mở lại |

**Gap**: Mobile thiếu "quick access" cho category mà không cần đi qua menu.

### 6.2 Giải pháp: Horizontal Scrollable Category Bar

> **Phương án**: Thêm một thanh category pill-buttons cuộn ngang, hiển thị **ngay trên feed** của HomePage, **chỉ trên mobile**.

#### 6.2.1 Component `MobileCategoryBar` (tạo mới)

**File**: `frontend/src/components/layout/MobileCategoryBar.tsx`

```tsx
interface MobileCategoryBarProps {
  categories: Category[];
  activeCategory: string | null;
  onSelect: (slug: string | null) => void;
}

export function MobileCategoryBar({ categories, activeCategory, onSelect }: MobileCategoryBarProps) {
  return (
    <div
      className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
      role="tablist"
      aria-label="Danh mục"
    >
      {/* "Tất cả" pill */}
      <button
        role="tab"
        aria-selected={!activeCategory}
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
          !activeCategory
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background border-border text-foreground hover:bg-muted"
        )}
      >
        Tất cả
      </button>

      {categories.map(cat => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={activeCategory === cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
            activeCategory === cat.slug
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-foreground hover:bg-muted"
          )}
        >
          {cat.name}
          {cat.postCount > 0 && (
            <span className="ml-1 text-[10px] opacity-60">({cat.postCount})</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

**CSS scrollbar-hide** (thêm vào `frontend/src/styles/globals.css` hoặc Tailwind plugin):
```css
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

#### 6.2.2 Tích hợp vào `HomePage.tsx`

**Vị trí**: Ngay dưới heading/filter bar, trước danh sách bài viết.

```tsx
// Import:
import { MobileCategoryBar } from '@/components/layout/MobileCategoryBar';
import { useCategories } from '@/hooks/useCategories';

// Inside HomePage:
const { data: categories } = useCategories(); // đã fetch, không thêm request mới

// Filter visible categories (permission check):
const visibleCategories = useMemo(() =>
  categories?.filter(cat => {
    if (!cat.viewPermission || cat.viewPermission === 'ALL') return true;
    if (!isAuthenticated) return false;
    return checkPermissionLevel(user?.role, cat.viewPermission);
  }) ?? [],
  [categories, isAuthenticated, user]
);

// Handler:
const handleMobileCategorySelect = (slug: string | null) => {
  const newParams = new URLSearchParams(searchParams);
  if (slug) newParams.set('category', slug);
  else newParams.delete('category');
  newParams.delete('page'); // reset về trang 1
  setSearchParams(newParams);
};

// Render (ngay trên danh sách bài viết):
<MobileCategoryBar
  categories={visibleCategories}
  activeCategory={categorySlug ?? null}
  onSelect={handleMobileCategorySelect}
/>
```

> **Lưu ý**: `useCategories()` đã được gọi trong Sidebar và MobileNav, React Query sẽ cache — không có thêm HTTP request.

#### 6.2.3 Không cần sticky (mặc định)

Scroll ngang tĩnh là đủ cho UX. Tránh sticky để không chiếm viewport height di động.

Nếu muốn sticky sau khi test UX → thêm sau:
```tsx
<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pt-2 -mx-4 px-4 mb-3">
  <MobileCategoryBar ... />
</div>
```

### 6.3 Acceptance Criteria

- [ ] Trên < 768px: category bar xuất hiện ngay trên feed ở HomePage
- [ ] Trên ≥ 768px: category bar ẩn hoàn toàn (`hidden md:hidden`) — sidebar đảm nhận
- [ ] Tap một pill → filter bài viết ngay, không cần mở menu
- [ ] Active category: pill highlight màu primary
- [ ] Scroll ngang mượt, không scrollbar visible
- [ ] Categories với permission bị ẩn với user không đủ quyền
- [ ] URL params đồng bộ (chọn từ MobileCategoryBar hay Sidebar đều cho cùng kết quả lọc)
- [ ] Không phát sinh HTTP request mới (dùng cached categories data)

---

## 7. Thứ tự ưu tiên & Effort ước tính

| # | Task | Ưu tiên | Effort | Rủi ro | Ghi chú |
|---|---|:---:|:---:|:---:|---|
| 1 | Loại bỏ Admin code khỏi FE | 🔴 P0 | ~1–2h | Thấp | Chỉ xóa, không thêm |
| 2 | Block fix — Backend | 🔴 P0 | ~4–6h | Trung bình | Cần test query performance |
| 3 | Block fix — Frontend | 🔴 P0 | ~2–3h | Thấp | Phụ thuộc Task 2 BE xong |
| 4 | Responsive: BookmarksPage | 🟡 P1 | ~1–2h | Thấp | CSS + layout tweaks |
| 5 | Responsive: HomePage | 🟡 P1 | ~1–2h | Thấp | flex-wrap + sort UI |
| 6 | Landscape optimization | 🟡 P1 | ~2–3h | Thấp | Hook mới + conditional |
| 7 | Live Search Tags (TagsPage) | 🟡 P1 | ~2–3h | Thấp | Client-side filter |
| 8 | Tag filter trong Sidebar | 🟡 P1 | ~1h | Thấp | Tái sử dụng component |
| 9 | Mobile Category Fastlist | 🟡 P1 | ~3–4h | Thấp | Component mới |
| 10 | Multi-tag UX (badge + clear) | 🟢 P2 | ~1h | Thấp | UX polish |
| 11 | Tag filter trong MobileNav | 🟢 P2 | ~1h | Thấp | Tái sử dụng TagSearchInput |

**Tổng effort ước tính**: ~19–28 giờ kỹ thuật

### 7.1 Thứ tự sprint đề xuất

```
Sprint 1 (Critical):
  [1] Admin cleanup (1–2h)
  [2+3] Block feature fix BE + FE (6–9h)

Sprint 2 (UX/Responsive):
  [4+5+6] Responsive fixes (4–7h)
  [7+8] Tag search (3–4h)
  [9] Mobile category bar (3–4h)

Sprint 3 (Polish):
  [10+11] Multi-tag UX + MobileNav tag filter (2h)
```

---

## 8. Nguyên tắc triển khai chung

### 8.1 Code Standards

- **TypeScript strict**: Không dùng `as any` trong code mới; dùng proper type guards và generics
- **Component nhỏ & tái sử dụng**: JSX > 80 dòng → cân nhắc tách component; ưu tiên tạo shared component thay vì duplicate
- **Custom hooks cho logic**: Business / data logic trong hooks, không inline trong JSX
- **Naming convention**: theo pattern hiện có — `use` prefix cho hooks, `.tsx` cho components, `Page` suffix cho pages

### 8.2 Không phá kiến trúc

- **Không thay đổi** `backend/prisma/schema.prisma` cho các task này (không cần migration)
- **Không thay đổi** API contract hiện có — chỉ **thêm** optional fields (`isBlockedByMe`) hoặc **thêm** filter logic; không đổi format response
- Giữ nguyên routing pattern (React Router v7 `<Route>`)
- Không thêm npm packages mới nếu có thể implement bằng utilities đã có

### 8.3 Testing checklist trước merge

```
□ Build thành công: npm run build (không có error/warning mới)
□ TypeScript: npx tsc --noEmit (0 errors)
□ Smoke test thủ công trên Chrome DevTools:
  - Galaxy S9 (360×800) — portrait + landscape
  - Pixel 7 (412×915)
  - iPhone 14 Pro (393×852)
□ Block feature: test với 2 tài khoản (john@example.com + thêm 1 tài khoản test)
□ Admin route /admin → 404 NotFoundPage (không phải blank/error)
□ Tag search: gõ ký tự → filter ngay, xóa → grouped view trở lại
□ Mobile category bar: cuộn ngang mượt, tap đổi category, URL sync đúng
```

### 8.4 Files KHÔNG được sửa trong sprint này

```
backend/prisma/schema.prisma     ← No migration
docs/                            ← Cập nhật sau khi feature hoàn thành
admin-client/                    ← Ngoài scope
e2e/                             ← Cập nhật sau nếu cần
```

---

*PLAN.md — Phiên bản đặc tả kỹ thuật đầy đủ*
*Soạn bởi: Senior Tech Lead / System Architect — 2026-03-06*