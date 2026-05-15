# DÀN Ý: VẤN ĐỀ CẦN LƯU Ý CHO BÁO CÁO HSTTTÍCH HỢP & DỰ ÁN MINI-FORUM

## I. KHÁI NIỆM CỐT LÕI VỀ HỆ THỐNG THÔNG TIN TÍCH HỢP (HSTTT)

### 1. Định nghĩa & Phạm vi tích hợp
- **HSTTT là gì?** Hệ thống gồm nhiều dịch vụ/thành phần độc lập nhưng được tích hợp để hoạt động như một hệ thống thống nhất
- **Mục đích tích hợp:** Chia sẻ dữ liệu, quy trình nghiệp vụ, và tài nguyên giữa các thành phần
- **Lợi ích:** Tái sử dụng mã, linh hoạt sáng lập, dễ bảo trì, mở rộng
- **Thách thức:** Độ phức tạp tăng, quản lý phụ thuộc, đồng bộ dữ liệu

### 2. Mô hình tích hợp (Integration Patterns)
- **Point-to-Point:** Giao tiếp trực tiếp (ít dùng, khó mở rộng)
- **Hub-and-Spoke:** Một điểm trung tâm (Backend API làm hub)
- **Event-Driven:** Dựa trên sự kiện (có thể thêm vào tương lai)
- **API-First:** Mọi giao tiếp đều thông qua API (MINI-FORUM sử dụng)

### 3. Các kiểu tích hợp trong MINI-FORUM
- **Tích hợp trong (Internal Integration):** Backend ↔ Frontend, Frontend ↔ Admin-Client
- **Tích hợp liên dịch vụ (Inter-service):** Backend ↔ Vibe-Content
- **Tích hợp ngoài (External Integration/Blackbox):** Backend ↔ ImageKit, Brevo

---

## II. TÍCH HỢP GIỮA CÁC SERVICE (Service-to-Service Integration)

### 1. Kiến trúc giao tiếp Backend ↔ Vibe-Content Service
- **Giao thức:** REST API over HTTP/HTTPS
- **Vấn đề lưu ý:**
  - ✓ **Xác định rõ hợp đồng API (API Contract)**
    - Endpoint định nghĩa rõ ràng, tham số input/output
    - Status code: 200, 400, 401, 403, 404, 500, 503
    - Timeout strategy (bao lâu là quá lâu?)
  - ✓ **Xử lý lỗi khi Vibe-Content không khả dụng**
    - Fallback mechanism: Retry logic? Circuit breaker?
    - Queuing: Nếu service down, có đưa vào queue không?
  - ✓ **Đảm bảo consistency dữ liệu**
    - Dữ liệu trong Backend DB phải match với dữ liệu do Vibe-Content tạo
    - Nếu Vibe-Content tạo content nhưng Backend update DB thất bại → inconsistency
  - ✓ **Quản lý phiên bản API**
    - Nếu API thay đổi, làm sao maintain backward compatibility?

### 2. API-First Integration Principle
- **Nguyên tắc:** Tất cả giao tiếp PHẢI qua API, không bypass qua DB trực tiếp
- **Vấn đề lưu ý:**
  - ✓ Vibe-Content có thể viết trực tiếp vào DB không?
    - Nếu có → Vấn đề: Backend không biết dữ liệu mới, không trigger business logic cần thiết
    - Kết luận: **KHÔNG nên bypass API**
  - ✓ Backend khi update dữ liệu của Vibe-Content, có phải notify lại Vibe-Content không?
    - Ví dụ: Admin xóa một bài viết → Có phải tell Vibe-Content biết không?

### 3. Độc lập dữ liệu (Data Isolation)
- **Mỗi service có DB riêng không?**
  - MINI-FORUM: Hiện tại chia sẻ 1 DB PostgreSQL
  - Vấn đề: Nếu Vibe-Content viết trực tiếp vào tables → Tight coupling
  - Giải pháp: Có thể chia tables riêng, nhưng giao tiếp qua API
- **Ownership dữ liệu:**
  - Backend "sở hữu" table: users, posts, comments, etc.
  - Vibe-Content "sở hữu" table: (nếu có) generated_content, vibes, etc.
  - Chỉ thay đổi dữ liệu của mình qua API

