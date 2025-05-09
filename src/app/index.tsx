import { AppProviders } from './providers';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

// Импорт стилей
import '@/shared/ui/theme.css';
import './styles/global.css';

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};

export default App; 