# Test Plan Thuc Thi - Mini Forum

## 1. Muc tieu
Tai lieu nay chuyen doi danh sach testcase de xuat thanh test plan co the thuc thi truc tiep, voi cac cot:
- `ID`
- `Precondition`
- `Steps`
- `Expected`
- `Priority`
- `Automation Target`

## 2. Quy uoc
- Priority:
  - `P0`: Critical, block release neu fail
  - `P1`: High, can co truoc release chinh
  - `P2`: Medium/Low, bo sung sau
- Automation Target:
  - `Jest Unit`
  - `Jest Integration`
  - `Supertest API`
  - `Vitest + RTL + MSW`
  - `Playwright E2E`
  - `System (Docker Compose)`
  - `Manual`

## 3. Global Preconditions
- DB test environment da migrate + seed toi thieu (users, categories, tags, bot users).
- Co san tai khoan role `MEMBER`, `MODERATOR`, `ADMIN`, `BOT`.
- Backend chay duoc o test mode.
- Frontend/Admin client dung API mock (MSW) cho component/integration tests.
- Vibe-content co mock LLM providers trong test.

## 4. Test Cases

### 4.1 Backend Unit
| ID | Precondition | Steps | Expected | Priority | Automation Target |
|---|---|---|---|---|---|
| BE-UNIT-001 | None | 1) Call slug util voi unicode + special chars | Slug duoc sanitize dung format | P1 | Jest Unit |
| BE-UNIT-002 | None | 1) Input slug > max length | Slug duoc truncate an toan | P1 | Jest Unit |
| BE-UNIT-003 | None | 1) Call snakeToCamelObject voi nested object/array | Tat ca key snake_case -> camelCase | P0 | Jest Unit |
| BE-UNIT-004 | None | 1) Validate schema fail tren nhieu field | Tra ve map error theo field | P1 | Jest Unit |
| BE-UNIT-005 | None | 1) Throw ValidationError vao errorMiddleware | HTTP code + payload dung contract | P0 | Jest Unit |
| BE-UNIT-006 | None | 1) Throw Prisma P2002/P2025 vao errorMiddleware | Map ve 409/404 dung | P0 | Jest Unit |
| BE-UNIT-007 | None | 1) authenticate khong co Bearer | Throw UnauthorizedError | P0 | Jest Unit |
| BE-UNIT-008 | None | 1) authenticate token het han | Throw UnauthorizedError | P0 | Jest Unit |
| BE-UNIT-009 | None | 1) optionalAuth voi token loi | Khong block request | P1 | Jest Unit |
| BE-UNIT-010 | None | 1) authorize voi role khong du quyen | Throw ForbiddenError | P0 | Jest Unit |
| BE-UNIT-011 | None | 1) sanitizeInput voi payload HTML | Chuoi duoc escape | P1 | Jest Unit |
| BE-UNIT-012 | None | 1) preventNoSQLInjection voi $where/$or | Throw BadRequestError | P0 | Jest Unit |
| BE-UNIT-013 | None | 1) validateContentType POST body != json | Tra ve 415 | P1 | Jest Unit |
| BE-UNIT-014 | None | 1) limitRequestSize voi content-length > max | Tra ve 413 | P1 | Jest Unit |

### 4.2 Backend Service Integration
| ID | Precondition | Steps | Expected | Priority | Automation Target |
|---|---|---|---|---|---|
| BE-INT-001 | Test DB co user | 1) register user moi hop le | Tao user + refresh token hash thanh cong | P0 | Jest Integration |
| BE-INT-002 | Email da ton tai | 1) register voi email trung | Fail ConflictError | P0 | Jest Integration |
| BE-INT-003 | Username da ton tai | 1) register voi username trung | Fail ConflictError | P0 | Jest Integration |
| BE-INT-004 | Co registrationToken hop le | 1) register kem token | is_verified = true, consume token | P0 | Jest Integration |
| BE-INT-005 | User active | 1) login bang email dung pass | Tra user + token pair | P0 | Jest Integration |
| BE-INT-006 | User active | 1) login bang username dung pass | Tra user + token pair | P0 | Jest Integration |
| BE-INT-007 | User inactive | 1) login | Fail unauthorized | P0 | Jest Integration |
| BE-INT-008 | Co refresh token hop le | 1) refresh access token | Token moi duoc tao, token cu bi revoke | P0 | Jest Integration |
| BE-INT-009 | Co user + sessions | 1) logoutAll | Toan bo refresh token user bi xoa | P0 | Jest Integration |
| BE-INT-010 | Co reset token hop le | 1) reset password | Password doi + revoke tat ca sessions | P0 | Jest Integration |
| BE-INT-011 | Co category/tag hop le | 1) create post | Post + post_tags tao dung | P0 | Jest Integration |
| BE-INT-012 | Category post_permission cao hon role | 1) create post voi MEMBER | Bi chan permission | P0 | Jest Integration |
| BE-INT-013 | Co post cua user A | 1) user B update post A | Bi tu choi neu khong mod/admin | P0 | Jest Integration |
| BE-INT-014 | Co parent_id + quoted_comment_id khac nhau | 1) create reply | Fail validation | P0 | Jest Integration |
| BE-INT-015 | Co vote record | 1) upvote -> downvote -> remove vote | Counter va record nhat quan | P0 | Jest Integration |
| BE-INT-016 | Co bookmark record | 1) bookmark trung lap | Khong tao duplicate | P1 | Jest Integration |
| BE-INT-017 | Co block relation | 1) block trung lap | Khong tao duplicate | P1 | Jest Integration |
| BE-INT-018 | Co report PENDING | 1) update status REVIEWING -> RESOLVED | Transition dung + reviewedBy/At set | P0 | Jest Integration |
| BE-INT-019 | Co notification | 1) soft delete -> restore | Trang thai deleted/read dung | P1 | Jest Integration |
| BE-INT-020 | Co SSE client | 1) sendToUser event | Client dung userId nhan event | P1 | Jest Integration |

