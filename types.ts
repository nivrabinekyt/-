
export enum GameCategory {
  TAC_SHOOTER = 'Tac-Shooter',
  ARENA_TRACKING = 'Arena/Tracking'
}

export interface GameProfile {
  id: string;
  name: string;
  category: GameCategory;
  defaultMultiplier: number; // Based on Source Engine (CS/Apex)
  description: string;
}

export interface PSASession {
  iteration: number;
  base: number;
  lower: number;
  upper: number;
  history: Array<{
    iteration: number;
    chosen: 'lower' | 'upper';
    value: number;
  }>;
}

export interface UserSettings {
  dpi: number;
  gameId: string;
  currentSens?: number;
}
