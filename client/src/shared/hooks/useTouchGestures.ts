import { useEffect, useRef } from 'react'

interface TouchGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number) => void
  onTap?: (x: number, y: number) => void
  onDoubleTap?: (x: number, y: number) => void
  minSwipeDistance?: number
  maxPinchTime?: number
  enabled?: boolean
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  options: TouchGestureOptions = {}
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    minSwipeDistance = 50,
    maxPinchTime = 300,
    enabled = true,
  } = options

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const initialPinchDistanceRef = useRef<number | null>(null)
  const pinchStartTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - начало свайпа или тапа
        const touch = e.touches[0]
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        }
      } else if (e.touches.length === 2) {
        // Pinch начало
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )

        initialPinchDistanceRef.current = distance
        pinchStartTimeRef.current = Date.now()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistanceRef.current && pinchStartTimeRef.current) {
        // Pinch движение
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )

        const scale = currentDistance / initialPinchDistanceRef.current
        onPinch?.(scale)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1 && touchStartRef.current) {
        const touch = e.changedTouches[0]
        const deltaX = touch.clientX - touchStartRef.current.x
        const deltaY = touch.clientY - touchStartRef.current.y
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const timeDelta = Date.now() - touchStartRef.current.time

        // Определяем тип жеста
        if (distance > minSwipeDistance && timeDelta < 500) {
          // Это свайп
          const absX = Math.abs(deltaX)
          const absY = Math.abs(deltaY)

          if (absX > absY) {
            // Горизонтальный свайп
            if (deltaX > 0) {
              onSwipeRight?.()
            } else {
              onSwipeLeft?.()
            }
          } else {
            // Вертикальный свайп
            if (deltaY > 0) {
              onSwipeDown?.()
            } else {
              onSwipeUp?.()
            }
          }
        } else if (distance < 20 && timeDelta < 300) {
          // Это тап
          if (lastTapRef.current) {
            const timeBetweenTaps = Date.now() - lastTapRef.current.time
            const tapDistance = Math.sqrt(
              Math.pow(touch.clientX - lastTapRef.current.x, 2) +
              Math.pow(touch.clientY - lastTapRef.current.y, 2)
            )

            if (timeBetweenTaps < 300 && tapDistance < 50) {
              // Double tap
              onDoubleTap?.(touch.clientX, touch.clientY)
              lastTapRef.current = null
              return
            }
          }

          // Single tap
          onTap?.(touch.clientX, touch.clientY)
          lastTapRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
          }
        }
      }

      // Сбрасываем состояния
      touchStartRef.current = null
      if (e.touches.length < 2) {
        initialPinchDistanceRef.current = null
        pinchStartTimeRef.current = null
      }
    }

    // Добавляем слушатели
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Возвращаем функцию очистки
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    elementRef,
    enabled,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    minSwipeDistance,
  ])

  return {
    // Можно добавить состояние для отображения текущих жестов
    isGesturing: touchStartRef.current !== null,
  }
}

/**
 * Хук для мобильной навигации свайпами
 */
export function useSwipeNavigation(
  elementRef: React.RefObject<HTMLElement>,
  onNavigate: (direction: 'left' | 'right' | 'up' | 'down') => void
) {
  return useTouchGestures(elementRef, {
    onSwipeLeft: () => onNavigate('left'),
    onSwipeRight: () => onNavigate('right'),
    onSwipeUp: () => onNavigate('up'),
    onSwipeDown: () => onNavigate('down'),
  })
}

/**
 * Хук для зума изображения касанием
 */
export function usePinchZoom(
  elementRef: React.RefObject<HTMLElement>,
  onZoom: (scale: number, centerX: number, centerY: number) => void
) {
  const lastScaleRef = useRef(1)

  return useTouchGestures(elementRef, {
    onPinch: (scale) => {
      const element = elementRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      onZoom(scale, centerX, centerY)
      lastScaleRef.current = scale
    },
  })
}
