import { useState } from 'react'
import type { DialogDefinition } from '@/shared/dialogs/types'

export function useDialogAutoplay() {
  const [activeDialog, setActiveDialog] = useState<DialogDefinition | null>(null)
  return { activeDialog, setActiveDialog }
}


