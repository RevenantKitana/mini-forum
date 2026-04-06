# Bo cuc va noi dung bao cao mon Thuc tap he thong thong tin quan li

**De tai:** He thong thong tin quan li dien dan cong dong Mini Forum  
**Du an tham chieu:** Mini Forum (frontend, admin-client, backend, vibe-content)  
**Ngay lap:** 2026-04-06  
**Phien ban:** 1.0

---

## 1. Hinh thuc trinh bay

- Dinh dang: A4, can le trai 3.5 cm, phai 2.0 cm, tren 2.5 cm, duoi 2.5 cm.
- Font: Times New Roman, co chu 13, gian dong 1.3.
- Danh so muc: 1, 1.1, 1.1.1 theo thu tu logic.
- Hinh/bang: danh so theo chuong (Hinh 2.1, Bang 3.2), co tieu de va nguon (neu co).
- Dung thuat ngu: quan li, kiem duyet, phan quyen, bao cao, audit log.

---

## 2. Bo cuc bao cao (goi y 6 chuong)

### Chuong 1. Gioi thieu de tai
- Ly do chon de tai va y nghia thuc tien.
- Muc tieu nghien cuu.
- Doi tuong va pham vi nghien cuu.
- Phuong phap nghien cuu.
- Ket cau bao cao.

### Chuong 2. Co so ly thuyet va tong quan he thong quan li
- Khai niem he thong thong tin quan li.
- Cac thanh phan cua HTTTQL (du lieu, quy trinh, nhan su, cong nghe).
- Mo hinh hoat dong quan li trong he thong dien dan.
- Cac chi so quan tri (KPI): bai viet, binh luan, ty le vi pham, thoi gian xu ly report.

### Chuong 3. Phan tich nghiep vu va yeu cau he thong
- Mo ta nghiep vu tong quan cua Mini Forum.
- Tac nhan: Member, Moderator, Admin, Bot.
- Yeu cau chuc nang: quan tri users, posts, comments, reports, categories, tags, audit logs.
- Yeu cau phi chuc nang: bao mat, hieu nang, kha nang mo rong, kha dung.
- Mo hinh Use Case (tach use case quan tri va nguoi dung).
- Mo hinh quy trinh quan li (BPMN/DFD) cho:
  - Xu ly bao cao vi pham.
  - Kiem duyet va an/hien noi dung.
  - Ban/unban nguoi dung.

### Chuong 4. Mo hinh hoa he thong quan li
- Mo hinh du lieu (ERD) cho: users, posts, comments, reports, audit_logs, categories, tags.
- Ma tran phan quyen RBAC (4 role) va pham vi quyen quan tri.
- Mo hinh luong du lieu quan tri (DFD muc khung va muc chi tiet).
- Mo hinh giao dien quan tri (Admin-Client):
  - Dashboard thong ke.
  - Users/Posts/Comments/Reports/Tags/Categories.
  - Audit Logs.
- Dac ta bao cao quan tri (thong ke va audit).

### Chuong 5. Danh gia he thong thong tin quan li
- Muc do dap ung nghiep vu quan tri.
- Danh gia tinh day du va nhat quan cua du lieu (audit log, rate limit).
- Danh gia kha nang giam rui ro: spam, vi pham, qua tai.
- Chi so hieu qua quan tri (KPI) va cach do luong.
- Nhan xet uu diem, han che, huong cai tien.

### Chuong 6. Ket luan va huong phat trien
- Tom tat ket qua.
- Gia tri ung dung thuc tien.
- Dinh huong mo rong (analytics, quy trinh kiem duyet nang cao, tu dong hoa).

---

## 3. Noi dung chi tiet theo du an Mini Forum

### 3.1 Tong quan du an
- Kien truc: frontend + admin-client + backend + vibe-content + PostgreSQL.
- Trung tam quan li: admin-client (dashboard, moderation, audit).
- Cac chuc nang quan li co san: pin/lock bai, an/hien binh luan, xu ly reports, ban/unban, audit logs.

### 3.2 Nghiep vu quan li tieu bieu
- Xu ly report: Pending -> Reviewing -> Resolved/Dismissed.
- Quan li bai viet: pin, lock, doi trang thai (Published/Hidden/Deleted).
- Quan li nguoi dung: thay doi role, ban/unban.
- Quan tri danh muc/tags: CRUD va phan quyen theo role.
- Audit logs: ghi lai hanh dong admin (old/new values, IP, user agent).

### 3.3 Yeu cau va tieu chi danh gia
- Bao mat: JWT, RBAC, rate limiting.
- Truy vet: audit log day du.
- Hieu nang: thong ke co the tong hop theo thoi gian.
- Kha dung: dashboard tong quan, thao tac quan tri don gian.

---

## 4. Danh muc hinh ve va bang bieu can co

-  So do tong quan he thong thong tin quan li.
-  Use Case tong quan quan tri.
-  BPMN xu ly report vi pham.
-  ERD du lieu quan li.
-  DFD muc khung (quan tri).
-  Ma tran phan quyen RBAC.
-  KPI quan tri va mo ta cach do.
- ...

---


