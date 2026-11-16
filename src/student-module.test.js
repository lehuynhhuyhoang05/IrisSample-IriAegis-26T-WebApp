import test from 'node:test'
import assert from 'node:assert/strict'
import { command, seedData } from './portal/domain.js'
import { classOptions, filterStudents, paginate, sortStudents } from './portal/students/queries.js'
import { enrollMany } from './portal/students/actions.js'

const SUPER = 'SADM_DEMO'
const actorOf = (db, id) => db.admins.find(a => a.id === id)
const addStudent = (db, row) => command(db, SUPER, { type: 'save', entity: 'students', row: { name: 'Mới', email: '', className: 'K24', password: '123456', photo: '', ...row } })

test('lọc sinh viên: không dấu, theo môn, theo ảnh, theo chưa đăng ký', () => {
  let db = seedData()
  assert.deepEqual(filterStudents(db, actorOf(db, SUPER), { query: 'binh' }).map(s => s.id), ['SV001'])
  assert.equal(filterStudents(db, actorOf(db, SUPER), { courseId: 'CSDL201' }).length, 4)
  assert.equal(filterStudents(db, actorOf(db, SUPER), { photo: 'photo' }).length, 0)
  db = addStudent(db, { id: 'SV100' })
  assert.deepEqual(filterStudents(db, actorOf(db, SUPER), { enrollment: 'none' }).map(s => s.id), ['SV100'])
})

test('giảng viên chỉ thấy sinh viên thuộc môn của mình', () => {
  const db = seedData()
  const nam = filterStudents(db, actorOf(db, 'ADM_NAM'), {})
  assert.deepEqual(nam.map(s => s.id), ['SV001', 'SV002', 'SV003', 'SV004'])
})

test('sắp theo TÊN theo thói quen tiếng Việt và phân trang kẹp trang hợp lệ', () => {
  const db = seedData()
  assert.deepEqual(sortStudents(db.students).slice(0, 3).map(s => s.name.split(' ').at(-1)), ['Bình', 'Châu', 'Hân'])
  const p = paginate(db.students, 99, 3)
  assert.deepEqual([p.page, p.pages, p.items.length, p.total], [3, 3, 2, 8])
  assert.equal(paginate([], 1).pages, 1)
  assert.deepEqual(classOptions([{ className: 'B' }, { className: 'A' }, { className: 'A' }, {}]), ['A', 'B'])
})

test('gán nhiều sinh viên vào môn: đủ thì ghi, lỗi một người thì không ghi người nào', () => {
  let db = seedData()
  db = addStudent(addStudent(db, { id: 'SV100' }), { id: 'SV101' })
  const ok = enrollMany(db, SUPER, 'JAVA202', ['SV100', 'SV101', 'SV100'])
  assert.equal(ok.enrollments.filter(e => e.courseId === 'JAVA202').length, 2)
  assert.throws(() => enrollMany(db, SUPER, 'WEB301', ['SV100', 'SV001']), /đã đăng ký/)
  assert.equal(db.enrollments.some(e => e.studentId === 'SV100'), false, 'db gốc không bị đổi')
  assert.throws(() => enrollMany(db, SUPER, 'WEB301', []), /Chưa chọn/)
})

test('email sinh viên không được trùng (không phân biệt hoa thường), sửa chính mình thì được', () => {
  const db = seedData()
  assert.throws(() => addStudent(db, { id: 'SV200', email: 'SV1@demo.test' }), /Email sinh viên đã tồn tại/)
  const own = command(db, SUPER, { type: 'save', entity: 'students', originalId: 'SV001', row: { ...db.students[0], name: 'Đổi tên' } })
  assert.equal(own.students[0].name, 'Đổi tên')
  assert.ok(addStudent(db, { id: 'SV201', email: '' }), 'email rỗng không bị coi là trùng')
})
