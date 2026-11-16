import test from 'node:test'
import assert from 'node:assert/strict'
import { createCameraController, describeCameraError, fitSize } from './camera/camera-controller.js'
import { createGroup4PhotoProvider, createSimulatedProvider, isProvider, normalizeOutcome, runLivenessCheck } from './camera/liveness-providers.js'

class FakeTrack extends EventTarget {
  readyState = 'live'
  muted = false
  stopped = false
  stop() { this.readyState = 'ended'; this.stopped = true }
}
function fakeStream() {
  const track = new FakeTrack()
  return { track, getTracks: () => [track], getVideoTracks: () => [track] }
}
function fakeVideo() {
  return { attrs: {}, srcObject: null, muted: false, paused: false, videoWidth: 1280, videoHeight: 720, clientWidth: 400, clientHeight: 500,
    setAttribute(name, value) { this.attrs[name] = value }, async play() { this.paused = false } }
}
function fakeCanvas() {
  const ops = []
  return { ops, width: 0, height: 0,
    getContext: () => ({ translate: (...a) => ops.push(['translate', ...a]), scale: (...a) => ops.push(['scale', ...a]), drawImage: (...a) => ops.push(['draw', ...a.slice(1)]) }),
    toBlob: callback => callback(new Blob(['x'], { type: 'image/jpeg' })), toDataURL: () => 'data:image/jpeg;base64,eA==' }
}
function setup({ getUserMedia, secure = true } = {}) {
  const doc = Object.assign(new EventTarget(), { hidden: false })
  const win = new EventTarget()
  const streams = []
  const canvases = []
  const mediaDevices = { getUserMedia: getUserMedia || (async () => { const s = fakeStream(); streams.push(s); return s }) }
  const camera = createCameraController({ mediaDevices, doc, win, secure: () => secure, createCanvas: () => { const c = fakeCanvas(); canvases.push(c); return c } })
  const video = fakeVideo()
  camera.attach(video)
  return { camera, video, streams, canvases, doc, win }
}

test('camera mở stream, gắn video inline cho Safari và dừng track khi stop', async () => {
  const { camera, video, streams } = setup()
  assert.equal(await camera.start(), true)
  assert.equal(camera.getSnapshot().status, 'live')
  assert.equal(video.srcObject, streams[0])
  assert.equal(video.muted, true)
  assert.ok('playsinline' in video.attrs)
  assert.equal(camera.getStream(), streams[0])
  camera.stop()
  assert.equal(streams[0].track.stopped, true)
  assert.equal(video.srcObject, null)
  assert.equal(camera.getSnapshot().status, 'idle')
})

test('mở lại camera không giữ hai stream cùng lúc', async () => {
  const { camera, streams } = setup()
  await camera.start(); await camera.start()
  assert.equal(streams.length, 2)
  assert.equal(streams[0].track.stopped, true)
  assert.equal(streams[1].track.stopped, false)
})

test('stop trong lúc chờ quyền thì stream trả về muộn bị dừng ngay', async () => {
  let resolve
  const late = fakeStream()
  const { camera } = setup({ getUserMedia: () => new Promise(r => { resolve = r }) })
  const pending = camera.start()
  camera.stop()
  resolve(late)
  assert.equal(await pending, false)
  assert.equal(late.track.stopped, true)
  assert.equal(camera.getStream(), null)
})

test('lỗi quyền, không có camera, HTTP không bảo mật có thông báo tiếng Việt', async () => {
  const denied = setup({ getUserMedia: async () => { throw new DOMException('no', 'NotAllowedError') } })
  await denied.camera.start()
  assert.equal(denied.camera.getSnapshot().status, 'error')
  assert.equal(denied.camera.getSnapshot().error.code, 'denied')
  assert.match(describeCameraError({ name: 'NotFoundError' }).message, /Không tìm thấy camera/)
  assert.equal(describeCameraError({ name: 'NotReadableError' }).code, 'busy')
  const insecure = setup({ secure: false })
  await insecure.camera.start()
  assert.equal(insecure.camera.getSnapshot().error.code, 'insecure')
  assert.equal(insecure.streams.length, 0)
})

test('track bị mute là gián đoạn, unmute tiếp tục, ended chuyển sang lỗi', async () => {
  const { camera, streams } = setup()
  await camera.start()
  const { track } = streams[0]
  track.muted = true; track.dispatchEvent(new Event('mute'))
  assert.equal(camera.getSnapshot().status, 'interrupted')
  track.muted = false; track.dispatchEvent(new Event('unmute'))
  await new Promise(r => setTimeout(r, 0))
  assert.equal(camera.getSnapshot().status, 'live')
  track.readyState = 'ended'; track.dispatchEvent(new Event('ended'))
  assert.equal(camera.getSnapshot().error.code, 'ended')
  assert.equal(camera.getStream(), null)
})

