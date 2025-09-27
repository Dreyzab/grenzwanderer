import { Component, ReactNode } from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'

interface Props {
  children: ReactNode
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-800 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-red-400 mb-4">Что-то пошло не так</h2>
        <p className="text-zinc-300 mb-4">
          Произошла неожиданная ошибка. Пожалуйста, перезагрузите страницу.
        </p>
        <details className="text-left mb-4">
          <summary className="text-zinc-400 cursor-pointer hover:text-zinc-300">
            Подробности ошибки
          </summary>
          <pre className="mt-2 text-xs text-red-300 bg-zinc-900 p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  )
}

export function ErrorBoundary({ children }: Props) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  )
}
