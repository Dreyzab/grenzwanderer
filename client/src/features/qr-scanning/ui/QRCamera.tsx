import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, Flashlight, FlashlightOff, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '../../../shared/ui/components/Button'
import { scanQRCode, validateQRCode } from '../../../shared/api/qr/convex'
import { usePOIStatusStore } from '../../../entities/map-point/model/poiStatusStore'
import { useOfflineQRValidation } from '../lib/offlineQRValidator'
import { cn } from '../../../shared/lib/utils/cn'
import { decodeQRFromVideo, startQRScanning, validateGrenzwandererQR } from '../lib/qrDecoder'

interface QRCameraProps {
  onScanSuccess?: (result: any) => void
  onScanError?: (error: string) => void
  className?: string
}

export function QRCamera({ onScanSuccess, onScanError, className }: QRCameraProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [qrDetected, setQrDetected] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanningRef = useRef<(() => void) | null>(null)

  // Оффлайн валидация QR кодов
  const { isOnline, validateQR } = useOfflineQRValidation()

  // Запрос доступа к камере
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(zoom > 1 && { zoom }),
        } as any,
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Настраиваем зум если поддерживается
        if (stream.getVideoTracks()[0].getCapabilities?.()?.zoom) {
          const track = stream.getVideoTracks()[0]
          track.applyConstraints({
            advanced: [{ zoom } as any],
          }).catch(console.warn)
        }
      }

      setIsScanning(true)
      setError('')

      // Запускаем QR сканирование
      if (videoRef.current) {
        scanningRef.current = startQRScanning(
          videoRef.current,
          handleQRResult,
          handleQRError,
          { formats: ['qr_code', 'data_matrix'] }
        )
      }
    } catch (err) {
      console.error('Camera access failed:', err)
      setError('Не удалось получить доступ к камере. Проверьте разрешения.')
      onScanError?.('Camera access denied')
    }
  }

  // Обработка QR результата
  const handleQRResult = useCallback(async (qrResult: any) => {
    setQrDetected(true)

    try {
      // Сначала оффлайн валидация
      const offlineValidation = await validateQR(qrResult.data)

      if (!offlineValidation.isValid) {
        setError('Неверный формат QR кода')
        return
      }

      const { pointKey } = offlineValidation.validationResult!

      // Если онлайн, отправляем на сервер для полной обработки
      if (isOnline) {
        try {
          const scanResult = await scanQRCode({
            qrCode: qrResult.data,
            timestamp: Date.now(),
            location: {
              lat: 47.9959, // TODO: получить реальные координаты
              lng: 7.8522,
              accuracy: 5,
            },
          })

          if (scanResult.success) {
            setScanResult(scanResult)

            // Обновляем статус точки
            if (scanResult.action === 'discover' || scanResult.action === 'research') {
              const { markDiscovered, markResearched } = usePOIStatusStore.getState()

              if (scanResult.action === 'discover') {
                markDiscovered(pointKey, 'qr_scan')
              } else {
                markResearched(pointKey, 'qr_scan', scanResult.rewards)
              }
            }

            onScanSuccess?.(scanResult)
          } else {
            setError(scanResult.error || 'Ошибка сканирования')
            onScanError?.(scanResult.error || 'Scan failed')
          }
        } catch (serverError) {
          console.warn('Server processing failed, using offline validation:', serverError)
          // Fallback к оффлайн обработке
          handleOfflineProcessing(pointKey, offlineValidation.validationResult!)
        }
      } else {
        // Оффлайн обработка
        handleOfflineProcessing(pointKey, offlineValidation.validationResult!)
      }
    } catch (err) {
      console.error('QR processing error:', err)
      setError('Ошибка обработки QR кода')
      onScanError?.('Processing error')
    }

    // Сбрасываем состояние через 3 секунды
    setTimeout(() => {
      setQrDetected(false)
      setScanResult(null)
      setError('')
    }, 3000)
  }, [onScanSuccess, onScanError, isOnline, validateQR])

  // Оффлайн обработка QR кода
  const handleOfflineProcessing = useCallback((pointKey: string, validationResult: any) => {
    const { markDiscovered, markResearched } = usePOIStatusStore.getState()

    // Создаем мок результат для оффлайн режима
    const offlineResult = {
      success: true,
      pointKey,
      action: validationResult.type,
      offline: true,
      rewards: {
        experience: validationResult.type === 'discover' ? 10 : 25,
        reputation: {
          exploration: validationResult.type === 'discover' ? 5 : 10,
        },
      },
    }

    setScanResult(offlineResult)

    // Обновляем статус точки
    if (validationResult.type === 'discover') {
      markDiscovered(pointKey, 'qr_scan')
    } else {
      markResearched(pointKey, 'qr_scan', offlineResult.rewards)
    }

    onScanSuccess?.(offlineResult)
  }, [onScanSuccess])

  const handleQRError = useCallback((error: Error) => {
    console.error('QR scan error:', error)
    setError('Ошибка сканирования QR кода')
    onScanError?.(error.message)
  }, [onScanError])

  // Остановка камеры
  const stopCamera = () => {
    // Останавливаем QR сканирование
    if (scanningRef.current) {
      scanningRef.current()
      scanningRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
    setQrDetected(false)
  }

  // Переключение вспышки (если поддерживается)
  const toggleFlash = async () => {
    if (!streamRef.current) return

    try {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn } as any],
        })
        setFlashOn(!flashOn)
      }
    } catch (err) {
      console.warn('Flash toggle not supported:', err)
    }
  }

  // Переключение камеры
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  // Управление зумом
  const handleZoomIn = async () => {
    if (!streamRef.current || zoom >= 3) return

    const newZoom = Math.min(zoom + 0.5, 3)
    setZoom(newZoom)

    try {
      const track = streamRef.current.getVideoTracks()[0]
      if (track.getCapabilities?.()?.zoom) {
        await track.applyConstraints({
          advanced: [{ zoom: newZoom } as any],
        })
      }
    } catch (err) {
      console.warn('Zoom not supported:', err)
    }
  }

  const handleZoomOut = async () => {
    if (!streamRef.current || zoom <= 1) return

    const newZoom = Math.max(zoom - 0.5, 1)
    setZoom(newZoom)

    try {
      const track = streamRef.current.getVideoTracks()[0]
      if (track.getCapabilities?.()?.zoom) {
        await track.applyConstraints({
          advanced: [{ zoom: newZoom } as any],
        })
      }
    } catch (err) {
      console.warn('Zoom not supported:', err)
    }
  }

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Остановка камеры при размонтировании
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Перезапуск камеры при смене facingMode
  useEffect(() => {
    if (isScanning) {
      stopCamera()
      startCamera()
    }
  }, [facingMode])

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden', className)}>
      {/* Видео поток */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Canvas для захвата кадров */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Оверлей для сканирования */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Рамка для сканирования */}
          <div className="w-64 h-64 border-2 border-emerald-400 rounded-lg relative">
            {/* Уголки рамки */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br"></div>

            {/* Центр рамки */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-0.5 bg-emerald-400 animate-pulse"></div>
            </div>
          </div>

          {/* Сканирующая линия */}
          <motion.div
            className="absolute top-0 left-16 right-16 h-0.5 bg-emerald-400"
            animate={{
              y: [0, 256, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </div>

      {/* Результат сканирования */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 right-4 bg-emerald-900/90 backdrop-blur-sm border border-emerald-600 rounded-lg p-4"
          >
            <h3 className="font-semibold text-emerald-100 mb-2">QR код отсканирован!</h3>
            <p className="text-sm text-emerald-200 mb-3">
              {scanResult.message || 'Точка успешно исследована'}
            </p>
            {scanResult.rewards && (
              <div className="text-xs text-emerald-300">
                Награды: {scanResult.rewards.experience || 0} XP
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ошибки */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 right-4 bg-red-900/90 backdrop-blur-sm border border-red-600 rounded-lg p-4"
          >
            <p className="text-sm text-red-200">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Элементы управления */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
        {!isScanning ? (
          <Button onClick={startCamera} className="bg-emerald-600 hover:bg-emerald-700">
            <Camera className="w-4 h-4 mr-2" />
            Начать сканирование
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-50"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <div className="bg-zinc-800/80 rounded px-3 py-2 text-sm text-zinc-300">
              {zoom.toFixed(1)}x
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-50"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={toggleFlash}
              className="bg-zinc-800/80 hover:bg-zinc-700/80"
            >
              {flashOn ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={toggleCamera}
              className="bg-zinc-800/80 hover:bg-zinc-700/80"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={stopCamera}
              className="bg-red-600/80 hover:bg-red-700/80"
            >
              <CameraOff className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Статус */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-1">
          <div className="text-xs text-zinc-300">
            {isScanning ? (
              qrDetected ? 'QR код обнаружен!' : 'Сканирование...'
            ) : 'Камера выключена'}
          </div>
        </div>

        <div className={`rounded-full p-1 ${isOnline ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Индикатор QR обнаружения */}
      <AnimatePresence>
        {qrDetected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-4 right-4"
          >
            <div className="bg-emerald-600/90 backdrop-blur-sm rounded-full p-2">
              <div className="w-3 h-3 bg-emerald-300 rounded-full animate-pulse"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
