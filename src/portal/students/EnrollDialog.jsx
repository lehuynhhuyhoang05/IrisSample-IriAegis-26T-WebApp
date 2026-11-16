import { useMemo, useState } from 'react'
import { Badge, Button, Dialog, EmptyState, SearchField } from '../../ui'
import { usePortal, useTask } from '../Store.jsx'
import { fold } from '../domain.js'
import { ErrorNotice } from '../shared.jsx'
import { enrollMany } from './actions.js'
import './students.css'

// Gán NHIỀU sinh viên có sẵn vào môn: tìm kiếm + tick chọn, lưu một lần (không ghi dở).
export default function EnrollDialog({ courseId, onClose }) {
  const { db, actor, persist, setFlash } = usePortal(), task = useTask()
  const [query, setQuery] = useState(''), [selected, setSelected] = useState(() => new Set())
  const candidates = useMemo(() => {
    const enrolled = new Set(db.enrollments.filter(e => e.courseId === courseId).map(e => e.studentId))
    const needle = fold(query.trim())
    return db.students.filter(s => !enrolled.has(s.id) && fold(`${s.name} ${s.id} ${s.className || ''}`).includes(needle))
  }, [db, courseId, query])
  function toggle(id) {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }
  const count = selected.size
  return <Dialog open title="Gán sinh viên có sẵn" description="Hồ sơ và ảnh dùng chung giữa các môn; không tạo lại sinh viên." onClose={() => { if (!task.busy) onClose() }}
    footer={<><Button variant="secondary" disabled={task.busy} onClick={onClose}>Đóng</Button><Button disabled={!count} busy={task.busy} onClick={() => task.run(() => {
      persist(enrollMany(db, actor.id, courseId, [...selected]))
      setFlash({ tone: 'success', text: `Đã gán ${count} sinh viên vào môn.` }); onClose()
    })}>{count ? `Gán ${count} sinh viên` : 'Gán vào môn'}</Button></>}>
    <ErrorNotice error={task.error} />
    <SearchField label="Tìm sinh viên chưa có trong môn" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tên, mã hoặc lớp…" />
    {candidates.length === 0
      ? <EmptyState title="Không có sinh viên phù hợp">{query ? 'Thử từ khóa khác.' : 'Mọi sinh viên đã có trong môn này.'}</EmptyState>
      : <ul className="student-pick-list" aria-label="Sinh viên có thể gán">{candidates.map(s => <li key={s.id}><label><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} /><span><strong>{s.name}</strong><small>{s.id}{s.className ? ` · ${s.className}` : ''}</small></span>{!s.photo && <Badge tone="warning">Chưa có ảnh</Badge>}</label></li>)}</ul>}
  </Dialog>
}
