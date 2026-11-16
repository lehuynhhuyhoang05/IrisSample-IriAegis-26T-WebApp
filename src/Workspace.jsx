import { lazy, Suspense, useEffect, useState } from 'react'
import App from './App.jsx'

const Showcase = lazy(() => import('./showcase/Showcase.jsx'))
const ModuleShell = lazy(() => import('./pages/ModuleShell.jsx'))

export default function Workspace() {
  const [path, setPath] = useState(window.location.hash)

  useEffect(() => {
    const change = () => {
      setPath(window.location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])

  // Module Email + Backup (vantien68)
  if (path.startsWith('#/email') || path.startsWith('#/backup')) {
    return (
      <Suspense fallback={<p role="status">Đang mở module…</p>}>
        <ModuleShell path={path} />
      </Suspense>
    )
  }

  // UI Kit tham chiếu
  if (path.startsWith('#/ui-kit')) {
    return (
      <Suspense fallback={<p role="status">Đang mở thư viện giao diện…</p>}>
        <Showcase path={path} />
      </Suspense>
    )
  }

  // Mặc định: camera prototype (hoặc #/camera)
  return <App />
}
