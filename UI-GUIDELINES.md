# IriAegis Web — Quy chuẩn giao diện và hướng dẫn cho thành viên

Phiên bản nền 0.1 · Trưởng nhóm duy trì · Áp dụng cho các màn hình Web tuần 2.

## 1. Mở bộ mẫu

Source bàn giao nằm trên nhánh `HuyHoang`. Máy mới cần Node.js 22 và Git; Chrome cần thiết khi chạy test giao diện. Clone đúng nhánh:

```powershell
git clone --branch HuyHoang https://github.com/lehuynhhuyhoang05/IrisSample-IriAegis-26T-WebApp.git
cd IrisSample-IriAegis-26T-WebApp
npm.cmd ci
npm.cmd run dev
```

Nếu đã có source ở máy, cập nhật nhánh theo quy trình Git của nhóm, giữ lại công việc chưa commit trước khi đổi nhánh. Khi bắt đầu phần việc riêng, tạo nhánh mới từ bản nền đã cập nhật; không cùng sửa trực tiếp trên `HuyHoang`.

Trong thư mục workspace hiện có:

```powershell
npm.cmd install
npm.cmd run dev
```

Lấy địa chỉ Vite in trong terminal và thêm `/#/ui-kit`:

- `/#/ui-kit`: màn hình sinh viên tham chiếu, thử tìm kiếm, lọc, thêm/sửa/xóa, xác nhận và xuất CSV.
- `/#/ui-kit/components`: các component và trạng thái có thể thử trực tiếp.
- `/#/ui-kit/foundation`: bảng màu, typography, khoảng cách, icon và responsive.
- `/#/ui-kit/guide`: hướng dẫn triển khai ngắn.
- `/` hoặc `/#/camera`: prototype camera gốc.

Mẫu sinh viên chỉ dùng để minh họa cách tổ chức UI. Dữ liệu giả nằm trong state và có thể mất khi chuyển trang hoặc tải lại. Mẫu không triển khai đầy đủ nghiệp vụ sinh viên, quan hệ nhiều môn, phân quyền hay đối sánh khuôn mặt; không dùng nó làm đặc tả API. Không nhập thông tin thật.

## 2. Quyết định thiết kế

### Kế thừa từ Android

- `app/src/main/res/values/colors.xml`: mint `#66CFCF`, chữ chính `#263238`, bề mặt trắng và các nhóm màu trạng thái.
- `styles.xml`: phân cấp nút chính/phụ/xóa, form có nhãn và các kích thước tham khảo. Không chuyển dp/sp sang CSS một cách tuyệt đối.
- `activity_student_list.xml`: danh sách sinh viên, tìm kiếm, hành động thêm và xuất dữ liệu làm cơ sở cho màn hình tham chiếu.
- `ic_app_logo.png`: sử dụng logo nguyên bản. Icon thao tác dùng Lucide đã có trong project để giữ một nét vẽ thống nhất. Các SVG Android khác vẫn nằm trong source camera nhưng không bắt buộc chèn vào mọi màn hình.

### Điều chỉnh cho Web

- Nút chính dùng `#236E69`, đậm hơn mint Android để chữ trắng dễ đọc. Mint dùng làm nhận diện/điểm nhấn, không làm nền cho chữ trắng cỡ nhỏ.
- Font hệ thống: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`. Không giả định Android có một font thương hiệu đã thống nhất.
- Nền trắng hoặc xám rất nhạt, đường phân cách rõ. Không dùng gradient trang trí, nền phát sáng, hero lớn hoặc các card KPI không liên quan công việc.
- Một vùng chính cho một tác vụ. Không bọc mọi đoạn nội dung bằng card và không lồng card chỉ để trang trí.
- Không dùng emoji thay icon chức năng. Icon cỡ 18–20 px, nét 2 px, đi cùng chữ nếu ý nghĩa không rõ.
- Câu chữ ngắn, đúng hành động: “Thêm sinh viên”, “Lưu môn học”, “Giữ lại”. Không dùng “Tiếp tục” cho mọi nút nếu người dùng cần biết thao tác cụ thể.

## 3. Cấu trúc và quyền sở hữu file

```text
src/
  android-tokens.css      # Dữ liệu trích xuất Android, giữ để truy vết
  ui/
    tokens.css           # Token ngữ nghĩa cho Web
    ui.css               # Style component và responsive, scope .aegis-ui
    components.jsx       # Button, Field, Dialog, DataTable và trạng thái
    AppShell.jsx         # Khung navigation/header/nội dung
    index.js             # Điểm import component
  showcase/              # Ví dụ thao tác và các trang hướng dẫn trực quan
  Workspace.jsx          # Chọn camera hoặc UI kit bằng hash; không phải router nghiệp vụ
  App.jsx                # Camera hiện tại, giữ cơ chế MediaStream/MediaPipe
