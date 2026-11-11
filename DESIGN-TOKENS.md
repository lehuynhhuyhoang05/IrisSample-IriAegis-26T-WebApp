# Design token trích xuất từ Android

## Quy chuẩn Web tuần 2

Các màn hình mới dùng lớp token ngữ nghĩa tại `src/ui/tokens.css` và component `src/ui`, hướng dẫn tại [UI-GUIDELINES.md](UI-GUIDELINES.md). `android-tokens.css` vẫn là nguồn trích xuất để truy vết. Bộ Web giữ nhận diện mint, chọn màu nút đậm hơn và bố cục phẳng; không tự động sao chép mọi gradient/radius Android. Xem trực quan tại `/#/ui-kit/foundation`.

Các biến CSS dùng chung nằm trong [`src/android-tokens.css`](src/android-tokens.css) và được import ở `src/main.jsx`. Có thể dùng, ví dụ: `color: var(--android-colorTextPrimary)` hoặc `background: var(--android-colorPrimary)`.

## Nguồn và phạm vi

- `app/src/main/res/values/colors.xml`: toàn bộ màu được khai báo có tên, giữ nguyên tên Android trong biến CSS.
- `app/src/main/res/values/dimens.xml`: `btn_distance`.
- `app/src/main/res/values/styles.xml`: kích thước, padding, khoảng cách chữ, radius và elevation được khai báo trong style dùng chung.
- `app/src/main/res/drawable/`: các thuộc tính nổi bật của nút, thẻ, trạng thái, input, avatar; các màu literal trong layout/drawable được ghi thêm dưới tên theo mã màu, nếu chưa có biến khác cùng giá trị.

Đây là bản trích xuất tài nguyên hiện có, không phải khẳng định Android đã có một design system đầy đủ. Nhiều layout còn đặt kích thước, padding và màu trực tiếp theo màn hình; không thể xem toàn bộ giá trị này là token chuẩn dùng chung. Font của Android không được khai báo thống nhất trong `styles.xml`, nên không suy diễn một font gia đình chính thức.

Android dùng `#AARRGGBB`, CSS dùng `#RRGGBBAA`; file CSS đã chuyển thứ tự alpha. Các giá trị `dp`/`sp` được ánh xạ ban đầu sang `px` để tham khảo, không bảo đảm tương đương hiển thị ở mọi mật độ màn hình hay cỡ chữ người dùng. Elevation Android không tương đương trực tiếp `box-shadow`; các biến elevation chỉ lưu số gốc, chưa tạo bóng CSS.

Các thành phần hiện tại của prototype vẫn có màu, kích thước và bố cục thiết kế riêng trong `src/styles.css`. Việc trích xuất token không có nghĩa toàn bộ giao diện đã dùng hết token Android hoặc đã đạt tương đồng pixel. Khi phát triển tiếp, nhóm nên dùng biến token cho các thành phần tương ứng và kiểm tra tương phản, responsive, trạng thái tương tác.

## Tài nguyên đã sử dụng trên Web

- `src/assets/android/ic_app_logo.png`: bản sao nguyên vẹn từ `app/src/main/res/drawable/ic_app_logo.png`, dùng trong header đăng nhập Android.
- `src/assets/android/ic_checkin.svg`: chuyển path từ `ic_checkin_white.xml` sang SVG, đổi màu trắng sang mint để phù hợp nền sáng; dùng ở trạng thái khuôn mặt.
- `src/assets/android/ic_warning.svg`: chuyển path từ `ic_warning.xml` sang SVG, dùng trong thông báo lỗi.
- `src/android-theme.css`: áp dụng gradient, màu, radius và nút dựa trên `colors.xml`, `styles.xml`, `gradient_background.xml` và `button_secondary.xml`. Màu nút chính được điều chỉnh đậm hơn trên Web để chữ trắng dễ đọc; không phải bản sao pixel của Android.

Những icon còn lại của nút camera vẫn dùng Lucide. Đây là một theme sáng lấy cảm hứng từ Android, không phải các theme sáng/tối có sẵn từ source Android.
