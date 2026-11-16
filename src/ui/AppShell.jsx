import { ArrowUpRight } from 'lucide-react'
import logo from '../assets/android/ic_app_logo.png'

export function AppShell({ items, activeId, children, brandSubtitle = 'Thư viện giao diện', navigationLabel = 'NỀN TẢNG WEB', context = 'Thiết kế & phát triển', badge = 'Nội bộ nhóm', footer }) {
  return <div className="aegis-ui">
    <a className="ui-skip" href="#ui-main">Đi đến nội dung</a>
    <aside className="ui-sidebar">
      <a href={items[0]?.href || '#/ui-kit'} className="ui-brand"><img src={logo} alt="" /><span>IriAegis<small>{brandSubtitle}</small></span></a>
      <div className="ui-sidebar-label">{navigationLabel}</div>
      <nav aria-label="Thư viện giao diện">{items.map(({ id, href, label, icon: Icon }) => <a key={id} href={href} className={activeId === id ? 'is-active' : ''} aria-current={activeId === id ? 'page' : undefined}><Icon size={19} aria-hidden="true" /><span>{label}</span></a>)}</nav>
      <div className="ui-sidebar-bottom">{footer === undefined ? <><a href="#/camera">Mở prototype camera<ArrowUpRight size={17} aria-hidden="true" /></a><p>Nhóm 5 · Bản nền 0.1</p></> : footer}</div>
    </aside>
    <div className="ui-workarea"><header className="ui-topbar"><span>{context} <span aria-hidden="true">/</span> <strong>{items.find(item => item.id === activeId)?.label}</strong></span>{badge && <span className="ui-internal">{badge}</span>}</header><main id="ui-main" tabIndex={-1} className="ui-main">{children}</main></div>
  </div>
}
