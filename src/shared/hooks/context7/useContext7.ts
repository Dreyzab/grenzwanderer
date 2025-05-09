import { useState, useEffect, useCallback } from 'react';
import { 
  resolveLibraryId, 
  getLibraryDocs, 
  Context7Library,
  Context7Documentation,
  isContext7MockMode
} from '../../utils/context7';

/**
 * Состояния хука
 */
export type Context7Status = 'idle' | 'resolving' | 'loading' | 'success' | 'error';

/**
 * Параметры хука для Context7
 */
export interface UseContext7Options {
  /**
   * Название библиотеки/пакета для получения документации
   */
  packageName?: string;
  
  /**
   * Тема/раздел документации для фокусировки
   */
  topic?: string;
  
  /**
   * Максимальное количество токенов для получения
   */
  maxTokens?: number;
  
  /**
   * Автоматически загружать документацию при изменении параметров
   * @default true
   */
  autoLoad?: boolean;
  
  /**
   * Использовать заглушки вместо реальных вызовов
   * @default определяется из VITE_USE_CONTEXT7_MOCK
   */
  useMock?: boolean;
}

/**
 * Результат работы хука
 */
export interface UseContext7Result {
  /**
   * Текущее состояние загрузки
   */
  status: Context7Status;
  
  /**
   * Информация о библиотеке (если найдена)
   */
  library?: Context7Library;
  
  /**
   * Загруженная документация
   */
  documentation?: Context7Documentation;
  
  /**
   * Ошибка (если произошла)
   */
  error?: Error;
  
  /**
   * Флаг загрузки данных
   */
  isLoading: boolean;
  
  /**
   * Функция для загрузки документации
   * @param packageName Имя пакета (если отличается от указанного в опциях)
   * @param topic Тема (если отличается от указанной в опциях)
   */
  loadDocumentation: (packageName?: string, topic?: string) => Promise<void>;
}

/**
 * Хук для получения документации по библиотекам с использованием Context7
 * 
 * @param options Параметры для получения документации
 * @returns Состояние загрузки и данные
 */
export function useContext7(options: UseContext7Options = {}): UseContext7Result {
  const {
    packageName,
    topic,
    maxTokens = 10000,
    autoLoad = true,
    useMock = isContext7MockMode()
  } = options;
  
  const [status, setStatus] = useState<Context7Status>('idle');
  const [library, setLibrary] = useState<Context7Library | undefined>(undefined);
  const [documentation, setDocumentation] = useState<Context7Documentation | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  
  /**
   * Загружает документацию по указанному пакету и теме
   */
  const loadDocumentation = useCallback(async (
    packageNameOverride?: string,
    topicOverride?: string
  ) => {
    const packageToUse = packageNameOverride || packageName;
    const topicToUse = topicOverride || topic;
    
    if (!packageToUse) {
      setError(new Error('Не указано имя пакета'));
      return;
    }
    
    try {
      // Сначала разрешаем ID библиотеки
      setStatus('resolving');
      setError(undefined);
      
      const libraryInfo = await resolveLibraryId(packageToUse);
      setLibrary(libraryInfo);
      
      // Теперь загружаем документацию
      setStatus('loading');
      
      const docs = await getLibraryDocs(
        libraryInfo.id,
        topicToUse,
        maxTokens
      );
      
      setDocumentation(docs);
      setStatus('success');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setStatus('error');
    }
  }, [packageName, topic, maxTokens]);
  
  // При изменении параметров автоматически загружаем документацию
  useEffect(() => {
    if (autoLoad && packageName) {
      loadDocumentation();
    }
  }, [autoLoad, packageName, topic, maxTokens, loadDocumentation]);
  
  return {
    status,
    library,
    documentation,
    error,
    isLoading: status === 'resolving' || status === 'loading',
    loadDocumentation
  };
}

/**
 * Хук для получения информации о библиотеке без загрузки полной документации
 * 
 * @param packageName Имя пакета для получения информации
 * @returns Состояние загрузки и информация о библиотеке
 */
export function useLibraryInfo(packageName?: string): {
  library?: Context7Library;
  isLoading: boolean;
  error?: Error;
  resolveLibrary: (packageName?: string) => Promise<void>;
} {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [library, setLibrary] = useState<Context7Library | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  
  /**
   * Разрешает имя библиотеки в информацию о ней
   */
  const resolveLibrary = useCallback(async (packageNameOverride?: string) => {
    const packageToUse = packageNameOverride || packageName;
    
    if (!packageToUse) {
      setError(new Error('Не указано имя пакета'));
      return;
    }
    
    try {
      setStatus('loading');
      setError(undefined);
      
      const libraryInfo = await resolveLibraryId(packageToUse);
      setLibrary(libraryInfo);
      setStatus('success');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setStatus('error');
    }
  }, [packageName]);
  
  // При изменении имени пакета автоматически получаем информацию
  useEffect(() => {
    if (packageName) {
      resolveLibrary();
    }
  }, [packageName, resolveLibrary]);
  
  return {
    library,
    isLoading: status === 'loading',
    error,
    resolveLibrary
  };
} 