# BÁO CÁO CHUYÊN ĐỀ THỰC TẬP

---

<div align="center">

**TRƯỜNG ĐẠI HỌC [TÊN TRƯỜNG]**

**KHOA CÔNG NGHỆ THÔNG TIN**

---

# BÁO CÁO THỰC TẬP CHUYÊN NGÀNH

## MÔN: HỆ THỐNG THÔNG TIN TÍCH HỢP

---

**Đề tài:**

# MINI-FORUM — ỨNG DỤNG DIỄN ĐÀN TRỰC TUYẾN FULL-STACK

## PHÂN TÍCH KIẾN TRÚC TÍCH HỢP ĐA DỊCH VỤ VÀ TÍCH HỢP AI

---

**Thời gian thực tập:** 27/01/2026 – 27/04/2026

**Sinh viên thực hiện:** [Họ và Tên]

**Mã sinh viên:** [MSSV]

**Lớp:** [Tên lớp]

**Giảng viên hướng dẫn:** [Tên GV]

---

*[Địa danh], tháng 4 năm 2026*

</div>

---

## NHẬN XÉT CỦA GIẢNG VIÊN HƯỚNG DẪN

.............................................................................................................................

.............................................................................................................................

.............................................................................................................................

.............................................................................................................................

.............................................................................................................................

.............................................................................................................................

.............................................................................................................................

.............................................................................................................................

**Điểm đánh giá:** ...................... / 10

**Chữ ký giảng viên:**

---

## LỜI CAM ĐOAN

Tôi xin cam đoan rằng báo cáo thực tập này là công trình nghiên cứu của bản thân tôi. Tất cả các nội dung phân tích, thiết kế và các đoạn mã nguồn được trình bày trong báo cáo đều dựa trực tiếp trên codebase dự án **MINI-FORUM** và tài liệu kỹ thuật tương ứng. Các tài liệu tham khảo được trích dẫn đầy đủ và chính xác.

*[Địa danh], ngày 27 tháng 4 năm 2026*

*Sinh viên thực hiện*

*[Ký tên]*

*[Họ và Tên]*

---

## LỜI CẢM ƠN

Tôi xin trân trọng cảm ơn giảng viên hướng dẫn đã tận tình hỗ trợ trong suốt quá trình thực tập. Những định hướng về kiến trúc hệ thống thông tin tích hợp, thiết kế API và bảo mật ứng dụng đã giúp tôi hoàn thiện dự án theo đúng yêu cầu chuyên môn.

Tôi cũng cảm ơn cộng đồng mã nguồn mở, tài liệu kỹ thuật của các công nghệ: Node.js, PostgreSQL, Prisma ORM, Docker, và các nhà cung cấp LLM (Google Gemini, Groq, Cerebras, Nvidia) đã cung cấp nền tảng kỹ thuật vững chắc cho dự án này.

---

## TÓM TẮT BÁO CÁO

Báo cáo này trình bày quá trình xây dựng **MINI-FORUM** — một ứng dụng diễn đàn trực tuyến full-stack theo kiến trúc **Monorepo Multi-service**, được phát triển trong 3 tháng thực tập (27/01/2026 – 27/04/2026).

Hệ thống gồm 4 dịch vụ chính:
- **backend**: RESTful API với Express/TypeScript/Prisma (14 controllers, 21 services, 9 middlewares)
- **frontend**: Giao diện người dùng với React/Vite/React Query
- **admin-client**: Bảng điều khiển quản trị với React/Vite
- **vibe-content**: Dịch vụ sinh nội dung tự động bằng AI (Multi-LLM fallback chain)

Báo cáo tập trung phân tích **5 khía cạnh tích hợp** cốt lõi:

1. **Kiến trúc 4-tier** với giao tiếp liên service qua REST API và Prisma ORM
2. **Thiết kế module** với phân tách trách nhiệm rõ ràng theo từng domain
3. **API-first integration** đảm bảo business logic nhất quán cho mọi consumer
4. **Bảo mật theo chiều sâu** (defense-in-depth) với 5 lớp độc lập theo OWASP
5. **Tích hợp AI** với Autonomous Agent và Multi-LLM fallback cho độ tin cậy cao

**Từ khóa:** Hệ thống thông tin tích hợp, REST API, Monorepo, Multi-LLM, JWT, RBAC, PostgreSQL, Docker, TypeScript

---

## MỤC LỤC

**CHƯƠNG 1 — TỔNG QUAN KIẾN TRÚC HỆ THỐNG**
- 1.1 Bối cảnh và lý do chọn kiến trúc Monorepo Multi-service
- 1.2 Kiến trúc tổng thể 4-tier
- 1.3 Mô hình dữ liệu — PostgreSQL Database Schema
- 1.4 Nguyên tắc kiến trúc cốt lõi