### 4. Xác thực & Phân quyền giữa các service
- **Vấn đề lưu ý:**
  - ✓ Vibe-Content gọi Backend API → Cần xác thực như thế nào?
    - Service-to-service token (JWT với role="VIBE_SERVICE")?
    - API Key riêng?
    - OAuth2 flow?
  - ✓ Backend gọi Vibe-Content → Vibe-Content có thể từ chối không?
    - Cần phân quyền: Chỉ generate content với ownership hợp lệ
  - ✓ Logging & Audit trail: Dữ liệu do Vibe-Content tạo có track được origin không?

### 5. Load & Scaling
- **Vấn đề lưu ý:**
  - ✓ Nếu Vibe-Content quá tải → Ảnh hưởng đến Backend không?
    - Cần có request timeout, rate limiting
  - ✓ Nếu Backend quá tải → Vibe-Content có queue request không?
  - ✓ Monitoring: Có theo dõi latency giữa hai service không?

---

## III. TÍCH HỢP GIỮA CÁC THÀNH PHẦN (Component Integration)

### 1. Frontend ↔ Backend Integration
- **Giao thức:** REST API + React Query (caching, synchronization)
- **Vấn đề lưu ý:**
  - ✓ **State Management:**
    - Client-side state (React state) vs Server state (DB)
    - Sync mechanism: Khi nào refetch, khi nào invalidate cache?
  - ✓ **Error handling:**
    - API error (500, 404, etc.) → UX như thế nào?
    - Network error (offline) → Có retry, cache fallback không?
  - ✓ **Real-time updates:**
    - Người A tạo post → Người B có ngay thấy không? (polling? websocket?)
    - Hiện tại có polling không? Có SSE không?

### 2. Frontend ↔ Admin-Client Integration
- **Tách biệt không?**
  - ✓ Cùng codebase hay khác?
  - ✓ Cùng API endpoint hay khác?
  - ✓ Phân quyền: Admin-Client có thể access mọi endpoint không?

### 3. Sharing UI Components/Utilities
- **Vấn đề lưu ý:**
  - ✓ Có shared component library giữa frontend và admin-client không?
  - ✓ Nếu có → Cách maintain consistency?
  - ✓ Nếu không → Có tái lập mã? (DRY principle)

### 4. Vibe-Content ↔ Frontend (gián tiếp qua Backend)
- **Workflow:**
  - Frontend request → Backend → Backend gọi Vibe-Content → Response back
  - Vấn đề: Latency có chấp nhận được không?
  - UX: Có loading spinner, timeout handling không?

---

## IV. TÍCH HỢP BLACKBOX (Third-Party Services)

### A. ImageKit Integration (Media CDN)

#### 1. Vai trò trong kiến trúc
- **Mục đích:** Lưu trữ, xử lý, và phân phối media (avatar, post images)
- **Lợi ích:** Giảm tải cho server, CDN global, optimize image format

#### 2. Vấn đề tích hợp cần lưu ý
- **✓ Upload Flow:**
  - Client upload trực tiếp lên ImageKit hay Backend upload?
  - Nếu Backend upload → Cần validate kích thước, format trước khi gửi
  - Nếu Client upload → Validate ở phía nào? (Client + Backend double-check)
  
- **✓ URL Transformation & CDN Optimization:**
  - ImageKit cung cấp URL transformation parameters (resize, quality, format)
  - Vấn đề: Frontend có hardcode URL parameters không?
  - Giải pháp: Backend nên cung cấp transformation profiles, Frontend dùng
  - Ví dụ: `/w-200,h-200,c-maintain_ratio` cho avatar thumbnail
  
- **✓ Error Handling:**
  - Nếu upload ImageKit thất bại → Retry? Fallback?
  - Nếu ImageKit down → Server image placeholder?
  - Monitoring: Có track upload failure rate không?
  
- **✓ Bảo mật:**
  - API key/token được lưu ở đâu? (Environment variables, .env.local)
  - Có leakage API key trong client-side code không?
  - Upload token có expiration không?
  
- **✓ Cost & Quota:**
  - ImageKit có giới hạn storage, bandwidth không?
  - Cách theo dõi usage? (Alert khi sắp đạt limit)
  - Cleanup policy: Hình ảnh cũ được xóa khi nào?

#### 3. Data Flow
```
User (Upload) → Frontend → Backend → ImageKit API
                              ↓
                        Store metadata (URL, fileId) in DB
```

