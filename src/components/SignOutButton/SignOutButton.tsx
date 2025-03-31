import React from 'react';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../entities/user/model';
import './SignOutButton.css';

export const SignOutButton: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <button className="sign-out-button" onClick={handleSignOut}>
      Выйти
    </button>
  );
};