tests/ui/                # Kiểm thử UI kit bằng trình duyệt
```

Trưởng nhóm phụ trách `src/ui`, tài liệu này và các mẫu `src/showcase`. Thành viên tạo file màn hình theo phần được phân công, sử dụng component và token chung. Khi cần thêm component/variant hoặc thay đổi token, trao đổi với trưởng nhóm và cập nhật ví dụ tương ứng. Đây là quy trình làm việc, chưa phải cơ chế phân quyền GitHub tự động.

Không sửa các selector global như `button`, `input`, `h1`, `body` trong stylesheet màn hình của mình. Style riêng dùng tên lớp theo chức năng, ví dụ `.subjects-page__schedule`, nằm bên trong `.aegis-ui`. Không chép CSS camera cũ thành theme cho trang quản trị mới.

## 4. Token dùng chung

| Token | Mục đích |
|---|---|
| `--ui-action`, `--ui-action-hover` | Nút chính, liên kết và hover |
| `--ui-brand` | Màu mint nhận diện gốc |
| `--ui-text`, `--ui-muted` | Chữ chính và phụ |
| `--ui-surface`, `--ui-canvas` | Bề mặt nội dung và nền nhẹ |
| `--ui-border`, `--ui-control-border` | Phân cách nội dung và viền ô nhập |
| `--ui-success`, `--ui-warning`, `--ui-danger`, `--ui-info` | Nội dung trạng thái; có token nền tương ứng |
| `--ui-space-1` tới `--ui-space-6`, `--ui-space-8`, `--ui-space-10` | 4, 8, 12, 16, 20, 24, 32, 40 px |
| `--ui-radius-sm`, `--ui-radius-md`, `--ui-radius-lg` | 6, 8, 12 px |
| `--ui-control-height` | Tối thiểu 44 px cho điều khiển |
| `--ui-title` | Tiêu đề trang 24–30 px |

Ưu tiên token ngữ nghĩa `--ui-*` cho màn mới. `--android-*` là nguồn tham khảo, không phải tất cả màu gốc đều phù hợp cho chữ nhỏ trên Web. Không tự thêm mã hex trong stylesheet của từng màn; trường hợp mới cần bổ sung vào token chung sau khi thống nhất. Các số kích thước trong file nền là quyết định của bộ nền, không yêu cầu mọi giá trị bố cục phải có token riêng.

## 5. Cách dùng component

Import CSS nền một lần tại root của khu vực UI mới, sau file token Android:

```jsx
import './android-tokens.css'
import './ui/tokens.css'
import './ui/ui.css'
```

Trong UI kit hiện tại, các import này đã được xử lý bởi `main.jsx` và `showcase/Showcase.jsx`. `AppShell` tạo wrapper `.aegis-ui` để token và CSS có hiệu lực. Nếu dùng component ngoài `AppShell`, đặt nó trong wrapper đó. Không lồng nhiều `AppShell`.

### API chính

| Component | Props chính | Quy ước |
|---|---|---|
| `Button` | `variant`, `icon`, `busy`, `disabled`, `type`, `onClick`, `children` | Variant: `primary`, `secondary`, `quiet`, `danger`. Default `type="button"`; submit phải truyền `type="submit"`. |
| `IconButton` | `icon`, `label`, `onClick` | `label` bắt buộc để có tên truy cập; không chỉ dựa vào tooltip. |
| `Field` | `label`, `as`, `options`, `hint`, `error`, `required`, các props input | `as`: `input`/`select`/`textarea`. Select dùng `options: [{ value, label }]`. `error` ưu tiên hiển thị hơn hint. |
| `SearchField` | `label`, `value`, `onChange`, `placeholder` | Nhãn truy cập được tạo sẵn. Xử lý lọc do màn hình quyết định. |
| `Badge` | `tone`, `children` | `neutral`, `success`, `warning`, `danger`. Luôn có chữ, không chỉ màu. |
| `Notice` | `tone`, `title`, `children`, `onDismiss` | `info`, `success`, `warning`, `danger`; có `onDismiss` mới hiện nút đóng. |
| `EmptyState` | `title`, `children`, `action` | Nêu lý do và thao tác tiếp theo nếu có. |
| `LoadingState` | `label` | Nội dung đang tải có `role="status"`. |
| `PageHeader` | `eyebrow`, `title`, `description`, `actions` | Mỗi trang một `h1`; eyebrow không bắt buộc. |
| `Dialog` | `open`, `onClose`, `title`, `description`, `children`, `footer` | Native `<dialog>`, đóng bằng Escape/nút; Tab/Shift+Tab trong hộp thoại; không đóng khi bấm nền để tránh mất form. |
| `DataTable` | `caption`, `columns`, `rows`, `rowKey`, `empty` | `columns: [{key, label, render?}]`, `rowKey` mặc định `id`, phải duy nhất. Render nhận cả row. Cột đầu là thông tin chính trên mobile. |
| `AppShell` | `items`, `activeId`, `children`, `brandSubtitle`, `navigationLabel`, `context`, `badge`, `footer` | Item có `{id, href, label, icon}`. Nhãn mặc định dành cho thư viện; truyền nội dung tương ứng khi dựng màn nghiệp vụ, không sửa cứng component. `footer={null}` ẩn nội dung footer mẫu. |

### Form hoàn chỉnh tối thiểu

```jsx
import { useState } from 'react'
import { Button, Field, Notice, PageHeader } from '../ui'

