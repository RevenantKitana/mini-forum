# DÀN Ý - NHỮNG VẤN ĐỀ CẦN LƯU Ý
## Báo cáo Quản trị dự án phần mềm - MINI-FORUM

---

## I. PHẦN CỐT LÕI CẦN LƯU Ý THEO MÔN HỌC

### 1. **TỔNG QUAN DỰ ÁN (Project Overview)**
- [ ] **Mô tả rõ ràng dự án:** Mini-Forum là gì? Giải quyết vấn đề gì?
- [ ] **Phạm vi (Scope):** Features nào được bao gồm/loại trừ?
- [ ] **Mục tiêu dự án (SMART):** Cụ thể, đo lường được, khả thi, liên quan, có thời hạn
- [ ] **Các bên liên quan (Stakeholders):** Giáo viên, người dùng, nhóm phát triển
- [ ] **Context kinh doanh:** Tại sao Mini-Forum lại quan trọng?

### 2. **MÔ HÌNH PHÁT TRIỂN & LỰA CHỌN (Development Model)**
- [ ] **Tại sao chọn Scrum?** So sánh với Waterfall, Kanban, V-model
- [ ] **Cấu trúc Scrum áp dụng:**
  - Sprint duration (2 tuần)
  - Số lượng Sprint (6 Sprint + 1 Buffer)
  - Các sự kiện Scrum (Sprint Planning, Daily Standup, Review, Retrospective)
- [ ] **Definition of Done (DoD):** 6 tiêu chí bắt buộc
- [ ] **Tính linh hoạt vs. Độ cứng:** Khi nào thay đổi?

### 3. **LẬP KỀ HOẠCH DỰ ÁN (Project Planning)**
- [ ] **Work Breakdown Structure (WBS):**
  - Phân chia từ dự án → Modules → User Stories → Tasks
  - Sơ đồ WBS phải hiển thị rõ cấu trúc
  
