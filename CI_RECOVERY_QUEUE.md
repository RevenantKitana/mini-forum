# CI Recovery Queue

Nguon log: `logs_65022403387` (run date: 2026-04-17)

## Priority P0 (lam truoc) - Done

- [ ] `backend` - fix Jest parse error `Identifier '__filename' has already been declared`
  - File lien quan: `backend/src/config/index.ts`
  - Huong: doi ten bien local `__filename`/`__dirname` sang ten khac de tranh xung dot runtime transform.
  - Verify:
    - `cd backend && npm run test:coverage`
  - Done khi:
    - Khong con parse error.
    - Test suites khong fail vi syntax.

- [ ] `vibe-content` - fix script test khong resolve duoc glob
  - File lien quan: `vibe-content/package.json`
  - Huong: sua `test` script de khong phu thuoc globstar shell (`**`) theo cach runner khong expand.
  - Verify:
    - `cd vibe-content && npm test`
  - Done khi:
    - Test files duoc detect va chay.

- [ ] `admin-client` - bo sung cau hinh ESLint
  - Thu muc lien quan: `admin-client/`
  - Huong: them `eslint.config.js` (hoac `.eslintrc.*`) phu hop bo package hien tai.
  - Verify:
    - `cd admin-client && npm run lint`
  - Done khi:
    - Khong con loi `ESLint couldn't find a configuration file`.

## Priority P1 (on dinh frontend type system)

- [ ] Dong bo React typing versions
  - Files lien quan: `frontend/package.json`, `frontend/package-lock.json`
  - Huong: dam bao `@types/react` va `@types/react-dom` cung major voi runtime React.
  - Verify:
    - `cd frontend && npm ci`
    - `cd frontend && npm run lint`

- [ ] Fix nhom loi Radix + `forwardRef`
  - Files lien quan:
    - `frontend/src/app/components/ui/dialog.tsx`
    - `frontend/src/app/components/ui/sheet.tsx`
    - `frontend/src/app/components/ui/sidebar.tsx`
  - Verify:
    - `cd frontend && npm run lint`

- [ ] Fix domain/type mismatch tren UI pages/components
  - Vi du loi trong:
    - `src/components/layout/Header.tsx`
    - `src/pages/CategoriesPage.tsx`
    - `src/pages/ProfilePage.tsx`
    - `src/pages/PostDetailPage.tsx`
  - Verify:
    - `cd frontend && npm run lint`
    - `cd frontend && npm run build`
    - `cd frontend && npm run test:coverage`

## Priority P2 (security + CI hygiene)

- [ ] Giam risk dependency vulnerabilities
  - Huong:
    - Chay `npm audit fix` theo tung package.
    - Danh gia breaking upgrade bat buoc (notably `bcrypt` chain).
  - Verify:
    - `npm audit --audit-level=high --omit=dev` trong tung project.

- [ ] Chuan hoa workflow truoc deprecation Node 20 actions
  - File lien quan: `.github/workflows/ci.yml`
  - Huong: cap nhat actions versions / runtime compatibility voi Node 24.
  - Moc can luu y:
    - Default force Node 24: 2026-06-02
    - Node 20 removed: 2026-09-16

- [ ] Giam warning upload coverage khi job fail som
  - File lien quan: `.github/workflows/ci.yml`
  - Huong: chi upload khi folder coverage ton tai.

## Tracking

- Owner:
- ETA:
- PR link:
- Last update:

## Definition of Done (toan pipeline)

- [ ] `Frontend - build & test` pass
- [ ] `Backend - build & test` pass
- [ ] `Admin Client - build & test` pass
- [ ] `Vibe Content - build & test` pass
- [ ] `Dependency vulnerability scan` pass theo policy team
- [ ] `Secret scanning (Gitleaks)` van pass
