import React, { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapboxMapProps {
  center?: [number, number]
  zoom?: number
  style?: string
  className?: string
  onMapLoad?: (map: mapboxgl.Map) => void
  onMapClick?: (e: mapboxgl.MapMouseEvent) => void
  children?: React.ReactNode
}

// Default Mapbox style (requires token)
const DEFAULT_STYLE = 'mapbox://styles/mapbox/dark-v10'

export function MapboxMap({
  center = [7.8421, 47.9990], // Freiburg coordinates
  zoom = 13,
  style = DEFAULT_STYLE,
  className = 'w-full h-96 rounded-lg',
  onMapLoad,
  onMapClick,
  children,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const clickHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null)
  const loadHandlerRef = useRef<typeof onMapLoad | null>(null)
  const clickPropRef = useRef<typeof onMapClick | null>(null)
  
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.warn('Mapbox token not found. Add VITE_MAPBOX_TOKEN to .env')
      return
    }

    if (map.current || !mapContainer.current) return

    mapboxgl.accessToken = token

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      attributionControl: false,
      logoPosition: 'bottom-right',
    })

    map.current = instance
    setMapInstance(instance)

    instance.addControl(new mapboxgl.NavigationControl(), 'top-right')
    instance.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    )

    const handleLoad = () => {
      setIsLoaded(true)
      loadHandlerRef.current?.(instance)
    }

    instance.on('load', handleLoad)

    return () => {
      instance.off('load', handleLoad)
      if (clickHandlerRef.current) {
        instance.off('click', clickHandlerRef.current)
        clickHandlerRef.current = null
      }
      instance.remove()
      map.current = null
      setMapInstance(null)
      setIsLoaded(false)
    }
  }, [style])

  // Keep latest callbacks in refs
  useEffect(() => {
    loadHandlerRef.current = onMapLoad ?? null
  }, [onMapLoad])

  useEffect(() => {
    clickPropRef.current = onMapClick ?? null
  }, [onMapClick])

  // Attach click handler once map loaded
  useEffect(() => {
    const instance = map.current
    if (!instance || !isLoaded) return

    const handler = (event: mapboxgl.MapMouseEvent) => {
      clickPropRef.current?.(event)
    }

    if (clickHandlerRef.current) {
      instance.off('click', clickHandlerRef.current)
      clickHandlerRef.current = null
    }

    if (clickPropRef.current) {
      clickHandlerRef.current = handler
      instance.on('click', handler)
    }

    return () => {
      if (clickHandlerRef.current) {
        instance.off('click', clickHandlerRef.current)
        clickHandlerRef.current = null
      }
    }
  }, [isLoaded])
  
  // Update center and zoom when props change
  useEffect(() => {
    if (!map.current || !isLoaded) return

    map.current.jumpTo({ center })
  }, [center, isLoaded])

  useEffect(() => {
    if (!map.current || !isLoaded) return

    map.current.setZoom(zoom)
  }, [zoom, isLoaded])
  
  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
      />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">Загрузка карты...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay if no token */}
      {!import.meta.env.VITE_MAPBOX_TOKEN && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center rounded-lg">
          <div className="text-center p-4">
            <p className="text-red-400 mb-2">Mapbox токен не найден</p>
            <p className="text-zinc-400 text-sm">Добавьте VITE_MAPBOX_TOKEN в .env файл</p>
          </div>
        </div>
      )}
      
      {/* Children overlay */}
      {children && (
        <div className="absolute inset-0 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  )
}

// Hook to access map instance
export function useMapboxMap() {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  
  const addMarker = (
    coordinates: [number, number], 
    options?: mapboxgl.MarkerOptions
  ) => {
    if (!mapRef.current) return null
    
    const marker = new mapboxgl.Marker(options)
      .setLngLat(coordinates)
      .addTo(mapRef.current)
    
    return marker
  }
  
  const addPopup = (
    coordinates: [number, number],
    content: string,
    options?: mapboxgl.PopupOptions
  ) => {
    if (!mapRef.current) return null
    
    const popup = new mapboxgl.Popup(options)
      .setLngLat(coordinates)
      .setHTML(content)
      .addTo(mapRef.current)
    
    return popup
  }
  
  const flyTo = (coordinates: [number, number], zoom?: number) => {
    if (!mapRef.current) return
    
    mapRef.current.flyTo({
      center: coordinates,
      zoom: zoom || mapRef.current.getZoom(),
      duration: 1000,
    })
  }
  
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)

  const setMap = useCallback((map: mapboxgl.Map | null) => {
    mapRef.current = map
    setMapInstance(map)
  }, [])

  useEffect(() => {
    return () => {
      mapRef.current = null
      setMapInstance(null)
    }
  }, [])

  return {
    map: mapInstance,
    setMap,
    addMarker,
    addPopup,
    flyTo,
  }
}
