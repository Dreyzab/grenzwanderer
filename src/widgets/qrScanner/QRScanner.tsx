import React from 'react';
import { QRScannerProps } from '../../shared/types/scanner';
import { useQRScanner } from '../../features/scanner/api';
import { QR_CODES } from '../../shared/types/markers';
import './QRScanner.css';

export const QRScanner: React.FC<QRScannerProps> = ({ onSuccess, onCancel, onScan }) => {
  const {
    error,
    manualCode,
    videoRef,
    canvasRef,
    setManualCode,
    handleManualSubmit,
    handleTakePhoto
  } = useQRScanner({ 
    onSuccess: onSuccess,
    onScan: onScan
  });

  // Выбираем функцию обработки сканирования
  const handleScanSuccess = onScan || onSuccess;

  return (
    <div className="qr-scanner-container">
      <h2>Сканирование QR-кода</h2>
      
      {error && <div className="qr-scanner-error">{error}</div>}
      
      <div className="qr-scanner-preview">
        <video 
          ref={videoRef} 
          className="qr-scanner-video"
          autoPlay 
          playsInline
        />
        <canvas 
          ref={canvasRef}
          className="qr-scanner-canvas"
        />
        <div className="qr-scanner-overlay">
          <div className="qr-scanner-marker" />
        </div>
      </div>
      
      <div className="qr-scanner-instructions">
        Наведите камеру на QR-код
      </div>
      
      <div className="qr-scanner-controls">
        <button 
          className="qr-scanner-photo-button"
          onClick={handleTakePhoto}
        >
          Сделать фото
        </button>
        {onCancel && (
          <button 
            className="qr-scanner-cancel"
            onClick={onCancel}
          >
            Отмена
          </button>
        )}
      </div>
      
      <div className="qr-scanner-manual">
        <p>Или введите код вручную:</p>
        <form onSubmit={handleManualSubmit}>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Введите код"
          />
          <button type="submit">
            Отправить
          </button>
        </form>
        <div className="test-codes">
          <p>Тестовые коды для визуальной новеллы:</p>
          <button onClick={() => handleScanSuccess(QR_CODES.TRADER)}>Встреча с Торговцем</button>
          <button onClick={() => handleScanSuccess(QR_CODES.CRAFTSMAN)}>Мастерская Дитера</button>
          <button onClick={() => handleScanSuccess(QR_CODES.ARTIFACT)}>Найти артефакт</button>
          <button onClick={() => handleScanSuccess(QR_CODES.ANOMALY)}>Аномальная зона</button>
          <button onClick={() => handleScanSuccess(QR_CODES.ENCOUNTER)}>Неожиданная встреча</button>
          <p className="test-hint">Нажмите на кнопку, чтобы активировать соответствующую сцену визуальной новеллы</p>
        </div>
      </div>
    </div>
  );
}; 