import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook điều khiển camera bằng WebRTC (getUserMedia).
 *
 * Những điểm riêng cho Safari iOS:
 *  1. <video> PHẢI có `playsInline` (và muted), nếu không iOS sẽ mở video toàn màn hình
 *     hoặc không chạy. Hook cũng gán lại các thuộc tính này trước khi gọi play().
 *  2. getUserMedia chỉ chạy trên HTTPS (hoặc localhost).
 *  3. Khi app bị ẩn (khóa màn hình, chuyển tab) iOS tự cắt luồng camera, nên hook
 *     tự dừng và mở lại khi quay về.
 *  4. Phải stop() mọi track khi rời trang, nếu không camera bị "giữ" và lần mở sau bị lỗi.
 */

const ERROR_MESSAGES = {
  insecure: 'Camera chỉ hoạt động trên HTTPS. Hãy mở trang bằng địa chỉ https://.',
  unsupported: 'Trình duyệt này không hỗ trợ camera (getUserMedia).',
  denied:
    'Trình duyệt đang chặn camera. Trên iPhone: Cài đặt > Safari > Camera, chọn Hỏi hoặc Cho phép, rồi tải lại trang.',
  notfound: 'Không tìm thấy camera trên thiết bị này.',
  busy: 'Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.',
  unknown: 'Không mở được camera. Hãy thử lại.',
}

function toCameraError(err) {
  const name = err?.name
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError')
    return { code: 'denied', message: ERROR_MESSAGES.denied }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError')
    return { code: 'notfound', message: ERROR_MESSAGES.notfound }
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError')
    return { code: 'busy', message: ERROR_MESSAGES.busy }
  return { code: 'unknown', message: ERROR_MESSAGES.unknown }
}

export function useCamera({ facingMode = 'user' } = {}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const wantLiveRef = useRef(false) // người dùng đang muốn bật camera?
  const runIdRef = useRef(0) // chống chạy chồng khi start() gọi liên tiếp / StrictMode

  const [status, setStatus] = useState('idle') // idle | starting | live | error
  const [error, setError] = useState(null)

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    const video = videoRef.current
    if (video) {
      video.pause()
      video.srcObject = null
    }
  }, [])

  const stop = useCallback(() => {
    wantLiveRef.current = false
    runIdRef.current += 1
    releaseStream()
    setStatus('idle')
  }, [releaseStream])

  const start = useCallback(async () => {
    if (!window.isSecureContext) {
      setError({ code: 'insecure', message: ERROR_MESSAGES.insecure })
      setStatus('error')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError({ code: 'unsupported', message: ERROR_MESSAGES.unsupported })
      setStatus('error')
      return
    }

    wantLiveRef.current = true
    const runId = ++runIdRef.current
    releaseStream()
    setError(null)
    setStatus('starting')

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: facingMode }, // 'user' = camera trước
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    }

    try {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        // Máy không đáp ứng được độ phân giải/hướng camera yêu cầu: thử lại với mặc định.
        if (err?.name === 'OverconstrainedError' || err?.name === 'ConstraintNotSatisfiedError') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
        } else {
          throw err
        }
      }

      // Nếu trong lúc chờ người dùng bấm Cho phép mà component đã bị đóng / start() bị gọi lại
      if (runId !== runIdRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      streamRef.current = stream

      // iOS đôi khi tự kết thúc luồng (ví dụ có cuộc gọi đến): báo lại trạng thái.
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (streamRef.current === stream) {
            releaseStream()
            setStatus('idle')
          }
        })
      })

      const video = videoRef.current
      if (!video) {
        releaseStream()
        return
      }
      video.muted = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      video.srcObject = stream
      await video.play()

      if (runId !== runIdRef.current) return
      setStatus('live')
    } catch (err) {
      if (runId !== runIdRef.current) return
      releaseStream()
      setError(toCameraError(err))
      setStatus('error')
    }
  }, [facingMode, releaseStream])

  // Safari iOS cắt camera khi trang bị ẩn; mở lại khi người dùng quay về.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (streamRef.current) {
          releaseStream()
          setStatus('idle')
        }
      } else if (wantLiveRef.current && !streamRef.current) {
        start()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [releaseStream, start])

  // Dọn dẹp khi rời trang.
  useEffect(() => {
    return () => {
      wantLiveRef.current = false
      runIdRef.current += 1
      releaseStream()
    }
  }, [releaseStream])

  /**
   * Chụp 1 khung hình từ video đang chạy.
   * @returns {Promise<{blob: Blob, url: string, width: number, height: number}>}
   *  - blob: file JPEG, dùng để upload (FormData).
   *  - url: blob URL, dùng để hiển thị <img>. Nhớ URL.revokeObjectURL khi bỏ.
   * Ảnh KHÔNG bị lật gương (khác với bản xem trước), đúng chiều như camera thấy.
   */
  const capture = useCallback(async ({ quality = 0.9, maxSize = 1024 } = {}) => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      throw new Error('Camera chưa sẵn sàng, hãy đợi hình hiện lên rồi chụp lại.')
    }

    // Thu nhỏ để ảnh nhẹ và tránh giới hạn bộ nhớ canvas của Safari iOS.
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight))
    const width = Math.round(video.videoWidth * scale)
    const height = Math.round(video.videoHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(video, 0, 0, width, height)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Không tạo được ảnh từ camera.'))),
        'image/jpeg',
        quality,
      )
    })

    return { blob, url: URL.createObjectURL(blob), width, height }
  }, [])

  return { videoRef, status, error, start, stop, capture }
}
