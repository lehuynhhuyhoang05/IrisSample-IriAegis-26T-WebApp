import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Check, RefreshCcw, X } from '../ui/icons'
import { Badge, Button, Notice } from '../ui'
import { useCamera } from './useCamera.js'
import { runLivenessCheck } from './liveness-providers.js'
import './face-camera.css'

const CHECK_TEXT = {
  checking: 'Đang kiểm tra liveness…',
  passed: 'Đạt liveness',
  failed: 'Không đạt liveness',
  error: 'Chưa kiểm tra được liveness',
}

/**
 * Camera chụp khuôn mặt dùng chung (khung bầu dục, xem ảnh, chụp lại).
 *
 * Props:
 *  - onCapture(result): bắt buộc. Gọi khi người dùng bấm xác nhận ảnh.
 *      result = { blob, dataUrl, width, height, mirrored, capturedAt, liveness }
 *      liveness = null nếu không truyền provider; ngược lại là LivenessOutcome đạt.
 *  - onCancel(): tùy chọn. Có thì hiện nút "Hủy"; camera đã được dừng trước khi gọi.
 *  - onRetake(): tùy chọn. Gọi mỗi lần người dùng chụp lại.
 *  - liveness: provider từ ./liveness-providers.js, hoặc null để chỉ chụp ảnh.
 *  - autoStart: mở camera ngay khi hiện (vẫn cần trình duyệt cho phép).
 *  - confirmLabel, maxSize (cạnh dài ảnh đầu ra, mặc định 960px), label.
 */
