// Game related types for Chicken Chase app

export interface Game {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'pending';
  maxTeams: number;
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
  currentBar?: Bar;
  timeLeft: string;
  barOptions: Bar[];
  
  // Propriétés pour la phase de cachette
  isChickenHidden?: boolean; // Indique si le poulet est caché
  hidingTimeLeft?: string; // Temps restant pour se cacher

  // Hypothetical Cagnotte values added
  initialCagnotte: number;
  currentCagnotte: number;
} 