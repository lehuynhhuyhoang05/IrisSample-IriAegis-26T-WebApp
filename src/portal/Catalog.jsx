import { useState } from 'react'
import { ArrowRight, CalendarDays, Download, Edit2, FileUp, Plus, Search, Trash2, Users } from '../ui/icons'
import { Badge, Button, DataTable, Dialog, EmptyState, Field, IconButton, Notice, PageHeader, SearchField } from '../ui'
import { usePortal, useTask } from './Store.jsx'
import { canCourse, coursesFor, dateLabel, dayLabel, DEMO_PASSWORD, fold, isSuper, studentsFor, today, uid } from './domain.js'
import { Back, Confirm, ErrorNotice, go, ImportDialog, Person, PhotoField } from './shared.jsx'
import { csvText, download } from './csv.js'
import EnrollDialog from './students/EnrollDialog.jsx'

const names = { students: 'sinh viên', admins: 'quản trị viên', courses: 'môn học' }
function defaultRow(entity, actor) {
  if (entity === 'courses') return { id: '', name: '', instructorId: isSuper(actor) ? '' : actor.id, room: '', semester: 'Học kỳ 1', startDate: today(), endDate: `${new Date().getFullYear()}-12-31`, schedules: [{ id: uid('SCH'), day: new Date().getDay(), start: '07:30', end: '11:30' }] }
  return { id: '', name: '', email: '', code: '', phone: '', dob: '', gender: '', description: '', className: '', password: entity === 'admins' ? DEMO_PASSWORD : '123456', photo: '' }
}
export function EntityForm({ entity, row, onClose, courseId, profile = false }) {
  const { db, actor, write, persist, setFlash } = usePortal(), task = useTask()
  const [form, setForm] = useState(() => structuredClone(row || defaultRow(entity, actor)))
  const [oldPassword, setOldPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [photoCheck, setPhotoCheck] = useState('pass')
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const formId = `form-${entity}`
  async function save(e) {
    e.preventDefault()
    task.run(() => {
      if (form.photo && photoCheck === 'duplicate') throw new Error('Giả lập: ảnh khuôn mặt đã được đăng ký ở hồ sơ khác. Chưa lưu thay đổi.')
      if (form.photo && photoCheck === 'mismatch') throw new Error('Giả lập: ảnh mới không khớp ảnh cũ. Chưa cập nhật hồ sơ.')
      if (profile && form.password !== row.password && oldPassword !== actor.password) throw new Error('Nhập đúng mật khẩu demo hiện tại để đổi mật khẩu.')
      if (row && form.password !== row.password && repeatPassword !== form.password) throw new Error('Xác nhận mật khẩu không trùng khớp.')
      // Atomic create + enrollment. If enrollment fails no partial student is saved.
      if (entity === 'students' && courseId && !row) {
        // command exported below keeps the same validation as direct writes.
        let next = command(db, actor.id, { type: 'save', entity, row: form })
        next = command(next, actor.id, { type: 'enroll', courseId, studentId: form.id }); persist(next)
      } else write({ type: 'save', entity, originalId: row?.id, row: form })
      setFlash({ tone: 'success', text: `Đã lưu ${names[entity]} trong dữ liệu demo.` }); onClose()
    })
  }
  const controls = <>
    <ErrorNotice error={task.error} />
    <div className="portal-form-grid"><Field label={`Mã ${names[entity]}`} value={form.id} disabled={!!row} onChange={e => update('id', e.target.value.toUpperCase().trim())} required autoFocus={!row} /><Field label={entity === 'courses' ? 'Tên môn học' : 'Họ tên'} value={form.name} onChange={e => update('name', e.target.value)} required /></div>
    {entity === 'courses' ? <>
      <div className="portal-form-grid"><Field label="Học kỳ" value={form.semester} onChange={e => update('semester', e.target.value)} required /><Field label="Phòng học" value={form.room} onChange={e => update('room', e.target.value)} /></div>
      {isSuper(actor) && <Field as="select" label="Giảng viên phụ trách" value={form.instructorId} onChange={e => update('instructorId', e.target.value)} options={[{ value: '', label: 'Chưa phân công' }, ...db.admins.map(a => ({ value: a.id, label: a.name }))]} />}
      <div className="portal-form-grid"><Field type="date" label="Bắt đầu học kỳ" value={form.startDate} onChange={e => update('startDate', e.target.value)} required /><Field type="date" label="Kết thúc học kỳ" value={form.endDate} min={form.startDate} onChange={e => update('endDate', e.target.value)} required /></div>
      <div className="portal-section-heading"><h3>Lịch học hằng tuần</h3><Button variant="quiet" icon={Plus} disabled={form.schedules.length >= 14} onClick={() => update('schedules', [...form.schedules, { id: uid('SCH'), day: 1, start: '13:00', end: '16:30' }])}>Thêm ca</Button></div>
      {form.schedules.map((schedule, index) => <div className="portal-schedule-edit" key={schedule.id}><Field as="select" label={`Thứ · ca ${index + 1}`} value={schedule.day} onChange={e => update('schedules', form.schedules.map(s => s.id === schedule.id ? { ...s, day: Number(e.target.value) } : s))} options={[1, 2, 3, 4, 5, 6, 0].map(day => ({ value: day, label: dayLabel(day) }))} /><Field type="time" label={`Bắt đầu · ca ${index + 1}`} value={schedule.start} onChange={e => update('schedules', form.schedules.map(s => s.id === schedule.id ? { ...s, start: e.target.value } : s))} required /><Field type="time" label={`Kết thúc · ca ${index + 1}`} value={schedule.end} onChange={e => update('schedules', form.schedules.map(s => s.id === schedule.id ? { ...s, end: e.target.value } : s))} required /><IconButton label={`Xóa ca ${index + 1}`} icon={Trash2} disabled={form.schedules.length === 1} onClick={() => update('schedules', form.schedules.filter(s => s.id !== schedule.id))} /></div>)}
    </> : <>
      <div className="portal-form-grid"><Field label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value.trim())} required={entity === 'admins'} /><Field label={entity === 'students' ? 'Lớp hành chính' : 'Mã giảng viên'} value={entity === 'students' ? form.className : form.code} onChange={e => update(entity === 'students' ? 'className' : 'code', e.target.value)} /></div>
      <Field label="Số điện thoại" type="tel" value={form.phone || ''} onChange={e => update('phone', e.target.value)} />
      {entity === 'admins' && <><div className="portal-form-grid"><Field label="Ngày sinh" type="date" max={today()} value={form.dob || ''} onChange={e => update('dob', e.target.value)} /><Field as="select" label="Giới tính" value={form.gender || ''} onChange={e => update('gender', e.target.value)} options={[{ value: '', label: 'Chưa chọn' }, ...['Nam', 'Nữ', 'Khác'].map(value => ({ value, label: value }))]} /></div><Field as="textarea" label="Mô tả" rows={3} maxLength={2000} value={form.description || ''} onChange={e => update('description', e.target.value)} /></>}
      <Field type="password" autoComplete="new-password" label={entity === 'students' ? 'Mật khẩu điểm danh (demo)' : 'Mật khẩu tài khoản (demo)'} value={form.password} onChange={e => update('password', e.target.value)} required hint="Dùng mật khẩu thử nghiệm." />
      {profile && <Field type="password" label="Mật khẩu hiện tại (khi đổi mật khẩu)" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />}
      {row && form.password !== row.password && <Field type="password" label="Xác nhận mật khẩu mới" value={repeatPassword} onChange={e => setRepeatPassword(e.target.value)} required />}
      <PhotoField value={form.photo} onChange={value => update('photo', value)} />
      {form.photo && <Field as="select" label="Kịch bản kiểm tra ảnh (giả lập)" value={photoCheck} onChange={e => setPhotoCheck(e.target.value)} options={[{ value: 'pass', label: 'Giả lập hợp lệ — chưa kiểm tra thực' }, { value: 'duplicate', label: 'Giả lập trùng khuôn mặt' }, ...(row?.photo ? [{ value: 'mismatch', label: 'Giả lập không khớp ảnh cũ' }] : [])]} />}
    </>}
  </>
  return <Dialog open title={`${row ? 'Cập nhật' : 'Thêm'} ${names[entity]}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form={formId} busy={task.busy}>Lưu {names[entity]}</Button></>}><form id={formId} className="portal-form" onSubmit={save}>{controls}</form></Dialog>
}
import { command } from './domain.js'

export function Catalog({ entity }) {
  const { db, actor, write, setFlash } = usePortal()
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all'), [edit, setEdit] = useState(undefined), [remove, setRemove] = useState(null), [importing, setImporting] = useState(false)
  const list = entity === 'courses' ? coursesFor(db, actor) : entity === 'students' ? studentsFor(db, actor) : db.admins
  const rows = list.filter(row => fold(`${row.name} ${row.id} ${row.email || ''} ${row.className || ''}`).includes(fold(query)) && (filter === 'all' || (entity === 'courses' ? filter === 'assigned' ? !!row.instructorId : !row.instructorId : filter === 'photo' ? !!row.photo : !row.photo)))
  if (entity === 'admins' && !isSuper(actor)) return <Notice tone="warning" title="Không có quyền truy cập">Quản lý quản trị viên dành cho Super Admin.</Notice>
  const actions = row => <div className="ui-row-actions"><IconButton icon={Edit2} label={`Sửa ${row.id}`} onClick={() => setEdit(row)} />{(entity !== 'admins' || row.role !== 'SUPER_ADMIN') && (entity !== 'students' || isSuper(actor)) && <IconButton icon={Trash2} label={`Xóa ${row.id}`} onClick={() => setRemove(row)} />}</div>
  return <>
    <PageHeader  title={{ courses: 'Môn học', students: 'Sinh viên', admins: 'Quản trị viên' }[entity]}  actions={<><Button variant="quiet" icon={FileUp} onClick={() => setImporting(true)}>Nhập CSV</Button><Button icon={Plus} onClick={() => setEdit(null)}>Thêm {names[entity]}</Button></>} />
    <div className="ui-toolbar"><SearchField placeholder={`Tìm ${names[entity]} theo tên hoặc mã…`} value={query} onChange={e => setQuery(e.target.value)} /><Field as="select" label="Lọc danh sách" value={filter} onChange={e => setFilter(e.target.value)} options={entity === 'courses' ? [{ value: 'all', label: 'Tất cả giảng viên' }, { value: 'assigned', label: 'Đã phân công' }, { value: 'unassigned', label: 'Chưa phân công' }] : [{ value: 'all', label: 'Tất cả hồ sơ' }, { value: 'photo', label: 'Đã có ảnh' }, { value: 'no-photo', label: 'Chưa có ảnh' }]} /></div>
    <DataTable caption={`Danh sách ${names[entity]}`} variant={`catalog ${entity}`} rows={rows} empty={<EmptyState title="Không có kết quả phù hợp">Thử thay từ khóa hoặc bộ lọc; có thể thêm hồ sơ mới.</EmptyState>} columns={entity === 'courses' ? [
      { key: 'name', label: 'Môn học', render: row => <a className="portal-record-link" href={`#/app/courses/${row.id}`}><strong>{row.name}</strong><small>{row.id} · {row.semester}</small></a> },
      { key: 'instructor', label: 'Giảng viên', render: row => db.admins.find(a => a.id === row.instructorId)?.name || <Badge tone="warning">Chưa phân công</Badge> },
      { key: 'schedules', label: 'Lịch học', render: row => <span className="portal-multiline">{row.schedules.map(s => <span key={s.id}>{dayLabel(s.day)} · {s.start}–{s.end}</span>)}</span> },
      { key: 'count', label: 'Sĩ số', render: row => db.enrollments.filter(e => e.courseId === row.id).length }, { key: 'actions', label: 'Thao tác', render: actions },
    ] : [
      { key: 'name', label: 'Hồ sơ', render: row => <a className="portal-record-link" href={`#/app/${entity}/${row.id}`}><Person row={row} /></a> }, { key: 'email', label: 'Email' },
      { key: 'type', label: entity === 'admins' ? 'Vai trò' : 'Lớp', render: row => entity === 'admins' ? <Badge>{row.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Giảng viên'}</Badge> : row.className || '—' },
      { key: 'photo', label: 'Ảnh', render: row => <Badge tone={row.photo ? 'success' : 'warning'}>{row.photo ? 'Có ảnh' : 'Chưa có ảnh'}</Badge> }, { key: 'actions', label: 'Thao tác', render: actions },
    ]} />
    <div className="ui-list-footer"><span>{rows.length} / {list.length} {names[entity]}</span><Button variant="quiet" icon={Download} onClick={() => download(csvText(['id', 'name', 'email'], rows.map(r => [r.id, r.name, r.email || ''])), `${entity}.csv`)}>Xuất danh sách đang lọc</Button></div>
    {edit !== undefined && <EntityForm entity={entity} row={edit} onClose={() => setEdit(undefined)} />}
    {importing && <ImportDialog entity={entity} onClose={() => setImporting(false)} />}
    {remove && <Confirm title={`Xóa ${remove.name}?`} description={entity === 'students' ? 'Xóa hồ sơ khỏi toàn hệ thống, đăng ký môn và lịch sử điểm danh liên quan. Muốn chỉ bỏ khỏi môn, mở chi tiết môn học.' : entity === 'courses' ? `Xóa môn cùng ${db.enrollments.filter(e => e.courseId === remove.id).length} đăng ký, lịch sử và người nhận báo cáo của môn.` : 'Tài khoản sẽ không đăng nhập được nữa. Cần phân công lại môn trước khi xóa.'} requirePassword={entity === 'admins'} onClose={() => setRemove(null)} onConfirm={() => { write({ type: 'delete', entity, id: remove.id }); setFlash({ tone: 'success', text: 'Đã xóa khỏi dữ liệu demo.' }) }} />}
  </>
}