#### 4. Dependency & Fallback
- **Hardcoded dependency:** Backend strongly depend on ImageKit
- **Mitigation:** Có abstraction layer (Adapter Pattern)? Có fallback storage (local disk)?

---

### B. Brevo OTP Mail Service Integration

#### 1. Vai trò trong kiến trúc
- **Mục đích:** Gửi OTP qua email cho xác thực 2FA, registration
- **Lợi ích:** Độc lập không rely on in-house email server, high deliverability

#### 2. Vấn đề tích hợp cần lưu ý
- **✓ Authentication Flow:**
  - OTP được tạo ở Backend
  - Gửi OTP qua Brevo API
  - User nhận email → Nhập OTP → Backend xác thực
  - Vấn đề: OTP có timeout không? (mọi OTP hợp lệ bao lâu?)
  
- **✓ Reliability:**
  - Email delivery không guaranteed 100% → Retry policy?
  - Nếu Brevo down → Fallback? (Retry với interval?)
  - User không nhận email → Có resend mechanism không?
  
- **✓ Rate Limiting:**
  - Prevent spam: 1 user không thể request OTP nhiều lần liên tục
  - Brevo có rate limit không? (msgs/day, msgs/minute)
  - Backend có implement rate limit trước không?
  
- **✓ Bảo mật:**
  - API key được lưu ở đâu?
  - OTP gửi qua email (unencrypted channel) → Công khai?
    - Mitigations: Short TTL (5-10 min), single-use, limited attempts
  - Email content có contain sensitive data không? (avoid logging PII)
  
- **✓ Monitoring & Troubleshooting:**
  - Có track email delivery success rate không?
  - Email bounce, complaint handling?
  - Có webhook từ Brevo để notify status không?

#### 3. Data Flow
```
User → Request OTP → Backend (generate OTP, store in cache/DB)
                        ↓
                    Brevo API (send email)
                        ↓
                    Brevo (send to SMTP)
                        ↓
                    User email (deliver)
```

#### 4. Dependency & Fallback
- **Hardcoded dependency:** Backend strongly depend on Brevo
- **Mitigation:** Có abstraction layer (Email Service Interface)?
- **Cost:** Brevo có free quota? Khi vượt → Tính phí?

---

### C. LLM Integration (Multi-LLM Fallback Chain)

#### 1. Vai trò trong kiến trúc
- **Mục đích:** Vibe-Content service dùng LLM để sinh content tự động
- **Models:** Google Gemini, Groq, Cerebras, Nvidia (fallback chain)

#### 2. Vấn đề tích hợp cần lưu ý
- **✓ Multi-LLM Fallback Strategy:**
  - Nếu LLM1 fail → Try LLM2
  - Nếu cả 2 fail → Fallback to predefined content? Retry later?
  - Vấn đề: Retry logic có exponential backoff không? Có max retry không?
  
- **✓ API Contract:**
  - Mỗi LLM provider có API khác → Cần abstraction layer
  - Unified interface: Tất cả LLM implement interface chung
  - Input prompt format, output parsing
  
- **✓ Token Usage & Cost:**
  - LLM sử dụng token → Có track cost/quota không?
  - Alert khi sắp vượt budget?
  - Rate limiting per user, per model?
  
- **✓ Response Quality & Safety:**
  - LLM output có cần validate không? (content filtering, format check)
  - Toxic content detection?
  - Caching LLM response để avoid duplicate calls?
  
- **✓ Latency:**
  - LLM API call slow → Backend timeout?
  - Async processing: Generate content in background, user được notified after?
  
- **✓ Monitoring:**
  - Có track LLM success rate, latency, error rate không?
  - Có log prompt + response để debug không?

#### 3. Data Flow
```
Backend → Vibe-Content Service (request content generation)
               ↓
            Try LLM1 (e.g., Gemini API)
               ↓ (fail)
            Try LLM2 (e.g., Groq API)
               ↓ (fail)
            Try LLM3 (e.g., Fallback)
               ↓ (success or all fail)
            Return generated content
               ↓
         Backend store in DB + notify Frontend
```

#### 4. Dependency & Fallback
- **Critical dependency:** Vibe-Content heavily depend on LLM
- **Mitigation:** Multi-LLM fallback, caching, graceful degradation

---

## V. KIẾN TRÚC VÀ THIẾT KẾ INTEGRATION

