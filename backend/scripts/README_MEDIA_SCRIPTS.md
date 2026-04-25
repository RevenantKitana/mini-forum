# ImageKit Media Scripts — Hướng dẫn

Tập hợp các script quản lý và reset media ImageKit trong mini-forum.

---

## Overview

| Script | Mục đích | Xoá ImageKit | Xoá Database |
|--------|---------|-------------|-------------|
| `resetPostMedia.ts` | Reset tất cả post media | ✅ Có | ✅ Có (post_media) |
| `resetAvatarMedia.ts` | Reset tất cả avatar | ✅ Có | ✅ Có (users fields) |
| `resetAllMedia.ts` | Reset avatar + post media | ✅ Có | ✅ Có (cả hai) |
| `cleanupImagekit.ts` | Xoá orphaned files | ✅ Có | — (DB không thay đổi) |

---

## Cách sử dụng

### 1. Reset Post Media

Xoá tất cả post media từ ImageKit và database.

```bash
# Preview mode (dry-run)
DRY_RUN=true npx ts-node scripts/resetPostMedia.ts

# Thực hiện reset
npx ts-node scripts/resetPostMedia.ts

# Custom batch size (giảm batch nếu ImageKit rate-limit)
BATCH_SIZE=5 npx ts-node scripts/resetPostMedia.ts
```

**Output:**
```
[resetPostMedia] Found 42 media file(s) in database.
[resetPostMedia] Deleting from ImageKit in batches of 10...
[resetPostMedia] Progress: 10/42
[resetPostMedia] Progress: 20/42
...
✅ Post media reset completed successfully!
📊 Summary:
   - ImageKit deletions: 42
   - ImageKit failures: 0
   - Database records deleted: 42
```

---

### 2. Reset Avatar Media

Xoá tất cả avatar từ ImageKit và reset user fields.

```bash
# Preview mode
DRY_RUN=true npx ts-node scripts/resetAvatarMedia.ts

# Thực hiện reset (giữ legacy avatar_url)
npx ts-node scripts/resetAvatarMedia.ts

# Xoá cả legacy avatar_url
KEEP_LEGACY=false npx ts-node scripts/resetAvatarMedia.ts
```

**Environment variables:**
- `DRY_RUN=true` — Preview chỉ, không xoá
- `KEEP_LEGACY=true` (default) — Giữ lại `avatar_url` field cho fallback
- `KEEP_LEGACY=false` — Xoá hết, chỉ giữ ImageKit fields
- `BATCH_SIZE=10` (default) — Kích thước batch

**Output:**
```
[resetAvatarMedia] Found 5 user(s) with ImageKit avatars.
[resetAvatarMedia] Deleting from ImageKit in batches of 10...
[resetAvatarMedia] Progress: 5/5
[resetAvatarMedia] Deleted from ImageKit: 5, failed: 0
[resetAvatarMedia] Resetting avatar fields in database...
[resetAvatarMedia] Updated 5 user(s).

✅ Avatar media reset completed successfully!
📊 Summary:
   - ImageKit deletions: 5
   - ImageKit failures: 0
   - Database users updated: 5
   - Legacy avatar_url: PRESERVED
```

---

### 3. Reset All Media (Avatar + Post)

Xoá tất cả media trong một lệnh.

```bash
# Preview
DRY_RUN=true npx ts-node scripts/resetAllMedia.ts

# Reset tất cả (giữ legacy)
npx ts-node scripts/resetAllMedia.ts

# Reset tất cả + xoá legacy
KEEP_LEGACY=false npx ts-node scripts/resetAllMedia.ts
```

**Output:**
```
============================================================
[resetAllMedia] Starting...
============================================================

Options: KEEP_LEGACY=true, BATCH_SIZE=10

[1/2] Found 42 post media file(s).
[2/2] Found 5 user(s) with ImageKit avatars.

[resetAllMedia] Deleting post media from ImageKit...
  Post media progress: 10/42
  Post media progress: 20/42
  ...
[resetAllMedia] Deleting avatars from ImageKit...
  Avatar progress: 5/5

[resetAllMedia] Deleting post_media records from database...
  Deleted 42 post_media records.
[resetAllMedia] Resetting avatar fields in database...
  Updated 5 user(s).

============================================================
✅ All media reset completed successfully!
============================================================
📊 Summary:
   - ImageKit total deletions: 47
   - ImageKit failures: 0
   - Post media database records deleted: 42
   - Users with avatars reset: 5
   - Legacy avatar_url: PRESERVED
```