### 4.3 Backend API Contract
| ID | Precondition | Steps | Expected | Priority | Automation Target |
|---|---|---|---|---|---|
| BE-API-001 | Backend up | 1) GET /ping | 200 + message pong | P0 | Supertest API |
| BE-API-002 | Backend up | 1) GET /api/v1/health | 200 + success true | P0 | Supertest API |
| BE-API-003 | Any endpoint | 1) Call endpoint tra data snake_case tai DB | Response ra camelCase | P0 | Supertest API |
| BE-API-004 | None | 1) GET /auth/check-email invalid | 400/422 validation | P1 | Supertest API |
| BE-API-005 | None | 1) POST /auth/send-otp-register 4 lan trong 5 phut | Lan vuot nguong tra 429 | P0 | Supertest API |
| BE-API-006 | None | 1) POST /auth/verify-otp-register voi OTP sai format | Validation fail | P0 | Supertest API |
| BE-API-007 | None | 1) POST /auth/register password khong strong | Validation fail | P0 | Supertest API |
| BE-API-008 | None | 1) POST /auth/login voi payload email key | Login duoc normalize sang identifier | P0 | Supertest API |
| BE-API-009 | Co refresh token body | 1) POST /auth/refresh | Tra token moi hop le | P0 | Supertest API |
| BE-API-010 | Khong auth | 1) GET /auth/me | 401 | P0 | Supertest API |
| BE-API-011 | Co auth member | 1) POST /posts title<10 | 400 validation | P0 | Supertest API |
| BE-API-012 | Co auth member | 1) GET /posts?page=0 | 400 validation | P1 | Supertest API |
| BE-API-013 | Co auth owner va non-owner | 1) PUT /posts/:id | Owner pass, non-owner fail | P0 | Supertest API |
| BE-API-014 | Co auth | 1) POST /posts/:postId/comments spam >5/1m | Bi limiter 429 | P0 | Supertest API |
| BE-API-015 | Co auth | 1) POST /posts/:id/vote spam >30/1m | Bi limiter 429 | P1 | Supertest API |
| BE-API-016 | Co auth | 1) POST /posts/:id/bookmark -> DELETE -> PATCH toggle | Trang thai bookmark dung | P1 | Supertest API |
| BE-API-017 | Co auth member | 1) PATCH /users/:id/password confirm khong trung | 400 validation | P0 | Supertest API |
| BE-API-018 | Co query | 1) GET /notifications?unreadOnly=false | unreadOnly parse dung false | P1 | Supertest API |
| BE-API-019 | Co member token | 1) GET /admin/metrics | 403 | P0 | Supertest API |
| BE-API-020 | Co moderator token | 1) PATCH /admin/users/:id/role | 403 (chi admin) | P0 | Supertest API |
| BE-API-021 | Co admin token | 1) PATCH /admin/posts/reorder-pins | 200 va pin_order cap nhat | P1 | Supertest API |
| BE-API-022 | Route khong ton tai | 1) GET /api/v1/abcxyz | 404 envelope loi dung | P1 | Supertest API |

