# Project Queues Checklist

## CI Recovery (Current Sprint)

- [x] P0-A1: Fix auth bleed from vote routes affecting `GET /api/v1/posts/:postId/comments`.
- [x] P0-A2: Refactor `votes.integration.test.ts` to avoid self-vote in success cases.
- [ ] Re-run `npm run test:coverage` and confirm all suites pass.
- [ ] Capture CI evidence in PR description (before/after failing suites).

## Stability

- [x] P1-B2: Run Jest with `--detectOpenHandles` and close remaining async handles.
- [x] P1-B1: Reduce OTP/Brevo noise in test logs via mocking/stub for test env.

## Quality Follow-up

- [x] P2-C1: Add targeted tests for low-coverage critical modules (`voteService`, `commentService`, `postService`, `adminController`).
- [ ] Define short-term coverage target and enforce in CI.

# CI Recovery Queue

## Objective
- Restore `backend` CI test stability (`npm run test:coverage`) after current failures on GitHub Actions.

## Queue A - Critical Fixes (Must pass first)

### A1. Fix route auth bleed for comments listing
- Priority: P0
- Owner: Backend API
- Problem:
  - `GET /api/v1/posts/:postId/comments` is expected public in tests.
  - It currently returns `401` on CI because `voteRoutes` applies global `authMiddleware` and is mounted before nested comment route.
- Root files:
  - `backend/src/routes/index.ts`
  - `backend/src/routes/voteRoutes.ts`
- Acceptance:
  - `comments.integration.test.ts` case `GET /api/v1/posts/:postId/comments` returns `200`.
  - No unintended auth requirement for non-vote endpoints.
- Suggested implementation:
  - Remove router-level `router.use(authMiddleware)` from `voteRoutes`.
  - Attach `authMiddleware` per vote endpoint (`GET/POST/DELETE` for post/comment votes).
  - Keep behavior unchanged for vote APIs (still require auth).

### A2. Fix vote integration tests using self-vote
- Priority: P0
- Owner: Backend Tests
- Problem:
  - Tests create post/comment with same user who later votes.
  - Service correctly blocks self-vote with `400`.
- Root files:
  - `backend/src/__tests__/votes.integration.test.ts`
  - `backend/src/services/voteService.ts`
- Acceptance:
  - Vote tests no longer depend on self-voting.
  - `POST /posts/:id/vote` and `POST /comments/:id/vote` success scenarios return `200` as intended.
  - `DELETE /posts/:id/vote` success scenario returns `204`.
- Suggested implementation:
  - Keep `author` user for creating content.
  - Add second `voter` user for vote actions.
  - Ensure cleanup deletes tokens/votes/users for both test users.

## Queue B - Stability & Signal Quality

### B1. Reduce noisy OTP/Brevo logs in CI test output
- Priority: P1
- Owner: Auth/Infra
- Problem:
  - OTP brute-force tests intentionally hit failure paths; CI logs show noisy `Failed to load sib-api-v3-sdk`.
- Root files:
  - `backend/src/services/emailService.ts`
  - `backend/src/services/otpService.ts`
  - `backend/src/__tests__/auth.integration.test.ts`
- Acceptance:
  - Tests still validate rate limit behavior.
  - CI logs are cleaner and avoid alarming false-positive error noise.
- Suggested implementation options:
  - Mock email sender in test env.
  - Or short-circuit OTP send path in test env with deterministic stub.

### B2. Investigate open handles warning in Jest
- Priority: P1
- Owner: Backend Platform
- Problem:
  - `Force exiting Jest ... --detectOpenHandles` indicates async resources not closing.
- Root files:
  - `backend/jest.setup.ts`
  - test suites with `afterAll` lifecycle
  - DB/HTTP/SSE related setup
- Acceptance:
  - Run with `--detectOpenHandles` produces actionable source.
  - Remove root cause (no forced exit needed).

## Queue C - Coverage Improvement (After Green CI)

### C1. Raise low-coverage high-risk modules
- Priority: P2
- Targets:
  - Controllers/services with very low coverage (`adminController`, `voteService`, `postService`, `commentService`, etc.).
- Acceptance:
  - Add focused tests for critical business rules and edge cases.
  - Improve branch coverage where authorization/permission logic is complex.

## Suggested Execution Order
1. A1
2. A2
3. Run full `npm run test:coverage`
4. B2
5. B1
6. C1

## Definition of Done
- All backend test suites pass on local and GitHub Actions.
- No unintended auth regressions on public endpoints.
- No force-exit Jest warning in CI logs.
- Queue checklist updated with status per task.
