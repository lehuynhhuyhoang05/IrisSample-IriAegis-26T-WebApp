// Local demo domain. This is NOT authentication, biometric verification or an API contract.
export const STORAGE_KEY = 'iriaegis.business-demo.v1'
export const DEMO_PASSWORD = 'Demo@123'
export const today = () => localDate(new Date())
export function localDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export const fold = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
export const uid = prefix => `${prefix}_${globalThis.crypto.randomUUID()}`
export const isSuper = actor => actor?.role === 'SUPER_ADMIN'
export const canCourse = (actor, course) => !!actor && !!course && (isSuper(actor) || course.instructorId === actor.id || course.createdBy === actor.id)
export const coursesFor = (db, actor) => db.courses.filter(course => canCourse(actor, course))
export const studentsFor = (db, actor) => isSuper(actor) ? db.students : db.students.filter(student => student.createdBy === actor.id || db.enrollments.some(e => e.studentId === student.id && canCourse(actor, db.courses.find(c => c.id === e.courseId))))
export const statusLabel = { ON_TIME: 'Đúng giờ', LATE: 'Muộn', ABSENT: 'Vắng', PENDING: 'Chưa điểm danh' }
export const statusTone = { ON_TIME: 'success', LATE: 'warning', ABSENT: 'danger', PENDING: 'neutral' }
export const dayLabel = day => ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][day]
export const dateLabel = date => date ? date.split('-').reverse().join('/') : '—'
export function seedData(empty = false) {
  const date = today(), year = new Date().getFullYear(), day = new Date().getDay()
  const base = { version: 1, admins: [], courses: [], students: [], enrollments: [], attendance: [], recipients: [], outbox: [], audit: [] }
  if (empty) return base
  base.admins = [
    { id: 'SADM_DEMO', name: 'Hoàng · Quản trị', email: 'super@demo.test', role: 'SUPER_ADMIN', password: DEMO_PASSWORD, code: 'SA01', phone: '', photo: '' },
    { id: 'ADM_LAN', name: 'Nguyễn Minh Lan', email: 'lan@demo.test', role: 'ADMIN', password: DEMO_PASSWORD, code: 'GV01', phone: '', photo: '' },
    { id: 'ADM_NAM', name: 'Trần Hoài Nam', email: 'nam@demo.test', role: 'ADMIN', password: DEMO_PASSWORD, code: 'GV02', phone: '', photo: '' },
  ]
  base.courses = [
    { id: 'WEB301', name: 'Phát triển ứng dụng Web', room: 'B.402', semester: 'Học kỳ 1', startDate: `${year}-01-01`, endDate: `${year}-12-31`, instructorId: 'ADM_LAN', createdBy: 'SADM_DEMO', schedules: [{ id: 'WEB_S1', day, start: '07:30', end: '11:30' }] },
    { id: 'CSDL201', name: 'Cơ sở dữ liệu', room: 'A.203', semester: 'Học kỳ 1', startDate: `${year}-01-01`, endDate: `${year}-12-31`, instructorId: 'ADM_NAM', createdBy: 'SADM_DEMO', schedules: [{ id: 'DB_S1', day, start: '13:00', end: '16:30' }] },
    { id: 'JAVA202', name: 'Lập trình Java', room: 'B.305', semester: 'Học kỳ 1', startDate: `${year}-01-01`, endDate: `${year}-12-31`, instructorId: '', createdBy: 'SADM_DEMO', schedules: [{ id: 'JAVA_S1', day: (day + 1) % 7, start: '07:30', end: '11:30' }] },
  ]
  base.students = ['Nguyễn An Bình', 'Lê Minh Châu', 'Trần Gia Hân', 'Phạm Quốc Huy', 'Võ Khánh Linh', 'Đặng Hoàng Long', 'Bùi Ngọc Mai', 'Ngô Thanh Phong'].map((name, index) => ({ id: `SV${String(index + 1).padStart(3, '0')}`, name, email: `sv${index + 1}@demo.test`, className: 'CNTT K24', password: '123456', photo: '', createdBy: 'SADM_DEMO' }))
  base.enrollments = base.students.flatMap((s, i) => [{ studentId: s.id, courseId: 'WEB301', since: `${year}-01-01` }, ...(i < 4 ? [{ studentId: s.id, courseId: 'CSDL201', since: `${year}-01-01` }] : [])])
  base.attendance = [0, 1, 2].map((i) => ({ id: `ATT_${i}`, studentId: base.students[i].id, courseId: 'WEB301', scheduleId: 'WEB_S1', date, time: i === 2 ? '07:46' : '07:25', status: i === 2 ? 'LATE' : 'ON_TIME', simulated: true }))
  base.recipients = [{ id: 'MAIL_1', courseId: 'WEB301', name: 'Phòng đào tạo (mẫu)', email: 'daotao@demo.test' }]
  return base
}
function requireThat(condition, message) { if (!condition) throw new Error(message) }
function nonempty(value, label) { requireThat(typeof value === 'string' && value.trim().length > 0 && value.length <= 200, `${label} không hợp lệ (tối đa 200 ký tự).`) }
function validId(value) { requireThat(/^[A-Z0-9_-]{2,30}$/.test(value || ''), 'Mã gồm 2–30 chữ in hoa, số, dấu gạch ngang hoặc gạch dưới.') }
function email(value) { requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || ''), 'Email không hợp lệ.') }
function password(value) { requireThat(typeof value === 'string' && value.length >= 6, 'Mật khẩu tài khoản cần ít nhất 6 ký tự.') }
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(`${value}T00:00:00`).getTime()) && localDate(new Date(`${value}T00:00:00`)) === value
const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '')
function photo(value) { requireThat(!value || (typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(value) && value.length < 400000), 'Ảnh không hợp lệ hoặc quá lớn. Hãy chọn ảnh khác.') }
function validateEntity(db, type, row, originalId) {
  validId(row.id); nonempty(row.name, 'Tên')
  for (const key of ['email', 'className', 'phone', 'code', 'room', 'semester', 'createdBy']) requireThat(row[key] === undefined || (typeof row[key] === 'string' && row[key].length <= 200), `Trường ${key} không hợp lệ.`)
  requireThat(!db[type].some(item => item.id === row.id && item.id !== originalId), 'Mã đã tồn tại.')
  if (type === 'admins') {
    email(row.email); password(row.password); photo(row.photo)
    requireThat(!row.dob || (validDate(row.dob) && row.dob <= today()), 'Ngày sinh không hợp lệ.')
    requireThat(!row.gender || ['Nam', 'Nữ', 'Khác'].includes(row.gender), 'Giới tính không hợp lệ.')
    requireThat(row.description === undefined || (typeof row.description === 'string' && row.description.length <= 2000), 'Mô tả tối đa 2000 ký tự.')
    requireThat(['ADMIN', 'SUPER_ADMIN'].includes(row.role), 'Vai trò không hợp lệ.')
    requireThat(!db.admins.some(a => a.id !== originalId && a.email.toLowerCase() === row.email.toLowerCase()), 'Email đã tồn tại.')
  }
  if (type === 'students') {
    if (row.email) email(row.email)
    requireThat(typeof row.password === 'string' && row.password.length >= 6, 'Mật khẩu điểm danh cần ít nhất 6 ký tự.')
    photo(row.photo)
  }
  if (type === 'courses') {
    requireThat(!row.instructorId || db.admins.some(a => a.id === row.instructorId), 'Giảng viên không tồn tại.')
    requireThat(validDate(row.startDate) && validDate(row.endDate) && row.startDate <= row.endDate, 'Ngày học kỳ không hợp lệ.')
    requireThat(Array.isArray(row.schedules) && row.schedules.length > 0 && row.schedules.length <= 14, 'Cần từ 1 đến 14 ca học.')
    const ids = new Set()
    row.schedules.forEach(s => {
      requireThat(s.id && !ids.has(s.id), 'Mã ca học bị trùng.'); ids.add(s.id)
      requireThat(Number.isInteger(s.day) && s.day >= 0 && s.day <= 6 && validTime(s.start) && validTime(s.end) && s.start < s.end, 'Ca học phải có thứ, giờ bắt đầu và kết thúc hợp lệ.')
      requireThat(!row.schedules.some(other => other.id !== s.id && other.day === s.day && other.start < s.end && s.start < other.end), 'Các ca học trong môn không được trùng giờ.')
    })
  }
}
export function scheduledOn(course, date) {
  if (!course || !validDate(date) || date < course.startDate || date > course.endDate) return []
  return course.schedules.filter(s => s.day === new Date(`${date}T12:00:00`).getDay())
}
// AttendanceManagementActivity.classifyCheckinStatus: start + 15 minutes inclusive.
export function classifyAttendance(time, start = '08:00') {
  const seconds = value => Number(value.slice(0, 2)) * 3600 + Number(value.slice(3, 5)) * 60 + Number(value.slice(6, 8) || 0)
  return seconds(time) > seconds(start) + 900 ? 'LATE' : 'ON_TIME'
}
export function roster(db, course, date, scheduleId, now = new Date()) {
  const schedule = scheduledOn(course, date).find(s => s.id === scheduleId)
  if (!schedule) return []
  return db.enrollments.filter(e => e.courseId === course.id && e.since <= date).map(e => {
    const student = db.students.find(s => s.id === e.studentId)
    const record = db.attendance.find(a => a.courseId === course.id && a.studentId === e.studentId && a.date === date && a.scheduleId === scheduleId)
    return { ...student, record, status: record ? classifyAttendance(record.time, schedule.start) : (new Date(`${date}T${schedule.end}:00`) <= now ? 'ABSENT' : 'PENDING') }
  })
}
export function semesterReport(db, course, from, to) {
  if (!course || !validDate(from) || !validDate(to) || from > to) return []
  // Match loadSemesterAggregateRecords: distinct recorded DAYS, not inferred lessons.
  const records = db.attendance.filter(a => a.courseId === course.id && a.date >= from && a.date <= to)
  const total = new Set(records.map(a => a.date)).size
  return db.enrollments.filter(e => e.courseId === course.id).map(e => {
    const counts = { ON_TIME: 0, LATE: 0 }
    for (const record of records.filter(a => a.studentId === e.studentId)) {
      const start = course.schedules.find(s => s.id === record.scheduleId)?.start
      counts[classifyAttendance(record.time, start)]++
    }
    return { ...db.students.find(s => s.id === e.studentId), ...counts, ABSENT: Math.max(0, total - counts.ON_TIME - counts.LATE), total, rate: total ? Math.round((counts.ON_TIME + counts.LATE) * 100 / total) : null }
  })
}
// All write paths pass here, including CSV, so a hidden button is not the only demo guard.
export function command(db, actorId, action) {
  const next = structuredClone(db)
  const actor = next.admins.find(a => a.id === actorId)
  if (action.type === 'bootstrap') {
    requireThat(!next.admins.length, 'Hệ thống đã có quản trị viên.')
    const row = { ...action.row, id: 'SADM_INITIAL', role: 'SUPER_ADMIN', photo: '', phone: '', code: 'SA01' }
    validateEntity(next, 'admins', row); next.admins.push(row); return next
  }
  requireThat(actor, 'Phiên làm việc đã hết. Hãy đăng nhập lại.')
  if (action.type === 'save') {
    const { entity, originalId } = action
    requireThat(['admins', 'courses', 'students'].includes(entity), 'Loại dữ liệu không hợp lệ.')
    const old = next[entity].find(row => row.id === originalId)
    requireThat(!originalId || old, 'Bản ghi không còn tồn tại.')
    const row = { ...action.row, id: old?.id || action.row.id }
    if (entity === 'admins') {
      requireThat(isSuper(actor) || old?.id === actor.id, 'Chỉ Super Admin quản lý tài khoản khác.')
      row.role = old?.role || 'ADMIN'
    }
    if (entity === 'courses') {
      requireThat(!old || canCourse(actor, old), 'Bạn không được sửa môn này.')
      row.createdBy = old?.createdBy || actor.id
      if (!isSuper(actor)) row.instructorId = old?.instructorId || actor.id
      // Keep historical schedule IDs; removing used schedules would orphan reports.
      requireThat(!old || !next.attendance.some(a => a.courseId === old.id && !row.schedules.some(s => s.id === a.scheduleId)), 'Ca học đã có lịch sử, không thể xóa khỏi môn.')
      if (old) for (const record of next.attendance.filter(a => a.courseId === old.id)) {
        const before = old.schedules.find(s => s.id === record.scheduleId), after = row.schedules.find(s => s.id === record.scheduleId)
        requireThat(before && after && before.day === after.day && before.start === after.start && before.end === after.end && record.date >= row.startDate && record.date <= row.endDate, 'Không đổi lịch đã có điểm danh. Cần backend lưu phiên bản lịch; hiện có thể thêm ca mới.')
      }
    }
    if (entity === 'students') {
      requireThat(!old || studentsFor(next, actor).some(s => s.id === old.id), 'Bạn không được sửa sinh viên này.')
      row.createdBy = old?.createdBy || actor.id
      // Đề xuất FE (chưa xác nhận với Android/API): email sinh viên không trùng, không phân biệt hoa thường.
      if (typeof row.email === 'string' && row.email.trim()) requireThat(!next.students.some(s => s.id !== old?.id && s.email?.trim().toLowerCase() === row.email.trim().toLowerCase()), 'Email sinh viên đã tồn tại.')
    }
    validateEntity(next, entity, row, old?.id)
    if (old) next[entity] = next[entity].map(item => item.id === old.id ? row : item)
    else next[entity].push(row)
  } else if (action.type === 'delete') {
    const { entity, id } = action
    requireThat(['admins', 'courses', 'students', 'recipients'].includes(entity), 'Loại dữ liệu không hợp lệ.')
    const row = next[entity].find(item => item.id === id)
    requireThat(row, 'Bản ghi không tồn tại.')
    if (entity === 'admins') {
      requireThat(isSuper(actor) && row.role !== 'SUPER_ADMIN' && row.id !== actor.id, 'Không thể xóa Super Admin hoặc chính mình.')
      requireThat(!next.courses.some(c => c.instructorId === id), 'Hãy phân công lại các môn trước khi xóa giảng viên.')
    } else if (entity === 'students') {
      requireThat(isSuper(actor), 'Chỉ Super Admin xóa hồ sơ sinh viên toàn hệ thống.')
      next.enrollments = next.enrollments.filter(e => e.studentId !== id)
      next.attendance = next.attendance.filter(e => e.studentId !== id)
    } else if (entity === 'courses') {
      requireThat(canCourse(actor, row), 'Bạn không được xóa môn này.')
      next.enrollments = next.enrollments.filter(e => e.courseId !== id)
      next.attendance = next.attendance.filter(e => e.courseId !== id)
      next.recipients = next.recipients.filter(e => e.courseId !== id)
    } else requireThat(canCourse(actor, next.courses.find(c => c.id === row.courseId)), 'Bạn không được sửa người nhận của môn này.')
    next[entity] = next[entity].filter(item => item.id !== id)
  } else if (action.type === 'enroll' || action.type === 'unenroll') {
    requireThat(canCourse(actor, next.courses.find(c => c.id === action.courseId)), 'Môn học ngoài phạm vi của bạn.')
    requireThat(next.students.some(s => s.id === action.studentId), 'Sinh viên không tồn tại.')
    const exists = next.enrollments.some(e => e.studentId === action.studentId && e.courseId === action.courseId)
    if (action.type === 'enroll') {
      requireThat(!exists, 'Sinh viên đã đăng ký môn.')
      next.enrollments.push({ courseId: action.courseId, studentId: action.studentId, since: today() })
    } else {
      next.enrollments = next.enrollments.filter(e => !(e.studentId === action.studentId && e.courseId === action.courseId))
      // Preserve attendance history when unenrolling (explicit frontend improvement).
    }
  } else if (action.type === 'attendance') {
    const course = next.courses.find(c => c.id === action.courseId)
    requireThat(canCourse(actor, course), 'Môn học ngoài phạm vi của bạn.')
    const schedule = scheduledOn(course, action.date).find(s => s.id === action.scheduleId)
    requireThat(schedule && action.date <= today() && validTime(action.time), 'Buổi học, ngày hoặc giờ điểm danh không hợp lệ.')
    requireThat(next.enrollments.some(e => e.courseId === action.courseId && e.studentId === action.studentId && e.since <= action.date), 'Sinh viên chưa đăng ký môn ở ngày đã chọn.')
    requireThat(action.simulated === true, 'Prototype chỉ nhận kết quả xác thực giả lập.')
    requireThat(!next.attendance.some(a => a.studentId === action.studentId && a.courseId === action.courseId && a.date === action.date && a.scheduleId === action.scheduleId), 'Sinh viên đã điểm danh buổi này; không tạo bản ghi trùng.')
    next.attendance.push({ id: uid('ATT'), studentId: action.studentId, courseId: action.courseId, scheduleId: action.scheduleId, date: action.date, time: action.time, status: classifyAttendance(action.time, schedule.start), simulated: true })
  } else if (action.type === 'recipient') {
    requireThat(canCourse(actor, next.courses.find(c => c.id === action.row.courseId)), 'Môn học ngoài phạm vi của bạn.')
    email(action.row.email); nonempty(action.row.name, 'Tên người nhận')
    requireThat(!next.recipients.some(r => r.courseId === action.row.courseId && r.email.toLowerCase() === action.row.email.toLowerCase() && r.id !== action.row.id), 'Email đã có trong môn.')
    const row = { ...action.row, id: action.row.id || uid('MAIL') }
    next.recipients = [...next.recipients.filter(r => r.id !== row.id), row]
  } else if (action.type === 'email') {
    requireThat(canCourse(actor, next.courses.find(c => c.id === action.courseId)), 'Môn học ngoài phạm vi của bạn.')
    const recipients = next.recipients.filter(r => r.courseId === action.courseId && action.recipientIds?.includes(r.id))
    requireThat(recipients.length > 0, 'Chưa chọn người nhận báo cáo.')
    requireThat(action.attachmentReady === true, 'Cần xuất CSV trước khi gửi báo cáo.')
    next.outbox.unshift({ id: uid('OUT'), courseId: action.courseId, at: new Date().toISOString(), subject: action.subject, recipientCount: recipients.length, simulated: true })
  } else throw new Error('Thao tác chưa được hỗ trợ.')
  next.audit = [{ id: uid('LOG'), at: new Date().toISOString(), actor: actor.name, action: action.type, entity: action.entity || '', target: action.id || action.row?.id || action.courseId || '' }, ...next.audit].slice(0, 100)
  return next
}

