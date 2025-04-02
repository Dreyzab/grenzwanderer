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
  const [mapReady, setMapReady] = useState(false);

  // Используем хук геолокации с ограниченным числом попыток
  const { position, error: locationError, loading: locationLoading, permissionDenied } = useLocation();

  // Функция для центрирования карты на указанных координатах
  const centerMapOn = useCallback((coords: [number, number], zoom: number = 15, duration: number = 1500) => {
    if (map.current) {
      map.current.flyTo({
        center: coords,
        zoom,
        essential: true,
        duration
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
      const mapInstance = map.current;
      mapInstance.on('load', () => {
        console.log('Карта успешно загружена');
        setMapReady(true);

        if (mapInstance) {
          // Добавляем источник данных для областей квестов
          mapInstance.addSource('quest-areas', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });
          
          // Добавляем слой для областей квестов
          mapInstance.addLayer({
            id: 'quest-areas-fill',
            type: 'circle',
            source: 'quest-areas',
            paint: {
              'circle-radius': ['get', 'radius'],
              'circle-color': ['case',
                ['boolean', ['get', 'isActive'], false], 'rgba(74, 158, 255, 0.2)',
                ['boolean', ['get', 'isCompleted'], false], 'rgba(76, 175, 80, 0.2)',
                'rgba(102, 102, 102, 0.2)'
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': ['case',
                ['boolean', ['get', 'isActive'], false], 'rgba(74, 158, 255, 0.8)',
                ['boolean', ['get', 'isCompleted'], false], 'rgba(76, 175, 80, 0.8)',
                'rgba(102, 102, 102, 0.5)'
              ]
            }
          });
        }
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

  // Функция для создания маркера
  const createMarker = useCallback((markerData: QuestMarker) => {
    if (!map.current) return;
    
    // Создаем DOM элемент для маркера
    const el = document.createElement('div');
    
    if (markerData.markerType === MarkerType.QUEST_AREA) {
      // Обработка областей через GeoJSON слой
      return;
    }
    
    el.className = `map-marker ${markerData.markerType || 'quest_point'}`;
    
    // Добавляем классы на основе свойств маркера
    if (markerData.isCompleted) el.classList.add('completed');
    if (markerData.isActive) el.classList.add('active');
    if (markerData.npcClass) el.classList.add(markerData.npcClass);
    if (markerData.faction) el.classList.add(markerData.faction);
    
    // Для активных маркеров добавляем эффект пульсации
    if (markerData.isActive) {
      const pulse = document.createElement('div');
      pulse.className = 'marker-pulse';
      el.appendChild(pulse);
    }
    
    // Создаем попап
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="popup-content">
          <h3>${markerData.title}</h3>
          ${markerData.description ? `<p>${markerData.description}</p>` : ''}
        </div>
      `);
    
    // Создаем маркер и добавляем его на карту
    const mapMarker = new mapboxgl.Marker(el)
      .setLngLat([markerData.lng, markerData.lat])
      .setPopup(popup);
    
    // Добавляем маркер на карту
    if (map.current) {
      mapMarker.addTo(map.current);
    }
    
    // Добавляем обработчик клика, если он предоставлен
    if (onMarkerClick) {
      el.addEventListener('click', () => {
        if (markerData.isActive) {
          onMarkerClick(markerData).catch(err => {
            console.error('Ошибка при обработке клика по маркеру:', err);
          });
        } else {
          // Уведомление о том, что маркер неактивен
          setNotification(`Точка "${markerData.title}" сейчас недоступна`);
          setTimeout(() => setNotification(null), 2000);
        }
      });
    }
    
    // Сохраняем ссылку на маркер
    markerRefs.current[markerData.id] = mapMarker;
  }, [onMarkerClick]);

  // Функция для обновления маркера
  const updateMarker = useCallback((markerData: QuestMarker) => {
    const marker = markerRefs.current[markerData.id];
    if (!marker) return;
    
    // Обновляем позицию
    marker.setLngLat([markerData.lng, markerData.lat]);
    
    // Обновляем всплывающее окно
    const popup = marker.getPopup();
    if (popup) {
      popup.setHTML(`
        <div class="popup-content">
          <h3>${markerData.title}</h3>
          ${markerData.description ? `<p>${markerData.description}</p>` : ''}
        </div>
      `);
    }
    
    // Обновляем стиль маркера
    const el = marker.getElement();
    el.className = `map-marker ${markerData.markerType || 'quest_point'}`;
    
    // Добавляем классы на основе свойств маркера
    if (markerData.isCompleted) el.classList.add('completed');
    if (markerData.isActive) el.classList.add('active');
    if (markerData.npcClass) el.classList.add(markerData.npcClass);
    if (markerData.faction) el.classList.add(markerData.faction);
    
    // Обновляем эффект пульсации
    const pulse = el.querySelector('.marker-pulse');
    if (markerData.isActive && !pulse) {
      const newPulse = document.createElement('div');
      newPulse.className = 'marker-pulse';
      el.appendChild(newPulse);
    } else if (!markerData.isActive && pulse) {
      pulse.remove();
    }
  }, []);

  // Обновление областей квестов
  const updateQuestAreas = useCallback(() => {
    if (!map.current || !mapReady) return;
    
    try {
      const source = map.current.getSource('quest-areas');
      if (!source || !('setData' in source)) return;
      
      // Получаем области из маркеров
      const areaMarkers = markers.filter(marker => marker.markerType === MarkerType.QUEST_AREA);
      
      // Создаем GeoJSON фичи для областей
      const areaFeatures = areaMarkers.map(area => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [area.lng, area.lat]
        },
        properties: {
          id: area.id,
          title: area.title,
          description: area.description,
          radius: (area.radius || 40) / (map.current?.getZoom() || 10) * 5, // Масштабируем радиус в зависимости от зума
          isActive: area.isActive,
          isCompleted: area.isCompleted
        }
      }));
      
      // Обновляем источник данных
      source.setData({
        type: 'FeatureCollection' as const,
        features: areaFeatures
      });
    } catch (error) {
      console.error('Ошибка при обновлении областей:', error);
    }
  }, [markers, mapReady]);

  // Добавление маркеров на карту
  useEffect(() => {
    if (!map.current) return;
    
    // Обновляем области квестов
    updateQuestAreas();
    
    // Получаем обычные маркеры (не области)
    const pointMarkers = markers.filter(marker => marker.markerType !== MarkerType.QUEST_AREA);

    // Удаляем маркеры, которых больше нет в данных
    Object.keys(markerRefs.current).forEach(id => {
      if (!pointMarkers.some(m => m.id === id)) {
        markerRefs.current[id].remove();
        delete markerRefs.current[id];
      }
    });
    
    // Добавляем новые или обновляем существующие маркеры
    pointMarkers.forEach(markerData => {
      if (markerRefs.current[markerData.id]) {
        updateMarker(markerData);
      } else {
        createMarker(markerData);
      }
    });

    // Находим активный маркер для центрирования
    const activeMarker = markers.find(m => m.isActive);
    if (activeMarker) {
      console.log(`Центрирование карты на активной точке: ${activeMarker.title}`, [activeMarker.lng, activeMarker.lat]);
      
      // Задержка для плавности (чтобы карта сначала загрузилась)
      setTimeout(() => {
        if (map.current) {
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
      }, 300);
    }
    
    return () => {
      // Очистка маркеров при изменении маркеров
      Object.values(markerRefs.current).forEach(marker => marker.remove());
      markerRefs.current = {};
    };
  }, [markers, createMarker, updateMarker, updateQuestAreas]);

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
