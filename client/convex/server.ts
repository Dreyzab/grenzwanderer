import { httpRouter } from 'convex/server'
import { Webhook } from 'svix'
import { internal } from './_generated/api'

const router: any = httpRouter()

// Пример приёма вебхуков Clerk (опционально)
router.route({
  path: '/clerk-users-webhook',
  method: 'POST',
  handler: async (ctx: any, req: Request) => {
    const payloadString = await req.text()
    const headers = req.headers
    const svix_id = headers.get('svix-id') as string
    const svix_timestamp = headers.get('svix-timestamp') as string
    const svix_signature = headers.get('svix-signature') as string
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Missing svix headers', { status: 400 })
    }
    const secret = (globalThis as any)?.process?.env?.CLERK_WEBHOOK_SECRET as string | undefined
    if (!secret) return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 })
    const wh = new Webhook(secret)
    let event: any
    try {
      event = wh.verify(payloadString, { svix_id, svix_timestamp, svix_signature })
    } catch {
      return new Response('Invalid signature', { status: 400 })
    }
    const type = event?.type as string
    if (type === 'user.created' || type === 'user.updated') {
      await (ctx as any).runMutation(internal.auth.upsertFromClerk, { data: event.data })
    }
    return new Response('', { status: 200 })
  },
})

export default router


