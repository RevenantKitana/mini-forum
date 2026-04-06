# Bo cuc va noi dung bao cao mon Thuc tap quan tri du an phan mem

**De tai:** Quan tri du an trien khai he thong Mini Forum  
**Du an tham chieu:** Mini Forum (frontend, admin-client, backend, vibe-content)  
**Ngay lap:** 2026-04-06  
**Phien ban:** 1.0

---

## 1. Hinh thuc trinh bay

- Ngon ngu: Tieng Viet, viet khong dau de dong bo voi tai lieu noi bo.
- Dinh dang: A4, can le trai 3.5 cm, phai 2.0 cm, tren 2.5 cm, duoi 2.5 cm.
- Font: Times New Roman, co chu 13, gian dong 1.3.
- Danh so muc: 1, 1.1, 1.1.1 theo thu tu logic.
- Hinh/bang: danh so theo chuong (Hinh 2.1, Bang 3.2), co tieu de va nguon (neu co).
- Dung thuat ngu: ...

---

## 2. Bo cuc bao cao (goi y 6 chuong)

### Chuong 1. Gioi thieu de tai
- Ly do chon de tai va y nghia thuc tien.
- Muc tieu quan tri du an.
- Doi tuong va pham vi nghien cuu.
- Phuong phap nghien cuu.
- Ket cau bao cao.

### Chuong 2. Co so ly thuyet ve quan tri du an phan mem
- Khai niem du an phan mem va vong doi (SDLC).
- Cac pha quan tri: khoi dong, lap ke hoach, thuc thi, giam sat, ket thuc.
- Cong cu quan tri: WBS, Gantt, RACI, risk register.
- Chi so quan ly du an: tien do, chi phi, chat luong, pham vi.

### Chuong 3. Xac dinh pham vi va ke hoach du an
- Pham vi chuc nang: forum, admin, bot AI, auth, search, thong bao.
- Pham vi phi chuc nang: bao mat, hieu nang, kha nang mo rong.
- WBS theo module: backend, frontend, admin-client, vibe-content, database, testing.
- Ke hoach tien do (6-8 tuan) va cot moc nghiem thu.
- Ke hoach nguon luc va nhan su.

### Chuong 4. Ke hoach thuc thi va giam sat
- Ke hoach trien khai theo giai doan.
- Quan ly thay doi (change control).
- Quan ly cau hinh, versioning, va tai lieu.
- Truyen thong du an va bao cao dinh ky.

### Chuong 5. Quan ly rui ro va dam bao chat luong
- Danh muc rui ro (bao mat, spam, LLM fail, qua tai).
- Danh gia muc do tac dong va ke hoach giam thieu.
- Ke hoach QA: unit test, integration test, UAT.
- Tieu chi nghiem thu va ban giao.

### Chuong 6. Ket luan va bai hoc kinh nghiem
- Tong ket ket qua quan tri du an.
- Bai hoc rut ra.
- De xuat huong phat trien.

---

## 3. Noi dung chi tiet theo du an Mini Forum

### 3.1 Pham vi du an
- Chuc nang chinh: posts, comments, vote, bookmarks, notifications, search.
- Quan tri: reports workflow, pin/lock, ban/unban, audit logs.
- Bot AI: tao noi dung tu dong, validation, fallback provider.

### 3.2 WBS tham khao
- WBS.1: Khoi dong va thu thap yeu cau.
- WBS.2: Thiet ke kien truc va mo hinh du lieu.
- WBS.3: Phat trien backend API + database.
- WBS.4: Phat trien frontend UI.
- WBS.5: Phat trien admin-client.
- WBS.6: Tich hop vibe-content (bot AI).
- WBS.7: Kiem thu va dam bao chat luong.
- WBS.8: Trien khai va nghiem thu.

### 3.3 Ke hoach tien do (goi y 8 tuan)
- Tuan 1: Khoi dong, pham vi, requirement.
- Tuan 2: Thiet ke, ERD, API contract.
- Tuan 3-4: Backend + DB.
- Tuan 5: Frontend + Admin.
- Tuan 6: Bot AI + tich hop.
- Tuan 7: Testing tong the.
- Tuan 8: Nghiem thu + bao cao.

### 3.4 Quan ly rui ro
- LLM provider down -> fallback + retry queue.
- Spam/noi dung xau -> rate limit + report workflow.
- Qua tai he thong -> cache + gioi han.
- Loi auth -> OTP rate limit + refresh token.

### 3.5 Ke hoach chat luong
- Unit test backend (Jest), frontend (Vitest).
- Integration test API.
- UAT cho admin-client.

---

## 4. Danh muc hinh ve va bang bieu can co

- Mo hinh vong doi du an phan mem.
- WBS tong quan du an.
- Gantt chart tien do 8 tuan.
- Pham vi chuc nang va phi chuc nang.
- Risk register.
- Tieu chi nghiem thu.
- ...

---

