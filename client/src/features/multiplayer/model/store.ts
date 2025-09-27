import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  MultiplayerSession,
  MultiplayerParticipant,
  TradeOffer,
  SocialInteraction,
  PlayerProximity,
  MultiplayerStats,
  MultiplayerType
} from './types'
import { eventBus } from '../../../shared/lib/events/eventBus'

interface MultiplayerStore {
  // State
  activeSessions: MultiplayerSession[]
  userSessions: string[] // IDs сессий, в которых участвует пользователь
  nearbyPlayers: PlayerProximity[]
  tradeOffers: TradeOffer[]
  socialInteractions: SocialInteraction[]
  lastUpdate: number

  // Actions
  createSession: (session: Omit<MultiplayerSession, 'id' | 'participants' | 'createdAt' | 'updatedAt'>) => string
  joinSession: (sessionId: string, playerId: string, username: string) => boolean
  leaveSession: (sessionId: string, playerId: string) => void
  updateSession: (sessionId: string, updates: Partial<MultiplayerSession>) => void
  endSession: (sessionId: string) => void

  // Trade system
  createTradeOffer: (offer: Omit<TradeOffer, 'id' | 'createdAt'>) => string
  respondToTrade: (offerId: string, accept: boolean) => void
  cancelTrade: (offerId: string) => void

  // Social interactions
  sendMessage: (fromPlayerId: string, toPlayerId: string, content: string) => void
  markInteractionRead: (interactionId: string) => void
  deleteInteraction: (interactionId: string) => void

  // Proximity detection
  updateNearbyPlayers: (players: PlayerProximity[]) => void
  getNearbyPlayers: (maxDistance?: number) => PlayerProximity[]

  // Communication
  sendSessionMessage: (sessionId: string, playerId: string, message: string) => void
  broadcastToSession: (sessionId: string, event: string, data?: any) => void

  // Selectors
  getSessionById: (sessionId: string) => MultiplayerSession | undefined
  getUserActiveSessions: () => MultiplayerSession[]
  getSessionsByType: (type: MultiplayerType) => MultiplayerSession[]
  getAvailableSessions: () => MultiplayerSession[]
  getPendingTradeOffers: (playerId: string) => TradeOffer[]
  getUnreadInteractions: (playerId: string) => SocialInteraction[]
  getMultiplayerStats: () => MultiplayerStats
}

