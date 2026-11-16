/**
 * Service giả lập Sao lưu / Khôi phục (Web demo).
 * Backup chỉ tồn tại trong bộ nhớ phiên hoặc localStorage.
 * Không tương thích mặc định với file backup Android.
 */

import { createId, delay } from './mockData.js'

const STORAGE_KEY = 'iriaegis_web_demo_backups_v1'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore quota / private mode
  }
}

let backups = loadFromStorage()

export function listBackups() {
  return [...backups].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Tạo backup demo từ snapshot dữ liệu hiện tại (mock).
 * @param {{ label?: string, includeRecipients?: boolean, includeHistory?: boolean }} opts
 */
export async function createBackup(opts = {}) {
  await delay(900)
  const snapshot = {
    version: 'web-demo-1.0',
    platform: 'IriAegis-Web-Demo',
    note: 'Đây là file backup DEMO của bản Web. Không phải backup Android. Không tự động khôi phục được lên app Android gốc.',
    createdAt: new Date().toISOString(),
    meta: {
      label: opts.label?.trim() || `Backup demo ${new Date().toLocaleString('vi-VN')}`,
      subjectsCount: 3,
      recipientsCount: opts.includeRecipients !== false ? 5 : 0,
      historyCount: opts.includeHistory !== false ? 2 : 0,
    },
    // Dữ liệu giả lập – không chứa thông tin cá nhân thật
    data: {
      subjects: [
        { id: 'MH001', name: 'Lập trình Web' },
        { id: 'MH002', name: 'Cơ sở dữ liệu' },
      ],
      note: 'Nội dung chi tiết sẽ được điền khi có mô hình dữ liệu thống nhất với các module khác.',
    },
  }

  const record = {
    id: createId('bk'),
    label: snapshot.meta.label,
    createdAt: snapshot.createdAt,
    sizeEstimate: JSON.stringify(snapshot).length,
    version: snapshot.version,
    platform: snapshot.platform,
    snapshot,
  }
  backups = [record, ...backups]
  saveToStorage(backups)
  return record
}

export function getBackup(id) {
  return backups.find(b => b.id === id) || null
}

export function deleteBackup(id) {
  backups = backups.filter(b => b.id !== id)
  saveToStorage(backups)
}

export function downloadBackupFile(backup) {
  const blob = new Blob([JSON.stringify(backup.snapshot, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `iriaegis-web-demo-backup-${backup.id}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

/**
 * Kiểm tra file khôi phục (chỉ validate cấu trúc demo).
 * @returns {{ ok: boolean, errors: string[], preview?: object }}
 */
export async function validateRestoreFile(file) {
  await delay(600)
  if (!file) return { ok: false, errors: ['Chưa chọn file'] }
  if (!file.name.toLowerCase().endsWith('.json')) {
    return { ok: false, errors: ['Chỉ hỗ trợ file .json trong bản demo Web'] }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, errors: ['File quá lớn (> 2MB) – bản demo giới hạn kích thước'] }
  }

  let text
  try {
    text = await file.text()
  } catch {
    return { ok: false, errors: ['Không đọc được nội dung file'] }
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['File không phải JSON hợp lệ'] }
  }

  const errors = []
  if (!data.version) errors.push('Thiếu trường version')
  if (!data.platform) errors.push('Thiếu trường platform')
  if (data.platform && !String(data.platform).includes('Web')) {
    errors.push(
      `Platform “${data.platform}” có vẻ không phải backup Web demo. Backup Android gốc chưa được hỗ trợ khôi phục trên Web.`,
    )
  }
  if (!data.createdAt) errors.push('Thiếu createdAt')

  return {
    ok: errors.length === 0,
    errors,
    preview: {
      version: data.version,
      platform: data.platform,
      createdAt: data.createdAt,
      label: data.meta?.label || '(không có nhãn)',
      note: data.note || '',
    },
  }
}

/**
 * Áp dụng khôi phục giả lập – chỉ ghi nhận trong phiên, không ghi đè dữ liệu server.
 */
export async function applyRestore(preview) {
  await delay(1100)
  return {
    success: true,
    message: `Đã mô phỏng khôi phục “${preview.label || preview.version}”. Dữ liệu chỉ áp dụng trong phiên demo, không đồng bộ server.`,
  }
}

export function clearAllBackups() {
  backups = []
  saveToStorage(backups)
}
