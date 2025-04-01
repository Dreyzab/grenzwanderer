import React, { useState, useRef, useEffect } from 'react';
import './QRScanner.css';
import jsQR from 'jsqr';

interface QRScannerProps {
  onSuccess: (code: string) => void;
  onCancel: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 720 },
            height: { ideal: 720 }
          } 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Начинаем сканирование когда видео готово
        videoRef.current?.addEventListener('loadedmetadata', () => {
          // Запускаем сканирование
          intervalId = setInterval(scanQRCode, 500);
        });
        
      } catch (err) {
        setError('Не удалось получить доступ к камере');
      }
    };
    
    const scanQRCode = () => {
      if (!scanning) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code && code.data) {
          // QR-код обнаружен!
          setScanning(false);
          clearInterval(intervalId);
          
          // Отрисовываем найденный QR-код
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#FF3B58";
          ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
          ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
          ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
          ctx.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          ctx.stroke();
          
          // Вызываем функцию успеха с данными
          onSuccess(code.data);
        }
      }
    };

    startCamera();

    return () => {
      clearInterval(intervalId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onSuccess, scanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onSuccess(manualCode.trim());
    }
  };
  
  const handleTakePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code && code.data) {
        // QR-код обнаружен!
        setScanning(false);
        
        // Отрисовываем найденный QR-код
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#FF3B58";
        ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
        ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
        ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
        ctx.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        ctx.stroke();
        
        // Вызываем функцию успеха с данными
        onSuccess(code.data);
      } else {
        // QR-код не найден
        setError('QR-код не обнаружен. Попробуйте снова или введите код вручную.');
        setTimeout(() => setError(null), 3000);
      }
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
          className="qr-scanner-photo-button"
          onClick={handleTakePhoto}
        >
          Сделать фото
        </button>
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
        <div className="test-codes">
          <p>Тестовые коды:</p>
          <button onClick={() => onSuccess("grenz_npc_craftsman_01")}>
            Тест: Мастер
          </button>
          <button onClick={() => onSuccess("grenz_npc_trader_01")}>
            Тест: Торговец
          </button>
        </div>
      </div>
    </div>
  );
};