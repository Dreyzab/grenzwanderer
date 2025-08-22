import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import DialogModal from '@/shared/ui/DialogModal'
import AvailableQuestsModal from '@/shared/ui/AvailableQuestsModal'
import RegistrationPrompt from '@/shared/ui/RegistrationPrompt'
import CreateCharacterModal from '@/shared/ui/CreateCharacterModal'
import { useDialogActionCoordinator } from '@/features/quest-progress/model/actionCoordinator'
import { useDialogAutoplay } from '../model/useDialogAutoplay'
import { useRegistrationPrompt } from '../model/useRegistrationPrompt'
import { useAvailableQuests } from '../model/useAvailableQuests'
import { getQuestMeta } from '@/entities/quest/model/catalog'
import { useQuest } from '@/entities/quest/model/useQuest'
import logger from '@/shared/lib/logger'
import { useAuth } from '@clerk/clerk-react'
import { getDialogByKey } from '@/shared/storage/dialogs'
import { questsApi } from '@/shared/api/quests'

interface OverlaysCtxValue {
  onOpenDialog: (dialogKey: string) => void
  onBoardOpen: (boardKey: string, title: string) => Promise<void>
  onNpcOpen: (npcId: string, title: string) => Promise<void>
}

const OverlaysContext = createContext<OverlaysCtxValue | null>(null)

export function useOverlays() {
  const ctx = useContext(OverlaysContext)
  if (!ctx) throw new Error('useOverlays must be used within MapOverlaysProvider')
  return ctx
}

export function MapOverlaysProvider({ children }: { children?: React.ReactNode }) {
  const { handle: handleDialogAction } = useDialogActionCoordinator()
  const { activeDialog, setActiveDialog } = useDialogAutoplay()
  const { showRegistration, setShowRegistration } = useRegistrationPrompt()
  const quest = useQuest()
  const [availableModal, setAvailableModal] = useState<
    { title: string; ids?: import('@/entities/quest/model/ids').QuestId[]; items?: { id: import('@/entities/quest/model/ids').QuestId; type?: string; priority?: number }[] } | null
  >(null)
  const { openBoard, openNpc, refresh } = useAvailableQuests((val: { title: string; ids?: any[]; items?: any[] }) => setAvailableModal(val))
  const { isSignedIn, userId } = useAuth()
  const [showCharacterModal, setShowCharacterModal] = useState(false)

  const onOpenDialog = (_dialogKey: string) => {
    const d = getDialogByKey(_dialogKey as any)
    if (!d) {
      logger.warn?.('DIALOG', 'Dialog not found', { key: _dialogKey })
      return
    }
    setActiveDialog(d)
  }

  // Показ создания персонажа ТОЛЬКО после завершения стартового квеста и при входе через Clerk
  useEffect(() => {
    const completed = (quest.completedQuests ?? []).includes('delivery_and_dilemma' as any)
    logger.info?.('MAP', 'characterModal: check', { completed, isSignedIn, userId })
    if (!completed) return
    if (!isSignedIn) return
    let created = false
    try {
      const key = `characterCreated:${userId ?? 'anon'}`
      created = localStorage.getItem(key) === '1'
    } catch {}
    logger.info?.('MAP', 'characterModal: local flag', { created })
    if (!created) setShowCharacterModal(true)
  }, [quest.completedQuests, isSignedIn, userId])

  const ctxValue: OverlaysCtxValue = useMemo(() => ({
    onOpenDialog,
    onBoardOpen: openBoard,
    onNpcOpen: openNpc,
  }), [onOpenDialog, openBoard, openNpc])

  return (
    <OverlaysContext.Provider value={ctxValue}>
      {children}
      {Boolean(activeDialog) && (
        <DialogModal
          dialog={activeDialog as any}
          isOpen={Boolean(activeDialog)}
          onClose={() => setActiveDialog(null as any)}
          onAction={(actionKey, eventOutcomeKey) => handleDialogAction(actionKey, eventOutcomeKey)}
          isChoiceAllowed={() => true}
        />
      )}
      {availableModal && (
        <AvailableQuestsModal
          title={availableModal.title}
          questIds={availableModal.ids}
          items={availableModal.items}
          onClose={() => setAvailableModal(null)}
          onRefresh={async () => {
            try { await refresh() } catch (err) {
              logger.error?.('MAP', 'Ошибка обновления списка доступных квестов', err as any)
            }
          }}
          onAcceptAllDev={(ids) => {
            for (const id of ids) {
              const meta = getQuestMeta(id as any)
              if (meta) quest.startQuest(id as any, meta.startStep as any)
            }
            setAvailableModal(null)
          }}
        />
      )}
      {showRegistration && (
        <RegistrationPrompt
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
        />
      )}
      {showCharacterModal && (
        <CreateCharacterModal
          isOpen={showCharacterModal}
          onSubmit={async (nickname, avatarKey) => {
            try {
              await questsApi.finalizeRegistration(nickname, avatarKey)
              await questsApi.setPlayerPhase(1)
              try {
                const createdKey = `characterCreated:${userId ?? 'anon'}`
                localStorage.setItem(createdKey, '1')
              } catch (e) {
                logger.warn?.('MAP', 'failed to persist characterCreated flag', e as any)
              }
              setShowCharacterModal(false)
              setShowRegistration(false)
            } catch (e) {
              logger.error?.('MAP', 'finalizeRegistration failed', e as any)
            }
          }}
        />
      )}
    </OverlaysContext.Provider>
  )
}


