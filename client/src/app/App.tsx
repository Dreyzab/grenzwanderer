import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider } from './providers/ConvexProvider'
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { ErrorBoundary } from './providers/ErrorBoundary'
import { AppRouter } from './router/AppRouter'
import { MainLayout } from './layouts/MainLayout'

function App() {
  return (
    <ErrorBoundary>
      <ConvexProvider>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter>
              <MainLayout>
                <AppRouter />
              </MainLayout>
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </ConvexProvider>
    </ErrorBoundary>
  )
}

export default App
