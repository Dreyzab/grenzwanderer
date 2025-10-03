import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import {
  DialogueBox,
  ChoiceList,
  CharacterGroup,
  useVisualNovelStore,
} from '@/entities/visual-novel'
import { scenarios } from '@/entities/visual-novel/api/scenarios'
import { useSaveProgress, useGameProgress, useResetProgress } from '@/shared/api/gameProgress'
import logger from '@/shared/lib/logger'

/**
 * Ð¡Ñ‚Ñ€Ð°Ð½Ð¸Ñ†Ð° Ð²Ð¸Ð·ÑƒÐ°Ð»ÑŒÐ½Ð¾Ð¹ Ð½Ð¾Ð²ÐµÐ»Ð»Ñ‹ - ÐŸÑ€Ð¾Ð»Ð¾Ð³ Ð¸Ð³Ñ€Ñ‹
 * 
 * Ð¡Ð»ÐµÐ´ÑƒÐµÑ‚ FSD Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ðµ:
 * - Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ entities/visual-novel Ð´Ð»Ñ UI ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð²
 * - Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ shared/api Ð´Ð»Ñ Convex Ð¸Ð½Ñ‚ÐµÐ³Ñ€Ð°Ñ†Ð¸Ð¸
 * - Ð£Ð¿Ñ€Ð°Ð²Ð»ÑÐµÑ‚ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÐµÐ¼ Ñ‡ÐµÑ€ÐµÐ· Zustand store
 */
