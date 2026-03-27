import { PrismaClient, Role, PermissionLevel } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  try {
    // Seed Admin User FIRST (required for audit logs)
    console.log('👤 Seeding admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const adminUser = await prisma.users.upsert({
      where: { email: 'sfw.forum@atomicmail.io' },
      update: {
        username: 'admin',
        password_hash: hashedPassword,
        role: Role.ADMIN,
        display_name: 'Admin',
        is_verified: true,
        is_active: true,
      },
      create: {
        email: 'sfw.forum@atomicmail.io',
        username: 'admin',
        password_hash: hashedPassword,
        role: Role.ADMIN,
        display_name: 'Admin',
        is_verified: true,
        is_active: true,
        reputation: 0,
      },
    });
    console.log('✅ Admin user seeded successfully');

    // Seed Categories
    const categories = [
      {
        name: 'Nội Quy - Thông báo',
        slug: 'noi-quy-thong-bao',
        description: 'Các quy định, thông báo chung của diễn đàn',
        color: '#FF6B6B',
        sort_order: 1,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.ADMIN,
        comment_permission: PermissionLevel.ADMIN,
      },
      {
        name: 'Ý kiến - Phản Hồi',
        slug: 'y-kien-phan-hoi',
        description: 'Chia sẻ ý kiến, phản hồi về diễn đàn',
        color: '#4ECDC4',
        sort_order: 2,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Chia sẻ & Kinh nghiệm',
        slug: 'chia-se-kinh-nghiem',
        description: 'Chia sẻ kinh nghiệm, học hỏi lẫn nhau',
        color: '#45B7D1',
        sort_order: 3,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Kể chuyện',
        slug: 'ke-chuyen',
        description: 'Kể những câu chuyện, trải nghiệm của bạn',
        color: '#FFA07A',
        sort_order: 4,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Bàn luận & Góc nhìn',
        slug: 'ban-luan-goc-nhin',
        description: 'Bàn luận về các chủ đề, chia sẻ góc nhìn riêng',
        color: '#9B59B6',
        sort_order: 5,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Hỏi đáp',
        slug: 'hoi-dap',
        description: 'Hỏi đáp câu hỏi, giải đáp thắc mắc',
        color: '#3498DB',
        sort_order: 6,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Off-topic',
        slug: 'off-topic',
        description: 'Thảo luận về các chủ đề ngoài lề',
        color: '#95A5A6',
        sort_order: 7,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
    ];

    console.log('📝 Seeding categories...');
    for (const category of categories) {
      await prisma.categories.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      });
    }
    console.log('✅ Categories seeded successfully');

    // Seed Bot Users
    console.log('🤖 Seeding bot users...');
    const botPassword = 'BotUser@123';
    const botHashedPassword = await bcrypt.hash(botPassword, 10);

    const botProfiles = [
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
      {
        username: 'tuan_anh',
        email: 'tuan.anh@bot.forum',
        display_name: 'Tuấn Anh',
        bio: 'Gamer chính hiệu, đam mê RPG và FPS. Cuộc sống là một trò chơi, quan trọng là biết cách chơi 🎮',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tuananh',
        gender: 'male',
      },
      {
        username: 'lan_phuong',
        email: 'lan.phuong@bot.forum',
        display_name: 'Lan Phương',
        bio: 'Sống để ăn, không phải ăn để sống. Chuyên review quán ăn và chia sẻ công thức nấu ăn 🍜',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lanphuong',
        gender: 'female',
      },
      {
        username: 'minh_duc',
        email: 'minh.duc@bot.forum',
        display_name: 'Minh Đức',
        bio: 'Founder startup lần 2. Thất bại lần 1 dạy mình nhiều hơn bất kỳ trường lớp nào. Obsessed với growth.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=minhduc',
        gender: 'male',
      },
      {
        username: 'van_thanh',
        email: 'van.thanh@bot.forum',
        display_name: 'Văn Thành',
        bio: 'Gần 50 tuổi, đã trải qua đủ thứ thăng trầm. Viết lại vì muốn thế hệ sau hiểu hơn về cuộc đời.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vanthanh',
        gender: 'male',
      },
      {
        username: 'thu_trang',
        email: 'thu.trang@bot.forum',
        display_name: 'Thu Trang',
        bio: 'Đã đặt chân đến 30+ tỉnh thành. Mỗi chuyến đi là một câu chuyện mới. Du lịch bụi là lối sống 🏕️',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thutrang',
        gender: 'female',
      },
      {
        username: 'bao_chau',
        email: 'bao.chau@bot.forum',
        display_name: 'Bảo Châu',
        bio: 'Graphic designer, nhìn đời qua lăng kính nghệ thuật. Thích concept art, typography và mọi thứ aesthetic.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=baochau',
        gender: 'female',
      },
      {
        username: 'trong_hieu',
        email: 'trong.hieu@bot.forum',
        display_name: 'Trọng Hiếu',
        bio: 'Fan bóng đá cuồng nhiệt. Xem đủ các giải từ V-League đến Champions League. Cùng "suffer" cho đội nhà nào! ⚽',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tronghieu',
        gender: 'male',
      },
      {
        username: 'anh_tuyet',
        email: 'anh.tuyet@bot.forum',
        display_name: 'Ánh Tuyết',
        bio: 'PT và nutritionist. Tin rằng sức khỏe tốt bắt đầu từ thói quen nhỏ mỗi ngày. Đừng diet, hãy eat smart 💪',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anhtuyet',
        gender: 'female',
      },
    ];

    for (const profile of botProfiles) {
      await prisma.users.upsert({
        where: { email: profile.email },
        update: {
          username: profile.username,
          password_hash: botHashedPassword,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          gender: profile.gender,
          role: Role.BOT,
          is_verified: true,
          is_active: true,
        },
        create: {
          email: profile.email,
          username: profile.username,
          password_hash: botHashedPassword,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          gender: profile.gender,
          role: Role.BOT,
          is_verified: true,
          is_active: true,
          reputation: 0,
        },
      });
    }
    console.log(`✅ ${botProfiles.length} bot users seeded successfully`);

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
