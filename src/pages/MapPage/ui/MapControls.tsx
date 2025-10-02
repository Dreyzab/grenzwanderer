import { Plus, Minus, Locate, Layers, Maximize2 } from 'lucide-react'

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onLocateUser: () => void
  onToggleLayer?: () => void
  onFullscreen?: () => void
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocateUser,
  onToggleLayer,
  onFullscreen,
}: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      {/* Zoom controls */}
      <div className="flex flex-col bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-lg overflow-hidden">
        <button
          onClick={onZoomIn}
          className="p-3 hover:bg-zinc-800 transition-colors border-b border-zinc-700"
          aria-label="Увеличить"
        >
          <Plus className="w-5 h-5 text-zinc-300" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-3 hover:bg-zinc-800 transition-colors"
          aria-label="Уменьшить"
        >
          <Minus className="w-5 h-5 text-zinc-300" />
        </button>
      </div>

      {/* Location control */}
      <button
        onClick={onLocateUser}
        className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-lg"
        aria-label="Моя геолокация"
      >
        <Locate className="w-5 h-5 text-white" />
      </button>

      {/* Layer toggle */}
      {onToggleLayer && (
        <button
          onClick={onToggleLayer}
          className="p-3 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Переключить слой"
        >
          <Layers className="w-5 h-5 text-zinc-300" />
        </button>
      )}

      {/* Fullscreen toggle */}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="p-3 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Полный экран"
        >
          <Maximize2 className="w-5 h-5 text-zinc-300" />
        </button>
      )}
    </div>
  )
}
