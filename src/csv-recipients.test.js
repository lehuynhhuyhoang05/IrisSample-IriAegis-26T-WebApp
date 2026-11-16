import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRecipientsCsv } from './services/csvRecipients.js'
import { importRecipientsFromCsv, resetEmailMockData } from './services/mockEmailService.js'

const emails = rows => rows.map(row => row.email)

test('đúng mẫu: Họ tên,Email,Vai trò', () => {
  const rows = parseRecipientsCsv('Họ tên,Email,Vai trò\nCô Lan,lan@school.edu.vn,Giảng viên\n')
  assert.deepEqual(rows, [{ line: 2, name: 'Cô Lan', email: 'lan@school.edu.vn', role: 'Giảng viên' }])
})

test('tiêu đề Email,Tên (cột "Tên") và cột đảo thứ tự', () => {
  assert.deepEqual(parseRecipientsCsv('Email,Tên\nlan@school.edu.vn,Cô Lan\n').map(row => row.name), ['Cô Lan'])
  assert.deepEqual(parseRecipientsCsv('Vai trò;Email;Họ tên\nTrợ giảng;an@school.edu.vn;An\n')[0], { line: 2, name: 'An', email: 'an@school.edu.vn', role: 'Trợ giảng' })
})

test('dấu chấm phẩy và tab', () => {
  assert.deepEqual(emails(parseRecipientsCsv('email;tên\nlan@school.edu.vn;Cô Lan\n')), ['lan@school.edu.vn'])
  assert.deepEqual(emails(parseRecipientsCsv('email\ttên\nlan@school.edu.vn\tCô Lan\n')), ['lan@school.edu.vn'])
})

test('không có dòng tiêu đề: tìm ô chứa @ làm email, ô còn lại là tên', () => {
  const rows = parseRecipientsCsv('Cô Lan,lan@school.edu.vn\nbinh@school.edu.vn,Thầy Bình\n')
  assert.deepEqual(rows.map(row => [row.name, row.email]), [['Cô Lan', 'lan@school.edu.vn'], ['Thầy Bình', 'binh@school.edu.vn']])
})

test('chỉ có cột Email; ô trong ngoặc kép chứa dấu phẩy; BOM và CRLF', () => {
  assert.deepEqual(emails(parseRecipientsCsv('Email\r\nlan@school.edu.vn\r\nbinh@school.edu.vn\r\n')), ['lan@school.edu.vn', 'binh@school.edu.vn'])
  assert.equal(parseRecipientsCsv('Họ tên,Email\n"Nguyễn, Văn An",an@school.edu.vn\n')[0].name, 'Nguyễn, Văn An')
  assert.equal(parseRecipientsCsv('\uFEFFHọ tên,Email\r\nAn,an@school.edu.vn\r\n')[0].email, 'an@school.edu.vn')
  assert.deepEqual(parseRecipientsCsv(''), [])
})

test('nhập vào môn: họ tên trống thì dùng "Người nhận"; báo đúng số dòng của file; bỏ email sai và trùng', () => {
  resetEmailMockData()
  const csv = 'Email,Tên\nmoi1@school.edu.vn,Cô Mai\nsai-email,Lỗi\nmoi1@school.edu.vn,Trùng\nmoi2@school.edu.vn,\n'
  const { added, errors } = importRecipientsFromCsv('MH001', parseRecipientsCsv(csv))
  assert.deepEqual(added.map(item => item.name), ['Cô Mai', 'Người nhận'])
  assert.deepEqual(errors, ['Dòng 3: email không hợp lệ (sai-email)', 'Dòng 4: email đã tồn tại trong môn này'])
})
