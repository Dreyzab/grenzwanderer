import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { DialogDefinition } from '@/shared/dialogs/types'
import { getDialogByKey } from '@/shared/storage/dialogs'

export function useDialogAutoplay() {
  const location = useLocation()
  const [activeDialog, setActiveDialog] = useState<DialogDefinition | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const dlg = params.get('dialog')
    if (dlg) {
      const def = getDialogByKey(dlg)
      if (def) {
        setActiveDialog(def)
        const cleanUrl = location.pathname
        window.history.replaceState({}, '', cleanUrl)
      }
    }
  }, [location.search, location.pathname])

  return { activeDialog, setActiveDialog }
}


