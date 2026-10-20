# Hướng Dẫn Vận Hành Hệ Thống Cây Gia Phả Số (Docker & Local)

## 1. Cấu Trúc Thư Mục Đã Tối Ưu

```text
FamilyTree/
├── frontend/                   👉 Toàn bộ mã nguồn giao diện (React + Vite + TypeScript)
│   ├── src/                    # Components (TreeCanvas, MemberCard, Drawer...), Styles, Utils
│   ├── Dockerfile              # Đóng gói Multi-stage build Nginx
│   ├── nginx.conf              # Cấu hình Web server & Reverse Proxy sang backend
│   └── package.json
│
├── backend/                    👉 Toàn bộ mã nguồn máy chủ API (Express + Prisma + SQLite)
│   ├── prisma/                 # Schema cơ sở dữ liệu SQLite
│   ├── src/                    # Controllers, Routes, Services (Kinship, Lunar, Storage)
│   ├── Dockerfile              # Đóng gói Node.js 22 Alpine Runtime
│   └── package.json
│
├── docker-compose.yml          👉 Quản lý đồng thời Backend & Frontend containers
└── package.json                👉 Scripts tiện ích quản lý chạy local và docker
```

---

## 2. Vận Hành Bằng Docker (Khuyên Dùng)

Ứng dụng đã được đóng gói hoàn chỉnh bằng Docker Compose:
- **Frontend container**: Nginx phục vụ web tĩnh và reverse proxy API.
- **Backend container**: Node.js Express API kết nối SQLite bền vững qua Docker Volumes (`backend_data`, `backend_uploads`).

### Các lệnh quản lý Docker:

```powershell
# Khởi động toàn bộ hệ thống
docker compose up -d

# Xem trạng thái các container
docker compose ps

# Xem log thời gian thực
docker compose logs -f

# Dừng hệ thống
docker compose down

# Rebuild lại images khi có thay đổi mã nguồn
docker compose build --no-cache
docker compose up -d
```

### Địa chỉ truy cập Docker:
- **Ứng dụng Web**: 👉 **[http://localhost:8088](http://localhost:8088)**
- **API Backend**: `http://localhost:5000`
- **Tài khoản mẫu**: Bấm nút **"Thử Nhanh: Đăng Nhập Dữ Liệu Mẫu (Demo)"** trên màn hình.

---

## 3. Vận Hành Thủ Công Dưới Máy Local (Không cần Docker)

Nếu bạn muốn chạy trực tiếp bằng Node.js:

```powershell
# Cài đặt tất cả dependencies
npm run install:all

# Chạy song song cả Backend và Frontend
npm run dev
```

- Backend sẽ chạy tại: `http://localhost:5000`
- Frontend sẽ chạy tại: `http://localhost:5173` (hoặc cổng được hiển thị trên terminal)
