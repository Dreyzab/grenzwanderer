import React, { useState, useRef } from 'react';
import { useQRScanner } from '@/features/scanner/api/useQRScanner';
import { Button } from '@/shared/ui/Button/Button';

interface QRScannerWidgetProps {
  onScanSuccess: (qrData: string) => void;
  onClose: () => void;
  scanTitle?: string;
  scanDescription?: string;
}

/**
 * Виджет для сканирования QR-кодов
 * Использует камеру устройства для сканирования QR-кодов
 */
export const QRScannerWidget: React.FC<QRScannerWidgetProps> = ({
  onScanSuccess,
  onClose,
  scanTitle = 'Сканирование QR-кода',
  scanDescription = 'Наведите камеру на QR-код, чтобы отсканировать его'
}) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Инициализируем хук сканера
  const { 
    error, 
    scanning,
    manualCode,
    setManualCode,
    handleManualSubmit,
    handleTakePhoto
  } = useQRScanner({
    onSuccess: onScanSuccess,
  });
  
  // Переключение между камерой и ручным вводом
  const toggleManualInput = () => {
    setShowManualInput(!showManualInput);
  };
  
  return (
    <div className="w-full max-w-md mx-auto bg-surface rounded-lg shadow-lg overflow-hidden border border-surface-variant">
      <div className="flex justify-between items-center p-4 bg-surface-variant">
        <h2 className="font-heading text-xl text-text-primary">{scanTitle}</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-8 h-8 rounded-full p-0 text-xl" 
          onClick={onClose}
        >
          ×
        </Button>
      </div>
      
      {!showManualInput ? (
        <div className="p-4">
          <p className="text-text-secondary mb-4 text-center">{scanDescription}</p>
          
          {error && (
            <div className="mb-4 p-2 bg-error/10 text-error rounded">
              <p>{error}</p>
            </div>
          )}
          
          <div className="relative rounded-lg overflow-hidden mb-4 border border-surface-variant aspect-square">
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay 
              playsInline 
              muted
            />
            <div className="absolute inset-0 border-2 border-accent opacity-50 m-8 pointer-events-none" />
            
            {/* Скрытый canvas для обработки видео */}
            <canvas 
              ref={canvasRef} 
              className="hidden"
            />
          </div>
          
          <div className="flex justify-center space-x-4">
            {!scanning && (
              <Button 
                variant="primary" 
                onClick={handleTakePhoto}
              >
                Сделать снимок
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-text-secondary mb-4">Введите код вручную:</p>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Введите код..."
              className="w-full p-2 rounded-lg border border-surface-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            
            <Button 
              type="submit" 
              variant="primary"
              fullWidth
              disabled={!manualCode.trim()}
            >
              Применить
            </Button>
          </form>
        </div>
      )}
      
      <div className="p-4 bg-surface-variant">
        <Button 
          variant="outline"
          fullWidth
          onClick={toggleManualInput}
        >
          {showManualInput ? 'Использовать камеру' : 'Ввести код вручную'}
        </Button>
      </div>
    </div>
  );
};

export default QRScannerWidget; 