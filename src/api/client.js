import axios from 'axios'

// Địa chỉ backend lấy từ file .env (VITE_API_URL). Để trống = chưa có backend.
export const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
})

export const hasBackend = () => Boolean(API_URL)

/**
 * Gửi ảnh khuôn mặt lên server để nhận diện/điểm danh.
 * Endpoint /api/checkin là ví dụ, hãy đồng bộ với API của nhóm Backend/AI.
 * Luồng giao diện không yêu cầu người dùng nhập mã số sinh viên.
 */
export async function submitCheckin({ subjectId = '', blob }) {
  const form = new FormData()
  if (subjectId) form.append('subject_id', subjectId)
  form.append('photo', blob, 'checkin.jpg')
  const { data } = await api.post('/api/checkin', form)
  return data
}
