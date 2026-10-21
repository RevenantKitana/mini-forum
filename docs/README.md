# 📚 Trung Tâm Tài Liệu Kỹ Thuật - Mini Forum (Documentation Hub)

Chào mừng bạn đến với trung tâm tài liệu của dự án **Mini Forum**. Thư mục này tập hợp toàn bộ các hướng dẫn kỹ thuật, đặc tả kiến trúc, tài liệu triển khai hạ tầng và quy trình vận hành hệ thống.

---

## 🗺️ Bản Đồ Tài Liệu Dự Án (Documentation Index)

```
docs/
├── README.md                      # [BẠN ĐANG Ở ĐÂY] Trung tâm điều hướng tài liệu
├── ARCHITECTURE.md               # Kiến trúc hệ thống, Auth Security, SSE & Multi-LLM AI
├── DATABASE_GUIDE.md             # Hướng dẫn CSDL PostgreSQL, Prisma ORM, Backup & Restore
├── DEPLOY_ORACLE_VM.md           # Hướng dẫn triển khai toàn diện trên Oracle Cloud VM / VPS
├── DEPLOY_MICRO_VM.md            # Thiết lập tối ưu đặc thù cho máy 1GB RAM (VM.Standard.E2.1.Micro)
├── PROJECT_CV_PORTFOLIO.md       # Bản tóm tắt dự án chuẩn mực phục vụ CV và Portfolio
└── legacy/                       # Kho lưu trữ tài liệu lịch sử các giai đoạn phát triển trước
    ├── README.md                 # Mục lục và bối cảnh các tài liệu legacy
    ├── DEPLOY_CHECKLIST_RENDER.md
    ├── VercelRenderSupabaseDEPLOYMENT.md
    ├── DB_SETUP_RENDER_SUPABASE.md
    ├── security_spec.md
    └── ANALYSIS_LLMHEALTH.md
```

---

## 📌 Hướng Dẫn Nhanh Theo Nhu Cầu Sử Dụng

### 1. Dành cho Nhà phát triển mới (Getting Started)
- **Tìm hiểu tổng quan dự án:** Bắt đầu từ file [`README.md`](../README.md) ở thư mục gốc.
- **Nắm bắt kiến trúc & bảo mật xác thực:** Đọc [`ARCHITECTURE.md`](./ARCHITECTURE.md) để hiểu mô hình Dual-Token (In-Memory + HttpOnly Cookie), cơ chế chống Replay Attack (RTR & Reuse Detection), và luồng hoạt động của bot AI `vibe-content`.
- **Làm việc với Cơ sở dữ liệu:** Xem [`DATABASE_GUIDE.md`](./DATABASE_GUIDE.md) để biết cách chạy migrations, seeding dữ liệu và thao tác với Prisma ORM.

### 2. Dành cho Kỹ sư DevOps & Triển khai Hạ tầng (Deployment & DevOps)
- **Checklist kiểm tra trước & sau khi deploy:** Xem [`DEPLOY_CHECKLIST.md`](../DEPLOY_CHECKLIST.md) ở thư mục gốc.
- **Triển khai máy chủ Oracle Cloud VM:** Đọc [`DEPLOY_ORACLE_VM.md`](./DEPLOY_ORACLE_VM.md) để nắm quy trình thiết lập tự động qua `vm.bat` hoặc các script trong `scripts/remote-vm/`.
- **Nếu triển khai trên máy chủ cấu hình thấp (1GB RAM):** Tham khảo [`DEPLOY_MICRO_VM.md`](./DEPLOY_MICRO_VM.md) để cấu hình 4GB Swap, ép dọn rác Node.js và siết Cgroup RAM chống crash.
- **Quản lý công cụ tự động hóa:** Đọc tài liệu [`scripts/remote-vm/README.md`](../scripts/remote-vm/README.md).

### 3. Dành cho Từng Hệ Thống Thành Phần (Sub-Projects)
Mỗi thư mục con trong dự án đều có tài liệu README riêng biệt:
- 🌐 [Giao diện Người dùng (Frontend)](../frontend/README.md) — React 18, Vite, Tailwind CSS, TanStack Query.
- 🛡️ [Trang Quản trị (Admin Client)](../admin-client/README.md) — Radix UI, hệ thống duyệt bài và audit trail.
- 📱 [Ứng dụng Di động (Mobile App)](../mobile/README.md) — React Native, Expo SDK 52, hướng dẫn quét QR Expo Go.
- ⚙️ [Máy chủ Backend (REST API)](../backend/README.md) — Express, TypeScript, Prisma, 14 nhóm endpoint.
- 🤖 [Dịch vụ Sinh Nội dung AI (Vibe-Content)](../vibe-content/README.md) — Multi-LLM provider, circuit breaker.
- 🖼️ [Bộ Script Media ImageKit](../backend/scripts/README_MEDIA_SCRIPTS.md) — Xóa rác, reset media và đồng bộ CDN.

### 4. Dành cho Tuyển Dụng & Đánh Giá Dự Án (CV & Portfolio)
- Mời bạn tham khảo tài liệu [`PROJECT_CV_PORTFOLIO.md`](./PROJECT_CV_PORTFOLIO.md) — Được biên soạn cô đọng theo 2 phiên bản (ngắn gọn cho CV ứng tuyển và chi tiết chuyên sâu theo phong cách Case Study cho Portfolio).

### 5. Tra cứu Lịch sử Thiết kế (Legacy Archive)
- Toàn bộ các đặc tả kỹ thuật cũ (Render deployment, Supabase cloud, spec bảo mật giai đoạn 1-4) được lưu trữ cẩn thận tại thư mục [`legacy/`](./legacy/README.md).
