import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  CameraOff, 
  FlipHorizontal, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react'
import { useQRScanner, QRScanResult } from '@/shared/hooks/useQRScanner'

interface QRScannerProps {
  onResult?: (result: QRScanResult) => void
  onError?: (error: Error) => void
  className?: string
  showDeviceSelector?: boolean
  showImageUpload?: boolean
  autoStart?: boolean
}

export function QRScanner({
  onResult,
  onError,
  className = 'w-full max-w-md mx-auto',
  showDeviceSelector = true,
  showImageUpload = true,
  autoStart = false,
}: QRScannerProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>()
  const [lastResult, setLastResult] = useState<QRScanResult | null>(null)
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const handleResult = useCallback((result: QRScanResult) => {
    setLastResult(result)
    onResult?.(result)

    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current)
      resultTimeoutRef.current = null
    }

    const timeout = setTimeout(() => {
      setLastResult(null)
    }, 3000)
    resultTimeoutRef.current = timeout
  }, [onResult])

  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current)
        resultTimeoutRef.current = null
      }
    }
  }, [])
  
  const {
    isScanning,
    error,
    devices,
    hasCamera,
    isSupported,
    startScanning,
    stopScanning,
    scanImage,
    videoRef,
    switchCamera,
    toggleScanning,
  } = useQRScanner({
    onResult: handleResult,
    onError,
    deviceId: selectedDeviceId,
  })
  
  // Auto start if enabled
  React.useEffect(() => {
    if (autoStart && hasCamera && !isScanning) {
      startScanning()
    }
  }, [autoStart, hasCamera, isScanning, startScanning])
  
  // Handle image upload
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const result = await scanImage(file)
      if (result) {
        handleResult(result)
      } else {
        onError?.(new Error('QR код не найден в изображении'))
      }
    } catch (err) {
      onError?.(err as Error)
    }
    
    // Reset input
    event.target.value = ''
  }, [scanImage, handleResult, onError])
  
  if (!isSupported) {
    return (
      <div className={`${className} text-center p-6`}>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">
          Камера недоступна
        </h3>
        <p className="text-zinc-400">
          Ваш браузер не поддерживает доступ к камере
        </p>
      </div>
    )
  }
  
  return (
    <div className={className}>
      {/* Camera View */}
      <div className="relative bg-zinc-900 rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          className="w-full h-64 object-cover bg-black"
          playsInline
          muted
        />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-emerald-400"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-emerald-400"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-emerald-400"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-emerald-400"></div>
          
          {/* Scanning line animation */}
          {isScanning && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-lg shadow-emerald-400/50"
              animate={{
                y: [0, 256, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
          
          {/* Status indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isScanning 
                ? 'bg-emerald-900/80 text-emerald-100' 
                : 'bg-zinc-900/80 text-zinc-100'
            }`}>
              {isScanning ? 'Сканирование...' : 'Готов к сканированию'}
            </div>
          </div>
        </div>
        
        {/* Loading overlay */}
        {!hasCamera && (
          <div className="absolute inset-0 bg-zinc-900/80 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">Подключение к камере...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="space-y-4">
        {/* Main controls */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            onClick={toggleScanning}
            disabled={!hasCamera}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isScanning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isScanning ? (
              <>
                <CameraOff size={20} />
                Остановить
              </>
            ) : (
              <>
                <Camera size={20} />
                Начать сканирование
              </>
            )}
          </motion.button>
          
          {/* Camera switch */}
          {devices.length > 1 && (
            <motion.button
              onClick={() => {
                const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId)
                const nextIndex = (currentIndex + 1) % devices.length
                const nextDevice = devices[nextIndex]
                setSelectedDeviceId(nextDevice.deviceId)
                switchCamera(nextDevice.deviceId)
              }}
              className="p-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FlipHorizontal size={20} />
            </motion.button>
          )}
        </div>
        
        {/* Device selector */}
        {showDeviceSelector && devices.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Выберите камеру:
            </label>
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value)
                if (isScanning) {
                  switchCamera(e.target.value)
                }
              }}
              className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Камера ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Image upload */}
        {showImageUpload && (
          <div>
            <label className="block w-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-zinc-600 hover:border-zinc-500 rounded-lg text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors">
                <Upload size={20} />
                Загрузить изображение с QR кодом
              </div>
            </label>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg"
          >
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Ошибка:</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </motion.div>
        )}
        
        {/* Result display */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">QR код распознан:</span>
              </div>
              <div className="bg-zinc-800 rounded p-2">
                <p className="text-zinc-100 text-sm font-mono break-all">
                  {lastResult.text}
                </p>
                <p className="text-zinc-400 text-xs mt-1">
                  Формат: {lastResult.format} • {lastResult.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
