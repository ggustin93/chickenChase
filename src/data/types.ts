// Game related types for Chicken Chase app

// Type pour le statut du jeu - aligned with database types
export type GameStatus = "lobby" | "in_progress" | "chicken_hidden" | "finished" | "cancelled";

export interface Game {
  id: string;
  name: string;
  status: GameStatus;
  startTime: string;
  endTime: string;
  maxTeams: number;
  chicken_hidden_at?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp?: string;
  accuracy?: number;
}

export interface Team {
  id: string;
  name: string;
  avatarUrl: string;
  score: number;
  members: TeamMember[];
  barsVisited: number;
  challengesCompleted: number;
  foundChicken: boolean;
  lastLocation?: Location; // Dernière position connue de l'équipe
  is_chicken_team: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  isLeader: boolean;
  avatarUrl?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  active: boolean;
  completed: boolean;
  teams: string[];
  pendingValidation?: boolean;
  type?: 'photo' | 'unlock';
  correctAnswer?: string;
}

export interface ChallengeCompletion {
  id: string;
  challengeId: string;
  teamId: string;
  timestamp: string;
  status: 'approved' | 'rejected' | 'pending';
  photoUrl?: string;
  textAnswer?: string;
}

export interface Message {
  id: string;
  gameId: string;
  userId: string;
  sender: string;
  content: string;
  timestamp: string;
  isClue: boolean;
  photoUrl?: string;
  isCagnotteEvent?: boolean;
  isBarRemoval?: boolean;
  amount?: number;
  barId?: string;
}

export interface Bar {
  id: string;
  name: string;
  address: string;
  description: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
}

export interface ChickenGameState {
  game: Game;
  teams: Team[];
  challenges: Challenge[];
  challengeCompletions: ChallengeCompletion[];
  messages: Message[];
  currentBar?: Bar | null;
  timeLeft: string;
  barOptions: Bar[];
  
  // Propriétés pour la phase de cachette
  isChickenHidden?: boolean; // Indique si le poulet est caché
  hidingTimeLeft?: string; // Temps restant pour se cacher

  // Hypothetical Cagnotte values added
  initialCagnotte: number;
  currentCagnotte: number;
} 