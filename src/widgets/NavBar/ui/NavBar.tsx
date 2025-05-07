import { FC } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './NavBar.module.css';

export const NavBar: FC = () => {
  return (
    <nav className={styles.navBar}>
      <div className={styles.logoContainer}>
        <NavLink to="/" className={styles.logo}>
          Grenzwanderer
        </NavLink>
      </div>
      <div className={styles.navLinks}>
        <NavLink 
          to="/game" 
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Игра
        </NavLink>
        <NavLink 
          to="/quests" 
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Задания
        </NavLink>
        <NavLink 
          to="/inventory" 
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Инвентарь
        </NavLink>
        <NavLink 
          to="/character" 
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Персонаж
        </NavLink>
        <NavLink 
          to="/social" 
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Социальное
        </NavLink>
      </div>
      <div className={styles.userActions}>
        <NavLink 
          to="/profile" 
          className={({ isActive }) => 
            isActive ? `${styles.userLink} ${styles.active}` : styles.userLink
          }
        >
          Профиль
        </NavLink>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            isActive ? `${styles.userLink} ${styles.active}` : styles.userLink
          }
        >
          Настройки
        </NavLink>
      </div>
    </nav>
  );
}; 