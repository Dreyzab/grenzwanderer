import { useState, useRef, useCallback, useEffect } from 'react'
import { BrowserMultiFormatReader, Result } from '@zxing/library'

export interface QRScanResult {
  text: string
  format: string
  timestamp: Date
  rawResult: Result
}

interface UseQRScannerOptions {
  onResult?: (result: QRScanResult) => void
  onError?: (error: Error) => void
  deviceId?: string
  delay?: number
  constraints?: MediaTrackConstraints
}

export function useQRScanner({
  onResult,
  onError,
  deviceId,
  delay = 300,
  constraints = {
    facingMode: 'environment', // Задняя камера
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
}: UseQRScannerOptions = {}) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scanTimeoutRef = useRef<number | null>(null)
  
  // Initialize ZXing reader
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader()
    
    return () => {
      readerRef.current?.reset()
    }
  }, [])
  
  // Get available video devices
  const getVideoDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput')
      setDevices(videoDevices)
      return videoDevices
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get video devices')
      setError(error.message)
      onError?.(error)
      return []
    }
  }, [onError])
  
  // Start camera stream
  const startCamera = useCallback(async (selectedDeviceId?: string) => {
    try {
      setError(null)
      
      const videoConstraints: MediaTrackConstraints = {
        ...constraints,
        ...(selectedDeviceId && { deviceId: { exact: selectedDeviceId } }),
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      
      return mediaStream
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start camera')
      setError(error.message)
      onError?.(error)
      throw error
    }
  }, [constraints, onError])
  
  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])
  
  // Start QR scanning
  const startScanning = useCallback(async (selectedDeviceId?: string) => {
    if (!readerRef.current) return
    
    try {
      setIsScanning(true)
      setError(null)
      
      // Start camera if not already started
      if (!stream) {
        await startCamera(selectedDeviceId || deviceId)
      }
      
      // Start continuous scanning
      const scan = () => {
        if (!readerRef.current || !videoRef.current || !isScanning) return
        
        const targetDeviceId = selectedDeviceId || deviceId
        readerRef.current.decodeFromVideoDevice(
          targetDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const scanResult: QRScanResult = {
                text: result.getText(),
                format: result.getBarcodeFormat().toString(),
                timestamp: new Date(),
                rawResult: result,
              }
              
              onResult?.(scanResult)
            }
            
            if (error && error.name !== 'NotFoundException') {
              console.warn('QR scan error:', error)
            }
          }
        )
      }
      
      // Start scanning with delay
      scanTimeoutRef.current = setTimeout(scan, delay)
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start scanning')
      setError(error.message)
      setIsScanning(false)
      onError?.(error)
    }
  }, [stream, startCamera, deviceId, delay, onResult, onError, isScanning])
  
  // Stop QR scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false)
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
    
    if (readerRef.current) {
      readerRef.current.reset()
    }
    
    stopCamera()
  }, [stopCamera])
  
  // Scan single frame (photo mode)
  const scanImage = useCallback(async (imageFile: File): Promise<QRScanResult | null> => {
    if (!readerRef.current) return null
    
    try {
      setError(null)
      
      const imageUrl = URL.createObjectURL(imageFile)
      const result = await readerRef.current.decodeFromImageElement(imageUrl)
      URL.revokeObjectURL(imageUrl) // Clean up object URL
      
      return {
        text: result.getText(),
        format: result.getBarcodeFormat().toString(),
        timestamp: new Date(),
        rawResult: result,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to scan image')
      setError(error.message)
      onError?.(error)
      return null
    }
  }, [onError])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])
  
  // Initialize devices on mount
  useEffect(() => {
    getVideoDevices()
  }, [getVideoDevices])
  
  return {
    // State
    isScanning,
    error,
    devices,
    stream,
    hasCamera: devices.length > 0,
    isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    
    // Actions
    startScanning,
    stopScanning,
    startCamera,
    stopCamera,
    scanImage,
    getVideoDevices,
    
    // Refs for components
    videoRef,
    
    // Utilities
    switchCamera: (newDeviceId: string) => {
      if (isScanning) {
        stopScanning()
        setTimeout(() => startScanning(newDeviceId), 100)
      }
    },
    
    toggleScanning: () => {
      if (isScanning) {
        stopScanning()
      } else {
        startScanning()
      }
    },
  }
}
