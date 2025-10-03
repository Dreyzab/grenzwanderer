// ============================================
// VISUAL NOVEL ADVANCED TYPE SYSTEM
// Based on Plan.md specifications
// ============================================

// ============================================
// BASE EMOTION SYSTEM
// ============================================

/**
 * Base emotions for character expressions
 * @see Plan.md lines 1132-1143
 */
export enum BaseEmotion {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  SURPRISED = 'surprised',
  CONFUSED = 'confused',
  EMBARRASSED = 'embarrassed',
  DETERMINED = 'determined',
  WORRIED = 'worried',
  EXCITED = 'excited'
}

/**
 * Micro-expressions for detailed character emotions
 * @see Plan.md lines 1115-1122
 */
export interface MicroExpressions {
  eyebrows?: 'raised' | 'furrowed' | 'normal'
  eyes?: 'wide' | 'narrow' | 'closed' | 'normal'
  mouth?: 'smile' | 'frown' | 'smirk' | 'neutral'
  blush?: boolean
  sweatDrop?: boolean
}

/**
 * Emotion transition configuration
 * @see Plan.md lines 1124-1130
 */
export interface EmotionTransition {
  from: EmotionState
  duration: number // milliseconds
  easing: 'linear' | 'ease-in' | 'ease-out' | 'bounce'
}

/**
 * Complete emotion state with intensity and micro-expressions
 * @see Plan.md lines 1110-1130
 */
export interface EmotionState {
  primary: BaseEmotion
  intensity: number // 0-100
  secondary?: BaseEmotion
  microExpressions?: MicroExpressions
  transition?: EmotionTransition
}

// ============================================
// CHARACTER SYSTEM
// ============================================

/**
 * Character position on screen
 */
export type CharacterPosition = 'left' | 'right' | 'center' | 'offscreen'

/**
 * Character state for visual novel
 */
export interface CharacterState {
  position: CharacterPosition
  emotion: EmotionState | string // string for backward compatibility
  visible: boolean
  sprite?: string
  outfit?: string
}

/**
 * Character definition
 */
export interface Character {
  id: string
  name: string
  sprite?: string
  position: CharacterPosition
  emotion: EmotionState | string // Enhanced with EmotionState
  outfit?: string
}

// ============================================
// ANIMATION SYSTEM
// ============================================

/**
 * Animation types for characters
 * @see Plan.md lines 1327-1335
 */
export enum AnimationType {
  ENTER = 'enter',
  EXIT = 'exit',
  IDLE = 'idle',
  TALK = 'talk',
  EMOTION = 'emotion',
  GESTURE = 'gesture',
  MOVE = 'move'
}

/**
 * Character animation configuration
 * @see Plan.md lines 1305-1335
 */
export interface CharacterAnimation {
  type: AnimationType
  duration: number
  easing: string

  // Transform animations
  transforms?: {
    position?: { x: number; y: number }
    scale?: { x: number; y: number }
    rotation?: number
    opacity?: number
  }

  // Special effects
  specialEffects?: {
    bounce?: boolean
    shake?: { intensity: number; frequency: number }
    glow?: { color: string; intensity: number }
    blur?: number
  }
}

// ============================================
// VISUAL EFFECTS
// ============================================

/**
 * Visual effects for scenes
 * @see Plan.md lines 1084-1090
 */
export interface VisualEffect {
  type: 'fade' | 'shake' | 'flash' | 'particles' | 'blur'
  duration: number
  intensity: number
  color?: string
}

/**
 * Fade configuration
 * @see Plan.md lines 1089
 */
export interface FadeConfig {
  duration: number
  direction: 'in' | 'out' | 'cross'
  color?: string
}

/**
 * Scene presentation configuration
 * @see Plan.md lines 1084-1090
 */
export interface PresentationConfig {
  backgroundMusic?: string
  soundEffects?: string[]
  visualEffects?: VisualEffect[]
  cameraShake?: boolean
  fadeTransition?: FadeConfig
}

// ============================================
// CHOICE SYSTEM
// ============================================

/**
 * Skill types for checks
 */
export type SkillType = 'logic' | 'empathy' | 'cynicism' | 'combat' | 'technical'

