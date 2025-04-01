import React, { useState, useEffect, useRef, FC } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './QuestMap.css';

// Токен Mapbox
// В реальном приложении токен должен храниться на сервере
// или в переменных окружения
mapboxgl.accessToken = 'pk.eyJ1IjoiZGF0YXNrdWxsIiwiYSI6ImNsdzM5aDRvajBmMWcyanAzY3VkcHByZm0ifQ.4e5wl_n9ZoH2eDVxjxpZaw';

interface QuestMarker {
  id: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  isActive: boolean;
  isCompleted: boolean;
  qrCode?: string;
}

interface QuestMapProps {
  markers?: QuestMarker[];
  onMarkerClick?: (marker: QuestMarker) => void;
  center?: [number, number];
  zoom?: number;
}

export const QuestMap: FC<QuestMapProps> = ({
  markers = [],
  onMarkerClick,
  center = [30.3056, 59.9391], // Координаты Санкт-Петербурга по умолчанию
  zoom = 12,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const popupsRef = useRef<{ [key: string]: mapboxgl.Popup }>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Инициализация карты
  useEffect(() => {
    if (!mapContainer.current) return;
    
    try {
      setLoading(true);
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: center,
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
        setLoading(false);
      });
      
      // Обработчик ошибки
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Ошибка загрузки карты. Пожалуйста, проверьте соединение с интернетом.');
      });
      
      return () => {
        if (map.current) {
          // Удаляем все маркеры при размонтировании
          Object.values(markersRef.current).forEach(marker => marker.remove());
          map.current.remove();
        }
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Ошибка инициализации карты. Пожалуйста, проверьте соединение с интернетом.');
    }
  }, [center, zoom]);
  
  // Добавление маркеров на карту
  useEffect(() => {
    if (!map.current || loading) return;
    
    try {
      // Сначала удаляем все существующие маркеры
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      
      // Добавляем новые маркеры
      markers.forEach(marker => {
        // Создаем элемент маркера
        const markerElement = document.createElement('div');
        markerElement.className = `marker ${marker.isActive ? 'active' : 'inactive'} ${marker.isCompleted ? 'completed' : ''}`;
        
        // Добавляем анимированный пульс для активных маркеров
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
        
        // Указываем содержимое popup
        const popupContent = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'popup-title';
        title.textContent = marker.title;
        
        const description = document.createElement('div');
        description.className = 'popup-content';
        description.textContent = marker.description || 
          (marker.isCompleted ? 'Точка посещена' : 
          marker.isActive ? 'Активная точка задания' : 'Точка недоступна');
        
        popupContent.appendChild(title);
        popupContent.appendChild(description);
        
        // Добавляем кнопку взаимодействия для активных маркеров
        if (marker.isActive && !marker.isCompleted && marker.qrCode && onMarkerClick) {
          const button = document.createElement('button');
          button.className = 'popup-button';
          button.textContent = 'Сканировать QR код (тест)';
          
          button.addEventListener('click', () => {
            popup.remove();
            onMarkerClick(marker);
          });
          
          popupContent.appendChild(button);
        }
        
        popup.setDOMContent(popupContent);
        
        // Создаем маркер и привязываем popup
        const mapboxMarker = new mapboxgl.Marker(markerElement)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map.current!);
        
        // Сохраняем маркер и popup по ID для быстрого доступа
        markersRef.current[marker.id] = mapboxMarker;
        popupsRef.current[marker.id] = popup;
        
        // Добавляем обработчик клика на маркер
        markerElement.addEventListener('click', () => {
          if (marker.isActive && !marker.isCompleted && onMarkerClick) {
            popup.addTo(map.current!);
          }
        });
      });
      
      // Если есть маркеры, центрируем карту на них
      if (markers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach(marker => {
          bounds.extend([marker.lng, marker.lat]);
        });
        
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    } catch (err) {
      console.error('Error adding markers:', err);
      setError('Ошибка при добавлении маркеров на карту.');
    }
  }, [markers, loading, onMarkerClick]);
  
  // Показываем загрузку
  if (loading) {
    return (
      <div className="quest-map-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка карты...</p>
      </div>
    );
  }
  
  // Показываем ошибку
  if (error) {
    return (
      <div className="quest-map-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Обновить
        </button>
      </div>
    );
  }
  
  return (
    <div className="quest-map">
      <div ref={mapContainer} className="quest-map-container"></div>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker active"></div>
          <span>Активные точки</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker inactive"></div>
          <span>Недоступные точки</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker completed"></div>
          <span>Завершенные точки</span>
        </div>
      </div>
    </div>
  );
};