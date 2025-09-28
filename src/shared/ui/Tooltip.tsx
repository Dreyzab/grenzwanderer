import { useEffect, useRef, useState, type ReactNode, type ReactElement } from 'react'
import { createPortal } from 'react-dom'

export function Tooltip({ content, children }: { content: ReactNode; children: ReactElement }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function onMove(e: MouseEvent) { setPos({ x: e.clientX + 12, y: e.clientY + 12 }) }
    if (open) window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [open])
  return (
    <div ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} style={{ display: 'inline-block' }}>
      {children}
      {open ? createPortal(
        <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}>
          <div className="max-w-xs rounded bg-neutral-900/95 border border-neutral-700 px-2 py-1 text-xs text-neutral-100 shadow-lg">
            {content}
          </div>
        </div>, document.body)
        : null}
    </div>
  )
}
