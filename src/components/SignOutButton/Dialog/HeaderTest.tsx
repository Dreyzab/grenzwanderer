import React from 'react';
import { Header } from './Header';

export const HeaderTest: React.FC = () => {
  const handleOpenDialog = () => {
    console.log('Opening dialog...');
  };
  
  const handleOpenInventory = () => {
    console.log('Opening inventory...');
  };
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Header Test</h1>
      
      <Header
        onOpenDialog={handleOpenDialog}
        onOpenInventory={handleOpenInventory}
      />
      
      <div style={{ marginTop: '2rem' }}>
        <p>
          Проверка компонента Header. Восклицательный знак должен 
          отображаться только при наличии непрочитанных сообщений.
        </p>
        <p>
          Для тестирования можно изменить состояние сообщений в localStorage.
        </p>
      </div>
    </div>
  );
}; 