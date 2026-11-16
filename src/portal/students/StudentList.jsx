import { useMemo, useState } from 'react'
import { Download, Edit2, FileUp, Plus, Trash2 } from '../../ui/icons'
import { Badge, Button, DataTable, EmptyState, Field, IconButton, PageHeader, SearchField } from '../../ui'
import { usePortal } from '../Store.jsx'
import { coursesFor, isSuper, studentsFor } from '../domain.js'
import { Confirm, ImportDialog, Person } from '../shared.jsx'
import { EntityForm } from '../Catalog.jsx'
import { csvText, download } from '../csv.js'
import { classOptions, enrollmentCounts, filterStudents, paginate, sortStudents } from './queries.js'
import './students.css'

const initial = { query: '', photo: 'all', className: '', courseId: '', enrollment: 'all' }

export default function StudentList() {
  const { db, actor, write, setFlash } = usePortal()
  const [filters, setFilters] = useState(initial), [sort, setSort] = useState('name'), [page, setPage] = useState(1)
  const [edit, setEdit] = useState(undefined), [remove, setRemove] = useState(null), [importing, setImporting] = useState(false)
  const scoped = studentsFor(db, actor), counts = useMemo(() => enrollmentCounts(db), [db])
  const rows = useMemo(() => sortStudents(filterStudents(db, actor, filters), sort), [db, actor, filters, sort])
  const view = paginate(rows, page)
  const change = patch => { setFilters(prev => ({ ...prev, ...patch })); setPage(1) }
  const filtered = JSON.stringify(filters) !== JSON.stringify(initial)
  const select = (label, key, options) => <Field as="select" label={label} value={filters[key]} onChange={e => change({ [key]: e.target.value })} options={options} />
  const actions = row => <div className="ui-row-actions"><IconButton icon={Edit2} label={`Sửa ${row.id}`} onClick={() => setEdit(row)} />{isSuper(actor) && <IconButton icon={Trash2} label={`Xóa ${row.id}`} onClick={() => setRemove(row)} />}</div>
  return <>
    <PageHeader title="Sinh viên" actions={<><Button variant="quiet" icon={FileUp} onClick={() => setImporting(true)}>Nhập CSV</Button><Button icon={Plus} onClick={() => setEdit(null)}>Thêm sinh viên</Button></>} />
    <div className="ui-toolbar student-toolbar">
      <SearchField placeholder="Tìm tên, mã, email…" value={filters.query} onChange={e => change({ query: e.target.value })} />
      {select('Lọc ảnh', 'photo', [{ value: 'all', label: 'Tất cả hồ sơ' }, { value: 'photo', label: 'Đã có ảnh' }, { value: 'no-photo', label: 'Chưa có ảnh' }])}
      {select('Lọc lớp', 'className', [{ value: '', label: 'Tất cả lớp' }, ...classOptions(scoped).map(value => ({ value, label: value }))])}
      {select('Lọc môn học', 'courseId', [{ value: '', label: 'Tất cả môn' }, ...coursesFor(db, actor).map(c => ({ value: c.id, label: `${c.id} · ${c.name}` }))])}
      {select('Lọc đăng ký', 'enrollment', [{ value: 'all', label: 'Mọi đăng ký' }, { value: 'none', label: 'Chưa đăng ký môn' }])}
      <Field as="select" label="Sắp xếp" value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} options={[{ value: 'name', label: 'Sắp theo tên' }, { value: 'id', label: 'Sắp theo mã' }]} />
    </div>
    <DataTable caption="Danh sách sinh viên" variant="catalog students" rows={view.items}
      empty={<EmptyState title={scoped.length ? 'Không có kết quả phù hợp' : 'Chưa có sinh viên'} action={filtered && <Button variant="secondary" onClick={() => { setFilters(initial); setPage(1) }}>Xóa bộ lọc</Button>}>{scoped.length ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Thêm sinh viên hoặc nhập từ CSV.'}</EmptyState>}
      columns={[
        { key: 'name', label: 'Hồ sơ', render: row => <a className="portal-record-link" href={`#/app/students/${row.id}`}><Person row={row} /></a> },
        { key: 'email', label: 'Email' },
        { key: 'className', label: 'Lớp', render: row => row.className || '—' },
        { key: 'courses', label: 'Môn', render: row => counts.get(row.id) ? `${counts.get(row.id)} môn` : <Badge tone="warning">Chưa đăng ký</Badge> },
        { key: 'photo', label: 'Ảnh', render: row => <Badge tone={row.photo ? 'success' : 'warning'}>{row.photo ? 'Có ảnh' : 'Chưa có ảnh'}</Badge> },
        { key: 'actions', label: 'Thao tác', render: actions },
      ]} />
    <div className="ui-list-footer">
      <span>{rows.length} / {scoped.length} sinh viên · trang {view.page}/{view.pages}</span>
      <span className="student-pager"><Button variant="quiet" disabled={view.page <= 1} onClick={() => setPage(view.page - 1)}>Trang trước</Button><Button variant="quiet" disabled={view.page >= view.pages} onClick={() => setPage(view.page + 1)}>Trang sau</Button></span>
      <Button variant="quiet" icon={Download} onClick={() => download(csvText(['id', 'name', 'email', 'className'], rows.map(r => [r.id, r.name, r.email || '', r.className || ''])), 'students.csv')}>Xuất danh sách đang lọc</Button>
    </div>
    {edit !== undefined && <EntityForm entity="students" row={edit} onClose={() => setEdit(undefined)} />}
    {importing && <ImportDialog entity="students" onClose={() => setImporting(false)} />}
    {remove && <Confirm title={`Xóa ${remove.name}?`} description="Xóa hồ sơ khỏi toàn hệ thống, đăng ký môn và lịch sử điểm danh liên quan. Muốn chỉ bỏ khỏi môn, mở chi tiết môn học." onClose={() => setRemove(null)} onConfirm={() => { write({ type: 'delete', entity: 'students', id: remove.id }); setFlash({ tone: 'success', text: 'Đã xóa khỏi dữ liệu demo.' }) }} />}
  </>
}