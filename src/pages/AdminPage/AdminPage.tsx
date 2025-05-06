import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../entities/user/model';
import { QuestStats } from '../../components/Admin/QuestStats';
import './AdminPage.css';

// Список квестов
const QUESTS = [
  { id: 'delivery', name: 'Доставка и дилемма' },
  { id: 'main', name: 'Основной квест' },
  // Добавьте другие квесты по мере создания
];

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUnit($currentUser);
  const [selectedQuest, setSelectedQuest] = useState('delivery');
  
  // Проверка на администратора
  React.useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);
  
  if (!user || !user.isAdmin) {
    return (
      <div className="admin-loading">
        <p>Доступ ограничен. Перенаправление...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Панель администратора</h1>
        <div className="admin-controls">
          <button className="back-button" onClick={() => navigate('/')}>
            Вернуться на главную
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-sidebar">
          <h3>Квесты</h3>
          <div className="quest-list">
            {QUESTS.map(quest => (
              <button 
                key={quest.id}
                className={`quest-button ${selectedQuest === quest.id ? 'active' : ''}`}
                onClick={() => setSelectedQuest(quest.id)}
              >
                {quest.name}
              </button>
            ))}
          </div>
          
          <div className="admin-actions">
            <h3>Действия</h3>
            <button className="action-button">
              Экспорт статистики
            </button>
            <button className="action-button">
              Сбросить все квесты
            </button>
          </div>
        </div>
        
        <div className="admin-main">
          <QuestStats questId={selectedQuest} />
        </div>
      </div>
    </div>
  );
}; 