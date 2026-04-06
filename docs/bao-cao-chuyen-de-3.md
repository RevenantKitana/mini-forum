# Bao cao chuyen de 3 - De xuat ke hoach trien khai (Mini Forum)

**Du an lam doi tuong nghien cuu:** Mini Forum (monorepo: frontend, admin-client, backend, vibe-content)  

**Pham vi:** Phan tich du an va de xuat ke hoach trien khai bao cao cho 3 mon:
- Thuc tap he thong thong tin quan li
- Thuc tap he thong thong tin tich hop
- Thuc tap quan tri du an phan mem

**Luu y:** Tai lieu nay duoc viet de co the su dung truc tiep lam bo khung bao cao chuyen de. Co the bo sung hinh ve (DFD, BPMN, ERD, Sequence) va phu luc neu can.

---

## 1. Tom tat du an va pham vi nghien cuu

Mini Forum la nen tang dien dan cong dong tieng Viet, co he thong quan tri noi dung va bot AI tu dong tao noi dung. Kien truc monorepo gom cac thanh phan chinh sau:
- `frontend` (React + Vite): cong thong tin nguoi dung.
- `admin-client` (React): cong quan tri he thong.
- `backend` (Node.js + Express + Prisma): API trung tam, quan li nghiep vu, xac thuc, phan quyen, thong bao.
- `vibe-content` (Node.js/TS): dich vu tao noi dung tu dong, ket noi LLM provider (Gemini, Groq, Cerebras).
- Database: PostgreSQL (Prisma ORM).

**Doi tuong nghien cuu:** he thong thong tin quan li dien dan, mo hinh tich hop cac thanh phan (web app, admin, bot AI, email OTP), va quy trinh quan tri du an phan mem khi trien khai he thong.

---

## 2. Phan tich du an (tong quan nghiep vu, kien truc, du lieu)

### 2.1 Muc tieu nghiep vu
- Tao moi truong thao luan cong dong, quan li bai viet va binh luan theo danh muc va tags.
- Tang cuong chat luong noi dung va tinh tuong tac (vote, bookmark, thong bao).
- Quan tri van hanh (phan quyen RBAC, xu ly bao cao vi pham, audit log).
- Tu dong hoa tao noi dung qua bot AI nham duy tri luong bai viet.

### 2.2 Doi tuong su dung
- Member: dang bai, binh luan, vote, bookmark.
- Moderator: xu ly report, pin/lock bai, an/hien noi dung.
- Admin: quan ly users, categories, roles, audit logs.
- Bot: tao noi dung tu dong.

### 2.3 Chuc nang chinh
- Forum: posts, comments (reply), categories, tags.
- Vote va reputation.
- Auth: OTP, JWT access/refresh.
- Search full-text.
- Notifications va bookmarks.
- Quan tri: ban/unban, pin/lock, xu ly report, audit log.
- Bot AI: tao bai viet/binh luan, quan ly personality.

### 2.4 Kien truc va luong tich hop
- Frontend va Admin-Client goi API thong qua `backend` (REST /api/v1).
- `backend` truy xuat PostgreSQL thong qua Prisma.
- `vibe-content` ket noi LLM providers, sau do goi API backend de tao noi dung.
- He thong email OTP (nodemailer) cho dang ky va reset mat khau.

### 2.5 Du lieu va bao mat
- Role-based access control (RBAC) 4 cap: MEMBER, MODERATOR, ADMIN, BOT.
- JWT access (15 phut) va refresh (7 ngay).
- Rate limiting theo nhom endpoint.
- Audit log cho hanh dong quan tri.

---

## 3. Ke hoach trien khai bao cao chuyen de theo tung mon

### 3.1 Mon: Thuc tap he thong thong tin quan li

**Muc tieu bao cao:**
- Mo ta nghiep vu quan li dien dan va su dung he thong thong tin de ho tro quy trinh quan li.
- Xac dinh cac chuc nang quan li cot loi (users, posts, reports, audit logs) va phan quyen.
- Danh gia hieu qua cua he thong thong tin quan li dua tren bao cao thong ke va audit.

**Noi dung de xuat:**
- Phan tich nghiep vu: dang bai, kiem duyet noi dung, xu ly report, pin/lock, ban/unban.
- Mo hinh hoa quy trinh quan li: BPMN cho xu ly report va kiem duyet noi dung.
- Mo hinh du lieu quan li: ERD cho users, posts, comments, reports, audit_logs.
- He thong bao cao quan tri: thong ke bai viet, ty le vi pham, top users, audit log theo thoi gian.
- Ma tran phan quyen va trach nhiem theo role.

