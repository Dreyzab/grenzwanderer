import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Кэширование на 5 минут для игровых данных
            staleTime: 5 * 60 * 1000,
            // Данные считаются свежими 1 минуту
            gcTime: 10 * 60 * 1000,
            // Retry стратегия для нестабильного соединения
            retry: (failureCount, error) => {
              if (failureCount < 3) return true
              return false
            },
            // Рефетч только при фокусе окна (важно для PWA)
            refetchOnWindowFocus: 'always',
            refetchOnReconnect: 'always',
          },
          mutations: {
            // Retry мутации максимум 2 раза
            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools только в development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}
