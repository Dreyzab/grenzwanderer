import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { MAP_CONFIG } from '@/shared/config/map'

export function useMapInstance(containerRef: React.RefObject<HTMLDivElement>) {
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return
    try {
      mapboxgl.accessToken = MAP_CONFIG.token
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: MAP_CONFIG.tileUrl,
        center: MAP_CONFIG.defaultCenter,
        zoom: MAP_CONFIG.defaultZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        minZoom: MAP_CONFIG.minZoom,
        bounds: MAP_CONFIG.bounds as any,
      })
      mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }))
    } catch {
      // ignore
    }
    return () => {
      try { mapRef.current?.remove() } catch {}
      mapRef.current = null
    }
  }, [containerRef])

  return mapRef
}


