import { api } from '@/../convex/_generated/api'
import convexClient from '@/shared/lib/convexClient/convexClient'

export const questsApi = {
  async bootstrapNewPlayer(): Promise<void> {
    await convexClient.mutation(api.player.bootstrap, {})
  }
}

export default questsApi

