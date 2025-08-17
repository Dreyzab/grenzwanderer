 
import { useEffect, useRef, useState } from 'react'
import './ui/MapWidget.css'
import DialogModal from '@/shared/ui/DialogModal'
import RegistrationPrompt from '../../shared/ui/RegistrationPrompt'
import AvailableQuestsModal from '@/shared/ui/AvailableQuestsModal'
import { useDialogActionCoordinator } from '@/features/quest-progress/model/actionCoordinator'
import { getQuestMeta } from '@/entities/quest/model/catalog'
 
 
import { useMapInstance } from './model/useMapInstance'
import { useVisiblePoints } from './model/useVisiblePoints'
import { useDialogAutoplay } from './model/useDialogAutoplay'
import { useRegistrationPrompt } from './model/useRegistrationPrompt'
import { useMarkers } from './model/useMarkers'
import { useQuest } from '@/entities/quest/model/useQuest'
import { getDialogByKey } from '@/shared/storage/dialogs'
import logger from '@/shared/lib/logger'
import { useAvailableQuests } from './model/useAvailableQuests'
 

export function MapWidget() {
  const ref = useRef<HTMLDivElement>(null!)
  const mapRef = useMapInstance(ref)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [availableModal, setAvailableModal] = useState<
    { title: string; ids?: import('@/entities/quest/model/ids').QuestId[]; items?: { id: import('@/entities/quest/model/ids').QuestId; type?: string; priority?: number }[] } | null
  >(null)
  const { handle: handleDialogAction } = useDialogActionCoordinator()
  const points = useVisiblePoints(mapRef)
  const { activeDialog, setActiveDialog } = useDialogAutoplay()
  const { showRegistration, setShowRegistration } = useRegistrationPrompt()
  const quest = useQuest()
  const { openBoard, openNpc, refresh } = useAvailableQuests((val) => setAvailableModal(val))

  // автофокус на первую видимую точку
  useEffect(() => {
    if (mapRef.current && points.length > 0) {
      try {
        const p = points[0]
        mapRef.current.easeTo({ center: [p.coordinates.lng, p.coordinates.lat], duration: 500 })
      } catch {}
    }
  }, [points, mapRef])

  useMarkers(mapRef, points, {
    onBoardOpen: async (boardKey, title) => { await openBoard(boardKey, title) },
    onNpcOpen: async (npcId, title) => { await openNpc(npcId, title) },
    onOpenDialog: (dialogKey) => {
      const def = getDialogByKey(dialogKey)
      if (def) {
        setActiveDialog(def)
        setIsDialogOpen(true)
      }
    },
  })

  return (
    <>
      <div ref={ref} className="mapbox-container w-full h-[70vh] rounded-lg overflow-hidden" />
      {isDialogOpen && activeDialog && (
        <DialogModal
          dialog={activeDialog}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAction={(actionKey, eventOutcomeKey) => {
            handleDialogAction(actionKey, eventOutcomeKey)
          }}
          isChoiceAllowed={(choice) => {
            // Пока допускаем все варианты; при необходимости можно импортировать conditions
            return !choice.condition || true
          }}
        />
      )}
      {availableModal && (
        <AvailableQuestsModal
          title={availableModal.title}
          questIds={availableModal.ids}
          items={availableModal.items}
          onClose={() => setAvailableModal(null)}
          onRefresh={async () => { try { await refresh() } catch (err) { logger.error?.('MAP', 'Ошибка обновления списка доступных квестов', err as any) } }}
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
    </>
  )
}

export default MapWidget


