
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Camera, Download, FileUp, Trash2 } from '../ui/icons'
import CameraApp from '../App.jsx'
import { Button, DataTable, Dialog, Field, Notice } from '../ui'
import { usePortal, useTask } from './Store.jsx'
import { command, uid } from './domain.js'
import { csvText, download, parseCSV } from './csv.js'

export const go = (page = 'home') => { window.location.hash = `/app/${page}` }
export function Back({ to, children = 'Quay lại' }) { return <Button variant="quiet" icon={ArrowLeft} onClick={() => go(to)}>{children}</Button> }
export function ErrorNotice({ error }) {
  const ref = useRef(null)
  useEffect(() => { if (error) { ref.current?.focus({ preventScroll: true }); ref.current?.scrollIntoView({ block: 'nearest' }) } }, [error])
  return error ? <div ref={ref} tabIndex={-1}><Notice tone="danger" title="Chưa thể hoàn tất">{error}</Notice></div> : null
}

export function Person({ row }) { return <span className="ui-person">{row.photo ? <img className="portal-avatar" src={row.photo} alt="" /> : <span className="ui-initials">{row.name.split(' ').slice(-2).map(w => w[0]).join('')}</span>}<span><strong>{row.name}</strong><small>{row.id}</small></span></span> }
export function Confirm({ title, description, onConfirm, onClose, danger = true, requirePassword = false }) {
  const [value, setValue] = useState(''); const task = useTask(); const { actor } = usePortal()
  return <Dialog open title={title} description={description} onClose={task.busy ? () => {} : onClose} footer={<><Button variant="secondary" disabled={task.busy} onClick={onClose}>Giữ lại</Button><Button variant={danger ? 'danger' : 'primary'} busy={task.busy} onClick={() => task.run(async () => { if (requirePassword && value !== actor.password) throw new Error('Mật khẩu demo chưa đúng.'); await onConfirm(); onClose() })}>Xác nhận</Button></>}>
    <ErrorNotice error={task.error} />{requirePassword && <Field label="Mật khẩu tài khoản demo" type="password" autoComplete="off" value={value} onChange={e => setValue(e.target.value)} hint="Thay cho bước khóa thiết bị Android trong bản demo; chưa phải xác thực bảo mật." />}
  </Dialog>
}

async function resizePhoto(source) {
  const image = new Image(); image.src = source
  await image.decode()
  const scale = Math.min(1, 480 / Math.max(image.width, image.height)), canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale))
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export function PhotoField({ value, onChange }) {
  const [camera, setCamera] = useState(false); const task = useTask()
  const captureRef = useRef(null), trigger = useRef(null)
  useEffect(() => { if (camera) captureRef.current?.scrollIntoView({ block: 'start' }) }, [camera])
  return <div className="portal-photo-field">
    <div className="portal-section-heading"><div><h3>Ảnh khuôn mặt</h3><p>Chụp hoặc chọn ảnh.</p></div>{value && <img src={value} alt="Ảnh đã chọn" />}</div>
    <div className="ui-actions"><Button variant="secondary" icon={Camera} onClick={event => { trigger.current = event.currentTarget; setCamera(!camera) }}>{camera ? 'Đóng camera' : 'Chụp khuôn mặt'}</Button><label className="portal-file">Chọn ảnh<input aria-label="Chọn ảnh khuôn mặt" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; if (!file) return; task.run(async () => { if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5000000) throw new Error('Chọn ảnh JPEG, PNG hoặc WebP dưới 5 MB.'); const url = URL.createObjectURL(file); try { onChange(await resizePhoto(url)) } finally { URL.revokeObjectURL(url) } }); e.target.value = '' }} /></label>{value && <Button icon={Trash2} variant="quiet" onClick={() => onChange('')}>Bỏ ảnh</Button>}</div>
    <ErrorNotice error={task.error} />
    {camera && <div ref={captureRef}><CameraApp embedded livenessRequired onCapture={image => task.run(async () => { onChange(await resizePhoto(image)); setCamera(false); requestAnimationFrame(() => trigger.current?.focus()) })} /></div>}
  </div>
}

