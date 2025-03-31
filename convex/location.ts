import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to calculate distance between two points in meters
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

// Get nearby map points
export const getNearbyPoints = query({
  args: { 
    lat: v.number(),
    lng: v.number(),
    radius: v.optional(v.number()),
    playerId: v.optional(v.id("players"))
  },
  handler: async (ctx, { lat, lng, radius = 1000, playerId }) => {
    // Get all map points
    const allPoints = await ctx.db.query("mapPoints").collect();
    
    // Filter by distance
    const nearbyPoints = allPoints.filter(point => {
      const distance = calculateDistance(
        lat, 
        lng, 
        point.coordinates.lat, 
        point.coordinates.lng
      );
      
      return distance <= radius && point.isActive;
    });
    
    // If playerId is provided, filter by quest state
    if (playerId) {
      const player = await ctx.db.get(playerId);
      if (player) {
        return nearbyPoints.filter(point => {
          // If no required quest state, always show
          if (!point.requiredQuestState) {
            return true;
          }
          
          // Show only if player's quest state matches required state
          return point.requiredQuestState === player.questState;
        });
      }
    }
    
    return nearbyPoints;
  },
});

// Check if player is in training zone
export const checkTrainingZone = mutation({
  args: { 
    playerId: v.id("players"),
    lat: v.number(),
    lng: v.number()
  },
  handler: async (ctx, { playerId, lat, lng }) => {
    const player = await ctx.db.get(playerId);
    if (!player) {
      throw new Error("Игрок не найден");
    }
    
    // Make sure player is in training mission state
    if (player.questState !== "training_mission") {
      return {
        inZone: false,
        message: "Вы не находитесь в тренировочной миссии"
      };
    }
    
    // Find training zone point
    const trainingPoint = await ctx.db
      .query("mapPoints")
      .filter(q => q.eq(q.field("title"), "Тренировочная зона"))
      .first();
    
    if (!trainingPoint) {
      return {
        inZone: false,
        message: "Тренировочная зона не найдена"
      };
    }
    
    // Calculate distance
    const distance = calculateDistance(
      lat,
      lng,
      trainingPoint.coordinates.lat,
      trainingPoint.coordinates.lng
    );
    
    // Check if player is in zone
    if (distance <= trainingPoint.radius) {
      // Update player state
      await ctx.db.patch(playerId, {
        questState: "training_completed"
      });
      
      return {
        inZone: true,
        message: "Вы достигли тренировочной зоны! Миссия выполнена."
      };
    }
    
    return {
      inZone: false,
      distance: Math.round(distance),
      message: `Вы находитесь в ${Math.round(distance)} метрах от тренировочной зоны. Продолжайте движение.`
    };
  },
});