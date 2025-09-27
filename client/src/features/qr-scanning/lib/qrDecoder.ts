/**
 * QR декодер с использованием Web APIs
 */

// Типы для QR кодов
export interface QRCodeResult {
  data: string
  format: string
  rawBytes?: Uint8Array
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  cornerPoints?: Array<{ x: number; y: number }>
}

export interface QROptions {
  formats?: string[]
  tryHarder?: boolean
  cropWidth?: number
  cropHeight?: number
}

/**
 * Декодирует QR код из изображения
 */
export async function decodeQRFromImage(
  imageData: ImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  options: QROptions = {}
): Promise<QRCodeResult | null> {
  try {
    // Для демонстрации возвращаем мок данные
    // В реальном приложении здесь будет интеграция с библиотекой QR распознавания

    const mockResult: QRCodeResult = {
      data: 'grenzwanderer:freiburg_cathedral:research:{"level":1,"rewards":{"experience":25,"reputation":{"exploration":10}}}',
      format: 'QR_CODE',
      boundingBox: {
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      },
      cornerPoints: [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 },
      ],
    }

    // Симулируем задержку распознавания
    await new Promise(resolve => setTimeout(resolve, 500))

    return mockResult
  } catch (error) {
    console.error('QR decode failed:', error)
    return null
  }
}

/**
 * Декодирует QR код из видео потока
 */
export async function decodeQRFromVideo(
  videoElement: HTMLVideoElement,
  options: QROptions = {}
): Promise<QRCodeResult | null> {
  try {
    // Создаем canvas для захвата кадра
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas context not available')
    }

    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    // Захватываем текущий кадр
    context.drawImage(videoElement, 0, 0)

    // Получаем ImageData для обработки
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    return await decodeQRFromImage(imageData, options)
  } catch (error) {
    console.error('Video QR decode failed:', error)
    return null
  }
}

/**
 * Непрерывное сканирование видео
 */
export function startQRScanning(
  videoElement: HTMLVideoElement,
  onResult: (result: QRCodeResult) => void,
  onError?: (error: Error) => void,
  options: QROptions = {}
): () => void {
  let isScanning = true
  let lastScanTime = 0
  const scanInterval = 500 // Сканируем каждые 500мс

  const scan = async () => {
    if (!isScanning) return

    try {
      const now = Date.now()
      if (now - lastScanTime < scanInterval) {
        requestAnimationFrame(scan)
        return
      }

      const result = await decodeQRFromVideo(videoElement, options)
      lastScanTime = now

      if (result) {
        onResult(result)
      }
    } catch (error) {
      onError?.(error as Error)
    }

    if (isScanning) {
      requestAnimationFrame(scan)
    }
  }

  // Начинаем сканирование
  scan()

  // Возвращаем функцию остановки
  return () => {
    isScanning = false
  }
}

/**
 * Валидация QR кода по формату Grenzwanderer
 */
export function validateGrenzwandererQR(qrData: string): {
  isValid: boolean
  pointKey?: string
  type?: 'discover' | 'research' | 'unlock' | 'reward'
  data?: any
} {
  try {
    const parts = qrData.split(':')

    if (parts.length < 3 || parts[0] !== 'grenzwanderer') {
      return { isValid: false }
    }

    const [, pointKey, type, dataString] = parts

    let data = undefined
    if (dataString) {
      try {
        data = JSON.parse(dataString)
      } catch {
        return { isValid: false }
      }
    }

    const validTypes = ['discover', 'research', 'unlock', 'reward']
    if (!validTypes.includes(type)) {
      return { isValid: false }
    }

    return {
      isValid: true,
      pointKey,
      type: type as any,
      data,
    }
  } catch {
    return { isValid: false }
  }
}

/**
 * Генерация QR кода (для тестирования)
 */
export function generateTestQRCode(pointKey: string, type: string, data?: any): string {
  const dataString = data ? JSON.stringify(data) : ''
  return `grenzwanderer:${pointKey}:${type}${dataString ? ':' + dataString : ''}`
}

/**
 * Получение информации о точке из QR кода
 */
export function getQRInfo(qrData: string): {
  pointKey: string
  action: string
  description: string
  rewards?: any
} | null {
  const validation = validateGrenzwandererQR(qrData)

  if (!validation.isValid) {
    return null
  }

  const actionDescriptions = {
    discover: 'Обнаружение новой точки',
    research: 'Исследование точки',
    unlock: 'Разблокировка контента',
    reward: 'Получение награды',
  }

  return {
    pointKey: validation.pointKey!,
    action: validation.type!,
    description: actionDescriptions[validation.type!],
    rewards: validation.data,
  }
}