export default function FaceCamera({
  onCapture, onCancel, onRetake, liveness = null, autoStart = false,
  confirmLabel = 'Sử dụng ảnh này', maxSize = 960, label = 'Chụp ảnh khuôn mặt',
}) {
  const camera = useCamera()
  const [photo, setPhoto] = useState(null)
  const [check, setCheck] = useState({ state: 'idle' })
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const abortRef = useRef(null)
  const inputRef = useRef(null)

  const abort = () => { abortRef.current?.abort(); abortRef.current = null }
  useEffect(() => () => abort(), [])
  useEffect(() => { if (autoStart) camera.start() }, [autoStart, camera.start])

  async function verify(input) {
    abort()
    const controller = new AbortController()
    abortRef.current = controller
    setCheck({ state: 'checking' })
    const result = await runLivenessCheck(liveness, { ...input, signal: controller.signal })
    if (controller.signal.aborted || result.state === 'aborted') return null
    setCheck(result)
    return result
  }

  async function capture() {
    setNotice(''); setBusy(true)
    try {
      if (liveness?.mode === 'stream') {
        // Module chạy trên stream đang mở: kiểm tra trước, rồi chụp đúng khung hình đó.
        const result = await verify({ stream: camera.getStream(), video: camera.getVideo(), blob: null, dataUrl: null })
        if (!result) return
      }
      const shot = await camera.capture({ maxSize })
      // Ảnh xem trước lật như gương; provider cần hướng gốc (mirror: false) nhận bản riêng.
      const input = liveness?.mode === 'photo' && liveness.mirror === false ? await camera.capture({ maxSize, mirror: false }) : shot
      camera.stop()
      inputRef.current = input
      setPhoto(shot)
      if (liveness?.mode === 'photo') verify({ ...input, stream: null, video: null })
    } catch (error) {
      if (liveness?.mode === 'stream') setCheck({ state: 'idle' })
      setNotice(error.message)
    } finally { setBusy(false) }
  }

  function retake() {
    abort(); setPhoto(null); setCheck({ state: 'idle' }); setNotice('')
    onRetake?.()
    camera.start()
  }

  function cancel() {
    abort(); camera.stop(); setPhoto(null); setCheck({ state: 'idle' })
    onCancel?.()
  }

  const live = camera.status === 'live' || camera.status === 'interrupted'
  const canConfirm = Boolean(photo) && (!liveness || check.state === 'passed')
  const canRecheck = photo && liveness?.mode === 'photo' && check.state === 'error'
  const status = photo
    ? (liveness ? CHECK_TEXT[check.state] || 'Ảnh xem trước' : 'Ảnh xem trước')
    : busy && check.state === 'checking' ? CHECK_TEXT.checking
    : { idle: 'Camera đang tắt', starting: 'Đang mở camera…', live: 'Đặt khuôn mặt vào khung bầu dục', interrupted: 'Video tạm dừng', error: 'Chưa mở được camera' }[camera.status]
  const tone = check.state === 'passed' ? 'success' : check.state === 'failed' || check.state === 'error' ? 'danger' : 'neutral'

  return <section className="face-camera" aria-label={label}>
    {liveness && <div className="face-camera__meta">
      <span>Liveness: {liveness.label}</span>
      {liveness.simulated && <Badge tone="warning">GIẢ LẬP</Badge>}
    </div>}

    <div className={'face-camera__viewport' + (photo ? ' has-photo' : '')}>
      {/* Safari iOS chỉ phát inline khi video đang hiển thị, kể cả lúc chờ khung hình đầu. */}
      <video ref={camera.videoRef} autoPlay muted playsInline disablePictureInPicture className={(live || camera.status === 'starting') && !photo ? 'is-visible' : ''} />
      {photo && <img src={photo.dataUrl} alt="Ảnh khuôn mặt vừa chụp" />}
      {!photo && !live && <div className="face-camera__placeholder">
        <Camera size={32} aria-hidden="true" />
        <strong>{camera.status === 'starting' ? 'Đang kết nối camera…' : 'Camera chưa bật'}</strong>
        <span>Ảnh chỉ được chụp khi bạn bấm “Chụp ảnh”.</span>
      </div>}
      {live && !photo && <div className="face-camera__oval" aria-hidden="true" />}
      {photo && <span className="face-camera__tag"><Check size={14} aria-hidden="true" /> ẢNH ĐÃ CHỤP</span>}
      {liveness?.simulated && (photo || live) && <span className="face-camera__tag face-camera__tag--sim">KẾT QUẢ GIẢ LẬP</span>}
    </div>

    <p className={`face-camera__status face-camera__status--${tone}`} role="status" aria-live="polite">
      <span aria-hidden="true" />{status}{liveness?.simulated && ['passed', 'failed'].includes(check.state) ? ' (giả lập)' : ''}
    </p>

    {camera.error && <Notice tone="danger" title="Không mở được camera">{camera.error.message}</Notice>}
    {camera.status === 'interrupted' && !photo && <Notice tone="warning" title="Video tạm dừng">Hình ảnh camera bị gián đoạn. Bấm “Mở lại camera” nếu không tự tiếp tục.</Notice>}
    {notice && <Notice tone="danger" title="Chưa chụp được ảnh" onDismiss={() => setNotice('')}>{notice}</Notice>}
    {check.state === 'failed' && <Notice tone="danger" title="Không đạt liveness">{check.outcome?.message || 'Hãy chụp lại.'}</Notice>}
    {check.state === 'error' && <Notice tone="danger" title="Chưa kiểm tra được liveness">{check.error}</Notice>}
    {check.outcome?.scores && <details className="face-camera__details"><summary>Chi tiết kết quả</summary>
      <p>REAL {check.outcome.scores.real} · SPOOF {check.outcome.scores.spoof} · Ngưỡng {check.outcome.scores.threshold}</p>
      <p>Chỉ là kết quả chống giả mạo, chưa xác minh danh tính.</p>
    </details>}

    <div className="ui-actions face-camera__actions">
      {onCancel && <Button variant="quiet" icon={X} onClick={cancel}>Hủy</Button>}
      {photo ? <>
        <Button variant="secondary" icon={RefreshCcw} onClick={retake}>Chụp lại</Button>
        {canRecheck && <Button variant="secondary" onClick={() => verify({ ...(inputRef.current || photo), stream: null, video: null })}>Thử kiểm tra lại</Button>}
        <Button icon={Check} disabled={!canConfirm} busy={check.state === 'checking'} onClick={() => onCapture({ ...photo, liveness: check.outcome || null })}>{confirmLabel}</Button>
      </> : live ? <>
        <Button variant="secondary" icon={CameraOff} disabled={busy} onClick={() => { abort(); camera.stop() }}>Tắt camera</Button>
        {camera.status === 'interrupted'
          ? <Button icon={RefreshCcw} onClick={camera.start}>Mở lại camera</Button>
          : <Button icon={Camera} busy={busy} onClick={capture}>Chụp ảnh</Button>}
      </> : <Button icon={camera.error ? RefreshCcw : Camera} busy={camera.status === 'starting'} onClick={camera.start}>{camera.error ? 'Thử mở lại' : 'Bật camera'}</Button>}
    </div>
  </section>
}