### 4.4 Security & Resilience
| ID | Precondition | Steps | Expected | Priority | Automation Target |
|---|---|---|---|---|---|
| SEC-001 | Backend config CORS | 1) Request tu origin khong cho phep | Bi chan boi CORS | P0 | Supertest API |
| SEC-002 | Backend up | 1) Check security headers | Co X-Frame-Options, X-Content-Type-Options, Referrer-Policy | P1 | Supertest API |
| SEC-003 | None | 1) Gui payload query/body co $where/$or | Request bi reject | P0 | Supertest API |
| SEC-004 | None | 1) POST content chua script tag | Noi dung duoc sanitize/khong thuc thi script | P1 | Supertest API |
| SEC-005 | None | 1) Login sai lien tuc > authLimiter | 429 + Retry-After | P0 | Supertest API |
| SEC-006 | Co refresh token da rotate | 1) Dung lai token cu refresh tiep | Bi tu choi | P0 | Supertest API |
| SEC-007 | None | 1) Access voi JWT sai signature | 401 invalid token | P0 | Supertest API |
| SEC-008 | None | 1) POST JSON body lon hon gioi han | 413 | P1 | Supertest API |

### 4.5 Frontend (End-user)
| ID | Precondition | Steps | Expected | Priority | Automation Target |
|---|---|---|---|---|---|
| FE-COMP-001 | Mock AuthContext loading | 1) Render PrivateRoute | Hien spinner | P1 | Vitest + RTL + MSW |
| FE-COMP-002 | Mock unauthenticated | 1) Render PrivateRoute | Redirect /login + state.from | P0 | Vitest + RTL + MSW |
| FE-COMP-003 | Mock authenticated | 1) Render PrivateRoute | Render children | P0 | Vitest + RTL + MSW |
| FE-INT-001 | Mock API 401 x2 requests song song | 1) Fire 2 requests cung luc | Chi 1 refresh call, request queue dung | P0 | Vitest + RTL + MSW |
| FE-INT-002 | Mock API 429 | 1) Request bi 429 | Retry 1 lan sau backoff | P1 | Vitest + RTL + MSW |
| FE-INT-003 | Mock refresh fail | 1) Request 401 | clearTokens + redirect login | P0 | Vitest + RTL + MSW |
| FE-INT-004 | Co cached user + API /me tra 429 | 1) Init AuthProvider | Dung cached user, khong logout ngay | P1 | Vitest + RTL + MSW |
| FE-INT-005 | User thay doi role/id | 1) trigger InvalidationHandler | invalidate queries posts/search/comments/bookmarks | P1 | Vitest + RTL + MSW |
| FE-COMP-004 | Mock PostDetailPage states | 1) Toggle auth + permission + locked | Comment form hien/an dung | P0 | Vitest + RTL + MSW |
| FE-E2E-001 | Staging env co data | 1) Register/Login -> create post -> comment -> vote -> bookmark | User journey hoan chinh thanh cong | P0 | Playwright E2E |
| FE-E2E-002 | Staging env co OTP | 1) Forgot password flow | Reset pass thanh cong, login duoc bang pass moi | P0 | Playwright E2E |

### 4.6 Admin Client
| ID | Precondition | Steps | Expected | Priority | Automation Target |
|---|---|---|---|---|---|
| AD-COMP-001 | Auth loading | 1) Render ProtectedRoute | Hien loading spinner | P1 | Vitest + RTL + MSW |
| AD-COMP-002 | Not authenticated | 1) Render ProtectedRoute | Redirect login | P0 | Vitest + RTL + MSW |
| AD-COMP-003 | Moderator vao route requireAdmin | 1) Render ProtectedRoute(requireAdmin=true) | Hien Access Denied | P0 | Vitest + RTL + MSW |
| AD-INT-001 | Stored user role MEMBER | 1) init admin AuthContext | clearTokens + user null | P0 | Vitest + RTL + MSW |
| AD-INT-002 | Reports page mock data | 1) Resolve report | status update + refresh list | P0 | Vitest + RTL + MSW |
| AD-INT-003 | Users page mock constraints | 1) Doi role/status user | Action duoc chan/cho phep dung rule | P1 | Vitest + RTL + MSW |
| AD-INT-004 | Ops metrics > threshold | 1) Render dashboard | Hien canh bao dung | P1 | Vitest + RTL + MSW |
| AD-E2E-001 | Co admin + report pending | 1) Login admin -> xu ly report -> hide post/comment | Ket qua moderation phan anh tren frontend | P0 | Playwright E2E |

