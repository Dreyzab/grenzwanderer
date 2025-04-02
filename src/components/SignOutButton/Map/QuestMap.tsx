import React, { useRef, useEffect, FC, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './QuestMap.css';
import { useLocation } from '../../../hooks/useLocatiom';

// Определяем типы, используемые в GamePage.tsx
export enum MarkerType {
  NPC = 'npc',
  QUEST_POINT = 'quest_point',
  QUEST_AREA = 'quest_area'
}

export enum NpcClass {
  TRADER = 'npc-trader',
  CRAFTSMAN = 'npc-craftsman',
  GUILD_MASTER = 'npc-guild_master',
  STORY = 'npc-story'
}

export enum Faction {
  TRADERS = 'traders',
  CRAFTSMEN = 'craftsmen',
  SCAVENGERS = 'scavengers',
  GUARDIANS = 'guardians',
  NEUTRAL = 'neutral'
}

export interface QuestMarker {
  id: string;
  title: string;
  description?: string;
  markerType?: MarkerType;
  lat: number;
  lng: number;
  radius?: number; // для областей (в метрах)
  isActive?: boolean;
  isCompleted?: boolean;
  qrCode?: string;
  // Для NPC
  npcClass?: NpcClass;
  faction?: Faction;
}

// Определяем интерфейс пропсов для компонента QuestMap
interface QuestMapProps {
  markers?: QuestMarker[];
  onMarkerClick?: (marker: QuestMarker) => Promise<void>;
  center?: [number, number];
  followPlayer?: boolean;
}

// Устанавливаем токен Mapbox из переменных окружения или используем запасной публичный токен
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiaW5vdGkiLCJhIjoiY205MDhqbzFyMGs0dzJsczgzaHA1YWJscyJ9.AnUFZnF1NfhefBtsQLnvdA';
mapboxgl.accessToken = mapboxToken;

// Фиксированные координаты центра: [долгота, широта]
const FIXED_CENTER: [number, number] = [7.84586, 47.99503];

export const QuestMap: FC<QuestMapProps> = ({ markers = [], onMarkerClick, center, followPlayer = false }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, mapboxgl.Marker>>({});
  const playerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Используем хук геолокации с ограниченным числом попыток
  const { position, error: locationError, loading: locationLoading, permissionDenied } = useLocation();

  // Функция для центрирования карты на указанных координатах
  const centerMapOn = useCallback((coords: [number, number]) => {
    if (map.current) {
      map.current.flyTo({
        center: coords,
        zoom: 15,
        essential: true
      });
    }
  }, []);

  // Функция для центрирования карты на позиции игрока
  const centerOnPlayer = useCallback(() => {
    if (position && map.current) {
      console.log('Центрирование на игроке:', position);
      centerMapOn(position);
      setNotification('Карта центрирована на вашем местоположении');
      setTimeout(() => setNotification(null), 2000);
    } else if (permissionDenied) {
      console.log('Доступ к геолокации запрещен, используем фиксированный центр');
      centerMapOn(FIXED_CENTER);
      setNotification('Невозможно определить ваше местоположение. Используется фиксированная точка.');
      setTimeout(() => setNotification(null), 3000);
    }
  }, [position, permissionDenied, centerMapOn]);

  // Инициализация карты
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Используем center из пропсов, если он предоставлен, иначе используем FIXED_CENTER
      const initialCenter = center || FIXED_CENTER;
      console.log('Инициализация карты с центром:', initialCenter);
      
      // Проверяем поддержку WebGL
      if (!mapboxgl.supported()) {
        console.error('WebGL не поддерживается');
        setMapError('Ваш браузер не поддерживает WebGL, необходимый для работы карты');
        return;
      }
      
      // Создаем экземпляр карты с центром из пропсов или фиксированным центром
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: initialCenter,
        zoom: 13,
      });
      
      // Обработчик события загрузки карты
      map.current.on('load', () => {
        console.log('Карта успешно загружена');
      });
      
      // Обработчик ошибок карты
      map.current.on('error', (e) => {
        console.error('Ошибка Mapbox:', e.error);
        setMapError(`Ошибка карты: ${e.error?.message || 'Неизвестная ошибка'}`);
      });

      // Добавляем контрол навигации (приближение/отдаление)
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    } catch (error) {
      console.error('Ошибка при инициализации карты:', error);
      setMapError(`Ошибка при инициализации карты: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Очистка карты при размонтировании компонента
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [center]);

  // Добавление маркеров на карту
  useEffect(() => {
    if (!map.current || !markers.length) return;

    // Очистка текущих маркеров
    Object.values(markerRefs.current).forEach(marker => marker.remove());
    markerRefs.current = {};

    // Добавление новых маркеров
    markers.forEach(marker => {
      try {
        // Создаем DOM элемент для маркера
        const el = document.createElement('div');
        el.className = `map-marker ${marker.markerType || 'quest_point'}`;
        
        // Добавляем классы на основе свойств маркера
        if (marker.isCompleted) el.classList.add('completed');
        if (marker.isActive) el.classList.add('active');
        if (marker.npcClass) el.classList.add(marker.npcClass);
        if (marker.faction) el.classList.add(marker.faction);
        
        // Для областей добавляем доп. стиль и устанавливаем радиус
        if (marker.markerType === MarkerType.QUEST_AREA && marker.radius) {
          el.style.width = `${Math.min(100, marker.radius / 10)}px`;
          el.style.height = `${Math.min(100, marker.radius / 10)}px`;
        }

        // Создаем маркер и добавляем его на карту
        const mapMarker = new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<h3>${marker.title}</h3>${marker.description ? `<p>${marker.description}</p>` : ''}`)
          );
        
        // Проверяем, что карта существует, прежде чем добавлять маркер
        if (map.current) {
          mapMarker.addTo(map.current);
        }
        
        // Добавляем обработчик клика, если он предоставлен
        if (onMarkerClick) {
          el.addEventListener('click', () => {
            onMarkerClick(marker).catch(err => {
              console.error('Ошибка при обработке клика по маркеру:', err);
            });
          });
        }
        
        // Сохраняем ссылку на маркер
        markerRefs.current[marker.id] = mapMarker;
      } catch (error) {
        console.error('Ошибка при добавлении маркера:', error, marker);
      }
    });

    return () => {
      // Очистка при изменении маркеров
      Object.values(markerRefs.current).forEach(marker => marker.remove());
      markerRefs.current = {};
    };
  }, [markers, onMarkerClick]);

  // Отдельный useEffect для центрирования карты на активной точке
  useEffect(() => {
    if (!map.current || !markers.length) return;
    
    // Находим первый активный маркер
    const activeMarker = markers.find(m => m.isActive);
    if (activeMarker) {
      console.log(`Центрирование карты на активной точке: ${activeMarker.title}`, [activeMarker.lng, activeMarker.lat]);
      
      // Используем flyTo для плавного перемещения
      map.current.flyTo({
        center: [activeMarker.lng, activeMarker.lat],
        zoom: 15,
        essential: true,
        duration: 2000 // 2 секунды для плавной анимации
      });
      
      // Показываем уведомление пользователю
      setNotification(`Локация "${activeMarker.title}" отмечена на карте`);
      setTimeout(() => setNotification(null), 3000);
    }
  }, [markers, map.current]);

  // Обновление маркера игрока при изменении его позиции
  useEffect(() => {
    if (!map.current || !position) return;

    // Удаляем старый маркер игрока, если он существует
    if (playerMarkerRef.current) {
      playerMarkerRef.current.remove();
    }

    // Создаем новый элемент для маркера игрока
    const playerEl = document.createElement('div');
    playerEl.className = 'player-marker';
    
    // Создаем и добавляем маркер игрока на карту
    playerMarkerRef.current = new mapboxgl.Marker(playerEl)
      .setLngLat(position)
      .addTo(map.current);
    
    // Если активен режим следования за игроком, центрируем карту на его позиции
    if (followPlayer) {
      centerMapOn(position);
    }

    return () => {
      if (playerMarkerRef.current) {
        playerMarkerRef.current.remove();
        playerMarkerRef.current = null;
      }
    };
  }, [position, followPlayer, centerMapOn]);

  // Обработка ошибок геолокации
  useEffect(() => {
    if (locationError && !permissionDenied) {
      console.log('Ошибка геолокации:', locationError);
      setNotification(`Ошибка определения местоположения: ${locationError}`);
      setTimeout(() => setNotification(null), 3000);
    } else if (permissionDenied) {
      console.log('Доступ к геолокации запрещен');
      setNotification('Доступ к геолокации запрещен. Используются фиксированные координаты.');
      setTimeout(() => setNotification(null), 3000);
    }
  }, [locationError, permissionDenied]);

  return (
    <div className="quest-map">
      {mapError && (
        <div className="map-error-overlay">
          <div className="map-error-message">
            {mapError}
          </div>
        </div>
      )}
      
      {notification && (
        <div className="map-notification">
          {notification}
        </div>
      )}
      
      <div ref={mapContainer} className="quest-map-container" />
      
      <div className="map-controls">
        <button 
          className="center-player-btn"
          onClick={centerOnPlayer}
          disabled={locationLoading || (!position && permissionDenied)}
        >
          {locationLoading ? 'Загрузка...' : 'Моя позиция'}
        </button>
      </div>
      
      <div className="map-info">
        {locationLoading && 'Определение местоположения...'}
        {permissionDenied && 'Доступ к геолокации запрещен'}
      </div>
    </div>
  );
};
