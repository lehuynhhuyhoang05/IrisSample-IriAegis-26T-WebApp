import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Camera, CameraOff, Check, RefreshCcw, X } from 'lucide-react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { getCoverCrop } from './camera-crop.js'
import androidLogo from './assets/android/ic_app_logo.png'
import androidWarning from './assets/android/ic_warning.svg'

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

function cameraError(error) {
  if (!window.isSecureContext) return 'Camera cần HTTPS hoặc localhost. Hãy mở lại trang bằng địa chỉ bảo mật.'
  if (error?.name === 'NotAllowedError') return 'Quyền camera đã bị từ chối. Hãy cấp quyền trong cài đặt trình duyệt rồi thử lại.'
  if (error?.name === 'NotFoundError') return 'Không tìm thấy camera trên thiết bị này.'
  if (error?.name === 'NotReadableError') return 'Camera đang bận hoặc không thể truy cập. Hãy đóng ứng dụng khác và thử lại.'
  return 'Không thể mở camera. Hãy kiểm tra thiết bị và thử lại.'
}

export default function App() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const timerRef = useRef(null)
  const sessionRef = useRef(0)
  const [camera, setCamera] = useState('idle')
  const [face, setFace] = useState('idle')
  const [count, setCount] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [interrupted, setInterrupted] = useState(false)

  const stop = useCallback(() => {
    sessionRef.current += 1
    clearTimeout(timerRef.current)
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.style.visibility = ''
    }
    detectorRef.current?.close()
    detectorRef.current = null
    setCamera('idle'); setFace('idle'); setCount(0); setInterrupted(false)
  }, [])

  useEffect(() => () => { stop() }, [stop])

  useEffect(() => {
    const resumeVideo = () => {
      const video = videoRef.current
      const stream = streamRef.current
      if (document.hidden || !video || !stream) return
      if (!stream.getVideoTracks().some(track => track.readyState === 'live')) {
        stop()
        setError('Camera đã dừng khi bạn rời trang. Hãy bấm Bật camera để tiếp tục.')
        return
      }
      video.play().then(() => setInterrupted(false)).catch(() => {
        if (streamRef.current === stream) setInterrupted(true)
      })
    }
    const video = videoRef.current
    document.addEventListener('visibilitychange', resumeVideo)
    window.addEventListener('pageshow', resumeVideo)
    video?.addEventListener('webkitendfullscreen', resumeVideo)
    video?.addEventListener('pause', resumeVideo)
    return () => {
      document.removeEventListener('visibilitychange', resumeVideo)
      window.removeEventListener('pageshow', resumeVideo)
      video?.removeEventListener('webkitendfullscreen', resumeVideo)
      video?.removeEventListener('pause', resumeVideo)
    }
  }, [stop])

  const start = async () => {
    stop()
    const session = sessionRef.current
    setPhoto(null); setError(''); setCamera('loading')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unavailable')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })
      if (session !== sessionRef.current) { stream.getTracks().forEach(track => track.stop()); return }
      streamRef.current = stream
      stream.getVideoTracks().forEach(track => {
        track.addEventListener('mute', () => {
          if (streamRef.current === stream) setInterrupted(true)
        })
        track.addEventListener('unmute', () => {
          if (streamRef.current === stream) setInterrupted(false)
        })
      })
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
        if (streamRef.current !== stream) return
        stop()
        setError('Camera đã ngừng hoạt động. Hãy bấm Bật camera để thử lại.')
      }, { once: true }))
      const video = videoRef.current
      // Safari cần phần tử video hiển thị trong trang trước khi phát inline.
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      video.muted = true
      video.style.visibility = 'visible'
      video.srcObject = stream
      flushSync(() => setCamera('active'))
      await video.play()
      if (session !== sessionRef.current) return
      setFace('loading')
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM)
        const detector = await FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL }, runningMode: 'VIDEO', minDetectionConfidence: 0.5 })
        if (session !== sessionRef.current) { detector.close(); return }
        detectorRef.current = detector
        const scan = () => {
          if (session !== sessionRef.current || !videoRef.current || !detectorRef.current) return
          try {
            if (!document.hidden && !videoRef.current.paused && videoRef.current.readyState >= 2) {
              const result = detectorRef.current.detectForVideo(videoRef.current, performance.now())
              setCount(result.detections.length)
              setFace(result.detections.length ? 'found' : 'searching')
            }
            timerRef.current = setTimeout(scan, 250)
          } catch {
            setFace('error')
          }
        }
        scan()
      } catch {
        if (session === sessionRef.current) setFace('error')
      }
    } catch (err) {
      if (session !== sessionRef.current) return
      stop(); setError(cameraError(err))
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video?.videoWidth || !video?.videoHeight) { setError('Camera chưa sẵn sàng. Hãy thử chụp lại.'); return }
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track || track.readyState !== 'live' || track.muted || video.paused) {
      setInterrupted(true)
      setError('Hình ảnh camera đang bị gián đoạn. Hãy mở lại camera trước khi chụp.')
      return
    }
    if (!video.clientWidth || !video.clientHeight) { setError('Khung camera chưa sẵn sàng. Hãy thử lại.'); return }
    const crop = getCoverCrop(video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight)
    const canvas = document.createElement('canvas')
    canvas.width = crop.width; canvas.height = crop.height
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1)
    ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
    const image = canvas.toDataURL('image/jpeg', 0.92)
    stop(); setError(''); setPhoto(image)
  }

  const faceText = { idle: 'Đang chờ camera', loading: 'Đang tải bộ phát hiện...', searching: 'Chưa thấy khuôn mặt', found: count > 1 ? `Phát hiện ${count} khuôn mặt` : 'Đã phát hiện khuôn mặt', error: 'Không tải được bộ phát hiện' }[face]

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-icon"><img src={androidLogo} alt="" /></span><span>Iri<span>Aegis</span><small>ATTENDANCE SYSTEM</small></span></div><div className="top-right"><span className="prototype"><span/> Bản thử nghiệm</span><span className="avatar">IA</span></div></header>
    <main className="main"><div className="heading"><h1>Chụp ảnh khuôn mặt</h1><p>Đặt khuôn mặt vào giữa khung hình</p></div>
      <div className="workspace"><section className="camera-card" aria-label="Chụp ảnh khuôn mặt">
        <div className={'viewport ' + (photo ? 'has-photo' : '')}>
          <video ref={videoRef} autoPlay muted playsInline disablePictureInPicture className={camera === 'active' && !photo ? 'visible' : ''} />
          {photo && <img src={photo} alt="Ảnh khuôn mặt vừa chụp" />}
          {!photo && camera !== 'active' && <div className="camera-placeholder"><div className="camera-symbol"><Camera size={32} strokeWidth={1.6}/></div><strong>{camera === 'loading' ? 'Đang kết nối camera...' : 'Sẵn sàng khi bạn sẵn sàng'}</strong><span>Bật camera để bắt đầu chụp ảnh</span></div>}
          {camera === 'active' && !photo && <div className={'face-guide' + (face === 'found' ? ' detected' : '')} aria-hidden="true"/>}
          {photo && <div className="photo-label"><Check size={14}/> ẢNH ĐÃ CHỤP</div>}
        </div>
        <div className="card-bottom"><div className="detect-status" role="status" aria-live="polite"><span className={'status-dot ' + (face === 'found' ? 'success' : '')} aria-hidden="true"/><strong>{photo ? 'Ảnh xem trước' : faceText}</strong></div>
          <div className="actions">{camera === 'active' ? <><button className="btn secondary" onClick={stop}><CameraOff size={18}/> Tắt camera</button><button className="btn primary" onClick={capture}><Camera size={18}/> Chụp ảnh</button></> : <button className="btn primary" onClick={start} disabled={camera === 'loading'}>{photo ? <RefreshCcw size={18}/> : <Camera size={18}/>} {photo ? 'Chụp lại' : camera === 'loading' ? 'Đang mở...' : 'Bật camera'}</button>}</div></div>
        {interrupted && camera === 'active' && <div className="error" role="alert"><img className="android-notice-icon" src={androidWarning} alt="" />Video tạm dừng. <button onClick={start}>Mở lại camera</button></div>}
        {error && <div className="error" role="alert"><img className="android-notice-icon" src={androidWarning} alt="" />{error}<button onClick={() => setError('')} aria-label="Đóng"><X size={16}/></button></div>}
      </section></div>
    </main></div>
}
