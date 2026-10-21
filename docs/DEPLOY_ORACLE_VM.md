# 🚀 Hướng Dẫn Triển Khai & Vận Hành Trên Oracle Cloud VM

Tài liệu hướng dẫn chi tiết quy trình triển khai, cấu hình và vận hành hệ thống **Mini Forum** trên máy chủ ảo (Oracle Cloud Infrastructure — OCI VM hoặc bất kỳ Linux VPS nào) sử dụng bộ công cụ tự động hóa DevOps có sẵn trong dự án.

---

## 🏗️ 1. Kiến Trúc Hạ Tầng Máy Chủ (VM Architecture)

Hệ thống backend của Mini Forum chạy hoàn toàn trên Docker trong mạng nội bộ cô lập (`mini_forum_network`), kết nối an toàn ra ngoài Internet thông qua **Cloudflare Tunnel (Zero Trust)** mà **không cần mở bất kỳ cổng firewall (Inbound Port 5000/4000/5432) nào**.

```
                        INTERNET
                           │
       ┌───────────────────┴───────────────────┐
       │                                       │
       ▼                                       ▼
┌──────────────┐                       ┌──────────────┐
│   Frontend   │                       │ Admin Client │
│   (Vercel)   │                       │   (Vercel)   │
└──────┬───────┘                       └──────┬───────┘
       │ HTTPS                                │ HTTPS
       └───────────────────┬──────────────────┘
                           ▼
              Cloudflare Edge (Zero Trust)
                           │ Encrypted Tunnel
                           ▼
══════════════════════════════════════════════════════════
  Oracle Cloud VM (Ubuntu 22.04 / 24.04 LTS)
  
  ┌─────────────────────────────────────────────────────┐
  │  Docker Engine (Network: mini_forum_network)        │
  │                                                     │
  │  ┌─────────────────┐       ┌─────────────────────┐  │
  │  │ Cloudflare      │       │ Backend REST API    │  │
  │  │ Tunnel          ├──────►│ (Node 20, Express,  │  │
  │  │ (cloudflared)   │       │  Prisma ORM)        │  │
  │  └─────────────────┘       └──────────┬──────────┘  │
  │                                       │             │
  │  ┌─────────────────┐                  │             │
  │  │ Vibe-Content    │                  │             │
  │  │ (AI Bot Worker, ├──────────────────┤             │
  │  │  Multi-LLM)     │                  │             │
  │  └────────┬────────┘                  │             │
  │           │                           │             │
  │           └───────────┬───────────────┘             │
  │                       ▼                             │
  │            ┌─────────────────────┐                  │
  │            │ PostgreSQL 17       │                  │
  │            │ (Persistent Volume) │                  │
  │            └─────────────────────┘                  │
  └─────────────────────────────────────────────────────┘
══════════════════════════════════════════════════════════
```

---

## ⚖️ 2. Hai Chế Độ Tài Nguyên Máy Chủ

Dự án cung cấp 2 bộ cấu hình Docker Compose được tối ưu riêng biệt theo phần cứng:

### Chế độ A: Máy Cấu Hình Thấp (Micro VM - 1GB RAM)
- **Shape tiêu biểu:** Oracle Cloud `VM.Standard.E2.1.Micro` (Free Tier vĩnh viễn: 1/8 OCPU AMD EPYC, 1.0 GB RAM).
- **File cấu hình:** [`docker-compose.micro.yml`](../docker-compose.micro.yml).
- **Đặc điểm tối ưu:**
  - Tạo **4GB Swap** cùng thiết lập `vm.swappiness=10` và `vm.vfs_cache_pressure=50`.
  - Giới hạn cứng RAM PostgreSQL (`200MB`), Backend (`320MB`), Vibe-Content (`240MB`).
  - Ép V8 Garbage Collection: Backend (`--max-old-space-size=256`), Vibe (`--max-old-space-size=180`).
  - Cơ chế build **tuần tự** từng container để không làm nghẽn CPU 1/8 OCPU.
  - Xem chi tiết tại: [Hướng Dẫn Deploy Trên Micro VM 1GB RAM](./DEPLOY_MICRO_VM.md).

