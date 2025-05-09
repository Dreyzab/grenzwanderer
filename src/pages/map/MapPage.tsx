import React, { useState, useCallback } from 'react';
import { PageLayout } from '@/shared/ui';
import {
  MapDisplayWidget,
  QRMarkerWidget,
  MarkerInfoPopupWidget,
  ARModeWidget,
  QRScannerWidget
} from '@/widgets';
import { useMapData } from '@/features/map/hooks/useMapData';
import { usePlayerLocation } from '@/features/location/hooks/usePlayerLocation';
import { useARNavigation } from '@/features/ar/hooks/useARNavigation';
import { useQRScanner } from '@/features/scanner/api/useQRScanner';
import { useQuestActions } from '@/features/quest/api/useQuestActions';
import { Marker } from '@/widgets/map/QRMarkerWidget';
import { convertToGeoCoordinates } from '@/shared/types/geo';

/**
 * Страница с интерактивной картой города
 * Показывает карту, положение игрока, квестовые маркеры, и элементы управления
 */
export const MapPage: React.FC = () => {
  // Состояния страницы
  const [isARMode, setIsARMode] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  
  // Получение данных для карты
  const { markers, toggleMarkerComplete } = useMapData();
  
  // Получение местоположения игрока
  const { playerLocation, isLocationLoading } = usePlayerLocation();
  
  // AR-навигация
  const { targetDirection, distanceToTarget, startARNavigation } = useARNavigation();
  
  // Обработка квестовых действий
  const { scanQRCode } = useQuestActions({ playerId: "player1" });
  
  // Обработка результата сканирования
  const handleScanSuccess = useCallback((code: string) => {
    scanQRCode(code);
    setIsScannerOpen(false);
  }, [scanQRCode]);
  
  // Открытие QR-сканера
  const handleOpenScanner = () => {
    setIsScannerOpen(true);
  };
  
  // Закрытие QR-сканера
  const handleCloseScanner = () => {
    setIsScannerOpen(false);
  };
  
  // Обработка нажатия на маркер
  const handleMarkerClick = (markerId: string) => {
    setSelectedMarker(markerId);
  };
  
  // Закрытие информации о маркере
  const handleCloseMarkerInfo = () => {
    setSelectedMarker(null);
  };
  
  // Переключение в AR-режим для навигации к маркеру
  const handleStartNavigation = (markerId: string) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      startARNavigation(convertToGeoCoordinates(marker.position));
      setIsARMode(true);
      setSelectedMarker(null);
    }
  };
  
  // Выход из AR-режима
  const handleExitARMode = () => {
    setIsARMode(false);
  };
  
  // Получение выбранного маркера
  const selectedMarkerData = selectedMarker 
    ? markers.find(marker => marker.id === selectedMarker) 
    : null;
  
  // Преобразование MarkerData в Marker для компонента QRMarkerWidget
  const mapMarkerToWidgetMarker = (markerData: any): Marker => {
    return {
      id: markerData.id,
      title: markerData.title,
      description: markerData.description || '',
      type: markerData.type,
      status: markerData.isCompleted ? 'completed' : 'active',
      coordinates: {
        latitude: markerData.position.lat,
        longitude: markerData.position.lng
      },
      questId: markerData.questId
    };
  };
  
  // Отображение AR-режима
  if (isARMode) {
    return (
      <ARModeWidget
        playerLocation={playerLocation}
        onClose={handleExitARMode}
      />
    );
  }
  
  // Отображение QR-сканера
  if (isScannerOpen) {
    return (
      <QRScannerWidget
        onScanSuccess={handleScanSuccess}
        onClose={handleCloseScanner}
      />
    );
  }
  
  return (
    <PageLayout
      header={<h1 className="text-2xl font-heading text-center">Карта города</h1>}
      content={
        <div className="relative h-full">
          {/* Основная карта */}
          <MapDisplayWidget
            playerPosition={playerLocation}
            isLoading={isLocationLoading}
          >
            {/* Отображение маркеров на карте */}
            {markers.map(marker => (
              <QRMarkerWidget
                key={marker.id}
                marker={mapMarkerToWidgetMarker(marker)}
                onClick={() => handleMarkerClick(marker.id)}
              />
            ))}
          </MapDisplayWidget>
          
          {/* Информация о выбранном маркере */}
          {selectedMarkerData && (
            <MarkerInfoPopupWidget
              marker={mapMarkerToWidgetMarker(selectedMarkerData)}
              onClose={handleCloseMarkerInfo}
              onNavigate={() => handleStartNavigation(selectedMarkerData.id)}
              onScan={handleOpenScanner}
              onToggleComplete={() => toggleMarkerComplete(selectedMarkerData.id)}
            />
          )}
          
          {/* Кнопки управления */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button 
              className="bg-accent text-surface p-3 rounded-full shadow-lg"
              onClick={handleOpenScanner}
              aria-label="Сканировать QR-код"
            >
              <span className="icon-qr-code text-2xl" />
            </button>
          </div>
        </div>
      }
    />
  );
};

export default MapPage; 