import { useMemo, useState } from 'react'
import type { DialogDefinition, DialogNode } from '@/shared/dialogs/types'
import logger from '@/shared/lib/logger'

interface DialogModalProps {
  dialog: DialogDefinition
  isOpen: boolean
  onClose: () => void
  onAction?: (actionKey: string, eventOutcomeKey?: string) => void
}

export function DialogModal({ dialog, isOpen, onClose, onAction }: DialogModalProps) {
  const [currentNodeKey, setCurrentNodeKey] = useState<string>(dialog.startNodeKey)

  const node: DialogNode | undefined = useMemo(() => dialog.nodes[currentNodeKey], [dialog, currentNodeKey])

  if (!isOpen) return null
  if (!node) return null

  const handleChoice = (nextNodeKey: string | null, action?: string, eventOutcomeKey?: string) => {
    logger.info('DIALOG', 'Choice selected', { action, nextNodeKey, eventOutcomeKey })
    if (action && onAction) onAction(action, eventOutcomeKey)
    if (nextNodeKey) {
      setCurrentNodeKey(nextNodeKey)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70">
      <div
        className="relative w-[min(920px,90vw)] max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
      >
        {dialog.backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${dialog.backgroundImage})` }}
          />
        )}
        <div className="relative p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">{dialog.title}</h2>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center px-2 py-1 text-zinc-300 hover:text-white rounded-md hover:bg-white/10"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          <div className="text-sm text-zinc-400">{node.speakerKey}</div>

          <div className="text-base sm:text-lg text-zinc-100 leading-relaxed whitespace-pre-wrap">
            {node.text}
          </div>

          <div className="pt-2 grid gap-2">
            {node.choices.map((c, idx) => (
              <button
                key={idx}
                onClick={() => handleChoice(c.nextNodeKey, c.action, c.eventOutcomeKey)}
                className="text-left w-full bg-zinc-800/70 hover:bg-zinc-700/70 text-zinc-100 border border-zinc-700 rounded-md px-4 py-2 transition-colors"
              >
                {c.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DialogModal


