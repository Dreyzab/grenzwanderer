import React, { useState, useRef, useEffect } from 'react';
import './QRScanner.css';

interface QRScannerProps {
  playerId: string;
  onSuccess: (code: string) => void;
  onCancel: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ playerId, onSuccess, onCancel }) => {
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Не удалось получить доступ к камере');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onSuccess(manualCode.trim());
    }
  };

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
          className="qr-scanner-cancel"
          onClick={onCancel}
        >
          Отмена
        </button>
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
      </div>
    </div>
  );
};