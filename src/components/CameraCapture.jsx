import { useEffect, useState } from 'react'
import { useCamera } from '../hooks/useCamera'

const STATUS_TAG = {
  idle: { text: 'Camera đang tắt', dot: 'bg-slate-400' },
  starting: { text: 'Đang kết nối camera', dot: 'bg-amber-400 animate-pulse' },
  live: { text: 'Camera sẵn sàng', dot: 'bg-emerald-400 animate-pulse' },
  error: { text: 'Không thể mở camera', dot: 'bg-rose-400' },
}

const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50'

export default function CameraCapture({ onConfirm, confirmLabel = 'Xác nhận điểm danh', busy = false }) {
  const { videoRef, status, error, start, stop, capture } = useCamera({ facingMode: 'user' })
  const [photo, setPhoto] = useState(null)
  const [captureError, setCaptureError] = useState('')

  useEffect(() => {
    start()
    return () => stop()
  }, [start, stop])

  useEffect(() => {
    return () => {
      if (photo?.url) URL.revokeObjectURL(photo.url)
    }
  }, [photo])

  const handleShoot = async () => {
    setCaptureError('')
    try {
      const result = await capture()
      stop()
      setPhoto(result)
    } catch (e) {
      setCaptureError(e.message || 'Không thể chụp ảnh. Vui lòng thử lại.')
    }
  }

  const handleRetake = () => {
    if (photo?.url) URL.revokeObjectURL(photo.url)
    setPhoto(null)
    start()
  }

  const isLive = status === 'live'
  const tag = photo ? { text: 'Đã chụp ảnh', dot: 'bg-blue-500' } : STATUS_TAG[status] || STATUS_TAG.idle

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-950 shadow-inner sm:rounded-3xl">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          disablePictureInPicture
          className={`h-full w-full -scale-x-100 object-cover ${photo ? 'hidden' : ''}`}
        />

        {photo && (
          <img src={photo.url} alt="Ảnh khuôn mặt vừa chụp" className="h-full w-full -scale-x-100 object-cover" />
        )}

        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur sm:left-4 sm:top-4">
          <span className={`h-2 w-2 rounded-full ${tag.dot}`} />
          {tag.text}
        </div>

        {!photo && (
          <>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className={`h-[76%] aspect-[4/5] rounded-[48%] border-2 border-dashed ${isLive ? 'border-white/90' : 'border-white/45'} shadow-[0_0_0_999px_rgba(2,6,23,0.12)]`} />
            </div>
            <div className="absolute inset-x-3 bottom-3 text-center sm:bottom-4">
              <span className="inline-flex rounded-full bg-slate-950/65 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                {status === 'starting' ? 'Vui lòng cho phép trình duyệt sử dụng camera' : isLive ? 'Đặt khuôn mặt vào giữa khung hình' : 'Đang chờ camera'}
              </span>
            </div>
          </>
        )}

        {photo && (
          <div className="absolute bottom-3 left-3 rounded-full bg-emerald-500/95 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            Ảnh đã sẵn sàng
          </div>
        )}
      </div>

      {status === 'error' && !photo && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-bold">Chưa mở được camera</p>
          <p className="mt-1 leading-6">{error?.message || 'Kiểm tra quyền camera và kết nối HTTPS của trang web.'}</p>
          <button type="button" onClick={start} className={`${BUTTON_BASE} mt-3 bg-rose-600 text-white hover:bg-rose-700`}>
            Thử mở lại camera
          </button>
        </div>
      )}

      {captureError && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {captureError}
        </p>
      )}

      {photo ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleRetake}
            disabled={busy}
            className={`${BUTTON_BASE} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></svg>
            Chụp lại
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(photo)}
            disabled={busy}
            className={`${BUTTON_BASE} bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700`}
          >
            {busy ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Đang gửi ảnh...</>
            ) : (
              <><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>{confirmLabel}</>
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-1">
          <button
            type="button"
            onClick={handleShoot}
            disabled={!isLive}
            aria-label="Chụp ảnh khuôn mặt"
            className="group grid h-[76px] w-[76px] place-items-center rounded-full border-[5px] border-blue-100 bg-white shadow-lg shadow-blue-900/10 transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="h-[54px] w-[54px] rounded-full bg-blue-600 transition group-hover:bg-blue-700" />
          </button>
          <span className="text-xs font-semibold text-slate-500">Nhấn nút để chụp ảnh</span>
        </div>
      )}
    </div>
  )
}
