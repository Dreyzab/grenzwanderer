export interface Shelter {
  _id: string;
  ownerId: string;
  name: string;
  level: number;
  resources: Record<string, number>;
  stations: ShelterStation[];
  storage: Record<string, number>;
  activeCrafts: CraftJob[];
}

export interface ShelterStation {
  type: string;
  level: number;
}

export interface CraftJob {
  recipeId: string;
  startTime: number;
  endTime: number;
  stationType: string;
  completed: boolean;
} 