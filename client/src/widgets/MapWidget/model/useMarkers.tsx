import { useEffect, useRef } from 'react'
import type { Map } from 'mapbox-gl'
import { Popup } from 'mapbox-gl'
import { createRoot, type Root } from 'react-dom/client'
import MapPointTooltip from '@/entities/map-point/ui/MapPointTooltip'
import type { VisibleMapPoint } from './useVisiblePoints'
import { decideDialogKey } from '@/features/quest-progress/model/decideDialogKey'
import { useQuestStore } from '@/entities/quest/model/questStore'
import { useProgressionStore } from '@/entities/quest/model/progressionStore'

type Interactions = {
  onBoardOpen: (boardKey: string, title: string) => void | Promise<void>
  onNpcOpen: (npcId: string, title: string) => void | Promise<void>
  onOpenDialog: (dialogKey: string) => void
}

export function useMarkers(
  mapRef: React.RefObject<Map | null>,
  points: VisibleMapPoint[],
  interactions: Interactions,
  trackedTargetId?: string | null,
) {
  const animRef = useRef<number | null>(null)
  const initializedRef = useRef(false)
  const hoverPopupRef = useRef<Popup | null>(null)
  const hoverTooltipRootRef = useRef<Root | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const initLayers = () => {
      if (initializedRef.current) return
      if (!map.getSource('mappoints')) {
        map.addSource('mappoints', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'id' })
      }
      if (!map.getLayer('mappoints')) {
        map.addLayer({
          id: 'mappoints',
          type: 'circle',
          source: 'mappoints',
          paint: {
            'circle-radius': 7,
            'circle-color': [
              'match',
              ['get', 'type'],
              'settlement', '#60a5fa',
              'npc', '#34d399',
              'board', '#fbbf24',
              'anomaly', '#f472b6',
              '#93c5fd',
            ],
            'circle-stroke-color': '#111827',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.95,
          },
        })
      }
      if (!map.getLayer('tracked-glow')) {
        map.addLayer({
          id: 'tracked-glow',
          type: 'circle',
          source: 'mappoints',
          paint: {
            'circle-radius': 10,
            // полупрозрачный золотой через rgba-строку (8-hex не поддерживается валидатором стиля)
            'circle-color': 'rgba(251, 191, 36, 0.5)',
            'circle-blur': 0.4,
            'circle-opacity': 0.9,
          },
          filter: ['==', ['get', 'id'], '__none__'],
        })
      }
      initializedRef.current = true
    }

    if (typeof (map as any).isStyleLoaded === 'function') {
      if ((map as any).isStyleLoaded()) initLayers()
      else map.once('load', initLayers)
    } else {
      // fallback
      map.once('load', initLayers)
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      animRef.current = null
      // Не удаляем слои/источник, чтобы избежать гонок при strict mode
    }
  }, [mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const features = points.map((p) => ({
      type: 'Feature',
      id: p.key,
      geometry: { type: 'Point', coordinates: [p.coordinates.lng, p.coordinates.lat] },
      properties: {
        id: p.key,
        title: p.title,
        type: p.type ?? 'unknown',
        description: p.description ?? '',
        dialogKey: p.dialogKey ?? null,
        questId: p.questId ?? null,
      },
    }))
    try {
      const src = map.getSource('mappoints') as any
      src?.setData({ type: 'FeatureCollection', features })
    } catch {}
  }, [points, mapRef])

  // Обновление подсветки цели квеста
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    try {
      const hasGlow = !!map.getLayer('tracked-glow')
      if (!hasGlow) return
      const target = trackedTargetId && points.some((p) => p.key === trackedTargetId) ? trackedTargetId : '__none__'
      map.setFilter('tracked-glow', ['==', ['get', 'id'], target])
    } catch {}
  }, [trackedTargetId, points, mapRef])

  // Мягкая пульсация слоя подсветки цели
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let stopped = false
    const tick = (ts: number) => {
      if (stopped) return
      try {
        const hasLayer = !!map.getLayer('tracked-glow')
        const hasTarget = Boolean(trackedTargetId && points.some((p) => p.key === trackedTargetId))
        if (hasLayer && hasTarget) {
          const t = ts * 0.005
          const radius = 10 + Math.sin(t) * 3 // 10±3
          const opacity = 0.6 + Math.max(0, Math.sin(t)) * 0.3 // 0.6..0.9
          const blur = 0.3 + Math.max(0, Math.sin(t)) * 0.2 // 0.3..0.5
          map.setPaintProperty('tracked-glow', 'circle-radius', radius)
          map.setPaintProperty('tracked-glow', 'circle-opacity', opacity)
          map.setPaintProperty('tracked-glow', 'circle-blur', blur)
        }
      } catch {}
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => {
      stopped = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [mapRef, trackedTargetId, points])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onClick = (e: any) => {
      const f = e?.features?.[0]
      const props = f?.properties || {}
      const title = props.title as string
      // Сначала пытаемся резолвить диалог контекстно (по шагу квеста/инвентарю)
      if (typeof props.id === 'string') {
        const pointForDecision: any = {
          id: props.id,
          title: props.title,
          description: props.description,
          type: props.type,
          dialogKey: props.dialogKey ?? undefined,
        }
        const deliveryStep = (useQuestStore.getState().activeQuests as any)?.['delivery_and_dilemma']?.currentStep ?? 'not_started'
        const phase = useProgressionStore.getState().phase as any
        const resolved = decideDialogKey(pointForDecision, { deliveryStep, phase })
        if (resolved?.dialogKey) {
          interactions.onOpenDialog(resolved.dialogKey)
          return
        }
      }
      // Фолбэк: используем явный ключ точки
      if (props.dialogKey && typeof props.dialogKey === 'string') {
        interactions.onOpenDialog(props.dialogKey)
        return
      }
      if (props.type === 'board' && props.id) {
        void interactions.onBoardOpen(props.id as string, title)
        return
      }
      if (props.type === 'npc' && props.id) {
        void interactions.onNpcOpen(props.id as string, title)
        return
      }
    }
    const onMouseEnter = (e: any) => {
      try { map.getCanvas().style.cursor = 'pointer' } catch {}
      const f = e?.features?.[0]
      if (!f) return
      const props = f.properties || {}
      const point = {
        id: props.id as string,
        title: props.title as string,
        description: props.description as string,
        type: props.type as string,
        isDiscovered: true,
      } as any
      const container = document.createElement('div')
      try {
        hoverTooltipRootRef.current?.unmount()
      } catch {}
      hoverTooltipRootRef.current = createRoot(container)
      hoverTooltipRootRef.current.render(<MapPointTooltip point={point} />)
      try { hoverPopupRef.current?.remove() } catch {}
      hoverPopupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 12 })
        .setDOMContent(container)
        .setLngLat(e.lngLat)
        .addTo(map)
    }
    const onMouseMove = (e: any) => {
      try { hoverPopupRef.current?.setLngLat(e.lngLat) } catch {}
    }
    const onMouseLeave = () => {
      try { map.getCanvas().style.cursor = '' } catch {}
      // откладываем снятие попапа на следующий кадр, чтобы избежать гонок с текущим рендером React
      requestAnimationFrame(() => {
        try { hoverPopupRef.current?.remove() } catch {}
        try { hoverTooltipRootRef.current?.unmount() } catch {}
        hoverPopupRef.current = null
        hoverTooltipRootRef.current = null
      })
    }
    try {
      map.on('click', 'mappoints', onClick)
      map.on('mouseenter', 'mappoints', onMouseEnter)
      map.on('mousemove', 'mappoints', onMouseMove)
      map.on('mouseleave', 'mappoints', onMouseLeave)
    } catch {}
    return () => {
      try {
        map.off('click', 'mappoints', onClick)
        map.off('mouseenter', 'mappoints', onMouseEnter)
        map.off('mousemove', 'mappoints', onMouseMove)
        map.off('mouseleave', 'mappoints', onMouseLeave)
      } catch {}
      try { hoverPopupRef.current?.remove() } catch {}
      try { hoverTooltipRootRef.current?.unmount() } catch {}
      hoverPopupRef.current = null
      hoverTooltipRootRef.current = null
    }
  }, [mapRef, interactions])
}


