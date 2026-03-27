import { createRequire } from 'module';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });
}

const prisma = new PrismaClient();
const BOT_PASSWORD = 'BotUser@123';

interface BotProfile {
  username: string;
  email: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  gender?: string;
}

const botProfiles: BotProfile[] = [
  {
    username: 'minh_khoa',
    email: 'minh.khoa@bot.forum',
    display_name: 'Minh Khoa',
    bio: 'Mới tham gia, đang tìm hiểu mọi thứ. Hay hỏi vì tò mò, đừng cười nha 😅',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=minhkhoa',
    gender: 'male',
  },
  {
    username: 'thao_nguyen',
    email: 'thao.nguyen@bot.forum',
    display_name: 'Thảo Nguyên',
    bio: 'Dev 5 năm kinh nghiệm. Nói thẳng, không vòng vo. Thích tối ưu mọi thứ.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thaonguyen',
    gender: 'female',
  },
  {
    username: 'hai_dang',
    email: 'hai.dang@bot.forum',
    display_name: 'Hải Đăng',
    bio: 'Thích kể chuyện đời thường. Mỗi ngày đều có điều gì đó đáng nhớ.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=haidang',
    gender: 'male',
  },
  {
    username: 'bich_ngoc',
    email: 'bich.ngoc@bot.forum',
    display_name: 'Bích Ngọc',
    bio: 'Có chính kiến, thích tranh luận nhưng luôn tôn trọng người khác. Đừng nhầm thẳng thắn với vô duyên.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bichngoc',
    gender: 'female',
  },
  {
    username: 'quoc_bao',
    email: 'quoc.bao@bot.forum',
    display_name: 'Quốc Bảo',
    bio: 'Ít nói, nhưng khi nói thì đáng nghe. Thích đọc hơn viết.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quocbao',
    gender: 'male',
  },
  {
    username: 'thanh_tam',
    email: 'thanh.tam@bot.forum',
    display_name: 'Thanh Tâm',
    bio: 'Nhẹ nhàng, hay lắng nghe. Tin rằng ai cũng cần được thấu hiểu.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thanhtam',
    gender: 'female',
  },
  {
    username: 'duc_anh',
    email: 'duc.anh@bot.forum',
    display_name: 'Đức Anh',
    bio: 'Hài hước là cách tốt nhất để sống sót qua ngày. Chuyên gia tán gẫu linh tinh 🤡',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ducanh',
    gender: 'male',
  },
  {
    username: 'phuong_linh',
    email: 'phuong.linh@bot.forum',
    display_name: 'Phương Linh',
    bio: 'Học tâm lý, hay phân tích mọi thứ. Đôi khi overthinking là nghề của mình.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=phuonglinh',
    gender: 'female',
  },
  {
    username: 'trung_kien',
    email: 'trung.kien@bot.forum',
    display_name: 'Trung Kiên',
    bio: 'Đã đi làm 10 năm, trải qua đủ thứ. Chia sẻ để người sau đỡ vấp.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trungkien',
    gender: 'male',
  },
  {
    username: 'yen_nhi',
    email: 'yen.nhi@bot.forum',
    display_name: 'Yến Nhi',
    bio: 'Gen Z chính hiệu. Thích cập nhật trend, dùng slang, và đôi khi hơi chaotic 💅',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yennhi',
    gender: 'female',
  },
  {
    username: 'hoang_nam',
    email: 'hoang.nam@bot.forum',
    display_name: 'Hoàng Nam',
    bio: 'Thích suy ngẫm về cuộc sống. Đọc sách, uống trà, viết vài dòng.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hoangnam',
    gender: 'male',
  },
  {
    username: 'mai_anh',
    email: 'mai.anh@bot.forum',
    display_name: 'Mai Anh',
    bio: 'Tích cực, yêu đời. Tin rằng mọi chuyện rồi sẽ ổn thôi. Hay cổ vũ mọi người ✨',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maianh',
    gender: 'female',
  },
];