export function validateBackup(value) {
  requireThat(value?.format === 'iriaegis-web-demo' && value?.data?.version === 1, 'Không phải bản sao lưu Web demo phiên bản 1. Không hỗ trợ file SQLite Android.')
  const db = value.data
  for (const key of ['admins', 'courses', 'students', 'enrollments', 'attendance', 'recipients', 'outbox', 'audit']) requireThat(Array.isArray(db[key]) && db[key].length <= 10000, `Dữ liệu ${key} không hợp lệ.`)
  requireThat(db.admins.filter(a => a.role === 'SUPER_ADMIN').length === 1, 'Bản sao lưu phải có đúng một Super Admin.')
  for (const type of ['admins', 'courses', 'students']) {
    requireThat(new Set(db[type].map(r => r.id)).size === db[type].length, 'Bản sao lưu có mã bị trùng.')
    for (const row of db[type]) validateEntity(db, type, row, row.id)
  }
  for (const e of db.enrollments) requireThat(db.students.some(s => s.id === e.studentId) && db.courses.some(c => c.id === e.courseId) && validDate(e.since), 'Đăng ký môn có dữ liệu không hợp lệ.')
  requireThat(new Set(db.enrollments.map(e => `${e.studentId}/${e.courseId}`)).size === db.enrollments.length, 'Đăng ký môn bị trùng.')
  for (const a of db.attendance) requireThat(db.students.some(s => s.id === a.studentId) && scheduledOn(db.courses.find(c => c.id === a.courseId), a.date).some(s => s.id === a.scheduleId) && validTime(a.time) && ['ON_TIME', 'LATE'].includes(a.status) && a.simulated === true, 'Lịch sử điểm danh không hợp lệ.')
  requireThat(new Set(db.attendance.map(a => `${a.studentId}/${a.courseId}/${a.date}/${a.scheduleId}`)).size === db.attendance.length, 'Lịch sử có điểm danh trùng.')
  for (const r of db.recipients) { nonempty(r.id, 'Mã người nhận'); email(r.email); nonempty(r.name, 'Tên người nhận'); requireThat(db.courses.some(c => c.id === r.courseId), 'Người nhận tham chiếu môn không tồn tại.') }
  requireThat(new Set(db.recipients.map(r => `${r.courseId}/${r.email.toLowerCase()}`)).size === db.recipients.length, 'Người nhận trùng trong môn.')
  for (const row of db.outbox) {
    nonempty(row.id, 'Mã email'); nonempty(row.subject, 'Tiêu đề'); nonempty(row.courseId, 'Mã môn'); nonempty(row.at, 'Thời điểm')
    requireThat(!Number.isNaN(Date.parse(row.at)) && Number.isInteger(row.recipientCount) && row.recipientCount > 0 && row.simulated === true, 'Lịch sử gửi mail không hợp lệ.')
  }
  for (const row of db.audit) for (const key of ['id', 'at', 'actor', 'action', 'entity', 'target']) requireThat(typeof row[key] === 'string' && row[key].length <= 300, 'Nhật ký không hợp lệ.')
  return structuredClone(db)
}