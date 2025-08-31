type CommitPayload = {
  questOps: Array<{ op: 'start' | 'advance' | 'complete'; questId: string; step?: string }>
  playerVersion?: number
  progressVersion?: number
  opSeq?: number
  rewardHint?: string
  outcome?: {
    reputationsDelta?: Record<string, number>
    relationshipsDelta?: Record<string, number>
    addFlags?: string[]
    removeFlags?: string[]
    addWorldFlags?: string[]
    removeWorldFlags?: string[]
    setPhase?: number
    setStatus?: string
  }
}

const OUTBOX_KEY = 'commitScene-outbox'
const OPSEQ_KEY = 'commitScene-opseq'

export function nextOpSeq(): number {
  try {
    const raw = localStorage.getItem(OPSEQ_KEY)
    const n = raw ? Number(raw) : 0
    const next = Number.isFinite(n) ? n + 1 : 1
    localStorage.setItem(OPSEQ_KEY, String(next))
    return next
  } catch {
    return Date.now()
  }
}

export function enqueueCommit(payload: CommitPayload) {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    const arr: CommitPayload[] = raw ? JSON.parse(raw) : []
    arr.push(payload)
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(arr))
  } catch {}
}

export function takeAllCommits(): CommitPayload[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    const arr: CommitPayload[] = raw ? JSON.parse(raw) : []
    localStorage.removeItem(OUTBOX_KEY)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

