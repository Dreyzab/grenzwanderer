import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import { MAP_CONFIG } from '@/shared/config/map'
import './ui/MapWidget.css'
import { mapPointApi } from '@/entities/map-point/api/local'
// import { MapMarker } from '@/entities/map-point/ui/MapMarker'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import { seedDemoMapPoints } from '@/entities/map-point/api/seed'
import { getDialogByKey } from '@/shared/storage/dialogs'
import { useLocation } from 'react-router-dom'
import type { DialogDefinition } from '@/shared/dialogs/types'
import DialogModal from '@/shared/ui/DialogModal'
import AvailableQuestsModal from '@/shared/ui/AvailableQuestsModal'
import { useQuest } from '@/entities/quest/model/useQuest'
import logger from '@/shared/lib/logger'
import { questsApi } from '@/shared/api/quests'
import { filterVisiblePoints } from '@/features/quest-progress/model/visibility'
import { useDialogActionCoordinator } from '@/features/quest-progress/model/actionCoordinator'
import { mapPointsApi } from '@/shared/api/mapPoints'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { useAuthStore } from '@/entities/auth/model/store'
import { decideDialogKey } from '@/features/quest-progress/model/decideDialogKey'
import { getQuestMeta } from '@/entities/quest/model/catalog'
import { sanitizeQuestItems } from '@/shared/lib/sanitizeQuests'

