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
  
  const navigate = useNavigate();
  const login = useMutation(api.users.loginUser);

  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '');
  }, [email, password]);

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

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Вход</h1>
        {error && <div className="error-message">{error}</div>}
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
        <Link to="/register" className="register-link">
          Нет аккаунта? Зарегистрироваться
        </Link>
      </div>
    </div>
  );
};

export default LoginPage; 