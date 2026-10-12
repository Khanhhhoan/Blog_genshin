# 🎮 Hoyo Blog - Personal Gaming Blog & Admin CMS

Trang Blog cá nhân chia sẻ cẩm nang, hướng dẫn bảo mật tài khoản và chính sách dịch vụ game Hoyoverse (Genshin Impact, Honkai: Star Rail,...), tích hợp hệ thống quản trị bài viết (Admin CMS) thời gian thực.

---

## ✨ Tính Năng Nổi Bật

### 🌐 Giao diện Blog Người Đọc (`/`)
- **Thiết kế Dark Mode Gaming:** Giao diện phong cách Hoyoverse hiện đại, hiệu ứng kính mờ (Glassmorphism), màu sắc sống động.
- **Tốc độ tải nhanh:** Vanilla JS SPA, Hash routing (`#/post/:slug`), không cần load lại trang.
- **Tìm kiếm & Bộ lọc:** Tìm kiếm bài viết theo từ khóa tức thì và lọc theo chuyên mục (Hướng dẫn Game, Chính sách, Bảo mật Email,...).
- **Xem ảnh phóng to (Lightbox):** Bấm vào bất kỳ hình ảnh nào trong bài để xem kích thước lớn sắc nét.
- **Thanh tiến trình đọc:** Thanh reading progress tự động cuộn theo tiến độ bài viết.

### 🛡️ Hệ Thống Quản Trị Admin CMS (`/admin.html`)
- **Bảo mật đăng nhập:** Xác thực người dùng, bảo vệ toàn bộ API bằng Token.
- **Quản lý bài viết (CRUD):** Thêm mới, chỉnh sửa, xóa bài viết dễ dàng.
- **Dán ảnh siêu tốc (`Ctrl + V`):** Chụp màn hình rồi bấm dán trực tiếp vào khung soạn thảo để tự động upload và chèn ảnh. Hỗ trợ cả kéo thả file ảnh (Drag & Drop).
- **Soạn thảo Markdown & Xem trước (Preview):** Thanh công cụ định dạng trực quan (Bold, Italic, Headings, Quote, List, Link) cùng tab xem trước thời gian thực.
- **Tự động đồng bộ:** Tự động cập nhật `blogs_data.json`, `blogs_data.js` và file Markdown trong thư mục `blogs/*.md`.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Khởi chạy Server:
```bash
node server.js
```

- **Trang chủ Blog:** [http://localhost:3333/](http://localhost:3333/)
- **Trang Quản trị Admin:** [http://localhost:3333/admin.html](http://localhost:3333/admin.html)

### 3. Tài khoản quản trị mặc định:
- **Tài khoản:** `admin`
- **Mật khẩu:** `admin123` *(Có thể đổi mật khẩu bất kỳ lúc nào tại giao diện Admin)*

---

## 📁 Cấu Trúc Thư Mục

```
CSBH_GENSHIN/
├── blogs/                     # Thư mục chứa các bài viết định dạng Markdown (.md)
├── images/                    # Thư mục lưu trữ hình ảnh blog & ảnh upload
├── index.html                 # Giao diện chính Blog người xem
├── style.css                  # Toàn bộ CSS phong cách Gaming Glassmorphism
├── app.js                     # Logic hiển thị Blog, định tuyến và tìm kiếm
├── admin.html                 # Giao diện Trang Quản Trị CMS
├── admin.css                  # CSS cho Trang Quản Trị
├── admin.js                   # Logic đăng nhập, CRUD bài viết, upload ảnh
├── server.js                  # Express Backend API & Static Server
├── blogs_data.json            # Dữ liệu bài viết dạng JSON
├── blogs_data.js              # Dữ liệu bài viết đồng bộ cho frontend
└── package.json               # Cấu hình dự án Node.js
```