const templates = {
  students: { headers: ['id', 'name', 'email', 'className', 'password'], values: ['SV009', 'Nguyễn Văn An', 'an@demo.test', 'CNTT K24', '123456'] },
  admins: { headers: ['id', 'name', 'email', 'code', 'password'], values: ['ADM_MOI', 'Lê Anh', 'anh@demo.test', 'GV09', 'Demo@123'] },
  courses: { headers: ['id', 'name', 'instructorId', 'semester', 'startDate', 'endDate', 'day', 'start', 'end', 'room'], values: ['WEB401', 'Thiết kế Web', '', 'Học kỳ 1', `${new Date().getFullYear()}-01-01`, `${new Date().getFullYear()}-12-31`, '1', '07:30', '11:30', 'B.401'] },
  recipients: { headers: ['name', 'email'], values: ['Đào tạo', 'daotao2@demo.test'] },
}

export function ImportDialog({ entity, courseId, onClose }) {
  const { db, actor, persist, setFlash } = usePortal(), task = useTask()
  const [preview, setPreview] = useState(null)
  const [source, setSource] = useState('')
  const template = templates[entity]
  function prepare(text) {
    const rows = parseCSV(text)
    const missing = template.headers.filter(h => !Object.hasOwn(rows[0], h))
    if (missing.length) throw new Error(`Thiếu cột: ${missing.join(', ')}`)
    let candidate = db
    const results = rows.map((row, i) => {
      try {
        const commandRow = entity === 'courses' ? { ...row, instructorId: row.instructorId || '', schedules: [{ id: uid('SCH'), day: Number(row.day), start: row.start, end: row.end }] } : { ...row, photo: '' }
        const action = entity === 'recipients' ? { type: 'recipient', row: { ...commandRow, courseId } } : { type: 'save', entity, row: commandRow }
        candidate = command(candidate, actor.id, action)
        if (entity === 'students' && courseId) candidate = command(candidate, actor.id, { type: 'enroll', studentId: row.id, courseId })
        return { id: i + 1, name: row.name, code: row.id || row.email, result: 'Hợp lệ' }
      } catch (error) { return { id: i + 1, name: row.name, code: row.id || row.email, result: error.message } }
    })
    setPreview(results)
    return { results, candidate }
  }
  return <Dialog open title="Nhập dữ liệu CSV" description="Xem trước và kiểm tra tất cả dòng. Chỉ thêm mới; mã trùng bị từ chối, không ghi đè. Không có dữ liệu nào được lưu khi còn lỗi." onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button disabled={!preview || preview.some(r => r.result !== 'Hợp lệ')} busy={task.busy} onClick={() => task.run(() => { const result = prepare(source); if (result.results.some(r => r.result !== 'Hợp lệ')) throw new Error('Dữ liệu đã thay đổi hoặc CSV còn lỗi. Kiểm tra lại bảng.'); persist(result.candidate); setFlash({ tone: 'success', text: `Đã nhập ${result.results.length} bản ghi demo.` }); onClose() })}>Nhập {preview?.length || 0} bản ghi</Button></>}>
    <Button variant="secondary" icon={Download} onClick={() => download(csvText(template.headers, [template.values]), `${entity}-mau.csv`)}>Tải CSV mẫu</Button>
    <Field label="File CSV (tối đa 500 dòng)" type="file" accept=".csv,text/csv" onChange={e => { const file = e.target.files?.[0]; setPreview(null); if (entity === 'students') { setSource(''); task.setError('') } if (!file) return; task.run(async () => { if (file.size > 1000000) throw new Error('CSV tối đa 1 MB.'); const text = await file.text(); if (entity === 'students') { prepare(text); setSource(text) } else { setSource(text); prepare(text) } }); e.target.value = '' }} />
    <ErrorNotice error={task.error} />{preview && <DataTable caption="Kết quả kiểm tra CSV" rows={preview} columns={[{ key: 'id', label: 'Dòng' }, { key: 'code', label: 'Mã / email' }, { key: 'name', label: 'Tên' }, { key: 'result', label: 'Kiểm tra' }]} />}
  </Dialog>
}

