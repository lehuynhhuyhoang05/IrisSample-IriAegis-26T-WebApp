import { useCallback, useEffect, useRef, useState } from 'react'
import { usePortal } from '../Store.jsx'

// Trạng thái kiểm tra ảnh GIẢ LẬP: idle | checking | passed | duplicate | mismatch | error
// `scenario` do người dùng chọn trong form demo; `simulate` của Store lo độ trễ/lỗi mạng giả lập.
export function usePhotoCheck() {
  const { simulate } = usePortal()
  const [state, setState] = useState({ status: 'idle', message: '' })
  const request = useRef(null)
  useEffect(() => () => request.current?.abort(), [])
  const reset = useCallback(() => { request.current?.abort(); setState({ status: 'idle', message: '' }) }, [])
  const run = useCallback(async scenario => {
    request.current?.abort()
    const controller = new AbortController(); request.current = controller
    setState({ status: 'checking', message: '' })
    try {
      await simulate(controller.signal)
      if (controller.signal.aborted) return 'idle'
      const next = scenario === 'duplicate'
        ? { status: 'duplicate', message: 'Giả lập: ảnh khuôn mặt đã được đăng ký ở hồ sơ khác.' }
        : scenario === 'mismatch'
          ? { status: 'mismatch', message: 'Giả lập: ảnh mới không khớp ảnh cũ.' }
          : { status: 'passed', message: 'Giả lập: ảnh hợp lệ (chưa kiểm tra thật).' }
      setState(next); return next.status
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) return 'idle'
      setState({ status: 'error', message: error.message }); return 'error'
    }
  }, [simulate])
  return { ...state, run, reset }
}
