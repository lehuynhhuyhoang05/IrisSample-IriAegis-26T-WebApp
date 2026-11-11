import { BookOpen, Layers, Palette, Users } from 'lucide-react'
import { AppShell } from '../ui'
import StudentsExample from './StudentsExample.jsx'
import ComponentsExample from './ComponentsExample.jsx'
import Foundation from './Foundation.jsx'
import Guide from './Guide.jsx'
import '../ui/tokens.css'
import '../ui/ui.css'

const items = [
  { id: 'example', href: '#/ui-kit', label: 'Màn hình mẫu', icon: Users },
  { id: 'components', href: '#/ui-kit/components', label: 'Component', icon: Layers },
  { id: 'foundation', href: '#/ui-kit/foundation', label: 'Quy chuẩn', icon: Palette },
  { id: 'guide', href: '#/ui-kit/guide', label: 'Hướng dẫn', icon: BookOpen },
]

export default function Showcase({ path }) {
  const active = items.find(item => item.href === path)?.id || 'example'
  return <AppShell items={items} activeId={active}>
    {active === 'example' && <StudentsExample />}
    {active === 'components' && <ComponentsExample />}
    {active === 'foundation' && <Foundation />}
    {active === 'guide' && <Guide />}
  </AppShell>
}
