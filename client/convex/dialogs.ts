import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { applyOutcomeImpl } from './quests'
import { PLAYER_STATUS } from './constants'

type OutcomeEffect = {
  fameDelta?: number
  reputationsDelta?: Record<string, number>
  relationshipsDelta?: Record<string, number>
  addFlags?: string[]
  removeFlags?: string[]
  addWorldFlags?: string[]
  removeWorldFlags?: string[]
  setPhase?: number
  setStatus?: string
  quest?: { action: 'start' | 'advance' | 'complete'; id: string; step?: string }
}

// Простейший реестр исходов; оставлен как фолбэк по умолчанию
const dialogOutcomeRegistry: Record<string, OutcomeEffect> = {
  // Citizenship gateway
  citizenship_granted: { setPhase: 2, setStatus: PLAYER_STATUS.CITIZEN, fameDelta: 50, addFlags: ['citizenship_granted'] },

  // Combat baptism
  accept_combat_baptism_quest: { reputationsDelta: { fjr: 2 }, addFlags: ['combat_baptism_accepted'], quest: { action: 'start', id: 'combat_baptism', step: 'combat_available_on_board' } },
  complete_combat_baptism_quest: { fameDelta: 5, reputationsDelta: { fjr: 10 }, addFlags: ['combat_baptism_completed'], quest: { action: 'complete', id: 'combat_baptism' } },

  // Bell for Lost
  accept_bell_quest: { addFlags: ['bell_quest_accepted'], fameDelta: 1, quest: { action: 'start', id: 'bell_for_lost', step: 'bell_intro' } },
  complete_bell_quest_perfect: { fameDelta: 5, relationshipsDelta: { cathedral_priest: 10 }, addFlags: ['bell_restored'], quest: { action: 'complete', id: 'bell_for_lost' } },
  complete_bell_quest_damaged: { fameDelta: 2, relationshipsDelta: { cathedral_priest: 3 }, addFlags: ['bell_restored_damaged'], quest: { action: 'complete', id: 'bell_for_lost' } },
  complete_bell_quest_violent: { fameDelta: -5, addFlags: ['bell_restored_violent'], quest: { action: 'complete', id: 'bell_for_lost' } },

  // Quiet Cove
  accept_quiet_cove_quest: { addFlags: ['quiet_cove_accepted'], quest: { action: 'start', id: 'quiet_cove_whisper', step: 'courier_missing' } },
  complete_quiet_cove_quest_traders: { reputationsDelta: { traders: 10, anarchists: -5 }, addFlags: ['quiet_cove_traders'], quest: { action: 'complete', id: 'quiet_cove_whisper' } },
  complete_quiet_cove_quest_anarchists: { reputationsDelta: { anarchists: 10, traders: -5 }, addFlags: ['quiet_cove_anarchists'], quest: { action: 'complete', id: 'quiet_cove_whisper' } },

  // Field Medicine
  accept_field_medicine_quest: { addFlags: ['field_medicine_accepted'], quest: { action: 'start', id: 'field_medicine', step: 'need_medicine' } },
  complete_field_medicine_quest: { fameDelta: 3, reputationsDelta: { synthesis: 8 }, addFlags: ['field_medicine_completed'], quest: { action: 'complete', id: 'field_medicine' } },

  // Water Crisis
  accept_water_quest: { addFlags: ['water_quest_accepted'], quest: { action: 'start', id: 'water_crisis', step: 'need_to_talk_to_gunter' } },
  gunter_proof_gained: { addFlags: ['water_proof_collected'], quest: { action: 'advance', id: 'water_crisis', step: 'got_proof' } },
  water_quest_outcome_blackmail: { reputationsDelta: { traders: 10, synthesis: -10 }, addFlags: ['water_blackmail'], quest: { action: 'complete', id: 'water_crisis' } },
  water_quest_update_travers: { addFlags: ['water_update_travers'] },
  water_quest_update_leverage: { addFlags: ['water_update_leverage'] },
  water_quest_update_synthesis: { addFlags: ['water_update_synthesis'] },

  // Delivery quest
  accept_delivery_quest: { addFlags: ['accept_delivery_quest'], quest: { action: 'start', id: 'delivery_and_dilemma', step: 'need_pickup_from_trader' } },
  decline_delivery_quest: { addFlags: ['decline_delivery_quest'] },
  parts_collected: { addFlags: ['delivery_parts_collected'], quest: { action: 'advance', id: 'delivery_and_dilemma', step: 'deliver_parts_to_craftsman' } },
  deliver_parts_to_craftsman: { addFlags: ['delivery_delivered_to_craftsman'], quest: { action: 'advance', id: 'delivery_and_dilemma', step: 'artifact_offer' } },
  accept_artifact_quest: { addFlags: ['delivery_artifact_branch'], quest: { action: 'advance', id: 'delivery_and_dilemma', step: 'go_to_anomaly' } },
  decline_artifact_quest: { addFlags: ['delivery_declined_artifact'], quest: { action: 'advance', id: 'delivery_and_dilemma', step: 'return_to_craftsman' } },
  complete_delivery_quest: { addFlags: ['delivery_completed'], quest: { action: 'complete', id: 'delivery_and_dilemma' } },
  complete_delivery_quest_with_artifact: { addFlags: ['delivery_completed_with_artifact'], quest: { action: 'complete', id: 'delivery_and_dilemma' } },

  // Freedom Spark outcomes
  quest_outcome_friendship: { reputationsDelta: { anarchists: 8 }, addFlags: ['freedom_friendship'] },
  quest_outcome_order: { reputationsDelta: { carl_artisan: 10 }, addFlags: ['freedom_order'] },
  quest_outcome_anarchy: { reputationsDelta: { anarchists: 12, fjr: -8 }, addFlags: ['freedom_anarchy'] },
  quest_outcome_chaos: { fameDelta: -5, reputationsDelta: { anarchists: -5, traders: -5 }, addFlags: ['freedom_chaos'] },

  // Loyalty FJR (subset)
  accept_fjr_quest: { reputationsDelta: { fjr: 5 }, addFlags: ['loyalty_fjr_accepted'], quest: { action: 'start', id: 'loyalty', step: 'go_to_hole' } },
  go_to_hole: { addFlags: ['loyalty_go_to_hole'] },
  complete_loyalty_quest_fjr: { reputationsDelta: { fjr: 15, anarchists: -10 }, addFlags: ['loyalty_completed_fjr'], quest: { action: 'complete', id: 'loyalty' } },
  complete_loyalty_quest_anarchist: { reputationsDelta: { anarchists: 15, fjr: -10 }, addFlags: ['loyalty_completed_anarchists'], quest: { action: 'complete', id: 'loyalty' } },
  complete_loyalty_quest_double_cross: { reputationsDelta: { fjr: -5, anarchists: -5 }, addFlags: ['loyalty_completed_double'], quest: { action: 'complete', id: 'loyalty' } },
  accept_double_cross: { addFlags: ['loyalty_accept_double_cross'] },
  accept_anarchist_side: { addFlags: ['loyalty_accept_anarchist_side'] },
  fight_scar_for_map: { addFlags: ['loyalty_fight_scar'] },
  fail_loyalty_quest_no_map: { addFlags: ['loyalty_failed_no_map'] },
  return_to_fjr_with_fake_map: { addFlags: ['loyalty_return_with_fake_map'] },
  return_to_one_anarchist_side: { addFlags: ['loyalty_return_to_odin'] },
  return_to_fjr_with_map: { addFlags: ['loyalty_return_with_map'] },

  // Eyes in the dark
  accept_eyes_in_the_dark_quest: { addFlags: ['eyes_quest_accepted'], quest: { action: 'start', id: 'eyes_in_the_dark', step: 'find_evidence' } },
  complete_eyes_in_the_dark_quest: { reputationsDelta: { synthesis: 8, fjr: 5 }, addFlags: ['eyes_quest_completed'], quest: { action: 'complete', id: 'eyes_in_the_dark' } },

  // Void shards
  accept_void_shards_quest: { addFlags: ['void_shards_accepted'], quest: { action: 'start', id: 'void_shards', step: 'collect_info' } },
  void_shards_personal_gain: { fameDelta: -3, reputationsDelta: { traders: 8 }, addFlags: ['void_shards_personal_gain'], quest: { action: 'complete', id: 'void_shards' } },
  void_shards_failed: { addFlags: ['void_shards_failed'], quest: { action: 'complete', id: 'void_shards' } },
  void_shards_info_only: { addFlags: ['void_shards_info_only'] },
  void_shards_success: { fameDelta: 5, reputationsDelta: { carl_artisan: 10, anarchists: 5 }, addFlags: ['void_shards_success'], quest: { action: 'complete', id: 'void_shards' } },
  void_shards_bonus: { fameDelta: 2, addFlags: ['void_shards_bonus'] },
}