export function MapWidget() {
  const ref = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const location = useLocation()

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    if (!MAP_CONFIG.token) {
      // eslint-disable-next-line no-console
      console.warn('VITE_MAPBOX_TOKEN is not set')
      return
    }
    mapboxgl.accessToken = MAP_CONFIG.token
    const map = new mapboxgl.Map({
      container: ref.current,
      style: MAP_CONFIG.tileUrl,
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      bounds: MAP_CONFIG.bounds as any,
      maxZoom: MAP_CONFIG.maxZoom,
      minZoom: MAP_CONFIG.minZoom,
      hash: true,
    })
    map.addControl(new mapboxgl.NavigationControl())
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const [points, setPoints] = useState<VisibleMapPoint[]>([])
  const [activeDialog, setActiveDialog] = useState<DialogDefinition | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [availableModal, setAvailableModal] = useState<
    { title: string; ids?: string[]; items?: { id: string; type?: string; priority?: number }[] } | null
  >(null)
  const quest = useQuest()
  const { handle: handleDialogAction } = useDialogActionCoordinator()
  const { userId } = useAuthStore()

  useEffect(() => {
    ;(async () => {
      let stored: VisibleMapPoint[] = []
      let serverFiltered = false
      try {
        const serverPoints = (await mapPointsApi.listVisible({
          deviceId: userId ? undefined : getOrCreateDeviceId(),
          userId: userId ?? undefined,
        })) as any[]
        if (Array.isArray(serverPoints) && serverPoints.length > 0) {
          stored = serverPoints.map((sp) => ({
            id: sp.key,
            title: sp.title,
            description: sp.description ?? '',
            coordinates: sp.coordinates,
            type: sp.type ?? 'poi',
            isActive: sp.active,
            dialogKey: sp.dialogKey ?? '',
            questId: sp.questId ?? '',
            radius: sp.radius ?? 0,
            icon: sp.icon ?? '',
            isDiscovered: true,
          })) as VisibleMapPoint[]
          serverFiltered = true
        }
      } catch (e) {
        logger.info('MAP', 'Convex map_points fetch failed, fallback to local', e)
      }

      if (stored.length === 0 && import.meta.env.DEV) {
        await seedDemoMapPoints()
        const local = await mapPointApi.getPoints()
        stored = local.map((p) => ({ ...p, isDiscovered: true })) as VisibleMapPoint[]
      }

      let visible = stored
      if (!serverFiltered && import.meta.env.DEV) {
        const deliveryStep = quest.getStep('delivery_and_dilemma')
        const loyaltyStep = quest.activeQuests['loyalty_fjr']?.currentStep ?? null
        const waterStep = quest.activeQuests['water_crisis']?.currentStep ?? null
        const freedomStep = quest.activeQuests['freedom_spark']?.currentStep ?? null
        visible = filterVisiblePoints(stored, { deliveryStep, loyaltyStep, waterStep, freedomStep })
      }
      logger.info('MAP', 'Points total:', stored.length, 'visible:', visible.length)

      // Авто-фокус на следующую цель, чтобы пользователь видел новый маркер
      if (mapRef.current && visible.length > 0) {
        const p = visible[0]
        logger.info('MAP', 'Focus to', p.id, p.title, p.coordinates)
        try {
          mapRef.current.easeTo({ center: [p.coordinates.lng, p.coordinates.lat], duration: 500 })
        } catch {}
      }
      setPoints(visible)
    })()
    // обновлять при смене шага квеста
  }, [quest.activeQuests])

  // Автопоказ любого диалога по ключу: ?dialog=<key>
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const dlg = params.get('dialog')
    if (dlg) {
      const def = getDialogByKey(dlg)
      if (def) {
        setActiveDialog(def)
        setIsDialogOpen(true)
        // Сбрасываем query-параметр, чтобы не повторно открывать диалог при следующих монтированиях
        const cleanUrl = location.pathname
        window.history.replaceState({}, '', cleanUrl)
      }
    }
  }, [location.search])

  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current) return

    // cleanup old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const getColor = (type?: string) => {
      switch (type) {
        case 'quest_location':
          return '#d97706'
        case 'npc_spawn':
        case 'npc':
          return '#2563eb'
        case 'hidden_cache':
          return '#059669'
        case 'settlement':
          return '#8b5cf6'
        case 'anomaly':
          return '#dc2626'
        case 'danger_zone':
          return '#dc2626'
        case 'shelter':
          return '#22c55e'
        case 'shop':
          return '#10b981'
        default:
          return '#6b7280'
      }
    }

    points.forEach((p) => {
      const el = document.createElement('div')
      el.setAttribute('data-map-marker', '1')
      el.style.width = '18px'
      el.style.height = '18px'
      el.style.borderRadius = '50%'
      el.style.background = getColor(p.type)
      el.style.border = '2px solid #ffffff'
      el.style.boxShadow = '0 1px 6px rgba(0,0,0,0.35)'
      el.style.cursor = 'pointer'
      el.style.willChange = 'transform'

      const popup = new mapboxgl.Popup({
        offset: 22,
        closeButton: false,
        className: `popup-${p.type ?? 'poi'} ${(p.type ?? '').replace(/_/g, '-')}`,
        anchor: 'bottom',
        maxWidth: '320px',
      }).setHTML(`
        <div class="popup-content-wrapper">
          <strong class="popup-title">${p.title}</strong>
          ${p.description ? `<small class=\"popup-description\">${p.description}</small>` : ''}
          <div class="popup-type-indicator">${p.type ?? 'Точка интереса'}</div>
        </div>
      `)

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.coordinates.lng, p.coordinates.lat])
        .addTo(mapRef.current!)

      el.addEventListener('mouseenter', () => {
        marker.setPopup(popup)
        popup.addTo(mapRef.current!)
      })
      el.addEventListener('mouseleave', () => {
        popup.remove()
      })

      el.addEventListener('click', async () => {
        logger.info('MAP', 'Marker clicked', p.id, p.title, p.dialogKey)
        // Поддержка UI досок и NPC-хабов: показать доступные квесты (серверная фильтрация)
        try {
          if (p.id === 'fjr_board') {
            const available = await questsApi.getAvailableBoardQuests('fjr_board')
              if (Array.isArray(available)) {
              const sanitized = sanitizeQuestItems(available)
              if (sanitized.length > 0) {
                setAvailableModal({
                  title: 'Доска FJR — доступные квесты',
                  items: sanitized,
                })
              } else {
                // eslint-disable-next-line no-console
                console.warn('Invalid/empty quests list received for board')
              }
            }
          }
          if (p.id === 'fjr_office_start') {
            const availableNpc = await questsApi.getAvailableQuestsForNpc('hans')
              if (Array.isArray(availableNpc)) {
              const sanitized = sanitizeQuestItems(availableNpc)
              if (sanitized.length > 0) {
                setAvailableModal({
                  title: 'NPC Hans — доступные квесты',
                  items: sanitized,
                })
              } else {
                // eslint-disable-next-line no-console
                console.warn('Invalid/empty quests list received for NPC')
              }
            }
          }
            } catch (e) {
          logger.error?.('MAP', 'Ошибка получения списка доступных квестов', e as any)
        }
        const def = decideDialogKey(p, {
          deliveryStep: quest.getStep('delivery_and_dilemma'),
          loyaltyStep: quest.activeQuests['loyalty_fjr']?.currentStep ?? null,
          waterStep: quest.activeQuests['water_crisis']?.currentStep ?? null,
          freedomStep: quest.activeQuests['freedom_spark']?.currentStep ?? null,
        })
        if (!def) return
        logger.info('MAP', 'Open dialog', def.dialogKey)
        if (def) {
          setActiveDialog(def)
          setIsDialogOpen(true)
        }
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [points])

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
          onRefresh={async () => {
            try {
              if (availableModal.title.includes('FJR')) {
                const available = await questsApi.getAvailableBoardQuests('fjr_board')
                if (Array.isArray(available)) {
                  const sanitized = sanitizeQuestItems(available)
                  if (sanitized.length > 0) {
                    setAvailableModal({
                      title: 'Доска FJR — доступные квесты',
                      items: sanitized,
                    })
                  }
                }
              } else {
                const availableNpc = await questsApi.getAvailableQuestsForNpc('hans')
                if (Array.isArray(availableNpc)) {
                  const sanitized = sanitizeQuestItems(availableNpc)
                  if (sanitized.length > 0) {
                    setAvailableModal({
                      title: 'NPC Hans — доступные квесты',
                      items: sanitized,
                    })
                  }
                }
              }
            } catch (err) {
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
    </>
  )
}

export default MapWidget


