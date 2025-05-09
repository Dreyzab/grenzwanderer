import { FC } from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import clsx from 'clsx';

interface NavLinkStyledProps extends Omit<NavLinkProps, 'className'> {
  variant?: 'main' | 'user';
  isActive?: boolean;
  className?: string;
}

export const NavLinkStyled: FC<NavLinkStyledProps> = ({ 
  variant = 'main', 
  isActive: forcedActive,
  className,
  ...props 
}) => {
  const isMain = variant === 'main';
  
  return (
    <NavLink
      {...props}
      className={({ isActive }) => {
        // Используем переданный isActive, если он определен
        const activeState = forcedActive !== undefined ? forcedActive : isActive;
        
        return clsx(
          // Базовые стили для всех вариантов
          'transition-all duration-300 relative overflow-hidden',
          {
            // Стили для основного варианта
            'text-base py-2': isMain,
            // Стили для пользовательского варианта
            'text-sm': !isMain,
            // Активное состояние
            'text-accent font-medium': activeState,
            // Подчеркивание для активного основного варианта
            'after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-100 after:transition-transform after:duration-300': activeState && isMain,
            // Неактивное состояние
            'text-text-secondary hover:text-text-primary': !activeState,
            // Анимация подчеркивания при наведении для неактивных элементов основного варианта
            'after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left': !activeState && isMain,
          },
          className
        );
      }}
    />
  );
}; 