export function getOrCreateDeviceId(): string {
  const key = 'qrboost_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(key, id)
  }
  return id
}


