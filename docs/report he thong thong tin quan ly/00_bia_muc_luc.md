# BÁO CÁO CHUYÊN ĐỀ THỰC TẬP
## MÔN HỌC: HỆ THỐNG THÔNG TIN QUẢN LÝ

---

<div align="center">

**TRƯỜNG ĐẠI HỌC [TÊN TRƯỜNG]**

**KHOA CÔNG NGHỆ THÔNG TIN**

---

# BÁO CÁO CHUYÊN ĐỀ THỰC TẬP
## HỆ THỐNG THÔNG TIN QUẢN LÝ

### Dự án: **MINI-FORUM**
### Ứng dụng Diễn đàn Trực tuyến Full-stack

---

| | |
|---|---|
| **Thời gian thực tập (giả định)** | 27/01/2026 – 27/04/2026 (13 tuần) |
| **Cơ sở thực tập** | Dự án mã nguồn mở `mini-forum` |
| **Người thực hiện** | [Họ và tên sinh viên] |
| **MSSV** | [Mã số sinh viên] |
| **Giảng viên hướng dẫn** | [Tên giảng viên] |
| **Năm học** | 2025 – 2026 |

---

*Hà Nội, tháng 4 năm 2026*

</div>

---

## LỜI MỞ ĐẦU

Hệ thống thông tin quản lý (MIS — Management Information System) là nền tảng không thể thiếu trong vận hành mọi tổ chức hiện đại. MIS không chỉ đơn thuần là phần mềm lưu trữ dữ liệu, mà là một cơ sở hạ tầng thông tin tích hợp: thu thập dữ liệu từ nhiều nguồn, xử lý theo quy tắc nghiệp vụ, và phân phối thông tin hữu ích đến đúng đối tượng, đúng thời điểm.

Báo cáo này trình bày kết quả nghiên cứu và phân tích hệ thống thông tin quản lý thông qua dự án **MINI-FORUM** — một ứng dụng diễn đàn trực tuyến full-stack được xây dựng trên nền tảng Node.js/React/PostgreSQL. Dự án cung cấp một case study thực tế và đầy đủ về cách thiết kế, tổ chức và vận hành một MIS cộng đồng với đầy đủ các thành phần: phân tích nghiệp vụ, mô hình hóa dữ liệu, luồng xử lý thông tin, phân quyền đa cấp, audit trail và dashboard quản trị.

Nội dung báo cáo được tổ chức theo 7 chương, tuân thủ phương pháp luận phân tích hệ thống thông tin kinh điển từ tổng quan đến chi tiết, từ mô hình hóa đến đặc tả kỹ thuật.

---

## MỤC LỤC CHI TIẾT

