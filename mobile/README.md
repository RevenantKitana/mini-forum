# Mini Forum Mobile App (React Native + Expo)

Ứng dụng di động dành cho diễn đàn **Mini Forum**, phát triển bằng **React Native (Expo)**, hỗ trợ cả **Android** và **iOS**.

---

## 🚀 Hướng dẫn chạy nhanh (Quét mã QR trên iPhone/Android)

### 1. Cài đặt Expo Go trên điện thoại
* **iOS (iPhone/iPad):** Cài ứng dụng **Expo Go** từ App Store.
* **Android:** Cài ứng dụng **Expo Go** từ Google Play Store.

### 2. Khởi chạy Expo Server trên máy tính
Mở terminal tại thư mục `mobile` và chạy:

```bash
cd mobile
npx expo start
```

* **Dùng mạng Wi-Fi thông thường:** Quét mã QR hiển thị trên màn hình terminal:
  * **Trên iPhone:** Mở ứng dụng **Camera** mặc định -> Quét mã QR -> Chọn **Open in Expo Go**.
  * **Trên Android:** Mở app **Expo Go** -> Nhấn **Scan QR code**.

* **Nếu gặp lỗi mạng hoặc dùng 4G:** Chạy với cờ tunnel:
  ```bash
  npx expo start --tunnel
  ```

---

## ⚙️ Cấu hình địa chỉ IP Backend API

Khi chạy trên thiết bị thật (điện thoại), app không thể gọi vào `localhost:5000`. Bạn có thể:

1. Nhấn vào biểu tượng **⚙️ (Bánh răng cài đặt)** ở góc trên bên phải màn hình app.
2. Nhập địa chỉ IP Wi-Fi của máy tính (ví dụ: `http://192.168.1.15:5000/api/v1`).
3. Nhấn **Kiểm tra kết nối** để kiểm tra ping tới server, sau đó nhấn **Lưu cấu hình**.

---

## 📦 Hướng dẫn Build file APK Android (Standalone)

### Cách 1: Build file APK qua Cloud bằng EAS Build (Khuyên dùng)
```bash
# 1. Cài đặt EAS CLI
npm install -g eas-cli

# 2. Đăng nhập tài khoản Expo
eas login

# 3. Khởi tạo cấu hình EAS
eas build:configure

# 4. Build file APK preview cài trực tiếp
eas build -p android --profile preview
```

### Cách 2: Build file APK Local (Cần Android Studio SDK)
```bash
npx expo run:android --variant release
```

---

## 📁 Cấu trúc thư mục

```
mobile/
├── src/
│   ├── api/          # Axios client & API endpoints
│   ├── components/   # UI components (PostCard, ApiConfigModal, ...)
│   ├── config/       # Cấu hình IP mặc định & Storage keys
│   ├── context/      # AuthContext quản lý đăng nhập/đăng ký
│   ├── navigation/   # Tab bar & Stack navigation
│   ├── screens/      # Màn hình (Home, Detail, Create, Search, Profile, Login, Register)
│   ├── theme/        # Màu sắc Slate/Indigo dark theme
│   └── types/        # TypeScript interfaces
├── App.tsx           # Entry point chính
├── app.json          # Cấu hình Expo
└── package.json
```
