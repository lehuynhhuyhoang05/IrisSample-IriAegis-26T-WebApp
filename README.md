# Iris Aegis — Ứng dụng Web điểm danh bằng khuôn mặt

## Tổng quan dự án

Dự án hướng đến hệ thống hỗ trợ quản lý sinh viên, môn học, điểm danh và báo cáo. Ứng dụng Android hiện có quản lý dữ liệu cục bộ và có luồng nhận diện khuôn mặt. Trong kỳ này, các nhóm tiếp tục phát triển server, ứng dụng Android, công cụ nhận diện khuôn mặt, kiểm tra người thật, Web app và kiểm thử.

| Nhóm | Công việc được giao |
|---|---|
| 1 — Server | Xây dựng API, cơ sở dữ liệu và đồng bộ với Android; hỗ trợ chế độ server và standalone. |
| 2 — Android | Nâng cấp lưu trữ Room, xử lý vector 192 chiều và tối ưu hiệu năng ứng dụng. |
| 3 — Face Recognition Engine | Phát triển xử lý ảnh khuôn mặt, trích xuất vector và thử nghiệm đối sánh. |
| 4 — Liveness Detection | Nghiên cứu kiểm tra người thật; hỗ trợ luồng chớp mắt/lắc đầu trên Android. |
| 5 — Web app | Phát triển giao diện Web, trước mắt tập trung camera và chụp ảnh. |
| 6 — QC | Lập kế hoạch và kiểm thử chức năng, giao diện, độ ổn định. |

Đây là mô tả nhiệm vụ chung, không có nghĩa tất cả thành phần đã hoàn thành hoặc tích hợp. Backend/API được các nhóm phụ trách phát triển theo tiến độ dự án.

## Nhóm 5 — Web app

Web app là giao diện để sử dụng hệ thống qua trình duyệt trên máy tính và điện thoại. Phạm vi chức năng đầy đủ và cách tích hợp các thành phần sẽ được thống nhất theo tiến độ dự án.

Stack được giao: ReactJS với Vite, TailwindCSS, camera trình duyệt/WebRTC, React Router, Axios, Zustand hoặc Redux và vite-plugin-pwa. Công nghệ được đưa vào theo nhu cầu từng giai đoạn.

## Nhiệm vụ tuần 1

Xây dựng prototype Web có luồng:

```text
Mở trang → bật camera trước → xem video → chụp ảnh → xem ảnh / chụp lại
                                   ↘ thử phát hiện khuôn mặt
```

Các công việc chính:

- Khởi tạo project React + Vite + TailwindCSS và giao diện phù hợp máy tính, điện thoại.
- Dùng `getUserMedia()` để xin quyền và lấy luồng camera, ưu tiên camera trước.
- Hiển thị video trong trang, chú ý `playsInline` trên Safari iOS.
- Chụp frame từ video, xem ảnh và cho phép chụp lại; xử lý trường hợp không mở được camera.
- Thử tích hợp phát hiện khuôn mặt trên trình duyệt và kiểm thử trên thiết bị sẵn có.

Prototype tuần 1 đã được phát triển trên nhánh [`HuyHoang`](../../tree/HuyHoang). Đã thử mở camera, chụp ảnh và phát hiện mặt trên máy tính; người dùng xác nhận camera hoạt động khi mở bằng Safari trực tiếp trên iPhone. Các trường hợp lỗi và từng thiết bị vẫn cần tiếp tục được ghi nhận. Lần thử bằng trình duyệt tích hợp Zalo gặp hiện tượng toàn màn hình và đơ khung hình; chưa xác nhận đã xử lý triệt để.

Phát hiện khuôn mặt chỉ cho biết có khuôn mặt trong hình, chưa xác minh danh tính hay kiểm tra người thật.

## Tổ chức nhánh

- `main`: nhánh mặc định, hiện dùng để giới thiệu mục tiêu và nhiệm vụ dự án.
- `HuyHoang`: chứa source Web prototype tuần 1.
- Thay đổi hướng vào `main` thực hiện qua Pull Request theo quy tắc bảo vệ của repository.
