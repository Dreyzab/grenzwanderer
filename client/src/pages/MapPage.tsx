import MapWidget from '@/widgets/MapWidget/MapWidget'

export function Component() {
  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Карта</h2>
      <MapWidget />
    </div>
  )
}

export default Component