/**
 * Skill check configuration
 * @see Plan.md lines 1194-1208
 */
export interface SkillCheck {
  skill: SkillType
  difficulty: number // 0-100
  successText: string
  failureText: string
  criticalSuccess?: string
  criticalFailure?: string

  // Modifiers
  modifiers?: {
    reputation?: number
    items?: string[]
    relationships?: Record<string, number>
  }
}

/**
 * Resource cost for choices
 */
export interface ResourceCost {
  type: 'item' | 'currency' | 'energy'
  amount: number
  resource: string
}

/**
 * Reputation change vector
 * @see Plan.md lines 1173
 */
export interface ReputationVector {
  combat?: number
  exploration?: number
  social?: number
  reliability?: number
}

/**
 * Relationship change
 * @see Plan.md lines 1174
 */
export interface RelationshipChange {
  characterId: string
  trust?: number
  respect?: number
  affection?: number
  fear?: number
}

/**
 * World state change
 */
export interface WorldStateChange {
  flag: string
  value: any
}

/**
 * Delayed effect (consequences)
 * @see Plan.md lines 1172
 */
export interface DelayedEffect {
  delay: number // milliseconds or turns
  type: 'flag' | 'reputation' | 'relationship' | 'event'
  data: any
}

/**
 * Choice outcome
 * @see Plan.md lines 1091-1098
 */
export interface Outcome {
  type: 'flag' | 'item' | 'reputation' | 'relationship' | 'quest'
  data: any
}

/**
 * Conditional destination
 */
export interface ConditionalDestination {
  condition: string
  destination: string
}

/**
 * Color coding for choices
 * @see Plan.md lines 1183-1191
 */
export enum ChoiceColor {
  NEUTRAL = 'text-zinc-300',
  POSITIVE = 'text-emerald-400',
  NEGATIVE = 'text-red-400',
  CAUTIOUS = 'text-blue-400',
  BOLD = 'text-amber-400',
  MYSTERIOUS = 'text-purple-400',
  SKILL = 'text-teal-400'
}

/**
 * Choice style
 */
export type ChoiceStyle = 'default' | 'important' | 'timed' | 'hidden'

/**
 * Choice availability configuration
 * @see Plan.md lines 1154-1159
 */
export interface ChoiceAvailability {
  conditions?: string[]
  cost?: ResourceCost[]
  oneTime?: boolean
  skillCheck?: SkillCheck
}

/**
 * Choice presentation
 * @see Plan.md lines 1162-1167
 */
export interface ChoicePresentation {
  color?: ChoiceColor
  icon?: string
  tooltip?: string
  style?: ChoiceStyle
}

/**
 * Choice effects
 * @see Plan.md lines 1170-1176
 */
export interface ChoiceEffects {
  immediate: Outcome[]
  delayed: DelayedEffect[]
  reputation: ReputationVector
  relationships: RelationshipChange[]
  worldState: WorldStateChange[]
}

/**
 * Advanced dialogue choice
 * @see Plan.md lines 1149-1180
 */
export interface DialogueChoice {
  id: string
  text: string
  next?: string // Node ID for internal navigation
  nextScene?: string // Scene ID for scene transition

  // Advanced features
  availability?: ChoiceAvailability
  presentation?: ChoicePresentation
  effects?: ChoiceEffects

  // Backward compatibility
  conditions?: string[]
  setFlags?: Record<string, any>
}

// ============================================
// DIALOGUE NODE SYSTEM
// ============================================

/**
 * Rich text node for formatting
 * @see Plan.md lines 1069
 */
export interface RichTextNode {
  type: 'text' | 'emphasis' | 'color' | 'pause'
  content: string
  style?: string
}

/**
 * Speaker information
 * @see Plan.md lines 1075-1079
 */
export interface Speaker {
  characterId: string
  displayName: string
  emotion: EmotionState | string
  outfit?: string
  position?: CharacterPosition
}

/**
 * Dialogue content
 * @see Plan.md lines 1067-1073
 */
export interface DialogueContent {
  text: string
  richText?: RichTextNode[]
  translations?: Record<string, string>
  voiceFile?: string
}

/**
 * Conditions for dialogue
 */
