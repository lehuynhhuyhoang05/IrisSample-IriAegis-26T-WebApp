import { Navigate, Route, Routes } from 'react-router-dom'
import CheckinPage from './pages/CheckinPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CheckinPage />} />
      {/* Đường dẫn cũ hoặc gõ sai đều quay về trang camera */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
