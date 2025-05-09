import { QuestState, QuestAction } from '../../shared/types/quest.types';
import { GameQuestState, GameQuestAction, AllQuestStates, AllQuestActions } from './model';

/**
 * Представляет действие в квесте
 */
export interface QuestActionData {
    /** Тип действия */
    type: AllQuestActions;
    /** Идентификатор шага квеста */
    stepId?: string;
}

/**
 * Представляет переход в машине состояний квеста
 */
export interface QuestTransition {
    /** Текущее состояние квеста */
    currentState: AllQuestStates;
    /** Следующее состояние квеста */
    nextState: AllQuestStates;
    /** Действие, вызвавшее переход */
    action: AllQuestActions;
} 