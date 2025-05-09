import React, { useState } from 'react';
import { useContext7 } from '../hooks';

/**
 * Пропсы компонента для отображения документации библиотеки
 */
interface LibraryDocumentationProps {
  /**
   * Название библиотеки/пакета
   */
  packageName: string;
  
  /**
   * Тема/раздел для фокусировки (опционально)
   */
  topic?: string;
  
  /**
   * Обратный вызов при ошибке загрузки
   */
  onError?: (error: Error) => void;
  
  /**
   * Дополнительные классы для контейнера
   */
  className?: string;
}

/**
 * Компонент для отображения документации библиотеки с использованием Context7
 */
export const LibraryDocumentation: React.FC<LibraryDocumentationProps> = ({
  packageName,
  topic,
  onError,
  className = ''
}) => {
  const [currentTopic, setCurrentTopic] = useState<string | undefined>(topic);
  
  // Используем хук для загрузки документации
  const {
    status,
    library,
    documentation,
    error,
    isLoading,
    loadDocumentation
  } = useContext7({
    packageName,
    topic: currentTopic,
    autoLoad: true
  });
  
  // Обрабатываем ошибку загрузки
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);
  
  // Обработчик изменения темы
  const handleTopicChange = (newTopic: string) => {
    setCurrentTopic(newTopic === 'all' ? undefined : newTopic);
    loadDocumentation(packageName, newTopic === 'all' ? undefined : newTopic);
  };
  
  // Отображаем состояние загрузки
  if (isLoading) {
    return (
      <div className={`library-documentation-loading ${className}`}>
        <div className="p-4 animate-pulse">
          <div className="h-5 bg-surface-variant rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-surface-variant rounded w-full mb-2"></div>
          <div className="h-4 bg-surface-variant rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-surface-variant rounded w-4/6 mb-4"></div>
          <div className="h-10 bg-surface-variant rounded w-full mb-4"></div>
        </div>
      </div>
    );
  }
  
  // Отображаем ошибку
  if (status === 'error') {
    return (
      <div className={`library-documentation-error ${className}`}>
        <div className="p-4 bg-error-container text-on-error-container rounded">
          <h3 className="text-lg font-medium mb-2">Ошибка загрузки документации</h3>
          <p className="mb-3">{error?.message}</p>
          <button
            className="px-3 py-1 bg-primary text-on-primary rounded"
            onClick={() => loadDocumentation()}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }
  
  // Отображаем документацию
  return (
    <div className={`library-documentation ${className}`}>
      {library && (
        <div className="library-info mb-4">
          <h2 className="text-xl font-heading mb-1">{library.name}</h2>
          <p className="text-text-secondary mb-3">{library.description}</p>
          
          {/* Метрики библиотеки */}
          <div className="flex gap-4 text-sm text-text-secondary mb-3">
            {library.githubStars && (
              <div>⭐ {library.githubStars.toLocaleString()} звезд на GitHub</div>
            )}
            {library.codeSnippetCount && (
              <div>📝 {library.codeSnippetCount.toLocaleString()} примеров кода</div>
            )}
          </div>
          
          {/* Выбор темы/раздела */}
          <div className="topic-selector mb-4">
            <label className="block text-sm font-medium mb-1">Тема:</label>
            <select
              value={currentTopic || 'all'}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="px-2 py-1 rounded border border-surface"
            >
              <option value="all">Всё</option>
              <option value="installation">Установка</option>
              <option value="getting-started">Начало работы</option>
              <option value="api">API</option>
              <option value="examples">Примеры</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Содержимое документации */}
      {documentation && (
        <div className="documentation-content p-4 bg-surface-variant rounded">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {documentation.content}
          </pre>
          
          {documentation.source && (
            <div className="mt-4 text-sm text-text-secondary">
              Источник: <a href={documentation.source} target="_blank" rel="noopener noreferrer" className="text-primary">{documentation.source}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryDocumentation; 