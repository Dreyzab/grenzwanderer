import React, { ReactNode } from 'react';

export interface PageLayoutProps {
  header?: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

/**
 * Унифицированный компонент макета страницы
 * Использует Tailwind CSS для стилизации
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  header,
  content,
  footer,
  sidebar,
  className = '',
}) => {
  return (
    <div className={`flex flex-col min-h-screen bg-background ${className}`}>
      {/* Шапка страницы */}
      {header && (
        <header className="w-full py-4 bg-surface border-b border-surface-variant">
          <div className="container mx-auto px-4">
            {header}
          </div>
        </header>
      )}

      {/* Основной контент */}
      <main className="flex flex-1 w-full">
        {/* Боковая панель, если есть */}
        {sidebar && (
          <aside className="w-64 bg-surface border-r border-surface-variant hidden md:block">
            {sidebar}
          </aside>
        )}

        {/* Контент */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="container mx-auto">
            {content}
          </div>
        </div>
      </main>

      {/* Подвал, если есть */}
      {footer && (
        <footer className="w-full py-4 bg-surface border-t border-surface-variant">
          <div className="container mx-auto px-4">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}; 