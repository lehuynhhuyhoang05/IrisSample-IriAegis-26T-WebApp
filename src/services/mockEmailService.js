/**
 * Service giả lập cho Email báo cáo.
 * Không gọi API thật. Mọi trạng thái success/fail đều là mock.
 */

import {
  MOCK_SUBJECTS,
  MOCK_REPORT_SUMMARIES,
  INITIAL_RECIPIENTS,
  INITIAL_SEND_HISTORY,
  createId,
  delay,
} from './mockData.js'

let recipients = [...INITIAL_RECIPIENTS]
let sendHistory = [...INITIAL_SEND_HISTORY]

export function getSubjects() {
  return [...MOCK_SUBJECTS]
}

export function getReportSummaries(subjectId = null) {
  const list = [...MOCK_REPORT_SUMMARIES]
  if (subjectId) return list.filter(r => r.subjectId === subjectId)
  return list
}

export function getRecipients(subjectId = null) {
  if (subjectId) return recipients.filter(r => r.subjectId === subjectId)
  return [...recipients]
}

export function addRecipient(data) {
  const record = {
    id: createId('rc'),
    subjectId: data.subjectId,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role || 'Khác',
  }
  recipients = [...recipients, record]
  return record
}

export function updateRecipient(id, data) {
  recipients = recipients.map(r =>
    r.id === id
      ? { ...r, name: data.name.trim(), email: data.email.trim().toLowerCase(), role: data.role || r.role }
      : r,
  )
  return recipients.find(r => r.id === id)
}

export function removeRecipient(id) {
  recipients = recipients.filter(r => r.id !== id)
}

export function importRecipientsFromCsv(subjectId, rows) {
  const added = []
  const errors = []
  rows.forEach((row, index) => {
    const line = row.line ?? index + 1
    const email = (row.email || '').trim().toLowerCase()
    const name = (row.name || '').trim() || 'Người nhận'
    const role = (row.role || '').trim() || 'Khác'
    if (!email) {
      errors.push(`Dòng ${line}: thiếu email`)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Dòng ${line}: email không hợp lệ (${email})`)
      return
    }
    if (recipients.some(r => r.subjectId === subjectId && r.email === email)) {
      errors.push(`Dòng ${line}: email đã tồn tại trong môn này`)
      return
    }
    added.push(addRecipient({ subjectId, name, email, role }))
  })
  return { added, errors }
}

export function getSendHistory() {
  return [...sendHistory].sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
}

/**
 * Gửi email giả lập.
 * @param {{ reportId: string, recipientIds: string[], forceFail?: boolean }} opts
 */
export async function sendReportEmail(opts) {
  await delay(1200 + Math.random() * 800)
  const report = MOCK_REPORT_SUMMARIES.find(r => r.id === opts.reportId)
  if (!report) throw new Error('Không tìm thấy báo cáo mẫu')

  const selected = recipients.filter(r => opts.recipientIds.includes(r.id))
  if (!selected.length) throw new Error('Chưa chọn người nhận')

  const fail = opts.forceFail === true || (opts.forceFail !== false && Math.random() < 0.15)
  const entry = {
    id: createId('sh'),
    reportId: report.id,
    subjectName: report.subjectName,
    session: report.session,
    recipients: selected.map(r => r.email),
    status: fail ? 'failed' : 'success',
    sentAt: new Date().toISOString(),
    note: fail
      ? 'Gửi thất bại (giả lập) – chưa kết nối server email thật'
      : 'Đã ghi nhận gửi thành công trong phiên demo (không gửi email thật)',
  }
  sendHistory = [entry, ...sendHistory]
  return entry
}

export function buildEmailPreview(report, selectedRecipients) {
  const to = selectedRecipients.map(r => `${r.name} <${r.email}>`).join('; ')
  const subject = `[IriAegis Demo] Báo cáo điểm danh – ${report.subjectName} – ${report.session}`
  const body = [
    `Kính gửi Quý Thầy/Cô và các đơn vị liên quan,`,
    ``,
    `Hệ thống IriAegis (bản Web demo) xin gửi báo cáo điểm danh:`,
    ``,
    `• Môn học: ${report.subjectName}`,
    `• Buổi học: ${report.session}`,
    `• Có mặt: ${report.present}`,
    `• Đi muộn: ${report.late}`,
    `• Vắng: ${report.absent}`,
    `• Tổng sĩ số: ${report.total}`,
    ``,
    `File đính kèm: bao-cao-diem-danh-${report.id}.csv (dữ liệu mẫu)`,
    ``,
    `---`,
    `Đây là email giả lập từ Web demo. Không có email thật nào được gửi đi.`,
    `Khi tích hợp Nhóm 1, nội dung sẽ lấy từ API báo cáo thực tế.`,
  ].join('\n')

  return { to, subject, body, attachmentName: `bao-cao-diem-danh-${report.id}.csv` }
}

export function resetEmailMockData() {
  recipients = [...INITIAL_RECIPIENTS]
  sendHistory = [...INITIAL_SEND_HISTORY]
}
