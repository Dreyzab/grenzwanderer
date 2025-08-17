import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { createRoot, type Root } from 'react-dom/client'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import logger from '@/shared/lib/logger'
import { decideDialogKey } from '@/features/quest-progress/model/decideDialogKey'
import { useQuest } from '@/entities/quest/model/useQuest'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { MapMarker } from '@/entities/map-point/ui/MapMarker'
import { MapPointTooltip } from '@/entities/map-point/ui/MapPointTooltip'
import { api } from '../../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'

export interface MarkerInteractions {
  onBoardOpen: (boardKey: string, title: string) => Promise<void>
  onNpcOpen: (npcId: string, title: string) => Promise<void>
  onOpenDialog: (dialogKey: string) => void
}

export function useMarkers(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  points: VisibleMapPoint[],
  interactions: MarkerInteractions,
) {
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const cleanupsRef = useRef<(() => void)[]>([])
  const quest = useQuest()
  const phase = useProgressionStore((s) => s.phase)

  const scheduleUnmount = (root: Root | null) => {
    if (!root) return
    // Избегаем синхронного unmount во время рендера React
    setTimeout(() => {
      try {
        root.unmount()
      } catch {}
    }, 0)
  }

  useEffect(() => {
    if (!mapRef.current) return

    // cleanup previous
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    cleanupsRef.current.forEach((fn) => fn())
    cleanupsRef.current = []

    points.forEach((p) => {
      const el = document.createElement('div')
      el.setAttribute('data-map-marker', '1')
      el.style.cursor = 'pointer'
      el.style.willChange = 'transform'

      // Render marker via React
      const markerRoot = createRoot(el)
      const onMarkerClick = async () => {
        logger.info('MAP', 'Marker clicked', p.id, p.title, p.dialogKey)
        // Приоритет: явные серверные eventKey/dialogKey — через server action
        if (p.eventKey) {
          try {
            const deviceId = getOrCreateDeviceId()
            const res = (await convexClient.action((api as any).actions.resolveEventKey, {
              eventKey: p.eventKey,
              deviceId,
            })) as { type: string; [k: string]: any }
            if (res?.type === 'open_board') {
              await interactions.onBoardOpen(res.boardKey, `${p.title} — доступные квесты`)
              return
            }
            if (res?.type === 'open_npc') {
              await interactions.onNpcOpen(res.npcId, `${p.title} — доступные квесты`)
              return
            }
            if (res?.type === 'quest_started' && p.dialogKey) {
              interactions.onOpenDialog(p.dialogKey)
              return
            }
          } catch {}
        }
        // Используем npcId прямо из сервера, без клиентских маппингов
        if (p.type === 'board') await interactions.onBoardOpen(p.id, `${p.title} — доступные квесты`)
        if ((p.type === 'npc' || p.type === 'npc_spawn') && p.npcId) await interactions.onNpcOpen(p.npcId, `${p.title} — доступные квесты`)
        // Если точка содержит явный dialogKey (с сервера через биндинг) — открываем его напрямую
        if (p.dialogKey) {
          interactions.onOpenDialog(p.dialogKey)
          return
        }
        // Старт квеста по eventKey обрабатывается через server action выше
        const def = decideDialogKey(p, {
          deliveryStep: quest.getStep('delivery_and_dilemma'),
          loyaltyStep: quest.activeQuests['loyalty_fjr']?.currentStep ?? null,
          waterStep: quest.activeQuests['water_crisis']?.currentStep ?? null,
          freedomStep: quest.activeQuests['freedom_spark']?.currentStep ?? null,
          phase,
        })
        if (!def) return
        interactions.onOpenDialog(def.dialogKey)
      }
      markerRoot.render(<MapMarker point={p} onClick={onMarkerClick} />)

      // Tooltip via React
      const tooltipEl = document.createElement('div')
      const tooltipRoot = createRoot(tooltipEl)
      tooltipRoot.render(<MapPointTooltip point={p} />)
      const popup = new mapboxgl.Popup({
        offset: 22,
        closeButton: false,
        className: `popup-${p.type ?? 'poi'} ${(p.type ?? '').replace(/_/g, '-')}`,
        anchor: 'bottom',
        maxWidth: '320px',
      }).setDOMContent(tooltipEl)

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

      markersRef.current.push(marker)

      // Cleanup for react roots and popup (асинхронно, чтобы избежать sync unmount в рендере)
      cleanupsRef.current.push(() => {
        scheduleUnmount(markerRoot)
        scheduleUnmount(tooltipRoot)
        try { popup.remove() } catch {}
      })
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      cleanupsRef.current.forEach((fn) => fn())
      cleanupsRef.current = []
    }
  }, [points, mapRef, interactions, quest.activeQuests, phase])
}


