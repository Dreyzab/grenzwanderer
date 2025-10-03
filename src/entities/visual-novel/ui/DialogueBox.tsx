/**
 * DIALOGUE BOX COMPONENT
 * Advanced dialogue display with typewriter effect and rich text support
 * @see Plan.md lines 1690-1696
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { DialogueNode, Speaker, EmotionState } from '../model/types'
import { emotionToString, ensureValidEmotion, getEmotionDescription } from '../lib/emotionSystem'

// ============================================
// TYPEWRITER HOOK
// ============================================

/**
 * Typewriter effect hook
 */
function useTypewriter(text: string, speed: number = 50, enabled: boolean = true) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text)
      setIsComplete(true)
      return
    }

    setDisplayedText('')
    setIsComplete(false)
    let currentIndex = 0

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, enabled])

  return { displayedText, isComplete }
}

// ============================================
// DIALOGUE BOX COMPONENT
// ============================================

export interface DialogueBoxProps {
  node: DialogueNode
  onNext?: () => void
  onChoose?: (choiceId: string) => void
  autoPlaySpeed?: number
  skipTypewriter?: boolean
  className?: string
}

export function DialogueBox({
  node,
  onNext,
  onChoose,
  autoPlaySpeed = 50,
  skipTypewriter = false,
  className = '',
}: DialogueBoxProps) {
  // Extract text from node
  const text = node.content?.text || node.text || ''
  const speaker = node.speaker
  const { displayedText, isComplete } = useTypewriter(text, autoPlaySpeed, !skipTypewriter)

  // Determine speaker name
  const speakerName = typeof speaker === 'string' 
    ? speaker 
    : (speaker as Speaker)?.displayName || ''

  // Get emotion if available
  const emotion = typeof speaker === 'object' && speaker !== null
    ? (speaker as Speaker).emotion
    : undefined

  // Handle click to skip or proceed
  const handleClick = () => {
    if (!isComplete) {
      // Skip typewriter
      skipTypewriter = true
    } else if (onNext) {
      onNext()
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={node.id || text}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`
          fixed bottom-8 left-1/2 -translate-x-1/2
          w-full max-w-4xl mx-auto px-4
          ${className}
        `}
        onClick={handleClick}
      >
        {/* Glass morphism dialogue box */}
        <div className="
          bg-zinc-900/90 backdrop-blur-lg
          border border-zinc-700/50
          rounded-2xl shadow-2xl
          p-6
          cursor-pointer
          hover:bg-zinc-900/95 transition-colors
        ">
          {/* Speaker name and emotion */}
          {speakerName && (
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-emerald-400 font-semibold text-lg uppercase tracking-wider">
                  {speakerName}
                </span>
                
                {/* Emotion indicator */}
                {emotion && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-zinc-500 italic"
                  >
                    ({getEmotionDescription(ensureValidEmotion(emotion))})
                  </motion.span>
                )}
              </motion.div>
            </div>
          )}

          {/* Dialogue text */}
          <div className="text-zinc-100 text-lg leading-relaxed">
            {displayedText}
            
            {/* Cursor animation */}
            {!isComplete && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block ml-1"
              >
                ▊
              </motion.span>
            )}
          </div>

          {/* Continue indicator */}
          {isComplete && onNext && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-end mt-4"
            >
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-emerald-400 text-sm"
              >
                ▼ Нажмите для продолжения
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================
// NARRATION BOX VARIANT
// ============================================

export function NarrationBox({
  text,
  onNext,
  autoPlaySpeed = 50,
  skipTypewriter = false,
}: {
  text: string
  onNext?: () => void
  autoPlaySpeed?: number
  skipTypewriter?: boolean
}) {
  const { displayedText, isComplete } = useTypewriter(text, autoPlaySpeed, !skipTypewriter)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        fixed inset-0 flex items-center justify-center
        bg-black/60 backdrop-blur-sm
        p-8
      "
      onClick={onNext}
    >
      <div className="
        max-w-3xl w-full
        bg-zinc-900/50 backdrop-blur-md
        border border-zinc-700/30
        rounded-lg
        p-8
      ">
        <p className="text-zinc-300 text-xl leading-relaxed text-center italic">
          {displayedText}
          {!isComplete && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block ml-1"
            >
              ▊
            </motion.span>
          )}
        </p>
      </div>
    </motion.div>
  )
}



