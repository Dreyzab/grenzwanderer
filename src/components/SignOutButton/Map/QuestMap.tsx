import React, { useState, useEffect, useRef, useMemo, FC, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation, DEFAULT_LOCATION as FIXED_LOCATION } from '../../../hooks/useLocatiom';
import './QuestMap.css';

// Получаем токен из переменных окружения
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'sk.eyJ1IjoiaW5vdGkiLCJhIjoiY205MDNmMGN5MGhrZzJqc2Q2bmNrYXg5ZSJ9.iJmsnFEecg9k9H1ApnkE2Q';

// Добавляем логирование токена
console.log('Mapbox token used:', mapboxgl.accessToken ? mapboxgl.accessToken.substring(0, 10) + '...' : 'не задан');

// Фиксированные координаты для использования при отсутствии геолокации
// 47°59'42.1"N 7°50'45.1"E
const DEFAULT_LOCATION: [number, number] = FIXED_LOCATION;

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
  const { 
    position, 
    error, 
    loading: geoLoading, 
    requestGeolocation, 
    permissionDenied, 
    useDefaultLocation, 
    isUsingDefaultLocation 
  } = useLocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
  
  // Добавляем локальные состояния
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [geolocationAttempted, setGeolocationAttempted] = useState(false);
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);
  const [isTrackingPlayer, setIsTrackingPlayer] = useState(false);
  const [mapNotification, setMapNotification] = useState<string | null>(null);
  
  // Мемоизируем маркеры для оптимизации
  const memoizedMarkers = useMemo(() => markers, [markers]);
  
  // Функция для центрирования на фиксированных координатах
  const centerOnFixedLocation = useCallback(() => {
    if (!map.current || !mapInitialized) return;
    
    console.log('Центрирование на фиксированных координатах:', DEFAULT_LOCATION);
    
    // Применяем плавную анимацию при центрировании
    map.current.flyTo({
      center: [DEFAULT_LOCATION[1], DEFAULT_LOCATION[0]],
      zoom: 13,
      speed: 1.5,
      essential: true // Важный параметр для обеспечения работы даже при низкой производительности
    });
    
    // Показываем временное уведомление
    setMapNotification('Карта центрирована на фиксированных координатах');
    setTimeout(() => setMapNotification(null), 3000);
    
    // Останавливаем отслеживание игрока
    setIsTrackingPlayer(false);
  }, [map, mapInitialized]);
  
  // Обновляем функцию обработки ошибок с более детальной диагностикой
  useEffect(() => {
    if (error) {
      console.log('Обработка ошибки геолокации в QuestMap:', error);
      
      if (permissionDenied) {
        setGeoPermissionDenied(true);
        
        // Отображаем уведомление о переключении на фиксированную локацию
        setMapNotification('Доступ к геолокации запрещен. Используется фиксированная локация.');
        setTimeout(() => setMapNotification(null), 5000);
        
        // Центрируем карту на фиксированных координатах
        centerOnFixedLocation();
      } else if (!position && isUsingDefaultLocation) {
        // Если используется фиксированная локация, но еще не центрировались
        centerOnFixedLocation();
      }
    }
  }, [error, permissionDenied, position, isUsingDefaultLocation, centerOnFixedLocation]);
  
  // Используем refs для хранения маркеров, чтобы избежать пересоздания при каждом рендере
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const popupsRef = useRef<{ [key: string]: mapboxgl.Popup }>({});
  const playerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const playerTrackingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Добавляем функцию для обработки ошибок геолокации отдельно
  const handleGeolocationError = useCallback((geoLocError: GeolocationPositionError) => {
    let errorMessage = 'Неизвестная ошибка при получении местоположения';
    
    switch (geoLocError.code) {
      case 1:
        errorMessage = 'Доступ к определению местоположения запрещен';
        setGeoPermissionDenied(true);
        break;
      case 2:
        errorMessage = 'Не удалось определить местоположение';
        break;
      case 3:
        errorMessage = 'Превышено время ожидания при определении местоположения';
        break;
    }
    
    console.error('Ошибка геолокации:', errorMessage, geoLocError);
    
    // Не блокируем отображение карты при ошибке геолокации
    setGeolocationAttempted(true);
    
    // Показываем уведомление пользователю
    if (!mapError) {
      // Временно показываем ошибку, но через 5 секунд скрываем
      setMapError(errorMessage);
      setTimeout(() => setMapError(null), 5000);
    }
    
    // Центрируем карту на фиксированном местоположении при ошибке геолокации
    if (map.current && mapInitialized) {
      console.log('Центрирование на фиксированном местоположении из-за ошибки геолокации');
      map.current.flyTo({
        center: [DEFAULT_LOCATION[1], DEFAULT_LOCATION[0]],
        zoom: 13,
        speed: 1.5
      });
    }
    
    // Предлагаем использовать фиксированную локацию
    useDefaultLocation();
  }, [mapError, mapInitialized, useDefaultLocation]);
  
  // Функция для получения геолокации напрямую
  const triggerGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Геолокация не поддерживается в этом браузере');
      return;
    }
    
    setGeolocationAttempted(true);
    requestGeolocation();
  }, [requestGeolocation]);
  
  // Попытка запросить геолокацию при монтировании
  useEffect(() => {
    if (!geolocationAttempted && !position) {
      triggerGeolocation();
    }
  }, [geolocationAttempted, position, triggerGeolocation]);
  
  // Инициализация карты только при первом рендере
  useEffect(() => {
    if (!mapContainer.current || mapInitialized) return;
    
    try {
      console.log('Initializing map...', {
        containerExists: !!mapContainer.current,
        containerDimensions: mapContainer.current ? 
          `${mapContainer.current.clientWidth}x${mapContainer.current.clientHeight}` : 'unknown',
        webGLSupported: mapboxgl.supported(),
        position: position ? `${position[0]}, ${position[1]}` : 'unavailable',
        center: center ? `${center[0]}, ${center[1]}` : 'using default',
        defaultLocation: `${DEFAULT_LOCATION[0]}, ${DEFAULT_LOCATION[1]}`
      });
      
      // Проверяем размеры контейнера
      const { clientWidth, clientHeight } = mapContainer.current;
      if (clientWidth === 0 || clientHeight === 0) {
        console.error('Map container has zero dimension', {
          width: clientWidth,
          height: clientHeight,
          container: mapContainer.current
        });
        // Не блокируем дальнейшую инициализацию, попробуем создать карту в любом случае
        // setMapError('Контейнер карты имеет нулевые размеры');
        // return;
      }
      
      // Проверяем поддержку WebGL
      if (!mapboxgl.supported()) {
        console.error('WebGL not supported');
        setMapError('Ваш браузер не поддерживает WebGL, необходимый для работы карты');
        setLoading(false);
        return;
      }
      
      // Определяем начальные координаты
      const initialCenter = center || (position ? [position[1], position[0]] : [DEFAULT_LOCATION[1], DEFAULT_LOCATION[0]]);
      console.log('Using initial center:', initialCenter);
      
      // Настройки для карты с защитой от ошибок
      let effectiveCenter: [number, number];
      try {
        effectiveCenter = initialCenter as [number, number];
        // Проверяем корректность значений
        if (isNaN(effectiveCenter[0]) || isNaN(effectiveCenter[1])) {
          throw new Error('Invalid center coordinates');
        }
      } catch (err) {
        console.error('Invalid center coordinates', initialCenter);
        effectiveCenter = [DEFAULT_LOCATION[1], DEFAULT_LOCATION[0]]; // Дефолтные координаты при ошибке
      }
      
      // Настройки для карты
      const mapOptions = {
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: effectiveCenter,
        zoom: zoom,
        pitchWithRotate: false,
        attributionControl: false,
        // Разрешаем навигацию по всему миру без ограничений
        maxBounds: undefined
      };
      console.log('Creating map with options:', mapOptions);
      
      // Создаем карту с обработчиком ошибок
      try {
        map.current = new mapboxgl.Map(mapOptions);
        console.log('Map instance created successfully');
      } catch (mapErr) {
        console.error('Failed to create map instance:', mapErr);
        setMapError(`Не удалось создать экземпляр карты: ${mapErr instanceof Error ? mapErr.message : 'Неизвестная ошибка'}`);
        setLoading(false);
        return;
      }
      
      // Добавляем дополнительные обработчики событий
      map.current.on('styledata', () => {
        console.log('Map style loaded');
      });
      
      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('Map source loaded:', e.sourceId);
        }
      });
      
      // Добавляем элементы управления
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: false
        }), 
        'bottom-right'
      );
      console.log('Navigation control added');
      
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }), 
        'bottom-right'
      );
      console.log('Geolocate control added');
      
      // Обработчик загрузки карты
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setLoading(false);
        setMapInitialized(true);
        
        // Создаем источник данных для областей квестов
        if (map.current) {
          try {
            map.current.addSource('quest-areas', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            });
            console.log('Quest areas source added successfully');
            
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
            console.log('Active quest areas layer added');
            
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
          } catch (sourceErr) {
            console.error('Error creating map sources/layers:', sourceErr);
            setMapError(`Ошибка при создании слоев карты: ${sourceErr instanceof Error ? sourceErr.message : 'Неизвестная ошибка'}`);
          }
        }
      });
      
      // Улучшаем обработчик ошибки карты
      map.current.on('error', (e) => {
        const errorSource = e.error || { message: 'Unknown error' };
        console.error('Mapbox error:', {
          error: e.error,
          message: errorSource.message,
          stack: errorSource.stack,
          eventType: e.type
        });
        
        // Временно показываем ошибку, а затем скрываем
        setMapError(`Ошибка карты: ${errorSource.message}`);
        setTimeout(() => setMapError(null), 5000);
      });
      
      // Дополнительный обработчик для ошибок данных
      map.current.on('dataloading', (e) => {
        console.log('Map data loading:', e.dataType);
      });
      
      // Таймаут для предотвращения бесконечной загрузки
      const timeout = setTimeout(() => {
        if (loading && !mapInitialized) {
          console.warn('Map load timeout after 10 seconds', {
            mapRef: !!map.current,
            mapLoaded: map.current ? map.current.loaded() : false,
            mapStyle: map.current ? map.current.getStyle() : null
          });
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
      console.error('Error initializing map:', err, {
        stack: err instanceof Error ? err.stack : undefined,
        mapboxSupported: mapboxgl.supported(),
        mapboxVersion: mapboxgl.version,
        browser: navigator.userAgent
      });
      setMapError(`Ошибка инициализации карты: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      setLoading(false);
    }
  }, [center, mapInitialized, position, requestGeolocation, zoom]);
  
  // Функция для центрирования на игроке и активации отслеживания
  const centerOnPlayer = () => {
    if (!map.current || !position) {
      // Если позиция недоступна, центрируем на фиксированном местоположении
      centerOnFixedLocation();
      return;
    }
    
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
    if (!map.current || !position) {
      console.log('Cannot create player marker - map or position not available');
      return;
    }
    
    console.log('Creating/updating player marker at', [position[1], position[0]]);
    
    if (!playerMarkerRef.current) {
      // Создаем HTML-элемент для маркера игрока
      const el = document.createElement('div');
      el.className = 'player-marker';
      
      // Добавляем пульсацию
      const pulse = document.createElement('div');
      pulse.className = 'player-marker-pulse';
      el.appendChild(pulse);
      
      // Создаем маркер
      try {
        playerMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat([position[1], position[0]])
          .addTo(map.current);
        console.log('Player marker created successfully');
      } catch (err) {
        console.error('Error creating player marker:', err);
      }
    } else {
      // Обновляем позицию существующего маркера
      try {
        playerMarkerRef.current.setLngLat([position[1], position[0]]);
        console.log('Player marker position updated');
      } catch (err) {
        console.error('Error updating player marker position:', err);
      }
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
    if (!map.current || loading || !mapInitialized) {
      console.log('Skipping markers update', {
        mapExists: !!map.current,
        loading,
        mapInitialized
      });
      return;
    }
    
    try {
      console.log('Updating markers', {
        markerCount: memoizedMarkers.length,
        existingMarkerCount: Object.keys(markersRef.current).length
      });
      
      // Сначала собираем IDs текущих маркеров
      const currentMarkerIds = new Set(Object.keys(markersRef.current));
      const newMarkerIds = new Set(memoizedMarkers.map(m => m.id));
      
      // Удаляем маркеры, которых больше нет в списке
      currentMarkerIds.forEach(id => {
        if (!newMarkerIds.has(id)) {
          console.log(`Removing marker with id: ${id}`);
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
          console.log(`Adding quest area: ${marker.id}`, marker);
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
          console.log(`Updating existing marker: ${marker.id}`);
          markersRef.current[marker.id].setLngLat([marker.lng, marker.lat]);
          return;
        }
        
        console.log(`Creating new marker: ${marker.id}`, marker);
        
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
        try {
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
          
          console.log(`Marker ${marker.id} added to map`);
          
          // Сохраняем маркер и popup по ID для быстрого доступа
          markersRef.current[marker.id] = mapboxMarker;
          popupsRef.current[marker.id] = popup;
          
          // Добавляем обработчик клика на кнопку в попапе
          popup.on('open', () => {
            console.log(`Popup opened for marker ${marker.id}`);
            setTimeout(() => {
              const button = document.querySelector('.popup-button');
              if (button && onMarkerClick) {
                button.addEventListener('click', () => {
                  console.log(`Popup button clicked for marker ${marker.id}`);
                  popup.remove();
                  onMarkerClick(marker);
                });
              }
            }, 100); // Небольшая задержка для DOM
          });
        } catch (err) {
          console.error(`Error creating marker ${marker.id}:`, err);
        }
      });
      
      // Обновляем источник данных для областей квестов
      if (map.current && map.current.getSource('quest-areas')) {
        console.log('Updating quest areas source', { featureCount: areaFeatures.length });
        try {
          const source = map.current.getSource('quest-areas') as mapboxgl.GeoJSONSource;
          source.setData({
            type: 'FeatureCollection',
            features: areaFeatures
          });
        } catch (err) {
          console.error('Error updating quest areas source:', err);
        }
      } else {
        console.warn('Quest areas source not found on map');
      }
      
      // Если есть маркеры и нет следования за игроком, центрируем карту на всех маркерах
      if (memoizedMarkers.length > 0 && !followPlayer && !isTrackingPlayer) {
        console.log('Fitting bounds to include all markers');
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
      console.error('Error updating markers:', err, {
        stack: err instanceof Error ? err.stack : undefined,
        markers: memoizedMarkers.length,
        mapLoaded: map.current.loaded()
      });
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
        <p className="debug-info">WebGL поддерживается: {mapboxgl.supported() ? 'Да' : 'Нет'}</p>
      </div>
    );
  }
  
  // Показываем ошибку геолокации или карты со стилизацией
  if (mapError) {
    return (
      <div className="quest-map">
        <div ref={mapContainer} className="quest-map-container"></div>
        
        {/* Индикатор режима локации */}
        {isUsingDefaultLocation && (
          <div className="location-mode-indicator">
            <span className="fixed-location-indicator">Используется фиксированная локация</span>
          </div>
        )}
        
        {/* Временные уведомления */}
        {mapNotification && (
          <div className="map-notification">
            <span>{mapNotification}</span>
          </div>
        )}
        
        {/* Ошибки карты */}
        {mapError && (
          <div className="map-error-overlay">
            <div className="map-error-content">
              <p>{mapError}</p>
              <button onClick={() => setMapError(null)}>Закрыть</button>
              {!isUsingDefaultLocation && (
                <button onClick={useDefaultLocation} className="fixed-location-button">
                  Использовать фиксированную локацию
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Ошибки геолокации */}
        {error && !position && (
          <div className="geolocation-error-overlay">
            <div className="geolocation-error-content">
              <p>{error}</p>
              <div className="error-buttons">
                <button 
                  onClick={requestGeolocation}
                  disabled={geoPermissionDenied}
                  className="retry-button"
                >
                  {geoPermissionDenied ? 'Доступ запрещен' : 'Повторить определение'}
                </button>
                <button 
                  onClick={useDefaultLocation}
                  className="fixed-location-button"
                >
                  Использовать фиксированную локацию
                </button>
              </div>
              {geoPermissionDenied && (
                <p className="permission-hint">
                  Для включения геолокации, разрешите доступ к местоположению в настройках браузера и перезагрузите страницу
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Индикатор загрузки */}
        {geoLoading && !position && (
          <div className="geolocation-loading-overlay">
            <div className="geolocation-loading-content">
              <div className="loading-spinner"></div>
              <p>Определение местоположения...</p>
            </div>
          </div>
        )}
        
        {/* Кнопка для центрирования на игроке или на фиксированных координатах */}
        <button
          className={`center-player-button ${isTrackingPlayer ? 'tracking' : ''}`}
          onClick={position ? centerOnPlayer : centerOnFixedLocation}
          title={position && !isUsingDefaultLocation ? "Центрировать на моем местоположении" : "Центрировать на фиксированном местоположении"}
        >
          <span className="center-icon">📍</span>
          {isTrackingPlayer && <span className="tracking-timer">30</span>}
        </button>
        
        {/* Кнопка для переключения между реальной геолокацией и фиксированной */}
        {isUsingDefaultLocation && !geoPermissionDenied ? (
          <button
            className="real-location-button map-button"
            onClick={requestGeolocation}
            title="Попробовать определить моё местоположение"
          >
            <span className="real-location-icon">🔄</span>
          </button>
        ) : (
          position && !isUsingDefaultLocation && (
            <button
              className="fixed-location-button map-button"
              onClick={centerOnFixedLocation}
              title="Центрировать на фиксированной локации"
            >
              <span className="fixed-location-icon">🏠</span>
            </button>
          )
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
  }
  
  return (
    <div className="quest-map">
      <div ref={mapContainer} className="quest-map-container"></div>
      
      {/* Индикатор режима локации */}
      {isUsingDefaultLocation && (
        <div className="location-mode-indicator">
          <span className="fixed-location-indicator">Используется фиксированная локация</span>
        </div>
      )}
      
      {/* Временные уведомления */}
      {mapNotification && (
        <div className="map-notification">
          <span>{mapNotification}</span>
        </div>
      )}
      
      {/* Ошибки карты */}
      {mapError && (
        <div className="map-error-overlay">
          <div className="map-error-content">
            <p>{mapError}</p>
            <button onClick={() => setMapError(null)}>Закрыть</button>
            {!isUsingDefaultLocation && (
              <button onClick={useDefaultLocation} className="fixed-location-button">
                Использовать фиксированную локацию
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Ошибки геолокации */}
      {error && !position && (
        <div className="geolocation-error-overlay">
          <div className="geolocation-error-content">
            <p>{error}</p>
            <div className="error-buttons">
              <button 
                onClick={requestGeolocation}
                disabled={geoPermissionDenied}
                className="retry-button"
              >
                {geoPermissionDenied ? 'Доступ запрещен' : 'Повторить определение'}
              </button>
              <button 
                onClick={useDefaultLocation}
                className="fixed-location-button"
              >
                Использовать фиксированную локацию
              </button>
            </div>
            {geoPermissionDenied && (
              <p className="permission-hint">
                Для включения геолокации, разрешите доступ к местоположению в настройках браузера и перезагрузите страницу
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Индикатор загрузки */}
      {geoLoading && !position && (
        <div className="geolocation-loading-overlay">
          <div className="geolocation-loading-content">
            <div className="loading-spinner"></div>
            <p>Определение местоположения...</p>
          </div>
        </div>
      )}
      
      {/* Кнопка для центрирования на игроке или на фиксированных координатах */}
      <button
        className={`center-player-button ${isTrackingPlayer ? 'tracking' : ''}`}
        onClick={position ? centerOnPlayer : centerOnFixedLocation}
        title={position && !isUsingDefaultLocation ? "Центрировать на моем местоположении" : "Центрировать на фиксированном местоположении"}
      >
        <span className="center-icon">📍</span>
        {isTrackingPlayer && <span className="tracking-timer">30</span>}
      </button>
      
      {/* Кнопка для переключения между реальной геолокацией и фиксированной */}
      {isUsingDefaultLocation && !geoPermissionDenied ? (
        <button
          className="real-location-button map-button"
          onClick={requestGeolocation}
          title="Попробовать определить моё местоположение"
        >
          <span className="real-location-icon">🔄</span>
        </button>
      ) : (
        position && !isUsingDefaultLocation && (
          <button
            className="fixed-location-button map-button"
            onClick={centerOnFixedLocation}
            title="Центрировать на фиксированной локации"
          >
            <span className="fixed-location-icon">🏠</span>
          </button>
        )
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
