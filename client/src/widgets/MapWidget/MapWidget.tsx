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
import { useQuest } from '@/entities/quest/model/useQuest'
import logger from '@/shared/lib/logger'

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
  const quest = useQuest()

  useEffect(() => {
    ;(async () => {
      await seedDemoMapPoints()
      const stored = await mapPointApi.getPoints()
      const step = quest.getStep('delivery_and_dilemma')
      logger.info('MAP', 'Current quest step:', step)
      const filtered = stored.filter((p) => {
        // Показываем точки в зависимости от текущего шага
        if (step === 'not_started') return p.dialogKey === 'quest_start_dialog'
        if (step === 'need_pickup_from_trader') return p.dialogKey === 'trader_meeting_dialog'
        if (step === 'deliver_parts_to_craftsman' || step === 'artifact_offer')
          return p.dialogKey === 'craftsman_meeting_dialog'
        if (step === 'go_to_anomaly') return p.dialogKey === 'anomaly_exploration_dialog'
        if (step === 'return_to_craftsman') return p.dialogKey === 'craftsman_meeting_dialog'
        if (step === 'completed') return false
        return true
      })
      logger.info(
        'MAP',
        'Points total:',
        stored.length,
        'visible:',
        filtered.length,
        'ids:',
        filtered.map((p) => p.id),
      )

      // Авто-фокус на следующую цель, чтобы пользователь видел новый маркер
      if (mapRef.current && filtered.length > 0) {
        const p = filtered[0]
        logger.info('MAP', 'Focus to', p.id, p.title, p.coordinates)
        try {
          mapRef.current.easeTo({ center: [p.coordinates.lng, p.coordinates.lat], duration: 500 })
        } catch {}
      }
      setPoints(
        filtered.map((p) => ({
          ...p,
          isDiscovered: true,
        })) as VisibleMapPoint[],
      )
    })()
    // обновлять при смене шага квеста
  }, [quest.activeQuests])

  // Автопоказ диалога, если в query есть ?dialog=quest_start_dialog
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const dlg = params.get('dialog')
    if (dlg) {
      const def = getDialogByKey(dlg)
      if (def) {
        setActiveDialog(def)
        setIsDialogOpen(true)
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

      el.addEventListener('click', () => {
        logger.info('MAP', 'Marker clicked', p.id, p.title, p.dialogKey)
        const step = quest.getStep('delivery_and_dilemma')
        let dialogKey = p.dialogKey

        // Динамический выбор диалога в зависимости от шага квеста
        if (p.dialogKey === 'craftsman_meeting_dialog') {
          if (step === 'return_to_craftsman') {
            dialogKey = 'quest_complete_with_artifact_dialog'
          }
        }

        if (!dialogKey) return
        logger.info('MAP', 'Open dialog', dialogKey, 'for step', step)
        const def = getDialogByKey(dialogKey)
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
          onAction={(actionKey) => {
            // Маппинг действий диалогов на простую локальную логику прогресса
            switch (actionKey) {
              case 'start_delivery_quest':
                quest.startQuest('delivery_and_dilemma', 'need_pickup_from_trader')
                break
              case 'take_parts':
                quest.advanceQuest('delivery_and_dilemma', 'deliver_parts_to_craftsman')
                break
              case 'deliver_parts':
                // после доставки появляется ветка с артефактом
                quest.advanceQuest('delivery_and_dilemma', 'artifact_offer')
                break
              case 'accept_artifact_quest':
                quest.advanceQuest('delivery_and_dilemma', 'go_to_anomaly')
                break
              case 'return_to_craftsman':
                quest.advanceQuest('delivery_and_dilemma', 'return_to_craftsman')
                break
              case 'complete_delivery_quest':
              case 'complete_delivery_quest_with_artifact':
                quest.completeQuest('delivery_and_dilemma')
                break
              default:
                break
            }
          }}
        />
      )}
    </>
  )
}

export default MapWidget


