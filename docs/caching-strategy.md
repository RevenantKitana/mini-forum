# Caching Strategy — Mini Forum Backend

> Phân tích dựa trên source code thực tế. Mục tiêu: tối ưu tài nguyên hạn chế (single Node.js instance, PostgreSQL, không có Redis).

---

## 1. Bottleneck Chính

### 1.1 Database (Critical)

| Vấn đề | Nơi xảy ra | Lý do |
|--------|-----------|-------|
| **N+1 implicit query** | `getAllCategoriesWithTags()` | Với mỗi category gọi `prisma.post_tags.groupBy()` riêng → O(n) DB calls |
| **Double query per request** | `getPosts()` | Luôn chạy song song `findMany` + `count` — mọi request đều tốn 2 round-trips |
| **Write-on-every-read** | `getPostById()` | Mỗi lần xem bài viết là 1 `UPDATE posts SET view_count = view_count + 1` → write amplification |
| **ILIKE full-table scan** | `searchPosts()` / `searchUsers()` | `contains + mode: insensitive` dịch thành `ILIKE '%q%'` — không dùng B-tree index được |
| **13 parallel COUNT queries** | `getDashboardStats()` | Mỗi lần admin vào dashboard là 13+ aggregation queries |
| **Extra query cho blocked list** | `getPosts()` với auth user | `getBlockedUserIds(userId)` — 1 query DB mỗi khi user đăng nhập xem feed |

### 1.2 CPU (Moderate)

- `snakeToCamelObject()` chạy recursive trên **mọi response** — với list posts 20 items × nested objects, đây là non-trivial CPU per request.
- `transformPostTags()` chạy per-post trong list.

### 1.3 I/O (Low-moderate)

- Brevo email API — ngoài tầm kiểm soát, đã async.
- Không có connection pooling rõ ràng ngoài Prisma default.

---

## 2. Endpoint Nên Cache vs Không Nên

### ✅ NÊN CACHE

| Endpoint | Lý do kỹ thuật |
|----------|---------------|
| `GET /categories` | Data chỉ thay đổi khi admin CRUD. Được gọi ở **mọi page** (sidebar nav). Không có user-specific variation. |
| `GET /tags/popular` | `usage_count` thay đổi chậm (chỉ khi tạo/xóa post). Gọi liên tục từ filter UI và sidebar. |
| `GET /posts/featured` | Query phức tạp với OR conditions + sort. Thay đổi khi pin hoặc upvote ≥ 10 — hiếm. Có thể tách theo role (4 variants). |
| `GET /posts/latest` | Query đơn giản nhất trong feed, nhưng vẫn JOIN author + category + tags. Guest-safe (không blocked list). |
| `GET /posts/:id` (data only) | JOIN nặng với 6 bảng. Permission check có thể tách riêng (dựa vào `category.view_permission`). Cache data, check permission từ cache. |
| `GET /admin/dashboard` | 13 COUNT queries cho mỗi load. Admin traffic thấp nhưng query cost cao. TTL ngắn chấp nhận được. |

### ❌ KHÔNG NÊN CACHE

| Endpoint | Lý do kỹ thuật |
|----------|---------------|
| `GET /posts` (feed list với auth) | Mỗi user có `blockedUserIds` riêng → cache key space bùng nổ. Lọc theo role + blocked + pagination/sort = quá nhiều variants. |
| `GET /search?q=...` | Mỗi cụm từ tìm kiếm là 1 key khác nhau, tần suất hit rate thấp. Stale results không chấp nhận được trong search. |
| `GET /notifications` | Hoàn toàn user-specific, thay đổi real-time (badge count). |
| `GET /users/me/votes` | User-specific, luôn cần fresh. |
| `PUT/POST/DELETE *` | Write operations — không cache. |
| `GET /admin/users`, `GET /admin/reports` | Admin cần real-time, có filter/pagination phức tạp. |

---

## 3. Chi Tiết Cache Cho Mỗi Endpoint

### 3.1 `GET /categories`

```
Cache key:  cache:categories:active
            cache:categories:all          (admin, includeInactive=true)
TTL:        10 phút (hoặc invalidate-on-write)
Loại:       In-memory (node-cache hoặc Map + setTimeout)
```

**Lý do TTL dài**: Data thay đổi khi admin action, không phải user action. 10 phút chấp nhận được.  
**Invalidation**: Xóa key ngay sau `createCategory`, `updateCategory`, `deleteCategory` trong controller.

---

### 3.2 `GET /tags/popular` và `GET /tags`

```
Cache key:  cache:tags:popular:{limit}    (vd: cache:tags:popular:10)
            cache:tags:all
TTL:        5 phút
Loại:       In-memory
```

**Lý do**: `usage_count` cập nhật mỗi khi tạo post — nhưng thứ hạng tag thay đổi rất chậm. Stale 5 phút không ảnh hưởng UX.  
**Invalidation**: Xóa `cache:tags:*` khi admin tạo/sửa/xóa tag. Không cần invalidate khi user tạo post (TTL tự handle).

---

### 3.3 `GET /posts/featured`

```
Cache key:  cache:posts:featured:{role}
            role ∈ [guest, member, moderator, admin]   → 4 variants tối đa
TTL:        2 phút
Loại:       In-memory
```

**Lý do phân theo role**: `buildViewPermissionFilter` tạo ra WHERE clause khác nhau per role. Nếu cache chung sẽ leak dữ liệu MODERATOR-only cho MEMBER.  
**Invalidation**: Xóa `cache:posts:featured:*` khi:
- Một post được pin/unpin (`togglePostPin`, `togglePostLock`)
- Một post bị xóa hoặc đổi status

---

