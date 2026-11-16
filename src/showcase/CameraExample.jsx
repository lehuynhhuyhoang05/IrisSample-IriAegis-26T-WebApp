import { useMemo, useState } from 'react'
import { Field, Notice, PageHeader } from '../ui'
import { FaceCamera, createGroup4PhotoProvider, createSimulatedProvider } from '../camera'

const OPTIONS = [
  { value: 'sim-pass', label: 'Giả lập: đạt' },
  { value: 'sim-fail', label: 'Giả lập: không đạt' },
  { value: 'sim-error', label: 'Giả lập: lỗi kết nối' },
  { value: 'sim-stream', label: 'Giả lập: kiểm tra trên stream (camera còn mở)' },
  { value: 'none', label: 'Không kiểm tra liveness (chỉ chụp ảnh)' },
  { value: 'group4', label: 'Dịch vụ Nhóm 4 thật (gửi ảnh)' },
]

function providerFor(option) {
  if (option === 'none') return null
  if (option === 'group4') return createGroup4PhotoProvider()
  if (option === 'sim-stream') return createSimulatedProvider({ scenario: 'pass', mode: 'stream' })
  return createSimulatedProvider({ scenario: option.replace('sim-', '') })
}

const time = () => new Date().toLocaleTimeString('vi-VN')

export default function CameraExample() {
  const [option, setOption] = useState('sim-pass')
  const [events, setEvents] = useState([])
  const provider = useMemo(() => providerFor(option), [option])
  const log = text => setEvents(rows => [{ id: crypto.randomUUID?.() || String(Math.random()), text: `${time()} · ${text}` }, ...rows].slice(0, 8))

  return <>
    <PageHeader eyebrow="Camera dùng chung" title="FaceCamera" description="Mở, chụp, xem lại, chụp lại và trả ảnh qua callback. Chọn kịch bản liveness để thử các trạng thái." />
    <div className="camera-example">
      <div className="camera-example__controls">
        <Field as="select" label="Kịch bản liveness" value={option} onChange={event => { setOption(event.target.value); setEvents([]) }} options={OPTIONS} />
        {option.startsWith('sim') && <Notice tone="warning" title="Kết quả giả lập">Không phân tích ảnh và không gửi ảnh đi. Không dùng làm bằng chứng xác thực.</Notice>}
        {option === 'group4' && <Notice tone="info" title="Cần dịch vụ Nhóm 4">Ảnh được gửi tới /liveness-api. Luồng đầy đủ (chớp mắt, quay đầu, flash) vẫn nằm ở trang Camera.</Notice>}
        <section aria-label="Callback đã gọi">
          <h3 className="camera-example__title">Callback</h3>
          {events.length ? <ol className="camera-example__log">{events.map(row => <li key={row.id}>{row.text}</li>)}</ol> : <p className="ui-hint">Chưa có callback nào.</p>}
        </section>
      </div>
      <FaceCamera
        key={option}
        liveness={provider}
        onCapture={result => log(`onCapture: ${result.width}×${result.height}, ${Math.round(result.blob.size / 1024)} KB, liveness ${result.liveness ? `${result.liveness.verdict}${result.liveness.simulated ? ' (giả lập)' : ''}` : 'không kiểm tra'}`)}
        onRetake={() => log('onRetake')}
        onCancel={() => log('onCancel')}
      />
    </div>
  </>
}
