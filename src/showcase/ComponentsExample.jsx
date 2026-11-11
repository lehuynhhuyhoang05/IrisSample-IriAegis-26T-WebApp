import { useState } from 'react'
import { Camera, Check, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Dialog, EmptyState, Field, LoadingState, Notice, PageHeader } from '../ui'

function Example({ number, title, children, code }) {
  return <section className="ui-spec-section"><div className="ui-spec-heading"><span>{number}</span><h2>{title}</h2></div><div className="ui-spec-content">{children}{code && <pre className="ui-code"><code>{code}</code></pre>}</div></section>
}

export default function ComponentsExample() {
  const [dialog, setDialog] = useState(false)
  const [message, setMessage] = useState(false)
  const [name, setName] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [state, setState] = useState('empty')
  return <>
    <PageHeader eyebrow="THÀNH PHẦN DÙNG CHUNG" title="Component" description="Một cách thể hiện cho cùng một thao tác, ở mọi màn hình." />
    <Example number="01" title="Nút & thao tác" code={'<Button icon={Plus} onClick={handleAdd}>Thêm sinh viên</Button>\n<Button variant="secondary" onClick={handleCancel}>Hủy</Button>'}>
      <div className="ui-component-row"><Button icon={Plus} onClick={() => setDialog(true)}>Thêm mới</Button><Button variant="secondary" onClick={() => setMessage(true)}>Thao tác phụ</Button><Button variant="quiet" onClick={() => setDialog(true)}>Xem chi tiết</Button><Button variant="danger" icon={Trash2} onClick={() => setDialog(true)}>Xóa</Button></div>
      <div className="ui-component-row"><Button disabled>Chưa khả dụng</Button><Button busy>Đang lưu…</Button><a className="ui-link" href="#/camera"><Camera size={17} aria-hidden="true" />Mở camera thật</a></div>
      <p className="ui-hint">Một nút chính cho mỗi nhóm thao tác. Nút xóa mở xác nhận; nút chỉ có icon phải có tên truy cập.</p>
      {message && <Notice tone="success" onDismiss={() => setMessage(false)}>Đây là thông báo mẫu sau thao tác.</Notice>}
    </Example>
    <Example number="02" title="Biểu mẫu" code={'<Field label="Họ và tên" value={name} onChange={handleChange}\n  required error={errors.name} hint="Nhập họ tên đầy đủ" />'}>
      <form className="ui-example-form" noValidate onSubmit={event => { event.preventDefault(); setAttempted(true) }}>
        <Field label="Họ và tên" required placeholder="Nhập họ tên" value={name} onChange={event => setName(event.target.value)} error={attempted && !name.trim() ? 'Vui lòng nhập họ và tên.' : ''} hint="Nhãn luôn hiển thị, kể cả khi đã nhập dữ liệu." />
        <Field label="Vai trò" as="select" defaultValue="admin" options={[{ value: 'admin', label: 'Giảng viên / Admin' }, { value: 'super', label: 'Super Admin' }]} />
        <Field label="Ghi chú" as="textarea" rows={3} placeholder="Thông tin bổ sung (không bắt buộc)" />
        <Field label="Mã hệ thống" value="Tự động cấp" disabled />
        <div><Button variant="secondary" type="submit">Thử kiểm tra biểu mẫu</Button></div>
        {attempted && name.trim() && <Notice tone="success">Biểu mẫu hợp lệ. Chưa lưu hoặc gửi dữ liệu.</Notice>}
      </form>
    </Example>
    <Example number="03" title="Trạng thái & phản hồi" code={'<Badge tone="success">Đã đăng ký</Badge>\n<Notice tone="danger" title="Không thể lưu">Hãy thử lại.</Notice>'}>
      <div className="ui-component-row"><Badge tone="neutral">Chưa bắt đầu</Badge><Badge tone="success">Đã đăng ký</Badge><Badge tone="warning">Chưa có ảnh</Badge><Badge tone="danger">Không thành công</Badge></div>
      <div className="ui-form-stack"><Notice tone="info" title="Dữ liệu minh họa">Thay đổi chưa được gửi lên server.</Notice><Notice tone="warning" title="Camera chưa sẵn sàng">Kiểm tra quyền camera trước khi thử lại.</Notice><Notice tone="danger" title="Không thể lưu">Đây là trạng thái lỗi mẫu. Giữ nguyên dữ liệu form để người dùng thử lại.</Notice></div>
    </Example>
    <Example number="04" title="Tải dữ liệu & danh sách rỗng" code={'<LoadingState label="Đang tải danh sách…" />\n<EmptyState title="Chưa có dữ liệu">Thêm bản ghi để bắt đầu.</EmptyState>'}>
      <Field label="Xem trạng thái" as="select" value={state} onChange={event => setState(event.target.value)} options={[{ value: 'empty', label: 'Chưa có dữ liệu' }, { value: 'loading', label: 'Đang tải (mẫu tĩnh)' }]} />
      <div className="ui-state-preview">{state === 'loading' ? <LoadingState /> : <EmptyState title="Chưa có dữ liệu" action={<Button variant="secondary" icon={Plus} onClick={() => setDialog(true)}>Thêm mới</Button>}>Giải thích ngắn gọn và đưa ra thao tác tiếp theo.</EmptyState>}</div>
    </Example>
    <Dialog open={dialog} onClose={() => setDialog(false)} title="Hộp thoại dùng chung" description="Giữ nội dung ngắn và tập trung vào một quyết định." footer={<><Button variant="secondary" onClick={() => setDialog(false)}>Hủy</Button><Button icon={Check} onClick={() => { setDialog(false); setMessage(true) }}>Xác nhận mẫu</Button></>}><p>Thử dùng Tab, Shift + Tab hoặc Escape. Focus được giữ trong hộp thoại và trả về nút mở khi đóng.</p></Dialog>
  </>
}
