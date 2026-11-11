import { useState } from 'react'
import CameraCapture from '../components/CameraCapture'
import { useCheckinStore } from '../store/useCheckinStore'
import { hasBackend, submitCheckin } from '../api/client'

export default function CheckinPage() {
  const { photo, result, setPhoto, setResult, clear } = useCheckinStore()
  const [busy, setBusy] = useState(false)
  const [cameraSession, setCameraSession] = useState(0)

  const handleReset = () => {
    clear()
    setBusy(false)
    setCameraSession((value) => value + 1)
  }

  const handleConfirm = async (captured) => {
    setPhoto(captured)
    const time = new Date().toLocaleTimeString('vi-VN')

    if (!hasBackend()) {
      setResult({
        ok: true,
        time,
        localOnly: true,
        message: `Ảnh đã được chụp thành công (${captured.width} × ${captured.height}, ${Math.round(captured.blob.size / 1024)} KB). Backend chưa được cấu hình nên ảnh chưa được gửi lên hệ thống.`,
      })
      return
    }

    setBusy(true)
    try {
      const response = await submitCheckin({ subjectId: '', blob: captured.blob })
      setResult({
        ok: true,
        time,
        message: response?.message || 'Đã gửi ảnh đến hệ thống điểm danh.',
        data: response,
      })
    } catch (e) {
      setResult({
        ok: false,
        time,
        message: e.response?.data?.message || 'Không gửi được ảnh. Vui lòng kiểm tra kết nối và thử lại.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto min-h-full w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7.5h3l1.5-2h7l1.5 2h3A1.5 1.5 0 0 1 21.5 9v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-slate-900">Face Attendance</p>
            <p className="text-xs font-medium text-slate-500">Hệ thống điểm danh khuôn mặt</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Web App
        </div>
      </header>

      <section className="mb-7 max-w-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Điểm danh trực tuyến</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Điểm danh bằng khuôn mặt
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          Đặt khuôn mặt vào giữa khung hình, chụp ảnh và xác nhận để gửi đến hệ thống.
        </p>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)] lg:gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_16px_50px_-28px_rgba(15,23,42,0.25)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="font-bold text-slate-900">Camera khuôn mặt</h2>
              <p className="mt-1 text-xs text-slate-500">Sử dụng camera trước của thiết bị</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700">CAMERA 01</span>
          </div>
          <CameraCapture key={cameraSession} onConfirm={handleConfirm} confirmLabel="Xác nhận điểm danh" busy={busy} />
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_-28px_rgba(15,23,42,0.2)] sm:p-6" aria-live="polite">
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${result ? (result.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600') : 'bg-slate-100 text-slate-500'}`}>
                {result?.ok ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                ) : result ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 7 17 17M17 7 7 17" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></svg>
                )}
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Trạng thái điểm danh</h2>
                <p className="text-xs text-slate-500">{result?.time ? `Thời gian: ${result.time}` : 'Kết quả sẽ hiển thị tại đây'}</p>
              </div>
            </div>

            {result ? (
              <div className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
                <p className="font-semibold">{result.localOnly ? 'Đã chụp ảnh' : result.ok ? 'Đã gửi yêu cầu' : 'Chưa hoàn tất'}</p>
                <p className="mt-1">{result.message}</p>
                <button type="button" onClick={handleReset} className="mt-3 text-sm font-semibold underline underline-offset-4">
                  Xóa ảnh và làm lại
                </button>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Chưa có kết quả. Sau khi chụp và xác nhận ảnh, trạng thái xử lý sẽ được cập nhật tại đây.
              </p>
            )}
          </section>

          <div className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>
            Hình ảnh chỉ được gửi đi khi bạn nhấn nút xác nhận điểm danh.
          </div>
        </aside>
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
        Face Attendance · Web App
      </footer>
    </main>
  )
}