export function VisualNovelPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  // Convex hooks
  const saveProgress = useSaveProgress()
  const gameProgress = useGameProgress()
  const resetProgress = useResetProgress()

  // Visual Novel store
  const vnStore = useVisualNovelStore()
  const currentSceneId = vnStore.game.currentSceneId
  const lineIndex = vnStore.game.lineIndex
  const visitedScenes = vnStore.game.history.map(h => h.sceneId)
  const flags = vnStore.game.flags
  const { setScene, setFlag: setLocalFlag, reset, nextLine } = vnStore.actions

  // Resolve scene by id (store or static scenarios)
  const currentScene = (vnStore.scenes[currentSceneId] ?? scenarios[currentSceneId])

  // Navigation helpers
  const advanceToScene = (scene: { id: string }) => setScene(scene.id)
  const loadScene = (scene: { id: string }) => setScene(scene.id)

  // Ð—Ð°Ð³Ñ€ÑƒÐ·ÐºÐ° Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑÐ° Ð¸Ð· Convex Ð¿Ñ€Ð¸ Ð¼Ð¾Ð½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ð¸
  useEffect(() => {
    const loadGameProgress = async () => {
      try {
        if (gameProgress && gameProgress.currentScene) {
          logger.info('[VN] Loading progress from Convex', {
            scene: gameProgress.currentScene,
            visited: gameProgress.visitedScenes.length,
          })

          // Ð—Ð°Ð³Ñ€ÑƒÐ¶Ð°ÐµÐ¼ ÑÑ†ÐµÐ½Ñƒ Ð¸Ð· Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑÐ°
          setScene(gameProgress.currentScene)

          // Ð£ÑÑ‚Ð°Ð½Ð°Ð²Ð»Ð¸Ð²Ð°ÐµÐ¼ Ñ„Ð»Ð°Ð³Ð¸
          if (gameProgress.flags) {
            Object.entries(gameProgress.flags).forEach(([key, value]) => {
              setLocalFlag(key, value)
            })
          }
        } else {
          // ÐÐµÑ‚ ÑÐ¾Ñ…Ñ€Ð°Ð½Ñ‘Ð½Ð½Ð¾Ð³Ð¾ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑÐ° - Ð½Ð°Ñ‡Ð¸Ð½Ð°ÐµÐ¼ Ñ Ð¿Ñ€Ð¾Ð»Ð¾Ð³Ð°
          logger.info('[VN] No saved progress, starting from prologue_start')
          setScene('prologue_start')
        }
      } catch (error) {
        logger.error('[VN] Failed to load progress', error)
        // Ð’ ÑÐ»ÑƒÑ‡Ð°Ðµ Ð¾ÑˆÐ¸Ð±ÐºÐ¸ Ð½Ð°Ñ‡Ð¸Ð½Ð°ÐµÐ¼ Ñ Ð½Ð°Ñ‡Ð°Ð»Ð°
        setScene('prologue_start')
      } finally {
        setIsLoading(false)
      }
    }

    loadGameProgress()
  }, [gameProgress, setScene, setLocalFlag])

  // ÐÐ²Ñ‚Ð¾ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ðµ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑÐ° Ð¿Ñ€Ð¸ ÑÐ¼ÐµÐ½Ðµ ÑÑ†ÐµÐ½Ñ‹
  useEffect(() => {
    if (!isLoading && currentSceneId) {
      const saveCurrentProgress = async () => {
        try {
          await saveProgress(
            currentSceneId,
            visitedScenes,
            flags
          )
          logger.debug('[VN] Progress saved', {
            scene: currentSceneId,
            flags: Object.keys(flags).length,
          })
        } catch (error) {
          logger.error('[VN] Failed to save progress', error)
        }
      }

      // Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÑÐµÐ¼ Ñ Ð½ÐµÐ±Ð¾Ð»ÑŒÑˆÐ¾Ð¹ Ð·Ð°Ð´ÐµÑ€Ð¶ÐºÐ¾Ð¹ Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð½Ðµ ÑÐ¿Ð°Ð¼Ð¸Ñ‚ÑŒ Convex
      const timeoutId = setTimeout(saveCurrentProgress, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [currentSceneId, visitedScenes, flags, saveProgress, isLoading])

  // ÐžÐ±Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐ° Ð²Ñ‹Ð±Ð¾Ñ€Ð°
  const handleChoice = async (choiceId: string) => {
    if (!currentScene) return

    const choice = currentScene.choices?.find((c) => c.id === choiceId)
    if (!choice) return

    logger.info('[VN] Choice made', { choiceId, scene: currentSceneId })

    // ÐŸÑ€Ð¸Ð¼ÐµÐ½ÑÐµÐ¼ ÑÑ„Ñ„ÐµÐºÑ‚Ñ‹ Ð²Ñ‹Ð±Ð¾Ñ€Ð°
    if (choice.effects) {
      // Ð£ÑÑ‚Ð°Ð½Ð°Ð²Ð»Ð¸Ð²Ð°ÐµÐ¼ Ñ„Ð»Ð°Ð³Ð¸
      if (choice.effects.flags) {
        for (const flag of choice.effects.flags) {
          setLocalFlag(flag.key, flag.value)
        }
      }

      // ÐžÐ±Ñ€Ð°Ð±Ð°Ñ‚Ñ‹Ð²Ð°ÐµÐ¼ skill check Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ñ‹
      if (choice.availability?.skillCheck) {
        // TODO: Ð˜Ð½Ñ‚ÐµÐ³Ñ€Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ ÑÐ¸ÑÑ‚ÐµÐ¼Ñƒ Ð½Ð°Ð²Ñ‹ÐºÐ¾Ð²
        // ÐŸÐ¾ÐºÐ° Ð¿Ñ€Ð¾ÑÑ‚Ð¾ Ð¿ÐµÑ€ÐµÑ…Ð¾Ð´Ð¸Ð¼ Ðº nextScene Ð¸Ð»Ð¸ onSuccess/onFailure
        if (choice.effects.onSuccess && Math.random() > 0.5) {
          const nextSceneId = choice.effects.onSuccess.nextScene
          if (nextSceneId) {
            const nextScene = scenarios[nextSceneId]
            if (nextScene) {
              advanceToScene(nextScene)
            }
          }
          return
        } else if (choice.effects.onFailure) {
          const nextSceneId = choice.effects.onFailure.nextScene
          if (nextSceneId) {
            const nextScene = scenarios[nextSceneId]
            if (nextScene) {
              advanceToScene(nextScene)
            }
          }
          return
        }
      }
    }

    // ÐžÐ±Ñ‹Ñ‡Ð½Ñ‹Ð¹ Ð¿ÐµÑ€ÐµÑ…Ð¾Ð´ Ðº ÑÐ»ÐµÐ´ÑƒÑŽÑ‰ÐµÐ¹ ÑÑ†ÐµÐ½Ðµ
    if (choice.nextScene) {
      const nextScene = scenarios[choice.nextScene]
      if (nextScene) {
        advanceToScene(nextScene)
      }
    }
  }

  // ÐŸÐµÑ€ÐµÑ…Ð¾Ð´ Ðº ÑÐ»ÐµÐ´ÑƒÑŽÑ‰ÐµÐ¹ ÑÑ‚Ñ€Ð¾ÐºÐµ Ð´Ð¸Ð°Ð»Ð¾Ð³Ð°
  const handleNext = () => {
    // Ð•ÑÐ»Ð¸ ÐµÑÑ‚ÑŒ Ð²Ñ‹Ð±Ð¾Ñ€Ñ‹, Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÐ¼ Ð¸Ñ…
    if (currentScene?.choices && currentScene.choices.length > 0) {
      return
    }

    // Ð˜Ð½Ð°Ñ‡Ðµ Ð¿ÐµÑ€ÐµÑ…Ð¾Ð´Ð¸Ð¼ Ðº nextScene ÐµÑÐ»Ð¸ Ð¾Ð½ ÐµÑÑ‚ÑŒ
    if (currentScene?.nextScene) {
      const nextScene = scenarios[currentScene.nextScene]
      if (nextScene) {
        advanceToScene(nextScene)
      }
    }
  }

  // Ð¡Ð±Ñ€Ð¾Ñ Ð¸Ð³Ñ€Ñ‹
  const handleReset = async () => {
    if (!confirm('Ð’Ñ‹ ÑƒÐ²ÐµÑ€ÐµÐ½Ñ‹, Ñ‡Ñ‚Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ Ð½Ð°Ñ‡Ð°Ñ‚ÑŒ Ð½Ð¾Ð²ÑƒÑŽ Ð¸Ð³Ñ€Ñƒ? Ð’ÐµÑÑŒ Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑÑ Ð±ÑƒÐ´ÐµÑ‚ ÑƒÑ‚ÐµÑ€ÑÐ½.')) {
      return
    }

    try {
      await resetProgress()
      reset('prologue_start')
      
      const startScene = scenarios.prologue_start
      if (startScene) {
        loadScene(startScene)
      }

      logger.info('[VN] Game reset')
    } catch (error) {
      logger.error('[VN] Failed to reset game', error)
    }
  }

  // Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‚ Ð² Ð³Ð»Ð°Ð²Ð½Ð¾Ðµ Ð¼ÐµÐ½ÑŽ
  const handleBack = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="mb-4 text-xl text-zinc-100">Загрузка...</div>
          <div className="text-sm text-zinc-400">Подготовка визуальной новеллы</div>
        </div>
      </div>
    )
  }

  if (!currentScene) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="mb-4 text-xl text-red-400">Ошибка</div>
          <div className="mb-6 text-sm text-zinc-400">Не удалось загрузить сцену</div>
          <button
            onClick={handleBack}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-zinc-100 transition-colors hover:bg-zinc-600"
          >
            Вернуться в меню
          </button>
        </div>
      </div>
    )
  }

  // ÐŸÐ¾Ð»ÑƒÑ‡Ð°ÐµÐ¼ Ð¿ÐµÑ€ÑÐ¾Ð½Ð°Ð¶ÐµÐ¹ ÑÑ†ÐµÐ½Ñ‹
  // Normalize characters (array or record)
  const rawCharacters = currentScene?.characters
  const charactersArray = Array.isArray(rawCharacters)
    ? rawCharacters
    : rawCharacters
      ? Object.values(rawCharacters)
      : []
  const sceneCharacters = charactersArray.map((char) => ({
    id: char.id,
    name: char.name,
    position: char.position,
    sprite: char.sprite,
    emotion: (char as any).emotion || { primary: 'neutral', intensity: 50 },
  }))

  // ÐžÐ¿Ñ€ÐµÐ´ÐµÐ»ÑÐµÐ¼ Ñ‚ÐµÐºÑƒÑ‰ÐµÐ³Ð¾ Ð³Ð¾Ð²Ð¾Ñ€ÑÑ‰ÐµÐ³Ð¾ Ð¿ÐµÑ€ÑÐ¾Ð½Ð°Ð¶Ð°
  const currentDialogue = currentScene?.dialogue?.[Math.max(0, Math.min(lineIndex, (currentScene?.dialogue?.length ?? 1) - 1))]
  const talkingCharacterId = currentDialogue?.characterId

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ð¤Ð¾Ð½ ÑÑ†ÐµÐ½Ñ‹ */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: currentScene.background
            ? `url(${currentScene.background})`
            : 'linear-gradient(to bottom, #18181b, #27272a)',
        }}
      >
        {/* Ð—Ð°Ñ‚ÐµÐ¼Ð½ÐµÐ½Ð¸Ðµ Ñ„Ð¾Ð½Ð° */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* UI ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ñ‹ */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Ð’ÐµÑ€Ñ…Ð½ÑÑ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ñ ÑƒÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸ÐµÐ¼ */}
        <div className="flex items-center justify-between border-b border-zinc-700/50 bg-zinc-900/80 p-4 backdrop-blur-sm">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Меню</span>
          </button>

          <div className="text-sm text-zinc-400">
            Сцен посещено: {visitedScenes.length}
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-red-400 transition-colors hover:bg-red-900/20 hover:text-red-300"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Новая игра</span>
          </button>
        </div>

        {/* ÐžÐ±Ð»Ð°ÑÑ‚ÑŒ Ð¿ÐµÑ€ÑÐ¾Ð½Ð°Ð¶ÐµÐ¹ */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {sceneCharacters.length > 0 && (
              <CharacterGroup
                characters={sceneCharacters}
                activeCharacterId={talkingCharacterId}
                talkingCharacterId={talkingCharacterId}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Ð”Ð¸Ð°Ð»Ð¾Ð³Ð¾Ð²Ð¾Ðµ Ð¾ÐºÐ½Ð¾ */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {currentDialogue && (
              <DialogueBox
                node={currentDialogue}
                onNext={handleNext}
                autoPlaySpeed={50}
                skipTypewriter={false}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Ð’Ñ‹Ð±Ð¾Ñ€Ñ‹ */}
        {currentScene.choices && currentScene.choices.length > 0 && (
          <div className="fixed bottom-32 left-1/2 w-full max-w-2xl -translate-x-1/2 px-4">
            <AnimatePresence mode="wait">
              <ChoiceList
                choices={currentScene.choices}
                onChoose={handleChoice}
                playerSkills={{
                  logic: 4,
                  technophile: 3,
                  encyclopedia: 3,
                  perception: 4,
                  reflexes: 2,
                  intuition: 1,
                  authority: 1,
                  empathy: 1,
                  strength: 1,
                }}
              />
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}



