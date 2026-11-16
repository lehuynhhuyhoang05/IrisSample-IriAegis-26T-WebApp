# Hướng dẫn dùng camera chung (FaceCamera)

Người phụ trách: @thang-nghien-dua · Phạm vi: Issue #4, mục "Camera và điểm tích hợp liveness".

Các module tài khoản, sinh viên và điểm danh **dùng component này** thay vì tự mở `getUserMedia` hoặc sao chép code camera. Cần thêm tính năng camera thì báo người phụ trách camera.

Xem thử tại `/#/ui-kit/camera` (chọn kịch bản liveness để thử từng trạng thái).

## 1. Cấu trúc

| File | Vai trò |
| --- | --- |
| `src/camera/index.js` | Điểm import duy nhất. |
| `src/camera/FaceCamera.jsx` | Component: bật/tắt, khung bầu dục, chụp, xem ảnh, chụp lại, hủy, trạng thái liveness. |
| `src/camera/useCamera.js` | Hook React khi cần tự dựng giao diện camera khác. |
| `src/camera/camera-controller.js` | Lõi không phụ thuộc React: một stream duy nhất, lỗi quyền, gián đoạn, chụp ảnh. |
| `src/camera/liveness-providers.js` | Điểm tích hợp liveness: provider Nhóm 4 (HTTP) và provider giả lập. |
| `src/showcase/CameraExample.jsx` | Trang mẫu `/#/ui-kit/camera`. |

Chưa thay đổi `src/App.jsx` và `src/liveness/FullLivenessCamera.jsx`. Luồng liveness đầy đủ của Nhóm 4 (chớp mắt, quay đầu, flash) vẫn ở `/#/camera`.

## 2. Dùng nhanh

```jsx
import { FaceCamera, createSimulatedProvider } from '../camera'

const liveness = createSimulatedProvider({ scenario: 'pass' }) // tạo ngoài render hoặc trong useMemo

<FaceCamera
  liveness={liveness}              // null = chỉ chụp ảnh, không kiểm tra
  onCapture={result => save(result.blob)}
  onCancel={() => setStep('form')}  // có prop này thì hiện nút "Hủy"
  onRetake={() => {}}               // tùy chọn
/>
```

Ví dụ thay cho cách gọi cũ trong `PhotoField`:

```jsx
// Cũ: <CameraApp embedded livenessRequired onCapture={image => ...} />
<FaceCamera onCapture={({ dataUrl }) => onChange(dataUrl)} onCancel={() => setCamera(false)} />
```

### Props

| Prop | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `onCapture(result)` | bắt buộc | Gọi khi người dùng bấm "Sử dụng ảnh này". Nếu có `liveness`, chỉ bấm được khi kết quả đạt. |
| `onCancel()` | — | Hiện nút "Hủy". Camera đã dừng trước khi gọi. |
| `onRetake()` | — | Gọi mỗi lần bấm "Chụp lại" (camera tự mở lại). |
| `liveness` | `null` | Provider, xem mục 3. |
| `autoStart` | `false` | Mở camera ngay khi hiện. Trình duyệt vẫn hỏi quyền. |
| `maxSize` | `960` | Cạnh dài tối đa của ảnh trả về (px). |
| `confirmLabel` | `Sử dụng ảnh này` | Chữ trên nút xác nhận. |

### Kết quả `onCapture`

```js
{
  blob,         // Blob image/jpeg, dùng để upload (FormData)
  dataUrl,      // data:image/jpeg;base64,... để xem trước
  width, height,
  mirrored,     // true: ảnh đã lật như gương, giống những gì người dùng thấy
  capturedAt,   // ISO time
  liveness,     // null hoặc { verdict: 'pass', simulated, source, scores, raw }
}
```

**Luôn kiểm tra `liveness.simulated` trước khi coi đó là bằng chứng.** Kết quả giả lập không được gửi lên server như kết quả xác thực thật.

### Trạng thái người dùng thấy

