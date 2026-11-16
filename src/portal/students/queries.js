// Hàm thuần (không React) cho module Sinh viên: dễ test bằng `node --test`.
import { fold, studentsFor } from '../domain.js'

export const PAGE_SIZE = 25

const givenName = name => String(name || '').trim().split(/\s+/).at(-1) || ''

// Số môn mỗi sinh viên đang đăng ký: Map<studentId, number>
export function enrollmentCounts(db) {
  const counts = new Map()
  for (const e of db.enrollments) counts.set(e.studentId, (counts.get(e.studentId) || 0) + 1)
  return counts
}

export function classOptions(students) {
  return [...new Set(students.map(s => s.className?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'))
}

// filters: { query, photo: 'all'|'photo'|'no-photo', className, courseId, enrollment: 'all'|'none' }
export function filterStudents(db, actor, { query = '', photo = 'all', className = '', courseId = '', enrollment = 'all' } = {}) {
  const needle = fold(query.trim())
  const counts = enrollmentCounts(db)
  return studentsFor(db, actor).filter(s => {
    if (needle && !fold(`${s.name} ${s.id} ${s.email || ''} ${s.className || ''}`).includes(needle)) return false
    if (photo === 'photo' && !s.photo) return false
    if (photo === 'no-photo' && s.photo) return false
    if (className && (s.className || '') !== className) return false
    if (courseId && !db.enrollments.some(e => e.studentId === s.id && e.courseId === courseId)) return false
    if (enrollment === 'none' && counts.get(s.id)) return false
    return true
  })
}

// Người Việt sắp theo TÊN (từ cuối), sau đó mới đến họ tên đầy đủ.
export function sortStudents(rows, key = 'name') {
  const byName = (a, b) => givenName(a.name).localeCompare(givenName(b.name), 'vi') || a.name.localeCompare(b.name, 'vi')
  return [...rows].sort(key === 'id' ? (a, b) => a.id.localeCompare(b.id) : byName)
}

export function paginate(rows, page = 1, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(Math.max(1, page), pages)
  return { items: rows.slice((current - 1) * size, current * size), page: current, pages, total: rows.length }
}