test('quay lại trang sau khi trình duyệt tắt camera thì báo mở lại', async () => {
  const { camera, streams, doc } = setup()
  await camera.start()
  streams[0].track.readyState = 'ended'
  doc.dispatchEvent(new Event('visibilitychange'))
  assert.equal(camera.getSnapshot().error.code, 'hidden')
})

test('capture cắt đúng vùng hiển thị, lật gương và giới hạn kích thước', async () => {
  const { camera, canvases } = setup()
  await camera.start()
  const shot = await camera.capture({ maxSize: 400 })
  assert.equal(shot.blob.type, 'image/jpeg')
  assert.equal(shot.mirrored, true)
  assert.deepEqual([shot.width, shot.height], [320, 400])
  const ops = canvases[0].ops
  assert.deepEqual(ops[0], ['translate', 320, 0])
  assert.deepEqual(ops[2], ['draw', 352, 0, 576, 720, 0, 0, 320, 400])
  assert.equal(camera.getSnapshot().status, 'live', 'capture không tự tắt camera')
})

test('capture từ chối khi video bị gián đoạn hoặc chưa mở', async () => {
  const { camera, streams } = setup()
  await assert.rejects(camera.capture(), { code: 'notReady' })
  await camera.start()
  streams[0].track.muted = true
  await assert.rejects(camera.capture(), { code: 'interrupted' })
  assert.equal(camera.getSnapshot().status, 'interrupted')
})

test('fitSize giữ tỉ lệ', () => {
  assert.deepEqual(fitSize(800, 1000, 500), { width: 400, height: 500 })
  assert.deepEqual(fitSize(300, 200, 960), { width: 300, height: 200 })
})

const noWait = async (ms, signal) => { if (signal?.aborted) throw new DOMException('x', 'AbortError') }

test('provider giả lập luôn gắn nhãn simulated và có đủ đạt/không đạt/lỗi', async () => {
  const pass = await runLivenessCheck(createSimulatedProvider({ scenario: 'pass', sleep: noWait }), {})
  assert.equal(pass.state, 'passed'); assert.equal(pass.outcome.simulated, true)
  const fail = await runLivenessCheck(createSimulatedProvider({ scenario: 'fail', sleep: noWait }), {})
  assert.equal(fail.state, 'failed'); assert.match(fail.outcome.message, /Giả lập/)
  const error = await runLivenessCheck(createSimulatedProvider({ scenario: 'error', sleep: noWait }), {})
  assert.equal(error.state, 'error'); assert.match(error.error, /Giả lập/)
  const controller = new AbortController(); controller.abort()
  assert.equal((await runLivenessCheck(createSimulatedProvider({ sleep: noWait }), { signal: controller.signal })).state, 'aborted')
})

test('provider giả lập không thể trả kết quả "thật"', () => {
  const provider = createSimulatedProvider()
  assert.equal(normalizeOutcome({ verdict: 'pass', simulated: false }, provider).simulated, true)
  assert.throws(() => normalizeOutcome({ verdict: 'maybe' }, provider), /không hợp lệ/)
  assert.equal(isProvider(provider), true)
  assert.equal(isProvider({ check() {} }), false)
})

test('provider Nhóm 4 gửi blob và ánh xạ REAL/FAKE từ server', async () => {
  const calls = []
  const answer = { status: 'success', result: 'FAKE', is_real: false, real_score: 0.1, spoof_score: 0.9, threshold_used: 0.5 }
  const provider = createGroup4PhotoProvider({ predict: async (blob, options) => { calls.push({ blob, options }); return answer } })
  const blob = new Blob(['x'], { type: 'image/jpeg' })
  const result = await runLivenessCheck(provider, { blob })
  assert.equal(calls[0].blob, blob)
  assert.equal(result.state, 'failed')
  assert.equal(result.outcome.simulated, false)
  assert.deepEqual(result.outcome.scores, { real: 0.1, spoof: 0.9, threshold: 0.5 })
  assert.equal(provider.mode, 'photo')
})

test('provider Nhóm 4 yêu cầu ảnh hướng gốc, không lật gương', () => {
  assert.equal(createGroup4PhotoProvider().mirror, false)
  assert.equal(createSimulatedProvider().mirror, undefined)
})

test('chỉ báo live khi video đã có khung hình đầu tiên', async () => {
  const { camera, video } = setup()
  const listeners = {}
  Object.assign(video, { videoWidth: 0, videoHeight: 0, addEventListener: (type, fn) => { listeners[type] = fn }, removeEventListener: () => {} })
  const pending = camera.start()
  await new Promise(r => setTimeout(r, 0))
  assert.equal(camera.getSnapshot().status, 'starting')
  Object.assign(video, { videoWidth: 1280, videoHeight: 720 }); listeners.loadeddata()
  assert.equal(await pending, true)
  assert.equal(camera.getSnapshot().status, 'live')
})