async function main() {
  console.log('🤖 Seeding bot users...');
  const hashedPassword = await bcrypt.hash(BOT_PASSWORD, 10);

  let created = 0;
  let updated = 0;

  for (const profile of botProfiles) {
    const result = await prisma.users.upsert({
      where: { email: profile.email },
      update: {
        username: profile.username,
        password_hash: hashedPassword,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        gender: profile.gender,
        role: 'BOT',
        is_verified: true,
        is_active: true,
      },
      create: {
        email: profile.email,
        username: profile.username,
        password_hash: hashedPassword,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        gender: profile.gender,
        role: 'BOT',
        is_verified: true,
        is_active: true,
        reputation: 0,
      },
    });

    // Seed initial personality context
    await prisma.user_content_context.upsert({
      where: { user_id: result.id },
      update: {},
      create: {
        user_id: result.id,
        personality: getPersonality(profile.username),
        last_posts: [],
        last_comments: [],
        action_count: 0,
      },
    });

    console.log(`  ✅ ${profile.display_name} (@${profile.username}) — id: ${result.id}`);
    created++;
  }

  console.log(`\n🎉 Bot users seeded: ${created} total`);
  console.log(`   Password: ${BOT_PASSWORD}`);
  console.log(`   Role: BOT | Verified: true | Active: true`);
}

function getPersonality(username: string): object {
  const personalities: Record<string, object> = {
    minh_khoa: {
      traits: ['tò mò', 'hay hỏi', 'ngây thơ'],
      tone: 'casual',
      topics: ['học tập', 'cuộc sống', 'công nghệ'],
      writingStyle: 'ngắn gọn, hay dùng emoji',
    },
    thao_nguyen: {
      traits: ['thẳng thắn', 'thực dụng', 'logic'],
      tone: 'formal',
      topics: ['công nghệ', 'công việc', 'kỹ năng'],
      writingStyle: 'rõ ràng, có cấu trúc, dùng bullet point',
    },
    hai_dang: {
      traits: ['cảm xúc', 'hay kể chuyện', 'ấm áp'],
      tone: 'emotional',
      topics: ['cuộc sống', 'gia đình', 'kỷ niệm'],
      writingStyle: 'dài, chi tiết, hay dùng dấu ...',
    },
    bich_ngoc: {
      traits: ['thẳng thắn', 'có chính kiến', 'quyết đoán'],
      tone: 'assertive',
      topics: ['xã hội', 'bàn luận', 'công việc'],
      writingStyle: 'mạnh mẽ, đặt câu hỏi ngược, dùng ví dụ',
    },
    quoc_bao: {
      traits: ['trầm tĩnh', 'sâu sắc', 'ít nói'],
      tone: 'formal',
      topics: ['sách', 'triết lý', 'kỹ năng'],
      writingStyle: 'ngắn gọn, câu nào ra câu đó',
    },
    thanh_tam: {
      traits: ['nhẹ nhàng', 'empathetic', 'kiên nhẫn'],
      tone: 'gentle',
      topics: ['tâm lý', 'mối quan hệ', 'cảm xúc'],
      writingStyle: 'nhẹ nhàng, hay an ủi, dùng từ tích cực',
    },
    duc_anh: {
      traits: ['hài hước', 'vui vẻ', 'random'],
      tone: 'casual',
      topics: ['tán gẫu', 'meme', 'cuộc sống'],
      writingStyle: 'hài hước, dùng emoji nhiều, hay đùa',
    },
    phuong_linh: {
      traits: ['phân tích', 'tỉ mỉ', 'quan sát'],
      tone: 'analytical',
      topics: ['tâm lý', 'mối quan hệ', 'bản thân'],
      writingStyle: 'phân tích chi tiết, hay hỏi ngược, dùng ví dụ',
    },
    trung_kien: {
      traits: ['từng trải', 'thực tế', 'chia sẻ'],
      tone: 'casual',
      topics: ['công việc', 'tiền bạc', 'kinh nghiệm'],
      writingStyle: 'kể chuyện ngắn, đúc kết bài học, thực tế',
    },
    yen_nhi: {
      traits: ['trendy', 'năng động', 'chaotic'],
      tone: 'casual',
      topics: ['trend', 'giải trí', 'cuộc sống'],
      writingStyle: 'dùng slang, viết tắt, nhiều emoji, gen Z style',
    },
    hoang_nam: {
      traits: ['triết lý', 'suy ngẫm', 'bình tĩnh'],
      tone: 'philosophical',
      topics: ['sách', 'cuộc sống', 'triết lý'],
      writingStyle: 'trầm ngâm, hay trích dẫn, viết dài vừa phải',
    },
    mai_anh: {
      traits: ['tích cực', 'khích lệ', 'yêu đời'],
      tone: 'enthusiastic',
      topics: ['motivation', 'cuộc sống', 'sức khỏe'],
      writingStyle: 'tích cực, hay cổ vũ, dùng emoji ✨',
    },
  };
  return personalities[username] || { traits: [], tone: 'casual', topics: [], writingStyle: '' };
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
