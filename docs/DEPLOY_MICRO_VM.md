# ⚡ Hướng Dẫn Deploy Trên VM Cấu Hình Thấp (1GB RAM)
### Target Shape: Oracle Cloud `VM.Standard.E2.1.Micro`
**Thông số kỹ thuật:**
- **CPU:** AMD EPYC™ 7551 2.0 GHz (Naples) – 1/8 OCPU (~1 vCPU)
- **Kiến trúc:** `x86_64` (AMD64)
- **RAM:** 1.0 GB RAM vật lý (khả dụng thực tế ~950 MB)
- **Storage:** 47 GB Oracle Cloud Boot Volume

---

## 1. Tại sao 1GB RAM cần bộ thiết lập đặc biệt?

Mặc định, nếu deploy cấu hình thông thường trên máy 1GB RAM:
1. **PostgreSQL bị OOM-Killer giết ngay lập tức:** Cấu hình mặc định đặt `shared_buffers=1GB` và `effective_cache_size=4GB`. Trên máy 1GB, PostgreSQL sẽ chiếm dụng toàn bộ RAM và bị Linux Kernel kết liễu ngay khi khởi động.
2. **Node.js (V8 Engine) trì hoãn Garbage Collection:** V8 mặc định cho phép heap tăng đến 1GB-1.4GB mới dọn rác triệt để (`NODE_OPTIONS: "--max-old-space-size=1024"`). Khi chạy đồng thời Backend + Vibe-content + PostgreSQL, RAM sẽ lập tức cạn kiệt.
3. **Treo máy (Freeze SSH) khi build Docker:** CPU AMD EPYC 1/8 OCPU có hạn mức burst rất thấp. Nếu build đồng thời (`docker compose build`) cả Backend và Vibe-content, 2 tiến trình `npm ci` và `tsc` (TypeScript compiler) sẽ làm nghẽn CPU và hết RAM, dẫn đến mất kết nối SSH hoàn toàn.

---

## 2. Bảng Phân Bổ Bộ Nhớ (Memory Budget)

Hệ thống được thiết kế với tổng mức tiêu thụ RAM ổn định **dưới 800 MB**, phần còn lại dành cho OS và bộ đệm an toàn:

| Thành phần | RAM thực tế ước tính | Giới hạn Cgroup (`mem_limit`) | Tham số tối ưu chính |
| :--- | :--- | :--- | :--- |
| **Linux OS & SSHD** | ~150 - 180 MB | Không giới hạn | Systemd journal cap 100M, Sysctl tuning |
| **Docker Engine & containerd** | ~70 - 90 MB | Không giới hạn | Giới hạn log driver 5m/2 file |
| **PostgreSQL 17** | ~90 - 120 MB | `200M` (res: `64M`) | `shared_buffers=64MB`, `max_connections=35`, `work_mem=4MB` |
| **Backend API (Node 20)** | ~160 - 220 MB | `320M` (res: `120M`) | `--max-old-space-size=256` |
| **Vibe-Content AI (Node 20)** | ~100 - 140 MB | `240M` (res: `80M`) | `--max-old-space-size=180` |
| **Cloudflare Tunnel** | ~25 - 35 MB | `64M` (res: `24M`) | Native systemd hoặc container siêu nhẹ |
| **TỔNG CỘNG** | **~600 - 785 MB** | **Tối đa an toàn** | **Còn dư ~200MB RAM + 4096MB Swap** |

---

## 3. Các thành phần trong bộ thiết lập Micro VM

Hệ thống đã chuẩn bị sẵn các file dành riêng cho `VM.Standard.E2.1.Micro`:

### 3.1. File Docker: [`docker-compose.micro.yml`](../docker-compose.micro.yml)
- **PostgreSQL Low-Memory:**
  ```yaml
  command:
    - "postgres"
    - "-c" "shared_buffers=64MB"
    - "-c" "effective_cache_size=256MB"
    - "-c" "work_mem=4MB"
    - "-c" "maintenance_work_mem=32MB"
    - "-c" "min_wal_size=80MB"
    - "-c" "max_wal_size=256MB"
    - "-c" "wal_buffers=4MB"
    - "-c" "max_connections=35"
  mem_limit: 200m
  ```
- **Node.js Heap Clamping:**
  - Backend: `NODE_OPTIONS: "--max-old-space-size=256"`, `mem_limit: 320m`
  - Vibe-Content: `NODE_OPTIONS: "--max-old-space-size=180"`, `mem_limit: 240m`
- **Giới hạn Log:**
  - Xoay vòng log tối đa 2 file dung lượng 5MB để không đầy ổ cứng và RAM buffer.

