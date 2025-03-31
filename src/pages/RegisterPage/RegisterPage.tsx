import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import './RegisterPage.css';
import { setUser } from "../../entities/user/model";

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  
  const navigate = useNavigate();
  const register = useMutation(api.users.registerUser);

  useEffect(() => {
    setIsFormValid(
      email.trim() !== '' && 
      password.trim() !== '' && 
      confirmPassword.trim() !== '' &&
      password === confirmPassword
    );
  }, [email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const response = await register({ email, password });
      setUser(response);
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при регистрации');
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1 className="register-title">Регистрация</h1>
        {error && <div className="error-message">{error}</div>}
        <form className="register-form" onSubmit={handleSubmit}>
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
          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className={`register-button ${isFormValid ? 'valid' : ''}`}
            disabled={!isFormValid}
          >
            Зарегистрироваться
          </button>
        </form>
        <Link to="/login" className="login-link">
          Уже есть аккаунт? Войти
        </Link>
      </div>
    </div>
  );
}; 