// Camera liveness uses group 4. Identity matching remains explicitly simulated here.
export function FaceFlow({ onComplete, onCancel, label = 'Xác thực khuôn mặt' }) {
  const { simulate } = usePortal(), task = useTask()
  const [image, setImage] = useState(''), [step, setStep] = useState('camera'), [result, setResult] = useState('pass')
  const [liveness, setLiveness] = useState(null)
  const controller = useRef(new AbortController())
  useEffect(() => { controller.current = new AbortController(); return () => controller.current.abort() }, [])
  async function verify() {
    await simulate(controller.current.signal)
    if (image && !liveness?.is_real) throw new Error('Ảnh chưa đạt liveness qua dịch vụ liveness.')
    if (result === 'fail') throw new Error('Giả lập: không đạt liveness. Hãy thử lại hoặc chụp lại.')
    if (result === 'mismatch') throw new Error('Giả lập: khuôn mặt không khớp. Chưa ghi điểm danh.')
    setStep('verified')
  }
  return <section className="portal-face-flow" aria-label={label}>
    <div className="portal-steps" aria-label="Tiến trình"><span className={step === 'camera' ? 'current' : ''}>1. Chụp ảnh & liveness</span><span className={step === 'review' ? 'current' : ''}>2. Đối sánh demo</span><span className={step === 'verified' ? 'current' : ''}>3. Xác nhận</span></div>
    <Notice tone="warning" title="Đối sánh danh tính giả lập">Camera gọi dịch vụ liveness; đối sánh danh tính và ghi nhận demo vẫn là giả lập.</Notice>
    {step === 'camera' ? <><CameraApp embedded livenessRequired onCapture={(photo, evidence) => { setImage(photo); setLiveness(evidence); setResult('pass'); setStep('review') }} /><Button variant="quiet" onClick={() => { setImage(''); setLiveness(null); setStep('review') }}>Dùng kịch bản không camera (giả lập)</Button></> : <div className="portal-review">{image ? <img src={image} alt="Ảnh đã kiểm tra liveness, chờ đối sánh danh tính giả lập" /> : <div className="portal-no-photo"><Camera size={36} /><span>Không có ảnh · kịch bản giả lập</span></div>}<div><h3>{step === 'verified' ? 'Kiểm tra giả lập đã đạt' : 'Kiểm tra ảnh trước khi tiếp tục'}</h3><p>{image ? `Liveness: ${liveness?.result} · REAL ${liveness?.real_score}. Chưa đối sánh danh tính thật.` : 'Kịch bản không camera: không gọi API liveness, không gửi ảnh.'}</p>{step === 'review' && <Field as="select" label={image ? 'Kịch bản đối sánh (giả lập)' : 'Kịch bản liveness / đối sánh'} value={result} onChange={e => setResult(e.target.value)} options={[{ value: 'pass', label: 'Giả lập đạt' }, ...(!image ? [{ value: 'fail', label: 'Giả lập không đạt liveness' }] : []), { value: 'mismatch', label: 'Giả lập không khớp khuôn mặt' }]} />}</div></div>}
    <ErrorNotice error={task.error} /><div className="ui-actions"><Button variant="secondary" disabled={task.busy} onClick={onCancel}>Hủy xác thực</Button>{step !== 'camera' && <Button variant="secondary" disabled={task.busy} onClick={() => { setStep('camera'); setImage(''); setLiveness(null); task.setError('') }}>Chụp lại</Button>}{step === 'review' && <Button busy={task.busy} onClick={() => task.run(verify)}>Chạy kiểm tra giả lập</Button>}{step === 'verified' && <Button busy={task.busy} onClick={() => task.run(async () => { await simulate(controller.current.signal); await onComplete({ image, liveness, simulated: true }) })}>Xác nhận kết quả demo</Button>}</div>
  </section>
}