### 3.2. Script Setup: [`scripts/remote-vm/setup_micro_vm.sh`](../scripts/remote-vm/setup_micro_vm.sh)
- **Tạo 4GB Swapfile:** Bảo hiểm chống OOM khi lượng truy cập tăng hoặc khi nạp database.
- **Tối ưu Kernel (`/etc/sysctl.d/99-micro-vm.conf`):**
  - `vm.swappiness = 60`: Cho phép OS đẩy các trang bộ nhớ ít dùng ra Swap để dành RAM thực cho Node và Postgres.
  - `vm.vfs_cache_pressure = 50`: Giữ cache file lâu hơn trên đĩa IO chậm.
  - `vm.dirty_background_ratio = 5` & `vm.dirty_ratio = 10`: Ghi đĩa định kỳ theo từng gói nhỏ để không gây lag hệ thống.
  - `vm.overcommit_memory = 1`: Tránh V8 malloc bị từ chối bộ nhớ ảo.
- **Cấu hình Docker Daemon:** Giới hạn log driver và tải song song tối đa 2 tiến trình.

### 3.3. Script Deploy: [`scripts/remote-vm/deploy_micro.sh`](../scripts/remote-vm/deploy_micro.sh)
- **Build tuần tự (Sequential Build):**
  1. Build Backend (`docker compose -f docker-compose.micro.yml build backend`).
  2. Build Vibe-Content (`docker compose -f docker-compose.micro.yml build vibe-content`).
  3. Khởi chạy toàn bộ bằng `docker compose -f docker-compose.micro.yml up -d`.
  *Tránh nghẽn 1 vCPU và tràn RAM khi chạy BuildKit song song.*

---

## 4. Hướng dẫn Triển khai Từng Bước

### Bước 1: Cấu hình IP và SSH Key
Nếu máy ảo Micro có IP khác với server mặc định:
1. Tạo file `scripts/remote-vm/.vm_config` (hoặc copy từ `.vm_config.example`):
   ```bash
   VM_IP="<IP_MÁY_ẢO_MICRO_CỦA_BẠN>"
   VM_USER="ubuntu"
   KEY_FILE="$REPO_ROOT/<TEN_KEY>.key"
   ```

### Bước 2: Khởi tạo hệ thống trên Micro VM
Chạy script cài đặt Swap 4GB và tối ưu Kernel:
- **Cách 1 (Giao diện menu):** Chạy `vm.bat` trên Windows -> Nhấn phím **`[S]`**.
- **Cách 2 (Command Line):**
  ```bash
  ./scripts/remote-vm/setup_micro_vm.sh
  ```

### Bước 3: Đồng bộ Code và Deploy
- **Cách 1 (Giao diện menu):** Chạy `vm.bat` trên Windows -> Nhấn phím **`[M]`**.
- **Cách 2 (Command Line):**
  ```bash
  ./scripts/remote-vm/deploy_micro.sh
  # Hoặc: ./scripts/remote-vm/deploy.sh --micro
  ```

### Bước 4: Khôi phục Dữ liệu (Database Restore)
Nếu bạn có sẵn file backup `.dump` trong `backend/backups/`:
- Chạy `vm.bat` -> Nhấn phím **`[6]`** (hoặc chạy `./scripts/remote-vm/restore_db.sh`).

### Bước 5: Kiểm tra sức khỏe hệ thống
- Mở `vm.bat` -> Nhấn phím **`[2]`** (hoặc chạy `./scripts/remote-vm/status.sh`).
- Bạn sẽ thấy bảng CPU/RAM/Swap tương tự như sau:
  ```
  --- MEMORY & SWAP ---
                 total        used        free      shared  buff/cache   available
  Mem:           950Mi       620Mi       140Mi       8.0Mi       190Mi       310Mi
  Swap:          4.0Gi       250Mi       3.7Gi

  --- RESOURCE USAGE PER CONTAINER ---
  NAME                  CPU %     MEM USAGE / LIMIT     MEM %
  mini-forum-backend    0.85%     185MiB / 320MiB       57.8%
  mini-forum-db         0.30%     98MiB / 200MiB        49.0%
  mini-forum-vibe       0.20%     120MiB / 240MiB       50.0%
  ```

---

## 5. Các Lệnh Hữu Ích Khi Vận Hành Micro VM

- **Theo dõi RAM live từng container:**
  ```bash
  docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
  ```
- **Kiểm tra log thời gian thực:**
  ```bash
  ./scripts/remote-vm/logs.sh backend -f
  ./scripts/remote-vm/logs.sh vibe-content -f
  ./scripts/remote-vm/logs.sh postgres -f
  ```
- **Dọn dẹp cache giải phóng RAM & ổ đĩa:**
  ```bash
  ./scripts/remote-vm/reset_vm.sh
  ```
- **Khởi động Cloudflare Tunnel:**
  ```bash
  ./scripts/remote-vm/ssh.sh "cd /home/ubuntu/mini-forum && docker compose -f docker-compose.micro.yml --profile tunnel up -d"
  ```