### 1. Adapter Pattern cho Blackbox Services
- **Vấn đề:**
  - Mỗi external service có API khác → Code coupling cao
  - Giải pháp: Adapter pattern (wrapper)
  
- **Lưu ý:**
  - ✓ Adapter nên chỉ handle protocol conversion, không business logic
  - ✓ Business logic ở service layer (usecase), Adapter ở infrastructure layer
  - ✓ Dễ test: Mock adapter trong unit test
  - ✓ Dễ replace: Swap ImageKit với S3, Brevo với SendGrid

### 2. Dependency Injection
- **Vấn đề:** Nếu hardcode dependency → Khó test, khó swap
- **Lưu ý:**
  - ✓ Inject ImageKit client vào Upload service
  - ✓ Inject Email client vào Authentication service
  - ✓ Inject LLM client vào Vibe-Content service
  - ✓ Test: Inject mock clients

### 3. Error Handling & Resilience
- **Types of errors:**
  - Network error (timeout, connection refused)
  - API error (4xx, 5xx)
  - Business logic error (validation fail)
  
- **Strategy:**
  - ✓ Retry with exponential backoff
  - ✓ Circuit breaker (stop calling service after N failures)
  - ✓ Timeout (set max wait time)
  - ✓ Fallback (use cached value, default behavior)
  - ✓ Graceful degradation (continue with reduced functionality)

### 4. Configuration & Environment Management
- **Vấn đề:**
  - Dev, staging, production có khác nhau không?
  - API keys, endpoints, timeouts
  
- **Lưu ý:**
  - ✓ Không hardcode configs → use .env files
  - ✓ Validate config on startup (fail fast)
  - ✓ Secrets management: Use secure vault, not plaintext
  - ✓ Rotation: Định kỳ rotate API keys

### 5. Versioning & Backward Compatibility
- **Vấn đề:**
  - Khi thay đổi API contract → Old clients break
  
- **Lưu ý:**
  - ✓ Version APIs (e.g., /api/v1/, /api/v2/)
  - ✓ Support multiple versions cùng lúc
  - ✓ Deprecation policy: Announce before removing
  - ✓ Internal APIs vs Public APIs (different versioning strategies)

---

## VI. CONSISTENCY & DATA SYNCHRONIZATION

### 1. Eventual Consistency
- **Vấn đề:**
  - Service A update dữ liệu → Service B chưa thấy ngay
  - Khi nào A và B sync?
  
- **Lưu ý:**
  - ✓ Define acceptable delay (Sync-up time)
  - ✓ Retry mechanism: Khi nào resync?
  - ✓ Conflict resolution: Nếu cùng modify → Prioritize ai?

### 2. Data Ownership & Authorization
- **Vấn đề:**
  - Service A có thể update dữ liệu của Service B không?
  
- **Lưu ý:**
  - ✓ Define data ownership rõ ràng (ownership matrix)
  - ✓ Authorization check: Chỉ owner có thể update
  - ✓ Audit trail: Log who changed what, when

### 3. Distributed Transactions
- **Vấn đề:**
  - Multi-step operation across services: Nếu step 2 fail → Rollback step 1?
  - Example: Create post (Backend) + Generate content (Vibe-Content) + Upload image (ImageKit)
  
- **Lưu ý:**
  - ✓ Saga pattern: Orchestrate multi-step transactions
  - ✓ Compensating transactions: Undo changes nếu fail
  - ✓ Idempotency: Retry-safe operations

---

## VII. SECURITY & INTEGRATION

### 1. Service-to-Service Authentication
- **Vấn đề:**
  - Backend gọi Vibe-Content → Cần authenticate?
  - Vibe-Content gọi Backend → Cần authenticate?
  
- **Lưu ý:**
  - ✓ Service-to-service token (e.g., JWT với iss=backend, aud=vibe-content)
  - ✓ Mutual TLS (mTLS): Both sides verify each other
  - ✓ API key: Simple but less secure (no expiration by default)

### 2. Third-Party Service Credentials
- **Vấn đề:**
  - ImageKit API key, Brevo API key → Bảo vệ thế nào?
  
- **Lưu ý:**
  - ✓ Never commit API keys to git
  - ✓ Use .env files (but not commit .env)
  - ✓ Rotate credentials periodically
  - ✓ Use service account / restricted keys
  - ✓ Vault / Secret management tool (AWS Secrets, HashiCorp Vault)

