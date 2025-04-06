import React, { useState, useEffect, useRef, FC, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './QuestMap.css';
import { useUnit } from 'effector-react';
import { 
  $markers, 
  MarkerType, 
  Faction, 
  NpcClass,
  Marker as QuestMarker
} from '../../../entities/markers/model';

// Default location coordinates
const DEFAULT_LOCATION: [number, number] = [47.99443, 7.84638];

// Get token from environment variables or use hardcoded one for debugging
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiaW5vdGkiLCJhIjoiY205MDhqbzFyMGs0dzJsczgzaHA1YWJscyJ9.AnUFZnF1NfhefBtsQLnvdA';
console.log('Mapbox Token:', mapboxToken);

// Set the token for Mapbox
mapboxgl.accessToken = mapboxToken;

// Переэкспортируем типы для обратной совместимости
export type { QuestMarker };
export { MarkerType, Faction, NpcClass };

interface QuestMapProps {
  onMarkerClick?: (marker: QuestMarker) => Promise<void>;
  center?: [number, number];
  zoom?: number;
  followPlayer?: boolean;
}

export const QuestMap: FC<QuestMapProps> = ({
  onMarkerClick,
  center,
  zoom = 12,
  followPlayer = true,
}) => {
  // Map state
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Используем маркеры из хранилища Effector
  const allMarkers = useUnit($markers);
  // Фильтруем только видимые маркеры
  const visibleMarkers = allMarkers.filter(marker => marker.isVisible);
  
  // References
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const playerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  
  // Initialize map
  useEffect(() => {
    // Only initialize once and when container is available
    if (!mapContainer.current || map.current || mapInitialized) {
      return;
    }
    
    console.log("QuestMap: Beginning map initialization...");
    
    try {
      // Verify WebGL support
      if (!mapboxgl.supported()) {
        throw new Error("WebGL is not supported in this browser");
      }
      
      // Determine initial center
      const initialCenter = center || [DEFAULT_LOCATION[1], DEFAULT_LOCATION[0]];
      console.log("QuestMap: Initial map center:", initialCenter);
      
      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: initialCenter as [number, number],
        zoom: zoom,
        pitchWithRotate: false,
        attributionControl: false
      });
      
      console.log("QuestMap: Map object created, adding event handlers...");
      
      // Map load handler
      map.current.on('load', () => {
        console.log("QuestMap: Map loaded!");
        setLoading(false);
        setMapInitialized(true);
        
        // Add quest area source and layer
        try {
          if (map.current) {
            map.current.addSource('quest-areas', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            });
            
            map.current.addLayer({
              id: 'quest-areas-active',
              type: 'circle',
              source: 'quest-areas',
              paint: {
                'circle-radius': ['get', 'radius'],
                'circle-color': 'rgba(74, 158, 255, 0.2)',
                'circle-stroke-width': 2,
                'circle-stroke-color': 'rgba(74, 158, 255, 0.8)'
              },
              filter: ['==', ['get', 'isActive'], true]
            });
            
            console.log("QuestMap: Quest area layers added");
          }
        } catch (err) {
          console.error("QuestMap: Error adding layers:", err);
        }
      });
      
      // Error handler
      map.current.on('error', (e) => {
        const errorMessage = e.error?.message || 'Unknown map error';
        console.error('QuestMap: Mapbox error:', errorMessage);
        setMapError(`Map error: ${errorMessage}`);
      });
      
      console.log("QuestMap: Map initialization complete");
      
    } catch (err) {
      console.error('QuestMap: Error initializing map:', err);
      setMapError(`Map initialization error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
    
    // Cleanup when component unmounts
    return () => {
      if (map.current) {
        console.log("QuestMap: Cleaning up map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);
  
  // Add markers when markers array changes and map is initialized
  useEffect(() => {
    if (!map.current || !mapInitialized) return;
    
    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    
    // Add new markers - используем только видимые маркеры
    visibleMarkers.forEach(marker => {
      try {
        // Create marker element
        const el = document.createElement('div');
        el.className = `map-marker ${marker.markerType || 'quest_point'}`;
        
        if (marker.isActive) el.classList.add('active');
        if (marker.isCompleted) el.classList.add('completed');
        if (marker.npcClass) el.classList.add(`npc-${marker.npcClass}`);
        
        // Create Mapbox marker
        const mapMarker = new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .addTo(map.current!);
        
        // Add click handler if provided
        if (onMarkerClick) {
          el.addEventListener('click', () => {
            onMarkerClick(marker);
          });
        }
        
        // Store reference to marker
        markersRef.current[marker.id] = mapMarker;
      } catch (err) {
        console.error(`QuestMap: Error adding marker ${marker.id}:`, err);
      }
    });
    
  }, [visibleMarkers, mapInitialized, onMarkerClick]);
  
  // Resize handler to ensure map fits container
  useEffect(() => {
    if (!map.current || !mapInitialized) return;
    
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Call resize immediately to ensure proper sizing
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapInitialized]);
  
  // Update map center when center prop changes
  useEffect(() => {
    if (!map.current || !mapInitialized || !center) return;
    
    map.current.setCenter(center);
  }, [center, mapInitialized]);
  
  return (
    <div className="quest-map">
      <div 
        ref={mapContainer} 
        className="quest-map-container" 
        data-testid="map-container"
      />
      
      {loading && (
        <div className="map-loading-overlay">
          <div className="map-loading-content">
            <div className="loading-spinner"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}
      
      {mapError && (
        <div className="map-error-overlay">
          <div className="map-error-content">
            <p>{mapError}</p>
            <button onClick={() => window.location.reload()}>Refresh page</button>
          </div>
        </div>
      )}
    </div>
  );
};