import React from 'react';
import { QRScannerWidget } from '../map/QRScannerWidget';

interface QRScannerProps {
  onSuccess: (code: string) => void;
  onCancel: () => void;
}

/**
 * Компонент-обертка для сканирования QR-кодов
 */
export const QRScanner: React.FC<QRScannerProps> = ({
  onSuccess,
  onCancel
}) => {
  return (
    <div className="qr-scanner-container">
      <QRScannerWidget 
        onScanSuccess={onSuccess}
        onClose={onCancel}
        scanTitle="Сканирование игрового QR-кода"
        scanDescription="Наведите камеру на QR-код, чтобы перейти к следующему этапу игры"
      />
    </div>
  );
};

export default QRScanner; 