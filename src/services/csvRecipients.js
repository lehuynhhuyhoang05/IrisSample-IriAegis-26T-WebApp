/**
 * Đọc file CSV người nhận. Hỗ trợ:
 * - dấu phân cách , ; hoặc tab (Excel tiếng Việt hay lưu bằng ;)
 * - có hoặc không có dòng tiêu đề; tên cột tiếng Việt hoặc tiếng Anh (Họ tên, Tên, Name, Email, Vai trò, Role)
 * - ô nằm trong ngoặc kép, BOM và CRLF
 * Chỉ cột Email là bắt buộc. Trả về [{ line, name, email, role }].
 */
const fold = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '')
const NAME = ['hoten', 'hovaten', 'ten', 'name', 'fullname', 'nguoinhan']
const EMAIL = ['email', 'mail', 'diachiemail', 'emailaddress']
const ROLE = ['vaitro', 'role', 'chucvu']

function detectDelimiter(line) {
  const count = ch => line.split(ch).length - 1
  return [',', ';', '\t'].reduce((best, ch) => (count(ch) > count(best) ? ch : best), ',')
}

function splitLine(line, delimiter) {
  const cells = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delimiter) { cells.push(cell.trim()); cell = '' }
    else cell += ch
  }
  cells.push(cell.trim())
  return cells
}

export function parseRecipientsCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter(item => item.raw.trim())
  if (!lines.length) return []

  const delimiter = detectDelimiter(lines[0].raw)
  const table = lines.map(item => ({ line: item.line, cells: splitLine(item.raw, delimiter) }))
  const headerCells = table[0].cells.map(fold)
  const looksLikeData = table[0].cells.some(cell => cell.includes('@'))
  const emailAt = headerCells.findIndex(cell => EMAIL.includes(cell))
  const hasHeader = !looksLikeData && (emailAt >= 0 || headerCells.some(cell => NAME.includes(cell) || ROLE.includes(cell)))

  const nameAt = hasHeader ? headerCells.findIndex(cell => NAME.includes(cell)) : -1
  const roleAt = hasHeader ? headerCells.findIndex(cell => ROLE.includes(cell)) : -1
  const body = hasHeader ? table.slice(1) : table

  return body.map(({ line, cells }) => {
    // Có cột Email trong tiêu đề thì dùng đúng vị trí; nếu không thì tìm ô chứa @
    const emailIndex = hasHeader && emailAt >= 0 ? emailAt : cells.findIndex(cell => cell.includes('@'))
    const email = emailIndex >= 0 ? cells[emailIndex] || '' : ''
    const others = cells.filter((_, i) => i !== emailIndex)
    const name = (nameAt >= 0 ? cells[nameAt] : others[0]) || ''
    const role = (roleAt >= 0 ? cells[roleAt] : hasHeader ? '' : others[1]) || ''
    return { line, name, email, role }
  })
}
