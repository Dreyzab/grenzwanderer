/**
 * Примеры использования расширенного логгера
 *
 * Этот файл содержит примеры всех доступных методов логгера
 * для быстрого копирования в ваш код
 */

import logger from './logger'

// === БАЗОВЫЕ МЕТОДЫ ===

// Обычное информационное сообщение
logger.info('Приложение запущено')

// Предупреждение
logger.warn('Что-то пошло не так, но продолжаем работать')

// Ошибка
logger.error('Критическая ошибка!')

// === ЛОГИРОВАНИЕ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ===

// Логирование обязательной переменной окружения
logger.env('DATABASE_URL', process.env.DATABASE_URL, true)

// Логирование необязательной переменной
logger.env('DEBUG_MODE', process.env.DEBUG_MODE, false)

// === ЛОГИРОВАНИЕ ОБЪЕКТОВ ===

// Логирование объекта пользователя
const user = { id: 1, name: 'Иван', email: 'ivan@example.com' }
logger.object('User Data', user)

// Логирование настроек приложения
const config = {
  theme: 'dark',
  language: 'ru',
  notifications: true,
  apiTimeout: 5000
}
logger.object('App Config', config)

// === ЛОГИРОВАНИЕ МАССИВОВ ===

// Логирование списка задач
const tasks = ['Создать логгер', 'Протестировать', 'Документировать']
logger.array('Active Tasks', tasks)

// Логирование результатов API
const apiResults = [
  { id: 1, status: 'success' },
  { id: 2, status: 'error' },
  { id: 3, status: 'pending' }
]
logger.array('API Results', apiResults)

// === ЛОГИРОВАНИЕ API ЗАПРОСОВ ===

// Логирование GET запроса
logger.api('GET', '/api/users')

// Логирование POST запроса с данными
logger.api('POST', '/api/users', { name: 'Иван', email: 'ivan@example.com' })

// === ЛОГИРОВАНИЕ СОСТОЯНИЯ ===

// Логирование состояния Redux/Zustand store
const storeState = {
  user: { id: 1, name: 'Иван' },
  loading: false,
  error: null
}
logger.state('User Store', storeState)

// === ЛОГИРОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ ===

// Замер времени выполнения операции
const startTime = Date.now()
// ... выполняем какую-то операцию
setTimeout(() => {
  logger.perf('Data processing', startTime)
}, 1000)

// === ИСПОЛЬЗОВАНИЕ В РЕАКТ КОМПОНЕНТАХ ===

// В функциональном компоненте
import { useLogger } from '@/shared/hooks'

function MyComponent() {
  const logger = useLogger('MyComponent')

  useEffect(() => {
    logger.info('Компонент смонтирован')

    // Логирование состояния компонента
    logger.state('Component State', {
      isLoading: true,
      data: null
    })

    // Логирование переменных окружения
    logger.env('API_URL', import.meta.env.VITE_API_URL, true)

  }, [logger])

  const handleClick = () => {
    logger.info('Кнопка нажата пользователем')
  }

  return <button onClick={handleClick}>Нажми меня</button>
}
