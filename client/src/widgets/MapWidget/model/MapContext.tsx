import React, { createContext, useContext, useRef } from 'react'
import type { Map } from 'mapbox-gl'
import { useMapInstance } from './useMapInstance'

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
  return (
    <MapContext.Provider value={{ mapRef }}>
      <div ref={containerRef} className={className} />
      {children}
    </MapContext.Provider>
  )
}


