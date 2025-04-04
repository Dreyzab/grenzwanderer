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
const FIXED_CENTER: [number, number] = [47.995281, 7.846160]; 

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
          
          // Добавляем слой для областей квестов - круг 
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
          
          // Добавляем полигон аномальной зоны
          mapInstance.addSource('anomaly-zone', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {
                    name: 'Аномальная зона',
                    isActive: false,
                    isCompleted: false
                  },
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [7.857825214463277, 47.99405714850842],
                      [7.857743420153544, 47.994054459404175],
                      [7.857662413593097, 47.99404641798983],
                      [7.857582974943794, 47.994033101711075],
                      [7.857505869265734, 47.99401463881496],
                      [7.857431839148456, 47.99399120711469],
                      [7.857361597558628, 47.993963032276945],
                      [7.857295820973179, 47.993930385648326],
                      [7.85723514286398, 47.99389358164189],
                      [7.857180147596893, 47.99385297470883],
                      [7.857131364803905, 47.99380895592458],
                      [7.857089264282577, 47.993761949222275],
                      [7.857054251471928, 47.993712407309665],
                      [7.857026663548288, 47.993660807309055],
                      [7.857006766178738, 47.99360764616207],
                      [7.85699475096334, 47.99355343584363],
                      [7.8569907335907905, 47.99349869843121],
                      [7.856994752725215, 47.993443961076856],
                      [7.857006769634778, 47.99338975093036],
                      [7.857026668565682, 47.993336590062626],
                      [7.857054257857858, 47.99328499043783],
                      [7.857089271791637, 47.99323544898315],
                      [7.857131373147528, 47.99318844280327],
                      [7.857180156454435, 47.99314442458591],
                      [7.8572351518950505, 47.99310381824239],
                      [7.85729582983072, 47.993067014825485],
                      [7.857361605902248, 47.99303436876375],
                      [7.857431846657517, 47.99300619444844],
                      [7.857505875651664, 47.9929827632061],
                      [7.857582979961188, 47.992964300685806],
                      [7.857662417049138, 47.99295098468628],
                      [7.857743421915417, 47.99294294344389],
                      [7.857825214463277, 47.992940254397716],
                      [7.857907007011136, 47.99294294344389],
                      [7.857988011877416, 47.99295098468628],
                      [7.8580674489653655, 47.992964300685806],
                      [7.858144553274889, 47.9929827632061],
                      [7.8582185822690365, 47.99300619444844],
                      [7.858288823024305, 47.99303436876375],
                      [7.858354599095834, 47.993067014825485],
                      [7.8584152770315026, 47.99310381824239],
                      [7.858470272472118, 47.99314442458591],
                      [7.858519055779025, 47.99318844280327],
                      [7.858561157134916, 47.99323544898315],
                      [7.858596171068696, 47.99328499043783],
                      [7.858623760360871, 47.993336590062626],
                      [7.858643659291775, 47.99338975093036],
                      [7.858655676201338, 47.993443961076856],
                      [7.858659695335763, 47.99349869843121],
                      [7.858655677963213, 47.99355343584363],
                      [7.8586436627478164, 47.99360764616207],
                      [7.858623765378265, 47.993660807309055],
                      [7.858596177454626, 47.993712407309665],
                      [7.858561164643976, 47.993761949222275],
                      [7.858519064122648, 47.99380895592458],
                      [7.85847028132966, 47.99385297470883],
                      [7.858415286062574, 47.99389358164189],
                      [7.858354607953375, 47.993930385648326],
                      [7.858288831367925, 47.993963032276945],
                      [7.858218589778097, 47.99399120711469],
                      [7.858144559660819, 47.99401463881496],
                      [7.858067453982759, 47.994033101711075],
                      [7.857988015333456, 47.99404641798983],
                      [7.857907008773009, 47.994054459404175],
                      [7.857825214463277, 47.99405714850842]
                    ]]
                  }
                }
              ]
            }
          });
          
          // Слой для заливки аномальной зоны
          mapInstance.addLayer({
            id: 'anomaly-zone-fill',
            type: 'fill',
            source: 'anomaly-zone',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['get', 'isActive'], false], 'rgba(255, 0, 0, 0.3)',
                ['boolean', ['get', 'isCompleted'], false], 'rgba(76, 175, 80, 0.3)',
                'rgba(198, 139, 139, 0.3)'
              ],
              'fill-opacity': 0.5
            }
          });
          
          // Слой для обводки аномальной зоны
          mapInstance.addLayer({
            id: 'anomaly-zone-line',
            type: 'line',
            source: 'anomaly-zone',
            paint: {
              'line-color': [
                'case',
                ['boolean', ['get', 'isActive'], false], '#f00000',
                ['boolean', ['get', 'isCompleted'], false], '#4CAF50',
                '#f00000'
              ],
              'line-width': 3,
              'line-opacity': 0.8
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
    
    if (markerData.markerType === MarkerType.QUEST_AREA && 
        markerData.id !== 'artifact_area' && 
        markerData.title !== 'Аномальная зона') {
      // Обработка областей через GeoJSON слой (кроме Аномальной зоны)
      return;
    }
    
    // Если это Аномальная зона, не создаем маркер, она отображается как полигон
    if (markerData.id === 'artifact_area' || markerData.title === 'Аномальная зона') {
      // Добавляем точку в центре для возможности клика
      const centerEl = document.createElement('div');
      centerEl.className = 'anomaly-center-marker';
      
      // Создаем маркер точки в центре аномальной зоны
      const centerMarker = new mapboxgl.Marker(centerEl)
        .setLngLat([markerData.lng, markerData.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="popup-content">
              <h3>${markerData.title}</h3>
              ${markerData.description ? `<p>${markerData.description}</p>` : ''}
            </div>
          `));
      
      if (map.current) {
        centerMarker.addTo(map.current);
      }
      
      if (onMarkerClick) {
        centerEl.addEventListener('click', () => {
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
      markerRefs.current[markerData.id] = centerMarker;
      
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
      // Обновляем аномальную зону
      const anomalyMarker = markers.find(marker => marker.id === 'artifact_area' || marker.title === 'Аномальная зона');
      
      if (anomalyMarker) {
        const source = map.current.getSource('anomaly-zone');
        if (source && 'setData' in source) {
          source.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  name: anomalyMarker.title,
                  isActive: anomalyMarker.isActive,
                  isCompleted: anomalyMarker.isCompleted
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [7.857825214463277, 47.99405714850842],
                    [7.857743420153544, 47.994054459404175],
                    // ... existing polygon coordinates ...
                    [7.857825214463277, 47.99405714850842]
                  ]]
                }
              }
            ]
          });
        }
      }
      
      // Обновляем другие области (круги)
      const source = map.current.getSource('quest-areas');
      if (!source || !('setData' in source)) return;
      
      // Получаем круглые области из маркеров (исключаем аномальную зону, она отдельно)
      const areaMarkers = markers.filter(marker => 
        marker.markerType === MarkerType.QUEST_AREA && 
        marker.id !== 'artifact_area' && 
        marker.title !== 'Аномальная зона'
      );
      
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
