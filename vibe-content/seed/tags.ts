import { createRequire } from 'module';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });
}

const prisma = new PrismaClient();

interface TagSeed {
  name: string;
  slug: string;
  description?: string;
}

function slugify(text: string): string {
  const map: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  };
  return text
    .toLowerCase()
    .split('')
    .map((char) => map[char] || char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const tagDefinitions: { name: string; description?: string }[] = [
  // Tâm lý & Cảm xúc
  { name: 'tâm lý', description: 'Các vấn đề liên quan đến tâm lý' },
  { name: 'cảm xúc', description: 'Chia sẻ về cảm xúc, tâm trạng' },
  { name: 'stress', description: 'Áp lực, căng thẳng' },
  { name: 'tự tin', description: 'Sự tự tin, lòng tự trọng' },
  { name: 'cô đơn', description: 'Cảm giác cô đơn, lạc lõng' },

  // Công việc & Sự nghiệp
  { name: 'công việc', description: 'Chuyện đi làm, nghề nghiệp' },
  { name: 'sự nghiệp', description: 'Định hướng và phát triển sự nghiệp' },
  { name: 'đồng nghiệp', description: 'Mối quan hệ đồng nghiệp' },
  { name: 'sếp', description: 'Chuyện với sếp, quản lý' },
  { name: 'nghỉ việc', description: 'Nghỉ việc, chuyển việc' },
  { name: 'freelance', description: 'Làm tự do, freelance' },

  // Học tập & Kỹ năng
  { name: 'học tập', description: 'Việc học, thi cử, đào tạo' },
  { name: 'kỹ năng', description: 'Kỹ năng mềm và cứng' },
  { name: 'ngoại ngữ', description: 'Học ngoại ngữ' },
  { name: 'đại học', description: 'Cuộc sống sinh viên, đại học' },

  // Mối quan hệ
  { name: 'mối quan hệ', description: 'Các mối quan hệ nói chung' },
  { name: 'tình yêu', description: 'Chuyện tình cảm, yêu đương' },
  { name: 'gia đình', description: 'Cha mẹ, anh chị em, gia đình' },
  { name: 'bạn bè', description: 'Tình bạn, nhóm bạn' },
  { name: 'hôn nhân', description: 'Vợ chồng, hôn nhân' },
  { name: 'nuôi dạy con', description: 'Nuôi dạy con cái' },

  // Tài chính
  { name: 'tiền bạc', description: 'Quản lý tài chính cá nhân' },
  { name: 'tiết kiệm', description: 'Tiết kiệm, quản lý chi tiêu' },
  { name: 'đầu tư', description: 'Đầu tư tài chính' },

  // Sức khỏe & Cuộc sống
  { name: 'sức khỏe', description: 'Sức khỏe thể chất' },
  { name: 'sức khỏe tinh thần', description: 'Sức khỏe tinh thần, mental health' },
  { name: 'thể dục', description: 'Tập gym, chạy bộ, thể thao' },
  { name: 'ăn uống', description: 'Dinh dưỡng, nấu ăn' },
  { name: 'giấc ngủ', description: 'Chất lượng giấc ngủ' },

  // Cuộc sống
  { name: 'cuộc sống', description: 'Cuộc sống thường ngày' },
  { name: 'nhà cửa', description: 'Thuê trọ, mua nhà, sinh hoạt' },
  { name: 'du lịch', description: 'Đi chơi, du lịch' },
  { name: 'thú cưng', description: 'Chó mèo, động vật' },

  // Công nghệ & Giải trí
  { name: 'công nghệ', description: 'Tech, gadget, phần mềm' },
  { name: 'lập trình', description: 'Code, lập trình, phát triển phần mềm' },
  { name: 'giải trí', description: 'Phim, nhạc, game, sách' },
  { name: 'sách', description: 'Đọc sách, review sách' },
  { name: 'phim', description: 'Phim ảnh, series' },

  // Chủ đề đặc biệt
  { name: 'xã hội', description: 'Vấn đề xã hội, thời sự' },
  { name: 'triết lý', description: 'Suy ngẫm, triết lý sống' },
  { name: 'kinh nghiệm', description: 'Chia sẻ kinh nghiệm, bài học' },
  { name: 'lần đầu', description: 'Trải nghiệm lần đầu tiên' },
  { name: 'thất bại', description: 'Thất bại và bài học rút ra' },
  { name: 'thành công', description: 'Thành tựu, niềm vui đạt được' },
];

async function main() {
  console.log('🏷️  Seeding tags...');

  const tags: TagSeed[] = tagDefinitions.map((t) => ({
    name: t.name,
    slug: slugify(t.name),
    description: t.description,
  }));

  let created = 0;
  for (const tag of tags) {
    await prisma.tags.upsert({
      where: { slug: tag.slug },
      update: {
        name: tag.name,
        description: tag.description,
      },
      create: {
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
      },
    });
    created++;
  }

  console.log(`✅ ${created} tags seeded successfully`);
  console.log(`   Tags: ${tags.map((t) => t.name).join(', ')}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
