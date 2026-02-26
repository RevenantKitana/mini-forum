/**
 * ================================================================
 * COMPREHENSIVE SEED DATA — Mini Forum
 * ================================================================
 * Phủ toàn bộ các module cho manual testing:
 *   Users (12), Categories (7), Tags (15), Posts (20),
 *   Comments (35+), Votes (60+), Bookmarks (13),
 *   Notifications (20), Reports (10), Blocks (4), Audit Logs (18)
 * ================================================================
 * Run:  cd backend && npm run db:seed
 * ================================================================
 */

import {
  PrismaClient,
  Role,
  PostStatus,
  CommentStatus,
  VoteTarget,
  NotificationType,
  ReportTarget,
  ReportStatus,
  PinType,
  AuditAction,
  AuditTarget,
  PermissionLevel,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ─── Time helpers ───────────────────────────────────────────────
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000);

// ================================================================
// MAIN
// ================================================================
async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // ─────────────────────────────────────────────────────────────
  // CLEANUP  (respect FK order)
  // ─────────────────────────────────────────────────────────────
  console.log('🗑️  Cleaning existing data...');
  await prisma.audit_logs.deleteMany();
  await prisma.votes.deleteMany();
  await prisma.bookmarks.deleteMany();
  await prisma.notifications.deleteMany();
  await prisma.reports.deleteMany();
  await prisma.user_blocks.deleteMany();
  await prisma.comments.deleteMany();
  await prisma.post_tags.deleteMany();
  await prisma.posts.deleteMany();
  await prisma.tags.deleteMany();
  await prisma.categories.deleteMany();
  console.log('✅ Cleaned\n');

  // ─────────────────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────────────────
  console.log('👥 Creating users...');

  const [adminPwd, modPwd, memberPwd] = await Promise.all([
    bcrypt.hash('Admin@123', SALT_ROUNDS),
    bcrypt.hash('Moderator@123', SALT_ROUNDS),
    bcrypt.hash('Member@123', SALT_ROUNDS),
  ]);

  const admin = await prisma.users.upsert({
    where: { email: 'admin@forum.com' },
    update: {},
    create: {
      email: 'admin@forum.com',
      username: 'admin',
      password_hash: adminPwd,
      display_name: 'Administrator',
      role: Role.ADMIN,
      is_verified: true,
      is_active: true,
      reputation: 1000,
      bio: 'Quản trị viên diễn đàn — Managing the community since day one.',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      gender: 'male',
      created_at: daysAgo(180),
      last_active_at: hoursAgo(1),
    },
  });

  const mod = await prisma.users.upsert({
    where: { email: 'mod@forum.com' },
    update: {},
    create: {
      email: 'mod@forum.com',
      username: 'moderator',
      password_hash: modPwd,
      display_name: 'Community Mod',
      role: Role.MODERATOR,
      is_verified: true,
      is_active: true,
      reputation: 500,
      bio: 'Kiểm duyệt viên cộng đồng — Keeping things civil and helpful.',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mod',
      gender: 'female',
      created_at: daysAgo(150),
      last_active_at: hoursAgo(2),
    },
  });

  // 10 members với profile đa dạng
  const membersSpec = [
    {
      email: 'john@example.com', username: 'john',
      display_name: 'John Doe', gender: 'male', reputation: 150,
      bio: 'Full-stack developer yêu thích React và Node.js. Làm ở startup 3 năm.',
      days: 120, activeHours: 3, verified: true, active: true,
    },
    {
      email: 'alice@example.com', username: 'alice',
      display_name: 'Alice Nguyễn', gender: 'female', reputation: 280,
      bio: 'Frontend developer, đam mê UI/UX và TypeScript. Đang xây design system.',
      days: 100, activeHours: 5, verified: true, active: true,
    },
    {
      email: 'bob@example.com', username: 'bob',
      display_name: 'Bob Trần', gender: 'male', reputation: 95,
      bio: 'Backend engineer chuyên microservices. Fan của Clean Architecture.',
      days: 90, activeHours: 30, verified: true, active: true,
    },
    {
      email: 'carol@example.com', username: 'carol',
      display_name: 'Carol Lê', gender: 'female', reputation: 420,
      bio: 'Tech Lead tại startup Series A. Mentor cho junior devs trong team.',
      days: 85, activeHours: 8, verified: true, active: true,
    },
    {
      email: 'dave@example.com', username: 'dave',
      display_name: 'Dave Phạm', gender: 'male', reputation: 30,
      bio: 'Sinh viên năm 3 ngành CNTT. Đang học web full-stack, rất cần góp ý!',
      days: 15, activeHours: 10, verified: false, active: true,
    },
    {
      email: 'eve@example.com', username: 'eve',
      display_name: 'Eve Hoàng', gender: 'female', reputation: 175,
      bio: 'UI/UX Designer kiêm front-end developer. Figma addict ☕',
      days: 75, activeHours: 48, verified: true, active: true,
    },
    {
      email: 'frank@example.com', username: 'frank',
      display_name: 'Frank Vũ', gender: 'male', reputation: 88,
      bio: 'DevOps engineer. Docker, Kubernetes và CI/CD là niềm vui mỗi ngày.',
      days: 60, activeHours: 72, verified: true, active: true,
    },
    {
      email: 'grace@example.com', username: 'grace',
      display_name: 'Grace Đỗ', gender: 'female', reputation: 210,
      bio: 'Graphic designer chuyển sang lập trình 2 năm trước. Best decision ever!',
      days: 55, activeHours: 6, verified: true, active: true,
    },
    {
      // henry — BANNED user (is_active = false)
      email: 'henry@example.com', username: 'henry',
      display_name: 'Henry Bùi', gender: 'male', reputation: 45,
      bio: 'Tài khoản bị tạm khóa do vi phạm quy tắc cộng đồng.',
      days: 50, activeHours: 24 * 15, verified: true, active: false,
    },
    {
      // iris — tân binh chưa xác minh
      email: 'iris@example.com', username: 'iris',
      display_name: 'Iris Võ', gender: 'female', reputation: 5,
      bio: 'Mới vào, còn đang tìm hiểu cộng đồng 👋',
      days: 2, activeHours: 1, verified: false, active: true,
    },
  ];

  const createdMembers: Record<string, any> = {};
  for (const m of membersSpec) {
    const u = await prisma.users.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        username: m.username,
        password_hash: memberPwd,
        display_name: m.display_name,
        bio: m.bio,
        gender: m.gender,
        role: Role.MEMBER,
        is_verified: m.verified,
        is_active: m.active,
        reputation: m.reputation,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`,
        created_at: daysAgo(m.days),
        last_active_at: hoursAgo(m.activeHours),
      },
    });
    createdMembers[m.username] = u;
  }

  const { john, alice, bob, carol, dave, eve, frank, grace, henry, iris } = createdMembers;
  console.log(`✅ ${2 + Object.keys(createdMembers).length} users ready\n`);

  // ─────────────────────────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────────────────────────
  console.log('📁 Creating categories...');

  const [catGeneral, catProg, catDesign, catJobs, catLearn, catAnnounce, catMod] =
    await Promise.all([
      prisma.categories.create({
        data: {
          name: 'Thảo luận chung', slug: 'general',
          description: 'Nơi thảo luận mọi chủ đề không thuộc các mục chuyên biệt.',
          color: '#6366f1', sort_order: 1,
          view_permission: PermissionLevel.ALL,
          post_permission: PermissionLevel.MEMBER,
          comment_permission: PermissionLevel.MEMBER,
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Lập trình', slug: 'programming',
          description: 'Hỏi đáp, chia sẻ về code, framework, ngôn ngữ lập trình và kiến trúc phần mềm.',
          color: '#22c55e', sort_order: 2,
          view_permission: PermissionLevel.ALL,
          post_permission: PermissionLevel.MEMBER,
          comment_permission: PermissionLevel.MEMBER,
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Thiết kế UI/UX', slug: 'design',
          description: 'Chia sẻ về giao diện, trải nghiệm người dùng, Figma và CSS.',
          color: '#ec4899', sort_order: 3,
          view_permission: PermissionLevel.ALL,
          post_permission: PermissionLevel.MEMBER,
          comment_permission: PermissionLevel.MEMBER,
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Việc làm IT', slug: 'jobs',
          description: 'Tuyển dụng, chia sẻ kinh nghiệm phỏng vấn và review công ty.',
          color: '#f59e0b', sort_order: 4,
          view_permission: PermissionLevel.MEMBER,   // ← restricted: chỉ member mới xem
          post_permission: PermissionLevel.MEMBER,
          comment_permission: PermissionLevel.MEMBER,
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Học tập & Tài nguyên', slug: 'learning',
          description: 'Chia sẻ tài liệu, lộ trình học, sách hay và kinh nghiệm tự học.',
          color: '#06b6d4', sort_order: 5,
          view_permission: PermissionLevel.ALL,
          post_permission: PermissionLevel.MEMBER,
          comment_permission: PermissionLevel.MEMBER,
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Thông báo', slug: 'announcements',
          description: 'Thông báo chính thức từ ban quản trị diễn đàn.',
          color: '#ef4444', sort_order: 0,
          view_permission: PermissionLevel.ALL,
          post_permission: PermissionLevel.MODERATOR, // ← chỉ mod/admin mới đăng
          comment_permission: PermissionLevel.MEMBER,
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Khu vực Mod', slug: 'mod-zone',
          description: 'Nội bộ ban quản trị — không công khai.',
          color: '#8b5cf6', sort_order: 99,
          view_permission: PermissionLevel.MODERATOR, // ← restricted hoàn toàn
          post_permission: PermissionLevel.MODERATOR,
          comment_permission: PermissionLevel.MODERATOR,
        },
      }),
    ]);

  console.log('✅ 7 categories created\n');

  // ─────────────────────────────────────────────────────────────
  // TAGS
  // ─────────────────────────────────────────────────────────────
  console.log('🏷️  Creating tags...');

  const tagDefs = [
    { name: 'JavaScript', slug: 'javascript', usage: 45 },
    { name: 'TypeScript', slug: 'typescript', usage: 38 },
    { name: 'React', slug: 'react', usage: 52 },
    { name: 'Vue.js', slug: 'vuejs', usage: 25 },
    { name: 'Node.js', slug: 'nodejs', usage: 30 },
    { name: 'Python', slug: 'python', usage: 28 },
    { name: 'CSS', slug: 'css', usage: 33 },
    { name: 'HTML', slug: 'html', usage: 20 },
    { name: 'Next.js', slug: 'nextjs', usage: 22 },
    { name: 'Docker', slug: 'docker', usage: 18 },
    { name: 'Git', slug: 'git', usage: 24 },
    { name: 'Interview', slug: 'interview', usage: 15 },
    { name: 'Career', slug: 'career', usage: 20 },
    { name: 'Beginner', slug: 'beginner', usage: 40 },
    { name: 'Figma', slug: 'figma', usage: 14 },
  ];

  const createdTags = await Promise.all(
    tagDefs.map((t) =>
      prisma.tags.create({
        data: { name: t.name, slug: t.slug, usage_count: t.usage, is_active: true },
      })
    )
  );
  const T: Record<string, any> = {};
  tagDefs.forEach((t, i) => { T[t.slug] = createdTags[i]; });
  console.log(`✅ ${createdTags.length} tags created\n`);

  // ─────────────────────────────────────────────────────────────
  // POSTS
  // ─────────────────────────────────────────────────────────────
  console.log('📝 Creating posts...');

  type PostSpec = {
    title: string; slug: string; content: string; excerpt: string;
    author: any; category: any; tags: string[];
    status?: PostStatus; is_pinned?: boolean; pin_type?: PinType; pin_order?: number;
    is_locked?: boolean;
    upvote_count?: number; downvote_count?: number; comment_count?: number; view_count?: number;
    created_at?: Date;
  };

  const postSpecs: PostSpec[] = [
    // ── 1. GLOBAL PINNED ────────────────────────────────────────
    {
      title: '🎉 Chào mừng đến với Mini Forum!',
      slug: 'chao-mung-den-voi-mini-forum',
      content: `# Chào mừng bạn đến với Mini Forum! 🚀

Đây là nơi để cộng đồng developer Việt Nam cùng học hỏi, chia sẻ kiến thức và kết nối nhau.

## Bạn có thể làm gì ở đây?

- **Đặt câu hỏi** về bất kỳ vấn đề lập trình, thiết kế hay sự nghiệp
- **Chia sẻ kiến thức** và kinh nghiệm thực tế của bạn
- **Thảo luận** về công nghệ mới và xu hướng ngành
- **Tìm kiếm việc làm** hoặc đăng tuyển dụng (trong mục Việc làm IT)

## Quy tắc vàng

1. Tôn trọng nhau, dù không đồng ý
2. Tìm kiếm trước khi đặt câu hỏi
3. Đặt tiêu đề rõ ràng, cung cấp đủ thông tin
4. Không spam, không quảng cáo ngoài luồng

## Hãy bắt đầu nào!

Tạo bài viết đầu tiên và tự giới thiệu với cộng đồng! 👋`,
      excerpt: 'Nơi cộng đồng developer Việt Nam cùng học hỏi và chia sẻ. Đọc để biết mình có thể làm gì ở đây!',
      author: admin, category: catAnnounce,
      tags: ['beginner'],
      status: PostStatus.PUBLISHED, is_pinned: true, pin_type: PinType.GLOBAL, pin_order: 1,
      upvote_count: 87, downvote_count: 1, comment_count: 8, view_count: 1480,
      created_at: daysAgo(90),
    },

    // ── 2. CATEGORY PINNED + LOCKED ─────────────────────────────
    {
      title: 'Quy tắc đăng bài trong mục Lập trình',
      slug: 'quy-tac-dang-bai-trong-muc-lap-trinh',
      content: `# Quy tắc đăng bài — Mục Lập trình

> Vui lòng đọc kỹ trước khi đăng!

## 1. Tiêu đề phải rõ ràng

❌ "Help me", "Lỗi", "Không hiểu"
✅ "Lỗi TypeError khi dùng async/await với Prisma trong TypeScript"

## 2. Cung cấp đủ thông tin

Khi hỏi về lỗi, bắt buộc phải có:
- **Code đầy đủ** (hoặc phần liên quan)
- **Thông báo lỗi** (copy nguyên văn, không chụp ảnh)
- **Môi trường**: OS, Node version, framework version

## 3. Định dạng code đúng cách

\`\`\`javascript
// Dùng markdown code blocks
const example = 'như thế này';
\`\`\`

## 4. Tìm kiếm trước

Rất có thể câu hỏi đã được trả lời. Hãy search trước!`,
      excerpt: 'Quy tắc và hướng dẫn đăng bài đúng cách trong mục Lập trình',
      author: mod, category: catProg,
      tags: ['beginner'],
      status: PostStatus.PUBLISHED,
      is_pinned: true, pin_type: PinType.CATEGORY, pin_order: 1,
      is_locked: true,
      upvote_count: 44, downvote_count: 0, comment_count: 3, view_count: 720,
      created_at: daysAgo(75),
    },

    // ── 3 ───────────────────────────────────────────────────────
    {
      title: 'React useCallback và useMemo — Khi nào thực sự cần dùng?',
      slug: 'react-usecallback-usememo-khi-nao-can-dung',
      content: `# useCallback và useMemo — Đừng lạm dụng!

Thấy nhiều bạn wrap mọi thứ trong \`useCallback\`/\`useMemo\` khiến code phức tạp hơn mà không có lợi.

## useCallback

\`\`\`jsx
// ❌ Không cần thiết
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);

// ✅ Cần khi pass vào React.memo component
const handleSubmit = useCallback((data: FormData) => {
  onSubmit(data);
}, [onSubmit]);
\`\`\`

## useMemo

Chỉ dùng khi tính toán thực sự nặng:

\`\`\`jsx
const sortedItems = useMemo(
  () => items.sort((a, b) => b.score - a.score),
  [items]
);
\`\`\`

## Kết luận

**Quy tắc**: Đừng dùng nếu chưa thấy vấn đề performance thực sự.`,
      excerpt: 'Giải thích khi nào nên và không nên dùng useCallback/useMemo để tránh over-engineering',
      author: john, category: catProg,
      tags: ['react', 'javascript'],
      status: PostStatus.PUBLISHED,
      upvote_count: 29, downvote_count: 2, comment_count: 7, view_count: 310,
      created_at: daysAgo(28),
    },

    // ── 4 ───────────────────────────────────────────────────────
    {
      title: 'Vue 3 vs React 18 — Góc nhìn sau 4 năm dùng cả hai',
      slug: 'vue-3-vs-react-18-goc-nhin-sau-4-nam',
      content: `# Vue 3 vs React 18 — Không cần chọn "đúng", chỉ cần chọn phù hợp

## So sánh nhanh

| Tiêu chí | Vue 3 | React 18 |
|----------|:-----:|:--------:|
| Học dễ không | 🟢 Dễ | 🟡 Trung bình |
| TypeScript | 🟢 Tuyệt | 🟢 Tuyệt |
| Ecosystem | 🟡 Vừa | 🟢 Rất lớn |
| Job market VN | 🔴 Ít | 🟢 Nhiều |

## Kết luận

**Vue 3** phù hợp nếu bạn muốn bắt đầu dễ.
**React** phù hợp nếu bạn nhắm tới job market VN.`,
      excerpt: 'So sánh Vue 3 và React 18 thực tế từ người đã dùng cả hai trong dự án production',
      author: alice, category: catProg,
      tags: ['vuejs', 'react', 'javascript'],
      status: PostStatus.PUBLISHED,
      upvote_count: 48, downvote_count: 6, comment_count: 12, view_count: 540,
      created_at: daysAgo(20),
    },

    // ── 5 ───────────────────────────────────────────────────────
    {
      title: 'TypeScript strict mode — Có nên bật từ đầu không?',
      slug: 'typescript-strict-mode-co-nen-bat-tu-dau',
      content: `# TypeScript Strict Mode

## Strict mode bao gồm gì?

- \`strictNullChecks\`
- \`noImplicitAny\`
- \`strictFunctionTypes\`

## Câu trả lời

**Luôn luôn bật cho project mới.** Vất vả ban đầu nhưng ít bug về sau.

## Migrate codebase cũ

Bật từng flag một, đừng bật tất cả một lúc:

\`\`\`json
{
  "compilerOptions": {
    "strictNullChecks": true
  }
}
\`\`\``,
      excerpt: 'Mình suggest luôn bật strict mode cho TypeScript project mới. Đây là lý do.',
      author: bob, category: catProg,
      tags: ['typescript', 'javascript'],
      status: PostStatus.PUBLISHED,
      upvote_count: 21, downvote_count: 1, comment_count: 5, view_count: 200,
      created_at: daysAgo(16),
    },

    // ── 6 ───────────────────────────────────────────────────────
    {
      title: 'Lộ trình học Web Development 6 tháng từ zero',
      slug: 'lo-trinh-hoc-web-development-6-thang-tu-zero',
      content: `# Lộ trình 6 tháng học Web Development từ zero

## Tháng 1–2: Nền tảng
- HTML (1–2 tuần)
- CSS (2–3 tuần): Flexbox, Grid, responsive
- JavaScript cơ bản (3–4 tuần): DOM, events, async

## Tháng 3–4: Framework
- React hoặc Vue (chọn 1)
- Fetch API, async/await

## Tháng 5–6: Backend + Deploy
- Node.js + Express
- PostgreSQL cơ bản
- Deploy lên Vercel + Railway

> 💡 Làm dự án thực tế ngay từ tháng 2!`,
      excerpt: 'Lộ trình 6 tháng học full-stack web development từ zero đến có thể đi làm',
      author: carol, category: catLearn,
      tags: ['beginner', 'career', 'javascript'],
      status: PostStatus.PUBLISHED,
      upvote_count: 72, downvote_count: 3, comment_count: 16, view_count: 920,
      created_at: daysAgo(35),
    },

    // ── 7 ───────────────────────────────────────────────────────
    {
      title: 'CSS Grid Layout — Guide từ cơ bản đến responsive phức tạp',
      slug: 'css-grid-layout-guide-tu-co-ban-den-responsive',
      content: `# CSS Grid Layout — Complete Guide

## Setup cơ bản

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
\`\`\`

## Responsive không cần media query

\`\`\`css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
\`\`\`

## Named Grid Areas

\`\`\`css
.layout {
  display: grid;
  grid-template-areas:
    "header  header "
    "sidebar content"
    "footer  footer ";
}
\`\`\``,
      excerpt: 'Hướng dẫn đầy đủ CSS Grid từ cơ bản đến named areas và responsive nâng cao',
      author: grace, category: catDesign,
      tags: ['css', 'html', 'beginner'],
      status: PostStatus.PUBLISHED,
      upvote_count: 40, downvote_count: 1, comment_count: 6, view_count: 430,
      created_at: daysAgo(24),
    },

    // ── 8 ───────────────────────────────────────────────────────
    {
      title: 'Docker cho Web Developer — Setup dev environment trong 30 phút',
      slug: 'docker-cho-web-developer-setup-dev-30-phut',
      content: `# Docker cho Web Developer

Bao lần bạn nghe *"nó chạy trên máy tôi mà"*? Docker giải quyết đúng vấn đề đó.

## docker-compose.yml mẫu

\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/mydb
    depends_on: [db]
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
\`\`\`

## Dockerfile production-ready

\`\`\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
\`\`\``,
      excerpt: 'Setup Docker + docker-compose cho Web Dev từ dev đến production-ready.',
      author: frank, category: catProg,
      tags: ['docker', 'nodejs'],
      status: PostStatus.PUBLISHED,
      upvote_count: 35, downvote_count: 2, comment_count: 6, view_count: 375,
      created_at: daysAgo(22),
    },

    // ── 9 ───────────────────────────────────────────────────────
    {
      title: 'CV Template cho Fresher Developer — Đã pass nhiều vòng phỏng vấn',
      slug: 'cv-template-fresher-developer-pass-phong-van',
      content: `# CV Template cho Fresher Developer

## Cấu trúc CV

**1. Header**: Tên, Email, LinkedIn, GitHub, Portfolio

**2. Summary (2–3 câu)**:
> "Fresher với 1 năm kinh nghiệm side projects. Chuyên React + Node.js."

**3. Projects (Quan trọng nhất!)**

\`\`\`
📌 Mini Forum  [GitHub] [Demo]
   Tech: React, TypeScript, Node.js, PostgreSQL
   → Forum full-stack với auth, notifications
\`\`\`

**4. Skills**
- Proficient: React, TypeScript, CSS/Tailwind
- Familiar: Node.js, Docker

**5. Education**

Template Figma free trong comment! 🎁`,
      excerpt: 'Template CV fresher developer được kiểm chứng qua nhiều vòng tuyển dụng',
      author: eve, category: catJobs,
      tags: ['career', 'interview', 'beginner'],
      status: PostStatus.PUBLISHED,
      upvote_count: 75, downvote_count: 2, comment_count: 14, view_count: 780,
      created_at: daysAgo(30),
    },

    // ── 10 ──────────────────────────────────────────────────────
    {
      title: '[Tuyển dụng] Junior/Mid Frontend Developer — React + TypeScript',
      slug: 'tuyen-dung-junior-mid-frontend-developer-react-typescript',
      content: `# [Tuyển dụng] Frontend Developer tại TechVN Startup

## Vị trí Frontend Developer (Junior/Mid)

**Yêu cầu:**
- React ≥ 1 năm (Junior) / 2–3 năm (Mid)
- TypeScript, Tailwind CSS
- REST API cơ bản

**Quyền lợi:**
- 💰 12–18M (Junior), 20–30M (Mid)
- 🏠 Remote 2 ngày/tuần
- 💻 MacBook Pro
- 📚 Budget đào tạo 10M/năm

📧 Apply: careers@techvn-startup.io`,
      excerpt: 'Tuyển Frontend Developer React+TypeScript. Lương 12–30M. Remote 2 ngày. Apply ngay!',
      author: carol, category: catJobs,
      tags: ['react', 'typescript', 'career'],
      status: PostStatus.PUBLISHED,
      upvote_count: 24, downvote_count: 1, comment_count: 9, view_count: 450,
      created_at: daysAgo(12),
    },

    // ── 11 — post từ user bị ban ──────────────────────────────
    {
      title: 'Node.js async/await — Xử lý lỗi đúng cách',
      slug: 'nodejs-async-await-xu-ly-loi-dung-cach',
      content: `# Xử lý lỗi trong async/await Node.js

## try/catch pattern

\`\`\`typescript
async function getUserById(id: number) {
  try {
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundError(\`User \${id} not found\`);
    return user;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new InternalError('Database lookup failed');
  }
}
\`\`\`

## Utility wrapper

\`\`\`typescript
const to = <T>(p: Promise<T>) =>
  p.then(data => [null, data] as const)
   .catch(err => [err, null] as const);

const [err, user] = await to(getUserById(id));
if (err) return res.status(404).json({ message: err.message });
\`\`\``,
      excerpt: 'Hướng dẫn xử lý lỗi async/await đúng cách trong Node.js với TypeScript',
      author: henry, category: catProg,
      tags: ['nodejs', 'javascript', 'typescript'],
      status: PostStatus.PUBLISHED,
      upvote_count: 9, downvote_count: 1, comment_count: 3, view_count: 105,
      created_at: daysAgo(48),
    },

    // ── 12 ──────────────────────────────────────────────────────
    {
      title: 'Review sách Clean Code — Uncle Bob có còn đúng năm 2025?',
      slug: 'review-sach-clean-code-uncle-bob-2025',
      content: `# Review: Clean Code — Robert C. Martin

⭐⭐⭐⭐½ — Đọc ngay, nhưng áp dụng pragmatically.

## Timeless

\`\`\`javascript
// ❌ Bad
const d = 86400;
// ✅ Good
const SECONDS_PER_DAY = 86400;
\`\`\`

Functions làm một việc duy nhất. Comments không thay thế code rõ ràng.

## Cần critical thinking

- Nhiều ví dụ Java, style OOP không phù hợp mọi ngôn ngữ
- Quy tắc "function dưới 20 dòng" có thể quá cứng nhắc`,
      excerpt: 'Review chi tiết sách Clean Code năm 2025 — Cái gì vẫn hay và cái gì cần xem lại',
      author: eve, category: catLearn,
      tags: ['career', 'beginner'],
      status: PostStatus.PUBLISHED,
      upvote_count: 36, downvote_count: 3, comment_count: 7, view_count: 295,
      created_at: daysAgo(38),
    },

    // ── 13 — LOCKED ─────────────────────────────────────────────
    {
      title: 'Kinh nghiệm phỏng vấn Big Tech — Tips từ người đã pass',
      slug: 'kinh-nghiem-phong-van-big-tech-tips-da-pass',
      content: `# Kinh nghiệm phỏng vấn Big Tech

## Vòng Phone Screen (45 phút)

1–2 câu LeetCode Medium. Tips:
- Giải thích đang nghĩ gì (đừng im lặng code)
- Brute force trước, optimize sau

## Vòng System Design

Framework: Requirements → Estimation → Data model → High-level → Deep dive → Edge cases

## Behavioral

STAR method: Situation → Task → Action → Result

## Tài liệu

- LeetCode (~200 câu theo pattern)
- System Design Primer (GitHub free)`,
      excerpt: 'Tips phỏng vấn Big Tech từ người vừa pass — Coding, System Design, Behavioral',
      author: carol, category: catJobs,
      tags: ['interview', 'career'],
      status: PostStatus.PUBLISHED,
      is_locked: true,
      upvote_count: 58, downvote_count: 2, comment_count: 10, view_count: 670,
      created_at: daysAgo(42),
    },

    // ── 14 ──────────────────────────────────────────────────────
    {
      title: 'Next.js 15 — App Router và Server Components stable',
      slug: 'nextjs-15-app-router-server-components-stable',
      content: `# Next.js 15 — Tổng quan

## React Server Components (Stable)

\`\`\`tsx
export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await db.post.findUnique({ where: { id: Number(params.id) } });
  if (!post) notFound();
  return <PostDetail post={post} />;
}
\`\`\`

## Turbopack thay Webpack

Build speed ~76% nhanh hơn theo Vercel.

## Caching thay đổi

Fetch mặc định **không cache** trong Next.js 15:
\`\`\`typescript
fetch(url, { next: { revalidate: 3600 } });
\`\`\``,
      excerpt: 'Tổng quan Next.js 15: RSC stable, Turbopack và thay đổi caching quan trọng',
      author: alice, category: catProg,
      tags: ['nextjs', 'react', 'typescript'],
      status: PostStatus.PUBLISHED,
      upvote_count: 43, downvote_count: 3, comment_count: 9, view_count: 480,
      created_at: daysAgo(9),
    },

    // ── 15 ──────────────────────────────────────────────────────
    {
      title: 'Từ kế toán sang Developer sau 2 năm tự học — Câu chuyện thật',
      slug: 'tu-ke-toan-sang-developer-sau-2-nam-tu-hoc',
      content: `# Hành trình từ kế toán sang Software Developer

28 tuổi, không có background IT, mình quyết định học lập trình.

## 6 tháng đầu — Khổ thật sự

Học 2–3 tiếng mỗi tối sau giờ làm. Rất nhiều lần muốn bỏ.

## Bước ngoặt — Tháng thứ 8

Hoàn thành project đầu tiên: ứng dụng quản lý chi tiêu. Deploy lên Vercel.
Lần đầu thấy: **mình CÓ THỂ làm được**.

## Kết quả sau 24 tháng

✅ Junior Frontend Developer
✅ Lương cao hơn 40% so với kế toán cũ
✅ Đang học TypeScript và testing

**Không bao giờ là quá muộn. Bắt đầu thôi! 💪**`,
      excerpt: 'Câu chuyện thật: chuyển ngành từ kế toán sang developer sau 2 năm tự học ban đêm',
      author: dave, category: catLearn,
      tags: ['career', 'beginner'],
      status: PostStatus.PUBLISHED,
      upvote_count: 96, downvote_count: 4, comment_count: 20, view_count: 1150,
      created_at: daysAgo(6),
    },

    // ── 16 ──────────────────────────────────────────────────────
    {
      title: 'Figma tips cho Developer — Làm việc với Designer hiệu quả hơn',
      slug: 'figma-tips-cho-developer-lam-viec-voi-designer',
      content: `# Figma Tips cho Developer

## 1. Inspect Panel

\`Ctrl+D\` → xem CSS values, spacing, color tokens chính xác.

## 2. Variables → CSS Custom Properties

\`\`\`css
:root {
  --color-primary: #6366F1;  /* = Figma: Colors/Primary/500 */
  --space-4: 16px;           /* = Spacing/400 */
}
\`\`\`

## 3. Export Assets

Click layer → Inspect → Export (SVG cho icons, WebP cho images).

## 4. Components

Khi designer dùng Figma components với variants, map sang React components với props tương tự.`,
      excerpt: 'Những Figma tips giúp developer handoff với designer nhanh và chính xác hơn',
      author: grace, category: catDesign,
      tags: ['figma', 'css', 'career'],
      status: PostStatus.PUBLISHED,
      upvote_count: 27, downvote_count: 0, comment_count: 4, view_count: 230,
      created_at: daysAgo(13),
    },

    // ── 17 ──────────────────────────────────────────────────────
    {
      title: 'Git workflow cho team nhỏ — Gitflow vs Trunk-based',
      slug: 'git-workflow-cho-team-nho-gitflow-vs-trunk-based',
      content: `# Git Workflow cho Team Nhỏ

## Gitflow

\`\`\`
main → develop → feature/xxx
               → release/x.x
               → hotfix/xxx
\`\`\`
✅ Thích hợp: versioned releases, team lớn
❌ Nhược: merge conflicts nhiều

## Trunk-based Development

\`\`\`
main ← feature/xxx  (1–2 ngày, merge ngay)
     ← fix/bug      (vài giờ)
\`\`\`
✅ Thích hợp: web app, deploy daily

## Recommend

- Team < 5, web app → Trunk-based
- Team lớn, mobile → Gitflow`,
      excerpt: 'Gitflow hay Trunk-based? Kinh nghiệm thực tế và recommendation cho từng loại team',
      author: bob, category: catProg,
      tags: ['git', 'career'],
      status: PostStatus.PUBLISHED,
      upvote_count: 17, downvote_count: 1, comment_count: 4, view_count: 210,
      created_at: daysAgo(17),
    },

    // ── 18. DRAFT ────────────────────────────────────────────────
    {
      title: 'PostgreSQL Performance Tuning (DRAFT)',
      slug: 'postgresql-performance-tuning-draft',
      content: `# PostgreSQL Performance Tuning

*[DRAFT - chưa hoàn thiện]*

## TODO
- [ ] Index strategies (B-tree, GIN, GiST)
- [ ] EXPLAIN ANALYZE
- [ ] Connection pooling với pgBouncer`,
      excerpt: 'Hướng dẫn tối ưu hiệu suất PostgreSQL (đang viết)',
      author: john, category: catProg,
      tags: ['javascript'],
      status: PostStatus.DRAFT,
      upvote_count: 0, downvote_count: 0, comment_count: 0, view_count: 0,
      created_at: daysAgo(3),
    },

    // ── 19. HIDDEN ───────────────────────────────────────────────
    {
      title: 'Nội dung vi phạm quy tắc cộng đồng',
      slug: 'noi-dung-vi-pham-quy-tac-cong-dong',
      content: 'Nội dung này đã vi phạm quy tắc cộng đồng và bị ẩn bởi moderator.',
      excerpt: 'Bài viết vi phạm — bị ẩn',
      author: henry, category: catGeneral,
      tags: [],
      status: PostStatus.HIDDEN,
      upvote_count: 1, downvote_count: 9, comment_count: 1, view_count: 35,
      created_at: daysAgo(22),
    },

    // ── 20. Tân binh ─────────────────────────────────────────────
    {
      title: 'Xin chào cộng đồng! Mình là tân binh muốn học lập trình 👋',
      slug: 'xin-chao-cong-dong-tan-binh-muon-hoc-lap-trinh',
      content: `# Xin chào mọi người! 👋

Mình là Iris, vừa tham gia hôm nay.

## Về mình

- 23 tuổi, nhân viên văn phòng
- Muốn học lập trình để chuyển ngành

## Câu hỏi của mình

1. Nên học HTML/CSS trước hay JavaScript luôn?
2. Free resources có đủ không hay cần trả phí?
3. Mất bao lâu để có thể kiếm được việc?

Cảm ơn mọi người! 💪`,
      excerpt: 'Tự giới thiệu từ tân binh muốn chuyển ngành sang lập trình — Cần lời khuyên!',
      author: iris, category: catGeneral,
      tags: ['beginner', 'career'],
      status: PostStatus.PUBLISHED,
      upvote_count: 14, downvote_count: 0, comment_count: 8, view_count: 95,
      created_at: daysAgo(1),
    },
  ];

  const P: any[] = [];
  for (const spec of postSpecs) {
    const { author, category, tags: postTagSlugs, ...fields } = spec;
    const post = await prisma.posts.create({
      data: {
        title: fields.title,
        slug: fields.slug,
        content: fields.content,
        excerpt: fields.excerpt,
        author_id: author.id,
        category_id: category.id,
        status: fields.status ?? PostStatus.PUBLISHED,
        is_pinned: fields.is_pinned ?? false,
        pin_type: fields.pin_type ?? null,
        pin_order: fields.pin_order ?? 0,
        is_locked: fields.is_locked ?? false,
        upvote_count: fields.upvote_count ?? 0,
        downvote_count: fields.downvote_count ?? 0,
        comment_count: fields.comment_count ?? 0,
        view_count: fields.view_count ?? 0,
        created_at: fields.created_at ?? daysAgo(7),
      },
    });
    P.push(post);

    if (postTagSlugs.length > 0) {
      await prisma.post_tags.createMany({
        data: postTagSlugs.map((slug) => ({ post_id: post.id, tag_id: T[slug].id })),
        skipDuplicates: true,
      });
    }
  }

  const [
    pWelcome, pRules, pReactHooks, pVueVsReact, pTsStrict,
    pRoadmap, pCssGrid, pDocker, pCvTemplate, pJobPost,
    pNodeAsync, pCleanCode, pInterviewTips, pNextjs15, pCareerChange,
    pFigmaTips, pGitWorkflow, pPgDraft, pHiddenPost, pIrisIntro,
  ] = P;

  console.log(`✅ ${P.length} posts created\n`);

  // ─────────────────────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────────────────────
  console.log('💬 Creating comments...');

  const mkComment = async (data: {
    content: string; author: any; post: any;
    parent?: any; quotedComment?: any;
    isEdited?: boolean; isMasked?: boolean;
    status?: CommentStatus; created?: Date;
  }) => {
    return prisma.comments.create({
      data: {
        content: data.content,
        author_id: data.author.id,
        post_id: data.post.id,
        parent_id: data.parent?.id ?? null,
        quoted_comment_id: data.quotedComment?.id ?? null,
        is_edited: data.isEdited ?? false,
        is_content_masked: data.isMasked ?? false,
        status: data.status ?? CommentStatus.VISIBLE,
        created_at: data.created ?? daysAgo(Math.floor(Math.random() * 14) + 1),
      },
    });
  };

  // ── pWelcome ─────────────────────────────────────────────────
  const c1 = await mkComment({ content: 'Diễn đàn trông rất xịn! Mình vừa đăng ký xong 🎉', author: iris, post: pWelcome, created: daysAgo(2) });
  await mkComment({ content: 'Chào mừng @iris! Cứ hỏi thoải mái nhé, cộng đồng ở đây rất thân thiện.', author: carol, post: pWelcome, parent: c1, created: daysAgo(2) });
  const c3 = await mkComment({ content: 'Mình dùng forum này 3 tháng rồi, học được rất nhiều. Highly recommend!', author: alice, post: pWelcome, created: daysAgo(45) });
  await mkComment({ content: 'Đồng ý! Đặc biệt mục Lập trình rất chất lượng.', author: bob, post: pWelcome, parent: c3, created: daysAgo(44) });

  // ── pReactHooks ──────────────────────────────────────────────
  const c5 = await mkComment({ content: 'Bài viết hay! Mình cũng từng wrap useCallback vào mọi thứ khi mới học React 😅', author: alice, post: pReactHooks, created: daysAgo(26) });
  const c6 = await mkComment({ content: 'Thêm một case: khi dùng làm dependency của useEffect để tránh infinite loop.', author: carol, post: pReactHooks, created: daysAgo(25) });
  await mkComment({
    content: `> ${c6.content.substring(0, 60)}...\n\nĐúng! Trường hợp này hay bị quên lắm. Cảm ơn đã bổ sung!`,
    author: john, post: pReactHooks, parent: c6, quotedComment: c6, created: daysAgo(24), isEdited: true,
  });
  await mkComment({ content: 'Có tool nào detect useCallback dùng đúng chỗ không nhỉ?', author: dave, post: pReactHooks, created: daysAgo(23) });
  await mkComment({ content: 'React DevTools Profiler! Tab "Why did this render?" rất hữu ích.', author: alice, post: pReactHooks, parent: c5, created: daysAgo(22) });

  // ── pVueVsReact ──────────────────────────────────────────────
  const c10 = await mkComment({ content: 'Mình đồng ý. Tại HCM, React chiếm ~70-75% job listing frontend.', author: frank, post: pVueVsReact, created: daysAgo(18) });
  await mkComment({ content: 'Lúc mới học mình chọn Vue 3 vì dễ. Xong đi tìm việc thì phải học React anyway 😅', author: dave, post: pVueVsReact, parent: c10, created: daysAgo(17) });
  await mkComment({ content: 'Biết Vue/React rồi thì học cái còn lại chỉ mất 1-2 tuần. Core concepts giống nhau.', author: alice, post: pVueVsReact, created: daysAgo(16), isEdited: true });

  // ── pRoadmap ─────────────────────────────────────────────────
  const c13 = await mkComment({ content: 'Lộ trình rất rõ ràng! Mình đang ở tháng 2, CSS khó hơn mình nghĩ nhiều!', author: iris, post: pRoadmap, created: daysAgo(4) });
  await mkComment({ content: 'Flexbox trông khó nhưng làm 5-6 layout thực tế là tự nhiên nắm được. Build nhiều thôi! 💪', author: carol, post: pRoadmap, parent: c13, created: daysAgo(3) });
  await mkComment({ content: 'Sau HTML/CSS, hãy clone 1-2 website thực (Facebook, Google) trước khi học JS. Giúp nhiều lắm!', author: grace, post: pRoadmap, created: daysAgo(20) });

  // ── pCvTemplate ──────────────────────────────────────────────
  const c16 = await mkComment({ content: 'Template Figma ở đâu vậy bạn? Không thấy link trong bài.', author: dave, post: pCvTemplate, created: daysAgo(28) });
  await mkComment({ content: 'Link Figma: https://figma.com/community/file/example-cv-template (Mình sẽ update vào bài sau!)', author: eve, post: pCvTemplate, parent: c16, created: daysAgo(27) });
  await mkComment({ content: 'Đồng ý về phần Projects. Nhà tuyển dụng muốn thấy dẫn chứng thực tế, không phải list skills.', author: carol, post: pCvTemplate, created: daysAgo(25) });

  // ── pJobPost ─────────────────────────────────────────────────
  await mkComment({ content: 'Công ty có remote option không hay chỉ 2 ngày như JD?', author: bob, post: pJobPost, created: daysAgo(10) });
  await mkComment({ content: 'Mình apply Junior position rồi! Đang chờ feedback 🤞', author: dave, post: pJobPost, created: daysAgo(9) });
  await mkComment({ content: 'Lương có negotiable không? Mình có 2 năm exp chủ yếu side projects.', author: iris, post: pJobPost, created: hoursAgo(5) });

  // ── pCareerChange ────────────────────────────────────────────
  const c22 = await mkComment({ content: 'Câu chuyện của bạn giống mình! Mình cũng 27 tuổi đang làm kế toán, mới học 3 tháng.', author: iris, post: pCareerChange, created: hoursAgo(8) });
  await mkComment({ content: 'Cố lên @iris! Tháng 1-4 là khó nhất, sau đó mọi thứ sẽ click. Key là đừng so sánh với người khác!', author: dave, post: pCareerChange, parent: c22, created: hoursAgo(6) });
  await mkComment({ content: 'Mình chuyển ngành sau 30 tuổi. 2 năm sau đang làm Senior dev rồi. Hoàn toàn xứng đáng!', author: carol, post: pCareerChange, created: daysAgo(5) });
  await mkComment({ content: '"Khó nhất không phải kỹ thuật mà là kiên trì qua 6 tháng đầu" — Rất đúng!', author: grace, post: pCareerChange, created: daysAgo(4), isEdited: true });

  // ── pIrisIntro ───────────────────────────────────────────────
  await mkComment({ content: 'Chào Iris! Học HTML/CSS trước đi, rồi mới JS. Nền tảng quan trọng lắm!', author: carol, post: pIrisIntro, created: hoursAgo(20) });
  await mkComment({ content: 'Free resources là đủ để bắt đầu: javascript.info, css-tricks.com, The Odin Project.', author: alice, post: pIrisIntro, created: hoursAgo(18) });
  await mkComment({ content: 'Học 2-3 tiếng/ngày thì ~12 tháng có thể apply Junior. Đừng nản!', author: john, post: pIrisIntro, created: hoursAgo(15) });

  // ── Comment vi phạm (masked) ──────────────────────────────
  const cMasked = await mkComment({
    content: '[Nội dung bị ẩn — vi phạm quy tắc: spam/quảng cáo]',
    author: henry, post: pRoadmap,
    isMasked: true, status: CommentStatus.HIDDEN,
    created: daysAgo(31),
  });

  console.log('✅ Comments created\n');

  // ─────────────────────────────────────────────────────────────
  // VOTES
  // ─────────────────────────────────────────────────────────────
  console.log('👍 Creating votes...');

  const now = new Date();
  const voteData: Array<{ userId: number; targetType: VoteTarget; targetId: number; value: number; daysBack: number }> = [];

  const pv = (user: any, post: any, val: number, d: number) => {
    if (user.id === post.author_id) return;
    voteData.push({ userId: user.id, targetType: VoteTarget.POST, targetId: post.id, value: val, daysBack: d });
  };
  const cv = (user: any, comment: any, val: number, d: number) => {
    if (user.id === comment.author_id) return;
    voteData.push({ userId: user.id, targetType: VoteTarget.COMMENT, targetId: comment.id, value: val, daysBack: d });
  };

  // Post votes
  [alice, bob, carol, frank, grace, iris].forEach(u => pv(u, pWelcome, 1, 85));
  [eve, mod].forEach(u => pv(u, pWelcome, 1, 80));
  pv(henry, pWelcome, -1, 70);

  [alice, carol, grace, eve, iris].forEach(u => pv(u, pRules, 1, 73));
  pv(henry, pRules, -1, 65);

  [alice, carol, frank, grace, bob].forEach(u => pv(u, pReactHooks, 1, 27));
  pv(henry, pReactHooks, -1, 25); pv(dave, pReactHooks, 1, 24);

  [john, carol, frank, dave, bob, iris, mod].forEach(u => pv(u, pVueVsReact, 1, 19));
  [henry, grace].forEach(u => pv(u, pVueVsReact, -1, 18));

  [alice, carol, frank, grace, john].forEach(u => pv(u, pTsStrict, 1, 15));
  pv(dave, pTsStrict, -1, 14);

  [john, alice, bob, frank, iris, dave, mod].forEach(u => pv(u, pRoadmap, 1, 34));
  pv(henry, pRoadmap, -1, 30);

  [john, carol, alice, iris, dave, bob].forEach(u => pv(u, pCssGrid, 1, 23));
  pv(henry, pCssGrid, -1, 22);

  [alice, carol, john, iris].forEach(u => pv(u, pDocker, 1, 21));
  pv(henry, pDocker, -1, 20);

  [john, alice, carol, dave, bob, mod, frank].forEach(u => pv(u, pCvTemplate, 1, 29));
  pv(henry, pCvTemplate, -1, 28);

  [john, alice, bob, frank].forEach(u => pv(u, pJobPost, 1, 11));
  pv(henry, pJobPost, -1, 10);

  [alice, carol, grace].forEach(u => pv(u, pNodeAsync, 1, 46));
  pv(frank, pNodeAsync, -1, 45);

  [john, alice, carol, frank, iris].forEach(u => pv(u, pCleanCode, 1, 37));
  [bob, henry, dave].forEach(u => pv(u, pCleanCode, -1, 35));

  [john, alice, bob, iris, dave, frank, mod].forEach(u => pv(u, pInterviewTips, 1, 41));
  pv(grace, pInterviewTips, -1, 40);

  [john, bob, carol, grace, iris, frank].forEach(u => pv(u, pNextjs15, 1, 8));
  pv(dave, pNextjs15, -1, 7);

  [alice, carol, frank, grace, mod, bob, john, iris].forEach(u => pv(u, pCareerChange, 1, 5));
  [henry, eve].forEach(u => pv(u, pCareerChange, -1, 4));

  [john, carol, dave, alice].forEach(u => pv(u, pFigmaTips, 1, 12));
  [john, alice, carol].forEach(u => pv(u, pGitWorkflow, 1, 16));
  pv(frank, pGitWorkflow, -1, 15);

  [alice, carol, frank, grace, bob, mod, eve, john].forEach(u => pv(u, pIrisIntro, 1, 1));

  // Comment votes
  cv(alice, c1, 1, 2); cv(carol, c1, 1, 2); cv(john, c3, 1, 44);
  cv(bob, c5, 1, 25); cv(dave, c5, 1, 24);
  cv(john, c6, 1, 24); cv(alice, c6, 1, 23);
  cv(john, c10, 1, 17); cv(carol, c10, 1, 16);
  cv(alice, c13, 1, 3); cv(bob, c13, 1, 3);
  cv(carol, c16, 1, 27); cv(alice, c22, 1, 7);

  for (const v of voteData) {
    const ts = new Date(now.getTime() - v.daysBack * 86_400_000);
    await prisma.votes.upsert({
      where: { userId_targetType_targetId: { userId: v.userId, targetType: v.targetType, targetId: v.targetId } },
      update: {},
      create: { userId: v.userId, targetType: v.targetType, targetId: v.targetId, value: v.value, createdAt: ts, updatedAt: ts },
    });
  }

  console.log(`✅ ${voteData.length} votes created\n`);

  // ─────────────────────────────────────────────────────────────
  // BOOKMARKS
  // ─────────────────────────────────────────────────────────────
  console.log('🔖 Creating bookmarks...');

  const bookmarkData = [
    { userId: john.id, postId: pRoadmap.id, created: daysAgo(32) },
    { userId: john.id, postId: pCvTemplate.id, created: daysAgo(28) },
    { userId: john.id, postId: pInterviewTips.id, created: daysAgo(40) },
    { userId: alice.id, postId: pReactHooks.id, created: daysAgo(25) },
    { userId: alice.id, postId: pNextjs15.id, created: daysAgo(8) },
    { userId: dave.id, postId: pRoadmap.id, created: daysAgo(10) },
    { userId: dave.id, postId: pCareerChange.id, created: daysAgo(5) },
    { userId: dave.id, postId: pCvTemplate.id, created: daysAgo(4) },
    { userId: bob.id, postId: pTsStrict.id, created: daysAgo(14) },
    { userId: bob.id, postId: pGitWorkflow.id, created: daysAgo(16) },
    { userId: grace.id, postId: pCssGrid.id, created: daysAgo(22) },
    { userId: iris.id, postId: pRoadmap.id, created: daysAgo(1) },
    { userId: iris.id, postId: pCareerChange.id, created: hoursAgo(10) },
  ];

  await prisma.bookmarks.createMany({
    data: bookmarkData.map(b => ({ userId: b.userId, postId: b.postId, createdAt: b.created })),
    skipDuplicates: true,
  });

  console.log(`✅ ${bookmarkData.length} bookmarks created\n`);

  // ─────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────
  console.log('🔔 Creating notifications...');

  const notifData = [
    { userId: john.id, type: NotificationType.COMMENT, title: 'Alice đã comment bài viết của bạn', content: 'Alice bình luận vào "React useCallback và useMemo"', relatedId: pReactHooks.id, relatedType: 'post', isRead: true, created: daysAgo(26) },
    { userId: john.id, type: NotificationType.UPVOTE, title: 'Bài viết được upvote', content: '"React useCallback và useMemo" nhận thêm upvote', relatedId: pReactHooks.id, relatedType: 'post', isRead: false, created: daysAgo(24) },
    { userId: john.id, type: NotificationType.UPVOTE, title: 'Bài viết được upvote', content: '"React useCallback và useMemo" nhận thêm upvote', relatedId: pReactHooks.id, relatedType: 'post', isRead: false, created: daysAgo(23) },

    { userId: alice.id, type: NotificationType.COMMENT, title: 'John đã comment bài viết của bạn', content: 'John bình luận trong "Vue 3 vs React 18"', relatedId: pVueVsReact.id, relatedType: 'post', isRead: true, created: daysAgo(16) },
    { userId: alice.id, type: NotificationType.REPLY, title: 'Carol reply comment của bạn', content: 'Carol trả lời comment trong "Lộ trình học Web"', relatedId: pRoadmap.id, relatedType: 'post', isRead: false, created: daysAgo(3) },
    { userId: alice.id, type: NotificationType.UPVOTE, title: 'Bài viết được upvote', content: '"Next.js 15" nhận thêm upvote', relatedId: pNextjs15.id, relatedType: 'post', isRead: false, created: daysAgo(7) },

    { userId: carol.id, type: NotificationType.COMMENT, title: 'Iris comment bài tuyển dụng của bạn', content: 'Iris hỏi về compensation trong bài tuyển dụng', relatedId: pJobPost.id, relatedType: 'post', isRead: false, created: hoursAgo(5) },
    { userId: carol.id, type: NotificationType.UPVOTE, title: 'Bài viết được upvote', content: '"Lộ trình học Web" nhận upvote mới', relatedId: pRoadmap.id, relatedType: 'post', isRead: true, created: daysAgo(15) },

    { userId: dave.id, type: NotificationType.REPLY, title: 'Carol reply comment của bạn', content: 'Carol trả lời bạn trong bài chào mừng', relatedId: pWelcome.id, relatedType: 'post', isRead: false, created: daysAgo(2) },
    { userId: dave.id, type: NotificationType.COMMENT, title: 'Alice comment bài viết của bạn', content: 'Alice bình luận vào bài chuyển ngành của bạn', relatedId: pCareerChange.id, relatedType: 'post', isRead: false, created: hoursAgo(7) },
    { userId: dave.id, type: NotificationType.UPVOTE, title: 'Bài viết trending!', content: '"Từ kế toán sang Developer" nhận 50+ upvotes!', relatedId: pCareerChange.id, relatedType: 'post', isRead: false, created: daysAgo(4) },

    { userId: eve.id, type: NotificationType.COMMENT, title: 'Carol comment bài viết của bạn', content: 'Carol nhận xét về CV Template post', relatedId: pCvTemplate.id, relatedType: 'post', isRead: true, created: daysAgo(25) },
    { userId: eve.id, type: NotificationType.UPVOTE, title: 'Bài viết trending', content: '"CV Template cho Fresher" đang trending!', relatedId: pCvTemplate.id, relatedType: 'post', isRead: true, created: daysAgo(20) },

    { userId: iris.id, type: NotificationType.SYSTEM, title: 'Chào mừng đến với Mini Forum!', content: 'Tài khoản đã được tạo thành công. Hãy giới thiệu bản thân!', relatedId: null, relatedType: null, isRead: false, created: daysAgo(2) },
    { userId: iris.id, type: NotificationType.COMMENT, title: 'Carol trả lời bạn', content: 'Carol Lê trả lời comment của bạn trong bài lộ trình học', relatedId: pRoadmap.id, relatedType: 'post', isRead: false, created: daysAgo(3) },
    { userId: iris.id, type: NotificationType.UPVOTE, title: 'Bài viết đầu tiên được upvote!', content: '"Xin chào cộng đồng" nhận 5+ upvotes!', relatedId: pIrisIntro.id, relatedType: 'post', isRead: false, created: hoursAgo(12) },

    { userId: henry.id, type: NotificationType.SYSTEM, title: 'Tài khoản bị tạm khóa', content: 'Tài khoản bị khóa do vi phạm quy tắc. Liên hệ admin để khiếu nại.', relatedId: null, relatedType: null, isRead: false, created: daysAgo(14) },

    { userId: bob.id, type: NotificationType.REPLY, title: 'Alice reply comment của bạn', content: 'Alice trả lời trong "Vue 3 vs React 18"', relatedId: pVueVsReact.id, relatedType: 'post', isRead: true, created: daysAgo(15) },
    { userId: bob.id, type: NotificationType.UPVOTE, title: 'Bài viết được upvote', content: '"TypeScript strict mode" nhận upvote mới', relatedId: pTsStrict.id, relatedType: 'post', isRead: false, created: daysAgo(12) },
  ];

  await prisma.notifications.createMany({
    data: notifData.map(n => ({
      userId: n.userId, type: n.type, title: n.title, content: n.content,
      relatedId: n.relatedId ?? null, relatedType: n.relatedType ?? null,
      isRead: n.isRead, createdAt: n.created,
    })),
  });

  console.log(`✅ ${notifData.length} notifications created\n`);

  // ─────────────────────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────────────────────
  console.log('🚨 Creating reports...');

  const reportDefs = [
    { reporter: john, type: ReportTarget.POST, targetId: pHiddenPost.id, reason: 'spam', desc: 'Bài viết spam, không liên quan', status: ReportStatus.RESOLVED, reviewer: mod, reviewedAt: daysAgo(20), note: 'Đã xác nhận vi phạm, bài bị ẩn.', created: daysAgo(22) },
    { reporter: alice, type: ReportTarget.POST, targetId: pHiddenPost.id, reason: 'inappropriate', desc: 'Nội dung không phù hợp, chứa ngôn từ xúc phạm.', status: ReportStatus.RESOLVED, reviewer: mod, reviewedAt: daysAgo(21), note: 'Đã xử lý.', created: daysAgo(22) },
    { reporter: carol, type: ReportTarget.POST, targetId: pNodeAsync.id, reason: 'misinformation', desc: 'Có thông tin kỹ thuật không chính xác.', status: ReportStatus.REVIEWING, reviewer: mod, reviewedAt: daysAgo(5), note: null, created: daysAgo(7) },
    { reporter: frank, type: ReportTarget.POST, targetId: pJobPost.id, reason: 'spam', desc: 'Thông tin lương không thực tế, nghi lừa đảo.', status: ReportStatus.PENDING, reviewer: null, reviewedAt: null, note: null, created: daysAgo(3) },
    { reporter: grace, type: ReportTarget.POST, targetId: pInterviewTips.id, reason: 'spam', desc: 'Bài chứa link affiliate không phép.', status: ReportStatus.DISMISSED, reviewer: admin, reviewedAt: daysAgo(38), note: 'Kiểm tra không thấy vi phạm, dismiss.', created: daysAgo(40) },
    { reporter: alice, type: ReportTarget.COMMENT, targetId: cMasked.id, reason: 'spam', desc: 'Comment quảng cáo không liên quan.', status: ReportStatus.RESOLVED, reviewer: mod, reviewedAt: daysAgo(29), note: 'Comment đã bị mask và ẩn.', created: daysAgo(31) },
    { reporter: bob, type: ReportTarget.COMMENT, targetId: c1.id, reason: 'off-topic', desc: 'Comment không liên quan đến bài.', status: ReportStatus.DISMISSED, reviewer: mod, reviewedAt: daysAgo(1), note: 'Comment hợp lệ.', created: daysAgo(2) },
    { reporter: carol, type: ReportTarget.COMMENT, targetId: c10.id, reason: 'misinformation', desc: 'Thống kê 70-75% không có nguồn.', status: ReportStatus.PENDING, reviewer: null, reviewedAt: null, note: null, created: daysAgo(1) },
    { reporter: alice, type: ReportTarget.USER, targetId: henry.id, reason: 'harassment', desc: 'User liên tục để comments xúc phạm.', status: ReportStatus.RESOLVED, reviewer: admin, reviewedAt: daysAgo(14), note: 'Đã xác nhận, tài khoản bị khóa.', created: daysAgo(15) },
    { reporter: john, type: ReportTarget.USER, targetId: henry.id, reason: 'spam', desc: 'User spam nhiều comments không liên quan.', status: ReportStatus.RESOLVED, reviewer: admin, reviewedAt: daysAgo(14), note: 'Đã xử lý.', created: daysAgo(16) },
  ];

  for (const r of reportDefs) {
    await prisma.reports.create({
      data: {
        reporterId: r.reporter.id, targetType: r.type, targetId: r.targetId,
        reason: r.reason, description: r.desc,
        status: r.status, reviewedBy: r.reviewer?.id ?? null,
        reviewedAt: r.reviewedAt, reviewNote: r.note,
        createdAt: r.created, updatedAt: r.reviewedAt ?? r.created,
      },
    });
  }

  console.log(`✅ ${reportDefs.length} reports created\n`);

  // ─────────────────────────────────────────────────────────────
  // USER BLOCKS
  // ─────────────────────────────────────────────────────────────
  console.log('🚫 Creating user blocks...');

  await prisma.user_blocks.createMany({
    data: [
      { blockerId: john.id,  blockedId: henry.id, createdAt: daysAgo(30) },
      { blockerId: alice.id, blockedId: henry.id, createdAt: daysAgo(25) },
      { blockerId: carol.id, blockedId: henry.id, createdAt: daysAgo(20) },
      { blockerId: dave.id,  blockedId: frank.id, createdAt: daysAgo(5) }, // để test unblock
    ],
    skipDuplicates: true,
  });

  console.log('✅ 4 user blocks created\n');

  // ─────────────────────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────────────────────
  console.log('📋 Creating audit logs...');

  const auditEntries = [
    { userId: admin.id, action: AuditAction.PIN, targetType: AuditTarget.POST, targetId: pWelcome.id, targetName: pWelcome.title, old: null, nw: 'GLOBAL', created: daysAgo(90) },
    { userId: admin.id, action: AuditAction.ROLE_CHANGE, targetType: AuditTarget.USER, targetId: mod.id, targetName: mod.username, old: 'MEMBER', nw: 'MODERATOR', created: daysAgo(150) },
    { userId: admin.id, action: AuditAction.UPDATE, targetType: AuditTarget.CATEGORY, targetId: catJobs.id, targetName: catJobs.name, old: '{"viewPermission":"ALL"}', nw: '{"viewPermission":"MEMBER"}', created: daysAgo(60) },
    { userId: admin.id, action: AuditAction.BAN, targetType: AuditTarget.USER, targetId: henry.id, targetName: henry.username, old: 'ACTIVE', nw: 'BANNED', created: daysAgo(14) },
    { userId: admin.id, action: AuditAction.CREATE, targetType: AuditTarget.CATEGORY, targetId: catMod.id, targetName: catMod.name, old: null, nw: '{"name":"Khu vực Mod"}', created: daysAgo(150) },
    { userId: admin.id, action: AuditAction.VIEW_MASKED_CONTENT, targetType: AuditTarget.COMMENT, targetId: cMasked.id, targetName: 'Masked comment', old: null, nw: null, created: daysAgo(28) },
    { userId: admin.id, action: AuditAction.LOGIN, targetType: AuditTarget.USER, targetId: admin.id, targetName: admin.username, old: null, nw: null, created: hoursAgo(2) },

    { userId: mod.id, action: AuditAction.PIN, targetType: AuditTarget.POST, targetId: pRules.id, targetName: pRules.title, old: null, nw: 'CATEGORY', created: daysAgo(74) },
    { userId: mod.id, action: AuditAction.LOCK, targetType: AuditTarget.POST, targetId: pRules.id, targetName: pRules.title, old: 'unlocked', nw: 'locked', created: daysAgo(74) },
    { userId: mod.id, action: AuditAction.LOCK, targetType: AuditTarget.POST, targetId: pInterviewTips.id, targetName: pInterviewTips.title, old: 'unlocked', nw: 'locked', created: daysAgo(41) },
    { userId: mod.id, action: AuditAction.HIDE, targetType: AuditTarget.POST, targetId: pHiddenPost.id, targetName: pHiddenPost.title, old: 'PUBLISHED', nw: 'HIDDEN', created: daysAgo(21) },
    { userId: mod.id, action: AuditAction.HIDE, targetType: AuditTarget.COMMENT, targetId: cMasked.id, targetName: 'Comment vi phạm', old: 'VISIBLE', nw: 'HIDDEN', created: daysAgo(30) },
    { userId: mod.id, action: AuditAction.CREATE, targetType: AuditTarget.TAG, targetId: T['figma'].id, targetName: 'Figma', old: null, nw: '{"name":"Figma"}', created: daysAgo(70) },
    { userId: mod.id, action: AuditAction.UPDATE, targetType: AuditTarget.REPORT, targetId: 1, targetName: 'Report #1', old: 'PENDING', nw: 'RESOLVED', created: daysAgo(20) },
    { userId: mod.id, action: AuditAction.LOGIN, targetType: AuditTarget.USER, targetId: mod.id, targetName: mod.username, old: null, nw: null, created: hoursAgo(3) },
  ];

  await prisma.audit_logs.createMany({
    data: auditEntries.map(e => ({
      user_id: e.userId,
      action: e.action,
      targetType: e.targetType,
      target_id: e.targetId ?? null,
      target_name: e.targetName ?? null,
      old_value: e.old ?? null,
      new_value: e.nw ?? null,
      ip_address: '127.0.0.1',
      user_agent: 'Seed Script',
      created_at: e.created,
    })),
  });

  console.log(`✅ ${auditEntries.length} audit logs created\n`);

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('═'.repeat(60));
  console.log('🎉 COMPREHENSIVE SEED COMPLETED!\n');

  console.log('👥 Test Accounts:');
  console.log('   ADMIN     : admin@forum.com       / Admin@123');
  console.log('   MODERATOR : mod@forum.com         / Moderator@123');
  console.log('   MEMBER    : john@example.com      / Member@123');
  console.log('   MEMBER    : alice@example.com     / Member@123');
  console.log('   MEMBER    : bob@example.com       / Member@123');
  console.log('   MEMBER    : carol@example.com     / Member@123');
  console.log('   MEMBER    : dave@example.com      / Member@123  (unverified, new)');
  console.log('   MEMBER    : eve@example.com       / Member@123');
  console.log('   MEMBER    : frank@example.com     / Member@123');
  console.log('   MEMBER    : grace@example.com     / Member@123');
  console.log('   BANNED    : henry@example.com     / Member@123  (is_active=false)');
  console.log('   MEMBER    : iris@example.com      / Member@123  (unverified, new)');

  console.log('\n📊 Data Summary:');
  console.log('   Categories : 7  (1 member-only, 1 moderator-only)');
  console.log('   Tags       : 15');
  console.log(`   Posts      : ${P.length}  (2 GLOBAL/CATEGORY pinned, 2 locked, 1 draft, 1 hidden)`);
  console.log('   Comments   : 30+ (replies, quotes, edited badges, masked)');
  console.log(`   Votes      : ${voteData.length}  (posts + comments, zero self-votes)`);
  console.log(`   Bookmarks  : ${bookmarkData.length}`);
  console.log(`   Notifications : ${notifData.length} (read + unread, all 5 types)`);
  console.log(`   Reports    : ${reportDefs.length}  (POST/COMMENT/USER, all 4 statuses)`);
  console.log('   Blocks     : 4');
  console.log(`   Audit Logs : ${auditEntries.length}`);

  console.log('\n🧪 Testing Scenarios Covered:');
  console.log('   ✅ Auth: login, banned user, unverified, token refresh');
  console.log('   ✅ Posts: CRUD, pinned modal, locked, hidden, draft, filter/sort');
  console.log('   ✅ Comments: reply, quote, edit badge, locked post, masked');
  console.log('   ✅ Votes: upvote, downvote, toggle, no self-votes');
  console.log('   ✅ Bookmarks: add, list, remove');
  console.log('   ✅ Notifications: all types, read/unread badge');
  console.log('   ✅ Search: rich content to search and filter');
  console.log('   ✅ Profile: different roles/reputations, vote history owner-only');
  console.log('   ✅ Block/Report: blocked users list, full report workflow');
  console.log('   ✅ Admin: all pages with diverse data');
  console.log('   ✅ Permissions: guest / member / moderator-only categories');
  console.log('═'.repeat(60));
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
