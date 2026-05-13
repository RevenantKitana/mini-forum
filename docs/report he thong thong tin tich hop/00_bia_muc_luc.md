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

Báo cáo tập trung phân tích **6 khía cạnh tích hợp** cốt lõi:

1. **Kiến trúc 4-tier** với giao tiếp liên service qua REST API và Prisma ORM
2. **Thiết kế module** với phân tách trách nhiệm rõ ràng theo từng domain
3. **API-first integration** đảm bảo business logic nhất quán cho mọi consumer
4. **Bảo mật theo chiều sâu** (defense-in-depth) với 5 lớp độc lập theo OWASP
5. **Tích hợp AI** với Autonomous Agent và Multi-LLM fallback cho độ tin cậy cao
6. **Tích hợp blackbox** với ImageKit (media CDN) và Brevo (OTP email) theo Adapter Pattern

**Từ khóa:** Hệ thống thông tin tích hợp, REST API, Monorepo, Multi-LLM, JWT, RBAC, PostgreSQL, Docker, TypeScript, ImageKit, Brevo

---

## MỤC LỤC HỆ THỐNG THÔNG TIN QUẢN LÝ

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

**CHƯƠNG 5 — TÍCH HỢP BLACKBOX: IMAGEKIT VÀ BREVO OTP MAIL SERVICE**
- 5.1 Tổng quan kiến trúc tích hợp bên thứ ba
- 5.2 Tích hợp ImageKit — Lưu trữ và phân phối media
- 5.3 Tích hợp Brevo — OTP Mail Service
- 5.4 Quản lý biến môi trường và bảo mật credential
- 5.5 Xử lý lỗi và resilience
- 5.6 Sơ đồ luồng dữ liệu End-to-End cho media và email

**CHƯƠNG 6 — BẢO MẬT VÀ KIỂM SOÁT TRUY CẬP**
- 6.1 Kiến trúc bảo mật 5 lớp (Defense-in-Depth)
- 6.2 Ma trận phân quyền RBAC
- 6.3 Bảo vệ dữ liệu nhạy cảm
- 6.4 Tuân thủ OWASP Top 10
- 6.5 Bảo mật cho Vibe-Content Service

**CHƯƠNG 7 — TRIỂN KHAI VÀ VẬN HÀNH**
- 7.1 Containerization — Docker Multi-stage Build
- 7.2 Cấu hình triển khai đa nền tảng
- 7.3 Quản lý biến môi trường
- 7.4 Chiến lược migration cơ sở dữ liệu
- 7.5 Hệ thống giám sát (Observability)
- 7.6 Scripts bảo trì vận hành

**CHƯƠNG 8 — ĐÁNH GIÁ VÀ KẾT LUẬN**
- 8.1 Phân tích Trade-off các quyết định kiến trúc
- 8.2 Điểm mạnh của hệ thống tích hợp
- 8.3 Hạn chế hiện tại và hướng phát triển
- 8.4 Kết luận

**PHỤ LỤC**
- A. Cấu trúc thư mục đầy đủ
- B. Bảng mapping Sprint — Tích hợp
- C. Sơ đồ luồng dữ liệu End-to-End

---

## DANH MỤC BẢNG BIỂU

| Số thứ tự | Tên bảng | Chương |
|-----------|---------|--------|
| Bảng 1.1 | So sánh kiến trúc Monolith / Monorepo / Microservices | 1 |
| Bảng 1.2 | Tổng hợp 19 models trong PostgreSQL Schema | 1 |
| Bảng 3.1 | Nguyên tắc REST API và cách áp dụng | 3 |
| Bảng 3.2 | HTTP Status Code được sử dụng | 3 |
| Bảng 4.1 | Hai kênh giao tiếp của Vibe-Content | 4 |
| Bảng 5.1 | Phân tầng Adapter cho hai dịch vụ bên thứ ba | 5 |
| Bảng 5.2 | So sánh hai Transformation Preset ImageKit | 5 |
| Bảng 5.3 | Quy tắc nghiệp vụ khi upload media bài viết | 5 |
| Bảng 5.4 | Các cơ chế bảo mật trong luồng OTP | 5 |
| Bảng 5.5 | Biến môi trường cho hai dịch vụ bên thứ ba | 5 |
| Bảng 5.6 | Xử lý lỗi trong luồng ImageKit | 5 |
| Bảng 5.7 | So sánh chiến lược tích hợp ImageKit vs. Brevo | 5 |
| Bảng 6.1 | Ma trận phân quyền RBAC theo resource và role | 6 |
| Bảng 6.2 | Tuân thủ OWASP Top 10 | 6 |
| Bảng 6.3 | Hiệu quả 5 lớp bảo mật trước các loại tấn công | 6 |
| Bảng 7.1 | Cấu hình triển khai 5 thành phần | 7 |
| Bảng 8.1 | Trade-off các quyết định kiến trúc (8 quyết định) | 8 |

## DANH MỤC SƠ ĐỒ

