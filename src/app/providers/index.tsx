import { ThemeProvider, useTheme } from './ThemeProvider';
import { UIProvider, useUI } from './UIProvider';
import { ReactNode } from 'react';

// Композитный провайдер для объединения всех провайдеров
interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ThemeProvider>
      <UIProvider>
        {children}
      </UIProvider>
    </ThemeProvider>
  );
};

export {
  ThemeProvider,
  useTheme,
  UIProvider,
  useUI
}; 