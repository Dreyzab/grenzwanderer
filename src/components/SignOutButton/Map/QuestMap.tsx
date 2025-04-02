import React, { useState, useEffect, useRef, useMemo, FC } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '../../../hooks/useLocatiom';
import './QuestMap.css';

// Получаем токен из переменных окружения
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'sk.eyJ1IjoiaW5vdGkiLCJhIjoiY205MDNmMGN5MGhrZzJqc2Q2bmNrYXg5ZSJ9.iJmsnFEecg9k9H1ApnkE2Q';

// Типы маркеров
export enum MarkerType {
  NPC = 'npc',
  QUEST_POINT = 'quest_point',
  QUEST_AREA = 'quest_area'
}

// Фракции
export enum Faction {
  TRADERS = 'traders',
  CRAFTSMEN = 'craftsmen',
  GOVERNMENT = 'government',
  NEUTRAL = 'neutral'
}

// Типы NPC
export enum NpcClass {
  TRADER = 'trader',
  CRAFTSMAN = 'craftsman',
  GUILD_MASTER = 'guild_master',
  STORY = 'story'
}

// Интерфейс для маркеров
export interface QuestMarker {
  id: string;
  title: string;
  description?: string;
  markerType?: MarkerType;
  lat: number;
  lng: number;
  radius?: number; // для областей (в метрах)
  isActive: boolean;
  isCompleted: boolean;
  qrCode?: string;
  // Для NPC
  npcClass?: NpcClass;
  faction?: Faction;
}

interface QuestMapProps {
  markers?: QuestMarker[];
  onMarkerClick?: (marker: QuestMarker) => void;
  center?: [number, number];
  zoom?: number;
  followPlayer?: boolean;
}

