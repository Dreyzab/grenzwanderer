import { questsApiConvex } from './convex'
import { qrApiConvex } from '@/shared/api/qr/convex'

export type QuestsApi = typeof questsApiConvex

export const questsApi: QuestsApi = questsApiConvex

export const qrApi = qrApiConvex


