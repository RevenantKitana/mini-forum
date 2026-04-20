# VARIABLE NAMING MIGRATION CHECKLIST

## Muc tieu
- Thong nhat naming convention `snake_case` tren toan bo stack: DB schema, backend contract, frontend state/type.
- Loai bo 100% code convert runtime (`snakeToCamel`, `camelToSnake`, mapping thu cong chi de doi ten field).
- Trien khai theo thu tu an toan: `schema -> backend contract -> frontend -> xoa code convert`.

## Nguyen tac rollout an toan
- Khong thay doi tat ca trong 1 lan deploy.
- Moi phase phai co:
- Checklist verify.
- Smoke test.
- Rollback ro rang.
- Chi qua phase tiep theo khi phase hien tai da pass.

## Phase 0 - Chuan bi va dong bang contract
- [ ] Chot convention chinh thuc: tat ca field la `snake_case`.
- [ ] Chot pham vi API bi anh huong (auth, posts, comments, admin, metrics...).
- [ ] Tao branch migration rieng.
- [ ] Backup DB va xac nhan restore script chay duoc.
- [ ] Chot cua so deploy co monitoring.
- [ ] Baseline metric truoc migration:
- p95/p99 latency.
- Error rate 4xx/5xx.
- So endpoint dang phu thuoc convert middleware.

## Phase 1 - Schema DB (nguon su that)
- [ ] Kiem ke cac cot/table chua theo `snake_case`.
- [ ] Tao migration SQL rename cot/table sang `snake_case` (neu can).
- [ ] Update index/constraint/foreign key/triggers/views theo ten moi.
- [ ] Update seed scripts theo schema moi.
- [ ] Chay migration tren local + staging.
- [ ] Verify:
- Query CRUD quan trong pass.
- Khong con reference ten cot cu trong migration moi.
- [ ] Rollback plan:
- Script down migration hoac restore backup da test.

## Phase 2 - Backend contract (API tra va nhan snake_case truc tiep)
- [ ] Cap nhat model/service/controller de doc/ghi field `snake_case` truc tiep.
- [ ] Cap nhat validator schema (zod/joi/...) theo key `snake_case`.
- [ ] Cap nhat response envelope neu co field con dang camelCase.
- [ ] Cap nhat test backend:
- Unit test parser/validator.
- Integration test endpoint request/response key format.
- [ ] Them test guard:
- Fail neu response co key camelCase.
- [ ] Verify tren staging:
- Tat ca endpoint tra `snake_case` dung contract moi.
- [ ] Rollback plan:
- Revert release backend ve ban truoc.
- Neu can, bat lai layer tuong thich tam thoi.

## Phase 3 - Frontend va Admin client (dong bo contract moi)
- [ ] Cap nhat API client types/interface sang `snake_case`.
- [ ] Cap nhat request payload builders sang `snake_case`.
- [ ] Cap nhat parser va state selectors co dung field cu.
- [ ] Xoa mapping doi ten field thu cong trong service (vd: `categoryId -> category_id`).
- [ ] Cap nhat test frontend/admin:
- Unit test API services.
- E2E flow chinh (login, list, detail, create/update/delete).
- [ ] Verify:
- Khong con warning/undefined do doc field camelCase cu.
- [ ] Rollback plan:
- Revert frontend/admin release doc lap neu can.

## Phase 4 - Xoa toan bo code convert naming
- [ ] Xoa middleware convert response:
- `backend/src/app.ts` phan wrap `res.json`.
- [ ] Xoa utility convert:
- `backend/src/utils/snakeToCamel.ts`.
- [ ] Xoa import/usage lien quan convert trong backend.
- [ ] Xoa ghi chu/docs cu mo ta co transform runtime.
- [ ] Quet toan repo:
- Khong con `snakeToCamel`, `camelToSnake`, `toCamelCase`, `toSnakeCase`.
- [ ] Chay full test suite + smoke production checklist.

## Phase 5 - Hardening sau migration
- [ ] Them lint/convention rule de ngan field camelCase moi trong API layer.
- [ ] Them PR checklist:
- "API request/response da dung snake_case?"
- [ ] Them CI gate:
- Script scan key pattern trong contract test snapshots.
- [ ] Theo doi 24-72h sau deploy:
- Error rate.
- p95 latency.
- Bug report tu nguoi dung/noi bo.

## Exit criteria (Done definition)
- [ ] DB, backend, frontend/admin deu dung `snake_case`.
- [ ] Khong con middleware/utility convert naming runtime.
- [ ] Test unit/integration/E2E pass.
- [ ] Monitoring on dinh sau rollout.
- [ ] Docs duoc cap nhat dong bo.

## Danh sach file can cap nhat trong repo hien tai
- [ ] `backend/src/app.ts` (go bo global response transform).
- [ ] `backend/src/utils/snakeToCamel.ts` (xoa file khi hoan tat).
- [ ] `admin-client/src/api/services/adminService.ts` (xoa mapping doi ten field thu cong).
- [ ] `docs/TESTING_STRATEGY_REPORT.md` (cap nhat chien luoc test sau migration).
- [ ] `docs/TEST_PLAN_EXECUTION.md` (cap nhat test cases theo snake_case end-to-end).
- [ ] `docs/PRODUCTION_CHECKLIST.md` (bo checkpoints lien quan middleware convert cu).