### 3. Data in Transit (HTTPS/TLS)
- **Vấn đề:**
  - Backend → Vibe-Content, Backend → ImageKit → All over HTTPS?
  
- **Lưu ý:**
  - ✓ Always use HTTPS/TLS for inter-service communication
  - ✓ Verify SSL certificates
  - ✓ Pin certificates (optional, for high security)

### 4. Data at Rest
- **Vấn đề:**
  - Sensitive data (OTP, API keys) stored in DB → Encrypt?
  
- **Lưu ý:**
  - ✓ Encrypt PII (Personally Identifiable Information)
  - ✓ Encryption key management (rotate, secure storage)
  - ✓ Database encryption (full disk encryption)

### 5. API Security
- **Vấn đề:**
  - Backend APIs accessible from Frontend → XSS risk?
  - Vibe-Content APIs accessible from Backend → Brute force?
  
- **Lưu ý:**
  - ✓ CORS: Only allow trusted origins
  - ✓ Rate limiting: Prevent brute force, DoS
  - ✓ Input validation: Sanitize input to prevent injection
  - ✓ Output encoding: Prevent XSS (especially from LLM output)

---

## VIII. MONITORING & OBSERVABILITY

### 1. Metrics to Track
- **Service-to-Service:**
  - Request latency (p50, p95, p99)
  - Success rate, error rate
  - Retry rate, circuit breaker trips
  
- **Blackbox Services:**
  - API availability
  - API rate limit usage
  - Cost / quota usage
  - Error categories (4xx vs 5xx)

### 2. Logging
- **Vấn đề:**
  - Multi-service → Logs spread across servers
  - How to trace single request across services?
  
- **Lưu ý:**
  - ✓ Distributed tracing: Assign request ID, pass through services
  - ✓ Centralized logging: Aggregate logs (e.g., ELK stack)
  - ✓ Log levels: Debug, Info, Warn, Error
  - ✓ Avoid logging sensitive data (PII, API keys, OTP)

### 3. Alerting
- **Lưu ý:**
  - ✓ Alert on service down
  - ✓ Alert on high latency (SLA breach)
  - ✓ Alert on high error rate
  - ✓ Alert on quota approaching limit
  - ✓ Define escalation: Who to notify, when

### 4. Health Checks
- **Vấn đề:**
  - How to know if Vibe-Content is healthy?
  - How to know if ImageKit is reachable?
  
- **Lưu ý:**
  - ✓ Implement /health endpoint for each service
  - ✓ Readiness check: Can service handle requests?
  - ✓ Liveness check: Is service still running?

---

## IX. DEPLOYMENT & OPERATIONS

### 1. Container Orchestration
- **Vấn đề:**
  - Multiple services → Deploy separately?
  
- **Lưu ý:**
  - ✓ Docker for each service (isolated, reproducible)
  - ✓ Docker Compose for local development
  - ✓ Kubernetes or similar for production (scalability)

### 2. Dependency Management
- **Vấn đề:**
  - Service A depends on Service B being up → Startup order?
  - Service A depends on DB being ready → DB migration before startup?
  
- **Lưu ý:**
  - ✓ Define startup dependencies
  - ✓ Health checks before allowing traffic
  - ✓ Graceful shutdown: Finish in-flight requests

### 3. Database Migrations
- **Vấn đề:**
  - Multiple services access same DB → Schema changes?
  
- **Lưu ý:**
  - ✓ Backward compatible migrations (add columns, not remove)
  - ✓ Run migrations before deploying code
  - ✓ Rollback plan: How to undo migration if fail?

### 4. Environment Parity
- **Vấn đề:**
  - Development, staging, production → Identical configs?
  
- **Lưu ý:**
  - ✓ Use same Docker image across environments
  - ✓ Different .env configs (different API keys, endpoints)
  - ✓ Test configs on staging before production

---

## X. TESTING STRATEGY

### 1. Unit Tests
- **Focus:** Individual components (services, adapters)
- **Lưu ý:**
  - ✓ Mock external services (ImageKit, Brevo, LLM)
  - ✓ Test error handling (when adapter throws)
  - ✓ Test business logic in isolation

