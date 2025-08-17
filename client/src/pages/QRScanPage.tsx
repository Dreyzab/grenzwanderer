import { useEffect, useRef, useState } from 'react'
import { qrApi } from '@/shared/api/quests'
import { useNavigate } from 'react-router-dom'

export function Component() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Лёгкая версия: читаем ?qr= из строки, чтобы не тянуть сканер в бандл. Сама страница — точка расширения для zxing.
    const params = new URLSearchParams(window.location.search)
    const code = params.get('qr')
    if (!code) return
    ;(async () => {
      try {
        const res = await qrApi.resolvePoint(code)
        if (res.status !== 'ok') {
          setError('QR не распознан или точка недоступна')
          return
        }
        if (!res.hasPda) {
          navigate('/novel')
          return
        }
        const url = new URL('/map', window.location.origin)
        if (res.point.dialogKey) url.searchParams.set('dialog', res.point.dialogKey)
        if (res.point.eventKey) url.searchParams.set('event', res.point.eventKey)
        navigate(url.pathname + url.search)
      } catch {
        setError('Ошибка обработки QR')
      }
    })()
  }, [navigate])

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <h2 className="text-2xl font-semibold">Сканер QR (dev)</h2>
      <div className="text-sm text-neutral-400">Передайте ?qr=QR::pointKey в адресной строке, чтобы эмулировать скан.</div>
      {error && <div className="text-sm text-red-400">{error}</div>}
      <video ref={videoRef} className="w-full rounded border border-neutral-800" autoPlay playsInline muted />
    </div>
  )
}

export default Component


