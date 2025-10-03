/**
 * CHOICE BUTTONS COMPONENT
 * Advanced choice system with skill checks, costs, and visual indicators
 * @see Plan.md lines 1147-1208
 */

import { motion } from 'framer-motion'
import { Lock, Zap, Target, Heart, Brain, Shield } from 'lucide-react'
import type { DialogueChoice, SkillCheck, ChoiceColor } from '../model/types'

// ============================================
// SKILL ICONS
// ============================================

const SKILL_ICONS = {
  logic: Brain,
  empathy: Heart,
  cynicism: Shield,
  combat: Target,
  technical: Zap,
}

// ============================================
// CHOICE BUTTON COMPONENT
// ============================================

export interface ChoiceButtonProps {
  choice: DialogueChoice
  onClick: (choiceId: string) => void
  disabled?: boolean
  playerSkills?: Record<string, number>
  className?: string
}

export function ChoiceButton({
  choice,
  onClick,
  disabled = false,
  playerSkills = {},
  className = '',
}: ChoiceButtonProps) {
  // Check availability
  const isAvailable = checkChoiceAvailability(choice, playerSkills)
  const isDisabled = disabled || !isAvailable

  // Get choice color
  const choiceColor = choice.presentation?.color || ChoiceColor.NEUTRAL

  // Get skill check info
  const skillCheck = choice.availability?.skillCheck
  const skillCheckResult = skillCheck ? evaluateSkillCheck(skillCheck, playerSkills) : null

  // Get cost info
  const cost = choice.availability?.cost?.[0]

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isDisabled ? 0.5 : 1, x: 0 }}
      whileHover={!isDisabled ? { scale: 1.02, x: 5 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
      onClick={() => !isDisabled && onClick(choice.id)}
      disabled={isDisabled}
      className={`
        relative w-full text-left
        bg-zinc-800/50 backdrop-blur-sm
        border border-zinc-700/50
        rounded-lg p-4
        ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-800/70'}
        transition-colors
        ${className}
      `}
    >
      {/* Choice text with color */}
      <div className="flex items-start gap-3">
        {/* Icon or indicator */}
        <div className="flex-shrink-0 mt-1">
          {/* Locked indicator */}
          {!isAvailable && (
            <Lock className="w-5 h-5 text-red-400" />
          )}
          
          {/* Skill check indicator */}
          {skillCheck && isAvailable && (
            <SkillCheckIndicator 
              skillCheck={skillCheck} 
              result={skillCheckResult}
            />
          )}
          
          {/* Cost indicator */}
          {cost && isAvailable && !skillCheck && (
            <CostIndicator cost={cost} />
          )}
          
          {/* Icon from presentation */}
          {choice.presentation?.icon && isAvailable && !skillCheck && !cost && (
            <span className="text-xl">{choice.presentation.icon}</span>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1">
          <p className={`text-base ${choiceColor} leading-snug`}>
            {choice.text}
          </p>

          {/* Tooltip/description */}
          {choice.presentation?.tooltip && (
            <p className="text-xs text-zinc-500 mt-1">
              {choice.presentation.tooltip}
            </p>
          )}

          {/* Skill check details */}
          {skillCheck && (
            <SkillCheckDetails 
              skillCheck={skillCheck}
              result={skillCheckResult}
              playerSkills={playerSkills}
            />
          )}

          {/* Cost details */}
          {cost && (
            <div className="text-xs text-amber-400 mt-1">
              Стоимость: {cost.amount} {cost.resource}
            </div>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      {!isDisabled && (
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
          whileHover={{ opacity: 0.1 }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${getColorHex(choiceColor)}, transparent)`,
          }}
        />
      )}
    </motion.button>
  )
}

// ============================================
// SKILL CHECK INDICATOR
// ============================================

function SkillCheckIndicator({
  skillCheck,
  result,
}: {
  skillCheck: SkillCheck
  result: SkillCheckResult | null
}) {
  const SkillIcon = SKILL_ICONS[skillCheck.skill] || Brain
  const successChance = result?.successChance || 0

  return (
    <div className="relative">
      <SkillIcon 
        className={`w-5 h-5 ${
          successChance >= 75 ? 'text-emerald-400' :
          successChance >= 50 ? 'text-amber-400' :
          'text-red-400'
        }`}
      />
      
      {/* Success chance indicator */}
      <div className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-zinc-900 rounded-full px-1">
        {Math.round(successChance)}%
      </div>
    </div>
  )
}

// ============================================
// SKILL CHECK DETAILS
// ============================================

function SkillCheckDetails({
  skillCheck,
  result,
  playerSkills,
}: {
  skillCheck: SkillCheck
  result: SkillCheckResult | null
  playerSkills: Record<string, number>
}) {
  if (!result) return null

  const playerSkillLevel = playerSkills[skillCheck.skill] || 0

  return (
    <div className="mt-2 text-xs text-zinc-400 space-y-1">
      <div className="flex items-center gap-2">
        <span className="capitalize">{skillCheck.skill}:</span>
        <span className={`font-semibold ${
          result.success ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {playerSkillLevel} / {skillCheck.difficulty}
        </span>
      </div>
      
      <div className="text-[10px] text-zinc-500">
        Шанс успеха: {Math.round(result.successChance)}%
      </div>
    </div>
  )
}

// ============================================
// COST INDICATOR
// ============================================

function CostIndicator({ cost }: { cost: any }) {
  return (
    <Zap className="w-5 h-5 text-amber-400" />
  )
}

// ============================================
// CHOICE LIST COMPONENT
// ============================================

export interface ChoiceListProps {
  choices: DialogueChoice[]
  onChoose: (choiceId: string) => void
  playerSkills?: Record<string, number>
  className?: string
}

export function ChoiceList({
  choices,
  onChoose,
  playerSkills = {},
  className = '',
}: ChoiceListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatedPresence>
        {choices.map((choice, index) => (
          <motion.div
            key={choice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <ChoiceButton
              choice={choice}
              onClick={onChoose}
              playerSkills={playerSkills}
            />
          </motion.div>
        ))}
      </AnimatedPresence>
    </div>
  )
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if choice is available
 */
function checkChoiceAvailability(
  choice: DialogueChoice,
  playerSkills: Record<string, number>
): boolean {
  // Check conditions (legacy)
  if (choice.conditions && choice.conditions.length > 0) {
    // Simplified condition check
    return true // TODO: Implement proper condition evaluation
  }

  // Check skill requirements
  const skillCheck = choice.availability?.skillCheck
  if (skillCheck) {
    const playerSkill = playerSkills[skillCheck.skill] || 0
    // Allow attempt even if skill is low (chance-based)
    return true
  }

  // Check cost
  const cost = choice.availability?.cost
  if (cost && cost.length > 0) {
    // TODO: Check if player has resources
    return true
  }

  return true
}

/**
 * Evaluate skill check
 */
interface SkillCheckResult {
  success: boolean
  successChance: number
  isCritical: boolean
}

function evaluateSkillCheck(
  skillCheck: SkillCheck,
  playerSkills: Record<string, number>
): SkillCheckResult {
  const playerSkill = playerSkills[skillCheck.skill] || 0
  const difficulty = skillCheck.difficulty

  // Calculate success chance (0-100%)
  const basehance = Math.max(0, Math.min(100, ((playerSkill / difficulty) * 100)))
  
  // Apply modifiers
  let successChance = baseChance
  if (skillCheck.modifiers?.reputation) {
    successChance += skillCheck.modifiers.reputation
  }

  successChance = Math.max(0, Math.min(100, successChance))

  // Determine if it would succeed
  const success = playerSkill >= difficulty || successChance >= 50

  // Check for critical
  const isCritical = playerSkill >= difficulty * 1.5

  return {
    success,
    successChance,
    isCritical,
  }
}

/**
 * Get color hex from ChoiceColor
 */
function getColorHex(color: ChoiceColor): string {
  const colorMap: Record<string, string> = {
    'text-zinc-300': '#d4d4d8',
    'text-emerald-400': '#34d399',
    'text-red-400': '#f87171',
    'text-blue-400': '#60a5fa',
    'text-amber-400': '#fbbf24',
    'text-purple-400': '#c084fc',
    'text-teal-400': '#2dd4bf',
  }

  return colorMap[color] || '#d4d4d8'
}

// Import AnimatePresence for transitions
import { AnimatePresence } from 'framer-motion'


