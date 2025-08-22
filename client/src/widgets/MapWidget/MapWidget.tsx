 
import { useEffect, useMemo, useRef } from 'react'
import './ui/MapWidget.css'
import { useClientVisiblePoints } from './model/useClientVisiblePoints'
import { useMarkers } from './model/useMarkers.tsx'
import { useQuest } from '@/entities/quest/model/useQuest'
import { useMap } from './model/MapContext'
import { useOverlays } from './ui/MapOverlays'
import logger from '@/shared/lib/logger'

export function MapWidget() {
  const hasAutoCenteredRef = useRef(false)
  const { mapRef } = useMap()
  const points = useClientVisiblePoints()
  const quest = useQuest()
  // Хуки должны вызываться на верхнем уровне, не внутри useMemo
  const { onBoardOpen, onNpcOpen, onOpenDialog } = useOverlays()
  
  // Трассировка для диагностики
  try {
    logger.info('MAP', 'points', { count: points.length, keys: points.map((p) => p.key) })
  } catch {}

  // автофокус на первую видимую точку — задержка увеличена в 10 раз
  useEffect(() => {
    if (!mapRef.current || points.length === 0) return
    if (hasAutoCenteredRef.current) return
    let timer: any
    const p = points[0]
    timer = setTimeout(() => {
      const map = mapRef.current
      if (!map) return
      if ((map as any)?.isStyleLoaded?.()) {
        map?.easeTo({ center: [p.coordinates.lng, p.coordinates.lat], duration: 900 })
      } else {
        map?.once('load', () => {
          map?.easeTo({ center: [p.coordinates.lng, p.coordinates.lat], duration: 900 })
        })
      }
      hasAutoCenteredRef.current = true
    }, 1500)
    return () => { if (timer) clearTimeout(timer) }
  }, [points, mapRef])

  const interactions = useMemo(() => ({ onBoardOpen, onNpcOpen, onOpenDialog }), [onBoardOpen, onNpcOpen, onOpenDialog])

  // Определяем целевую точку по активному квесту
  const trackedTargetId = useMemo(() => {
    const step = quest.getStep('delivery_and_dilemma' as any)
    if (step === 'station_briefing') return 'settlement_center'
    if (step === 'need_pickup_from_trader') return 'trader_camp'
    if (step === 'deliver_parts_to_craftsman' || step === 'return_to_craftsman') return 'workshop_center'
    if (step === 'go_to_anomaly') return 'northern_anomaly'
    return null
  }, [quest.activeQuests])

  useMarkers(mapRef, points, interactions as any, trackedTargetId as any)

  return null
}

export default MapWidget


