# Module Email báo cáo & Sao lưu/Khôi phục — @vantien68

## Đường dẫn demo

Sau khi `npm run dev`:

| URL | Nội dung |
|-----|----------|
| `/#/email` | Quản lý người nhận, soạn/gửi email báo cáo, lịch sử (giả lập) |
| `/#/backup` | Tạo / tải / xóa backup demo, khôi phục file JSON |

## Đã làm (frontend, dữ liệu mẫu)

### Email báo cáo
- Chọn môn → danh sách người nhận theo môn
- Thêm / sửa / xóa người nhận + validation
- Nhập CSV người nhận (cột: Họ tên, Email, Vai trò)
- Xuất CSV danh sách đang lọc
- Chọn báo cáo điểm danh mẫu (mock từ “module báo cáo”)
- Chọn nhiều người nhận, xem trước nội dung + tên file đính kèm
- Gửi giả lập (thành công ngẫu nhiên ~85% hoặc ép thất bại)
- Lịch sử gửi với badge trạng thái demo
- Nút đặt lại dữ liệu mẫu

### Sao lưu / Khôi phục
- Tạo backup demo (nhãn tùy chọn) → lưu localStorage
- Danh sách backup, tải file `.json`, xóa từng bản / xóa tất cả
- Chọn file khôi phục → validate cấu trúc (version, platform Web…)
- Cảnh báo rõ nếu file có vẻ là backup Android
- Xác nhận thao tác nhạy cảm trước khi “khôi phục” (chỉ mô phỏng trong phiên)
- Notice phân biệt backup Web demo ≠ backup Android

## Chưa làm / phụ thuộc

| Hạng mục | Lý do |
|----------|--------|
| Gửi email thật (SMTP / API) | Chờ Nhóm 1 |
| Lấy báo cáo điểm danh thật | Chờ @vanphil207 + API |
| Backup/restore server | Chờ Nhóm 1 |
| Tương thích file backup Android | Cần mentor xác định format & phương án Web |
| Phân quyền Super Admin / Admin trên UI email-backup | Có thể bổ sung khi module tài khoản sẵn sàng |

## Cấu trúc file

```
src/
  pages/
    EmailPage.jsx      # UI email
    BackupPage.jsx     # UI backup
    ModuleShell.jsx    # AppShell + nav tạm cho 2 màn
    README-vantien68.md
  services/
    mockData.js
    mockEmailService.js
    mockBackupService.js
```

## Cách kiểm thử nhanh

1. Mở `/#/email` → thêm người nhận, nhập CSV, soạn gửi, xem lịch sử.
2. Mở `/#/backup` → tạo backup, tải JSON, xóa, chọn lại file vừa tải để thử khôi phục.
3. Thử file JSON tùy ý / file không phải Web demo → phải hiện lỗi validate.
4. Responsive: thu hẹp cửa sổ ~360px, kiểm tra bảng/toolbar không tràn ngang.

## Ghi chú bàn giao

- Mọi success/fail đều **giả lập**, đã gắn Notice / Badge “demo”.
- Không sửa `src/ui/*` hay token chung.
- PR nên kèm ảnh desktop + mobile và ghi rõ phần mock.
