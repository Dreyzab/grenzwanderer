import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { createRoot, type Root } from 'react-dom/client'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import logger from '@/shared/lib/logger'
import { decideDialogKey } from '@/features/quest-progress/model/decideDialogKey'
import { useQuest } from '@/entities/quest/model/useQuest'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import { api } from '../../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'
import { getOrCreateDeviceId } from '@/shared/lib/deviceId'
import { MapPointTooltip } from '@/entities/map-point/ui/MapPointTooltip'

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
  const quest = useQuest()
  const phase = useProgressionStore((s) => s.phase)
  const rafRef = useRef<number | null>(null)
  const addedHandlersRef = useRef(false)
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null)
  const hoverTooltipRootRef = useRef<Root | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const initLayersIfNeeded = () => {
      if (!map.getSource('mappoints')) {
        map.addSource('mappoints', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          promoteId: 'id',
        } as any)
        map.addLayer({
          id: 'mappoints',
          type: 'circle',
          source: 'mappoints',
          paint: {
            'circle-radius': 7,
            'circle-color': [
              'match',
              ['get', 'type'],
              'settlement', '#7c3aed',
              'npc', '#2563eb',
              'board', '#16a34a',
              'anomaly', '#ef4444',
              '#52525b',
            ],
            'circle-stroke-color': '#111827',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.95,
          },
        })
        map.addLayer({
          id: 'tracked-glow',
          type: 'circle',
          source: 'mappoints',
          paint: {
            'circle-radius': 10,
            'circle-color': 'rgba(255,215,0,0.55)',
            'circle-blur': 0.4,
            'circle-opacity': 0.9,
          },
        })
      }
    }

    const updateDataAndFilters = () => {
      const source = map.getSource('mappoints') as mapboxgl.GeoJSONSource
      if (!source) return
      const features = points.map((p) => ({
        type: 'Feature',
        id: p.id,
        properties: {
          id: p.id,
          title: p.title,
          type: p.type,
          dialogKey: p.dialogKey ?? null,
          eventKey: p.eventKey ?? null,
          npcId: p.npcId ?? null,
          description: p.description ?? '',
          factionId: (p as any).factionId ?? null,
          isActive: p.isActive,
          isDiscovered: p.isDiscovered ?? true,
          lat: p.coordinates.lat,
          lng: p.coordinates.lng,
        },
        geometry: { type: 'Point', coordinates: [p.coordinates.lng, p.coordinates.lat] },
      }))
      source.setData({ type: 'FeatureCollection', features } as any)

      const resolveVisibleIds = (): Set<string> => {
        const ids = new Set<string>()
        const delivery = quest.getStep('delivery_and_dilemma' as any)
        for (const p of points) {
          if (p.id === 'settlement_center' && (phase ?? 1) >= 1) ids.add(p.id)
          if (p.id === 'trader_camp' && (delivery === 'need_pickup_from_trader' || delivery === 'deliver_parts_to_craftsman')) ids.add(p.id)
          if (p.id === 'workshop_center' && (delivery === 'deliver_parts_to_craftsman' || delivery === 'return_to_craftsman')) ids.add(p.id)
          if (p.id === 'northern_anomaly' && delivery === 'go_to_anomaly') ids.add(p.id)
          if ((p.id === 'fjr_board' || p.id === 'fjr_office_start') && (phase ?? 1) >= 1) ids.add(p.id)
        }
        if (ids.size === 0) {
          const start = points.find((x) => x.id === 'settlement_center')
          if (start) ids.add(start.id)
        }
        return ids
      }
      const visible = Array.from(resolveVisibleIds())
      if (map.getLayer('mappoints')) {
        map.setFilter('mappoints', ['in', ['get', 'id'], ['literal', visible]] as any)
      }

      const resolveTrackedTargetPointId = (): string | undefined => {
        const tracked = quest.trackedQuestId as any
        if (!tracked) return undefined
        if (tracked === 'delivery_and_dilemma') {
          const step = quest.getStep('delivery_and_dilemma' as any)
          if (step === 'need_pickup_from_trader') return 'trader_camp'
          if (step === 'deliver_parts_to_craftsman' || step === 'return_to_craftsman') return 'workshop_center'
          if (step === 'go_to_anomaly') return 'northern_anomaly'
          return 'settlement_center'
        }
        return undefined
      }
      const trackedTargetId = resolveTrackedTargetPointId()
      if (map.getLayer('tracked-glow')) {
        map.setFilter('tracked-glow', trackedTargetId ? (['==', ['get', 'id'], trackedTargetId] as any) : (['==', ['get', 'id'], '__none__'] as any))
      }
    }

    const ensureLayerHandlers = () => {
      if (addedHandlersRef.current) return
      addedHandlersRef.current = true
      map.on('click', 'mappoints', async (e: any) => {
        const f = e.features?.[0]
        if (!f) return
        const p: any = f.properties || {}
        logger.info('MAP', 'Point clicked', p.id, p.title, p.dialogKey)
        // Жёсткий гейт завершения доставки: при возврате к Дитеру показываем финальный диалог с артефактом
        const deliveryStepNow = quest.getStep('delivery_and_dilemma')
        if (p.id === 'workshop_center' && deliveryStepNow === 'return_to_craftsman') {
          return interactions.onOpenDialog('quest_complete_with_artifact_dialog')
        }
        if (p.eventKey) {
          try {
            const deviceId = getOrCreateDeviceId()
            const res = (await convexClient.action((api as any).actions.resolveEventKey, {
              eventKey: p.eventKey,
              deviceId,
            })) as { type: string; [k: string]: any }
            if (res?.type === 'open_board') return await interactions.onBoardOpen(res.boardKey, `${p.title} — доступные квесты`)
            if (res?.type === 'open_npc') return await interactions.onNpcOpen(res.npcId, `${p.title} — доступные квесты`)
            if (res?.type === 'quest_started' && p.dialogKey) return interactions.onOpenDialog(p.dialogKey)
          } catch {}
        }
        if (p.type === 'board') return await interactions.onBoardOpen(p.id, `${p.title} — доступные квесты`)
        if ((p.type === 'npc' || p.type === 'npc_spawn') && p.npcId) return await interactions.onNpcOpen(p.npcId, `${p.title} — доступные квесты`)
        const def = decideDialogKey(
          { ...(p as any), coordinates: { lat: p.lat, lng: p.lng } } as VisibleMapPoint,
          {
            deliveryStep: quest.getStep('delivery_and_dilemma'),
            loyaltyStep: quest.activeQuests['loyalty_fjr']?.currentStep ?? null,
            waterStep: quest.activeQuests['water_crisis']?.currentStep ?? null,
            freedomStep: quest.activeQuests['freedom_spark']?.currentStep ?? null,
            phase,
          },
        )
        if (def) return interactions.onOpenDialog(def.dialogKey)
        if (p.dialogKey) return interactions.onOpenDialog(p.dialogKey)
      })

      map.on('mouseenter', 'mappoints', (e: any) => {
        const f = e.features?.[0]
        if (!f) return
        map.getCanvas().style.cursor = 'pointer'
        try {
          const p: any = f.properties || {}
          const coords = f.geometry?.coordinates as [number, number]
          const tooltipEl = document.createElement('div')
          const root = createRoot(tooltipEl)
          hoverTooltipRootRef.current = root
          const pointForTooltip = {
            id: String(p.id),
            title: String(p.title ?? ''),
            description: String(p.description ?? ''),
            coordinates: { lat: Number(p.lat), lng: Number(p.lng) },
            type: String(p.type ?? 'poi'),
            isActive: Boolean(p.isActive),
            questId: p.questId ?? undefined,
            dialogKey: p.dialogKey ?? undefined,
            eventKey: p.eventKey ?? undefined,
            npcId: p.npcId ?? undefined,
            radius: undefined,
            icon: undefined,
            isDiscovered: Boolean(p.isDiscovered ?? true),
            factionId: (p.factionId ?? undefined) as any,
          } as VisibleMapPoint
          root.render(<MapPointTooltip point={pointForTooltip} />)
          if (!hoverPopupRef.current) {
            hoverPopupRef.current = new mapboxgl.Popup({ offset: 22, closeButton: false, closeOnClick: false, anchor: 'bottom', maxWidth: '320px' })
          }
          hoverPopupRef.current
            .setLngLat(coords)
            .setDOMContent(tooltipEl)
            .addTo(map)
        } catch {}
      })

      map.on('mouseleave', 'mappoints', () => {
        map.getCanvas().style.cursor = ''
        try { hoverPopupRef.current?.remove() } catch {}
        try { hoverTooltipRootRef.current?.unmount() } catch {}
        hoverTooltipRootRef.current = null
      })
    }

    const startAnimation = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      let t0 = performance.now()
      const animate = () => {
        const now = performance.now()
        const dt = (now - t0) / 1000
        const phaseT = (dt % 1.8) / 1.8
        const radius = 10 + Math.sin(phaseT * Math.PI * 2) * 3
        const opacity = 0.65 + Math.max(0, Math.sin(phaseT * Math.PI * 2)) * 0.3
        try {
          if (map.getLayer('tracked-glow')) {
            map.setPaintProperty('tracked-glow', 'circle-radius', radius)
            map.setPaintProperty('tracked-glow', 'circle-opacity', opacity)
          }
        } catch {}
        rafRef.current = requestAnimationFrame(animate)
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    if (!map.isStyleLoaded()) {
      const onLoad = () => {
        initLayersIfNeeded()
        updateDataAndFilters()
        ensureLayerHandlers()
        startAnimation()
      }
      map.once('load', onLoad)
      return () => {
        map.off('load', onLoad)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }

    initLayersIfNeeded()
    updateDataAndFilters()
    ensureLayerHandlers()
    startAnimation()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [points, mapRef, interactions, quest.trackedQuestId, quest.activeQuests, phase])
}


