import { useState } from 'react'

type Props = {
  isOpen: boolean
  onSubmit: (nickname: string, avatarKey?: string) => Promise<void> | void
  onClose: () => void
}

const avatars = [
  { key: 'trader', src: '/images/npcs/trader.jpg', title: 'Торговец' },
  { key: 'ork', src: '/images/npcs/ork.jpg', title: 'Боец' },
  { key: 'craftsman', src: '/images/npcs/craftsman.jpg', title: 'Мастер' },
]

export default function CreateCharacterModal({ isOpen, onSubmit, onClose }: Props) {
  const [nickname, setNickname] = useState('')
  const [avatarKey, setAvatarKey] = useState<string | undefined>(avatars[0]?.key)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      setError('Введите никнейм')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit(nickname.trim(), avatarKey)
    } catch (e) {
      setError('Не удалось создать персонажа, попробуйте позже')
      setBusy(false)
      return
    }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-xl space-y-4">
        <div className="text-lg font-semibold">Создание персонажа</div>
        <div className="text-sm text-neutral-300">Выберите иконку и укажите никнейм.</div>
        <div className="grid grid-cols-3 gap-3">
          {avatars.map((a) => (
            <button
              key={a.key}
              className={`relative rounded overflow-hidden border ${avatarKey === a.key ? 'border-emerald-500' : 'border-neutral-800'} focus:outline-none`}
              onClick={() => setAvatarKey(a.key)}
            >
              <img src={a.src} alt={a.title} className="w-full h-20 object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/50 text-xs text-center py-1">{a.title}</div>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Никнейм</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Введите ник"
            className="w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:border-emerald-600"
          />
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div className="flex items-center gap-2 justify-end">
          <button className="bg-neutral-800 hover:bg-neutral-700 rounded px-4 py-2" onClick={onClose} disabled={busy}>Отмена</button>
          <button
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 rounded px-4 py-2"
            disabled={busy}
            onClick={handleSubmit}
          >Создать</button>
        </div>
      </div>
    </div>
  )
}


