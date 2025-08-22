import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Map } from 'mapbox-gl'
import { useMapInstance } from './useMapInstance'
import logger from '@/shared/lib/logger'

interface MapContextValue {
  mapRef: React.RefObject<Map | null>
}

const MapContext = createContext<MapContextValue | null>(null)

export function useMap() {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('useMap must be used within MapContainer')
  return ctx
}

interface MapContainerProps {
  className?: string
  children?: React.ReactNode
}

export function MapContainer({ className, children }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null!)
  const mapRef = useMapInstance(containerRef)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const m = mapRef.current as any
    if (!m) return
    const handleLoad = () => { setReady(true); logger.info('MAP', 'container:map_loaded') }
    if (typeof m.isStyleLoaded === 'function' ? m.isStyleLoaded() : m.loaded?.()) {
      setReady(true)
      logger.info('MAP', 'container:map_already_loaded')
      return
    }
    m.once('load', handleLoad)
    return () => { try { m.off('load', handleLoad) } catch {} }
  }, [mapRef])
  return (
    <MapContext.Provider value={{ mapRef }}>
      <div ref={containerRef} className={className} />
      {ready ? children : null}
    </MapContext.Provider>
  )
}


