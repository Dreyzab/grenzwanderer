/**
 * Service Worker для background геолокации и кеширования
 */

const CACHE_NAME = 'grenzwanderer-v1'
const LOCATION_CACHE = 'location-updates'

// Устанавливаем кеш при активации
self.addEventListener('install', (event) => {
  console.log('Service Worker installing')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json'
      ])
    })
  )
})

// Очищаем старый кеш при активации
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
  // Стратегия Network First для API запросов
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Кешируем успешные ответы
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback к кешу при отсутствии сети
          return caches.match(event.request)
        })
    )
  }
  // Стратегия Cache First для статических ресурсов
  else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      })
    )
  }
})

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)

  if (event.data.type === 'LOCATION_UPDATE') {
    handleLocationUpdate(event.data.payload)
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

/**
 * Обрабатывает обновления геолокации в фоне
 */
async function handleLocationUpdate(locationData) {
  console.log('Background location update:', locationData)

  try {
    // Сохраняем в IndexedDB для оффлайн обработки
    await saveLocationToIndexedDB(locationData)

    // Отправляем в основное приложение если оно активно
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_LOCATION_UPDATE',
        payload: locationData,
      })
    })

    // Планируем следующую отправку на сервер
    scheduleLocationSync(locationData)

  } catch (error) {
    console.error('Background location handling failed:', error)
  }
}

/**
 * Сохраняет геоданные в IndexedDB
 */
async function saveLocationToIndexedDB(locationData) {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction([LOCATION_CACHE], 'readwrite')
    const store = transaction.objectStore(LOCATION_CACHE)

    await store.add({
      ...locationData,
      synced: false,
      createdAt: Date.now(),
    })

  } catch (error) {
    console.error('Failed to save location to IndexedDB:', error)
  }
}

/**
 * Планирует синхронизацию с сервером
 */
function scheduleLocationSync(locationData) {
  // Отправляем на сервер каждые 5 минут или при накоплении 10 точек
  setTimeout(async () => {
    try {
      await syncLocationsWithServer()
    } catch (error) {
      console.error('Location sync failed:', error)
    }
  }, 300000) // 5 минут
}

/**
 * Синхронизирует накопленные локации с сервером
 */
async function syncLocationsWithServer() {
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction([LOCATION_CACHE], 'readonly')
    const store = transaction.objectStore(LOCATION_CACHE)

    const unsyncedLocations = await store.getAll()

    if (unsyncedLocations.length === 0) return

    const response = await fetch('/api/exploration/commit-trace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trace: unsyncedLocations.map(loc => ({
          lat: loc.lat,
          lng: loc.lng,
          timestamp: loc.timestamp,
        })),
      }),
    })

    if (response.ok) {
      // Помечаем как синхронизированные
      const updateTransaction = db.transaction([LOCATION_CACHE], 'readwrite')
      const updateStore = updateTransaction.objectStore(LOCATION_CACHE)

      for (const location of unsyncedLocations) {
        await updateStore.put({ ...location, synced: true })
      }
    }

  } catch (error) {
    console.error('Server sync failed:', error)
  }
}

/**
 * Открывает IndexedDB для хранения геоданных
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GrenzwandererDB', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains(LOCATION_CACHE)) {
        const store = db.createObjectStore(LOCATION_CACHE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('synced', 'synced', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Background Sync для оффлайн синхронизации
 */
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)

  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationsWithServer())
  }
})

// Регистрируем background sync при установке
self.addEventListener('install', (event) => {
  event.waitUntil(
    self.registration.sync.register('location-sync')
  )
})