export const applyDialogOutcome = mutation({
  args: {
    deviceId: v.string(),
    outcomeKey: v.string(),
    payload: v.optional(v.object({ amount: v.optional(v.number()) })),
  },
  handler: async (ctx, { deviceId, outcomeKey, payload: _payload }) => {
    // Пытаемся загрузить из БД; если нет — фолбэк к локальному реестру
    const row = await ctx.db.query('dialog_outcomes').withIndex('by_key', (q: any) => q.eq('outcomeKey', outcomeKey)).unique()
    const effect = (row as any as OutcomeEffect) ?? dialogOutcomeRegistry[outcomeKey]
    if (!effect) return { ok: false, reason: 'unknown_outcome' as const }

    // Применяем эффекты к игроку/миру через общую реализацию
    await applyOutcomeImpl(ctx, {
      deviceId,
      fameDelta: effect.fameDelta,
      reputationsDelta: effect.reputationsDelta,
      relationshipsDelta: effect.relationshipsDelta,
      addFlags: effect.addFlags,
      removeFlags: effect.removeFlags,
      addWorldFlags: effect.addWorldFlags,
      removeWorldFlags: effect.removeWorldFlags,
      setPhase: effect.setPhase,
      setStatus: effect.setStatus,
    } as any)

    // Квестовый прогресс (опционально)
    if (effect.quest) {
      const { action, id, step } = effect.quest
      if (action === 'start') {
        await ctx.db.insert('quest_progress', {
          userId: undefined,
          deviceId,
          questId: id,
          currentStep: step ?? 'started',
          startedAt: Date.now(),
          updatedAt: Date.now(),
          completedAt: undefined,
        })
      } else {
        const row = await ctx.db.query('quest_progress').withIndex('by_device_quest', (q: any) => q.eq('deviceId', deviceId).eq('questId', id)).unique()
        if (row) {
          if (action === 'advance' && step) await ctx.db.patch(row._id, { currentStep: step, updatedAt: Date.now() })
          if (action === 'complete') await ctx.db.patch(row._id, { currentStep: 'completed', completedAt: Date.now(), updatedAt: Date.now() })
        }
      }
    }

    return { ok: true }
  },
})

// Резолвер действий диалога по ключу (для клиента)
export const resolveAction = mutation({
  args: { actionKey: v.string() },
  handler: async (ctx, { actionKey }) => {
    const row = await ctx.db.query('dialog_actions').withIndex('by_key', (q: any) => q.eq('actionKey', actionKey)).unique()
    return row ?? null
  },
})


