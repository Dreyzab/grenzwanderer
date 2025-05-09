import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type ThemeType = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Проверяем сохраненную тему или предпочтения системы
  const getSavedTheme = (): ThemeType => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Если нет сохраненной темы, используем системные предпочтения
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'dark'; // По умолчанию тёмная тема
  };
  
  const [theme, setTheme] = useState<ThemeType>('dark');
  
  // Эффект для инициализации темы при монтировании
  useEffect(() => {
    setTheme(getSavedTheme());
  }, []);
  
  // Эффект для применения темы при изменении
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 