### 3.4 `GET /posts/latest`

```
Cache key:  cache:posts:latest:{limit}:{role}
TTL:        1 phút
Loại:       In-memory
```

**Lý do TTL ngắn**: Post mới được tạo liên tục, user kỳ vọng thấy nội dung mới.  
**Invalidation**: Xóa khi có post mới được publish hoặc xóa.

---

### 3.5 `GET /posts/:id` — Cache data + tách view count

**Vấn đề cốt lõi**: Hiện tại mỗi view = 1 `UPDATE` → với bài hot có thể gây lock.

**Giải pháp 2 phần:**

#### a) Cache post data
```
Cache key:  cache:post:{id}
TTL:        5 phút
Loại:       In-memory
```
Permission check vẫn chạy in-memory từ `category.view_permission` đã cache trong object — không cần thêm DB call.

#### b) Buffer view_count (ưu tiên cao)
```typescript
// In-memory accumulator
const viewCountBuffer = new Map<number, number>();  // postId → delta

// Gọi API: chỉ increment buffer, không ghi DB
viewCountBuffer.set(id, (viewCountBuffer.get(id) ?? 0) + 1);

// Flush mỗi 60 giây
setInterval(async () => {
  if (viewCountBuffer.size === 0) return;
  const entries = [...viewCountBuffer.entries()];
  viewCountBuffer.clear();

  await Promise.all(
    entries.map(([postId, delta]) =>
      prisma.posts.update({
        where: { id: postId },
        data: { view_count: { increment: delta } },
      })
    )
  );
}, 60_000);
```
**Lợi ích**: Giảm từ N `UPDATE` → 1 batch mỗi 60 giây. Với 1000 view/phút trên 1 bài, tiết kiệm 999 DB writes.

**Invalidation cache post**: Xóa `cache:post:{id}` khi:
- `updatePost(id, ...)`
- `updatePostStatus(id, ...)`
- `togglePostPin(id)` / `togglePostLock(id)`
- `deletePost(id)`

---

### 3.6 `GET /admin/dashboard`

```
Cache key:  cache:admin:dashboard:{startDate}:{endDate}
TTL:        30 giây
Loại:       In-memory
```

**Lý do**: 13 COUNT queries song song, nhưng admin cần độ fresh nhất định. 30s là compromise hợp lý.  
**Không invalidate** — chỉ dùng TTL vì data thay đổi từ nhiều nguồn.

---

## 4. Cache Invalidation Map

```
Sự kiện                          → Xóa cache keys
─────────────────────────────────────────────────────
createCategory / updateCategory  → cache:categories:*
deleteCategory                   → cache:categories:*
                                   cache:posts:featured:*
                                   cache:posts:latest:*

createPost (publish)             → cache:posts:latest:*
                                   cache:posts:featured:* (nếu pinned)
deletePost / updatePostStatus    → cache:post:{id}
                                   cache:posts:featured:* (nếu pinned)
                                   cache:posts:latest:*

updatePost                       → cache:post:{id}
togglePostPin                    → cache:post:{id}
                                   cache:posts:featured:*
togglePostLock                   → cache:post:{id}

createTag / updateTag / deleteTag → cache:tags:*
```

---

## 5. Nếu Chỉ Được Cache 2–3 Chỗ — Làm Gì Trước?

### Ưu tiên 1: **Buffer view_count writes** (tác động cao nhất)
> `getPostById` tạo 1 DB `UPDATE` cho mỗi pageview. Đây là write amplification nghiêm trọng nhất: đọc 1 bài hot = 1 write/request. Không cần thư viện cache — chỉ cần 1 `Map` + `setInterval`. ROI cao nhất với effort thấp nhất.

### Ưu tiên 2: **Cache categories list**
> Được gọi ở mọi page load (sidebar navigation, post creation form, filter bar). Data ổn định nhất trong hệ thống. 10 dòng code, loại bỏ hàng trăm identical DB queries mỗi giờ.

### Ưu tiên 3: **Cache featured posts + popular tags**
> Cả hai xuất hiện trên homepage/sidebar và không thay đổi theo user session. `featured` query đặc biệt nặng vì có OR condition + sort + permission filter. Cache 2 phút là đủ.

---

## 6. Implementation Notes

### Loại cache: In-memory trước, Redis khi cần scale

**Vì sao không cần Redis ngay:**
- Single Node.js instance → in-memory đủ dùng
- Không có horizontal scaling yêu cầu shared cache
- Thêm Redis = thêm infra cost + network latency + operational overhead

**Khi nào dùng Redis:**
- Scale lên ≥ 2 instances (shared session/cache)
- Cần pub/sub cho invalidation cross-instance
- Cache sống qua restart (ít cần thiết với TTL ngắn)

### Thư viện đề xuất
```
In-memory: node-cache (npm)  — TTL tự động, không manual setTimeout
                               hoặc built-in Map với cleanup interval

Redis (tương lai): ioredis  — hỗ trợ cluster, pipeline, pub/sub
```

### Pattern cache đề xuất (không dùng thư viện phức tạp)
```typescript
// cache.ts — simple wrapper
const store = new Map<string, { data: unknown; expiresAt: number }>();

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidatePrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
```

---

## 7. Điều Không Nên Làm

- **Đừng cache `/posts` list của authenticated users** — blocked list làm key space phình to.
- **Đừng cache search results** — hit rate thấp, space lãng phí.
- **Đừng cache notifications** — tính real-time là yêu cầu cốt lõi.
- **Đừng dùng HTTP Cache-Control cho dữ liệu có permission** — `GET /posts/featured` khác nhau theo role, không thể cache tầng CDN/proxy mà không có `Vary: Authorization`.
