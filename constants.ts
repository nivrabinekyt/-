
import { GameCategory, GameProfile } from './types';

export const GAMES: GameProfile[] = [
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    category: GameCategory.TAC_SHOOTER,
    defaultMultiplier: 1.0,
    description: 'דורש דיוק מקסימלי, החזקת זוויות ושימוש ב-Wrist/Arm movement משולב.'
  },
  {
    id: 'valorant',
    name: 'Valorant',
    category: GameCategory.TAC_SHOOTER,
    defaultMultiplier: 0.314, // Source to Valo factor (approx 1/3.18)
    description: 'דיוק קיצוני, משחק איטי יחסית עם חשיבות אדירה ל-Crosshair Placement.'
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    category: GameCategory.ARENA_TRACKING,
    defaultMultiplier: 1.0,
    description: 'דורש Tracking מהיר, תנועה ורסטילית ושימוש נרחב בכל משטח הפד.'
  },
  {
    id: 'marvel_rivals',
    name: 'Marvel Rivals',
    category: GameCategory.ARENA_TRACKING,
    defaultMultiplier: 3.333,
    description: 'Hero Shooter קצבי הדורש Tracking אינטנסיבי, התמודדות עם יכולות תנועה ושימוש בסיבובים מהירים.'
  },
  {
    id: 'ow2',
    name: 'Overwatch 2',
    category: GameCategory.ARENA_TRACKING,
    defaultMultiplier: 3.333,
    description: 'משחק מהיר מאוד, דורש סיבובים של 180-360 מעלות בתדירות גבוהה.'
  },
  {
    id: 'warzone',
    name: 'Call of Duty: Warzone',
    category: GameCategory.ARENA_TRACKING,
    defaultMultiplier: 3.333,
    description: 'שילוב של Tracking ותגובתיות מהירה במצבי Close Quarters.'
  }
];

// Base sens to start with (Source Engine equivalents)
export const STARTING_BASES: Record<GameCategory, number> = {
  [GameCategory.TAC_SHOOTER]: 1.2, // ~800 DPI * 1.2 = 960 eDPI
  [GameCategory.ARENA_TRACKING]: 2.5 // ~800 DPI * 2.5 = 2000 eDPI
};

export const CONVERSION_TABLE: Record<string, number> = {
  'source': 1.0,
  'valorant': 0.314,
  'overwatch': 3.333,
  'cod': 3.333,
  'marvel_rivals': 3.333,
  'quake': 1.0,
  'fortnite': 1.0 // Simple approximation
};
