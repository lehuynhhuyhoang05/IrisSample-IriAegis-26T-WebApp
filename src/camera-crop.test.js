import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getCoverCrop } from './camera-crop.js'

test('cắt giữa frame ngang theo vùng preview dọc', () => {
  assert.deepEqual(getCoverCrop(1280, 720, 360, 450), { x: 352, y: 0, width: 576, height: 720 })
})

test('cắt giữa frame dọc theo vùng preview ngang', () => {
  assert.deepEqual(getCoverCrop(720, 1280, 360, 240), { x: 0, y: 400, width: 720, height: 480 })
})

test('giữ nguyên frame khi tỷ lệ trùng nhau', () => {
  assert.deepEqual(getCoverCrop(720, 900, 360, 450), { x: 0, y: 0, width: 720, height: 900 })
})

test('không tạo vùng cắt từ kích thước bằng 0 hoặc không hợp lệ', () => {
  assert.throws(() => getCoverCrop(1280, 720, 0, 450), RangeError)
  assert.throws(() => getCoverCrop(NaN, 720, 360, 450), RangeError)
})
