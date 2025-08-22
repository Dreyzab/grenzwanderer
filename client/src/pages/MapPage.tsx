import MapWidget from '@/widgets/MapWidget/MapWidget'
import { MapContainer } from '@/widgets/MapWidget/model/MapContext'
import { MapOverlaysProvider } from '@/widgets/MapWidget/ui/MapOverlays'

export function Component() {
  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Карта</h2>
      <MapOverlaysProvider>
        <MapContainer className="mapbox-container w-full h-[70vh] rounded-lg overflow-hidden">
          <MapWidget />
        </MapContainer>
      </MapOverlaysProvider>
    </div>
  )
}

export default Component