export default function SubjectExample() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSaved(false)
    if (!name.trim()) {
      setError('Vui lòng nhập tên môn học.')
      return
    }
    setError('')
    setSaved(true) // Mẫu UI; chưa gọi server.
  }

  return <>
    <PageHeader title="Thêm môn học" description="Biểu mẫu minh họa." />
    <form onSubmit={handleSubmit} noValidate className="ui-form-stack">
      <Field label="Tên môn học" required value={name}
        onChange={event => setName(event.target.value)} error={error} />
      <div><Button type="submit">Kiểm tra dữ liệu mẫu</Button></div>
      {saved && <Notice tone="success">Dữ liệu hợp lệ. Chưa gửi lên server.</Notice>}
    </form>
  </>
}
```

Màn hình này phải được render trong `AppShell`. `required` diễn đạt ngữ nghĩa; khi dùng `noValidate`, màn hình phải tự kiểm tra và truyền lỗi. Ví dụ này không thay thế validation theo Android/API.

### Hộp thoại form

Đặt `id` cho `<form>` trong `children`, dùng `<Button type="submit" form="id-form">` ở `footer`. Truyền `autoFocus` cho `Field` đầu tiên muốn focus. Khi xóa, đặt nút an toàn “Giữ lại” trước nút `danger` và nêu rõ đối tượng/phạm vi bị xóa. Dialog hiện dành cho một lớp modal; không xếp chồng modal.

## 6. Camera và trạng thái nghiệp vụ

Camera vẫn ở `App.jsx`, truy cập `/` hoặc `/#/camera`. Khung oval, crop và xử lý Safari của prototype được giữ lại. Không tự mở một camera thứ hai trong màn hình nghiệp vụ. Việc tách camera thành component trả ảnh/callback sẽ được phối hợp với người phụ trách camera/liveness; bộ nền UI này chưa thực hiện tích hợp liveness hay API.

