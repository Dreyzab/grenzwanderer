 
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './ui/MapWidget.css'
import DialogModal from '@/shared/ui/DialogModal'
import RegistrationPrompt from '../../shared/ui/RegistrationPrompt'
import AvailableQuestsModal from '@/shared/ui/AvailableQuestsModal'
import { useDialogActionCoordinator } from '@/features/quest-progress/model/actionCoordinator'
import { getQuestMeta } from '@/entities/quest/model/catalog'
 
 
import { useMapInstance } from './model/useMapInstance.ts'
import { useVisiblePoints } from './model/useVisiblePoints.ts'
import { useDialogAutoplay } from './model/useDialogAutoplay.ts'
import { useRegistrationPrompt } from './model/useRegistrationPrompt.ts'
import CreateCharacterModal from '@/shared/ui/CreateCharacterModal'
import { questsApi } from '@/shared/api/quests'
import { useAuth } from '@clerk/clerk-react'
import { useMarkers } from './model/useMarkers.tsx'
import { useQuest } from '@/entities/quest/model/useQuest'
import { getDialogByKey } from '@/shared/storage/dialogs'
import logger from '@/shared/lib/logger'
import { useAvailableQuests } from './model/useAvailableQuests.ts'
 

export function MapWidget() {
  const ref = useRef<HTMLDivElement>(null!)
  const mapRef = useMapInstance(ref)
  const hasAutoCenteredRef = useRef(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [availableModal, setAvailableModal] = useState<
    { title: string; ids?: import('@/entities/quest/model/ids').QuestId[]; items?: { id: import('@/entities/quest/model/ids').QuestId; type?: string; priority?: number }[] } | null
  >(null)
  const { handle: handleDialogAction } = useDialogActionCoordinator()
  const points = useVisiblePoints(mapRef)
  const { activeDialog, setActiveDialog } = useDialogAutoplay()
  const { showRegistration, setShowRegistration } = useRegistrationPrompt()
  const quest = useQuest()
  const { openBoard, openNpc, refresh } = useAvailableQuests((val: { title: string; ids?: any[]; items?: any[] }) => setAvailableModal(val))
  const { isSignedIn } = useAuth()
  const [showCharacterModal, setShowCharacterModal] = useState(false)

  // автофокус на первую видимую точку — задержка увеличена в 10 раз
  useEffect(() => {
    if (!mapRef.current || points.length === 0) return
    if (hasAutoCenteredRef.current) return
    let timer: any
    try {
      const p = points[0]
      timer = setTimeout(() => {
        try {
          const map = mapRef.current
          if ((map as any)?.isStyleLoaded?.()) {
            map?.easeTo({ center: [p.coordinates.lng, p.coordinates.lat], duration: 900 })
          } else {
            map?.once('load', () => {
              try { map?.easeTo({ center: [p.coordinates.lng, p.coordinates.lat], duration: 900 }) } catch {}
            })
          }
          hasAutoCenteredRef.current = true
        } catch {}
      }, 1500)
    } catch {}
    return () => { if (timer) clearTimeout(timer) }
  }, [points, mapRef])

  const handleBoardOpen = useCallback(async (boardKey: string, title: string) => {
    await openBoard(boardKey, title)
  }, [openBoard])
  const handleNpcOpen = useCallback(async (npcId: string, title: string) => {
    await openNpc(npcId, title)
  }, [openNpc])
  const handleOpenDialog = useCallback((dialogKey: string) => {
    const def = getDialogByKey(dialogKey)
    if (def) {
      setActiveDialog(def)
      setIsDialogOpen(true)
    }
  }, [])
  const interactions = useMemo(() => ({
    onBoardOpen: handleBoardOpen,
    onNpcOpen: handleNpcOpen,
    onOpenDialog: handleOpenDialog,
  }), [handleBoardOpen, handleNpcOpen, handleOpenDialog])

  // Определяем целевую точку по активному квесту
  const trackedTargetId = useMemo(() => {
    const step = quest.getStep('delivery_and_dilemma' as any)
    if (step === 'need_pickup_from_trader') return 'trader_camp'
    if (step === 'deliver_parts_to_craftsman' || step === 'return_to_craftsman') return 'workshop_center'
    if (step === 'go_to_anomaly') return 'northern_anomaly'
    return null
  }, [quest.activeQuests])

  useMarkers(mapRef, points, interactions, trackedTargetId as any)

  // После входа через Clerk — открываем модал создания персонажа, если запрошено флагом в URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const needCreate = params.get('createCharacter') === '1'
    if (isSignedIn && (showRegistration || needCreate)) {
      setShowCharacterModal(true)
      if (needCreate) {
        params.delete('createCharacter')
        const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, '')
        window.history.replaceState({}, '', next)
      }
    }
  }, [isSignedIn, showRegistration])

  // Автозапуск стартового диалога при первой загрузке карты и появлении стартового маркера
  useEffect(() => {
    if (points.length === 0) return
    // если уже открыт диалог или задан в URL — не трогаем
    if (isDialogOpen || activeDialog) return
    // Если квест ещё не стартовал — показываем стартовый диалог
    const step = quest.getStep('delivery_and_dilemma' as any)
    if (step === 'not_started') {
      const def = getDialogByKey('quest_start_dialog')
      if (def) {
        setActiveDialog(def)
        setIsDialogOpen(true)
      }
    }
  }, [points, isDialogOpen, activeDialog, quest.activeQuests])

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
      {showCharacterModal && (
        <CreateCharacterModal
          isOpen={showCharacterModal}
          onClose={() => setShowCharacterModal(false)}
          onSubmit={async (nickname, avatarKey) => {
            try {
              await questsApi.finalizeRegistration(nickname, avatarKey)
              await questsApi.setPlayerPhase(1)
              setShowCharacterModal(false)
              setShowRegistration(false)
            } catch {}
          }}
        />
      )}
    </>
  )
}

export default MapWidget


