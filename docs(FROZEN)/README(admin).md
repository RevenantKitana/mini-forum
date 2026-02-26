# Admin Client - DA Mini Forum

Dự án admin dashboard riêng biệt cho DA Mini Forum.

## Cài đặt

```bash
cd admin-client
npm install
```

## Chạy development server

```bash
npm run dev
```

Admin panel sẽ chạy tại: http://localhost:5174

## Build production

```bash
npm run build
```

## Cấu trúc thư mục

```
admin-client/
├── src/
│   ├── api/              # API services và axios config
│   ├── components/       # React components
│   │   ├── auth/        # Auth-related components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # Shadcn/UI components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities
│   ├── pages/            # Page components
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Tính năng

- **Dashboard**: Tổng quan thống kê diễn đàn
- **Quản lý người dùng**: Xem, cấm, đổi vai trò người dùng
- **Quản lý bài viết**: Xem, ẩn, xóa bài viết
- **Quản lý bình luận**: Xem, ẩn, xóa bình luận
- **Báo cáo vi phạm**: Xử lý các báo cáo từ người dùng
- **Categories & Tags**: Quản lý danh mục và thẻ

## Đăng nhập

Chỉ admin và moderator mới có thể truy cập admin panel:

- **Admin**: admin@example.com / password123
- **Moderator**: mod@example.com / password123

## Lưu ý

- Admin panel chạy trên port riêng (5174) để tách biệt với frontend chính (5173)
- Token được lưu riêng với prefix `admin_` để không xung đột với frontend
- API proxy được cấu hình để gọi đến backend tại port 5000
