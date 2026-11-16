import { getCoverCrop } from '../camera-crop.js'

/**
 * Controller camera dùng chung, không phụ thuộc React.
 *
 * Một controller giữ tối đa một MediaStream. Component/hook chỉ đọc snapshot
 * và gọi start/stop/capture; module khác (ví dụ liveness Nhóm 4 chạy trong
 * trình duyệt) lấy stream hiện tại qua getStream() thay vì mở camera thứ hai.
 *
 * status: idle | starting | live | interrupted | error
 */

export const DEFAULT_CONSTRAINTS = Object.freeze({
  audio: false,
  video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
})

const MESSAGES = {
  insecure: 'Camera cần HTTPS hoặc localhost. Hãy mở lại trang bằng địa chỉ bảo mật.',
  unsupported: 'Trình duyệt này không hỗ trợ camera. Hãy dùng Chrome, Edge hoặc Safari bản mới.',
  denied: 'Quyền camera đã bị từ chối. Hãy cấp quyền trong cài đặt trình duyệt rồi thử lại.',
  notFound: 'Không tìm thấy camera trên thiết bị này.',
  busy: 'Camera đang bận hoặc không thể truy cập. Hãy đóng ứng dụng khác đang dùng camera và thử lại.',
  constraints: 'Camera không hỗ trợ cấu hình yêu cầu. Hãy thử thiết bị khác.',
  ended: 'Camera đã ngừng hoạt động. Hãy bấm Bật camera để thử lại.',
  hidden: 'Camera đã dừng khi bạn rời trang. Hãy bấm Bật camera để tiếp tục.',
  notReady: 'Camera chưa sẵn sàng. Hãy đợi hình ảnh hiện lên rồi chụp lại.',
  interrupted: 'Hình ảnh camera đang bị gián đoạn. Hãy mở lại camera trước khi chụp.',
  unknown: 'Không thể mở camera. Hãy kiểm tra thiết bị và thử lại.',
}

/** Chuyển lỗi getUserMedia/trình duyệt thành { code, message } tiếng Việt. */
export function describeCameraError(error, { secure = globalThis.isSecureContext ?? true } = {}) {
  if (error?.code && MESSAGES[error.code]) return { code: error.code, message: MESSAGES[error.code] }
  if (!secure) return { code: 'insecure', message: MESSAGES.insecure }
  const code = {
    NotAllowedError: 'denied', SecurityError: 'denied', PermissionDeniedError: 'denied',
    NotFoundError: 'notFound', DevicesNotFoundError: 'notFound', OverconstrainedError: 'constraints',
    NotReadableError: 'busy', TrackStartError: 'busy', AbortError: 'busy',
  }[error?.name] || 'unknown'
  return { code, message: MESSAGES[code] }
}

function cameraFailure(code) {
  const error = new Error(MESSAGES[code])
  error.code = code
  return error
}

