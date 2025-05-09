import { useState, useEffect } from 'react';
import { GeoCoordinates } from '@/shared/types/geo';
import { MarkerData, MarkerType } from '@/shared/types/marker.types';

interface MapData {
  markers: MarkerData[];
  getMarkerById: (id: string) => MarkerData | undefined;
  toggleMarkerComplete: (id: string) => void;
  setActiveMarker: (id: string | null) => void;
  activeMarkerId: string | null;
}

/**
 * Хук для работы с данными карты (маркеры, геолокация и другие объекты на карте)
 */
export const useMapData = (): MapData => {
  // Состояние для хранения маркеров
  const [markers, setMarkers] = useState<MarkerData[]>([
    {
      id: 'quest-marker-1',
      title: 'Заброшенный склад',
      description: 'Здесь можно найти ценные ресурсы и документы',
      type: MarkerType.QUEST,
      coordinates: { latitude: 55.751244, longitude: 37.618423 },
      isCompleted: false,
      isActive: true
    },
    {
      id: 'poi-marker-1',
      title: 'Место встречи',
      description: 'Безопасная зона для встреч',
      type: MarkerType.POINT_OF_INTEREST,
      coordinates: { latitude: 55.753244, longitude: 37.622423 },
      isCompleted: false,
      isActive: true
    },
    {
      id: 'npc-marker-1',
      title: 'Торговец',
      description: 'Торговец редкими товарами',
      type: MarkerType.NPC,
      coordinates: { latitude: 55.755244, longitude: 37.619423 },
      isCompleted: false,
      isActive: true
    }
  ]);
  
  // Состояние для активного маркера
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  
  // Получение маркера по ID
  const getMarkerById = (id: string): MarkerData | undefined => {
    return markers.find(marker => marker.id === id);
  };
  
  // Переключение статуса выполнения маркера
  const toggleMarkerComplete = (id: string): void => {
    setMarkers(prev => prev.map(marker => 
      marker.id === id 
        ? { ...marker, isCompleted: !marker.isCompleted } 
        : marker
    ));
  };
  
  // Установка активного маркера
  const setActiveMarker = (id: string | null): void => {
    setActiveMarkerId(id);
  };
  
  // В реальном приложении здесь был бы запрос к Convex API для получения маркеров
  useEffect(() => {
    // Имитация загрузки данных с сервера
    const loadMapData = async () => {
      try {
        // Здесь был бы реальный API-запрос
        console.log('Loading map data...');
        // Данные уже установлены в начальное состояние, поэтому ничего не делаем
      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };
    
    loadMapData();
  }, []);
  
  return {
    markers,
    getMarkerById,
    toggleMarkerComplete,
    setActiveMarker,
    activeMarkerId
  };
}; 