import { BookOpen, Camera, Check, Download, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { PageHeader } from '../ui'

const colors = [
  ['--ui-brand', '#66CFCF', 'Nhận diện Android'],
  ['--ui-action', '#236E69', 'Nút chính & liên kết'],
  ['--ui-text', '#263238', 'Nội dung chính'],
  ['--ui-muted', '#53666E', 'Nội dung phụ'],
  ['--ui-canvas', '#F7F9F8', 'Nền trang'],
  ['--ui-surface', '#FFFFFF', 'Bề mặt'],
  ['--ui-success', '#27633E', 'Thành công'],
  ['--ui-danger', '#AD302C', 'Lỗi / xóa'],
]

export default function Foundation() {
  return <>
    <PageHeader eyebrow="QUY CHUẨN 0.1" title="Nền tảng thiết kế" description="Kế thừa nhận diện Android, chuẩn hóa cho giao diện Web nhiều người cùng phát triển." />
    <section className="ui-spec-section"><div className="ui-spec-heading"><span>01</span><h2>Màu sắc</h2></div><div className="ui-spec-content"><p className="ui-spec-intro">Mint là màu nhận diện. Nút chính dùng xanh đậm để tăng tương phản chữ; màu trạng thái chỉ dùng khi có ý nghĩa.</p><div className="ui-swatch-grid">{colors.map(([token, hex, label]) => <div className="ui-swatch" key={token}><div style={{ background: `var(${token})` }} /><strong>{label}</strong><code>{token}</code><span>{hex}</span></div>)}</div></div></section>
    <section className="ui-spec-section"><div className="ui-spec-heading"><span>02</span><h2>Chữ & khoảng cách</h2></div><div className="ui-spec-content"><div className="ui-type-row"><span>Tiêu đề trang · 24–30 px</span><strong className="ui-type-title">Quản lý sinh viên</strong></div><div className="ui-type-row"><span>Nội dung · 16 px / 1.5</span><p>Thông tin rõ ràng, thao tác nhất quán.</p></div><div className="ui-type-row"><span>Nhãn & dữ liệu · 14 px</span><p className="ui-type-label">Mã sinh viên · Môn học · Trạng thái</p></div><p className="ui-hint">Font hệ thống hỗ trợ tiếng Việt; không phụ thuộc tải font ngoài. Chữ trong ô nhập trên mobile là 16 px.</p><div className="ui-spacing-scale">{[4, 8, 12, 16, 20, 24, 32, 40].map(value => <div key={value}><i style={{ width: value, height: value }} /><span>{value}</span></div>)}</div><p className="ui-hint">Đơn vị khoảng cách 4 px. Radius: 6 px cho nhãn, 8 px cho nút/ô nhập, 12 px cho hộp thoại.</p></div></section>
    <section className="ui-spec-section"><div className="ui-spec-heading"><span>03</span><h2>Icon</h2></div><div className="ui-spec-content"><div className="ui-icon-grid">{[[Users, 'Sinh viên'], [BookOpen, 'Môn học'], [Camera, 'Camera'], [Search, 'Tìm kiếm'], [Plus, 'Thêm'], [Pencil, 'Sửa'], [Trash2, 'Xóa'], [Download, 'Xuất'], [Check, 'Hoàn tất']].map(([Icon, label]) => <div key={label}><Icon size={20} aria-hidden="true" /><span>{label}</span></div>)}</div><p className="ui-hint">Logo dùng tài nguyên Android gốc. Icon thao tác dùng Lucide, cùng nét 2 px và cỡ 18–20 px. Không dùng emoji làm nút chức năng.</p></div></section>
    <section className="ui-spec-section"><div className="ui-spec-heading"><span>04</span><h2>Bố cục</h2></div><div className="ui-spec-content"><dl className="ui-rules-list"><div><dt>Từ 900 px</dt><dd>Navigation bên trái, nội dung có giới hạn chiều rộng. Tiêu đề và thao tác trên cùng hàng.</dd></div><div><dt>Dưới 900 px</dt><dd>Navigation chuyển thành hàng liên kết. Các bộ lọc xuống dòng khi thiếu chỗ.</dd></div><div><dt>Dưới 640 px</dt><dd>Bảng mẫu thành danh sách có nhãn; form một cột; nút giữ chiều cao tối thiểu 44 px.</dd></div><div><dt>Nguyên tắc</dt><dd>Không gradient trang trí, không card lồng card, không đổ bóng cho mọi khối. Dùng khoảng trắng và đường phân cách để nhóm thông tin.</dd></div></dl></div></section>
  </>
}
