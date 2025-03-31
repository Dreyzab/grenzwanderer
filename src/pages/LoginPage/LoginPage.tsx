import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import './LoginPage.css';
import { setUser } from "../../entities/user/model";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetFormValid, setIsResetFormValid] = useState(false);
  
  const navigate = useNavigate();
  const login = useMutation(api.users.loginUser);
  const resetPassword = useMutation(api.users.resetPassword);

  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '');
  }, [email, password]);

  useEffect(() => {
    setIsResetFormValid(resetEmail.trim() !== '');
  }, [resetEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const response = await login({ email, password });
      setUser(response);
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при входе');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isResetFormValid) return;

    try {
      await resetPassword({ email: resetEmail });
      setResetSuccess(true);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при сбросе пароля');
      setResetSuccess(false);
    }
  };

  const toggleResetMode = () => {
    setIsResetMode(!isResetMode);
    setError('');
    setResetSuccess(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">{isResetMode ? 'Сброс пароля' : 'Вход'}</h1>
        {error && <div className="error-message">{error}</div>}
        {resetSuccess && <div className="success-message">
          Инструкции по сбросу пароля отправлены на вашу почту!
        </div>}
        
        {isResetMode ? (
          <form className="login-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="resetEmail">Email</label>
              <input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className={`login-button ${isResetFormValid ? 'valid' : ''}`}
              disabled={!isResetFormValid}
            >
              Отправить инструкции
            </button>
            <button 
              type="button"
              className="back-button"
              onClick={toggleResetMode}
            >
              Вернуться ко входу
            </button>
          </form>
        ) : (
          <>
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className={`login-button ${isFormValid ? 'valid' : ''}`}
                disabled={!isFormValid}
              >
                Войти
              </button>
            </form>
            <div className="auth-links">
              <Link to="/register" className="register-link">
                Нет аккаунта? Зарегистрироваться
              </Link>
              <button 
                className="forgot-password-link" 
                onClick={toggleResetMode}
              >
                Забыли пароль?
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 