/** Tính kích thước đầu ra giữ tỉ lệ, cạnh dài nhất không vượt maxSize. */
export function fitSize(width, height, maxSize) {
  if (!maxSize || Math.max(width, height) <= maxSize) return { width, height }
  const scale = maxSize / Math.max(width, height)
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

export function createCameraController({
  mediaDevices = globalThis.navigator?.mediaDevices,
  doc = globalThis.document,
  win = globalThis.window,
  constraints = DEFAULT_CONSTRAINTS,
  secure = () => globalThis.isSecureContext ?? true,
  createCanvas = () => doc.createElement('canvas'),
} = {}) {
  let snapshot = Object.freeze({ status: 'idle', error: null, hasStream: false })
  let stream = null
  let video = null
  let session = 0
  const listeners = new Set()
  const cleanups = []

  const set = patch => {
    snapshot = Object.freeze({ ...snapshot, ...patch, hasStream: Boolean(stream) })
    listeners.forEach(listener => listener())
  }

  function bindVideo() {
    if (!video) return
    // Safari iOS chỉ phát inline khi có các thuộc tính này trước khi gán stream.
    video.setAttribute?.('playsinline', '')
    video.setAttribute?.('webkit-playsinline', '')
    video.muted = true
    if (video.srcObject !== stream) video.srcObject = stream
  }

  async function play() {
    if (!video || !stream) return
    try {
      await video.play?.()
      if (stream && snapshot.status === 'interrupted' && liveTrack()) set({ status: 'live' })
    } catch {
      if (stream) set({ status: 'interrupted' })
    }
  }

  function firstFrame(timeout = 4000) {
    if (!video?.addEventListener || video.videoWidth) return Promise.resolve()
    const target = video
    return new Promise(resolve => {
      const done = () => { clearTimeout(timer); target.removeEventListener('loadeddata', done); resolve() }
      const timer = setTimeout(done, timeout)
      target.addEventListener('loadeddata', done)
    })
  }

  function liveTrack() {
    return stream?.getVideoTracks().find(track => track.readyState === 'live' && !track.muted) || null
  }

  function release() {
    while (cleanups.length) cleanups.pop()()
    stream?.getTracks().forEach(track => track.stop())
    stream = null
    if (video) video.srcObject = null
  }

  function stop() {
    session += 1
    release()
    if (snapshot.status !== 'idle' || snapshot.error) set({ status: 'idle', error: null })
  }

  function fail(code) {
    session += 1
    release()
    set({ status: 'error', error: { code, message: MESSAGES[code] } })
  }

  function listen(target, type, handler, options) {
    if (!target?.addEventListener) return
    target.addEventListener(type, handler, options)
    cleanups.push(() => target.removeEventListener(type, handler, options))
  }

  function watch(current) {
    for (const track of current.getVideoTracks()) {
      listen(track, 'mute', () => { if (stream === current) set({ status: 'interrupted' }) })
      listen(track, 'unmute', () => { if (stream === current) play() })
      listen(track, 'ended', () => { if (stream === current) fail('ended') }, { once: true })
    }
    const resume = () => {
      if (stream !== current || doc?.hidden) return
      if (!current.getVideoTracks().some(track => track.readyState === 'live')) { fail('hidden'); return }
      play()
    }
    listen(doc, 'visibilitychange', resume)
    listen(win, 'pageshow', resume)
  }

  async function start() {
    stop()
    const current = session
    set({ status: 'starting', error: null })
    try {
      if (!secure()) throw cameraFailure('insecure')
      if (!mediaDevices?.getUserMedia) throw cameraFailure('unsupported')
      const next = await mediaDevices.getUserMedia(constraints)
      if (current !== session) { next.getTracks().forEach(track => track.stop()); return false }
      stream = next
      watch(next)
      bindVideo()
      await play()
      await firstFrame()
      if (current !== session) return false
      // Chỉ báo "live" khi video đã có kích thước, tránh bấm chụp lúc chưa có hình.
      if (snapshot.status === 'starting') set({ status: 'live' })
      return true
    } catch (error) {
      if (current !== session) return false
      const { code, message } = describeCameraError(error, { secure: secure() })
      release()
      set({ status: 'error', error: { code, message } })
      return false
    }
  }

  /** Gắn (hoặc gỡ khi node = null) phần tử <video>. Dùng làm callback ref. */
  function attach(node) {
    if (video && video !== node && video.srcObject === stream) video.srcObject = null
    video = node
    if (video && stream) { bindVideo(); play() }
  }

  /**
   * Chụp đúng phần đang hiển thị (object-fit: cover), mặc định lật ngang như
   * gương để ảnh khớp với những gì người dùng thấy. Không tự dừng camera.
   */
  async function capture({ mirror = true, type = 'image/jpeg', quality = 0.92, maxSize = 960 } = {}) {
    if (!stream || !video) throw cameraFailure('notReady')
    if (!liveTrack() || video.paused) { set({ status: 'interrupted' }); throw cameraFailure('interrupted') }
    if (!video.videoWidth || !video.videoHeight) throw cameraFailure('notReady')
    const viewWidth = video.clientWidth || video.videoWidth
    const viewHeight = video.clientHeight || video.videoHeight
    const crop = getCoverCrop(video.videoWidth, video.videoHeight, viewWidth, viewHeight)
    const size = fitSize(crop.width, crop.height, maxSize)
    const canvas = createCanvas()
    canvas.width = size.width; canvas.height = size.height
    const context = canvas.getContext('2d')
    if (mirror) { context.translate(size.width, 0); context.scale(-1, 1) }
    context.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height)
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Không tạo được ảnh từ camera. Hãy chụp lại.')), type, quality))
    const dataUrl = canvas.toDataURL(type, quality)
    return { blob, dataUrl, width: size.width, height: size.height, mirrored: mirror, capturedAt: new Date().toISOString() }
  }

  return {
    start, stop, attach, capture,
    /** Stream đang mở hoặc null. Không gọi track.stop() từ bên ngoài; dùng stop(). */
    getStream: () => stream,
    getVideo: () => video,
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
  }
}
