import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/shared/ui';
import styles from './SettingsPage.module.css';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояние для настроек звука
  const [volumeSettings, setVolumeSettings] = useState({
    master: 80,
    music: 70,
    effects: 90,
    voice: 100
  });
  
  // Состояние для настроек языка
  const [language, setLanguage] = useState('ru');
  
  // Обработчики изменений настроек
  const handleVolumeChange = (type: keyof typeof volumeSettings, value: number) => {
    setVolumeSettings(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value);
  };
  
  // Функция для выхода из аккаунта
  const handleLogout = () => {
    // Здесь будет логика выхода из аккаунта
    localStorage.removeItem('userId');
    navigate('/login');
  };
  
  return (
    <PageLayout>
      <div className={styles.settingsPage}>
        <h1 className={styles.pageTitle}>Настройки</h1>
        
        <div className={styles.settingsContent}>
          <div className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Настройки звука</h2>
            <div className={styles.settingGroup}>
              <label htmlFor="masterVolume" className={styles.settingLabel}>
                Общая громкость: {volumeSettings.master}%
              </label>
              <input
                id="masterVolume"
                type="range"
                min="0"
                max="100"
                value={volumeSettings.master}
                onChange={(e) => handleVolumeChange('master', parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.settingGroup}>
              <label htmlFor="musicVolume" className={styles.settingLabel}>
                Музыка: {volumeSettings.music}%
              </label>
              <input
                id="musicVolume"
                type="range"
                min="0"
                max="100"
                value={volumeSettings.music}
                onChange={(e) => handleVolumeChange('music', parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.settingGroup}>
              <label htmlFor="effectsVolume" className={styles.settingLabel}>
                Звуковые эффекты: {volumeSettings.effects}%
              </label>
              <input
                id="effectsVolume"
                type="range"
                min="0"
                max="100"
                value={volumeSettings.effects}
                onChange={(e) => handleVolumeChange('effects', parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.settingGroup}>
              <label htmlFor="voiceVolume" className={styles.settingLabel}>
                Голоса: {volumeSettings.voice}%
              </label>
              <input
                id="voiceVolume"
                type="range"
                min="0"
                max="100"
                value={volumeSettings.voice}
                onChange={(e) => handleVolumeChange('voice', parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel} htmlFor="muteSound">
                Выключить все звуки
              </label>
              <div className={styles.checkboxWrapper}>
                <input 
                  type="checkbox" 
                  id="muteSound" 
                  className={styles.checkbox}
                />
              </div>
            </div>
          </div>
          
          <div className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Настройки языка</h2>
            <div className={styles.settingGroup}>
              <label htmlFor="language" className={styles.settingLabel}>
                Язык интерфейса
              </label>
              <select
                id="language"
                value={language}
                onChange={handleLanguageChange}
                className={styles.select}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
          
          <div className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Аккаунт</h2>
            <div className={styles.settingGroup}>
              <a href="/profile" className={styles.accountLink}>
                Изменить данные профиля
              </a>
            </div>
            <div className={styles.settingGroup}>
              <button 
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
          
          <div className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Помощь и поддержка</h2>
            <div className={styles.helpLinks}>
              <a href="/faq" className={styles.helpLink}>Часто задаваемые вопросы</a>
              <a href="/support" className={styles.helpLink}>Связаться с поддержкой</a>
              <a href="/privacy" className={styles.helpLink}>Политика конфиденциальности</a>
              <a href="/terms" className={styles.helpLink}>Условия использования</a>
              <a href="/tutorial" className={styles.helpLink}>Как играть</a>
            </div>
          </div>
        </div>
        
        <div className={styles.saveButtonContainer}>
          <button className={styles.saveButton}>
            Сохранить настройки
          </button>
        </div>
      </div>
    </PageLayout>
  );
}; 