### Chế độ B: Máy Cấu Hình Tiêu Chuẩn (Standard VM - RAM ≥ 4GB)
- **Shape tiêu biểu:** Oracle Cloud Ampere A1 (ARM 4 OCPU, 24GB RAM) hoặc VPS thông thường.
- **File cấu hình:** [`docker-compose.yml`](../docker-compose.yml).
- **Đặc điểm:**
  - PostgreSQL cấp phát `shared_buffers=1GB`, cache `4GB`, tối đa 100 kết nối đồng thời.
  - Tận dụng Docker BuildKit song song siêu tốc.

---

## 🛠️ 3. Bộ Công Cụ Tự Động Hóa DevOps

Dự án tích hợp sẵn bộ script điều khiển tự động trong thư mục [`scripts/remote-vm/`](../scripts/remote-vm/README.md) và file giao diện dòng lệnh [`vm.bat`](../vm.bat) dành cho Windows:

| Phím tắt `vm.bat` | Lệnh Bash tương đương | Chức năng chính |
| :---: | :--- | :--- |
| **`vm 1`** | `./scripts/remote-vm/deploy.sh` | Nén mã nguồn, đồng bộ lên VM và reload containers (Standard) |
| **`vm m`** | `./scripts/remote-vm/deploy_micro.sh` | Deploy tuần tự tối ưu cho Micro VM 1GB RAM |
| **`vm s`** | `./scripts/remote-vm/setup_micro_vm.sh` | Cấu hình 4GB Swap + tinh chỉnh Kernel cho Micro VM |
| **`vm 2`** | `./scripts/remote-vm/status.sh` | Kiểm tra tải CPU, RAM, Swap, Disk và trạng thái containers |
| **`vm 3`** | `./scripts/remote-vm/logs.sh backend -f` | Xem trực tiếp log Backend API theo thời gian thực |
| **`vm 4`** | `./scripts/remote-vm/logs.sh vibe-content -f` | Xem trực tiếp log AI Bot & tác vụ lập lịch Cron |
| **`vm 5`** | `./scripts/remote-vm/backup_db.sh` | Tạo `pg_dump` trên VM và tự động kéo file về `backend/backups/` |
| **`vm 6`** | `./scripts/remote-vm/restore_db.sh` | Nạp file dump từ máy cá nhân lên PostgreSQL trên VM |
| **`vm 7`** | `./scripts/remote-vm/ssh.sh` | Mở ngay phiên SSH tương tác vào máy chủ |
| **`vm 8`** | `./scripts/remote-vm/bootstrap_all.sh` | Chạy toàn bộ chu trình từ Zero đến Production |
| **`vm 9`** | `./scripts/remote-vm/reset_vm.sh` | Dọn dẹp cache Docker, prune layers cũ để giải phóng ổ đĩa |

---

## 📖 4. Quy Trình Triển Khai Từng Bước (Step-by-Step)

### Bước 1: Chuẩn bị Máy chủ & SSH Key
1. Khởi tạo một máy chủ Ubuntu (22.04 hoặc 24.04) trên Oracle Cloud Console.
2. Lưu file private key SSH vào thư mục gốc của repository (ví dụ: `134.185.83.12.key`).
3. Khóa quyền truy cập file key (bắt buộc trên Windows để SSH không từ chối):
   ```powershell
   icacls 134.185.83.12.key /inheritance:r /grant:r "$($env:USERNAME):(R)"
   ```

### Bước 2: Thiết lập File Cấu hình Kết nối (`.vm_config`)
Tạo file `scripts/remote-vm/.vm_config` dựa trên `.vm_config.example`:
```bash
VM_IP="134.185.83.12"           # IP Public của máy chủ
VM_USER="ubuntu"                # User mặc định của Ubuntu
KEY_FILE="$REPO_ROOT/134.185.83.12.key"
REMOTE_APP_DIR="/home/ubuntu/mini-forum"
COMPOSE_FILE="docker-compose.micro.yml" # Hoặc docker-compose.yml
```

### Bước 3: Khởi tạo Máy chủ (Setup VM)
- **Nếu dùng Micro VM (1GB RAM):**
  ```bash
  vm s
  # Hoặc: ./scripts/remote-vm/setup_micro_vm.sh
  ```
