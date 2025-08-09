import type { MapPoint, MapBounds } from '../model/types'

const STORAGE_KEY = 'game-map-points'

export const mapPointApi = {
  async getPoints(): Promise<MapPoint[]> {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as MapPoint[]) : []
  },

  async getPointsInBounds(bounds: MapBounds): Promise<MapPoint[]> {
    const points = await this.getPoints()
    return points.filter((point) =>
      point.coordinates.lat >= bounds.minLat &&
      point.coordinates.lat <= bounds.maxLat &&
      point.coordinates.lng >= bounds.minLng &&
      point.coordinates.lng <= bounds.maxLng &&
      point.isActive,
    )
  },

  async savePoints(points: MapPoint[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points))
  },
}


