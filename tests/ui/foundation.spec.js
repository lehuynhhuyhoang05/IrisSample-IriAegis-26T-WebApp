/* global document, window */
import { test, expect } from '@playwright/test'

test('tìm kiếm không dấu, lọc và danh sách rỗng', async ({ page }) => {
  await page.goto('/#/ui-kit')
  await expect(page.getByRole('heading', { name: 'Sinh viên', exact: true })).toBeVisible()
  await page.getByLabel('Tìm tên hoặc mã sinh viên').fill('nguyen minh anh')
  await expect(page.getByRole('cell', { name: /^Nguyễn Minh Anh/ })).toBeVisible()
  await expect(page.getByRole('cell', { name: /^Trần Hoàng Nam/ })).toHaveCount(0)
  await page.getByLabel('Ảnh khuôn mặt', { exact: true }).selectOption('missing')
  await expect(page.getByRole('heading', { name: 'Không tìm thấy sinh viên' })).toBeVisible()
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click()
  await expect(page.getByRole('cell', { name: /^Trần Hoàng Nam/ })).toBeVisible()
})

test('form báo lỗi, lưu, sửa và xác nhận xóa dữ liệu mẫu', async ({ page }) => {
  await page.goto('/#/ui-kit')
  await page.getByRole('button', { name: 'Thêm sinh viên', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await page.getByRole('button', { name: 'Lưu hồ sơ mẫu' }).click()
  await expect(dialog.getByText('Nhập họ tên từ 2 ký tự.')).toBeVisible()
  await dialog.getByLabel('Mã sinh viên', { exact: false }).fill('SV001')
  await page.getByLabel('Họ và tên', { exact: false }).fill('Sinh Viên Mẫu')
  await page.getByRole('button', { name: 'Lưu hồ sơ mẫu' }).click()
  await expect(dialog.getByText('Mã sinh viên này đã có trong dữ liệu mẫu.')).toBeVisible()
  await dialog.getByLabel('Mã sinh viên', { exact: false }).fill('SV099')
  await page.getByRole('button', { name: 'Lưu hồ sơ mẫu' }).click()
  await expect(page.getByRole('cell', { name: /^Sinh Viên Mẫu/ })).toBeVisible()
  await page.getByRole('button', { name: 'Sửa Sinh Viên Mẫu', exact: true }).click()
  await page.getByLabel('Họ và tên', { exact: false }).fill('Sinh Viên Đã Sửa')
  await page.getByRole('button', { name: 'Lưu hồ sơ mẫu' }).click()
  await page.getByRole('button', { name: 'Xóa Sinh Viên Đã Sửa', exact: true }).click()
  await page.getByRole('button', { name: 'Giữ lại' }).click()
  await expect(page.getByRole('cell', { name: /^Sinh Viên Đã Sửa/ })).toBeVisible()
  await page.getByRole('button', { name: 'Xóa Sinh Viên Đã Sửa', exact: true }).click()
  await page.getByRole('button', { name: 'Xóa hồ sơ mẫu', exact: true }).click()
  await expect(page.getByRole('cell', { name: /^Sinh Viên Đã Sửa/ })).toHaveCount(0)
})

test('dialog giữ focus, Escape đóng và trả focus', async ({ page }) => {
  await page.goto('/#/ui-kit')
  const trigger = page.getByRole('button', { name: 'Thêm sinh viên', exact: true })
  await trigger.click()
  await expect(page.getByRole('dialog').getByLabel('Mã sinh viên', { exact: false })).toBeFocused()
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement.closest('dialog[open]'))).toBe(true)
  }
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Shift+Tab')
    expect(await page.evaluate(() => !!document.activeElement.closest('dialog[open]'))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('các trang mẫu không tràn ngang và không có lỗi runtime', async ({ page }, testInfo) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const path of ['', '/components', '/foundation', '/guide']) {
    await page.goto('/#/ui-kit' + path)
    await expect(page.locator('.aegis-ui h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`page-${path.slice(1) || 'example'}.png`), fullPage: true })
  }
  expect(errors).toEqual([])
})

test('xuất CSV và trở lại camera gốc', async ({ page }) => {
  await page.goto('/#/ui-kit')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Xuất CSV' }).click()
  expect((await downloadPromise).suggestedFilename()).toBe('sinh-vien-mau.csv')
  await page.getByRole('link', { name: 'Mở prototype camera' }).click()
  await expect(page.getByRole('heading', { name: 'Chụp ảnh khuôn mặt', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Bật camera', exact: true })).toBeVisible()
  await expect(page.locator('.aegis-ui')).toHaveCount(0)
})