| Số thứ tự | Tên sơ đồ | Chương |
|-----------|---------|--------|
| Hình 1.1 | Sơ đồ kiến trúc tổng thể MINI-FORUM 4-tier | 1 |
| Hình 1.2 | Entity Relationship Diagram (ERD) — 19 models | 1 |
| Hình 2.1 | Sơ đồ module Backend — 6 nhóm chức năng | 2 |
| Hình 2.2 | Dependency Graph — Luồng xử lý request qua middleware | 2 |
| Hình 3.1 | Sequence Diagram — Authentication Flow & Token Exchange | 3 |
| Hình 3.2 | Middleware Stack xử lý request (9 lớp) | 3 |
| Hình 4.1 | Kiến trúc Vibe-Content Autonomous Agent | 4 |
| Hình 4.2 | Multi-LLM Fallback Chain — Pipeline 8 bước | 4 |
| Hình 5.1 | Vị trí hai dịch vụ bên thứ ba trong kiến trúc tổng thể | 5 |
| Hình 5.2 | Sequence Diagram: Upload Avatar — Luồng tích hợp ImageKit | 5 |
| Hình 5.3 | Luồng URL transformation trên CDN ImageKit | 5 |
| Hình 5.4 | Kiến trúc phân tầng Email Service — Brevo Integration | 5 |
| Hình 5.5 | Sequence Diagram: OTP Registration Flow | 5 |
| Hình 5.6 | Luồng dữ liệu hoàn chỉnh — Media Upload và OTP Email | 5 |
| Hình 6.1 | Kiến trúc Defense-in-Depth 5 lớp bảo mật | 6 |
| Hình 6.2 | Hiệu quả 5 lớp bảo mật trước các loại tấn công | 6 |
| Hình 7.1 | Docker Multi-stage Build Pipeline | 7 |
| Hình 7.2 | Sơ đồ triển khai đa nền tảng (Render + Vercel) | 7 |
| Hình 8.6 | Luồng dữ liệu hoàn chỉnh: Media Upload và OTP Email | 8 |

---

## DANH MỤC TỪ VIẾT TẮT

| Ký tự | Ý nghĩa |
|------|---------|
| **AI** | Artificial Intelligence — Trí tuệ nhân tạo |
| **API** | Application Programming Interface — Giao diện lập trình ứng dụng |
| **CDN** | Content Delivery Network — Mạng phân phối nội dung |
| **CI/CD** | Continuous Integration / Continuous Deployment — Tích hợp liên tục / Triển khai liên tục |
| **CORS** | Cross-Origin Resource Sharing — Chia sẻ tài nguyên ngang origin |
| **CRUD** | Create, Read, Update, Delete — 4 thao tác dữ liệu cơ bản |
| **CSP** | Content-Security-Policy — Chính sách bảo mật nội dung |
| **Cron** | Cron Jobs — Tác vụ theo lịch định kỳ |
| **DAM** | Digital Asset Management — Quản lý tài sản số |
| **DB** | Database — Cơ sở dữ liệu |
| **Dev** | Development — Môi trường phát triển |
| **Docker** | Docker — Công cụ containerization |
| **ERD** | Entity-Relationship Diagram — Sơ đồ thực thể-quan hệ |
| **FTS** | Full-Text Search — Tìm kiếm toàn văn bản |
| **GIN** | Generalized Inverted Index — Chỉ mục đảo ngược |
| **HTTP/HTTPS** | Hypertext Transfer Protocol / Secure — Giao thức truyền tải an toàn |
| **JWT** | JSON Web Token — Token xác thực |
| **LLM** | Large Language Model — Mô hình ngôn ngữ lớn |
| **MIME** | Multipurpose Internet Mail Extensions — Mở rộng Internet đa năng |
| **Node.js** | Node.js — Runtime JavaScript phía server |
| **ORM** | Object-Relational Mapping — Ánh xạ đối tượng-quan hệ |
| **OTP** | One-Time Password — Mật khẩu dùng một lần |
| **OWASP** | Open Web Application Security Project — Dự án bảo mật ứng dụng web mở |
| **Prod** | Production — Môi trường sản xuất |
| **RBAC** | Role-Based Access Control — Kiểm soát truy cập theo vai trò |
| **REST** | Representational State Transfer — Phong cách kiến trúc API |
| **SPA** | Single Page Application — Ứng dụng một trang |
| **SQLi** | SQL Injection — Lỗ hổng tiêm SQL |
| **SSE** | Server-Sent Events — Sự kiện từ server |
| **TLS** | Transport Layer Security — Bảo mật tầng transport |
| **TTL** | Time To Live — Thời gian tồn tại |
| **UGC** | User Generated Content — Nội dung do người dùng tạo |
| **URL** | Uniform Resource Locator — Địa chỉ tài nguyên |
| **XSS** | Cross-Site Scripting — Tấn công script ngang site |

---

## TÀI LIỆU THAM KHẢO

Mục tài liệu tham khảo bao gồm 17 nguồn cốt lõi được chọn lọc theo tiêu chí: uy tín, quan trọng, và trực tiếp liên quan đến kiến trúc hệ thống tích hợp:

### Danh mục tài liệu tham khảo

**A. Kiến trúc hệ thống & API Design** — [1]–[5]
- Microservices patterns, REST architecture

**B. Công nghệ Backend cốt lõi** — [6]–[8]
- Express.js, Prisma ORM, PostgreSQL

**C. Xác thực & Bảo mật** — [9]–[11]
- JWT, TLS, OWASP Top 10

**D. Tích hợp AI & Large Language Models** — [12]–[13]
- LLM theory, Google Gemini

**E. Frontend & Công nghệ Web** — [14]–[15]
- React, TypeScript

**F. Containerization & Deployment** — [16]

**G. Thiết kế phần mềm & Code Quality** — [17]

**Chi tiết tài liệu tham khảo xem tại:** [09_tai_lieu_tham_khao.md](09_tai_lieu_tham_khao.md)
