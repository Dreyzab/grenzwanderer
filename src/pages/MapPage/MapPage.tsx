import { useEffect, useRef, useCallback, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapState } from './model/useMapState'
import { MapControls } from './ui/MapControls'
import { LocationFilters } from './ui/LocationFilters'
import { PointsListPanel } from './ui/PointsListPanel'
import { useMapPointStore } from '@/entities/map-point/model/store'
import { useVisibleMapPoints } from '@/shared/api/mapPoints/convex'
import { useGeolocation } from '@/shared/hooks/useGeolocation'
import { MapPointMarker } from '@/entities/map-point/ui/MapPointMarker'
import { createRoot } from 'react-dom/client'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const FALLBACK_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const FREIBURG_CENTER: [number, number] = [7.8421, 47.9990]

export function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())

  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // State management
  const {
    viewState,
    filters,
    isPanelOpen,
    selectedPointId,
    updateCenter,
    updateZoom,
    updateBounds,
    updateFilters,
    clearFilters,
    togglePanel,
    selectPoint,
  } = useMapState()

  // Map points store
  const {
    setPoints,
    getFilteredPoints,
    setUserLocation,
    userLocation,
    selectPoint: selectPointInStore,
  } = useMapPointStore()

  // Geolocation
  const { position, getCurrentPosition } = useGeolocation({
    accuracy: 'high',
    watch: false,
  })

  // Fetch visible points from Convex
  const pointsData = useVisibleMapPoints({
    bbox: viewState.bounds || undefined,
    enabled: isMapLoaded && !!viewState.bounds,
  })

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapStyle = MAPBOX_TOKEN ? 'mapbox://styles/mapbox/dark-v11' : FALLBACK_STYLE

    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN
    }

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: FREIBURG_CENTER,
      zoom: 13,
      attributionControl: false,
    })

    // Add controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapInstance.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    )

    // Update bounds on move
    mapInstance.on('moveend', () => {
      const bounds = mapInstance.getBounds()
      const center = mapInstance.getCenter()
      const zoom = mapInstance.getZoom()

      if (bounds) {
        updateBounds({
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        })
      }
      updateCenter([center.lng, center.lat])
      updateZoom(zoom)
    })

    mapInstance.on('load', () => {
      setIsMapLoaded(true)
      // Initial bounds update
      const bounds = mapInstance.getBounds()
      if (bounds) {
        updateBounds({
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        })
      }
    })

    map.current = mapInstance

    return () => {
      mapInstance.remove()
      map.current = null
    }
  }, [])

  // Update points when data changes
  useEffect(() => {
    if (pointsData?.points) {
      setPoints(pointsData.points)
    }
  }, [pointsData, setPoints])

  // Update user location
  useEffect(() => {
    if (position) {
      setUserLocation({
        lat: position.lat,
        lng: position.lng,
      })
    }
  }, [position, setUserLocation])

  // Render markers on map
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    const filteredPoints = getFilteredPoints()

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!filteredPoints.find(p => p.id === id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })

    // Add/update markers
    filteredPoints.forEach((point) => {
      let marker = markersRef.current.get(point.id)

      if (!marker) {
        // Create custom marker element
        const el = document.createElement('div')
        el.className = 'custom-marker'
        
        const root = createRoot(el)
        root.render(
          <MapPointMarker
            type={point.type}
            status={point.status || 'not_found'}
            isSelected={selectedPointId === point.id}
            onClick={() => {
              selectPoint(point.id)
              selectPointInStore(point.id)
            }}
          />
        )

        marker = new mapboxgl.Marker({ element: el })
          .setLngLat([point.coordinates.lng, point.coordinates.lat])
          .addTo(map.current!)

        markersRef.current.set(point.id, marker)
      }
    })
  }, [getFilteredPoints, isMapLoaded, selectedPointId, selectPoint, selectPointInStore])

  // Map actions
  const handleZoomIn = useCallback(() => {
    if (map.current) {
      map.current.zoomIn()
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (map.current) {
      map.current.zoomOut()
    }
  }, [])

  const handleLocateUser = useCallback(() => {
    getCurrentPosition()
    if (position && map.current) {
      map.current.flyTo({
        center: [position.lng, position.lat],
        zoom: 16,
        duration: 1000,
      })
    }
  }, [getCurrentPosition, position])

  const handleNavigateToPoint = useCallback((point: any) => {
    if (map.current) {
      map.current.flyTo({
        center: [point.coordinates.lng, point.coordinates.lat],
        zoom: 17,
        duration: 1000,
      })
      selectPoint(point.id)
      selectPointInStore(point.id)
    }
  }, [selectPoint, selectPointInStore])

  const filteredPoints = getFilteredPoints()

  return (
    <div className="relative w-full h-screen bg-zinc-900">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Загрузка карты...</p>
          </div>
        </div>
      )}

      {/* Map controls */}
      {isMapLoaded && (
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocateUser={handleLocateUser}
        />
      )}

      {/* Filters bar */}
      {isMapLoaded && (
        <div className="absolute top-0 left-0 right-0 z-10">
          <LocationFilters
            selectedTypes={filters.types}
            selectedStatuses={filters.statuses}
            searchQuery={filters.searchQuery}
            onTypesChange={(types) => updateFilters({ types })}
            onStatusesChange={(statuses) => updateFilters({ statuses })}
            onSearchChange={(searchQuery) => updateFilters({ searchQuery })}
            onClearAll={clearFilters}
          />
        </div>
      )}

      {/* Points list panel */}
      {isMapLoaded && (
        <PointsListPanel
          points={filteredPoints}
          userLocation={userLocation}
          selectedPointId={selectedPointId}
          isOpen={isPanelOpen}
          onToggle={togglePanel}
          onSelectPoint={(pointId) => {
            selectPoint(pointId)
            selectPointInStore(pointId)
          }}
          onNavigateToPoint={handleNavigateToPoint}
        />
      )}

      {/* Token warning */}
      {!MAPBOX_TOKEN && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm">
            ⚠️ Mapbox token не найден. Используется fallback карта.
          </div>
        </div>
      )}
    </div>
  )
}
