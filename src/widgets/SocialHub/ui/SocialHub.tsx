import { FC, useState } from 'react';
import styles from './SocialHub.module.css';

type TabType = 'chat' | 'friends' | 'guild';

export const SocialHub: FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  return (
    <div className={styles.socialHub}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Чат
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'friends' ? styles.active : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Друзья
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'guild' ? styles.active : ''}`}
          onClick={() => setActiveTab('guild')}
        >
          Гильдия
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'chat' && (
          <div className={styles.chatWindow}>
            <div className={styles.chatChannels}>
              <div className={styles.channelItem}>Общий</div>
              <div className={styles.channelItem}>Торговля</div>
              <div className={styles.channelItem}>Поиск группы</div>
              <div className={styles.channelItem}>Помощь</div>
            </div>
            <div className={styles.chatMessages}>
              <div className={styles.messageList}>
                {/* Здесь будут сообщения */}
                <p className={styles.emptyState}>В этом канале пока нет сообщений</p>
              </div>
              <div className={styles.messageInput}>
                <input type="text" placeholder="Введите сообщение..." />
                <button>Отправить</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className={styles.friendsList}>
            <div className={styles.friendsHeader}>
              <h3>Список друзей</h3>
              <button className={styles.addFriendBtn}>+ Добавить друга</button>
            </div>
            <div className={styles.friendsContent}>
              <p className={styles.emptyState}>Ваш список друзей пуст</p>
            </div>
          </div>
        )}

        {activeTab === 'guild' && (
          <div className={styles.guildPanel}>
            <div className={styles.guildHeader}>
              <h3>Гильдия</h3>
            </div>
            <div className={styles.guildContent}>
              <p className={styles.emptyState}>Вы не состоите в гильдии</p>
              <button className={styles.createGuildBtn}>Создать гильдию</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 