import React, { useEffect, useRef, useState } from 'react'
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
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    // Check if mapbox token is available
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.warn('Mapbox token not found. Add VITE_MAPBOX_TOKEN to .env')
      return
    }
    
    if (map.current || !mapContainer.current) return
    
    mapboxgl.accessToken = token
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      attributionControl: false, // Remove for cleaner look
      logoPosition: 'bottom-right',
    })
    
    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right')
    
    // Event handlers
    map.current.on('load', () => {
      setIsLoaded(true)
      onMapLoad?.(map.current!)
    })
    
    if (onMapClick) {
      map.current.on('click', onMapClick)
    }
    
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        setIsLoaded(false)
      }
    }
  }, [center, zoom, style, onMapLoad, onMapClick])
  
  // Update center and zoom when props change
  useEffect(() => {
    if (map.current && isLoaded) {
      map.current.setCenter(center)
      map.current.setZoom(zoom)
    }
  }, [center, zoom, isLoaded])
  
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
  
  const setMap = (map: mapboxgl.Map) => {
    mapRef.current = map
  }
  
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
  
  return {
    map: mapRef.current,
    setMap,
    addMarker,
    addPopup,
    flyTo,
  }
}
