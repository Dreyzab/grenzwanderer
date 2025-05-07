import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';

interface UseQRScannerProps {
  onSuccess: (code: string) => void;
  onScan?: (code: string) => void;
}

interface UseQRScannerResult {
  error: string | null;
  manualCode: string;
  scanning: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  streamRef: React.RefObject<MediaStream | null>;
  setManualCode: (code: string) => void;
  handleManualSubmit: (e: React.FormEvent) => void;
  handleTakePhoto: () => void;
}

export function useQRScanner({ onSuccess, onScan }: UseQRScannerProps): UseQRScannerResult {
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Выбираем функцию обработки сканирования
  const handleScanSuccess = onScan || onSuccess;

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
          handleScanSuccess(code.data);
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
  }, [handleScanSuccess, scanning]);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanSuccess(manualCode.trim());
    }
  }, [manualCode, handleScanSuccess]);
  
  const handleTakePhoto = useCallback(() => {
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
        handleScanSuccess(code.data);
      } else {
        // QR-код не найден
        setError('QR-код не обнаружен. Попробуйте снова или введите код вручную.');
        setTimeout(() => setError(null), 3000);
      }
    }
  }, [handleScanSuccess]);

  return {
    error,
    manualCode,
    scanning,
    videoRef,
    canvasRef,
    streamRef,
    setManualCode,
    handleManualSubmit,
    handleTakePhoto
  };
} 