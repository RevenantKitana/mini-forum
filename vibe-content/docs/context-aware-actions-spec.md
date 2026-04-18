# Context-Aware Actions Spec

## Scope
Áp dụng cho action **`comment`** và **`vote`** trong scheduler hiện tại (`ContentGeneratorService.executeComment`, `executeVote`).  
Action `post` không bị ảnh hưởng.

---

## "Đã xem bài" — định nghĩa

Bot được coi là đã đọc một bài trước khi hành động khi pipeline đã thu thập **`PostReadContext`** gồm:

| Field | Nguồn | Giới hạn token |
|---|---|---|
| `postId` | DB | — |
| `title` | `posts.title` | 150 chars |
| `body` | `posts.content` (fallback `excerpt`) | 400 chars |
| `tags` | `post_tags → tags.name` | tối đa 5 tags |
| `recentComments` | `comments` (status=VISIBLE, parent=null) | 5 comment × 150 chars |
| `sentimentHint` | Heuristic từ body + comments | `positive`/`negative`/`neutral` |

**Tổng token thêm vào prompt**: ≤ ~850 chars (không tính title/tags).

---

## Pipeline mới — comment

```
selectNextAction
  → gatherCommentContext
      → [NEW] getPostReadContext(postId)   ← bước "đọc bài"
  → buildCommentPrompt(context + postReadContext)
  → LLM
  → validate + quality
  → API
```

## Pipeline mới — vote

```
selectNextAction
  → gatherVoteContext
      → [NEW] getPostReadContext(postId)   ← bước "đọc bài"
  → buildVotePrompt(context + postReadContext)
  → LLM / random-voter path
  → API
```

---

## Timeout & Fallback

| Tình huống | Hành vi |
|---|---|
| `getPostReadContext` thành công | Tiếp tục bình thường với full context |
| `getPostReadContext` ném lỗi DB | Log warning, tiếp tục với `postReadContext: null` (degrade mode) |
| Post không tồn tại | Throw "No posts available" — action bị skip (behavior hiện tại) |

**Không skip toàn bộ action** khi context fetch lỗi, chỉ degrade: prompt vẫn có title/excerpt từ bước gather cũ.

---

## Cache ngắn hạn

- **TTL**: 5 phút (300 000 ms)  
- **Scope**: in-process Map (không shared, reset khi restart)  
- **Key**: `postId: number`  
- Mục đích: tránh gọi DB 2 lần khi cùng post xuất hiện trong batch cron

---

## Metric thành công

> **Tỷ lệ action có context >= 95%** (không tính hard DB outage hoặc post không tồn tại).

Được đo bằng log line `[context_aware]` xuất hiện trước mỗi `prompt_build`:
- `status: 'full'` — có PostReadContext đầy đủ  
- `status: 'degraded'` — postReadContext = null (fetch lỗi)  
- `status: 'skipped'` — không áp dụng (action type = post)

Target: `full / (full + degraded) >= 0.95` trong 24h rolling window.

---

## Input / Output schema

### Input: `PostReadContext`
```typescript
interface PostReadContext {
  postId: number;
  title: string;           // ≤ 150 chars
  body: string;            // ≤ 400 chars
  tags: string[];          // ≤ 5 items
  recentComments: Array<{
    authorName: string;
    content: string;       // ≤ 150 chars
  }>;                      // ≤ 5 items
  sentimentHint: 'positive' | 'negative' | 'neutral';
}
```

### Output (không đổi)
- `comment`: `{ content: string, explain?: string }`
- `vote`: `{ shouldVote: boolean, voteType: "up"|"down"|null, reason: string }`