### 4.7 Vibe-content Unit/Integration
| ID | Precondition | Steps | Expected | Priority | Automation Target |
|---|---|---|---|---|---|
| VB-UNIT-001 | Mock providers queue | 1) generateByTask cho post/comment/vote_llm | Chon provider queue dung task | P0 | Jest Unit |
| VB-UNIT-002 | Provider A fail timeout, B success | 1) generateByTask | Fallback sang B thanh cong | P0 | Jest Unit |
| VB-UNIT-003 | Provider throw RATE_LIMIT | 1) generateByTask | set cooldown 2h cho provider | P0 | Jest Unit |
| VB-UNIT-004 | Cooldown da het han | 1) Goi lai provider | Provider duoc phep su dung lai | P1 | Jest Unit |
| VB-UNIT-005 | Provider fail lien tuc > threshold | 1) Goi generate lap lai | Circuit breaker OPEN | P0 | Jest Unit |
| VB-UNIT-006 | Missing API key provider | 1) getProviderStatusSnapshot | reason = missing_api_key | P1 | Jest Unit |
| VB-UNIT-007 | Timeout/unavailable > TTL | 1) getProviderStatusSnapshot sau TTL | transient unavailable duoc clear | P1 | Jest Unit |
| VB-UNIT-008 | Mock date rollover | 1) RateLimiter record hom nay, qua ngay | Counters reset dung | P1 | Jest Unit |
| VB-UNIT-009 | Tag list co invalid + valid | 1) validatePostOutput | Loc giu valid tags, reject neu khong con tag hop le | P0 | Jest Unit |
| VB-UNIT-010 | Comment co json artifact | 1) validateCommentOutput | Fail validation | P1 | Jest Unit |
| VB-UNIT-011 | Vote shouldVote=true voteType invalid | 1) validateVoteOutput | Fail validation | P0 | Jest Unit |
| VB-UNIT-012 | Token cache con han | 1) APIExecutor createPost | Khong login lai, dung token cache | P0 | Jest Unit |
| VB-UNIT-013 | Refresh fail | 1) APIExecutor createPost | Fall back login | P0 | Jest Unit |
| VB-UNIT-014 | RetryQueue parse_fail | 1) add action with validation failed | Khong enqueue retry | P0 | Jest Unit |
| VB-UNIT-015 | RetryQueue retry den max | 1) markRetried fail lien tuc | Item dua vao DLQ | P1 | Jest Unit |
| VB-INT-001 | Mock generator run chua xong | 1) Cron trigger 2 lan lien tiep | Lan 2 bi skip boi isRunning | P0 | Jest Integration |
| VB-INT-002 | Mock distributed lock da bi chiem | 1) Cron trigger | Job skip va khong chay song song | P0 | Jest Integration |
| VB-INT-003 | Output validation fail | 1) ContentGenerator runOnce | Khong enqueue retry | P0 | Jest Integration |
| VB-INT-004 | Error timeout/server | 1) ContentGenerator runOnce fail | Enqueue retry dung category | P1 | Jest Integration |
| VB-API-001 | Vibe service up | 1) GET /health | 200 hoac 207 theo provider state | P0 | Supertest API |
| VB-API-002 | Vibe service up | 1) GET /trigger/post/99 | 400 invalid label | P1 | Supertest API |

### 4.8 System & E2E Cross-Service
| ID | Precondition | Steps | Expected | Priority | Automation Target |
|---|---|---|---|---|---|
| SYS-001 | Docker stack day du | 1) Start services + seed | Tat ca service healthy | P0 | System (Docker Compose) |
| SYS-002 | Co bot users + API up | 1) Trigger vibe /trigger/post | Post tao qua backend thanh cong | P0 | System (Docker Compose) |
| SYS-003 | Co trigger comment/vote | 1) Trigger /trigger/comment + /trigger/vote | Comment/vote tao thanh cong | P0 | System (Docker Compose) |
| SYS-004 | Co admin user | 1) Admin thao tac lock/hide | Frontend user thay doi trang thai dung | P0 | System (Docker Compose) |
| SYS-005 | Co notification event | 1) Tao comment/reply | SSE push den dung user | P0 | System (Docker Compose) |
| SYS-006 | Co audit log endpoints | 1) Thuc hien action moderation | Audit log duoc ghi day du | P1 | System (Docker Compose) |
| SYS-007 | Co load profile | 1) Burst GET /posts va POST /posts | He thong khong vuot nguong loi nghiem trong | P1 | Manual |
| SYS-008 | Mock provider outage | 1) Tat provider chinh, giu fallback | Vibe van tao duoc noi dung qua fallback | P1 | System (Docker Compose) |
| E2E-001 | Staging env | 1) User A/B tuong tac post-comment-vote | UI + API state dong bo | P0 | Playwright E2E |
| E2E-002 | Staging env | 1) Admin xu ly report tu dashboard | Report status + target status cap nhat dung | P0 | Playwright E2E |

## 5. Uu tien trien khai de nghi
1. Pha 1 (P0): `BE-UNIT`, `BE-INT`, `BE-API`, `SEC`, `FE-INT`, `AD-COMP`, `VB-UNIT`, `SYS-001..005`.
2. Pha 2 (P1): bo sung cac case resilience, dashboard, DLQ, fallback sau load.
3. Pha 3 (P2): mo rong branch edge-cases va non-critical UX.

## 6. Traceability goi y
- Lien ket ID testcase vao ticket/Jira.
- Moi PR lien quan bug phai add/adjust testcase ID tu bang tren.
- CI gate toi thieu:
  - PR: P0 automation suites
  - Nightly: full P0 + P1 + system/e2e subset

