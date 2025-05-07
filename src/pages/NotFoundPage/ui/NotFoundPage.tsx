import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Функция для возврата на предыдущую страницу
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <div className={styles.notFoundPage}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.title}>Страница не найдена</h1>
        <p className={styles.message}>
          Похоже, вы попали в аномальную зону. Возможно, QR-код был сканирован неправильно или страница была перемещена.
        </p>
        
        <div className={styles.gameIcon}>
          <span className={styles.iconChar}>🎮</span>
        </div>
        
        <div className={styles.buttonGroup}>
          <button 
            className={`${styles.button} ${styles.primaryButton}`} 
            onClick={handleGoBack}
          >
            Вернуться назад
          </button>
          <Link to="/" className={`${styles.button} ${styles.secondaryButton}`}>
            На главную страницу
          </Link>
          <Link to="/game" className={`${styles.button} ${styles.gameButton}`}>
            Вернуться в игру
          </Link>
        </div>
        
        <div className={styles.helpInfo}>
          <p>Если вы считаете, что произошла ошибка, пожалуйста, <a href="/support" className={styles.helpLink}>свяжитесь с поддержкой</a>.</p>
        </div>
      </div>
    </div>
  );
}; 