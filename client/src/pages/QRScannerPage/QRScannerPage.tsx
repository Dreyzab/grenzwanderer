import { useState } from 'react'
import { motion } from 'framer-motion'
import { QRCamera } from '../../features/qr-scanning/ui/QRCamera'
import { AnimatedCard } from '../../shared/ui/components/AnimatedCard'
import { Button } from '../../shared/ui/components/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/components/Tabs'
import { Camera, QrCode, MapPin, Award, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function QRScannerPage() {
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'help'>('scan')
  const navigate = useNavigate()

  const handleScanSuccess = (result: any) => {
    // Добавляем результат в историю
    setScanHistory(prev => [result, ...prev.slice(0, 9)]) // Храним последние 10

    // Переключаемся на вкладку истории для показа результата
    setTimeout(() => setActiveTab('history'), 1000)
  }

  const handleScanError = (error: string) => {
    console.error('Scan error:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-700 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">QR Scanner</h1>
                <p className="text-zinc-400 text-sm">Исследуйте мир через QR-коды</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="scan">
              <Camera className="w-4 h-4 mr-2" />
              Сканирование
            </TabsTrigger>
            <TabsTrigger value="history">
              <QrCode className="w-4 h-4 mr-2" />
              История
            </TabsTrigger>
            <TabsTrigger value="help">
              <MapPin className="w-4 h-4 mr-2" />
              Помощь
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            <AnimatedCard className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                  Наведите камеру на QR-код
                </h2>
                <p className="text-zinc-400">
                  Расположите QR-код в рамке для сканирования
                </p>
              </div>

              <QRCamera
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                className="aspect-video max-w-2xl mx-auto"
              />

              <div className="mt-6 text-center text-sm text-zinc-500">
                Убедитесь, что QR-код хорошо освещен и находится в фокусе камеры
              </div>
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <AnimatedCard className="p-6">
              <h2 className="text-xl font-semibold text-zinc-100 mb-4">
                История сканирования
              </h2>

              {scanHistory.length === 0 ? (
                <div className="text-center text-zinc-400 py-8">
                  История сканирования пуста
                </div>
              ) : (
                <div className="space-y-4">
                  {scanHistory.map((scan, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-600"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-medium text-zinc-100">
                            {scan.pointKey || 'Неизвестная точка'}
                          </div>
                          <div className="text-sm text-zinc-400">
                            {new Date(scan.timestamp || Date.now()).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-emerald-400">
                          {scan.action === 'discover' ? 'Обнаружено' :
                           scan.action === 'research' ? 'Исследовано' : 'Разблокировано'}
                        </div>
                        {scan.rewards?.experience && (
                          <div className="text-xs text-zinc-500">
                            +{scan.rewards.experience} XP
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <AnimatedCard className="p-6">
              <h2 className="text-xl font-semibold text-zinc-100 mb-4">
                Как использовать QR Scanner
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    1. Разрешения камеры
                  </h3>
                  <p className="text-zinc-300">
                    Убедитесь, что приложение имеет доступ к камере устройства.
                    При первом запуске вам будет предложено разрешить доступ.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    2. Сканирование
                  </h3>
                  <p className="text-zinc-300">
                    Наведите камеру на QR-код так, чтобы он полностью поместился в рамку.
                    Система автоматически распознает код и обработает его.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    3. Результаты
                  </h3>
                  <p className="text-zinc-300">
                    После успешного сканирования вы получите уведомление о результате.
                    Точка будет отмечена как исследованная, и вы получите награды.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    4. Типы QR-кодов
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-zinc-300">Обнаружение - первая встреча с точкой</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-zinc-300">Исследование - детальное изучение</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-zinc-300">Разблокировка - доступ к скрытому контенту</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-600">
                  <h4 className="font-medium text-zinc-100 mb-2">Советы</h4>
                  <ul className="text-sm text-zinc-300 space-y-1">
                    <li>• Держите устройство неподвижно во время сканирования</li>
                    <li>• Обеспечьте хорошее освещение QR-кода</li>
                    <li>• Не используйте вспышку при ярком свете</li>
                    <li>• QR-коды можно сканировать с расстояния до 30 см</li>
                  </ul>
                </div>
              </div>
            </AnimatedCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