export function CourseDetail({ id }) {
  const { db, actor, write } = usePortal()
  const course = db.courses.find(c => c.id === id)
  const [attendanceFilter, setAttendanceFilter] = useState('all')
  const [tab, setTab] = useState('students'), [query, setQuery] = useState(''), [edit, setEdit] = useState(false), [add, setAdd] = useState(false), [enroll, setEnroll] = useState(false), [importing, setImporting] = useState(false), [remove, setRemove] = useState(null)
  if (!canCourse(actor, course)) return <EmptyState title="Không tìm thấy môn hoặc không có quyền" action={<Back to="courses" />} />
  const students = db.students.filter(s => db.enrollments.some(e => e.courseId === id && e.studentId === s.id))
  const filtered = students.filter(s => {
    const checked = db.attendance.some(a => a.courseId === id && a.studentId === s.id && a.date === today())
    return fold(s.name + s.id).includes(fold(query)) && (attendanceFilter === 'all' || (attendanceFilter === 'done' ? checked : !checked))
  })
  return <><Back to="courses">Danh sách môn học</Back><PageHeader eyebrow={course.id} title={course.name} description={`${course.semester} · ${course.room || 'Chưa có phòng'} · ${db.admins.find(a => a.id === course.instructorId)?.name || 'Chưa phân công giảng viên'}`} actions={<><Button variant="secondary" icon={Edit2} onClick={() => setEdit(true)}>Sửa môn</Button><Button onClick={() => go(`attendance?course=${id}`)}>Bắt đầu điểm danh</Button></>} />
    <div className="portal-tabs" role="tablist" aria-label="Chi tiết môn">{[['students', `Sinh viên (${students.length})`], ['schedule', 'Lịch học'], ['reports', 'Báo cáo & email']].map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</button>)}</div>
    {tab === 'students' && <><div className="ui-toolbar"><SearchField value={query} onChange={e => setQuery(e.target.value)} /><Field as="select" label="Lọc điểm danh hôm nay" value={attendanceFilter} onChange={e => setAttendanceFilter(e.target.value)} options={[{ value: 'all', label: 'Tất cả sinh viên' }, { value: 'done', label: 'Đã điểm danh hôm nay' }, { value: 'pending', label: 'Chưa điểm danh hôm nay' }]} /><Button variant="secondary" onClick={() => setEnroll(true)}>Gán sinh viên có sẵn</Button><Button icon={Plus} onClick={() => setAdd(true)}>Tạo sinh viên</Button><IconButton label="Nhập CSV sinh viên vào môn" icon={FileUp} onClick={() => setImporting(true)} /></div><DataTable caption="Sinh viên trong môn" rows={filtered} columns={[{ key: 'name', label: 'Sinh viên', render: s => <Person row={s} /> }, { key: 'className', label: 'Lớp' }, { key: 'photo', label: 'Ảnh', render: s => <Badge tone={s.photo ? 'success' : 'warning'}>{s.photo ? 'Có ảnh' : 'Cần bổ sung ảnh'}</Badge> }, { key: 'actions', label: 'Thao tác', render: s => <div className="ui-actions"><Button variant="quiet" onClick={() => go(`students/${s.id}`)}>Hồ sơ</Button><Button variant="quiet" onClick={() => setRemove(s)}>Bỏ khỏi môn</Button></div> }]} /></>}
    {tab === 'schedule' && <section className="portal-section"><h2>Thời gian học kỳ</h2><p>{dateLabel(course.startDate)} – {dateLabel(course.endDate)}</p><DataTable caption="Lịch học hằng tuần" rows={course.schedules} columns={[{ key: 'day', label: 'Ngày', render: s => dayLabel(s.day) }, { key: 'start', label: 'Bắt đầu' }, { key: 'end', label: 'Kết thúc' }]} /><p className="portal-muted">Ca học đã có điểm danh không thể xóa. Việc chỉnh giờ áp dụng cho lịch tương lai; trạng thái bản ghi đã lưu được giữ nguyên.</p></section>}
    {tab === 'reports' && <section className="portal-section"><h2>Theo dõi môn học</h2><p>Xem lịch sử, tổng hợp học kỳ hoặc chuẩn bị báo cáo gửi người nhận.</p><div className="ui-actions"><Button onClick={() => go(`reports?course=${id}`)}>Xem báo cáo</Button><Button variant="secondary" onClick={() => go(`email?course=${id}`)}>Người nhận & email</Button></div></section>}
    {edit && <EntityForm entity="courses" row={course} onClose={() => setEdit(false)} />}{add && <EntityForm entity="students" courseId={id} onClose={() => setAdd(false)} />}{importing && <ImportDialog entity="students" courseId={id} onClose={() => setImporting(false)} />}
    {enroll && <EnrollDialog courseId={id} onClose={() => setEnroll(false)} />}
    {remove && <Confirm title={`Bỏ ${remove.name} khỏi môn?`} description="Giữ hồ sơ và các môn khác. Lịch sử đã điểm danh vẫn còn trong báo cáo lịch sử; đây là cải thiện FE đề xuất cho backend." onClose={() => setRemove(null)} onConfirm={() => write({ type: 'unenroll', courseId: id, studentId: remove.id })} />}
  </>
}