Phải phân biệt “Đã phát hiện khuôn mặt”, “Đã đăng ký ảnh”, “Liveness thành công” và “Điểm danh thành công”. Đây là bốn ý nghĩa khác nhau. Không dùng trạng thái detector hiện tại làm kết quả xác thực. Dữ liệu mẫu phải có nhãn rõ.

## 7. Responsive, bàn phím và nội dung

- Desktop từ 900 px: navigation trái, nội dung có giới hạn chiều rộng.
- Dưới 900 px: navigation chuyển thành hàng liên kết, không dùng drawer che nội dung nếu chưa cần.
- Dưới 640 px: bảng mẫu thành các hàng dạng danh sách có nhãn, form một cột. Với bảng báo cáo nhiều số liệu cần trao đổi mẫu responsive riêng, không áp dụng máy móc.
- Chữ trong input trên mobile tối thiểu 16 px. Mục tiêu vùng chạm của nút là 44 px. Focus bàn phím phải nhìn rõ.
- Nhãn form luôn hiển thị, không dùng placeholder thay nhãn. Báo lỗi cạnh trường, giữ dữ liệu sau lỗi. Nút chờ có `busy` để tránh gửi lại.
- Kiểm tra ở 360, 768 và 1440 px; thử phóng to 200%. Ghi riêng việc đã thử trên iPhone/Android thật; viewport Chrome không chứng minh tương thích Safari.
- Dùng tiếng Việt có dấu, tên vai trò và nghiệp vụ thống nhất. Tên người/môn dài không được làm mất nút thao tác hoặc gây tràn ngang trang.

## 8. Checklist tự kiểm tra trước PR

- [ ] Màn hình đối chiếu đúng nghiệp vụ được giao và có nguồn Activity/layout.
- [ ] Dùng token/component chung; không có CSS global ngoài bộ nền.
- [ ] Chỉ có một thao tác chính nổi bật trong mỗi nhóm; nút xóa có xác nhận rõ.
- [ ] Có trạng thái loading, empty, error, success phù hợp và nhãn dữ liệu mẫu.
- [ ] Form có nhãn, lỗi, disabled/busy; tên truy cập cho icon button.
- [ ] Kiểm tra bàn phím, focus, Escape và khôi phục focus sau modal.
- [ ] Ảnh desktop/mobile, ghi viewport và thiết bị thật đã thử; không đánh dấu chưa thử thành đã đạt.
- [ ] Chạy test/build thích hợp; nêu những phần API/liveness chưa tích hợp.
- [ ] Thay đổi bộ nền đã trao đổi với trưởng nhóm và cập nhật trang mẫu/tài liệu.

## 9. Kiểm tra đã thực hiện

- Build ứng dụng và unit test crop.
- Playwright chạy Chrome cài trên máy ở 1440×1000 và 390×844: tìm kiếm/lọc/rỗng, validation/mã trùng, thêm/sửa/xóa, cancel, focus modal/Escape, tải CSV, chuyển về camera, kiểm tra không tràn ngang và không có lỗi runtime ở bốn trang mẫu.
- Đã xem ảnh chụp desktop và mobile để kiểm tra bố cục.
- Chưa kiểm thử giao diện mới trên Safari iPhone hoặc Android thật, chưa kiểm tra đầy đủ bằng screen reader; chưa xác nhận camera phần cứng trong test này.

Chạy lại bằng Chrome đã cài:

```powershell
npm.cmd test
npm.cmd run test:ui
npm.cmd run build
```

Playwright tự mở Vite ở cổng 5187 và dừng server đó khi xong; cổng phải trống. Ảnh và trace nằm trong `test-results/` được gitignore. Cấu hình bot không được triển khai hoặc thay đổi thêm trong nhiệm vụ bộ nền giao diện này.