### 2. Integration Tests
- **Focus:** Component interaction (Backend ↔ DB, Backend ↔ Vibe-Content)
- **Lưu ý:**
  - ✓ Use test containers (Docker) for external services
  - ✓ Test data flow end-to-end
  - ✓ Test error scenarios (service down, timeout, etc.)

### 3. End-to-End Tests
- **Focus:** Entire workflow (user registration with OTP, post creation with image)
- **Lưu ý:**
  - ✓ Use staging environment (close to production)
  - ✓ Test real external services (or stubs)
  - ✓ Smoke tests: Basic functionality checks

### 4. Load Testing
- **Focus:** Performance under load
- **Lưu ý:**
  - ✓ Simulate high traffic to Backend
  - ✓ Monitor external service rate limits
  - ✓ Test circuit breaker, timeout mechanisms

### 5. Chaos Engineering
- **Focus:** System resilience
- **Lưu ý:**
  - ✓ Simulate service failures (Vibe-Content down, ImageKit timeout)
  - ✓ Verify fallback mechanisms work
  - ✓ Verify graceful degradation

---

## XI. COMMON PITFALLS & HOW TO AVOID

### 1. **Tight Coupling**
- ❌ Backend directly calls Vibe-Content internal functions
- ✅ Backend calls Vibe-Content API through HTTP
- ✅ Use adapter pattern for external services

### 2. **Hardcoded Credentials**
- ❌ API keys in source code
- ✅ Use environment variables, secret management

### 3. **Missing Error Handling**
- ❌ Assume services always available
- ✅ Implement retry, timeout, fallback, circuit breaker

### 4. **Inconsistent Data**
- ❌ Multiple sources of truth
- ✅ Define data ownership, sync mechanism

### 5. **No Monitoring**
- ❌ Issues discovered by users
- ✅ Proactive monitoring, alerting, logging

### 6. **Cascading Failures**
- ❌ One service down → Others fail
- ✅ Isolate failures, graceful degradation

### 7. **Unversioned APIs**
- ❌ Breaking changes → All clients fail
- ✅ Version APIs, support multiple versions

### 8. **No Security**
- ❌ Transmit credentials in plaintext, no rate limiting
- ✅ Use HTTPS/TLS, rate limiting, input validation

### 9. **Poor Documentation**
- ❌ Unclear API contracts, configs, deployment steps
- ✅ Document APIs, deployment runbooks, troubleshooting guides

### 10. **Insufficient Testing**
- ❌ Only test happy path
- ✅ Test error scenarios, edge cases, integration points

---

## XII. CHECKLIST TRƯỚC KHI GỬI BÁO CÁO

### A. Khái Niệm
- [ ] Định nghĩa rõ ràng: HSTTT là gì, phạm vi tích hợp
- [ ] Giải thích mô hình tích hợp (API-First, Hub-and-Spoke)
- [ ] So sánh MINI-FORUM với các mô hình khác (Monolith, Microservices)

### B. Tích Hợp Giữa Services
- [ ] Mô tả Backend ↔ Vibe-Content communication
- [ ] API contract: Endpoints, parameters, responses
- [ ] Error handling & resilience
- [ ] Consistency & data synchronization
- [ ] Monitoring & health checks

### C. Tích Hợp Giữa Components
- [ ] Frontend ↔ Backend (React Query, caching)
- [ ] Frontend ↔ Admin-Client (separate or shared?)
- [ ] Component sharing strategy

### D. Tích Hợp Blackbox
#### ImageKit
- [ ] Upload flow (client-side vs server-side)
- [ ] URL transformation & CDN optimization
- [ ] Error handling & fallback
- [ ] Bảo mật (API key management)
- [ ] Data flow diagram

#### Brevo
- [ ] OTP workflow & flow
- [ ] Reliability & retry policy
- [ ] Rate limiting
- [ ] Bảo mật (credentials, TTL)
- [ ] Data flow diagram

#### LLM
- [ ] Multi-LLM fallback chain
- [ ] Token usage & cost tracking
- [ ] Response quality & safety
- [ ] Latency & async processing
- [ ] Data flow diagram

### E. Kiến Trúc & Thiết Kế
- [ ] Adapter Pattern cho blackbox services
- [ ] Dependency injection
- [ ] Error handling strategy
- [ ] Configuration management
- [ ] API versioning & backward compatibility

### F. Security
- [ ] Service-to-service authentication
- [ ] Credential management
- [ ] HTTPS/TLS
- [ ] Data encryption (at rest, in transit)
- [ ] Rate limiting, input validation