export function PersonDetail({ entity, id, profile = false }) {
  const { db, actor } = usePortal(), [editing, setEditing] = useState(false)
  const row = db[entity].find(r => r.id === id)
  const allowed = profile || (entity === 'admins' ? isSuper(actor) : studentsFor(db, actor).some(s => s.id === id))
  if (!row || !allowed) return <EmptyState title="Không tìm thấy hồ sơ hoặc không có quyền" action={<Back to={entity} />} />
  const courses = coursesFor(db, actor).filter(c => entity === 'students' ? db.enrollments.some(e => e.courseId === c.id && e.studentId === id) : c.instructorId === id)
  return <>{!profile && <Back to={entity} />}<PageHeader eyebrow={profile ? 'TÀI KHOẢN CỦA BẠN' : row.id} title={row.name}  actions={<Button icon={Edit2} onClick={() => setEditing(true)}>Chỉnh sửa hồ sơ</Button>} />
    <div className="portal-profile"><div>{row.photo ? <img src={row.photo} alt={`Ảnh ${row.name}`} /> : <div className="portal-no-photo"><Users size={32} /><span>Chưa có ảnh khuôn mặt</span></div>}<p className="portal-muted">Ảnh chưa xác minh.</p></div><dl className="portal-details"><dt>Mã hồ sơ</dt><dd>{row.id}</dd><dt>Email</dt><dd>{row.email || '—'}</dd><dt>{entity === 'students' ? 'Lớp hành chính' : 'Mã giảng viên'}</dt><dd>{row.className || row.code || '—'}</dd><dt>Số điện thoại</dt><dd>{row.phone || '—'}</dd>{entity === 'admins' && <><dt>Ngày sinh</dt><dd>{row.dob ? dateLabel(row.dob) : '—'}</dd><dt>Giới tính</dt><dd>{row.gender || '—'}</dd><dt>Mô tả</dt><dd>{row.description || '—'}</dd></>}<dt>Ảnh khuôn mặt</dt><dd>{row.photo ? 'Đã lưu tại trình duyệt' : 'Chưa đăng ký'}</dd></dl></div>
    <section className="portal-section"><h2>{entity === 'students' ? 'Môn đã đăng ký' : 'Môn phụ trách'}</h2><DataTable caption="Môn liên quan hồ sơ" rows={courses} columns={[{ key: 'name', label: 'Môn học', render: c => <a className="portal-record-link" href={`#/app/courses/${c.id}`}>{c.name}</a> }, { key: 'semester', label: 'Học kỳ' }, { key: 'room', label: 'Phòng' }]} /></section>
    {editing && <EntityForm entity={entity} row={row} profile={profile} onClose={() => setEditing(false)} />}
  </>
}