**CHƯƠNG 2 — PHÂN TÍCH VÀ THIẾT KẾ MODULE**
- 2.1 Sơ đồ module Backend — 6 nhóm chức năng
- 2.2 Dependency Graph — Luồng xử lý request
- 2.3 Module Architecture — Vibe-Content Service (Pipeline 8 bước)
- 2.4 Frontend Module Structure

**CHƯƠNG 3 — THIẾT KẾ API VÀ GIAO TIẾP LIÊN SERVICE**
- 3.1 Nguyên tắc thiết kế REST API
- 3.2 Bản đồ API Routes — 15 nhóm route
- 3.3 Luồng xác thực — Token Exchange
- 3.4 Ma trận giao tiếp liên service
- 3.5 Middleware Security Stack — 9 lớp
- 3.6 Frontend API Integration với React Query

**CHƯƠNG 4 — TÍCH HỢP AI — VIBE-CONTENT SERVICE**
- 4.1 Kiến trúc tích hợp AI (Autonomous Agent)
- 4.2 Multi-LLM Fallback Chain
- 4.3 Hệ thống Personality cho Bot
- 4.4 Context-Aware Action Selection
- 4.5 Nguyên tắc API-first — Không bypass Database

**CHƯƠNG 5 — BẢO MẬT VÀ KIỂM SOÁT TRUY CẬP**
- 5.1 Tổng quan kiến trúc bảo mật 5 lớp
- 5.2 Ma trận phân quyền RBAC
- 5.3 Bảo vệ dữ liệu nhạy cảm
- 5.4 Tuân thủ OWASP Top 10

**CHƯƠNG 6 — TRIỂN KHAI VÀ VẬN HÀNH**
- 6.1 Containerization — Docker Multi-stage
- 6.2 Cấu hình triển khai đa nền tảng
- 6.3 Quản lý biến môi trường
- 6.4 Chiến lược migration cơ sở dữ liệu
- 6.5 Giám sát và quan sát hệ thống
- 6.6 Scripts bảo trì

**CHƯƠNG 7 — ĐÁNH GIÁ VÀ KẾT LUẬN**
- 7.1 Phân tích trade-off kiến trúc
- 7.2 Điểm mạnh của hệ thống tích hợp
- 7.3 Hạn chế và hướng phát triển
- 7.4 Kết luận

**PHỤ LỤC**
- A. Cấu trúc thư mục đầy đủ
- B. Bảng mapping Sprint — Tích hợp
- C. Sơ đồ luồng dữ liệu End-to-End

---

## DANH MỤC BẢNG BIỂU

| Số thứ tự | Tên bảng | Chương |
|-----------|---------|--------|
| Bảng 1.1 | So sánh kiến trúc Monolith / Monorepo / Microservices | 1 |
| Bảng 1.2 | Tổng hợp 19 model trong PostgreSQL Schema | 1 |
| Bảng 3.1 | Nguyên tắc REST API | 3 |
| Bảng 3.2 | Ma trận giao tiếp liên service | 3 |
| Bảng 4.1 | LLM Providers và đặc điểm | 4 |
| Bảng 5.1 | Ma trận phân quyền RBAC | 5 |
| Bảng 5.2 | Tuân thủ OWASP Top 10 | 5 |
| Bảng 6.1 | Cấu hình triển khai 5 service | 6 |
| Bảng 7.1 | Phân tích trade-off kiến trúc | 7 |
| Bảng 7.2 | Hạn chế và đề xuất nâng cấp | 7 |

## DANH MỤC SƠ ĐỒ

| Số thứ tự | Tên sơ đồ | Chương |
|-----------|---------|--------|
| Hình 1.1 | Sơ đồ kiến trúc tổng thể 4-tier | 1 |
| Hình 1.2 | Entity Relationship Diagram (ERD) | 1 |
| Hình 2.1 | Sơ đồ module Backend | 2 |
| Hình 2.2 | Dependency Graph — luồng xử lý request | 2 |
| Hình 2.3 | Pipeline Vibe-Content 8 bước | 2 |
| Hình 3.1 | Sequence Diagram — Authentication Flow | 3 |
| Hình 3.2 | Middleware Stack xử lý request | 3 |
| Hình 4.1 | Kiến trúc Vibe-Content Autonomous Agent | 4 |
| Hình 4.2 | Multi-LLM Fallback Chain | 4 |
| Hình 5.1 | Kiến trúc bảo mật 5 lớp | 5 |
| Hình 6.1 | Docker Multi-stage Build Process | 6 |
| Hình 6.2 | Sơ đồ triển khai đa nền tảng | 6 |