- Camera: tắt → đang mở → đang hoạt động (khung bầu dục) → tạm dừng (bị gián đoạn) / lỗi.
- Liveness: chưa bắt đầu → đang kiểm tra → đạt / không đạt / lỗi (có "Thử kiểm tra lại").
- Lỗi đã xử lý: chưa cấp quyền, không có camera, camera bận, trang không phải HTTPS, trình duyệt không hỗ trợ, track bị ngắt, chuyển tab/khóa máy rồi quay lại.
- Camera luôn tắt khi chụp xong, khi hủy và khi component bị gỡ khỏi trang.

## 3. Tích hợp module liveness (Nhóm 4)

Provider là một object:

```js
{
  id: 'group4-photo',
  label: 'Tên hiển thị',
  simulated: false,          // true thì UI luôn gắn nhãn GIẢ LẬP
  mode: 'photo' | 'stream',
  mirror: false,             // tùy chọn (photo): nhận ảnh hướng gốc thay vì ảnh lật gương
  async check({ blob, dataUrl, width, height, stream, video, signal }) {
    return { verdict: 'pass' | 'fail', message?, scores?: { real, spoof, threshold }, raw? }
    // lỗi kết nối/dịch vụ: throw new Error('...')
  },
}
```

- `mode: 'photo'`: chụp xong, tắt camera rồi gửi ảnh (`blob`). Đây là cách dịch vụ HTTP hiện tại của Nhóm 4 hoạt động (`createGroup4PhotoProvider()`).
- `mode: 'stream'`: kiểm tra **trong khi camera còn mở**, dùng chung `stream`/`video` (không mở camera thứ hai, không gọi `track.stop()`). Kiểm tra xong mới chụp ảnh. Dùng khi Nhóm 4 đưa module chạy trong trình duyệt.
- Tôn trọng `signal` (AbortSignal): người dùng có thể hủy hoặc chụp lại bất cứ lúc nào.
- Provider có `simulated: true` không thể trả kết quả "thật" (`normalizeOutcome` ép nhãn giả lập).

Có sẵn:

```js
createGroup4PhotoProvider()                                   // gọi /liveness-api/api/v1/predict-liveness
createSimulatedProvider({ scenario: 'pass' | 'fail' | 'error', delay: 900, mode: 'photo' | 'stream' })
```

**Phát hiện khuôn mặt không phải liveness.** FaceCamera không tự kết luận người thật.

## 4. Kiểm thử

```powershell
npm.cmd test                                                     # gồm src/camera.test.js (14 bài)
npx playwright test tests/ui/camera-component.spec.js            # 7 kịch bản × desktop + mobile Chrome
```

Test giao diện dùng camera giả của Chrome (`--use-fake-device-for-media-stream`).

| Môi trường | Kết quả |
| --- | --- |
| Chrome desktop 1440×1000, camera giả | Đạt 7/7 |
| Chrome mobile 390×844, camera giả | Đạt 7/7 |
| Webcam thật, Chrome trên Windows (16/11/2026, thủ công) | Đạt: bật camera, khung bầu dục, chụp/xác nhận, không đạt → chụp lại, lỗi → thử lại, hủy tắt camera, chuyển tab rồi quay lại, chặn quyền |
| Safari iPhone thật | **Chưa kiểm thử** (cần thiết bị; phải mở qua HTTPS) |

Khi thử trên iPhone: mở bằng địa chỉ HTTPS, cấp quyền camera, thử khóa màn hình/chuyển app rồi quay lại, ghi kết quả vào bảng trên.

## 5. Giới hạn và việc tiếp theo

- `createGroup4PhotoProvider` gửi nguyên khung đã chụp, hướng gốc (không lật gương) như prototype cũ. Prototype cũ cắt sát khuôn mặt trước khi gửi cho model 2.7, nên độ chính xác có thể khác. Cần thống nhất với Nhóm 4 định dạng ảnh đầu vào.
- Chưa chuyển `PhotoField`, `FaceFlow` và `server/*` sang FaceCamera. Việc này chờ trưởng nhóm duyệt API component rồi mới làm, để tránh sửa module của thành viên khác.
- Cần Nhóm 4 xác nhận: module chạy trên server hay trình duyệt, đầu vào (ảnh/stream, kích thước, có lật gương không) và định dạng kết quả.
- Gửi ảnh lên server phụ thuộc đặc tả Nhóm 1/Nhóm 3.
