import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { MAP_CONFIG } from '@/shared/config/map'

export function useMapInstance(containerRef: React.RefObject<HTMLDivElement>) {
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!MAP_CONFIG.token) {
      // eslint-disable-next-line no-console
      console.warn('VITE_MAPBOX_TOKEN is not set')
      return
    }
    mapboxgl.accessToken = MAP_CONFIG.token
    const map = new mapboxgl.Map({
      container: containerRef.current,
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
  }, [containerRef])

  return mapRef
}


