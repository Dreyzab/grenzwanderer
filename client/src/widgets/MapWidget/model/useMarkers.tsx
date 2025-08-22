import { useEffect, useRef } from 'react'
import type { Map } from 'mapbox-gl'
import { Popup } from 'mapbox-gl'
import { createRoot, type Root } from 'react-dom/client'
import MapPointTooltip from '@/entities/map-point/ui/MapPointTooltip'
import type { VisibleMapPoint } from './useVisiblePoints'
import { qrApiConvex } from '@/shared/api/qr/convex'
import { MAP_POINT_TYPE } from '@/shared/constants'

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
              MAP_POINT_TYPE.SETTLEMENT, '#60a5fa',
              MAP_POINT_TYPE.NPC, '#34d399',
              MAP_POINT_TYPE.BOARD, '#fbbf24',
              MAP_POINT_TYPE.ANOMALY, '#f472b6',
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
        type: p.type ?? MAP_POINT_TYPE.UNKNOWN,
        description: p.description ?? '',
        dialogKey: p.dialogKey ?? null,
        questId: p.questId ?? null,
      },
    }))
    const src = map.getSource('mappoints') as any
    if (src?.setData) src.setData({ type: 'FeatureCollection', features })
  }, [points, mapRef])

  // Обновление подсветки цели квеста
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const hasGlow = !!map.getLayer('tracked-glow')
    if (!hasGlow) return
    const target = trackedTargetId && points.some((p) => p.key === trackedTargetId) ? trackedTargetId : '__none__'
    map.setFilter('tracked-glow', ['==', ['get', 'id'], target])
  }, [trackedTargetId, points, mapRef])

  // Мягкая пульсация слоя подсветки цели
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let stopped = false
    const tick = (ts: number) => {
      if (stopped) return
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
      // Всегда резолвим на сервере: получаем dialogKey и playerState
      if (props.id && typeof props.id === 'string') {
        // QR-резолв: используем point.id как код, если требуется иной канал, заменим на маппинг id->code
        void qrApiConvex.resolvePoint(props.id as string).then((res) => {
          if (res?.status === 'ok' && res.point?.dialogKey) {
            interactions.onOpenDialog(res.point.dialogKey)
          }
        })
        return
      }
      if (props.type === MAP_POINT_TYPE.BOARD && props.id) {
        void interactions.onBoardOpen(props.id as string, title)
        return
      }
      if (props.type === MAP_POINT_TYPE.NPC && props.id) {
        void interactions.onNpcOpen(props.id as string, title)
        return
      }
    }
    const onMouseEnter = (e: any) => {
      const canvas = map.getCanvas?.()
      if (canvas) canvas.style.cursor = 'pointer'
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
      hoverTooltipRootRef.current?.unmount?.()
      hoverTooltipRootRef.current = createRoot(container)
      hoverTooltipRootRef.current.render(<MapPointTooltip point={point} />)
      hoverPopupRef.current?.remove?.()
      hoverPopupRef.current = new Popup({ closeButton: false, closeOnClick: false, offset: 12 })
        .setDOMContent(container)
        .setLngLat(e.lngLat)
        .addTo(map)
    }
    const onMouseMove = (e: any) => {
      hoverPopupRef.current?.setLngLat?.(e.lngLat)
    }
    const onMouseLeave = () => {
      const canvas = map.getCanvas?.()
      if (canvas) canvas.style.cursor = ''
      // откладываем снятие попапа на следующий кадр, чтобы избежать гонок с текущим рендером React
      requestAnimationFrame(() => {
        hoverPopupRef.current?.remove?.()
        hoverTooltipRootRef.current?.unmount?.()
        hoverPopupRef.current = null
        hoverTooltipRootRef.current = null
      })
    }
    map.on('click', 'mappoints', onClick)
    map.on('mouseenter', 'mappoints', onMouseEnter)
    map.on('mousemove', 'mappoints', onMouseMove)
    map.on('mouseleave', 'mappoints', onMouseLeave)
    return () => {
      map.off('click', 'mappoints', onClick)
      map.off('mouseenter', 'mappoints', onMouseEnter)
      map.off('mousemove', 'mappoints', onMouseMove)
      map.off('mouseleave', 'mappoints', onMouseLeave)
      hoverPopupRef.current?.remove?.()
      hoverTooltipRootRef.current?.unmount?.()
      hoverPopupRef.current = null
      hoverTooltipRootRef.current = null
    }
  }, [mapRef, interactions])
}