| Chương | Mục cấp 1 | Trang |
|--------|----------|-------|
| **1** | 1.1 [Đặt vấn đề và lý do chọn đề tài](./01_chuong_1_tong_quan.md#11-đặt-vấn-đề-và-lý-do-chọn-đề-tài) | 4 |
| | 1.2 [Khái niệm Hệ thống Thông tin Quản lý](./01_chuong_1_tong_quan.md#12-khái-niệm-hệ-thống-thông-tin-quản-lý) | 6 |
| | 1.3 [Giới thiệu dự án MINI-FORUM](./01_chuong_1_tong_quan.md#13-giới-thiệu-dự-án-mini-forum) | 8 |
| **2** | 2.1 [Các tác nhân (Actors)](./02_chuong_2_phan_tich_nghiep_vu.md#21-các-tác-nhân-actors) | 9 |
| | 2.2 [Các use case (Trường hợp sử dụng)](./02_chuong_2_phan_tich_nghiep_vu.md#22-các-use-case) | 12 |
| | 2.3 [Quy trình nghiệp vụ chính](./02_chuong_2_phan_tich_nghiep_vu.md#23-quy-trình-nghiệp-vụ-chính) | 16 |
| **3** | 3.1 [Entity-Relationship Diagram (ERD)](./03_chuong_3_mo_hinh_hoa_du_lieu.md#31-entity-relationship-diagram-erd) | 18 |
| | 3.2 [Mô tả Entity Core Group](./03_chuong_3_mo_hinh_hoa_du_lieu.md#32-mô-tả-entity-core-group) | 21 |
| | 3.3 [Mô tả Entity Content Group](./03_chuong_3_mo_hinh_hoa_du_lieu.md#33-mô-tả-entity-content-group) | 24 |
| | 3.4 [Chiến lược Block Layout cho nội dung phong phú](./03_chuong_3_mo_hinh_hoa_du_lieu.md#34-chiến-lược-block-layout) | 26 |
| | 3.5 [Data Dictionary — Enums và Kiểu dữ liệu](./03_chuong_3_mo_hinh_hoa_du_lieu.md#35-data-dictionary) | 27 |
| **4** | 4.1 [DFD Mức 0 — Context Diagram](./04_chuong_4_luong_thong_tin.md#41-dfd-mức-0--context-diagram) | 28 |
| | 4.2 [DFD Mức 1 — Các quy trình xử lý chính](./04_chuong_4_luong_thong_tin.md#42-dfd-mức-1--các-quy-trình-xử-lý-chính) | 30 |
| | 4.3 [Luồng Vote và Cập nhật Reputation](./04_chuong_4_luong_thong_tin.md#43-luồng-vote-và-cập-nhật-reputation) | 32 |
| | 4.4 [Kiến trúc SSE — Real-time Notification](./04_chuong_4_luong_thong_tin.md#44-kiến-trúc-sse--real-time-notification) | 33 |
| | 4.5 [Luồng xử lý báo cáo vi phạm (Report Workflow)](./04_chuong_4_luong_thong_tin.md#45-luồng-xử-lý-báo-cáo-vi-phạm) | 34 |
| | 4.6 [Luồng Full-Text Search](./04_chuong_4_luong_thong_tin.md#46-luồng-full-text-search) | 35 |
| **5** | 5.1 [Module Authentication & Authorization](./05_chuong_5_dac_ta_chuc_nang.md#51-module-authentication--authorization) | 36 |
| | 5.2 [Module Post Management](./05_chuong_5_dac_ta_chuc_nang.md#52-module-post-management) | 38 |
| | 5.3 [Module Comment System](./05_chuong_5_dac_ta_chuc_nang.md#53-module-comment-system) | 40 |
| | 5.4 [Module User Management](./05_chuong_5_dac_ta_chuc_nang.md#54-module-user-management) | 41 |
| | 5.5 [Module Notification System](./05_chuong_5_dac_ta_chuc_nang.md#55-module-notification-system) | 42 |
| | 5.6 [Module Search](./05_chuong_5_dac_ta_chuc_nang.md#56-module-search) | 43 |
| | 5.7 [Module Vote & Bookmark](./05_chuong_5_dac_ta_chuc_nang.md#57-module-vote--bookmark) | 44 |
| | 5.8 [Module Category & Tag](./05_chuong_5_dac_ta_chuc_nang.md#58-module-category--tag) | 45 |
| | 5.9 [Module Media Upload](./05_chuong_5_dac_ta_chuc_nang.md#59-module-media-upload) | 45 |
| | 5.10 [Module Dynamic Config](./05_chuong_5_dac_ta_chuc_nang.md#510-module-dynamic-config) | 46 |
| **6** | 6.1 [Tổng quan hệ thống kiểm soát](./06_chuong_6_bao_cao_kiem_soat.md#61-tổng-quan-hệ-thống-kiểm-soát) | 46 |
| | 6.2 [Tầng 1 — Preventive Controls: Kiểm soát ngăn ngừa](./06_chuong_6_bao_cao_kiem_soat.md#62-tầng-1--preventive-controls) | 49 |
| | 6.3 [Tầng 2 — Detective Controls: Kiểm soát phát hiện](./06_chuong_6_bao_cao_kiem_soat.md#63-tầng-2--detective-controls) | 50 |
| | 6.4 [Tầng 3 — Corrective Controls: Kiểm soát khắc phục](./06_chuong_6_bao_cao_kiem_soat.md#64-tầng-3--corrective-controls) | 52 |
| **7** | 7.1 [Đánh giá thiết kế dữ liệu](./07_chuong_7_danh_gia_ket_luan.md#71-đánh-giá-thiết-kế-dữ-liệu) | 52 |
| | 7.2 [Đánh giá kiến trúc hệ thống](./07_chuong_7_danh_gia_ket_luan.md#72-đánh-giá-kiến-trúc-hệ-thống) | 55 |
| | 7.3 [Đánh giá tiến độ phát triển](./07_chuong_7_danh_gia_ket_luan.md#73-đánh-giá-tiến-độ-phát-triển) | 57 |
| | 7.4 [Kết luận](./07_chuong_7_danh_gia_ket_luan.md#74-kết-luận) | 58 |
| | 7.5 [Phụ lục kỹ thuật](./07_chuong_7_danh_gia_ket_luan.md#75-phụ-lục-kỹ-thuật) | 60 |

---

## DANH MỤC HÌNH VÀ BẢNG

### Danh mục bảng

| Bảng | Nội dung |
|------|---------|
| Bảng 1.1 | Các dịch vụ trong kiến trúc monorepo MINI-FORUM |
| Bảng 1.2 | So sánh MIS truyền thống và Community MIS |
| Bảng 2.1 | Danh sách Actor và quyền hạn |
| Bảng 2.2 | Danh sách 28 Use Case |
| Bảng 2.3 | Đặc tả UC-01: Đăng ký tài khoản |
| Bảng 2.4 | Đặc tả UC-09: Tạo bài viết |
| Bảng 2.5 | Đặc tả UC-24: Xử lý báo cáo vi phạm |
| Bảng 3.1 | Mô tả thuộc tính Entity USERS |
| Bảng 3.2 | Mô tả thuộc tính Entity POSTS |
| Bảng 3.3 | Mô tả thuộc tính Entity COMMENTS |
| Bảng 3.4 | Mô tả thuộc tính Entity CATEGORIES |
| Bảng 3.5 | Mô tả thuộc tính Entity AUDIT_LOGS |
| Bảng 3.6 | Data Dictionary — 10 Enums hệ thống |
| Bảng 3.7 | Danh sách 17 Model trong Prisma Schema |
| Bảng 5.1 | API Endpoints — Module Auth |
| Bảng 5.2 | API Endpoints — Module Post |
| Bảng 5.3 | Các loại NotificationType |
| Bảng 6.1 | Metrics trên Admin Dashboard |
| Bảng 6.2 | Danh sách AuditAction và AuditTarget |
| Bảng 7.1 | Đánh giá chuẩn hóa các Entity |
| Bảng 7.2 | Phân tích luồng thông tin theo Sprint |

### Danh mục hình

| Hình | Nội dung |
|------|---------|
| Hình 1.1 | Mô hình IPO (Input-Processing-Output) của MINI-FORUM |
| Hình 1.2 | Kiến trúc tổng thể hệ thống (4 service) |
| Hình 2.1 | Use Case Diagram — Nhóm quản lý người dùng |
| Hình 2.2 | Use Case Diagram — Nhóm quản lý nội dung |
| Hình 2.3 | Use Case Diagram — Nhóm tương tác & quản trị |
| Hình 3.1 | Entity-Relationship Diagram (ERD) tổng thể |
| Hình 3.2 | ERD chi tiết — Quan hệ POSTS và các entity liên quan |
| Hình 4.1 | DFD Mức 0 — Context Diagram |
| Hình 4.2 | DFD Mức 1 — Forum Core Flow |
| Hình 4.3 | Luồng xác thực (Auth Flow) |
| Hình 4.4 | Luồng Vote → Cập nhật Reputation |
| Hình 4.5 | Kiến trúc SSE Notification |
| Hình 4.6 | Luồng xử lý báo cáo vi phạm |
| Hình 5.1 | State Machine — Trạng thái bài viết (PostStatus) |
| Hình 5.2 | Cấu trúc cây Comment (2 cấp) |
| Hình 6.1 | Quy trình Report Management Workflow |

---

## DANH MỤC TỪ VIẾT TẮT

| Từ viết tắt | Ý nghĩa |
|------------|---------|
| **MIS** | Management Information System — Hệ thống thông tin quản lý |
| **IPO** | Input-Processing-Output — Mô hình vào-xử lý-ra |
| **DFD** | Data Flow Diagram — Sơ đồ luồng dữ liệu |
| **ERD** | Entity-Relationship Diagram — Sơ đồ thực thể-quan hệ |
| **UC** | Use Case — Trường hợp sử dụng |
| **RBAC** | Role-Based Access Control — Kiểm soát truy cập theo vai trò |
| **JWT** | JSON Web Token — Token xác thực |
| **OTP** | One-Time Password — Mật khẩu dùng một lần |
| **SSE** | Server-Sent Events — Sự kiện từ server |
| **CDN** | Content Delivery Network — Mạng phân phối nội dung |
| **CRUD** | Create-Read-Update-Delete — Các thao tác dữ liệu cơ bản |
| **FTS** | Full-Text Search — Tìm kiếm toàn văn bản |
| **API** | Application Programming Interface — Giao diện lập trình ứng dụng |
| **ORM** | Object-Relational Mapping — Ánh xạ đối tượng-quan hệ |
