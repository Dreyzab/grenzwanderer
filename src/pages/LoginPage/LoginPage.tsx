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
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useMutation(api.users.loginUser);
  const resetPassword = useMutation(api.users.resetPassword);

  // Проверка наличия сохраненного пользователя при загрузке
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          // Если пользователь уже сохранен, устанавливаем его в состояние
          setUser(parsedUser);
          // И перенаправляем на главную страницу
          navigate('/');
        } catch (e) {
          // Если JSON невалиден, удаляем сохраненные данные
          localStorage.removeItem('currentUser');
          localStorage.removeItem('userId');
        }
      }
    };
    
    checkLoggedInUser();
  }, [navigate]);

  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '');
  }, [email, password]);

  useEffect(() => {
    setIsResetFormValid(resetEmail.trim() !== '');
  }, [resetEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setError('');
    
    try {
      console.log(`Attempting to login with email: ${email}`);
      const response = await login({ email, password });
      console.log('Login successful:', response);
      
      if (!response || !response.id) {
        throw new Error('Некорректный ответ от сервера');
      }
      
      // Сохраняем пользователя в глобальное состояние
      setUser(response);
      // И в localStorage для сохранения между сессиями
      localStorage.setItem('currentUser', JSON.stringify(response));
      localStorage.setItem('userId', response.id);
      
      // Переходим на главную страницу
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isResetFormValid || isLoading) return;

    setIsLoading(true);
    setError('');
    
    try {
      await resetPassword({ email: resetEmail });
      setResetSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при сбросе пароля');
      setResetSuccess(false);
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit" 
              className={`login-button ${isResetFormValid ? 'valid' : ''}`}
              disabled={!isResetFormValid || isLoading}
            >
              {isLoading ? 'Отправка...' : 'Отправить инструкции'}
            </button>
            <button 
              type="button"
              className="back-button"
              onClick={toggleResetMode}
              disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              <button 
                type="submit" 
                className={`login-button ${isFormValid ? 'valid' : ''}`}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </form>
            <div className="auth-links">
              <Link to="/register" className="register-link">
                Нет аккаунта? Зарегистрироваться
              </Link>
              <button 
                className="forgot-password-link" 
                onClick={toggleResetMode}
                disabled={isLoading}
              >
                Забыли пароль?
              </button>
            </div>
          </>
        )}
        
        <div className="back-home-link">
          <Link to="/">На главную</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 