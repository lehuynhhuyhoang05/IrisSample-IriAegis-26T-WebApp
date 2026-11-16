import { BookOpen, Camera, Layers, Palette, Users } from '../ui/icons'
import { AppShell } from '../ui'
import StudentsExample from './StudentsExample.jsx'
import ComponentsExample from './ComponentsExample.jsx'
import Foundation from './Foundation.jsx'
import Guide from './Guide.jsx'
import CameraExample from './CameraExample.jsx'
import '../ui/tokens.css'
import '../ui/ui.css'

const items = [
  { id: 'example', href: '#/ui-kit', label: 'Màn hình mẫu', icon: Users },
  { id: 'components', href: '#/ui-kit/components', label: 'Component', icon: Layers },
  { id: 'camera', href: '#/ui-kit/camera', label: 'Camera', icon: Camera },
  { id: 'foundation', href: '#/ui-kit/foundation', label: 'Quy chuẩn', icon: Palette },
  { id: 'guide', href: '#/ui-kit/guide', label: 'Hướng dẫn', icon: BookOpen },
]

export default function Showcase({ path }) {
  const active = items.find(item => item.href === path)?.id || 'example'
  return <AppShell items={items} activeId={active}>
    {active === 'example' && <StudentsExample />}
    {active === 'components' && <ComponentsExample />}
    {active === 'camera' && <CameraExample />}
    {active === 'foundation' && <Foundation />}
    {active === 'guide' && <Guide />}
  </AppShell>
}