- **Nếu dùng Standard VM:**
  ```bash
  ./scripts/remote-vm/setup_vm.sh
  ```
*Script sẽ tự động cài đặt Docker, Docker Compose, tạo phân vùng Swap an toàn và tối ưu sysctl.*

### Bước 4: Cấu hình Biến Môi trường trên VM
Đăng nhập vào VM:
```bash
vm 7
```
Tạo file `.env` tại `/home/ubuntu/mini-forum/.env` từ file mẫu `.env.production.example`:
```bash
cd /home/ubuntu/mini-forum
nano .env
```
Điền các giá trị bảo mật (Postgres password, JWT secrets, Brevo key, ImageKit keys, Gemini key).

### Bước 5: Triển khai Code & Khởi động Containers
Từ máy cá nhân của bạn, chạy:
- **Cho Micro VM:**
  ```bash
  vm m
  # Hoặc: ./scripts/remote-vm/deploy_micro.sh
  ```
- **Cho Standard VM:**
  ```bash
  vm 1
  # Hoặc: ./scripts/remote-vm/deploy.sh
  ```

### Bước 6: Khởi tạo Dữ liệu (Prisma Migration & Seed / Restore)
Sau khi các container đã `healthy`:
- **Chạy Migration Prisma:**
  ```bash
  vm 7
  docker exec -it mini-forum-backend npx prisma migrate deploy
  ```
- **Nạp dữ liệu từ máy cá nhân lên VM (Nếu có sẵn backup):**
  ```bash
  vm 6
  # Hoặc: ./scripts/remote-vm/restore_db.sh
  ```

### Bước 7: Cài đặt Cloudflare Tunnel
1. Đăng nhập [Cloudflare One Dashboard](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**.
2. Bấm **Create a tunnel** → Đặt tên `mini-forum-tunnel`.
3. Copy đoạn Tunnel Token.
4. Chạy lệnh cài đặt từ máy cá nhân:
   ```bash
   ./scripts/remote-vm/install_tunnel.sh <YOUR_TUNNEL_TOKEN>
   ```
5. Trong cấu hình **Public Hostname** trên Cloudflare Dashboard:
   - **Subdomain:** `api` | **Domain:** `yourdomain.com`
   - **Service:** `HTTP` | **URL:** `localhost:5000`

---

## 🔍 5. Vận Hành & Khắc Phục Sự Cố (Troubleshooting)

### Kiểm tra sức khỏe hệ thống
Gõ `vm 2` để xem nhanh bảng trạng thái:
```
--- MEMORY & SWAP USAGE ---
              total        used        free      shared  buff/cache   available
Mem:          950Mi       310Mi       120Mi       2.0Mi       520Mi       620Mi
Swap:         4.0Gi       180Mi       3.8Gi

--- DOCKER CONTAINERS STATUS ---
mini-forum-db        Up (healthy)   5432/tcp
mini-forum-backend   Up             127.0.0.1:5000->5000/tcp
mini-forum-vibe      Up             127.0.0.1:4000->4000/tcp
```

### Xử lý khi Backend không khởi động
Kiểm tra logs chi tiết:
```bash
vm 3
# Hoặc: docker logs --tail 100 mini-forum-backend
```
- Nếu lỗi `P1001: Can't reach database server`: Kiểm tra container `mini-forum-db` đã chuyển sang trạng thái `healthy` chưa qua `docker ps`.
- Nếu lỗi `FATAL: password authentication failed`: Kiểm tra biến `POSTGRES_USER` và `POSTGRES_PASSWORD` trong `.env` có đồng nhất giữa dịch vụ backend và container postgres.

### Giải phóng dung lượng ổ đĩa (Disk Clean)
Nếu Docker tích tụ quá nhiều build cache hoặc dangling images:
```bash
vm 9
# Hoặc: ./scripts/remote-vm/reset_vm.sh
```
Lệnh này sẽ thực thi `docker system prune -af` một cách an toàn mà không làm mất dữ liệu database đã gắn trong Docker Volume.
