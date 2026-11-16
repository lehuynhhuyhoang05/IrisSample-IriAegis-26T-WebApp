/* global navigator, DOMException, document */
import { test, expect } from '@playwright/test'

// Chrome cấp camera giả (khung hình test) để chạy không cần webcam thật.
test.use({ permissions: ['camera'], launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } })

const page$ = async page => { await page.goto('/#/ui-kit/camera'); return page.getByRole('region', { name: 'Chụp ảnh khuôn mặt' }) }
const scenario = (page, label) => page.getByLabel('Kịch bản liveness').selectOption({ label })

test('giả lập đạt: bật, chụp, nhãn giả lập, xác nhận gọi onCapture', async ({ page }, info) => {
  const camera = await page$(page)
  await expect(camera.getByText('GIẢ LẬP', { exact: true })).toBeVisible()
  await camera.getByRole('button', { name: 'Bật camera' }).click()
  await expect(camera.getByRole('status')).toHaveText(/Đặt khuôn mặt vào khung bầu dục/)
  await expect(camera.locator('.face-camera__oval')).toBeVisible()
  await page.screenshot({ path: info.outputPath('camera-live.png') })
  await camera.getByRole('button', { name: 'Chụp ảnh' }).click()
  await expect(camera.getByRole('img', { name: 'Ảnh khuôn mặt vừa chụp' })).toBeVisible()
  await expect(camera.getByRole('status')).toHaveText(/Đạt liveness \(giả lập\)/)
  expect(await page.evaluate(() => document.querySelector('.face-camera video').srcObject)).toBeNull()
  await page.screenshot({ path: info.outputPath('camera-passed.png') })
  await camera.getByRole('button', { name: 'Sử dụng ảnh này' }).click()
  await expect(page.getByText(/onCapture: \d+×\d+, \d+ KB, liveness pass \(giả lập\)/)).toBeVisible()
})

test('giả lập không đạt: chặn xác nhận, chụp lại gọi onRetake và mở lại camera', async ({ page }, info) => {
  const camera = await page$(page)
  await scenario(page, 'Giả lập: không đạt')
  await camera.getByRole('button', { name: 'Bật camera' }).click()
  await camera.getByRole('button', { name: 'Chụp ảnh' }).click()
  await expect(camera.getByText('Không đạt liveness', { exact: true }).first()).toBeVisible()
  await expect(camera.getByRole('button', { name: 'Sử dụng ảnh này' })).toBeDisabled()
  await page.screenshot({ path: info.outputPath('camera-failed.png') })
  await camera.getByRole('button', { name: 'Chụp lại' }).click()
  await expect(page.getByText(/onRetake/)).toBeVisible()
  await expect(camera.getByRole('button', { name: 'Chụp ảnh' })).toBeVisible()
})

test('giả lập lỗi kết nối: hiện thử kiểm tra lại; hủy dừng camera và gọi onCancel', async ({ page }) => {
  const camera = await page$(page)
  await scenario(page, 'Giả lập: lỗi kết nối')
  await camera.getByRole('button', { name: 'Bật camera' }).click()
  await camera.getByRole('button', { name: 'Chụp ảnh' }).click()
  await expect(camera.getByRole('button', { name: 'Thử kiểm tra lại' })).toBeVisible()
  await camera.getByRole('button', { name: 'Hủy' }).click()
  await expect(page.getByText(/onCancel/)).toBeVisible()
  await expect(camera.getByRole('button', { name: 'Bật camera' })).toBeVisible()
})

test('chế độ stream: kiểm tra khi camera còn mở rồi mới chụp', async ({ page }) => {
  const camera = await page$(page)
  await scenario(page, 'Giả lập: kiểm tra trên stream (camera còn mở)')
  await camera.getByRole('button', { name: 'Bật camera' }).click()
  await camera.getByRole('button', { name: 'Chụp ảnh' }).click()
  await expect(camera.getByRole('status')).toHaveText(/Đang kiểm tra liveness/)
  await expect(camera.getByRole('status')).toHaveText(/Đạt liveness/)
  await expect(camera.getByRole('button', { name: 'Sử dụng ảnh này' })).toBeEnabled()
})

test('không liveness: chụp xong dùng được ngay, không có nhãn giả lập', async ({ page }) => {
  const camera = await page$(page)
  await scenario(page, 'Không kiểm tra liveness (chỉ chụp ảnh)')
  await expect(camera.getByText('GIẢ LẬP', { exact: true })).toHaveCount(0)
  await camera.getByRole('button', { name: 'Bật camera' }).click()
  await camera.getByRole('button', { name: 'Chụp ảnh' }).click()
  await camera.getByRole('button', { name: 'Sử dụng ảnh này' }).click()
  await expect(page.getByText(/liveness không kiểm tra/)).toBeVisible()
})

test('từ chối quyền camera hiện lỗi và nút thử lại', async ({ page }, info) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => { throw new DOMException('Denied', 'NotAllowedError') } } }) })
  const camera = await page$(page)
  await camera.getByRole('button', { name: 'Bật camera' }).click()
  await expect(camera.getByRole('alert')).toContainText('Quyền camera đã bị từ chối')
  await expect(camera.getByRole('button', { name: 'Thử mở lại' })).toBeVisible()
  await page.screenshot({ path: info.outputPath('camera-denied.png') })
})

test('provider Nhóm 4: gửi ảnh multipart, hiện điểm và không gắn nhãn giả lập', async ({ page }) => {
  const bodies = []
  await page.route('**/liveness-api/api/v1/predict-liveness', route => { bodies.push(route.request().postDataBuffer()?.toString('latin1')); return route.fulfill({ json: { status: 'success', result: 'REAL', is_real: true, real_score: 0.83, spoof_score: 0.12, threshold_used: 0.108 } }) })
  const camera = await page$(page)
  await scenario(page, 'Dịch vụ Nhóm 4 thật (gửi ảnh)')
  await expect(camera.getByText('GIẢ LẬP', { exact: true })).toHaveCount(0)
  await camera.getByRole('button', { name: 'Bật camera' }).click()
  await camera.getByRole('button', { name: 'Chụp ảnh' }).click()
  await expect(camera.getByRole('status')).toHaveText('Đạt liveness')
  expect(bodies).toHaveLength(1); expect(bodies[0]).toContain('name="file"; filename="face.jpg"')
  await camera.getByRole('button', { name: 'Sử dụng ảnh này' }).click()
  await expect(page.getByText(/liveness pass$/)).toBeVisible()
})
