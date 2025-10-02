import { useState, useCallback } from 'react'
import type { MapPointType, MapPointStatus } from '@/entities/map-point/model/types'

export interface MapViewState {
  center: [number, number]
  zoom: number
  bounds: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  } | null
}

export interface MapFilters {
  types: MapPointType[]
  statuses: MapPointStatus[]
  searchQuery: string
  distanceRange: [number, number] | null
}

export function useMapState() {
  // Map viewport state
  const [viewState, setViewState] = useState<MapViewState>({
    center: [7.8421, 47.9990], // Freiburg coordinates
    zoom: 13,
    bounds: null,
  })

  // Filters state
  const [filters, setFilters] = useState<MapFilters>({
    types: [],
    statuses: [],
    searchQuery: '',
    distanceRange: null,
  })

  // UI state
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)

  // Update map center
  const updateCenter = useCallback((center: [number, number]) => {
    setViewState(prev => ({ ...prev, center }))
  }, [])

  // Update map zoom
  const updateZoom = useCallback((zoom: number) => {
    setViewState(prev => ({ ...prev, zoom }))
  }, [])

  // Update map bounds
  const updateBounds = useCallback((bounds: MapViewState['bounds']) => {
    setViewState(prev => ({ ...prev, bounds }))
  }, [])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MapFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      types: [],
      statuses: [],
      searchQuery: '',
      distanceRange: null,
    })
  }, [])

  // Toggle panel
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev)
  }, [])

  // Select point
  const selectPoint = useCallback((pointId: string | null) => {
    setSelectedPointId(pointId)
  }, [])

  return {
    // State
    viewState,
    filters,
    isPanelOpen,
    selectedPointId,

    // Actions
    updateCenter,
    updateZoom,
    updateBounds,
    updateFilters,
    clearFilters,
    togglePanel,
    selectPoint,
  }
}