**Ke hoach thuc hien:**
1. Khao sat nghiep vu va thu thap yeu cau quan li.
2. Dung DFD/Use Case de dinh nghia tac nhan va luong xu ly.
3. Thiet ke ERD va mo hinh du lieu quan li.
4. Xay dung bo bao cao chi so (KPI) cho quan tri.
5. Danh gia rui ro van hanh va de xuat cai tien.

**San pham dau ra:**
- Tai lieu mo ta nghiep vu va use case.
- BPMN/DFD chinh cho xu ly report va quan tri bai viet.
- ERD tong quan va ma tran phan quyen.
- Bo chi so quan tri va mau bao cao thong ke.

---

### 3.2 Mon: Thuc tap he thong thong tin tich hop

**Muc tieu bao cao:**
- Mo ta kien truc tich hop giua cac he thong con (frontend, admin, backend, bot AI).
- Phan tich luong du lieu, cac diem tich hop va co che dong bo.
- Danh gia tinh on dinh, kha nang mo rong, va quy trinh tich hop ngoai (LLM providers, email).

**Noi dung de xuat:**
- So do kien truc tich hop (component diagram): frontend/admin/bot -> backend -> database.
- Mo ta hop dong API (API contracts) cho cac nhom endpoint quan tri va nguoi dung.
- Xac thuc va phan quyen xuyen suot (JWT, RBAC).
- Co che tich hop ngoai: LLM providers va email OTP.
- Co che kiem thu tich hop: test API, mock LLM, test luong OTP.

**Ke hoach thuc hien:**
1. Thong ke danh sach he thong con va luong giao tiep chinh.
2. Dac ta API va payload mau cho cac dich vu tich hop.
3. Ve sequence diagram cho luong tao bai viet, xu ly report, bot tao noi dung.
4. Thiet ke chuan logging va theo doi (audit log, error log).
5. Ke hoach test tich hop (API + end-to-end).

**San pham dau ra:**
- So do tich hop tong the va sequence diagram cho cac luong chinh.
- API reference rut gon cho chuc nang chinh.
- Kiem thu tich hop: danh muc test case va ket qua.
- Danh gia rui ro tich hop va phuong an giam thieu.

---

### 3.3 Mon: Thuc tap quan tri du an phan mem

**Muc tieu bao cao:**
- Lap ke hoach quan tri du an trien khai he thong Mini Forum.
- Xay dung WBS, tien do, nhan su, rui ro, va ke hoach dam bao chat luong.
- Dinh nghia tieu chi nghiem thu va ke hoach bao tri.

**Noi dung de xuat:**
- Pham vi du an: chuc nang forum, admin, bot AI, auth, search, thong bao.
- WBS theo module: backend, frontend, admin-client, vibe-content, database, testing.
- Ke hoach tien do (6-8 tuan) va cot moc nghiem thu.
- Ke hoach nhan su: PM, backend dev, frontend dev, QA, devops.
- Quan tri rui ro: LLM fail, bao mat, hieu nang, spam, qua tai.
- Quan tri chat luong: unit test, integration test, UAT, audit log.


**San pham dau ra:**
- Ke hoach du an (pham vi, WBS, tien do, nhan su, chi phi uoc tinh).
- Ke hoach rui ro va dam bao chat luong.
- Bien ban nghiem thu, ke hoach bao tri.

---

## 4. De xuat bo cuc bao cao chuyen de (ap dung chung)

- Gioi thieu de tai va muc tieu nghien cuu.
- Mo ta du an va kien truc tong quan.
- Phan tich he thong theo mon (quan li / tich hop / quan tri du an).
- Ke hoach trien khai va ke hoach kiem thu.
- Danh gia ket qua va huong phat trien tiep theo.

---

## 5. Danh muc tai lieu va minh chung can chuan bi

- So do kien truc tong the (component diagram).
- Use case diagram cho nguoi dung va quan tri.
- BPMN/DFD cho quy trinh xu ly report va kiem duyet.
- ERD cho cac bang chinh (users, posts, comments, reports, audit_logs).
- Sequence diagram cho luong bot tao noi dung va luong OTP.
- Bang phan quyen RBAC va mau bao cao thong ke.

---

## 6. Ghi chu bo sung

- Du an co san kiem thu co ban (Jest/Vitest) va audit report, co the dung lam co so danh gia chat luong.
- Neu can chi tiet API, co the bo sung tai lieu API reference tu backend.

