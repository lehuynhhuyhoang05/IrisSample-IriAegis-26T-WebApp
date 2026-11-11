import { PageHeader } from '../ui'

export default function Guide() {
  return <>
    <PageHeader eyebrow="DÀNH CHO THÀNH VIÊN" title="Hướng dẫn triển khai" description="Dùng bộ nền này khi bắt đầu một màn hình mới." />
    <ol className="ui-guide-steps">
      <li><span>01</span><div><h2>Đối chiếu chức năng</h2><p>Chọn Activity/layout Android tương ứng. Ghi lại dữ liệu, thao tác và quyền của màn hình trước khi dựng UI.</p></div></li>
      <li><span>02</span><div><h2>Dùng cấu trúc chung</h2><p>Import component từ <code>src/ui</code>. Mỗi màn hình có một tiêu đề chính, thao tác chính rõ ràng và các trạng thái rỗng, đang tải, lỗi.</p><pre className="ui-code"><code>{'import { PageHeader, Button, Field, Notice } from "../ui"\n\n<PageHeader title="Môn học" description="Quản lý lịch học và giảng viên." />\n<Field label="Tên môn học" value={name} onChange={handleChange} />\n<Button onClick={handleSave}>Lưu môn học</Button>'}</code></pre></div></li>
      <li><span>03</span><div><h2>Tách dữ liệu khỏi hình thức</h2><p>Component chung nhận props, không gọi API hay gắn cứng nghiệp vụ. Khi chưa có API, dùng dữ liệu mẫu và ghi rõ trên màn hình. Đừng coi mẫu sinh viên ở đây là toàn bộ quy tắc nghiệp vụ Android.</p></div></li>
      <li><span>04</span><div><h2>Kiểm tra trước khi gửi PR</h2><p>Thử ở 360 px, 768 px và màn hình máy tính. Dùng bàn phím, mở/đóng hộp thoại, nhập dữ liệu sai và thử danh sách rỗng. Gửi ảnh desktop/mobile và ghi rõ thiết bị thật đã thử.</p></div></li>
    </ol>
    <div className="ui-reference-note"><strong>Trưởng nhóm duy trì bộ nền</strong><p>Nếu thiếu component hoặc cần thêm biến thể, trao đổi với trưởng nhóm rồi cập nhật bộ chung. Không tự đổi màu, font hay style global trong phần được giao.</p><p>Chi tiết props, ví dụ, phân công file và checklist bàn giao: <code>UI-GUIDELINES.md</code> tại thư mục dự án.</p></div>
  </>
}
