import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../entities/user/model';
import { SignOutButton } from '../../components/SignOutButton/SignOutButton';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import './MainPage.css';

export const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUnit($currentUser);


  return (
    <div className="start-screen">
      <div className="overlay">
        <h1 className="title">Grenzwanderer</h1>
        <div className="content-layout">
          <div className="panel left-panel">
            <h2>Что вас ждёт</h2>
            <ul>
              <li>Захватывающие приключения</li>
              <li>Уникальные локации</li>
              <li>Интересные персонажи</li>
              <li>Сложные решения</li>
            </ul>
          </div>

          <div className="panel center-panel">
            {!user ? (
              <div className="auth-buttons">
                <button onClick={() => navigate('/login')} className="auth-button">
                  Войти
                </button>
                <button onClick={() => navigate('/register')} className="auth-button">
                  Регистрация
                </button>
              </div>
            ) : (
              <div className="game-options">
                <button onClick={() => navigate('/game')} className="game-button">
                  Начать игру
                </button>
                <button onClick={() => navigate('/profile')} className="game-button">
                  Профиль
                </button>
                <div className="sign-out-container">
                  <SignOutButton />
                </div>

              
              </div>
            )}
          </div>

          <div className="panel right-panel">
            <h2>Что нового</h2>
            <ul>
              <li>Новая глава "Тёмный лес"</li>
              <li>Улучшенная графика</li>
              <li>Новые предметы</li>
              <li>Исправление ошибок</li>
            </ul>
          </div>
        </div>

        <div className="version-container">
          <span className="version">Версия 0.1.0</span>
          <div className="progress-bar">
            <div className="progress" style={{ width: '60%' }}></div>
          </div>
          <span className="progress-text">Прогресс разработки: 60%</span>
        </div>
      </div>
    </div>
  );
};