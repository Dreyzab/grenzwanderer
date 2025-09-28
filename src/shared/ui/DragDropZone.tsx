import { motion } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { ReactNode, useState, useRef } from 'react'

interface DragDropZoneProps {
  children: ReactNode
  onDrop?: (item: any, dropZone: string) => void
  onDragStart?: (item: any) => void
  onDragEnd?: (item: any) => void
  dropZoneId?: string
  dragData?: any
  className?: string
  dragConstraints?: any
  disabled?: boolean
}

interface DropZoneProps {
  onDrop: (item: any) => void
  children: ReactNode
  className?: string
  dropZoneId: string
  isValidDrop?: (item: any) => boolean
}

export function DragDropZone({
  children,
  onDrop,
  onDragStart,
  onDragEnd,
  dropZoneId = '',
  dragData,
  className = '',
  dragConstraints,
  disabled = false
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleDragStart = () => {
    if (disabled) return
    setIsDragging(true)
    onDragStart?.(dragData)
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled) return
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
    
    // Find drop zone under cursor
    const elements = document.elementsFromPoint(
      event.clientX || info.point.x,
      event.clientY || info.point.y
    )
    
    const dropZone = elements.find(el => 
      el.getAttribute('data-drop-zone')
    )
    
    if (dropZone && onDrop) {
      const targetDropZoneId = dropZone.getAttribute('data-drop-zone')
      onDrop(dragData, targetDropZoneId || '')
    }
    
    onDragEnd?.(dragData)
  }

  const handleDrag = (event: any, info: PanInfo) => {
    setDragOffset({ x: info.offset.x, y: info.offset.y })
  }

  if (disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={`cursor-grab active:cursor-grabbing ${className} ${
        isDragging ? 'z-50' : ''
      }`}
      drag
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={handleDrag}
      animate={{
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? dragOffset.x * 0.1 : 0,
        zIndex: isDragging ? 1000 : 1
      }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.div>
  )
}

export function DropZone({
  onDrop,
  children,
  className = '',
  dropZoneId,
  isValidDrop = () => true
}: DropZoneProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isValidDropZone, setIsValidDropZone] = useState(false)

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsHovered(true)
  }

  const handleDragLeave = () => {
    setIsHovered(false)
    setIsValidDropZone(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsHovered(false)
    setIsValidDropZone(false)
    
    try {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'))
      if (isValidDrop(data)) {
        onDrop(data)
      }
    } catch (error) {
      console.warn('Invalid drop data:', error)
    }
  }

  return (
    <motion.div
      className={`
        ${className}
        ${isHovered ? 'ring-2 ring-emerald-400 ring-opacity-50' : ''}
        ${isValidDropZone ? 'bg-emerald-500 bg-opacity-10' : ''}
        transition-all duration-200
      `}
      data-drop-zone={dropZoneId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        scale: isHovered ? 1.02 : 1,
        backgroundColor: isValidDropZone 
          ? 'rgba(34, 197, 94, 0.1)' 
          : 'transparent'
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

// Hook для управления drag&drop состоянием
export function useDragDrop<T = any>() {
  const [draggedItem, setDraggedItem] = useState<T | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [validDropZones, setValidDropZones] = useState<string[]>([])

  const startDrag = (item: T, validZones: string[] = []) => {
    setDraggedItem(item)
    setIsDragging(true)
    setValidDropZones(validZones)
  }

  const endDrag = () => {
    setDraggedItem(null)
    setIsDragging(false)
    setValidDropZones([])
  }

  const isValidDropZone = (zoneId: string) => {
    return validDropZones.length === 0 || validDropZones.includes(zoneId)
  }

  return {
    draggedItem,
    isDragging,
    validDropZones,
    startDrag,
    endDrag,
    isValidDropZone
  }
}
