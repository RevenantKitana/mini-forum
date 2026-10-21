# 🗄️ Legacy Documentation Archive - Mini Forum

Thư mục này lưu trữ các tài liệu kỹ thuật, đặc tả và hướng dẫn triển khai từ các giai đoạn phát triển trước của dự án Mini Forum. Các tài liệu tại đây được bảo tồn nhằm mục đích **đối chiếu lịch sử thiết kế, tra cứu giải pháp kỹ thuật và phục vụ kiểm toán hệ thống** khi cần thiết.

> [!NOTE]
> Các hướng dẫn triển khai trong thư mục này (Render, Supabase) không còn phản ánh kiến trúc production hiện tại của hệ thống. Để xem tài liệu mới nhất, vui lòng truy cập thư mục chính [`docs/`](../).

---

## 📋 Danh mục tài liệu lưu trữ (Legacy Catalog)

| Tên File | Chủ đề | Bối cảnh & Lý do lưu trữ | Tài liệu thay thế hiện tại |
| :--- | :--- | :--- | :--- |
| [`DEPLOY_CHECKLIST_RENDER.md`](./DEPLOY_CHECKLIST_RENDER.md) | Checklist Deploy Render | Checklist kiểm tra trước khi deploy lên Render + Supabase + Vercel. Lưu lại để đối chiếu các bước cấu hình biến môi trường và kiểm tra ban đầu. | [`DEPLOY_CHECKLIST.md`](../../DEPLOY_CHECKLIST.md) |
| [`VercelRenderSupabaseDEPLOYMENT.md`](./VercelRenderSupabaseDEPLOYMENT.md) | Hướng dẫn Deploy Render + Supabase | Hướng dẫn triển khai giai đoạn đầu (Backend + Vibe trên Render, DB trên Supabase, UI trên Vercel) trước khi hệ thống chuyển sang hạ tầng máy chủ ảo riêng (Oracle Cloud VM). | [`docs/DEPLOY_ORACLE_VM.md`](../DEPLOY_ORACLE_VM.md) & [`docs/DEPLOY_MICRO_VM.md`](../DEPLOY_MICRO_VM.md) |
| [`DB_SETUP_RENDER_SUPABASE.md`](./DB_SETUP_RENDER_SUPABASE.md) | Thiết lập CSDL Render & Supabase | Hướng dẫn kết nối và cấu hình PostgreSQL trên Render / Supabase kèm chuỗi kết nối SSL. | [`docs/DATABASE_GUIDE.md`](../DATABASE_GUIDE.md) |
| [`security_spec.md`](./security_spec.md) | Đặc tả Bảo mật Xác thực & Token | Lộ trình và đặc tả kỹ thuật 4 giai đoạn bảo mật: Chuyển token sang HttpOnly Cookie + In-Memory RAM, loại bỏ PII localStorage, Refresh Token Rotation (RTR) & Reuse Detection, CSP hardening. Đã hoàn thành 100% trong mã nguồn. | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) (Mục Security Architecture) |
| [`ANALYSIS_LLMHEALTH.md`](./ANALYSIS_LLMHEALTH.md) | Phân tích Kiểm tra Sức khỏe Multi-LLM | Tài liệu phân tích thiết kế module `LLMHealthCheckService` trong `vibe-content`, kiểm thử token tiêu thụ thấp, circuit breaker và thời gian phản hồi giữa 5 provider LLM. Module đã đi vào vận hành ổn định. | [`vibe-content/README.md`](../../vibe-content/README.md) & [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) |

---

## 🔍 Hướng dẫn tra cứu

- **Nếu muốn xem cách hệ thống đã giải quyết vấn đề bảo mật xác thực (RTR, Dual Token):** Đọc [`security_spec.md`](./security_spec.md).
- **Nếu muốn hiểu cơ chế test latency và circuit breaker của AI Bot:** Đọc [`ANALYSIS_LLMHEALTH.md`](./ANALYSIS_LLMHEALTH.md).
- **Nếu cần khôi phục hoặc kết nối lại Supabase làm CSDL dự phòng:** Đọc [`DB_SETUP_RENDER_SUPABASE.md`](./DB_SETUP_RENDER_SUPABASE.md).
