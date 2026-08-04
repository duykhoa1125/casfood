# 🍱 CasFood - Ứng Dụng Gom Đơn Đặt Cơm Trưa Văn Phòng

**CasFood** là ứng dụng web giúp người gom đơn (Host/Admin) và đồng nghiệp trong công ty đặt cơm trưa, trà sữa nhanh chóng và tiện lợi. Tích hợp AI thông minh để tự động nhận diện món ăn và giá tiền từ văn bản thực đơn paste từ Zalo/Facebook.

---

## 🌟 Tính Năng Nổi Bật

- 🤖 **Phân Tích Thực Đơn AI**: Dán đoạn chat menu thô từ Zalo/Facebook/TikTok, AI (DeepSeek) sẽ tự động tách nhóm món, tên món và giá tiền chuẩn xác.
- 🔐 **Bảo Mật Route Người Gom Đơn**: Người gom đơn sở hữu link quản lý bí mật dạng `/panel/a8f3k2p9x7m2`. Đồng nghiệp nhận link đặt món `/order/:sessionId` hoàn toàn không biết route admin.
- 📝 **Đặt Món & Ghi Chú Chi Tiết**: Đồng nghiệp chọn món, tùy chọn (topping/size) và ghi chú riêng từng món (ví dụ: *ít cay, 50% đường...*).
- 💳 **Thanh Toán QR Ngân Hàng**: Hiển thị mã QR ngân hàng của Người Gom Đơn để đồng nghiệp quét chuyển khoản trực tiếp sau khi chốt đơn.
- 📋 **Báo Cáo Gộp Món Gửi Quán**: Tự động tổng hợp danh sách món kèm ghi chú chi tiết để Người Gom Đơn 1-click copy gửi quán.

---

## 📁 Cấu Trúc Dự Án

```
lunch-order/
├── server/                     # Backend Express.js
│   ├── index.js                # Entry point server Express
│   ├── data/db.json            # Cơ sở dữ liệu JSON
│   ├── store/db.js             # Đọc/ghi cơ sở dữ liệu
│   ├── routes/                 # API Routes (sessions, orders, ai)
│   └── prompts/
│       └── menuParserPrompt.txt # System Prompt AI phân tích menu
├── src/                        # Frontend React + Vite
│   ├── App.jsx                 # Điều hướng ứng dụng (Router)
│   ├── pages/LandingPage.jsx   # Trang chọn vai trò
│   ├── components/
│   │   ├── admin/              # Dashboard quản lý, dán menu, xuất báo cáo
│   │   ├── user/               # Giao diện đặt món dành cho đồng nghiệp
│   │   └── common/             # Header, Dark mode, Share link
│   └── services/api.js         # REST API Client
├── .env.example                # File mẫu cấu hình biến môi trường
├── package.json
└── vite.config.js
```

---

## 🚀 Hướng Dẫn Chạy Ở Môi Trường Local

### 1. Yêu Cầu Cần Có
- **Node.js**: Phiên bản 18.x trở lên
- **npm**: Phiên bản 9.x trở lên

### 2. Cài Đặt

```bash
# Clone dự án về máy
git clone <link-repo-cua-ban>
cd lunch-order

# Cài đặt các thư viện phụ thuộc
npm install
```

### 3. Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` tại thư mục gốc của dự án (hoặc copy từ `.env.example`):

```env
PORT=5001
DEEPSEEK_API_KEY=sk-your_deepseek_api_key_here
```

### 4. Chạy Ứng Dụng (Development Mode)

Chạy đồng thời cả Server Backend và Vite Frontend:

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001`

### 5. Chạy Thử Bản Build Sản Phẩm (Production Preview Local)

```bash
# Build frontend
npm run build

# Chạy duy nhất server Node.js (tự phục vụ cả API và Giao diện static)
npm start
```

Mở trình duyệt truy cập: `http://localhost:5001`

---

## 🤖 Cấu Hình AI Phân Tích Thực Đơn

- **API Key**: Cấu hình trong `.env` dòng `DEEPSEEK_API_KEY`.
- **Chỉnh Sửa Prompt AI**: Bạn có thể tùy chỉnh quy tắc tách thực đơn tại file [`server/prompts/menuParserPrompt.txt`](file:///c:/Users/Khoa/Desktop/lunch-order/server/prompts/menuParserPrompt.txt) mà không cần can thiệp mã nguồn Node.js.

---

## 🌐 Hướng Dẫn Deploy (Triển Khai)

### 📌 Cách 1: Deploy lên Render.com (Miễn Phí)
1. Push mã nguồn lên GitHub (Không push file `.env`).
2. Truy cập [Render.com](https://render.com) ➔ Chọn **New Web Service**.
3. Kết nối với Repository GitHub của bạn.
4. Cấu hình:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Thêm **Environment Variables** trên Render:
   - `DEEPSEEK_API_KEY`: Key DeepSeek của bạn
   - `PORT`: `5001`

### 📌 Cách 2: Deploy trên Server VPS (Ubuntu / Linux)
```bash
# Kéo code về VPS
git clone <link-repo>
cd lunch-order

# Cài đặt và build
npm install
npm run build

# Tạo file .env chứa DEEPSEEK_API_KEY
nano .env

# Chạy ngầm ứng dụng với PM2
npm install -g pm2
pm2 start server/index.js --name "casfood"
pm2 save
```

---

## 📝 Giấy Phép
Dự án được phát triển riêng cho nhu cầu gom đơn đặt cơm văn phòng.
