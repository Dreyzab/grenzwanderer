import { useState } from 'react'
import { SignUpButton } from '@clerk/clerk-react'
import logger from '@/shared/lib/logger'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function RegistrationPrompt({ isOpen, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-xl">
        <div className="text-lg font-semibold mb-2">Завершено: Доставка и дилемма</div>
        <div className="text-sm text-neutral-300 mb-4">
          Чтобы открыть Фазу 1 и получать постоянный прогресс на всех устройствах, зарегистрируйтесь.
          После регистрации мы перенесём ваш гостевой прогресс в аккаунт.
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SignUpButton mode="modal" forceRedirectUrl="/map?createCharacter=1">
            <button
              disabled={busy}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 rounded px-4 py-2"
              onClick={() => { setBusy(true); logger.info('MAP', 'prompt: click sign-up') }}
            >
              Зарегистрироваться
            </button>
          </SignUpButton>
          <button
            className="bg-neutral-800 hover:bg-neutral-700 rounded px-4 py-2"
            onClick={() => {
              try { localStorage.setItem('registration_prompt_dismissed', '1') } catch (_e) {}
              logger.info('MAP', 'prompt: later clicked')
              onClose()
            }}
          >
            Позже
          </button>
        </div>
      </div>
    </div>
  )
}


