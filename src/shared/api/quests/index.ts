// Минимальный API для bootstrap игрока
export const questsApi = {
  async bootstrapNewPlayer(): Promise<void> {
    try {
      // Если естьConvex код, можно вызвать мутацию bootstrap; иначе — no-op
      // await convexClient.mutation('player:bootstrap', {})
      return
    } catch (err) {
      throw err
    }
  }
}

export default questsApi


