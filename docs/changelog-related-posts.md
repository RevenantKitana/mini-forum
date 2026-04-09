# Changelog: Tính năng "Bài viết liên quan" (Related Posts)

**Ngày:** 9 tháng 4, 2026  
**Loại:** Feature  
**Phạm vi:** Backend + Frontend

---

## Tổng quan

Xây dựng tính năng hiển thị **"Bài viết liên quan"** tại sidebar trái của trang chi tiết bài viết (`/posts/:id`). Khi xem chi tiết một bài, sidebar sẽ thay thế toàn bộ nội dung cũ (Categories / Tags / Stats) bằng danh sách bài viết liên quan.

---

## Logic xếp hạng

Các bài viết được chấm điểm và sắp xếp theo thứ tự ưu tiên:

| Thứ tự | Tiêu chí |
|--------|----------|
| 1 | **Tag match nhiều → ít** (số tag chung giữa bài đang xem và bài liên quan) |
| 2 | **Cùng category** (ưu tiên khi tag count bằng nhau) |
| 3 | **Mới nhất** (tiebreaker theo `created_at` DESC) |
| 4 | **Random** nếu kết quả `< 3` bài → gợi ý "Bạn có thể thích" |

---

## Thay đổi

### Backend

#### `backend/src/services/postService.ts`
- **Thêm:** `export async function getRelatedPosts(postId, limit, minRelatedThreshold, userRole)`
  - Lấy `category_id` + `tag_ids` của bài viết nguồn
  - Query candidates: cùng category **OR** có tag chung (filter permission)
  - Tính `_tagMatchCount` in-memory, sort theo rank
  - Nếu `result.length < minRelatedThreshold` → thêm bài random (Fisher-Yates shuffle)
  - Strip internal props trước khi return qua `transformPostTags`

#### `backend/src/controllers/postController.ts`
- **Thêm:** handler `getRelatedPosts`
  - `GET /api/v1/posts/:id/related?limit=8`
  - Truyền `userRole` để filter permission

#### `backend/src/routes/postRoutes.ts`
- **Thêm:** `router.get('/:id/related', optionalAuthMiddleware, getRelatedPosts)`
  - **Vị trí:** Đặt trước `/:id` để tránh route conflict

---

### Frontend

#### `frontend/src/api/endpoints.ts`
- **Thêm:** `POSTS.RELATED: (id) => /posts/${id}/related`

#### `frontend/src/api/services/postService.ts`
- **Thêm:** method `getRelated(postId, limit): Promise<Post[]>`

#### `frontend/src/hooks/usePosts.ts`
- **Thêm:** `postKeys.related(id)` vào query keys
- **Thêm:** hook `useRelatedPosts(postId, limit)` — staleTime 5 phút

#### `frontend/src/components/layout/Sidebar.tsx`
- **Thêm imports:** `useRelatedPosts`, `useParams`, icons `Sparkles`, `Eye`, `MessageSquare`, type `Post`
- **Thêm logic:** `isDetailPage = location.pathname.startsWith('/posts/') && !!postId`
- **Thêm section:** "Bài viết liên quan" — chỉ render khi `isDetailPage === true`, chiếm toàn bộ flex space
  - Loading skeleton (4 items)
  - Danh sách bài viết: title, category color dot, view/comment count, tag đầu tiên
  - Empty state nếu không có kết quả
- **Thêm điều kiện:** Community Stats ẩn khi `isDetailPage === true`
- **Hành vi trang home:** Categories / Tags / Stats hiển thị như cũ (không thay đổi)

---

## API

```
GET /api/v1/posts/:id/related?limit=8
Authorization: Optional

Response 200:
{
  "success": true,
  "message": "Related posts retrieved successfully",
  "data": Post[]
}

Response 404:
{
  "success": false,
  "message": "Post not found"
}
```

---

## Files đã sửa

| File | Loại thay đổi |
|------|---------------|
| `backend/src/services/postService.ts` | Thêm function |
| `backend/src/controllers/postController.ts` | Thêm handler |
| `backend/src/routes/postRoutes.ts` | Thêm route |
| `frontend/src/api/endpoints.ts` | Thêm endpoint constant |
| `frontend/src/api/services/postService.ts` | Thêm service method |
| `frontend/src/hooks/usePosts.ts` | Thêm query key + hook |
| `frontend/src/components/layout/Sidebar.tsx` | Refactor UI |
