# BÁO CÁO CHUYÊN ĐỀ THỰC TẬP
## MÔN HỌC: QUẢN TRỊ DỰ ÁN PHẦN MỀM

---

<div align="center">

**TRƯỜNG ĐẠI HỌC [TÊN TRƯỜNG]**
**KHOA CÔNG NGHỆ THÔNG TIN**

---

# BÁO CÁO THỰC TẬP CHUYÊN ĐỀ

## MÔN: QUẢN TRỊ DỰ ÁN PHẦN MỀM

---

### Đề tài:
# MINI-FORUM — ỨNG DỤNG DIỄN ĐÀN TRỰC TUYẾN FULL-STACK

---

**Thời gian thực tập:** 27/01/2026 – 27/04/2026

**Mô hình phát triển:** Scrum Agile (6 Sprint × 2 tuần + 1 tuần Buffer)

---

*Hà Nội, tháng 4 năm 2026*

</div>

---

## MỤC LỤC

| Chương | Tiêu đề | Trang |
|--------|---------|-------|
| **1** | **Tổng quan dự án** | 4 |
| 1.1 | Mô tả dự án | 4 |
| 1.2 | Phạm vi và mục tiêu | 5 |
| 1.3 | Các bên liên quan (Stakeholders) | 7 |
| **2** | **Mô hình phát triển và lý do lựa chọn** | 8 |
| 2.1 | So sánh các mô hình phát triển phần mềm | 8 |
| 2.2 | Cấu trúc Scrum áp dụng trong dự án | 10 |
| 2.3 | Definition of Done (DoD) | 12 |
| **3** | **Lập kế hoạch dự án** | 13 |
| 3.1 | Work Breakdown Structure (WBS) | 13 |
| 3.2 | Product Backlog và ưu tiên MoSCoW | 16 |
| 3.3 | Gantt Chart — Lịch trình dự án | 18 |
| 3.4 | Sprint Planning chi tiết (6 Sprint) | 19 |
| **4** | **Quản lý rủi ro** | 28 |
| 4.1 | Risk Register — Bảng đăng ký rủi ro | 28 |
| 4.2 | Ma trận xác suất — tác động | 30 |
| 4.3 | Chiến lược xử lý rủi ro thực tế | 31 |
| **5** | **Kiểm soát tiến độ và chất lượng** | 33 |
| 5.1 | Velocity Tracking — Theo dõi tốc độ phát triển | 33 |
| 5.2 | Burndown Chart — Biểu đồ tiêu hao | 35 |
| 5.3 | Quality Gates — Cổng kiểm soát chất lượng | 37 |
| 5.4 | Quy trình Code Review | 39 |
| **6** | **Quản lý nguồn lực** | 41 |
| 6.1 | Cấu trúc nhóm và phân công vai trò | 41 |
| 6.2 | Phân bổ thời gian theo module | 42 |
| 6.3 | Quản lý nợ kỹ thuật (Technical Debt) | 44 |
| **7** | **Kết quả và bài học kinh nghiệm** | 46 |
| 7.1 | Danh sách deliverables hoàn thành | 46 |
| 7.2 | Bài học kinh nghiệm (Lessons Learned) | 48 |
| 7.3 | Đề xuất cải tiến cho dự án tương lai | 50 |
| **Phụ lục** | **Tài liệu tham khảo & Tham chiếu kỹ thuật** | 52 |
| A | Bảng công nghệ và phiên bản | 52 |
| B | Cấu trúc thư mục backend | 53 |
| C | Danh sách 19 models trong Prisma schema | 54 |
| D | Danh mục tài liệu tham khảo | 55 |

---

## DANH MỤC BẢNG BIỂU

| Số thứ tự | Tiêu đề bảng | Chương |
|-----------|-------------|--------|
| Bảng 1.1 | Kiến trúc bốn thành phần hệ thống MINI-FORUM | 1 |
| Bảng 1.2 | Phạm vi kỹ thuật hệ thống | 1 |
| Bảng 1.3 | Phân tích các bên liên quan | 1 |
| Bảng 2.1 | So sánh các mô hình phát triển phần mềm | 2 |
| Bảng 2.2 | Cấu hình Scrum áp dụng | 2 |
| Bảng 2.3 | Definition of Done — 6 tiêu chí | 2 |
| Bảng 3.1 | Product Backlog — 11 User Stories | 3 |
| Bảng 3.2 | Sprint 0 — Khởi tạo (task breakdown) | 3 |
| Bảng 3.3 | Sprint 1 — Auth & Users | 3 |
| Bảng 3.4 | Sprint 2 — Forum Core | 3 |
| Bảng 3.5 | Sprint 3 — Tính năng Nâng cao | 3 |
| Bảng 3.6 | Sprint 4 — Admin & Media | 3 |
| Bảng 3.7 | Sprint 5 — AI Bot + Testing + Deploy | 3 |
| Bảng 4.1 | Risk Register — 7 rủi ro chính | 4 |
| Bảng 4.2 | Ma trận xác suất — tác động | 4 |
| Bảng 5.1 | Velocity Tracking theo 6 Sprint | 5 |
| Bảng 5.2 | Test coverage theo module | 5 |
| Bảng 5.3 | Công cụ và quy trình đảm bảo chất lượng | 5 |
| Bảng 6.1 | Phân bổ thời gian theo module | 6 |
| Bảng 6.2 | Bảng theo dõi nợ kỹ thuật | 6 |
| Bảng 7.1 | Deliverables hoàn thành | 7 |
| Bảng A.1 | Bảng công nghệ và phiên bản sử dụng | PL |
| Bảng C.1 | 19 Models trong Prisma schema | PL |

---

## DANH MỤC HÌNH VẼ & SƠ ĐỒ

| Số thứ tự | Tiêu đề | Chương |
|-----------|---------|--------|
| Hình 1.1 | Kiến trúc tổng thể hệ thống MINI-FORUM | 1 |
| Hình 2.1 | Vòng lặp Sprint trong Scrum | 2 |
| Hình 3.1 | Work Breakdown Structure (WBS) — cây phân tích công việc | 3 |
| Hình 3.2 | Gantt Chart — lịch trình 13 tuần | 3 |
| Hình 4.1 | Ma trận rủi ro (xác suất × tác động) | 4 |
| Hình 5.1 | Biểu đồ Velocity theo sprint | 5 |
| Hình 5.2 | Burndown Chart — Sprint 3 (mẫu) | 5 |
| Hình 6.1 | Sơ đồ tổ chức nhóm dự án | 6 |
| Hình 6.2 | Biểu đồ phân bổ effort theo module | 6 |

---

## DANH MỤC VIẾT TẮT

| Viết tắt | Nghĩa đầy đủ |
|----------|-------------|
| API | Application Programming Interface |
| CI/CD | Continuous Integration / Continuous Deployment |
| DoD | Definition of Done |
| ERD | Entity-Relationship Diagram |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| MVP | Minimum Viable Product |
| ORM | Object-Relational Mapping |
| OTP | One-Time Password |
| QTDAPM | Quản Trị Dự Án Phần Mềm |
| RBAC | Role-Based Access Control |
| SP | Story Points |
| SQL | Structured Query Language |
| SSE | Server-Sent Events |
| WBS | Work Breakdown Structure |