export const useMultiplayerStore = create<MultiplayerStore>()(
  persist(
    (set, get) => ({
      activeSessions: [],
      userSessions: [],
      nearbyPlayers: [],
      tradeOffers: [],
      socialInteractions: [],
      lastUpdate: 0,

      createSession: (sessionData) => {
        const sessionId = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const session: MultiplayerSession = {
          ...sessionData,
          id: sessionId,
          participants: [{
            playerId: sessionData.hostId,
            username: 'Host', // TODO: get actual username
            role: 'host',
            joinTime: Date.now(),
            lastActivity: Date.now(),
            status: 'active',
            contribution: 0,
          }],
          status: 'waiting',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((state) => ({
          activeSessions: [...state.activeSessions, session],
          userSessions: sessionData.hostId === 'current_user'
            ? [...state.userSessions, sessionId]
            : state.userSessions,
        }))

        // Публикуем событие создания сессии
        eventBus.publish({
          type: 'social:player_nearby',
          source: sessionData.hostId,
          data: { sessionId, sessionType: sessionData.type },
        } as any)

        return sessionId
      },

      joinSession: (sessionId, playerId, username) => {
        const { activeSessions } = get()
        const session = activeSessions.find(s => s.id === sessionId)

        if (!session || session.participants.length >= session.maxParticipants) {
          return false
        }

        // Проверяем, не участвует ли уже игрок
        const alreadyParticipating = session.participants.some(p => p.playerId === playerId)
        if (alreadyParticipating) {
          return false
        }

        const participant: MultiplayerParticipant = {
          playerId,
          username,
          role: 'participant',
          joinTime: Date.now(),
          lastActivity: Date.now(),
          status: 'active',
          contribution: 0,
        }

        set((state) => ({
          activeSessions: state.activeSessions.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  participants: [...s.participants, participant],
                  updatedAt: Date.now(),
                }
              : s
          ),
          userSessions: [...state.userSessions, sessionId],
        }))

        // Публикуем событие присоединения
        eventBus.publish({
          type: 'social:player_nearby',
          source: playerId,
          data: { sessionId, action: 'joined' },
        } as any)

        return true
      },

      leaveSession: (sessionId, playerId) => {
        const { activeSessions } = get()
        const session = activeSessions.find(s => s.id === sessionId)

        if (!session) return

        set((state) => ({
          activeSessions: state.activeSessions.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  participants: s.participants.filter(p => p.playerId !== playerId),
                  updatedAt: Date.now(),
                }
              : s
          ),
          userSessions: state.userSessions.filter(id => id !== sessionId),
        }))

        // Публикуем событие ухода
        eventBus.publish({
          type: 'social:player_nearby',
          source: playerId,
          data: { sessionId, action: 'left' },
        } as any)
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          activeSessions: state.activeSessions.map(session =>
            session.id === sessionId
              ? { ...session, ...updates, updatedAt: Date.now() }
              : session
          ),
        }))
      },

      endSession: (sessionId) => {
        set((state) => ({
          activeSessions: state.activeSessions.filter(s => s.id !== sessionId),
          userSessions: state.userSessions.filter(id => id !== sessionId),
        }))
      },

      createTradeOffer: (offerData) => {
        const offerId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const offer: TradeOffer = {
          ...offerData,
          id: offerId,
          createdAt: Date.now(),
        }

        set((state) => ({
          tradeOffers: [...state.tradeOffers, offer],
        }))

        // Публикуем событие торгового предложения
        eventBus.publish({
          type: 'social:trade_request',
          source: offerData.fromPlayerId,
          data: { offerId, targetPlayerId: offerData.toPlayerId },
        } as any)

        return offerId
      },

      respondToTrade: (offerId, accept) => {
        set((state) => ({
          tradeOffers: state.tradeOffers.map(offer =>
            offer.id === offerId
              ? {
                  ...offer,
                  status: accept ? 'accepted' : 'declined',
                }
              : offer
          ),
        }))

        const offer = get().tradeOffers.find(o => o.id === offerId)
        if (offer) {
          eventBus.publish({
            type: accept ? 'social:trade_accept' : 'social:trade_decline',
            source: offer.toPlayerId,
            data: { offerId },
          } as any)
        }
      },

      cancelTrade: (offerId) => {
        set((state) => ({
          tradeOffers: state.tradeOffers.map(offer =>
            offer.id === offerId
              ? { ...offer, status: 'cancelled' }
              : offer
          ),
        }))
      },

      sendMessage: (fromPlayerId, toPlayerId, content) => {
        const interaction: SocialInteraction = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'message',
          fromPlayerId,
          toPlayerId,
          content,
          timestamp: Date.now(),
          read: false,
        }

        set((state) => ({
          socialInteractions: [...state.socialInteractions, interaction],
        }))

        // Публикуем событие сообщения
        eventBus.publish({
          type: 'social:message',
          source: fromPlayerId,
          data: { interactionId: interaction.id, targetPlayerId: toPlayerId },
        } as any)
      },

      markInteractionRead: (interactionId) => {
        set((state) => ({
          socialInteractions: state.socialInteractions.map(interaction =>
            interaction.id === interactionId
              ? { ...interaction, read: true }
              : interaction
          ),
        }))
      },

      deleteInteraction: (interactionId) => {
        set((state) => ({
          socialInteractions: state.socialInteractions.filter(
            interaction => interaction.id !== interactionId
          ),
        }))
      },

      updateNearbyPlayers: (players) => {
        set({ nearbyPlayers: players, lastUpdate: Date.now() })
      },

      getNearbyPlayers: (maxDistance = 100) => {
        const { nearbyPlayers } = get()
        return nearbyPlayers.filter(player => player.distance <= maxDistance)
      },

      sendSessionMessage: (sessionId, playerId, message) => {
        // Здесь будет отправка сообщения в сессию
        console.log('Session message:', { sessionId, playerId, message })

        // Публикуем событие в сессии
        eventBus.publish({
          type: 'social:message',
          source: playerId,
          data: { sessionId, message },
        } as any)
      },

      broadcastToSession: (sessionId, event, data) => {
        // Здесь будет broadcast в сессию
        console.log('Broadcast to session:', { sessionId, event, data })

        eventBus.publish({
          type: 'social:message',
          source: 'system',
          data: { sessionId, event, data },
        } as any)
      },

      // Selectors
      getSessionById: (sessionId) => {
        const { activeSessions } = get()
        return activeSessions.find(s => s.id === sessionId)
      },

      getUserActiveSessions: () => {
        const { activeSessions, userSessions } = get()
        return activeSessions.filter(s => userSessions.includes(s.id))
      },

      getSessionsByType: (type) => {
        const { activeSessions } = get()
        return activeSessions.filter(s => s.type === type)
      },

      getAvailableSessions: () => {
        const { activeSessions } = get()
        return activeSessions.filter(s =>
          s.status === 'waiting' && s.participants.length < s.maxParticipants
        )
      },

      getPendingTradeOffers: (playerId) => {
        const { tradeOffers } = get()
        return tradeOffers.filter(offer =>
          (offer.toPlayerId === playerId || offer.fromPlayerId === playerId) &&
          offer.status === 'pending' &&
          offer.expiresAt > Date.now()
        )
      },

      getUnreadInteractions: (playerId) => {
        const { socialInteractions } = get()
        return socialInteractions.filter(interaction =>
          interaction.toPlayerId === playerId && !interaction.read
        )
      },

      getMultiplayerStats: () => {
        const { activeSessions, tradeOffers, socialInteractions } = get()

        return {
          totalSessions: activeSessions.length,
          activeSessions: activeSessions.filter(s => s.status === 'active').length,
          totalParticipants: activeSessions.reduce((sum, s) => sum + s.participants.length, 0),
          averageSessionDuration: 0, // TODO: calculate
          mostActivePlayers: [], // TODO: implement
          recentSessions: activeSessions.slice(0, 5),
        }
      },
    }),
    {
      name: 'grenzwanderer-multiplayer',
      partialize: (state) => ({
        userSessions: state.userSessions,
        socialInteractions: state.socialInteractions,
        nearbyPlayers: state.nearbyPlayers,
      }),
    }
  )
)