- [ ] **Product Backlog:**
  - 11 User Stories được định danh
  - Ưu tiên theo MoSCoW (Must/Should/Could/Won't)
  - Story Points ước lượng cho mỗi task
  
- [ ] **Sprint Planning chi tiết:**
  - Sprint 0: Setup + Architecture
  - Sprint 1: Auth & Users
  - Sprint 2: Forum Core
  - Sprint 3: Advanced Features
  - Sprint 4: Admin & Media
  - Sprint 5: AI + Testing + Deploy
  - Buffer Sprint: Xử lý rủi ro
  
- [ ] **Gantt Chart:**
  - Timeline 13 tuần rõ ràng
  - Mối phụ thuộc giữa các task
  - Critical Path

### 4. **QUẢN LÝ RỦI RO (Risk Management)**
- [ ] **Risk Register (7 rủi ro chính):**
  - **Rủi ro kỹ thuật:** Công nghệ mới, Integration
  - **Rủi ro nguồn lực:** Nhân sự thiếu kinh nghiệm
  - **Rủi ro lịch trình:** Delay các tính năng phức tạp
  - **Rủi ro chất lượng:** Testing không đầy đủ
  - **Rủi ro triển khai:** Deployment issues
  - **Rủi ro bảo mật:** Security vulnerabilities
  - **Rủi ro dữ liệu:** Data migration, backup
  
- [ ] **Ma trận rủi ro:**
  - Xác suất (Likelihood) × Tác động (Impact)
  - Phân loại: Critical/High/Medium/Low
  
- [ ] **Chiến lược xử lý:**
  - Avoid (Tránh): Từ bỏ hoặc thay đổi
  - Mitigate (Giảm nhẹ): Kế hoạch dự phòng
  - Accept (Chấp nhận): Monitor
  - Transfer (Chuyển): Giao cho bên thứ ba

### 5. **KIỂM SOÁT TIẾN ĐỘ & CHẤT LƯỢNG (Monitoring & Quality)**
- [ ] **Velocity Tracking:**
  - Story Points hoàn thành/Sprint
  - Tổng cộng 6 Sprint, so sánh định hướng
  - Dự báo hoàn thành
  
- [ ] **Burndown Chart:**
  - Biểu đồ giảm workload theo ngày trong Sprint
  - Mục tiêu: Đường xuống đến 0
  - Phát hiện các Sprint bị overload
  
- [ ] **Quality Gates (Cổng kiểm soát):**
  - Code review bắt buộc (≥2 reviewers)
  - Unit test coverage ≥ 70%
  - Linting & formatting pass
  - Integration tests pass
  - Documentation updated
  - Security scan clean
  
- [ ] **Quy trình Code Review:**
  - Ai review? (Peer review process)
  - Tiêu chí chấp nhận (Acceptance criteria)
  - Thời gian phản hồi
  - Handling disagreements
  
- [ ] **Test Coverage theo Module:**
  - Backend: Unit + Integration + API
  - Frontend: Component + Integration
  - E2E tests: Critical user flows

### 6. **QUẢN LÝ NGUỒN LỰC (Resource Management)**
- [ ] **Cấu trúc vai trò:**
  - Scrum Master: Người quản lý
  - Product Owner: Người định hướng
  - Development Team: Backend/Frontend/QA
  - (Nhận diện rõ người đảm nhận từng vai trò)
  
- [ ] **Phân bổ effort theo module:**
  - % thời gian cho mỗi tính năng
  - Load balancing trong team
  
- [ ] **Quản lý nợ kỹ thuật (Technical Debt):**
  - Code cần refactor
  - Legacy patterns cần cải thiện
  - Documentation gaps
  - Performance optimization cần làm
  - Bảng theo dõi: Nhận diện trong Sprint → Sprint nào fix?

---

## II. CÁC LĨNH VỰC CHUYÊN SÂU MINI-FORUM

### 7. **KIẾN TRÚC & CÔNG NGHỆ (Technical Architecture)**
- [ ] **Stack công nghệ:**
  - Frontend: React + TypeScript + Vite
  - Backend: Node.js + Express + Prisma
  - Database: PostgreSQL
  - Media: ImageKit
  - Deployment: Render/Vercel
  
- [ ] **19 Models trong Prisma schema:**
  - Relationships rõ ràng
  - Constraints & validation
  - Indexes trên các field quan trọng
  
- [ ] **API Design:**
  - RESTful endpoints hoặc GraphQL
  - Authentication: JWT
  - Authorization: RBAC
  - Rate limiting
  - Error handling & status codes
  
- [ ] **AI Bot Integration:**
  - LLM nào được sử dụng?
  - Prompting strategy
  - Cost & latency considerations

### 8. **TRIỂN KHAI & DEVOPS (Deployment)**
- [ ] **CI/CD Pipeline:**
  - Automated testing trên mỗi commit
  - Build process
  - Deployment strategy (Blue-Green? Canary?)
  
- [ ] **Environment Management:**
  - Development / Staging / Production
  - Configuration management
  - Environment variables
  
- [ ] **Monitoring & Logging:**
  - Error tracking (Sentry?)
  - Performance monitoring
  - Log aggregation
  
- [ ] **Disaster Recovery:**
  - Backup strategy
  - Restore procedure
  - RTO/RPO targets

### 9. **BẢO MẬT (Security)**
- [ ] **Authentication:**
  - JWT tokens, expiry, refresh
  - OTP for sensitive operations
  
- [ ] **Authorization:**
  - RBAC implementation
  - Permission checks
  
- [ ] **Data Protection:**
  - Input validation & sanitization
  - SQL injection prevention
  - XSS protection
  - CORS configuration
  
- [ ] **Media Handling:**
  - ImageKit integration security
  - Secure uploads
  - CDN caching

### 10. **TESTING STRATEGY (Kế hoạch kiểm thử)**
- [ ] **Unit Testing:**
  - Tools: Jest, Vitest
  - Coverage targets: ≥70%
  
- [ ] **Integration Testing:**
  - API endpoint testing
  - Database integration
  
- [ ] **E2E Testing:**
  - Critical user journeys
  - Tools: Playwright, Cypress?
  
- [ ] **Performance Testing:**
  - Load testing
  - Stress testing
  - Benchmarks

---