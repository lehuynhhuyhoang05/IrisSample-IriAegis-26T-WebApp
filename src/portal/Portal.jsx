import { useEffect, useState } from 'react'
import { BookOpen, CalendarCheck, ClipboardList, Database, Home as HomeIcon, LogOut, Mail, Settings2, ShieldCheck, UserCircle, Users } from '../ui/icons'
import { AppShell, Button, EmptyState, Notice } from '../ui'
import { PortalProvider, usePortal } from './Store.jsx'
import { isSuper } from './domain.js'
import Auth from './Auth.jsx'
import { Catalog, CourseDetail, PersonDetail } from './Catalog.jsx'
import { Attendance, Home, Reports } from './Attendance.jsx'
import { Backups, DemoSettings, EmailPage } from './Operations.jsx'
import { Confirm, go } from './shared.jsx'
import StudentList from './students/StudentList.jsx'
import '../ui/tokens.css'
import '../ui/ui.css'
import './portal.css'
import PortalShell from './PortalShell.jsx'
import './mobile-first.css'
import ServerPortal from '../server/ServerPortal.jsx'
import { readMode } from '../server/config.js'

function Content({ path }) {
  const { actor, logout, flash, setFlash } = usePortal(), [leaving, setLeaving] = useState(false)
  const raw = path.replace(/^#\/?app\/?/, '').split('?'), parts = raw[0].split('/'), page = parts[0] || 'home', id = decodeURIComponent(parts[1] || ''), course = new URLSearchParams(raw[1]).get('course')
  useEffect(() => { setFlash(null) }, [path])
  if (!actor) return <Auth page={page} />
  const nav = [['home', 'Hôm nay', HomeIcon], ['courses', 'Môn học', BookOpen], ['students', 'Sinh viên', Users], ['attendance', 'Điểm danh', CalendarCheck], ['reports', 'Lịch sử & báo cáo', ClipboardList], ['email', 'Email báo cáo', Mail], ...(isSuper(actor) ? [['admins', 'Quản trị viên', ShieldCheck], ['backups', 'Sao lưu', Database]] : []), ['profile', 'Hồ sơ của tôi', UserCircle], ['settings', 'Thiết lập demo', Settings2]]
  let content
  if (['home', 'login', 'forgot', 'reset', ''].includes(page)) content = <Home />
  else if (page === 'courses' && id) content = <CourseDetail key={id} id={id} />
  else if (['students', 'admins'].includes(page) && id) content = <PersonDetail key={id} entity={page} id={id} />
  else if (page === 'students') content = <StudentList key="students" />
  else if (['courses', 'admins'].includes(page)) content = <Catalog key={page} entity={page} />
  else if (page === 'attendance') content = <Attendance key={course || 'all'} initialCourse={course} />
  else if (page === 'reports') content = <Reports key={course || 'all'} initialCourse={course} />
  else if (page === 'email') content = <EmailPage key={course || 'all'} initialCourse={course} />
  else if (page === 'backups') content = <Backups />
  else if (page === 'settings') content = <DemoSettings />
  else if (page === 'profile') content = <PersonDetail profile entity="admins" id={actor.id} />
  else content = <EmptyState title="Trang không tồn tại" action={<Button onClick={() => go()}>Về hôm nay</Button>} />
  return <PortalShell items={nav.map(([id, label, icon]) => ({ id, label, icon, href: `#/app/${id}` }))} activeId={page} actor={actor} onLogout={() => setLeaving(true)}>
    {flash && <Notice tone={flash.tone} title={flash.text} onDismiss={() => setFlash(null)} />}
    {content}
    {leaving && <Confirm title="Đăng xuất khỏi phiên demo?" description="Dữ liệu đã lưu vẫn còn trên trình duyệt. Camera sẽ được dừng khi rời màn hình." danger={false} onClose={() => setLeaving(false)} onConfirm={logout} />}
  </PortalShell>
}
export default function Portal({ path }) { return readMode() === 'demo' ? <PortalProvider><Content path={path} /></PortalProvider> : <ServerPortal path={path} /> }