---

### 4. Cleanup ImageKit Orphaned Files

Xoá files từ ImageKit nếu không có reference trong database (safe cleanup).

```bash
# Preview
DRY_RUN=true npx ts-node scripts/cleanupImagekit.ts

# Thực hiện cleanup
npx ts-node scripts/cleanupImagekit.ts

# Custom folders (mặc định: avatars,posts)
FOLDERS="avatars,posts,other" npx ts-node scripts/cleanupImagekit.ts
```

**Output:**
```
[cleanupImagekit] Scanning folders: avatars, posts

[cleanupImagekit] Fetching files from /avatars...
  Found 5 file(s)

[cleanupImagekit] Fetching files from /posts...
  Found 42 file(s)

[cleanupImagekit] Total files in ImageKit: 47

[cleanupImagekit] Database references:
  - post_media: 40 file(s)
  - users (avatars): 5 file(s)

[cleanupImagekit] Orphaned files found: 2

[cleanupImagekit] Deleting orphaned files from ImageKit...
  ✓ Deleted: /posts/old-file-1.jpg
  ✓ Deleted: /posts/old-file-2.jpg

✅ ImageKit cleanup completed!
📊 Summary:
   - Orphaned files deleted: 2
   - Deletion failures: 0
```

---

## Best Practices

### 1. Luôn chạy DRY_RUN trước

```bash
DRY_RUN=true npx ts-node scripts/resetAllMedia.ts
# Review output, sau đó:
npx ts-node scripts/resetAllMedia.ts
```

### 2. Backup database trước reset

```bash
# Backup database
npx ts-node scripts/backupDb.ts

# Reset media
npx ts-node scripts/resetAllMedia.ts
```

### 3. Rate-limiting

Nếu ImageKit return 429 (rate limited), giảm batch size:

```bash
BATCH_SIZE=5 npx ts-node scripts/resetPostMedia.ts
```

### 4. Workflow phát triển

Khi muốn reset tất cả dữ liệu và media cho fresh start:

```bash
# 1. Reset media ImageKit
DRY_RUN=true npx ts-node scripts/resetAllMedia.ts  # preview
npx ts-node scripts/resetAllMedia.ts               # execute

# 2. Clear database (nếu cần)
DRY_RUN=true npx ts-node scripts/clearData.ts      # preview
npx ts-node scripts/clearData.ts                   # execute

# 3. Run seed (nếu có)
npx prisma db seed
```

---

## Troubleshooting

### ImageKit API Errors

**Error:** `401 Unauthorized`
- Kiểm tra `IMAGEKIT_PRIVATE_KEY` trong `.env`
- Phải là private key, không phải public key

**Error:** `429 Too Many Requests`
- Giảm `BATCH_SIZE`
- Hoặc tăng `DELAY_MS` trong script

**Error:** `ENOTFOUND`
- ImageKit API không kết nối được
- Kiểm tra network/firewall

### Database Errors

**Error:** `foreign key constraint`
- Script sẽ tự xoá theo thứ tự (post_media trước posts)
- Nếu vẫn lỗi, check if post_blocks references post_media

**Error:** `unique constraint violated`
- Bất thường, contact dev team

---

## Environment Variables Reference

```bash
# All scripts
DRY_RUN=true              # Preview only, không xoá

# resetAvatarMedia, resetAllMedia
KEEP_LEGACY=false         # Cũng xoá legacy avatar_url (default: true)

# resetPostMedia, resetAvatarMedia, resetAllMedia, cleanupImagekit
BATCH_SIZE=10             # Batch size (default: 10)

# cleanupImagekit
FOLDERS="avatars,posts"   # Comma-separated folders (default: avatars,posts)
```

---

## Notes

- **Deletion is irreversible** — always backup first
- **ImageKit files are permanent** — use DRY_RUN to preview
- **Performance** — large media sets may take several minutes
- **Orphaned cleanup** — safe to run regularly (referential integrity checked)
