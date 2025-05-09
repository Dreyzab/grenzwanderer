import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'outline'
  | 'ghost'
  | 'neon';

export type ButtonSize = 
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Вариант стиля кнопки
   */
  variant?: ButtonVariant;
  
  /**
   * Размер кнопки
   */
  size?: ButtonSize;
  
  /**
   * Полная ширина (растягивается на 100% ширины контейнера)
   */
  fullWidth?: boolean;
  
  /**
   * Иконка перед текстом
   */
  startIcon?: React.ReactNode;
  
  /**
   * Иконка после текста
   */
  endIcon?: React.ReactNode;
  
  /**
   * Состояние загрузки
   */
  loading?: boolean;
  
  /**
   * Содержимое кнопки
   */
  children?: React.ReactNode;
}

/**
 * Компонент кнопки с различными вариантами и размерами
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  startIcon,
  endIcon,
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) => {
  // Базовые классы для всех вариантов кнопок
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50';
  
  // Классы для различных вариантов
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark text-white focus:ring-primary',
    secondary: 'bg-secondary hover:bg-secondary-dark text-white focus:ring-secondary',
    accent: 'bg-accent hover:bg-accent-dark text-white focus:ring-accent',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
    ghost: 'bg-transparent hover:bg-primary-dark hover:bg-opacity-10 text-primary focus:ring-primary',
    neon: 'bg-primary bg-opacity-20 text-primary-light border border-primary shadow-neon-primary hover:bg-opacity-30 focus:ring-primary-light'
  };
  
  // Классы для различных размеров
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg',
    xl: 'px-6 py-3 text-xl'
  };
  
  // Классы для состояний
  const stateClasses = {
    disabled: 'opacity-50 cursor-not-allowed',
    loading: 'relative text-transparent transition-none hover:text-transparent',
    fullWidth: 'w-full'
  };
  
  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && stateClasses.fullWidth,
        (disabled || loading) && stateClasses.disabled,
        loading && stateClasses.loading,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

export default Button; 