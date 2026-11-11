import { useState } from 'react'
import { Download, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Badge, Button, DataTable, Dialog, EmptyState, Field, IconButton, Notice, PageHeader, SearchField } from '../ui'

const initialStudents = [
  { id: 'SV001', name: 'Nguyễn Minh Anh', course: 'Lập trình Web', face: 'ready' },
  { id: 'SV002', name: 'Trần Hoàng Nam', course: 'Cơ sở dữ liệu', face: 'missing' },
  { id: 'SV003', name: 'Lê Thu Hà', course: 'Lập trình Web', face: 'ready' },
  { id: 'SV004', name: 'Phạm Gia Bảo', course: 'Lập trình Web', face: 'ready' },
  { id: 'SV005', name: 'Võ Ngọc Linh', course: 'Cơ sở dữ liệu', face: 'missing' },
  { id: 'SV006', name: 'Đặng Đức Minh', course: 'Lập trình Web', face: 'ready' },
]
const courses = [{ value: 'Lập trình Web', label: 'Lập trình Web' }, { value: 'Cơ sở dữ liệu', label: 'Cơ sở dữ liệu' }]
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export default function StudentsExample() {
  const [students, setStudents] = useState(initialStudents)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const filtered = students.filter(student => normalize(`${student.id} ${student.name}`).includes(normalize(query.trim())) && (filter === 'all' || student.face === filter))
  const update = (key, value) => setEditing(previous => ({ ...previous, [key]: value }))
  const edit = student => { setErrors({}); setEditing({ ...student, originalId: student.id }) }
  const add = () => { setErrors({}); setEditing({ id: '', name: '', course: courses[0].value, face: 'missing', originalId: null }) }

  function save(event) {
    event.preventDefault()
    const record = { id: editing.id.trim().toUpperCase(), name: editing.name.trim(), course: editing.course, face: editing.face }
    const nextErrors = {}
    if (!/^[A-Z0-9_-]{2,20}$/.test(record.id)) nextErrors.id = 'Dùng 2–20 ký tự: chữ không dấu, số, dấu - hoặc _.'
    else if (students.some(student => student.id === record.id && student.id !== editing.originalId)) nextErrors.id = 'Mã sinh viên này đã có trong dữ liệu mẫu.'
    if (record.name.length < 2) nextErrors.name = 'Nhập họ tên từ 2 ký tự.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setStudents(previous => editing.originalId ? previous.map(student => student.id === editing.originalId ? record : student) : [...previous, record])
    setNotice(`${editing.originalId ? 'Đã cập nhật' : 'Đã thêm'} ${record.name} trong dữ liệu mẫu.`)
    setEditing(null)
  }

  function exportCsv() {
    const cell = value => `"${(/^[\s]*[=+\-@]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`
    const csv = '\uFEFF' + [['Mã sinh viên', 'Họ tên', 'Môn học', 'Ảnh mẫu'], ...filtered.map(student => [student.id, student.name, student.course, student.face === 'ready' ? 'Đã đăng ký (mẫu)' : 'Chưa có ảnh'])].map(row => row.map(cell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'sinh-vien-mau.csv'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Đã tạo file CSV từ danh sách đang hiển thị.')
  }

  const columns = [
    { key: 'name', label: 'Sinh viên', render: student => <div className="ui-person"><span className="ui-initials" aria-hidden="true">{student.name.split(' ').slice(-2).map(part => part[0]).join('')}</span><span><strong>{student.name}</strong><small>{student.id}</small></span></div> },
    { key: 'course', label: 'Môn học' },
    { key: 'face', label: 'Ảnh khuôn mặt', render: student => <Badge tone={student.face === 'ready' ? 'success' : 'warning'}>{student.face === 'ready' ? 'Đã đăng ký' : 'Chưa có ảnh'}</Badge> },
    { key: 'actions', label: 'Thao tác', render: student => <div className="ui-row-actions"><IconButton label={`Sửa ${student.name}`} icon={Pencil} onClick={() => edit(student)} /><IconButton label={`Xóa ${student.name}`} icon={Trash2} onClick={() => setRemoving(student)} /></div> },
  ]

  return <>
    <PageHeader eyebrow="MÀN HÌNH THAM CHIẾU" title="Sinh viên" description="Mẫu danh sách, tìm kiếm và biểu mẫu cho các màn hình quản lý." actions={<Button icon={Plus} onClick={add}>Thêm sinh viên</Button>} />
    <div className="ui-demo-note"><span className="ui-demo-dot" />Dữ liệu minh họa · Thay đổi chỉ giữ trong phiên này, tải lại trang sẽ khôi phục.</div>
    {notice && <Notice tone="success" onDismiss={() => setNotice('')}>{notice}</Notice>}
    <section className="ui-list-section" aria-label="Danh sách sinh viên mẫu">
      <div className="ui-toolbar"><SearchField label="Tìm tên hoặc mã sinh viên" value={query} onChange={event => setQuery(event.target.value)} /><Field label="Ảnh khuôn mặt" as="select" value={filter} onChange={event => setFilter(event.target.value)} options={[{ value: 'all', label: 'Tất cả trạng thái' }, { value: 'ready', label: 'Đã đăng ký ảnh' }, { value: 'missing', label: 'Chưa có ảnh' }]} /><Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!filtered.length}>Xuất CSV</Button></div>
      <DataTable caption="Danh sách sinh viên minh họa" columns={columns} rows={filtered} empty={<EmptyState title={students.length ? 'Không tìm thấy sinh viên' : 'Chưa có sinh viên'} action={<Button variant="secondary" onClick={students.length ? () => { setQuery(''); setFilter('all') } : add}>{students.length ? 'Xóa bộ lọc' : 'Thêm sinh viên'}</Button>}>{students.length ? 'Thử tên, mã khác hoặc bỏ điều kiện lọc.' : 'Thêm một hồ sơ để thử biểu mẫu dùng chung.'}</EmptyState>} />
      <div className="ui-list-footer"><span>Hiển thị <strong>{filtered.length}</strong> / {students.length} sinh viên</span><Button variant="quiet" icon={RotateCcw} onClick={() => { setStudents(initialStudents); setQuery(''); setFilter('all'); setNotice('Đã khôi phục dữ liệu minh họa.') }}>Đặt lại mẫu</Button></div>
    </section>
    <div className="ui-reference-note"><strong>Cách dùng mẫu này</strong><p>Giữ cấu trúc tiêu đề → bộ lọc → danh sách → thao tác. Thay dữ liệu và nội dung theo chức năng; dùng lại các component trong <code>src/ui</code>.</p><p>Trạng thái ảnh ở đây là dữ liệu mẫu, không có ảnh thật hay đối sánh danh tính.</p></div>
    <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.originalId ? 'Sửa sinh viên mẫu' : 'Thêm sinh viên mẫu'} description="Biểu mẫu tham chiếu. Không nhập thông tin cá nhân thật." footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Hủy</Button><Button type="submit" form="student-example-form">Lưu hồ sơ mẫu</Button></>}>
      {editing && <form id="student-example-form" className="ui-form-stack" onSubmit={save} noValidate><Field autoFocus label="Mã sinh viên" required value={editing.id} error={errors.id} hint="Ví dụ: SV007" maxLength={20} onChange={event => update('id', event.target.value)} /><Field label="Họ và tên" required value={editing.name} error={errors.name} maxLength={100} onChange={event => update('name', event.target.value)} /><Field label="Môn học" as="select" value={editing.course} options={courses} onChange={event => update('course', event.target.value)} /><p className="ui-hint">Hồ sơ mới có trạng thái “Chưa có ảnh”. Đăng ký ảnh sẽ được nối vào luồng camera khi triển khai nghiệp vụ.</p></form>}
    </Dialog>
    <Dialog open={!!removing} onClose={() => setRemoving(null)} title="Xóa hồ sơ mẫu?" description="Thao tác chỉ tác động tới dữ liệu minh họa của trang này." footer={<><Button variant="secondary" onClick={() => setRemoving(null)}>Giữ lại</Button><Button variant="danger" icon={Trash2} onClick={() => { setStudents(previous => previous.filter(student => student.id !== removing.id)); setNotice(`Đã xóa hồ sơ mẫu ${removing.name}.`); setRemoving(null) }}>Xóa hồ sơ mẫu</Button></>}><p>Bạn đang xóa <strong>{removing?.name}</strong>. Khi triển khai nghiệp vụ, cần phân biệt xóa hồ sơ với bỏ sinh viên khỏi một môn học.</p></Dialog>
  </>
}
