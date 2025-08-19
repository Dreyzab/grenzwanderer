import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { DialogDefinition } from '@/shared/dialogs/types'
import { getDialogByKey } from '@/shared/storage/dialogs'
import { qrApiConvex } from '@/shared/api/qr/convex'

export function useDialogAutoplay() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeDialog, setActiveDialog] = useState<DialogDefinition | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qr = params.get('qr')
    if (qr) {
      ;(async () => {
        try {
          const res = await qrApiConvex.resolvePoint(qr)
          if (res.status === 'ok') {
            if (res.nextAction === 'start_intro_vn') {
              navigate('/novel')
            } else if (res.point.dialogKey) {
              const def = getDialogByKey(res.point.dialogKey)
              if (def) setActiveDialog(def)
            }
          }
        } catch {}
        const cleanUrl = location.pathname
        navigate(cleanUrl, { replace: true })
      })()
      return
    }

    const dlg = params.get('dialog')
    if (dlg) {
      const def = getDialogByKey(dlg)
      if (def) {
        setActiveDialog(def)
        const cleanUrl = location.pathname
        navigate(cleanUrl, { replace: true })
      }
    }
  }, [location.search, location.pathname, navigate])

  return { activeDialog, setActiveDialog }
}


