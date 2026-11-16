import { useEffect, useId, useRef } from 'react'
import { AlertCircle, CheckCircle2, Info, LoaderCircle, Search, X } from 'lucide-react'

export function Button({ variant = 'primary', icon: Icon, busy = false, disabled, children, className = '', type = 'button', ...props }) {
  return <button {...props} type={type} disabled={disabled || busy} aria-busy={busy || undefined} className={`ui-button ui-button--${variant} ${className}`}>
    {busy ? <LoaderCircle className="ui-spin" size={18} aria-hidden="true" /> : Icon && <Icon size={18} aria-hidden="true" />}
    {children}
  </button>
}

export function IconButton({ label, icon: Icon, ...props }) {
  return <Button {...props} variant={props.variant || 'quiet'} icon={Icon} aria-label={label} title={label} className="ui-icon-button" />
}

export function Field({ label, hint, error, as = 'input', options = [], id: providedId, required, className = '', ...props }) {
  const generatedId = useId()
  const id = providedId || generatedId
  const Control = as
  const description = error || hint
  return <div className={`ui-field ${className}`}>
    <label htmlFor={id}>{label}{required && <span className="ui-required"> *</span>}</label>
    <Control {...props} id={id} required={required} data-ui-autofocus={props.autoFocus || undefined} className="ui-input" aria-invalid={error ? true : undefined} aria-describedby={description ? `${id}-description` : undefined}>
      {as === 'select' ? options.map(option => <option key={option.value} value={option.value}>{option.label}</option>) : undefined}
    </Control>
    {description && <p id={`${id}-description`} className={error ? 'ui-field-error' : 'ui-hint'}>{description}</p>}
  </div>
}

export function SearchField({ label = 'Tìm kiếm', ...props }) {
  const id = useId()
  return <div className="ui-search"><label className="ui-sr-only" htmlFor={id}>{label}</label><Search size={18} aria-hidden="true" /><input {...props} id={id} type="search" className="ui-input" placeholder={props.placeholder || label} /></div>
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`ui-badge ui-badge--${tone}`}><span aria-hidden="true" />{children}</span>
}

export function Notice({ tone = 'info', title, children, onDismiss }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'danger' || tone === 'warning' ? AlertCircle : Info
  return <div className={`ui-notice ui-notice--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
    <Icon size={20} aria-hidden="true" /><div>{title && <strong>{title}</strong>}{children && <p>{children}</p>}</div>
    {onDismiss && <IconButton label="Đóng thông báo" icon={X} onClick={onDismiss} />}
  </div>
}

export function EmptyState({ title, children, action }) {
  return <div className="ui-empty"><Search size={26} aria-hidden="true" /><h3>{title}</h3><p>{children}</p>{action}</div>
}

export function LoadingState({ label = 'Đang tải dữ liệu…' }) {
  return <div className="ui-loading" role="status"><LoaderCircle size={22} className="ui-spin" aria-hidden="true" /><span>{label}</span></div>
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <div className="ui-page-header"><div>{eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="ui-description">{description}</p>}</div>{actions && <div className="ui-actions">{actions}</div>}</div>
}

// Native modal makes the background inert; wrap Tab at the boundaries explicitly.
export function Dialog({ open, onClose, title, description, children, footer }) {
  const ref = useRef(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector('[data-ui-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [open])
  function handleKeyDown(event) {
    if (event.key !== 'Tab') return
    const focusable = [...ref.current.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
      .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  return <dialog ref={ref} className="ui-dialog" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} onKeyDown={handleKeyDown} onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="ui-dialog-heading"><div><h2 id={`${id}-title`}>{title}</h2>{description && <p id={`${id}-description`}>{description}</p>}</div><IconButton icon={X} label="Đóng hộp thoại" onClick={onClose} /></div>
    <div className="ui-dialog-body">{children}</div>
    {footer && <div className="ui-dialog-footer">{footer}</div>}
  </dialog>
}

export function DataTable({ caption, columns, rows, rowKey = 'id', empty }) {
  if (!rows.length) return empty || <EmptyState title="Chưa có dữ liệu">Thêm bản ghi để bắt đầu.</EmptyState>
  return <div className="ui-table-wrap"><table className="ui-table" role="table"><caption className="ui-sr-only">{caption}</caption><thead><tr role="row">{columns.map(column => <th key={column.key} scope="col" role="columnheader">{column.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row[rowKey]} role="row">{columns.map((column, index) => <td key={column.key} role="cell" data-label={column.label} className={index === 0 ? 'ui-cell-main' : ''}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>
}