### G. Monitoring & Operations
- [ ] Metrics to track
- [ ] Logging strategy (distributed tracing)
- [ ] Alerting & health checks
- [ ] Deployment strategy
- [ ] Database migrations

### H. Testing
- [ ] Unit tests (mock external services)
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Load testing
- [ ] Error scenario testing

### I. Common Pitfalls
- [ ] Address potential issues (tight coupling, hardcoded credentials, etc.)
- [ ] Explain how MINI-FORUM avoids them

### J. Documentation & Diagrams
- [ ] Architecture diagrams (4-tier, service interaction)
- [ ] Sequence diagrams (authentication, content generation)
- [ ] Data flow diagrams (ImageKit, Brevo, LLM)
- [ ] ER diagram (database schema)
- [ ] Dependency matrix (who calls who)

### K. Code Quality
- [ ] Code examples from actual codebase (adapters, services)
- [ ] Explain design patterns used
- [ ] Best practices followed

---

## XIII. CẤU TRÚC BÁO CÁO ĐỀ XUẤT

```
Chương 3: THIẾT KẾ API & TÍCH HỢP
├── 3.1 Nguyên tắc thiết kế REST API
├── 3.2 Bản đồ API Routes
├── 3.3 Tích hợp giữa các Service
│   ├── 3.3.1 Backend ↔ Vibe-Content
│   ├── 3.3.2 API Contract & Error Handling
│   └── 3.3.3 Consistency & Data Synchronization
├── 3.4 Tích hợp giữa Components
│   ├── 3.4.1 Frontend ↔ Backend
│   ├── 3.4.2 Frontend ↔ Admin-Client
│   └── 3.4.3 State Management & Caching
└── 3.5 Middleware Security Stack (9 lớp)

Chương 5: TÍCH HỢP BLACKBOX & EXTERNAL SERVICES
├── 5.1 Tổng quan kiến trúc tích hợp
├── 5.2 Tích hợp ImageKit (Media CDN)
│   ├── 5.2.1 Upload Flow & URL Transformation
│   ├── 5.2.2 Error Handling & Fallback
│   ├── 5.2.3 Adapter Pattern
│   └── 5.2.4 Sequence Diagram: Media Upload
├── 5.3 Tích hợp Brevo (OTP Email Service)
│   ├── 5.3.1 OTP Workflow
│   ├── 5.3.2 Reliability & Retry Policy
│   ├── 5.3.3 Rate Limiting & Bảo mật
│   └── 5.3.4 Sequence Diagram: OTP Registration
├── 5.4 Tích hợp LLM (AI Content Generation)
│   ├── 5.4.1 Multi-LLM Fallback Chain
│   ├── 5.4.2 Cost & Quota Management
│   ├── 5.4.3 Response Quality & Safety
│   └── 5.4.4 Sequence Diagram: Content Generation
├── 5.5 Quản lý Credentials & Environment
└── 5.6 Monitoring & Observability
```

---

## XIV. GỢI Ý CÁC SỰ KIỆN / SCENARIO CẦN GIẢI THÍCH RÕ

1. **Happy Path: User upload avatar**
   - User → Frontend → Backend → ImageKit → Response
   - Nếu thành công → Store URL in DB, update user profile

2. **Error Path: ImageKit timeout**
   - Backend timeout waiting ImageKit → Retry? Fallback?
   - User UX: Loading spinner + timeout message

3. **Happy Path: User registration dengan OTP**
   - User → Frontend → Backend → Brevo OTP → Email → User nhập OTP → Backend verify

4. **Error Path: OTP expired**
   - User nhận OTP sau 5 phút → Code expired
   - UX: "Mã OTP hết hạn, vui lòng request lại"
   - Retry logic: Rate limiting?

5. **Happy Path: Vibe-Content generate post**
   - Admin trigger → Backend → Vibe-Content (LLM chain) → Generated content → Store in DB

6. **Error Path: LLM all fail**
   - Try Gemini → timeout
   - Try Groq → error
   - Try Cerebras → error
   - Fallback: Use template response, notify admin

7. **Cascading Failure: Vibe-Content down**
   - Backend timeout → Circuit breaker trips
   - Further requests rejected immediately (fail fast)
   - Admin notified → Vibe-Content restart

---

**END OF OUTLINE**
