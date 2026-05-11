# Mini Forum - Sửa Chữa & Kế Hoạch (2026-05-11)

## 🔴 Issues Từ Deployment Logs

### 1. Prisma Version Outdated
**Nguyên nhân:** Logs warning: Prisma 5.22.0 → 7.8.0 available (major version)
**Tác động:** Potential security issues, missing fixes, performance improvements
**Priority:** HIGH
- [ ] Update `@prisma/client` từ 5.22.0 → 7.8.0
- [ ] Update `prisma` dev dependency
- [ ] Check schema compatibility
- [ ] Run migrations in staging before production

### 2. Brevo Email Service Failure 🔴 CRITICAL
**Error:** `Cannot read properties of undefined (reading 'instance')` in Brevo API
**Location:** `sendOtpEmailViaApi()` → `brevoApiService.ts`
**Root Cause:** `SibApiV3Sdk.ApiClient.instance` is undefined
**Impact:** OTP emails not sending → registration blocked

#### Issues to Fix:
- [ ] **Fix SDK initialization**: Check if `sib-api-v3-sdk@8.5.0` structure matches expected API
  - Review SDK docs for ApiClient initialization
  - Possibly need `new SibApiV3Sdk.ApiClient()` instead of `.instance`
  - Handle ESM/CommonJS compatibility issues
- [ ] **Add fallback error handling** in `brevoApiService.ts`
- [ ] **Add logging** for debugging SDK initialization
- [ ] **Test email sending** with valid Brevo credentials
- [ ] **Monitor email delivery** success/failure rate

### 3. Environment & Configuration
- [ ] Verify `BREVO_API_KEY` is set correctly on Render
- [ ] Check `BREVO_FROM_EMAIL` and `BREVO_FROM_NAME` config
- [ ] Validate email retry mechanism

---

## 📋 Fix Implementation Order

### Phase 1: Update Dependencies
1. Update Prisma in backend/package.json
   ```bash
   npm install @prisma/client@7.8.0
   npm install --save-dev prisma@7.8.0
   ```
2. Verify schema compatibility
3. Test migrations

### Phase 2: Fix Brevo Email Service
1. Debug `brevoApiService.ts` - line with `ApiClient.instance`
2. Update SDK initialization based on v8.5.0 API
3. Add comprehensive error logging
4. Create unit test for email sending

### Phase 3: Testing & Validation
1. Test OTP registration flow locally
2. Deploy to staging and test
3. Monitor production logs for email sending success

---

## 🔧 Files to Modify

- `backend/package.json` - Update Prisma versions
- `backend/src/services/brevoApiService.ts` - Fix ApiClient initialization
- `backend/src/services/emailService.ts` - Add error handling/logging
- `backend/src/config/index.ts` - Review Brevo config if needed

---

## ✅ Verification Checklist

- [ ] Prisma migrations run successfully
- [ ] OTP email sends successfully to test email
- [ ] Registration flow works end-to-end
- [ ] No new errors in production logs
- [ ] Email delivery rate is >95%
