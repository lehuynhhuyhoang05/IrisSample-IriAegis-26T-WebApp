/**
 * Dữ liệu mẫu dùng chung cho module Email & Backup (vantien68).
 * Không phải dữ liệu thật từ server / Android.
 */

export const MOCK_SUBJECTS = [
  { id: 'MH001', name: 'Lập trình Web', code: 'WEB301', semester: 'HK1-2026' },
  { id: 'MH002', name: 'Cơ sở dữ liệu', code: 'CSDL201', semester: 'HK1-2026' },
  { id: 'MH003', name: 'Trí tuệ nhân tạo', code: 'AI401', semester: 'HK1-2026' },
]

export const MOCK_REPORT_SUMMARIES = [
  {
    id: 'RP001',
    subjectId: 'MH001',
    subjectName: 'Lập trình Web',
    session: 'Buổi 05 – 12/11/2026',
    present: 28,
    late: 3,
    absent: 4,
    total: 35,
    generatedAt: '2026-11-12T09:15:00',
  },
  {
    id: 'RP002',
    subjectId: 'MH001',
    subjectName: 'Lập trình Web',
    session: 'Buổi 06 – 14/11/2026',
    present: 31,
    late: 1,
    absent: 3,
    total: 35,
    generatedAt: '2026-11-14T09:20:00',
  },
  {
    id: 'RP003',
    subjectId: 'MH002',
    subjectName: 'Cơ sở dữ liệu',
    session: 'Buổi 04 – 13/11/2026',
    present: 22,
    late: 2,
    absent: 5,
    total: 29,
    generatedAt: '2026-11-13T14:05:00',
  },
]

export const INITIAL_RECIPIENTS = [
  { id: 'rc1', subjectId: 'MH001', name: 'Nguyễn Văn A', email: 'nguyenvana@example.edu.vn', role: 'Giảng viên' },
  { id: 'rc2', subjectId: 'MH001', name: 'Trần Thị B', email: 'tranthib@example.edu.vn', role: 'Trợ giảng' },
  { id: 'rc3', subjectId: 'MH001', name: 'Phòng Đào tạo', email: 'daotao@example.edu.vn', role: 'Phòng ban' },
  { id: 'rc4', subjectId: 'MH002', name: 'Lê Văn C', email: 'levanc@example.edu.vn', role: 'Giảng viên' },
  { id: 'rc5', subjectId: 'MH003', name: 'Phạm Thị D', email: 'phamthid@example.edu.vn', role: 'Giảng viên' },
]

export const INITIAL_SEND_HISTORY = [
  {
    id: 'sh1',
    reportId: 'RP001',
    subjectName: 'Lập trình Web',
    session: 'Buổi 05 – 12/11/2026',
    recipients: ['nguyenvana@example.edu.vn', 'tranthib@example.edu.vn'],
    status: 'success',
    sentAt: '2026-11-12T10:02:00',
    note: 'Gửi giả lập thành công (demo)',
  },
  {
    id: 'sh2',
    reportId: 'RP003',
    subjectName: 'Cơ sở dữ liệu',
    session: 'Buổi 04 – 13/11/2026',
    recipients: ['levanc@example.edu.vn'],
    status: 'failed',
    sentAt: '2026-11-13T15:30:00',
    note: 'Lỗi giả lập – không kết nối server thật',
  },
]

export function createId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function delay(ms = 800) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
