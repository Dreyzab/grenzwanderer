/**
 * CHARACTER SPRITE COMPONENT
 * Animated character display with emotion transitions
 * @see Plan.md lines 1269-1335
 */

import { motion, Variants } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Character, EmotionState, CharacterPosition, AnimationType } from '../model/types'
import { ensureValidEmotion, emotionToString, interpolateEmotions, applyEasing } from '../lib/emotionSystem'
import { ENTER_VARIANTS, TALK_VARIANT, getPresetAnimation } from '../lib/animationEngine'

// ============================================
// CHARACTER SPRITE COMPONENT
// ============================================

export interface CharacterSpriteProps {
  character: Character
  isActive?: boolean
  isTalking?: boolean
  className?: string
}

export function CharacterSprite({
  character,
  isActive = false,
  isTalking = false,
  className = '',
}: CharacterSpriteProps) {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>(
    ensureValidEmotion(character.emotion)
  )

  // Update emotion when character emotion changes
  useEffect(() => {
    const newEmotion = ensureValidEmotion(character.emotion)
    setCurrentEmotion(newEmotion)
  }, [character.emotion])

  // Get position-based enter animation
  const enterVariant = ENTER_VARIANTS[character.position] || ENTER_VARIANTS.center

  // Determine animation state
  const animationState = isTalking ? 'talking' : 'idle'

  return (
    <motion.div
      key={character.id}
      variants={enterVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        absolute
        ${getPositionStyles(character.position)}
        ${className}
      `}
      style={{
        zIndex: isActive ? 20 : 10,
      }}
    >
      {/* Character container with talking animation */}
      <motion.div
        variants={TALK_VARIANT}
        animate={animationState}
        className="relative"
      >
        {/* Character image/sprite */}
        <div className={`
          relative w-64 h-96
          ${isActive ? 'filter-none' : 'filter grayscale brightness-75'}
          transition-all duration-300
        `}>
          {/* Placeholder for character sprite */}
          {character.sprite ? (
            <img
              src={character.sprite}
              alt={character.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <CharacterPlaceholder 
              name={character.name}
              emotion={currentEmotion}
            />
          )}

          {/* Emotion overlay effect */}
          <EmotionOverlay emotion={currentEmotion} />
        </div>

        {/* Character name tag */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              absolute -bottom-8 left-1/2 -translate-x-1/2
              bg-zinc-900/90 backdrop-blur-sm
              border border-emerald-700/50
              rounded-lg px-4 py-1
              whitespace-nowrap
            "
          >
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
              {character.name}
            </span>
          </motion.div>
        )}

        {/* Glow effect when active */}
        {isActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              boxShadow: [
                '0 0 20px rgba(52, 211, 153, 0.3)',
                '0 0 40px rgba(52, 211, 153, 0.6)',
                '0 0 20px rgba(52, 211, 153, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}

// ============================================
// CHARACTER PLACEHOLDER
// ============================================

function CharacterPlaceholder({
  name,
  emotion,
}: {
  name: string
  emotion: EmotionState
}) {
  return (
    <div className="
      w-full h-full
      bg-gradient-to-b from-zinc-800 to-zinc-900
      border border-zinc-700
      rounded-lg
      flex flex-col items-center justify-center
      p-8
    ">
      {/* Silhouette */}
      <div className="w-32 h-32 rounded-full bg-zinc-700/50 mb-4" />
      
      {/* Name */}
      <div className="text-center">
        <div className="text-xl font-semibold text-zinc-400 mb-2">
          {name}
        </div>
        
        {/* Emotion indicator */}
        <div className="text-sm text-zinc-500">
          {emotionToString(emotion)}
        </div>
      </div>
    </div>
  )
}

// ============================================
// EMOTION OVERLAY
// ============================================

function EmotionOverlay({ emotion }: { emotion: EmotionState }) {
  // Get emotion color
  const emotionColor = getEmotionColor(emotion.primary)

  if (!emotionColor) return null

  return (
    <motion.div
      key={emotion.primary}
      initial={{ opacity: 0 }}
      animate={{ opacity: emotion.intensity / 300 }} // Very subtle
      exit={{ opacity: 0 }}
      className="
        absolute inset-0
        pointer-events-none
        mix-blend-overlay
      "
      style={{
        background: `radial-gradient(circle at 50% 40%, ${emotionColor}, transparent 70%)`,
      }}
    />
  )
}

// ============================================
// POSITION UTILITIES
// ============================================

function getPositionStyles(position: CharacterPosition): string {
  switch (position) {
    case 'left':
      return 'left-8 bottom-0'
    case 'right':
      return 'right-8 bottom-0'
    case 'center':
      return 'left-1/2 -translate-x-1/2 bottom-0'
    case 'offscreen':
      return 'left-full bottom-0'
    default:
      return 'left-1/2 -translate-x-1/2 bottom-0'
  }
}

function getEmotionColor(emotion: string): string | null {
  const colorMap: Record<string, string> = {
    happy: '#10b981', // emerald
    sad: '#3b82f6', // blue
    angry: '#ef4444', // red
    surprised: '#f59e0b', // amber
    confused: '#8b5cf6', // purple
    embarrassed: '#ec4899', // pink
    determined: '#f97316', // orange
    worried: '#06b6d4', // cyan
    excited: '#eab308', // yellow
    neutral: null as any,
  }

  return colorMap[emotion] || null
}

// ============================================
// CHARACTER GROUP COMPONENT
// ============================================

export interface CharacterGroupProps {
  characters: Character[]
  activeCharacterId?: string
  talkingCharacterId?: string
  className?: string
}

export function CharacterGroup({
  characters,
  activeCharacterId,
  talkingCharacterId,
  className = '',
}: CharacterGroupProps) {
  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      {characters
        .filter(char => char.position !== 'offscreen')
        .map(character => (
          <CharacterSprite
            key={character.id}
            character={character}
            isActive={character.id === activeCharacterId}
            isTalking={character.id === talkingCharacterId}
          />
        ))}
    </div>
  )
}



