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

## MỤC LỤC

| Chương | Tên chương | Trang |
|--------|-----------|-------|
| **Chương 1** | [Tổng quan hệ thống thông tin](./01_chuong_1_tong_quan.md) | 4 |
| **Chương 2** | [Phân tích nghiệp vụ](./02_chuong_2_phan_tich_nghiep_vu.md) | 9 |
| **Chương 3** | [Mô hình hóa dữ liệu](./03_chuong_3_mo_hinh_hoa_du_lieu.md) | 18 |
| **Chương 4** | [Luồng thông tin trong hệ thống](./04_chuong_4_luong_thong_tin.md) | 28 |
| **Chương 5** | [Đặc tả chức năng chi tiết](./05_chuong_5_dac_ta_chuc_nang.md) | 36 |
| **Chương 6** | [Hệ thống báo cáo và kiểm soát](./06_chuong_6_bao_cao_kiem_soat.md) | 46 |
| **Chương 7** | [Đánh giá và kết luận](./07_chuong_7_danh_gia_ket_luan.md) | 52 |
| **Phụ lục** | [Phụ lục kỹ thuật](./07_chuong_7_danh_gia_ket_luan.md#phụ-lục) | 57 |

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
