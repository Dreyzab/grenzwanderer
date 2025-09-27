import { OfflineManager } from '../../features/offline-management/ui/OfflineManager'
import { AnimatedCard } from '../../shared/ui/components/AnimatedCard'

export function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Оффлайн режим</h1>
          <p className="text-zinc-400">
            Управление кешем и оффлайн функциональностью
          </p>
        </div>

        {/* Content */}
        <AnimatedCard className="p-6">
          <OfflineManager />
        </AnimatedCard>
      </div>
    </div>
  )
}