export interface Condition {
  type: 'flag' | 'skill' | 'item' | 'relationship'
  key: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<='
  value: any
}

/**
 * Dialogue node logic
 * @see Plan.md lines 1093-1098
 */
export interface DialogueLogic {
  conditions?: Condition[]
  outcomes?: Outcome[]
  flags?: Record<string, any>
  reputation?: ReputationVector
}

/**
 * Dialogue navigation
 * @see Plan.md lines 1101-1106
 */
export interface DialogueNavigation {
  next?: string
  choices?: DialogueChoice[]
  randomNext?: string[]
  conditionalNext?: ConditionalDestination[]
}

/**
 * Advanced dialogue node
 * @see Plan.md lines 1062-1107
 */
export interface DialogueNode {
  id?: string
  type?: 'dialogue' | 'narration' | 'choice' | 'action' | 'conditional'

  // Content
  content?: DialogueContent
  text?: string // Backward compatibility
  speaker?: Speaker | string // Enhanced with Speaker
  characterId?: string // Backward compatibility

  // Presentation
  presentation?: PresentationConfig

  // Logic
  logic?: DialogueLogic

  // Navigation
  navigation?: DialogueNavigation
  next?: string // Backward compatibility
  choices?: DialogueChoice[] // Backward compatibility

  // Legacy support
  conditions?: string[]
  action?: string
  dialogKey?: string
}

// ============================================
// SCENE SYSTEM
// ============================================

/**
 * Scene definition
 */
export interface Scene {
  id: string
  title?: string
  background?: string
  characters: Record<string, Character>
  dialogue: DialogueNode[]
  choices?: DialogueChoice[]
  nextScene?: string
  presentation?: PresentationConfig
}

// ============================================
// GAME STATE
// ============================================

/**
 * History entry
 */
export interface HistoryEntry {
  sceneId: string
  lineIndex: number
  text: string
  speaker: string
  timestamp?: number
}

/**
 * Game state
 */
export interface GameState {
  currentSceneId: string
  lineIndex: number
  characterStates: Record<string, CharacterState>
  inventory: any[]
  flags: Record<string, any>
  history: HistoryEntry[]
  
  // Advanced features
  reputation?: ReputationVector
  relationships?: Record<string, number>
  skills?: Record<SkillType, number>
}

/**
 * Game actions
 */
export interface GameActions {
  setScene: (sceneId: string) => void
  nextLine: () => void
  choose: (choiceId: string) => void
  setFlag: (key: string, value: any) => void
  reset: (sceneId: string) => void
  hydrate: (state: GameState) => void
  
  // Advanced actions
  updateEmotion?: (characterId: string, emotion: EmotionState) => void
  updateRelationship?: (characterId: string, change: Partial<RelationshipChange>) => void
  updateReputation?: (change: ReputationVector) => void
}

/**
 * Visual Novel state
 */
export interface VNState {
  game: GameState
  scenes: Record<string, Scene>
  actions: GameActions
}

// ============================================
// DISPLAY MODES
// ============================================

/**
 * Display mode configurations
 * @see Plan.md lines 1048-1052
 */
export type DisplayMode = 'ADV' | 'NVL' | 'CHAT'

export interface DisplayModeConfig {
  mode: DisplayMode
  fontSize?: number
  lineHeight?: number
  backgroundColor?: string
  textColor?: string
}

// ============================================
// AUDIO SYSTEM
// ============================================

/**
 * Audio playback configuration
 * @see Plan.md lines 1359-1366
 */
export interface AudioPlayback {
  autoPlay: boolean
  skipVoiceOnFastText: boolean
  voiceVolume: number
  sfxVolume: number
  musicVolume: number
}

/**
 * Voice profile for characters
 * @see Plan.md lines 1369-1390
 */
export interface VoiceProfile {
  characterId: string
  voiceParams: {
    pitch: number // 0.5-2.0
    speed: number // 0.5-2.0
    volume: number // 0-1
    accent?: string
    emotion_modifier?: number
  }
  recordedClips?: {
    greeting: string[]
    goodbye: string[]
    agreement: string[]
    disagreement: string[]
    laughter: string[]
    surprise: string[]
  }
}
