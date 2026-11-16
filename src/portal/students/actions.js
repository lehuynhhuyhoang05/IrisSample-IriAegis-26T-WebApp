// Các thao tác ghi gộp nhiều bước. Chỉ persist() một lần ở nơi gọi => không bị ghi dở.
import { command } from '../domain.js'

// Gán nhiều sinh viên có sẵn vào một môn. Lỗi ở bất kỳ người nào => ném lỗi, db gốc không đổi.
export function enrollMany(db, actorId, courseId, studentIds) {
  const ids = [...new Set(studentIds)]
  if (!ids.length) throw new Error('Chưa chọn sinh viên nào.')
  return ids.reduce((next, studentId) => command(next, actorId, { type: 'enroll', courseId, studentId }), db)
}
