# 🛠️ Mini Forum - Remote VM DevOps Toolset

Bộ công cụ tự động hóa triển khai và vận hành hệ thống Mini Forum trên Oracle Cloud VM (`134.185.83.12`).

---

## 📁 Danh sách công cụ trong thư mục này

| Tên Script | Mục đích sử dụng | Lệnh mẫu |
| :--- | :--- | :--- |
| **`bootstrap_all.sh`** | 🚀 **Master Zero-to-Production:** Chạy toàn bộ chu trình (Setup -> Deploy -> Restore DB -> Tunnel) | `./bootstrap_all.sh` |
| **`setup_vm.sh`** | Khởi tạo VM tiêu chuẩn: Cài đặt Swap 2GB, Docker, Docker Compose | `./setup_vm.sh` |
| **`setup_micro_vm.sh`** | ⚡ **Khởi tạo Micro VM (1GB RAM):** Tạo 4GB Swap, tối ưu sysctl kernel & Docker daemon | `./setup_micro_vm.sh` |
| **`deploy.sh`** | Đồng bộ code, build và reload containers (tùy chọn `--micro`) | `./deploy.sh` hoặc `./deploy.sh --micro` |
| **`deploy_micro.sh`** | ⚡ **Deploy Micro VM:** Build tuần tự tránh nghẽn CPU + chạy `docker-compose.micro.yml` | `./deploy_micro.sh` |
| **`install_tunnel.sh`** | Cài đặt và kích hoạt Cloudflare Tunnel service qua token | `./install_tunnel.sh <TOKEN>` |
| **`restore_db.sh`** | Tải file `.dump` mới nhất lên VM và nạp vào PostgreSQL | `./restore_db.sh` |
| **`backup_db.sh`** | Kích hoạt `pg_dump` trên VM và tự kéo file backup về `backend/backups/` | `./backup_db.sh` |
| **`status.sh`** | Kiểm tra tài nguyên VM (RAM, Disk, CPU) và trạng thái các container | `./status.sh` |
| **`logs.sh`** | Xem log thời gian thực của các service (`backend`, `vibe-content`, `postgres`, `tunnel`) | `./logs.sh backend -f` |
| **`ssh.sh`** | Kết nối SSH trực tiếp vào VM chỉ với 1 click | `./ssh.sh` |
| **`reset_vm.sh`** | Dọn dẹp cache Docker, dừng container (tùy chọn `--wipe-db` để reset data) | `./reset_vm.sh` |

---

## 🚀 Quy trình triển khai lần đầu (First-time Deployment)

> **Lưu ý:** Bạn có thể chạy các script này trực tiếp trên **Git Bash** hoặc gõ `bash scripts/remote-vm/<ten_script>.sh` trong PowerShell.

### Bước 1: Khởi tạo hệ thống trên VM
```bash
./scripts/remote-vm/setup_vm.sh
```
*(Script sẽ tự cấu hình Swap 2GB để chống tràn RAM và cài đặt Docker ARM64).*

---

### Bước 2: Đồng bộ code và Build hệ thống
```bash
./scripts/remote-vm/deploy.sh
```
*(Script sẽ nén code loại trừ `node_modules` và `.git`, đẩy lên VM và chạy `docker compose up --build -d`).*

---

### Bước 3: Khôi phục dữ liệu từ Supabase sang PostgreSQL trên VM
```bash
./scripts/remote-vm/restore_db.sh
```
*(Script sẽ tự động lấy bản dump mới nhất trong `backend/backups/` nạp vào PostgreSQL).*

---

### Bước 4: Kiểm tra trạng thái hoạt động
```bash
./scripts/remote-vm/status.sh
./scripts/remote-vm/logs.sh backend -f
```

---

## 🔒 Tích hợp Cloudflare Tunnel (Không cần mở Port)

1. Trên Cloudflare Zero Trust Dashboard, tạo 1 Tunnel và copy **Tunnel Token**.
2. Điền token vào file `.env` trên VM:
   ```env
   TUNNEL_TOKEN=eyJhIjoi...
   ```
3. Khởi chạy Cloudflare Tunnel:
   ```bash
   ./scripts/remote-vm/ssh.sh "cd /home/ubuntu/mini-forum && docker compose --profile tunnel up -d"
   ```
4. Trên Cloudflare Dashboard, cấu hình Public Hostname trỏ về:
   * **Service:** `HTTP`
   * **URL:** `backend:5000`

---

## ⚡ Triển khai trên VM Cấu Hình Thấp (1GB RAM - VM.Standard.E2.1.Micro)

Đối với máy ảo **Oracle Cloud Always Free AMD EPYC (1GB RAM, 1/8 OCPU)**:

1. **Khởi tạo và cấu hình Swap 4GB + Tối ưu Kernel:**
   ```bash
   ./scripts/remote-vm/setup_micro_vm.sh
   # Hoặc mở vm.bat -> bấm phím [S]
   ```
2. **Deploy với profile Micro:**
   ```bash
   ./scripts/remote-vm/deploy_micro.sh
   # Hoặc mở vm.bat -> bấm phím [M]
   ```
3. **Chi tiết thiết lập và cơ chế tối ưu:** Xem file [`docs/DEPLOY_MICRO_VM.md`](../../docs/DEPLOY_MICRO_VM.md).
