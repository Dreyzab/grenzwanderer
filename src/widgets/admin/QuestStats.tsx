import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import './QuestStats.css';

interface QuestChoice {
  choiceId: string;
  choiceText: string;
  totalPicks: number;
  lastPickedAt: number;
}

interface QuestScene {
  sceneKey: string;
  sceneId?: any;
  title?: string;
  found: boolean;
  choices?: QuestChoice[];
}

interface DeliveryQuestStats {
  questId: string;
  scenes: QuestScene[];
  totalChoices: number;
  globalStats?: {
    totalPlayers: number;
    completedQuest: any[];
    helpedOrk: number;
    killedBoth: number;
    ignored: number;
  };
}

interface GeneralQuestStat {
  sceneId: string;
  choiceText?: string;
  totalPicks?: number;
  lastPickedAt?: number;
  choices?: any[];
  totalChoices?: number;
}

interface QuestStatsProps {
  questId?: string;
}

export const QuestStats: React.FC<QuestStatsProps> = ({ questId = 'delivery' }) => {
  const [showGlobalStats, setShowGlobalStats] = useState(true);
  
  // Если это квест доставки, используем специальный запрос с детальной статистикой
  const deliveryStats = useQuery(api.quests.deliveryQuest.getDeliveryQuestStats, {
    includeGlobalStats: showGlobalStats
  }) as DeliveryQuestStats | undefined;
  
  // Для других квестов используем общий запрос
  const generalStats = useQuery(api.quest.getQuestChoicesStats, { questId }) as GeneralQuestStat[] | undefined;
  
  // Загрузка
  if ((questId === 'delivery' && !deliveryStats) || (questId !== 'delivery' && !generalStats)) {
    return <div className="quest-stats-loading">Загрузка статистики квеста...</div>;
  }
  
  // Используем соответствующую статистику в зависимости от квеста
  const stats = questId === 'delivery' ? deliveryStats : generalStats;
  
  // Функция форматирования даты
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };
  
  return (
    <div className="quest-stats-container">
      <h2>Статистика квеста: {questId}</h2>
      
      {questId === 'delivery' && deliveryStats && (
        <>
          <div className="stats-header">
            <p>Всего выборов: <strong>{deliveryStats.totalChoices}</strong></p>
            
            <label className="toggle-stats">
              <input
                type="checkbox"
                checked={showGlobalStats}
                onChange={() => setShowGlobalStats(!showGlobalStats)}
              />
              Показать глобальную статистику
            </label>
          </div>
          
          {showGlobalStats && deliveryStats.globalStats && (
            <div className="global-stats">
              <h3>Глобальная статистика</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{deliveryStats.globalStats.totalPlayers}</div>
                  <div className="stat-label">Всего игроков</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{deliveryStats.globalStats.completedQuest.length}</div>
                  <div className="stat-label">Завершили квест</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{deliveryStats.globalStats.helpedOrk}</div>
                  <div className="stat-label">Помогли орку</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{deliveryStats.globalStats.killedBoth}</div>
                  <div className="stat-label">Убили орка и волка</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{deliveryStats.globalStats.ignored}</div>
                  <div className="stat-label">Игнорировали встречу</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="scenes-list">
            <h3>Статистика по сценам</h3>
            
            {deliveryStats.scenes.map((scene) => (
              <div key={scene.sceneKey} className="scene-card">
                <h4>{scene.title || scene.sceneKey}</h4>
                <p className="scene-meta">Scene Key: {scene.sceneKey}</p>
                
                <div className="choices-list">
                  {scene.choices && scene.choices.length > 0 ? (
                    scene.choices.map((choice) => (
                      <div key={choice.choiceId} className="choice-item">
                        <div className="choice-text">{choice.choiceText}</div>
                        <div className="choice-stats">
                          <span className="choice-picks">
                            {choice.totalPicks} {choice.totalPicks === 1 ? 'выбор' : 'выбора'}
                          </span>
                          <span className="choice-date">
                            Последний: {formatDate(choice.lastPickedAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-choices">Ещё нет данных о выборах для этой сцены</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {questId !== 'delivery' && generalStats && (
        <div className="general-stats">
          <div className="stats-list">
            {Array.isArray(generalStats) ? (
              generalStats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <h4>{stat.sceneId}</h4>
                  {stat.choiceText && <p>Выбор: {stat.choiceText}</p>}
                  {stat.totalPicks && <p>Количество: {stat.totalPicks}</p>}
                  {stat.lastPickedAt && <p>Последний: {formatDate(stat.lastPickedAt)}</p>}
                  {stat.choices && (
                    <div className="choice-list">
                      <h5>Выборы:</h5>
                      <ul>
                        {stat.choices.map((choice, i) => (
                          <li key={i}>{choice.text || choice.choiceText}: {choice.picks || choice.totalPicks}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>Нет данных</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 