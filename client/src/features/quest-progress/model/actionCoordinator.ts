import { useQuest } from '@/entities/quest/model/useQuest'
import logger from '@/shared/lib/logger'
import { questsApi } from '@/shared/api/quests'

export function useDialogActionCoordinator() {
  const quest = useQuest()

  function handle(actionKey: string) {
    switch (actionKey) {
      // Delivery quest
      case 'start_delivery_quest':
        quest.startQuest('delivery_and_dilemma', 'need_pickup_from_trader')
        void questsApi.startQuest('delivery_and_dilemma', 'need_pickup_from_trader')
        break
      case 'take_parts':
        quest.advanceQuest('delivery_and_dilemma', 'deliver_parts_to_craftsman')
        void questsApi.advanceQuest('delivery_and_dilemma', 'deliver_parts_to_craftsman')
        break
      case 'deliver_parts':
        quest.advanceQuest('delivery_and_dilemma', 'artifact_offer')
        void questsApi.advanceQuest('delivery_and_dilemma', 'artifact_offer')
        break
      case 'accept_artifact_quest':
        quest.advanceQuest('delivery_and_dilemma', 'go_to_anomaly')
        void questsApi.advanceQuest('delivery_and_dilemma', 'go_to_anomaly')
        break
      case 'return_to_craftsman':
        quest.advanceQuest('delivery_and_dilemma', 'return_to_craftsman')
        void questsApi.advanceQuest('delivery_and_dilemma', 'return_to_craftsman')
        break
      case 'complete_delivery_quest':
      case 'complete_delivery_quest_with_artifact':
        quest.completeQuest('delivery_and_dilemma')
        void questsApi.completeQuest('delivery_and_dilemma')
        break

      // Loyalty quest
      case 'start_loyalty_quest_fjr':
      case 'go_to_hole':
        quest.startQuest('loyalty_fjr', 'go_to_hole')
        void questsApi.startQuest('loyalty_fjr', 'go_to_hole')
        logger.info('QUEST', 'loyalty_fjr → go_to_hole')
        break

      // Water quest
      case 'start_water_quest':
        quest.startQuest('water_crisis', 'need_to_talk_to_gunter')
        void questsApi.startQuest('water_crisis', 'need_to_talk_to_gunter')
        logger.info('QUEST', 'water_crisis → need_to_talk_to_gunter')
        break
      case 'gain_gunter_proof_digital':
        quest.advanceQuest('water_crisis', 'got_proof')
        void questsApi.advanceQuest('water_crisis', 'got_proof')
        logger.info('QUEST', 'water_crisis → got_proof')
        break
      case 'update_quest_travers_hunt':
        quest.advanceQuest('water_crisis', 'travers_hunt')
        void questsApi.advanceQuest('water_crisis', 'travers_hunt')
        logger.info('QUEST', 'water_crisis → travers_hunt')
        break
      case 'update_quest_leverage_hunt':
        quest.advanceQuest('water_crisis', 'leverage_hunt')
        void questsApi.advanceQuest('water_crisis', 'leverage_hunt')
        logger.info('QUEST', 'water_crisis → leverage_hunt')
        break
      case 'update_quest_to_synthesis_samples':
        quest.advanceQuest('water_crisis', 'synthesis_samples')
        void questsApi.advanceQuest('water_crisis', 'synthesis_samples')
        logger.info('QUEST', 'water_crisis → synthesis_samples')
        break
      case 'complete_water_quest_blackmail':
        quest.completeQuest('water_crisis')
        void questsApi.completeQuest('water_crisis')
        logger.info('QUEST', 'water_crisis → completed (blackmail)')
        break

      // Freedom spark quest
      case 'start_freedom_spark_quest':
        quest.startQuest('freedom_spark', 'talk_to_odin')
        void questsApi.startQuest('freedom_spark', 'talk_to_odin')
        logger.info('QUEST', 'freedom_spark → talk_to_odin')
        break
      case 'update_quest_find_rivet':
        quest.advanceQuest('freedom_spark', 'find_rivet')
        void questsApi.advanceQuest('freedom_spark', 'find_rivet')
        logger.info('QUEST', 'freedom_spark → find_rivet')
        break
      case 'fight_rivet_for_cells':
      case 'sabotage_device_for_carl':
        quest.advanceQuest('freedom_spark', 'order_final')
        void questsApi.advanceQuest('freedom_spark', 'order_final')
        logger.info('QUEST', 'freedom_spark → order_final')
        break
      case 'accept_rivet_mission_betray_carl':
        quest.advanceQuest('freedom_spark', 'anarchy_final')
        void questsApi.advanceQuest('freedom_spark', 'anarchy_final')
        logger.info('QUEST', 'freedom_spark → anarchy_final')
        break
      case 'return_to_odin_with_info':
        quest.advanceQuest('freedom_spark', 'friendship_final')
        void questsApi.advanceQuest('freedom_spark', 'friendship_final')
        logger.info('QUEST', 'freedom_spark → friendship_final')
        break
      case 'complete_quest_friendship':
      case 'complete_quest_order':
      case 'complete_quest_anarchy':
      case 'complete_quest_chaos':
      case 'complete_quest_chaos_haggled':
        quest.completeQuest('freedom_spark')
        void questsApi.completeQuest('freedom_spark')
        logger.info('QUEST', 'freedom_spark → completed')
        break
      default:
        break
    }
  }

  return { handle }
}


