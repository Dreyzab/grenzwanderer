import React, { useState } from 'react';

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface SocialHubProps {
  friends?: Friend[];
  activeChats?: Array<{
    chatId: string;
    name: string;
    unreadCount: number;
    lastMessage?: string;
  }>;
  selectedChatMessages?: ChatMessage[];
  onSendMessage?: (chatId: string, message: string) => void;
  onStartChat?: (friendId: string) => void;
  onAddFriend?: (username: string) => void;
}

/**
 * Виджет социального взаимодействия - чаты, друзья, гильдии
 */
export const SocialHub: React.FC<SocialHubProps> = ({
  friends = [],
  activeChats = [],
  selectedChatMessages = [],
  onSendMessage,
  onStartChat,
  onAddFriend
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'guild'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  
  const handleSendMessage = () => {
    if (selectedChatId && newMessage.trim() && onSendMessage) {
      onSendMessage(selectedChatId, newMessage.trim());
      setNewMessage('');
    }
  };
  
  const handleAddFriend = () => {
    if (friendUsername.trim() && onAddFriend) {
      onAddFriend(friendUsername.trim());
      setFriendUsername('');
    }
  };
  
  return (
    <div className="social-hub-container">
      <div className="social-hub-tabs">
        <button 
          className={`tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          Чаты
        </button>
        <button 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Друзья
        </button>
        <button 
          className={`tab ${activeTab === 'guild' ? 'active' : ''}`}
          onClick={() => setActiveTab('guild')}
        >
          Гильдия
        </button>
      </div>
      
      <div className="social-hub-content">
        {activeTab === 'chats' && (
          <div className="chats-container">
            <div className="chats-list">
              {activeChats.map(chat => (
                <div 
                  key={chat.chatId}
                  className={`chat-item ${selectedChatId === chat.chatId ? 'selected' : ''} ${chat.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => setSelectedChatId(chat.chatId)}
                >
                  <div className="chat-name">{chat.name}</div>
                  {chat.lastMessage && <div className="chat-preview">{chat.lastMessage}</div>}
                  {chat.unreadCount > 0 && (
                    <div className="unread-badge">{chat.unreadCount}</div>
                  )}
                </div>
              ))}
              {activeChats.length === 0 && (
                <div className="empty-state">
                  <p>У вас пока нет активных чатов</p>
                </div>
              )}
            </div>
            
            {selectedChatId && (
              <div className="chat-window">
                <div className="messages-container">
                  {selectedChatMessages.map(message => (
                    <div 
                      key={message.id}
                      className={`message ${message.senderId === 'currentUser' ? 'outgoing' : 'incoming'}`}
                    >
                      <div className="message-sender">{message.senderName}</div>
                      <div className="message-content">{message.content}</div>
                      <div className="message-timestamp">{message.timestamp}</div>
                    </div>
                  ))}
                </div>
                
                <div className="message-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                  />
                  <button onClick={handleSendMessage}>Отправить</button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'friends' && (
          <div className="friends-container">
            <div className="add-friend">
              <input
                type="text"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                placeholder="Введите имя пользователя"
              />
              <button onClick={handleAddFriend}>Добавить друга</button>
            </div>
            
            <div className="friends-list">
              {friends.map(friend => (
                <div 
                  key={friend.id}
                  className={`friend-item ${friend.status}`}
                >
                  <div className="friend-avatar">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.username} />
                    ) : (
                      <div className="avatar-placeholder">{friend.username.charAt(0)}</div>
                    )}
                    <div className={`status-indicator ${friend.status}`} />
                  </div>
                  
                  <div className="friend-info">
                    <div className="friend-username">{friend.username}</div>
                    <div className="friend-status">
                      {friend.status === 'online' && 'Онлайн'}
                      {friend.status === 'offline' && `Офлайн${friend.lastSeen ? ` · ${friend.lastSeen}` : ''}`}
                      {friend.status === 'away' && 'Отошел'}
                      {friend.status === 'busy' && 'Занят'}
                    </div>
                  </div>
                  
                  <button 
                    className="start-chat-button"
                    onClick={() => onStartChat && onStartChat(friend.id)}
                  >
                    Написать
                  </button>
                </div>
              ))}
              
              {friends.length === 0 && (
                <div className="empty-state">
                  <p>У вас пока нет друзей в игре</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'guild' && (
          <div className="guild-placeholder">
            <p>Функционал гильдий находится в разработке</p>
          </div>
        )}
      </div>
    </div>
  );
}; 