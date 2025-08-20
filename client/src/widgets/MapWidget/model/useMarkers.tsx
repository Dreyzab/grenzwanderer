import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { createRoot, type Root } from 'react-dom/client'
import type { VisibleMapPoint } from '@/entities/map-point/model/types'
import { MapPointTooltip } from '@/entities/map-point/ui/MapPointTooltip'
import { resolveVisibleIds } from './visibilityRules.ts'
import { useQuest } from '@/entities/quest/model/useQuest'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'
import logger from '@/shared/lib/logger'

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
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null)
  const hoverTooltipRootRef = useRef<Root | null>(null)
  const handlersRef = useRef<{ click?: (e: any) => void; mouseenter?: (e: any) => void; mouseleave?: () => void } | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Этап 1: Источник и слои
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
        try { map.setFilter('tracked-glow', ['==', ['get', 'id'], '__none__'] as any) } catch {}
      }
    }

    // Этап 2: Обновление данных и фильтры
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
          eventKey: (p as any).eventKey ?? null,
          npcId: p.npcId ?? null,
          description: p.description ?? '',
          isActive: p.isActive,
          isDiscovered: p.isDiscovered ?? true,
          lat: p.coordinates.lat,
          lng: p.coordinates.lng,
        },
        geometry: { type: 'Point', coordinates: [p.coordinates.lng, p.coordinates.lat] },
      }))
      source.setData({ type: 'FeatureCollection', features } as any)
      logger.info('MAP', 'setData features:', features.length)

      const visibleIds = Array.from(
        resolveVisibleIds(points, {
          phase,
          deliveryStep: quest.getStep('delivery_and_dilemma' as any),
        }),
      )
      logger.info('MAP', 'resolveVisibleIds ctx:', { phase, step: quest.getStep('delivery_and_dilemma' as any) })
      // Отобразим хотя бы settlement_center, если ничего не подходит (пролог/пустота)
      if (visibleIds.length === 0) {
        const hasStart = points.find((x) => x.id === 'settlement_center')
        if (hasStart) visibleIds.push('settlement_center')
      }
      if (map.getLayer('mappoints')) {
        map.setFilter('mappoints', ['in', ['get', 'id'], ['literal', visibleIds]] as any)
        logger.info('MAP', 'filter mappoints visibleIds:', visibleIds)
      }

      const step = quest.getStep('delivery_and_dilemma' as any)
      let trackedTargetId: string | undefined
      if (step === 'not_started') trackedTargetId = 'settlement_center'
      else if (step === 'need_pickup_from_trader') trackedTargetId = 'trader_camp'
      else if (step === 'deliver_parts_to_craftsman' || step === 'return_to_craftsman') trackedTargetId = 'workshop_center'
      else if (step === 'go_to_anomaly') trackedTargetId = 'northern_anomaly'

      const isVisible = trackedTargetId && visibleIds.includes(trackedTargetId)
      if (map.getLayer('tracked-glow')) {
        map.setFilter('tracked-glow', isVisible ? (['==', ['get', 'id'], trackedTargetId] as any) : (['==', ['get', 'id'], '__none__'] as any))
        logger.info('MAP', 'filter glow tracked:', trackedTargetId, 'isVisible:', isVisible)
      }
    }

    // Этап 3: Интерактивность
    const ensureLayerHandlers = () => {
      const onClick = async (e: any) => {
        const f = e.features?.[0]
        if (!f) return
        const p: any = f.properties || {}
        logger.info('MAP', 'Point clicked', p.id, p.title, p.dialogKey)
        if (p.type === 'board') return interactions.onBoardOpen(p.id, `${p.title} — доступные квесты`)
        if ((p.type === 'npc' || p.type === 'npc_spawn') && p.npcId) return interactions.onNpcOpen(p.npcId, `${p.title} — доступные квесты`)
        if (p.dialogKey) return interactions.onOpenDialog(p.dialogKey)
      }

      const onMouseEnter = (e: any) => {
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
            dialogKey: p.dialogKey ?? undefined,
            eventKey: p.eventKey ?? undefined,
            npcId: p.npcId ?? undefined,
            isDiscovered: Boolean(p.isDiscovered ?? true),
          } as VisibleMapPoint
          root.render(<MapPointTooltip point={pointForTooltip} />)
          if (!hoverPopupRef.current) {
            hoverPopupRef.current = new mapboxgl.Popup({ offset: 22, closeButton: false, closeOnClick: false, anchor: 'bottom', maxWidth: '320px' })
          }
          hoverPopupRef.current!
            .setLngLat(coords)
            .setDOMContent(tooltipEl)
            .addTo(map)
        } catch {}
      }

      const onMouseLeave = () => {
        map.getCanvas().style.cursor = ''
        setTimeout(() => {
          try { hoverPopupRef.current?.remove() } catch {}
          try { hoverTooltipRootRef.current?.unmount() } catch {}
          hoverPopupRef.current = null
          hoverTooltipRootRef.current = null
        }, 0)
      }

      handlersRef.current = { click: onClick, mouseenter: onMouseEnter, mouseleave: onMouseLeave }
      map.on('click', 'mappoints', onClick)
      map.on('mouseenter', 'mappoints', onMouseEnter)
      map.on('mouseleave', 'mappoints', onMouseLeave)
    }

    // Этап 4: Анимация glow
    const startAnimation = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const animate = () => {
        try {
          if (map.getLayer('tracked-glow')) {
            const t = (performance.now() / 1800) % 1
            const radius = 10 + Math.sin(t * Math.PI * 2) * 3
            const opacity = 0.65 + Math.max(0, Math.sin(t * Math.PI * 2)) * 0.3
            map.setPaintProperty('tracked-glow', 'circle-radius', radius)
            map.setPaintProperty('tracked-glow', 'circle-opacity', opacity)
          }
        } catch {}
        rafRef.current = requestAnimationFrame(animate)
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    const bootstrap = () => {
      initLayersIfNeeded()
      updateDataAndFilters()
      ensureLayerHandlers()
      startAnimation()
    }

    if (!map.isStyleLoaded()) {
      const onLoad = () => {
        try { bootstrap() } catch {}
      }
      map.once('load', onLoad)
      return () => {
        try { map.off('load', onLoad) } catch {}
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        try {
          const h = handlersRef.current
          if (h?.click) map.off('click', 'mappoints', h.click as any)
          if (h?.mouseenter) map.off('mouseenter', 'mappoints', h.mouseenter as any)
          if (h?.mouseleave) map.off('mouseleave', 'mappoints', h.mouseleave as any)
        } catch {}
        setTimeout(() => {
          try { hoverPopupRef.current?.remove() } catch {}
          try { hoverTooltipRootRef.current?.unmount() } catch {}
          hoverPopupRef.current = null
          hoverTooltipRootRef.current = null
        }, 0)
      }
    }

    bootstrap()

    // Этап 5: Очистка ресурсов
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try {
        const h = handlersRef.current
        if (h?.click) map.off('click', 'mappoints', h.click as any)
        if (h?.mouseenter) map.off('mouseenter', 'mappoints', h.mouseenter as any)
        if (h?.mouseleave) map.off('mouseleave', 'mappoints', h.mouseleave as any)
      } catch {}
      setTimeout(() => {
        try { hoverPopupRef.current?.remove() } catch {}
        try { hoverTooltipRootRef.current?.unmount() } catch {}
        hoverPopupRef.current = null
        hoverTooltipRootRef.current = null
      }, 0)
    }
  }, [points, mapRef, interactions, quest.trackedQuestId, quest.activeQuests, phase])
}


