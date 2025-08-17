import { api } from '../../../../convex/_generated/api'
import { convexClient } from '@/shared/lib/convexClient'

export const seedsApiConvex = {
  seedQuestDependenciesDev: async (devToken: string) => {
    return convexClient.mutation((api as any).seed.seedQuestDependenciesDev, { devToken })
  },
  seedMappointBindingsDev: async (devToken: string) => {
    return convexClient.mutation((api as any).seed.seedMappointBindingsDev, { devToken })
  },
  seedQrCodesDev: async (devToken: string) => {
    return convexClient.mutation((api as any).seed.seedQrCodesDev, { devToken })
  },
  seedAllDev: async (devToken: string) => {
    await seedsApiConvex.seedQuestDependenciesDev(devToken)
    await seedsApiConvex.seedMappointBindingsDev(devToken)
    await seedsApiConvex.seedQrCodesDev(devToken)
    return { ok: true }
  },
}


