import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './QuestMap.css';
import { useUnit } from 'effector-react';
import { $markers } from '../../entities/markers/model';
import { MarkerType, Faction, NpcClass, MarkerData } from './model/QuestMap';

// Default location coordinates
const DEFAULT_LOCATION: [number, number] = [47.99443, 7.84638];

// Get token from environment variables or use hardcoded one for debugging
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (!mapboxToken) {
  throw new Error('VITE_MAPBOX_TOKEN не задан в .env. Получите публичный токен на https://account.mapbox.com/ и добавьте его в .env');
}
mapboxgl.accessToken = mapboxToken;

// Переэкспортируем типы для обратной совместимости
export type { MarkerData };
export { MarkerType, Faction, NpcClass };

interface MapMarker {
  id: string;
  type: 'quest' | 'player' | 'point-of-interest' | 'shop' | 'npc';
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  iconUrl?: string;
}

interface QuestMapWidgetProps {
  markers: MapMarker[];
  center: [number, number]; // longitude, latitude
  zoom: number;
  onMarkerClick?: (markerId: string) => void;
  playerPosition?: [number, number]; // longitude, latitude
  mapboxApiKey: string;
}

/**
 * Виджет для отображения интерактивной карты с маркерами квестов
 * Использует Mapbox GL JS для рендеринга карты
 */
export const QuestMapWidget: React.FC<QuestMapWidgetProps> = ({
  markers,
  center,
  zoom,
  onMarkerClick,
  playerPosition,
  mapboxApiKey
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Инициализация карты
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      mapboxgl.accessToken = mapboxApiKey;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: center,
        zoom: zoom
      });
      
      map.current.on('load', () => {
        setMapInitialized(true);
      });
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom, mapboxApiKey]);
  
  // Добавляем маркеры на карту
  useEffect(() => {
    if (!mapInitialized || !map.current) return;
    
    // Удаляем старые маркеры
    document.querySelectorAll('.mapboxgl-marker').forEach(el => el.remove());
    
    // Добавляем новые маркеры
    markers.forEach(marker => {
      const markerElement = document.createElement('div');
      markerElement.className = `marker marker-${marker.type}`;
      
      if (marker.iconUrl) {
        markerElement.style.backgroundImage = `url(${marker.iconUrl})`;
      }
      
      const mapMarker = new mapboxgl.Marker(markerElement)
        .setLngLat([marker.longitude, marker.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h3>${marker.title}</h3>${marker.description ? `<p>${marker.description}</p>` : ''}`
          )
        )
        .addTo(map.current!);
      
      markerElement.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(marker.id);
        }
      });
    });
    
    // Добавляем маркер игрока, если он есть
    if (playerPosition) {
      const playerElement = document.createElement('div');
      playerElement.className = 'player-marker';
      
      new mapboxgl.Marker(playerElement)
        .setLngLat(playerPosition)
        .addTo(map.current);
    }
  }, [mapInitialized, markers, onMarkerClick, playerPosition]);
  
  // Обновляем центр карты и уровень масштабирования
  useEffect(() => {
    if (mapInitialized && map.current) {
      map.current.setCenter(center);
      map.current.setZoom(zoom);
    }
  }, [mapInitialized, center, zoom]);
  
  return (
    <div className="quest-map-container">
      <div 
        ref={mapContainer} 
        className="map-container" 
        style={{ width: '100%', height: '100%' }} 
      />
    </div>
  );
};