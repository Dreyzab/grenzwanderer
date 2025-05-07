import React from 'react';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../entities/user/model';
import './SignOutButton.css';

interface SignOutButtonProps {
  onSignOutSuccess?: () => void;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({ onSignOutSuccess }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // Очищаем состояние пользователя
    setUser(null);
    
    // Очищаем данные из localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    
    // Если предоставлен кастомный обработчик, вызываем его
    if (onSignOutSuccess) {
      onSignOutSuccess();
    } else {
      // Иначе используем дефолтное поведение
      navigate('/');
    }
  };

  return (
    <button className="sign-out-button" onClick={handleSignOut}>
      Выйти
    </button>
  );
}; 