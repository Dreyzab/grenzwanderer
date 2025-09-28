import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TypewriterTextProps {
  text: string
  speed?: number // characters per second
  onComplete?: () => void
  className?: string
  skipAnimation?: boolean
}

export function TypewriterText({ 
  text, 
  speed = 30, 
  onComplete, 
  className = '',
  skipAnimation = false 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (skipAnimation) {
      setDisplayedText(text)
      setIsComplete(true)
      onComplete?.()
      return
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 1000 / speed)

      return () => clearTimeout(timeout)
    } else if (!isComplete) {
      setIsComplete(true)
      onComplete?.()
    }
  }, [currentIndex, text, speed, onComplete, isComplete, skipAnimation])

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  return (
    <div className={className}>
      <span>{displayedText}</span>
      {!isComplete && (
        <motion.span
          className="inline-block ml-1 w-2 h-5 bg-emerald-400"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        >
          |
        </motion.span>
      )}
    </div>
  )
}

// Hook для управления typewriter эффектом
export function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, 1000 / speed)
    
    return () => clearInterval(interval)
  }, [text, speed])
  
  return { displayedText, isComplete }
}