export const QuestMap: FC<QuestMapProps> = ({
  markers = [],
  onMarkerClick,
  center,
  zoom = 12,
  followPlayer = true,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { position, error } = useLocation();
  
  // Используем refs для хранения маркеров, чтобы избежать пересоздания при каждом рендере
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const popupsRef = useRef<{ [key: string]: mapboxgl.Popup }>({});
  const playerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const playerTrackingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isTrackingPlayer, setIsTrackingPlayer] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Мемоизируем маркеры для оптимизации
  const memoizedMarkers = useMemo(() => markers, [markers]);
  
  // Инициализация карты только при первом рендере
  useEffect(() => {
    if (!mapContainer.current || mapInitialized) return;
    
    try {
      console.log('Initializing map...');
      
      // Проверяем размеры контейнера
      const { clientWidth, clientHeight } = mapContainer.current;
      if (clientWidth === 0 || clientHeight === 0) {
        console.error('Map container has zero dimension');
        setMapError('Контейнер карты имеет нулевые размеры');
        return;
      }
      
      // Проверяем поддержку WebGL
      if (!mapboxgl.supported()) {
        console.error('WebGL not supported');
        setMapError('Ваш браузер не поддерживает WebGL, необходимый для работы карты');
        setLoading(false);
        return;
      }
      
      // Определяем начальные координаты
      const initialCenter = center || (position ? [position[1], position[0]] : [30.3056, 59.9391]);
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: initialCenter as [number, number],
        zoom: zoom,
        pitchWithRotate: false,
        attributionControl: false
      });
      
      // Добавляем элементы управления
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: false
        }), 
        'bottom-right'
      );
      
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }), 
        'bottom-right'
      );
      
      // Обработчик загрузки карты
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setLoading(false);
        setMapInitialized(true);
        
        // Создаем источник данных для областей квестов
        if (map.current) {
          map.current.addSource('quest-areas', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });
          
          // Добавляем слои для областей
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
          
          // Слой для неактивных областей
          map.current.addLayer({
            id: 'quest-areas-inactive',
            type: 'circle',
            source: 'quest-areas',
            paint: {
              'circle-radius': ['get', 'radius'],
              'circle-color': 'rgba(102, 102, 102, 0.2)',
              'circle-stroke-width': 1,
              'circle-stroke-color': 'rgba(102, 102, 102, 0.8)'
            },
            filter: ['==', ['get', 'isActive'], false]
          });
          
          // Слой для завершенных областей
          map.current.addLayer({
            id: 'quest-areas-completed',
            type: 'circle',
            source: 'quest-areas',
            paint: {
              'circle-radius': ['get', 'radius'],
              'circle-color': 'rgba(76, 175, 80, 0.2)',
              'circle-stroke-width': 2,
              'circle-stroke-color': 'rgba(76, 175, 80, 0.8)'
            },
            filter: ['==', ['get', 'isCompleted'], true]
          });
        }
      });
      
      // Обработчик ошибки
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError(`Ошибка карты: ${e.error ? e.error.message : 'Неизвестная ошибка'}`);
      });
      
      // Таймаут для предотвращения бесконечной загрузки
      const timeout = setTimeout(() => {
        if (loading && !mapInitialized) {
          console.warn('Map load timeout after 10 seconds');
          setLoading(false);
          setMapInitialized(true);
        }
      }, 10000);
      
      return () => {
        // Очистка при размонтировании
        clearTimeout(timeout);
        stopPlayerTracking();
        
        // Удаляем все маркеры
        Object.values(markersRef.current).forEach(marker => marker.remove());
        
        // Удаляем маркер игрока
        if (playerMarkerRef.current) {
          playerMarkerRef.current.remove();
          playerMarkerRef.current = null;
        }
        
        // Удаляем карту
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError(`Ошибка инициализации карты: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      setLoading(false);
    }
  }, []);
  
  // Функция для центрирования на игроке и активации отслеживания
  const centerOnPlayer = () => {
    if (!map.current || !position) return;
    
    // Центрируем карту на позиции игрока
    map.current.flyTo({
      center: [position[1], position[0]],
      zoom: 15,
      speed: 1.5
    });
    
    // Создаем или обновляем маркер игрока
    createOrUpdatePlayerMarker();
    
    // Активируем временное отслеживание
    startPlayerTracking();
  };
  
  // Создание или обновление маркера игрока
  const createOrUpdatePlayerMarker = () => {
    if (!map.current || !position) return;
    
    if (!playerMarkerRef.current) {
      // Создаем HTML-элемент для маркера игрока
      const el = document.createElement('div');
      el.className = 'player-marker';
      
      // Добавляем пульсацию
      const pulse = document.createElement('div');
      pulse.className = 'player-marker-pulse';
      el.appendChild(pulse);
      
      // Создаем маркер
      playerMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([position[1], position[0]])
        .addTo(map.current);
    } else {
      // Обновляем позицию существующего маркера
      playerMarkerRef.current.setLngLat([position[1], position[0]]);
    }
  };
  
  // Запуск временного отслеживания игрока
  const startPlayerTracking = () => {
    // Останавливаем предыдущее отслеживание, если оно было
    stopPlayerTracking();
    
    // Устанавливаем флаг отслеживания
    setIsTrackingPlayer(true);
    
    // Устанавливаем таймер для остановки отслеживания через 30 секунд
    playerTrackingTimerRef.current = setTimeout(() => {
      setIsTrackingPlayer(false);
      console.log('Player tracking stopped after 30 seconds');
    }, 30000);
  };
  
  // Остановка отслеживания игрока
  const stopPlayerTracking = () => {
    if (playerTrackingTimerRef.current) {
      clearTimeout(playerTrackingTimerRef.current);
      playerTrackingTimerRef.current = null;
    }
    setIsTrackingPlayer(false);
  };
  
  // Обновляем маркер игрока при изменении его позиции, если активно отслеживание
  // или если нужно всегда следовать за игроком
  useEffect(() => {
    if (!map.current || loading || !position || !mapInitialized) return;
    
    // Создаем или обновляем маркер игрока
    createOrUpdatePlayerMarker();
    
    // Если нужно следовать за игроком или активно отслеживание, центрируем карту
    if (followPlayer || isTrackingPlayer) {
      map.current.flyTo({
        center: [position[1], position[0]],
        speed: 0.5
      });
    }
  }, [position, loading, followPlayer, isTrackingPlayer, mapInitialized]);
  
  // Создание и обновление маркеров и областей квестов
  useEffect(() => {
    if (!map.current || loading || !mapInitialized) return;
    
    try {
      // Сначала собираем IDs текущих маркеров
      const currentMarkerIds = new Set(Object.keys(markersRef.current));
      const newMarkerIds = new Set(memoizedMarkers.map(m => m.id));
      
      // Удаляем маркеры, которых больше нет в списке
      currentMarkerIds.forEach(id => {
        if (!newMarkerIds.has(id)) {
          if (markersRef.current[id]) {
            markersRef.current[id].remove();
            delete markersRef.current[id];
          }
          if (popupsRef.current[id]) {
            popupsRef.current[id].remove();
            delete popupsRef.current[id];
          }
        }
      });
      
      // Создаем GeoJSON для областей квестов
      const areaFeatures: GeoJSON.Feature[] = [];
      
      // Обновляем или создаем маркеры
      memoizedMarkers.forEach(marker => {
        const markerType = marker.markerType || MarkerType.QUEST_POINT;
        
        // Если это область квеста, добавляем в GeoJSON
        if (markerType === MarkerType.QUEST_AREA && marker.radius) {
          areaFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [marker.lng, marker.lat]
            },
            properties: {
              id: marker.id,
              title: marker.title,
              description: marker.description || '',
              radius: marker.radius,
              isActive: marker.isActive,
              isCompleted: marker.isCompleted
            }
          });
          
          // Пропускаем создание маркера для области
          return;
        }
        
        // Если маркер уже существует, обновляем его позицию и другие свойства
        if (markersRef.current[marker.id]) {
          markersRef.current[marker.id].setLngLat([marker.lng, marker.lat]);
          return;
        }
        
        // Создаем элемент маркера
        const markerElement = document.createElement('div');
        markerElement.className = `marker ${markerType} ${marker.isActive ? 'active' : 'inactive'} ${marker.isCompleted ? 'completed' : ''}`;
        
        // Добавляем CSS-класс для NPC
        if (markerType === MarkerType.NPC && marker.npcClass) {
          markerElement.classList.add(`npc-${marker.npcClass}`);
        }
        
        // Добавляем пульсацию для активных маркеров
        if (marker.isActive && !marker.isCompleted) {
          const pulseElement = document.createElement('div');
          pulseElement.className = 'marker-pulse';
          markerElement.appendChild(pulseElement);
        }
        
        // Создаем popup с информацией
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        });
        
        // Настраиваем содержимое попапа в зависимости от типа маркера
        let popupContent = '';
        
        if (markerType === MarkerType.NPC) {
          popupContent = `
            <div class="popup-content">
              <div class="popup-title">${marker.title}</div>
              <div class="popup-info">
                ${marker.npcClass ? `<div class="popup-row">Класс: ${getFriendlyNpcClassName(marker.npcClass)}</div>` : ''}
                ${marker.faction ? `<div class="popup-row">Фракция: ${getFriendlyFactionName(marker.faction)}</div>` : ''}
                ${marker.description ? `<div class="popup-description">${marker.description}</div>` : ''}
              </div>
              ${marker.isActive && !marker.isCompleted && marker.qrCode ? 
                `<button class="popup-button">Взаимодействовать</button>` : ''}
            </div>
          `;
        } else {
          popupContent = `
            <div class="popup-content">
              <div class="popup-title">${marker.title}</div>
              ${marker.description ? `<div class="popup-description">${marker.description}</div>` : ''}
              ${marker.isActive && !marker.isCompleted && marker.qrCode ? 
                `<button class="popup-button">Активировать</button>` : ''}
            </div>
          `;
        }
        
        popup.setHTML(popupContent);
        
        // Создаем маркер и привязываем popup
        const mapboxMarker = new mapboxgl.Marker(markerElement)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map.current!);
        
        // Сохраняем маркер и popup по ID для быстрого доступа
        markersRef.current[marker.id] = mapboxMarker;
        popupsRef.current[marker.id] = popup;
        
        // Добавляем обработчик клика на кнопку в попапе
        popup.on('open', () => {
          setTimeout(() => {
            const button = document.querySelector('.popup-button');
            if (button && onMarkerClick) {
              button.addEventListener('click', () => {
                popup.remove();
                onMarkerClick(marker);
              });
            }
          }, 100); // Небольшая задержка для DOM
        });
      });
      
      // Обновляем источник данных для областей квестов
      if (map.current && map.current.getSource('quest-areas')) {
        const source = map.current.getSource('quest-areas') as mapboxgl.GeoJSONSource;
        source.setData({
          type: 'FeatureCollection',
          features: areaFeatures
        });
      }
      
      // Если есть маркеры и нет следования за игроком, центрируем карту на всех маркерах
      if (memoizedMarkers.length > 0 && !followPlayer && !isTrackingPlayer) {
        const bounds = new mapboxgl.LngLatBounds();
        memoizedMarkers.forEach(marker => {
          bounds.extend([marker.lng, marker.lat]);
        });
        
        // Если у нас есть позиция игрока, добавляем ее в границы
        if (position) {
          bounds.extend([position[1], position[0]]);
        }
        
        map.current!.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    } catch (err) {
      console.error('Error updating markers:', err);
      setMapError('Ошибка при обновлении маркеров на карте.');
    }
  }, [memoizedMarkers, loading, onMarkerClick, followPlayer, isTrackingPlayer, mapInitialized]);
  
  // Вспомогательные функции для отображения строковых значений
  const getFriendlyNpcClassName = (npcClass: NpcClass): string => {
    switch (npcClass) {
      case NpcClass.TRADER: return 'Торговец';
      case NpcClass.CRAFTSMAN: return 'Мастеровой';
      case NpcClass.GUILD_MASTER: return 'Глава гильдии';
      case NpcClass.STORY: return 'Сюжетный персонаж';
      default: return npcClass;
    }
  };
  
  const getFriendlyFactionName = (faction: Faction): string => {
    switch (faction) {
      case Faction.TRADERS: return 'Торговцы';
      case Faction.CRAFTSMEN: return 'Мастеровые';
      case Faction.GOVERNMENT: return 'Госслужащие';
      case Faction.NEUTRAL: return 'Нейтралы';
      default: return faction;
    }
  };
  
  // Показываем загрузку
  if (loading) {
    return (
      <div className="quest-map-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка карты...</p>
      </div>
    );
  }
  
  // Показываем ошибку геолокации
  if (error) {
    return (
      <div className="quest-map-error">
        <p>{error}</p>
        <p>Карта доступна, но без определения вашего местоположения.</p>
        <button onClick={() => window.location.reload()}>
          Попробовать снова
        </button>
      </div>
    );
  }
  
  // Показываем ошибку карты
  if (mapError) {
    return (
      <div className="quest-map-error">
        <p>{mapError}</p>
        <button onClick={() => window.location.reload()}>
          Обновить
        </button>
      </div>
    );
  }
  
  return (
    <div className="quest-map">
      <div ref={mapContainer} className="quest-map-container"></div>
      
      {/* Кнопка для центрирования на игроке */}
      {position && (
        <button
          className={`center-player-button ${isTrackingPlayer ? 'tracking' : ''}`}
          onClick={centerOnPlayer}
          title="Центрировать на моем местоположении"
        >
          <span className="center-icon">📍</span>
          {isTrackingPlayer && <span className="tracking-timer">30</span>}
        </button>
      )}
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker npc"></div>
          <span>NPC</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker quest_point"></div>
          <span>Точка задания</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker quest_area"></div>
          <span>Область задания</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker active"></div>
          <span>Активные точки</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker completed"></div>
          <span>Завершенные точки</span>
        </div>
      </div>
    </div>
  );
};
